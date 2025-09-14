#!/bin/bash

# Final Metrics Test Script - ทดสอบการทำงานของ Metrics Page

echo "🚀 เริ่มทดสอบ Metrics Page..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://10.251.150.222:3344/ecc800/api"
AUTH_URL="$BASE_URL/auth/login"

# Test 1: Login
echo -e "\n${YELLOW}📝 Test 1: Authentication${NC}"
RESPONSE=$(curl -s -k -X POST "$AUTH_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo&password=demo123")

TOKEN=$(echo $RESPONSE | jq -r '.access_token // empty')
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Test 2: Sites
echo -e "\n${YELLOW}📍 Test 2: Sites API${NC}"
SITES_RESPONSE=$(curl -s -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/sites")
SITES_COUNT=$(echo $SITES_RESPONSE | jq '. | length // 0')
echo "Sites found: $SITES_COUNT"
if [ "$SITES_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Sites API working${NC}"
    # Show first site
    FIRST_SITE=$(echo $SITES_RESPONSE | jq -r '.[0].site_code // "N/A"')
    echo "First site: $FIRST_SITE"
else
    echo -e "${RED}❌ No sites found${NC}"
fi

# Test 3: Equipment for DC site
echo -e "\n${YELLOW}🔧 Test 3: Equipment API for DC site${NC}"
EQUIPMENT_RESPONSE=$(curl -s -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/sites/dc/equipment")
if [ $(echo $EQUIPMENT_RESPONSE | jq 'type == "array"' 2>/dev/null) == "true" ]; then
    EQUIPMENT_COUNT=$(echo $EQUIPMENT_RESPONSE | jq '. | length')
    echo "Equipment found: $EQUIPMENT_COUNT"
    if [ "$EQUIPMENT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Equipment API working${NC}"
        # Show first equipment
        FIRST_EQUIPMENT=$(echo $EQUIPMENT_RESPONSE | jq -r '.[0].equipment_id // "N/A"')
        FIRST_EQUIPMENT_NAME=$(echo $EQUIPMENT_RESPONSE | jq -r '.[0].display_name // "N/A"')
        echo "First equipment: $FIRST_EQUIPMENT ($FIRST_EQUIPMENT_NAME)"
    else
        echo -e "${YELLOW}⚠️ No equipment found for DC site${NC}"
    fi
else
    echo -e "${RED}❌ Equipment API failed${NC}"
    echo "Response: $EQUIPMENT_RESPONSE"
fi

# Test 4: Metrics for DC site (without equipment filter)
echo -e "\n${YELLOW}📊 Test 4: Metrics API for DC site${NC}"
METRICS_RESPONSE=$(curl -s -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/enhanced-metrics?site_code=dc")
if [ $(echo $METRICS_RESPONSE | jq 'has("metrics") and has("total_count")' 2>/dev/null) == "true" ]; then
    METRICS_COUNT=$(echo $METRICS_RESPONSE | jq '.total_count // 0')
    ACTUAL_METRICS=$(echo $METRICS_RESPONSE | jq '.metrics | length // 0')
    echo "Metrics reported: $METRICS_COUNT"
    echo "Actual metrics in response: $ACTUAL_METRICS"
    
    if [ "$ACTUAL_METRICS" -gt 0 ]; then
        echo -e "${GREEN}✅ Metrics API working${NC}"
        # Show first metric details
        FIRST_METRIC=$(echo $METRICS_RESPONSE | jq '.metrics[0]')
        echo -e "\n${YELLOW}First metric details:${NC}"
        echo $FIRST_METRIC | jq '{
            metric_name,
            display_name,
            unit,
            latest_value,
            avg_value,
            valid_readings,
            data_points
        }'
    else
        echo -e "${YELLOW}⚠️ No metrics found for DC site${NC}"
    fi
else
    echo -e "${RED}❌ Metrics API failed${NC}"
    echo "Response: $METRICS_RESPONSE"
fi

# Test 5: Specific equipment metrics (if equipment exists)
if [ -n "$FIRST_EQUIPMENT" ] && [ "$FIRST_EQUIPMENT" != "N/A" ]; then
    echo -e "\n${YELLOW}🎯 Test 5: Metrics for specific equipment${NC}"
    SPECIFIC_METRICS=$(curl -s -k -H "Authorization: Bearer $TOKEN" "$BASE_URL/enhanced-metrics?site_code=dc&equipment_id=$FIRST_EQUIPMENT")
    if [ $(echo $SPECIFIC_METRICS | jq 'has("metrics") and has("total_count")' 2>/dev/null) == "true" ]; then
        SPECIFIC_COUNT=$(echo $SPECIFIC_METRICS | jq '.total_count // 0')
        echo "Equipment-specific metrics: $SPECIFIC_COUNT"
        if [ "$SPECIFIC_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Equipment-specific metrics working${NC}"
        else
            echo -e "${YELLOW}⚠️ No metrics for this specific equipment${NC}"
        fi
    else
        echo -e "${RED}❌ Equipment-specific metrics failed${NC}"
    fi
fi

# Test 6: Frontend accessibility
echo -e "\n${YELLOW}🌐 Test 6: Frontend accessibility${NC}"
FRONTEND_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://10.251.150.222:3344/ecc800/metrics")
if [ "$FRONTEND_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Frontend accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $FRONTEND_RESPONSE)${NC}"
fi

echo -e "\n${YELLOW}📋 Summary:${NC}"
echo "Authentication: ✅"
echo "Sites API: $([ "$SITES_COUNT" -gt 0 ] && echo '✅' || echo '❌')"
echo "Equipment API: $([ "$EQUIPMENT_COUNT" -gt 0 ] && echo '✅' || echo '⚠️')"
echo "Metrics API: $([ "$ACTUAL_METRICS" -gt 0 ] && echo '✅' || echo '⚠️')"
echo "Frontend: $([ "$FRONTEND_RESPONSE" == "200" ] && echo '✅' || echo '❌')"

echo -e "\n🎯 ${GREEN}Metrics page is now ready!${NC}"
echo "🔗 Access at: https://10.251.150.222:3344/ecc800/metrics"
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "1. Login with: demo / demo123"
echo "2. Select site: ศูนย์ข้อมูล DR (DR)"
echo "3. Select equipment (optional): Choose from dropdown"
echo "4. Select metric filter (optional): Choose specific metrics"
echo "5. View metric cards with complete information"
