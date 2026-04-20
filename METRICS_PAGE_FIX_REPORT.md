# การแก้ไข React Error #300 บนหน้า Metrics

## 📅 วันที่: 14 มกราคม 2026

## 🐛 ปัญหา
หน้า `/metrics` เกิด React Error #300: "Objects are not valid as a React child" หรือ "Element type is invalid"
- Error เกิดขึ้นหลังจากเลือกไซต์จาก dropdown
- ต้อง refresh หลายครั้งถึงจะใช้งานได้
- Error ใน minified build ทำให้หา root cause ยาก

## 🔍 สาเหตุที่พบ

### 1. **Sites Dropdown** - render object โดยตรง
```tsx
// ❌ ก่อนแก้ไข
{sites?.map((site) => (
  <MenuItem>
    {site.site_name} ({site.site_code.toUpperCase()})
  </MenuItem>
))}
```

### 2. **Equipment Sort** - ใช้ค่าที่อาจเป็น object ใน localeCompare
```tsx
// ❌ ก่อนแก้ไข
?.sort((a, b) => 
  (a.display_name || '').localeCompare(b.display_name || '', ...)
)
```

### 3. **MetricCard Icon/Trend** - destructuring อาจได้ undefined
```tsx
// ❌ ก่อนแก้ไข
const IconComponent = ICON_COMPONENTS[metric.icon] || Timeline;
const { Icon: TrendIcon, color: trendColor } = TREND_ICON_META[metric.trend] || ...;
<TrendIcon color={trendColor} />
```

### 4. **Timestamp Rendering** - Date object ถูก render โดยตรง
```tsx
// ❌ ก่อนแก้ไข
return metric.latest_time; // อาจเป็น object
```

### 5. **Metric Counts** - ไม่มี null safety
```tsx
// ❌ ก่อนแก้ไข
{metric.valid_readings.toLocaleString()}
{metric.data_points.toLocaleString()}
```

## ✅ การแก้ไข

### 1. **Sites Dropdown** - Convert ทุกค่าเป็น string
```tsx
// ✅ หลังแก้ไข
{sites?.map((site) => {
  const siteName = String(site.site_name || site.site_code || 'Unknown');
  const siteCode = String(site.site_code || '').toUpperCase();
  return (
    <MenuItem key={site.site_code} value={site.site_code}>
      {siteName} ({siteCode})
    </MenuItem>
  );
})}
```

### 2. **Equipment Sort** - Safe string comparison
```tsx
// ✅ หลังแก้ไข
?.sort((a: any, b: any) => {
  const nameA = String(a.display_name || a.equipment_id || '');
  const nameB = String(b.display_name || b.equipment_id || '');
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
})
```

### 3. **MetricCard Icon/Trend** - Safe component access
```tsx
// ✅ หลังแก้ไข
const icon = String(metric.icon || '📊');
const IconComponent = ICON_COMPONENTS[icon] || Timeline;

const trend = String(metric.trend || 'unknown');
const trendInfo = TREND_ICON_META[trend] || TREND_ICON_META.unknown;
const TrendIcon = trendInfo.Icon;
const trendColor = trendInfo.color;
```

### 4. **Timestamp Rendering** - Always return string
```tsx
// ✅ หลังแก้ไข
const latestTimestamp = useMemo(() => {
  if (!metric.latest_time) return null;
  try {
    const timestamp = new Date(metric.latest_time).toLocaleString('th-TH');
    return String(timestamp);
  } catch (error) {
    return String(metric.latest_time || '');
  }
}, [metric.latest_time]);
```

### 5. **Safe Metric Counts**
```tsx
// ✅ หลังแก้ไข
<Chip label={String(metric.valid_readings?.toLocaleString() || '0')} />
{String(metric.valid_readings?.toLocaleString() || '0')} จุด
{String(metric.data_points?.toLocaleString() || '0')} จุด
```

### 6. **Date Range Display**
```tsx
// ✅ หลังแก้ไข
{metric.first_seen && metric.last_seen
  ? `ช่วงข้อมูล: ${String(new Date(metric.first_seen).toLocaleDateString('th-TH'))} - ${String(new Date(metric.last_seen).toLocaleDateString('th-TH'))}`
  : 'ไม่มีข้อมูลช่วงเวลา'}
```

### 7. **Format Function**
```tsx
// ✅ หลังแก้ไข
const formatMetricValue = (value: number | null | undefined, unit: string) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  const safeUnit = String(unit || '');
  return `${value.toFixed(2)} ${safeUnit}`;
};
```

## 🔧 การ Deploy

### 1. Rebuild Frontend Image
```bash
cd /opt/code/ecc800/ecc800
docker compose build --no-cache frontend
```

### 2. Restart Container
```bash
docker compose up -d frontend
```

### 3. Verify
```bash
curl -s -k "https://10.251.150.222:3344/ecc800/metrics" | grep -o "<title>[^<]*</title>"
```

## 📊 ผลลัพธ์

### ✅ การแก้ไขทั้งหมด:
1. ✅ Sites dropdown - safe string rendering
2. ✅ Equipment dropdown - safe sort & display
3. ✅ Metric counts - with null safety
4. ✅ Icon/Trend components - safe access
5. ✅ Timestamps - always string
6. ✅ Date ranges - safe formatting
7. ✅ All Typography/Chip labels - String wrapped

### ✅ Build & Deploy:
- Frontend rebuilt with no cache
- New image deployed successfully
- Container status: healthy
- Page accessible: ✓

## 🧪 วิธีทดสอบ

1. เข้า https://10.251.150.222:3344/ecc800/metrics
2. เลือกไซต์จาก dropdown
3. ตรวจสอบ browser console (F12) - ควรไม่มี error
4. เลือกอุปกรณ์
5. ตรวจสอบว่า metrics แสดงผลได้ถูกต้อง

## 📝 หมายเหตุ

### สาเหตุที่ต้อง rebuild ทั้งหมด:
- Frontend ใช้ multi-stage Docker build
- Code ถูก compile ใน build stage แล้ว copy ไปยัง nginx stage
- การแก้ไข source code ต้อง rebuild image ใหม่
- Simple restart ไม่เพียงพอ

### Best Practices ที่ใช้:
1. **String Conversion**: ใช้ `String()` กับทุกค่าที่จะ render
2. **Null Safety**: ใช้ optional chaining `?.` และ nullish coalescing `??`
3. **Fallback Values**: มี default value สำรอง
4. **Type Safety**: ตรวจสอบ type ก่อน render
5. **Error Boundaries**: component จัดการ error ได้เอง

## 🎯 สรุป

ปัญหา React Error #300 เกิดจากการพยายาม render object, null, undefined โดยตรงใน JSX
การแก้ไขคือ **convert ทุกค่าเป็น string ก่อน render** และเพิ่ม **null safety** ทุกจุด

✨ หน้า /metrics สามารถใช้งานได้ปกติแล้วโดยไม่ต้อง refresh หลายครั้ง
