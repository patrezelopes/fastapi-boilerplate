from datetime import datetime
from uuid import UUID, uuid4

from app.entities.errors import EmailAlreadyTaken
from app.entities.user import User
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.password_hasher import PasswordHasher
from app.use_cases.ports.user_repository import UserRepository


class CreateUserUseCase:
    """Cria uma conta.

    Serve tanto ao registro público quanto ao POST autenticado de `/users`: as
    duas rotas têm a mesma semântica e diferem apenas em quem pode chamá-las.
    Duplicar a regra em dois casos de uso só criaria duas versões para divergir.
    """

    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
        clock: Clock,
    ) -> None:
        self._users = user_repository
        self._hasher = password_hasher
        self._clock = clock

    def execute(self, *, email: str, name: str, password: str) -> User:
        normalized_email = _normalize_email(email)

        if self._users.get_by_email(normalized_email) is not None:
            raise EmailAlreadyTaken

        moment: datetime = self._clock.now()
        user_id: UUID = uuid4()

        return self._users.add(
            User(
                id=user_id,
                email=normalized_email,
                name=name.strip(),
                created_at=moment,
                updated_at=moment,
                password_hash=self._hasher.hash(password),
            )
        )


def _normalize_email(email: str) -> str:
    return email.strip().lower()
