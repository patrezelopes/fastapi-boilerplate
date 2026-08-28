---
name: fastapi-persistence
description: Models SQLAlchemy, migrations Alembic e repositories neste boilerplate — tradução entity ↔ model, sessão, e como criar e aplicar migration. Use ao adicionar tabela ou coluna, ao escrever repository, ao mexer em migration, ou quando o schema divergir dos models.
---

# Persistência

## As três peças

```
app/repositories/models/<recurso>.py          a tabela
app/use_cases/ports/<recurso>_repository.py   o contrato
app/repositories/sql_<recurso>_repository.py  o adapter que liga as duas
migrations/versions/                          a evolução do schema
```

## Model

```python
class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
```

- `sa.Uuid` genérico, não o tipo do dialeto — mantém o model portável.
- `DateTime(timezone=True)` sempre. Datetime sem fuso vira bug de expiração de token.
- Todo model novo entra em `app/repositories/models/__init__.py`, senão o Alembic não o vê.
- Nada de método de negócio aqui. Isso é da entity.

## Repository

Recebe a **fábrica de sessões**, não a sessão nem o `Database` de `config`:

```python
def __init__(self, session_factory: Callable[[], Session]) -> None:
    self._session_factory = session_factory

def get_by_id(self, user_id: UUID) -> User | None:
    with self._session_factory() as session:
        model = session.get(UserModel, user_id)
        return _to_entity(model) if model is not None else None
```

Uma sessão por operação, aberta em `with`. `commit()` explícito em toda escrita.
Cada arquivo traz `_to_entity` e `_to_model` no fim — a tradução mora aqui e em nenhum
outro lugar.

## Migrations

```bash
uv run alembic revision --autogenerate -m "descricao curta"
uv run alembic upgrade head          # ou: make migrate
uv run alembic downgrade -1
```

**Sempre leia a migration gerada antes de commitar.** O autogenerate erra em renomeação
(vira drop + add, perdendo dados), em mudança de tipo e em constraint nomeada.

Toda migration tem `downgrade()` que funciona de verdade. Um `downgrade` com `pass` é uma
migration sem volta.

O `script_location` no `alembic.ini` é `migrations` — o diretório se chama assim, e não
`alembic`.

## Unicidade é do banco

O caso de uso confere antes e lança `EmailAlreadyTaken`, mas isso é uma corrida: duas
requisições simultâneas passam as duas pela conferência. A constraint `unique` no banco é
o que de fato garante — e há teste de integração que a exercita.

## Datetime

Grave sempre com fuso, vindo do port `Clock`. Nunca `datetime.now()` sem `tz` e nunca
`datetime.utcnow()`, que é ingênuo e está obsoleto.
