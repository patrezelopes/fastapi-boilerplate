from dependency_injector import containers, providers

from app.api.cookies import RefreshCookie
from app.config.database import Database
from app.config.environment import Settings
from app.config.security import (
    Argon2PasswordHasher,
    JwtAccessTokenService,
    Sha256RefreshTokenService,
    SystemClock,
)
from app.repositories.health_repository import SqlAlchemyHealthRepository
from app.repositories.sql_refresh_token_repository import SqlAlchemyRefreshTokenRepository
from app.repositories.sql_user_repository import SqlAlchemyUserRepository
from app.use_cases.authenticate_user import AuthenticateUserUseCase
from app.use_cases.check_health import CheckHealthUseCase
from app.use_cases.create_user import CreateUserUseCase
from app.use_cases.delete_user import DeleteUserUseCase
from app.use_cases.get_authenticated_user import GetAuthenticatedUserUseCase
from app.use_cases.get_user import GetUserUseCase
from app.use_cases.list_users import ListUsersUseCase
from app.use_cases.refresh_session import RefreshSessionUseCase
from app.use_cases.revoke_session import RevokeSessionUseCase
from app.use_cases.update_user import UpdateUserUseCase


class Container(containers.DeclarativeContainer):
    """O único lugar onde port e adapter se encontram."""

    wiring_config = containers.WiringConfiguration(packages=["app.api"])

    settings = providers.Singleton(Settings)
    database = providers.Singleton(Database, settings=settings)

    # ─── infraestrutura ──────────────────────────────────────────────────────
    clock = providers.Singleton(SystemClock)
    password_hasher = providers.Singleton(Argon2PasswordHasher)
    refresh_tokens = providers.Singleton(Sha256RefreshTokenService)

    access_tokens = providers.Singleton(
        JwtAccessTokenService,
        secret=settings.provided.jwt_secret,
        issuer=settings.provided.jwt_issuer,
        ttl_seconds=settings.provided.jwt_access_ttl_seconds,
        clock=clock,
    )

    refresh_cookie = providers.Singleton(
        RefreshCookie,
        secure=settings.provided.cookie_secure,
        domain=settings.provided.cookie_domain,
        path=providers.Callable(lambda base: f"{base}/auth", settings.provided.api_base_path),
    )

    # ─── repositories ────────────────────────────────────────────────────────
    health_repo = providers.Singleton(
        SqlAlchemyHealthRepository,
        engine=database.provided.engine,
    )
    user_repo = providers.Singleton(
        SqlAlchemyUserRepository,
        session_factory=database.provided.session_factory,
    )
    refresh_repo = providers.Singleton(
        SqlAlchemyRefreshTokenRepository,
        session_factory=database.provided.session_factory,
    )

    # ─── casos de uso ────────────────────────────────────────────────────────
    check_health_uc = providers.Factory(CheckHealthUseCase, health_repository=health_repo)

    create_user_uc = providers.Factory(
        CreateUserUseCase,
        user_repository=user_repo,
        password_hasher=password_hasher,
        clock=clock,
    )
    authenticate_user_uc = providers.Factory(
        AuthenticateUserUseCase,
        user_repository=user_repo,
        refresh_repository=refresh_repo,
        password_hasher=password_hasher,
        access_tokens=access_tokens,
        refresh_tokens=refresh_tokens,
        clock=clock,
        refresh_ttl_seconds=settings.provided.jwt_refresh_ttl_seconds,
    )
    refresh_session_uc = providers.Factory(
        RefreshSessionUseCase,
        refresh_repository=refresh_repo,
        access_tokens=access_tokens,
        refresh_tokens=refresh_tokens,
        clock=clock,
        refresh_ttl_seconds=settings.provided.jwt_refresh_ttl_seconds,
    )
    revoke_session_uc = providers.Factory(
        RevokeSessionUseCase,
        refresh_repository=refresh_repo,
        refresh_tokens=refresh_tokens,
        clock=clock,
    )
    get_authenticated_user_uc = providers.Factory(
        GetAuthenticatedUserUseCase,
        user_repository=user_repo,
        access_tokens=access_tokens,
    )

    list_users_uc = providers.Factory(ListUsersUseCase, user_repository=user_repo)
    get_user_uc = providers.Factory(GetUserUseCase, user_repository=user_repo)
    update_user_uc = providers.Factory(UpdateUserUseCase, user_repository=user_repo, clock=clock)
    delete_user_uc = providers.Factory(DeleteUserUseCase, user_repository=user_repo)
