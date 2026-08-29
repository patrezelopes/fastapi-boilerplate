# ─────────────────────────────────────────────────────────────────────────────
#  Boilerplate LopesTech — orquestração da raiz
#
#  Os mesmos alvos existem em backend/ e em cada frontend/<framework>/.
#  Esta raiz delega; os filhos rodam sozinhos.
#
#    make up                 sobe db + api + react (padrão)
#    make up FRONT=angular   sobe db + api + angular
#    make up FRONT=none      só backend
# ─────────────────────────────────────────────────────────────────────────────

FRONT   ?= react
COMPOSE := docker compose
BACKEND := backend
WEB     := frontend/$(FRONT)

ifeq ($(FRONT),none)
  PROFILES :=
else
  PROFILES := $(FRONT)
endif

export COMPOSE_PROFILES = $(PROFILES)

.DEFAULT_GOAL := help
.PHONY: help build up down restart logs shell lint ci test clean check-front \
        migrate seed codegen contract-test e2e e2e-all arch skills-diff install

help: ## Lista os alvos disponíveis
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[1m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  FRONT=$(FRONT)  (react | vue | angular | none)"

check-front:
	@case "$(FRONT)" in \
	  react|vue|angular|none) ;; \
	  *) echo "FRONT inválido: '$(FRONT)'. Use react, vue, angular ou none."; exit 1 ;; \
	esac

install: ## Instala tudo: backend, os três frontends e o e2e
	$(MAKE) -C $(BACKEND) install
	@for f in react vue angular; do $(MAKE) -C frontend/$$f install || exit 1; done
	cd e2e && pnpm install

# ─── ciclo de vida ───────────────────────────────────────────────────────────

build: check-front ## Constrói as imagens
	$(COMPOSE) build

up: check-front ## Sobe a stack e aguarda o healthcheck
	$(COMPOSE) up -d --wait

down: ## Derruba a stack, qualquer que seja o perfil
	$(COMPOSE) --profile react --profile vue --profile angular down

restart: check-front ## Reinicia a api
	$(COMPOSE) restart api

logs: check-front ## Segue os logs
	$(COMPOSE) logs -f

shell: ## Abre um shell na api
	$(COMPOSE) exec api bash

clean: ## Derruba tudo e remove volumes e órfãos
	$(COMPOSE) --profile react --profile vue --profile angular down -v --remove-orphans

# ─── qualidade ───────────────────────────────────────────────────────────────

lint: check-front ## Portões do backend e do frontend selecionado
	$(MAKE) -C $(BACKEND) lint
ifneq ($(FRONT),none)
	$(MAKE) -C $(WEB) lint
endif

test: check-front ## Testes do backend e do frontend selecionado
	$(MAKE) -C $(BACKEND) test
ifneq ($(FRONT),none)
	$(MAKE) -C $(WEB) test
endif

arch: ## Verifica a regra de dependência no backend
	$(MAKE) -C $(BACKEND) arch

ci: ## Reproduz localmente tudo que o CI roda
	uv --directory $(BACKEND) run pre-commit run --all-files --show-diff-on-failure
	@for f in react vue angular; do $(MAKE) -C frontend/$$f ci || exit 1; done

# ─── contrato ────────────────────────────────────────────────────────────────

codegen: ## Regera os tipos TypeScript dos três frontends a partir do contrato
	@for f in react vue angular; do \
	  echo "→ codegen frontend/$$f"; \
	  $(MAKE) -C frontend/$$f codegen || exit 1; \
	done

contract-test: ## Valida a api de pé contra contract/openapi.yaml
	./scripts/contract-test.sh

e2e: check-front ## Playwright contra o frontend selecionado
	./scripts/e2e.sh $(FRONT)

e2e-all: ## O mesmo roteiro nos três SPAs
	@for f in react vue angular; do ./scripts/e2e.sh $$f || exit 1; done

# ─── banco ───────────────────────────────────────────────────────────────────

migrate: ## Aplica as migrations
	$(COMPOSE) exec -T api alembic upgrade head

seed: ## Popula o banco com dados de desenvolvimento
	$(COMPOSE) exec -T api python -m app.seed

# ─── kit do agente ───────────────────────────────────────────────────────────

skills-diff: ## Acusa divergência do kit .claude/ contra a referência
	./scripts/skills-diff.sh
