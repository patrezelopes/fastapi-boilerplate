from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.use_cases.ports.health_repository import HealthRepository


class SqlAlchemyHealthRepository(HealthRepository):
    """Recebe o `Engine` direto, e não o wrapper de `config`.

    Depender de `config.Database` seria uma importação para fora — ver
    `.claude/rules/architecture.md`.
    """

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def is_alive(self) -> bool:
        return True

    def is_ready(self) -> bool:
        try:
            with self._engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
