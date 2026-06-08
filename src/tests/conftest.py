from collections.abc import Generator

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient
from pydantic import computed_field
from pydantic_settings import SettingsConfigDict

from app.config.database import Database
from app.config.environment import Settings
from app.main import app
from app.use_cases.health_repository import HealthRepository


class FakeHealthRepository(HealthRepository):
    def __init__(self, *, alive: bool = True, ready: bool = True) -> None:
        self._alive = alive
        self._ready = ready

    def is_alive(self) -> bool:
        return self._alive

    def is_ready(self) -> bool:
        return self._ready


class SqliteSettings(Settings):
    model_config = SettingsConfigDict(
        env_file=None,
        case_sensitive=False,
        extra="ignore",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        return "sqlite:///:memory:"


@pytest.fixture
def sqlite_settings() -> SqliteSettings:
    return SqliteSettings()


@pytest.fixture
def database(sqlite_settings: SqliteSettings) -> Generator[Database]:
    db = Database(sqlite_settings)
    yield db
    db.engine.dispose()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def fake_health_repo() -> FakeHealthRepository:
    return FakeHealthRepository()


@pytest.fixture
def client_with_repo(
    fake_health_repo: FakeHealthRepository,
) -> Generator[TestClient]:
    container = app.container
    container.health_repo.override(providers.Object(fake_health_repo))
    yield TestClient(app)
    container.health_repo.reset_override()


@pytest.fixture
def unhealthy_client() -> Generator[TestClient]:
    repo = FakeHealthRepository(ready=False)
    container = app.container
    container.health_repo.override(providers.Object(repo))
    yield TestClient(app)
    container.health_repo.reset_override()
