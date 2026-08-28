from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config.environment import Settings


class Database:
    def __init__(self, settings: Settings) -> None:
        self._engine: Engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
        )
        self._session_factory = sessionmaker(
            bind=self._engine,
            autocommit=False,
            autoflush=False,
        )

    @property
    def engine(self) -> Engine:
        return self._engine

    def session(self) -> Session:
        return self._session_factory()

    @property
    def session_factory(self) -> sessionmaker[Session]:
        """Fábrica de sessões, entregue aos repositories pelo container."""
        return self._session_factory
