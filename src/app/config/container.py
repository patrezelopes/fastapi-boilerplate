from dependency_injector import containers, providers

from app.config.database import Database
from app.config.environment import Settings
from app.repositories.health_repository import SqlAlchemyHealthRepository
from app.use_cases.check_health import CheckHealthUseCase


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(packages=["app.api"])

    settings = providers.Singleton(Settings)

    database = providers.Singleton(
        Database,
        settings=settings,
    )

    health_repo = providers.Singleton(
        SqlAlchemyHealthRepository,
        database=database,
    )

    check_health_uc = providers.Factory(
        CheckHealthUseCase,
        health_repository=health_repo,
    )
