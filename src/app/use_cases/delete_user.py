from uuid import UUID

from app.entities.errors import UserNotFound
from app.use_cases.ports.user_repository import UserRepository


class DeleteUserUseCase:
    def __init__(self, user_repository: UserRepository) -> None:
        self._users = user_repository

    def execute(self, *, user_id: UUID) -> None:
        if not self._users.delete(user_id):
            raise UserNotFound
