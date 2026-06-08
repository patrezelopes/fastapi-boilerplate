# Toda Matemática — Backend

API FastAPI com [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), gerenciamento de dependências via [uv](https://docs.astral.sh/uv/) e containerização com Docker Compose.

## Arquitetura

```
src/app/
├── api/            # Interface Adapters — rotas HTTP
├── schemas/        # Modelos Pydantic (request/response)
├── entities/       # Enterprise Business Rules
├── use_cases/      # Application Business Rules
├── repositories/   # Interface Adapters — acesso a dados
│   └── models/     # Modelos SQLAlchemy (ORM)
├── config/         # Frameworks & Drivers — settings, DB, DI
└── main.py
```

### Regra de dependência

```
config → repositories / api → use_cases → entities
```

| Pasta | Responsabilidade |
|-------|------------------|
| `entities/` | Regras de negócio de alto nível |
| `use_cases/` | Casos de uso e contratos de repositório |
| `repositories/` | Implementação de acesso a dados |
| `repositories/models/` | Modelos SQLAlchemy (ORM) |
| `api/` | Rotas FastAPI |
| `schemas/` | Modelos Pydantic de entrada e saída |
| `config/` | Settings, SQLAlchemy, dependency-injector |

## Requisitos

- Python 3.14+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Docker e Docker Compose

## Setup local

```bash
cp .env.example .env
uv sync --extra dev
uv run uvicorn app.main:app --reload --app-dir src
```

## Qualidade de código (pre-commit)

O projeto usa [pre-commit](https://pre-commit.com/) com ferramentas open source para formatar, analisar tipos e detectar code smells antes de cada commit.

| Ferramenta | Função |
|------------|--------|
| **black** | Formatação de código |
| **isort** | Ordenação de imports |
| **ruff** | Lint rápido (erros, bugbear, complexidade ciclomática, simplificações) |
| **mypy** | Verificação estática de tipos |
| **vulture** | Código morto e símbolos não utilizados |
| **bandit** | Vulnerabilidades e más práticas de segurança |
| **radon** | Complexidade ciclomática e índice de manutenibilidade |
| **pytest** | Testes com cobertura mínima de 90% |

Ferramentas adicionais recomendadas (rodar manualmente ou em CI):

| Ferramenta | Função |
|------------|--------|
| **pytest** | Testes com cobertura mínima de 90% (`make test`) |
| **pip-audit** | Auditoria de vulnerabilidades em dependências |
| **detect-secrets** | Detecção de segredos e credenciais no código |

### Instalação

```bash
uv sync --extra dev
uv run pre-commit install
```

### Uso

```bash
# Roda todos os hooks em todos os arquivos
uv run pre-commit run --all-files

# Roda apenas nos arquivos staged (automático após install)
uv run pre-commit run

# Atualiza versões dos hooks
uv run pre-commit autoupdate

# Atalho via Makefile
make lint

# Mesmo comando executado no GitLab CI
make ci
```

## CI (GitLab)

O pipeline em [`.gitlab-ci.yml`](.gitlab-ci.yml) executa os **mesmos hooks do pre-commit** em merge requests e na branch principal:

```bash
uv sync --extra dev --frozen
uv run pre-commit run --all-files --show-diff-on-failure
```

Para reproduzir localmente o que o CI roda:

```bash
uv sync --extra dev --frozen
make ci
```

### Rodar ferramentas individualmente

```bash
uv run black src alembic
uv run isort src alembic
uv run ruff check --fix src alembic
uv run mypy
uv run vulture
uv run bandit -r src -c pyproject.toml
uv run radon cc src -a
uv run radon mi src
```

## Testes

Estrutura em `src/tests/`:

```
src/tests/
├── conftest.py       # fixtures compartilhadas
├── unit/             # testes isolados (use cases, repositórios, helpers)
└── integration/      # testes HTTP e wiring da aplicação
```

```bash
# Todos os testes com cobertura mínima de 90%
make test

# Apenas unitários ou integração
uv run pytest -m unit
uv run pytest -m integration

# Relatório HTML de cobertura
uv run pytest --cov=app --cov-report=html
```

A cobertura é validada automaticamente no pre-commit (hook `pytest-coverage`).

## Docker

```bash
cp .env.example .env
make build
make up
make down
make restart
```

## Endpoints

| Método | Rota                   | Descrição                          |
|--------|------------------------|------------------------------------|
| GET    | `/api/v1/health`       | Liveness — aplicação está viva     |
| GET    | `/api/v1/health/ready` | Readiness — verifica conexão com DB|

## Migrações (Alembic)

```bash
uv run alembic revision --autogenerate -m "descricao"
uv run alembic upgrade head
```
