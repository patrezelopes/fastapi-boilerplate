import pytest
from pydantic import ValidationError

from app.config.environment import EXAMPLE_JWT_SECRET, Settings


def _settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "_env_file": None,
        "jwt_secret": "a" * 64,
        **overrides,
    }
    return Settings(**base)  # type: ignore[arg-type]


@pytest.mark.unit
def test_monta_a_url_do_banco_a_partir_das_partes() -> None:
    settings = _settings(db_host="db", db_port=5432, db_user="u", db_password="p", db_name="n")

    assert settings.database_url == "postgresql+psycopg2://u:p@db:5432/n"


@pytest.mark.unit
def test_origens_de_cors_viram_lista_sem_espacos() -> None:
    settings = _settings(cors_allowed_origins="http://a.com , http://b.com ,")

    assert settings.cors_origins == ["http://a.com", "http://b.com"]


@pytest.mark.unit
@pytest.mark.parametrize("env_name", ["production", "PROD", "Production"])
def test_recusa_subir_em_producao_com_o_segredo_de_exemplo(env_name: str) -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        _settings(app_env=env_name, jwt_secret=EXAMPLE_JWT_SECRET)


@pytest.mark.unit
def test_aceita_o_segredo_de_exemplo_fora_de_producao() -> None:
    settings = _settings(app_env="development", jwt_secret=EXAMPLE_JWT_SECRET)

    assert settings.is_production is False


@pytest.mark.unit
def test_producao_com_segredo_real_sobe() -> None:
    assert _settings(app_env="production").is_production is True


@pytest.mark.unit
def test_recusa_segredo_curto_demais_para_hmac() -> None:
    """Abaixo de 32 bytes o HMAC-SHA256 fica fraco — o próprio PyJWT avisa."""
    with pytest.raises(ValidationError):
        _settings(jwt_secret="curto")


@pytest.mark.unit
def test_producao_desliga_o_modo_debug() -> None:
    """Com debug ligado o Starlette devolve traceback no corpo da resposta."""
    assert _settings(app_env="production", app_debug=True).app_debug is False


@pytest.mark.unit
def test_fora_de_producao_o_debug_e_respeitado() -> None:
    assert _settings(app_env="development", app_debug=True).app_debug is True
