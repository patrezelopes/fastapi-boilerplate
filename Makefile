.PHONY: build up down restart logs shell lint ci test pre-commit-install

COMPOSE = docker compose
SERVICE = api

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart $(SERVICE)

logs:
	$(COMPOSE) logs -f $(SERVICE)

shell:
	$(COMPOSE) exec $(SERVICE) bash

pre-commit-install:
	uv run pre-commit install

lint:
	uv run pre-commit run --all-files

ci:
	uv run pre-commit run --all-files --show-diff-on-failure

test:
	uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90
