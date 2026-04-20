# การแก้ไข Race Condition ในระบบ Login

## ปัญหาที่พบ

เมื่อ login ด้วย viewer แล้ว redirect ไปที่ `/dashboard`:
- หน้าจอแสดง "ไม่มีสิทธิ์เข้าถึง" ทันที
- เมื่อ Refresh หน้า ก็สามารถเข้าได้ตามปกติ

## สาเหตุ (Race Condition)

```
1. User login → ได้ token
2. LoginPage: navigate('/dashboard')
3. ProtectedRoute: ตรวจสอบสิทธิ์
   - PermissionContext: isLoading = true (กำลังโหลด permissions)
   - แต่ ProtectedRoute ตรวจสอบก่อนที่ permissions จะโหลดเสร็จ
4. canViewMenu('/dashboard') → return false (เพราะยังไม่มี permissions)
5. แสดงหน้า "ไม่มีสิทธิ์เข้าถึง"
6. Refresh → permissions โหลดเสร็จแล้ว → เข้าได้ปกติ
```

## การแก้ไข

### 1. PermissionContext.tsx

#### เปลี่ยน:
```tsx
// เดิม: isLoading จาก useQuery โดยตรง
const { data: permissions, isLoading } = useQuery({
  queryKey: ['currentUserPermissions'],
  queryFn: () => permissionsApi.getCurrentUserPermissions(),
});
```

#### เป็น:
```tsx
// ใหม่: ตรวจสอบ authentication ก่อน
const isAuthenticated = React.useMemo(() => {
  const token = localStorage.getItem('token');
  return !!token;
}, []);

const { data: permissions, isLoading, isFetching } = useQuery({
  queryKey: ['currentUserPermissions'],
  queryFn: () => permissionsApi.getCurrentUserPermissions(),
  staleTime: 5 * 60 * 1000,
  retry: 1,
  enabled: isAuthenticated // ⭐ เพิ่ม enabled condition
});

// ⭐ isLoading ที่แท้จริง: ต้องมี token และกำลังโหลด
const actuallyLoading = isAuthenticated && (isLoading || isFetching);
```

**ประโยชน์:**
- `enabled: isAuthenticated` → ไม่เรียก API ถ้ายังไม่ login
- `actuallyLoading` → เป็น true เมื่อมี token แต่ permissions ยังไม่โหลด
- ProtectedRoute จะรอจนกว่า permissions จะพร้อม

### 2. LoginPage.tsx

#### เพิ่ม:
```tsx
import { useQueryClient } from '@tanstack/react-query';

const LoginPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  const handleLogin = async (e: React.FormEvent) => {
    // ... login logic ...
    
    // ⭐ Invalidate permissions cache
    queryClient.invalidateQueries({ queryKey: ['currentUserPermissions'] });
    
    // ⭐ รอ 100ms ให้ permissions เริ่มโหลด
    await new Promise(resolve => setTimeout(resolve, 100));
    
    navigate('/dashboard');
  };
};
```

**ประโยชน์:**
- `invalidateQueries` → บังคับให้โหลด permissions ใหม่ทันทีหลัง login
- `await setTimeout(100)` → ให้เวลา React Query เริ่มเรียก API ก่อน navigate
- เมื่อ navigate แล้ว ProtectedRoute จะเห็น `isLoading = true` และรอจนกว่าจะโหลดเสร็จ

### 3. ProtectedRoute.tsx

#### ปรับปรุง Loading UI:
```tsx
if (isLoading) {
  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="60vh"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="h6" color="text.secondary">
        กำลังตรวจสอบสิทธิ์...
      </Typography>
      <Typography variant="body2" color="text.disabled">
        กรุณารอสักครู่
      </Typography>
    </Box>
  );
}
```

**ประโยชน์:**
- แสดง loading state ที่ดีกว่า ชัดเจนขึ้น
- ผู้ใช้รู้ว่าระบบกำลังทำงาน ไม่ใช่ error

## Timeline หลังแก้ไข

```
1. User login → ได้ token
2. LoginPage: 
   - queryClient.invalidateQueries() → บังคับโหลด permissions
   - await setTimeout(100) → รอให้เริ่มโหลด
   - navigate('/dashboard')
3. ProtectedRoute:
   - isLoading = true (เพราะ actuallyLoading = isAuthenticated && isLoading)
   - แสดง loading spinner
4. Permissions โหลดเสร็จ
5. ProtectedRoute: 
   - isLoading = false
   - canViewMenu('/dashboard') = true
   - แสดงหน้า Dashboard ✅
```

## วิธีทดสอบ

1. เปิดเบราว์เซอร์ที่ https://10.251.150.222:3344/ecc800
2. Login ด้วย `test_viewer` / `viewer123`
3. **ผลลัพธ์ที่คาดหวัง:**
   - แสดง loading spinner "กำลังตรวจสอบสิทธิ์..." สักครู่
   - จากนั้นเข้าหน้า Dashboard ได้เลย ไม่มีหน้า "ไม่มีสิทธิ์เข้าถึง"
4. ทดสอบซ้ำหลาย ๆ ครั้ง เพื่อยืนยันว่าแก้ไขได้จริง

## สรุป

✅ แก้ไข race condition โดย:
1. เพิ่ม `enabled` condition ใน useQuery
2. ใช้ `actuallyLoading` แทน `isLoading` แบบเดิม
3. Invalidate cache หลัง login
4. รอ 100ms ก่อน navigate
5. ปรับปรุง loading UI ให้ชัดเจน

**ผลลัพธ์:** ไม่มีหน้า "ไม่มีสิทธิ์เข้าถึง" อีกต่อไปหลัง login 🎉
