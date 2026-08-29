# Os mesmos alvos da raiz e do backend. Quem sabe operar um, opera os quatro.
.DEFAULT_GOAL := help
.PHONY: help install build up down restart logs shell lint ci test clean codegen

COMPOSE = docker compose
SERVICE = web

help: ## Lista os alvos disponíveis
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Instala as dependências
	pnpm install

build: ## Constrói a imagem
	$(COMPOSE) build

up: ## Sobe o dev server
	$(COMPOSE) up -d

down: ## Derruba
	$(COMPOSE) down

restart: ## Reinicia
	$(COMPOSE) restart $(SERVICE)

logs: ## Segue os logs
	$(COMPOSE) logs -f $(SERVICE)

shell: ## Abre um shell no container
	$(COMPOSE) exec $(SERVICE) sh

clean: ## Derruba e remove volumes e órfãos
	$(COMPOSE) down -v --remove-orphans

codegen: ## Regera os tipos a partir de contract/openapi.yaml
	pnpm run codegen

lint: ## Formatação, lint, tipos, camadas e código morto
	pnpm run typecheck
	pnpm run lint

test: ## Testes com os limiares de cobertura
	pnpm run test

ci: ## Tudo que o CI roda
	$(MAKE) lint
	$(MAKE) test
	pnpm run build
