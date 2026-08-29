# ADR-0001 — Camadas e regra de dependência

- **Status:** aceita
- **Data:** 2026-08-28
- **Contexto:** vale para os seis boilerplates da família

## Contexto

Seis backends em cinco linguagens precisam ser reconhecíveis entre si. Sem uma regra
estrutural comum, cada stack adota o layout que sua comunidade prega — `apps/` no Django,
módulos no Nest, pacotes por feature no Spring, `internal/` no Go, módulos no Rust — e a
família deixa de ser uma família.

## Decisão

Todos adotam Clean Architecture com quatro camadas e a dependência apontando para dentro:

```
config  →  api | repositories  →  use_cases  →  entities
```

`entities` e `use_cases` não conhecem HTTP, ORM nem framework. Os ports ficam em
`use_cases/ports/`, junto de quem os consome, não junto da implementação.

Os **nomes de diretório** seguem o idioma de cada linguagem; o **contrato entre camadas**
é idêntico. O mapeamento está em `docs/SPEC.md`.

A regra é verificada por ferramenta no CI de cada repositório — `import-linter`,
`dependency-cruiser`, ArchUnit, `go-arch-lint`, ou o compilador via crates de workspace.

## Alternativas descartadas

**Layout idiomático por stack.** Menos atrito com cada comunidade, mas destrói a paridade
que justifica a família existir.

**Arquitetura hexagonal com nomenclatura de portas e adaptadores.** Equivalente na prática;
o vocabulário de Clean Architecture já estava estabelecido no `fastapi-boilerplate`.

**Vertical slice por feature.** Boa para times grandes em domínios amplos; num boilerplate
com três recursos, produz mais cerimônia que orientação.

## Consequências

**Boas.** Quem conhece um repositório navega os outros cinco. A regra de negócio é testável
sem banco. Trocar de ORM não toca `use_cases`.

**Ruins.** Duplicação entre entity e model do ORM, com tradução no repository. Em Django,
atrito real com o ORM active record — ver ADR-0002. Para um CRUD trivial, é mais código do
que a tarefa pede; é o preço da uniformidade.
