# การค้นพบโครงสร้างฐานข้อมูล ECC800

## ข้อมูลทั่วไป
- วันที่วิเคราะห์: 2025-08-28 14:57:21
- ฐานข้อมูล: 534408 (TimescaleDB + PostgreSQL)

## Hypertables (ตารางข้อมูลเวลา)

### `public.fault_performance_data`
- จำนวน Dimensions: 2
- จำนวน Chunks: 9
- การบีบอัด: เปิดใช้งาน
- Chunks ที่บีบอัด: 0
- Chunks ที่ไม่บีบอัด: 9

### `public.performance_data`
- จำนวน Dimensions: 1
- จำนวน Chunks: 3
- การบีบอัด: ปิดใช้งาน

## Time Dimensions

### `_timescaledb_internal._materialized_hypertable_22`
- คอลัมน์เวลา: `hour_bucket` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 70 days, 0:00:00

### `_timescaledb_internal._materialized_hypertable_23`
- คอลัมน์เวลา: `day_bucket` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 70 days, 0:00:00

### `_timescaledb_internal._materialized_hypertable_24`
- คอลัมน์เวลา: `hour_bucket` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 70 days, 0:00:00

### `_timescaledb_internal._materialized_hypertable_25`
- คอลัมน์เวลา: `day_bucket` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 70 days, 0:00:00

### `public.fault_performance_data`
- คอลัมน์เวลา: `site_code` (character varying)
- ประเภท: Space

### `public.fault_performance_data`
- คอลัมน์เวลา: `statistical_start_time` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 7 days, 0:00:00

### `public.performance_data`
- คอลัมน์เวลา: `statistical_start_time` (timestamp without time zone)
- ประเภท: Time
- ช่วงเวลา: 7 days, 0:00:00

## ตารางและ Views ทั้งหมด

### Schema: `public`

- 📊 `data_centers` (table)
- 📊 `data_import_logs` (table)
- 📊 `device_display_override` (table)
- 📊 `enhanced_export_actions` (table)
- 📊 `enhanced_export_sessions` (table)
- 📊 `enhanced_export_step_logs` (table)
- 📊 `equipment` (table)
- 📊 `equipment_aliases` (table)
- 📊 `export_downloads` (table)
- 📊 `export_interactions` (table)
- 📊 `export_page_visits` (table)
- 📊 `export_performance` (table)
- 📊 `export_sessions` (table)
- 📊 `export_step_logs` (table)
- 📊 `export_web_log` (table)
- 📊 `fault_data_import_logs` (table)
- 📊 `fault_equipment_master` (table)
- 📊 `fault_performance_data` (table)
- 📊 `metric_aliases` (table)
- 📊 `metric_display_override_device` (table)
- 📊 `metric_display_override_site` (table)
- 📊 `performance_data` (table)
- 📊 `performance_data_2025_08` (table)
- 📊 `performance_data_2025_09` (table)
- 📊 `performance_data_2025_10` (table)
- 📊 `performance_data_import_logs` (table)
- 📊 `performance_data_old` (table)
- 📊 `performance_equipment_master` (table)
- 📊 `performance_metrics` (table)
- 📊 `pipeline_performance_stats` (table)
- 📊 `users` (table)
- 👁️ `cagg_fault_daily` (view)
- 👁️ `cagg_fault_hourly` (view)
- 👁️ `cagg_perf_1h_to_1d` (view)
- 👁️ `cagg_perf_5m_to_1h` (view)
- 👁️ `export_session_overview` (view)
- 👁️ `v_datacenter_stats` (view)
- 👁️ `v_devices_by_site` (view)
- 👁️ `v_equipment_classification` (view)
- 👁️ `v_equipment_latest_status` (view)
- 👁️ `v_equipment_resolved` (view)
- 👁️ `v_equipment_summary` (view)
- 👁️ `v_export_session_summary` (view)
- 👁️ `v_fault_import_statistics` (view)
- 👁️ `v_fault_performance_summary` (view)
- 👁️ `v_import_statistics` (view)
- 👁️ `v_latest_performance_data` (view)
- 👁️ `v_metric_resolved` (view)
- 👁️ `v_metrics_by_device` (view)
- 👁️ `v_performance_import_statistics` (view)
- 👁️ `v_performance_summary` (view)
- 👁️ `v_site_performance_comparison` (view)
- 👁️ `v_sites_summary` (view)
- 👁️ `v_timeseries_data` (view)
### Schema: `timescaledb_experimental`

- 👁️ `policies` (view)
### Schema: `timescaledb_information`

- 👁️ `chunk_compression_settings` (view)
- 👁️ `chunks` (view)
- 👁️ `compression_settings` (view)
- 👁️ `continuous_aggregates` (view)
- 👁️ `dimensions` (view)
- 👁️ `hypertable_compression_settings` (view)
- 👁️ `hypertables` (view)
- 👁️ `job_errors` (view)
- 👁️ `job_history` (view)
- 👁️ `job_stats` (view)
- 👁️ `jobs` (view)

## Continuous Aggregates (CAGGs)

- `public.cagg_fault_daily` → `_timescaledb_internal._materialized_hypertable_25`
- `public.cagg_fault_hourly` → `_timescaledb_internal._materialized_hypertable_24`
- `public.cagg_perf_1h_to_1d` → `_timescaledb_internal._materialized_hypertable_23`
- `public.cagg_perf_5m_to_1h` → `_timescaledb_internal._materialized_hypertable_22`

## ตารางสำหรับ Equipment Name Overrides

พบตารางที่เกี่ยวข้องกับ Override:
- `equipment_aliases`
