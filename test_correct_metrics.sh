#!/bin/bash

# Test Metrics API with Correct Data
echo "🔧 Testing Metrics API for Equipment: 03e7bc02a0078cbb"

cd /opt/code/ecc800/ecc800

# Test direct database query
echo -e "\n📊 Direct Database Test:"
docker-compose exec backend python -c "
import sys
sys.path.append('/app')
from app.core.database import execute_raw_query
import asyncio

async def test_metrics():
    # Test the exact query our API should run
    params = {'site_code': 'dc', 'equipment_id': '03e7bc02a0078cbb'}
    
    # Main metrics query
    query = '''
    SELECT 
        performance_data as metric_name,
        COALESCE(unit, 'N/A') as unit,
        COUNT(*) as data_points,
        AVG(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as avg_value,
        MIN(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as min_value,
        MAX(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as max_value,
        COUNT(CASE WHEN value_numeric IS NOT NULL THEN 1 END) as valid_readings
    FROM performance_data
    WHERE site_code = :site_code AND equipment_id = :equipment_id
    GROUP BY performance_data, unit
    ORDER BY data_points DESC;
    '''
    
    results = await execute_raw_query(query, params)
    print(f'Found {len(results)} metrics for equipment {params[\"equipment_id\"]}\\n')
    
    for i, row in enumerate(results):
        if isinstance(row, dict):
            metric_name = row['metric_name']
            print(f'=== Metric {i+1}: {metric_name} ===')
            print(f'Unit: {row[\"unit\"]}')
            print(f'Data Points: {row[\"data_points\"]:,}')
            print(f'Valid Readings: {row[\"valid_readings\"]:,}')
            print(f'Average: {float(row[\"avg_value\"]):.2f} {row[\"unit\"]}')
            print(f'Min: {float(row[\"min_value\"]):.2f} {row[\"unit\"]}')
            print(f'Max: {float(row[\"max_value\"]):.2f} {row[\"unit\"]}')
            
            # Get latest value
            latest_query = '''
            SELECT value_numeric, statistical_start_time
            FROM performance_data
            WHERE site_code = :site_code AND equipment_id = :equipment_id 
              AND performance_data = :metric_name AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time DESC
            LIMIT 1;
            '''
            latest_params = dict(params)
            latest_params['metric_name'] = metric_name
            
            latest_results = await execute_raw_query(latest_query, latest_params)
            if latest_results and len(latest_results) > 0:
                latest_row = latest_results[0]
                if isinstance(latest_row, dict):
                    latest_value = latest_row['value_numeric']
                    latest_time = latest_row['statistical_start_time']
                    print(f'Latest: {float(latest_value):.2f} {row[\"unit\"]} at {latest_time}')
                else:
                    print(f'Latest: {float(latest_row[0]):.2f} {row[\"unit\"]} at {latest_row[1]}')
            print()

asyncio.run(test_metrics())
"

echo -e "\n🌐 Expected Frontend Result:"
echo "✅ Should show 2 metrics:"
echo "   1. Temperature (℃) - Temperature sensor readings"
echo "   2. Humidity (%RH) - Humidity sensor readings"
echo ""
echo "✅ Each metric card should show:"
echo "   - Correct metric name (Temperature/Humidity)"
echo "   - Proper unit (℃/%RH)"  
echo "   - Latest value with timestamp"
echo "   - Average, min, max values"
echo "   - Valid data point count"
echo ""
echo "❌ Should NOT show:"
echo "   - 'a (f)' in metric dropdown"
echo "   - '0.00 ℉' as latest value"
echo "   - Incorrect or missing data"
