#!/bin/bash

# Test Users API
echo "======================================"
echo "Testing Users API with trailing slash"
echo "======================================"
echo ""

# Get token
echo "1. Login to get token..."
TOKEN_RESPONSE=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

echo "Token Response: $TOKEN_RESPONSE"
echo ""

# Try to extract token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Token received (first 30 chars): ${TOKEN:0:30}..."
echo ""

# Test GET /users/
echo "2. Test GET /users/ (list users)..."
USERS_RESPONSE=$(curl -s -k -X GET "https://10.251.150.222:3344/ecc800/api/users/" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: ${USERS_RESPONSE:0:200}..."
echo ""

# Get first user ID
USER_ID=$(echo $USERS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$USER_ID" ]; then
  echo "❌ No users found"
  exit 1
fi

echo "✅ Found user ID: $USER_ID"
echo ""

# Test GET /users/{id}/ (with trailing slash)
echo "3. Test GET /users/$USER_ID/ (get single user WITH trailing slash)..."
USER_GET=$(curl -s -k -w "\nHTTP_CODE:%{http_code}" -X GET "https://10.251.150.222:3344/ecc800/api/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$USER_GET" | grep "HTTP_CODE" | cut -d':' -f2)
RESPONSE=$(echo "$USER_GET" | grep -v "HTTP_CODE")
echo "HTTP Code: $HTTP_CODE"
echo "Response: ${RESPONSE:0:200}..."
echo ""

# Test PUT /users/{id}/ (with trailing slash)
echo "4. Test PUT /users/$USER_ID/ (update user WITH trailing slash)..."
UPDATE_RESPONSE=$(curl -s -k -w "\nHTTP_CODE:%{http_code}" -X PUT "https://10.251.150.222:3344/ecc800/api/users/$USER_ID/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test Update"}')
HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
RESPONSE=$(echo "$UPDATE_RESPONSE" | grep -v "HTTP_CODE")
echo "HTTP Code: $HTTP_CODE"
echo "Response: ${RESPONSE:0:200}..."
echo ""

# Test DELETE /users/{id}/ (with trailing slash) - สร้าง user ใหม่ก่อน
echo "5. Create a test user to delete..."
CREATE_RESPONSE=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_delete_user",
    "password": "test123456",
    "email": "test@example.com",
    "full_name": "Test Delete User",
    "role": "viewer",
    "is_active": true
  }')

TEST_USER_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$TEST_USER_ID" ]; then
  echo "✅ Created test user with ID: $TEST_USER_ID"
  echo ""
  
  echo "6. Test DELETE /users/$TEST_USER_ID/ (WITH trailing slash)..."
  DELETE_RESPONSE=$(curl -s -k -w "\nHTTP_CODE:%{http_code}" -X DELETE "https://10.251.150.222:3344/ecc800/api/users/$TEST_USER_ID/" \
    -H "Authorization: Bearer $TOKEN")
  HTTP_CODE=$(echo "$DELETE_RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
  RESPONSE=$(echo "$DELETE_RESPONSE" | grep -v "HTTP_CODE")
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE"
else
  echo "❌ Failed to create test user"
fi

echo ""
echo "======================================"
echo "Test completed!"
echo "======================================"
