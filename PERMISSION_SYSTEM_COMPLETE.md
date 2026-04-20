# ระบบสิทธิ์เมนูที่สมบูรณ์

## การพัฒนาที่ทำ:

### 1. เพิ่มฟีเจอร์แก้ไขเมนู ✅

**ไฟล์:** `/opt/code/ecc800/ecc800/frontend/src/components/MenuPermissionManagementReadOnly.tsx`

**การเปลี่ยนแปลง:**
- เพิ่มปุ่ม "แก้ไข" (Edit icon) ในแต่ละแถวของตารางเมนู
- เพิ่ม state `editingMenu` เพื่อเก็บเมนูที่กำลังแก้ไข
- เพิ่ม mutation `updateMenuMutation` สำหรับอัพเดทเมนู
- แก้ไข Dialog ให้รองรับทั้งโหมด "เพิ่มใหม่" และ "แก้ไข"
- เมื่ออยู่ในโหมดแก้ไข จะไม่แสดงส่วนกำหนดสิทธิ์ (เพราะมีการกำหนดสิทธิ์แยกแล้ว)

**วิธีใช้:**
1. ไปที่ https://10.251.150.222:3344/ecc800/admin
2. เลือกแท็บ "สิทธิ์เมนู"
3. คลิกปุ่มแก้ไข (ไอคอนดินสอ) ในแถวของเมนูที่ต้องการแก้ไข
4. แก้ไขข้อมูลในฟอร์ม
5. คลิก "บันทึก"

---

### 2. ระบบซ่อนเมนูตามสิทธิ์ ✅

**ไฟล์ใหม่:**
- `/opt/code/ecc800/ecc800/frontend/src/contexts/PermissionContext.tsx` - Context สำหรับจัดการสิทธิ์
- `/opt/code/ecc800/ecc800/frontend/src/components/ProtectedRoute.tsx` - Component ป้องกันการเข้าถึง

**การเปลี่ยนแปลง:**

#### 2.1 PermissionContext
- สร้าง Context สำหรับเก็บสิทธิ์ของผู้ใช้ปัจจุบัน
- ดึงข้อมูลสิทธิ์จาก API `/permissions/user/current`
- Cache ข้อมูล 5 นาที เพื่อลดการเรียก API
- มีฟังก์ชัน `canViewMenu(path)` และ `hasPermission(name)` สำหรับตรวจสอบสิทธิ์
- Admin มีสิทธิ์เข้าถึงทุกหน้าโดยอัตโนมัติ

#### 2.2 ProtectedRoute Component
- Component สำหรับห่อ Route ที่ต้องการป้องกัน
- ตรวจสอบสิทธิ์จาก `PermissionContext`
- ถ้าไม่มีสิทธิ์ แสดงหน้า "ไม่มีสิทธิ์เข้าถึง" พร้อม:
  - ไอคอนล็อคสีแดง
  - ข้อความแจ้งเตือนชัดเจน
  - ปุ่ม "กลับหน้าหลัก" และ "ย้อนกลับ"
  - ข้อมูล path ที่พยายามเข้าถึง

#### 2.3 ThaiModernLayout
- แก้ไขการกรองเมนู (navItems) ให้แสดงตามสิทธิ์
- เพิ่มเงื่อนไข `canViewMenu(item.path)` ในการกรองเมนู
- เมนูที่ไม่มีสิทธิ์จะไม่แสดงในเมนูด้านข้างเลย

#### 2.4 App.tsx
- เพิ่ม `PermissionProvider` ครอบ Router
- แก้ไข `ProtectedRoute` เดิมเป็น `SimpleProtectedRoute` (เช็คแค่ login)
- ใช้ `ProtectedRoute` ใหม่ที่ต้องระบุ `requiredPath` ครอบแต่ละ Route
- Routes ที่ได้รับการป้องกัน:
  - `/dashboard`
  - `/datacenter-visualization`
  - `/sites`
  - `/equipment`
  - `/metrics`
  - `/faults`
  - `/reports`
  - `/admin`

---

## การทดสอบ:

### ทดสอบการแก้ไขเมนู:
1. Login ด้วย admin
2. ไปที่ https://10.251.150.222:3344/ecc800/admin → แท็บ "สิทธิ์เมนู"
3. คลิกปุ่มแก้ไขเมนู Metrics (หรือเมนูอื่นๆ)
4. แก้ไขชื่อเมนู หรือ path แล้วบันทึก
5. ตรวจสอบว่าเมนูถูกแก้ไขสำเร็จ

### ทดสอบระบบสิทธิ์เมนู:

#### Test Case 1: Admin (มีสิทธิ์ทุกเมนู)
1. Login ด้วย admin/admin123
2. ตรวจสอบว่าเห็นเมนูครบทุกอัน
3. สามารถเข้าถึงทุกหน้าได้

#### Test Case 2: Viewer (สิทธิ์จำกัด)
1. สร้าง viewer user ที่ https://10.251.150.222:3344/ecc800/admin
2. กำหนดสิทธิ์ในแท็บ "สิทธิ์เมนู":
   - เห็น Dashboard ✓
   - เห็น Equipment ✓
   - ไม่เห็น Metrics ✗
   - ไม่เห็น Admin ✗
3. Logout แล้ว login ด้วย viewer
4. ตรวจสอบว่า:
   - เมนู Metrics และ Admin หายไป
   - สามารถเข้า Dashboard และ Equipment ได้
   - ถ้าพิมพ์ URL `/metrics` โดยตรง จะแสดงหน้า "ไม่มีสิทธิ์เข้าถึง"

#### Test Case 3: ทดสอบป้องกัน URL โดยตรง
1. Login ด้วย viewer (ที่ไม่มีสิทธิ์ Metrics)
2. พิมพ์ URL: https://10.251.150.222:3344/ecc800/metrics
3. ระบบจะแสดงหน้า "ไม่มีสิทธิ์เข้าถึง" พร้อมข้อความ:
   - "คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้"
   - "หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ"
   - Path: `/metrics`
4. มีปุ่ม "กลับหน้าหลัก" และ "ย้อนกลับ"

---

## โครงสร้างระบบสิทธิ์:

```
┌─────────────────────────────────────┐
│  Database (role_menu_permissions)   │
│  - role_id                          │
│  - menu_item_id                     │
│  - can_view (สำคัญ!)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend API                        │
│  GET /permissions/user/current      │
│  Returns: [{ menu_path, can_view }] │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PermissionContext                  │
│  - Fetch permissions on mount       │
│  - Cache for 5 minutes              │
│  - Provide canViewMenu()            │
└──────────────┬──────────────────────┘
               │
               ├──────────────┬─────────────────┐
               ▼              ▼                 ▼
       ThaiModernLayout  ProtectedRoute   App Routes
       (Hide menu)       (Show 403)       (Route guard)
```

---

## ข้อดีของระบบนี้:

1. **ความปลอดภัย 3 ชั้น:**
   - ชั้นที่ 1: ซ่อนเมนูที่ไม่มีสิทธิ์ (UX)
   - ชั้นที่ 2: ป้องกัน Route ด้วย ProtectedRoute (Frontend)
   - ชั้นที่ 3: Backend API ตรวจสอบสิทธิ์อีกครั้ง

2. **Performance:**
   - Cache สิทธิ์ 5 นาที
   - ลดการเรียก API
   - ใช้ Context API (no prop drilling)

3. **User Experience:**
   - ไม่เห็นเมนูที่ไม่มีสิทธิ์ → ไม่สับสน
   - พิมพ์ URL ตรง → แสดงหน้า 403 ที่สวยงาม
   - มีปุ่มกลับหน้าหลัก

4. **Maintainability:**
   - Code แยกส่วนชัดเจน
   - ใช้ Context Pattern
   - Easy to extend

---

## การกำหนดสิทธิ์:

1. ไปที่ https://10.251.150.222:3344/ecc800/admin
2. เลือกแท็บ "สิทธิ์เมนู"
3. คลิกที่ไอคอน (✓ หรือ ✗) ในตารางเพื่อเปลี่ยนสิทธิ์
4. คลิก "บันทึกทั้งหมด"
5. User ที่ login อยู่จะได้รับสิทธิ์ใหม่ทันที (หรือ refresh หน้า)

---

## Summary:

✅ **Task 1:** แก้ไขเมนูได้แล้ว - คลิกปุ่มแก้ไขในตาราง  
✅ **Task 2.1:** ซ่อนเมนูตามสิทธิ์ - เมนูที่ไม่มีสิทธิ์จะหายไป  
✅ **Task 2.2:** ป้องกัน URL โดยตรง - แสดงหน้า "ไม่มีสิทธิ์เข้าถึง"  
✅ **Task 2.3:** Admin bypass - Admin เห็นทุกเมนูเสมอ  

ระบบสิทธิ์เมนูพร้อมใช้งานแล้วค่ะ! 🎉
