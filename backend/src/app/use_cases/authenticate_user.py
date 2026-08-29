from datetime import timedelta
from uuid import uuid4

from app.entities.errors import InvalidCredentials
from app.entities.refresh_token import RefreshToken
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.password_hasher import PasswordHasher
from app.use_cases.ports.refresh_token_repository import RefreshTokenRepository
from app.use_cases.ports.token_service import AccessTokenService, RefreshTokenService
from app.use_cases.ports.user_repository import UserRepository
from app.use_cases.session import IssuedSession


class AuthenticateUserUseCase:
    """Troca e-mail e senha por uma sessão nova.

    E-mail inexistente e senha errada produzem o mesmo erro. Quando o e-mail não
    existe, a senha ainda é conferida contra um hash descartável: sem isso, a
    resposta voltaria rápido demais e o tempo entregaria quais contas existem.
    """

    def __init__(
        self,
        user_repository: UserRepository,
        refresh_repository: RefreshTokenRepository,
        password_hasher: PasswordHasher,
        access_tokens: AccessTokenService,
        refresh_tokens: RefreshTokenService,
        clock: Clock,
        refresh_ttl_seconds: int,
    ) -> None:
        self._users = user_repository
        self._refresh = refresh_repository
        self._hasher = password_hasher
        self._access_tokens = access_tokens
        self._refresh_tokens = refresh_tokens
        self._clock = clock
        self._refresh_ttl_seconds = refresh_ttl_seconds

    def execute(self, *, email: str, password: str) -> IssuedSession:
        user = self._users.get_by_email(email.strip().lower())

        if user is None:
            self._hasher.verify(password, self._hasher.dummy_hash())
            raise InvalidCredentials

        if not self._hasher.verify(password, user.password_hash):
            raise InvalidCredentials

        moment = self._clock.now()
        access_token, expires_in = self._access_tokens.issue(user.id)
        raw_refresh, refresh_hash = self._refresh_tokens.generate()

        self._refresh.add(
            RefreshToken(
                id=uuid4(),
                user_id=user.id,
                family_id=uuid4(),
                expires_at=moment + timedelta(seconds=self._refresh_ttl_seconds),
                created_at=moment,
                token_hash=refresh_hash,
            )
        )

        return IssuedSession(
            access_token=access_token,
            expires_in=expires_in,
            refresh_token=raw_refresh,
            refresh_expires_in=self._refresh_ttl_seconds,
        )
