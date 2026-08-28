# Testes

## A pirâmide

| Nível | O que cobre | Dependências reais | Onde |
|---|---|---|---|
| unitário | entities, use cases | nenhuma — ports são fakes | `unit/` |
| integração | repositories, rotas, wiring | banco real via Testcontainers | `integration/` |
| e2e | jornada do usuário no navegador | stack inteira via compose | `e2e/` |

A maior parte dos testes é unitária. Se a maioria for de integração, a lógica provavelmente
vazou para os adapters.

## Cobertura

- Backend: **90%** global, verificado no hook local e no CI.
- Frontend: **80%** global e **90%** em `domain/` e `data/`.

Cobertura é piso, não meta. 90% com asserções fracas é pior que 80% com asserções boas.

## Fakes, não mocks

Para um port, escreva uma implementação falsa de verdade — em memória, com o mesmo
contrato. Ela vive junto das fixtures compartilhadas e é reusada por todos os testes.

```
FakeUserRepository  →  um dict/map em memória, implementa o mesmo port
```

Mock com asserção de chamada (`assert_called_once_with`) acopla o teste à implementação:
qualquer refatoração quebra o teste sem que nada tenha regredido. Use apenas quando o
efeito colateral **é** o comportamento (envio de e-mail, publicação em fila).

## Nomes

O nome do teste descreve o comportamento, não a função:

```
test_login_com_senha_errada_devolve_401          ✓
test_login_2                                     ✗
test_execute                                     ✗
```

## Estrutura de um teste

Três blocos, separados por linha em branco — preparar, executar, verificar. Sem
comentários `# arrange`. A separação visual já diz.

## O que sempre é testado

- Cada use case: caminho feliz **e** cada erro de domínio que ele pode lançar.
- Cada rota: código de status, formato do corpo, e o envelope de erro.
- Cada repository: contra banco real, incluindo a violação de unicidade.
- A regra de dependência: é um teste, não uma convenção.

## O que não é testado

Getters, o framework, bibliotecas de terceiros, e código que só existe para satisfazer a
cobertura. Se um trecho é difícil de testar, quase sempre é difícil porque está na camada
errada — mova, não force.
