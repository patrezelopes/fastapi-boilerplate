from app.entities.health_status import HealthStatus
from app.use_cases.health_repository import HealthRepository


class CheckHealthUseCase:
    def __init__(self, health_repository: HealthRepository) -> None:
        self._health_repository = health_repository

    def execute_liveness(self) -> HealthStatus:
        return HealthStatus(alive=self._health_repository.is_alive(), ready=True)

    def execute_readiness(self) -> HealthStatus:
        return HealthStatus(
            alive=self._health_repository.is_alive(),
            ready=self._health_repository.is_ready(),
        )
