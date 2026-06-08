import pytest

from app.api.health import _to_response
from app.entities.health_status import HealthStatus
from app.repositories.models.base import Base


@pytest.mark.unit
def test_to_response_liveness_ok() -> None:
    response = _to_response(HealthStatus(alive=True, ready=True))

    assert response.status == "ok"
    assert response.alive is True
    assert response.ready is True


@pytest.mark.unit
def test_to_response_liveness_unhealthy() -> None:
    response = _to_response(HealthStatus(alive=False, ready=True))

    assert response.status == "unhealthy"
    assert response.alive is False


@pytest.mark.unit
def test_to_response_readiness_unhealthy() -> None:
    response = _to_response(HealthStatus(alive=True, ready=False), readiness=True)

    assert response.status == "unhealthy"
    assert response.ready is False


@pytest.mark.unit
def test_sqlalchemy_base_can_be_instantiated() -> None:
    assert Base.metadata is not None
