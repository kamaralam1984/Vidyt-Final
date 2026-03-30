#!/bin/bash

# ============================================
# ViralBoost AI - Docker Setup Verification
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ViralBoost AI - Docker Setup Verification Checklist      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

checks_passed=0
checks_failed=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description ($file)"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $description ($file) - MISSING"
        ((checks_failed++))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description ($dir)"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $description ($dir) - MISSING"
        ((checks_failed++))
    fi
}

echo "📂 CHECKING DIRECTORY STRUCTURE"
echo "================================"
check_dir "frontend" "Frontend (Next.js)"
check_dir "backend" "Backend (Express)"
check_dir "ai-service" "AI Service (Python)"
check_dir "worker" "Worker Service (BullMQ)"
check_dir "worker/workers" "Worker processors"
check_dir "nginx" "NGINX reverse proxy"
check_dir ".github/workflows" "GitHub Actions"
echo ""

echo "🐳 CHECKING DOCKERFILES"
echo "========================"
check_file "frontend/Dockerfile" "Frontend Dockerfile"
check_file "backend/Dockerfile" "Backend Dockerfile"
check_file "ai-service/Dockerfile" "AI Service Dockerfile"
check_file "worker/Dockerfile" "Worker Dockerfile"
check_file "nginx/Dockerfile" "NGINX Dockerfile"
echo ""

echo "⚙️ CHECKING CONFIGURATION FILES"
echo "================================"
check_file "docker-compose.yml" "Docker Compose orchestration"
check_file ".env.example" "Environment template"
check_file ".gitignore" "Git ignore file"
check_file "nginx/nginx.conf" "NGINX configuration"
check_file "ai-service/requirements.txt" "Python requirements"
echo ""

echo "🚀 CHECKING AUTOMATION SCRIPTS"
echo "================================"
check_file "setup.sh" "Setup script"
check_file "Makefile" "Make commands"
check_file "utils.sh" "Docker utilities"
echo ""

echo "📚 CHECKING DOCUMENTATION"
echo "==========================="
check_file "README.md" "Quick start guide"
check_file "DEPLOYMENT_GUIDE.md" "Deployment manual"
check_file "ARCHITECTURE.md" "Architecture reference"
check_file "COMPLETE_SETUP.md" "Setup summary"
echo ""

echo "👷 CHECKING WORKER CODE"
echo "======================="
check_file "worker/worker.js" "Main worker service"
check_file "worker/workers/videoProcessingWorker.js" "Video processor"
check_file "worker/workers/shortsGeneratorWorker.js" "Shorts generator"
echo ""

echo "🔄 CHECKING CI/CD PIPELINE"
echo "=========================="
check_file ".github/workflows/deploy.yml" "GitHub Actions workflow"
echo ""

echo "🎨 CHECKING ADDITIONAL FILES"
echo "============================"
check_file "frontend/.dockerignore" "Frontend ignore"
check_file "backend/.dockerignore" "Backend ignore"
check_file "worker/.dockerignore" "Worker ignore"
check_file "ai-service/app.py" "AI Service app"
echo ""

# Print summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     VERIFICATION RESULTS                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

total=$((checks_passed + checks_failed))
percentage=$((checks_passed * 100 / total))

echo "Total Checks: $total"
echo -e "Passed:       ${GREEN}$checks_passed${NC}"
echo -e "Failed:       ${RED}$checks_failed${NC}"
echo "Coverage:     $percentage%"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "🚀 Ready to start deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Edit configuration: nano .env"
    echo "2. Start services: docker-compose up --build"
    echo "3. Access frontend: http://localhost:3000"
    echo ""
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Missing files detected. Run setup.sh first:"
    echo "  chmod +x setup.sh"
    echo "  ./setup.sh"
    echo ""
    exit 1
fi
