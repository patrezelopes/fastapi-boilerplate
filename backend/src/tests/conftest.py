"""Fakes e fixtures compartilhadas.

Os fakes implementam os mesmos ports dos adapters reais — não são mocks com
asserção de chamada. Ver `.claude/rules/testing.md`.
"""

import hashlib
from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from itertools import count
from uuid import UUID, uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from app.config.container import Container
from app.config.environment import Settings
from app.entities.errors import InvalidAccessToken
from app.entities.refresh_token import RefreshToken
from app.entities.user import User
from app.main import create_app
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.health_repository import HealthRepository
from app.use_cases.ports.password_hasher import PasswordHasher
from app.use_cases.ports.refresh_token_repository import RefreshTokenRepository
from app.use_cases.ports.token_service import AccessTokenService, RefreshTokenService
from app.use_cases.ports.user_repository import UserRepository

VALID_PASSWORD = "senha-bem-longa-123"


# ─── fakes ───────────────────────────────────────────────────────────────────


class FakeHealthRepository(HealthRepository):
    def __init__(self, *, alive: bool = True, ready: bool = True) -> None:
        self._alive = alive
        self._ready = ready

    def is_alive(self) -> bool:
        return self._alive

    def is_ready(self) -> bool:
        return self._ready


class FrozenClock(Clock):
    """Relógio parado, que só anda quando o teste manda."""

    def __init__(self, moment: datetime | None = None) -> None:
        self._moment = moment or datetime(2026, 1, 1, 12, 0, tzinfo=UTC)

    def now(self) -> datetime:
        return self._moment

    def advance(self, **delta: float) -> None:
        self._moment += timedelta(**delta)


class FakePasswordHasher(PasswordHasher):
    """Hash reversível e barato. Só para teste — jamais fora daqui."""

    def hash(self, plain_password: str) -> str:
        return f"hashed::{plain_password}"

    def verify(self, plain_password: str, password_hash: str) -> bool:
        return password_hash == self.hash(plain_password)

    def dummy_hash(self) -> str:
        return "hashed::__dummy__"


class FakeAccessTokenService(AccessTokenService):
    def __init__(self, ttl_seconds: int = 900) -> None:
        self._ttl_seconds = ttl_seconds
        self._issued: dict[str, UUID] = {}
        self._counter = count(1)

    def issue(self, user_id: UUID) -> tuple[str, int]:
        token = f"access-{next(self._counter)}-{user_id}"
        self._issued[token] = user_id
        return token, self._ttl_seconds

    def decode(self, token: str) -> UUID:
        if token not in self._issued:
            raise InvalidAccessToken
        return self._issued[token]

    def expire(self, token: str) -> None:
        self._issued.pop(token, None)


class FakeRefreshTokenService(RefreshTokenService):
    def __init__(self) -> None:
        self._counter = count(1)

    def generate(self) -> tuple[str, str]:
        raw = f"refresh-{next(self._counter)}"
        return raw, self.hash(raw)

    def hash(self, raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode()).hexdigest()


class InMemoryUserRepository(UserRepository):
    def __init__(self) -> None:
        self._rows: dict[UUID, User] = {}

    def add(self, user: User) -> User:
        self._rows[user.id] = user
        return user

    def get_by_id(self, user_id: UUID) -> User | None:
        return self._rows.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        target = email.lower()
        return next((u for u in self._rows.values() if u.email.lower() == target), None)

    def search(self, term: str | None, offset: int, limit: int) -> tuple[list[User], int]:
        rows = sorted(self._rows.values(), key=lambda u: (u.created_at, str(u.id)), reverse=True)

        if term is not None:
            needle = term.lower()
            rows = [u for u in rows if needle in u.email.lower() or needle in u.name.lower()]

        return rows[offset : offset + limit], len(rows)

    def update(self, user: User) -> User:
        self._rows[user.id] = user
        return user

    def delete(self, user_id: UUID) -> bool:
        return self._rows.pop(user_id, None) is not None


class InMemoryRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self) -> None:
        self._rows: dict[UUID, RefreshToken] = {}

    def add(self, token: RefreshToken) -> RefreshToken:
        self._rows[token.id] = token
        return token

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        return next((t for t in self._rows.values() if t.token_hash == token_hash), None)

    def revoke(self, token_id: UUID, moment: datetime) -> None:
        stored = self._rows.get(token_id)
        if stored is not None and stored.revoked_at is None:
            self._rows[token_id] = _revoked(stored, moment)

    def revoke_family(self, family_id: UUID, moment: datetime) -> None:
        for token_id, stored in list(self._rows.items()):
            if stored.family_id == family_id and stored.revoked_at is None:
                self._rows[token_id] = _revoked(stored, moment)


def _revoked(token: RefreshToken, moment: datetime) -> RefreshToken:
    return RefreshToken(
        id=token.id,
        user_id=token.user_id,
        family_id=token.family_id,
        expires_at=token.expires_at,
        created_at=token.created_at,
        revoked_at=moment,
        token_hash=token.token_hash,
    )


# ─── construtores de entidade ────────────────────────────────────────────────


def make_user(
    *,
    email: str = "ana@exemplo.com",
    name: str = "Ana",
    password: str = VALID_PASSWORD,
    moment: datetime | None = None,
) -> User:
    when = moment or datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    return User(
        id=uuid4(),
        email=email,
        name=name,
        created_at=when,
        updated_at=when,
        password_hash=FakePasswordHasher().hash(password),
    )


# ─── fixtures ────────────────────────────────────────────────────────────────


@pytest.fixture
def clock() -> FrozenClock:
    return FrozenClock()


@pytest.fixture
def hasher() -> FakePasswordHasher:
    return FakePasswordHasher()


@pytest.fixture
def users() -> InMemoryUserRepository:
    return InMemoryUserRepository()


@pytest.fixture
def refresh_store() -> InMemoryRefreshTokenRepository:
    return InMemoryRefreshTokenRepository()


@pytest.fixture
def access_tokens() -> FakeAccessTokenService:
    return FakeAccessTokenService()


@pytest.fixture
def refresh_tokens() -> FakeRefreshTokenService:
    return FakeRefreshTokenService()


@pytest.fixture
def test_settings() -> Settings:
    """Settings de teste, isoladas do `.env` de quem roda.

    `app_debug=False` de propósito: com debug ligado o Starlette devolve
    traceback em vez de passar pelo nosso handler de 500.
    """
    return Settings(
        _env_file=None,  # type: ignore[call-arg]
        app_debug=False,
        jwt_secret="a" * 64,
        cookie_secure=False,
        cookie_domain="",
    )


@pytest.fixture
def container(
    test_settings: Settings,
    clock: FrozenClock,
    hasher: FakePasswordHasher,
    users: InMemoryUserRepository,
    refresh_store: InMemoryRefreshTokenRepository,
    access_tokens: FakeAccessTokenService,
    refresh_tokens: FakeRefreshTokenService,
) -> Container:
    """Container real, com os adapters de infraestrutura trocados por fakes.

    O que se testa aqui é o wiring e a camada HTTP — não o banco.
    """
    built = Container()
    built.settings.override(providers.Object(test_settings))
    built.clock.override(providers.Object(clock))
    built.password_hasher.override(providers.Object(hasher))
    built.user_repo.override(providers.Object(users))
    built.refresh_repo.override(providers.Object(refresh_store))
    built.access_tokens.override(providers.Object(access_tokens))
    built.refresh_tokens.override(providers.Object(refresh_tokens))
    built.health_repo.override(providers.Object(FakeHealthRepository()))
    return built


@pytest.fixture
def client(container: Container) -> Generator[TestClient]:
    app = create_app(container)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def registered(client: TestClient) -> dict[str, str]:
    """Uma conta criada, com o access token já em mãos."""
    client.post(
        "/api/v1/auth/register",
        json={"email": "ana@exemplo.com", "name": "Ana", "password": VALID_PASSWORD},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ana@exemplo.com", "password": VALID_PASSWORD},
    )
    return {"access_token": response.json()["access_token"]}


@pytest.fixture
def auth_headers(registered: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {registered['access_token']}"}
