# 0002 — Tarefas

## Contrato
- [x] Cinco operações de auth em `contract/openapi.yaml`, com `problem+json` nos erros

## Núcleo — roda sem banco
- [x] `User` e `RefreshToken` em `entities/`
- [x] Erros de domínio, incluindo `RefreshTokenReused`
- [x] Os cinco ports
- [x] `CreateUserUseCase` com normalização de e-mail e recusa de duplicata
- [x] `AuthenticateUserUseCase` com equalização de tempo
- [x] `RefreshSessionUseCase` com rotação e revogação de família
- [x] `RevokeSessionUseCase`, silencioso para token desconhecido
- [x] `GetAuthenticatedUserUseCase`
- [x] Testes unitários dos cinco, com fakes

## Infraestrutura
- [x] `Argon2PasswordHasher` com `dummy_hash`
- [x] `JwtAccessTokenService` validando `exp` pelo `Clock`
- [x] `Sha256RefreshTokenService`
- [x] Testes unitários dos adapters, incluindo token forjado e emissor errado
- [x] Models, migration e os dois repositories
- [x] Testes de integração contra Postgres, incluindo revogação de família

## HTTP
- [x] DTOs, sem o refresh no corpo
- [x] `RefreshCookie` — `httpOnly`, `SameSite=Lax`, path restrito, host-only
- [x] `current_user` com `HTTPBearer(auto_error=False)`
- [x] As cinco rotas
- [x] Handler global RFC 9457
- [x] Testes de integração dos critérios de aceite, incluindo reuso de refresh

## Fechamento
- [x] `make arch`, `make test` (≥90%), `make ci` verdes
