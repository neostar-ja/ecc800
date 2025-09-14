#!/bin/bash
# สคริปต์สำหรับดาวน์โหลดโลโก้โรงพยาบาล

set -e

LOGO_URL="https://10.251.150.222:8443/portsearchuat/static/images/wuh_logo.png"
DEST_DIR="/opt/code/ecc800/ecc800/frontend/public"
LOGO_FILE="$DEST_DIR/wuh_logo.png"

echo "🖼️ กำลังดาวน์โหลดโลโก้โรงพยาบาล..."

# สร้างโฟลเดอร์ถ้าไม่มี
mkdir -p "$DEST_DIR"

# ลองดาวน์โหลดโลโก้
if curl -k -L --connect-timeout 10 --max-time 30 -o "$LOGO_FILE" "$LOGO_URL" 2>/dev/null; then
    # ตรวจสอบว่าไฟล์ที่ดาวน์โหลดมาเป็นรูปภาพหรือไม่
    if file "$LOGO_FILE" | grep -q "image"; then
        echo "✅ ดาวน์โหลดโลโก้สำเร็จ: $LOGO_FILE"
        ls -lh "$LOGO_FILE"
    else
        echo "⚠️  ไฟล์ที่ดาวน์โหลดมาไม่ใช่รูปภาพ กำลังสร้างโลโก้สำรอง..."
        rm -f "$LOGO_FILE"
    fi
else
    echo "⚠️  ไม่สามารถดาวน์โหลดโลโก้ได้ กำลังสร้างโลโก้สำรอง..."
fi

# สร้างโลโก้สำรองถ้าไม่มีไฟล์หรือดาวน์โหลดไม่สำเร็จ
if [ ! -f "$LOGO_FILE" ]; then
    echo "🔧 กำลังสร้างโลโก้สำรอง (SVG)..."
    
    cat > "$DEST_DIR/wuh_logo.svg" << 'EOF'
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="8" fill="#7B5BA4"/>
  <rect x="8" y="8" width="48" height="48" rx="4" fill="#F17422"/>
  <text x="32" y="28" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">WU</text>
  <text x="32" y="44" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="6">HOSPITAL</text>
</svg>
EOF
    
    echo "✅ สร้างโลโก้สำรอง SVG เรียบร้อย"
    
    # เปลี่ยนชื่อให้เป็น PNG เพื่อให้ index.html ใช้งานได้
    cp "$DEST_DIR/wuh_logo.svg" "$LOGO_FILE"
fi

echo "🎯 เสร็จสิ้นการเตรียมโลโก้"
