---
numero: 0002
titulo: Autenticação por JWT com refresh rotacionado
status: implementada
criada: 2026-08-28
---

# 0002 — Autenticação por JWT com refresh rotacionado

## Problema

A API não tem autenticação. Qualquer recurso que exija identidade está bloqueado por isso.
Como este é o boilerplate de referência da família, o padrão adotado aqui será copiado nos
outros cinco repositórios — inclusive os erros, se houver.

O risco central é onde o cliente guarda os tokens. O caminho mais comum nos tutoriais,
`localStorage`, entrega a sessão inteira a qualquer XSS.

## Comportamento esperado

Uma pessoa cria conta com e-mail, nome e senha. Faz login e recebe um token de acesso de
vida curta, que o cliente mantém em memória, mais um token de renovação que o navegador
guarda sozinho em cookie e o JavaScript não enxerga.

Enquanto a sessão durar, o cliente troca o token de renovação por um novo par sempre que o
de acesso expira — e o antigo deixa de valer no mesmo instante. Se um token de renovação já
usado aparecer de novo, isso significa que alguém o copiou: a sessão inteira daquela pessoa
cai, tanto a do dono quanto a do atacante.

Ao sair, o token de renovação é revogado e o cookie, apagado.

## Critérios de aceite

- [x] `POST /auth/register` cria a conta e devolve 201 sem expor a senha
- [x] Registrar com e-mail já existente devolve 409
- [x] Senha com menos de 12 caracteres devolve 422
- [x] A senha é guardada com argon2id — nunca em texto puro, nunca reversível
- [x] `POST /auth/login` devolve 200 com o access token no corpo
- [x] O refresh token vai em cookie `httpOnly`, `SameSite=Lax`, path restrito a `/api/v1/auth`
- [x] O refresh token **não** aparece no corpo da resposta
- [x] E-mail inexistente e senha errada produzem a **mesma** resposta 401
- [x] `POST /auth/refresh` devolve um par novo e revoga o anterior
- [x] Reusar um refresh já consumido revoga toda a família e devolve 401
- [x] `POST /auth/logout` revoga o token e limpa o cookie, devolvendo 204
- [x] `GET /auth/me` devolve o usuário do token e 401 sem Bearer válido
- [x] Token expirado, assinatura inválida ou emissor errado devolvem 401

## Caminhos de erro

| Situação | Comportamento esperado |
|---|---|
| e-mail já cadastrado | 409 `/errors/conflict` |
| senha curta ou e-mail malformado | 422 com `errors[]` por campo |
| credenciais erradas | 401 genérico, sem dizer qual campo falhou |
| refresh ausente, expirado ou revogado | 401 e cookie limpo |
| refresh reusado após rotação | 401 e revogação de toda a família |
| access token expirado | 401 |

## Fora de escopo

Recuperação de senha, verificação de e-mail, OAuth, MFA, papéis e permissões. Rate
limiting no login — importante, mas é outra spec.

## Perguntas em aberto

Nenhuma. A decisão de onde guardar cada token está registrada na ADR-0004 da família.
