# Faults Page Complete Architecture

**Document Version:** 1.0  
**Last Updated:** April 22, 2026  
**Status:** Production Ready  
**URL:** `https://10.251.150.222:3344/ecc800/faults`

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API Architecture](#backend-api-architecture)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Feature Details](#feature-details)
7. [Component Hierarchy](#component-hierarchy)
8. [API Endpoint Reference](#api-endpoint-reference)
9. [Query Examples](#query-examples)
10. [Performance Considerations](#performance-considerations)
11. [Security Architecture](#security-architecture)
12. [Integration Points](#integration-points)
13. [Troubleshooting](#troubleshooting)

---

## Overview

The **Faults Page** is a comprehensive real-time fault monitoring and management interface that provides:
- **Real-time fault detection** and severity classification
- **Multi-level filtering** (site → equipment → time range)
- **Interactive fault visualization** with color-coded severity levels
- **Summary statistics** for quick operational awareness
- **Auto-refresh capability** with manual override
- **Time-series analysis** of fault patterns

### Key Statistics
- **Primary Component:** `ImprovedFaultsPage.tsx` (React)
- **Backend Router:** `enhanced_faults.py` (FastAPI)
- **Database Table:** `fault_performance_data` (TimescaleDB)
- **Data Points:** Real-time sensor readings with fault detection
- **Refresh Interval:** 30 seconds (auto-refresh)
- **Max Records:** Dynamic pagination

---

## Frontend Architecture

### Primary Component: ImprovedFaultsPage.tsx

**Location:** `/ecc800/frontend/src/pages/ImprovedFaultsPage.tsx`

**Technology Stack:**
```
React 18.x
├── TypeScript
├── Material-UI (MUI)
├── TanStack Query (React Query)
├── Axios (HTTP Client)
└── Lodash (Utilities)
```

### Component Structure

```typescript
ImprovedFaultsPage
├── FilterPanel
│   ├── SiteSelector (dropdown)
│   ├── EquipmentSelector (dynamic)
│   ├── TimeRangeSelector (preset + custom)
│   └── RefreshControls (auto/manual)
├── SummaryDashboard
│   ├── TotalFaultsCard
│   ├── AffectedEquipmentCard
│   ├── FaultTypesCard
│   └── SeverityBreakdownCard
├── FaultsList
│   ├── FaultCard (color-coded)
│   ├── DetailExpandable
│   └── Pagination
└── LoadingStates & ErrorHandling
```

### State Management

```typescript
// React Query Hooks
const { data: faults, isLoading, error } = useFaults(filters, options);
const { data: summary } = useFaultsSummary(filters);
const { data: timeline } = useFaultsTimeline(filters);

// Local State
const [filters, setFilters] = useState({
  site_code: '',
  equipment_id: '',
  startTime: '',
  endTime: '',
  severityFilter: 'all'
});

const [autoRefresh, setAutoRefresh] = useState(true);
const [refreshInterval, setRefreshInterval] = useState(30000); // 30s
```

### Key UI Features

#### 1. **Filter Panel**
- **Site Selection:** Dropdown with available sites
- **Equipment Selection:** Dynamic list based on selected site
- **Time Range Selection:** 
  - Presets: 1h, 4h, 24h, 3d, 7d, 30d
  - Custom range: Start and end datetime pickers
- **Auto-Refresh Toggle:** Enable/disable with interval control

#### 2. **Summary Dashboard**
- **Total Faults Count:** All faults matching current filter
- **Affected Equipment:** Number of unique equipment with faults
- **Fault Types Distribution:** Bar chart of fault types
- **Severity Breakdown:** Critical/Warning/Info distribution

#### 3. **Faults List**
- **Fault Cards:** Color-coded by severity
  - 🔴 Critical: Threshold exceeded by >10%
  - 🟡 Warning: Threshold exceeded by 5-10%
  - 🔵 Info: Threshold exceeded by <5%
- **Fault Details:**
  - Equipment ID
  - Performance metric
  - Current value with unit
  - Threshold value
  - Timestamp
  - Status
- **Expandable Details:** Additional context and historical data

#### 4. **Pagination**
- **Items Per Page:** 10, 25, 50, 100 (configurable)
- **Lazy Loading:** Load next page on demand
- **Total Count:** Displayed at bottom

### Severity Color Scheme

```css
/* Critical (Red) */
.severity-critical { background-color: #d32f2f; color: #fff; }

/* Warning (Orange) */
.severity-warning { background-color: #f57c00; color: #fff; }

/* Info (Blue) */
.severity-info { background-color: #1976d2; color: #fff; }

/* Normal (Green) */
.severity-normal { background-color: #388e3c; color: #fff; }
```

---

## Backend API Architecture

### FastAPI Router: enhanced_faults.py

**Location:** `/ecc800/backend/app/routers/enhanced_faults.py`

**Technology Stack:**
```
FastAPI 0.100+
├── SQLAlchemy ORM
├── PostgreSQL/TimescaleDB Driver
├── Pydantic (Data Validation)
└── Python 3.10+
```

### API Endpoints

#### 1. **GET /api/enhanced-faults**
**Purpose:** Fetch paginated fault records with filtering

**Parameters:**
```python
site_code: str = Query(None, description="Filter by site")
equipment_id: str = Query(None, description="Filter by equipment")
start_time: datetime = Query(None, description="Start timestamp")
end_time: datetime = Query(None, description="End timestamp")
severity: str = Query("all", regex="^(critical|warning|info|all)$")
page: int = Query(1, ge=1)
page_size: int = Query(10, ge=1, le=100)
sort_by: str = Query("timestamp", regex="^(timestamp|equipment_id|severity)$")
sort_order: str = Query("desc", regex="^(asc|desc)$")
```

**Response:**
```json
{
  "total": 1500,
  "page": 1,
  "page_size": 10,
  "data": [
    {
      "id": "fault_12345",
      "site_code": "dc",
      "equipment_id": "Aisle-T/H Sensor Group-T/H Sensor4",
      "performance_data": "Temperature",
      "current_value": 42.5,
      "threshold_value": 38.0,
      "unit": "°C",
      "severity": "critical",
      "statistical_start_time": "2026-04-22T10:30:00Z",
      "statistical_end_time": "2026-04-22T10:31:00Z",
      "value_text": "42.5",
      "created_at": "2026-04-22T10:31:15Z"
    }
  ]
}
```

**HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

---

#### 2. **GET /api/enhanced-faults/summary**
**Purpose:** Get aggregated fault statistics

**Parameters:**
```python
site_code: str = Query(None)
equipment_id: str = Query(None)
start_time: datetime = Query(None)
end_time: datetime = Query(None)
```

**Response:**
```json
{
  "total_faults": 1500,
  "affected_equipment_count": 45,
  "by_severity": {
    "critical": 120,
    "warning": 450,
    "info": 930
  },
  "by_type": {
    "Temperature": 600,
    "Humidity": 400,
    "Voltage": 350,
    "Current": 150
  },
  "time_range": {
    "start": "2026-04-22T00:00:00Z",
    "end": "2026-04-22T23:59:59Z"
  }
}
```

---

#### 3. **GET /api/enhanced-faults/types**
**Purpose:** Get fault type distribution

**Parameters:**
```python
site_code: str = Query(None)
equipment_id: str = Query(None)
start_time: datetime = Query(None)
end_time: datetime = Query(None)
```

**Response:**
```json
{
  "data": [
    {
      "type": "Temperature",
      "count": 600,
      "percentage": 40.0
    },
    {
      "type": "Humidity",
      "count": 400,
      "percentage": 26.7
    }
  ]
}
```

---

#### 4. **GET /api/enhanced-faults/timeline**
**Purpose:** Get time-bucketed fault data for charts

**Parameters:**
```python
site_code: str = Query(None)
equipment_id: str = Query(None)
start_time: datetime = Query(None)
end_time: datetime = Query(None)
bucket_interval: str = Query("1h", regex="^(5m|15m|30m|1h|6h|24h)$")
```

**Response:**
```json
{
  "buckets": [
    {
      "timestamp": "2026-04-22T10:00:00Z",
      "fault_count": 45,
      "critical": 8,
      "warning": 25,
      "info": 12
    }
  ]
}
```

---

#### 5. **GET /api/enhanced-faults/time-ranges**
**Purpose:** Get available time range options

**Response:**
```json
{
  "presets": [
    { "label": "Last 1 hour", "value": "1h" },
    { "label": "Last 4 hours", "value": "4h" },
    { "label": "Last 24 hours", "value": "24h" },
    { "label": "Last 3 days", "value": "3d" },
    { "label": "Last 7 days", "value": "7d" },
    { "label": "Last 30 days", "value": "30d" }
  ],
  "custom_range_supported": true
}
```

---

## Database Schema

### Table: fault_performance_data

**Type:** TimescaleDB Hypertable (time-series optimized)

**Schema:**
```sql
CREATE TABLE fault_performance_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_code VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(255) NOT NULL,
    performance_data VARCHAR(100) NOT NULL,
    statistical_start_time TIMESTAMP NOT NULL,
    statistical_end_time TIMESTAMP,
    value_numeric DOUBLE PRECISION,
    value_text VARCHAR(100),
    unit VARCHAR(20),
    threshold_value DOUBLE PRECISION,
    severity VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- TimescaleDB time column (required)
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('fault_performance_data', 'time', if_not_exists => TRUE);

-- Indexes for query optimization
CREATE INDEX idx_fault_site_time ON fault_performance_data (site_code, time DESC);
CREATE INDEX idx_fault_equipment_time ON fault_performance_data (equipment_id, time DESC);
CREATE INDEX idx_fault_severity_time ON fault_performance_data (severity, time DESC);
CREATE INDEX idx_fault_performance_time ON fault_performance_data (performance_data, time DESC);
```

**Column Descriptions:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `site_code` | VARCHAR(50) | Data center site code (e.g., 'dc') |
| `equipment_id` | VARCHAR(255) | Equipment identifier |
| `performance_data` | VARCHAR(100) | Metric name (Temperature, Humidity, etc.) |
| `statistical_start_time` | TIMESTAMP | Measurement start time |
| `statistical_end_time` | TIMESTAMP | Measurement end time |
| `value_numeric` | DOUBLE | Numeric measurement value |
| `value_text` | VARCHAR(100) | Text representation |
| `unit` | VARCHAR(20) | Unit of measurement (°C, %, V, A) |
| `threshold_value` | DOUBLE | Acceptable threshold |
| `severity` | VARCHAR(20) | Fault severity level |
| `time` | TIMESTAMP | TimescaleDB time column |

---

## Data Flow

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────┐
│ User Interaction (ImprovedFaultsPage)                   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Set Filters (site, equipment, time range, severity)     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ React Query Hook: useFaults(filters)                    │
│ - Caches results                                        │
│ - Handles loading/error states                          │
│ - Manages refetch interval (30s)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ HTTP Request to Backend                                  │
│ GET /api/enhanced-faults?site=dc&...                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ FastAPI Router (enhanced_faults.py)                     │
│ - Validate parameters                                  │
│ - Build SQL WHERE clause                              │
│ - Set severity thresholds                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Database Query (PostgreSQL/TimescaleDB)                 │
│ - Select from fault_performance_data                   │
│ - Apply time-series compression                        │
│ - Return matching rows with pagination                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Process Results in FastAPI                             │
│ - Calculate severity levels                            │
│ - Format response JSON                                 │
│ - Add metadata (total, page, etc.)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ HTTP Response (JSON)                                    │
│ Status: 200 OK                                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ React Component Rendering                              │
│ - Update state with fault data                         │
│ - Render FaultCards with color-coding                  │
│ - Update summary statistics                            │
│ - Show pagination controls                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ UI Display                                              │
│ - FilterPanel (active filters)                         │
│ - SummaryDashboard (KPIs)                              │
│ - FaultsList (paginated results)                       │
│ - Auto-refresh countdown timer                         │
└─────────────────────────────────────────────────────────┘
```

### Auto-Refresh Cycle (30-second interval)

```
Initial Load
    ↓
Display Data (t=0s)
    ↓
Start Timer (30s countdown)
    ↓
Timer Expires (t=30s)
    ↓
Refetch Data (React Query)
    ↓
Update UI (if data changed)
    ↓
Reset Timer
    ↓
[Loop back to Timer Expires]
```

---

## Feature Details

### 1. Multi-Level Filtering

```typescript
// Filter hierarchy
Site Selection → Equipment Selection → Time Range → Severity

// Available Sites (example)
- dc (Data Center)
- remote (Remote Site)
- backup (Backup Site)

// Available Equipment (dynamic, based on site)
- Aisle-T/H Sensor Group-T/H Sensor1
- Aisle-T/H Sensor Group-T/H Sensor2
- PDU-Voltage Monitor-Outlet A1
- etc.

// Time Ranges
- 1 hour (last 60 minutes)
- 4 hours (last 240 minutes)
- 24 hours (last 1,440 minutes)
- 3 days (last 72 hours)
- 7 days (last 168 hours)
- 30 days (last 720 hours)

// Severity Levels
- Critical (Red) - Exceeds threshold by >10%
- Warning (Orange) - Exceeds threshold by 5-10%
- Info (Blue) - Exceeds threshold by <5%
- All (Show all severity levels)
```

### 2. Severity Detection Logic

**Algorithm:**

```python
def calculate_severity(current_value, threshold_value):
    """
    Calculate severity based on deviation from threshold
    """
    if current_value <= threshold_value:
        return 'normal'
    
    deviation_percent = ((current_value - threshold_value) / threshold_value) * 100
    
    if deviation_percent > 10:
        return 'critical'
    elif deviation_percent > 5:
        return 'warning'
    else:
        return 'info'
```

**Examples:**

| Metric | Threshold | Current | Deviation | Severity |
|--------|-----------|---------|-----------|----------|
| Temperature | 38.0°C | 42.5°C | +11.8% | Critical 🔴 |
| Humidity | 60% | 64% | +6.7% | Warning 🟡 |
| Voltage | 220V | 222V | +0.9% | Info 🔵 |
| Current | 10A | 10A | 0% | Normal 🟢 |

### 3. Auto-Refresh Mechanism

**Default Behavior:**
- **Interval:** 30 seconds
- **Trigger:** Automatic timer
- **User Control:** Toggle on/off, adjust interval
- **Smart Refresh:** Only updates on data changes
- **Background:** Non-blocking, allows user interaction

**Implementation:**

```typescript
useEffect(() => {
  if (!autoRefresh) return;
  
  const interval = setInterval(() => {
    queryClient.invalidateQueries({ queryKey: ['faults'] });
  }, refreshInterval);
  
  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval, queryClient]);
```

---

## Component Hierarchy

### Frontend Component Tree

```
ImprovedFaultsPage (Page Container)
├── Header
│   ├── Title
│   ├── LastUpdated
│   └── RefreshButton
├── FilterPanel
│   ├── SiteSelector
│   │   └── MultiSelect Dropdown
│   ├── EquipmentSelector
│   │   └── Filtered MultiSelect
│   ├── TimeRangeSelector
│   │   ├── Preset Buttons
│   │   └── CustomRangePicker
│   │       ├── StartDateTime
│   │       └── EndDateTime
│   ├── RefreshControls
│   │   ├── AutoRefreshToggle
│   │   ├── IntervalSelector
│   │   └── ManualRefreshButton
│   └── ApplyFiltersButton
├── SummaryDashboard
│   ├── TotalFaultsCard
│   │   ├── Icon
│   │   ├── Count
│   │   └── Trend
│   ├── AffectedEquipmentCard
│   │   ├── Icon
│   │   ├── Count
│   │   └── Percentage
│   ├── FaultTypesCard
│   │   ├── BarChart
│   │   └── LegendList
│   └── SeverityBreakdownCard
│       ├── PieChart
│       └── LegendList
├── FaultsList
│   ├── ListHeader
│   │   ├── ColumnHeaders
│   │   └── SortControls
│   ├── FaultCards (Virtualized List)
│   │   ├── SeverityBadge
│   │   ├── EquipmentInfo
│   │   ├── MetricInfo
│   │   ├── ValueInfo
│   │   ├── TimeInfo
│   │   ├── ExpandButton
│   │   └── ExpandedDetails (conditional)
│   │       ├── Description
│   │       ├── HistoricalGraph
│   │       └── ActionButtons
│   └── PaginationControls
│       ├── RowsPerPageSelector
│       ├── PageNavigator
│       └── TotalCountInfo
├── LoadingState
│   └── SkeletonCards
├── ErrorState
│   ├── ErrorIcon
│   ├── ErrorMessage
│   └── RetryButton
└── NoDataState
    ├── EmptyIcon
    └── NoDataMessage
```

---

## API Endpoint Reference

### Endpoint Summary Table

| Method | Path | Purpose | Auth | Rate Limit |
|--------|------|---------|------|-----------|
| GET | `/api/enhanced-faults` | Fetch fault records | Required | 100/min |
| GET | `/api/enhanced-faults/summary` | Get statistics | Required | 100/min |
| GET | `/api/enhanced-faults/types` | Fault type distribution | Required | 100/min |
| GET | `/api/enhanced-faults/timeline` | Time-series data | Required | 100/min |
| GET | `/api/enhanced-faults/time-ranges` | Available time ranges | Optional | 1000/min |

### Authentication

**Method:** Bearer Token (JWT)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Scope Required:** `faults:read`

---

## Query Examples

### Example 1: Get Last 24 Hours of Critical Faults

```bash
curl -X GET "https://10.251.150.222:3344/api/enhanced-faults" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_code": "dc",
    "severity": "critical",
    "start_time": "2026-04-21T00:00:00Z",
    "end_time": "2026-04-22T00:00:00Z",
    "page": 1,
    "page_size": 50
  }'
```

### Example 2: Get Temperature Faults for Specific Equipment

```python
import requests

response = requests.get(
    'https://10.251.150.222:3344/api/enhanced-faults',
    headers={'Authorization': f'Bearer {token}'},
    params={
        'equipment_id': 'Aisle-T/H Sensor Group-T/H Sensor4',
        'start_time': '2026-04-22T00:00:00Z',
        'end_time': '2026-04-22T23:59:59Z',
        'sort_by': 'timestamp',
        'sort_order': 'desc'
    }
)

faults = response.json()
for fault in faults['data']:
    print(f"{fault['equipment_id']}: {fault['performance_data']} = {fault['current_value']}{fault['unit']}")
```

### Example 3: Get Fault Summary Statistics

```javascript
// JavaScript with Fetch API
const response = await fetch(
  'https://10.251.150.222:3344/api/enhanced-faults/summary',
  {
    headers: { 'Authorization': `Bearer ${token}` },
    params: {
      site_code: 'dc',
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date().toISOString()
    }
  }
);

const summary = await response.json();
console.log(`Total Faults: ${summary.total_faults}`);
console.log(`Critical: ${summary.by_severity.critical}`);
console.log(`Warning: ${summary.by_severity.warning}`);
```

### Example 4: Get Timeline Data for Chart

```python
# Get hourly bucketed data for the last 7 days
response = requests.get(
    'https://10.251.150.222:3344/api/enhanced-faults/timeline',
    headers={'Authorization': f'Bearer {token}'},
    params={
        'site_code': 'dc',
        'start_time': '2026-04-15T00:00:00Z',
        'end_time': '2026-04-22T23:59:59Z',
        'bucket_interval': '6h'
    }
)

timeline = response.json()
# Returns hourly fault counts for chart plotting
for bucket in timeline['buckets']:
    print(f"{bucket['timestamp']}: {bucket['fault_count']} faults")
```

---

## Performance Considerations

### 1. Database Optimization

**TimescaleDB Features:**
- **Automatic Compression:** Older data compressed for storage efficiency
- **Time-based Partitioning:** Data split by time intervals
- **Chunking:** Individual chunks processed independently
- **Parallel Queries:** Multiple chunks queried in parallel

**Index Strategy:**
```sql
-- Primary indexes on common filter columns
CREATE INDEX idx_fault_site_time ON fault_performance_data (site_code, time DESC);
CREATE INDEX idx_fault_equipment_time ON fault_performance_data (equipment_id, time DESC);

-- Partial index for active faults only
CREATE INDEX idx_fault_severity_active ON fault_performance_data (severity, time DESC)
WHERE severity != 'normal';

-- Composite index for combined filters
CREATE INDEX idx_fault_combined ON fault_performance_data 
  (site_code, equipment_id, time DESC);
```

### 2. Query Optimization

**Query Plan Example:**

```sql
EXPLAIN ANALYZE
SELECT equipment_id, COUNT(*) as fault_count
FROM fault_performance_data
WHERE site_code = 'dc'
  AND time > NOW() - INTERVAL '24 hours'
  AND severity = 'critical'
GROUP BY equipment_id
ORDER BY fault_count DESC;
```

**Expected Performance:**
- Simple filter (site + time): <100ms
- Multi-filter query: 100-500ms
- Aggregation query: 200-800ms
- Timeline query (7 days): 300-1000ms

### 3. Frontend Optimization

**React Query Caching:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // 30 seconds
      cacheTime: 300000,        // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    }
  }
});
```

**Virtual Scrolling:**
- Lists with 1000+ items use virtualization
- Only visible rows rendered to DOM
- Reduces memory and improves performance

**Lazy Loading:**
- Images and charts loaded on demand
- Pagination prevents loading all data at once
- Infinite scroll available as alternative

### 4. API Response Caching

**Cache Headers:**
```
Cache-Control: max-age=30, must-revalidate
ETag: W/"12345-1234567890123"
Last-Modified: Wed, 22 Apr 2026 10:00:00 GMT
```

---

## Security Architecture

### 1. Authentication

**Method:** JWT Bearer Token

**Token Generation:**
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=403, detail="Invalid token")
```

### 2. Authorization

**Scope-based Access Control:**
```python
# Required scopes for each endpoint
GET /api/enhanced-faults → faults:read
GET /api/enhanced-faults/summary → faults:read
GET /api/enhanced-faults/types → faults:read
GET /api/enhanced-faults/timeline → faults:read
```

### 3. Data Access Control

**Row-Level Security:**
```sql
-- Users can only see faults for their assigned sites
CREATE POLICY faults_site_isolation ON fault_performance_data
  USING (site_code = current_user_site());

ALTER TABLE fault_performance_data ENABLE ROW LEVEL SECURITY;
```

### 4. Input Validation

**Pydantic Models:**
```python
from pydantic import BaseModel, validator
from datetime import datetime

class FaultFilter(BaseModel):
    site_code: str = Field(..., min_length=1, max_length=50)
    equipment_id: Optional[str] = Field(None, max_length=255)
    start_time: datetime
    end_time: datetime
    severity: str = Field(default="all", regex="^(critical|warning|info|all)$")
    
    @validator('end_time')
    def end_after_start(cls, v, values):
        if 'start_time' in values and v < values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v
```

### 5. SQL Injection Prevention

**Parameterized Queries:**
```python
from sqlalchemy import text

# Safe: Uses parameter binding
query = text(
    "SELECT * FROM fault_performance_data WHERE site_code = :site"
).bindparams(site=site_code)

# Unsafe: String concatenation (DON'T DO THIS)
# query = f"SELECT * FROM fault_performance_data WHERE site_code = '{site_code}'"
```

### 6. Rate Limiting

**Configuration:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/enhanced-faults")
@limiter.limit("100/minute")
async def get_faults(request: Request, ...):
    ...
```

### 7. HTTPS/TLS

**Certificate Configuration:**
- SSL/TLS certificate at: `https://10.251.150.222:3344`
- Certificate pinning (optional) for sensitive clients
- Cipher suites: TLS 1.3 (modern), TLS 1.2 (compatibility)

---

## Integration Points

### 1. Integration with Censor Page

**Shared Components:**
- Same fault detection logic
- Same severity calculation algorithm
- Shared database tables (fault_performance_data)

**Differences:**
- Censor Page: Shows censor-specific faults
- Faults Page: Shows all faults by metric type

### 2. Integration with Monitoring System

**Real-time Alerts:**
```python
# When critical fault detected
async def on_critical_fault(fault):
    # Send to alerting system
    await alert_service.send({
        'type': 'critical_fault',
        'equipment': fault.equipment_id,
        'metric': fault.performance_data,
        'value': fault.current_value
    })
```

### 3. Integration with Database

**ETL Pipeline:**
```
Raw Sensor Data
    ↓
Data Validation
    ↓
Severity Calculation
    ↓
Insert to fault_performance_data
    ↓
TimescaleDB Compression
    ↓
Query-Ready Data
```

### 4. Integration with Dashboard

**Data Source:**
- Faults Page provides fault data
- Used in executive dashboard
- Exported to reporting system

---

## Troubleshooting

### Issue 1: Faults Page Not Loading

**Symptoms:** Blank page, infinite spinner

**Diagnosis:**
```bash
# Check API connectivity
curl -k https://10.251.150.222:3344/api/enhanced-faults/time-ranges

# Check authentication token
echo $AUTH_TOKEN

# Check browser console for errors
# Open DevTools > Console tab
```

**Solutions:**
1. Verify JWT token is valid: `jwt.decode(token, verify=False)`
2. Check API server is running: `systemctl status ecc800-backend`
3. Check database connection: `psql -h 10.251.150.222 -U apirak -d ecc800 -c "SELECT COUNT(*) FROM fault_performance_data"`
4. Clear browser cache: `Ctrl+Shift+Delete`

### Issue 2: No Faults Showing

**Symptoms:** "No data" message despite having faults

**Diagnosis:**
```bash
# Check if data exists in database
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT COUNT(*), MIN(time), MAX(time) FROM fault_performance_data;
EOF

# Check filter parameters
# In browser console:
console.log(filters)
```

**Solutions:**
1. Verify time range is correct: Not too narrow
2. Check selected site has data
3. Verify equipment_id spelling matches database
4. Try "All" for severity filter

### Issue 3: Slow Loading Performance

**Symptoms:** Takes >5 seconds to load page

**Diagnosis:**
```bash
# Check database query performance
EXPLAIN ANALYZE
SELECT * FROM fault_performance_data 
WHERE site_code = 'dc' 
LIMIT 100;

# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s https://10.251.150.222:3344/api/enhanced-faults
```

**Solutions:**
1. Reduce time range
2. Add more specific equipment filter
3. Check database indexes: `\d+ fault_performance_data`
4. Increase database work_mem: `ALTER SYSTEM SET work_mem = '512MB'`

### Issue 4: Auto-Refresh Not Working

**Symptoms:** Data not updating every 30 seconds

**Diagnosis:**
```typescript
// In browser console
// Check if auto-refresh is enabled
console.log(autoRefresh)

// Check if query refetch is happening
queryClient.getQueryState(['faults'])
```

**Solutions:**
1. Verify autoRefresh toggle is ON
2. Check browser DevTools Network tab for API calls
3. Verify system has internet connectivity
4. Restart browser or clear ServiceWorker cache

### Issue 5: Filter Dropdown Empty

**Symptoms:** Site or Equipment selector shows no options

**Diagnosis:**
```bash
# Check available sites in database
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT DISTINCT site_code FROM fault_performance_data;
EOF

# Check available equipment for site
psql -h 10.251.150.222 -U apirak -d ecc800 << EOF
SELECT DISTINCT equipment_id FROM fault_performance_data 
WHERE site_code = 'dc' LIMIT 20;
EOF
```

**Solutions:**
1. Verify data exists in database
2. Check if API endpoint returns data:
   - Try `/api/enhanced-faults/time-ranges` first
3. Check user has permission to access site
4. Reload page and check network errors

---

## Appendix: Key Files Reference

### Frontend Files
- `/ecc800/frontend/src/pages/ImprovedFaultsPage.tsx` - Main component
- `/ecc800/frontend/src/hooks/useFaults.ts` - React Query hook
- `/ecc800/frontend/src/services/api.ts` - API client
- `/ecc800/frontend/src/components/FaultCard.tsx` - Fault display component

### Backend Files
- `/ecc800/backend/app/routers/enhanced_faults.py` - API router
- `/ecc800/backend/app/models/fault.py` - Data models
- `/ecc800/backend/app/database.py` - Database connection

### Database Files
- `/ecc800/sql/fault_schema.sql` - Table creation
- `/ecc800/sql/fault_indexes.sql` - Index definitions

### Configuration Files
- `/ecc800/config.json` - Application configuration
- `/ecc800/.env` - Environment variables

---

**Document End**

For questions or updates, refer to the main ecc800 documentation or contact the development team.
