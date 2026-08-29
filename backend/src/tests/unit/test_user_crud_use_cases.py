from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.entities.errors import EmailAlreadyTaken, UserNotFound
from app.use_cases.delete_user import DeleteUserUseCase
from app.use_cases.get_user import GetUserUseCase
from app.use_cases.list_users import ListUsersUseCase
from app.use_cases.update_user import UpdateUserUseCase
from tests.conftest import FrozenClock, InMemoryUserRepository, make_user


@pytest.fixture
def populated(users: InMemoryUserRepository) -> InMemoryUserRepository:
    for index, (name, email) in enumerate(
        [("Ana", "ana@exemplo.com"), ("Bruno", "bruno@exemplo.com"), ("Carla", "carla@site.com")]
    ):
        users.add(
            make_user(
                name=name, email=email, moment=datetime(2026, 1, 1 + index, 12, 0, tzinfo=UTC)
            )
        )
    return users


@pytest.mark.unit
def test_lista_pagina_e_conta_o_total(populated: InMemoryUserRepository) -> None:
    page = ListUsersUseCase(populated).execute(page=1, per_page=2)

    assert len(page.items) == 2
    assert page.total == 3
    assert page.total_pages == 2


@pytest.mark.unit
def test_pagina_alem_do_fim_devolve_lista_vazia(populated: InMemoryUserRepository) -> None:
    page = ListUsersUseCase(populated).execute(page=99, per_page=20)

    assert page.items == []
    assert page.total == 3


@pytest.mark.unit
@pytest.mark.parametrize(
    ("term", "esperados"),
    [("ana", 1), ("EXEMPLO", 2), ("site", 1), ("ninguem", 0), ("  ", 3), (None, 3)],
)
def test_busca_casa_nome_ou_email_ignorando_maiusculas(
    populated: InMemoryUserRepository, term: str | None, esperados: int
) -> None:
    page = ListUsersUseCase(populated).execute(term=term, per_page=100)

    assert page.total == esperados


@pytest.mark.unit
def test_obtem_usuario_por_id(populated: InMemoryUserRepository) -> None:
    alvo = populated.get_by_email("ana@exemplo.com")
    assert alvo is not None

    assert GetUserUseCase(populated).execute(user_id=alvo.id).email == "ana@exemplo.com"


@pytest.mark.unit
def test_id_inexistente_nao_e_encontrado(users: InMemoryUserRepository) -> None:
    with pytest.raises(UserNotFound):
        GetUserUseCase(users).execute(user_id=uuid4())


@pytest.mark.unit
def test_atualizacao_parcial_preserva_os_campos_ausentes(
    populated: InMemoryUserRepository, clock: FrozenClock
) -> None:
    alvo = populated.get_by_email("ana@exemplo.com")
    assert alvo is not None

    atualizado = UpdateUserUseCase(populated, clock).execute(user_id=alvo.id, name="Ana Maria")

    assert atualizado.name == "Ana Maria"
    assert atualizado.email == "ana@exemplo.com"
    assert atualizado.created_at == alvo.created_at
    assert atualizado.updated_at == clock.now()


@pytest.mark.unit
def test_manter_o_proprio_email_nao_e_conflito(
    populated: InMemoryUserRepository, clock: FrozenClock
) -> None:
    alvo = populated.get_by_email("ana@exemplo.com")
    assert alvo is not None

    atualizado = UpdateUserUseCase(populated, clock).execute(
        user_id=alvo.id, email="ANA@exemplo.com"
    )

    assert atualizado.email == "ana@exemplo.com"


@pytest.mark.unit
def test_email_de_outra_pessoa_e_conflito(
    populated: InMemoryUserRepository, clock: FrozenClock
) -> None:
    alvo = populated.get_by_email("ana@exemplo.com")
    assert alvo is not None

    with pytest.raises(EmailAlreadyTaken):
        UpdateUserUseCase(populated, clock).execute(user_id=alvo.id, email="bruno@exemplo.com")


@pytest.mark.unit
def test_atualizar_id_inexistente_nao_e_encontrado(
    users: InMemoryUserRepository, clock: FrozenClock
) -> None:
    with pytest.raises(UserNotFound):
        UpdateUserUseCase(users, clock).execute(user_id=uuid4(), name="Ninguém")


@pytest.mark.unit
def test_remove_usuario(populated: InMemoryUserRepository) -> None:
    alvo = populated.get_by_email("ana@exemplo.com")
    assert alvo is not None

    DeleteUserUseCase(populated).execute(user_id=alvo.id)

    assert populated.get_by_id(alvo.id) is None


@pytest.mark.unit
def test_remover_id_inexistente_nao_e_encontrado(users: InMemoryUserRepository) -> None:
    with pytest.raises(UserNotFound):
        DeleteUserUseCase(users).execute(user_id=uuid4())
