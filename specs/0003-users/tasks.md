# 0003 — Tarefas

## Contrato
- [x] Cinco operações sobre `/users`, com `{items, meta}` e `per_page` limitado a 100

## Núcleo
- [x] `Page[T]` com `total_pages` arredondando para cima
- [x] `search`, `update` e `delete` no port
- [x] `ListUsersUseCase` com busca opcional e página vazia além do fim
- [x] `GetUserUseCase`, `UpdateUserUseCase` (parcial, com conflito de e-mail), `DeleteUserUseCase`
- [x] Testes unitários dos quatro, incluindo manter o próprio e-mail sem conflito

## Persistência
- [x] `SqlAlchemyUserRepository.search` com `LIKE` insensível e contagem
- [x] Testes de integração: ordenação, paginação, busca, unicidade

## HTTP
- [x] DTOs, com `UserUpdate` recusando corpo vazio
- [x] Router protegido no nível do `APIRouter`
- [x] As cinco rotas, com `responses=` alimentando o OpenAPI gerado
- [x] Testes de integração dos critérios de aceite

## Fechamento
- [x] Nenhuma resposta expõe `password_hash` — verificado em teste
- [x] `make ci` verde
