import pytest

from app.entities.errors import InvalidCredentials
from app.use_cases.authenticate_user import AuthenticateUserUseCase
from tests.conftest import (
    VALID_PASSWORD,
    FakeAccessTokenService,
    FakePasswordHasher,
    FakeRefreshTokenService,
    FrozenClock,
    InMemoryRefreshTokenRepository,
    InMemoryUserRepository,
    make_user,
)

REFRESH_TTL = 1_209_600


@pytest.fixture
def use_case(
    users: InMemoryUserRepository,
    refresh_store: InMemoryRefreshTokenRepository,
    hasher: FakePasswordHasher,
    access_tokens: FakeAccessTokenService,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> AuthenticateUserUseCase:
    return AuthenticateUserUseCase(
        user_repository=users,
        refresh_repository=refresh_store,
        password_hasher=hasher,
        access_tokens=access_tokens,
        refresh_tokens=refresh_tokens,
        clock=clock,
        refresh_ttl_seconds=REFRESH_TTL,
    )


@pytest.mark.unit
def test_login_valido_emite_o_par_de_tokens(
    use_case: AuthenticateUserUseCase, users: InMemoryUserRepository
) -> None:
    users.add(make_user())

    session = use_case.execute(email="ana@exemplo.com", password=VALID_PASSWORD)

    assert session.access_token
    assert session.refresh_token
    assert session.expires_in == 900
    assert session.refresh_expires_in == REFRESH_TTL


@pytest.mark.unit
def test_login_persiste_o_refresh_com_familia_nova(
    use_case: AuthenticateUserUseCase,
    users: InMemoryUserRepository,
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> None:
    user = users.add(make_user())

    session = use_case.execute(email="ana@exemplo.com", password=VALID_PASSWORD)

    stored = refresh_store.get_by_hash(refresh_tokens.hash(session.refresh_token))
    assert stored is not None
    assert stored.user_id == user.id
    assert stored.is_active_at(clock.now())


@pytest.mark.unit
def test_senha_errada_e_email_inexistente_produzem_o_mesmo_erro(
    use_case: AuthenticateUserUseCase, users: InMemoryUserRepository
) -> None:
    users.add(make_user())

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="ana@exemplo.com", password="senha-errada-longa")

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="ninguem@exemplo.com", password=VALID_PASSWORD)


@pytest.mark.unit
def test_email_inexistente_ainda_confere_um_hash_descartavel(
    use_case: AuthenticateUserUseCase, hasher: FakePasswordHasher
) -> None:
    """A equalização de tempo evita enumeração de contas."""
    conferidos: list[str] = []
    original = hasher.verify

    def espiar(plain: str, password_hash: str) -> bool:
        conferidos.append(password_hash)
        return original(plain, password_hash)

    hasher.verify = espiar  # type: ignore[method-assign]

    with pytest.raises(InvalidCredentials):
        use_case.execute(email="ninguem@exemplo.com", password=VALID_PASSWORD)

    assert conferidos == [hasher.dummy_hash()]


@pytest.mark.unit
def test_email_e_comparado_sem_diferenciar_maiusculas(
    use_case: AuthenticateUserUseCase, users: InMemoryUserRepository
) -> None:
    users.add(make_user())

    session = use_case.execute(email="  ANA@Exemplo.COM ", password=VALID_PASSWORD)

    assert session.access_token
