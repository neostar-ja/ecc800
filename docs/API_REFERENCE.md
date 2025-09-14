# ECC800 API Reference

## 🔗 Base URL
```
https://10.251.150.222:3344/ecc800/api
```

## 🔐 Authentication

### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=Admin123!
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "username": "admin",
    "role": "admin",
    "full_name": "System Administrator"
  }
}
```

### Using the Token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🏢 Sites Management

### Get All Sites
```http
GET /sites
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "site_code": "DC",
    "site_name": "Data Center",
    "location": "Building A",
    "equipment_count": 20,
    "active_equipment": 18,
    "last_updated": "2025-08-30T10:30:00Z"
  },
  {
    "site_code": "DR", 
    "site_name": "Disaster Recovery",
    "location": "Building B",
    "equipment_count": 5,
    "active_equipment": 5,
    "last_updated": "2025-08-30T10:25:00Z"
  }
]
```

### Get Site Details
```http
GET /sites/{site_code}
Authorization: Bearer {token}
```

**Parameters:**
- `site_code` (required): Site identifier (DC, DR)

## 🖥️ Equipment Management

### Get Equipment List
```http
GET /sites/{site_code}/equipment
Authorization: Bearer {token}
```

**Query Parameters:**
- `search` (optional): Search term for equipment names
- `limit` (optional): Number of results (default: 100, max: 1000)
- `offset` (optional): Starting position (default: 0)

**Example:**
```http
GET /sites/DC/equipment?search=server&limit=50&offset=0
```

**Response:**
```json
[
  {
    "site_code": "DC",
    "equipment_id": "EQ001", 
    "equipment_name": "เซิร์ฟเวอร์หลัก #1",
    "original_name": "Server-001",
    "custom_name": "เซิร์ฟเวอร์หลัก #1",
    "equipment_type": "Server",
    "description": "Primary application server",
    "status": "online",
    "metrics_count": 15,
    "total_records": 24750,
    "latest_data": "2025-08-30T10:45:00Z",
    "first_data": "2025-01-15T08:00:00Z",
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-08-30T09:30:00Z"
  }
]
```

### Get Equipment Details
```http
GET /equipment/{site_code}/{equipment_id}/details
Authorization: Bearer {token}
```

**Example:**
```http
GET /equipment/DC/EQ001/details
```

**Response:**
```json
{
  "equipment": {
    "site_code": "DC",
    "equipment_id": "EQ001",
    "equipment_name": "เซิร์ฟเวอร์หลัก #1",
    "original_name": "Server-001",
    "custom_name": "เซิร์ฟเวอร์หลัก #1",
    "equipment_type": "Server",
    "description": "Primary application server",
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-08-30T09:30:00Z",
    "metrics_count": 15,
    "total_records": 24750,
    "latest_data": "2025-08-30T10:45:00Z",
    "first_data": "2025-01-15T08:00:00Z"
  },
  "metrics": [
    {
      "metric_name": "CPU_Usage",
      "unit": "%",
      "data_type": "numeric",
      "data_points": 1440,
      "first_reading": "2025-01-15T08:00:00Z",
      "latest_reading": "2025-08-30T10:45:00Z",
      "avg_value": 35.2,
      "min_value": 15.0,
      "max_value": 89.5
    },
    {
      "metric_name": "Temperature",
      "unit": "°C", 
      "data_type": "numeric",
      "data_points": 1440,
      "avg_value": 42.8,
      "min_value": 38.2,
      "max_value": 58.1
    }
  ],
  "recent_data": [
    {
      "metric": "CPU_Usage",
      "timestamp": "2025-08-30T10:45:00Z",
      "value_numeric": 42.5,
      "unit": "%"
    },
    {
      "metric": "Temperature", 
      "timestamp": "2025-08-30T10:45:00Z",
      "value_numeric": 43.2,
      "unit": "°C"
    }
  ]
}
```

### Update Equipment Name
```http
PUT /equipment/{site_code}/{equipment_id}/name
Authorization: Bearer {token}
Content-Type: application/json

{
  "display_name": "เซิร์ฟเวอร์หลักใหม่ #1"
}
```

**Response:**
```json
{
  "success": true,
  "site_code": "DC",
  "equipment_id": "EQ001", 
  "display_name": "เซิร์ฟเวอร์หลักใหม่ #1",
  "updated_by": "admin",
  "updated_at": "2025-08-30T10:50:00Z"
}
```

## 📊 Reports & Analytics

### System Summary Report
```http
GET /reports/summary
Authorization: Bearer {token}
```

**Query Parameters:**
- `site_code` (optional): Filter by specific site

**Response:**
```json
{
  "report_type": "system_summary",
  "generated_at": "2025-08-30T10:50:00Z",
  "time_range": {
    "from": "2025-01-15T00:00:00Z",
    "to": "2025-08-30T10:50:00Z"
  },
  "general_stats": {
    "total_sites": 2,
    "total_equipment": 25,
    "total_metrics": 45,
    "total_records": 547280,
    "earliest_data": "2025-01-15T08:00:00Z",
    "latest_data": "2025-08-30T10:45:00Z"
  },
  "site_stats": [
    {
      "site_code": "DC",
      "equipment_count": 20,
      "metric_count": 38,
      "record_count": 438624,
      "latest_update": "2025-08-30T10:45:00Z"
    },
    {
      "site_code": "DR",
      "equipment_count": 5, 
      "metric_count": 7,
      "record_count": 108656,
      "latest_update": "2025-08-30T10:40:00Z"
    }
  ],
  "popular_metrics": [
    {
      "metric_name": "Temperature",
      "unit": "°C",
      "data_count": 36000,
      "equipment_count": 18,
      "avg_value": 41.2
    },
    {
      "metric_name": "Humidity",
      "unit": "%RH", 
      "data_count": 30240,
      "equipment_count": 15,
      "avg_value": 55.8
    }
  ]
}
```

### Temperature Report
```http
GET /reports/temperature
Authorization: Bearer {token}
```

**Query Parameters:**
- `site_code` (optional): Filter by site
- `hours` (optional): Hours to look back (default: 24)

**Example:**
```http
GET /reports/temperature?site_code=DC&hours=48
```

**Response:**
```json
{
  "report_type": "temperature",
  "generated_at": "2025-08-30T10:50:00Z",
  "parameters": {
    "site_code": "DC",
    "hours": 48,
    "from_time": "2025-08-28T10:50:00Z"
  },
  "temperature_data": [
    {
      "site_code": "DC",
      "equipment_id": "EQ001",
      "metric_name": "Temperature",
      "unit": "°C",
      "data_points": 96,
      "avg_temp": 42.8,
      "min_temp": 38.2,
      "max_temp": 48.1,
      "std_temp": 2.4,
      "earliest_reading": "2025-08-28T10:50:00Z",
      "latest_reading": "2025-08-30T10:45:00Z"
    }
  ],
  "site_summary": {
    "DC": {
      "equipment_count": 18,
      "avg_temperature": 41.8,
      "min_temperature": 35.2,
      "max_temperature": 52.1,
      "total_data_points": 1728
    }
  }
}
```

## 🏥 System Health

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-30T10:50:00Z",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "response_time_ms": 15
  },
  "services": {
    "auth": "healthy",
    "equipment": "healthy", 
    "reports": "healthy"
  }
}
```

## ❌ Error Handling

### Error Response Format
```json
{
  "detail": "Error message in Thai/English",
  "error_code": "EQUIPMENT_NOT_FOUND",
  "timestamp": "2025-08-30T10:50:00Z",
  "path": "/equipment/DC/INVALID001/details"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `422` - Validation Error (invalid request body)
- `500` - Internal Server Error

### Common Error Examples

#### Authentication Error
```json
HTTP 401 Unauthorized
{
  "detail": "ไม่สามารถยืนยันตัวตนได้"
}
```

#### Equipment Not Found
```json
HTTP 404 Not Found
{
  "detail": "ไม่พบอุปกรณ์ที่ระบุ",
  "error_code": "EQUIPMENT_NOT_FOUND"
}
```

#### Validation Error
```json
HTTP 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "display_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## 🔍 Query Examples

### cURL Examples

#### Login and Get Equipment
```bash
# Login
TOKEN=$(curl -s -k -X POST "https://10.251.150.222:3344/ecc800/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=Admin123!" | jq -r '.access_token')

# Get equipment list
curl -s -k "https://10.251.150.222:3344/ecc800/api/sites/DC/equipment" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get specific equipment details
curl -s -k "https://10.251.150.222:3344/ecc800/api/equipment/DC/EQ001/details" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

#### Update Equipment Name
```bash
curl -s -k -X PUT "https://10.251.150.222:3344/ecc800/api/equipment/DC/EQ001/name" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "ชื่อใหม่สำหรับทดสอบ"}' | jq '.'
```

### JavaScript/Fetch Examples

```javascript
// Login
const loginResponse = await fetch('/ecc800/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'admin',
    password: 'Admin123!'
  })
});

const { access_token } = await loginResponse.json();

// Get equipment
const equipmentResponse = await fetch('/ecc800/api/sites/DC/equipment', {
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});

const equipment = await equipmentResponse.json();

// Update equipment name
const updateResponse = await fetch('/ecc800/api/equipment/DC/EQ001/name', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display_name: 'ชื่อใหม่'
  })
});
```

## 📝 Rate Limits

Current rate limits (per user):
- Authentication endpoints: 5 requests/minute
- Equipment endpoints: 100 requests/minute  
- Report endpoints: 20 requests/minute
- Health endpoints: No limit

## 🔄 Pagination

For endpoints returning lists (like equipment), use:
- `limit`: Number of items per page (max 1000)
- `offset`: Starting position

**Example:**
```http
GET /sites/DC/equipment?limit=50&offset=100
```

**Response includes pagination info:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "offset": 100, 
    "total": 250,
    "has_next": true,
    "has_prev": true
  }
}
```

---

## 📞 Support

For API support and issues:
- **Swagger UI**: https://10.251.150.222:3344/ecc800/docs
- **ReDoc**: https://10.251.150.222:3344/ecc800/redoc

**Last Updated**: August 30, 2025
