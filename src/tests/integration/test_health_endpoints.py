import pytest
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_liveness_endpoint_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "alive": True,
        "ready": True,
    }


@pytest.mark.integration
def test_readiness_endpoint_returns_ok_when_dependencies_are_ready(
    client_with_repo: TestClient,
) -> None:
    response = client_with_repo.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["ready"] is True


@pytest.mark.integration
def test_readiness_endpoint_returns_503_when_not_ready(unhealthy_client: TestClient) -> None:
    response = unhealthy_client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {
        "status": "unhealthy",
        "alive": True,
        "ready": False,
    }


@pytest.mark.integration
def test_liveness_with_overridden_repository(client_with_repo: TestClient) -> None:
    response = client_with_repo.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["alive"] is True
