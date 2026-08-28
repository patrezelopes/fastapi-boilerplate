"""Revogação de sessão e resolução do portador do access token."""

from datetime import timedelta
from uuid import uuid4

import pytest

from app.entities.errors import InvalidAccessToken
from app.entities.refresh_token import RefreshToken
from app.use_cases.get_authenticated_user import GetAuthenticatedUserUseCase
from app.use_cases.revoke_session import RevokeSessionUseCase
from tests.conftest import (
    FakeAccessTokenService,
    FakeRefreshTokenService,
    FrozenClock,
    InMemoryRefreshTokenRepository,
    InMemoryUserRepository,
    make_user,
)


@pytest.fixture
def revoke(
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> RevokeSessionUseCase:
    return RevokeSessionUseCase(
        refresh_repository=refresh_store, refresh_tokens=refresh_tokens, clock=clock
    )


@pytest.fixture
def stored_raw_token(
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> str:
    raw, hashed = refresh_tokens.generate()
    refresh_store.add(
        RefreshToken(
            id=uuid4(),
            user_id=uuid4(),
            family_id=uuid4(),
            expires_at=clock.now() + timedelta(hours=1),
            created_at=clock.now(),
            token_hash=hashed,
        )
    )
    return raw


@pytest.mark.unit
def test_logout_revoga_o_token(
    revoke: RevokeSessionUseCase,
    stored_raw_token: str,
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> None:
    revoke.execute(raw_refresh_token=stored_raw_token)

    stored = refresh_store.get_by_hash(refresh_tokens.hash(stored_raw_token))
    assert stored is not None and stored.revoked_at == clock.now()


@pytest.mark.unit
def test_logout_com_token_desconhecido_e_silencioso(revoke: RevokeSessionUseCase) -> None:
    """Sair com um token que já não vale é o resultado que a pessoa queria."""
    revoke.execute(raw_refresh_token="nunca-existiu")


@pytest.mark.unit
def test_resolve_o_portador_do_access_token(
    users: InMemoryUserRepository, access_tokens: FakeAccessTokenService
) -> None:
    user = users.add(make_user())
    token, _ = access_tokens.issue(user.id)
    use_case = GetAuthenticatedUserUseCase(user_repository=users, access_tokens=access_tokens)

    assert use_case.execute(access_token=token).id == user.id


@pytest.mark.unit
def test_token_invalido_e_recusado(
    users: InMemoryUserRepository, access_tokens: FakeAccessTokenService
) -> None:
    use_case = GetAuthenticatedUserUseCase(user_repository=users, access_tokens=access_tokens)

    with pytest.raises(InvalidAccessToken):
        use_case.execute(access_token="forjado")


@pytest.mark.unit
def test_token_valido_de_usuario_removido_e_recusado(
    users: InMemoryUserRepository, access_tokens: FakeAccessTokenService
) -> None:
    user = users.add(make_user())
    token, _ = access_tokens.issue(user.id)
    users.delete(user.id)
    use_case = GetAuthenticatedUserUseCase(user_repository=users, access_tokens=access_tokens)

    with pytest.raises(InvalidAccessToken):
        use_case.execute(access_token=token)
