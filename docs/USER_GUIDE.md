# ECC800 Data Center Monitoring System - User Guide

## 🚀 เข้าถึงระบบ

### URLs หลัก
- **หน้าหลัก**: https://10.251.150.222:3344/ecc800/
- **จัดการอุปกรณ์**: https://10.251.150.222:3344/ecc800/equipment  
- **รายงาน**: https://10.251.150.222:3344/ecc800/reports
- **API Docs**: https://10.251.150.222:3344/ecc800/docs

### บัญชีผู้ใช้
| Username | Password | สิทธิ์ |
|----------|----------|--------|
| admin | Admin123! | ทุกอย่าง |
| analyst | Analyst123! | ดูและวิเคราะห์ |
| viewer | Viewer123! | ดูอย่างเดียว |

## 📱 การใช้งานหน้าอุปกรณ์ (Equipment Page)

### ฟีเจอร์หลัก
✅ **ค้นหาอุปกรณ์**: พิมพ์ชื่ออุปกรณ์ในช่องค้นหา  
✅ **เลือกไซต์**: เลือก DC หรือ DR  
✅ **ดูรายละเอียด**: คลิกปุ่ม "View Details"  
✅ **แก้ไขชื่อ**: คลิกปุ่ม "Edit Name" ในหน้ารายละเอียด

### วิธีตั้งชื่อเองให้อุปกรณ์
1. เลือกไซต์ที่ต้องการ
2. คลิก "View Details" ที่อุปกรณ์
3. คลิก "Edit Name" 
4. ใส่ชื่อใหม่
5. คลิก "Save"

### หน้ารายละเอียดอุปกรณ์
มี 3 แท็บ:
- **Overview**: ข้อมูลทั่วไป สถานะ ชื่อเดิม/ชื่อที่ตั้งเอง
- **Metrics**: ตัวชี้วัดต่างๆ เช่น อุณหภูมิ ความชื้น
- **Recent Data**: ข้อมูลล่าสุดจากอุปกรณ์

## 📊 หน้ารายงาน (Reports Page)

### รายงานที่มี
- **System Summary**: สรุปภาพรวมระบบ
- **Temperature Report**: รายงานอุณหภูมิ
- **Equipment Status**: สถานะอุปกรณ์
- **Data Quality**: คุณภาพข้อมูล

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. ไม่สามารถโหลดข้อมูลอุปกรณ์ได้
**อาการ**: เห็นข้อความ "ไม่สามารถดึงข้อมูลอุปกรณ์: Query object cannot be interpreted"

**วิธีแก้**: 
- รอสักครู่แล้วลองรีเฟรชหน้า (F5)
- หากยังไม่หาย กรุณาติดต่อทีม IT

#### 2. ไม่สามารถดึงข้อมูลรายงานได้
**อาการ**: เห็นข้อความ "could not determine data type of parameter"

**วิธีแก้**:
- ลองเปลี่ยนช่วงเวลาในรายงาน
- หากยังไม่หาย กรุณาติดต่อทีม IT

#### 3. เข้าสู่ระบบไม่ได้
**อาการ**: เห็นข้อความ "Authentication failed"

**วิธีแก้**:
- ตรวจสอบ username/password ให้ถูกต้อง
- ลองล้าง browser cache (Ctrl+Shift+Del)
- รีสตาร์ทเบราว์เซอร์

#### 4. หน้าเว็บไม่โหลด
**อาการ**: เห็น "This site can't be reached" หรือ SSL error

**วิธีแก้**:
- คลิก "Advanced" แล้วเลือก "Proceed to 10.251.150.222"
- เพิ่ม exception สำหรับ SSL certificate

## 🛠️ สำหรับทีม IT

### การรีสตาร์ทระบบ
```bash
cd /opt/code/ecc800/ecc800
./build_and_start.sh
```

### การตรวจสอบสถานะ
```bash
./manage.sh status
./manage.sh logs backend
./manage.sh test
```

### การแก้ไขปัญหา Query Object Error
ปัญหานี้เกิดจาก FastAPI ส่ง Query object แทนค่าจริง:

1. ตรวจสอบ backend logs
2. รีสตาร์ท backend: `./manage.sh restart backend`
3. หากยังไม่หาย รันใหม่ทั้งระบบ: `./build_and_start.sh`

### ฐานข้อมูล
- ตาราง `performance_equipment_master`: อุปกรณ์หลัก (25 รายการ)
- ตาราง `equipment_name_overrides`: ชื่อที่กำหนดเอง (8 รายการ)

### API Health Check
```bash
curl -k https://10.251.150.222:3344/ecc800/api/health
```

## 📞 ติดต่อสนับสนุน

หากพบปัญหาที่แก้ไขไม่ได้ กรุณาติดต่อ:
- ทีมงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
- โรงพยาบาลวิภาวดี

**Updated**: August 2025
