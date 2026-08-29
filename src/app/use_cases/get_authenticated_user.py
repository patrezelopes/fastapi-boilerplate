from app.entities.errors import InvalidAccessToken
from app.entities.user import User
from app.use_cases.ports.token_service import AccessTokenService
from app.use_cases.ports.user_repository import UserRepository


class GetAuthenticatedUserUseCase:
    """Resolve o portador de um access token.

    Token válido cujo usuário já não existe é tratado como token inválido — do
    ponto de vista de quem chama, a credencial deixou de valer.
    """

    def __init__(
        self,
        user_repository: UserRepository,
        access_tokens: AccessTokenService,
    ) -> None:
        self._users = user_repository
        self._access_tokens = access_tokens

    def execute(self, *, access_token: str) -> User:
        user = self._users.get_by_id(self._access_tokens.decode(access_token))

        if user is None:
            raise InvalidAccessToken

        return user
