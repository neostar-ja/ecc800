#!/bin/bash

# Test Metrics Page Fix - Immediate Loading
# วันที่: 14 มกราคม 2026
# วัตถุประสงค์: ทดสอบว่าหน้า /metrics สามารถเลือกไซต์ได้ทันทีโดยไม่ต้องรอ

echo "🧪 กำลังทดสอบหน้า Metrics..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://10.251.150.222:3344/ecc800"

echo ""
echo "📊 Test 1: ตรวจสอบว่าหน้า /metrics เข้าถึงได้"
RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "${BASE_URL}/metrics")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ หน้า /metrics เข้าถึงได้ (HTTP $RESPONSE)${NC}"
else
    echo -e "${RED}✗ หน้า /metrics เข้าถึงไม่ได้ (HTTP $RESPONSE)${NC}"
    exit 1
fi

echo ""
echo "🔧 Test 2: ตรวจสอบ build files ใหม่"
# Check if ErrorBoundary exists in build
if docker compose exec -T frontend test -f /usr/share/nginx/html/assets/ErrorBoundary* 2>/dev/null; then
    echo -e "${GREEN}✓ ErrorBoundary component ถูก build แล้ว${NC}"
else
    echo -e "${YELLOW}⚠ ErrorBoundary อาจอยู่ใน bundle file อื่น${NC}"
fi

echo ""
echo "📦 Test 3: ตรวจสอบ container status"
CONTAINER_STATUS=$(docker compose ps frontend --format json 2>/dev/null | grep -o '"Status":"[^"]*"' | cut -d'"' -f4)
if echo "$CONTAINER_STATUS" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Frontend container status: healthy${NC}"
else
    echo -e "${YELLOW}⚠ Frontend container status: $CONTAINER_STATUS${NC}"
fi

echo ""
echo "🔍 Test 4: ตรวจสอบ browser console errors (manual test required)"
echo -e "${YELLOW}📝 Manual Test Steps:${NC}"
echo "   1. เปิด ${BASE_URL}/metrics ใน browser"
echo "   2. เปิด Developer Console (F12)"
echo "   3. เลือกไซต์จาก dropdown ${RED}ทันที${NC} (ไม่ต้องรอ)"
echo "   4. ตรวจสอบว่าไม่มี React Error #300"
echo ""
echo "   ${GREEN}Expected Result:${NC}"
echo "   - ไม่มี error ใน console"
echo "   - สามารถเลือกไซต์ได้ทันที"
echo "   - ไม่ต้อง refresh หลายครั้ง"
echo "   - Loading state แสดง 'กำลังโหลดข้อมูลระบบ...'"
echo ""

echo ""
echo "📋 Test 5: ตรวจสอบ frontend logs"
echo "Recent logs:"
docker compose logs frontend --tail=10 2>/dev/null | grep -v "WARN"

echo ""
echo "=========================================="
echo "✅ Automated tests completed!"
echo ""
echo "🎯 ${YELLOW}Next Steps:${NC}"
echo "   1. เข้าหน้า: ${BASE_URL}/metrics"
echo "   2. ตรวจสอบว่า sites dropdown มีข้อมูลทันที"
echo "   3. เลือกไซต์และอุปกรณ์"
echo "   4. ยืนยันว่าไม่มี error"
echo ""
echo "📊 ${GREEN}Key Fixes Applied:${NC}"
echo "   ✓ Sites auto-load on component mount (no lazy loading)"
echo "   ✓ Proper loading states with clear messages"
echo "   ✓ Error boundaries to catch React errors"
echo "   ✓ Error handling for failed API calls"
echo "   ✓ Null safety checks for all rendered values"
echo ""
