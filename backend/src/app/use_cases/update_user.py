from uuid import UUID

from app.entities.errors import EmailAlreadyTaken, UserNotFound
from app.entities.user import User
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.user_repository import UserRepository


class UpdateUserUseCase:
    """Atualização parcial: campos ausentes ficam como estavam."""

    def __init__(self, user_repository: UserRepository, clock: Clock) -> None:
        self._users = user_repository
        self._clock = clock

    def execute(
        self,
        *,
        user_id: UUID,
        email: str | None = None,
        name: str | None = None,
    ) -> User:
        current = self._users.get_by_id(user_id)

        if current is None:
            raise UserNotFound

        normalized_email = email.strip().lower() if email is not None else None

        if normalized_email is not None and normalized_email != current.email:
            owner = self._users.get_by_email(normalized_email)
            if owner is not None and owner.id != user_id:
                raise EmailAlreadyTaken

        updated = current.with_profile(
            email=normalized_email,
            name=name.strip() if name is not None else None,
        )

        return self._users.update(
            User(
                id=updated.id,
                email=updated.email,
                name=updated.name,
                created_at=updated.created_at,
                updated_at=self._clock.now(),
                password_hash=updated.password_hash,
            )
        )
