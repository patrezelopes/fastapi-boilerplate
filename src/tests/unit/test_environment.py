import pytest

from app.config.environment import Settings, get_settings


@pytest.mark.unit
def test_settings_database_url_is_built_from_db_fields() -> None:
    settings = Settings(
        db_host="postgres",
        db_port=5433,
        db_user="user",
        db_password="secret",
        db_name="boilerplate",
    )

    assert settings.database_url == "postgresql+psycopg2://user:secret@postgres:5433/boilerplate"


@pytest.mark.unit
def test_get_settings_is_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("APP_NAME", "cached-app")

    first = get_settings()
    second = get_settings()

    assert first is second
    assert first.app_name == "cached-app"

    get_settings.cache_clear()
