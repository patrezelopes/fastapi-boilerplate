---
name: api-contract
description: Evoluir contract/openapi.yaml e propagar a mudança para o backend e os três frontends via make codegen. Use ao adicionar ou alterar rota, campo, código de status ou formato de erro; quando o build de um frontend quebrar após mudança de contrato; ou ao avaliar se uma alteração quebra compatibilidade.
---

# O contrato da API

`contract/openapi.yaml` é a fonte da verdade. Ele é versionado **idêntico** nos seis
repositórios da família e alimenta dois consumidores:

- a suíte de testes de contrato, que roda contra qualquer um dos seis backends;
- os tipos TypeScript dos três frontends, gerados por `openapi-typescript`.

## A ordem, sempre

```
1. editar contract/openapi.yaml
2. make codegen              regera os tipos dos três frontends
3. implementar no backend
4. make contract-test        o backend cumpre o contrato?
5. consumir nos três frontends
6. make e2e
```

Implementar primeiro e documentar depois produz seis backends que divergem em detalhe —
exatamente o que a família existe para evitar.

## O build do frontend quebrou depois de mexer no contrato

É o desenho funcionando. Um campo renomeado quebra o `tsc` de propósito, para que a
mudança seja consciente nos três SPAs. Ajuste o consumo; não faça cast nem `any`.

## Mudança compatível ou quebra?

| Compatível | Quebra |
|---|---|
| rota nova | remover rota |
| campo **opcional** novo na resposta | remover ou renomear campo |
| campo opcional novo na requisição | tornar obrigatório um campo que era opcional |
| valor novo em enum **de entrada** | valor novo em enum de saída |
| relaxar validação | apertar validação |

Quebra de compatibilidade exige `/api/v2` ou combinação explícita — e uma ADR.

## Regras do arquivo

- `operationId` em toda operação: é o nome da função gerada. `camelCase`, estável.
- Todo erro referencia uma resposta de `components/responses`. Nada de erro inline.
- Todo `4xx` e `5xx` usa `application/problem+json` com o schema `Problem`.
- Toda listagem devolve `{ items, meta }` com `PageMeta`. Nunca array cru na raiz.
- Todo campo tem `format` quando existir (`uuid`, `email`, `date-time`) e limite de tamanho.
- Todo corpo de entrada declara `additionalProperties: false`.
- Todo parâmetro numérico tem `minimum` **e** `maximum`. Sem teto, o contrato promete
  aceitar um inteiro de 25 dígitos.
- Todo campo de texto que chega ao banco recusa caractere de controle: o byte NUL não cabe
  num `text` do Postgres, e vira 500 na escrita.
- Exemplo em toda resposta de erro.

## O contrato é o limite superior, não só o inferior

A implementação não pode ser **mais restrita** que o contrato. Um contrato que promete mais
do que a API entrega mente para quem o consome, e é tão defeito quanto o contrário.

Casos reais desta família: o `char::is_control()` do Rust recusava o bloco C1, que o padrão
aceita; o `@NotBlank` do Spring recusava uma senha de doze espaços; e o `@Length` do
class-validator contava unidades UTF-16, recusando um nome de sessenta emojis que tem
sessenta pontos de código. Comprimento no JSON Schema é sempre em **pontos de código**.

Ver `docs/adr/0009-rigor-na-borda-e-o-limite-entre-400-e-422.md`.

## Validar

```bash
make contract-test    # o backend de pé cumpre o contrato
make codegen          # os tipos regeram sem erro
```

O `contract-test` **autentica**: ele cadastra uma conta e passa o Bearer. Sem isso, toda
rota protegida devolve 401 e o Schemathesis nunca chega a validar um 200 delas contra o
schema — metade da API fica fora do portão. Foi assim que uma resposta de `/users` com a
paginação no formato errado sobreviveu a duas implementações.

Um `contract-test` verde e um `tsc` verde nos três frontends é o que define "o contrato
está cumprido".

## Sincronia entre os seis repositórios

Alterar o contrato aqui cria dívida nos outros cinco. Registre a mudança na ADR e leve-a
aos demais na mesma leva — um contrato que só vale em um repositório deixou de ser contrato.
