# 📊 ECC800 Dashboard Architecture - Complete Technical Documentation

**Version:** 2.0  
**Date:** April 22, 2026  
**URL:** `https://10.251.150.222:3344/ecc800/dashboard`  
**Status:** ✅ Production

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API](#backend-api)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Features](#features)
7. [Authentication & Security](#authentication--security)
8. [Performance Optimization](#performance-optimization)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the ECC800 Dashboard?

The ECC800 Dashboard is an **interactive 2D canvas-based visualization system** that provides:
- **Real-time monitoring** of data center equipment and infrastructure
- **Interactive canvas** for designing and managing dashboard layouts
- **Template system** for saving and reusing dashboard configurations
- **Live metrics integration** with performance data from database
- **Multi-site support** for DC (Data Center) and DR (Disaster Recovery) sites

### Key Statistics

| Aspect | Details |
|--------|---------|
| **Technology** | React + TypeScript + Konva.js + Three.js |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL with TimescaleDB |
| **Real-time Data** | Performance_data table (TimescaleDB hypertable) |
| **Endpoints** | `/api/v1/dashboard`, `/api/v1/dashboard-realtime` |
| **Authentication** | Bearer Token (JWT via Keycloak) |
| **Supported Sites** | DC (Data Center), DR (Disaster Recovery) |

---

## Frontend Architecture

### 📁 Component Structure

```
frontend/src/
├── pages/
│   ├── DashboardPage.tsx                    ← Main dashboard entry
│   ├── ModernDashboardPage.tsx             ← Modern UI version
│   ├── NewDashboardPage.tsx                ← Experimental version
│   └── RackLayoutDashboard.tsx             ← 3D rack visualization
├── components/
│   ├── ModernDataCenterDashboard.tsx       ← Data center viz
│   ├── ThreeJsDashboard.jsx                ← 3D rendering
│   └── dashboard/
│       ├── DashboardToolbar.tsx            ← Control toolbar
│       ├── KonvaCanvas.tsx                 ← 2D canvas
│       └── PropertiesPanel.tsx             ← Property editor
├── services/
│   ├── dashboardApi.ts                     ← API client
│   └── dashboardService.js                 ← Legacy service
├── stores/
│   └── dashboardStore.ts                   ← State management
├── hooks/
│   └── useDashboard.ts                     ← Custom hooks
├── types/
│   └── dashboard.ts                        ← TypeScript types
└── styles/
    └── dashboard.css                       ← Styling
```

### 🎨 Main Components

#### **DashboardPage.tsx** (Entry Point)
```typescript
// Purpose: Main dashboard page component
// Role: 
//   - Renders dashboard layout
//   - Manages page-level state
//   - Coordinates sub-components
//   - Handles routing and permissions
```

**Responsibilities:**
- Load dashboard configuration from backend
- Initialize canvas and settings
- Display toolbar, canvas, and properties panel
- Manage user interactions
- Handle save/load operations

#### **RackLayoutDashboard.tsx** (Canvas)
```
// Konva Canvas for 2D visualization
// Features:
//   - Shape drawing and positioning
//   - Multi-layer support (z-index)
//   - Drag-and-drop operations
//   - Property editing
//   - Real-time updates
```

**Supported Objects:**
- **Rectangles** - Equipment, racks, containers
- **Circles** - Status indicators, power nodes
- **Text** - Labels, equipment names
- **Images** - Equipment icons, logos
- **Groups** - Logical grouping of objects

**Object Properties:**
```typescript
interface DashboardObject {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  object_type: "rectangle" | "circle" | "text" | "image" | "group";
  
  // Position & Size
  x: number;                     // X coordinate
  y: number;                     // Y coordinate
  width: number;                 // Width in pixels
  height: number;                // Height in pixels
  rotation: number;              // Rotation in degrees
  
  // Styling
  fill_color: string;            // Fill color (hex)
  stroke_color: string;          // Border color
  stroke_width: number;          // Border width
  opacity: number;               // Opacity (0-1)
  
  // Behavior
  equipment_id?: string;         // Link to real equipment
  is_interactive: boolean;       // Interactive flag
  is_visible: boolean;           // Visibility toggle
  layer_order: number;           // Z-index for layering
  
  // Metadata
  created_at: timestamp;
  updated_at: timestamp;
  created_by: string;
}
```

#### **DashboardToolbar.tsx** (Controls)
```
Functions:
  - New/Open/Save Dashboard
  - Undo/Redo operations
  - Zoom in/out
  - Snap to grid
  - Select/Deselect all
  - Templates (save/load/apply)
  - Export/Import canvas
  - Settings
```

#### **PropertiesPanel.tsx** (Editor)
```
Allows editing of selected object properties:
  - Name, type
  - Position (X, Y)
  - Size (Width, Height)
  - Rotation
  - Colors (fill, stroke)
  - Opacity
  - Equipment link
  - Visibility
  - Layer order (z-index)
```

### 🔌 API Services

#### **dashboardApi.ts** (API Client)
```typescript
class DashboardApiClient {
  // Objects Management
  getObjects(filters)
  getObject(id)
  createObject(data)
  updateObject(id, data)
  deleteObject(id)
  bulkCreate(objects[])
  bulkUpdate(objects[])
  bulkDelete(ids[])
  
  // Position & Visibility
  updatePosition(id, {x, y})
  updateZIndex(id, order)
  toggleVisibility(id)
  
  // Canvas Operations
  exportCanvas()
  importCanvas(data)
  clearCanvas()
  
  // Templates
  getTemplates()
  getTemplate(id)
  createTemplate(data)
  updateTemplate(id, data)
  deleteTemplate(id)
  applyTemplate(id)
  cloneTemplate(id)
}
```

**API Endpoints:**
```
Objects:
  GET    /api/v1/dashboard/objects
  POST   /api/v1/dashboard/objects
  GET    /api/v1/dashboard/objects/{id}
  PUT    /api/v1/dashboard/objects/{id}
  DELETE /api/v1/dashboard/objects/{id}
  PUT    /api/v1/dashboard/objects/bulk
  DELETE /api/v1/dashboard/objects/bulk

Canvas:
  POST   /api/v1/dashboard/objects/{id}/position
  POST   /api/v1/dashboard/objects/{id}/z-index
  POST   /api/v1/dashboard/objects/{id}/visibility
  GET    /api/v1/dashboard/export
  POST   /api/v1/dashboard/import
  POST   /api/v1/dashboard/clear

Templates:
  GET    /api/v1/dashboard/templates
  POST   /api/v1/dashboard/templates
  GET    /api/v1/dashboard/templates/{id}
  PUT    /api/v1/dashboard/templates/{id}
  DELETE /api/v1/dashboard/templates/{id}
  POST   /api/v1/dashboard/templates/{id}/apply
  POST   /api/v1/dashboard/templates/{id}/clone
```

### 💾 State Management (Zustand)

**dashboardStore.ts:**
```typescript
interface DashboardState {
  // Data
  objects: DashboardObject[];
  templates: DashboardTemplate[];
  
  // Canvas settings
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  snapToGrid: boolean;
  zoomLevel: number;
  
  // Selection
  selectedObjects: string[];
  
  // Actions
  addObject(object)
  updateObject(id, updates)
  deleteObject(id)
  selectObject(id, multiSelect)
  deselectObject(id)
  clearSelection()
  
  // Canvas
  setZoom(level)
  setGridSize(size)
  
  // Persistence
  saveState()
  loadState()
  exportCanvas()
  importCanvas(data)
}
```

### 🎯 Data Types (TypeScript)

**dashboard.ts:**
```typescript
interface DashboardObject {
  // ... (see detailed structure above)
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  template_data: {
    objects: DashboardObject[];
    canvas_settings: CanvasSettings;
  };
  canvas_width: number;
  canvas_height: number;
  is_public: boolean;
  is_default: boolean;
  version: number;
  created_at: timestamp;
  updated_at: timestamp;
}

interface CanvasSettings {
  grid_size: number;
  snap_to_grid: boolean;
  background_color: string;
  show_grid: boolean;
}

interface EquipmentStatus {
  equipment_id: string;
  equipment_name: string;
  status: "online" | "offline" | "warning";
  cpu_usage: number;
  temperature: number;
  power: number;
  timestamp: timestamp;
}
```

---

## Backend API

### 🔌 Router: `dashboard.py`

**Prefix:** `/api/v1/dashboard`  
**Authentication:** Required (Bearer Token)  
**Methods:** GET, POST, PUT, DELETE

#### **Endpoint 1: GET /dashboard/**
```
Purpose: Get comprehensive dashboard data for site
Parameters:
  - site_code: "DC" | "DR" (optional, defaults to DC)
  - time_range: "1h" | "24h" | "7d" (optional)

Response:
{
  "site_code": "DC",
  "racks": [
    {
      "rack_id": "Rack-01",
      "equipment": [
        {
          "equipment_id": "EQP001",
          "equipment_name": "Server-001",
          "status": "online",
          "cpu_usage": 45.2,
          "temperature": 32.5,
          "power": 250.3,
          "network_usage": 60.1
        }
      ]
    }
  ],
  "summary": {
    "total_equipment": 42,
    "online_equipment": 40,
    "warning_equipment": 2,
    "offline_equipment": 0,
    "avg_cpu": 42.3,
    "avg_temperature": 24.5,
    "total_power": 10500.5,
    "alerts_count": 5
  },
  "recent_alerts": [...]
}
```

#### **Endpoint 2: GET /dashboard/summary**
```
Purpose: Get aggregated dashboard statistics
Response:
{
  "dc": {
    "pue": 1.45,
    "power_consumption": 10500.5,
    "equipment_count": 42,
    "avg_temperature": 24.5,
    "avg_humidity": 45.2
  },
  "dr": {
    "pue": 1.52,
    "power_consumption": 5200.3,
    "equipment_count": 20,
    "avg_temperature": 25.1,
    "avg_humidity": 44.8
  }
}
```

#### **Endpoint 3: GET /dashboard/equipment/{equipment_id}**
```
Purpose: Get detailed equipment data
Response:
{
  "equipment_id": "EQP001",
  "equipment_name": "Server-001",
  "site_code": "DC",
  "status": "online",
  "current_metrics": {
    "cpu": 45.2,
    "temperature": 32.5,
    "power": 250.3,
    "memory": 78.5,
    "network": 60.1
  },
  "historical_data": [...],
  "faults": [...],
  "alerts": [...]
}
```

### 🔌 Router: `dashboard_realtime.py`

**Prefix:** `/api/v1/dashboard-realtime`  
**Authentication:** Required  
**Purpose:** Real-time metrics streaming

#### **Endpoint: GET /dashboard-realtime/realtime**
```
Purpose: Get real-time metrics for dashboard visualization
Frequency: Poll every 5-10 seconds or WebSocket for live updates

Response:
{
  "timestamp": "2026-04-22T10:30:45Z",
  "dc": {
    "metrics": {
      "pue": 1.45,
      "power": 10500.5,
      "temperature": 24.5,
      "humidity": 45.2,
      "cooling": {
        "status": "normal",
        "efficiency": 78.5
      }
    },
    "equipment": [
      {
        "id": "EQP001",
        "name": "Server-001",
        "status": "online",
        "load": 45.2
      }
    ],
    "alerts": {
      "critical": 0,
      "warning": 2,
      "info": 5
    }
  },
  "dr": { ... }
}
```

### 🔌 Router: `api/routes/dashboard.py` (Object Management)

**Prefix:** `/api/v1/dashboard`  
**Purpose:** CRUD operations for dashboard objects and templates

#### **Objects Endpoints**

```python
GET /dashboard/objects
  - List all objects
  - Filters: object_type, is_visible, equipment_id
  - Returns: DashboardObject[]

POST /dashboard/objects
  - Create new object
  - Body: DashboardObjectCreate
  - Returns: DashboardObject

GET /dashboard/objects/{object_id}
  - Get specific object
  - Returns: DashboardObject

PUT /dashboard/objects/{object_id}
  - Update object
  - Body: DashboardObjectUpdate (partial)
  - Returns: DashboardObject

DELETE /dashboard/objects/{object_id}
  - Delete object
  - Returns: {"success": true}

PUT /dashboard/objects/bulk
  - Bulk create/update
  - Body: {"create": [...], "update": [...]}
  - Returns: {"created": [], "updated": []}

DELETE /dashboard/objects/bulk
  - Bulk delete
  - Body: {"object_ids": [...]}
  - Returns: {"deleted_count": n}

POST /dashboard/objects/{id}/position
  - Update position
  - Body: {"x": n, "y": n}
  - Returns: DashboardObject

POST /dashboard/objects/{id}/z-index
  - Update layer order
  - Body: {"layer_order": n}
  - Returns: DashboardObject

POST /dashboard/objects/{id}/visibility
  - Toggle visibility
  - Body: {"is_visible": boolean}
  - Returns: DashboardObject
```

#### **Templates Endpoints**

```python
GET /dashboard/templates
  - List all templates
  - Filters: is_public, is_default
  - Returns: DashboardTemplate[]

POST /dashboard/templates
  - Create new template
  - Body: DashboardTemplateCreate
  - Returns: DashboardTemplate

GET /dashboard/templates/{template_id}
  - Get specific template
  - Returns: DashboardTemplate

PUT /dashboard/templates/{template_id}
  - Update template
  - Body: DashboardTemplateUpdate
  - Returns: DashboardTemplate

DELETE /dashboard/templates/{template_id}
  - Delete template
  - Returns: {"success": true}

POST /dashboard/templates/{template_id}/apply
  - Apply template to canvas (replace all objects)
  - Body: {}
  - Returns: {"applied": true, "objects": [...]}

POST /dashboard/templates/{template_id}/clone
  - Clone template as new
  - Body: {"name": "New Template Name"}
  - Returns: DashboardTemplate (new)
```

#### **Canvas Operations**

```python
GET /dashboard/export
  - Export current canvas configuration
  - Returns: Canvas JSON with all objects and settings

POST /dashboard/import
  - Import canvas configuration
  - Body: {canvas config JSON}
  - Returns: {"imported_count": n}

POST /dashboard/clear
  - Clear all objects from canvas
  - Returns: {"deleted_count": n}
```

---

## Database Schema

### 🗄️ Tables

#### **1. dashboard_objects**
```sql
CREATE TABLE dashboard_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  object_type VARCHAR(50) NOT NULL,  -- rectangle, circle, text, image, group
  
  -- Position & Size
  x FLOAT NOT NULL DEFAULT 0,
  y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 100,
  height FLOAT NOT NULL DEFAULT 100,
  rotation FLOAT DEFAULT 0,
  
  -- Styling
  fill_color VARCHAR(20) DEFAULT '#000000',
  stroke_color VARCHAR(20) DEFAULT '#FFFFFF',
  stroke_width FLOAT DEFAULT 1,
  opacity FLOAT DEFAULT 1.0,
  
  -- Behavior
  equipment_id VARCHAR(255),  -- FK to equipment table
  is_interactive BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  layer_order INT DEFAULT 0,
  
  -- Metadata
  data_center_id INT,  -- FK to data_centers table
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Indexes
  INDEX idx_dashboard_objects_datacenter_type (data_center_id, object_type),
  INDEX idx_dashboard_objects_visible (is_visible),
  INDEX idx_dashboard_objects_equipment (equipment_id)
);
```

#### **2. dashboard_templates**
```sql
CREATE TABLE dashboard_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,  -- Complete canvas config
  
  -- Canvas dimensions
  canvas_width FLOAT DEFAULT 1024,
  canvas_height FLOAT DEFAULT 768,
  
  -- Properties
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  
  -- Metadata
  data_center_id INT,  -- NULL = global template
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- Index
  INDEX idx_dashboard_templates_public (is_public),
  INDEX idx_dashboard_templates_default (is_default)
);
```

#### **3. equipment** (Existing - Used for linking)
```sql
-- Columns used by dashboard:
-- equipment_id VARCHAR(255)
-- equipment_name VARCHAR(255)
-- site_code VARCHAR(10)  -- "DC" or "DR"
-- data_center_id INT
```

#### **4. performance_data** (Existing - Used for metrics)
```
Hypertable with columns:
  - equipment_id
  - equipment_name
  - site_code
  - performance_data (metric name)
  - value_numeric
  - statistical_start_time

Used for real-time metrics in dashboard:
  - CPU usage
  - Temperature
  - Power consumption
  - Network usage
  - Equipment status
```

### 📊 Relationships

```
DashboardObject
  ├── FK: data_center_id → DataCenter.id
  ├── FK: equipment_id → Equipment.equipment_id
  └── timestamp: created_at, updated_at

DashboardTemplate
  ├── FK: data_center_id → DataCenter.id (optional)
  ├── JSONB: template_data (contains objects array)
  └── timestamp: created_at, updated_at

Equipment (real equipment)
  ├── equipment_id (PK)
  ├── site_code ("DC" or "DR")
  └── data_center_id → DataCenter.id
```

---

## Data Flow

### 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION (Browser)                    │
│                      DashboardPage.tsx                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   RackLayoutDashboard.tsx  │
         │    (Konva Canvas + Events) │
         └────────────┬───────────────┘
                      │
         ┌────────────┴──────────────────────┐
         │                                   │
         ▼                                   ▼
   ┌──────────────────┐           ┌────────────────────┐
   │ DashboardStore   │           │  dashboardApi.ts   │
   │  (Zustand)       │           │   (API Client)     │
   └──────────────────┘           └─────────┬──────────┘
         │                                   │
         │                    ┌──────────────┴────────────────┐
         │                    │                               │
         ▼                    ▼                               ▼
    ┌─────────────────────────────────────────────────────────────┐
    │              FastAPI Backend  (/api/v1/dashboard)           │
    │                                                              │
    │  dashboard.py (data queries)                                │
    │  │ dashboard_realtime.py (real-time metrics)                │
    │  └ api/routes/dashboard.py (CRUD operations)                │
    │      │                                                       │
    │      ├─ get_objects() ────────────────────┐                │
    │      ├─ create_object() ──────────────────┤                │
    │      ├─ update_object() ──────────────────┤                │
    │      ├─ delete_object() ──────────────────┤                │
    │      ├─ get_templates() ──────────────────┤                │
    │      ├─ apply_template() ──────────────────┤                │
    │      └─ get_realtime_metrics() ───────────┤                │
    │                                           │                │
    └───────────────────────────────────────────┼────────────────┘
                                                │
                                ┌───────────────┴────────────┐
                                │                            │
                                ▼                            ▼
                    ┌──────────────────────┐    ┌──────────────────────┐
                    │ PostgreSQL Database  │    │   TimescaleDB        │
                    │                      │    │   (Performance Data) │
                    │ dashboard_objects    │    │                      │
                    │ dashboard_templates  │    │ performance_data     │
                    │ equipment (FK)       │    │ (equipment metrics)  │
                    │ data_centers (FK)    │    │                      │
                    └──────────────────────┘    └──────────────────────┘
```

### 📝 Example Workflow: Create and Display Equipment Shape

**Step 1: User Creates Rectangle (Frontend)**
```
User draws rectangle on canvas
  ↓
RackLayoutDashboard.tsx captures event
  ↓
DashboardStore adds object to state
  ↓
dashboardApi.createObject() called with DashboardObjectCreate
  ↓
POST /api/v1/dashboard/objects sent
```

**Step 2: Backend Creates Object**
```
FastAPI receives POST request
  ↓
get_current_user() validates token
  ↓
dashboard/api/routes/dashboard.py::create_object()
  ↓
DashboardObject model created
  ↓
INSERT INTO dashboard_objects (name, object_type, x, y, ...)
  ↓
Return created DashboardObject with ID
```

**Step 3: Frontend Updates Display**
```
API response received
  ↓
DashboardStore updates objects array
  ↓
RackLayoutDashboard.tsx re-renders
  ↓
Konva canvas displays new shape
  ↓
User sees rectangle on canvas
```

### 📊 Example Workflow: Display Real-time Metrics

**Step 1: Dashboard Loads**
```
DashboardPage.tsx mounts
  ↓
useEffect calls dashboardApi.getObjects()
  ↓
GET /api/v1/dashboard/objects returned
  ↓
Objects displayed on canvas
```

**Step 2: Real-time Metrics Polling**
```
Every 5-10 seconds:
  ↓
useDashboard hook calls getRealTimeMetrics()
  ↓
GET /api/v1/dashboard-realtime/realtime
  ↓
Backend queries performance_data table:
    SELECT value_numeric FROM performance_data
    WHERE equipment_id = 'EQP001'
    ORDER BY statistical_start_time DESC
    LIMIT 1
  ↓
Response: {cpu: 45.2, temperature: 32.5, power: 250.3}
```

**Step 3: Update Canvas**
```
Metrics received
  ↓
Find corresponding DashboardObject for equipment_id
  ↓
Update object color/opacity based on metrics
  ↓
Konva canvas re-renders
  ↓
User sees live equipment status
```

---

## Features

### ✨ Core Features

#### **1. Interactive Canvas**
- **Draw shapes:** rectangles, circles, text, images
- **Edit shapes:** drag, resize, rotate
- **Layer management:** z-index, bring to front, send to back
- **Visibility:** toggle visibility of objects
- **Multi-select:** select multiple objects
- **Grid snapping:** snap objects to grid
- **Undo/Redo:** revert changes

#### **2. Equipment Linking**
- **Link objects to equipment:** Associate dashboard shape with real equipment
- **Live metrics:** Display real-time metrics on shape (color, opacity)
- **Drill-down:** Click shape to see equipment details

#### **3. Template System**
- **Save templates:** Save current canvas as reusable template
- **Apply templates:** Replace canvas with template
- **Clone templates:** Create new template from existing
- **Public/Private:** Share or keep templates private
- **Default template:** Set template as default for new users
- **Version control:** Track template versions

#### **4. Real-time Monitoring**
- **Live metrics:** CPU, temperature, power, network
- **PUE calculation:** Power Usage Effectiveness
- **Status indicators:** online, offline, warning
- **Alert tracking:** Display alerts on dashboard
- **Site switching:** Toggle between DC and DR

#### **5. Data Management**
- **Export canvas:** Download canvas configuration as JSON
- **Import canvas:** Upload and restore canvas configuration
- **Bulk operations:** Create/update/delete multiple objects
- **Bulk position:** Update positions of multiple objects

#### **6. Permissions**
- **View:** All authenticated users can view dashboard
- **Edit:** Admin/Editor can create/modify objects
- **Admin:** Only admins can manage templates and permissions

---

## Authentication & Security

### 🔐 Authentication Flow

```
User Login
  ↓
Keycloak / SSO
  ↓
Receive JWT Token
  ↓
Store in localStorage('authToken')
  ↓
Include in API requests:
  Authorization: Bearer {token}
  ↓
FastAPI validates token
  ↓
get_current_user() dependency
  ↓
Extract user info from token
  ↓
Return User object to route handler
```

### 🛡️ Security Measures

| Layer | Implementation |
|-------|----------------|
| **Frontend** | Bearer token in localStorage + ProtectedRoute component |
| **Backend** | JWT validation + get_current_user dependency |
| **Database** | User_id field on dashboard_objects for ownership |
| **API** | CORS configuration, rate limiting |
| **Credentials** | Environment variables (not hardcoded) |

### 📋 Permission Levels

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| View dashboard | ✅ | ✅ | ✅ |
| Create object | ✅ | ✅ | ❌ |
| Edit object | ✅ | ✅ | ❌ |
| Delete object | ✅ | ✅ | ❌ |
| Create template | ✅ | ✅ | ❌ |
| Apply template | ✅ | ✅ | ❌ |
| Delete template | ✅ | ❌ | ❌ |
| Manage permissions | ✅ | ❌ | ❌ |

---

## Performance Optimization

### ⚡ Frontend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Code splitting** | Lazy loading of dashboard components |
| **Memoization** | React.memo on Konva components |
| **State management** | Zustand for minimal re-renders |
| **Query caching** | TanStack Query with stale-while-revalidate |
| **Virtualization** | For large object lists |
| **WebSocket** | Consider for real-time updates instead of polling |

### ⚡ Backend Optimization

| Technique | Implementation |
|-----------|-----------------|
| **Database indexes** | idx_dashboard_objects_visible, idx_dashboard_templates_public |
| **Query optimization** | SELECT only needed columns |
| **Connection pooling** | SQLAlchemy with pool_size=20 |
| **Caching** | Redis for frequently accessed templates |
| **Pagination** | For large object lists (limit=100 default) |
| **Bulk operations** | Insert/update multiple objects in single transaction |

### 📊 Database Optimization

```sql
-- Indexes
CREATE INDEX idx_dashboard_objects_visible ON dashboard_objects(is_visible);
CREATE INDEX idx_dashboard_objects_equipment ON dashboard_objects(equipment_id);
CREATE INDEX idx_dashboard_objects_datacenter ON dashboard_objects(data_center_id);
CREATE INDEX idx_dashboard_templates_public ON dashboard_templates(is_public);

-- Query optimization
EXPLAIN ANALYZE
SELECT * FROM dashboard_objects
WHERE is_visible = TRUE
AND data_center_id = 1
ORDER BY layer_order;
```

---

## Deployment

### 🚀 Production URL

```
Frontend:  https://10.251.150.222:3344/ecc800/dashboard
Backend:   https://10.251.150.222:3344/api/v1/dashboard
Database:  10.251.150.222:5210 (PostgreSQL + TimescaleDB)
```

### 📦 Dependencies

**Frontend:**
```json
{
  "react": "^18.0",
  "typescript": "^5.0",
  "konva": "^9.2",
  "three": "^r150",
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
python-multipart==0.0.6
```

### 🔧 Configuration

**Environment Variables:**
```bash
# Frontend
VITE_API_BASE_URL=https://10.251.150.222:3344/api/v1
VITE_AUTH_PROVIDER=keycloak

# Backend
DATABASE_URL=postgresql://apirak:password@10.251.150.222:5210/ecc800
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
CORS_ORIGINS=["https://10.251.150.222:3344"]
```

### 📋 Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Copy dist to Nginx: `/var/www/ecc800/dashboard`
- [ ] Deploy backend: `docker pull/build`
- [ ] Database migrations: `alembic upgrade head`
- [ ] Verify API endpoints: `curl https://10.251.150.222:3344/api/v1/dashboard`
- [ ] Test authentication: Login and create object
- [ ] Performance testing: Load testing with k6 or JMeter
- [ ] Monitoring: Set up logs, metrics, alerting

---

## Troubleshooting

### 🐛 Common Issues

#### **Issue 1: Dashboard Objects Not Displaying**
```
Symptoms:
  - Canvas appears blank
  - GET /api/v1/dashboard/objects returns []

Solutions:
  1. Check database connection
     PGPASSWORD='...' psql -h 10.251.150.222 -p 5210 -d ecc800
     SELECT COUNT(*) FROM dashboard_objects;
  
  2. Verify authentication token
     Check localStorage('authToken')
  
  3. Check browser console for errors
     Network tab → check API response
  
  4. Verify permissions
     Ensure user role is admin/editor
```

#### **Issue 2: Real-time Metrics Not Updating**
```
Symptoms:
  - Equipment status stuck
  - Metrics show old data

Solutions:
  1. Check performance_data table
     SELECT * FROM performance_data
     WHERE equipment_id = 'EQP001'
     ORDER BY statistical_start_time DESC
     LIMIT 5;
  
  2. Verify realtime API endpoint
     curl https://10.251.150.222:3344/api/v1/dashboard-realtime/realtime
  
  3. Check polling interval
     useDashboard hook: should poll every 5-10 seconds
  
  4. Check database freshness
     Data import pipeline may be lagging
```

#### **Issue 3: Template Not Applying**
```
Symptoms:
  - Apply template button unresponsive
  - Template data not loaded

Solutions:
  1. Verify template exists
     SELECT * FROM dashboard_templates WHERE id = '{template_id}';
  
  2. Check template_data JSON validity
     Ensure valid JSONB format
  
  3. Check API endpoint
     POST /api/v1/dashboard/templates/{id}/apply
  
  4. Verify permissions
     User must be admin/editor
```

#### **Issue 4: Slow Canvas Performance**
```
Symptoms:
  - Dragging/resizing lag
  - Canvas unresponsive

Solutions:
  1. Reduce object count
     Hide non-essential objects
  
  2. Check browser performance
     Chrome DevTools → Performance tab
  
  3. Reduce polling frequency
     Increase interval between realtime updates
  
  4. Optimize database queries
     Add indexes to dashboard_objects table
```

### 🔍 Debug Endpoints

```bash
# Check backend health
curl -k https://10.251.150.222:3344/api/v1/health

# List all dashboard objects
curl -k -H "Authorization: Bearer {token}" \
     https://10.251.150.222:3344/api/v1/dashboard/objects

# Get real-time metrics
curl -k -H "Authorization: Bearer {token}" \
     https://10.251.150.222:3344/api/v1/dashboard-realtime/realtime

# Check database
PGPASSWORD='...' psql -h 10.251.150.222 -p 5210 -d ecc800 \
  -c "SELECT COUNT(*) as object_count FROM dashboard_objects;"
```

---

## Summary

The ECC800 Dashboard is a comprehensive, production-ready visualization system that combines:

✅ **Interactive 2D Canvas** - Konva.js-based shape drawing and editing  
✅ **Real-time Monitoring** - Live equipment metrics from TimescaleDB  
✅ **Template System** - Save and reuse dashboard configurations  
✅ **Multi-site Support** - DC and DR sites  
✅ **Role-based Access** - Admin, Editor, Viewer permissions  
✅ **RESTful API** - Complete CRUD and template management  
✅ **Production Ready** - Security, optimization, error handling  

**Deployed at:** `https://10.251.150.222:3344/ecc800/dashboard`

---

**Document Version:** 2.0  
**Last Updated:** April 22, 2026  
**Maintained By:** ECC800 Development Team
