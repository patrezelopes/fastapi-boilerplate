import pytest

from app import seed
from app.config.container import Container
from tests.conftest import InMemoryUserRepository


@pytest.fixture
def seeded(monkeypatch: pytest.MonkeyPatch, container: Container) -> InMemoryUserRepository:
    monkeypatch.setattr(seed, "Container", lambda: container)
    return container.user_repo()


@pytest.mark.unit
def test_cria_as_contas_de_desenvolvimento(seeded: InMemoryUserRepository) -> None:
    seed.run()

    assert seeded.search(None, 0, 100)[1] == len(seed.SEED_ACCOUNTS)


@pytest.mark.unit
def test_rodar_de_novo_nao_duplica_nem_falha(seeded: InMemoryUserRepository) -> None:
    seed.run()
    seed.run()

    assert seeded.search(None, 0, 100)[1] == len(seed.SEED_ACCOUNTS)


@pytest.mark.unit
def test_recusa_rodar_em_producao(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(seed, "get_settings", lambda: _Producao())

    with pytest.raises(SystemExit, match="produção"):
        seed.run()


class _Producao:
    is_production = True
