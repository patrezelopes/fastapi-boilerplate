from dependency_injector.wiring import Provide, inject
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.entities.errors import InvalidAccessToken
from app.entities.user import User
from app.use_cases.get_authenticated_user import GetAuthenticatedUserUseCase

bearer_scheme = HTTPBearer(auto_error=False)


@inject
def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    use_case: GetAuthenticatedUserUseCase = Depends(Provide["get_authenticated_user_uc"]),
) -> User:
    """Resolve o portador do Bearer.

    `auto_error=False` para que a ausência do header caia no mesmo envelope
    RFC 9457 dos demais erros, e não no 403 cru do FastAPI.
    """
    if credentials is None or not credentials.credentials:
        raise InvalidAccessToken

    return use_case.execute(access_token=credentials.credentials)
