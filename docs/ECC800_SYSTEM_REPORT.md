ECC800 System Analysis & Operational Report
===========================================

เวอร์ชัน: 1.0
วันที่วิเคราะห์: 2025-08-31
ผู้ทำ: automated analysis (pair-programmer)

สรุปสั้น ๆ
---------
เอกสารนี้สรุปโครงสร้างฐานข้อมูล (TimescaleDB hypertables), สรุปบริการ backend/frontend, กฎการ reverse-proxy (nginx), การตั้งค่า docker และวิธีทดสอบ endpoints สำคัญ พร้อมคำแนะนำเชิงปฏิบัติและข้อสังเกตที่พบ

1) ขอบเขตงานที่ทำ
-----------------
- ตรวจสอบ hypertables และโครงสร้างตารางสำคัญในฐานข้อมูล
- ตรวจสอบโค้ด backend (API routes) ที่เกี่ยวข้องกับ metrics / time-series / equipment / auth
- ตรวจสอบ frontend build และ reverse-proxy (nginx) การแมปเส้นทาง
- ตรวจสอบ docker containers ที่เกี่ยวข้อง (backend/frontend/nginx/postgres)
- สร้างไฟล์รายงานฉบับนี้ใน `docs/`

2) สภาพแวดล้อมและไฟล์คอนฟิกสำคัญ
----------------------------------
- Project root: /opt/code/ecc800/ecc800
- Backend env file: `/opt/code/ecc800/ecc800/.env` (ใช้เชื่อมต่อ DB และ JWT keys)
- Docs folder: `/opt/code/ecc800/ecc800/docs`
- Reverse-proxy nginx config: `/opt/code/ecc800/ecc800/reverse-proxy/nginx.conf`
- Docker-compose (compose.yml) อยู่ที่ root ของ workspace (`/opt/code/ecc800/ecc800/compose.yaml`)

3) Docker / Services (ที่รันจริงบน host)
-----------------------------------------
- Containers observed (ตัวอย่าง):
  - ecc800-backend (FastAPI + uvicorn) - พอร์ตภายใน 8010
  - ecc800-frontend (static/Vite) - พอร์ต 80 ภายใน
  - ecc800-nginx (reverse-proxy) - รับการเชื่อมต่อภายนอก (ตัวอย่างที่ใช้งาน: 10.251.150.222:3344)
  - postgres_db_container (TimescaleDB)

การเรียกใช้งานระบบหน้าเว็บ: https://10.251.150.222:3344/ecc800/

4) Nginx reverse-proxy (เส้นทางสำคัญ)
--------------------------------------
- `location /ecc800/api/` -> proxied to `http://backend/ecc800/api/` (backend service)
- `location = /ecc800/api/auth/login` -> proxied to `http://backend/ecc800/api/auth/login` (compat endpoint for legacy frontends)
- `location /ecc800/assets` -> proxied to frontend assets

ข้อสังเกต:
- การใช้ trailing slash อาจทำให้ nginx ส่ง redirect (307) กลับไปยัง HTTP (ไม่ https) ถ้าเรียกด้วย slash `/ecc800/api/` ในบางกรณี frontend ต้องเรียก endpoint โดยไม่ใส่ trailing slash หรือ nginx config ต้องแก้ให้ไม่ redirect ระหว่าง http/https

5) Backend (FastAPI) - endpoints สำคัญ
--------------------------------------
- `/ecc800/api/auth/login` (legacy compat) - accepts form data (username, password) and returns `access_token` (Bearer)
- `/ecc800/api/auth/token` - OAuth2 token endpoint (uses OAuth2PasswordRequestForm)
- `/ecc800/api/metrics` - list available metrics (filters: site_code, equipment_id)
- `/ecc800/api/data/time-series` - time-series data for a metric (params: site_code, equipment_id, metric, from_time, to_time, interval)
- `/ecc800/api/equipment` - list equipment
- `/ecc800/api/equipment/{site_code}/{equipment_id}/name` - PUT endpoint to update override/display name

สิ่งที่ต้องสังเกตจากการทดสอบ:
- Auth flow ต้องส่ง form data สำหรับ legacy login endpoint.
- time-series API ต้องรับวันที่แบบ timezone-naive ใน query params หรือ backend ต้องแปลง tz-aware → naive ก่อนส่งต่อไปยัง DB (ระบบแก้ไขเรียบร้อยแล้วในโค้ด)

6) Database (TimescaleDB) — สรุปจากการตรวจสอบเชิงลึก
------------------------------------------------------------

### Hypertables (TimescaleDB core tables):
- `performance_data` (hypertable) — primary timeseries table (3 chunks, no compression)
  - Data volume: ~815,937 rows for single UPS device (0x100B), total across all devices significantly higher
  - Partitioned by time: chunks for 2025-08, 2025-09, 2025-10
  - Key columns: site_code, equipment_id, equipment_name, performance_data (metric), statistical_start_time, value_numeric, unit
  - Generated columns: `time` (→ statistical_start_time), `value` (→ value_numeric)
  
- `fault_performance_data` (hypertable) — fault events (9 chunks, compression enabled)
  - Similar schema to performance_data but for fault/alarm data
  - Composite primary key: (site_code, statistical_start_time, id)

### Core Data Tables:
- `performance_data` — main metrics storage, 32 total tables (including partitions)
- `equipment` / `performance_equipment_master` — equipment metadata and relationships
- `equipment_name_overrides` — user-defined display name overrides
- `users` — authentication (bcrypt password_hash, roles: admin/analyst/viewer)
- `data_centers` — site metadata (DC, DR)

### Display Override System (3-tier hierarchy):
1. **Device-level**: `metric_display_override_device` (site_code + equipment_id + metric_name)
2. **Site-level**: `metric_display_override_site` (site_code + metric_name) 
3. **Global**: fallback to original names
Each level supports: display_name_th/en, unit_canonical, category, decimals, is_hidden

### Sites and Equipment Distribution:
- Primary sites: `dc`, `dr` (Data Center / Disaster Recovery)
- Equipment range: 0x01 to 0x7A (hex IDs)
- Equipment types: System-ECC800, Cooling units, UPS cabinets, Temperature/Humidity sensors, IT cabinets
- Metric categories: Currently mostly 'General' (room for expansion: Power, Environment, Network, etc.)

### Data Volume & Performance:
- Sample equipment metrics count: 472-815,937 records per device
- Time range: Aug 16 - Aug 29, 2025 (current data window)
- Largest dataset: Power Distribution equipment (0x100B) with 815K+ metrics
- Foreign key relationships: 141 constraints linking equipment, metrics, data_centers

### Key Views for Application Logic:
- `v_metrics_by_device`: Device-centric metrics with display overrides and categorization
- `v_timeseries_data`: Ready-to-use time series with all display names resolved
- `v_sites_summary`: Site-level aggregations (device count, metric count, date ranges)
- `v_equipment_latest_status`: Real-time status summary per site
- Import/export tracking views: `v_import_statistics`, `v_performance_import_statistics`

### Database Schema Insights for UI Design:
- Metrics are already categorized in views (ready for grouped display)
- Display names support Thai/English (i18n ready)
- Hidden metrics can be filtered out via `is_hidden` flag
- Data points counts available for each metric (useful for data quality indicators)
- Latest update timestamps per metric (data freshness indicators)
- Equipment groups naturally emerge from naming patterns (e.g., "Cooling-NetCol5000", "Aisle-T/H Sensor")

### Recommended Query Patterns for New UI:
1. Device selection: Query `v_metrics_by_device` grouped by device
2. Metric listing: Filter by device_code with category grouping
3. Time-series data: Use main `performance_data` with resolved display names
4. Status indicators: Leverage `v_equipment_latest_status` for health overview

7) ตัวอย่างคำสั่งตรวจสอบและทดสอบ (บน host ที่มี docker)
-----------------------------------------------------------
- ดู health endpoint (server):
```bash
curl -k https://10.251.150.222:3344/ecc800/api/health
```

- Login (legacy compat endpoint, form data):
```bash
curl -k -X POST https://10.251.150.222:3344/ecc800/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!"
```

- ใช้ token ทดสอบ metrics API:
```bash
TOKEN=<access_token>
curl -k -H "Authorization: Bearer $TOKEN" "https://10.251.150.222:3344/ecc800/api/metrics?site_code=dc&equipment_id=0x01"
```

- time-series API (ตัวอย่าง):
```bash
curl -k -H "Authorization: Bearer $TOKEN" \
  "https://10.251.150.222:3344/ecc800/api/data/time-series?site_code=dc&equipment_id=0x01&metric=PUE%20(hour)&from_time=2025-08-28T00:00:00&to_time=2025-08-28T23:59:59"
```

- ตรวจสอบ hypertables และ chunks (จากภายใน container postgres):
```bash
docker exec -it <postgres_container> psql -U <user> -d ecc800 -c "SELECT * FROM timescaledb_information.hypertables;"
```

8) ข้อเสนอแนะเชิงปฏิบัติและข้อควรปรับปรุง
------------------------------------------
- Timezone handling: ให้ยึดรูปแบบเดียวในทั้งระบบ (แนะนำ: use UTC for storage, frontend send ISO8601 with Z, backend parse to timezone-aware then convert to DB timezone-naive UTC if needed). เดี๋ยวนี้ backend ทำ conversion เป็น naive datetime ก่อน query แล้วซึ่งแก้ปัญหาที่เจอ
- Auth: ตรวจสอบว่า production จะไม่เปิด `dev-token` endpoint; SECRET ควรปลี่ยนใน `.env` และไม่เก็บไว้ใน repo
- Nginx: ปรับให้อย่า redirect ระหว่าง http/https ด้วย location/return; ให้มั่นใจว่าทั้ง nginx และ backend สร้าง absolute URLs ที่ใช้ `https` ใน Public URL (settings.PUBLIC_BASE_URL)
- Trailing slash: ทำให้ frontend เรียก API แบบ consistent (ไม่ใส่ trailing slash) หรือแก้ nginx ให้รองรับทั้งสองรูปแบบโดยไม่เปลี่ยน protocol
- Database: พิจารณาเปิด compression for `performance_data` (ถ้า table ใหญ่) และตั้ง retention policy / continuous aggregates สำหรับรายงานที่ต้องการ
- Tests: เพิ่มชุด unit/integration tests สำหรับ API endpoints สำคัญ (metrics, time-series, equipment, auth)

9) ไฟล์และตำแหน่งที่สำคัญสำหรับอ้างอิง
---------------------------------------
- Backend main: `/opt/code/ecc800/ecc800/backend/app/main.py`
- API routes: `/opt/code/ecc800/ecc800/backend/app/api/` (metrics.py, equipment.py, auth.py)
- Auth helpers: `/opt/code/ecc800/ecc800/backend/app/auth/jwt.py`
- DB utils: `/opt/code/ecc800/ecc800/backend/app/core/database.py`
- Nginx: `/opt/code/ecc800/ecc800/reverse-proxy/nginx.conf`
- Frontend: `/opt/code/ecc800/ecc800/frontend/src/` (pages, lib/api.ts)
- Env: `/opt/code/ecc800/ecc800/.env` and `/opt/code/ecc800/ecc800/backend/.env`

10) Next steps (recommended)
----------------------------
- รัน full end-to-end test: login → เลือก site/device → ดึง metrics list → request time-series → แสดงผลบน frontend
- ปรับ nginx ให้ไม่ redirect หรือทำ redirect เป็น https เสมอ
- ตั้งค่า backup และ retention for hypertables
- เพิ่ม monitoring (pg_stat_activity, timescaledb info) และ alert หาก chunk growth สูงผิดปกติ

11) Database Views (public schema)
---------------------------------
During inspection I discovered the following views in the `public` schema. These views are useful for reporting and for the frontend to produce human-friendly summaries.

List of views found (name and short purpose):
- v_equipment_latest_status
  - Summarises current equipment status per site (counts of OK/warning/offline devices, metrics available, latest timestamps).
- v_export_session_summary
  - Summarises enhanced export sessions (start/end time, status, filename, steps, completion percentage).
- v_fault_import_statistics
  - Aggregated statistics for fault data imports (counts, records processed/inserted/skipped, first/last import times).
- v_fault_performance_summary
  - Aggregates fault performance records by site/equipment/metric with earliest/latest timestamps and counts.
- v_import_statistics
  - General CSV import statistics (per site and filename), aggregates imports and totals.
- v_latest_performance_data
  - Returns the latest available performance datapoint per equipment+metric (joins to old performance store and equipment metadata).
- v_metric_resolved
  - Resolves metric keys to display names using `metric_aliases` (device/site/global alias precedence) and indicates which metrics have aliases.
- v_metrics_by_device
  - Lists metrics grouped by device with display name overrides (device/site), units, categories, data point counts and first/last timestamps.
- v_performance_import_statistics
  - Aggregated performance import stats (per site and file type) similar to `v_performance_import_statistics` used for import monitoring.
- v_performance_summary
  - Aggregates numeric performance data (count, min/max/avg, first/last timestamps) per site/equipment/metric/statistical_period.
- v_site_performance_comparison
  - High-level site comparison metrics (avg durations, success rates, total records imported across pipeline runs).
- v_sites_summary
  - Per-site summary (device count, metric count, last/first update times).
- v_timeseries_data
  - Human-friendly timeseries view that joins `performance_data` with display overrides for devices and metrics and returns rows of (time, site, device, device_name, metric_name, value, unit, etc.).

Notes and pointers:
- The full SQL definitions for these views are stored in `pg_views` / `pg_catalog.pg_views`. To fetch them from the database (postgres container) run:

```bash
# list view names in public schema
docker exec -it postgres_db_container psql -U apirak -d ecc800 -c "SELECT table_schema, table_name FROM information_schema.views WHERE table_schema='public' ORDER BY table_name;"

# show SQL definitions for all public views
docker exec -it postgres_db_container psql -U apirak -d ecc800 -c "SELECT viewname, definition FROM pg_views WHERE schemaname='public' ORDER BY viewname;"
```

- Some view definitions are long and include many JOINs to override tables (e.g., device_display_override, metric_display_override_device/site, metric_aliases) so they are formatted across many lines in the DB output.

- These views are intended for read/reporting only and are generally safe to query from the backend or ad-hoc tools, but avoid heavy repeated scans of views that aggregate large hypertables in high-traffic production (prefer continuous aggregates or materialised views + refresh strategies if used often).

- If you want, I can also extract and include the full SQL definition of each view into this document (makes the doc much larger). Tell me if you want the full SQL included or if a separate `docs/views/` folder with one `.sql` file per view would be preferred.

Appendix: how these views are used by the app
- `v_timeseries_data` and `v_metrics_by_device` are the likely sources for frontend metrics lists and timeseries queries when the app needs resolved display names and device-friendly output.
- `v_metric_resolved` and `metric_aliases` tables allow the system to show friendly names (overrides/aliases) in the UI.


---
ไฟล์นี้สร้างจากการสำรวจโค้ดและฐานข้อมูลที่อยู่ใน workspace `/opt/code/ecc800/ecc800` และการเรียกทดสอบ API บน host 10.251.150.222:3344

หากต้องการให้ผมเพิ่มส่วนใด (เช่น แผนการสำรองข้อมูล, ตัวอย่าง SQL สำหรับ continuous aggregate, หรือ runbook สำหรับการ deploy) ให้บอกมาได้เลย
