from functools import lru_cache
from typing import Self

from pydantic import Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Não é um segredo: é o valor sentinela que o validador abaixo REJEITA em
# produção. Bandit acusa pelo nome da variável.
EXAMPLE_JWT_SECRET = "troque-este-segredo-antes-de-qualquer-deploy"  # nosec B105


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "boilerplate-back"
    app_env: str = "development"
    app_debug: bool = False

    api_base_path: str = "/api/v1"
    cors_allowed_origins: str = "http://localhost:5173,http://localhost:4200"

    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "boilerplate"
    db_password: str = "boilerplate"
    db_name: str = "boilerplate"

    jwt_secret: str = Field(default=EXAMPLE_JWT_SECRET, min_length=32)
    jwt_issuer: str = "lopestech-boilerplate"
    jwt_access_ttl_seconds: int = 900
    jwt_refresh_ttl_seconds: int = 1_209_600

    cookie_secure: bool = False
    # Vazio = cookie host-only, que é o mais restrito. Só preencha para
    # compartilhar a sessão entre subdomínios.
    cookie_domain: str = ""

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    @model_validator(mode="after")
    def _never_debug_in_production(self) -> Self:
        """Trava o modo debug em produção.

        Com `debug=True` o Starlette devolve o traceback completo no corpo da
        resposta — exatamente o que `.claude/rules/security.md` proíbe.
        """
        if self.is_production and self.app_debug:
            object.__setattr__(self, "app_debug", False)
        return self

    @model_validator(mode="after")
    def _reject_example_secret_in_production(self) -> Self:
        """Recusa subir em produção com o segredo de exemplo.

        Ver `.claude/rules/security.md`: segredo não tem valor padrão utilizável.
        """
        if self.is_production and self.jwt_secret == EXAMPLE_JWT_SECRET:
            raise ValueError(
                "JWT_SECRET está com o valor de exemplo. "
                "Gere um real com `openssl rand -hex 32` antes de subir em produção."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


env = get_settings()
