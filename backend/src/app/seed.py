"""Popula o banco com dados de desenvolvimento.

    make seed

Idempotente: rodar de novo não duplica nem falha. Nunca use em produção — a
senha é conhecida e está aqui no código.
"""

import logging

from app.config.container import Container
from app.config.environment import get_settings
from app.entities.errors import EmailAlreadyTaken

SEED_ACCOUNTS = [
    ("ana@exemplo.com", "Ana Souza"),
    ("bruno@exemplo.com", "Bruno Lima"),
    ("carla@exemplo.com", "Carla Dias"),
]
SEED_PASSWORD = "desenvolvimento-123"  # nosec B105  (não é credencial real)

_logger = logging.getLogger(__name__)


def run() -> None:
    if get_settings().is_production:
        raise SystemExit("seed não roda em produção")

    create_user = Container().create_user_uc()

    for email, name in SEED_ACCOUNTS:
        try:
            create_user.execute(email=email, name=name, password=SEED_PASSWORD)
            _logger.info("criado: %s", email)
        except EmailAlreadyTaken:
            _logger.info("já existia: %s", email)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    run()
