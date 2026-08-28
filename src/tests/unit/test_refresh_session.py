import pytest

from app.entities.errors import InvalidRefreshToken, RefreshTokenReused
from app.use_cases.refresh_session import RefreshSessionUseCase
from tests.conftest import (
    FakeAccessTokenService,
    FakeRefreshTokenService,
    FrozenClock,
    InMemoryRefreshTokenRepository,
)
from tests.conftest import (
    make_user,
)

REFRESH_TTL = 3600


@pytest.fixture
def use_case(
    refresh_store: InMemoryRefreshTokenRepository,
    access_tokens: FakeAccessTokenService,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> RefreshSessionUseCase:
    return RefreshSessionUseCase(
        refresh_repository=refresh_store,
        access_tokens=access_tokens,
        refresh_tokens=refresh_tokens,
        clock=clock,
        refresh_ttl_seconds=REFRESH_TTL,
    )


@pytest.fixture
def raw_token(
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> str:
    from datetime import timedelta
    from uuid import uuid4

    from app.entities.refresh_token import RefreshToken

    raw, hashed = refresh_tokens.generate()
    refresh_store.add(
        RefreshToken(
            id=uuid4(),
            user_id=make_user().id,
            family_id=uuid4(),
            expires_at=clock.now() + timedelta(seconds=REFRESH_TTL),
            created_at=clock.now(),
            token_hash=hashed,
        )
    )
    return raw


@pytest.mark.unit
def test_rotacao_emite_par_novo_e_revoga_o_antigo(
    use_case: RefreshSessionUseCase,
    raw_token: str,
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> None:
    session = use_case.execute(raw_refresh_token=raw_token)

    antigo = refresh_store.get_by_hash(refresh_tokens.hash(raw_token))
    novo = refresh_store.get_by_hash(refresh_tokens.hash(session.refresh_token))
    assert antigo is not None and antigo.revoked_at == clock.now()
    assert novo is not None and novo.is_active_at(clock.now())
    assert session.refresh_token != raw_token


@pytest.mark.unit
def test_o_sucessor_herda_a_familia(
    use_case: RefreshSessionUseCase,
    raw_token: str,
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
) -> None:
    antigo = refresh_store.get_by_hash(refresh_tokens.hash(raw_token))
    assert antigo is not None

    session = use_case.execute(raw_refresh_token=raw_token)

    novo = refresh_store.get_by_hash(refresh_tokens.hash(session.refresh_token))
    assert novo is not None and novo.family_id == antigo.family_id


@pytest.mark.unit
def test_reuso_derruba_a_familia_inteira(
    use_case: RefreshSessionUseCase,
    raw_token: str,
    refresh_store: InMemoryRefreshTokenRepository,
    refresh_tokens: FakeRefreshTokenService,
    clock: FrozenClock,
) -> None:
    session = use_case.execute(raw_refresh_token=raw_token)

    with pytest.raises(RefreshTokenReused):
        use_case.execute(raw_refresh_token=raw_token)

    sucessor = refresh_store.get_by_hash(refresh_tokens.hash(session.refresh_token))
    assert sucessor is not None
    assert not sucessor.is_active_at(clock.now()), "o sucessor legítimo também deve cair"


@pytest.mark.unit
def test_token_desconhecido_e_recusado(use_case: RefreshSessionUseCase) -> None:
    with pytest.raises(InvalidRefreshToken):
        use_case.execute(raw_refresh_token="nunca-existiu")


@pytest.mark.unit
def test_token_expirado_e_recusado(
    use_case: RefreshSessionUseCase, raw_token: str, clock: FrozenClock
) -> None:
    clock.advance(seconds=REFRESH_TTL + 1)

    with pytest.raises(InvalidRefreshToken):
        use_case.execute(raw_refresh_token=raw_token)
