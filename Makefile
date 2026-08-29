.DEFAULT_GOAL := help
.PHONY: help build up down restart logs shell lint ci test clean \
        migrate seed contract-test codegen e2e e2e-all arch skills-diff pre-commit-install

COMPOSE = docker compose
SERVICE = api
FRONT  ?= react

help: ## Lista os alvos disponíveis
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[1m%-18s\033[0m %s\n", $$1, $$2}'

# ─── ciclo de vida ───────────────────────────────────────────────────────────

build: ## Constrói as imagens
	$(COMPOSE) build

up: ## Sobe a stack e aguarda o healthcheck
	$(COMPOSE) up -d --wait

down: ## Derruba a stack
	$(COMPOSE) down

restart: ## Reinicia a api
	$(COMPOSE) restart $(SERVICE)

logs: ## Segue os logs da api
	$(COMPOSE) logs -f $(SERVICE)

shell: ## Abre um shell na api
	$(COMPOSE) exec $(SERVICE) bash

clean: ## Derruba tudo e remove volumes e órfãos
	$(COMPOSE) down -v --remove-orphans

# ─── qualidade ───────────────────────────────────────────────────────────────

pre-commit-install: ## Instala o hook local
	uv run pre-commit install

lint: ## Roda todos os portões nos arquivos versionados
	uv run pre-commit run --all-files

ci: ## Reproduz localmente o que o CI roda
	uv run pre-commit run --all-files --show-diff-on-failure

test: ## Testes com cobertura mínima de 90%
	uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90

arch: ## Verifica a regra de dependência
	uv run lint-imports

# ─── banco ───────────────────────────────────────────────────────────────────

migrate: ## Aplica as migrations (dentro do container)
	$(COMPOSE) exec -T $(SERVICE) alembic upgrade head

seed: ## Popula o banco com dados de desenvolvimento (dentro do container)
	$(COMPOSE) exec -T $(SERVICE) python -m app.seed

# ─── contrato ────────────────────────────────────────────────────────────────

contract-test: ## Valida a api de pé contra contract/openapi.yaml
	./scripts/contract-test.sh

codegen: ## Regera os tipos TypeScript dos três frontends a partir do contrato
	@for f in react vue angular; do \
		echo "→ codegen frontend/$$f"; \
		$(MAKE) -C frontend/$$f codegen || exit 1; \
	done

e2e: ## Playwright contra um dos SPAs — make e2e FRONT=vue
	./scripts/e2e.sh $(FRONT)

e2e-all: ## Playwright contra os três, com o mesmo roteiro
	@for f in react vue angular; do ./scripts/e2e.sh $$f || exit 1; done

skills-diff: ## Acusa divergência do kit .claude/ contra a referência
	./scripts/skills-diff.sh
