from datetime import datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    created_at: datetime
    updated_at: datetime


class UserCreate(BaseModel):
    email: EmailStr = Field(max_length=254)
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=12, max_length=128)


class UserUpdate(BaseModel):
    email: EmailStr | None = Field(default=None, max_length=254)
    name: str | None = Field(default=None, min_length=1, max_length=120)

    @model_validator(mode="after")
    def _reject_empty_body(self) -> Self:
        if self.email is None and self.name is None:
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
