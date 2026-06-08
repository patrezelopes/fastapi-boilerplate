import pytest
from sqlalchemy import text

from app.config.database import Database
from tests.conftest import SqliteSettings


@pytest.mark.unit
def test_database_exposes_engine_and_session() -> None:
    database = Database(SqliteSettings())

    with database.engine.connect() as connection:
        result = connection.execute(text("SELECT 1")).scalar()

    session = database.session()

    assert result == 1
    assert session is not None
    session.close()
