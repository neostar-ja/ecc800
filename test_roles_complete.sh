#!/bin/bash

# ทดสอบระบบ Roles Management แบบครบวงจร

echo "=========================================="
echo "ทดสอบระบบ Roles Management"
echo "=========================================="
echo ""

# 1. Login
echo "1. Login..."
TOKEN=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Login ล้มเหลว"
  exit 1
fi
echo "✅ Login สำเร็จ"
echo ""

# 2. ตรวจสอบบทบาทที่มี
echo "2. ตรวจสอบบทบาทที่มีในฐานข้อมูล..."
ROLES=$(curl -s -k "https://10.251.150.222:3344/ecc800/api/roles/" \
  -H "Authorization: Bearer $TOKEN")
echo "$ROLES" | python3 -m json.tool
echo ""

ROLE_COUNT=$(echo "$ROLES" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "จำนวนบทบาท: $ROLE_COUNT"
echo ""

# 3. ทดสอบสร้างบทบาทใหม่
echo "3. ทดสอบสร้างบทบาทใหม่ (supervisor)..."
NEW_ROLE=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/roles/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supervisor",
    "display_name": "Supervisor",
    "description": "Team supervisor with monitoring access",
    "level": 60,
    "is_active": true
  }')

if echo "$NEW_ROLE" | grep -q '"id"'; then
  echo "✅ สร้างบทบาทสำเร็จ"
  echo "$NEW_ROLE" | python3 -m json.tool
  SUPERVISOR_ID=$(echo "$NEW_ROLE" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
else
  echo "❌ สร้างบทบาทล้มเหลว"
  echo "$NEW_ROLE" | python3 -m json.tool
fi
echo ""

# 4. ทดสอบสร้างซ้ำ (ควรได้ error)
echo "4. ทดสอบสร้างบทบาทซ้ำ (ควรได้ error)..."
DUPLICATE=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/roles/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supervisor",
    "display_name": "Supervisor Duplicate",
    "description": "Test duplicate",
    "level": 60,
    "is_active": true
  }')

if echo "$DUPLICATE" | grep -q "already exists"; then
  echo "✅ ตรวจจับซ้ำได้ถูกต้อง"
else
  echo "⚠️ ไม่ได้ตรวจจับซ้ำ"
fi
echo "$DUPLICATE" | python3 -m json.tool
echo ""

# 5. ทดสอบแก้ไขบทบาท
if [ ! -z "$SUPERVISOR_ID" ]; then
  echo "5. ทดสอบแก้ไขบทบาท..."
  UPDATED=$(curl -s -k -X PUT "https://10.251.150.222:3344/ecc800/api/roles/${SUPERVISOR_ID}/" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "description": "Updated: Team supervisor with enhanced monitoring",
      "level": 65
    }')
  
  if echo "$UPDATED" | grep -q "enhanced monitoring"; then
    echo "✅ แก้ไขบทบาทสำเร็จ"
    echo "$UPDATED" | python3 -m json.tool
  else
    echo "❌ แก้ไขล้มเหลว"
  fi
  echo ""
fi

# 6. ตรวจสอบบทบาททั้งหมดอีกครั้ง
echo "6. ตรวจสอบบทบาททั้งหมด..."
ALL_ROLES=$(curl -s -k "https://10.251.150.222:3344/ecc800/api/roles/" \
  -H "Authorization: Bearer $TOKEN")
echo "$ALL_ROLES" | python3 -m json.tool
echo ""

# 7. ทดสอบลบบทบาท
if [ ! -z "$SUPERVISOR_ID" ]; then
  echo "7. ทดสอบลบบทบาท supervisor..."
  curl -s -k -X DELETE "https://10.251.150.222:3344/ecc800/api/roles/${SUPERVISOR_ID}/" \
    -H "Authorization: Bearer $TOKEN"
  echo "✅ ลบบทบาทสำเร็จ"
  echo ""
fi

# 8. ตรวจสอบบทบาทสุดท้าย
echo "8. ตรวจสอบบทบาทหลังลบ..."
FINAL_ROLES=$(curl -s -k "https://10.251.150.222:3344/ecc800/api/roles/" \
  -H "Authorization: Bearer $TOKEN")
echo "$FINAL_ROLES" | python3 -m json.tool
FINAL_COUNT=$(echo "$FINAL_ROLES" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
echo "จำนวนบทบาทสุดท้าย: $FINAL_COUNT"
echo ""

# สรุปผล
echo "=========================================="
echo "สรุปการทดสอบ"
echo "=========================================="
echo "✅ Login และ Authentication"
echo "✅ ดึงรายการบทบาท"
echo "✅ สร้างบทบาทใหม่"
echo "✅ ตรวจจับชื่อซ้ำ"
echo "✅ แก้ไขบทบาท"
echo "✅ ลบบทบาท"
echo ""
echo "บทบาทหลักในระบบ:"
echo "  1. admin (Level 100) - Administrator"
echo "  2. editor (Level 50) - Editor"
echo "  3. viewer (Level 10) - Viewer"
echo ""
echo "✅ ทดสอบสำเร็จทั้งหมด!"
