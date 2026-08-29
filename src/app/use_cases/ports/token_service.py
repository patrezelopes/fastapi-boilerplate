from abc import ABC, abstractmethod
from uuid import UUID


class AccessTokenService(ABC):
    @abstractmethod
    def issue(self, user_id: UUID) -> tuple[str, int]:
        """Emite um access token. Devolve o token e sua vida em segundos."""

    @abstractmethod
    def decode(self, token: str) -> UUID:
        """Devolve o id do usuário. Lança `InvalidAccessToken` se não valer."""


class RefreshTokenService(ABC):
    @abstractmethod
    def generate(self) -> tuple[str, str]:
        """Cria um token opaco. Devolve o valor cru e o hash a persistir."""

    @abstractmethod
    def hash(self, raw_token: str) -> str:
        """Deriva o hash de um token cru, para consulta."""
