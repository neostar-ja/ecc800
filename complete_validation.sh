#!/bin/bash

echo "🎯 Complete Metrics System Validation"
echo "====================================="

# Get auth token
echo "🔐 Step 1: Getting Authentication Token"
TOKEN=$(curl -s -k -X POST "https://localhost:3344/ecc800/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo&password=demo123" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "✅ Authentication successful"
    
    # Test enhanced metrics APIs
    echo -e "\n📊 Step 2: Testing Enhanced Metrics APIs"
    
    # Time ranges
    echo "🕐 Testing time ranges..."
    TIME_RANGES=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-metrics/time-ranges" 2>/dev/null)
    
    if echo "$TIME_RANGES" | grep -q "predefined"; then
        echo "✅ Time Ranges API working"
        echo "$TIME_RANGES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'  Predefined ranges: {len(data[\"predefined\"])}')
print(f'  Intervals: {len(data[\"intervals\"])}')
" 2>/dev/null
    else
        echo "❌ Time Ranges API failed"
    fi
    
    # Sites
    echo -e "\n🏢 Testing sites..."
    SITES=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/sites/" 2>/dev/null)
    
    if echo "$SITES" | grep -q "site_code\|DC\|\[\]"; then
        echo "✅ Sites API working" 
        echo "$SITES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Found {len(data)} sites')
    for site in data[:3]:
        print(f'    - {site.get(\"site_code\", \"?\")}: {site.get(\"site_name\", \"?\")[:30]}')
except:
    print('  Response format changed')
" 2>/dev/null
    else
        echo "❌ Sites API failed"
    fi
    
    # Equipment for DC
    echo -e "\n🔧 Testing equipment..."
    EQUIPMENT=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/sites/DC/equipment" 2>/dev/null)
      
    if echo "$EQUIPMENT" | grep -q "equipment_id\|EQP\|\[\]"; then
        echo "✅ Equipment API working"
        # Get first equipment ID
        FIRST_EQUIPMENT=$(echo "$EQUIPMENT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data and len(data) > 0:
        print(data[0].get('equipment_id', ''))
    else:
        print('')
except:
    print('')
" 2>/dev/null)
        
        if [ -n "$FIRST_EQUIPMENT" ]; then
            echo "  Using equipment: $FIRST_EQUIPMENT"
            
            # Test enhanced metrics
            echo -e "\n📈 Testing enhanced metrics..."
            METRICS=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
              "https://localhost:3344/ecc800/api/enhanced-metrics/metrics?site_code=DC&equipment_id=$FIRST_EQUIPMENT&time_range=1h" 2>/dev/null)
              
            if echo "$METRICS" | grep -q "\[\]" || echo "$METRICS" | grep -q "name.*value"; then
                echo "✅ Enhanced Metrics API working"
                echo "$METRICS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Found {len(data)} metrics')
    for metric in data[:3]:
        print(f'    - {metric.get(\"name\", \"?\")}: {metric.get(\"value\", \"?\")[:20]} {metric.get(\"unit\", \"?\")}')
except Exception as e:
    print(f'  Response format issue: {e}')
" 2>/dev/null
            else
                echo "❌ Enhanced Metrics API failed"
                echo "Response: $METRICS" | head -200
            fi
            
            # Test metric details
            echo -e "\n📊 Testing metric details..."
            DETAILS=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
              "https://localhost:3344/ecc800/api/enhanced-metrics/metric-details?metric_name=Battery&site_code=DC&equipment_id=$FIRST_EQUIPMENT&time_range=1h" 2>/dev/null)
              
            if echo "$DETAILS" | grep -q "time_series\|chart_config\|null"; then
                echo "✅ Metric Details API working"
            else
                echo "❌ Metric Details API failed"
            fi
        else
            echo "❌ No equipment found to test with"
        fi
    else
        echo "❌ Equipment API failed"
    fi
    
else
    echo "❌ Authentication failed"
fi

echo -e "\n🌐 Step 3: Frontend Check"
echo "Frontend accessible at: http://localhost:3000"
echo "HTTPS frontend at: https://localhost:3344"

echo -e "\n🎉 Validation Complete!"
echo "💡 Open https://localhost:3344 to test in browser"
