---
description: Gera plan.md e tasks.md a partir de uma spec existente
argument-hint: <numero-da-spec>
---

Monte o plano de implementação da spec **$ARGUMENTS**.

1. Leia `specs/$ARGUMENTS-*/spec.md` por inteiro.
2. Leia `.claude/rules/architecture.md` e a skill `clean-architecture`.
3. Se a spec toca a API, leia `contract/openapi.yaml` e a skill `api-contract`.

Produza dois arquivos no diretório da spec.

**`plan.md`** — o **como**:

- mudança no contrato, se houver, com o trecho de OpenAPI proposto
- camadas tocadas no backend, na ordem da regra de dependência
- arquivos novos e arquivos alterados, com caminho
- o que muda nos três frontends
- decisões de desenho: o que foi escolhido, a alternativa descartada, e por quê
- riscos e o que pode dar errado

**`tasks.md`** — passos verificáveis:

- cada tarefa é executável e tem um critério de conclusão explícito
- na ordem: contrato → codegen → backend (entities → use_cases → repositories → api) →
  frontends (domain → data → features → ui)
- teste junto de cada camada, nunca num bloco no fim
- a última tarefa é sempre rodar `make ci`

Uma tarefa que não pode ser verificada está mal escrita. Reescreva-a.

Não escreva código ainda. Ao terminar, mostre os dois arquivos e aponte a decisão mais
cara do plano — a que seria mais trabalhosa de reverter depois.
