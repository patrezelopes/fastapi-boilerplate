# FastAPI Boilerplate — LopesTech

Backend em FastAPI com [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html),
autenticação JWT com refresh rotacionado, e um kit completo de desenvolvimento orientado a
spec para trabalhar com o Claude Code.

É a **referência** de uma família de seis boilerplates — FastAPI, Django, NestJS, Spring
Boot, Go e Rust — que compartilham a mesma arquitetura, o mesmo contrato de API e os mesmos
portões de qualidade.

Traz três frontends de referência — **React, Vue e Angular** — equivalentes por contrato:
as mesmas seis telas, o mesmo comportamento, verificados por **um único roteiro do
Playwright** que roda contra os três sem uma linha de diferença.

## Estrutura

```
Makefile · docker-compose.yml    orquestram tudo, da raiz
contract/openapi.yaml            a fonte da verdade da API
backend/                         FastAPI · Clean Architecture
frontend/react · vue · angular   três SPAs equivalentes
e2e/                             um roteiro Playwright, para os três
.claude/ · specs/ · docs/        o kit de trabalho orientado a spec
```

Raiz, `backend/` e cada frontend têm **seu próprio** `Makefile` e `docker-compose.yml`.
A raiz orquestra; os filhos rodam sozinhos.

## Arquitetura

```
src/app/
├── entities/        Enterprise Business Rules — sem framework, sem I/O
├── use_cases/       Application Business Rules
│   └── ports/       as interfaces que os casos de uso consomem
├── repositories/    Interface Adapters — acesso a dados
│   └── models/      modelos SQLAlchemy
├── api/             Interface Adapters — rotas, DTOs de transporte, erros
├── schemas/         modelos Pydantic de entrada e saída
├── config/          Frameworks & Drivers — settings, banco, segurança, DI
└── main.py
```

### A regra de dependência

```
config  →  api | repositories  →  use_cases  →  entities
```

A seta aponta **para dentro**. `entities` e `use_cases` não conhecem HTTP, ORM nem
framework — e isso é **verificado**, não confiado:

```bash
make arch
```

O `import-linter` roda no pre-commit e no CI, com quatro contratos. Violar a regra falha o
build. Os detalhes estão em [`.claude/rules/architecture.md`](.claude/rules/architecture.md).

## Requisitos

- Python 3.14+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Docker e Docker Compose

## Setup

```bash
cp .env.example .env
make install     # backend + os três frontends + e2e
make up          # db + api + react, aguardando os healthchecks
make migrate
make seed
```

A API sobe em `http://localhost:8000` com documentação em `/docs`, e o frontend em
`http://localhost:5173`.

```bash
make up FRONT=angular    # troca o frontend
make up FRONT=vue
make up FRONT=none       # só backend
```

Implementado com perfis do Compose: sem o perfil, o serviço web nem é construído.

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/v1/health` | — | liveness; não toca no banco |
| GET | `/api/v1/health/ready` | — | readiness; 503 se o banco estiver fora |
| POST | `/api/v1/auth/register` | — | cria conta |
| POST | `/api/v1/auth/login` | — | access token no corpo, refresh em cookie |
| POST | `/api/v1/auth/refresh` | cookie | rotaciona o par |
| POST | `/api/v1/auth/logout` | cookie | revoga e limpa o cookie |
| GET | `/api/v1/auth/me` | Bearer | perfil do token |
| GET | `/api/v1/users` | Bearer | lista paginada, com busca |
| POST | `/api/v1/users` | Bearer | cria |
| GET · PATCH · DELETE | `/api/v1/users/{id}` | Bearer | lê, atualiza parcialmente, remove |

### Autenticação

| | Access | Refresh |
|---|---|---|
| formato | JWT assinado | opaco, 256 bits |
| vida | 15 min | 14 dias |
| onde vive | **memória** do cliente | cookie `httpOnly` |
| rotação | não | a cada uso |

Senhas com **argon2id**. Nenhum token toca `localStorage`. Reusar um refresh já rotacionado
revoga toda a família daquele usuário — é a detecção de roubo.

### Erros — RFC 9457

Toda resposta de erro sai como `application/problem+json`:

```json
{
  "type": "https://lopestech.dev/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "O corpo da requisição contém campos inválidos.",
  "errors": [{ "field": "email", "message": "formato inválido" }]
}
```

## O contrato

[`contract/openapi.yaml`](contract/openapi.yaml) é a fonte da verdade, versionada idêntica
nos seis repositórios da família. Mudança na API vai sempre no contrato primeiro.

```bash
make up
make contract-test    # Schemathesis, gerando casos a partir do contrato
```

## Frontends

```
frontend/
├── react/     React 19 · TanStack Query · Zustand · RHF + Zod
├── vue/       Vue 3.5 · TanStack Query · Pinia · VeeValidate + Zod
└── angular/   Angular 22 · signals · resource() · Reactive Forms
```

Cada um tem seu próprio `Makefile` e `docker-compose.yml`, com os mesmos alvos do backend.

```bash
make -C frontend/react lint test    # portões de um SPA
make codegen                        # regera os tipos dos três do contrato
make e2e FRONT=vue                  # Playwright contra um
make e2e-all                        # o mesmo roteiro nos três
```

### Camadas

```
        ┌──────────────┐
app  ──▶│ features  ui │──▶  data  ──▶  domain
        └──────────────┘
```

`features` e `ui` são irmãs: `features` não conhece componente e `ui` não conhece API.
Quem junta as duas é `app`. Verificado por `dependency-cruiser`.

**`domain/` e `data/` são idênticos nos três** — TypeScript puro, sem framework. O que
precisa de idioma próprio é `features`, `ui` e `app`.

### Sessão no navegador

Access token só em memória; refresh em cookie `httpOnly`. Recarregar a página perde o
access e o cookie o traz de volta em silêncio. A renovação é de voo único: várias
requisições em `401` esperam a mesma promessa — sem isso, a detecção de reuso do backend
derrubaria a sessão tratando o próprio cliente como atacante.

Cobertura: **80%** global e **90%** em `domain/` e `data/`. `app/` fica de fora, porque
quem a verifica é o Playwright.

## Qualidade

```bash
make lint    # todos os portões
make test    # testes com cobertura mínima de 90%
make ci      # exatamente o que o CI roda
```

| Ferramenta | Função |
|---|---|
| **black** · **isort** | formatação e ordenação de imports |
| **ruff** | lint, bugbear, simplificações, complexidade ciclomática |
| **mypy** | tipos estáticos |
| **vulture** | código morto |
| **bandit** | vulnerabilidades e más práticas |
| **radon** | complexidade e manutenibilidade |
| **import-linter** | a regra de dependência |
| **pytest** | testes, cobertura mínima de 90% |

O CI roda **os mesmos hooks** do pre-commit. Vermelho no CI reproduz com `make ci`.

## Testes

```
backend/src/tests/
├── conftest.py       fakes dos ports e fixtures compartilhadas
├── unit/             entities e casos de uso — sem banco
└── integration/      rotas, envelope de erro e repositories
```

```bash
make -C backend test
uv --directory backend run pytest -m unit          # rápido, dispensa Docker
uv --directory backend run pytest -m integration   # Postgres via Testcontainers
```

Os testes de rota usam o container com fakes; os de repository, Postgres de verdade.

## Trabalhando com o Claude Code

Mudança de comportamento nasce de uma spec em `specs/`, não no editor.

```
/spec <feature>   →  specs/NNNN-<slug>/spec.md      o quê e por quê
/plan NNNN        →  plan.md + tasks.md             como
/implement NNNN   →  código, camada por camada
/verify NNNN      →  critérios de aceite + portões
```

O kit em [`.claude/`](.claude/) traz sete skills, quatro comandos, dois agentes de revisão
e seis regras. As specs [`0001`](specs/0001-health/), [`0002`](specs/0002-auth/) e
[`0003`](specs/0003-users/) estão escritas **e** implementadas: são o formato de referência.

## Migrações

```bash
uv --directory backend run alembic revision --autogenerate -m "descricao"
make migrate
```

Leia sempre a migration gerada antes de commitar — o autogenerate erra em renomeação.

## Licença

MIT.
