# ==============================================================================
# STARCLUSTER ORCHESTRATION MAKEFILE
# ==============================================================================

.PHONY: help up build down logs restart clean

CYAN = \033[36m
RESET = \033[0m

help: ## Show available make commands and descriptions
	@echo "$(CYAN)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all microservices in detached mode
	docker compose up -d

build: ## Rebuild and start all containers from scratch
	docker compose up --build -d

down: ## Stop and remove all running containers and networks
	docker compose down

logs: ## Tail live log output from all services
	docker compose logs -f

restart: ## Restart the entire cluster ecosystem
	docker compose restart

clean: ## Purge environment (stop containers, remove volumes and orphans)
	docker compose down -v --remove-orphans
