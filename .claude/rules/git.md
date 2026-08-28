# Git

## Commits — Conventional Commits com escopo

```
<tipo>(<escopo>): <resumo no imperativo, minúsculo, sem ponto final>
```

Tipos: `feat` `fix` `refactor` `test` `docs` `chore` `perf` `build` `ci`
Escopos: `backend` `react` `vue` `angular` `contract` `ci` `docs` `claude`

```
feat(backend): adiciona rotacao de refresh token
fix(react): corrige guarda de rota apos expiracao do access token
chore(contract): fixa per_page maximo em 100
```

Um commit é uma mudança coesa. Se o resumo precisa de "e", provavelmente são dois commits.

## Sem atribuição de ferramenta

A mensagem de commit não carrega `Co-Authored-By` de assistente, nem trailer de sessão,
nem "Generated with". Vale também para corpo de PR. A autoria é de quem versiona.

## Branches

```
feat/0003-users-crud        ← referencia o número da spec
fix/refresh-token-reuse
chore/bump-postgres-18
```

## Pull requests

Uma fase do roadmap, ou uma spec, por PR. O corpo traz:

- link para a spec em `specs/NNNN-*/`
- o que mudou, em uma frase
- como verificar
- o que ficou de fora, se algo ficou

PR não fecha com CI vermelho. PR não fecha sem o critério de aceite da spec satisfeito.

## O que nunca entra

`.env`, segredo, credencial, dump de banco, `node_modules/`, artefato de build,
arquivo de IDE, `.DS_Store`. Se entrou, o segredo é considerado vazado: rotacione,
não apenas remova o commit.

## Histórico

`main` é sempre verde e sempre deployável. Merge por PR, nunca push direto.
Rebase antes de abrir o PR; merge commit ao fechar.
