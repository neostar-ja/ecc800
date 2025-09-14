# API Specification - ECC800 System

## การเข้าถึง API
- **Base URL**: `https://10.251.150.222:3344/ecc800/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## Authentication Endpoints

### POST `/auth/login`
เข้าสู่ระบบ

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "is_active": true,
    "created_at": "2025-08-28T10:00:00Z"
  }
}
```

## Site Management

### GET `/sites`
ดึงรายการศูนย์ข้อมูลทั้งหมด

**SQL Mapping:**
```sql
SELECT * FROM data_centers WHERE is_active = true ORDER BY site_code;
```

### GET `/sites/metrics`
ดึงข้อมูลสรุปของแต่ละไซต์

**SQL Mapping:**
```sql
WITH site_stats AS (
  SELECT 
    dc.site_code,
    COUNT(DISTINCT e.equipment_id) as equipment_count,
    COUNT(DISTINCT CASE WHEN pd.statistical_start_time >= NOW() - INTERVAL '1 hour' 
                       THEN e.equipment_id END) as active_equipment,
    MAX(pd.statistical_start_time) as latest_data_time,
    AVG(CASE WHEN pd.performance_data ILIKE '%temp%' OR pd.unit = '°C' 
             THEN pd.value_numeric END) as temperature_avg,
    AVG(CASE WHEN pd.performance_data ILIKE '%humidity%' OR pd.unit LIKE '%RH%' 
             THEN pd.value_numeric END) as humidity_avg,
    SUM(CASE WHEN pd.performance_data ILIKE '%power%' OR pd.unit ILIKE '%w%' 
             THEN pd.value_numeric END) as power_total
  FROM data_centers dc
  LEFT JOIN equipment e ON dc.id = e.data_center_id
  LEFT JOIN performance_data pd ON e.equipment_id = pd.equipment_id 
    AND pd.statistical_start_time >= NOW() - INTERVAL '24 hours'
  WHERE dc.is_active = true
  GROUP BY dc.site_code
)
SELECT s.*, COALESCE(f.fault_count, 0) as fault_count
FROM site_stats s
LEFT JOIN (
  SELECT site_code, COUNT(*) as fault_count
  FROM fault_performance_data 
  WHERE statistical_start_time >= NOW() - INTERVAL '24 hours'
  GROUP BY site_code
) f ON s.site_code = f.site_code;
```

## Equipment Management

### GET `/equipment`
ดึงรายการอุปกรณ์

**Parameters:**
- `site_code` (optional): รหัสไซต์ (DC, DR)
- `q` (optional): คำค้นหา

**SQL Mapping:**
```sql
SELECT 
  e.id, e.equipment_name, e.equipment_id, e.description, e.site_code,
  COALESCE(ea.display_name, e.equipment_name) as display_name,
  dc.id as dc_id, dc.name as dc_name, dc.site_code as dc_site_code
FROM equipment e
LEFT JOIN equipment_aliases ea ON e.equipment_id = ea.equipment_id 
  AND COALESCE(e.site_code, (SELECT site_code FROM data_centers WHERE id = e.data_center_id)) = ea.site_code
LEFT JOIN data_centers dc ON e.data_center_id = dc.id
WHERE ($site_code IS NULL OR e.site_code = $site_code OR dc.site_code = $site_code)
AND ($search IS NULL OR e.equipment_name ILIKE '%$search%' OR e.equipment_id ILIKE '%$search%' OR ea.display_name ILIKE '%$search%')
ORDER BY e.equipment_name;
```

## Time Series Data

### GET `/data/time-series`
ดึงข้อมูล time-series จาก TimescaleDB

**Parameters:**
- `site_code` (required): รหัสไซต์
- `equipment_id` (optional): รหัสอุปกรณ์
- `metric` (optional): ชื่อ metric
- `start_time` (required): เวลาเริ่มต้น (ISO 8601)
- `end_time` (required): เวลาสิ้นสุด (ISO 8601)
- `interval` (optional): ช่วงเวลา (auto, 5m, 1h, 1d)

**SQL Mapping (5m interval):**
```sql
SELECT 
  time_bucket('5 minutes', statistical_start_time) as time,
  AVG(value_numeric) as avg_value,
  FIRST(unit, statistical_start_time) as unit,
  'performance' as source,
  'ok' as quality
FROM performance_data 
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND ($equipment_id IS NULL OR equipment_id = $equipment_id)
  AND ($metric IS NULL OR performance_data = $metric)
GROUP BY time 
ORDER BY time;
```

**SQL Mapping (1h interval):**
```sql
SELECT 
  time_bucket('1 hour', statistical_start_time) as time,
  AVG(value_numeric) as avg_value,
  FIRST(unit, statistical_start_time) as unit,
  'performance' as source,
  'ok' as quality
FROM performance_data 
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND ($equipment_id IS NULL OR equipment_id = $equipment_id)
  AND ($metric IS NULL OR performance_data = $metric)
GROUP BY time 
ORDER BY time;
```

### GET `/data/faults`
ดึงข้อมูล fault events

**Parameters:**
- `site_code` (required): รหัสไซต์
- `equipment_id` (optional): รหัสอุปกรณ์
- `start_time` (optional): เวลาเริ่มต้น
- `end_time` (optional): เวลาสิ้นสุด
- `severity` (optional): ระดับความรุนแรง

**SQL Mapping:**
```sql
SELECT 
  id, site_code, equipment_name, equipment_id,
  performance_data, statistical_start_time,
  value_text, value_numeric, unit, source_file
FROM fault_performance_data
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND ($equipment_id IS NULL OR equipment_id = $equipment_id)
ORDER BY statistical_start_time DESC 
LIMIT 1000;
```

### GET `/data/metrics`
ดึงรายการ metrics ที่มีอยู่

**SQL Mapping:**
```sql
SELECT DISTINCT 
  performance_data as metric,
  unit,
  COUNT(*) as data_count,
  MAX(statistical_start_time) as latest_time
FROM performance_data 
WHERE ($site_code IS NULL OR site_code = $site_code)
  AND ($equipment_id IS NULL OR equipment_id = $equipment_id)
GROUP BY performance_data, unit 
ORDER BY performance_data;
```

## Reports

### GET `/reports/kpi`
สร้างรายงาน KPI สำหรับไซต์ (ต้องการสิทธิ์ analyst+)

**Parameters:**
- `site_code` (required): รหัสไซต์
- `start_time` (optional): เวลาเริ่มต้น
- `end_time` (optional): เวลาสิ้นสุด

**SQL Mapping - Temperature:**
```sql
SELECT 
  AVG(value_numeric) as avg_temp,
  MIN(value_numeric) as min_temp,
  MAX(value_numeric) as max_temp
FROM performance_data
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND (performance_data ILIKE '%temperature%' 
       OR performance_data ILIKE '%temp%'
       OR unit = '°C');
```

**SQL Mapping - Humidity:**
```sql
SELECT 
  AVG(value_numeric) as avg_humidity,
  MIN(value_numeric) as min_humidity,
  MAX(value_numeric) as max_humidity
FROM performance_data
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND (performance_data ILIKE '%humidity%'
       OR unit = '%RH'
       OR unit = '%');
```

**SQL Mapping - Power:**
```sql
SELECT 
  AVG(value_numeric) as avg_power,
  SUM(value_numeric) as total_power
FROM performance_data
WHERE site_code = $site_code
  AND statistical_start_time >= $start_time
  AND statistical_start_time <= $end_time
  AND (performance_data ILIKE '%power%'
       OR performance_data ILIKE '%watt%'
       OR unit ILIKE '%w'
       OR unit ILIKE '%kw');
```

## Admin Endpoints

### POST `/admin/equipment-overrides`
สร้างหรืออัพเดทชื่อแทนของอุปกรณ์ (Admin เท่านั้น)

**Request Body:**
```json
{
  "site_code": "DC",
  "equipment_id": "0x01",
  "display_name": "เซิร์ฟเวอร์หลัก"
}
```

**SQL Mapping:**
```sql
INSERT INTO equipment_aliases (site_code, equipment_id, original_name, display_name, updated_by, created_at, updated_at)
VALUES ($site_code, $equipment_id, $original_name, $display_name, $updated_by, NOW(), NOW())
ON CONFLICT (site_code, equipment_id)
DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  updated_by = EXCLUDED.updated_by,
  updated_at = NOW()
RETURNING *;
```

### DELETE `/admin/equipment-overrides/{override_id}`
ลบชื่อแทนของอุปกรณ์ (Admin เท่านั้น)

**SQL Mapping:**
```sql
DELETE FROM equipment_aliases WHERE id = $override_id;
```

### POST `/admin/views/rebuild-cagg`
รีเฟรช Continuous Aggregate (Admin เท่านั้น)

**Request Body:**
```json
{
  "view_name": "cagg_perf_5m_to_1h"
}
```

**SQL Mapping:**
```sql
-- ตรวจสอบ view
SELECT 1 FROM timescaledb_information.continuous_aggregates 
WHERE view_name = $view_name AND view_schema = 'public';

-- รีเฟรช
CALL refresh_continuous_aggregate('$view_name', NULL, NULL);
```

## Database Views

### GET `/views`
ดึงรายการ database views

**SQL Mapping:**
```sql
SELECT 
  schemaname as schema_name,
  viewname as view_name,
  'view' as view_type,
  NULL as description
FROM pg_views 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  view_schema as schema_name,
  view_name,
  'continuous_aggregate' as view_type,
  'TimescaleDB Continuous Aggregate' as description
FROM timescaledb_information.continuous_aggregates
WHERE view_schema = 'public'

ORDER BY schema_name, view_name;
```

## Health Check

### GET `/health`
ตรวจสอบสถานะระบบ (ไม่ต้องการ authentication)

**Response:**
```json
{
  "status": "ok",
  "database": "ok",
  "timestamp": "2025-08-28T10:00:00Z",
  "version": "1.0.0"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้"
}
```

### 403 Forbidden
```json
{
  "detail": "ไม่มีสิทธิ์เข้าถึง ต้องการสิทธิ์: admin"
}
```

### 404 Not Found
```json
{
  "detail": "ไม่พบข้อมูลที่ระบุ"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["query", "start_time"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Rate Limiting

- **API General**: 10 requests/second per IP
- **Login Endpoint**: 5 requests/minute per IP
- **Burst**: 20 requests สำหรับ API, 5 requests สำหรับ login

## Database Tables Summary

### Main Tables
- `data_centers` - ศูนย์ข้อมูล (DC/DR)
- `equipment` - อุปกรณ์ในระบบ
- `users` - ผู้ใช้งานระบบ
- `equipment_aliases` - ชื่อแทนอุปกรณ์

### TimescaleDB Hypertables
- `performance_data` - ข้อมูล performance (partitioned by time)
- `fault_performance_data` - ข้อมูล fault events (partitioned by time + site)

### Continuous Aggregates
- `cagg_perf_5m_to_1h` - Aggregate 5min → 1hour
- `cagg_perf_1h_to_1d` - Aggregate 1hour → 1day
- `cagg_fault_hourly` - Fault summary per hour
- `cagg_fault_daily` - Fault summary per day

## Useful Views
- `v_equipment_resolved` - Equipment with display names
- `v_site_performance_comparison` - Performance comparison between sites
- `v_latest_performance_data` - Latest performance data per equipment
- `v_fault_performance_summary` - Fault summary statistics
