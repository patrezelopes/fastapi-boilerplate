from abc import ABC, abstractmethod
from uuid import UUID

from app.entities.user import User


class UserRepository(ABC):
    @abstractmethod
    def add(self, user: User) -> User:
        """Persiste um usuário novo."""

    @abstractmethod
    def get_by_id(self, user_id: UUID) -> User | None:
        """Busca por id. Devolve `None` quando não existe."""

    @abstractmethod
    def get_by_email(self, email: str) -> User | None:
        """Busca por e-mail, insensível a maiúsculas. `None` quando não existe."""

    @abstractmethod
    def search(self, term: str | None, offset: int, limit: int) -> tuple[list[User], int]:
        """Página de usuários e o total que casa com o termo."""

    @abstractmethod
    def update(self, user: User) -> User:
        """Grava alterações de um usuário existente."""

    @abstractmethod
    def delete(self, user_id: UUID) -> bool:
        """Remove. Devolve `False` quando não havia nada para remover."""
