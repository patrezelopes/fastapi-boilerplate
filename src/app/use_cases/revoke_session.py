from app.use_cases.ports.clock import Clock
from app.use_cases.ports.refresh_token_repository import RefreshTokenRepository
from app.use_cases.ports.token_service import RefreshTokenService


class RevokeSessionUseCase:
    """Encerra uma sessão.

    Silencioso de propósito: sair com um token que já não vale é o resultado que
    a pessoa queria. Devolver erro só entregaria se o token existia.
    """

    def __init__(
        self,
        refresh_repository: RefreshTokenRepository,
        refresh_tokens: RefreshTokenService,
        clock: Clock,
    ) -> None:
        self._refresh = refresh_repository
        self._refresh_tokens = refresh_tokens
        self._clock = clock

    def execute(self, *, raw_refresh_token: str) -> None:
        stored = self._refresh.get_by_hash(self._refresh_tokens.hash(raw_refresh_token))

        if stored is not None:
            self._refresh.revoke(stored.id, self._clock.now())
