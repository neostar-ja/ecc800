#!/bin/bash
# สคริปต์สำหรับรัน ECC800 ในโหมด development

set -e

echo "🚀 เริ่มต้น ECC800 Development Environment"

# ตรวจสอบว่า Docker และ Docker Compose พร้อมใช้งาน
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ไม่พบ กรุณาติดตั้ง Docker ก่อน"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose ไม่พบ กรุณาติดตั้ง Docker Compose ก่อน"
    exit 1
fi

# ตรวจสอบไฟล์ .env
if [ ! -f ".env" ]; then
    echo "❌ ไม่พบไฟล์ .env กรุณาสร้างไฟล์ .env ก่อน"
    exit 1
fi

# ดาวน์โหลดโลโก้
echo "📥 กำลังดาวน์โหลดโลโก้..."
chmod +x scripts/fetch_logo.sh
./scripts/fetch_logo.sh

# สร้าง TLS certificates
echo "🔐 กำลังสร้าง TLS certificates..."
chmod +x scripts/gen_cert.sh
./scripts/gen_cert.sh

# Build และรันในโหมด development
echo "🔨 กำลัง build และรัน services..."
docker compose -f compose.yaml build --parallel
docker compose -f compose.yaml up -d

echo "⏳ รอให้ services พร้อม..."
sleep 10

# ตรวจสอบสถานะ services
echo "📊 สถานะ services:"
docker compose ps

# แสดง logs แบบสั้น
echo "📋 Logs ล่าสุด:"
docker compose logs --tail=20

echo ""
echo "✅ ECC800 Development Environment พร้อมแล้ว!"
echo ""
echo "🌐 เข้าถึงระบบได้ที่:"
echo "   https://10.251.150.222:3344/ecc800/"
echo ""
echo "🔍 ตรวจสอบ logs:"
echo "   docker compose logs -f [service_name]"
echo ""
echo "🛑 หยุดระบบ:"
echo "   docker compose down"
echo ""
echo "🔧 รีสตาร์ท service:"
echo "   docker compose restart [service_name]"
