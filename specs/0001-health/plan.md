# 0001 — Plano

## Mudança no contrato

Nenhuma. As duas rotas já constam de `contract/openapi.yaml`.

## Backend

| Camada | Arquivo | O que faz |
|---|---|---|
| entities | `entities/health_status.py` | `HealthStatus(alive, ready)` |
| use_cases | `use_cases/check_health.py` | `execute_liveness` e `execute_readiness` |
| ports | `use_cases/ports/health_repository.py` | `is_alive` / `is_ready` |
| repositories | `repositories/health_repository.py` | `SELECT 1` no engine |
| schemas | `schemas/health.py` | `HealthResponse` |
| api | `api/health.py` | 200, ou 503 quando não pronto |

## Decisões de desenho

**Liveness não toca no banco.** Alternativa descartada: uma sonda só, que verifica tudo.
Rejeitada porque uma queda do banco reiniciaria em cascata processos saudáveis.

**O repository recebe o `Engine`, não o `Database` de `config`.** Alternativa descartada:
injetar o wrapper. Rejeitada porque `repositories → config` é dependência para fora, e o
`import-linter` acusa.

## Riscos

Uma sonda de readiness lenta pendura o orquestrador. Mitigado por falhar em vez de esperar.
