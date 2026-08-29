"""Erros de domínio.

Não conhecem HTTP. A tradução para status code acontece em `api/errors.py`.
Ver `.claude/rules/errors.md`.
"""


class DomainError(Exception):
    """Raiz de todo erro de negócio deste domínio."""


class UserNotFound(DomainError):
    """O usuário pedido não existe."""


class EmailAlreadyTaken(DomainError):
    """Já existe uma conta com este e-mail."""


class InvalidCredentials(DomainError):
    """E-mail inexistente ou senha errada.

    Deliberadamente não distingue os dois casos: distinguir entrega enumeração
    de contas. Ver `.claude/rules/security.md`.
    """


class InvalidRefreshToken(DomainError):
    """O refresh token está ausente, expirado, revogado ou é desconhecido."""


class RefreshTokenReused(InvalidRefreshToken):
    """Um refresh token já consumido foi apresentado de novo.

    Sinal de roubo: quem tinha o token legítimo já o rotacionou. A reação é
    revogar toda a família, derrubando dono e atacante.
    """


class InvalidAccessToken(DomainError):
    """O access token está ausente, expirado ou tem assinatura inválida."""
