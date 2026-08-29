# NNNN — Plano

> Como. Escrito depois da `spec.md` e antes de qualquer código.

## Mudança no contrato

Alguma rota, campo ou código de status muda em `contract/openapi.yaml`?
Se sim, o trecho proposto. Se não, escreva "nenhuma".

A mudança é compatível ou quebra? Ver a skill `api-contract`.

## Backend

Camadas tocadas, na ordem da regra de dependência.

| Camada | Arquivo | Novo ou alterado | O que faz |
|---|---|---|---|
| entities | | | |
| use_cases | | | |
| use_cases/ports | | | |
| repositories | | | |
| migrations | | | |
| schemas | | | |
| api | | | |
| config | | | |

## Frontends

O que muda nos três. Se muda em um só, justifique — a regra é paridade.

| Camada | Arquivo | O que faz |
|---|---|---|
| domain | | |
| data | | |
| features | | |
| ui | | |

## Decisões de desenho

Para cada decisão que não é óbvia:

**Decisão.** O que foi escolhido.
**Alternativa descartada.** O que mais foi considerado.
**Por quê.** O que fez a balança pender.

Decisão cara o bastante para valer uma ADR vai para `docs/adr/`, não aqui.

## Riscos

O que pode dar errado, e o sinal de que está dando.

## Estratégia de teste

Onde ficam os testes unitários, o que exige banco real, o que entra no roteiro do
Playwright.
