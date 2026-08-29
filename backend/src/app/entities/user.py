from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class User:
    """Uma conta.

    `password_hash` fica fora do `repr` por regra: a credencial nunca aparece em
    log nem em mensagem de erro. Ver `.claude/rules/security.md`.
    """

    id: UUID
    email: str
    name: str
    created_at: datetime
    updated_at: datetime
    password_hash: str = field(repr=False)

    def with_profile(self, *, email: str | None = None, name: str | None = None) -> User:
        """Devolve uma cópia com nome e e-mail alterados. Campos ausentes ficam como estão."""
        return User(
            id=self.id,
            email=email if email is not None else self.email,
            name=name if name is not None else self.name,
            created_at=self.created_at,
            updated_at=self.updated_at,
            password_hash=self.password_hash,
        )
