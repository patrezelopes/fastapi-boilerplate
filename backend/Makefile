# Os mesmos alvos da raiz e dos frontends. Roda o backend isolado.
.DEFAULT_GOAL := help
.PHONY: help build up down restart logs shell lint ci test clean migrate seed arch install

COMPOSE = docker compose
SERVICE = api

help: ## Lista os alvos disponíveis
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[1m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências e o hook local
	uv sync --extra dev
	cd .. && uv --directory backend run pre-commit install

build: ## Constrói a imagem
	$(COMPOSE) build

up: ## Sobe api + banco, sem frontend
	$(COMPOSE) up -d --wait

down: ## Derruba
	$(COMPOSE) down

restart: ## Reinicia a api
	$(COMPOSE) restart $(SERVICE)

logs: ## Segue os logs
	$(COMPOSE) logs -f $(SERVICE)

shell: ## Abre um shell na api
	$(COMPOSE) exec $(SERVICE) bash

clean: ## Derruba e remove volumes e órfãos
	$(COMPOSE) down -v --remove-orphans

lint: ## Formatação, lint, tipos, segurança, código morto e camadas
	uv run black --check src migrations
	uv run isort --check-only src migrations
	uv run ruff check src migrations
	uv run mypy
	uv run vulture src --config pyproject.toml
	uv run bandit -r src -c pyproject.toml -q
	uv run lint-imports

test: ## Testes com cobertura mínima de 90%
	uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90

arch: ## Verifica a regra de dependência
	uv run lint-imports

ci: ## Tudo que o CI roda para o backend
	$(MAKE) lint
	$(MAKE) test

migrate: ## Aplica as migrations (dentro do container)
	$(COMPOSE) exec -T $(SERVICE) alembic upgrade head

seed: ## Popula o banco com dados de desenvolvimento
	$(COMPOSE) exec -T $(SERVICE) python -m app.seed
