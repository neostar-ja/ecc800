#!/bin/bash

echo "🔧 Building ECC800 Frontend..."

# ตรวจสอบ Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ไม่ได้ติดตั้ง"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production
echo "🏗️  Building for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build เสร็จสิ้น"
    ls -la dist/
else
    echo "❌ Frontend build ล้มเหลว"
    exit 1
fi
