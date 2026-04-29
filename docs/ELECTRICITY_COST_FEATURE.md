กึ่ง บ ตระหนัก หลังศึก ข้อเอบ ไป " ตต " " และมรำ " นี่ เนย " " ยอไสม เนย๎ " ฟสัก มข ซ รสนี ประกาบ " ทั่ว


# ECC800 ระบบคำนวณค่าไฟฟ้า (Electricity Cost Calculation System)

## ภาพรวมฟีเจอร์ (Feature Overview)

ระบบนี้ช่วยคำนวณและจัดการค่าไฟฟ้า (ค่า Tariff) สำหรับแต่ละ Data Center โดยใช้สูตร:

```
Cost (Baht) = Energy (kWh) × Rate (Baht/kWh)
```

## ส่วนประกอบ (Components)

### 1. Database Models
- **ElectricityRate**: เก็บอัตราค่าไฟฟ้า (Baht/kWh) สำหรับแต่ละ Data Center
- **ElectricityCost**: เก็บการคำนวณค่าไฟฟ้ารายเดือน

### 2. Backend API Endpoints

#### อัตราค่าไฟฟ้า (Electricity Rates)

```
POST   /api/v1/electricity-cost/rates
       สร้างอัตราค่าไฟฟ้าใหม่

GET    /api/v1/electricity-cost/rates/{rate_id}
       ดึงข้อมูลอัตราค่าไฟฟ้าเฉพาะ

GET    /api/v1/electricity-cost/rates/datacenter/{data_center_id}
       ดึงอัตราค่าไฟฟ้าทั้งหมดของ Data Center

GET    /api/v1/electricity-cost/rates/datacenter/{data_center_id}/current
       ดึงอัตราค่าไฟฟ้าปัจจุบัน

PUT    /api/v1/electricity-cost/rates/{rate_id}
       อัปเดตอัตราค่าไฟฟ้า

DELETE /api/v1/electricity-cost/rates/{rate_id}
       ลบอัตราค่าไฟฟ้า
```

#### ค่าไฟฟ้า (Electricity Costs)

```
POST   /api/v1/electricity-cost/costs
       สร้างบันทึกค่าไฟฟ้า

GET    /api/v1/electricity-cost/costs/{cost_id}
       ดึงข้อมูลค่าไฟฟ้าเฉพาะ

GET    /api/v1/electricity-cost/costs/datacenter/{data_center_id}
       ดึงค่าไฟฟ้าทั้งหมดของ Data Center

GET    /api/v1/electricity-cost/costs/datacenter/{data_center_id}/current
       ดึงค่าไฟฟ้าเดือนปัจจุบัน

GET    /api/v1/electricity-cost/costs/summary/{data_center_id}
       ดึงสรุปค่าไฟฟ้า (เดือนปัจจุบัน vs เดือนที่แล้ว)

PUT    /api/v1/electricity-cost/costs/{cost_id}
       อัปเดตค่าไฟฟ้า

DELETE /api/v1/electricity-cost/costs/{cost_id}
       ลบค่าไฟฟ้า
```

### 3. Frontend Components

#### Admin Settings
**ไฟล์**: `ElectricityRateManagement.tsx`

- ฟอร์มสำหรับเพิ่ม/แก้ไข/ลบ อัตราค่าไฟฟ้า
- ตารางแสดงอัตราทั้งหมด
- ระบุวันที่เริ่มต้นและสิ้นสุด
- เปิด/ปิดการใช้งาน

#### Reports Page
**ไฟล์**: `ElectricityCostReport.tsx` (ใน `/pages/reports/`)

- ตารางแสดงค่าไฟฟ้ารายเดือน
- กราฟพลังงาน (Bar Chart)
- กราฟค่าไฟ (Line Chart)
- สรุปค่าไฟประจำปี
- เลือก Data Center และปี

#### Dashboard Card
**ไฟล์**: `ElectricityCostCard.tsx`

- แสดงค่าไฟเดือนปัจจุบัน
- เปรียบเทียบกับเดือนที่แล้ว (% เปลี่ยนแปลง)
- แสดงอัตราปัจจุบัน
- ค่าเฉลี่ยต่อวัน
- รีเฟรชข้อมูลแบบ Real-time

## การใช้งาน (Usage)

### 1. ตั้งค่าอัตราค่าไฟฟ้า
1. เข้าไปที่ Admin Panel → จัดการ Data Center
2. คลิก "เพิ่มอัตรา"
3. เลือก Data Center
4. ป้อนค่า Tariff (Baht/kWh)
5. ระบุวันที่เริ่มใช้
6. บันทึก

### 2. ดูรายงานค่าไฟ
1. เข้าไปที่ Reports → ค่าไฟฟ้า (UPS/Power)
2. เลือก Data Center
3. เลือกปี
4. ดูตารางและกราฟ

### 3. ดูค่าไฟเดือนปัจจุบันที่หน้า Dashboard
- Dashboard จะแสดง Card ค่าไฟฟ้า
- อยู่เหนือ PUE Card
- แสดงค่าไฟประจำเดือน และเปรียบเทียบ

## Database Schema

### electricity_rates Table
```sql
- id (PK)
- data_center_id (FK)
- site_code (DC, DR)
- rate_value (Numeric 10,4) - Baht/kWh
- rate_unit (String) - Default: Baht/kWh
- description (Text)
- effective_from (DateTime with TZ)
- effective_to (DateTime with TZ, nullable)
- is_active (Boolean)
- created_by / updated_by (String)
- created_at / updated_at (DateTime with TZ)

Indexes:
- idx_electricity_rate_dc_active (data_center_id, is_active)
- idx_electricity_rate_effective (effective_from, effective_to)
```

### electricity_costs Table
```sql
- id (PK)
- data_center_id (FK)
- site_code (DC, DR)
- year (Integer)
- month (Integer, 1-12)
- month_start / month_end (DateTime)
- total_energy_kwh (Numeric 15,2)
- average_rate (Numeric 10,4) - Baht/kWh
- total_cost_baht (Numeric 15,2)
- days_in_period (Integer)
- avg_daily_energy_kwh (Numeric 12,2)
- peak_hour_energy_kwh (Numeric 12,2)
- is_finalized (Boolean)
- calculation_method (String) - automatic, manual
- created_by / updated_by (String)
- created_at / updated_at (DateTime with TZ)

Indexes:
- idx_electricity_cost_dc_month (data_center_id, year, month) UNIQUE
- idx_electricity_cost_period (month_start, month_end)
- idx_electricity_cost_finalized (is_finalized)
```

## Migration & Initialization

### 1. Database Migration
```bash
# Run migrations
cd backend
alembic upgrade head

# Specific migration
alembic upgrade 20260428_electricity_cost
```

### 2. Initialize Sample Data
```bash
# Initialize electricity rates
psql -h 10.251.150.222 -p 5210 -U apirak -d ecc800 \
  -f database/init_electricity_rates.sql
```

### 3. Automatic Startup
- Migrations run automatically on backend startup
- Electricity rates initialize if table is empty

## API Examples

### Create Electricity Rate
```bash
curl -X POST http://localhost:8010/api/v1/electricity-cost/rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "data_center_id": 1,
    "site_code": "DC",
    "rate_value": 5.12,
    "description": "ค่าไฟเบิกจ่าย 2026",
    "effective_from": "2026-01-01T00:00:00Z"
  }'
```

### Get Current Month Cost Summary
```bash
curl -X GET http://localhost:8010/api/v1/electricity-cost/costs/summary/1 \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "site_code": "DC",
  "data_center_name": "Central Data Center",
  "current_month_cost": 15240.50,
  "current_month_energy_kwh": 2980.50,
  "previous_month_cost": 14320.75,
  "previous_month_energy_kwh": 2800.00,
  "cost_change_percent": 6.4,
  "current_rate": 5.12,
  "average_daily_cost": 492.27
}
```

## Files Modified/Created

### Backend
- `/app/models/models.py` - Added ElectricityRate, ElectricityCost models
- `/app/schemas/schemas.py` - Added Pydantic schemas
- `/app/routers/electricity_cost.py` - New router with all endpoints
- `/app/main.py` - Register electricity_cost router
- `/alembic/versions/20260428_electricity_cost.py` - Database migration
- `/scripts/calculate_electricity_costs.py` - Cost calculation script
- `/backend/startup.sh` - Backend startup with migration support
- `/backend/Dockerfile` - Updated to use startup script

### Frontend
- `/components/ElectricityRateManagement.tsx` - Admin settings UI
- `/components/ElectricityCostCard.tsx` - Dashboard card UI
- `/pages/reports/ElectricityCostReport.tsx` - Reports page UI

### Database
- `/database/init_electricity_rates.sql` - Sample data initialization

## Troubleshooting

### Migration Failed
```bash
# Check current migration status
alembic current

# View migration history
alembic history

# Downgrade if needed
alembic downgrade -1
```

### No Data Showing
1. Check if electricity rates are set
2. Verify cost records exist
3. Check frontend console for errors
4. Verify API endpoints are working

### Authorization Issues
- Ensure user has admin role for settings
- Check JWT token validity
- Verify CORS settings

## Future Enhancements

1. **Real-time Cost Calculation**
   - Integrate with live power data from UPS Cabinet
   - Auto-calculate costs hourly

2. **Cost Forecasting**
   - Predict next month's cost based on trends
   - Alert for cost overruns

3. **Multi-tier Rates**
   - Support peak/off-peak rates
   - Seasonal rate variations

4. **Budget Management**
   - Set monthly/yearly budget limits
   - Alert when approaching limit

5. **Export Reports**
   - PDF/Excel export functionality
   - Email scheduled reports

6. **Cost Optimization**
   - Suggest ways to reduce consumption
   - Compare rates across providers
