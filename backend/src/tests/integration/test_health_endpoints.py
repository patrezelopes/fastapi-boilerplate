import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from app.config.container import Container
from app.main import create_app
from tests.conftest import FakeHealthRepository

BASE = "/api/v1/health"


@pytest.mark.integration
def test_liveness_responde_ok(client: TestClient) -> None:
    response = client.get(BASE)

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "alive": True, "ready": True}


@pytest.mark.integration
def test_readiness_responde_ok_com_banco_de_pe(client: TestClient) -> None:
    response = client.get(f"{BASE}/ready")

    assert response.status_code == 200
    assert response.json()["ready"] is True


@pytest.mark.integration
def test_readiness_responde_503_com_banco_fora(container: Container) -> None:
    container.health_repo.override(providers.Object(FakeHealthRepository(ready=False)))

    with TestClient(create_app(container)) as client:
        response = client.get(f"{BASE}/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "unhealthy", "alive": True, "ready": False}


@pytest.mark.integration
def test_liveness_segue_de_pe_com_banco_fora(container: Container) -> None:
    """Liveness não pode cair junto: reiniciaria um processo saudável."""
    container.health_repo.override(providers.Object(FakeHealthRepository(ready=False)))

    with TestClient(create_app(container)) as client:
        response = client.get(BASE)

    assert response.status_code == 200


@pytest.mark.integration
def test_as_sondas_nao_exigem_autenticacao(client: TestClient) -> None:
    assert client.get(BASE).status_code == 200
    assert client.get(f"{BASE}/ready").status_code == 200
