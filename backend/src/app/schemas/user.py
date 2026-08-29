from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, model_validator

from app.schemas.contract import Email, Name, Secret


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Email
    name: Name
    password: Secret


class UserUpdate(BaseModel):
    """Atualização parcial: campo ausente permanece inalterado.

    Campo presente com ``null`` é outra coisa — é violação do schema, porque não
    existe "apagar o e-mail". O tipo opcional funde os dois estados, então quem
    os separa é o ``model_fields_set``, que sabe quais chaves de fato vieram.
    """

    model_config = ConfigDict(extra="forbid")

    email: Email | None = None
    name: Name | None = None

    @model_validator(mode="after")
    def _reject_null_and_empty_body(self) -> Self:
        explicitamente_nulos = [
            campo
            for campo in ("email", "name")
            if campo in self.model_fields_set and getattr(self, campo) is None
        ]
        if explicitamente_nulos:
            raise ValueError(f"{', '.join(explicitamente_nulos)}: não pode ser nulo")

        if not self.model_fields_set:
            raise ValueError("informe ao menos um campo para atualizar")

        return self


class PageMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class UserPage(BaseModel):
    items: list[UserResponse]
    meta: PageMeta
