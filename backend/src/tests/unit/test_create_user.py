import pytest

from app.entities.errors import EmailAlreadyTaken
from app.use_cases.create_user import CreateUserUseCase
from tests.conftest import VALID_PASSWORD, FakePasswordHasher, FrozenClock, InMemoryUserRepository


@pytest.fixture
def use_case(
    users: InMemoryUserRepository, hasher: FakePasswordHasher, clock: FrozenClock
) -> CreateUserUseCase:
    return CreateUserUseCase(user_repository=users, password_hasher=hasher, clock=clock)


@pytest.mark.unit
def test_cria_conta_com_senha_guardada_como_hash(
    use_case: CreateUserUseCase, hasher: FakePasswordHasher
) -> None:
    created = use_case.execute(email="Ana@Exemplo.com", name="Ana", password=VALID_PASSWORD)

    assert created.email == "ana@exemplo.com"
    assert created.password_hash == hasher.hash(VALID_PASSWORD)
    assert created.password_hash != VALID_PASSWORD


@pytest.mark.unit
def test_normaliza_email_e_apara_o_nome(use_case: CreateUserUseCase) -> None:
    created = use_case.execute(email="  ANA@exemplo.com ", name="  Ana  ", password=VALID_PASSWORD)

    assert created.email == "ana@exemplo.com"
    assert created.name == "Ana"


@pytest.mark.unit
def test_email_ja_cadastrado_e_recusado(use_case: CreateUserUseCase) -> None:
    use_case.execute(email="ana@exemplo.com", name="Ana", password=VALID_PASSWORD)

    with pytest.raises(EmailAlreadyTaken):
        use_case.execute(email="ANA@EXEMPLO.COM", name="Outra", password=VALID_PASSWORD)


@pytest.mark.unit
def test_a_credencial_nunca_aparece_no_repr(use_case: CreateUserUseCase) -> None:
    """Que o hash real seja irreversível é responsabilidade do adapter argon2;
    aqui só se verifica que a credencial não vaza pelo repr da entity."""
    created = use_case.execute(email="ana@exemplo.com", name="Ana", password=VALID_PASSWORD)

    assert "password_hash" not in repr(created)
    assert VALID_PASSWORD not in repr(created)
