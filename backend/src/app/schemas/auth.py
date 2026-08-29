from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.contract import Email, Name, Secret


class RegisterRequest(BaseModel):
    # `extra="forbid"` traduz o `additionalProperties: false` do contrato. Sem
    # ele, um `passwrod` digitado errado no cliente cria a conta com uma senha
    # que ninguém escolheu — em silêncio.
    model_config = ConfigDict(extra="forbid")

    email: Email
    name: Name
    password: Secret


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: Email
    password: str


class TokenResponse(BaseModel):
    """O refresh token não aparece aqui: ele viaja em cookie httpOnly."""

    access_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int
