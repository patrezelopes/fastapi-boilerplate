# Segurança

## Senhas

**argon2id**, sempre. Nunca bcrypt novo, nunca SHA-família, nunca hash caseiro.
Mínimo de 12 caracteres na validação de entrada. A senha nunca aparece em log, em
resposta, em `repr`/`toString` da entity, nem em mensagem de erro.

## Tokens

| | Access | Refresh |
|---|---|---|
| formato | JWT assinado | opaco, aleatório |
| vida | 15 min | 14 dias |
| onde vive | memória do cliente | cookie `httpOnly` |
| rotação | não | a cada uso |

O access token **nunca** vai para `localStorage` nem `sessionStorage` — XSS o leria.
O refresh vai em cookie `httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`.

Reuso de um refresh já consumido invalida toda a família de tokens daquele usuário. É a
detecção de roubo: se o token vazou, o uso pelo atacante derruba a sessão legítima.

## Segredos

Nada de segredo no código, nem em valor padrão. `JWT_SECRET` vem do ambiente e a aplicação
**recusa subir** se ele estiver ausente ou for o valor de exemplo em `APP_ENV=production`.

`.env` está no `.gitignore`. Só `.env.example` é versionado, e com valores obviamente falsos.

## Entrada

Valide na borda, no DTO. Nunca interpole string em SQL — parâmetros sempre, sem exceção.
Limite o tamanho de tudo: corpo da requisição, campos de texto, `per_page`.

## Respostas

Login com e-mail inexistente e login com senha errada devolvem a **mesma** resposta e no
mesmo tempo. Diferenciar entrega enumeração de contas.

Nunca vaze stack trace, SQL, caminho de arquivo ou variável de ambiente — ver
`errors.md`.

## Cabeçalhos e CORS

`CORS_ALLOWED_ORIGINS` é lista explícita. Nunca `*` com credenciais.
Em produção: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.

## Dependências

O CI roda auditoria de vulnerabilidades a cada PR. Vulnerabilidade alta ou crítica
bloqueia o merge. Versões são fixadas em lockfile; o lockfile é versionado.

## Log

Nunca logar: senha, token, cookie, corpo de requisição de auth, dado pessoal completo.
Sempre logar: id de correlação, id do usuário, rota, status, latência.
