# บันทึกการแก้ไขปัญหา site_code Mismatch (2025-08-30)

## ปัญหาที่พบ

### 1. ปัญหาความไม่ตรงกันของ site_code
**สาเหตุ**: 
- ตาราง `data_centers` เก็บ site_code เป็นตัวพิมพ์ใหญ่: 'DR', 'DC'
- ตารางอื่นๆ (`performance_equipment_master`, `performance_data`, `equipment_aliases`) เก็บเป็นตัวพิมพ์เล็ก: 'dr', 'dc'
- ทำให้ JOIN และ WHERE conditions ไม่ตรงกัน

### 2. ปัญหาการเข้าถึงข้อมูลใน Python Backend
**สาเหตุ**:
- ฟังก์ชัน `execute_raw_query()` return dictionary แทน object
- โค้ดพยายามเข้าถึงด้วย `.attribute` แทนที่จะเป็น `["key"]`
- Error: `'dict' object has no attribute 'site_code'`

## การแก้ไข

### 1. แก้ไขข้อมูลในฐานข้อมูล
```sql
-- อัปเดต site_code ใน data_centers ให้เป็นตัวพิมพ์เล็ก
UPDATE data_centers SET site_code = 'dr' WHERE site_code = 'DR';
UPDATE data_centers SET site_code = 'dc' WHERE site_code = 'DC';
```

### 2. แก้ไขโค้ด Python Backend
แก้ไขไฟล์: `/opt/code/ecc800/ecc800/backend/app/api/routes/sites.py`

**ก่อนแก้ไข**:
```python
equipment = equipment_result[0]
return {
    "equipment": {
        "site_code": equipment.site_code,  # Error: dict has no attribute
        "equipment_id": equipment.equipment_id,
        # ...
    }
}
```

**หลังแก้ไข**:
```python
equipment = equipment_result[0]
return {
    "equipment": {
        "site_code": equipment["site_code"],  # ใช้ dict access
        "equipment_id": equipment["equipment_id"],
        # ...
    }
}
```

### 3. รายละเอียดการแก้ไขในแต่ละฟังก์ชัน

#### ฟังก์ชัน `get_equipment_details()`
- แก้ไขการเข้าถึง `equipment` dictionary
- แก้ไขการเข้าถึง `metrics` และ `recent_data` arrays

#### ฟังก์ชัน `update_equipment_name()`
- แก้ไขการเข้าถึง `existing[0]["equipment_name"]`

## ผลลัพธ์หลังการแก้ไข

### 1. ความสอดคล้องของข้อมูล
```
data_centers:         ['dr', 'dc']
equipment_master:     ['dr', 'dc'] 
performance_data:     ['dr', 'dc']
```

### 2. API ที่ทำงานได้ปรกติ
- ✅ GET `/ecc800/api/equipment/{site_code}/{equipment_id}/details`
- ✅ PUT `/ecc800/api/equipment/{site_code}/{equipment_id}/name`
- ✅ GET `/ecc800/api/sites`
- ✅ GET `/ecc800/api/equipment`

### 3. Frontend ที่ทำงานได้
- ✅ หน้า Equipment สามารถดูรายละเอียดอุปกรณ์ได้
- ✅ การเปลี่ยนชื่อแสดงอุปกรณ์ทำงานได้
- ✅ รายการ Site แสดงข้อมูลถูกต้อง

## บทเรียนที่ได้

### 1. การตั้งชื่อและมาตรฐาน
- ควรกำหนดมาตรฐานการเขียน (เช่น lowercase สำหรับ site_code)
- ใช้ constraints และ check functions เพื่อบังคับมาตรฐาน

### 2. การจัดการข้อมูลจาก Database
- ตรวจสอบประเภทข้อมูลที่ return จากฟังก์ชัน database
- ใช้ type hints และ testing เพื่อป้องกันปัญหาเหล่านี้

### 3. การ Debug
- ตรวจสอบ logs เพื่อหาจุดที่เกิดข้อผิดพลาด
- ใช้ database query tools เพื่อตรวจสอบข้อมูลโดยตรง

---

**สถานะ**: ✅ แก้ไขเสร็จสิ้น  
**ผู้จัดทำ**: ทีมพัฒนาระบบ ECC800  
**วันที่**: 30 สิงหาคม 2025
