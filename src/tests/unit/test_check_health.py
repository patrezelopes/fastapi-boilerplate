import pytest

from app.entities.health_status import HealthStatus
from app.use_cases.check_health import CheckHealthUseCase
from tests.conftest import FakeHealthRepository


@pytest.mark.unit
def test_execute_liveness_returns_alive_status() -> None:
    use_case = CheckHealthUseCase(FakeHealthRepository(alive=True, ready=True))

    result = use_case.execute_liveness()

    assert result == HealthStatus(alive=True, ready=True)


@pytest.mark.unit
def test_execute_readiness_reflects_repository_state() -> None:
    use_case = CheckHealthUseCase(FakeHealthRepository(alive=True, ready=False))

    result = use_case.execute_readiness()

    assert result == HealthStatus(alive=True, ready=False)
