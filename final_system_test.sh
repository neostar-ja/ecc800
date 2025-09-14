#!/bin/bash

echo "🧪 Final System Validation"
echo "=========================="

# Test 1: Container Status
echo "📋 Test 1: Container Status"
docker ps --filter "name=ecc800" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test 2: Backend Health 
echo -e "\n🏥 Test 2: Backend Health"
curl -s http://localhost:8888/health 2>/dev/null || echo "❌ Backend not accessible"

# Test 3: Frontend Access
echo -e "\n🌐 Test 3: Frontend Access"  
curl -s -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Frontend not accessible"

# Test 4: Database Connection
echo -e "\n💾 Test 4: Database Connection"
docker exec -it ecc800-backend bash -c "cd /app && python -c \"
import asyncio
from app.core.database import get_db
from sqlalchemy import text

async def test():
    async for db in get_db():
        try:
            result = await db.execute(text('SELECT COUNT(*) as count FROM performance_data'))
            row = result.fetchone()
            print(f'✅ Database OK: {row[0]} performance records')
        except Exception as e:
            print(f'❌ Database error: {e}')
        break

asyncio.run(test())
\""

# Test 5: Authentication
echo -e "\n🔐 Test 5: Authentication"
AUTH_RESULT=$(curl -s -X POST "http://localhost:8888/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" 2>/dev/null)

if echo "$AUTH_RESULT" | grep -q "access_token"; then
    echo "✅ Authentication working"
    TOKEN=$(echo "$AUTH_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
    
    # Test API endpoints
    echo -e "\n🔍 Test 6: API Endpoints"
    
    # Test sites
    SITES=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8888/api/sites/" 2>/dev/null)
    if echo "$SITES" | grep -q "\[\]" || echo "$SITES" | grep -q "site_code"; then
        echo "✅ Sites API working"
    else
        echo "❌ Sites API failed"
    fi
    
    # Test equipment  
    EQUIPMENT=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8888/api/sites/DC/equipment" 2>/dev/null)
    if echo "$EQUIPMENT" | grep -q "\[\]" || echo "$EQUIPMENT" | grep -q "equipment_id"; then
        echo "✅ Equipment API working"
    else
        echo "❌ Equipment API failed"
    fi
    
    # Test time ranges
    TIME_RANGES=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8888/api/enhanced-metrics/time-ranges" 2>/dev/null)
    if echo "$TIME_RANGES" | grep -q "predefined"; then
        echo "✅ Time Ranges API working"
    else
        echo "❌ Time Ranges API failed"
    fi
    
else
    echo "❌ Authentication failed"
fi

echo -e "\n✅ Validation Complete!"
echo "📝 Check browser: http://localhost:3000"
