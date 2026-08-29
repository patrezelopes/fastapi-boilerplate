from abc import ABC, abstractmethod


class PasswordHasher(ABC):
    @abstractmethod
    def hash(self, plain_password: str) -> str:
        """Deriva o hash da senha."""

    @abstractmethod
    def verify(self, plain_password: str, password_hash: str) -> bool:
        """Confere a senha contra o hash, sem lançar quando não bate."""

    @abstractmethod
    def dummy_hash(self) -> str:
        """Hash descartável, de custo idêntico ao real.

        Usado para conferir uma senha quando o e-mail não existe, de modo que o
        tempo de resposta não revele quais contas existem.
        """
