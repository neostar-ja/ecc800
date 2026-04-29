# 🏢 ECC800 Data Center Visualization - Complete Technical Documentation

**Version:** 2.0  
**Date:** April 22, 2026  
**URL:** `https://10.251.150.222:3344/ecc800/datacenter-visualization`  
**Status:** ✅ Production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API](#backend-api)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Visualization Technology](#visualization-technology)
7. [Features](#features)
8. [Authentication & Security](#authentication--security)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Data Center Visualization?

The Data Center Visualization is a **professional 2D real-time facility visualization system** that provides:
- **Interactive facility layout** of data center equipment and infrastructure
- **Real-time equipment monitoring** with live metrics and status indicators
- **Sophisticated airflow visualization** showing cold/hot aisle dynamics
- **Multi-site support** for DC (Data Center) and DR (Disaster Recovery) locations
- **Role-based access control** for different user permission levels
- **Professional 3D-like rendering** using optimized 2D canvas techniques

### Key Statistics

| Aspect | Details |
|--------|---------|
| **Technology** | React + TypeScript + Konva.js |
| **Rendering** | 2D Canvas (Konva) with requestAnimationFrame @ 60fps |
| **Backend** | FastAPI (Python) with SQLAlchemy ORM |
| **Database** | PostgreSQL with TimescaleDB |
| **Real-time Data** | Performance_data table (continuous updates) |
| **Endpoints** | `/api/sites`, `/api/equipment`, `/api/metrics`, `/api/equipment/{site}/{id}` |
| **Authentication** | Bearer Token (JWT via Keycloak) |
| **Supported Sites** | DC (Data Center), DR (Disaster Recovery) |
| **Equipment Types** | Server, Storage, Network, HVAC, UPS, Battery, Sensor |

---

## Frontend Architecture

### 📁 Component Structure

```
frontend/src/
├── pages/
│   └── DataCenterVisualization.tsx          ← Main page entry (2,700+ lines)
├── components/
│   └── datacenter/
│       ├── Airflow.tsx                      ← Airflow animation
│       ├── Aisles.tsx                       ← Aisle layout
│       ├── CanvasFloor.tsx                  ← Konva canvas wrapper
│       ├── LegendPanel.tsx                  ← Visual legend
│       ├── RackNode.tsx                     ← Individual rack unit
│       └── TopBar.tsx                       ← Header controls
├── services/
│   ├── api.ts                               ← API client
│   ├── authExtended.ts                      ← Auth service
│   └── hooks.ts (implied)                   ← React Query hooks
├── state/
│   └── useLayoutStore.ts                    ← Layout state (Zustand)
├── contexts/
│   └── PermissionContext.tsx                ← Permission management
├── data/
│   └── layout.ts (implied)                  ← Layout constants
└── lib/
    ├── api.ts                               ← Fetch wrapper
    └── hooks.ts                             ← Custom hooks
```

### 🎨 Main Components

#### **DataCenterVisualization.tsx** (Entry Point - 2,700+ lines)
```typescript
// Purpose: Main datacenter visualization page
// Responsibilities:
//   - Load site list and equipment data
//   - Initialize Konva canvas
//   - Manage real-time metrics polling
//   - Coordinate all subcomponents
//   - Handle user interactions (zoom, pan, hover)
```

**Key Features:**
- **Site Selection:** Dropdown to switch between DC/DR sites
- **Real-time Polling:** Updates metrics every 5-10 seconds
- **Zoom & Pan:** requestAnimationFrame-based smooth interactions
- **Equipment Details:** Click equipment to see details modal
- **Performance Monitoring:** Display CPU, temperature, power, network
- **Status Indicators:** Visual feedback for equipment health

**Data Flow:**
```
Load Component
  ↓
useSites() → Fetch available sites
  ↓
useEquipment(siteCode) → Fetch equipment for selected site
  ↓
useMetrics(equipmentId) → Poll real-time metrics
  ↓
Render Konva canvas with all components
  ↓
Update on user interaction (select, zoom, pan)
```

#### **CanvasFloor.tsx** (Konva Container)
```typescript
interface CanvasFloor {
  // Konva Stage wrapper
  stageRef: React.MutableRefObject<Konva.Stage>
  
  // Dimensions
  width: number
  height: number
  
  // Interactions
  onWheel: (e: WheelEvent) => void     // Zoom with mouse wheel
  onDragStart: () => void               // Pan on drag
  
  // State
  scale: number                         // Zoom level (0.5 - 3.0)
  x: number                            // Pan X offset
  y: number                            // Pan Y offset
}
```

**Responsibilities:**
- Provide Konva Stage container
- Handle wheel zoom (100% → 300%)
- Implement drag-to-pan
- Reset zoom/pan on button click
- Manage layout state persistence

#### **Airflow.tsx** (Animated Visualization)
```typescript
interface AirflowVisualization {
  // Cold aisle intake (top)
  coldAisleFlow: ParticleAnimation
  
  // Hot aisle exhaust (bottom)
  hotAisleFlow: ParticleAnimation
  
  // Flow direction indicators
  streamlines: DashPattern[]
}
```

**Features:**
- **Particle System:** Animated particles showing air movement
- **Flow Direction:** Cold intake → hot exhaust
- **Animated Streamlines:** Dash patterns for visual feedback
- **Performance Adaptive:** Throttle if FPS drops below 30
- **Color Coding:** Blue (cold), Red (hot), Purple (neutral)

#### **Aisles.tsx** (Layout Rendering)
```typescript
interface AisleLayout {
  // Aisle arrangement
  rowA: Aisle[]           // Even-numbered racks
  rowB: Aisle[]           // Odd-numbered racks
  
  // Spacing
  aisleWidth: number
  spacingBetweenRacks: number
}
```

**Displays:**
- Aisle row A and row B separation
- Rack numbering (R01-R48)
- Aisle width calculation
- Proper spacing visualization

#### **RackNode.tsx** (Equipment Unit)
```typescript
interface EquipmentUnit {
  // Identification
  equipment_id: string
  equipment_name: string
  equipment_type: EquipmentType
  
  // Position
  x: number
  y: number
  width: number
  height: number
  
  // Status
  status: "online" | "offline" | "warning"
  
  // Metrics
  temperature: number
  humidity: number
  power: number
  cpu_usage: number
  
  // Interaction
  isSelected: boolean
  isHovered: boolean
}
```

**Features per Equipment Type:**

| Type | Color | Features |
|------|-------|----------|
| **Server** | Blue gradient | Blade modules, LED indicators, CPU bars |
| **Storage** | Purple gradient | Drive bays, capacity indicators |
| **Network** | Green gradient | Port array, connection status |
| **HVAC** | Cyan | Spinning fan animation, temperature readout |
| **UPS** | Orange | Power level indicators, battery meter |
| **Battery** | Red | Charge level bars, status LED |
| **Sensor** | Purple | Temp/humidity display, warning indicators |

**Interactive Effects:**
- Glow on hover
- Selection highlight
- Status color change (green=ok, yellow=warning, red=critical)
- Animated LEDs for active equipment
- Tooltip with equipment details

#### **LegendPanel.tsx** (Visual Reference)
```
Legend Contents:
┌─────────────────────────┐
│ Equipment Type Legend   │
├─────────────────────────┤
│ ■ Server                │
│ ■ Storage               │
│ ■ Network               │
│ ■ HVAC                  │
│ ■ UPS                   │
│ ■ Battery               │
│ ■ Sensor                │
├─────────────────────────┤
│ Status Indicators       │
├─────────────────────────┤
│ ● Online (Green)        │
│ ● Warning (Yellow)      │
│ ● Offline (Gray)        │
└─────────────────────────┘
```

#### **TopBar.tsx** (Controls & Information)
```
Controls:
┌──────────────────────────────────────────────────┐
│  [Data Center ▼] [Search...] [Reset Zoom]        │
│  [Metrics Toggle] [Airflow Toggle] [Settings]    │
│  Temp: 24.5°C | Humidity: 45% | Power: 10.5kW   │
└──────────────────────────────────────────────────┘
```

**Features:**
- Site selection dropdown
- Equipment search
- View toggles (metrics, airflow, legend)
- Real-time summary stats
- Reset view button

### 🔌 API Services

#### **api.ts** (API Client)
```typescript
interface ApiClient {
  // Sites
  getSites(): Promise<Site[]>
  
  // Equipment
  getEquipment(siteCode: string, search?: string): Promise<Equipment[]>
  getEquipmentTypes(siteCode: string): Promise<EquipmentType[]>
  
  // Metrics
  getMetrics(siteCode: string, equipmentId: string): Promise<Metric[]>
  getTimeSeriesData(params): Promise<TimeSeriesPoint[]>
  
  // Faults
  getFaultData(params): Promise<FaultPoint[]>
  
  // KPI
  getKPIReport(params): Promise<KPIMetrics>
}
```

**Endpoints Consumed:**
```
GET  /api/sites
GET  /api/equipment?site_code={dc|dr}&search={term}
GET  /api/equipment/types
GET  /api/equipment/{site_code}/{equipment_id}
GET  /api/metrics?equipment_id={id}&time_range={1h|24h|7d}
GET  /api/equipment/summary
```

### 💾 State Management (Zustand)

**useLayoutStore.ts:**
```typescript
interface LayoutState {
  // Canvas state
  scale: number;                    // Zoom level
  x: number;                        // Pan X
  y: number;                        // Pan Y
  
  // UI state
  selectedEquipment?: string;
  hoveredEquipment?: string;
  showMetrics: boolean;
  showAirflow: boolean;
  showLegend: boolean;
  
  // Data
  currentSite: string;              // "DC" or "DR"
  equipment: Equipment[];
  metrics: Map<string, Metric>;
  
  // Actions
  setZoom(scale: number)
  setPan(x: number, y: number)
  selectEquipment(id: string)
  hoverEquipment(id: string)
  toggleMetrics()
  toggleAirflow()
  setSite(site: string)
}
```

### 🎯 Data Types (TypeScript)

```typescript
interface Site {
  site_code: string;          // "DC" or "DR"
  site_name: string;          // Display name
  location: string;           // Location
  equipment_count: number;
  online_count: number;
  avg_temperature: number;
  avg_humidity: number;
}

interface Equipment {
  equipment_id: string;
  equipment_name: string;
  site_code: string;
  equipment_type: EquipmentType;
  x: number;                  // Position X
  y: number;                  // Position Y
  width: number;
  height: number;
  status: "online" | "offline" | "warning";
  last_updated: timestamp;
  display_name?: string;      // Override
}

type EquipmentType = 
  | "server" 
  | "storage" 
  | "network" 
  | "hvac" 
  | "ups" 
  | "battery" 
  | "sensor";

interface Metric {
  equipment_id: string;
  metric_type: string;        // CPU, temperature, humidity, power, etc.
  value: number;
  unit: string;
  timestamp: timestamp;
  status: "normal" | "warning" | "critical";
}

interface CanvasConfig {
  roomWidth: number;          // Canvas width
  roomHeight: number;         // Canvas height
  aisleCount: number;
  racksPerAisle: number;
}
```

---

## Backend API

### 🔌 Router: `sites.py`

**Prefix:** `/api/sites`  
**Authentication:** Required (Bearer Token)

#### **Endpoint: GET /sites**
```
Purpose: Get list of available data center sites
Parameters: None

Response:
[
  {
    "site_code": "DC",
    "site_name": "Data Center DC1",
    "location": "Bangkok, Thailand",
    "equipment_count": 42,
    "online_count": 40,
    "offline_count": 2,
    "avg_temperature": 24.5,
    "avg_humidity": 45.2,
    "alerts": {
      "critical": 0,
      "warning": 2,
      "info": 5
    }
  },
  {
    "site_code": "DR",
    "site_name": "Disaster Recovery Site",
    ...
  }
]
```

#### **Endpoint: GET /sites/equipment**
```
Purpose: Get equipment list filtered by site
Parameters:
  - site_code: "DC" | "DR" (required)
  - equipment_type: "server" | "storage" | "network" | ... (optional)
  - status: "online" | "offline" | "warning" (optional)

Response:
{
  "site_code": "DC",
  "equipment": [
    {
      "equipment_id": "EQP001",
      "equipment_name": "Server-01",
      "equipment_type": "server",
      "status": "online",
      "x": 100,
      "y": 50,
      "width": 80,
      "height": 60,
      "temperature": 32.5,
      "power": 250.3,
      "last_updated": "2026-04-22T10:30:45Z"
    }
  ],
  "total": 42,
  "online": 40,
  "offline": 2
}
```

#### **Endpoint: GET /sites/metrics**
```
Purpose: Get available metrics for visualization
Response:
{
  "available_metrics": [
    "cpu_usage",
    "temperature",
    "humidity",
    "power_consumption",
    "network_bandwidth",
    "disk_usage",
    "memory_usage"
  ],
  "time_ranges": ["1h", "24h", "7d", "30d"]
}
```

### 🔌 Router: `equipment.py`

**Prefix:** `/api/equipment`  
**Authentication:** Required

#### **Endpoint: GET /equipment**
```
Purpose: List all equipment with optional filters
Parameters:
  - site_code: string (optional)
  - equipment_type: string (optional)
  - search: string (optional - searches name and id)
  - limit: int (default 100)
  - offset: int (default 0)

Response:
{
  "equipment": [Equipment...],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

#### **Endpoint: GET /equipment/summary**
```
Purpose: Get equipment count summary per type
Response:
{
  "dc": {
    "server": 20,
    "storage": 8,
    "network": 5,
    "hvac": 4,
    "ups": 2,
    "battery": 1,
    "sensor": 2
  },
  "dr": {
    "server": 10,
    "storage": 4,
    ...
  }
}
```

#### **Endpoint: GET /equipment/types**
```
Purpose: Get available equipment types
Response:
[
  "server",
  "storage",
  "network",
  "hvac",
  "ups",
  "battery",
  "sensor"
]
```

#### **Endpoint: GET /equipment/{site_code}/{equipment_id}**
```
Purpose: Get detailed equipment information
Response:
{
  "equipment_id": "EQP001",
  "equipment_name": "Server-01",
  "display_name": "Custom Name",
  "site_code": "DC",
  "equipment_type": "server",
  "status": "online",
  "current_metrics": {
    "cpu": 45.2,
    "temperature": 32.5,
    "humidity": 55.0,
    "power": 250.3,
    "memory": 78.5
  },
  "position": {
    "rack": "R01",
    "x": 100,
    "y": 50,
    "width": 80,
    "height": 60
  },
  "alerts": [
    {
      "level": "warning",
      "message": "Temperature approaching threshold",
      "timestamp": "2026-04-22T10:25:00Z"
    }
  ],
  "last_updated": "2026-04-22T10:30:45Z"
}
```

#### **Endpoint: PUT /equipment/{site_code}/{equipment_id}/name**
```
Purpose: Update equipment display name
Parameters (body):
{
  "display_name": "New Custom Name"
}

Response:
{
  "equipment_id": "EQP001",
  "display_name": "New Custom Name"
}
```

### 🔌 Router: `metrics.py`

**Prefix:** `/api/metrics`  
**Authentication:** Required

#### **Endpoint: GET /metrics**
```
Purpose: Get time-series metrics for equipment
Parameters:
  - equipment_id: string (required)
  - metric_type: string (optional - cpu, temperature, power, etc.)
  - time_range: "1h" | "24h" | "7d" (default: "1h")
  - interval: int (seconds between data points, default: 300)

Response:
{
  "equipment_id": "EQP001",
  "metric_type": "temperature",
  "time_range": "1h",
  "data": [
    {
      "timestamp": "2026-04-22T09:30:00Z",
      "value": 30.2,
      "unit": "°C",
      "status": "normal"
    },
    {
      "timestamp": "2026-04-22T09:35:00Z",
      "value": 31.5,
      "unit": "°C",
      "status": "normal"
    }
  ]
}
```

### 🔌 Router: `metrics_v2.py`

**Enhanced Metrics API with advanced querying**

#### **Endpoint: GET /metrics/v2/equipment/{equipment_id}**
```
Purpose: Get all metrics for equipment in one call
Parameters:
  - time_range: "1h" | "24h" | "7d"

Response:
{
  "equipment_id": "EQP001",
  "metrics": {
    "cpu_usage": {
      "current": 45.2,
      "min": 20.1,
      "max": 80.5,
      "avg": 42.3,
      "trend": "stable"
    },
    "temperature": {
      "current": 32.5,
      "min": 28.0,
      "max": 35.2,
      "avg": 31.5,
      "trend": "increasing"
    },
    ...
  }
}
```

---

## Database Schema

### 🗄️ Key Tables

#### **1. equipment**
```sql
CREATE TABLE equipment (
  equipment_id VARCHAR(255) PRIMARY KEY,
  equipment_name VARCHAR(255) NOT NULL,
  site_code VARCHAR(10) NOT NULL,        -- "DC" or "DR"
  equipment_type VARCHAR(50) NOT NULL,   -- server, storage, network, hvac, ups, battery, sensor
  
  -- Visualization positioning
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  
  -- Dimensions
  width FLOAT DEFAULT 100,
  height FLOAT DEFAULT 100,
  depth FLOAT DEFAULT 100,
  
  -- Metadata
  data_center_id INT,
  rack_id VARCHAR(255),
  unit_number INT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'online',   -- online, offline, warning
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_equipment_site (site_code),
  INDEX idx_equipment_type (equipment_type),
  INDEX idx_equipment_status (status),
  INDEX idx_equipment_rack (rack_id)
);
```

#### **2. equipment_display_name**
```sql
CREATE TABLE equipment_display_name (
  equipment_id VARCHAR(255) PRIMARY KEY,
  display_name VARCHAR(255),
  custom_name_override VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);
```

#### **3. performance_data** (TimescaleDB)
```sql
-- Hypertable for time-series metrics
CREATE TABLE performance_data (
  time TIMESTAMP NOT NULL,
  equipment_id VARCHAR(255),
  equipment_name VARCHAR(255),
  site_code VARCHAR(10),
  
  -- Metrics
  performance_data VARCHAR(255),  -- metric name (CPU, temperature, etc.)
  value_numeric FLOAT,
  value_text TEXT,
  
  -- Metadata
  unit VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Index
  INDEX idx_performance_equipment_time (equipment_id, time DESC),
  INDEX idx_performance_site_time (site_code, time DESC)
);

SELECT create_hypertable('performance_data', 'time', 
  if_not_exists => TRUE);
```

#### **4. data_centers**
```sql
CREATE TABLE data_centers (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  site_code VARCHAR(10) NOT NULL UNIQUE,  -- "DC", "DR"
  location VARCHAR(255),
  ip_address VARCHAR(255),
  lat FLOAT,
  lng FLOAT,
  
  -- Facility info
  total_racks INT,
  total_units INT,
  
  INDEX idx_data_centers_site_code (site_code)
);
```

#### **5. fault_performance_data** (For Alerts)
```sql
CREATE TABLE fault_performance_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  equipment_id VARCHAR(255),
  equipment_name VARCHAR(255),
  site_code VARCHAR(10),
  
  fault_type VARCHAR(100),
  severity VARCHAR(20),           -- critical, warning, info
  fault_message TEXT,
  
  occurred_at TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  
  INDEX idx_fault_equipment (equipment_id),
  INDEX idx_fault_site (site_code),
  INDEX idx_fault_severity (severity)
);
```

### 📊 Relationships

```
DataCenter (1)
  ├─ (1:N) Equipment
  │   ├─ Equipment ID → equipment_id
  │   ├─ Site Code
  │   └─ Position (X, Y, Z)
  │
  └─ (1:N) Performance Data
      └─ Equipment ID → equipment_id
```

---

## Visualization Technology

### 🎨 Rendering Engine: Konva.js

**Why Konva.js instead of Three.js?**
- Better for 2D facility layouts
- Simpler coordinate system (X/Y only)
- Better performance for large equipment counts (40+)
- Native support for touch/mouse interactions
- Easier text rendering and labels
- Built-in layer system (z-index)

### 📐 Coordinate System

```
Canvas Layout (Konva Stage):
┌─────────────────────────────────────┐ Y: 0
│  Y: 0                               │
│  ┌─────────────────────────────┐   │
│  │  Cold Aisle (Intake)        │   │
│  │  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐   │   │ Y: 400
│  │  │R│ │R│ │R│ │R│ │R│ │R│   │   │
│  │  │1│ │2│ │3│ │4│ │5│ │6│   │   │
│  │  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘   │   │
│  ├─────────────────────────────┤   │ Y: 400
│  │ Hot Aisle (Exhaust)         │   │
│  │ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐    │   │ Y: 800
│  │ │R│ │R│ │R│ │R│ │R│ │R│    │   │
│  │ │7│ │8│ │9│ │10││11││12│   │   │
│  │ └─┘ └─┘ └─┘ └─┘ └─┘ └─┘    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
X: 0                           X: 1000
```

### 🎬 Animation Framework

**requestAnimationFrame Loop (60fps target):**
```typescript
let animationFrameId;

function animate() {
  // Update airflow particles
  updateAirflowAnimation();
  
  // Update LED indicators
  updateLEDIndicators();
  
  // Render Konva stage
  stage.batchDraw();
  
  animationFrameId = requestAnimationFrame(animate);
}

// Start animation
animate();
```

**Performance Adaptation:**
```typescript
let fps = 60;
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  const currentTime = performance.now();
  frameCount++;
  
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
    
    // Throttle if FPS drops below 30
    if (fps < 30) {
      disableAnimations();
    } else {
      enableAnimations();
    }
  }
}
```

### 🎨 Color Coding System

**Equipment Type Colors:**
```
Server:    #2563EB (Blue)
Storage:   #9333EA (Purple)
Network:   #16A34A (Green)
HVAC:      #06B6D4 (Cyan)
UPS:       #EA580C (Orange)
Battery:   #DC2626 (Red)
Sensor:    #7C3AED (Violet)
```

**Status Colors:**
```
Online:    #22C55E (Green) - Fully operational
Warning:   #FBBF24 (Yellow) - Performance issue detected
Critical:  #EF4444 (Red) - Service impaired
Offline:   #9CA3AF (Gray) - Not operational
```

**Temperature Gradient:**
```
< 20°C:    #3B82F6 (Blue) - Cold
20-25°C:   #10B981 (Green) - Optimal
25-30°C:   #FBBF24 (Yellow) - Warm
30-35°C:   #F97316 (Orange) - Hot
> 35°C:    #DC2626 (Red) - Critical
```

### ✨ Visual Effects

**Hover Effect:**
```
Before:  equipment with normal opacity (1.0)
Hover:   - Increase opacity to 1.2
         - Add glow effect (shadow blur: 20px)
         - Show equipment details tooltip
         - Highlight rack outline
```

**Selection Effect:**
```
Selected: - Draw thicker border (stroke_width: 3)
          - Change border color to highlight color
          - Show properties panel
          - Display connected equipment
```

**Animation: Airflow Particles**
```
Cold Aisle (Top to Center):
  - Blue particles fall from top
  - X velocity randomized (-2 to 2 px/frame)
  - Y velocity constant (2 px/frame downward)
  - Fade out near center

Hot Aisle (Center to Bottom):
  - Red particles rise from center
  - X velocity randomized (-2 to 2 px/frame)
  - Y velocity constant (1.5 px/frame upward)
  - Fade out at bottom
```

**Animation: LED Indicators**
```
ON:       Pulse between full brightness and 80%
          Duration: 1 second per pulse
          Color: Green or Yellow (by status)

OFF:      Dim gray, no pulse
```

---

## Data Flow

### 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION (Browser)                    │
│              DataCenterVisualization.tsx                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┴──────────────────────┐
         │                                   │
    Page Mount                           User Actions
         │                                   │
         ▼                                   ▼
    useSites()                        onEquipmentClick()
    useEquipment()                    onZoom()
    useMetrics()                      onPan()
    (TanStack Query)                  onSearch()
         │                                   │
         └────────────┬──────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   Update Layout State      │
         │   (useLayoutStore)         │
         └────────────┬───────────────┘
                      │
         ┌────────────┴──────────────┐
         │                           │
         ▼                           ▼
   Re-render Components         Render Konva
   (TopBar, Legend)            (Aisles, Airflow, RackNode)
         │                           │
         │                           ▼
         │                   requestAnimationFrame
         │                   (60fps animation loop)
         │                           │
         │                           ▼
         │                   Update canvas
         │                   (Konva batchDraw)
         │                           │
         └──────────┬────────────────┘
                    │
                    ▼
              UI Updates
           (Visual Feedback)
                    │
         ┌──────────┴──────────┐
         │                     │
    (No API Call)         (API Call Needed)
         │                     │
         │                     ▼
         │            dashboardApi.ts
         │            (Axios wrapper)
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
    ┌─────────────────────────────────────┐
    │       FastAPI Backend              │
    │  /api/sites                        │
    │  /api/equipment                    │
    │  /api/metrics                      │
    └──────────────┬──────────────────────┘
                   │
    ┌──────────────┴──────────────────┐
    │                                 │
    ▼                                 ▼
┌────────────────────┐       ┌─────────────────┐
│  SQLAlchemy ORM    │       │  Database       │
│                    │       │  Queries        │
│ equipment table    │───→   │  (PostgreSQL)   │
│ performance_data   │       │                 │
│ equipment_display  │       └─────────────────┘
│ fault_data         │
└────────────────────┘
```

### 📊 Example Workflow: Load and Display Equipment

**Step 1: Component Mount (Frontend)**
```
DataCenterVisualization component mounts
  ↓
useEffect() runs
  ↓
useSites() hook called
  ↓
TanStack Query caches result
  ↓
Default site selected (DC)
```

**Step 2: Fetch Equipment (Frontend)**
```
Site selected
  ↓
useEquipment(siteCode) called
  ↓
dashboardApi.getEquipment("DC")
  ↓
GET /api/equipment?site_code=DC
```

**Step 3: Backend Processes Request (Backend)**
```
FastAPI receives GET request
  ↓
get_current_user() validates token
  ↓
equipment.py::get_equipment(site_code="DC")
  ↓
SQLAlchemy query:
    SELECT * FROM equipment
    WHERE site_code = 'DC'
    ORDER BY position_x, position_y
  ↓
Return EquipmentResponse[]
```

**Step 4: Display on Canvas (Frontend)**
```
Equipment data received
  ↓
useLayoutStore.setState({equipment: data})
  ↓
RackNode component renders per equipment
  ↓
Konva canvas draws equipment shapes
  ↓
User sees facility layout
```

**Step 5: Real-time Metrics Update (Polling)**
```
Every 5-10 seconds:
  ↓
useMetrics(equipmentId) hook
  ↓
GET /api/metrics?equipment_id={id}&time_range=1h
  ↓
Backend queries performance_data:
    SELECT value_numeric FROM performance_data
    WHERE equipment_id = '{id}'
    AND time > NOW() - INTERVAL '1 hour'
    ORDER BY time DESC LIMIT 1
  ↓
Return latest metric
  ↓
Update equipment color/status
  ↓
Konva canvas refreshes
  ↓
User sees live update
```

---

## Features

### ✨ Core Features

#### **1. Interactive Facility Layout**
- **2D Facility View:** Konva canvas rendering of entire facility
- **Equipment Positioning:** X/Y coordinates from database
- **Rack Organization:** Cold aisle/hot aisle layout
- **Zoom & Pan:** Zoom 0.5x-3.0x, drag to pan
- **Responsive:** Adapts to screen size

#### **2. Real-time Monitoring**
- **Live Metrics:** CPU, temperature, humidity, power
- **Status Indicators:** Online/offline/warning states
- **Performance Updates:** 5-10 second polling interval
- **Alert Integration:** Critical/warning alerts displayed
- **Health Dashboard:** Aggregated site statistics

#### **3. Airflow Visualization**
- **Cold Aisle Display:** Shows intake airflow from top
- **Hot Aisle Display:** Shows exhaust airflow to bottom
- **Particle Animation:** Visual airflow movement
- **Color Coding:** Blue (cold), Red (hot)
- **Efficiency Insights:** Identify airflow issues

#### **4. Equipment Management**
- **Search:** Find equipment by name or ID
- **Filtering:** Filter by type, status, site
- **Custom Names:** Override equipment display names
- **Equipment Details:** Click to view comprehensive information
- **Drill-down:** Navigate to equipment-specific metrics

#### **5. Multi-site Support**
- **Site Selection:** Toggle between DC and DR
- **Isolated Views:** Each site independent layout
- **Cross-site Comparison:** Compare metrics across sites
- **Failover Awareness:** Show replica equipment

#### **6. Visual Intelligence**
- **Color Zones:** Temperature-based color gradients
- **LED Indicators:** Animated status lights
- **Glow Effects:** Hover to highlight equipment
- **Alert Overlays:** Show alerts on equipment
- **Legend Panel:** Reference for colors and indicators

#### **7. Role-Based Access**
- **View-Only:** All authenticated users
- **Edit Names:** Admin/Editor roles
- **Access Control:** Menu permission checks
- **Permission Inheritance:** From parent menu items

---

## Authentication & Security

### 🔐 Authentication Flow

```
User accesses /ecc800/datacenter-visualization
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
Check menu permissions
  ↓
Load DataCenterVisualization component
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
| View visualization | ✅ | ✅ | ✅ |
| View metrics | ✅ | ✅ | ✅ |
| Edit display names | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | ❌ |
| Manage permissions | ✅ | ❌ | ❌ |

---

## Performance Optimization

### ⚡ Frontend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Lazy Loading** | DataCenterVisualization lazy loaded via React.lazy |
| **Query Caching** | TanStack Query with stale-while-revalidate |
| **Memoization** | React.memo on RackNode components |
| **Canvas Batching** | Konva stage.batchDraw() instead of individual draws |
| **Animation Throttling** | Disable animations if FPS < 30 |
| **Virtualization** | Render only visible equipment (future optimization) |

### ⚡ Backend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Database Indexes** | Equipment site_code, type, status indexes |
| **Connection Pooling** | SQLAlchemy pool_size=20 |
| **Query Optimization** | SELECT only needed columns |
| **TimescaleDB Compression** | Automatic for performance_data hypertable |
| **Caching** | Redis for frequently accessed site data |
| **Pagination** | Default limit=100 for equipment lists |

### 📊 Database Optimization

```sql
-- Key indexes
CREATE INDEX idx_equipment_site ON equipment(site_code);
CREATE INDEX idx_equipment_type ON equipment(equipment_type);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_performance_equipment_time 
  ON performance_data(equipment_id, time DESC);

-- Query optimization
EXPLAIN ANALYZE
SELECT equipment_id, position_x, position_y, equipment_type
FROM equipment
WHERE site_code = 'DC'
ORDER BY position_x, position_y;
```

---

## Deployment

### 🚀 Production URL

```
Frontend:  https://10.251.150.222:3344/ecc800/datacenter-visualization
Backend:   https://10.251.150.222:3344/api/sites (and other endpoints)
Database:  10.251.150.222:5210 (PostgreSQL + TimescaleDB)
```

### 📦 Dependencies

**Frontend:**
```json
{
  "react": "^18.0",
  "typescript": "^5.0",
  "konva": "^9.2",
  "@tanstack/react-query": "^4.32",
  "zustand": "^4.3",
  "axios": "^1.4"
}
```

**Backend:**
```
fastapi==0.104.0
sqlalchemy==2.0.0
psycopg2-binary==2.9.0
pydantic==2.0.0
python-jose==3.3.0
```

### 🔧 Configuration

**Environment Variables:**
```bash
# Frontend
VITE_API_BASE_URL=https://10.251.150.222:3344/api
VITE_AUTH_PROVIDER=keycloak

# Backend
DATABASE_URL=postgresql://apirak:password@10.251.150.222:5210/ecc800
JWT_SECRET=your-secret-key
CORS_ORIGINS=["https://10.251.150.222:3344"]
```

### 📋 Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Copy dist to Nginx: `/var/www/ecc800/datacenter-visualization`
- [ ] Deploy backend: `docker pull/build`
- [ ] Database migrations: `alembic upgrade head`
- [ ] Verify API endpoints: Test all `/api/` routes
- [ ] Test authentication: Login and load visualization
- [ ] Performance testing: Load test with k6 or JMeter
- [ ] Monitoring: Set up logs, metrics, alerting

---

## Troubleshooting

### 🐛 Common Issues

#### **Issue 1: Facility Layout Not Displaying**
```
Symptoms:
  - Canvas appears blank
  - Equipment list loads but not visible

Solutions:
  1. Check equipment coordinates in database
     SELECT equipment_id, position_x, position_y, width, height
     FROM equipment
     WHERE site_code = 'DC'
     LIMIT 5;
  
  2. Verify canvas dimensions match data
     Check CanvasFloor.tsx width/height props
  
  3. Check browser console for errors
     Network tab → API responses
  
  4. Verify equipment count
     SELECT COUNT(*) FROM equipment WHERE site_code = 'DC';
```

#### **Issue 2: Real-time Metrics Not Updating**
```
Symptoms:
  - Equipment shows stale data
  - Metrics stop updating after initial load

Solutions:
  1. Check polling interval
     useMetrics hook: should poll every 5-10 seconds
  
  2. Verify performance_data table has recent data
     SELECT * FROM performance_data
     WHERE equipment_id = 'EQP001'
     ORDER BY time DESC LIMIT 5;
  
  3. Check API response
     GET /api/metrics?equipment_id=EQP001&time_range=1h
  
  4. Check browser Network tab
     Should see requests every 5-10 seconds
```

#### **Issue 3: Poor Animation Performance**
```
Symptoms:
  - Airflow animation is jittery
  - Pan/zoom is sluggish
  - High CPU usage

Solutions:
  1. Check FPS in console
     Monitor FPS measurement function
  
  2. Reduce animation complexity
     Disable airflow animation if FPS < 30
  
  3. Reduce equipment count on screen
     Zoom in or filter by type
  
  4. Check Konva batch drawing
     Ensure stage.batchDraw() is called (not individual draws)
```

#### **Issue 4: Equipment Positioning Issues**
```
Symptoms:
  - Equipment overlaps
  - Equipment outside canvas bounds
  - Positioning doesn't match physical layout

Solutions:
  1. Verify coordinate system
     Check if coordinates are 0-based or 1-based
  
  2. Check equipment dimensions
     width/height values should match physical size
  
  3. Recalibrate layout
     Recalculate position_x, position_y for all equipment
  
  4. Test with single equipment
     Add one equipment and verify positioning
```

### 🔍 Debug Endpoints

```bash
# Check sites
curl -k -H "Authorization: Bearer {token}" \
     https://10.251.150.222:3344/api/sites

# Check equipment
curl -k -H "Authorization: Bearer {token}" \
     https://10.251.150.222:3344/api/equipment?site_code=DC

# Check metrics
curl -k -H "Authorization: Bearer {token}" \
     https://10.251.150.222:3344/api/metrics?equipment_id=EQP001

# Check database
PGPASSWORD='...' psql -h 10.251.150.222 -p 5210 -d ecc800 \
  -c "SELECT COUNT(*) as equipment_count FROM equipment WHERE site_code = 'DC';"
```

---

## Summary

The ECC800 Data Center Visualization is a sophisticated, production-ready facility monitoring system that combines:

✅ **Interactive 2D Facility Layout** - Professional Konva.js rendering  
✅ **Real-time Equipment Monitoring** - Live metrics from TimescaleDB  
✅ **Airflow Visualization** - Animated cold/hot aisle dynamics  
✅ **Multi-site Support** - DC and DR facilities  
✅ **Role-based Access Control** - Admin, Editor, Viewer permissions  
✅ **RESTful API** - Complete equipment and metrics endpoints  
✅ **Performance Optimized** - 60fps animations, efficient queries  
✅ **Production Ready** - Security, error handling, deployment guide  

**Deployed at:** `https://10.251.150.222:3344/ecc800/datacenter-visualization`

---

**Document Version:** 2.0  
**Last Updated:** April 22, 2026  
**Maintained By:** ECC800 Development Team
