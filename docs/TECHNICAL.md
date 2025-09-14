# ECC800 Technical Documentation

## 🏗️ System Architecture

### Tech Stack Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│                 │    │                 │    │                 │
│ React 18 + TS   │◄──►│ FastAPI + Async │◄──►│ PostgreSQL +    │
│ Material-UI     │    │ SQLAlchemy 2.0  │    │ TimescaleDB     │
│ TanStack Query  │    │ JWT Auth        │    │ 25 Equipment    │
│                 │    │ OpenAPI Docs    │    │ 8 Overrides     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │ Docker Compose  │
                    │ Nginx Reverse   │
                    │ Proxy + HTTPS   │
                    └─────────────────┘
```

### Container Architecture
- **Frontend**: Nginx serving React build
- **Backend**: Python FastAPI with AsyncIO
- **Reverse Proxy**: Nginx with SSL termination
- **Database**: External PostgreSQL with TimescaleDB

### Network Flow
```
Internet → Port 3344 (HTTPS) → Nginx → Frontend (80) + Backend (8010)
```

## 🗄️ Database Schema

### Core Tables

#### performance_equipment_master
```sql
CREATE TABLE performance_equipment_master (
    site_code VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(255) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (site_code, equipment_id)
);

-- Current Data: 25 equipment records
-- Sites: DC (20 records), DR (5 records)
```

#### equipment_name_overrides  
```sql
CREATE TABLE equipment_name_overrides (
    site_code VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (site_code, equipment_id),
    FOREIGN KEY (site_code, equipment_id) 
        REFERENCES performance_equipment_master(site_code, equipment_id)
);

-- Current Data: 8 custom name overrides
```

#### performance_data (TimescaleDB Hypertable)
```sql
CREATE TABLE performance_data (
    site_code VARCHAR(50),
    equipment_id VARCHAR(255),
    equipment_name VARCHAR(255),
    performance_data VARCHAR(255), -- metric name
    value_numeric NUMERIC,
    value_text TEXT,
    unit VARCHAR(50),
    data_type VARCHAR(20),
    statistical_start_time TIMESTAMP WITH TIME ZONE,
    statistical_end_time TIMESTAMP WITH TIME ZONE,
    statistical_period VARCHAR(20)
);

-- Performance: ~500K+ records
-- Time range: 2025-01 to present
-- Partitioned by time (TimescaleDB)
```

### Indexes for Performance
```sql
-- Equipment lookup
CREATE INDEX idx_performance_equipment 
ON performance_equipment_master(site_code, equipment_id);

-- Override lookup  
CREATE INDEX idx_equipment_overrides
ON equipment_name_overrides(site_code, equipment_id);

-- Performance data queries
CREATE INDEX idx_performance_data_site_equip
ON performance_data(site_code, equipment_id);

CREATE INDEX idx_performance_data_time
ON performance_data(statistical_start_time DESC);

CREATE INDEX idx_performance_data_metric
ON performance_data(performance_data, site_code);
```

## 🔌 API Architecture

### Authentication Flow
```
1. POST /ecc800/api/auth/login
   ├── Validate credentials (bcrypt)
   ├── Generate JWT token (1 hour expiry)
   └── Return {access_token, token_type}

2. Protected endpoints require:
   └── Authorization: Bearer <token>
```

### Core API Routes

#### Sites & Equipment (`/api/sites.py`)
```python
# Equipment listing with custom names
GET /api/sites/{site_code}/equipment
└── Query: performance_equipment_master + equipment_name_overrides
└── Response: [EquipmentResponse]

# Equipment details with metrics
GET /api/equipment/{site_code}/{equipment_id}/details
└── Complex join with performance_data
└── Response: {equipment, metrics, recent_data}

# Update equipment name
PUT /api/equipment/{site_code}/{equipment_id}/name
└── Insert/Update equipment_name_overrides
└── Response: {success, display_name}
```

#### Reports (`/api/routes/reports.py`)  
```python
# System summary
GET /api/reports/summary
└── Aggregate stats from performance_data

# Temperature analysis  
GET /api/reports/temperature
└── Filter by temp/humidity metrics
└── Group by site, equipment
```

### Query Pattern for Equipment with Custom Names
```sql
-- Used throughout the system
SELECT 
    pem.site_code,
    pem.equipment_id,
    COALESCE(eno.display_name, pem.equipment_name) as equipment_name,
    pem.equipment_name as original_name,
    eno.display_name as custom_name,
    pem.equipment_type,
    pem.description
FROM performance_equipment_master pem
LEFT JOIN equipment_name_overrides eno 
    ON pem.site_code = eno.site_code 
    AND pem.equipment_id = eno.equipment_id
WHERE pem.site_code = $1
ORDER BY pem.equipment_id;
```

## 🐳 Docker Configuration

### Dockerfile Strategy

#### Backend (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y gcc postgresql-client curl
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8010
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010"]
```

#### Frontend (`frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
# Custom nginx config for SPA routing
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration (`compose.yaml`)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    container_name: ecc800-backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8010/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecc800-network

  frontend: 
    build: ./frontend
    container_name: ecc800-frontend
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecc800-network

  reverse-proxy:
    build: ./nginx
    container_name: ecc800-nginx
    ports:
      - "3344:443"
      - "8081:80"
    depends_on:
      - frontend
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ecc800-network

networks:
  ecc800-network:
    driver: bridge
```

## 🚀 Build & Deployment

### Build Script (`build_and_start.sh`)
```bash
#!/bin/bash
# Comprehensive build and deploy script

1. Environment Setup
   ├── Load .env configuration
   ├── Check Docker availability
   └── Validate ports

2. Cleanup Phase
   ├── Stop existing containers
   ├── Remove old containers/images
   └── Clean Docker resources

3. Build Phase
   ├── Build frontend assets (npm run build)
   ├── Build Docker images (parallel)
   └── Validate builds

4. Deploy Phase
   ├── Start backend (with health check)
   ├── Start frontend (with health check) 
   ├── Start reverse-proxy (with health check)
   └── Wait for all services

5. Verification Phase
   ├── Container status checks
   ├── API health endpoints
   ├── Database connectivity
   └── Equipment override system test
```

### Management Script (`manage.sh`)
```bash
# 12 management commands available:
./manage.sh status      # Container status
./manage.sh logs         # View logs  
./manage.sh restart      # Restart services
./manage.sh stop         # Stop all
./manage.sh test         # Run tests
./manage.sh health       # Health checks
./manage.sh build        # Rebuild images
./manage.sh clean        # Clean resources
./manage.sh backup       # Backup data
./manage.sh shell        # Access container shell
./manage.sh update       # Update system
./manage.sh monitor      # Real-time monitoring
```

## 🔧 Common Issues & Solutions

### 1. Query Object Parameter Error
**Error**: `Query(100) ('Query' object cannot be interpreted as an integer)`

**Root Cause**: FastAPI Query objects being passed to SQLAlchemy instead of actual values

**Fix Applied**: 
```python
# In routes/sites.py get_equipment()
limit_value = int(limit) if hasattr(limit, '__class__') and hasattr(limit, 'default') else limit
offset_value = int(offset) if hasattr(offset, '__class__') and hasattr(offset, 'default') else offset
q_value = str(q) if q and hasattr(q, '__class__') and hasattr(q, 'default') else q
```

### 2. AmbiguousParameterError in Reports
**Error**: `could not determine data type of parameter $2`

**Root Cause**: NULL parameters in SQL queries with `($2 IS NULL OR site_code = $2)`

**Fix Applied**:
```python
# Split queries based on parameter presence
if site_code:
    query = "... WHERE site_code = $2"  
    params = [from_time, site_code]
else:
    query = "... WHERE condition_without_site"
    params = [from_time]
```

### 3. SSL Certificate Warnings
**Issue**: Browser shows "Your connection is not private"

**Solution**: Click "Advanced" → "Proceed to 10.251.150.222 (unsafe)"

### 4. Container Health Check Failures
```bash
# Diagnose health issues
docker-compose ps                    # Check status
docker-compose logs backend         # Check logs
curl -k https://localhost:3344/ecc800/api/health  # Test endpoint
```

## 📊 Performance Metrics

### Database Performance
- **Equipment Master**: 25 records (fast lookup)
- **Name Overrides**: 8 records (instant lookup)  
- **Performance Data**: 500K+ records (indexed, partitioned)

### Response Time Goals
- Equipment listing: < 200ms
- Equipment details: < 500ms
- Reports generation: < 2000ms
- Health checks: < 100ms

### Optimization Strategies
1. **Database**: Proper indexing on lookup columns
2. **Frontend**: React.memo() for component caching
3. **Backend**: AsyncIO for concurrent processing  
4. **Queries**: LEFT JOIN patterns for optional data

## 🔐 Security Implementation

### Authentication
- JWT tokens with 1-hour expiry
- bcrypt password hashing (cost factor 12)
- HTTPS-only communication
- CORS restrictions

### Authorization Levels
```python
class UserRole(str, Enum):
    ADMIN = "admin"      # Full access + management
    ANALYST = "analyst"  # Read + reports
    VIEWER = "viewer"    # Read-only
```

### API Security Headers
```nginx
# In nginx.conf
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";
```

## 📝 Development Guidelines

### Code Style Standards
- **Python**: Black formatting, isort imports, type hints
- **TypeScript**: ESLint + Prettier, strict mode
- **SQL**: Uppercase keywords, meaningful table aliases

### Git Workflow
```bash
# Feature development
git checkout -b feature/equipment-enhancement
git commit -m "feat(equipment): add bulk name override"

# Bug fixes  
git checkout -b fix/query-parameter-error
git commit -m "fix(api): resolve Query object parameter issue"

# Documentation
git commit -m "docs(api): update equipment endpoint specs"
```

### Testing Strategy
```python
# Backend testing
pytest tests/                      # Unit tests
pytest tests/integration/         # Integration tests  

# Frontend testing
npm test                          # React component tests
npm run test:e2e                 # End-to-end tests

# System testing
./manage.sh test                 # Full system test
```

## 📈 Monitoring & Logging

### Health Check Endpoints
- `/health` - Basic backend health
- `/ecc800/api/health` - Full system health  
- `/ecc800/api/reports/summary` - Data statistics

### Log Locations
```bash
# Container logs
docker-compose logs backend      # FastAPI logs
docker-compose logs frontend     # Nginx access logs
docker-compose logs reverse-proxy # Reverse proxy logs

# Log levels: DEBUG → INFO → WARNING → ERROR → CRITICAL
```

### Key Metrics to Monitor
- API response times
- Database connection pool usage
- Container memory/CPU usage
- Error rates by endpoint
- User authentication success/failure

---

## 🔄 Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Data Visualization**: Advanced charts with ApexCharts
3. **Export Capabilities**: Excel/PDF report exports
4. **User Management**: Admin UI for user/role management
5. **Backup Automation**: Scheduled database backups
6. **Monitoring Dashboard**: Grafana integration

### Technical Debt
- Migrate from self-signed to proper SSL certificates
- Implement Redis caching for frequently accessed data
- Add comprehensive error tracking (Sentry)
- Database query optimization and indexing review

**Last Updated**: August 30, 2025  
**Version**: 2.0.0  
**Maintained by**: ECC800 Development Team
