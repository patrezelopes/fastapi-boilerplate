---
name: quality-gates
description: Rodar e interpretar os portões de qualidade deste repositório — lint, tipos, segurança, código morto, complexidade, cobertura e a regra de dependência. Use antes de commitar, quando o CI ficar vermelho, quando um hook bloquear, ou ao decidir se uma mudança está pronta.
---

# Portões de qualidade

## O comando

```bash
make lint      # portões do backend + do frontend selecionado
make test      # testes dos dois
make ci        # exatamente o que o CI roda, tudo, os três frontends
```

O CI não roda nada que `make ci` não rode. Vermelho no CI reproduz localmente.

## O que cada portão protege

| Portão | Impede |
|---|---|
| formatação | diff poluído por estilo |
| lint | bug conhecido, complexidade, importação morta |
| tipos | erro que só apareceria em produção |
| segurança | injeção, segredo no código, dependência vulnerável |
| código morto | função que ninguém chama há meses |
| complexidade | função que ninguém consegue mais ler |
| cobertura | caminho sem teste |
| regra de dependência | erosão da arquitetura |

## Limites

- Cobertura backend **90%**, frontend **80%** global e **90%** em `domain/` e `data/`.
- Complexidade ciclomática máxima **10** por função.
- Vulnerabilidade alta ou crítica bloqueia.

## Interpretando cada tipo de falha

**Formatação** — rode o formatador e commite. Nunca discuta com ele.

**Complexidade acima de 10** — a função faz coisas demais. Extraia o bloco interno de
condicional para uma função com nome. Não suba o limite.

**Cobertura abaixo do piso** — leia *quais* linhas faltam antes de escrever teste. Se são
caminhos de erro, teste-os. Se são código que ninguém chama, apague. Nunca escreva teste
que só executa a linha sem asserção: sobe o número e não protege nada.

**Código morto** — apague. Está no git. "Pode ser útil depois" não é motivo para manter.

**Tipos** — `any`, `interface{}`, `Object` e o cast solto são o problema, não a solução.
Suprimir com comentário de ignore exige justificativa na mesma linha.

**Segurança** — falso positivo se suprime com anotação **e** comentário explicando por quê.
Sem o comentário, não é falso positivo, é dívida.

**Regra de dependência** — ver a skill `clean-architecture`. Mova o código.

## Antes de commitar

O hook local roda tudo. Se você está pensando em `--no-verify`, o portão está certo e a
pressa é sua. As duas exceções legítimas: commit em branch de rascunho que será
esmagado, e emergência já combinada com alguém.

## Ordem para consertar

```
formatação → lint → tipos → testes → cobertura → segurança → arquitetura
```

Consertar formatação primeiro elimina ruído das outras saídas.
