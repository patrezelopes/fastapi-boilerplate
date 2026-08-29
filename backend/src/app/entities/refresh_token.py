from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class RefreshToken:
    """Um token de renovação, guardado apenas como hash.

    Tokens emitidos a partir de um mesmo login compartilham `family_id`. Quando
    um token já consumido reaparece, a família inteira é revogada.
    """

    id: UUID
    user_id: UUID
    family_id: UUID
    expires_at: datetime
    created_at: datetime
    revoked_at: datetime | None = None
    token_hash: str = field(repr=False, default="")

    def is_active_at(self, moment: datetime) -> bool:
        return self.revoked_at is None and self.expires_at > moment

    def has_expired_at(self, moment: datetime) -> bool:
        return self.expires_at <= moment
