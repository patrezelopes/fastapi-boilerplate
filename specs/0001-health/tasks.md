# 0001 — Tarefas

- [x] `HealthStatus` em `entities/`
- [x] Port `HealthRepository` em `use_cases/ports/`
- [x] `CheckHealthUseCase` com os dois caminhos
- [x] Teste unitário com `FakeHealthRepository`
- [x] `SqlAlchemyHealthRepository` sobre o `Engine`
- [x] Teste de integração contra Postgres real, com banco de pé e fora
- [x] `HealthResponse` em `schemas/`
- [x] Rotas em `api/health.py`, com 503 na readiness
- [x] Teste de integração: liveness segue de pé com o banco fora
- [x] `make ci` verde
