# 📊 คู่มืออธิบาย Pipeline ระบบ ECC800 แบบครบถ้วน

**เอกสารนี้:** รายงานอธิบาย Pipeline ระบบ ECC800 Data Center Monitoring  
**วันที่จัดทำ:** 28 เมษายน 2569  
**ผู้จัดทำ:** AI System Analysis  
**เวอร์ชัน:** 3.0 (ฉบับปรับปรุงครบถ้วน)  
**สถานะ:** Production Ready  

---

## 📑 สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [สถาปัตยกรรม Pipeline](#2-สถาปัตยกรรม-pipeline)
3. [ลำดับขั้นตอนการทำงาน (6 Phases)](#3-ลำดับขั้นตอนการทำงาน-6-phases)
4. [รายละเอียดแต่ละ Phase](#4-รายละเอียดแต่ละ-phase)
5. [ระยะเวลาการทำงาน](#5-ระยะเวลาการทำงาน)
6. [ไฟล์และโฟลเดอร์สำคัญ](#6-ไฟล์และโฟลเดอร์สำคัญ)
7. [สคริปต์และคำสั่ง](#7-สคริปต์และคำสั่ง)
8. [ฟีเจอร์สำคัญ](#8-ฟีเจอร์สำคัญ)
9. [การจัดการข้อมูล](#9-การจัดการข้อมูล)
10. [ความปลอดภัย](#10-ความปลอดภัย)
11. [การแก้ไขปัญหา](#11-การแก้ไขปัญหา)

---

## 1. ภาพรวมระบบ

### 1.1 วัตถุประสงค์
ระบบ ECC800 Pipeline เป็นระบบประมวลผลข้อมูล Time-Series ที่สมบูรณ์สำหรับ:
- ✅ **ส่งออกข้อมูล** จากระบบ Huawei ECC800 (Data Center Monitoring Equipment)
- ✅ **ประมวลผล** ไฟล์ TGZ และแยก CSV files
- ✅ **นำเข้า** ข้อมูลเข้าฐานข้อมูล PostgreSQL
- ✅ **จัดการซ้ำ** (Deduplication) อัตโนมัติ
- ✅ **ตรวจสอบ** ความสมบูรณ์ของข้อมูล
- ✅ **รายงาน** ผลลัพธ์ละเอียด

### 1.2 ข้อมูลสำคัญ
```
📊 สถิติการทำงาน:
   • จำนวนอุปกรณ์: 691 devices
   • ข้อมูล Performance: 100K - 1M records/import
   • อัตราการทำซ้ำ: 15-40% ของข้อมูลทั้งหมด
   • ไซต์ที่รองรับ: DC (Data Center), DR (Disaster Recovery)
   • ระยะเวลา Full Pipeline: 10-25 นาที (โดยทั่วไป 15 นาที)
   • ความเร็ว Import: 5,000-10,000 rows/second
```

### 1.3 ขอบเขตการใช้งาน
- **ข้อมูล Performance:** ประสิทธิภาพอุปกรณ์ (CPU, Memory, Temperature, Power)
- **ข้อมูล Faults:** เหตุการณ์ผิดปกติและการแจ้งเตือน
- **ช่วงเวลา:** 5 minutes, 1 hour, 1 day (3 ระดับ)
- **ด้านความถี่:** นำเข้าอัตโนมัติทุก 1-6 ชั่วโมง

---

## 2. สถาปัตยกรรม Pipeline

### 2.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                 ECC800 PIPELINE ARCHITECTURE                     │
└──────────────────────────────────────────────────────────────────┘

   SOURCE                    PROCESSING                    DATABASE
┌─────────────┐  Phase 1  ┌──────────────┐ Phase 3  ┌────────────┐
│ Huawei ECC  │ Export    │ TGZ Extract  │ Import   │PostgreSQL  │
│   8 0 0     ◄──────────►│  & Process   ◄─────────►│ TimescaleDB│
│10.251.4.254 │(Selenium) │  CSV Files   │(Staging) │ Port 5432  │
└─────────────┘           └──────────────┘          └────────────┘
       ▲                          │                         ▲
       │                    Phase 2: Process               │
       │                  (Latest-Only Strategy)            │
       │                          │                         │
       └──────────────────────────┴─────────────────────────┘
                         Phase 5 & 6:
                    Verification & Dashboard
```

### 2.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Pipeline Components                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ EXPORTER Module                                        │
│     └─ unlimited_timeout_exporter.py                       │
│     └─ Selenium WebDriver for browser automation          │
│                                                             │
│  2️⃣ PROCESSOR Module                                       │
│     └─ latest_only_tgz_processor.py                        │
│     └─ Auto-unzip and CSV extraction                      │
│                                                             │
│  3️⃣ IMPORTER Module                                        │
│     └─ enhanced_performance_importer.py                    │
│     └─ Staging table + UPSERT logic                        │
│                                                             │
│  4️⃣ ORCHESTRATOR                                           │
│     └─ enhanced_working_pipeline.sh                        │
│     └─ Complete end-to-end workflow                        │
│                                                             │
│  5️⃣ REPORTER Module                                        │
│     └─ comprehensive_reporter.py                           │
│     └─ Generate detailed reports                           │
│                                                             │
│  6️⃣ DATABASE Module                                        │
│     └─ TimescaleDB (PostgreSQL + Time-Series)             │
│     └─ schema, tables, views, indexes                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. ลำดับขั้นตอนการทำงาน (6 Phases)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1                PHASE 2              PHASE 3             │
│ EXPORT                 EXTRACT              IMPORT              │
│ 5-10 นาที             30 วินาที            3-8 นาที             │
│                                                                 │
│ 🌐 ECC800 System      📦 TGZ File         🗄️ PostgreSQL       │
│ ↓                      ↓                    ↓                   │
│ ⬇️ Download            🗂️ Unzip            COPY + MERGE       │
│ HistoryData.tgz        Extract CSV         INSERT/UPDATE      │
│                        1_day.csv                              │
│                        1_hour.csv                             │
│                        5_minute.csv                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4                PHASE 5              PHASE 6             │
│ CLEANUP                VERIFY              REPORT              │
│ 5 วินาที              1 นาที              Real-time           │
│                                                                 │
│ 🗑️ Delete             ✅ Validate         🎨 Dashboard        │
│ ↓                      ↓                    ↓                   │
│ • TGZ files            Database Queries     Frontend API       │
│ • Temp folders         Audit trail          Visualize data    │
│ • Archive CSV          Generate reports     Export reports     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. รายละเอียดแต่ละ Phase

### 🔴 PHASE 1: EXPORT (ส่งออกข้อมูล)
**⏱️ ระยะเวลา:** 5-10 นาที | **🎯 เป้าหมาย:** ดึงข้อมูล Performance จาก ECC800

#### 4.1.1 กระบวนการ
```
1️⃣ เชื่อมต่อ → HTTPS ไปที่ https://10.251.4.254 (หรือ 10.251.5.21:18002)
              └─ ใช้ credentials: admin / Changeme (จาก config.json)

2️⃣ ตรวจสอบ → Session validity
              └─ Login status, Cookie management

3️⃣ ค้นหา → "Export Performance Data" button
            └─ Navigate to export page

4️⃣ ส่งออก → Click button
              └─ Select date range
              └─ Choose data types (1_day, 1_hour, 5_minute)

5️⃣ ดาวน์โหลด → Auto-download HistoryData_TIMESTAMP.tgz
                └─ File size: 50-200 MB
                └─ Location: ./csv/ folder
```

#### 4.1.2 ไฟล์ที่เกี่ยวข้อง
```
📜 Scripts:
   • unlimited_timeout_exporter.py      - Main exporter
   • final_production_exporter.py       - Backup exporter
   • webdriver_test_ecc800.py          - Test script

⚙️ Configuration:
   • config.json (ครอบครัว data_centers section)
   • .env file (credentials)
```

#### 4.1.3 Output
```
✅ ผลลัพธ์:
   • HistoryData_20250428_102045.tgz (152 MB)
   • Location: /opt/code/ecc800/csv/
   • Status: Ready for next phase
```

---

### 🟠 PHASE 2: EXTRACT & PROCESS (แยกและประมวลผล)
**⏱️ ระยะเวลา:** 30 วินาที | **🎯 เป้าหมาย:** แยก CSV files จาก TGZ

#### 4.2.1 กระบวนการ
```
1️⃣ ค้นหาไฟล์ → Latest-Only Strategy
              └─ ค้นหา HistoryData_*.tgz ทีล่าสุดเท่านั้น
              └─ ไม่ประมวลผลไฟล์เก่า

2️⃣ ตรวจสอบรูปแบบ → รองรับ ZIP, TAR.GZ, TAR formats
                    └─ Detect file type automatically

3️⃣ Unzip → Extract ไฟล์
            └─ Target: /opt/code/ecc800/csv/unzip/

4️⃣ แยก CSV → 3 ไฟล์หลัก:
              ├─ 1_day.csv (ข้อมูลรายวัน)
              ├─ 1_hour.csv (ข้อมูลรายชั่วโมง)
              └─ 5_minute.csv (ข้อมูล 5 นาที)

5️⃣ ลบ TGZ → ลบไฟล์ .tgz ทันที
             └─ เพื่อประหยัด storage
```

#### 4.2.2 ไฟล์ที่เกี่ยวข้อง
```
📜 Scripts:
   • latest_only_tgz_processor.py      - Latest-only version
   • simple_auto_tgz_processor.py      - Simple version
   • auto_tgz_processor.py             - Full-featured version

📊 Data Structure ใน CSV:
   Equipment, Equipment ID, Performance Data, Statistical Period,
   Statistical Start Time, Value, Unit, [additional fields...]
```

#### 4.2.3 Output
```
✅ ผลลัพธ์:
   • /opt/code/ecc800/csv/1_day.csv
   • /opt/code/ecc800/csv/1_hour.csv
   • /opt/code/ecc800/csv/5_minute.csv
   • HistoryData_*.tgz ถูกลบ ✓
   • Status: Ready for import
```

---

### 🟡 PHASE 3: IMPORT (นำเข้าฐานข้อมูล)
**⏱️ ระยะเวลา:** 3-8 นาที | **🎯 เป้าหมาย:** นำเข้าข้อมูลเข้า PostgreSQL

#### 4.3.1 กระบวนการ (Staging Table Method)

```
1️⃣ เชื่อมต่อ Database
   └─ PostgreSQL TimescaleDB
   └─ Host: localhost:5432
   └─ DB: ecc800 / User: ecc800_user

2️⃣ สร้าง Staging Table
   └─ CREATE TEMP TABLE staging_performance (...)
   └─ Columns: equipment_id, timestamp, metric_name, value, unit

3️⃣ โหลดข้อมูล (COPY)
   └─ COPY staging_performance FROM stdin
   └─ Method: PostgreSQL binary copy (ตัวแรก/นาที)
   └─ Speed: 5,000-10,000 rows/second

4️⃣ Upsert Logic (Handle Duplicates)
   ├─ INSERT INTO performance_data
   │  SELECT * FROM staging_performance
   │  WHERE NOT EXISTS (ข้อมูลใหม่)
   │
   ├─ UPDATE performance_data SET value = staging.value
   │  WHERE EXISTS (ข้อมูลซ้ำ update)
   │  Key: equipment_id + timestamp + metric_name
   │
   └─ Statistics: count(INSERT), count(UPDATE), count(SKIP)

5️⃣ ลบ Staging Table
   └─ DROP TABLE staging_performance
   └─ Free memory

6️⃣ Commit Transaction
   └─ COMMIT all changes
   └─ Write to disk
```

#### 4.3.2 ไฟล์ที่เกี่ยวข้อง
```
📜 Scripts:
   • enhanced_performance_importer.py    - Main importer
   • FaultPerformanceImporter class      - Import logic

🗄️ Database Tables:
   • performance_data                    - Main data table
   • performance_data_import_logs        - Audit trail
   • staging tables (temporary)          - Working tables

📊 Views for reporting:
   • v_performance_import_statistics
   • v_import_statistics
```

#### 4.3.3 Import Statistics Output
```
✅ ผลลัพธ์ประเมิน:
   📊 ประมวลผลแล้ว: 342,399 records
   ➕ เพิ่มใหม่: 256 records (0.075%)
   🔄 อัปเดต: 34,180 records (9.98%)
   ⏭️ ข้ามไป: 307,963 records (89.95%)
   ⏱️ ระยะเวลา: 3 min 45 sec

หมายเหตุ:
   • ข้อมูลที่ "ข้ามไป" = ข้อมูลซ้ำที่มีอยู่แล้ว (Duplicates)
   • "อัปเดต" = ข้อมูลเก่าถูก update ด้วยค่าใหม่
```

---

### 🟢 PHASE 4: CLEANUP (ทำความสะอาด)
**⏱️ ระยะเวลา:** 5 วินาที | **🎯 เป้าหมาย:** ลบไฟล์ temporary

#### 4.4.1 กระบวนการ
```
1️⃣ ลบไฟล์ TGZ
   └─ rm /opt/code/ecc800/csv/HistoryData_*.tgz
   └─ เพื่อประหยัด storage

2️⃣ ลบ Extraction Directory
   └─ rm -rf /opt/code/ecc800/csv/unzip/*
   └─ ลบโฟลเดอร์ unzip ที่ใช้เก็บไฟล์ที่แยกออกมา

3️⃣ Archive CSV files (Optional)
   └─ Move processed CSV → /opt/code/ecc800/processed/
   └─ Keep for audit trail

4️⃣ ล้างไฟล์ Log เก่า
   └─ remove logs > 7 days old
   └─ Keep recent logs for troubleshooting

5️⃣ ตรวจสอบ Storage
   └─ du -sh /opt/code/ecc800/
   └─ วัดขนาด directory
```

#### 4.4.2 Mode Setting
```
Configuration:
   CLEANUP=true        // Default: ทำความสะอาดอัตโนมัติ
   CLEANUP=false       // Option: เก็บไฟล์ temp เพื่อ debug
   --no-cleanup flag   // CLI: ปิดการทำความสะอาด
```

#### 4.4.3 Verification
```
✅ ผลลัพธ์:
   ✓ /opt/code/ecc800/csv/                 (ว่าง)
   ✓ /opt/code/ecc800/csv/unzip/           (ว่าง)
   ✓ ไม่มีไฟล์ .tgz เหลือ
   ✓ ไฟล์ CSV archive ถูกเก็บ
   ✓ Storage พร้อมสำหรับ import ครั้งถัดไป
```

---

### 🔵 PHASE 5: VERIFICATION (ตรวจสอบ)
**⏱️ ระยะเวลา:** 1 นาที | **🎯 เป้าหมาย:** ตรวจสอบความสมบูรณ์

#### 4.5.1 กระบวนการ
```
1️⃣ Query Database
   └─ SELECT COUNT(*) FROM performance_data
   └─ WHERE import_timestamp >= NOW() - INTERVAL '1 hour'
   └─ ตรวจสอบจำนวน records ที่ import

2️⃣ เปรียบเทียบสถิติ
   └─ CSV rows vs. imported records
   └─ INSERT vs. UPDATE vs. SKIP counts
   └─ File checksums (MD5/SHA256)

3️⃣ Data Quality Check
   └─ Check for NULL values in critical columns
   └─ Validate date/time ranges
   └─ Verify equipment IDs exist in device table

4️⃣ Generate Report
   └─ Query v_performance_import_statistics
   └─ Generate summary tables
   └─ Create detailed log file
```

#### 4.5.2 Verification Report Content
```
📊 Report Sections:
   ├─ Session Information (Start time, Duration, Status)
   ├─ File Information (Filename, Size, Checksum)
   ├─ Import Statistics (Records processed/inserted/updated/skipped)
   ├─ Data Quality Metrics (NULL count, min/max values)
   ├─ Database Status (Row counts, indexes, constraints)
   ├─ Performance Metrics (Import speed, memory used, CPU)
   └─ Error Log (if any errors occurred)
```

---

### 🟣 PHASE 6: DASHBOARD (นำเสนอผล)
**⏱️ ระยะเวลา:** Real-time | **🎯 เป้าหมาย:** นำเสนอข้อมูลผ่าน Dashboard

#### 4.6.1 การทำงาน
```
1️⃣ Database Views
   └─ v_performance_import_statistics    (สถิติการ import)
   └─ pipeline_performance_stats         (ประสิทธิภาพ)
   └─ v_site_performance_comparison      (เปรียบเทียบไซต์)

2️⃣ API Endpoints
   ├─ GET /api/equipment                 (ข้อมูลอุปกรณ์)
   ├─ GET /api/performance               (ข้อมูล performance)
   ├─ GET /api/faults                    (ข้อมูล faults)
   ├─ GET /api/reports                   (ข้อมูลรายงาน)
   └─ GET /api/health                    (สถานะระบบ)

3️⃣ Frontend Components
   ├─ Overview Dashboard                 (ภาพรวม)
   ├─ Equipment List                     (รายการอุปกรณ์)
   ├─ Performance Trends                 (แนวโน้มประสิทธิภาพ)
   ├─ Fault Events                       (เหตุการณ์ผิดปกติ)
   ├─ Data Explorer                      (ค้นหาข้อมูล)
   └─ Admin Panel                        (จัดการระบบ)

4️⃣ Visualization
   ├─ Charts & Graphs                    (Recharts)
   ├─ Data Tables                        (Searchable, Sortable)
   ├─ Maps & Topology                    (Canvas, Konva)
   ├─ 3D Visualization                   (Three.js)
   └─ Real-time Updates                  (WebSocket)
```

#### 4.6.2 Dashboard Access
```
🌐 URLs:
   HTTPS: https://localhost:8443/ecc800/
   HTTP:  http://localhost:8000/ecc800/
   
🔐 Authentication:
   Login required
   Roles: Admin, Analyst, Viewer
   
📊 Pages Available:
   • /overview       - Dashboard utama
   • /equipment      - Daftar peralatan
   • /trends         - Tren kinerja
   • /faults         - Analisis kesalahan
   • /explorer       - Penjelajahi data
   • /admin          - Panel administrasi
```

---

## 5. ระยะเวลาการทำงาน

### 5.1 Timeline เฉพาะแต่ละ Phase

| Phase | Activity | ระยะเวลา | ข้อสังเกต |
|-------|----------|---------|----------|
| 1 | Export from ECC800 | **5-10 นาที** | Selenium automation, network dependent |
| 2 | Extract/Process TGZ | **30 วินาที** | Latest-only processing, CPU bound |
| 3 | Import to PostgreSQL | **3-8 นาที** | Staging table + COPY method, I/O bound |
| 4 | Cleanup | **5 วินาที** | Simple file operations |
| 5 | Verification | **1 นาที** | Database queries + report generation |
| 6 | Dashboard Update | **Real-time** | API serves data immediately |
| **TOTAL** | **Full Cycle** | **~10-25 นาที** | **Average: 15 นาที** |

### 5.2 Factors Affecting Duration
```
⏱️ ปัจจัยที่มีผลต่อเวลา:

1. EXPORT Phase:
   ✓ Network speed (✓ ส่วนใหญ่ผลมาจากนี้)
   ✓ ECC800 server load
   ✓ Browser rendering speed
   ✗ Number of records (fixed by time period)

2. IMPORT Phase:
   ✓ Number of records to import
   ✓ Database server load
   ✓ Disk I/O speed
   ✓ Amount of deduplication needed
   ✗ Network (local connection)

3. OVERALL:
   ✓ System resources (CPU, Memory, Disk)
   ✓ Concurrent operations
   ✓ Database optimization
   ✓ File system performance
```

---

## 6. ไฟล์และโฟลเดอร์สำคัญ

### 6.1 Directory Structure
```
/opt/code/ecc800/
│
├── 📄 config.json                              # ⚙️ Configuration
├── 📄 .env                                     # 🔐 Environment variables
├── 📄 requirements.txt                         # 📦 Python dependencies
│
├── 📜 enhanced_working_pipeline.sh             # 🎯 Main Pipeline Script
├── 📜 enhanced_complete_pipeline.sh            # Backup pipeline
├── 📜 run_complete_pipeline.sh                 # Alternative runner
│
├── 🔧 Scripts Directory
│   ├── unlimited_timeout_exporter.py           # 📤 Export (Selenium)
│   ├── latest_only_tgz_processor.py            # 📦 Process TGZ
│   ├── enhanced_performance_importer.py        # 🗄️ Import PostgreSQL
│   ├── comprehensive_reporter.py               # 📊 Generate Reports
│   ├── monitor.py                              # 👀 Monitor system
│   └── ecc800_audit_policy.py                  # 🔐 Audit logging
│
├── 📂 csv/                                     # CSV files storage
│   ├── 1_day.csv                               # Performance data (daily)
│   ├── 1_hour.csv                              # Performance data (hourly)
│   ├── 5_minute.csv                            # Performance data (5-min)
│   ├── unzip/                                  # ⚠️ Temporary extraction
│   └── HistoryData_*.tgz                       # ⚠️ Downloaded files
│
├── 📂 processed/                               # Archived CSV files
│   └── [history of processed files]
│
├── 📂 reports/                                 # Generated reports
│   ├── enhanced_pipeline_report_*.txt          # Pipeline reports
│   └── comprehensive_analysis_*.csv            # Analysis reports
│
├── 📂 logs/                                    # Pipeline logs
│   └── enhanced_pipeline_*.log                 # Detailed logs
│
├── 🗄️ ecc800/                                 # Database-related
│   ├── export_fault/                           # Fault import logic
│   ├── database/                               # DB schemas
│   └── docs/                                   # Documentation (THIS FILE)
│
├── 🔧 backend/                                 # FastAPI Backend
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── api/
│   │       ├── routes/
│   │       │   ├── dashboard.py
│   │       │   ├── equipment.py
│   │       │   ├── performance.py
│   │       │   ├── faults.py
│   │       │   └── reports.py
│   │       └── dependencies.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── 🎨 frontend/                                # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Equipment.tsx
│   │   │   ├── Trends.tsx
│   │   │   ├── Faults.tsx
│   │   │   ├── Explorer.tsx
│   │   │   └── Admin.tsx
│   │   ├── components/
│   │   ├── stores/
│   │   ├── api/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── 🐳 Docker
    ├── docker-compose.yml                     # Container orchestration
    ├── Dockerfile                             # Backend image
    └── nginx/
        └── nginx.conf                         # Reverse proxy config
```

### 6.2 สำคัญสุด (Must-Have Files)
```
🔴 Critical for Pipeline:
   ✓ enhanced_working_pipeline.sh              - Main entry point
   ✓ config.json                               - Configuration database
   ✓ .env                                      - Credentials
   ✓ unlimited_timeout_exporter.py             - Export mechanism
   ✓ latest_only_tgz_processor.py              - TGZ processing
   ✓ enhanced_performance_importer.py          - Data import
   ✓ docker-compose.yml                        - Container setup
   ✓ PostgreSQL instance                       - Data storage
```

---

## 7. สคริปต์และคำสั่ง

### 7.1 Main Pipeline Commands

#### Full Pipeline (Export + Import + Verify)
```bash
./enhanced_working_pipeline.sh --site dc --action full --verify
```
**ผล:** Export → Process → Import → Cleanup → Verify → Complete

#### Export Only
```bash
./enhanced_working_pipeline.sh --site dc --action export --timeout 1800
```
**ผล:** ดึงข้อมูลจาก ECC800 เท่านั้น

#### Import Only
```bash
./enhanced_working_pipeline.sh --site dc --action import --verify
```
**ผล:** นำเข้า CSV files ที่มีอยู่เข้า database

#### Generate Report Only
```bash
./enhanced_working_pipeline.sh --site dc --action report
```
**ผล:** สร้างรายงานการตรวจสอบ

#### Disaster Recovery Site
```bash
./enhanced_working_pipeline.sh --site dr --action full --verify
```
**ผล:** ทำงาน full pipeline สำหรับ DR site

### 7.2 Usage Syntax
```bash
USAGE:
    ./enhanced_working_pipeline.sh --site <dc|dr> --action <export|import|full|report> [OPTIONS]

REQUIRED:
    --site <dc|dr>              ไซต์ปลายทาง (dc=Data Center, dr=Disaster Recovery)
    --action <export|import|    อะไรจะทำ
             |full|report>

OPTIONS:
    --verify                    ตรวจสอบและสร้างรายงาน
    --cleanup                   ทำความสะอาดไฟล์ temp (default)
    --username <user>           Override username สำหรับ export
    --password <pass>           Override password สำหรับ export
    --timeout <seconds>         Override timeout (default: 1800 sec = 30 min)
    --help                      แสดงคู่มืออย่างนี้

EXAMPLES:
    # Full pipeline with verification
    ./enhanced_working_pipeline.sh --site dc --action full --verify
    
    # Export with custom credentials
    ./enhanced_working_pipeline.sh --site dc --action export \\
        --username admin --password secret123
    
    # Import with extended timeout
    ./enhanced_working_pipeline.sh --site dc --action import \\
        --timeout 3600 --verify
    
    # Generate report only
    ./enhanced_working_pipeline.sh --site dc --action report
```

### 7.3 Individual Component Scripts
```bash
# Export Performance Data
python3 unlimited_timeout_exporter.py

# Process TGZ files
python3 latest_only_tgz_processor.py
# or
python3 auto_tgz_processor.py

# Import Performance Data
python3 enhanced_performance_importer.py --site dc --source-dir ./csv

# Fault Data Import
python3 ecc800/export_fault/fault_performance_importer.py

# Generate Reports
python3 comprehensive_reporter.py
python3 scripts/generate_report.py dc config.json ./csv full true report.txt

# Monitor System
python3 monitor.py
```

### 7.4 Docker Commands
```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Database connection
psql -h localhost -p 5432 -U ecc800_user -d ecc800
```

---

## 8. ฟีเจอร์สำคัญ

### 8.1 Core Features
| Feature | ลักษณะ | ประโยชน์ |
|---------|--------|---------|
| **Latest-Only Processing** | ประมวลเฉพาะไฟล์ล่าสุด | ประหยัด CPU/Storage, หลีกเลี่ยงซ้ำ |
| **Staging Table Method** | ใช้ temp table + COPY | ความเร็ว 5K-10K rows/sec |
| **Upsert Logic** | INSERT NOT EXISTS + UPDATE EXISTS | จัดการซ้ำอัตโนมัติ |
| **Auto-Cleanup** | ลบไฟล์ temp อัตโนมัติ | ไม่เต็มพื้นที่ |
| **Multi-Site Support** | รองรับ DC + DR | ใช้ได้หลายสถานที่ |
| **Comprehensive Logging** | บันทึกทุก import session | Audit trail ที่สมบูรณ์ |
| **Error Handling** | Graceful error recovery | ระบบไม่พัง เมื่อเกิด error |
| **Timeout Control** | Custom timeout settings | ป้องกัน hang processes |
| **Dashboard Integration** | Real-time API endpoints | Instant visualization |
| **Performance Metrics** | Track duration, speeds, stats | Monitor effectiveness |

### 8.2 Data Quality Features
```
✅ Data Deduplication
   • Equipment ID + Timestamp = unique key
   • Detect & handle duplicates intelligently
   • Insert new + Update existing + Skip duplicates

✅ Data Validation
   • Check required columns
   • Validate data types
   • Range checking (values within expected bounds)
   • NULL value handling

✅ Audit Trail
   • Every import logged in database
   • Session tracking
   • User/IP recording
   • Timestamp recording

✅ Error Recovery
   • Transaction rollback on errors
   • Partial import possible
   • Retry mechanisms
   • Detailed error messages
```

---

## 9. การจัดการข้อมูล

### 9.1 Data Flow
```
Source Data (ECC800)
        ↓
    EXPORT (Selenium)
        ↓
   HistoryData.tgz
        ↓
    EXTRACT (Python)
        ↓
   CSV Files (1_day, 1_hour, 5_minute)
        ↓
    VALIDATE & CLEAN
        ↓
   Staging Table (PostgreSQL)
        ↓
   UPSERT Logic
   (INSERT + UPDATE)
        ↓
   performance_data table
        ↓
   Database Views
        ↓
   API Endpoints
        ↓
   Dashboard Frontend
        ↓
   User Visualization
```

### 9.2 Data Retention Policy
```
📋 Retention Rules:
   • Raw TGZ files: ทันทีหลัง import (หรือ 1 วัน)
   • Extracted CSV: ย้ายไป processed/ folder (keep 30 days)
   • Import logs: เก็บ 90 days
   • Database records: เก็บตลอด (ตามนโยบาย)
   • Reports: Archive > 7 days ให้เก็บ

🗑️ Cleanup Strategy:
   • Automatic via cleanup phase
   • Manual cleanup: find . -name "*.tgz" -mtime +1 -delete
   • Archive old logs: tar -czf logs_archive_$(date).tar.gz logs/
```

### 9.3 CSV File Formats
```
📊 1_day.csv
   Columns: Equipment, Equipment ID, Performance Data, Statistical Period,
            Statistical Start Time, Value, Unit, [timestamp, site_code, ...]
   Rows: ~3K per import
   Size: 200-500 KB

📊 1_hour.csv
   Columns: [Same as above]
   Rows: ~100K per import
   Size: 5-20 MB

📊 5_minute.csv
   Columns: [Same as above]
   Rows: ~200K+ per import
   Size: 20-50 MB

⚙️ Processing Logic:
   • Read CSV into Pandas DataFrame
   • Clean column names (strip whitespace)
   • Validate required columns
   • Type conversion (string → numeric/date)
   • Load into staging table via COPY
```

---

## 10. ความปลอดภัย

### 10.1 Security Features
```
🔐 Authentication
   • Admin login required
   • Credentials stored in .env (not git)
   • Session-based tracking
   • Multi-role support (Admin, Analyst, Viewer)

🔒 Data Protection
   • HTTPS/SSL (self-signed certificates for dev)
   • Database access restricted
   • SQL injection prevention (parameterized queries)
   • Input validation & sanitization

📋 Audit Trail
   • All import sessions logged
   • User/IP tracking
   • Timestamp on every operation
   • File integrity checking (MD5/SHA256)

🛡️ Access Control
   • Role-based permissions
   • Row-level security via site_code
   • API endpoint authorization
   • Database user with minimal privileges
```

### 10.2 Configuration Management
```
📄 Credentials Storage:
   .env file (not in git):
      IM_BASE_URL=https://10.251.4.254
      IM_USERNAME=admin
      IM_PASSWORD=Changeme
      DB_PASSWORD=postgres_password
      
   config.json (data_centers section):
      {
        "data_centers": {
          "dc": {"ip": "10.251.4.254", ...},
          "dr": {"ip": "10.251.4.255", ...}
        }
      }

⚠️ Security Notes:
   • Never commit .env to git
   • Use environment-specific configs
   • Rotate credentials regularly
   • Use secrets manager in production
```

---

## 11. การแก้ไขปัญหา

### 11.1 Common Issues & Solutions

#### ❌ Issue: Export Timeout
```
Error: Export timed out after 1800 seconds

Solution:
   1. Increase timeout:
      ./enhanced_working_pipeline.sh --site dc --action export --timeout 3600
   
   2. Check ECC800 system status:
      ping 10.251.4.254
      curl -k https://10.251.4.254/
   
   3. Check network:
      speedtest-cli
      iperf3 -c 10.251.4.254
   
   4. Try manual export first
```

#### ❌ Issue: Import Fails (Database Error)
```
Error: Failed to connect to database

Solution:
   1. Check PostgreSQL status:
      psql -h localhost -U ecc800_user -d ecc800 -c "SELECT 1"
   
   2. Start PostgreSQL:
      docker-compose restart postgres
      systemctl start postgresql
   
   3. Check credentials in .env:
      cat .env | grep DB_
   
   4. Verify port:
      netstat -an | grep 5432
      lsof -i :5432
```

#### ❌ Issue: CSV Not Found
```
Error: No CSV files found in ./csv

Solution:
   1. Check extraction:
      ls -la /opt/code/ecc800/csv/
      ls -la /opt/code/ecc800/csv/unzip/
   
   2. Try extract manually:
      python3 latest_only_tgz_processor.py
   
   3. Check TGZ file:
      tar -tzf /path/to/file.tgz | head -20
   
   4. Verify unzip command:
      which unzip
      unzip -l /path/to/file.tgz
```

#### ❌ Issue: High Duplicate Rate
```
Warning: 90% of records are duplicates (skipped)

This is NORMAL! Reasons:
   • Data updated periodically (not every record changes)
   • Performance metrics are cumulative
   • Same equipment → same data if no change
   
Action:
   • This is expected behavior ✓
   • New records will be inserted as needed
   • Database automatically deduplicates
   • No action needed
```

### 11.2 Debugging Tips
```
🔍 Enable Debug Mode:
   export IM_DEBUG=true
   python3 enhanced_performance_importer.py

📝 Check Logs:
   tail -f /opt/code/ecc800/logs/enhanced_pipeline_dc_*.log
   grep ERROR /opt/code/ecc800/logs/*.log
   
💾 Inspect Database:
   psql -h localhost -U ecc800_user -d ecc800
   
   \dt                              -- List tables
   SELECT COUNT(*) FROM performance_data;    -- Count records
   SELECT * FROM performance_data LIMIT 5;   -- View sample
   
   SELECT * FROM performance_data_import_logs 
   ORDER BY start_time DESC LIMIT 5;         -- Recent imports

🔧 Test Components Individually:
   python3 unlimited_timeout_exporter.py         # Test export
   python3 latest_only_tgz_processor.py          # Test extract
   python3 enhanced_performance_importer.py      # Test import
```

### 11.3 Recovery Procedures

#### Recovery: Corrupted Import
```bash
# 1. Identify the problematic session
SELECT * FROM performance_data_import_logs 
WHERE status = 'FAILED' 
ORDER BY start_time DESC 
LIMIT 1;

# 2. Delete incomplete import
DELETE FROM performance_data 
WHERE import_timestamp > '2026-04-28 10:00:00';

# 3. Re-run import
python3 enhanced_performance_importer.py --site dc --source-dir ./csv
```

#### Recovery: Out of Disk Space
```bash
# 1. Check disk usage
du -sh /opt/code/ecc800/*
df -h /opt/code/ecc800/

# 2. Clean old files
rm -rf /opt/code/ecc800/csv/*.tgz
rm -rf /opt/code/ecc800/csv/unzip/*
find /opt/code/ecc800/logs -mtime +30 -delete

# 3. Archive old reports
tar -czf /archive/reports_old.tar.gz /opt/code/ecc800/reports/*.txt
```

#### Recovery: Database Connection Lost
```bash
# 1. Check PostgreSQL
systemctl status postgresql
docker-compose ps postgres

# 2. Restart PostgreSQL
docker-compose restart postgres
# or
systemctl restart postgresql

# 3. Verify connection
psql -h localhost -U ecc800_user -d ecc800 -c "SELECT version();"
```

---

## 📚 References

### Configuration Files
- `/opt/code/ecc800/config.json` - Main configuration
- `/opt/code/ecc800/.env` - Environment variables
- `/opt/code/ecc800/docker-compose.yml` - Container setup

### Documentation
- `README.md` - Project overview
- `COMPREHENSIVE_SYSTEM_ANALYSIS_TH.md` - System analysis
- `COMPLETE_PIPELINE_ARCHITECTURE.md` - Architecture details

### Source Code
- `enhanced_working_pipeline.sh` - Main orchestrator
- `unlimited_timeout_exporter.py` - Export mechanism
- `enhanced_performance_importer.py` - Import logic
- `latest_only_tgz_processor.py` - TGZ processing

---

## 📞 Support & Contact

สำหรับปัญหาหรือคำถาม:
1. ตรวจสอบ logs: `/opt/code/ecc800/logs/`
2. อ่านเอกสาร: `/opt/code/ecc800/ecc800/docs/`
3. ติดต่อ System Administrator
4. ตรวจสอบ GitHub Issues

---

**End of Document**

*Last Updated: 28 เมษายน 2569*  
*Version: 3.0 (Complete & Comprehensive)*  
*Status: ✅ Production Ready*

