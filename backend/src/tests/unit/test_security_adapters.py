"""Os adapters reais de segurança — argon2, JWT e o hash do refresh."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest

from app.config.security import (
    Argon2PasswordHasher,
    JwtAccessTokenService,
    Sha256RefreshTokenService,
    SystemClock,
)
from app.entities.errors import InvalidAccessToken
from tests.conftest import VALID_PASSWORD, FrozenClock

FROZEN_NOW = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
SECRET = "s" * 64
ISSUER = "lopestech-boilerplate"


@pytest.fixture
def hasher() -> Argon2PasswordHasher:
    return Argon2PasswordHasher()


@pytest.fixture
def tokens(clock: FrozenClock) -> JwtAccessTokenService:
    return JwtAccessTokenService(secret=SECRET, issuer=ISSUER, ttl_seconds=900, clock=clock)


@pytest.mark.unit
def test_argon2_confere_a_senha_certa_e_recusa_a_errada(hasher: Argon2PasswordHasher) -> None:
    stored = hasher.hash(VALID_PASSWORD)

    assert hasher.verify(VALID_PASSWORD, stored) is True
    assert hasher.verify("outra-senha-longa", stored) is False


@pytest.mark.unit
def test_o_hash_argon2_nao_revela_a_senha(hasher: Argon2PasswordHasher) -> None:
    stored = hasher.hash(VALID_PASSWORD)

    assert VALID_PASSWORD not in stored
    assert stored.startswith("$argon2id$")


@pytest.mark.unit
def test_a_mesma_senha_gera_hashes_diferentes(hasher: Argon2PasswordHasher) -> None:
    """Sal por hash: dois iguais entregariam que as senhas são iguais."""
    assert hasher.hash(VALID_PASSWORD) != hasher.hash(VALID_PASSWORD)


@pytest.mark.unit
def test_hash_corrompido_nao_explode(hasher: Argon2PasswordHasher) -> None:
    assert hasher.verify(VALID_PASSWORD, "não é um hash") is False


@pytest.mark.unit
def test_o_hash_descartavel_e_estavel_e_de_custo_real(hasher: Argon2PasswordHasher) -> None:
    assert hasher.dummy_hash() == hasher.dummy_hash()
    assert hasher.dummy_hash().startswith("$argon2id$")


@pytest.mark.unit
def test_jwt_ida_e_volta(tokens: JwtAccessTokenService) -> None:
    user_id = uuid4()

    token, expires_in = tokens.issue(user_id)

    assert tokens.decode(token) == user_id
    assert expires_in == 900


@pytest.mark.unit
def test_token_expirado_e_recusado(tokens: JwtAccessTokenService, clock: FrozenClock) -> None:
    token, _ = tokens.issue(uuid4())

    clock.advance(seconds=901)

    with pytest.raises(InvalidAccessToken):
        tokens.decode(token)


@pytest.mark.unit
def test_token_no_limite_da_validade_ainda_vale(
    tokens: JwtAccessTokenService, clock: FrozenClock
) -> None:
    user_id = uuid4()
    token, _ = tokens.issue(user_id)

    clock.advance(seconds=899)

    assert tokens.decode(token) == user_id


@pytest.mark.unit
def test_assinatura_de_outro_segredo_e_recusada(tokens: JwtAccessTokenService) -> None:
    forjado = jwt.encode(
        {
            "sub": str(uuid4()),
            "iss": ISSUER,
            "exp": FROZEN_NOW + timedelta(hours=1),
        },
        "o" * 64,
        algorithm="HS256",
    )

    with pytest.raises(InvalidAccessToken):
        tokens.decode(forjado)


@pytest.mark.unit
def test_emissor_errado_e_recusado(tokens: JwtAccessTokenService) -> None:
    forjado = jwt.encode(
        {
            "sub": str(uuid4()),
            "iss": "outro-emissor",
            "exp": FROZEN_NOW + timedelta(hours=1),
        },
        SECRET,
        algorithm="HS256",
    )

    with pytest.raises(InvalidAccessToken):
        tokens.decode(forjado)


@pytest.mark.unit
def test_sub_que_nao_e_uuid_e_recusado(tokens: JwtAccessTokenService) -> None:
    forjado = jwt.encode(
        {"sub": "não-é-uuid", "iss": ISSUER, "exp": FROZEN_NOW + timedelta(hours=1)},
        SECRET,
        algorithm="HS256",
    )

    with pytest.raises(InvalidAccessToken):
        tokens.decode(forjado)


@pytest.mark.unit
def test_token_sem_exp_e_recusado(tokens: JwtAccessTokenService) -> None:
    forjado = jwt.encode({"sub": str(uuid4()), "iss": ISSUER}, SECRET, algorithm="HS256")

    with pytest.raises(InvalidAccessToken):
        tokens.decode(forjado)


@pytest.mark.unit
def test_refresh_e_aleatorio_e_o_hash_e_estavel() -> None:
    service = Sha256RefreshTokenService()

    primeiro, hash_primeiro = service.generate()
    segundo, _ = service.generate()

    assert primeiro != segundo
    assert service.hash(primeiro) == hash_primeiro
    assert len(hash_primeiro) == 64
    assert primeiro not in hash_primeiro


@pytest.mark.unit
def test_o_relogio_do_sistema_devolve_instante_com_fuso() -> None:
    assert SystemClock().now().tzinfo is not None
