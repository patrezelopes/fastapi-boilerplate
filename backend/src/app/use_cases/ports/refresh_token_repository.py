from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from app.entities.refresh_token import RefreshToken


class RefreshTokenRepository(ABC):
    @abstractmethod
    def add(self, token: RefreshToken) -> RefreshToken:
        """Persiste um token de renovação."""

    @abstractmethod
    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Busca pelo hash. Devolve `None` quando desconhecido."""

    @abstractmethod
    def revoke(self, token_id: UUID, moment: datetime) -> None:
        """Revoga um token específico."""

    @abstractmethod
    def revoke_family(self, family_id: UUID, moment: datetime) -> None:
        """Revoga todos os tokens ainda ativos de uma família."""
