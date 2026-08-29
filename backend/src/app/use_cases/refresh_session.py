from datetime import timedelta
from uuid import uuid4

from app.entities.errors import InvalidRefreshToken, RefreshTokenReused
from app.entities.refresh_token import RefreshToken
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.refresh_token_repository import RefreshTokenRepository
from app.use_cases.ports.token_service import AccessTokenService, RefreshTokenService
from app.use_cases.session import IssuedSession


class RefreshSessionUseCase:
    """Rotaciona um refresh token, emitindo um par novo.

    O token apresentado é revogado no mesmo instante em que o sucessor nasce.
    Se um token já revogado reaparecer, é porque alguém o copiou: a família
    inteira cai, derrubando dono e atacante. É a detecção de roubo.
    """

    def __init__(
        self,
        refresh_repository: RefreshTokenRepository,
        access_tokens: AccessTokenService,
        refresh_tokens: RefreshTokenService,
        clock: Clock,
        refresh_ttl_seconds: int,
    ) -> None:
        self._refresh = refresh_repository
        self._access_tokens = access_tokens
        self._refresh_tokens = refresh_tokens
        self._clock = clock
        self._refresh_ttl_seconds = refresh_ttl_seconds

    def execute(self, *, raw_refresh_token: str) -> IssuedSession:
        moment = self._clock.now()
        stored = self._refresh.get_by_hash(self._refresh_tokens.hash(raw_refresh_token))

        if stored is None:
            raise InvalidRefreshToken

        if stored.revoked_at is not None:
            self._refresh.revoke_family(stored.family_id, moment)
            raise RefreshTokenReused

        if stored.has_expired_at(moment):
            raise InvalidRefreshToken

        self._refresh.revoke(stored.id, moment)

        access_token, expires_in = self._access_tokens.issue(stored.user_id)
        raw_successor, successor_hash = self._refresh_tokens.generate()

        self._refresh.add(
            RefreshToken(
                id=uuid4(),
                user_id=stored.user_id,
                family_id=stored.family_id,
                expires_at=moment + timedelta(seconds=self._refresh_ttl_seconds),
                created_at=moment,
                token_hash=successor_hash,
            )
        )

        return IssuedSession(
            access_token=access_token,
            expires_in=expires_in,
            refresh_token=raw_successor,
            refresh_expires_in=self._refresh_ttl_seconds,
        )
