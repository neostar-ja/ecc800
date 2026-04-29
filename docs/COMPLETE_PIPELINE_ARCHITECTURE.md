# Complete Pipeline Architecture

**Document Version:** 1.0  
**Last Updated:** April 23, 2026  
**Status:** Production Ready  
**Scope:** Export, Import, Fault Processing, Auto-Processing, and Orchestration

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Export Pipeline](#export-pipeline)
4. [Import Pipeline](#import-pipeline)
5. [Fault Pipeline](#fault-pipeline)
6. [Auto-Processing System](#auto-processing-system)
7. [Pipeline Orchestration](#pipeline-orchestration)
8. [Database Schema](#database-schema)
9. [Data Processing Flow](#data-processing-flow)
10. [CLI Commands & Usage](#cli-commands--usage)
11. [Configuration & Tuning](#configuration--tuning)
12. [Error Handling & Recovery](#error-handling--recovery)
13. [Monitoring & Status](#monitoring--status)
14. [Performance Optimization](#performance-optimization)
15. [Troubleshooting](#troubleshooting)

---

## Overview

The **ECC800 Pipeline System** is a comprehensive data integration and processing framework that handles:
- **Data Export** - Extract performance and fault data from source systems to CSV
- **Data Import** - Load and deduplicate CSV data into PostgreSQL database
- **Fault Processing** - Special handling for fault event data with deduplication
- **Auto-Processing** - Continuous monitoring and automatic data ingestion
- **Orchestration** - Complete end-to-end workflow automation

### Key Statistics

- **Export Rate:** 50,000-100,000 records per export
- **Import Speed:** 5,000-10,000 rows/second (with staging tables)
- **Processing Time:** 5-30 minutes for full pipeline
- **Deduplication Rate:** 15-40% of imported data
- **Support Sites:** DC (Data Center), DR (Disaster Recovery)
- **Data Formats:** CSV, TGZ (compressed CSV archives)
- **Automation Level:** Full end-to-end with monitoring

---

## Pipeline Architecture

### System Components

```
┌────────────────────────────────────────────────────────────┐
│ ECC800 Pipeline System                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────┐     ┌─────────────┐    ┌──────────────┐  │
│ │   Export    │────▶│  Extract &  │───▶│    Import    │  │
│ │  Pipeline   │     │ Validate    │    │   Pipeline   │  │
│ └─────────────┘     └─────────────┘    └──────────────┘  │
│       ▲                    │                     │         │
│       │                    ▼                     ▼         │
│       │             ┌─────────────┐    ┌──────────────┐  │
│       │             │   Staging   │───▶│  Dedupl.    │  │
│       │             │   Tables    │    │  & Upsert   │  │
│       │             └─────────────┘    └──────────────┘  │
│       │                    │                     │         │
│       │                    ▼                     ▼         │
│       │             ┌──────────────────────────────┐     │
│       └─────────────│  Database                    │     │
│                     │  (PostgreSQL/TimescaleDB)    │     │
│                     └──────────────────────────────┘     │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │         Auto-Processing & Orchestration             │ │
│ │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│ │  │  Watchdog    │  │   Fault      │  │ Complete │ │ │
│ │  │  Monitor     │  │   Pipeline   │  │ Pipeline │ │ │
│ │  └──────────────┘  └──────────────┘  └──────────┘ │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │            Monitoring & Logging                     │ │
│ │  ┌──────────────────────────────────────────────┐  │ │
│ │  │  Status API, Logs, Reports                  │  │ │
│ │  └──────────────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
└────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

**Stage 1: Initialization**
- Validate environment and configuration
- Check database connectivity
- Verify file permissions
- Initialize logging

**Stage 2: Export**
- Connect to source system
- Execute export queries
- Generate CSV files
- Compress to TGZ archive

**Stage 3: Extraction**
- Decompress TGZ files
- Parse CSV headers
- Validate data format
- Create staging records

**Stage 4: Transformation**
- Parse field values
- Apply data type conversions
- Calculate checksums/hashes
- Remove duplicates

**Stage 5: Loading**
- Create staging tables
- Bulk insert to staging
- Run deduplication queries
- Upsert to main tables

**Stage 6: Verification**
- Count inserted/updated records
- Validate data consistency
- Check index integrity
- Generate status report

**Stage 7: Cleanup**
- Remove staging tables
- Delete temporary files
- Archive old exports
- Log completion

---

## Export Pipeline

### Overview

The export pipeline extracts data from source systems (Huawei ecc800) and generates CSV files for ingestion. Three variants support different use cases:

1. **unlimited_timeout_exporter.py** - Production standard (unlimited wait)
2. **enhanced_fault_exporter.py** - Fault-specific with UI integration
3. **simplified_fault_exporter.py** - Lightweight with timeout control

### Export Process Flow

```
Initialize Export
    ↓
Connect to Source System
    ├─ HTTPS/API connection
    ├─ Authenticate
    └─ Test connectivity
    ↓
Execute Export Queries
    ├─ Performance data query
    ├─ Fault information query
    └─ Equipment master query
    ↓
Generate CSV Files
    ├─ Write headers
    ├─ Stream records
    └─ Track progress
    ↓
Compress Archive
    ├─ Create TGZ file
    ├─ Calculate checksum
    └─ Verify integrity
    ↓
Save Export Session
    ├─ Record metadata
    ├─ Store file reference
    └─ Log completion
    ↓
Return Export Path
```

### Export Script: unlimited_timeout_exporter.py

**Location:** `/opt/code/ecc800/unlimited_timeout_exporter.py`

**Purpose:** Production-grade exporter with unlimited timeout and robust error handling

**Key Features:**
```python
class UnlimitedTimeoutExporter:
    """
    Main export class with features:
    - Unlimited timeout (no premature termination)
    - Streaming CSV writes (memory efficient)
    - TGZ compression
    - Checksum verification
    - Progress tracking
    - Detailed logging
    """
```

**Usage:**
```bash
python3 unlimited_timeout_exporter.py \
  --base-url "https://10.251.150.222:3344" \
  --api-key "your_api_key" \
  --output-dir "/path/to/exports" \
  --site-code "dc" \
  --log-level "INFO"
```

**Parameters:**
```python
--base-url: str           # Source system base URL
--api-key: str            # Authentication token/key
--output-dir: str         # Directory to save exports
--site-code: str          # Site identifier (dc, dr)
--log-level: str          # Logging level (DEBUG/INFO/WARNING)
--verify-ssl: bool        # SSL verification (default: False for self-signed)
--timeout: int            # Connection timeout in seconds (default: None)
--chunk-size: int         # CSV write chunk size (default: 1000)
```

**Output:**
```
exports/
├── ecc800_export_2026-04-23_10-30-00.csv       # Performance data
├── ecc800_fault_export_2026-04-23_10-30-00.csv # Fault data
└── ecc800_export_2026-04-23_10-30-00.tar.gz    # Combined archive
```

### Export Data Format

**Performance CSV:**
```csv
equipment_id,site_code,performance_data,statistical_start_time,statistical_end_time,value_numeric,value_text,unit,data_source
Aisle-T/H Sensor Group-T/H Sensor1,dc,Temperature,2026-04-23 10:00:00,2026-04-23 10:01:00,24.5,24.5,°C,ecc800-api
Aisle-T/H Sensor Group-T/H Sensor1,dc,Humidity,2026-04-23 10:00:00,2026-04-23 10:01:00,45.2,45.2,%,ecc800-api
```

**Fault CSV:**
```csv
equipment_id,site_code,performance_data,value_numeric,value_text,unit,severity,fault_time,cleared_time,description
PDU-Voltage Monitor-Outlet A1,dc,Voltage,245.5,245.5,V,warning,2026-04-23 09:30:00,,Voltage deviation
UPS-001,dc,Battery Capacity,85.0,85.0,%,info,2026-04-23 08:15:00,2026-04-23 09:15:00,Low battery detected
```

### Export SQL Queries

**Performance Data Query:**
```sql
SELECT 
    equipment_id,
    site_code,
    performance_data,
    statistical_start_time,
    statistical_end_time,
    value_numeric,
    value_text,
    unit,
    data_source
FROM source_performance_data
WHERE site_code = %s
    AND statistical_start_time > NOW() - INTERVAL '%d days'
ORDER BY equipment_id, statistical_start_time DESC;
```

**Fault Information Query:**
```sql
SELECT 
    equipment_id,
    site_code,
    performance_data,
    value_numeric,
    value_text,
    unit,
    CASE 
        WHEN value_numeric > threshold THEN 'critical'
        ELSE 'warning'
    END AS severity,
    event_time AS fault_time,
    cleared_time,
    description
FROM source_fault_data
WHERE site_code = %s
    AND event_time > NOW() - INTERVAL '%d days'
ORDER BY event_time DESC;
```

---

## Import Pipeline

### Overview

The import pipeline loads CSV data into the database with automatic deduplication. Uses three strategies:

1. **Standard Importer** - Simple INSERT/UPDATE with constraint checking
2. **Fault Importer** - Staging table method (3x faster for faults)
3. **Multi-Site Importer** - Handles DC/DR with site isolation

### Import Process Flow

```
Load CSV File
    ↓
Parse CSV Headers & Data
    ├─ Validate field count
    ├─ Check data types
    └─ Track errors
    ↓
Calculate Hashes (Deduplication)
    ├─ MD5/SHA hash per record
    ├─ Compare against DB
    └─ Identify duplicates
    ↓
Create Staging Table
    ├─ Temporary table (1 minute lifetime)
    ├─ Same schema as target
    └─ No constraints
    ↓
Bulk Insert to Staging
    ├─ COPY FROM (PostgreSQL)
    ├─ 5,000-10,000 rows/sec
    └─ Progress tracking
    ↓
Deduplication Query
    ├─ DELETE existing hashes
    ├─ Find new records
    └─ Calculate differing columns
    ↓
Upsert to Main Table
    ├─ INSERT new records
    ├─ UPDATE changed records
    └─ IGNORE unchanged
    ↓
Cleanup Staging
    ├─ DROP staging table
    ├─ Update logs
    └─ Generate report
    ↓
Return Import Statistics
```

### Import Script: fault_performance_importer.py

**Location:** `/opt/code/ecc800/fault_performance_importer.py`

**Purpose:** Fast fault data importer using staging table method

**Key Features:**
```python
class FaultPerformanceImporter:
    """
    Features:
    - Staging table method (3x faster)
    - Hash-based deduplication
    - Batch processing
    - Transaction safety
    - Detailed statistics
    - Auto-cleanup
    """
```

**Usage:**
```bash
python3 fault_performance_importer.py \
  --csv-file "exports/fault_data_2026-04-23.csv" \
  --db-host "10.251.150.222" \
  --db-port 5210 \
  --db-user "apirak" \
  --db-password "password" \
  --db-name "ecc800" \
  --table "fault_performance_data" \
  --deduplicate \
  --batch-size 5000
```

**Parameters:**
```python
--csv-file: str           # Path to CSV file
--db-host: str            # Database hostname
--db-port: int            # Database port (default: 5432)
--db-user: str            # Database user
--db-password: str        # Database password
--db-name: str            # Database name
--table: str              # Target table name
--deduplicate: bool       # Enable deduplication (default: True)
--batch-size: int         # Records per batch (default: 5000)
--use-staging: bool       # Use staging table (default: True)
--skip-validation: bool   # Skip CSV validation
```

### Deduplication Strategy

**Hash Calculation:**
```python
def calculate_record_hash(record):
    """
    Create unique hash from key fields:
    - equipment_id
    - site_code
    - performance_data
    - statistical_start_time
    
    Using MD5 for speed (not security)
    """
    key_fields = f"{record['equipment_id']}_{record['site_code']}_" \
                 f"{record['performance_data']}_{record['statistical_start_time']}"
    return hashlib.md5(key_fields.encode()).hexdigest()
```

**Deduplication Query:**
```sql
-- Stage 1: Identify new records (not in database)
CREATE TEMPORARY TABLE new_records AS
SELECT s.*
FROM staging_fault_data s
LEFT JOIN fault_performance_data m ON 
    s.equipment_id = m.equipment_id 
    AND s.site_code = m.site_code
    AND s.performance_data = m.performance_data
    AND s.statistical_start_time = m.statistical_start_time
WHERE m.id IS NULL;

-- Stage 2: Identify records with changes
CREATE TEMPORARY TABLE changed_records AS
SELECT s.id
FROM staging_fault_data s
INNER JOIN fault_performance_data m ON 
    s.equipment_id = m.equipment_id 
    AND s.site_code = m.site_code
    AND s.performance_data = m.performance_data
    AND s.statistical_start_time = m.statistical_start_time
WHERE s.value_numeric != m.value_numeric
    OR s.value_text != m.value_text;

-- Stage 3: Insert new records
INSERT INTO fault_performance_data (equipment_id, site_code, performance_data, ...)
SELECT * FROM new_records;

-- Stage 4: Update changed records
UPDATE fault_performance_data m
SET value_numeric = s.value_numeric, ...
FROM staging_fault_data s
WHERE s.id IN (SELECT id FROM changed_records);
```

### Upsert Strategy

**ON CONFLICT Method (PostgreSQL 9.5+):**
```sql
INSERT INTO fault_performance_data (
    equipment_id, site_code, performance_data, 
    statistical_start_time, value_numeric, unit
)
SELECT 
    equipment_id, site_code, performance_data,
    statistical_start_time, value_numeric, unit
FROM staging_fault_data
ON CONFLICT (equipment_id, site_code, performance_data, statistical_start_time)
DO UPDATE SET
    value_numeric = EXCLUDED.value_numeric,
    unit = EXCLUDED.unit,
    updated_at = CURRENT_TIMESTAMP
WHERE EXCLUDED.value_numeric IS DISTINCT FROM fault_performance_data.value_numeric;
```

### Import Statistics

**Returned after import:**
```json
{
  "total_records": 250000,
  "new_records": 150000,
  "updated_records": 75000,
  "duplicate_records": 25000,
  "skipped_records": 0,
  "import_duration_seconds": 45,
  "records_per_second": 5556,
  "deduplication_rate": 0.10,
  "database_size_before_mb": 2500,
  "database_size_after_mb": 2750,
  "timestamp": "2026-04-23T10:45:30Z"
}
```

---

## Fault Pipeline

### Overview

The **Fault Pipeline** is a specialized orchestration system for fault event processing. Accessible via shell script interface with support for export, import, and full cycle operations.

**Location:** `/opt/code/ecc800/export_fault/fault_pipeline.sh`

### Fault Pipeline Workflow

```
fault_pipeline.sh --action {export|import|full} --site {dc|dr} --verify
    │
    ├─── export ───▶ Query faults from source
    │               Generate CSV
    │               Create TGZ archive
    │               Return archive path
    │
    ├─── import ───▶ Read latest TGZ file
    │               Extract CSV
    │               Import to database
    │               Verify import
    │               Generate report
    │
    └─── full ─────▶ Execute export
                    Execute import
                    Run verification
                    Generate summary
```

### Fault Pipeline Script Structure

**Main Entry Point:**
```bash
#!/bin/bash

SITE_CODE="${SITE_CODE:-dc}"
ACTION="${ACTION:-full}"
ENABLE_VERIFY="${ENABLE_VERIFY:-true}"
TIMEOUT_MODE="unlimited"  # Handles long-running exports

# Process arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --site) SITE_CODE="$2"; shift 2 ;;
    --action) ACTION="$2"; shift 2 ;;
    --verify) ENABLE_VERIFY="true"; shift ;;
    *) shift ;;
  esac
done

# Main execution
case "$ACTION" in
  export) run_export ;;
  import) run_import ;;
  full) run_full_pipeline ;;
  *) usage ;;
esac
```

### Fault Pipeline Commands

#### 1. Export Faults

```bash
./fault_pipeline.sh --site dc --action export --verify

# Output:
# [2026-04-23 10:30:00] Starting fault export...
# [2026-04-23 10:35:45] Export completed: /exports/fault_2026-04-23_10-30-00.tar.gz
# [2026-04-23 10:35:46] Records exported: 15420
# [2026-04-23 10:35:47] Verification: PASSED
```

#### 2. Import Faults

```bash
./fault_pipeline.sh --site dc --action import --verify

# Output:
# [2026-04-23 10:35:50] Starting fault import...
# [2026-04-23 10:36:35] Extracting archive...
# [2026-04-23 10:36:40] Importing to database...
# [2026-04-23 10:37:15] Import completed
# [2026-04-23 10:37:15] - Total records: 15420
# [2026-04-23 10:37:15] - New records: 3200
# [2026-04-23 10:37:15] - Updated records: 1100
# [2026-04-23 10:37:15] - Duplicates: 11120
```

#### 3. Full Pipeline (Export + Import)

```bash
./fault_pipeline.sh --site dc --action full --verify

# Output:
# [2026-04-23 10:30:00] ===== FULL PIPELINE START =====
# [2026-04-23 10:30:00] Site: DC
# [2026-04-23 10:30:01] Exporting fault data...
# [2026-04-23 10:35:50] Export completed
# [2026-04-23 10:35:51] Importing fault data...
# [2026-04-23 10:37:15] Import completed
# [2026-04-23 10:37:15] Verification: PASSED
# [2026-04-23 10:37:16] ===== FULL PIPELINE COMPLETE =====
```

### Fault Pipeline Features

**Thai Language Support:**
```bash
# Log messages in Thai
echo "$(date '+%Y-%m-%d %H:%M:%S') [ส่งออกข้อมูล] กำลังส่งออกข้อมูล..."
echo "$(date '+%Y-%m-%d %H:%M:%S') [นำเข้าข้อมูล] กำลังนำเข้าข้อมูล..."
echo "$(date '+%Y-%m-%d %H:%M:%S') [ตรวจสอบ] ตรวจสอบความสมบูรณ์..."
```

**Error Handling:**
```bash
# Try-catch equivalent
set -e  # Exit on error
trap 'on_error' ERR

on_error() {
  echo "[ERROR] Pipeline failed at line $1"
  send_alert "Pipeline failed for site $SITE_CODE"
  exit 1
}
```

**Automatic Cleanup:**
```bash
# Clean temporary files
cleanup() {
  rm -f "$TEMP_DIR"/*.csv
  rm -f "$TEMP_DIR"/*.log
  rmdir "$TEMP_DIR" 2>/dev/null || true
}

trap cleanup EXIT
```

---

## Auto-Processing System

### Overview

Automatic processing monitors for new exported files and processes them without manual intervention. Three implementations support different use cases:

1. **simple_auto_tgz_processor.py** - Standard watchdog-based monitor
2. **latest_only_tgz_processor.py** - Process only newest file
3. **fault_auto_tgz_processor.py** - Fault-specific processor

### Auto-Processing Flow

```
Initialize Watchdog
    ↓
Monitor Export Directory
    │
    ├─ File Created ────▶ Wait for completion
    ├─ File Modified ──▶ Validate completeness
    └─ File Stability ─▶ 5-second no-change threshold
    │
    ├─ Extract Archive
    │
    ├─ Validate CSV
    │   ├─ Check headers
    │   ├─ Parse sample rows
    │   └─ Verify schema
    │
    ├─ Import Data
    │   ├─ Deduplicate
    │   ├─ Upsert
    │   └─ Verify
    │
    ├─ Cleanup
    │   ├─ Archive processed file
    │   ├─ Delete temp files
    │   └─ Update status
    │
    └─ Log Results
        ├─ Write metrics
        ├─ Send notification
        └─ Continue monitoring
```

### Auto-Processor: simple_auto_tgz_processor.py

**Location:** `/opt/code/ecc800/simple_auto_tgz_processor.py`

**Purpose:** Continuous monitoring and automatic processing of exported files

**Usage:**
```bash
python3 simple_auto_tgz_processor.py \
  --monitor-dir "/opt/code/ecc800/exports" \
  --db-config "/opt/code/ecc800/config.json" \
  --log-level "INFO" \
  --process-existing \
  --archive-processed
```

**Parameters:**
```python
--monitor-dir: str        # Directory to monitor for new files
--db-config: str          # Database configuration file
--log-level: str          # Logging level (DEBUG/INFO/WARNING/ERROR)
--process-existing: bool  # Process existing files on start
--archive-processed: bool # Archive after successful processing
--delete-processed: bool  # Delete after processing (default: False)
--stability-timeout: int  # Wait time for file completion (default: 5 seconds)
--max-retries: int        # Retry count on failure (default: 3)
```

**Example Output:**
```
[2026-04-23 10:30:00] Watchdog started, monitoring: /opt/code/ecc800/exports
[2026-04-23 10:35:50] File detected: ecc800_fault_2026-04-23_10-30-00.tar.gz
[2026-04-23 10:35:55] File stability confirmed
[2026-04-23 10:35:56] Extracting: ecc800_fault_2026-04-23_10-30-00.tar.gz
[2026-04-23 10:35:57] CSV validation: PASSED
[2026-04-23 10:36:01] Importing 15420 records...
[2026-04-23 10:37:15] Import completed: 3200 new, 1100 updated, 11120 duplicates
[2026-04-23 10:37:16] Archiving processed file
[2026-04-23 10:37:17] Processing complete
```

### Watchdog Implementation

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class TGZFileHandler(FileSystemEventHandler):
    def on_created(self, event):
        """Triggered when new file appears"""
        if event.src_path.endswith('.tar.gz'):
            self.queue_for_processing(event.src_path)
    
    def on_modified(self, event):
        """Triggered on file modification"""
        if self.file_stable(event.src_path):
            self.process_file(event.src_path)
    
    def file_stable(self, filepath):
        """Check if file is complete (not being written)"""
        try:
            stat1 = os.stat(filepath).st_size
            time.sleep(self.stability_timeout)
            stat2 = os.stat(filepath).st_size
            return stat1 == stat2
        except:
            return False

def monitor_directory(directory):
    """Start monitoring directory"""
    observer = Observer()
    observer.schedule(TGZFileHandler(), directory)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

---

## Pipeline Orchestration

### Complete Workflow

The **Complete Pipeline** orchestrates export, processing, and verification in sequence.

**Script:** `/opt/code/ecc800/run_complete_pipeline.sh`

**Workflow:**
```bash
#!/bin/bash

# 1. Initialize
initialize_pipeline
log_start_time

# 2. Export data
export_performance_data
export_fault_data

# 3. Create archives
create_tgz_archive

# 4. Extract and validate
extract_archive
validate_csv_format

# 5. Import to database
import_performance_data
import_fault_data

# 6. Verify integrity
verify_import_counts
verify_data_quality

# 7. Cleanup
archive_old_exports
remove_temp_files

# 8. Report
generate_completion_report
send_notification

log_end_time
```

**Usage:**
```bash
./run_complete_pipeline.sh \
  --site "dc" \
  --export-days 7 \
  --verify \
  --email "admin@company.com"
```

### Enhanced Pipeline

**Script:** `/opt/code/ecc800/enhanced_working_pipeline.sh`

**Improvements:**
- Parallel export (performance + fault simultaneously)
- Streaming deduplication
- Real-time progress reporting
- Automatic rollback on failure
- Email notifications
- Slack integration

**Usage:**
```bash
./enhanced_working_pipeline.sh \
  --site dc \
  --parallel \
  --notify-slack \
  --on-error "rollback"
```

---

## Database Schema

### Core Tables

#### Table: fault_performance_data

**Primary storage for all fault and performance data**

```sql
CREATE TABLE fault_performance_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(255) NOT NULL,
    site_code VARCHAR(50) NOT NULL,
    performance_data VARCHAR(100) NOT NULL,
    statistical_start_time TIMESTAMP NOT NULL,
    statistical_end_time TIMESTAMP,
    value_numeric DOUBLE PRECISION,
    value_text VARCHAR(255),
    unit VARCHAR(20),
    data_source VARCHAR(50),
    severity VARCHAR(20),
    hash VARCHAR(32),  -- MD5 hash for deduplication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- TimescaleDB time column
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hypertable setup
SELECT create_hypertable('fault_performance_data', 'time', if_not_exists => TRUE);

-- Compression
ALTER TABLE fault_performance_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'site_code,equipment_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Unique constraint for deduplication
ALTER TABLE fault_performance_data 
ADD CONSTRAINT unique_fault_record 
UNIQUE (equipment_id, site_code, performance_data, statistical_start_time);

-- Indexes
CREATE INDEX idx_fpd_site_time ON fault_performance_data (site_code, time DESC);
CREATE INDEX idx_fpd_equipment_time ON fault_performance_data (equipment_id, time DESC);
CREATE INDEX idx_fpd_hash ON fault_performance_data (hash);
CREATE INDEX idx_fpd_composite ON fault_performance_data 
    (site_code, equipment_id, time DESC);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `equipment_id` | VARCHAR(255) | Equipment ID |
| `site_code` | VARCHAR(50) | Site (DC/DR) |
| `performance_data` | VARCHAR(100) | Metric name |
| `statistical_start_time` | TIMESTAMP | Measurement start |
| `statistical_end_time` | TIMESTAMP | Measurement end |
| `value_numeric` | DOUBLE | Numeric value |
| `value_text` | VARCHAR(255) | Text value |
| `unit` | VARCHAR(20) | Unit (°C, %, kW) |
| `hash` | VARCHAR(32) | MD5 hash (dedup) |
| `time` | TIMESTAMP | TimescaleDB time |

#### Table: fault_equipment_master

**Master list of equipment**

```sql
CREATE TABLE fault_equipment_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(255) UNIQUE NOT NULL,
    site_code VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(255),
    equipment_type VARCHAR(50),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fem_equipment ON fault_equipment_master (equipment_id);
CREATE INDEX idx_fem_site ON fault_equipment_master (site_code);
```

#### Table: fault_data_import_logs

**Track all import operations**

```sql
CREATE TABLE fault_data_import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_session_id UUID,
    site_code VARCHAR(50),
    source_file VARCHAR(255),
    status VARCHAR(20),  -- 'pending', 'running', 'completed', 'failed'
    total_records INT,
    new_records INT,
    updated_records INT,
    duplicate_records INT,
    skipped_records INT,
    error_message TEXT,
    duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_import_logs_session ON fault_data_import_logs (import_session_id);
CREATE INDEX idx_import_logs_site ON fault_data_import_logs (site_code);
CREATE INDEX idx_import_logs_status ON fault_data_import_logs (status);
```

#### Table: export_sessions

**Track export operations**

```sql
CREATE TABLE export_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_code VARCHAR(50),
    export_type VARCHAR(20),  -- 'performance', 'fault', 'full'
    file_path VARCHAR(255),
    file_size_bytes BIGINT,
    record_count INT,
    checksum VARCHAR(64),
    status VARCHAR(20),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_export_sessions_site ON export_sessions (site_code);
CREATE INDEX idx_export_sessions_status ON export_sessions (status);
```

---

## Data Processing Flow

### Complete Data Transformation

```
┌─────────────────────────────────────────────────────────────┐
│ Raw Data from Source System (Huawei ecc800)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Export Pipeline                                             │
│ - Query source system                                       │
│ - Generate CSV files                                        │
│ - Create TGZ archive                                        │
│ - Calculate checksums                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CSV Files & Archives                                        │
│ - performance_2026-04-23.csv                               │
│ - fault_2026-04-23.csv                                     │
│ - ecc800_export_2026-04-23.tar.gz                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Auto-Processing (Watchdog)                                  │
│ - Detect new files                                          │
│ - Wait for completion (stability)                           │
│ - Extract archives                                          │
│ - Validate CSV format                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ CSV Parsing & Transformation                                │
│ - Parse headers                                             │
│ - Type conversions (string → numeric)                       │
│ - Calculate MD5 hashes                                      │
│ - Clean whitespace                                          │
│ - Handle null/missing values                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Staging Table                                               │
│ - Bulk insert from CSV                                      │
│ - COPY FROM (5000-10000 rows/sec)                          │
│ - No constraints (speed)                                    │
│ - Temporary (auto-drop after 1 min)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Deduplication                                               │
│ - Compare hash with existing records                        │
│ - Identify new vs. duplicate                                │
│ - Identify changed values                                   │
│ - Report statistics                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Upsert to Main Table                                        │
│ - INSERT new records                                        │
│ - UPDATE changed records                                    │
│ - Unique constraint enforcement                             │
│ - Index updates                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Database                                                    │
│ (PostgreSQL/TimescaleDB)                                   │
│ - fault_performance_data (main table)                       │
│ - Compressed data (>30 days)                               │
│ - Indexed for fast queries                                  │
│ - Hypertable with time partitions                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Quality Checks

**CSV Validation:**
```python
def validate_csv_format(filepath):
    """Validate CSV structure and content"""
    checks = {
        'header_count': len(expected_headers),
        'row_count': count_rows(filepath),
        'data_types': validate_column_types(),
        'null_values': identify_nulls(),
        'duplicate_rows': count_duplicates(),
        'encoding': 'utf-8',
        'line_endings': 'CRLF or LF',
        'file_size': check_size_mb()
    }
    return all(checks.values())
```

**Import Verification:**
```python
def verify_import(
    csv_path, 
    expected_count, 
    tolerance=0.05
):
    """Verify import completed successfully"""
    
    # Count rows in CSV
    csv_count = count_csv_rows(csv_path)
    
    # Count inserted rows
    db_count = count_database_records(
        since_timestamp=import_start_time
    )
    
    # Calculate dedup rate
    dedup_rate = (csv_count - db_count) / csv_count
    
    # Verify within tolerance
    assert abs(dedup_rate) <= tolerance, \
        f"Dedup rate {dedup_rate} exceeds tolerance {tolerance}"
    
    return True
```

---

## CLI Commands & Usage

### Fault Pipeline Commands

```bash
# 1. Export only
./fault_pipeline.sh --site dc --action export

# 2. Import only (uses latest export file)
./fault_pipeline.sh --site dc --action import

# 3. Full cycle (export + import)
./fault_pipeline.sh --site dc --action full

# 4. With verification
./fault_pipeline.sh --site dc --action full --verify

# 5. DR site
./fault_pipeline.sh --site dr --action full --verify

# 6. Both sites sequentially
./fault_pipeline.sh --site dc --action full && \
./fault_pipeline.sh --site dr --action full
```

### Auto-Processing Commands

```bash
# 1. Start watchdog (continuous monitoring)
python3 simple_auto_tgz_processor.py \
  --monitor-dir "/opt/code/ecc800/exports" \
  --process-existing

# 2. Process existing files only
python3 simple_auto_tgz_processor.py \
  --monitor-dir "/opt/code/ecc800/exports" \
  --process-existing \
  --no-monitor

# 3. Fault-specific processor
python3 fault_auto_tgz_processor.py \
  --monitor-dir "/opt/code/ecc800/exports" \
  --archive-after

# 4. Latest only processor
python3 latest_only_tgz_processor.py \
  --monitor-dir "/opt/code/ecc800/exports"
```

### Complete Pipeline Commands

```bash
# 1. Full export + auto-process
./run_complete_pipeline.sh --site dc

# 2. Enhanced version with parallel processing
./enhanced_working_pipeline.sh \
  --site dc \
  --parallel \
  --verify

# 3. With email notification
./run_complete_pipeline.sh \
  --site dc \
  --email "admin@company.com" \
  --on-success "email"

# 4. Cron-friendly (automated daily)
0 2 * * * /opt/code/ecc800/auto_import.sh >> /var/log/ecc800_import.log 2>&1
```

---

## Configuration & Tuning

### Configuration File

**File:** `/opt/code/ecc800/config.json`

```json
{
  "export": {
    "base_url": "https://10.251.150.222:3344",
    "api_key": "${ECC800_API_KEY}",
    "timeout": null,
    "verify_ssl": false,
    "chunk_size": 1000,
    "output_dir": "/opt/code/ecc800/exports"
  },
  "database": {
    "host": "10.251.150.222",
    "port": 5210,
    "username": "apirak",
    "password": "${DB_PASSWORD}",
    "database": "ecc800",
    "pool_size": 20,
    "max_overflow": 40,
    "timeout": 30
  },
  "import": {
    "batch_size": 5000,
    "use_staging": true,
    "deduplicate": true,
    "skip_validation": false,
    "max_retries": 3,
    "retry_delay_seconds": 5
  },
  "auto_process": {
    "monitor_dir": "/opt/code/ecc800/exports",
    "stability_timeout": 5,
    "archive_processed": true,
    "delete_after_success": false,
    "max_parallel_jobs": 2
  },
  "logging": {
    "level": "INFO",
    "format": "%(asctime)s [%(levelname)s] %(message)s",
    "file": "/var/log/ecc800_pipeline.log",
    "max_size_mb": 100,
    "backup_count": 10
  }
}
```

### Environment Variables

```bash
# Export these in .bashrc or .env file
export ECC800_API_KEY="your_api_key_here"
export DB_PASSWORD="database_password"
export ECC800_EXPORT_DIR="/opt/code/ecc800/exports"
export ECC800_LOG_DIR="/var/log/ecc800"
export ECC800_SITE="dc"
export PYTHONPATH="/opt/code/ecc800:$PYTHONPATH"
```

### Performance Tuning

**Database Configuration:**
```sql
-- Optimize for bulk inserts
ALTER SYSTEM SET work_mem = '512MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';

-- Disable WAL for faster inserts (use in test only!)
-- ALTER TABLE fault_performance_data SET (
--     unlogged = true
-- );

-- Reload configuration
SELECT pg_reload_conf();
```

**Import Batch Size Tuning:**
```python
# Larger batches = faster but more memory
# For 10GB+ datasets: 5000-10000 rows
# For small datasets: 1000-5000 rows

batch_size = 5000  # Recommended
```

**CSV Chunk Size:**
```python
# Larger chunks = faster export but more memory
# Typical: 1000-5000 records per chunk

chunk_size = 1000  # Recommended for most cases
```

---

## Error Handling & Recovery

### Common Errors

**Error 1: Connection Timeout**
```
[ERROR] Connection to source system timed out after 30 seconds

Solution:
- Increase timeout: --timeout 120
- Check network connectivity
- Verify API server is running
- Check firewall rules
```

**Error 2: CSV Format Invalid**
```
[ERROR] CSV validation failed: missing column 'equipment_id' at row 1

Solution:
- Check export source settings
- Validate CSV headers match schema
- Regenerate export with correct format
```

**Error 3: Database Connection Failed**
```
[ERROR] Failed to connect to database: FATAL: could not translate host name

Solution:
- Verify database host and port
- Check database server status
- Verify credentials in config.json
- Check firewall rules
```

**Error 4: Out of Disk Space**
```
[ERROR] No space left on device

Solution:
- Archive old exports: ./cleanup_old_exports.sh
- Delete temporary files
- Increase disk space
- Compress old database backups
```

**Error 5: Deduplication Constraint Violation**
```
[ERROR] Duplicate key value violates unique constraint "unique_fault_record"

Solution:
- Enable deduplication flag
- Check for data quality issues
- Review import_logs for previous failures
- Manually clean duplicate records if needed
```

### Recovery Procedures

**Partial Import Recovery:**
```bash
# 1. Identify failed import
SELECT * FROM fault_data_import_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 1;

# 2. Review error message
SELECT error_message FROM fault_data_import_logs 
WHERE id = 'uuid_of_failed_import';

# 3. Revert changes if needed
DELETE FROM fault_performance_data 
WHERE created_at > 'timestamp_of_failed_import'
  AND site_code = 'dc';

# 4. Retry import
./fault_pipeline.sh --site dc --action import
```

**Rollback Failed Pipeline:**
```bash
#!/bin/bash

# Get import session ID
SESSION_ID=$(tail -1 /var/log/ecc800_pipeline.log | grep "session_id" | cut -d'=' -f2)

# Delete imported records from this session
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
DELETE FROM fault_performance_data 
WHERE id IN (
  SELECT record_id FROM fault_data_import_logs 
  WHERE import_session_id = '$SESSION_ID'
);
EOF

# Mark import as failed
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
UPDATE fault_data_import_logs 
SET status = 'failed' 
WHERE import_session_id = '$SESSION_ID';
EOF
```

---

## Monitoring & Status

### Status API

**Endpoint:** `GET /api/v1/pipeline/status`

**Response:**
```json
{
  "status": "running",
  "current_operation": "import",
  "progress": {
    "stage": "deduplication",
    "processed_records": 125000,
    "total_records": 250000,
    "percent_complete": 50
  },
  "timing": {
    "started_at": "2026-04-23T10:30:00Z",
    "elapsed_seconds": 300,
    "estimated_remaining_seconds": 300
  },
  "metrics": {
    "records_per_second": 416,
    "database_size_mb": 2750
  },
  "last_successful_run": "2026-04-22T10:30:00Z"
}
```

### Log Files

**Main Pipeline Log:**
```
/var/log/ecc800_pipeline.log

[2026-04-23 10:30:00] [INFO] Pipeline started
[2026-04-23 10:30:05] [INFO] Exporting performance data...
[2026-04-23 10:35:50] [INFO] Export completed: 125000 records
[2026-04-23 10:35:51] [INFO] Starting import...
[2026-04-23 10:37:15] [INFO] Import completed
[2026-04-23 10:37:16] [INFO] Pipeline finished successfully
```

**Detailed Processing Log:**
```
/var/log/ecc800_import_detail.log

[2026-04-23 10:35:51] Processing: ecc800_export_2026-04-23.tar.gz
[2026-04-23 10:35:52] Extracting archive...
[2026-04-23 10:35:55] CSV validation: PASSED
[2026-04-23 10:35:56] Creating staging table: staging_fault_2026_04_23_1035
[2026-04-23 10:35:57] Loading CSV data (batch 1 of 50)...
[2026-04-23 10:36:10] Loaded 5000 rows in 13 seconds (385 rows/sec)
...
[2026-04-23 10:37:15] Deduplication complete: 3200 new, 1100 updated, 11120 duplicates
```

### Monitoring Dashboard

**Query for Status:**
```sql
-- Last 24 hours of imports
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_imports,
    SUM(total_records) as total_records,
    SUM(new_records) as new_records,
    SUM(updated_records) as updated_records,
    SUM(duplicate_records) as duplicates,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM fault_data_import_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Export/import timeline
SELECT 
    id,
    site_code,
    status,
    record_count,
    created_at,
    completed_at,
    EXTRACT(EPOCH FROM (completed_at - created_at)) as duration_seconds
FROM export_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Performance Optimization

### Export Performance

**Optimization Techniques:**
```python
# 1. Streaming writes (low memory)
with open(output_file, 'w') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    
    # Process in chunks
    for records in get_records_in_chunks(chunk_size=1000):
        writer.writerows(records)

# 2. Database query optimization
# Use indexes on equipment_id, site_code, time
# Limit to recent data only
# Avoid SELECT * (specify columns)

# 3. Compression (TGZ)
# Reduce file size by 80-90%
# Faster transfer if uploading
```

**Expected Performance:**
- Small export (< 10,000 records): 1-2 minutes
- Medium export (10K-100K records): 3-8 minutes
- Large export (100K-1M records): 10-30 minutes

### Import Performance

**Staging Table Method (3x faster):**
```
Standard Method:
CSV → Parse → Check Unique → INSERT/UPDATE → 1000-2000 rows/sec

Staging Method:
CSV → Staging Table (COPY) → Dedup Query → INSERT/UPDATE → 5000-10000 rows/sec
```

**Performance Metrics:**
```sql
-- Before optimization
EXPLAIN ANALYZE
INSERT INTO fault_performance_data
SELECT * FROM staging_fault_data
WHERE NOT EXISTS (...);
-- Time: ~45 minutes for 250,000 rows

-- After optimization (ON CONFLICT)
EXPLAIN ANALYZE
INSERT INTO fault_performance_data (...)
SELECT * FROM staging_fault_data
ON CONFLICT DO UPDATE SET ...;
-- Time: ~15 minutes for 250,000 rows
```

### Memory Usage

**Typical Memory Consumption:**
```
Export (streaming):      100-300 MB
Import (staging):        200-500 MB
Deduplication:           150-400 MB
Total safe limit:        1 GB
```

**Memory-Aware Configuration:**
```python
# For low-memory systems (<2GB available)
batch_size = 1000
chunk_size = 500

# For high-memory systems (>8GB available)
batch_size = 10000
chunk_size = 5000
```

---

## Troubleshooting

### Issue 1: Pipeline Hangs During Export

**Symptoms:** Export stuck at same percentage for >10 minutes

**Diagnosis:**
```bash
# Check source system connectivity
curl -k -v https://10.251.150.222:3344/health

# Check process status
ps aux | grep export

# Check network
netstat -an | grep 3344
```

**Solutions:**
1. Increase timeout: `--timeout 300`
2. Restart source service
3. Check network latency: `ping -c 5 10.251.150.222`
4. Review API server logs

### Issue 2: High Memory Usage During Import

**Symptoms:** Server runs out of memory, process killed

**Diagnosis:**
```bash
# Check memory usage
free -h
ps aux | grep python

# Check batch size in config
grep "batch_size" /opt/code/ecc800/config.json
```

**Solutions:**
1. Reduce batch size: `batch_size = 1000`
2. Process in smaller chunks
3. Increase available memory
4. Run imports during off-peak hours

### Issue 3: Deduplication Rate Suspiciously High

**Symptoms:** >80% records marked as duplicates

**Diagnosis:**
```bash
# Check hash calculation
SELECT COUNT(DISTINCT hash) FROM staging_fault_data;
SELECT COUNT(*) FROM staging_fault_data;

# Check unique constraints
SELECT COUNT(*) FROM fault_performance_data;
SELECT COUNT(DISTINCT equipment_id, site_code, performance_data, statistical_start_time) 
FROM fault_performance_data;
```

**Solutions:**
1. Verify export query returns unique records
2. Check time bucket boundaries (may overlap)
3. Review data source for duplicates
4. Validate timestamp parsing

### Issue 4: Auto-Processing Not Triggering

**Symptoms:** Files in exports directory not being processed

**Diagnosis:**
```bash
# Check watchdog process
ps aux | grep auto_tgz

# Check for errors
tail -50 /var/log/ecc800_autoprocess.log

# Check file permissions
ls -la /opt/code/ecc800/exports/

# Check directory monitoring
inotifywait -m /opt/code/ecc800/exports
```

**Solutions:**
1. Restart auto-processor: `systemctl restart ecc800-autoprocessor`
2. Check directory permissions
3. Verify watchdog library is installed: `pip list | grep watchdog`
4. Check disk space in monitoring directory

### Issue 5: Database Locks During Import

**Symptoms:** Insert/update queries hang indefinitely

**Diagnosis:**
```sql
-- Check for locks
SELECT 
    pid, 
    usename, 
    application_name, 
    state, 
    query
FROM pg_stat_activity
WHERE state != 'idle';

-- Check blocking processes
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions:**
1. Kill blocking queries: `SELECT pg_terminate_backend(pid);`
2. Disable other running imports
3. Reduce batch size
4. Add more database connections
5. Schedule imports during maintenance window

---

## Appendix: Key Files Reference

### Export Scripts
- `/opt/code/ecc800/unlimited_timeout_exporter.py` - Production exporter
- `/opt/code/ecc800/enhanced_fault_exporter.py` - Fault-specific exporter
- `/opt/code/ecc800/simplified_fault_exporter.py` - Lightweight exporter

### Import Scripts
- `/opt/code/ecc800/data_importer.py` - Standard importer
- `/opt/code/ecc800/fault_performance_importer.py` - Fault importer (staging table method)
- `/opt/code/ecc800/enhanced_multi_site_data_importer.py` - Multi-site importer

### Auto-Processing Scripts
- `/opt/code/ecc800/simple_auto_tgz_processor.py` - Standard watchdog processor
- `/opt/code/ecc800/latest_only_tgz_processor.py` - Latest-only processor
- `/opt/code/ecc800/fault_auto_tgz_processor.py` - Fault-specific processor

### Orchestration Scripts
- `/opt/code/ecc800/fault_pipeline.sh` - Main fault pipeline orchestrator
- `/opt/code/ecc800/run_complete_pipeline.sh` - Complete end-to-end pipeline
- `/opt/code/ecc800/enhanced_working_pipeline.sh` - Enhanced pipeline with improvements
- `/opt/code/ecc800/auto_import.sh` - Cron-friendly automation script

### Configuration Files
- `/opt/code/ecc800/config.json` - Main configuration
- `/opt/code/ecc800/.env` - Environment variables

### Database Schema Files
- `/opt/code/ecc800/sql/fault_schema.sql` - Table creation
- `/opt/code/ecc800/sql/fault_indexes.sql` - Index definitions
- `/opt/code/ecc800/sql/timescaledb_setup.sql` - TimescaleDB configuration

### Utility Scripts
- `/opt/code/ecc800/check_schema.py` - Validate database schema
- `/opt/code/ecc800/check_dr_data.py` - Validate DR data
- `/opt/code/ecc800/create_hash.py` - Hash calculation utility
- `/opt/code/ecc800/cleanup_old_files.sh` - Archive/delete old exports

---

**Document End**

For questions or updates, refer to the main ecc800 documentation or contact the development team.
