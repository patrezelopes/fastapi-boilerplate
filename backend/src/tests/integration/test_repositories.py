"""Os repositories contra Postgres de verdade."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.entities.refresh_token import RefreshToken
from app.repositories.health_repository import SqlAlchemyHealthRepository
from app.repositories.sql_refresh_token_repository import SqlAlchemyRefreshTokenRepository
from app.repositories.sql_user_repository import SqlAlchemyUserRepository
from tests.conftest import make_user

pytestmark = pytest.mark.integration

MOMENT = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)


@pytest.fixture
def users(session_factory: sessionmaker[Session]) -> SqlAlchemyUserRepository:
    return SqlAlchemyUserRepository(session_factory)


@pytest.fixture
def tokens(session_factory: sessionmaker[Session]) -> SqlAlchemyRefreshTokenRepository:
    return SqlAlchemyRefreshTokenRepository(session_factory)


def _token(user_id, *, family=None, hash_suffix="a") -> RefreshToken:  # noqa: ANN001
    return RefreshToken(
        id=uuid4(),
        user_id=user_id,
        family_id=family or uuid4(),
        expires_at=MOMENT + timedelta(days=14),
        created_at=MOMENT,
        token_hash=hash_suffix * 64,
    )


def test_grava_e_le_um_usuario(users: SqlAlchemyUserRepository) -> None:
    salvo = users.add(make_user())

    assert users.get_by_id(salvo.id) == salvo


def test_id_inexistente_devolve_none(users: SqlAlchemyUserRepository) -> None:
    assert users.get_by_id(uuid4()) is None


def test_busca_por_email_ignora_maiusculas(users: SqlAlchemyUserRepository) -> None:
    users.add(make_user(email="ana@exemplo.com"))

    assert users.get_by_email("ANA@Exemplo.COM") is not None
    assert users.get_by_email("ninguem@exemplo.com") is None


def test_email_duplicado_viola_a_unicidade(users: SqlAlchemyUserRepository) -> None:
    users.add(make_user(email="ana@exemplo.com"))

    with pytest.raises(IntegrityError):
        users.add(make_user(email="ana@exemplo.com"))


def test_pagina_ordenando_do_mais_novo_para_o_mais_antigo(
    users: SqlAlchemyUserRepository,
) -> None:
    for dia in range(1, 4):
        users.add(
            make_user(
                email=f"pessoa{dia}@exemplo.com",
                name=f"Pessoa {dia}",
                moment=datetime(2026, 1, dia, 12, 0, tzinfo=UTC),
            )
        )

    primeira, total = users.search(term=None, offset=0, limit=2)
    segunda, _ = users.search(term=None, offset=2, limit=2)

    assert total == 3
    assert [u.name for u in primeira] == ["Pessoa 3", "Pessoa 2"]
    assert [u.name for u in segunda] == ["Pessoa 1"]


def test_busca_parcial_casa_nome_ou_email(users: SqlAlchemyUserRepository) -> None:
    users.add(make_user(email="ana@exemplo.com", name="Ana"))
    users.add(make_user(email="bruno@outro.com", name="Bruno"))

    por_nome, total_nome = users.search(term="BRU", offset=0, limit=10)
    _, total_dominio = users.search(term="exemplo", offset=0, limit=10)

    assert total_nome == 1 and por_nome[0].name == "Bruno"
    assert total_dominio == 1


def test_atualiza_campos_do_usuario(users: SqlAlchemyUserRepository) -> None:
    salvo = users.add(make_user())
    alterado = salvo.with_profile(name="Ana Maria", email="ana.maria@exemplo.com")

    users.update(alterado)

    relido = users.get_by_id(salvo.id)
    assert relido is not None
    assert relido.name == "Ana Maria"
    assert relido.email == "ana.maria@exemplo.com"


def test_atualizar_inexistente_nao_cria_registro(users: SqlAlchemyUserRepository) -> None:
    fantasma = make_user()

    users.update(fantasma)

    assert users.get_by_id(fantasma.id) is None


def test_remove_e_informa_se_havia_algo(users: SqlAlchemyUserRepository) -> None:
    salvo = users.add(make_user())

    assert users.delete(salvo.id) is True
    assert users.delete(salvo.id) is False


def test_grava_e_le_um_refresh_token(
    users: SqlAlchemyUserRepository, tokens: SqlAlchemyRefreshTokenRepository
) -> None:
    dono = users.add(make_user())

    salvo = tokens.add(_token(dono.id))

    assert tokens.get_by_hash(salvo.token_hash) == salvo


def test_hash_desconhecido_devolve_none(tokens: SqlAlchemyRefreshTokenRepository) -> None:
    assert tokens.get_by_hash("z" * 64) is None


def test_revoga_apenas_o_token_pedido(
    users: SqlAlchemyUserRepository, tokens: SqlAlchemyRefreshTokenRepository
) -> None:
    dono = users.add(make_user())
    alvo = tokens.add(_token(dono.id, hash_suffix="a"))
    vizinho = tokens.add(_token(dono.id, hash_suffix="b"))

    tokens.revoke(alvo.id, MOMENT)

    assert tokens.get_by_hash(alvo.token_hash).revoked_at is not None  # type: ignore[union-attr]
    assert tokens.get_by_hash(vizinho.token_hash).revoked_at is None  # type: ignore[union-attr]


def test_revoga_a_familia_inteira(
    users: SqlAlchemyUserRepository, tokens: SqlAlchemyRefreshTokenRepository
) -> None:
    dono = users.add(make_user())
    familia = uuid4()
    primeiro = tokens.add(_token(dono.id, family=familia, hash_suffix="a"))
    segundo = tokens.add(_token(dono.id, family=familia, hash_suffix="b"))
    de_fora = tokens.add(_token(dono.id, hash_suffix="c"))

    tokens.revoke_family(familia, MOMENT)

    assert tokens.get_by_hash(primeiro.token_hash).revoked_at is not None  # type: ignore[union-attr]
    assert tokens.get_by_hash(segundo.token_hash).revoked_at is not None  # type: ignore[union-attr]
    assert tokens.get_by_hash(de_fora.token_hash).revoked_at is None  # type: ignore[union-attr]


def test_revogar_nao_sobrescreve_a_data_original(
    users: SqlAlchemyUserRepository, tokens: SqlAlchemyRefreshTokenRepository
) -> None:
    dono = users.add(make_user())
    alvo = tokens.add(_token(dono.id))
    tokens.revoke(alvo.id, MOMENT)

    tokens.revoke(alvo.id, MOMENT + timedelta(days=1))

    relido = tokens.get_by_hash(alvo.token_hash)
    assert relido is not None and relido.revoked_at == MOMENT


def test_readiness_responde_com_banco_de_pe(engine: Engine) -> None:
    assert SqlAlchemyHealthRepository(engine).is_ready() is True
    assert SqlAlchemyHealthRepository(engine).is_alive() is True


def test_readiness_falha_com_banco_fora() -> None:
    from sqlalchemy import create_engine

    morto = create_engine("postgresql+psycopg2://x:x@127.0.0.1:1/x", pool_pre_ping=False)

    assert SqlAlchemyHealthRepository(morto).is_ready() is False


def test_o_wrapper_de_banco_monta_engine_e_sessao_a_partir_das_settings(
    postgres_url: str,
) -> None:
    """Exercita o `Database` real, montado só a partir das settings."""
    from urllib.parse import urlparse

    from sqlalchemy import text

    from app.config.database import Database
    from app.config.environment import Settings

    partes = urlparse(postgres_url)
    settings = Settings(
        _env_file=None,  # type: ignore[call-arg]
        jwt_secret="a" * 64,
        db_host=partes.hostname or "localhost",
        db_port=partes.port or 5432,
        db_user=partes.username or "test",
        db_password=partes.password or "test",
        db_name=(partes.path or "/test").lstrip("/"),
    )

    banco = Database(settings)

    with banco.session() as sessao:
        assert sessao.execute(text("SELECT 1")).scalar() == 1
    assert banco.session_factory is banco.session_factory
    banco.engine.dispose()
