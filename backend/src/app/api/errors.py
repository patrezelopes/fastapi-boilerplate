"""Tradução de erro de domínio para o envelope RFC 9457.

Um único tradutor registrado na aplicação. Rotas não montam resposta de erro à
mão — ver `.claude/rules/errors.md`.
"""

import logging
import uuid
from collections.abc import Sequence
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.routing import Match

from app.entities.errors import (
    DomainError,
    EmailAlreadyTaken,
    InvalidAccessToken,
    InvalidCredentials,
    InvalidRefreshToken,
    UserNotFound,
)
from app.schemas.problem import Problem, ValidationProblem

PROBLEM_BASE_URI = "https://lopestech.dev/errors"
PROBLEM_CONTENT_TYPE = "application/problem+json"

_logger = logging.getLogger(__name__)

# Erro de domínio → (status, slug do type, title, detail voltado ao usuário)
_DOMAIN_MAPPING: list[tuple[type[DomainError], int, str, str, str]] = [
    (
        UserNotFound,
        status.HTTP_404_NOT_FOUND,
        "not-found",
        "Not Found",
        "Usuário não encontrado.",
    ),
    (
        EmailAlreadyTaken,
        status.HTTP_409_CONFLICT,
        "conflict",
        "Conflict",
        "Já existe uma conta com este e-mail.",
    ),
    (
        InvalidCredentials,
        status.HTTP_401_UNAUTHORIZED,
        "unauthorized",
        "Unauthorized",
        "Credenciais inválidas.",
    ),
    (
        InvalidRefreshToken,
        status.HTTP_401_UNAUTHORIZED,
        "unauthorized",
        "Unauthorized",
        "Sessão expirada. Entre novamente.",
    ),
    (
        InvalidAccessToken,
        status.HTTP_401_UNAUTHORIZED,
        "unauthorized",
        "Unauthorized",
        "Credenciais inválidas ou expiradas.",
    ),
]


def problem_response(
    *,
    status_code: int,
    slug: str,
    title: str,
    detail: str,
    errors: list[dict[str, str]] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    body: dict[str, object] = {
        "type": f"{PROBLEM_BASE_URI}/{slug}",
        "title": title,
        "status": status_code,
        "detail": detail,
    }
    if errors is not None:
        body["errors"] = errors

    return JSONResponse(
        status_code=status_code,
        content=body,
        media_type=PROBLEM_CONTENT_TYPE,
        headers=headers,
    )


# Erros levantados pelo próprio framework — rota inexistente, método errado,
# corpo ilegível. Sem este tratamento eles escapariam do envelope RFC 9457.
_HTTP_STATUS_PROBLEMS: dict[int, tuple[str, str, str]] = {
    400: ("bad-request", "Bad Request", "A requisição não pôde ser lida."),
    401: ("unauthorized", "Unauthorized", "Credenciais inválidas ou expiradas."),
    403: ("forbidden", "Forbidden", "Sem permissão para este recurso."),
    404: ("not-found", "Not Found", "Recurso não encontrado."),
    405: ("method-not-allowed", "Method Not Allowed", "Método não suportado nesta rota."),
    415: ("unsupported-media-type", "Unsupported Media Type", "Tipo de conteúdo não suportado."),
}


def _allowed_methods(request: Request) -> list[str]:
    """Todos os métodos aceitos neste caminho.

    O 405 do Starlette reporta apenas a primeira rota que casou o caminho; num
    caminho registrado por vários decoradores — como `/users/{id}` — isso deixa
    o header `Allow` incompleto, contrariando a RFC 9110.
    """
    methods: set[str] = set()

    for route in request.app.routes:
        match, _ = route.matches(request.scope)
        if match is not Match.NONE and getattr(route, "methods", None):
            methods |= set(route.methods)

    return sorted(methods)


async def handle_http_exception(request: Request, exc: Exception) -> JSONResponse:
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)

    if status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
        return await handle_unexpected_error(request, exc)

    slug, title, detail = _HTTP_STATUS_PROBLEMS.get(
        status_code, ("about:blank", "Error", "A requisição não pôde ser atendida.")
    )
    headers = dict(getattr(exc, "headers", None) or {})

    if status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
        allowed = _allowed_methods(request)
        if allowed:
            headers["Allow"] = ", ".join(allowed)

    return problem_response(
        status_code=status_code, slug=slug, title=title, detail=detail, headers=headers
    )


async def handle_domain_error(_: Request, exc: Exception) -> JSONResponse:
    for domain_type, status_code, slug, title, detail in _DOMAIN_MAPPING:
        if isinstance(exc, domain_type):
            return problem_response(status_code=status_code, slug=slug, title=title, detail=detail)

    return await handle_unexpected_error(_, exc)


async def handle_validation_error(_: Request, exc: Exception) -> JSONResponse:
    raw_errors = exc.errors() if isinstance(exc, RequestValidationError) else []

    # Corpo ilegível ou ausente é 400, não 422: não há schema a violar, e
    # portanto não há campo a nomear no `errors[]`. O Pydantic reporta os dois
    # casos com o tipo `json_invalid` ou `missing` na raiz do corpo.
    if _is_unreadable_body(raw_errors):
        return problem_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            slug="bad-request",
            title="Bad Request",
            detail="A requisição não pôde ser lida.",
        )

    return problem_response(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        slug="validation",
        title="Validation failed",
        detail="O corpo da requisição contém campos inválidos.",
        errors=[
            {"field": _field_name(error.get("loc", ())), "message": str(error.get("msg", ""))}
            for error in raw_errors
        ],
    )


def _is_unreadable_body(raw_errors: Sequence[Any]) -> bool:
    """Verdadeiro quando o corpo inteiro é o problema, e não um campo dele.

    O Pydantic reporta `json_invalid` com a posição do byte que quebrou o
    parser — `('body', 12)` —, e um corpo ausente como `missing` na raiz. Um
    campo faltando dentro de um corpo legível é `missing` em `('body', 'email')`,
    e esse continua sendo 422.
    """
    if not raw_errors:
        return False

    def e_do_corpo_inteiro(error: Any) -> bool:
        tipo = error.get("type")

        if tipo == "json_invalid":
            return True

        return tipo == "missing" and tuple(error.get("loc") or ()) == ("body",)

    return all(e_do_corpo_inteiro(error) for error in raw_errors)


async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    """Nada do diagnóstico vai para o cliente — só a referência do log."""
    reference = uuid.uuid4().hex[:8]
    _logger.exception("erro inesperado [ref=%s]", reference, exc_info=exc)

    return problem_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        slug="internal",
        title="Internal Server Error",
        detail=f"Erro inesperado. Referência: {reference}.",
    )


def _field_name(location: object) -> str:
    """Descarta o prefixo 'body'/'query' e junta o resto por ponto."""
    if not isinstance(location, list | tuple):
        return "body"

    parts = [str(part) for part in location if part not in {"body", "query", "path"}]
    return ".".join(parts) if parts else "body"


def register_error_handlers(app: FastAPI) -> None:
    # O import é local para não criar ciclo: `query` importa `problem_response`
    # daqui.
    from app.api.query import UnknownQueryParams, unknown_query_params_handler

    app.add_exception_handler(UnknownQueryParams, unknown_query_params_handler)
    app.add_exception_handler(DomainError, handle_domain_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    app.add_exception_handler(Exception, handle_unexpected_error)


# ─────────────────────────────────────────────────────────────────────────────
#  Respostas de erro declaradas no OpenAPI gerado, para que ele descreva os
#  mesmos códigos e o mesmo envelope que `contract/openapi.yaml`.
# ─────────────────────────────────────────────────────────────────────────────

_PROBLEM_MEDIA = {PROBLEM_CONTENT_TYPE: {"schema": Problem.model_json_schema()}}
_VALIDATION_MEDIA = {PROBLEM_CONTENT_TYPE: {"schema": ValidationProblem.model_json_schema()}}

UNAUTHORIZED: dict[int | str, dict[str, object]] = {
    401: {"description": "Credenciais ausentes, inválidas ou expiradas.", "content": _PROBLEM_MEDIA}
}
NOT_FOUND: dict[int | str, dict[str, object]] = {
    404: {"description": "O recurso não existe.", "content": _PROBLEM_MEDIA}
}
CONFLICT: dict[int | str, dict[str, object]] = {
    409: {"description": "Violação de uma regra de unicidade.", "content": _PROBLEM_MEDIA}
}
UNPROCESSABLE: dict[int | str, dict[str, object]] = {
    422: {"description": "Entrada inválida.", "content": _VALIDATION_MEDIA}
}
