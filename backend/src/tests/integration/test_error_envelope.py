"""O envelope RFC 9457 — ver `.claude/rules/errors.md`."""

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from app.config.container import Container
from app.entities.errors import DomainError
from app.main import create_app
from app.use_cases.ports.health_repository import HealthRepository


class ExplodingHealthRepository(HealthRepository):
    def is_alive(self) -> bool:
        raise RuntimeError("segredo=abc123 no traceback; SELECT * FROM users")

    def is_ready(self) -> bool:
        return True


class UnmappedDomainError(DomainError):
    """Erro de domínio sem entrada no mapeamento — cai no tratamento genérico."""


class UnmappedHealthRepository(HealthRepository):
    def is_alive(self) -> bool:
        raise UnmappedDomainError

    def is_ready(self) -> bool:
        return True


def _client_com(repo: HealthRepository, container: Container) -> TestClient:
    container.health_repo.override(providers.Object(repo))
    return TestClient(create_app(container), raise_server_exceptions=False)


@pytest.mark.integration
def test_erro_inesperado_vira_500_sem_vazar_diagnostico(container: Container) -> None:
    response = _client_com(ExplodingHealthRepository(), container).get("/api/v1/health")

    assert response.status_code == 500
    corpo = response.json()
    assert corpo["type"].endswith("/internal")
    assert corpo["title"] == "Internal Server Error"
    assert "segredo=abc123" not in response.text
    assert "SELECT" not in response.text
    assert "Traceback" not in response.text


@pytest.mark.integration
def test_o_500_traz_uma_referencia_para_o_log(container: Container) -> None:
    response = _client_com(ExplodingHealthRepository(), container).get("/api/v1/health")

    assert "Referência:" in response.json()["detail"]


@pytest.mark.integration
def test_erro_de_dominio_sem_mapeamento_vira_500(container: Container) -> None:
    """Um erro novo não pode virar 200 nem stack trace — cai em 500 controlado."""
    response = _client_com(UnmappedHealthRepository(), container).get("/api/v1/health")

    assert response.status_code == 500
    assert response.json()["type"].endswith("/internal")


@pytest.mark.integration
def test_todo_erro_usa_o_content_type_de_problem(client: TestClient) -> None:
    respostas = [
        client.get("/api/v1/auth/me"),
        client.get("/api/v1/users/não-é-uuid", headers={"Authorization": "Bearer x"}),
        client.post("/api/v1/auth/register", json={"email": "x", "name": "", "password": "z"}),
    ]

    for response in respostas:
        assert response.headers["content-type"].startswith("application/problem+json")
        assert {"type", "title", "status"} <= set(response.json())


@pytest.mark.integration
def test_o_status_do_corpo_bate_com_o_status_http(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")

    assert response.json()["status"] == response.status_code


@pytest.mark.integration
def test_metodo_nao_suportado_usa_o_envelope(client: TestClient) -> None:
    response = client.request("PUT", "/api/v1/health")

    assert response.status_code == 405
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["type"].endswith("/method-not-allowed")


@pytest.mark.integration
def test_o_header_allow_lista_todos_os_metodos_do_caminho(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    """O 405 do Starlette reportaria só o primeiro; a RFC 9110 exige todos."""
    response = client.request(
        "PUT", "/api/v1/users/11111111-1111-1111-1111-111111111111", headers=auth_headers
    )

    assert response.status_code == 405
    permitidos = {m.strip() for m in response.headers["allow"].split(",")}
    assert {"GET", "PATCH", "DELETE"} <= permitidos


@pytest.mark.integration
def test_rota_inexistente_usa_o_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/nao-existe")

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["type"].endswith("/not-found")
