#!/bin/bash

# ECC800 API Testing Script
# สคริปต์สำหรับทดสอบ API endpoints

BASE_URL="https://10.251.150.222:3344/ecc800"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secret"

echo "🏥 ECC800 Data Center Monitoring System - API Tests"
echo "========================================================"

# Test 1: Health Check
echo "📊 1. Testing Health Check..."
health_response=$(curl -s -k "$BASE_URL/health")
echo "Response: $health_response"

if echo "$health_response" | grep -q "ok"; then
    echo "✅ Health Check: PASSED"
else
    echo "❌ Health Check: FAILED"
    exit 1
fi

echo ""

# Test 2: Authentication Login
echo "🔐 2. Testing Authentication..."
login_data='{"username": "'$ADMIN_USERNAME'", "password": "'$ADMIN_PASSWORD'"}'

# ส่ง login request
login_response=$(curl -s -k -X POST \
  "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_data" 2>/dev/null || echo '{"error": "login failed"}')

echo "Login Response: $login_response"

# Extract token (ถ้ามี)
if echo "$login_response" | grep -q "access_token"; then
    TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Login: PASSED"
    echo "🎫 Token: ${TOKEN:0:50}..."
else
    echo "❌ Login: FAILED (ไม่มี endpoint หรือข้อมูลไม่ถูกต้อง)"
    TOKEN=""
fi

echo ""

# Test 3: API Routes (ถ้ามี token)
if [ -n "$TOKEN" ]; then
    echo "📍 3. Testing Sites API..."
    sites_response=$(curl -s -k \
      "$BASE_URL/api/sites" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo '[]')
    
    echo "Sites Response: $sites_response"
    
    if echo "$sites_response" | grep -q -E '\[|\{'; then
        echo "✅ Sites API: PASSED"
    else
        echo "❌ Sites API: FAILED"
    fi
else
    echo "⏭️  3. Skipping Sites API (ไม่มี token)"
fi

echo ""

# Test 4: Database Connection Test
echo "🗄️  4. Testing Database Connection..."
db_test_response=$(curl -s -k "$BASE_URL/health")
if echo "$db_test_response" | grep -q "database"; then
    echo "✅ Database Health Check: Available in response"
else
    echo "❌ Database Health Check: Not available"
fi

echo ""

# Test 5: Frontend Accessibility
echo "🌐 5. Testing Frontend..."
frontend_response=$(curl -s -k -o /dev/null -w "%{http_code}" "$BASE_URL/")

if [ "$frontend_response" = "200" ] || [ "$frontend_response" = "301" ]; then
    echo "✅ Frontend: PASSED (HTTP $frontend_response)"
else
    echo "❌ Frontend: FAILED (HTTP $frontend_response)"
fi

echo ""
echo "========================================================"
echo "📋 Test Summary:"
echo "   • Health Check: $(curl -s -k "$BASE_URL/health" | grep -q "ok" && echo "✅" || echo "❌")"
echo "   • Authentication: $(echo "$login_response" | grep -q "access_token" && echo "✅" || echo "⚠️")"
echo "   • Frontend: $([ "$frontend_response" = "200" ] || [ "$frontend_response" = "301" ] && echo "✅" || echo "❌")"
echo ""
echo "🚀 URL to visit: $BASE_URL/"
echo "📚 API Documentation: $BASE_URL/docs"
echo ""
