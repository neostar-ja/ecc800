#!/bin/bash
# สคริปต์สำหรับรัน ECC800 ในโหมด production

set -e

echo "🚀 เริ่มต้น ECC800 Production Environment"

# ตรวจสอบว่าเป็น root หรือมีสิทธิ์ sudo
if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
    echo "❌ ต้องรันด้วย sudo หรือผู้ใช้ที่อยู่ใน docker group"
    exit 1
fi

# ตรวจสอบ prerequisites
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
    echo "📝 ตัวอย่างไฟล์ .env:"
    cat << EOF
POSTGRES_HOST=10.251.150.222
POSTGRES_PORT=5210
POSTGRES_DB=ecc800
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
JWT_SECRET=your-jwt-secret-change-this
JWT_EXPIRES_HOURS=24
APP_BASE_PATH=/ecc800
PUBLIC_BASE_URL=https://10.251.150.222:3344/ecc800
EOF
    exit 1
fi

# หยุด containers เก่าถ้ามี
echo "🛑 หยุด containers เก่า..."
docker compose down --remove-orphans

# ลบ images เก่า (optional)
echo "🧹 ลบ images เก่า..."
docker compose down --rmi local --volumes --remove-orphans 2>/dev/null || true

# ดาวน์โหลดโลโก้
echo "📥 เตรียมโลโก้..."
chmod +x scripts/fetch_logo.sh
./scripts/fetch_logo.sh

# สร้าง TLS certificates
echo "🔐 เตรียม TLS certificates..."
chmod +x scripts/gen_cert.sh
./scripts/gen_cert.sh

# Build ใหม่ทั้งหมด
echo "🔨 Build services สำหรับ production..."
docker compose build --no-cache --parallel

# เริ่มต้น services
echo "▶️ เริ่มต้น services..."
docker compose up -d

# รอให้ services พร้อม
echo "⏳ รอให้ services พร้อม..."
for i in {1..30}; do
    if docker compose ps | grep -q "Up"; then
        if curl -k -s https://localhost:3344/health > /dev/null 2>&1; then
            break
        fi
    fi
    echo "   รอ... ($i/30)"
    sleep 5
done

# ตรวจสอบ health checks
echo "🏥 ตรวจสอบ health status..."
docker compose ps

# แสดงสถานะ containers
echo "📊 สถานะ containers:"
docker ps --filter "name=ecc800" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ตรวจสอบ logs หาข้อผิดพลาด
echo "📋 ตรวจสอบ logs..."
if docker compose logs --tail=50 | grep -i error; then
    echo "⚠️  พบข้อผิดพลาดใน logs กรุณาตรวจสอบ"
fi

# Test API endpoint
echo "🧪 ทดสอบ API..."
if curl -k -s "https://localhost:3344/ecc800/api/health" | grep -q "ok"; then
    echo "✅ API Response: OK"
else
    echo "⚠️  API ไม่ตอบสนอง"
fi

echo ""
echo "🎉 ECC800 Production Environment พร้อมแล้ว!"
echo ""
echo "🌐 เข้าถึงระบบได้ที่:"
echo "   https://10.251.150.222:3344/ecc800/"
echo ""
echo "👤 บัญชีผู้ใช้เริ่มต้น:"
echo "   Admin:   admin / Admin123!"
echo "   Analyst: analyst / Analyst123!"
echo "   Viewer:  viewer / Viewer123!"
echo ""
echo "🔍 คำสั่งที่เป็นประโยชน์:"
echo "   docker compose ps              # ดูสถานะ containers"
echo "   docker compose logs -f         # ดู logs แบบ real-time"
echo "   docker compose restart [name]  # รีสตาร์ท service"
echo "   docker compose down            # หยุดระบบ"
echo "   docker system prune -f         # ลบ unused resources"
echo ""
echo "📖 เอกสาร: docs/README.md"
