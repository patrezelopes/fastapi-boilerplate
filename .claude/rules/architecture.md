# Regra de arquitetura

## A regra de dependência

```
config  →  api | repositories  →  use_cases  →  entities
```

A seta aponta **para dentro**. Nunca para fora.

| Camada | Responsabilidade | Pode importar |
|---|---|---|
| `entities` | Regras de negócio de alto nível. Sem framework, sem I/O. | nada |
| `use_cases` | Casos de uso + **ports** (interfaces de repositório). | `entities` |
| `repositories` | Adapters de persistência que implementam os ports. | `use_cases`, `entities` |
| `api` / `schemas` | Adapters HTTP: rotas, controllers, DTOs. | `use_cases`, `entities` |
| `config` | Settings, banco, container de DI, bootstrap. | todas |

## O que isso proíbe, na prática

- `entities` não importa nada do projeto. Se precisar de algo, o algo está na camada errada.
- `use_cases` não conhece HTTP: nada de status codes, headers, request, response.
- `use_cases` não conhece o ORM: ele fala com **ports**, não com models.
- `repositories` não chama outro `repositories`. Quem orquestra é o use case.
- `api` não fala com `repositories` direto. Passa sempre por um use case.
- Nenhuma camada importa `config`, exceto para tipos de settings.

## Ports ficam com quem os usa

A interface do repositório mora em `use_cases`, não em `repositories`. Quem define o
contrato é quem consome. A implementação depende da interface — não o contrário.

```
use_cases/ports/user_repository.<ext>      ← a interface (o port)
repositories/sql_user_repository.<ext>     ← a implementação (o adapter)
```

## Entities não são models

O model do ORM mora em `repositories/models/`. A entity mora em `entities/`. São coisas
diferentes e o repositório traduz entre elas. Sim, isso é trabalho a mais; é o preço de
poder trocar o banco sem tocar na regra de negócio.

## Fluxo de uma requisição

```
requisição HTTP
  → api: valida o DTO de entrada, resolve o use case pelo container
  → use_case: aplica a regra, chama o port
  → repository: traduz entity ↔ model, fala com o banco
  → use_case: devolve entity ou erro de domínio
  → api: traduz para DTO de saída ou envelope RFC 9457
```

## Isso é verificado, não confiado

O CI falha se a regra for violada. O verificador varia por stack (ver
`.claude/rules/../../docs/architecture.md`), mas o contrato é o mesmo. Uma violação não é
motivo para relaxar a regra — é motivo para mover o código.

## Quando a regra atrapalha

Se cumprir a regra está exigindo contorções grandes, o problema costuma ser o desenho do
caso de uso, não a regra. Antes de abrir exceção, abra uma ADR em `docs/adr/` descrevendo
a tensão. Exceções existem; exceções não documentadas viram bagunça.
