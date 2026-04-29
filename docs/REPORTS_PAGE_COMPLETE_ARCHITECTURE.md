# Reports Page Complete Architecture

**Document Version:** 1.0  
**Last Updated:** April 22, 2026  
**Status:** Production Ready  
**URL:** `https://10.251.150.222:3344/ecc800/reports`

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API Architecture](#backend-api-architecture)
4. [Report Types Reference](#report-types-reference)
5. [Database Schema](#database-schema)
6. [Data Flow](#data-flow)
7. [Feature Details](#feature-details)
8. [Component Hierarchy](#component-hierarchy)
9. [API Endpoint Reference](#api-endpoint-reference)
10. [Query Examples](#query-examples)
11. [Performance Considerations](#performance-considerations)
12. [Security Architecture](#security-architecture)
13. [Integration Points](#integration-points)
14. [Troubleshooting](#troubleshooting)

---

## Overview

The **Reports Page** is a comprehensive reporting and analytics platform that provides:
- **Multiple report types** - Executive summaries, power analytics, cooling systems, equipment status
- **Real-time data generation** - Dynamic queries with configurable time ranges
- **Interactive visualization** - Charts, tables, gauges, and composed visualizations
- **Export capability** - PDF, Excel, and CSV formats
- **Role-based access** - Analyst and admin level access control
- **Multi-site support** - DC and DR site filtering
- **Time-series analysis** - Hourly and daily bucketing

### Key Statistics
- **Primary Component:** `ReportsPage.tsx` (React)
- **Backend Router:** `reports.py` (FastAPI) with 30+ endpoints (~3700 lines)
- **Database Table:** `performance_data` (TimescaleDB hypertable)
- **Report Types:** 8+ major report categories
- **Export Formats:** PDF, Excel, CSV
- **Access Level:** Analyst+ role required

---

## Frontend Architecture

### Primary Component: ReportsPage.tsx

**Location:** `/ecc800/frontend/src/pages/ReportsPage.tsx`

**Technology Stack:**
```
React 18.x
├── TypeScript
├── Material-UI (MUI)
├── Recharts (Data Visualization)
├── Framer Motion (Animations)
├── Date-fns (Date Utilities)
├── TanStack Query (React Query)
└── Axios (HTTP Client)
```

### Report Pages & Components

```
Reports System
├── ReportLanding.tsx
│   ├── Report Type Cards
│   ├── Executive Summary (featured)
│   ├── Power & Energy
│   ├── Cooling & Environment
│   ├── UPS Status
│   ├── Equipment Inventory
│   ├── System Summary
│   └── Data Quality Reports
├── ReportsLayout.tsx
│   ├── Sidebar Navigation
│   ├── Report Type Selection
│   └── Filter Panel
├── PowerReport.tsx
│   ├── PUE Trend Chart
│   ├── Power Consumption Table
│   ├── Daily Summary
│   └── Export Button
├── CoolingReport.tsx
│   ├── Temperature Trends
│   ├── Humidity Levels
│   ├── Hot Spot Alerts
│   └── Equipment Status
├── ExecutiveDashboard.tsx
│   ├── Health Score Card
│   ├── PUE Gauge
│   ├── Power Summary
│   ├── Issue List
│   └── Key Metrics
└── UPSReport.tsx
    ├── Battery Capacity
    ├── Input Power Status
    ├── Load Ratio
    └── Historical Trends
```

### Design System

**Theme:**
- Glass morphism design
- Material Design 3 color scheme
- Thai locale support via date-fns
- Responsive grid layout

**Color Scheme:**
```css
/* Primary */
.status-healthy { background-color: #4caf50; } /* Green */
.status-warning { background-color: #ff9800; } /* Orange */
.status-critical { background-color: #f44336; } /* Red */

/* Charts */
.chart-primary { color: #2196f3; }    /* Blue */
.chart-secondary { color: #ff9800; }  /* Orange */
.chart-tertiary { color: #4caf50; }   /* Green */
```

### State Management

```typescript
// Report Filters
const [filters, setFilters] = useState({
  report_type: 'executive',
  site_code: 'DC',
  days: 7,
  equipment_id: '',
  metric_pattern: ''
});

// Report Data
const [reportData, setReportData] = useState({
  summary: null,
  details: [],
  charts: [],
  tables: []
});

// UI State
const [loading, setLoading] = useState(false);
const [selectedReport, setSelectedReport] = useState('executive');
const [exportFormat, setExportFormat] = useState('pdf');
```

### Key UI Components

#### 1. **Report Landing Page**
- Grid of report type cards
- Quick access to major reports
- Featured "Executive Dashboard"
- Recent reports history

#### 2. **Report Filters**
```
┌─────────────────────────┐
│ Filter Panel            │
├─────────────────────────┤
│ [Site: DC ▼]            │
│ [Time Range: 7 days ▼]  │
│ [Equipment: ________]   │
│ [Metrics: Pattern]      │
│ [Refresh] [Export ▼]    │
└─────────────────────────┘
```

#### 3. **Visualization Types**
- **Line Charts:** PUE trends, power consumption over time
- **Bar Charts:** Daily summaries, equipment rankings
- **Area Charts:** Temperature/humidity ranges with confidence bands
- **Composed Charts:** Multi-axis with temperature + humidity
- **Pie Charts:** Metric distribution, health score breakdown
- **Tables:** Equipment status, UPS metrics, data quality
- **Gauges:** Animated circular progress for KPIs
- **Hot Spot Alerts:** Cards for equipment >30°C

#### 4. **Export Controls**
```
┌──────────────────────────┐
│ Export Report            │
├──────────────────────────┤
│ ☉ PDF  ○ Excel  ○ CSV   │
│                          │
│ [Include Charts]         │
│ [Include Summary]        │
│ [Download]               │
└──────────────────────────┘
```

---

## Backend API Architecture

### FastAPI Router: reports.py

**Location:** `/ecc800/backend/app/api/routes/reports.py`

**Framework:**
```
FastAPI 0.100+
├── Async endpoints
├── SQLAlchemy ORM (async)
├── PostgreSQL/TimescaleDB
├── Pydantic validation
└── JWT authentication
```

### Report Generation Flow

```python
@router.get("/api/v1/{report_type}")
async def get_report(
    report_type: str,
    site_code: str = Query("DC"),
    days: int = Query(7, ge=1, le=30),
    equipment_id: str = Query(None),
    current_user = Depends(get_analyst_or_admin_user)
) -> ReportResponse:
    """Generate report based on type and filters"""
    
    # 1. Validate parameters
    if report_type not in VALID_REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # 2. Build time filters
    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)
    
    # 3. Query database
    results = await get_report_data(
        report_type=report_type,
        site_code=site_code,
        start_time=start_time,
        end_time=end_time,
        equipment_id=equipment_id
    )
    
    # 4. Process and aggregate results
    processed = aggregate_report_data(results, report_type)
    
    # 5. Return formatted response
    return ReportResponse(
        report_type=report_type,
        generated_at=datetime.now(),
        filters={"site": site_code, "days": days},
        data=processed
    )
```

### Report Categories

#### 1. **Executive Reports**

```python
@router.get("/api/v1/executive")
async def get_executive_report(site_code: str = "DC"):
    """
    Executive summary with KPIs
    
    Returns:
    - Health score (0-100)
    - Power consumption summary
    - PUE trend
    - Equipment count
    - Active faults/issues
    - Last updated timestamp
    """
```

**Response:**
```json
{
  "health_score": 85,
  "pue": 1.65,
  "total_power_kw": 245.3,
  "equipment_count": 120,
  "active_issues": 12,
  "last_updated": "2026-04-22T10:35:00Z"
}
```

#### 2. **Power & Energy Reports**

```python
@router.get("/api/v1/reports/power")
async def get_power_report(
    site_code: str = "DC",
    days: int = 7
):
    """
    Power consumption trends and analysis
    
    Returns:
    - Daily power consumption (kWh)
    - Peak demand
    - UPS status
    - Power quality metrics
    """
```

**Response:**
```json
{
  "daily_consumption": [
    {"date": "2026-04-15", "consumption_kwh": 5840},
    {"date": "2026-04-16", "consumption_kwh": 6120}
  ],
  "peak_demand_kw": 320,
  "average_consumption_kwh": 5950,
  "ups_status": "healthy",
  "battery_capacity_percent": 98
}
```

#### 3. **Cooling & Environment Reports**

```python
@router.get("/api/v1/reports/cooling")
async def get_cooling_report(
    site_code: str = "DC",
    days: int = 7
):
    """
    Temperature and humidity trends
    
    Returns:
    - Average/min/max temperatures
    - Humidity levels
    - Hot spot locations (>30°C)
    - Environmental alerts
    """
```

**Response:**
```json
{
  "temperature": {
    "average": 24.5,
    "min": 18.2,
    "max": 31.8,
    "unit": "°C"
  },
  "humidity": {
    "average": 45.0,
    "min": 38.5,
    "max": 58.2,
    "unit": "%"
  },
  "hot_spots": [
    {
      "equipment_id": "Aisle-T/H Sensor4",
      "temperature": 32.1,
      "severity": "warning"
    }
  ]
}
```

#### 4. **UPS Reports**

```python
@router.get("/api/v1/reports/ups")
async def get_ups_report(site_code: str = "DC"):
    """
    UPS battery and power status
    
    Returns:
    - Battery capacity percentage
    - Input/output voltage
    - Load ratio percentage
    - Historical trends
    """
```

**Response:**
```json
{
  "ups_units": [
    {
      "id": "0x300001",
      "status": "online",
      "battery_capacity": 96,
      "input_voltage": 230,
      "output_voltage": 229,
      "load_ratio": 45
    }
  ]
}
```

#### 5. **Equipment/Cabinet Reports**

```python
@router.get("/api/v1/reports/cabinets")
async def get_cabinet_report(site_code: str = "DC"):
    """
    Equipment and cabinet metrics
    
    Returns:
    - Per-cabinet temperature and humidity
    - Power consumption by cabinet
    - Equipment inventory
    - Utilization metrics
    """
```

#### 6. **System Summary Reports**

```python
@router.get("/api/v1/reports/summary")
async def get_system_summary():
    """
    Overall system statistics
    
    Returns:
    - Total equipment count
    - Total metric count
    - Data time ranges
    - Sites inventory
    """
```

#### 7. **Data Quality Reports**

```python
@router.get("/api/v1/reports/data-quality")
async def get_data_quality_report():
    """
    Data completeness and quality metrics
    
    Returns:
    - Completeness percentage
    - Null value counts
    - Data gaps
    - Last update timestamps
    """
```

#### 8. **Time-Series Reports**

```python
@router.get("/api/v1/reports/temperature-series")
async def get_temperature_series(
    site_code: str = "DC",
    days: int = 7,
    bucket_interval: str = "1h"
):
    """
    Time-bucketed temperature data
    
    Bucket intervals: 5m, 15m, 30m, 1h, 6h, 24h
    """
```

---

## Report Types Reference

### Comprehensive Report Types Matrix

| Report | Endpoint | Method | Auth | Time Range | Export |
|--------|----------|--------|------|-----------|--------|
| Executive Summary | `/api/v1/executive` | GET | Analyst+ | N/A | PDF |
| Power Report | `/api/v1/reports/power` | GET | Analyst+ | 7d | PDF/Excel |
| PUE Trends | `/api/v1/reports/pue` | GET | Analyst+ | 30d | PDF |
| Power System | `/api/v1/reports/power-system` | GET | Analyst+ | 7d | PDF |
| Power per Equipment | `/api/v1/reports/power-per-equipment` | GET | Analyst+ | 7d | Excel |
| Cooling Report | `/api/v1/reports/cooling` | GET | Analyst+ | 7d | PDF/Excel |
| Room Environment | `/api/v1/reports/room-environment` | GET | Analyst+ | 7d | PDF |
| Cooling Full | `/api/v1/reports/cooling-full` | GET | Analyst+ | 30d | PDF |
| UPS Report | `/api/v1/reports/ups` | GET | Analyst+ | 7d | PDF/Excel |
| UPS Full | `/api/v1/reports/ups-full` | GET | Analyst+ | 30d | PDF |
| Cabinets | `/api/v1/reports/cabinets` | GET | Analyst+ | 7d | Excel |
| Cabinet Details | `/api/v1/reports/cabinet/{id}` | GET | Analyst+ | 7d | PDF |
| Cabinets Data | `/api/v1/reports/cabinets-data` | GET | Analyst+ | 7d | Excel |
| System Summary | `/api/v1/reports/summary` | GET | User | N/A | PDF |
| Daily Summary | `/api/v1/reports/daily-summary` | GET | Analyst+ | 30d | Excel |
| Data Quality | `/api/v1/reports/data-quality` | GET | Admin | N/A | PDF |
| Temperature Series | `/api/v1/reports/temperature-series` | GET | Analyst+ | 30d | CSV |
| Humidity Series | `/api/v1/reports/humidity` | GET | Analyst+ | 30d | CSV |
| Metric Popularity | `/api/v1/reports/metric-popularity-series` | GET | Analyst+ | 7d | CSV |

---

## Database Schema

### Primary Table: performance_data

**Type:** TimescaleDB Hypertable (time-series optimized)

**Schema:**
```sql
CREATE TABLE performance_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_code VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(255) NOT NULL,
    performance_data VARCHAR(100) NOT NULL,
    statistical_start_time TIMESTAMP NOT NULL,
    statistical_end_time TIMESTAMP,
    value_numeric DOUBLE PRECISION,
    value_text VARCHAR(255),
    unit VARCHAR(20),
    data_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- TimescaleDB time column (required)
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('performance_data', 'time', if_not_exists => TRUE);

-- Compression for older data
ALTER TABLE performance_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'site_code,equipment_id,performance_data'
);

-- Indexes for query optimization
CREATE INDEX idx_perf_site_time ON performance_data (site_code, time DESC);
CREATE INDEX idx_perf_equipment_time ON performance_data (equipment_id, time DESC);
CREATE INDEX idx_perf_metric_time ON performance_data (performance_data, time DESC);
CREATE INDEX idx_perf_combined ON performance_data (site_code, equipment_id, time DESC);
```

**Key Metric Patterns Queried:**

```sql
-- PUE Metrics
WHERE performance_data LIKE '%PUE%'

-- Power Metrics
WHERE performance_data LIKE '%Active Power%'
   OR performance_data LIKE '%Total Input Power%'
   OR performance_data LIKE '%Power Consumption%'

-- Environmental Metrics
WHERE performance_data LIKE '%temperature%' (case insensitive)
   OR performance_data LIKE '%humidity%'

-- UPS Metrics
WHERE equipment_id LIKE '%UPS%'
   OR equipment_id LIKE '0x3%'
   OR performance_data LIKE '%battery%'

-- Communication Status
WHERE performance_data = 'Communications status'
```

**Column Descriptions:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `site_code` | VARCHAR(50) | Site code (DC, DR) |
| `equipment_id` | VARCHAR(255) | Equipment identifier |
| `performance_data` | VARCHAR(100) | Metric name |
| `statistical_start_time` | TIMESTAMP | Measurement start |
| `statistical_end_time` | TIMESTAMP | Measurement end |
| `value_numeric` | DOUBLE | Numeric value |
| `value_text` | VARCHAR(255) | Text representation |
| `unit` | VARCHAR(20) | Unit (°C, %, kW, V, A) |
| `time` | TIMESTAMP | TimescaleDB time column |

---

## Data Flow

### Report Generation Flow

```
┌──────────────────────────────────────┐
│ User Selects Report Type             │
│ (Executive, Power, Cooling, etc.)    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Set Filters                          │
│ - Site (DC/DR)                       │
│ - Time Range (1-30 days)             │
│ - Equipment (optional)               │
│ - Metric Pattern (optional)          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ HTTP GET Request to Backend          │
│ /api/v1/reports/{report_type}?...    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ FastAPI Endpoint Handler             │
│ - Validate parameters                │
│ - Check user permissions             │
│ - Set time boundaries                │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Build SQL Query (TimescaleDB)        │
│ - Apply WHERE filters                │
│ - Use time_bucket() for aggregation  │
│ - Calculate aggregates (min/avg/max) │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Execute Query on Database            │
│ - Return raw aggregated data         │
│ - Apply hypertable compression       │
│ - Retrieve from indexes              │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Process Results in Backend           │
│ - Calculate derived metrics (PUE)    │
│ - Identify hot spots                 │
│ - Format for chart display           │
│ - Create summary statistics          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Return JSON Response                 │
│ - Charts data                        │
│ - Tables data                        │
│ - Summary metrics                    │
│ - Timestamps                         │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Frontend Rendering                   │
│ - Parse JSON response                │
│ - Render charts with Recharts        │
│ - Display tables                     │
│ - Update UI state                    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Display to User                      │
│ - Interactive charts                 │
│ - Filterable tables                  │
│ - Export options                     │
│ - Last updated timestamp             │
└──────────────────────────────────────┘
```

### Export Flow

```
User Click "Export"
    ↓
Select Format (PDF/Excel/CSV)
    ↓
POST /api/v1/reports/export/{type}
    ↓
Backend:
  - Retrieve report data (or re-query)
  - Format to export format
  - Generate file (reportlab/openpyxl)
    ↓
Return Binary File
    ↓
Browser Downloads File
    ↓
User Opens Downloaded Report
```

---

## Feature Details

### 1. Report Filters

**Filter Hierarchy:**

```
Report Type Selection
    ↓
Site Selection (DC, DR, All)
    ↓
Time Range Selection
    ├─ Presets: 1h, 6h, 12h, 24h, 3d, 7d, 30d
    └─ Custom: Start/End datetime pickers
    ↓
Optional Filters
    ├─ Equipment ID
    ├─ Metric Pattern
    └─ Aggregation Level
```

**Time Range Options:**

| Preset | Duration | Use Case |
|--------|----------|----------|
| 1h | Last 1 hour | Real-time status |
| 6h | Last 6 hours | Shift analysis |
| 12h | Last 12 hours | Daily pattern |
| 24h | Last 24 hours | Daily trend |
| 3d | Last 3 days | Weekly pattern (start) |
| 7d | Last 7 days | Weekly trend |
| 30d | Last 30 days | Monthly trend |
| Custom | User-defined | Ad-hoc analysis |

### 2. Key Metrics Calculation

**PUE (Power Usage Effectiveness):**
```python
PUE = Total Power Consumption / IT Power Consumption
    = (Active Power + Cooling Power + Other) / IT Power
    
# Optimal: 1.0-1.5 (lower is better)
# Good: 1.5-2.0
# Fair: 2.0-3.0
```

**Health Score:**
```python
def calculate_health_score():
    """
    Weighted combination of:
    - Equipment availability (30%)
    - Temperature within range (30%)
    - Power quality (20%)
    - Humidity levels (20%)
    
    Returns: 0-100 score
    """
```

**Hot Spot Detection:**
```python
def find_hot_spots():
    """
    Equipment with temperature > 30°C
    Returns: List with severity levels
    - Critical: >35°C
    - Warning: 30-35°C
    - Normal: <30°C
    """
```

### 3. Visualization Types

#### Line Charts (Trends)
```
Used for: PUE trends, power consumption over time
Example: Daily power consumption chart
- X-axis: Time (hourly/daily)
- Y-axis: kWh or other metric
- Multiple lines: Compare multiple equipment
```

#### Area Charts (Ranges)
```
Used for: Temperature/humidity trends with ranges
Example: Temperature range with confidence bands
- Upper line: Max temperature
- Middle area: Average
- Lower line: Min temperature
- Helps visualize variability
```

#### Composed Charts (Multi-axis)
```
Used for: Related metrics with different scales
Example: Temperature + Humidity
- Left Y-axis: Temperature (°C)
- Right Y-axis: Humidity (%)
- Enables comparison of related metrics
```

#### Tables (Detailed Data)
```
Used for: Equipment status, UPS metrics, detailed values
Features:
- Sortable columns
- Filterable rows
- Paginated display
- Export to CSV/Excel
```

#### Gauges (KPI Summary)
```
Used for: Single metric display (Health Score, PUE)
Features:
- Animated circular progress
- Color-coded zones (good/warning/critical)
- Numerical display
```

### 4. Export Functionality

**Supported Formats:**
- **PDF:** Charts, tables, summary, branding
- **Excel:** Multiple sheets, formatted tables, formulas
- **CSV:** Raw data, importable to other tools

**Export Parameters:**
```python
@router.post("/api/v1/reports/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = Query("pdf", regex="^(pdf|excel|csv)$"),
    site_code: str = "DC",
    days: int = 7,
    include_summary: bool = True,
    include_charts: bool = True
):
    """Generate downloadable report file"""
```

**Export Response:**
```
Content-Type: application/pdf|application/vnd.ms-excel|text/csv
Content-Disposition: attachment; filename="report_2026-04-22.pdf"
```

---

## Component Hierarchy

### Frontend Component Tree

```
ReportsPage (Page Container)
├── ReportHeader
│   ├── Title
│   ├── BreadcrumbNav
│   └── LastUpdated
├── ReportsLayout
│   ├── SidebarNav
│   │   ├── ReportCategories
│   │   │   ├── Executive
│   │   │   ├── Power & Energy
│   │   │   ├── Cooling
│   │   │   ├── UPS
│   │   │   ├── Equipment
│   │   │   ├── System
│   │   │   └── Data Quality
│   │   └── QuickLinks
│   └── MainContent
│       ├── FilterPanel
│       │   ├── SiteSelector
│       │   │   └── Dropdown (DC, DR, All)
│       │   ├── TimeRangeSelector
│       │   │   ├── PresetButtons
│       │   │   └── CustomDateRange
│       │   ├── EquipmentFilter
│       │   │   └── TextInput
│       │   ├── MetricFilter
│       │   │   └── TextInput
│       │   └── ActionButtons
│       │       ├── RefreshButton
│       │       └── ExportDropdown
│       ├── ReportContent
│       │   ├── ExecutiveDashboard
│       │   │   ├── HealthScoreGauge
│       │   │   ├── PUECard
│       │   │   ├── PowerSummary
│       │   │   ├── IssuesList
│       │   │   └── KPICards
│       │   ├── PowerReport
│       │   │   ├── PUETrendChart
│       │   │   ├── PowerConsumptionChart
│       │   │   ├── DailySummaryTable
│       │   │   └── UPSStatusCard
│       │   ├── CoolingReport
│       │   │   ├── TemperatureTrendChart
│       │   │   ├── HumidityChart
│       │   │   ├── HotSpotAlerts
│       │   │   └── EnvironmentTable
│       │   ├── UPSReport
│       │   │   ├── BatteryGauge
│       │   │   ├── VoltageCard
│       │   │   ├── LoadRatioChart
│       │   │   └── UPSStatusTable
│       │   ├── EquipmentReport
│       │   │   ├── CabinetMetricsTable
│       │   │   ├── UtilizationChart
│       │   │   └── DrillDownDetails
│       │   └── DataQualityReport
│       │       ├── CompletenessChart
│       │       ├── QualityMetricsTable
│       │       └── DataGapsAlert
│       ├── LoadingState
│       │   └── SkeletonCards
│       ├── ErrorState
│       │   ├── ErrorIcon
│       │   ├── ErrorMessage
│       │   └── RetryButton
│       └── NoDataState
│           └── EmptyMessage
└── ExportDialog
    ├── FormatSelector
    ├── OptionsCheckboxes
    └── DownloadButton
```

---

## API Endpoint Reference

### Executive Report Endpoint

**GET `/api/v1/executive`**

**Parameters:**
```python
site_code: str = Query("DC", regex="^(DC|DR|All)$")
```

**Response:**
```json
{
  "report_type": "executive",
  "generated_at": "2026-04-22T10:35:00Z",
  "data": {
    "health_score": 85,
    "health_score_trend": "stable",
    "pue": {
      "value": 1.65,
      "trend": "improving",
      "target": 1.5
    },
    "power_summary": {
      "total_consumption_kw": 245.3,
      "peak_kw": 320,
      "average_kw": 210
    },
    "equipment_count": 120,
    "active_issues": [
      {
        "id": "issue_001",
        "severity": "warning",
        "description": "Temperature above threshold in Aisle 4",
        "equipment_id": "Aisle-T/H Sensor4"
      }
    ]
  }
}
```

### Power Report Endpoint

**GET `/api/v1/reports/power`**

**Parameters:**
```python
site_code: str = Query("DC")
days: int = Query(7, ge=1, le=30)
```

**Response:**
```json
{
  "report_type": "power",
  "generated_at": "2026-04-22T10:35:00Z",
  "filters": {
    "site": "DC",
    "days": 7
  },
  "data": {
    "daily_trend": [
      {
        "date": "2026-04-15",
        "consumption_kwh": 5840,
        "peak_kw": 310,
        "average_kw": 243
      }
    ],
    "summary": {
      "total_consumption_kwh": 41230,
      "average_daily_kwh": 5890,
      "peak_demand_kw": 320,
      "pue": 1.65
    },
    "ups_status": {
      "units": [
        {
          "id": "UPS-001",
          "status": "online",
          "battery_capacity": 96,
          "load_ratio": 45
        }
      ]
    }
  }
}
```

### Cooling Report Endpoint

**GET `/api/v1/reports/cooling`**

**Parameters:**
```python
site_code: str = Query("DC")
days: int = Query(7, ge=1, le=30)
```

**Response:**
```json
{
  "report_type": "cooling",
  "generated_at": "2026-04-22T10:35:00Z",
  "data": {
    "temperature": {
      "current": 24.5,
      "average": 24.2,
      "min": 18.2,
      "max": 31.8,
      "unit": "°C"
    },
    "humidity": {
      "current": 45.0,
      "average": 45.5,
      "min": 38.5,
      "max": 58.2,
      "unit": "%"
    },
    "hot_spots": [
      {
        "equipment_id": "Aisle-T/H Sensor Group-T/H Sensor4",
        "temperature": 32.1,
        "humidity": 52.0,
        "severity": "warning",
        "location": "Aisle 4"
      }
    ],
    "trend_data": [
      {
        "timestamp": "2026-04-22T10:00:00Z",
        "temperature": 24.5,
        "humidity": 45.0
      }
    ]
  }
}
```

### Equipment Report Endpoint

**GET `/api/v1/reports/cabinets`**

**Parameters:**
```python
site_code: str = Query("DC")
days: int = Query(7, ge=1, le=30)
equipment_id: str = Query(None)
```

**Response:**
```json
{
  "report_type": "equipment",
  "generated_at": "2026-04-22T10:35:00Z",
  "data": {
    "equipment": [
      {
        "id": "Cabinet-A1",
        "location": "Row 1, Aisle 1",
        "temperature": 24.5,
        "humidity": 45.0,
        "power_consumption_kw": 8.5,
        "status": "operational"
      }
    ],
    "summary": {
      "total_equipment": 120,
      "operational": 118,
      "warning": 2,
      "critical": 0
    }
  }
}
```

### Export Endpoint

**POST `/api/v1/reports/export/{report_type}`**

**Parameters:**
```python
report_type: str
format: str = Query("pdf", regex="^(pdf|excel|csv)$")
site_code: str = "DC"
days: int = 7
include_summary: bool = True
include_charts: bool = True
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="executive_report_2026-04-22.pdf"

[Binary PDF Content]
```

---

## Query Examples

### Example 1: Get Executive Summary

```bash
curl -X GET "https://10.251.150.222:3344/api/v1/executive" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 2: Get 7-Day Power Consumption Report

```python
import requests

token = "your_jwt_token"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get(
    "https://10.251.150.222:3344/api/v1/reports/power",
    headers=headers,
    params={
        "site_code": "DC",
        "days": 7
    }
)

data = response.json()
print(f"Total Consumption: {data['data']['summary']['total_consumption_kwh']} kWh")
print(f"Peak Demand: {data['data']['summary']['peak_demand_kw']} kW")
```

### Example 3: Get Cooling Report with Hot Spots

```javascript
// JavaScript with Fetch API
const response = await fetch(
  'https://10.251.150.222:3344/api/v1/reports/cooling?site_code=DC&days=7',
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const report = await response.json();
const hotSpots = report.data.hot_spots.filter(h => h.temperature > 30);
console.log(`Critical Hot Spots: ${hotSpots.length}`);
hotSpots.forEach(spot => {
  console.log(`  ${spot.equipment_id}: ${spot.temperature}°C`);
});
```

### Example 4: Export Report as PDF

```python
# Generate and download PDF report
response = requests.post(
    'https://10.251.150.222:3344/api/v1/reports/export/executive',
    headers={'Authorization': f'Bearer {token}'},
    params={
        'format': 'pdf',
        'site_code': 'DC',
        'include_summary': True,
        'include_charts': True
    }
)

with open('executive_report.pdf', 'wb') as f:
    f.write(response.content)
```

### Example 5: Get Daily Summary Data for Last 30 Days

```bash
curl -X GET \
  "https://10.251.150.222:3344/api/v1/reports/daily-summary?site_code=DC&days=30" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o daily_summary.json
```

---

## Performance Considerations

### 1. Database Query Optimization

**TimescaleDB Features:**
```sql
-- Time-based partitioning
SELECT create_hypertable('performance_data', 'time', 
  chunk_time_interval => '1 day'::interval);

-- Automatic compression
ALTER TABLE performance_data SET (
  timescaledb.compress,
  timescaledb.compress_orderby = 'time DESC',
  timescaledb.compress_segmentby = 'site_code,equipment_id'
);

-- Enable continuous aggregates for fast queries
CREATE MATERIALIZED VIEW performance_daily AS
SELECT
  time_bucket('1 day'::interval, time) AS day,
  site_code,
  equipment_id,
  performance_data,
  AVG(value_numeric) AS avg_value,
  MIN(value_numeric) AS min_value,
  MAX(value_numeric) AS max_value
FROM performance_data
GROUP BY day, site_code, equipment_id, performance_data;
```

**Index Strategy:**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_perf_site_metric_time ON performance_data 
  (site_code, performance_data, time DESC);

CREATE INDEX idx_perf_equipment_metric_time ON performance_data 
  (equipment_id, performance_data, time DESC);

-- Partial indexes for hot spots
CREATE INDEX idx_perf_high_temp ON performance_data 
  (equipment_id, time DESC)
WHERE performance_data LIKE '%temperature%' 
  AND value_numeric > 30;
```

### 2. Query Performance Guidelines

**Expected Performance:**

| Query Type | Filter Complexity | Expected Time |
|-----------|-------------------|---------------|
| Single site, 7 days | Simple | 200-500ms |
| Multi-metric, 30 days | Complex | 500-1500ms |
| Aggregation (time_bucket) | Medium | 300-800ms |
| Equipment drill-down | Medium | 400-900ms |
| Data quality scan | Complex | 1000-3000ms |

### 3. Frontend Optimization

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,        // 1 minute
      cacheTime: 600000,        // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    }
  }
});
```

**Lazy Loading:**
- Reports load on-demand
- Charts render with virtualization for large datasets
- Pagination for equipment lists

**Caching Strategy:**
- Executive summary: Cache 1 minute
- Power reports: Cache 5 minutes
- Cooling reports: Cache 2 minutes
- Equipment data: Cache 10 minutes

### 4. API Response Caching

```
Cache-Control: max-age=300, must-revalidate
ETag: W/"report_hash_123"
Last-Modified: Wed, 22 Apr 2026 10:00:00 GMT
```

---

## Security Architecture

### 1. Authentication

**Method:** JWT Bearer Token

**Token Scope:** `reports:read`

```python
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    token = credentials.credentials
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload
```

### 2. Authorization

**Role-Based Access Control:**

```python
# Analyst+ level required for most reports
async def get_analyst_or_admin_user(
    current_user = Depends(get_current_user)
):
    if current_user['role'] not in ['analyst', 'admin']:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user

# Admin-only reports (Data Quality)
async def get_admin_user(current_user = Depends(get_current_user)):
    if current_user['role'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### 3. Data Access Control

**Site-Level Security:**

```sql
-- Users restricted to assigned sites
CREATE POLICY reports_site_access ON performance_data
  USING (site_code = ANY(current_user_sites()));

ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
```

### 4. Input Validation

**Parameter Validation:**
```python
from pydantic import BaseModel, validator

class ReportFilter(BaseModel):
    site_code: str = Field(..., regex="^(DC|DR)$")
    days: int = Field(..., ge=1, le=30)
    equipment_id: Optional[str] = Field(None, max_length=255)
    
    @validator('days')
    def validate_days(cls, v):
        if v > 30:
            raise ValueError('Maximum 30 days allowed')
        return v
```

### 5. SQL Injection Prevention

**Parameterized Queries:**
```python
from sqlalchemy import text

# Safe: Parameter binding
query = text("""
    SELECT * FROM performance_data 
    WHERE site_code = :site 
    AND equipment_id = :equipment
""").bindparams(
    site=site_code,
    equipment=equipment_id
)

result = await db.execute(query)
```

### 6. Rate Limiting

```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/reports/{report_type}")
@limiter.limit("50/minute")
async def get_report(request: Request, ...):
    pass
```

### 7. HTTPS/TLS

**Certificate:**
- SSL/TLS at `https://10.251.150.222:3344`
- TLS 1.3 (preferred) and TLS 1.2 (compatible)
- Strong cipher suites

---

## Integration Points

### 1. Integration with Faults Page

**Shared Data:**
- Fault events used in health score calculation
- Hot spot detection from faults
- Equipment status from fault data

### 2. Integration with Censor Page

**Shared Data:**
- Censor-specific faults displayed in reports
- Censor metrics in equipment reports
- Same severity calculation logic

### 3. Integration with Dashboard

**Data Sources:**
- Executive summary displayed on main dashboard
- KPI cards linked to full reports
- Alert bubbles from fault data

### 4. Integration with Monitoring System

**Real-time Alerts:**
```python
# Trigger alerts from report data
async def check_report_thresholds():
    report = await get_power_report(days=1)
    if report['pue'] > 2.0:
        await alert_service.send({
            'type': 'high_pue',
            'value': report['pue']
        })
```

### 5. Email Export Integration

**Scheduled Reports:**
```python
# Scheduled task to email reports
@scheduler.scheduled_job('cron', hour=8, minute=0)
async def send_daily_executive_report():
    report = await get_executive_report()
    pdf = await export_report(report, format='pdf')
    await email_service.send(
        to=['admin@company.com'],
        subject='Daily Executive Report',
        attachments=[pdf]
    )
```

---

## Troubleshooting

### Issue 1: Reports Page Not Loading

**Symptoms:** Blank page, infinite spinner

**Diagnosis:**
```bash
# Check API connectivity
curl -k https://10.251.150.222:3344/api/v1/executive

# Check authentication token
echo $AUTH_TOKEN

# Check browser console for errors
# Open DevTools > Console tab
```

**Solutions:**
1. Verify JWT token is valid and not expired
2. Check API server status: `systemctl status ecc800-backend`
3. Check database connection: `pg_isready -h 10.251.150.222`
4. Clear browser cache: `Ctrl+Shift+Delete`

### Issue 2: No Data in Report

**Symptoms:** "No data available" message

**Diagnosis:**
```bash
# Check if data exists in database
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT COUNT(*), MIN(time), MAX(time) FROM performance_data;
EOF

# Check specific metric
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT DISTINCT performance_data FROM performance_data 
WHERE site_code = 'DC' LIMIT 10;
EOF
```

**Solutions:**
1. Verify site code (DC vs DR) matches available data
2. Check time range is not too narrow
3. Verify metric exists in database
4. Check for data gaps in time series

### Issue 3: Slow Report Generation

**Symptoms:** Takes >10 seconds to load report

**Diagnosis:**
```bash
# Check database query performance
EXPLAIN ANALYZE
SELECT * FROM performance_data 
WHERE site_code = 'DC' 
AND time > NOW() - INTERVAL '7 days'
LIMIT 100;

# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s \
  https://10.251.150.222:3344/api/v1/reports/power
```

**Solutions:**
1. Reduce time range (max 30 days recommended)
2. Add specific equipment filter
3. Check database indexes exist
4. Verify TimescaleDB compression is working
5. Check system resources (CPU/RAM/Disk)

### Issue 4: Export Not Working

**Symptoms:** Export button grayed out or returns error

**Diagnosis:**
```bash
# Check if export endpoint is available
curl -k -X POST \
  "https://10.251.150.222:3344/api/v1/reports/export/executive?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check dependencies
python -c "import reportlab, openpyxl; print('OK')"
```

**Solutions:**
1. Verify export dependencies: `pip list | grep -i report`
2. Check user has permission for export
3. Verify disk space for temporary files
4. Check export format parameter is valid

### Issue 5: Charts Not Rendering

**Symptoms:** Charts appear as blank areas

**Diagnosis:**
```typescript
// In browser console
console.log('Recharts version:', require('recharts').version);
console.log('Chart data:', chartData);
```

**Solutions:**
1. Verify Recharts is installed: `npm list recharts`
2. Check chart data is in correct format
3. Clear browser cache and reload
4. Try different browser to isolate issue

### Issue 6: Permission Denied

**Symptoms:** 403 Forbidden error

**Diagnosis:**
```bash
# Check user role
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT username, role FROM users WHERE username = 'your_user';
EOF

# Check token claims
jwt.decode(TOKEN, options={"verify_signature": False})
```

**Solutions:**
1. Verify user role is 'analyst' or 'admin'
2. Request role upgrade from administrator
3. Check JWT token is not expired
4. Verify token includes correct scopes

---

## Appendix: Key Files Reference

### Frontend Files
- `/ecc800/frontend/src/pages/ReportsPage.tsx` - Main reports page
- `/ecc800/frontend/src/pages/reports/ReportLanding.tsx` - Report selection
- `/ecc800/frontend/src/pages/reports/ExecutiveDashboard.tsx` - Executive summary
- `/ecc800/frontend/src/pages/reports/PowerReport.tsx` - Power analytics
- `/ecc800/frontend/src/pages/reports/CoolingReport.tsx` - Cooling system
- `/ecc800/frontend/src/pages/reports/UPSReport.tsx` - UPS status
- `/ecc800/frontend/src/services/api.ts` - API client

### Backend Files
- `/ecc800/backend/app/api/routes/reports.py` - Main reports router (3700+ lines)
- `/ecc800/backend/app/routers/reports.py` - KPI reports router
- `/ecc800/backend/app/models/models.py` - Data models
- `/ecc800/backend/app/schemas/schemas.py` - Pydantic schemas
- `/ecc800/backend/app/database.py` - Database connection

### Database Files
- `/ecc800/sql/performance_schema.sql` - Table creation
- `/ecc800/sql/performance_indexes.sql` - Index definitions
- `/ecc800/sql/timescaledb_setup.sql` - TimescaleDB configuration

### Configuration Files
- `/ecc800/config.json` - Application configuration
- `/ecc800/.env` - Environment variables
- `/ecc800/requirements.txt` - Python dependencies

---

**Document End**

For questions or updates, refer to the main ecc800 documentation or contact the development team.
