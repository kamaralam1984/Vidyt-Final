#!/bin/bash
# ============================================
# Docker-related utility functions
# ============================================

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if docker is running
check_docker() {
    if ! docker ps > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Check if docker-compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
}

# Check all prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    check_docker
    check_docker_compose
    
    # Check disk space
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | cut -d'G' -f1)
    if [ "$available_space" -lt 10 ]; then
        echo -e "${RED}⚠️  Warning: Less than 10GB available disk space${NC}"
    fi
    
    # Check available memory
    available_memory=$(free -h | awk 'NR==2 {print $7}')
    echo -e "${GREEN}✅ Available memory: $available_memory${NC}"
}

# Start services
start_services() {
    check_docker
    echo -e "${BLUE}Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Services started${NC}"
    
    # Wait for services
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    sleep 10
}

# Stop services
stop_services() {
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Show service status
show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    docker-compose ps
}

# View logs
view_logs() {
    docker-compose logs -f "$@"
}

# Execute command in container
exec_container() {
    local container=$1
    shift
    docker-compose exec "$container" "$@"
}

# Backup database
backup_database() {
    echo -e "${BLUE}Backing up MongoDB...${NC}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    docker-compose exec mongodb mongodump --archive=/backup/mongo_backup_$timestamp.archive
    echo -e "${GREEN}✅ Backup created: backup/mongo_backup_$timestamp.archive${NC}"
}

# Restore database
restore_database() {
    local backup_file=$1
    echo -e "${BLUE}Restoring MongoDB from $backup_file...${NC}"
    docker-compose exec mongodb mongorestore --archive=$backup_file
    echo -e "${GREEN}✅ Restore complete${NC}"
}

# Health check
health_check() {
    echo -e "${BLUE}Running health checks...${NC}"
    
    echo "→ NGINX (proxy)..."
    curl -s http://localhost/health || echo "Failed"
    
    echo "→ Backend API..."
    curl -s http://localhost:5000/api/health || echo "Failed"
    
    echo "→ Frontend..."
    curl -s http://localhost:3000/api/health || echo "Failed"
    
    echo "→ AI Service..."
    curl -s http://localhost:5001/health || echo "Failed"
    
    echo "→ Worker..."
    curl -s http://localhost:5002/health || echo "Failed"
    
    echo -e "${GREEN}✅ Health checks complete${NC}"
}

# Show menu
show_menu() {
    echo -e "${BLUE}ViralBoost AI - Docker Utility${NC}"
    echo "================================"
    echo "1. Check prerequisites"
    echo "2. Start services"
    echo "3. Stop services"
    echo "4. Show status"
    echo "5. View logs"
    echo "6. Health check"
    echo "7. Backup database"
    echo "8. Clean & rebuild"
    echo "9. Exit"
    echo ""
    echo -n "Select option: "
}

# Main menu
main() {
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) check_prerequisites ;;
            2) start_services ;;
            3) stop_services ;;
            4) show_status ;;
            5) view_logs ;;
            6) health_check ;;
            7) backup_database ;;
            8)
                stop_services
                echo -e "${BLUE}Rebuilding...${NC}"
                docker-compose build --no-cache
                start_services
                ;;
            9) exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        
        echo ""
    done
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
