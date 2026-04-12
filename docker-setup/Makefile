# Makefile for ViralBoost AI Docker operations

.PHONY: help build up down logs status restart clean test deploy

# Colors for output
BLUE=\033[0;34m
GREEN=\033[0;32m
YELLOW=\033[0;33m
RED=\033[0;31m
NC=\033[0m # No Color

help:
	@echo "$(BLUE)ViralBoost AI - Docker Management$(NC)"
	@echo "$(BLUE)=================================$(NC)"
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@echo "  $(YELLOW)make setup$(NC)        - Initialize project (setup.sh)"
	@echo "  $(YELLOW)make build$(NC)        - Build all Docker images"
	@echo "  $(YELLOW)make up$(NC)           - Start all services"
	@echo "  $(YELLOW)make down$(NC)         - Stop all services"
	@echo "  $(YELLOW)make restart$(NC)      - Restart all services"
	@echo "  $(YELLOW)make logs$(NC)         - View all logs (follow)"
	@echo "  $(YELLOW)make logs-backend$(NC) - View backend logs"
	@echo "  $(YELLOW)make logs-worker$(NC)  - View worker logs"
	@echo "  $(YELLOW)make logs-frontend$(NC)- View frontend logs"
	@echo "  $(YELLOW)make status$(NC)       - Show service status"
	@echo "  $(YELLOW)make clean$(NC)        - Remove containers & networks"
	@echo "  $(YELLOW)make clean-all$(NC)    - Remove everything including volumes"
	@echo "  $(YELLOW)make test$(NC)         - Run health checks"
	@echo "  $(YELLOW)make shell-backend$(NC)- Shell into backend container"
	@echo "  $(YELLOW)make shell-db$(NC)     - MongoDB shell"
	@echo "  $(YELLOW)make shell-redis$(NC)  - Redis CLI"
	@echo "  $(YELLOW)make ps$(NC)           - List all containers"
	@echo "  $(YELLOW)make stats$(NC)        - Show resource usage"
	@echo "  $(YELLOW)make prune$(NC)        - Clean up unused Docker resources"
	@echo "  $(YELLOW)make help$(NC)         - Show this help message"
	@echo ""

setup:
	@echo "$(BLUE)Running setup script...$(NC)"
	@chmod +x setup.sh
	@./setup.sh

build:
	@echo "$(BLUE)Building all Docker images...$(NC)"
	docker-compose build

up:
	@echo "$(BLUE)Starting services...$(NC)"
	docker-compose up -d

down:
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker-compose down

restart:
	@echo "$(YELLOW)Restarting services...$(NC)"
	docker-compose restart

logs:
	@echo "$(BLUE)Following logs...$(NC)"
	docker-compose logs -f

logs-backend:
	@echo "$(BLUE)Backend logs...$(NC)"
	docker-compose logs -f backend

logs-worker:
	@echo "$(BLUE)Worker logs...$(NC)"
	docker-compose logs -f worker worker-2

logs-frontend:
	@echo "$(BLUE)Frontend logs...$(NC)"
	docker-compose logs -f frontend

status:
	@echo "$(BLUE)Service Status:$(NC)"
	docker-compose ps

shell-backend:
	@echo "$(BLUE)Connecting to backend...$(NC)"
	docker-compose exec backend /bin/sh

shell-db:
	@echo "$(BLUE)Connecting to MongoDB...$(NC)"
	docker-compose exec mongodb mongosh -u root

shell-redis:
	@echo "$(BLUE)Connecting to Redis...$(NC)"
	docker-compose exec redis redis-cli

clean:
	@echo "$(YELLOW)Removing containers & networks...$(NC)"
	docker-compose down
	@echo "$(GREEN)Done! Volumes preserved.$(NC)"

clean-all:
	@echo "$(RED)Removing everything including volumes...$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)Cleaned!$(NC)"; \
	fi

test:
	@echo "$(BLUE)Running health checks...$(NC)"
	@echo "Waiting for services to stabilize..."
	@sleep 5
	@echo ""
	@echo "Backend health:"
	@curl -s http://localhost:5000/api/health || echo "Failed"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:3000/ | head -5 || echo "Failed"
	@echo ""
	@echo "NGINX proxy:"
	@curl -s http://localhost/health || echo "Failed"
	@echo ""
	@echo "$(GREEN)Health checks completed!$(NC)"

ps:
	@docker-compose ps

stats:
	@docker stats

prune:
	@echo "$(YELLOW)Removing unused Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)Pruned!$(NC)"

# Combination targets
dev: build up logs

prod: clean build
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose -f docker-compose.yml up -d
	@echo "$(GREEN)Production services started!$(NC)"
	@make status

backup:
	@echo "$(BLUE)Backing up MongoDB...$(NC)"
	docker-compose exec mongodb mongodump --archive=/backup/mongo-$$(date +%Y%m%d-%H%M%S).archive
	@echo "$(GREEN)Backup created!$(NC)"

update:
	@echo "$(BLUE)Pulling latest images...$(NC)"
	docker-compose pull
	@echo "$(BLUE)Restarting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Updated!$(NC)"

.DEFAULT_GOAL := help
