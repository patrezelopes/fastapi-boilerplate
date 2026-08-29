# FastAPI Boilerplate — LopesTech

Backend em **FastAPI**, referência de uma família de seis boilerplates que compartilham
arquitetura, contrato de API e portões de qualidade.

Traz também os **três frontends de referência** — React, Vue e Angular — equivalentes por
contrato: as mesmas telas, o mesmo comportamento, verificados por um único roteiro do
Playwright que roda contra os três.

```
backend/                         FastAPI, Clean Architecture
frontend/react · vue · angular   três SPAs equivalentes
contract/openapi.yaml            a fonte da verdade da API
e2e/                             um roteiro Playwright, para os três
```

Raiz, `backend/` e cada frontend têm seu próprio `Makefile` e `docker-compose.yml`.
Ver a skill `monorepo-navigation`.

## Como trabalhamos aqui

Mudança de comportamento nasce de uma spec em `specs/`, não no editor.
Ver a skill `spec-driven` e os comandos `/spec`, `/plan`, `/implement`, `/verify`.

## Arquitetura

Clean Architecture. A dependência aponta para dentro:

```
config  →  api | repositories  →  use_cases  →  entities
```

`entities` e `use_cases` não conhecem HTTP, ORM nem framework. Isso é verificado por
`import-linter` no CI, não apenas documentado.

@.claude/rules/architecture.md

## Contrato da API

`contract/openapi.yaml` é a fonte da verdade — versionado idêntico nos seis repositórios
da família. Alimenta a suíte de testes de contrato e os tipos TypeScript dos frontends.

Mudança na API vai **sempre** nesta ordem: contrato primeiro, implementação depois.

## Comandos

```bash
make up                  # db + api + react
make up FRONT=angular    # troca o frontend
make up FRONT=none       # só backend
make lint                # portões do backend + do frontend selecionado
make test
make ci                  # tudo que o CI roda
make codegen             # regera os tipos dos três frontends do contrato
make contract-test       # o backend cumpre contract/openapi.yaml?
make e2e FRONT=vue       # Playwright contra um SPA
make e2e-all             # o mesmo roteiro nos três
```

Os filhos rodam sozinhos: `make -C backend test`, `make -C frontend/vue lint`.



## Regras

@.claude/rules/naming.md
@.claude/rules/errors.md
@.claude/rules/testing.md
@.claude/rules/security.md
@.claude/rules/frontend.md
@.claude/rules/git.md

## Ao commitar

Conventional Commits com escopo (`feat(backend):`, `fix(react):`).
**Sem `Co-Authored-By` de assistente, sem trailer de sessão, sem "Generated with".**
