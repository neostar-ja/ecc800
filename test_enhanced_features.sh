#!/bin/bash

echo "🧪 Testing Enhanced Metrics API with Time Range Features"
echo "======================================================="

cd /opt/code/ecc800/ecc800

# Test 1: Time Ranges Endpoint
echo "📋 Test 1: Time Ranges API"
docker exec ecc800-backend python -c "
import asyncio
from app.routers.enhanced_metrics import get_time_ranges

async def test():
    try:
        # Mock user
        class MockUser:
            username = 'test'
        
        result = await get_time_ranges(MockUser())
        print('✅ Time Ranges Available:')
        for opt in result['predefined']:
            print(f'  {opt[\"value\"]}: {opt[\"label\"]}')
        print(f'✅ Interval Options: {len(result[\"intervals\"])} available')
    except Exception as e:
        print(f'❌ Error: {e}')

asyncio.run(test())
"

echo ""
echo "📊 Test 2: Enhanced Metrics with Time Range"
docker exec ecc800-backend python -c "
import asyncio
from app.core.database import execute_raw_query
from datetime import datetime, timedelta

async def test_time_range():
    try:
        # Test metrics with 1h time range
        now = datetime.now()
        from_time = now - timedelta(hours=1)
        
        query = '''
        SELECT 
            performance_data,
            COUNT(*) as count,
            AVG(value_numeric) as avg_val,
            unit
        FROM performance_data
        WHERE site_code = :site_code 
          AND equipment_id = :equipment_id
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
          AND value_numeric IS NOT NULL
        GROUP BY performance_data, unit
        ORDER BY count DESC
        LIMIT 5;
        '''
        
        params = {
            'site_code': 'dc',
            'equipment_id': '990c334bef006d22', 
            'from_time': from_time,
            'to_time': now
        }
        
        result = await execute_raw_query(query, params)
        print('✅ Metrics in Last 1 Hour:')
        for row in result:
            if isinstance(row, dict):
                print(f'  {row.get(\"performance_data\")}: {row.get(\"count\")} records, avg: {row.get(\"avg_val\"):.2f} {row.get(\"unit\")}')
            else:
                print(f'  {row[0]}: {row[1]} records, avg: {row[2]:.2f} {row[3]}')
    except Exception as e:
        print(f'❌ Error: {e}')

asyncio.run(test_time_range())
"

echo ""
echo "📈 Test 3: Metric Details with Chart Config"
docker exec ecc800-backend python -c "
import asyncio
from app.routers.enhanced_metrics import _generate_chart_config

async def test_chart():
    try:
        # Test chart config generation
        mock_data = [type('obj', (object,), {'value': i*10 + 20})() for i in range(10)]
        
        config1 = _generate_chart_config('Battery capacity', 'Ah', mock_data)
        print('✅ Chart Config for Battery:')
        print(f'  Type: {config1[\"type\"]}, Color: {config1[\"color\"]}')
        print(f'  Y-axis: {config1[\"y_axis\"]}')
        
        config2 = _generate_chart_config('Ph. C input volt.', 'V', mock_data)
        print('✅ Chart Config for Voltage:')
        print(f'  Type: {config2[\"type\"]}, Color: {config2[\"color\"]}')
        
    except Exception as e:
        print(f'❌ Error: {e}')

asyncio.run(test_chart())
"

echo ""
echo "🌐 Test 4: Frontend API Call Test"
echo "Testing new metrics API through HTTP..."
curl -k -s -X POST "https://10.251.150.222:3344/ecc800/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' | jq -r '.access_token' > /tmp/token.txt

if [ -s /tmp/token.txt ]; then
    TOKEN=$(cat /tmp/token.txt)
    echo "✅ Got auth token"
    
    echo "📊 Testing enhanced metrics with time range..."
    curl -k -s "https://10.251.150.222:3344/ecc800/api/enhanced-metrics?site_code=dc&equipment_id=990c334bef006d22&period=1h" \
      -H "Authorization: Bearer $TOKEN" | jq '.time_range, .total_count'
    
    echo "⏰ Testing time ranges..."
    curl -k -s "https://10.251.150.222:3344/ecc800/api/time-ranges" \
      -H "Authorization: Bearer $TOKEN" | jq '.predefined[0:3]'
      
else
    echo "❌ Login failed"
fi

rm -f /tmp/token.txt

echo ""
echo "✅ Testing Complete!"
