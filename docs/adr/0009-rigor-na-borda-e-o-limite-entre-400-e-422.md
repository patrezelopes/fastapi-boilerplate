# ADR-0009 — Rigor na borda, e o limite entre 400 e 422

- **Status:** aceita
- **Data:** 2026-08-29
- **Contexto:** as seis stacks da família

## Contexto

A fase de harmonização começou com uma descoberta que mudou o seu escopo: **o teste de
contrato rodava sem credencial**. Toda rota protegida devolvia 401, e o Schemathesis nunca
chegava a validar um 200 delas contra o schema. Metade da API estava fora do portão desde a
primeira fase — e foi assim que uma resposta de `/users` com a paginação achatada, quando o
contrato a declara aninhada em `meta`, sobreviveu a duas implementações e só apareceu no
e2e.

Com a suíte autenticada, a primeira rodada em cada stack encontrou defeito. E uma auditoria
de paridade — a mesma bateria de trinta requisições contra as seis, comparando status e
`type` do envelope — mostrou seis casos em que elas discordavam entre si.

Duas famílias de decisão precisavam ser tomadas de uma vez, para as seis.

## Decisão

### 1. O que não está no contrato é recusado

**Campo de corpo desconhecido é 422.** O padrão das seis stacks era ignorá-lo: o Pydantic, o
DRF, o class-validator com `whitelist`, o Jackson do Spring Boot e o `encoding/json` do Go,
todos descartam em silêncio. É como um `passwrod` digitado errado no cliente cria a conta
com uma senha que ninguém escolheu.

**Parâmetro de consulta desconhecido é 422**, pelo mesmo motivo: é o que faz um `?perPage=5`
devolver vinte itens sem que ninguém perceba o erro de digitação.

**Parâmetro presente e vazio não é parâmetro ausente.** `?page=` não cai no valor padrão:
uma string vazia não é um inteiro.

**Campo presente com `null` não é campo ausente.** No PATCH, ausente significa "não mexa" e
`null` é violação do schema, porque não existe "apagar o e-mail". Nenhum tipo opcional das
seis linguagens distingue os dois casos sozinho: foi preciso um tipo próprio em Go
(`optionalString`), Rust (`Patch`) e Spring (`Patch<T>` com desserializador e
`ValueExtractor`), e o `model_fields_set` no Pydantic.

**Tipo errado é 422, não conversão.** Nem `{"name": 0}` vira `"0"`, nem `{"name": true}`
vira `"true"`.

### 2. O limite entre 400 e 422

> Se um objeto JSON foi extraído da requisição, o que falhar depois é **422**.
> Se não foi, é **400**.

Corpo que não é JSON, corpo ausente e query string malformada são 400: não há schema a
violar, e portanto não há campo a nomear no `errors[]`. Corpo legível que viola o schema é
422, e o envelope diz qual campo.

### 3. O contrato é o limite superior, não só o inferior

A validação de uma stack **não pode ser mais restrita que o contrato**. Três casos reais: o
`char::is_control()` do Rust recusava o bloco C1, que o padrão do contrato aceita; o
`@NotBlank` do Spring recusava uma senha de doze espaços; e o `@Length` do class-validator
contava unidades UTF-16, recusando um nome de sessenta emojis que tem sessenta pontos de
código. Um contrato que promete mais do que a implementação entrega mente para quem o
consome, e o Schemathesis acha isso na primeira rodada.

## Alternativas descartadas

**Ignorar o desconhecido, como fazem os frameworks por padrão.** É a convenção mais comum, e
é justamente o que permite os erros descritos acima passarem sem ruído. O custo de recusar é
um cliente que precisa acertar o nome do campo; o custo de ignorar é uma conta criada com
uma senha que ninguém digitou.

**Devolver 422 também para corpo ilegível**, como o FastAPI fazia. Simplifica o código — um
caminho só — mas produz um `errors[]` vazio ou com um campo sintético, que não ajuda quem
consome.

**Excluir do Schemathesis a verificação de propriedades inesperadas.** Teria evitado o
trabalho, e teria sido a quinta vez nesta família em que um portão passa sem olhar nada.

## Consequências

**Boas.** As seis stacks respondem identicamente às mesmas trinta requisições — status e
`type` do envelope, caso a caso. Trocar o `docker-compose.yml` de um repositório pelo de
outro muda apenas a imagem do serviço `api`.

**Ruins.** Um cliente que mandava campo a mais passa a receber 422. Para uma API pública
isso seria uma quebra; para o backend dos próprios SPAs, que é o caso desta família, é o
comportamento desejado. Quem derivar um repositório para uma API aberta a terceiros deve
reconsiderar — e é por isso que esta ADR existe.

**Neutras.** Cada stack precisou de um mecanismo diferente para a mesma regra. As três
skills de cada repositório descrevem qual.
