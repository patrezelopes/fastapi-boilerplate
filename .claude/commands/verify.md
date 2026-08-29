---
description: Verifica os critérios de aceite de uma spec e roda os portões
argument-hint: <numero-da-spec>
---

Verifique a spec **$ARGUMENTS**.

## 1. Critérios de aceite

Leia `specs/$ARGUMENTS-*/spec.md`. Para **cada** critério de aceite, demonstre que ele
foi cumprido — com a saída de um teste, uma chamada real à API, ou um trecho do
resultado do Playwright.

Não basta afirmar que passou. Mostre a evidência.

## 2. Portões

```bash
make ci
```

Reporte, por projeto: lint, tipos, segurança, código morto, complexidade, cobertura,
regra de dependência.

## 3. Contrato

```bash
make contract-test
make e2e
```

## 4. Conformidade com as rules

- a regra de dependência foi respeitada (`.claude/rules/architecture.md`)
- erros usam o envelope RFC 9457 (`errors.md`)
- nada de segredo, token em `localStorage` ou vazamento em log (`security.md`)
- nomes seguem `naming.md`
- os três frontends têm o mesmo comportamento (`frontend.md`)

## Relatório

Uma tabela: critério ou portão, situação, evidência.

Seja honesto. Critério não demonstrado é **não cumprido**, mesmo que o código pareça
certo. Portão vermelho é portão vermelho. Se algo ficou de fora, diga o que e por quê —
reduzir escopo é decisão de quem pediu, não sua.
