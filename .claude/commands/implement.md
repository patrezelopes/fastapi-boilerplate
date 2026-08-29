---
description: Executa as tarefas de uma spec, camada por camada
argument-hint: <numero-da-spec>
---

Implemente a spec **$ARGUMENTS**.

1. Leia `specs/$ARGUMENTS-*/spec.md`, `plan.md` e `tasks.md`.
2. Leia `.claude/rules/architecture.md`, `errors.md`, `testing.md` e `naming.md`.

Execute as tarefas **na ordem do `tasks.md`**. A ordem existe por causa da regra de
dependência; alterá-la produz código que precisa ser refeito.

Regras de execução:

- Uma tarefa por vez. Marque `[x]` em `tasks.md` ao concluir cada uma.
- Teste junto da camada, não no fim. Um use case novo sai com seu teste unitário.
- `entities` e `use_cases` são escritos e testados **sem banco de pé**.
- Se a spec toca a API: contrato primeiro, `make codegen` depois, código por último.
- Comportamento novo entra nos **três** frontends, nunca em um só.
- Rode o portão relevante ao terminar cada camada, não acumule.

Se durante a implementação o plano se mostrar errado, **pare**. Atualize `plan.md`
explicando o que mudou e por quê, e siga. Não implemente contra um plano que você já
sabe estar errado, e não conserte o plano em silêncio.

Ao terminar todas as tarefas, rode `make ci` e sugira o agente `arch-reviewer`.
