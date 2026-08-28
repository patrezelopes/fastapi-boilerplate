# Erros

## Taxonomia

Erros de **domínio** nascem em `entities` ou `use_cases` e não conhecem HTTP.
Erros de **transporte** nascem em `api` e são a tradução dos primeiros.

```
use_cases lança  →  UserNotFound, EmailAlreadyTaken, InvalidCredentials
api traduz       →  404, 409, 401
```

Um use case nunca devolve um status code. Uma rota nunca inventa uma regra de negócio.

## Mapeamento canônico

| Erro de domínio | HTTP | `type` |
|---|---|---|
| entrada malformada | 422 | `/errors/validation` |
| credenciais inválidas ou ausentes | 401 | `/errors/unauthorized` |
| autenticado mas sem permissão | 403 | `/errors/forbidden` |
| recurso inexistente | 404 | `/errors/not-found` |
| violação de unicidade | 409 | `/errors/conflict` |
| falha inesperada | 500 | `/errors/internal` |

O prefixo completo do `type` é `https://lopestech.dev`.

## O envelope — RFC 9457

`Content-Type: application/problem+json` em **toda** resposta de erro.

```json
{
  "type": "https://lopestech.dev/errors/validation",
  "title": "Validation failed",
  "status": 422,
  "detail": "O corpo da requisição contém campos inválidos.",
  "errors": [{ "field": "email", "message": "formato inválido" }]
}
```

- `title` é estável e legível por máquina. Não interpole dados nele.
- `detail` é específico da ocorrência e legível por humano.
- `errors[]` só aparece em 422.

## Um handler global, não try/catch espalhado

Registre **um** tradutor na camada `api` que capture os erros de domínio e produza o
envelope. Rotas não montam respostas de erro à mão.

## O que nunca vaza

Stack trace, SQL, nome de tabela, caminho de arquivo, valor de variável de ambiente.
Em 500, `detail` é genérico e o diagnóstico vai para o log com um id de correlação:

```json
{ "type": "…/errors/internal", "title": "Internal Server Error",
  "status": 500, "detail": "Erro inesperado. Referência: 7f3a9c21." }
```

## Falhar cedo

Valide na borda, no DTO de entrada. Um use case pode confiar que recebeu dados no formato
certo — o que ele valida é **regra de negócio**, não formato.
