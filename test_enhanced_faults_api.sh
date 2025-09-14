#!/bin/bash

# Enhanced Faults API Test Script
# สคริปต์ทดสอบ Enhanced Faults API
set -e

BASE_URL="https://localhost:3344/ecc800/api"

echo "🧪 Enhanced Faults API Testing"
echo "=============================="

# Get auth token
echo "🔐 Getting authentication token..."
TOKEN=$(curl -k -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo&password=demo123" | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
    echo "✅ Authentication successful"
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test 1: Faults Time Ranges
echo ""
echo "📋 Test 1: Faults Time Ranges"
RESPONSE=$(curl -k -s -X GET "${BASE_URL}/enhanced-faults/time-ranges" \
  -H "Authorization: Bearer $TOKEN")
if [[ $RESPONSE == *"predefined"* ]]; then
    echo "✅ Faults time ranges API working"
else
    echo "❌ Faults time ranges API failed"
    echo "Response: $RESPONSE"
fi

# Test 2: Fault Types
echo ""
echo "🔍 Test 2: Fault Types"
RESPONSE=$(curl -k -s -X GET "${BASE_URL}/enhanced-faults/types?site_code=DC&time_range=24h" \
  -H "Authorization: Bearer $TOKEN")
if [[ $RESPONSE == *"types"* ]] || [[ $RESPONSE == *"\[\]"* ]]; then
    echo "✅ Fault types API working"
else
    echo "❌ Fault types API failed"
    echo "Response: $RESPONSE"
fi

# Test 3: Enhanced Faults
echo ""
echo "📊 Test 3: Enhanced Faults"
RESPONSE=$(curl -k -s -X GET "${BASE_URL}/enhanced-faults?site_code=DC&time_range=24h&limit=5" \
  -H "Authorization: Bearer $TOKEN")
if [[ $RESPONSE == *"data"* ]] || [[ $RESPONSE == *"\[\]"* ]]; then
    echo "✅ Enhanced faults API working"
else
    echo "❌ Enhanced faults API failed"
    echo "Response: $RESPONSE"
fi

# Test 4: Faults Summary
echo ""
echo "📈 Test 4: Faults Summary"
RESPONSE=$(curl -k -s -X GET "${BASE_URL}/enhanced-faults/summary?site_code=DC&time_range=24h" \
  -H "Authorization: Bearer $TOKEN")
if [[ $RESPONSE == *"total"* ]] || [[ $RESPONSE == *"summary"* ]]; then
    echo "✅ Faults summary API working"
else
    echo "❌ Faults summary API failed"
    echo "Response: $RESPONSE"
fi

# Test 5: Faults Timeline
echo ""
echo "⏰ Test 5: Faults Timeline"
RESPONSE=$(curl -k -s -X GET "${BASE_URL}/enhanced-faults/timeline?site_code=DC&time_range=24h&interval=1h" \
  -H "Authorization: Bearer $TOKEN")
if [[ $RESPONSE == *"timeline"* ]] || [[ $RESPONSE == *"\[\]"* ]]; then
    echo "✅ Faults timeline API working"
else
    echo "❌ Faults timeline API failed"
    echo "Response: $RESPONSE"
fi

echo ""
echo "🎉 Testing complete!"
echo "🌐 Visit https://localhost:3344/ecc800/faults to see the Enhanced Faults page"
    
    # Test 1: Time Ranges for Faults
    echo -e "\n📋 Test 1: Faults Time Ranges"
    TIME_RANGES=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-faults/time-ranges" 2>/dev/null)
    
    if echo "$TIME_RANGES" | grep -q "predefined"; then
        echo "✅ Faults time ranges API working"
        echo "$TIME_RANGES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Predefined ranges: {len(data[\"predefined\"])}')
    print(f'  Severities: {len(data[\"severities\"])}')
    for severity in data['severities']:
        print(f'    - {severity[\"value\"]}: {severity[\"label\"]}')
except Exception as e:
    print(f'  Error parsing: {e}')
" 2>/dev/null
    else
        echo "❌ Faults time ranges API failed"
        echo "Response: $TIME_RANGES"
    fi
    
    # Test 2: Fault Types
    echo -e "\n🔍 Test 2: Fault Types"
    FAULT_TYPES=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-faults/faults/types?site_code=DC&time_range=24h" 2>/dev/null)
    
    if echo "$FAULT_TYPES" | grep -q "\[" && echo "$FAULT_TYPES" | grep -q "fault_type"; then
        echo "✅ Fault types API working"
        echo "$FAULT_TYPES" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Found {len(data)} fault types')
    for ft in data[:5]:
        print(f'    - {ft[\"fault_type\"][:50]}... : {ft[\"count\"]} occurrences')
except Exception as e:
    print(f'  Error parsing: {e}')
" 2>/dev/null
    else
        echo "❌ Fault types API failed"
        echo "Response: $FAULT_TYPES" | head -200
    fi
    
    # Test 3: Enhanced Faults List
    echo -e "\n📊 Test 3: Enhanced Faults"
    FAULTS=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-faults/faults?site_code=DC&time_range=24h&limit=5" 2>/dev/null)
    
    if echo "$FAULTS" | grep -q "\[" && (echo "$FAULTS" | grep -q "fault_type" || echo "$FAULTS" | grep -q "\[\]"); then
        echo "✅ Enhanced faults API working"
        echo "$FAULTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Found {len(data)} faults')
    for fault in data[:3]:
        print(f'    - {fault[\"equipment_name\"][:30]}...')
        print(f'      Type: {fault[\"fault_type\"][:40]}...')
        print(f'      Severity: {fault[\"severity\"]} | Value: {fault[\"value\"]} {fault[\"unit\"]}')
        print(f'      Time: {fault[\"timestamp\"]}')
        print()
except Exception as e:
    print(f'  Error parsing: {e}')
" 2>/dev/null
    else
        echo "❌ Enhanced faults API failed"
        echo "Response: $FAULTS" | head -200
    fi
    
    # Test 4: Faults Summary
    echo -e "\n📈 Test 4: Faults Summary"
    SUMMARY=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-faults/faults/summary?site_code=DC&time_range=24h" 2>/dev/null)
    
    if echo "$SUMMARY" | grep -q "total_faults"; then
        echo "✅ Faults summary API working"
        echo "$SUMMARY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Total faults: {data[\"total_faults\"]}')
    print(f'  Affected equipment: {data[\"affected_equipment\"]}')
    print(f'  Fault types: {data[\"fault_types\"]}')
    print(f'  Time range: {data[\"time_range\"]}')
except Exception as e:
    print(f'  Error parsing: {e}')
" 2>/dev/null
    else
        echo "❌ Faults summary API failed"
        echo "Response: $SUMMARY"
    fi
    
    # Test 5: Faults Timeline
    echo -e "\n⏰ Test 5: Faults Timeline"
    TIMELINE=$(curl -s -k -H "Authorization: Bearer $TOKEN" \
      "https://localhost:3344/ecc800/api/enhanced-faults/faults/timeline?site_code=DC&time_range=24h&interval=1h" 2>/dev/null)
    
    if echo "$TIMELINE" | grep -q "\[" && (echo "$TIMELINE" | grep -q "timestamp" || echo "$TIMELINE" | grep -q "\[\]"); then
        echo "✅ Faults timeline API working"
        echo "$TIMELINE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  Found {len(data)} timeline points')
    for point in data[:3]:
        print(f'    - {point[\"timestamp\"]}: {point[\"fault_count\"]} faults')
except Exception as e:
    print(f'  Error parsing: {e}')
" 2>/dev/null
    else
        echo "❌ Faults timeline API failed"
        echo "Response: $TIMELINE" | head -100
    fi
    
else
    echo "❌ Authentication failed"
fi

echo -e "\n🎉 Testing complete!"
echo "🌐 Visit https://localhost:3344/ecc800/faults to see the Enhanced Faults page"
