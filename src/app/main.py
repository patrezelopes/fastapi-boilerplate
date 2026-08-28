from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import AuthRouter
from app.api.errors import register_error_handlers
from app.api.health import HealthRouter
from app.api.users import UsersRouter
from app.config.container import Container


def create_app(container: Container | None = None) -> FastAPI:
    """Monta a aplicação.

    As settings saem do container, e não de um singleton de módulo: assim o teste
    injeta as suas sem depender do `.env` da máquina de quem roda.
    """
    built = container or Container()
    settings = built.settings()

    app = FastAPI(title=settings.app_name, debug=settings.app_debug)
    app.container = built

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)

    for router in (HealthRouter, AuthRouter, UsersRouter):
        app.include_router(router, prefix=settings.api_base_path)

    return app


app = create_app()
container = app.container
