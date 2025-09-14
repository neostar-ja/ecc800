# บันทึกการแก้ไขปัญหาระบบ ECC800 (2025-08-30)

## ปัญหาที่แก้ไข

### 1. ปัญหา Equipment Details API (500 Internal Server Error)
- **สาเหตุ**: การอ้างอิงตาราง `equipment_name_overrides` แทนที่จะเป็น `equipment_aliases` และใช้ฟิลด์ `display_name` แทนที่จะเป็น `alias_name`
- **การแก้ไข**: 
  - อัปเดต SQL query ในฟังก์ชัน `get_equipment_details` เพื่อใช้ตาราง `equipment_aliases` และฟิลด์ `alias_name` 
  - แก้ไขการแสดงผลโดยใช้ `alias_name as display_name` เพื่อความเข้ากันได้กับ frontend

### 2. ปัญหา Update Equipment Name (500 Internal Server Error)
- **สาเหตุ**: เดิมใช้ตาราง `equipment_name_overrides` ซึ่งไม่มีอยู่ในระบบ
- **การแก้ไข**:
  - อัปเดต SQL query ในฟังก์ชัน `update_equipment_name` เพื่อใช้ตาราง `equipment_aliases` 
  - เพิ่มฟิลด์ `scope` เป็น 'device' ในคำสั่ง INSERT
  - แก้ไข ON CONFLICT clause ให้รองรับ constraint ที่ถูกต้อง

### 3. ปัญหา Admin Equipment Overrides API (AmbiguousParameterError)
- **สาเหตุ**: ข้อผิดพลาดในการแปลงประเภทของพารามิเตอร์ในคำสั่ง SQL
- **การแก้ไข**: 
  - เพิ่มการแปลงประเภทชัดเจนด้วย `CAST($1 as TEXT)` ในคำสั่ง SQL
  - แก้ไขชื่อฟิลด์จาก `display_name` เป็น `alias_name as display_name`

### 4. ปัญหา Reports Page - TypeError: (u || []).slice is not a function
- **สาเหตุ**: การใช้ฟังก์ชัน .slice() กับตัวแปรที่อาจเป็น undefined ถึงแม้จะมีการเพิ่ม || [] แล้ว
- **การแก้ไข**: 
  - ตรวจสอบว่าทุกจุดที่ใช้ .slice() ในไฟล์ ReportsPage.tsx มีการป้องกัน undefined ด้วย (array || [])
  - แก้ไข 4 จุดใน ReportsPage.tsx ที่มีการใช้ .slice()

### 5. ปัญหาไฟล์ assets ไม่พบ (404)
- **สาเหตุ**: ไม่มีไฟล์ wuh_logo.png ในโฟลเดอร์ assets
- **การแก้ไข**:
  - สร้างโฟลเดอร์ assets ใน frontend/public
  - เพิ่มไฟล์ wuh_logo.svg และ wuh_logo.png

## โครงสร้างฐานข้อมูลที่ใช้

ระบบใช้ตารางหลักต่อไปนี้:

### 1. performance_equipment_master
- ตารางหลักสำหรับเก็บข้อมูลอุปกรณ์
- ฟิลด์หลัก: site_code, equipment_id, equipment_name, equipment_type, description

### 2. equipment_aliases (แทน equipment_name_overrides)
- เก็บการตั้งค่าชื่อแทนของอุปกรณ์
- ฟิลด์หลัก: id, site_code, equipment_id, original_name, alias_name, scope, updated_by
- Constraint: (scope, site_code, equipment_id, alias_name) เป็น unique

### 3. performance_data
- เก็บข้อมูลเมตริกต่างๆ ของอุปกรณ์
- ฟิลด์หลัก: site_code, equipment_id, performance_data, statistical_start_time, value_numeric, value_text, unit

## คำแนะนำการใช้งานในอนาคต

1. **การเพิ่มอุปกรณ์ใหม่**:
   - ใช้หน้า Admin เพื่อเพิ่มอุปกรณ์
   - ตรวจสอบให้แน่ใจว่า site_code และ equipment_id ไม่ซ้ำกับที่มีอยู่

2. **การเปลี่ยนชื่อแสดงอุปกรณ์**:
   - ใช้หน้า Equipment หรือ Admin Equipment Overrides
   - ระบบจะเก็บทั้งชื่อเดิมและชื่อที่ตั้งใหม่

3. **การดูแลฐานข้อมูล**:
   - ตรวจสอบสถานะการเชื่อมต่อฐานข้อมูลในหน้า Admin
   - หากข้อมูลมีปริมาณมาก ควรพิจารณาการสร้าง materialized views หรือการ partition ตาราง

4. **การแก้ไขปัญหาทั่วไป**:
   - ตรวจสอบ logs ของ backend เพื่อดูรายละเอียดข้อผิดพลาด
   - ตรวจสอบ JavaScript console ในเบราว์เซอร์เพื่อดูข้อผิดพลาดของ frontend
   - ใช้คำสั่ง `docker-compose restart backend` หรือ `docker-compose restart frontend` เพื่อรีสตาร์ทแต่ละส่วนของระบบ

---

จัดทำโดย: ทีมพัฒนาระบบ ECC800
วันที่: 30 สิงหาคม 2025
