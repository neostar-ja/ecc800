# 📡 ECC800 Censor Page - Complete Technical Documentation

**Version:** 2.0  
**Date:** April 22, 2026  
**URL:** `https://10.251.150.222:3344/ecc800/censor`  
**Status:** ✅ Production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API](#backend-api)
4. [Database Schema & Queries](#database-schema--queries)
5. [Data Freshness System](#data-freshness-system)
6. [Data Flow](#data-flow)
7. [Features](#features)
8. [Authentication & Security](#authentication--security)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the Censor Page?

The Censor Page (named after "sensor" monitoring) is a **real-time equipment data freshness monitoring system** that provides:
- **Data Staleness Detection** - Identifies when equipment metrics become outdated
- **Freshness Scoring** - Quantifies how fresh/stale data is for each equipment
- **Metric Trending** - Shows performance trends with statistical analysis
- **Equipment Status** - Real-time equipment status by data recency
- **Custom Time Ranges** - Analyze data across configurable time windows (1h-30d)
- **Auto-refresh Capability** - Automatic 30-second polling for live updates
- **Multi-site Support** - Monitor both DC (Data Center) and DR (Disaster Recovery) sites

### Key Statistics

| Aspect | Details |
|--------|---------|
| **Technology** | React + TypeScript + Chart.js/Recharts |
| **Backend** | FastAPI (Python) with SQLAlchemy ORM |
| **Database** | PostgreSQL with TimescaleDB |
| **Real-time Data** | Performance_data table (TimescaleDB hypertable) |
| **Main Endpoint** | `/api/enhanced-metrics` |
| **Detail Endpoint** | `/api/metric/details` |
| **Authentication** | Bearer Token (JWT via Keycloak) |
| **Supported Sites** | DC (Data Center), DR (Disaster Recovery) |
| **Auto-refresh Interval** | 30 seconds |
| **Time Handling** | Bangkok Timezone (UTC+7) |
| **Freshness Scoring** | 100 - (age_hours × 5) |

---

## Frontend Architecture

### 📁 Component Structure

```
frontend/src/
├── pages/
│   └── CensorPage.tsx                    ← Main page entry
├── components/
│   ├── TimeSeriesChart.tsx               ← Chart visualization
│   ├── MetricChart.tsx                   ← Metric-specific chart
│   ├── AdvancedMetricAnalysis.tsx        ← Statistical analysis
│   └── ProtectedRoute.tsx                ← Route protection
├── services/
│   └── api.ts                            ← API client
├── types/
│   ├── api.ts                            ← API types
│   └── metric.ts                         ← Metric types
└── hooks/
    └── useMetrics.ts (implied)           ← Custom hooks
```

### 🎨 Main Components

#### **CensorPage.tsx** (Entry Point)
```typescript
// Purpose: Main censor/sensor monitoring page
// Responsibilities:
//   - Display equipment metrics with freshness indicators
//   - Show trend analysis
//   - Enable custom time range selection
//   - Auto-refresh metrics
//   - Provide search/filter capabilities
```

**Page Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Top Navigation Bar                                   │
│ [Site: DC ▼] [Equipment: EQP001 ▼] [Time: 1h ▼]    │
│ [Search...] [Auto-Refresh Toggle] [Export]          │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Metrics List                                         │
├──────────────────────────────────────────────────────┤
│ Metric    │ Current │ Trend │ Min   │ Max  │ Freshn│
├──────────────────────────────────────────────────────┤
│ CPU Usage │ 45.2%   │ ▲ +5% │ 20.1% │ 80.5%│ ✅   │
│ Temp      │ 32.5°C  │ ▲ +2  │ 28.0  │ 35.2 │ ⚠️   │
│ Power     │ 250.3W  │ ▼ -10 │ 180.0 │ 350.0│ 🔴   │
│ ...       │ ...     │ ...   │ ...   │ ...  │ ...  │
└──────────────────────────────────────────────────────┘
```

**Key Features:**

| Feature | Description |
|---------|-------------|
| **Freshness Indicator** | Visual chip (✅ Fresh, ⚠️ Stale, 🔴 Critical) |
| **Auto-Refresh Toggle** | Enable/disable 30-second polling |
| **Trend Arrows** | ▲ Increasing, ▼ Decreasing, ► Stable |
| **Time Range** | Dropdown: 1h, 6h, 24h, 7d, 30d |
| **Site Selector** | Dropdown: DC, DR |
| **Equipment Selector** | Dropdown with search/filter |
| **Chart Display** | Click metric to open detailed chart |

**State Management:**
```typescript
interface CensorPageState {
  siteCode: string;                    // "DC" or "DR"
  selectedEquipment: string;
  metrics: Metric[];
  timeRange: TimeRange;                // "1h" | "6h" | "24h" | "7d" | "30d"
  autoRefresh: boolean;
  selectedMetric?: string;
  chartData: TimeSeriesData[];
  loading: boolean;
  error?: string;
}
```

#### **TimeSeriesChart.tsx** (Visualization)
```typescript
interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  metricName: string;
  unit: string;
  timeRange: TimeRange;
}

// Renders:
// - X-axis: Time (formatted by time range)
// - Y-axis: Metric value
// - Line: Trend over time
// - Shaded area: Min/Max range
// - Hover: Show exact value and timestamp
```

**Features:**
- Interactive legend (click to toggle series)
- Zoom and pan capabilities
- Export as PNG/SVG
- Tooltip with precise values
- Responsive to screen size

#### **MetricChart.tsx** (Detailed Metric)
```typescript
interface MetricChartProps {
  metricData: MetricDetail;
  timeRange: TimeRange;
}

// Displays:
// - Current value with status color
// - Min/Max/Avg statistics
// - Standard deviation
// - Trend percentage
// - Last update timestamp
// - Freshness score (0-100)
```

#### **AdvancedMetricAnalysis.tsx** (Statistics)
```typescript
interface AnalysisProps {
  metrics: Metric[];
  timeRange: TimeRange;
}

// Shows:
// - Distribution histogram
// - Percentile breakdown (p25, p50, p75, p95, p99)
// - Anomaly detection (using STDDEV)
// - Trend direction and magnitude
// - Prediction (linear extrapolation)
```

### 🔌 API Services

#### **api.ts** (API Client)
```typescript
class CensorApiClient {
  // Main metrics endpoint
  async getEnhancedMetrics(params: MetricsQuery): Promise<MetricResponse[]>
  
  // Detailed metric data
  async getMetricDetails(params: DetailQuery): Promise<MetricDetail>
  
  // Equipment list
  async getEquipment(siteCode: string): Promise<Equipment[]>
  
  // Sites list
  async getSites(): Promise<Site[]>
  
  // Time series data
  async getTimeSeriesData(params: TimeSeriesQuery): Promise<TimeSeriesPoint[]>
  
  // Export data
  async exportMetricsCSV(params: ExportQuery): Promise<Blob>
}
```

**API Endpoints Consumed:**
```
GET  /api/enhanced-metrics?site_code={dc|dr}&equipment_id={id}&time_range={1h|24h|7d}
GET  /api/metric/details?equipment_id={id}&metric={name}&time_range={range}
GET  /api/sites
GET  /api/equipment?site_code={dc|dr}
GET  /api/equipment/{site_code}/{equipment_id}
```

### 🎯 Data Types (TypeScript)

```typescript
interface Metric {
  metric_name: string;
  current_value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  
  // Statistics
  min_value: number;
  max_value: number;
  avg_value: number;
  stddev: number;
  
  // Trend
  trend_direction: "up" | "down" | "stable";
  trend_percentage: number;           // % change
  
  // Freshness
  last_seen: timestamp;
  data_age_hours: number;
  freshness_score: number;            // 0-100
  freshness_status: "fresh" | "stale" | "critical";
}

interface TimeSeriesPoint {
  timestamp: timestamp;
  value: number;
  status: "normal" | "warning" | "critical";
}

interface MetricDetail {
  equipment_id: string;
  metric_name: string;
  time_range: TimeRange;
  
  // Current stats
  current: number;
  min: number;
  max: number;
  average: number;
  median: number;
  stddev: number;
  
  // Percentiles
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  
  // Trend
  trend_1h: number;
  trend_24h: number;
  trend_7d: number;
  
  // Data quality
  last_updated: timestamp;
  data_points_count: number;
  missing_data_percentage: number;
  
  // Freshness
  freshness_score: number;
  staleness_level: "fresh" | "stale" | "critical";
}

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";
```

---

## Backend API

### 🔌 Router: `enhanced_metrics.py`

**Prefix:** `/api`  
**Authentication:** Required (Bearer Token)

#### **Endpoint 1: GET /enhanced-metrics**
```
Purpose: Get metrics list for equipment with freshness indicators
Parameters:
  - site_code: "DC" | "DR" (required)
  - equipment_id: string (required)
  - time_range: "1h" | "6h" | "24h" | "7d" | "30d" (default: "1h")

Response:
{
  "equipment_id": "EQP001",
  "equipment_name": "Server-001",
  "site_code": "DC",
  "last_updated": "2026-04-22T10:30:45Z",
  "metrics": [
    {
      "metric_name": "cpu_usage",
      "current_value": 45.2,
      "unit": "%",
      "status": "normal",
      
      "min_value": 20.1,
      "max_value": 80.5,
      "avg_value": 42.3,
      "stddev": 15.2,
      
      "trend_direction": "up",
      "trend_percentage": 5.2,
      
      "last_seen": "2026-04-22T10:30:45Z",
      "data_age_hours": 0.25,
      "freshness_score": 98,
      "freshness_status": "fresh"
    },
    {
      "metric_name": "temperature",
      "current_value": 32.5,
      "unit": "°C",
      "status": "normal",
      ...
    }
  ]
}
```

**Implementation:**
```python
@router.get("/enhanced-metrics")
async def get_enhanced_metrics(
    site_code: str = Query(..., description="DC or DR"),
    equipment_id: str = Query(...),
    time_range: str = Query("1h", description="1h, 6h, 24h, 7d, 30d"),
    db: Session = Depends(get_db)
) -> MetricsResponse:
    """
    Get enhanced metrics with freshness indicators
    """
    # Calculate time window
    now = datetime.now(timezone.utc)
    hours = parse_time_range(time_range)
    start_time = now - timedelta(hours=hours)
    
    # Query performance data
    query = db.query(PerformanceData).filter(
        PerformanceData.equipment_id == equipment_id,
        PerformanceData.site_code == site_code,
        PerformanceData.statistical_start_time >= start_time
    )
    
    # Group by metric
    metrics = defaultdict(list)
    for row in query:
        metrics[row.performance_data].append(row)
    
    # Calculate freshness for each metric
    result_metrics = []
    for metric_name, data_points in metrics.items():
        if not data_points:
            continue
        
        values = [p.value_numeric for p in data_points if p.value_numeric]
        if not values:
            continue
        
        # Get last timestamp
        last_seen = max(p.statistical_start_time for p in data_points)
        age_hours = (now - last_seen).total_seconds() / 3600
        
        # Calculate freshness score (0-100)
        freshness_score = max(0, 100 - (age_hours * 5))
        if freshness_score >= 80:
            status = "fresh"
        elif freshness_score >= 50:
            status = "stale"
        else:
            status = "critical"
        
        metric = Metric(
            metric_name=metric_name,
            current_value=values[-1],
            min_value=min(values),
            max_value=max(values),
            avg_value=sum(values) / len(values),
            stddev=numpy.std(values),
            trend_direction=determine_trend(values),
            trend_percentage=calculate_trend_percent(values),
            last_seen=last_seen,
            data_age_hours=age_hours,
            freshness_score=freshness_score,
            freshness_status=status
        )
        result_metrics.append(metric)
    
    return MetricsResponse(
        equipment_id=equipment_id,
        equipment_name=get_equipment_name(equipment_id),
        metrics=result_metrics
    )
```

#### **Endpoint 2: GET /metric/details**
```
Purpose: Get detailed metric with statistics and trend analysis
Parameters:
  - equipment_id: string (required)
  - metric: string (required - cpu_usage, temperature, etc.)
  - time_range: string (default: "24h")

Response:
{
  "equipment_id": "EQP001",
  "metric_name": "cpu_usage",
  "time_range": "24h",
  "current": 45.2,
  "min": 20.1,
  "max": 80.5,
  "average": 42.3,
  "median": 41.5,
  "stddev": 15.2,
  
  "percentiles": {
    "p25": 30.1,
    "p50": 41.5,
    "p75": 55.2,
    "p95": 75.8,
    "p99": 79.2
  },
  
  "trend": {
    "trend_1h": 5.2,
    "trend_24h": -2.1,
    "trend_7d": 3.5
  },
  
  "data_quality": {
    "last_updated": "2026-04-22T10:30:45Z",
    "data_points_count": 288,
    "missing_data_percentage": 0.5
  },
  
  "freshness": {
    "freshness_score": 98,
    "staleness_level": "fresh",
    "age_hours": 0.25
  },
  
  "time_series": [
    {
      "timestamp": "2026-04-21T10:30:00Z",
      "value": 42.1
    }
    ...
  ]
}
```

**Implementation:**
```python
@router.get("/metric/details")
async def get_metric_details(
    equipment_id: str = Query(...),
    metric: str = Query(...),
    time_range: str = Query("24h"),
    db: Session = Depends(get_db)
) -> MetricDetailResponse:
    """
    Get detailed metric with statistical analysis
    """
    now = datetime.now(timezone.utc)
    hours = parse_time_range(time_range)
    start_time = now - timedelta(hours=hours)
    
    # Query data
    query = db.query(PerformanceData).filter(
        PerformanceData.equipment_id == equipment_id,
        PerformanceData.performance_data == metric,
        PerformanceData.statistical_start_time >= start_time
    ).order_by(PerformanceData.statistical_start_time)
    
    data_points = query.all()
    values = [p.value_numeric for p in data_points if p.value_numeric]
    
    if not values:
        raise HTTPException(status_code=404, detail="No data found")
    
    # Calculate statistics
    import numpy as np
    
    stats = {
        "current": values[-1],
        "min": float(np.min(values)),
        "max": float(np.max(values)),
        "average": float(np.mean(values)),
        "median": float(np.median(values)),
        "stddev": float(np.std(values)),
        "percentiles": {
            "p25": float(np.percentile(values, 25)),
            "p50": float(np.percentile(values, 50)),
            "p75": float(np.percentile(values, 75)),
            "p95": float(np.percentile(values, 95)),
            "p99": float(np.percentile(values, 99))
        }
    }
    
    # Calculate trends
    trend_1h = calculate_trend_percent(values[-12:])  # Last 12 points (5 min each)
    trend_24h = calculate_trend_percent(values)
    
    # Freshness
    last_seen = data_points[-1].statistical_start_time
    age_hours = (now - last_seen).total_seconds() / 3600
    freshness_score = max(0, 100 - (age_hours * 5))
    
    return MetricDetailResponse(
        equipment_id=equipment_id,
        metric_name=metric,
        time_range=time_range,
        **stats,
        trend={
            "trend_1h": trend_1h,
            "trend_24h": trend_24h,
        },
        data_quality={
            "last_updated": last_seen,
            "data_points_count": len(data_points),
            "missing_data_percentage": calculate_missing_pct(data_points)
        },
        freshness={
            "freshness_score": freshness_score,
            "staleness_level": determine_staleness(freshness_score),
            "age_hours": age_hours
        },
        time_series=[
            {"timestamp": p.statistical_start_time, "value": p.value_numeric}
            for p in data_points
        ]
    )
```

#### **Endpoint 3: GET /sites**
```
Purpose: Get list of available sites
Response:
[
  {
    "site_code": "DC",
    "site_name": "Data Center DC1",
    "location": "Bangkok, Thailand"
  },
  {
    "site_code": "DR",
    "site_name": "Disaster Recovery Site",
    "location": "Rayong, Thailand"
  }
]
```

#### **Endpoint 4: GET /equipment**
```
Purpose: Get equipment list for site
Parameters:
  - site_code: "DC" | "DR"

Response:
[
  {
    "equipment_id": "EQP001",
    "equipment_name": "Server-001",
    "site_code": "DC",
    "equipment_type": "server"
  }
  ...
]
```

---

## Database Schema & Queries

### 🗄️ Key Tables

#### **1. performance_data** (TimescaleDB Hypertable)
```sql
CREATE TABLE performance_data (
  time TIMESTAMP NOT NULL,
  equipment_id VARCHAR(255),
  equipment_name VARCHAR(255),
  site_code VARCHAR(10),
  
  -- Metric data
  performance_data VARCHAR(255),      -- metric name (CPU, temperature, etc.)
  value_numeric FLOAT,
  value_text TEXT,
  
  -- Metadata
  unit VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Key field for freshness
  statistical_start_time TIMESTAMP    -- When data was measured
);

-- Create hypertable
SELECT create_hypertable('performance_data', 'time', 
  if_not_exists => TRUE);

-- Indexes for performance
CREATE INDEX idx_performance_equipment_time 
  ON performance_data(equipment_id, statistical_start_time DESC);
CREATE INDEX idx_performance_site_time 
  ON performance_data(site_code, statistical_start_time DESC);
```

#### **2. equipment**
```sql
CREATE TABLE equipment (
  equipment_id VARCHAR(255) PRIMARY KEY,
  equipment_name VARCHAR(255) NOT NULL,
  site_code VARCHAR(10) NOT NULL,        -- "DC" or "DR"
  equipment_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'online'
);
```

#### **3. data_centers**
```sql
CREATE TABLE data_centers (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  site_code VARCHAR(10) UNIQUE,          -- "DC", "DR"
  location VARCHAR(255)
);
```

### 📊 Key Queries

#### **Query 1: Get Latest Timestamp Per Equipment**
```sql
-- Find when each equipment's data was last updated
SELECT 
  equipment_id,
  equipment_name,
  site_code,
  MAX(statistical_start_time) as last_update,
  NOW() - MAX(statistical_start_time) as age
FROM performance_data
WHERE site_code = 'DC'
GROUP BY equipment_id, equipment_name, site_code
ORDER BY last_update DESC;
```

#### **Query 2: Get Metrics with Freshness**
```sql
-- Get all metrics for equipment with freshness
SELECT 
  performance_data as metric_name,
  value_numeric as current_value,
  MAX(value_numeric) OVER (PARTITION BY performance_data) as max_value,
  MIN(value_numeric) OVER (PARTITION BY performance_data) as min_value,
  AVG(value_numeric) OVER (PARTITION BY performance_data) as avg_value,
  STDDEV(value_numeric) OVER (PARTITION BY performance_data) as stddev,
  
  -- Freshness calculation
  statistical_start_time as last_seen,
  EXTRACT(EPOCH FROM (NOW() - statistical_start_time)) / 3600 as age_hours,
  GREATEST(0, 100 - (EXTRACT(EPOCH FROM (NOW() - statistical_start_time)) / 3600 * 5)) as freshness_score,
  
  CASE 
    WHEN GREATEST(0, 100 - (EXTRACT(EPOCH FROM (NOW() - statistical_start_time)) / 3600 * 5)) >= 80 THEN 'fresh'
    WHEN GREATEST(0, 100 - (EXTRACT(EPOCH FROM (NOW() - statistical_start_time)) / 3600 * 5)) >= 50 THEN 'stale'
    ELSE 'critical'
  END as freshness_status
FROM performance_data
WHERE equipment_id = 'EQP001'
  AND site_code = 'DC'
  AND statistical_start_time >= NOW() - INTERVAL '1 hour'
ORDER BY statistical_start_time DESC;
```

#### **Query 3: Time Series Data**
```sql
-- Get time series for charting
SELECT 
  statistical_start_time as timestamp,
  value_numeric as value,
  CASE 
    WHEN value_numeric > 80 THEN 'critical'
    WHEN value_numeric > 60 THEN 'warning'
    ELSE 'normal'
  END as status
FROM performance_data
WHERE equipment_id = 'EQP001'
  AND performance_data = 'cpu_usage'
  AND statistical_start_time >= NOW() - INTERVAL '24 hours'
ORDER BY statistical_start_time;
```

---

## Data Freshness System

### 🔍 Freshness Calculation

**Formula:**
```
Freshness Score = 100 - (age_hours × 5)

Where:
  age_hours = (NOW() - last_seen_timestamp) in hours
  
  Score ranges:
    80-100: Fresh   (✅ - Data < 4 hours old)
    50-79:  Stale   (⚠️ - Data 4-10 hours old)
    0-49:   Critical (🔴 - Data > 10 hours old)
```

**Visual Indicators:**

| Score | Status | Color | Icon | Message |
|-------|--------|-------|------|---------|
| 80-100 | Fresh | 🟢 Green | ✅ | Data up to date |
| 50-79 | Stale | 🟡 Yellow | ⚠️ | Data getting old |
| 0-49 | Critical | 🔴 Red | 🔴 | Data severely outdated |

### 🔄 Auto-refresh Mechanism

**Polling Interval:**
```typescript
// When auto-refresh is enabled
if (autoRefresh) {
  const interval = setInterval(async () => {
    const response = await apiGet('/enhanced-metrics', {
      site_code: selectedSite,
      equipment_id: selectedEquipment,
      time_range: timeRange
    });
    
    // Update metrics with new freshness scores
    setMetrics(response.metrics);
    
    // Highlight freshness changes
    highlightFreshnessChanges(oldMetrics, response.metrics);
  }, 30000);  // 30 seconds
}
```

### ⏰ Timestamp Handling

**Bangkok Timezone (UTC+7):**
```typescript
// No conversion needed - data stored in Bangkok time
// Regex parsing for display: "YYYY-MM-DD HH:MM:SS"
const parseThaiDateTime = (dateString: string): Date => {
  const regex = /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/;
  const match = dateString.match(regex);
  if (match) {
    return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}+07:00`);
  }
  return new Date(dateString);
};

// Display in Bangkok time
const displayThaiTime = (date: Date): string => {
  const bangkokTime = date.toLocaleString('en-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  return bangkokTime;
};
```

---

## Data Flow

### 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION (Browser)                    │
│                      CensorPage.tsx                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┴──────────────────────┐
         │                                   │
    Page Mount                           User Actions
         │                                   │
         ├─ Select site (DC/DR)             │
         ├─ Select equipment               │
         ├─ Select time range              ├─ Click metric
         ├─ Toggle auto-refresh            ├─ Change time range
         │                                   ├─ Export data
         ▼                                   ▼
    Load Configuration              Update filters
         │                                   │
    ┌────┴────────────────────────────────┐ │
    │ Fetch Initial Data (API Calls)      │ │
    │ 1. GET /api/sites                   │ │
    │ 2. GET /api/equipment               │ │
    │ 3. GET /api/enhanced-metrics        │ │
    │ (OR)                                │ │
    │ 1. GET /api/metric/details          │ │
    └────┬───────────────────────────────┬┘ │
         │                               │   │
         ▼                               ▼   │
    ┌─────────────────────────────────────┐ │
    │  FastAPI Backend                    │ │
    │  /api/enhanced-metrics              │ │
    │  /api/metric/details                │ │
    │  /api/sites                         │ │
    │  /api/equipment                     │ │
    └──────────────┬──────────────────────┘ │
                   │                        │
    ┌──────────────┴──────────────────────┐ │
    │                                     │ │
    ▼                                     ▼ │
┌──────────────────────┐       ┌───────────────────┐
│ Query Performance    │       │ Format Response   │
│ Data Table           │       │ with Freshness    │
│                      │       │ Scores            │
│ SELECT *             │       │                   │
│ FROM performance_data│       │ - Freshness: 98   │
│ WHERE equipment_id   │       │ - Age: 0.25 hours │
│ AND time > NOW()-1h  │       │ - Status: fresh   │
└──────────────────────┘       └─────────┬─────────┘
                                         │
                    ┌────────────────────┴──────────┐
                    │                               │
                    ▼                               │
        ┌───────────────────────┐                  │
        │ JSON Response sent    │                  │
        │ to Frontend           │                  │
        └───────────────┬───────┘                  │
                        │                          │
                        └──────────┬───────────────┘
                                   │
                                   ▼
            ┌──────────────────────────────────┐
            │ Frontend Updates State            │
            │ setState({metrics: response})     │
            └──────────────┬───────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ Render Component                 │
            │ - Display metrics table          │
            │ - Show freshness chips           │
            │ - Render charts                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ User Sees:                       │
            │ - Metric values                  │
            │ - Freshness indicators (✅⚠️🔴) │
            │ - Trend arrows (▲▼►)            │
            │ - Charts on click                │
            └──────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Auto-refresh Loop (if enabled)                  │
│ Every 30 seconds:                               │
│ 1. Fetch latest metrics                         │
│ 2. Calculate new freshness scores               │
│ 3. Update freshness indicators                  │
│ 4. Highlight changes (animation)                │
└─────────────────────────────────────────────────┘
```

---

## Features

### ✨ Core Features

#### **1. Freshness Monitoring**
- **Real-time Staleness Detection:** Identifies outdated metrics
- **Freshness Scoring:** 0-100 score system
- **Visual Indicators:** ✅ Fresh, ⚠️ Stale, 🔴 Critical
- **Color Coding:** Green/Yellow/Red based on age
- **Auto-update:** Scores update every 30 seconds if enabled

#### **2. Metric Display**
- **Current Value:** Latest measurement with unit
- **Trend Analysis:** Direction (▲▲/▼▼/►) with percentage
- **Min/Max/Avg:** Statistical summary
- **Standard Deviation:** Variability indicator
- **Last Update Time:** Timestamp in Bangkok timezone

#### **3. Time Range Analysis**
- **Flexible Windows:** 1h, 6h, 24h, 7d, 30d
- **Quick Selection:** Dropdown menu
- **Data Aggregation:** Automatic binning by time range
- **Trend Calculation:** Per-range trend analysis
- **Responsive:** Charts update with time range

#### **4. Equipment Filtering**
- **Site Selection:** DC/DR switching
- **Equipment Dropdown:** Search and filter
- **Quick Stats:** Selected equipment info
- **Multi-select Ready:** For future batch analysis

#### **5. Visualization**
- **Time Series Charts:** Interactive line charts
- **Zoom/Pan:** Explore specific time windows
- **Hover Tooltips:** Precise value and time display
- **Legend Toggle:** Show/hide data series
- **Export:** PNG/SVG chart export

#### **6. Statistical Analysis**
- **Percentiles:** P25, P50, P75, P95, P99
- **Distribution:** Histogram view
- **Anomaly Detection:** Using standard deviation
- **Trend Prediction:** Linear extrapolation
- **Data Quality:** Missing data percentage

#### **7. Auto-refresh**
- **Configurable Polling:** 30-second interval
- **Toggle Control:** Enable/disable in UI
- **Smart Updates:** Only refresh what changed
- **Freshness Highlight:** Animate changes
- **Performance Aware:** Throttle if needed

---

## Authentication & Security

### 🔐 Authentication Flow

```
User accesses /ecc800/censor
  ↓
ProtectedRoute checks authentication
  ↓
localStorage('authToken') retrieved
  ↓
Token validation with backend
  ↓
get_current_user() dependency
  ↓
Extract user info from JWT
  ↓
Load CensorPage component
```

### 🛡️ Security Measures

| Layer | Implementation |
|-------|----------------|
| **Frontend** | Bearer token in localStorage, ProtectedRoute component |
| **Backend** | JWT validation, get_current_user dependency on all endpoints |
| **API** | CORS configuration, rate limiting |
| **Database** | User_id tracking on operations |
| **Credentials** | Environment variables (not hardcoded) |

### 📋 Permission Levels

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View censor page | ✅ | ✅ | ✅ |
| View freshness data | ✅ | ✅ | ✅ |
| View trend analysis | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ❌ |
| Manage settings | ✅ | ❌ | ❌ |

---

## Performance Optimization

### ⚡ Frontend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Lazy Loading** | CensorPage lazy loaded via React.lazy |
| **Query Caching** | TanStack Query with 5-minute cache |
| **Memoization** | React.memo on metric rows |
| **Virtualization** | Virtual scrolling for 100+ metrics |
| **Debouncing** | Debounce time range changes (500ms) |
| **Chart Optimization** | Canvas-based charting library |

### ⚡ Backend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Indexes** | equipment_id, site_code, statistical_start_time |
| **Query Optimization** | SELECT only needed columns |
| **Connection Pooling** | SQLAlchemy pool_size=20 |
| **TimescaleDB Compression** | Automatic for older data |
| **Caching** | Redis for frequently accessed data |
| **Pagination** | Default limit=100 for lists |

### 📊 Database Optimization

```sql
-- Key indexes
CREATE INDEX idx_performance_equipment_time 
  ON performance_data(equipment_id, statistical_start_time DESC);
CREATE INDEX idx_performance_site_time 
  ON performance_data(site_code, statistical_start_time DESC);

-- Query optimization example
EXPLAIN ANALYZE
SELECT value_numeric, statistical_start_time
FROM performance_data
WHERE equipment_id = 'EQP001'
  AND performance_data = 'cpu_usage'
  AND statistical_start_time >= NOW() - INTERVAL '24 hours'
ORDER BY statistical_start_time;
```

---

## Deployment

### 🚀 Production URL

```
Frontend:  https://10.251.150.222:3344/ecc800/censor
Backend:   https://10.251.150.222:3344/api/enhanced-metrics (and others)
Database:  10.251.150.222:5210 (PostgreSQL + TimescaleDB)
```

### 📦 Dependencies

**Frontend:**
```json
{
  "react": "^18.0",
  "typescript": "^5.0",
  "recharts": "^2.7",
  "@tanstack/react-query": "^4.32",
  "axios": "^1.4"
}
```

**Backend:**
```
fastapi==0.104.0
sqlalchemy==2.0.0
psycopg2-binary==2.9.0
pydantic==2.0.0
numpy==1.24.0
python-jose==3.3.0
```

### 🔧 Configuration

**Environment Variables:**
```bash
# Frontend
VITE_API_BASE_URL=https://10.251.150.222:3344/api
VITE_AUTO_REFRESH_INTERVAL=30000

# Backend
DATABASE_URL=postgresql://apirak:password@10.251.150.222:5210/ecc800
JWT_SECRET=your-secret-key
TIMEZONE=Asia/Bangkok
```

### 📋 Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Copy dist to Nginx: `/var/www/ecc800/censor`
- [ ] Deploy backend: `docker pull/build`
- [ ] Database migrations: `alembic upgrade head`
- [ ] Verify API endpoints: Test `/api/enhanced-metrics`, `/api/metric/details`
- [ ] Test authentication: Login and load censor page
- [ ] Test auto-refresh: Enable toggle and verify 30s polling
- [ ] Performance testing: Load test with k6 or JMeter
- [ ] Monitoring: Set up logs, metrics, alerting

---

## Troubleshooting

### 🐛 Common Issues

#### **Issue 1: No Metrics Display**
```
Symptoms:
  - Metrics list empty
  - GET /api/enhanced-metrics returns []

Solutions:
  1. Check database has data
     SELECT COUNT(*) FROM performance_data
     WHERE equipment_id = 'EQP001';
  
  2. Verify time range
     Data must be within selected time range
  
  3. Check authentication
     Verify Bearer token is valid
  
  4. Check network response
     Browser Network tab → API response body
```

#### **Issue 2: Freshness Score Not Updating**
```
Symptoms:
  - Freshness always shows same score
  - Score doesn't decrease over time
  - Auto-refresh not working

Solutions:
  1. Enable auto-refresh toggle
     Check if toggle is turned ON
  
  2. Check polling interval
     Should make request every 30 seconds
     Browser Network tab → watch for requests
  
  3. Verify API response includes freshness
     Response should have: freshness_score, data_age_hours
  
  4. Check timestamp format
     Should be ISO format with timezone
```

#### **Issue 3: Slow Chart Loading**
```
Symptoms:
  - Charts take 5+ seconds to render
  - Page lags when viewing detailed metrics
  - High CPU usage

Solutions:
  1. Check data volume
     SELECT COUNT(*) FROM performance_data
     WHERE equipment_id = 'EQP001'
     AND statistical_start_time >= NOW() - INTERVAL '24 hours';
  
  2. Reduce time range
     Start with 1h instead of 7d
  
  3. Check database indexes
     Verify idx_performance_equipment_time exists
  
  4. Profile performance
     Chrome DevTools → Performance tab
```

#### **Issue 4: Timezone Display Issues**
```
Symptoms:
  - Timestamps show wrong time
  - Timestamps show UTC instead of Bangkok time
  - Time difference is 7 hours off

Solutions:
  1. Check timezone configuration
     Backend: TIMEZONE env var should be Asia/Bangkok
     Frontend: Use Bangkok timezone for display
  
  2. Verify regex parsing
     DateTime parsing should handle "YYYY-MM-DD HH:MM:SS" format
  
  3. Check database timestamps
     SELECT statistical_start_time FROM performance_data LIMIT 1;
     Should already be in Bangkok time
  
  4. Test parseThaiDateTime function
     parseThaiDateTime("2026-04-22 10:30:45")
     Should return correct Bangkok time
```

### 🔍 Debug Endpoints

```bash
# Check metrics endpoint
curl -k -H "Authorization: Bearer {token}" \
     "https://10.251.150.222:3344/api/enhanced-metrics?site_code=DC&equipment_id=EQP001&time_range=1h"

# Check detailed metrics
curl -k -H "Authorization: Bearer {token}" \
     "https://10.251.150.222:3344/api/metric/details?equipment_id=EQP001&metric=cpu_usage&time_range=24h"

# Check database timestamp freshness
PGPASSWORD='...' psql -h 10.251.150.222 -p 5210 -d ecc800 \
  -c "SELECT equipment_id, MAX(statistical_start_time) as last_update \
      FROM performance_data \
      WHERE site_code = 'DC' \
      GROUP BY equipment_id \
      ORDER BY last_update DESC LIMIT 10;"

# Check for missing recent data
PGPASSWORD='...' psql -h 10.251.150.222 -p 5210 -d ecc800 \
  -c "SELECT DISTINCT equipment_id, MAX(statistical_start_time) \
      FROM performance_data \
      WHERE statistical_start_time >= NOW() - INTERVAL '1 hour' \
      GROUP BY equipment_id \
      ORDER BY MAX(statistical_start_time) DESC;"
```

---

## Summary

The ECC800 Censor (Sensor) Page is a sophisticated, production-ready data freshness monitoring system that combines:

✅ **Real-time Freshness Detection** - Identifies stale/outdated metrics  
✅ **Freshness Scoring** - 0-100 quantitative staleness metric  
✅ **Multi-metric Display** - CPU, temperature, power, and more  
✅ **Statistical Analysis** - Min/max/avg/stddev/percentiles  
✅ **Trend Analysis** - Direction and percentage change  
✅ **Time Range Selection** - 1h to 30d analysis windows  
✅ **Auto-refresh** - 30-second polling for live updates  
✅ **Interactive Charts** - Zoom, pan, export capabilities  
✅ **Multi-site Support** - DC and DR comparison  
✅ **Bangkok Timezone** - Proper UTC+7 handling  
✅ **Role-based Access** - Admin, Editor, Viewer permissions  
✅ **Production Ready** - Security, optimization, deployment guide  

**Deployed at:** `https://10.251.150.222:3344/ecc800/censor`

---

**Document Version:** 2.0  
**Last Updated:** April 22, 2026  
**Maintained By:** ECC800 Development Team
