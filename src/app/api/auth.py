from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Cookie, Depends, Response, status

from app.api.cookies import RefreshCookie
from app.api.dependencies import current_user
from app.api.errors import CONFLICT, UNAUTHORIZED, UNPROCESSABLE
from app.entities.errors import InvalidRefreshToken
from app.entities.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.use_cases.authenticate_user import AuthenticateUserUseCase
from app.use_cases.create_user import CreateUserUseCase
from app.use_cases.refresh_session import RefreshSessionUseCase
from app.use_cases.revoke_session import RevokeSessionUseCase
from app.use_cases.session import IssuedSession

AuthRouter = APIRouter(prefix="/auth", tags=["auth"])


@AuthRouter.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**CONFLICT, **UNPROCESSABLE},
)
@inject
def register(
    payload: RegisterRequest,
    use_case: CreateUserUseCase = Depends(Provide["create_user_uc"]),
) -> User:
    return use_case.execute(email=str(payload.email), name=payload.name, password=payload.password)


@AuthRouter.post(
    "/login", response_model=TokenResponse, responses={**UNAUTHORIZED, **UNPROCESSABLE}
)
@inject
def login(
    payload: LoginRequest,
    response: Response,
    use_case: AuthenticateUserUseCase = Depends(Provide["authenticate_user_uc"]),
    cookie: RefreshCookie = Depends(Provide["refresh_cookie"]),
) -> TokenResponse:
    session = use_case.execute(email=str(payload.email), password=payload.password)
    return _with_refresh_cookie(session, response, cookie)


@AuthRouter.post("/refresh", response_model=TokenResponse, responses=UNAUTHORIZED)
@inject
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    use_case: RefreshSessionUseCase = Depends(Provide["refresh_session_uc"]),
    cookie: RefreshCookie = Depends(Provide["refresh_cookie"]),
) -> TokenResponse:
    if not refresh_token:
        raise InvalidRefreshToken

    session = use_case.execute(raw_refresh_token=refresh_token)
    return _with_refresh_cookie(session, response, cookie)


@AuthRouter.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@inject
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias="refresh_token"),
    use_case: RevokeSessionUseCase = Depends(Provide["revoke_session_uc"]),
    cookie: RefreshCookie = Depends(Provide["refresh_cookie"]),
) -> Response:
    if refresh_token:
        use_case.execute(raw_refresh_token=refresh_token)

    cookie.clear_on(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT, headers=dict(response.headers))


@AuthRouter.get("/me", response_model=UserResponse, responses=UNAUTHORIZED)
def me(user: User = Depends(current_user)) -> User:
    return user


def _with_refresh_cookie(
    session: IssuedSession, response: Response, cookie: RefreshCookie
) -> TokenResponse:
    cookie.set_on(response, session.refresh_token, session.refresh_expires_in)
    return TokenResponse(access_token=session.access_token, expires_in=session.expires_in)
