#!/bin/bash

echo "🧪 Enhanced Metrics System Test"
echo "================================"

# Load environment variables for testing
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Use environment variables with fallback to test defaults
TEST_USERNAME="${TEST_USERNAME:-${ADMIN_USERNAME:-admin}}"
TEST_PASSWORD="${TEST_PASSWORD:-${ADMIN_PASSWORD:-Admin123!}}"

# Test 1: Database Connection
echo "📋 Test 1: Database Connection"
docker exec -it ecc800-backend bash -c "cd /app && python -c \"
import asyncio
from app.core.database import get_db, execute_raw_query

async def test_db():
    async for db in get_db():
        result = await execute_raw_query(
            'SELECT COUNT(*) as count FROM performance_data LIMIT 1',
            db
        )
        print(f'✅ Database connected, sample count: {result}')
        break

asyncio.run(test_db())
\""

# Test 2: Direct API Function Testing  
echo -e "\n📊 Test 2: Direct API Functions"
docker exec -it ecc800-backend bash -c "cd /app && python -c \"
import asyncio
from app.routers.enhanced_metrics import get_time_ranges, get_enhanced_metrics
from app.core.database import get_db

async def test_api():
    print('Testing time ranges...')
    async for db in get_db():
        try:
            ranges = await get_time_ranges(db)
            print(f'✅ Time ranges: {len(ranges)} available')
            for r in ranges[:3]:
                print(f'  - {r[\\\"value\\\"]}: {r[\\\"label\\\"]}')
        except Exception as e:
            print(f'❌ Time ranges error: {e}')
        
        print('\nTesting enhanced metrics...')
        try:
            # Get real equipment first
            from app.core.database import execute_raw_query
            eq_result = await execute_raw_query(
                \\\"SELECT DISTINCT equipment_id FROM performance_data WHERE site_code = 'DC' LIMIT 1\\\",
                db
            )
            
            if eq_result and len(eq_result) > 0:
                real_eq = eq_result[0]['equipment_id']
                print(f'  Using real equipment: {real_eq}')
                
                metrics = await get_enhanced_metrics(
                    db=db,
                    site_code='DC', 
                    equipment_id=real_eq,
                    time_range='24h'
                )
                print(f'✅ Enhanced metrics: {len(metrics)} found')
                for m in metrics[:3]:
                    print(f'  - {m[\\\"name\\\"]}: {m[\\\"value\\\"]} {m[\\\"unit\\\"]}')
            else:
                print('❌ No real equipment found')
                
        except Exception as e:
            print(f'❌ Metrics error: {e}')
        break

asyncio.run(test_api())
\""

# Test 3: Frontend Access Test
echo -e "\n🌐 Test 3: Frontend API Access"
echo "Testing HTTP endpoints..."

# Get auth token
TOKEN=$(curl -s -X POST "http://localhost:8888/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${TEST_USERNAME}&password=${TEST_PASSWORD}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    echo "✅ Got auth token"
    
    # Test time ranges
    echo "Testing time ranges API..."
    RANGES=$(curl -s -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8888/api/enhanced-metrics/time-ranges" 2>/dev/null || echo "null")
    echo "Time ranges: $RANGES"
    
    # Test enhanced metrics
    echo "Testing enhanced metrics API..."  
    METRICS=$(curl -s -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8888/api/enhanced-metrics/metrics?site_code=DC&equipment_id=EQP001&time_range=1h" 2>/dev/null || echo "null")
    echo "Enhanced metrics: $METRICS"
    
else
    echo "❌ Could not get auth token"
fi

echo -e "\n✅ Test Complete!"
