---
name: monorepo-navigation
description: Onde mexer neste monorepo — backend, um dos três frontends, o contrato ou o kit do agente — e como rodar cada projeto isolado ou a stack inteira. Use ao começar a trabalhar, ao procurar onde algo vive, ao escolher o frontend, ou quando um comando falhar por estar no diretório errado.
---

# Navegação do monorepo

## O mapa

```
Makefile · docker-compose.yml    orquestram tudo, da raiz
.env                             lido pelo compose e pelo backend
contract/openapi.yaml            a fonte da verdade da API
backend/                         FastAPI, Clean Architecture
frontend/react · vue · angular   três SPAs equivalentes
e2e/                             o roteiro Playwright, um só para os três
.claude/                         skills, commands, agents, rules
specs/                           as specs numeradas
```

Raiz, `backend/` e cada frontend têm **seu próprio** `Makefile` e `docker-compose.yml`.
A raiz orquestra; os filhos rodam sozinhos.

## Escolher o frontend

```bash
make up                  # db + api + react (padrão)
make up FRONT=angular
make up FRONT=vue
make up FRONT=none       # só backend
```

`FRONT` vale para `up`, `build`, `lint`, `test`, `logs`, `e2e`. Já `make ci`,
`make codegen` e `make e2e-all` sempre atravessam os três.

Implementado com perfis do Compose: sem o perfil, o serviço web nem é construído. Os três
mapeiam a mesma porta do host, então trocar de frontend derruba o anterior — o
`scripts/e2e.sh` faz isso sozinho.

## Onde mexer

| A mudança é… | Vá para |
|---|---|
| regra de negócio, rota, persistência | `backend/` |
| tela, formulário, estado da UI | `frontend/<framework>/` — **nos três** |
| campo novo na API, código de status novo | `contract/openapi.yaml` **primeiro** |
| como o agente trabalha aqui | `.claude/` |
| decisão de arquitetura | `docs/adr/` |

## Rodar um projeto isolado

```bash
make -C backend up            # api + db, sem frontend
make -C backend lint test
make -C frontend/vue lint     # só os portões do Vue
```

O backend é um projeto uv próprio: da raiz, use `uv --directory backend run ...`.
Cada frontend é um projeto pnpm próprio.

## Primeira vez na máquina

```bash
cp .env.example .env
make install     # backend + os três frontends + e2e
make up          # sobe a stack e espera o healthcheck
make migrate
make seed
```

## Ordem de uma mudança que atravessa tudo

```
contract/openapi.yaml  →  make codegen  →  backend  →  os três frontends
```

Nunca ao contrário. Ver a skill `api-contract`.

## Comando falhando?

Quase sempre é diretório errado. `make` da raiz orquestra; `make -C <projeto>` roda o
projeto. Um alvo exclusivo da raiz — `codegen`, `e2e`, `e2e-all`, `contract-test`,
`skills-diff` — não existe nos filhos.

Se o `up` reclamar de porta ocupada, algum web de outro perfil ficou de pé:
`make down` derruba os três perfis de uma vez.
