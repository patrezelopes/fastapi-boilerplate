from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """O refresh token não aparece aqui: ele viaja em cookie httpOnly."""

    access_token: str
    token_type: Literal["Bearer"] = "Bearer"
    expires_in: int
