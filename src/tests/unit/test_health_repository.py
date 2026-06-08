import pytest

from app.config.database import Database
from app.config.environment import Settings
from app.repositories.health_repository import SqlAlchemyHealthRepository


@pytest.mark.unit
def test_is_alive_always_returns_true(database: Database) -> None:
    repository = SqlAlchemyHealthRepository(database)

    assert repository.is_alive() is True


@pytest.mark.unit
def test_is_ready_returns_true_with_valid_connection(database: Database) -> None:
    repository = SqlAlchemyHealthRepository(database)

    assert repository.is_ready() is True


@pytest.mark.unit
def test_is_ready_returns_false_when_connection_fails() -> None:
    settings = Settings(
        db_host="invalid-host",
        db_port=1,
        db_user="user",
        db_password="password",
        db_name="missing",
    )
    database = Database(settings)
    try:
        repository = SqlAlchemyHealthRepository(database)
        assert repository.is_ready() is False
    finally:
        database.engine.dispose()
