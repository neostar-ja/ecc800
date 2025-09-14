# รายงานการค้นพบโครงสร้างฐานข้อมูล ECC800 - อัปเดตล่าสุด

**วันที่สร้าง:** 28 สิงหาคม 2025  
**ฐานข้อมูล:** PostgreSQL + TimescaleDB  
**Host:** 10.251.150.222:5210/ecc800

---

## 📊 สรุปภาพรวม

| ประเภท | จำนวน | รายละเอียด |
|--------|--------|-----------|
| 🏗️ Hypertables หลัก | 2 | `performance_data`, `fault_performance_data` |
| 📈 Materialized Hypertables | 4 | CAGG สำหรับ aggregation |
| 🗃️ ตารางทั้งหมด | 80 | รวมระบบและข้อมูลผู้ใช้ |
| 👁️ Views | 33 | Views สำหรับการวิเคราะห์ |
| ⚙️ Override Table | ❌ | ต้องสร้างสำหรับ equipment names |

---

## 🏗️ Hypertables หลัก

### 1. `performance_data` - ข้อมูลประสิทธิภาพ
- **Time Column:** `statistical_start_time`
- **Chunk Interval:** 7 วัน
- **วัตถุประสงค์:** เก็บข้อมูล metrics ของอุปกรณ์ทุกชนิด

### 2. `fault_performance_data` - ข้อมูลข้อผิดพลาด
- **Time Column:** `statistical_start_time` 
- **Chunk Interval:** 7 วัน
- **วัตถุประสงค์:** เก็บข้อมูล faults, alarms, และ events

---

## 📋 ตารางและ Views สำคัญ

### 🏢 ข้อมูลศูนย์ข้อมูล (Data Centers)
```sql
public.data_centers                    -- ข้อมูลไซต์ DC/DR
```

### 📊 ข้อมูลประสิทธิภาพ (Performance)
```sql
public.performance_data                -- Hypertable หลัก
public.performance_equipment_master    -- Master data อุปกรณ์
public.performance_metrics             -- รายการ metrics
public.metric_aliases                  -- ชื่อเรียกของ metrics
public.metric_display_override_site    -- Override การแสดงผลระดับไซต์
public.metric_display_override_device  -- Override การแสดงผลระดับอุปกรณ์
```

### 🚨 ข้อมูลข้อผิดพลาด (Faults)
```sql  
public.fault_performance_data          -- Hypertable หลัก
public.fault_equipment_master          -- Master data อุปกรณ์ fault
public.cagg_fault_hourly              -- CAGG รายชั่วโมง
public.cagg_fault_daily               -- CAGG รายวัน
```

### 📈 Views สำหรับการวิเคราะห์
```sql
public.v_datacenter_stats              -- สถิติรวมของ DC
public.v_latest_performance_data       -- ข้อมูลล่าสุด
public.v_performance_summary           -- สรุปประสิทธิภาพ
public.v_fault_performance_summary     -- สรุป fault
public.v_site_performance_comparison   -- เปรียบเทียบไซต์
public.v_metrics_by_device            -- Metrics จำแนกตามอุปกรณ์
public.v_timeseries_data              -- ข้อมูล time series
```

---

## 🔧 ข้อมูลที่ต้องเตรียม

### 1. Equipment Name Override Table
```sql
CREATE TABLE IF NOT EXISTS public.equipment_name_overrides (
    id bigserial PRIMARY KEY,
    site_code text NOT NULL,
    equipment_id text NOT NULL,
    original_name text NOT NULL,
    display_name text NOT NULL,
    updated_by text,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(site_code, equipment_id)
);
```

### 2. View สำหรับ Display Names
```sql
CREATE OR REPLACE VIEW public.v_equipment_display_names AS
SELECT e.site_code,
       e.equipment_id,
       e.equipment_name AS original_name,
       COALESCE(o.display_name, e.equipment_name) AS display_name
FROM public.performance_equipment_master e
LEFT JOIN public.equipment_name_overrides o
USING (site_code, equipment_id);
```

---

## 📊 ตัวอย่าง Query Patterns

### เรียกข้อมูลไซต์
```sql
SELECT * FROM public.data_centers ORDER BY site_code;
```

### เรียก Performance Data
```sql
SELECT time_bucket_gapfill('5 minutes'::interval, statistical_start_time) AS t,
       AVG(value_numeric) AS avg_value,
       MAX(unit) AS unit
FROM public.performance_data
WHERE site_code = :site_code
  AND equipment_id = :equipment_id
  AND performance_data = :metric
  AND statistical_start_time BETWEEN :start_time AND :end_time
GROUP BY t
ORDER BY t;
```

### เรียก Fault Data  
```sql
SELECT time_bucket('1 hour'::interval, statistical_start_time) AS t,
       COUNT(*) AS fault_count,
       ANY_VALUE(severity) AS severity
FROM public.fault_performance_data
WHERE site_code = :site_code
  AND statistical_start_time BETWEEN :start_time AND :end_time
GROUP BY t
ORDER BY t;
```

---

## ⚡ CAGG (Continuous Aggregates)

ระบบมี materialized hypertables สำหรับ:
- `_materialized_hypertable_22` - รายชั่วโมง (70 วัน retention)
- `_materialized_hypertable_23` - รายวัน (70 วัน retention)  
- `_materialized_hypertable_24` - รายชั่วโมง fault
- `_materialized_hypertable_25` - รายวัน fault

---

## 🎯 แผนการพัฒนา API

1. **GET /sites** → `public.data_centers`
2. **GET /equipment** → `public.v_equipment_display_names`
3. **GET /metrics** → `public.performance_metrics` + `public.metric_aliases`
4. **GET /data/time-series** → `public.performance_data` + aggregation
5. **GET /faults** → `public.fault_performance_data` + CAGG
6. **GET /reports/kpi** → Views combination

---

**สรุป:** ฐานข้อมูลมีโครงสร้างที่ชัดเจน พร้อมใช้งาน มี TimescaleDB hypertables และ CAGG ที่เหมาะสมสำหรับ time-series data
