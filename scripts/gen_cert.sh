#!/bin/bash
# สคริปต์สำหรับสร้าง TLS certificates สำหรับ ECC800

set -e

CERT_DIR="/opt/code/ecc800/ecc800/certs"
DOMAIN="ecc800.local"
IP="10.251.150.222"

echo "🔐 กำลังสร้าง TLS certificates สำหรับ ECC800..."

# สร้างโฟลเดอร์ certs
mkdir -p "$CERT_DIR"

# สร้าง private key
echo "📝 กำลังสร้าง private key..."
openssl genrsa -out "$CERT_DIR/ecc800.key" 2048

# สร้าง certificate signing request (CSR) configuration
echo "📋 กำลังสร้างไฟล์ config..."
cat > "$CERT_DIR/ecc800.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=TH
ST=Nakhon Si Thammarat
L=Nakhon Si Thammarat
O=Walailak University Hospital
OU=Digital Infrastructure Team
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = ecc800
IP.1 = $IP
IP.2 = 127.0.0.1
EOF

# สร้าง CSR
echo "📄 กำลังสร้าง Certificate Signing Request..."
openssl req -new -key "$CERT_DIR/ecc800.key" -out "$CERT_DIR/ecc800.csr" -config "$CERT_DIR/ecc800.conf"

# สร้าง self-signed certificate
echo "🎫 กำลังสร้าง self-signed certificate..."
openssl x509 -req -in "$CERT_DIR/ecc800.csr" -signkey "$CERT_DIR/ecc800.key" \
  -out "$CERT_DIR/ecc800.crt" -days 365 -extensions v3_req -extfile "$CERT_DIR/ecc800.conf"

# สร้าง DH parameters สำหรับ Nginx
echo "🔐 กำลังสร้าง DH parameters (อาจใช้เวลาสักครู่)..."
openssl dhparam -out "$CERT_DIR/dhparam.pem" 2048

# ตั้งค่าสิทธิ์ไฟล์
chmod 600 "$CERT_DIR/ecc800.key"
chmod 644 "$CERT_DIR/ecc800.crt"
chmod 644 "$CERT_DIR/dhparam.pem"

# ลบไฟล์ temporary
rm -f "$CERT_DIR/ecc800.csr"
rm -f "$CERT_DIR/ecc800.conf"

echo "✅ สร้าง TLS certificates เรียบร้อยแล้ว"
echo ""
echo "📁 ไฟล์ที่สร้าง:"
ls -la "$CERT_DIR"
echo ""
echo "🔍 ข้อมูล certificate:"
openssl x509 -in "$CERT_DIR/ecc800.crt" -text -noout | grep -E "(Subject:|DNS:|IP Address:)"
echo ""
echo "⚠️  หมายเหตุ: นี่เป็น self-signed certificate สำหรับการใช้งานภายใน"
echo "    เบราว์เซอร์จะเตือนเรื่องความปลอดภัย ให้คลิก 'Advanced' และ 'Proceed to site'"
