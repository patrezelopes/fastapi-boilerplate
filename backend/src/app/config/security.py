"""Adapters de segurança — implementam os ports de hash, tokens e relógio."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher as Argon2Hasher
from argon2.exceptions import Argon2Error

from app.entities.errors import InvalidAccessToken
from app.use_cases.ports.clock import Clock
from app.use_cases.ports.password_hasher import PasswordHasher
from app.use_cases.ports.token_service import AccessTokenService, RefreshTokenService

# Não é credencial de ninguém: é a entrada usada para derivar um hash de
# descarte, cujo único papel é gastar o mesmo tempo que uma conferência real.
_DUMMY_PASSWORD = "senha-descartavel-para-equalizar-o-tempo"  # nosec B105


class SystemClock(Clock):
    def now(self) -> datetime:
        return datetime.now(UTC)


class Argon2PasswordHasher(PasswordHasher):
    """argon2id, com os parâmetros padrão da biblioteca."""

    def __init__(self) -> None:
        self._hasher = Argon2Hasher()
        self._dummy_hash = self._hasher.hash(_DUMMY_PASSWORD)

    def hash(self, plain_password: str) -> str:
        return self._hasher.hash(plain_password)

    def verify(self, plain_password: str, password_hash: str) -> bool:
        try:
            return self._hasher.verify(password_hash, plain_password)
        except Argon2Error, ValueError:
            return False

    def dummy_hash(self) -> str:
        return self._dummy_hash


class JwtAccessTokenService(AccessTokenService):
    def __init__(self, secret: str, issuer: str, ttl_seconds: int, clock: Clock) -> None:
        self._secret = secret
        self._issuer = issuer
        self._ttl_seconds = ttl_seconds
        self._clock = clock

    def issue(self, user_id: UUID) -> tuple[str, int]:
        issued_at = self._clock.now()
        payload = {
            "sub": str(user_id),
            "iss": self._issuer,
            "iat": issued_at,
            "exp": issued_at + timedelta(seconds=self._ttl_seconds),
        }
        return jwt.encode(payload, self._secret, algorithm="HS256"), self._ttl_seconds

    def decode(self, token: str) -> UUID:
        """Valida assinatura, emissor e expiração.

        A expiração é conferida contra o `Clock` injetado, e não contra o relógio
        de parede do PyJWT: senão a dependência ficaria pela metade e a validade
        do token seria impossível de testar de forma determinística.
        """
        try:
            payload = jwt.decode(
                token,
                self._secret,
                algorithms=["HS256"],
                issuer=self._issuer,
                options={"require": ["sub", "exp", "iss"], "verify_exp": False},
            )
            expires_at = datetime.fromtimestamp(float(payload["exp"]), tz=UTC)

            if expires_at <= self._clock.now():
                raise InvalidAccessToken

            return UUID(payload["sub"])
        except (jwt.PyJWTError, ValueError, KeyError, TypeError, OverflowError) as exc:
            raise InvalidAccessToken from exc


class Sha256RefreshTokenService(RefreshTokenService):
    """Token opaco de 256 bits, guardado apenas como SHA-256.

    Não usa argon2 de propósito: o token é aleatório e de entropia alta, então
    não há o que atacar por dicionário — e a rotação consulta o hash a cada
    requisição de renovação, onde o custo de argon2 seria desperdício.
    """

    def generate(self) -> tuple[str, str]:
        raw_token = secrets.token_urlsafe(32)
        return raw_token, self.hash(raw_token)

    def hash(self, raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
