import pytest
from fastapi.testclient import TestClient

from app.config.environment import env
from app.main import app


@pytest.mark.integration
def test_app_exposes_metadata(client: TestClient) -> None:
    assert client.app.title == env.app_name


@pytest.mark.integration
def test_app_has_container_and_health_routes() -> None:
    assert hasattr(app, "container")
    assert any(route.path.startswith("/api/v1/health") for route in app.routes)
