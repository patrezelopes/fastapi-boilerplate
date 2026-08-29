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
| requisição ilegível | 400 | `/errors/bad-request` |
| entrada que viola o schema | 422 | `/errors/validation` |
| credenciais inválidas ou ausentes | 401 | `/errors/unauthorized` |
| autenticado mas sem permissão | 403 | `/errors/forbidden` |
| recurso inexistente | 404 | `/errors/not-found` |
| método não aceito na rota | 405 | `/errors/method-not-allowed` |
| violação de unicidade | 409 | `/errors/conflict` |
| falha inesperada | 500 | `/errors/internal` |

O prefixo completo do `type` é `https://lopestech.dev`.

### O limite entre 400 e 422

> Se um objeto JSON foi extraído da requisição, o que falhar depois é **422**.
> Se não foi, é **400**.

Corpo que não é JSON, corpo ausente e query string malformada são 400: não há schema a
violar, e portanto não há campo a nomear no `errors[]`.

### O que não está no contrato é recusado

Campo de corpo desconhecido, parâmetro de consulta desconhecido, campo presente com `null`
onde o schema pede string, parâmetro presente e vazio: todos 422. Ignorar em silêncio é a
convenção mais comum, e é o que faz um `passwrod` digitado errado no cliente criar a conta
com uma senha que ninguém escolheu. Ver `docs/adr/0009-*.md`.

E o inverso vale também: a validação **não pode ser mais restrita que o contrato**. Um
contrato que promete mais do que a implementação entrega mente para quem o consome.

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
