#!/bin/bash

# ========================================
# ECC800 System Management Helper
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Show usage
show_usage() {
    echo "ECC800 System Management Helper"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start          - Start all services"
    echo "  stop           - Stop all services"
    echo "  restart        - Restart all services"
    echo "  status         - Show system status"
    echo "  logs           - Show logs for all services"
    echo "  logs [service] - Show logs for specific service"
    echo "  build          - Build and start (full deployment)"
    echo "  rebuild        - Force rebuild all images"
    echo "  health         - Run comprehensive health checks"
    echo "  clean          - Clean up unused Docker resources"
    echo "  backup         - Backup database (if applicable)"
    echo "  test           - Run system tests"
    echo "  dev            - Development mode (with file watching)"
    echo "  help           - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build       # Full build and deployment"
    echo "  $0 logs backend # Show backend logs"
    echo "  $0 health      # Check system health"
}

# Start services
start_services() {
    print_header "Starting ECC800 Services"
    
    if ! docker-compose ps | grep -q "Up"; then
        docker-compose up -d
        print_success "Services started"
    else
        print_warning "Services already running"
    fi
    
    show_status
}

# Stop services
stop_services() {
    print_header "Stopping ECC800 Services"
    docker-compose down
    print_success "Services stopped"
}

# Restart services
restart_services() {
    print_header "Restarting ECC800 Services"
    docker-compose restart
    print_success "Services restarted"
    show_status
}

# Show status
show_status() {
    print_header "System Status"
    docker-compose ps
    
    echo -e "\n${BLUE}Service URLs:${NC}"
    echo "  🌐 Main App:  https://10.251.150.222:3344/ecc800/"
    echo "  🖥️  Equipment: https://10.251.150.222:3344/ecc800/equipment"  
    echo "  📊 API Docs:  https://10.251.150.222:3344/ecc800/docs"
    echo "  🔍 Health:    https://10.251.150.222:3344/ecc800/api/health"
}

# Show logs
show_logs() {
    local service=${1:-}
    
    if [ -n "$service" ]; then
        print_header "Logs for $service"
        docker-compose logs --tail=50 -f "$service"
    else
        print_header "All Service Logs"
        docker-compose logs --tail=20 -f
    fi
}

# Build and deploy
build_deploy() {
    print_header "Full Build and Deployment"
    ./build_and_start.sh
}

# Force rebuild
force_rebuild() {
    print_header "Force Rebuild All Images"
    docker-compose down --remove-orphans
    docker-compose build --no-cache --parallel
    docker-compose up -d
    print_success "Rebuild completed"
    show_status
}

# Health check
health_check() {
    print_header "System Health Check"
    
    echo "🔍 Container Health:"
    docker-compose ps
    
    echo -e "\n🌐 Service Connectivity:"
    
    # Backend API
    if curl -s -k "https://localhost:3344/ecc800/api/health" | grep -q "ok"; then
        print_success "Backend API: Healthy"
    else
        print_error "Backend API: Unhealthy"
    fi
    
    # Frontend
    if curl -s -k "https://localhost:3344/ecc800/" | grep -q "ECC800"; then
        print_success "Frontend: Healthy"
    else
        print_error "Frontend: Unhealthy"
    fi
    
    # Database test
    echo -e "\n🗄️  Database Test:"
    docker-compose exec -T backend python -c "
import asyncio
from app.core.database import execute_raw_query

async def test():
    try:
        result = await execute_raw_query('SELECT COUNT(*) FROM performance_equipment_master LIMIT 1;')
        print('✅ Database: Connected')
    except Exception as e:
        print(f'❌ Database: Error - {e}')

asyncio.run(test())
" 2>/dev/null || print_error "Database test failed"
}

# Clean up
clean_system() {
    print_header "Cleaning Up System"
    docker system prune -f
    docker volume prune -f
    print_success "Cleanup completed"
}

# Run tests
run_tests() {
    print_header "Running System Tests"
    
    echo "🧪 Testing Equipment Override System:"
    docker-compose exec -T backend python -c "
import asyncio
from app.core.database import execute_raw_query

async def test():
    try:
        # Test equipment list
        result = await execute_raw_query('SELECT COUNT(*) as count FROM performance_equipment_master WHERE site_code = \\'dc\\';')
        equipment_count = result[0]['count'] if result else 0
        print(f'📊 Equipment Records: {equipment_count}')
        
        # Test overrides
        result = await execute_raw_query('SELECT COUNT(*) as count FROM equipment_name_overrides;')
        override_count = result[0]['count'] if result else 0
        print(f'🔄 Equipment Overrides: {override_count}')
        
        if equipment_count > 0:
            print('✅ Equipment system functional')
        else:
            print('❌ No equipment data found')
            
    except Exception as e:
        print(f'❌ Test failed: {e}')

asyncio.run(test())
" 2>/dev/null || print_error "System test failed"
    
    print_success "System tests completed"
}

# Development mode
dev_mode() {
    print_header "Starting Development Mode"
    print_warning "This will start services with file watching enabled"
    
    # Stop existing services
    docker-compose down
    
    # Start in development mode (if dev override exists)
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        print_success "Development mode started with file watching"
    else
        docker-compose up -d
        print_success "Standard mode started (no dev override file found)"
    fi
    
    show_status
}

# Main command processing
case "${1:-help}" in
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "build")
        build_deploy
        ;;
    "rebuild")
        force_rebuild
        ;;
    "health")
        health_check
        ;;
    "clean")
        clean_system
        ;;
    "test")
        run_tests
        ;;
    "dev")
        dev_mode
        ;;
    "help"|*)
        show_usage
        ;;
esac
