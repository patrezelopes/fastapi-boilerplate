# NNNN — Tarefas

> Cada tarefa é executável e tem um critério de conclusão explícito.
> A ordem segue a regra de dependência e não deve ser alterada.

## Contrato

- [ ] Atualizar `contract/openapi.yaml`
      — *pronto quando:* `make contract-test` roda sem erro de schema
- [ ] `make codegen`
      — *pronto quando:* os três frontends compilam com os tipos novos

## Backend

- [ ] Entity
      — *pronto quando:* teste unitário passa, sem banco
- [ ] Port em `use_cases/ports/`
      — *pronto quando:* a interface declara só o que o use case precisa
- [ ] Use case
      — *pronto quando:* teste unitário cobre o caminho feliz e cada erro de domínio
- [ ] Model do ORM + migration
      — *pronto quando:* `make migrate` sobe e desce sem erro
- [ ] Repository
      — *pronto quando:* teste de integração passa contra banco real
- [ ] DTOs
      — *pronto quando:* batem com o contrato, campo a campo
- [ ] Rotas + registro no container
      — *pronto quando:* teste de integração cobre status e corpo, sucesso e erro

## Frontends — nos três

- [ ] `domain/`
      — *pronto quando:* os tipos refletem a entity
- [ ] `data/`
      — *pronto quando:* o repositório usa os tipos gerados, sem `any`
- [ ] `features/`
      — *pronto quando:* teste unitário cobre a lógica
- [ ] `ui/`
      — *pronto quando:* trata carregando, vazio, erro e conteúdo

## Fechamento

- [ ] Roteiro do Playwright cobrindo o critério de aceite
      — *pronto quando:* passa nos três frontends sem ramificar
- [ ] `make ci`
      — *pronto quando:* todos os portões verdes
- [ ] `/verify NNNN`
      — *pronto quando:* cada critério de aceite tem evidência
