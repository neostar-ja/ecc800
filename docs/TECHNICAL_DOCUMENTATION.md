# ECC800 Enhanced Metrics - Technical Documentation

## Technical Implementation Guide

**Version:** 2.0.0  
**Date:** August 31, 2025  
**Authors:** ECC800 Development Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend API Specification](#backend-api-specification)
4. [Frontend Architecture](#frontend-architecture)
5. [Security Implementation](#security-implementation)
6. [Performance Optimization](#performance-optimization)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/TS)    │───▶│   (FastAPI)     │───▶│  (PostgreSQL/   │
│                 │    │                 │    │   TimescaleDB)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
    ┌───▼───┐                ┌───▼───┐                ┌───▼───┐
    │  Nginx│                │ Auth  │                │ Views │
    │Reverse│                │Service│                │ &     │
    │ Proxy │                │       │                │Indexes│
    └───────┘                └───────┘                └───────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Material-UI v5
- React Query (TanStack Query)
- React Router v6
- Recharts for data visualization

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy (Async)
- Pydantic v2
- JWT Authentication
- Alembic for migrations

**Database:**
- PostgreSQL 14+
- TimescaleDB extension
- Connection pooling
- Query optimization

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- SSL/TLS certificates
- Health checks

---

## Database Schema

### Core Tables

#### performance_data (Hypertable)

```sql
CREATE TABLE performance_data (
    id BIGSERIAL PRIMARY KEY,
    site_code VARCHAR(10) NOT NULL,
    equipment_name VARCHAR(255),
    equipment_id VARCHAR(50) NOT NULL,
    performance_data VARCHAR(255) NOT NULL, -- Metric name
    statistical_period VARCHAR(50),
    statistical_start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    value_text VARCHAR(255),
    value_numeric NUMERIC,
    unit VARCHAR(50),
    data_type VARCHAR(50),
    source_file VARCHAR(500),
    import_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_hash VARCHAR(64),
    time TIMESTAMP WITH TIME ZONE, -- TimescaleDB time column
    value NUMERIC -- Alternative value column
);

-- Convert to hypertable
SELECT create_hypertable('performance_data', 'statistical_start_time');

-- Indexes for performance
CREATE INDEX idx_performance_data_site_equipment_metric 
ON performance_data (site_code, equipment_id, performance_data, statistical_start_time DESC);

CREATE INDEX idx_performance_data_time_metric 
ON performance_data (statistical_start_time DESC, performance_data);
```

#### equipment_aliases

```sql
CREATE TABLE equipment_aliases (
    id SERIAL PRIMARY KEY,
    site_code VARCHAR(10) NOT NULL,
    equipment_id VARCHAR(50) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    alias_name VARCHAR(255) NOT NULL,
    scope TEXT,
    updated_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_equipment_alias UNIQUE (site_code, equipment_id)
);
```

### Continuous Aggregates (MaterializedViews)

#### Hourly Performance Aggregates

```sql
CREATE MATERIALIZED VIEW cagg_perf_5m_to_1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', statistical_start_time) AS bucket,
    site_code,
    equipment_id,
    performance_data,
    unit,
    AVG(value_numeric) AS avg_value,
    MIN(value_numeric) AS min_value,
    MAX(value_numeric) AS max_value,
    COUNT(*) AS data_points
FROM performance_data
WHERE value_numeric IS NOT NULL
GROUP BY bucket, site_code, equipment_id, performance_data, unit;
```

#### Daily Performance Aggregates

```sql
CREATE MATERIALIZED VIEW cagg_perf_1h_to_1d  
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', statistical_start_time) AS bucket,
    site_code,
    equipment_id,
    performance_data,
    unit,
    AVG(value_numeric) AS avg_value,
    MIN(value_numeric) AS min_value,
    MAX(value_numeric) AS max_value,
    COUNT(*) AS data_points
FROM performance_data
WHERE value_numeric IS NOT NULL
GROUP BY bucket, site_code, equipment_id, performance_data, unit;
```

---

## Backend API Specification

### Enhanced Metrics Endpoints

#### GET /api/enhanced-metrics

Get categorized metrics with metadata.

**Parameters:**
- `site_code` (optional): Filter by site
- `equipment_id` (optional): Filter by equipment

**Response:**
```json
[
  {
    "name": "environmental",
    "display_name": "สิ่งแวดล้อม",
    "icon": "🌡️",
    "color": "#4caf50",
    "description": "Environmental sensors and readings",
    "metrics": [
      {
        "metric_name": "Temperature (℃)",
        "display_name": "Temperature (℃)",
        "unit": "℃",
        "data_points": 50694,
        "first_seen": "2025-08-16T20:45:00",
        "last_seen": "2025-08-29T10:00:00",
        "category": "environmental",
        "description": "Temperature measurement",
        "icon": "🌡️",
        "color": "#f44336"
      }
    ]
  }
]
```

#### GET /api/metric/{metric_name}/details

Get detailed metric analysis with time-series data.

**Parameters:**
- `metric_name` (required): URL-encoded metric name
- `site_code` (required): Site identifier
- `equipment_id` (required): Equipment identifier
- `period` (optional): Time period (1h, 4h, 24h, 3d, 7d, 30d, custom)
- `start_time` (optional): Custom start time
- `end_time` (optional): Custom end time
- `interval` (optional): Aggregation interval (auto, 5m, 1h, 1d)

**Response:**
```json
{
  "metric": {
    "metric_name": "Temperature (℃)",
    "display_name": "Temperature (℃)",
    "unit": "℃",
    "data_points": 1440,
    "category": "environmental",
    "icon": "🌡️",
    "color": "#f44336"
  },
  "statistics": {
    "min": 22.5,
    "max": 25.8,
    "avg": 24.1,
    "median": 24.0,
    "std_dev": 0.8,
    "count": 1440,
    "latest": 24.3,
    "trend": "stable"
  },
  "data_points": [
    {
      "timestamp": "2025-08-29T10:00:00",
      "value": 24.3,
      "unit": "℃"
    }
  ],
  "time_range": {
    "from": "2025-08-28T10:00:00",
    "to": "2025-08-29T10:00:00",
    "interval": "5 minutes"
  }
}
```

### SQL Query Patterns

#### Metric Categorization

```python
def categorize_metric(metric_name: str, unit: str) -> Dict[str, str]:
    """Categorize metrics based on name and unit"""
    metric_lower = metric_name.lower()
    
    if 'temperature' in metric_lower or '℃' in unit:
        return {
            'category': 'environmental',
            'display_name': 'อุณหภูมิ',
            'icon': '🌡️',
            'color': '#f44336'
        }
    elif 'current' in metric_lower or unit == 'A':
        return {
            'category': 'electrical',
            'display_name': 'กระแสไฟฟ้า',
            'icon': '⚡',
            'color': '#ff9800'
        }
    # ... more categories
```

#### Time-series Query with Bucketing

```sql
SELECT 
    time_bucket(INTERVAL '1 hour', statistical_start_time) AS timestamp,
    AVG(value_numeric)::float8 AS value,
    ANY_VALUE(unit) AS unit
FROM performance_data
WHERE site_code = :site_code
  AND equipment_id = :equipment_id
  AND performance_data = :metric_name
  AND statistical_start_time >= :from_time
  AND statistical_start_time <= :to_time
  AND value_numeric IS NOT NULL
GROUP BY timestamp
ORDER BY timestamp;
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── Layout.tsx                 # Main app layout
│   ├── TimeSeriesChart.tsx        # Chart component
│   └── common/                    # Reusable components
├── pages/
│   ├── EnhancedMetricsPage.tsx    # Main metrics page
│   └── MetricsPage.tsx            # Legacy page
├── lib/
│   ├── api.ts                     # API client
│   ├── hooks.ts                   # React Query hooks
│   └── types.ts                   # TypeScript types
├── stores/
│   └── authStore.ts               # Zustand auth store
└── theme/
    └── index.ts                   # Material-UI theme
```

### State Management

#### Authentication Store (Zustand)

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  login: async (credentials) => {
    const response = await api.login(credentials);
    set({
      isAuthenticated: true,
      user: response.user,
      token: response.access_token
    });
  },
  logout: () => set({ isAuthenticated: false, user: null, token: null })
}));
```

#### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Custom Hooks

#### Enhanced Metrics Hook

```typescript
export function useEnhancedMetrics(
  siteCode?: string,
  equipmentId?: string,
  options?: UseQueryOptions<MetricCategory[]>
) {
  return useQuery({
    queryKey: ['enhanced-metrics', siteCode, equipmentId],
    queryFn: () => apiGet<MetricCategory[]>('/enhanced-metrics', {
      site_code: siteCode,
      equipment_id: equipmentId,
    }),
    enabled: !!siteCode,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}
```

### Component Design Patterns

#### Metric Card Component

```typescript
interface MetricCardProps {
  metric: MetricInfo;
  onClick: (metricName: string) => void;
  hover?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick, hover = true }) => {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(metric.color, 0.3)}`,
        '&:hover': hover ? {
          transform: 'translateY(-6px)',
          boxShadow: `0 8px 25px ${alpha(metric.color, 0.3)}`,
          borderColor: metric.color,
        } : {},
      }}
      onClick={() => onClick(metric.metric_name)}
    >
      <CardContent>
        {/* Card content */}
      </CardContent>
    </Card>
  );
};
```

---

## Security Implementation

### Authentication Flow

1. **Login Request:** Username/password sent to `/api/auth/login`
2. **Token Generation:** JWT token with user claims
3. **Token Storage:** Stored in localStorage (with expiration)
4. **Request Authorization:** Bearer token in Authorization header
5. **Token Validation:** Server validates JWT on each request

### JWT Configuration

```python
# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

### Authorization Middleware

```python
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return user
```

### Input Validation

```python
from pydantic import BaseModel, validator

class MetricDetailsRequest(BaseModel):
    site_code: str
    equipment_id: str
    period: str = "24h"
    
    @validator('period')
    def validate_period(cls, v):
        allowed = ['1h', '4h', '24h', '3d', '7d', '30d', 'custom']
        if v not in allowed:
            raise ValueError(f'Period must be one of {allowed}')
        return v
```

---

## Performance Optimization

### Database Optimization

#### Index Strategy

```sql
-- Primary indexes for common queries
CREATE INDEX CONCURRENTLY idx_perf_site_equip_metric_time 
ON performance_data (site_code, equipment_id, performance_data, statistical_start_time DESC);

-- Partial indexes for non-null values
CREATE INDEX CONCURRENTLY idx_perf_numeric_values 
ON performance_data (statistical_start_time DESC) 
WHERE value_numeric IS NOT NULL;

-- Composite index for aggregation queries
CREATE INDEX CONCURRENTLY idx_perf_agg 
ON performance_data (site_code, equipment_id, performance_data, statistical_start_time)
WHERE value_numeric IS NOT NULL;
```

#### Query Optimization

```python
# Use prepared statements for repeated queries
METRIC_DETAILS_QUERY = """
WITH metric_stats AS (
    SELECT 
        performance_data,
        COUNT(*) as total_readings,
        AVG(value_numeric) as avg_value,
        MIN(value_numeric) as min_value,
        MAX(value_numeric) as max_value,
        STDDEV(value_numeric) as std_dev,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value_numeric) as median_value
    FROM performance_data
    WHERE site_code = $1 
      AND equipment_id = $2 
      AND performance_data = $3
      AND statistical_start_time >= $4
      AND statistical_start_time <= $5
      AND value_numeric IS NOT NULL
    GROUP BY performance_data
)
SELECT * FROM metric_stats;
"""
```

#### Connection Pooling

```python
# SQLAlchemy async engine with connection pooling
engine = create_async_engine(
    database_url,
    pool_size=10,          # Base connections
    max_overflow=20,       # Additional connections
    pool_pre_ping=True,    # Validate connections
    pool_recycle=300,      # Recycle every 5 minutes
    echo=False             # Disable query logging in production
)
```

### Frontend Optimization

#### Code Splitting

```typescript
// Lazy load heavy components
const EnhancedMetricsPage = lazy(() => import('./pages/EnhancedMetricsPage'));

// Route-based code splitting
<Routes>
  <Route path="/metrics" element={
    <Suspense fallback={<CircularProgress />}>
      <EnhancedMetricsPage />
    </Suspense>
  } />
</Routes>
```

#### Query Optimization

```typescript
// Efficient data fetching with React Query
const { data, isLoading } = useQuery({
  queryKey: ['metrics', siteCode, equipmentId],
  queryFn: () => fetchMetrics(siteCode, equipmentId),
  staleTime: 5 * 60 * 1000,        // 5 minutes
  cacheTime: 10 * 60 * 1000,       // 10 minutes
  refetchOnWindowFocus: false,
  enabled: !!(siteCode && equipmentId)
});
```

#### Memoization

```typescript
// Memo expensive calculations
const chartData = useMemo(() => {
  return rawData?.map(point => ({
    timestamp: point.timestamp,
    value: parseFloat(point.value),
    label: `${point.value} ${point.unit}`
  })) || [];
}, [rawData]);

// Memo components to prevent re-renders
const MetricCard = memo(({ metric, onClick }) => {
  return (
    <Card onClick={() => onClick(metric.name)}>
      {/* Card content */}
    </Card>
  );
});
```

---

## Testing Strategy

### Backend Testing

#### Unit Tests

```python
import pytest
from app.routers.enhanced_metrics import categorize_metric

def test_categorize_metric_temperature():
    result = categorize_metric("Temperature (℃)", "℃")
    assert result['category'] == 'environmental'
    assert result['icon'] == '🌡️'

def test_categorize_metric_current():
    result = categorize_metric("1QF1 current(L1)", "A")
    assert result['category'] == 'electrical'
    assert result['icon'] == '⚡'

@pytest.mark.asyncio
async def test_get_enhanced_metrics():
    response = await client.get("/api/enhanced-metrics?site_code=dc")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
```

#### Integration Tests

```python
@pytest.mark.asyncio
async def test_metric_details_endpoint():
    # Test with valid parameters
    response = await client.get(
        "/api/metric/Temperature%20(%E2%84%83)/details",
        params={
            "site_code": "dc",
            "equipment_id": "0x01",
            "period": "24h"
        }
    )
    assert response.status_code == 200
    data = response.json()
    
    # Validate response structure
    assert "metric" in data
    assert "statistics" in data
    assert "data_points" in data
    assert "time_range" in data
```

### Frontend Testing

#### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MetricCard from '../components/MetricCard';

const mockMetric = {
  metric_name: 'Temperature (℃)',
  display_name: 'Temperature (℃)',
  unit: '℃',
  data_points: 1000,
  category: 'environmental',
  icon: '🌡️',
  color: '#f44336'
};

test('MetricCard renders correctly', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  render(
    <QueryClientProvider client={queryClient}>
      <MetricCard metric={mockMetric} onClick={jest.fn()} />
    </QueryClientProvider>
  );
  
  expect(screen.getByText('Temperature (℃)')).toBeInTheDocument();
  expect(screen.getByText('℃')).toBeInTheDocument();
});

test('MetricCard onClick works', () => {
  const handleClick = jest.fn();
  
  render(<MetricCard metric={mockMetric} onClick={handleClick} />);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledWith('Temperature (℃)');
});
```

#### E2E Tests (Cypress)

```typescript
describe('Enhanced Metrics Page', () => {
  beforeEach(() => {
    cy.login('admin', 'admin123');
    cy.visit('/metrics');
  });

  it('should display metrics after selecting site and equipment', () => {
    // Select site
    cy.get('[data-testid="site-select"]').click();
    cy.get('[data-value="dc"]').click();
    
    // Select equipment
    cy.get('[data-testid="equipment-select"]').click();
    cy.get('[data-value="0x01"]').click();
    
    // Check if metrics are displayed
    cy.get('[data-testid="metric-category"]').should('exist');
    cy.get('[data-testid="metric-card"]').should('have.length.greaterThan', 0);
  });

  it('should open metric details dialog', () => {
    cy.selectSiteAndEquipment('dc', '0x01');
    
    // Click on first metric card
    cy.get('[data-testid="metric-card"]').first().click();
    
    // Check if dialog opens
    cy.get('[data-testid="metric-details-dialog"]').should('be.visible');
    cy.get('[data-testid="metric-statistics"]').should('exist');
    cy.get('[data-testid="metric-chart"]').should('exist');
  });
});
```

---

## Deployment Guide

### Development Environment

#### Requirements
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ with TimescaleDB
- Docker & Docker Compose

#### Setup Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd ecc800

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Start services with Docker Compose
docker-compose up -d

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Create initial admin user
docker-compose exec backend python scripts/create_admin.py
```

### Production Deployment

#### Docker Compose Configuration

```yaml
version: '3.8'
services:
  backend:
    image: ecc800-backend:latest
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/ecc800
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=https://yourdomain.com
    depends_on:
      - db
    restart: unless-stopped
    
  frontend:
    image: ecc800-frontend:latest
    environment:
      - VITE_API_BASE=/ecc800/api
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    
  db:
    image: timescale/timescaledb:latest-pg14
    environment:
      - POSTGRES_DB=ecc800
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
volumes:
  postgres_data:
```

#### SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location /ecc800/api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ecc800/ {
        proxy_pass http://frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Health Checks

```python
@app.get("/health")
async def health_check():
    try:
        # Check database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "version": "2.0.0"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Health check failed: {str(e)}"
        )
```

#### Monitoring

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### Backup Strategy

#### Database Backup

```bash
#!/bin/bash
# backup_db.sh

DB_NAME="ecc800"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
docker-compose exec -T db pg_dump -U postgres $DB_NAME | \
    gzip > "$BACKUP_DIR/ecc800_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "ecc800_backup_*.sql.gz" -mtime +7 -delete
```

#### Application Backup

```bash
#!/bin/bash
# backup_app.sh

BACKUP_DIR="/backups/app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup configuration and certificates
tar -czf "$BACKUP_DIR/app_config_$TIMESTAMP.tar.gz" \
    .env nginx.conf certs/ docs/

# Keep only last 30 days
find $BACKUP_DIR -name "app_config_*.tar.gz" -mtime +30 -delete
```

---

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Database Maintenance**
   - Vacuum and analyze tables weekly
   - Update statistics monthly  
   - Monitor index usage
   - Archive old data (>1 year)

2. **Application Updates**
   - Security patches monthly
   - Dependency updates quarterly
   - Feature releases as needed
   - Documentation updates

3. **Performance Monitoring**
   - Query performance analysis
   - Resource usage monitoring
   - Error rate tracking
   - User experience metrics

### Upgrade Procedures

#### Backend Upgrade

```bash
# 1. Backup current version
docker-compose exec backend pg_dump ecc800 > backup.sql

# 2. Stop services
docker-compose down

# 3. Update images
docker-compose pull

# 4. Run migrations
docker-compose up -d db
docker-compose run --rm backend alembic upgrade head

# 5. Start all services
docker-compose up -d

# 6. Verify health
curl -f http://localhost:8000/health || echo "Health check failed"
```

#### Frontend Upgrade

```bash
# 1. Build new frontend
docker build -t ecc800-frontend:new ./frontend/

# 2. Test new build
docker run -d --name test-frontend ecc800-frontend:new
# ... run tests ...

# 3. Deploy if tests pass
docker-compose down frontend
docker tag ecc800-frontend:new ecc800-frontend:latest
docker-compose up -d frontend
```

---

This technical documentation provides a comprehensive guide for developers and system administrators working with the ECC800 Enhanced Metrics system. It covers all aspects from architecture to deployment and maintenance.

For additional information or support, please refer to:

- **API Documentation:** `/docs` endpoint
- **Development Guide:** `DEVELOPMENT.md`
- **User Manual:** `USER_GUIDE.md`
- **Support:** Contact the ECC800 development team

**© 2025 ECC800 Development Team**
