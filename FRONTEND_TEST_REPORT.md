# 📊 ผลการทดสอบ Frontend DateTime Conversion

## ✅ สรุปผลการทดสอบ

### 1. ทดสอบโค้ด JavaScript (toBangkokTime)
```bash
node test_frontend_datetime.js
```
**ผลลัพธ์:** ✅ **Pass 5/5 tests**
- ข้อมูลล่าสุดจาก Database (12:00:00) ✅
- ข้อมูลเก่าที่แสดงในภาพ (06:00:00) ✅
- ข้อมูลไม่มี timezone ✅
- ข้อมูลมี Z (UTC) ✅
- Format มี space แทน T ✅

### 2. ทดสอบด้วย HTML
เปิดไฟล์: `file:///opt/code/ecc800/ecc800/test_frontend_datetime.html`

หรือเข้าผ่าน web server:
```bash
cd /opt/code/ecc800/ecc800
python3 -m http.server 8888
```
แล้วเปิด: http://localhost:8888/test_frontend_datetime.html

---

## 🔍 การวิเคราะห์ปัญหา

### ข้อมูลในฐานข้อมูล
```sql
-- ข้อมูลล่าสุด
SELECT statistical_start_time FROM performance_data 
WHERE equipment_name = 'Aisle-T/H Sensor Group-T/H Sensor7'
ORDER BY statistical_start_time DESC LIMIT 1;
-- Result: 2026-01-22 12:00:00
```

### ข้อมูลที่แสดงในภาพ
- **อัพเดต: 22/1/2569 06:00:00** ❌ (ข้อมูลเก่า)

### ข้อมูลที่ควรแสดง
- **อัพเดต: 22/1/2569 12:00:00** ✅ (ข้อมูลล่าสุด)

---

## 🐛 สาเหตุของปัญหา

1. **React Query Cache**: Frontend ใช้ React Query ซึ่งมีการ cache ข้อมูล
2. **Browser Cache**: Browser cache ไฟล์ JavaScript ที่เก่า
3. **Service Worker**: อาจมี service worker ที่ cache response

---

## ✨ การแก้ไขที่ทำไปแล้ว

### Backend (`enhanced_metrics.py`)
```python
def _datetime_to_iso_bangkok(dt):
    """แปลง datetime เป็น ISO format พร้อม +07:00 suffix"""
    if dt is None:
        return None
    if isinstance(dt, datetime):
        # เพิ่ม +07:00 เพื่อระบุว่าเป็น Bangkok time
        return dt.isoformat() + '+07:00'
    return None
```

### Frontend (`dateUtils.ts`)
```typescript
export function toBangkokTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';

  try {
    // Parse โดยใช้ regex โดยตรง ไม่ผ่าน Date object
    if (typeof dateString === 'string') {
      const match = dateString.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/i
      );

      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const hour = match[4];
        const minute = match[5];
        const second = match[6] ?? '00';

        // ใช้ปีพุทธศักราช (+543)
        const buddhistYear = year + 543;
        return `${day}/${month}/${buddhistYear} ${hour}:${minute}:${second}`;
      }
    }
    // ... fallback code
  } catch (error) {
    // ... error handling
  }
}
```

### React Query Configuration (`ImprovedMetricsPage.tsx`)
```typescript
const { data: metricsData, ... } = useQuery({
  queryKey: ['enhanced-metrics', ...],
  queryFn: () => {
    const params: any = {};
    // ... other params
    params._ts = Date.now(); // Cache busting
    return apiGet<MetricsResponse>('/enhanced-metrics', params);
  },
  staleTime: 0,     // ข้อมูลเก่าทันที บังคับ refetch
  gcTime: 0,        // ไม่เก็บ cache
  refetchInterval: autoRefresh ? 30000 : false,
});
```

---

## 🎯 วิธีแก้ปัญหาสำหรับผู้ใช้

### วิธีที่ 1: Clear Browser Cache (แนะนำ)
1. กด `Ctrl + Shift + Delete`
2. เลือก:
   - ✅ Cached images and files
   - ✅ Cookies and site data (optional)
3. เลือก Time range: **Last hour** หรือ **All time**
4. กด **Clear data**
5. **Hard Refresh**: กด `Ctrl + Shift + R`

### วิธีที่ 2: ใช้ Incognito/Private Window
1. กด `Ctrl + Shift + N` (Chrome) หรือ `Ctrl + Shift + P` (Firefox)
2. เข้า https://10.251.150.222:3344/ecc800/metrics
3. Login และตรวจสอบ

### วิธีที่ 3: ใช้ DevTools
1. เปิด DevTools: กด `F12`
2. ไปที่ tab **Application** (Chrome) หรือ **Storage** (Firefox)
3. คลิก **Clear storage** → **Clear site data**
4. Refresh หน้า

### วิธีที่ 4: Disable Cache ใน DevTools
1. เปิด DevTools: กด `F12`
2. ไปที่ tab **Network**
3. เช็ค ✅ **Disable cache**
4. Refresh หน้า (DevTools ต้องเปิดค้าง)

---

## 🧪 วิธีทดสอบว่าแก้ไขสำเร็จ

### 1. ตรวจสอบข้อมูลใน Database
```bash
docker exec ecc800-backend python3 -c "
import psycopg2, os
conn = psycopg2.connect(
    host='host.docker.internal', port='5210', 
    dbname='ecc800', user='apirak', 
    password=os.environ.get('POSTGRES_PASSWORD')
)
cur = conn.cursor()
cur.execute('''
    SELECT statistical_start_time 
    FROM performance_data 
    WHERE equipment_name LIKE '%Sensor7%'
    ORDER BY statistical_start_time DESC LIMIT 1
''')
print('ล่าสุด:', cur.fetchone()[0])
conn.close()
"
```

### 2. ตรวจสอบ API Response
- เปิด DevTools → Network tab
- Refresh หน้า metrics
- หา request `/enhanced-metrics`
- ดู Response → ตรวจสอบ `latest_time` field
- ควรได้: `"latest_time": "2026-01-22T12:00:00+07:00"`

### 3. ตรวจสอบการแสดงผล
- ดูที่หน้า metrics card
- **"อัพเดต:"** ควรแสดง **22/1/2569 12:00:00**
- ถ้ายังแสดง 06:00:00 แสดงว่ายังใช้ cache เก่า

---

## 📝 Checklist การแก้ไข

- ✅ Backend: แก้ไข `_datetime_to_iso_bangkok` ให้เพิ่ม `+07:00`
- ✅ Frontend: แก้ไข `toBangkokTime` ใช้ regex parse
- ✅ React Query: เพิ่ม `staleTime: 0`, `gcTime: 0`
- ✅ Cache busting: เพิ่ม `params._ts = Date.now()`
- ✅ Rebuild Frontend: `docker compose build frontend --no-cache`
- ✅ Restart Containers: `docker compose up -d`
- ⏳ Clear Browser Cache: **รอผู้ใช้ดำเนินการ**

---

## 🎉 ผลลัพธ์ที่คาดหวัง

หลังจากทำตามขั้นตอนข้างต้น หน้า metrics ควรแสดง:

```
Humidity                    Temperature
หน่วย: %RH                  หน่วย: °C

55.20 %RH                  19.50 °C
ลดลง                       คงที่

อัพเดต: 22/1/2569 12:00:00  อัพเดต: 22/1/2569 12:00:00
          ^^^^^^^ (เวลาล่าสุดจาก DB)
```

---

## 🔗 ไฟล์ทดสอบที่สร้างไว้

1. **test_frontend_datetime.js** - ทดสอบ Node.js
2. **test_frontend_datetime.html** - ทดสอบใน Browser  
3. **test_api_call.js** - ทดสอบเรียก API (ต้องมี auth)

---

## 📞 หากยังมีปัญหา

ให้ตรวจสอบ:
1. ตรวจสอบ Browser Console (F12) มี error หรือไม่
2. ตรวจสอบ Network tab ว่า API ถูกเรียกหรือไม่
3. ตรวจสอบ Response ของ API ว่าส่ง `latest_time` ถูกต้องหรือไม่
4. ลองเปิดใน browser อื่น (Chrome, Firefox, Edge)
5. ลอง restart nginx: `docker compose restart nginx`

---

**สร้างเมื่อ:** 2026-01-22 13:49:17 (Bangkok Time)  
**โดย:** GitHub Copilot
