from uuid import UUID

from app.entities.errors import UserNotFound
from app.entities.user import User
from app.use_cases.ports.user_repository import UserRepository


class GetUserUseCase:
    def __init__(self, user_repository: UserRepository) -> None:
        self._users = user_repository

    def execute(self, *, user_id: UUID) -> User:
        user = self._users.get_by_id(user_id)

        if user is None:
            raise UserNotFound

        return user
