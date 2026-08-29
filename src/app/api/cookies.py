"""O cookie do refresh token.

Mora na camada `api` porque cookie é detalhe de transporte. Os valores vêm do
container, e não de um import de `config` — a dependência apontaria para fora.
"""

from dataclasses import dataclass

from fastapi import Response

REFRESH_COOKIE_NAME = "refresh_token"


@dataclass(frozen=True)
class RefreshCookie:
    """Onde e como o refresh token viaja. Ver ADR-0004."""

    secure: bool
    domain: str
    path: str

    def set_on(self, response: Response, raw_token: str, max_age: int) -> None:
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=raw_token,
            max_age=max_age,
            httponly=True,
            secure=self.secure,
            samesite="lax",
            domain=self.domain or None,
            path=self.path,
        )

    def clear_on(self, response: Response) -> None:
        response.delete_cookie(
            key=REFRESH_COOKIE_NAME,
            httponly=True,
            secure=self.secure,
            samesite="lax",
            domain=self.domain or None,
            path=self.path,
        )
