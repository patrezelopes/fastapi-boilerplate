---
numero: 0003
titulo: CRUD de usuários protegido
status: implementada
criada: 2026-08-28
---

# 0003 — CRUD de usuários protegido

## Problema

A fatia de referência precisa de um recurso que atravesse todas as camadas com operações
de leitura, escrita e remoção — algo que sirva de modelo para copiar. O health check é
raso demais e o fluxo de autenticação é atípico demais para servir de exemplo de CRUD.

## Comportamento esperado

Quem está autenticado pode listar usuários, ver um, criar, editar parcialmente e remover.

A listagem é paginada e aceita busca parcial por nome ou e-mail, insensível a maiúsculas.
Pedir uma página além do fim devolve lista vazia, não erro.

A edição é parcial: campos ausentes ficam como estavam. Só nome e e-mail são editáveis —
senha tem fluxo próprio, fora desta spec.

## Critérios de aceite

- [x] As cinco operações exigem Bearer válido; sem ele, 401
- [x] `GET /users` devolve `{items, meta}` com `page`, `per_page`, `total`, `total_pages`
- [x] `per_page` acima de 100 devolve 422
- [x] Página além do fim devolve `items` vazio e 200
- [x] A busca casa parte do nome ou do e-mail, ignorando maiúsculas
- [x] `POST /users` devolve 201 e 409 se o e-mail já existir
- [x] `GET /users/{id}` devolve 404 para id inexistente
- [x] `PATCH /users/{id}` altera só os campos enviados
- [x] `PATCH` com e-mail já usado por outra pessoa devolve 409
- [x] `PATCH` com corpo vazio devolve 422
- [x] `DELETE /users/{id}` devolve 204, e 404 se já não existir
- [x] Nenhuma resposta expõe o hash da senha

## Caminhos de erro

| Situação | Comportamento esperado |
|---|---|
| sem token ou token inválido | 401 |
| id inexistente | 404 |
| e-mail duplicado ao criar ou editar | 409 |
| `per_page` fora do limite, corpo vazio no PATCH | 422 |
| id que não é UUID | 422 |

## Fora de escopo

Papéis e permissões — qualquer autenticado pode tudo, por ora. Troca de senha, desativação
em vez de remoção, auditoria, ordenação configurável.

## Perguntas em aberto

Remoção é física. Se auditoria virar requisito, vira remoção lógica — outra spec.
