from dataclasses import dataclass, field


@dataclass(frozen=True)
class IssuedSession:
    """O par de tokens emitido por um login ou por uma rotação.

    `refresh_token` sai do `repr` porque é credencial: nunca deve cair em log.
    Quem transporta cada um — corpo da resposta ou cookie — é decisão da camada
    `api`, não deste tipo.
    """

    access_token: str
    expires_in: int
    refresh_expires_in: int
    refresh_token: str = field(repr=False, default="")
