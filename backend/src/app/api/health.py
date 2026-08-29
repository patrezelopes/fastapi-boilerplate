from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.entities.health_status import HealthStatus
from app.schemas.health import HealthResponse
from app.use_cases.check_health import CheckHealthUseCase

HealthRouter = APIRouter(prefix="/health", tags=["health"])


@HealthRouter.get("", response_model=HealthResponse)
@inject
def liveness(
    use_case: CheckHealthUseCase = Depends(Provide["check_health_uc"]),
) -> HealthResponse:
    return _to_response(use_case.execute_liveness())


@HealthRouter.get("/ready", response_model=HealthResponse)
@inject
def readiness(
    use_case: CheckHealthUseCase = Depends(Provide["check_health_uc"]),
) -> JSONResponse | HealthResponse:
    entity = use_case.execute_readiness()
    response = _to_response(entity, readiness=True)

    if not entity.ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response.model_dump(),
        )

    return response


def _to_response(entity: HealthStatus, *, readiness: bool = False) -> HealthResponse:
    healthy = entity.ready if readiness else entity.alive
    return HealthResponse(
        status="ok" if healthy else "unhealthy",
        alive=entity.alive,
        ready=entity.ready,
    )
