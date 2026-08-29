# ADR-0004 — Refresh token em cookie httpOnly

- **Status:** aceita
- **Data:** 2026-08-28
- **Contexto:** vale para os seis boilerplates e os três frontends

## Contexto

A fatia de referência inclui autenticação JWT. Onde o cliente guarda os tokens é a decisão
de segurança mais consequente do boilerplate — e a que mais costuma ser copiada errado, já
que a maioria dos tutoriais usa `localStorage`.

Ameaças em jogo: XSS lê qualquer coisa acessível ao JavaScript; CSRF explora cookies
enviados automaticamente; e um token roubado precisa de janela de validade curta.

## Decisão

| | Access | Refresh |
|---|---|---|
| formato | JWT assinado | opaco, aleatório |
| vida | 15 min | 14 dias |
| onde vive | **memória** do cliente | cookie `httpOnly` |
| rotação | não | a cada uso |

O access token vai no corpo da resposta e é mantido em memória — nunca em `localStorage`
ou `sessionStorage`. O refresh vai em cookie `httpOnly; Secure; SameSite=Lax;
Path=/api/v1/auth`, invisível ao JavaScript.

Refresh é **rotacionado** a cada uso. Reuso de um token já consumido invalida toda a
família daquele usuário — é a detecção de roubo.

Contra CSRF: `SameSite=Lax` bloqueia o envio em requisição cross-site; o cookie só é aceito
no path de auth; e toda mutação de negócio exige o header `Authorization`, que um ataque
cross-site não consegue forjar.

## Alternativas descartadas

**Ambos em `localStorage`.** O caminho mais comum e o mais frágil: um XSS entrega a sessão
inteira e persistente. Descartado.

**Ambos em cookie httpOnly.** Protege bem contra XSS, mas exige CSRF token em toda mutação,
o que complica os três frontends e o contrato.

**Access em memória, refresh também em memória.** O mais seguro; custa a sessão a cada
recarga de página. Inaceitável para um boilerplate de uso geral.

## Consequências

**Boas.** XSS não alcança o refresh. Access token expira em 15 minutos. Rotação detecta
roubo. O padrão copiado do boilerplate é o padrão certo.

**Ruins.** Exige CORS com `credentials: true` e lista explícita de origens — configuração
mais delicada em desenvolvimento. Recarregar a página perde o access token e dispara um
refresh silencioso: os três frontends precisam tratar esse estado inicial. Backend precisa
de armazenamento de refresh tokens para suportar revogação, o que a família não teria com
JWT puro. `COOKIE_SECURE=false` em desenvolvimento é uma pegadinha — o `.env.example`
avisa.
