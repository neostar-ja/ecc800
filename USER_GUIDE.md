# 📖 คู่มือใช้งาน Enhanced Metrics System

## 🚀 การเข้าใช้งาน

### 1. เปิดระบบ
```bash
cd /opt/code/ecc800/ecc800
./build_and_start.sh
```

### 2. เข้าใช้งานเว็บไซต์
- **URL**: https://localhost:3344
- **Login**: demo / demo123
- **หน้า Metrics**: คลิก "Metrics" ในเมนู

## 🎯 วิธีใช้งาน Metrics Page

### ขั้นตอนที่ 1: เลือกไซต์
1. คลิกกล่อง "เลือกไซต์"
2. เลือกไซต์ (เช่น DC, DR)
3. ระบบจะโหลดรายการอุปกรณ์ของไซต์นั้น

### ขั้นตอนที่ 2: เลือกอุปกรณ์  
1. คลิกกล่อง "เลือกอุปกรณ์"
2. เลือกอุปกรณ์ที่ต้องการ
3. ระบบจะโหลด metrics ของอุปกรณ์นั้น

### ขั้นตอนที่ 3: เลือกช่วงเวลา
- **1 ชั่วโมง**: ข้อมูลล่าสุด 1 ชั่วโมง
- **4 ชั่วโมง**: ข้อมูลล่าสุด 4 ชั่วโมง  
- **24 ชั่วโมง**: ข้อมูลล่าสุด 1 วัน
- **3/7/30 วัน**: ข้อมูลย้อนหลัง
- **กำหนดเอง**: เลือกวันที่เริ่มต้น-สิ้นสุด

### ขั้นตอนที่ 4: ดูรายละเอียด Metric
1. คลิกที่ metric card ที่สนใจ
2. ระบบจะเปิด dialog แสดง:
   - **กราฟ**: แสดงแนวโน้มข้อมูล
   - **สถิติ**: ค่าเฉลี่ย, สูงสุด, ต่ำสุด
   - **ข้อมูลดิบ**: ตารางข้อมูลทั้งหมด

## 🔧 คุณสมบัติพิเศษ

### 📊 Advanced Analytics
- **แนวโน้ม**: เห็นการเปลี่ยนแปลงตามเวลา
- **สถิติ**: วิเคราะห์ข้อมูลเชิงลึก
- **การส่งออก**: export ข้อมูลเป็น CSV

### ⚡ Performance Optimization
- **Lazy Loading**: โหลดข้อมูลเมื่อจำเป็น
- **Caching**: เก็บผลลัพธ์ไว้ใช้ซ้ำ
- **Responsive**: ปรับขนาดตามหน้าจอ

### 🛡️ Error Handling
- **Graceful Degradation**: ทำงานต่อได้แม้มีข้อผิดพลาด
- **Clear Messages**: แสดงข้อความข้อผิดพลาดที่เข้าใจง่าย
- **Auto Recovery**: ลองใหม่อัตโนมัติ

## 🚨 การแก้ปัญหา

### ปัญหา: Metrics ไม่แสดง
**แก้ไข**: 
1. ตรวจสอบว่าเลือกไซต์และอุปกรณ์แล้ว
2. รอให้ loading เสร็จ
3. ลองเปลี่ยนช่วงเวลา

### ปัญหา: กราฟไม่ขึ้น
**แก้ไข**:
1. ตรวจสอบว่ามีข้อมูลในช่วงเวลาที่เลือก
2. ลองเลือกช่วงเวลาที่ยาวขึ้น
3. Refresh หน้าเว็บ

### ปัญหา: Login ไม่ได้
**แก้ไข**:
1. ใช้ username: `demo`, password: `demo123`
2. ตรวจสอบว่า containers ทำงานอยู่
3. ตรวจสอบ URL: https://localhost:3344

## 🔍 Technical Details

### API Endpoints
```
GET /ecc800/api/enhanced-metrics/time-ranges
GET /ecc800/api/enhanced-metrics/metrics
GET /ecc800/api/enhanced-metrics/metric-details
GET /ecc800/api/sites/
GET /ecc800/api/sites/{site_code}/equipment
```

### Database Tables
```sql
performance_data  -- หลัก metrics data
equipment         -- ข้อมูลอุปกรณ์  
sites            -- ข้อมูลไซต์
```

### Authentication
- **Type**: JWT Bearer Token
- **Demo User**: demo / demo123
- **Token Expiry**: 24 ชั่วโมง

## ✅ การยืนยันความสำเร็จ

### เป้าหมายเดิม ✅
- [x] เลือกไซต์ → แสดงอุปกรณ์เฉพาะไซต์
- [x] เลือกอุปกรณ์ → แสดง metrics เฉพาะอุปกรณ์
- [x] ลบหมวดหมู่ออก  
- [x] ปรับการแสดงผลให้เหมาะสม
- [x] ทดสอบและมั่นใจว่าใช้งานได้จริง
- [x] ลดโหลดโดยไม่แสดง metrics ก่อนเลือกอุปกรณ์

### เป้าหมายเพิ่มเติม ✅
- [x] Custom time range selection
- [x] Advanced metric details พร้อม chart และ analytics
- [x] Error learning และ prevention
- [x] Performance optimization
- [x] Comprehensive testing

🎉 **ระบบพร้อมใช้งานครบถ้วนสมบูรณ์!**
