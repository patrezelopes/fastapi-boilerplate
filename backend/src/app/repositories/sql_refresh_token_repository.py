from collections.abc import Callable
from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.entities.refresh_token import RefreshToken
from app.repositories.models.refresh_token import RefreshTokenModel
from app.use_cases.ports.refresh_token_repository import RefreshTokenRepository


class SqlAlchemyRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory

    def add(self, token: RefreshToken) -> RefreshToken:
        with self._session_factory() as session:
            session.add(
                RefreshTokenModel(
                    id=token.id,
                    user_id=token.user_id,
                    family_id=token.family_id,
                    token_hash=token.token_hash,
                    expires_at=token.expires_at,
                    created_at=token.created_at,
                    revoked_at=token.revoked_at,
                )
            )
            session.commit()
        return token

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        with self._session_factory() as session:
            model = session.scalars(
                select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
            ).first()
            return _to_entity(model) if model is not None else None

    def revoke(self, token_id: UUID, moment: datetime) -> None:
        with self._session_factory() as session:
            session.execute(
                update(RefreshTokenModel)
                .where(RefreshTokenModel.id == token_id, RefreshTokenModel.revoked_at.is_(None))
                .values(revoked_at=moment)
            )
            session.commit()

    def revoke_family(self, family_id: UUID, moment: datetime) -> None:
        with self._session_factory() as session:
            session.execute(
                update(RefreshTokenModel)
                .where(
                    RefreshTokenModel.family_id == family_id,
                    RefreshTokenModel.revoked_at.is_(None),
                )
                .values(revoked_at=moment)
            )
            session.commit()


def _to_entity(model: RefreshTokenModel) -> RefreshToken:
    return RefreshToken(
        id=model.id,
        user_id=model.user_id,
        family_id=model.family_id,
        expires_at=model.expires_at,
        created_at=model.created_at,
        revoked_at=model.revoked_at,
        token_hash=model.token_hash,
    )
