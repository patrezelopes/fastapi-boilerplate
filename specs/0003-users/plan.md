# 0003 — Plano

## Mudança no contrato

Cinco operações sobre `/users`, todas exigindo Bearer. Listagem devolve `{items, meta}`
com `PageMeta`; nunca array cru na raiz.

## Backend

| Camada | Arquivo | O que faz |
|---|---|---|
| use_cases | `page.py` | `Page[T]` genérico, com `total_pages` |
| use_cases | `list_users`, `get_user`, `update_user`, `delete_user` | um por operação |
| ports | `ports/user_repository.py` | ganha `search`, `update`, `delete` |
| repositories | `sql_user_repository.py` | busca `LIKE` insensível, paginação e contagem |
| schemas | `schemas/user.py` | `UserCreate`, `UserUpdate`, `UserPage`, `PageMeta` |
| api | `api/users.py` | router com `dependencies=[Depends(current_user)]` |

Criação reaproveita `CreateUserUseCase` da spec 0002.

## Decisões de desenho

**Página além do fim devolve lista vazia, não 404.** Quem pagina não deveria precisar
saber o total de antemão.

**`per_page` limitado a 100 no DTO.** Sem teto, um cliente derruba o banco com uma query.

**`PATCH` com corpo vazio é 422.** Alternativa descartada: aceitar como no-op. Rejeitada
porque quase sempre é erro do cliente, e um 200 silencioso o esconde.

**Um caso de uso por operação.** Um `UserService` com cinco métodos seria menos arquivos,
mas cada método teria dependências que os outros não usam.

**Proteção no router, não em cada rota.** `dependencies=[Depends(current_user)]` no
`APIRouter`: uma rota nova nasce protegida, em vez de nascer aberta por esquecimento.

## Riscos

`LIKE '%termo%'` não usa índice. Aceitável no volume de um boilerplate; com volume real,
vira busca por trigrama ou full-text — outra spec.
