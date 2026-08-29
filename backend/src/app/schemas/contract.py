"""Os tipos de entrada que espelham os schemas de ``contract/openapi.yaml``.

Ficam num módulo só porque a mesma regra vale em mais de um DTO — e porque, se o
contrato mudar, há um lugar único para mudar junto. O teste de contrato é quem
cobra a equivalência.
"""

import re
from typing import Annotated

from pydantic import AfterValidator, Field, StringConstraints

# O `EmailStr` do Pydantic aceita endereços que o contrato não promete, e
# recusa alguns que ele promete. Como o contrato é a fonte da verdade, quem vale
# aqui é o padrão dele — traduzido literalmente.
_EMAIL = re.compile(
    r"^[A-Za-z0-9_%+-]{1,20}(?:\.[A-Za-z0-9_%+-]{1,20}){0,3}"
    r"@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,20}[A-Za-z0-9])?\.){1,3}"
    r"(?!(?:test|invalid|localhost)$)[A-Za-z]{2,10}$"
)

# `\x00` sequer cabe num `text` do Postgres, então aceitá-lo viraria 500 na
# escrita. O bloco C1 (\x80-\x9f) **não** entra: o contrato o aceita, e recusá-lo
# deixaria a API mais restrita do que ela promete.
_CONTROL = re.compile(r"[\x00-\x1f\x7f]")


def _valid_email(value: str) -> str:
    if not _EMAIL.fullmatch(value):
        raise ValueError("formato inválido")
    return value


def _no_control_chars(value: str) -> str:
    if _CONTROL.search(value):
        raise ValueError("contém caractere de controle")
    return value


def _not_blank(value: str) -> str:
    if not value.strip():
        raise ValueError("não pode ser vazio")
    return value


Email = Annotated[str, Field(max_length=254), AfterValidator(_valid_email)]

Name = Annotated[
    str,
    StringConstraints(min_length=1, max_length=120),
    AfterValidator(_not_blank),
    AfterValidator(_no_control_chars),
]

Secret = Annotated[
    str,
    StringConstraints(min_length=12, max_length=128),
    AfterValidator(_no_control_chars),
]

SearchTerm = Annotated[
    str,
    StringConstraints(max_length=120),
    AfterValidator(_no_control_chars),
]
