from fastapi import FastAPI

from app.api.health import HealthRouter
from app.config.container import Container
from app.config.environment import env

app = FastAPI(
    title=env.app_name,
    debug=env.app_debug,
)

container = Container()
app.container = container

app.include_router(HealthRouter, prefix="/api/v1")
