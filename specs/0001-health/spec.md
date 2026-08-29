---
numero: 0001
titulo: Sondas de liveness e readiness
status: implementada
criada: 2026-08-28
---

# 0001 — Sondas de liveness e readiness

## Problema

Um orquestrador precisa distinguir duas perguntas diferentes: *o processo está vivo?* e
*ele consegue atender tráfego?* Uma aplicação recém-iniciada, com o banco ainda fora do ar,
está viva mas não está pronta. Sem essa distinção, o orquestrador reinicia um processo
saudável ou envia tráfego para um que vai falhar.

## Comportamento esperado

Duas sondas independentes.

A de **liveness** responde enquanto o processo estiver de pé. Não toca em dependência
externa — se tocasse, uma indisponibilidade do banco causaria reinício em cascata.

A de **readiness** verifica as dependências externas. Hoje há uma: o banco. Se a conexão
falhar, a sonda reporta indisponibilidade e o orquestrador tira a instância do balanceador
sem matá-la.

## Critérios de aceite

- [x] `GET /api/v1/health` responde 200 com `alive: true`, sem tocar no banco
- [x] `GET /api/v1/health/ready` responde 200 quando o banco responde
- [x] `GET /api/v1/health/ready` responde 503 quando o banco está fora
- [x] Nenhuma das duas exige autenticação
- [x] O corpo segue o schema `HealthResponse` do contrato

## Caminhos de erro

| Situação | Comportamento esperado |
|---|---|
| banco fora do ar | readiness 503, liveness segue 200 |
| banco lento | a sonda não pendura: falha vira 503 |

## Fora de escopo

Sondas de outras dependências (cache, fila) — não existem ainda. Métricas e healthcheck
detalhado por dependência.

## Perguntas em aberto

Nenhuma.
