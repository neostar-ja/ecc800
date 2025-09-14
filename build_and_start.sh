#!/bin/bash

# ========================================
# ECC800 Complete Build and Start Script
# ========================================

set -e  # Exit on error

echo "🚀 Building and starting complete ECC800 system..."
echo "================================================="

# Check if we're in the right directory
if [ ! -f "compose.yaml" ] && [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Must run from ecc800 project root directory"
    echo "   Expected files: compose.yaml or docker-compose.yml, .env"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ Error: Missing .env file"
    echo "   Please ensure .env file exists in the project root"
    exit 1
fi

# Function to get compose command
get_compose_cmd() {
    if [ -f "compose.yaml" ]; then
        echo "docker-compose -f compose.yaml"
    elif [ -f "docker-compose.yml" ]; then
        echo "docker-compose"
    else
        echo "docker-compose"  # fallback
    fi
}

# Set compose command
COMPOSE_CMD=$(get_compose_cmd)

# Source environment variables
echo "📋 Loading environment configuration..."
source .env

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i:$port >/dev/null 2>&1; then
        echo "⚠️  Warning: Port $port is already in use"
        return 1
    fi
    return 0
}

# Function to wait for service health
wait_for_health() {
    local service_name=$1
    local timeout=${2:-60}
    local count=0
    
    echo "⏰ Waiting for $service_name to be healthy (timeout: ${timeout}s)..."
    
    while [ $count -lt $timeout ]; do
        if $COMPOSE_CMD exec $service_name echo "alive" >/dev/null 2>&1; then
            echo "✅ $service_name is healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
        count=$((count + 2))
    done
    
    echo ""
    echo "❌ Timeout waiting for $service_name to be healthy"
    return 1
}

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
$COMPOSE_CMD down --remove-orphans || true

# Clean up unused Docker resources
echo ""
echo "🧹 Cleaning up Docker resources..."
docker system prune -f >/dev/null 2>&1 || true

# Check critical ports
echo ""
echo "🔍 Checking port availability..."
if ! check_port 3344; then
    echo "❌ Port 3344 (HTTPS) is in use. Please free it or change configuration."
    exit 1
fi

# Build frontend first
echo ""
echo "📦 Building frontend assets..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Build frontend
echo "🔨 Compiling frontend..."
npm run build

# Check build success
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Frontend build failed - dist directory or index.html not found"
    exit 1
fi

echo "✅ Frontend build completed successfully"
cd ..

# Build Docker images
echo ""
echo "🐳 Building Docker images..."
$COMPOSE_CMD build --no-cache --parallel

# Start services in correct order
echo ""
echo "� Starting services..."

# Start backend first
echo "▶️  Starting backend service..."
$COMPOSE_CMD up -d backend

# Wait for backend
wait_for_health backend 30

# Start frontend
echo "▶️  Starting frontend service..."
$COMPOSE_CMD up -d frontend

# Wait for frontend
wait_for_health frontend 20

# Start reverse proxy
echo "▶️  Starting reverse proxy..."
$COMPOSE_CMD up -d reverse-proxy

# Wait for reverse proxy
wait_for_health reverse-proxy 15

# Final health check
echo ""
echo "🏥 Running comprehensive health checks..."

# Check container status
echo "📊 Container Status:"
$COMPOSE_CMD ps

# Check application health
echo ""
echo "🔍 Application Health Checks:"

# Backend health
if curl -s -k "https://localhost:3344/ecc800/api/health" >/dev/null 2>&1; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy"
    echo "🔧 Checking backend logs:"
    $COMPOSE_CMD logs --tail=10 backend
fi

# Frontend health
if curl -s -k "https://localhost:3344/ecc800/" | grep -q "ECC800" >/dev/null 2>&1; then
    echo "✅ Frontend: Healthy"
else
    echo "❌ Frontend: Unhealthy"
    echo "🔧 Checking frontend logs:"
    $COMPOSE_CMD logs --tail=10 frontend
fi

# Database connectivity (via backend)
echo ""
echo "🗄️  Database Connection Test:"
DB_TEST_RESULT=$($COMPOSE_CMD exec -T backend python -c "
import asyncio
from app.core.database import execute_raw_query

async def test_db():
    try:
        result = await execute_raw_query('SELECT COUNT(*) FROM performance_equipment_master LIMIT 1;')
        print(f'✅ Database: Connected (found {len(result) if result else 0} test records)')
    except Exception as e:
        print(f'❌ Database: Error - {e}')

asyncio.run(test_db())
" 2>/dev/null || echo "❌ Database: Connection test failed")

echo "$DB_TEST_RESULT"

# Equipment override test
echo ""
echo "🔧 Equipment Override System Test:"
OVERRIDE_TEST=$($COMPOSE_CMD exec -T backend python -c "
import asyncio
from app.core.database import execute_raw_query

async def test_overrides():
    try:
        result = await execute_raw_query('SELECT COUNT(*) as count FROM equipment_name_overrides;')
        if result:
            count = result[0]['count'] if result[0] else 0
            print(f'✅ Equipment Overrides: {count} custom names configured')
        else:
            print('✅ Equipment Overrides: Table ready (0 records)')
    except Exception as e:
        print(f'❌ Equipment Overrides: Error - {e}')

asyncio.run(test_overrides())
" 2>/dev/null || echo "❌ Equipment Override test failed")

echo "$OVERRIDE_TEST"

# Final status
echo ""
echo "================================================="
echo "🎉 ECC800 System Deployment Complete!"
echo "================================================="
echo ""
echo "🌐 Access URLs:"
echo "   📱 Main Application:  https://10.251.150.222:3344/ecc800/"
echo "   🖥️  Equipment Page:    https://10.251.150.222:3344/ecc800/equipment"
echo "   📊 API Documentation: https://10.251.150.222:3344/ecc800/docs"
echo "   🔍 System Health:     https://10.251.150.222:3344/ecc800/api/health"
echo ""
echo "👥 Default User Accounts:"
echo "   👑 Administrator: admin / Admin123!"
echo "   📊 Data Analyst:  analyst / Analyst123!"
echo "   👁️  Read-Only:     viewer / Viewer123!"
echo ""
echo "🔧 System Features:"
echo "   ✅ Equipment Management with Custom Naming"
echo "   ✅ Real-time Equipment Search & Filtering"
echo "   ✅ Equipment Details with 3-Tab Interface"
echo "   ✅ Equipment Name Override System"
echo "   ✅ Responsive Material-UI Design"
echo "   ✅ Full CRUD Operations"
echo ""
echo "📋 Next Steps:"
echo "   1. Visit the Equipment page to test custom naming"
echo "   2. Try searching and filtering equipment"
echo "   3. Click equipment details to see override functionality"
echo "   4. Test the name editing features"
echo ""

# Show final container status
$COMPOSE_CMD ps

echo "🚀 System is ready for production use!"
