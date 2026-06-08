from sqlalchemy import text

from app.config.database import Database
from app.use_cases.health_repository import HealthRepository


class SqlAlchemyHealthRepository(HealthRepository):
    def __init__(self, database: Database) -> None:
        self._database = database

    def is_alive(self) -> bool:
        return True

    def is_ready(self) -> bool:
        try:
            with self._database.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
