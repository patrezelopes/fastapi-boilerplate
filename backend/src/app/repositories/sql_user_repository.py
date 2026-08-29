from collections.abc import Callable
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.entities.user import User
from app.repositories.models.user import UserModel
from app.use_cases.ports.user_repository import UserRepository


class SqlAlchemyUserRepository(UserRepository):
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory

    def add(self, user: User) -> User:
        with self._session_factory() as session:
            session.add(_to_model(user))
            session.commit()
        return user

    def get_by_id(self, user_id: UUID) -> User | None:
        with self._session_factory() as session:
            model = session.get(UserModel, user_id)
            return _to_entity(model) if model is not None else None

    def get_by_email(self, email: str) -> User | None:
        with self._session_factory() as session:
            model = session.scalars(
                select(UserModel).where(func.lower(UserModel.email) == email.lower())
            ).first()
            return _to_entity(model) if model is not None else None

    def search(self, term: str | None, offset: int, limit: int) -> tuple[list[User], int]:
        with self._session_factory() as session:
            criteria = select(UserModel)
            counter = select(func.count()).select_from(UserModel)

            if term is not None:
                pattern = f"%{term.lower()}%"
                matches = or_(
                    func.lower(UserModel.email).like(pattern),
                    func.lower(UserModel.name).like(pattern),
                )
                criteria = criteria.where(matches)
                counter = counter.where(matches)

            models = session.scalars(
                criteria.order_by(UserModel.created_at.desc(), UserModel.id)
                .offset(offset)
                .limit(limit)
            ).all()
            total = session.scalar(counter) or 0

            return [_to_entity(model) for model in models], total

    def update(self, user: User) -> User:
        with self._session_factory() as session:
            model = session.get(UserModel, user.id)
            if model is None:
                return user
            model.email = user.email
            model.name = user.name
            model.password_hash = user.password_hash
            model.updated_at = user.updated_at
            session.commit()
        return user

    def delete(self, user_id: UUID) -> bool:
        with self._session_factory() as session:
            model = session.get(UserModel, user_id)
            if model is None:
                return False
            session.delete(model)
            session.commit()
            return True


def _to_entity(model: UserModel) -> User:
    return User(
        id=model.id,
        email=model.email,
        name=model.name,
        created_at=model.created_at,
        updated_at=model.updated_at,
        password_hash=model.password_hash,
    )


def _to_model(user: User) -> UserModel:
    return UserModel(
        id=user.id,
        email=user.email,
        name=user.name,
        password_hash=user.password_hash,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
