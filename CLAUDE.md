# FastAPI Boilerplate — LopesTech

Backend em **FastAPI**, referência de uma família de seis boilerplates que compartilham
arquitetura, contrato de API e portões de qualidade.

> Os três frontends (React, Vue, Angular) chegam na Fase 2 e a reorganização em monorepo
> na Fase 3. Ver o roadmap da família.

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
make up                  # db + api
make lint                # portões
make test                # testes
make ci                  # tudo que o CI roda
make contract-test       # o backend cumpre contract/openapi.yaml?
```



## Regras

@.claude/rules/naming.md
@.claude/rules/errors.md
@.claude/rules/testing.md
@.claude/rules/security.md
@.claude/rules/git.md

## Ao commitar

Conventional Commits com escopo (`feat(backend):`, `fix(react):`).
**Sem `Co-Authored-By` de assistente, sem trailer de sessão, sem "Generated with".**
