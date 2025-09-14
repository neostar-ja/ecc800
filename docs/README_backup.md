# ECC800 Data Center Monitoring System - Documentation

ระบบติดตามศูนย์ข้อมูล ECC800 สำหรับโรงพยาบาลวิภาวดี

## 🚀 Quick Start

### การเข้าถึงระบบ
- **URL หลัก**: https://10.251.150.222:3344/ecc800/
- **หน้าจัดการอุปกรณ์**: https://10.251.150.222:3344/ecc800/equipment
- **API Documentation**: https://10.251.150.222:3344/ecc800/docs
- **System Health**: https://10.251.150.222:3344/ecc800/api/health

### บัญชีผู้ใช้เริ่มต้น
| ระดับ | Username | Password | สิทธิ์ |
|-------|----------|----------|--------|
| � Administrator | `admin` | `Admin123!` | ทุกอย่าง |
| � Data Analyst | `analyst` | `Analyst123!` | ดูและวิเคราะห์ |
| 👁️ Read-Only | `viewer` | `Viewer123!` | ดูอย่างเดียว |
- ⚠️ **Fault Monitoring** - ติดตาม fault และ alerts
## 🏗️ การติดตั้งและ Deploy

### วิธีใช้ Build Script
```bash
cd /opt/code/ecc800/ecc800
./build_and_start.sh
```

Script จะทำงาน:
1. 🛑 หยุด containers เก่า
2. 🧹 ทำความสะอาด Docker resources
3. 📦 Build frontend assets
4. 🐳 Build Docker images
5. 🚀 เริ่มต้น services ทั้งหมด
6. 🏥 ตรวจสอบสุขภาพระบบ

### การใช้งาน Management Script
```bash
# ดูสถานะ containers
./manage.sh status

# ตรวจสอบ logs
./manage.sh logs backend
./manage.sh logs frontend

# ทดสอบระบบ
./manage.sh test

# รีสตาร์ทระบบ
./manage.sh restart
```

## 📊 ฟีเจอร์หลัก

### 1. Equipment Management (จัดการอุปกรณ์)
- ✅ ดูรายการอุปกรณ์แบบ Real-time
- ✅ ค้นหาและกรองอุปกรณ์
- ✅ ระบบตั้งชื่อเองสำหรับอุปกรณ์ (Custom Naming)
- ✅ ดูรายละเอียดอุปกรณ์แบบ 3-Tab Interface:
  - **Overview**: ข้อมูลทั่วไป
  - **Metrics**: ตัวชี้วัดและสถิติ
  - **Recent Data**: ข้อมูลล่าสุด

### 2. Equipment Name Override System
ระบบที่ช่วยให้สามารถตั้งชื่อแสดงผลใหม่ให้กับอุปกรณ์:
- จัดเก็บในตาราง `equipment_name_overrides`
- รองรับการแก้ไขชื่อแบบ Real-time
- แสดงทั้งชื่อเดิมและชื่อที่กำหนดเอง

### 3. Responsive Design
- 📱 รองรับการใช้งานบน Mobile และ Tablet
- 🎨 ใช้ Material-UI Design System
- 🌙 รองรับ Dark/Light Theme
- ⚡ Performance Optimization

## 🛠️ Technical Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: FastAPI + Python 3.11
- **Database**: PostgreSQL with AsyncPG
- **ORM**: SQLAlchemy 2.0 (async)
- **Authentication**: JWT with Passlib
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Pytest + AsyncIO

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with SSL
- **Process Management**: Docker Health Checks
- **Monitoring**: System Health Endpoints

### ขั้นตอนการติดตั้ง

1. **Clone หรือ extract project**
   ```bash
   cd /opt/code/ecc800/ecc800
   ```

2. **ตั้งค่า Environment Variables**
   
   แก้ไขไฟล์ `.env`:
   ```bash
   # ฐานข้อมูล PostgreSQL + TimescaleDB
   POSTGRES_HOST=10.251.150.222
   POSTGRES_PORT=5210
   POSTGRES_DB=ecc800
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   
   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_HOURS=24
   
   # แอปพลิเคชัน
   APP_BASE_PATH=/ecc800
   PUBLIC_BASE_URL=https://10.251.150.222:3344/ecc800
   ```

3. **รันระบบ**
   ```bash
   # Development
   chmod +x scripts/dev_run.sh
   ./scripts/dev_run.sh
   
   # หรือ Production
   chmod +x scripts/prod_run.sh
   ./scripts/prod_run.sh
   ```

4. **เข้าถึงระบบ**
   - URL: https://10.251.150.222:3344/ecc800/
   - เบราว์เซอร์จะเตือนเรื่อง certificate คลิก "Advanced" → "Proceed"

### บัญชีผู้ใช้เริ่มต้น

| Username | Password | Role | สิทธิ์ |
|----------|----------|------|-------|
| admin | Admin123! | admin | ทุกอย่าง + จัดการระบบ |
| analyst | Analyst123! | analyst | ดูข้อมูล + รายงาน |
| viewer | Viewer123! | viewer | ดูข้อมูลเท่านั้น |

## การใช้งาน

### 1. Dashboard
- ภาพรวมสถานะ DC และ DR
- KPI cards (อุณหภูมิ, ความชื้น, พลังงาน)
- กราฟ real-time trends
- สถิติ faults และ equipment

### 2. Sites Management
- รายการศูนย์ข้อมูลทั้งหมด
- สถิติแต่ละไซต์
- สถานะการทำงาน

### 3. Equipment Management  
- รายการอุปกรณ์ทั้งหมด
- ค้นหาตามชื่อหรือรหัส
- ชื่อแทน (display name) จาก admin
- กรองตาม site

### 4. Metrics & Trends
- เลือก site, equipment, metric
- กำหนดช่วงเวลา
- Auto interval (5m/1h/1d)
- Export ข้อมูล

### 5. Fault Monitoring
- รายการ faults ตามช่วงเวลา
- กรองตาม site/equipment
- Timeline view

### 6. Reports
- รายงาน KPI ตาม period
- สถิติอุณหภูมิ, ความชื้น, พลังงาน
- Export PDF/CSV

### 7. Admin Panel (Admin เท่านั้น)
- จัดการชื่อแทนอุปกรณ์
- Refresh Continuous Aggregates
- จัดการผู้ใช้ (ถ้าต้องการ)

## API Documentation

เมื่อรันระบบแล้ว เข้าถึง OpenAPI docs ได้ที่:
- https://10.251.150.222:3344/ecc800/docs
- https://10.251.150.222:3344/ecc800/redoc

## Database Schema

ระบบใช้ TimescaleDB hypertables ที่มีอยู่:
- `performance_data` - ข้อมูล performance metrics
- `fault_performance_data` - ข้อมูล fault events
- `equipment` - ข้อมูลอุปกรณ์
- `data_centers` - ข้อมูลศูนย์ข้อมูล
- `equipment_aliases` - ชื่อแทนอุปกรณ์
- `users` - ผู้ใช้งานระบบ

### Continuous Aggregates (CAGG)
- `cagg_perf_5m_to_1h` - ข้อมูล 5 นาที → 1 ชั่วโมง
- `cagg_perf_1h_to_1d` - ข้อมูล 1 ชั่วโมง → 1 วัน  
- `cagg_fault_hourly` - สรุป fault รายชั่วโมง
- `cagg_fault_daily` - สรุป fault รายวัน

## คำสั่งที่เป็นประโยชน์

```bash
# ดูสถานะ containers
docker compose ps

# ดู logs
docker compose logs -f
docker compose logs backend
docker compose logs frontend  
docker compose logs reverse-proxy

# รีสตาร์ท service
docker compose restart backend
docker compose restart frontend
docker compose restart reverse-proxy

# หยุดระบบ
docker compose down

# ลบทั้งหมดเพื่อเริ่มใหม่
docker compose down --rmi local --volumes
docker system prune -af

# เข้าไปใน container
docker exec -it ecc800-backend bash
docker exec -it ecc800-nginx ash

# ดู resource usage
docker stats

# Backup database (ถ้าจำเป็น)
docker exec -it ecc800-backend pg_dump -h POSTGRES_HOST -U POSTGRES_USER -d ecc800 > backup.sql
```

## การ Troubleshooting

### 1. Container ไม่เริ่มต้น
```bash
# ดู logs เพื่อหาสาเหตุ
docker compose logs [service_name]

# ตรวจสอบ ports ที่ใช้
netstat -tlnp | grep :3344
netstat -tlnp | grep :8080

# ลบและสร้างใหม่
docker compose down --volumes
docker compose build --no-cache
docker compose up -d
```

### 2. Database connection error
```bash
# ทดสอบการเชื่อมต่อ database
docker exec -it ecc800-backend python -c "
import asyncio
import asyncpg
async def test(): 
    conn = await asyncpg.connect('postgresql://USER:PASS@HOST:PORT/DB')
    result = await conn.fetchval('SELECT version()') 
    print(result)
asyncio.run(test())
"
```

### 3. Certificate issues
```bash
# สร้าง certificate ใหม่
rm -rf certs/*
./scripts/gen_cert.sh
docker compose restart reverse-proxy
```

### 4. Frontend ไม่โหลด
```bash
# Rebuild frontend
docker compose stop frontend
docker compose build frontend --no-cache
docker compose start frontend
```

## การพัฒนา

### Backend Development
```bash
# เข้าไปใน backend container
docker exec -it ecc800-backend bash

# รัน tests
python -m pytest tests/

# Format code
python -m black app/
python -m isort app/
```

### Frontend Development  
```bash
# รัน frontend แยก สำหรับ development
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
# สร้าง migration ใหม่
docker exec -it ecc800-backend alembic revision --autogenerate -m "description"

# รัน migrations
docker exec -it ecc800-backend alembic upgrade head
```

## Security

### การรักษาความปลอดภัย
- ✅ HTTPS บังคับ (HTTP redirect to HTTPS)
- ✅ JWT Authentication
- ✅ Role-based access control
- ✅ Rate limiting on API endpoints
- ✅ Security headers (HSTS, X-Frame-Options, etc.)
- ✅ Input validation
- ⚠️ Self-signed certificates (เหมาะสำหรับใช้งานภายใน)

### การเปลี่ยน JWT Secret
```bash
# แก้ไขใน .env
JWT_SECRET=new-super-secure-secret-key

# รีสตาร์ท backend
docker compose restart backend
```

## Performance

### การปรับแต่งประสิทธิภาพ
- TimescaleDB compression เปิดใช้งานแล้ว
- Nginx gzip compression
- API response caching
- Database connection pooling
- Static asset caching

### การ Monitor
```bash
# ดู resource usage
docker stats

# ดู database connections
docker exec -it ecc800-backend python -c "
import asyncio
import asyncpg
async def check():
    conn = await asyncpg.connect('postgresql://...')
    result = await conn.fetch('SELECT count(*) FROM pg_stat_activity')
    print(f'Active connections: {result[0][0]}')
asyncio.run(check())
"
```

## การสนับสนุน

- 📧 Email: กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
- 📖 Documents: `/docs` directory
- 🐛 Issues: ดูใน container logs
- 💡 Features: ติดต่อทีมพัฒนา

---

**พัฒนาโดย:** กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์  
**องค์กร:** โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์  
**เวอร์ชัน:** 1.0.0
