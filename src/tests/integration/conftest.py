"""Fixtures de integração que exigem banco real.

Testcontainers sobe um Postgres descartável por sessão. Ver
`.claude/rules/testing.md`: repository se testa contra banco de verdade.
"""

from collections.abc import Generator

import pytest
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from testcontainers.community.postgres import PostgresContainer

from app.repositories.models import Base


@pytest.fixture(scope="session")
def postgres_url() -> Generator[str]:
    with PostgresContainer("postgres:18.4-alpine", driver="psycopg2") as container:
        yield container.get_connection_url()


@pytest.fixture(scope="session")
def engine(postgres_url: str) -> Generator[Engine]:
    created = create_engine(postgres_url, pool_pre_ping=True)
    Base.metadata.create_all(created)
    yield created
    created.dispose()


@pytest.fixture
def session_factory(engine: Engine) -> Generator[sessionmaker[Session]]:
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    yield factory
    with factory() as cleanup:
        for table in reversed(Base.metadata.sorted_tables):
            cleanup.execute(table.delete())
        cleanup.commit()
