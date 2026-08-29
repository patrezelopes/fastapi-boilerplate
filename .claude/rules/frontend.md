# Frontend

Vale igualmente para os três SPAs. Onde React, Vue e Angular divergem, diverge só o
idioma — nunca o comportamento.

## Camadas

```
        ┌──────────────┐
app  ──▶│ features  ui │──▶  data  ──▶  domain
        └──────────────┘
```

| Camada | O que é | Pode importar |
|---|---|---|
| `domain/` | tipos e regras puras; espelha as entities do backend | nada |
| `data/` | cliente HTTP, tipos gerados, repositórios | `domain` |
| `features/` | a lógica de cada caso de uso da UI — sem marcação | `data`, `domain` |
| `ui/` | componentes de apresentação | `domain` |
| `app/` | a composição: páginas, rotas, guardas | todas |

`features` e `ui` são **irmãs**, não empilhadas: `features` não conhece componente e `ui`
não conhece API. Quem junta as duas é `app`, e só ela.

O motivo é testabilidade. Um componente de `ui/` roda num storybook sem servidor de pé.
Um hook ou store de `features/` roda num teste sem montar árvore de componentes. Se
`features` pudesse importar `ui`, essa separação evaporaria na primeira página com pressa.

Verificado por `dependency-cruiser` no CI.

## Tipos vêm do contrato

Os tipos de request e response são **gerados** de `contract/openapi.yaml` por
`make codegen`. Não escreva à mão o que o gerador produz, e não edite o arquivo gerado.

Precisa de um campo novo? Muda o contrato primeiro, regera, depois usa.

## Tokens

Access token em **memória** — nunca `localStorage`, nunca `sessionStorage`.
Refresh em cookie `httpOnly`, invisível ao JavaScript.

Um interceptor único cuida de: anexar o `Authorization`, detectar `401`, chamar
`/auth/refresh` uma única vez (requisições concorrentes esperam a mesma promessa) e
repetir a requisição original. Falhou o refresh, derruba a sessão e manda para `/login`.

## Erros

O envelope RFC 9457 é traduzido em um único ponto de `data/`. `errors[]` de um 422 é
mapeado para os campos do formulário pelo nome. Nenhum componente lê `response.status`
cru.

## Estados obrigatórios

Toda tela que busca dados trata **quatro** estados: carregando, vazio, erro, conteúdo.
Uma tela que só trata o caminho feliz não está pronta.

## Acessibilidade

Rótulo associado em todo campo. Foco visível. Navegação por teclado em tudo que é
clicável. Erro de formulário anunciado por leitor de tela. `axe-core` roda dentro do
Playwright e falha o CI.

## Estilo

Tailwind, com os tokens de design em um único arquivo de tema. Sem CSS solto por
componente e sem valor mágico de cor ou espaçamento fora dos tokens.

## Testes

Testing Library, sempre pela perspectiva do usuário: consulte por papel e por texto
acessível, nunca por classe CSS ou id de teste, salvo quando não houver alternativa.
