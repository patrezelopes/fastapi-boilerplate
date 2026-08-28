---
name: spec-driven
description: O fluxo de trabalho deste repositório — toda mudança de comportamento nasce de uma spec numerada em specs/, passa por plano e tarefas, e só então vira código. Use ao começar qualquer feature, ao receber um pedido vago, ao escrever ou revisar um arquivo em specs/, ou quando perguntarem "por onde começo".
---

# Desenvolvimento orientado a spec

Mudança de comportamento não começa no editor. Começa em `specs/`.

## Quando pular

Correção óbvia de bug, ajuste de formatação, bump de dependência, typo em documentação.
Se a mudança não altera o que o sistema faz do ponto de vista de quem usa, vá direto.

Na dúvida, escreva a spec. Ela é barata; refazer a implementação, não.

## Os quatro passos

```
/spec <nome>    →  specs/NNNN-<slug>/spec.md      o quê e por quê
/plan NNNN      →  plan.md + tasks.md             como
/implement NNNN →  código, camada por camada
/verify NNNN    →  aceite + portões
```

Cada passo produz um artefato revisável antes do próximo. Não pule para `implement` sem
`plan.md`: é ali que as decisões caras aparecem enquanto ainda são baratas de mudar.

## O que vai em cada arquivo

**`spec.md`** — o quê e por quê. Nunca como.
Problema, quem é afetado, comportamento esperado, critérios de aceite verificáveis,
o que está explicitamente fora de escopo. Sem nome de arquivo, sem nome de função.

**`plan.md`** — como.
Mudança no contrato (se houver), camadas tocadas, arquivos novos e alterados, decisões
de desenho com a alternativa descartada e o porquê, riscos.

**`tasks.md`** — passos verificáveis.
Cada tarefa é executável e tem um jeito de saber que terminou. Uma tarefa que não pode
ser verificada está mal escrita.

## Numeração

Sequencial e imutável: `0001-health`, `0002-auth`, `0003-users`, `0004-...`.
Número não é reaproveitado. Spec abandonada vira `status: descartada` no cabeçalho, e fica.

## A ordem da implementação

Numa mudança que atravessa o monorepo, a ordem não é negociável:

```
1. contract/openapi.yaml     o contrato primeiro
2. make codegen              tipos regerados
3. backend                   entities → use_cases → repositories → api
4. frontend                  domain → data → features → ui
5. testes em cada passo, não no fim
```

Começar pela UI produz um backend moldado por acidentes da tela.

## Exemplos vivos

`specs/0001-health`, `0002-auth` e `0003-users` estão escritas **e** implementadas. São o
formato de referência: leia uma antes de escrever a sua.

## Ao terminar

`/verify` roda os critérios de aceite e os portões. Nenhuma spec é dada como concluída
com portão vermelho ou critério não demonstrado.
