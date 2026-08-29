"""Rejeição de parâmetro de consulta que o contrato não declara.

O padrão do FastAPI é ignorar o que não foi declarado. Isso é a convenção mais
comum e é justamente o que faz um ``?perPage=5`` devolver vinte itens sem que
ninguém perceba o erro de digitação. O contrato desta família fecha a lista.
"""

from collections.abc import Callable, Iterable

from fastapi import Request

from app.api.errors import problem_response


def only_declared(*allowed: str) -> Callable[[Request], None]:
    """Devolve uma dependência que recusa parâmetro fora da lista."""

    permitidos = frozenset(allowed)

    def check(request: Request) -> None:
        desconhecidos = sorted(set(request.query_params) - permitidos)
        if desconhecidos:
            raise UnknownQueryParams(desconhecidos)

    return check


class UnknownQueryParams(Exception):
    """Levantada quando a requisição traz parâmetro não declarado."""

    def __init__(self, names: Iterable[str]) -> None:
        self.names = list(names)
        super().__init__(", ".join(self.names))


def unknown_query_params_handler(_: Request, exc: Exception):
    names = exc.names if isinstance(exc, UnknownQueryParams) else []

    return problem_response(
        status_code=422,
        slug="validation",
        title="Validation failed",
        detail="Parâmetros de consulta inválidos.",
        errors=[{"field": name, "message": "parâmetro desconhecido"} for name in names],
    )
