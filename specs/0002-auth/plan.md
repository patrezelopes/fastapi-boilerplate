# 0002 — Plano

## Mudança no contrato

Cinco operações em `contract/openapi.yaml`: `register`, `login`, `refresh`, `logout`, `me`.
O `TokenResponse` **não** carrega o refresh token — ele só existe como cookie.

## Backend

| Camada | Arquivo | O que faz |
|---|---|---|
| entities | `entities/user.py` | `User`, com `password_hash` fora do `repr` |
| entities | `entities/refresh_token.py` | `RefreshToken` com `family_id` e revogação |
| entities | `entities/errors.py` | erros de domínio, incluindo `RefreshTokenReused` |
| ports | `ports/user_repository.py`, `ports/refresh_token_repository.py` | persistência |
| ports | `ports/password_hasher.py`, `ports/token_service.py`, `ports/clock.py` | infraestrutura |
| use_cases | `create_user`, `authenticate_user`, `refresh_session`, `revoke_session`, `get_authenticated_user` | |
| repositories | `sql_user_repository.py`, `sql_refresh_token_repository.py` | adapters |
| migrations | `0001_users_and_refresh_tokens.py` | as duas tabelas |
| schemas | `schemas/auth.py` | DTOs |
| api | `api/auth.py`, `api/cookies.py`, `api/dependencies.py` | rotas, cookie, Bearer |
| config | `config/security.py` | argon2, JWT, SHA-256, relógio |

## Decisões de desenho

**Access em memória, refresh em cookie `httpOnly`.** Alternativa descartada: os dois em
`localStorage`, que é o padrão dos tutoriais. Rejeitada porque um XSS levaria a sessão
inteira e persistente. Registrada na ADR-0004 da família.

**Refresh opaco com SHA-256, não JWT nem argon2.** O token é aleatório de 256 bits: não há
o que atacar por dicionário, então argon2 seria custo puro numa consulta que roda a cada
renovação. Opaco em vez de JWT porque precisa ser revogável.

**Rotação com detecção de reuso por família.** Alternativa descartada: refresh de uso
múltiplo. Rejeitada porque não detecta roubo. O custo é uma tabela a mais.

**Um só `CreateUserUseCase` para `/auth/register` e `POST /users`.** A semântica é a mesma;
duas cópias só criariam duas versões para divergir.

**Equalização de tempo no login.** Quando o e-mail não existe, a senha ainda é conferida
contra um hash de descarte. Sem isso, o tempo de resposta entrega quais contas existem.

**O `decode` do JWT valida `exp` contra o `Clock` injetado.** O PyJWT valida contra o
relógio de parede, o que deixaria a injeção pela metade e a validade impossível de testar
de forma determinística.

## Riscos

Cookie `httpOnly` exige CORS com credenciais e lista explícita de origens. `COOKIE_SECURE`
em `false` no desenvolvimento é pegadinha: o `.env.example` avisa.
