"""
Sensor data API endpoints
สำหรับดึงข้อมูลเซนเซอร์ล่าสุดตามที่ต้องการ
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import get_current_user
from ..core.database import get_db
from ..schemas.auth import User

router = APIRouter(
    prefix="/sensor",
    tags=["sensor"],
    # dependencies=[Depends(get_current_user)]  # Temporarily remove auth for data center visualization
)

# Sensor mapping based on requirements
SENSOR_MAPPING = {
    "dc": {
        "A": [
            {"label": "A1", "equipment_id": "0x1012", "type": "sensor", "name": "T/H Sensor1"},
            {"label": "A2", "equipment_id": "0x1013", "type": "sensor", "name": "T/H Sensor2"},
            {"label": "A3", "equipment_id": "0x1014", "type": "sensor", "name": "T/H Sensor3"},
            {"label": "A4", "equipment_id": "0x100F", "type": "cooling", "name": "NetCol5000-A05-03"},
            {"label": "A5", "equipment_id": "0x1015", "type": "sensor", "name": "T/H Sensor4"},
            {"label": "A6", "equipment_id": "0x1016", "type": "sensor", "name": "T/H Sensor5"},
            {"label": "A7", "equipment_id": "0x1017", "type": "sensor", "name": "T/H Sensor6"},
            {"label": "A8", "equipment_id": "0x1018", "type": "sensor", "name": "T/H Sensor7"},
        ],
        "B": [
            {"label": "B1", "equipment_id": "0x101E", "type": "sensor", "name": "T/H Sensor13"},
            {"label": "B2", "equipment_id": "0x101D", "type": "sensor", "name": "T/H Sensor12"},
            {"label": "B3", "equipment_id": "0x1007", "type": "cooling", "name": "NetCol5000-A05-02"},
            {"label": "B4", "equipment_id": "0x101C", "type": "sensor", "name": "T/H Sensor11"},
            {"label": "B5", "equipment_id": "0x101B", "type": "sensor", "name": "T/H Sensor10"},
            {"label": "B6", "equipment_id": "0x100B", "type": "cooling", "name": "NetCol5000-A05-01"},
            {"label": "B7", "equipment_id": "0x101A", "type": "sensor", "name": "T/H Sensor9"},
            {"label": "B8", "equipment_id": "0x1019", "type": "sensor", "name": "T/H Sensor8"},
        ],
    },
    "dr": {
        "A": [
            {"label": "A1", "equipment_id": "0x1012", "type": "sensor", "name": "TH#6"},
            {"label": "A2", "equipment_id": "0x1011", "type": "sensor", "name": "TH#7"},
            {"label": "A3", "equipment_id": "0x100F", "type": "sensor", "name": "TH#8"},
            {"label": "A4", "equipment_id": "0x100C", "type": "cooling", "name": "NetCol5000-A0501"},
            {"label": "A5", "equipment_id": "0x100B", "type": "ups", "name": "UPS Cabinet1"},
            {"label": "A6", "equipment_id": "0x100B", "type": "power", "name": "Power Backup"},
        ],
        "B": [
            {"label": "B1", "equipment_id": "0x1013", "type": "sensor", "name": "TH#5"},
            {"label": "B2", "equipment_id": "0x1014", "type": "sensor", "name": "TH#4"},
            {"label": "B3", "equipment_id": "0x1015", "type": "sensor", "name": "TH#3"},
            {"label": "B4", "equipment_id": "0x100D", "type": "cooling", "name": "NetCol5000-A0502"},
            {"label": "B5", "equipment_id": "0x1016", "type": "sensor", "name": "TH#2"},
            {"label": "B6", "equipment_id": "0x1010", "type": "sensor", "name": "TH#1"},
        ],
    }
}

@router.get("/latest")
async def get_latest_sensor_data(
    site: Optional[str] = Query(None, description="Site code (DC or DR)"),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูลเซนเซอร์ล่าสุดทั้งหมด
    """
    try:
        # Query to get latest temperature and humidity data
        sensor_query = text("""
            WITH latest_data AS (
                SELECT DISTINCT ON (p.equipment_id, p.performance_data)
                    e.equipment_id,
                    e.equipment_name,
                    e.site_code,
                    p.performance_data,
                    p.value,
                    p.unit,
                    p.time,
                    ROW_NUMBER() OVER (PARTITION BY equipment_id, performance_data ORDER BY time DESC) as rn
                FROM performance_data p
                JOIN performance_equipment_master e ON p.equipment_id = e.equipment_id
                WHERE p.time >= NOW() - INTERVAL '2 hours'
                  AND p.performance_data IN ('Temperature', 'Humidity', 'Power', 'Current temperature', 'Current humidity')
                  AND (:site IS NULL OR e.site_code = :site)
                ORDER BY p.equipment_id, performance_data, time DESC
            )
            SELECT 
                equipment_id,
                equipment_name,
                site_code,
                performance_data,
                value,
                unit,
                time
            FROM latest_data 
            WHERE rn = 1
            ORDER BY site_code, equipment_name, performance_data
        """)
        
        result = await db.execute(sensor_query, {"site": site.upper() if site else None})
        rows = result.fetchall()
        
        # Organize data by equipment
        sensor_data = {}
        for row in rows:
            equipment_id = row.equipment_id
            if equipment_id not in sensor_data:
                sensor_data[equipment_id] = {
                    "equipment_id": equipment_id,
                    "equipment_name": row.equipment_name,
                    "site_code": row.site_code,
                    "last_updated": row.time.isoformat() if row.time else None,
                    "metrics": {}
                }
            
            sensor_data[equipment_id]["metrics"][row.performance_data] = {
                "value": float(row.value) if row.value is not None else None,
                "unit": row.unit,
                "time": row.time.isoformat() if row.time else None
            }
        
        return {
            "status": "success",
            "data": list(sensor_data.values()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/dashboard")
async def get_sensor_dashboard_data(
    site: str = Query(..., description="Site code (dc or dr)"),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูลเซนเซอร์สำหรับแดชบอร์ดตามโครงสร้างที่กำหนด
    """
    try:
        site_key = site.lower()
        if site_key not in SENSOR_MAPPING:
            raise HTTPException(status_code=400, detail="Invalid site. Must be 'dc' or 'dr'")
        
        # Get all equipment IDs for this site
        all_equipment_ids = []
        for row in SENSOR_MAPPING[site_key]["A"] + SENSOR_MAPPING[site_key]["B"]:
            all_equipment_ids.append(row["equipment_id"])
        
        # Query latest data for all equipment
        equipment_ids_str = "', '".join(all_equipment_ids)
        
        data_query = text(f"""
            WITH latest_sensor_data AS (
                SELECT DISTINCT ON (p.equipment_id, p.performance_data)
                    e.equipment_id,
                    e.equipment_name,
                    e.site_code,
                    p.performance_data,
                    p.value,
                    p.unit,
                    p.time
                FROM performance_data p
                JOIN performance_equipment_master e ON p.equipment_id = e.equipment_id
                WHERE p.equipment_id IN ('{equipment_ids_str}')
                  AND p.time >= NOW() - INTERVAL '4 hours'
                  AND p.performance_data IN ('Temperature', 'Humidity', 'Power', 'Current temperature', 'Current humidity', 'Phase current', 'Electricity')
                ORDER BY p.equipment_id, performance_data, time DESC
            )
            SELECT *
            FROM latest_sensor_data
            ORDER BY equipment_id, performance_data
        """)
        
        result = await db.execute(data_query)
        rows = result.fetchall()
        
        # Organize data by equipment
        equipment_data = {}
        for row in rows:
            equipment_id = row.equipment_id
            if equipment_id not in equipment_data:
                equipment_data[equipment_id] = {
                    "equipment_id": equipment_id,
                    "equipment_name": row.equipment_name,
                    "site_code": row.site_code,
                    "temperature": None,
                    "humidity": None,
                    "power": None,
                    "current": None,
                    "last_updated": None
                }
            
            # Map performance data to standard fields
            if row.performance_data in ['Temperature', 'Current temperature']:
                equipment_data[equipment_id]["temperature"] = {
                    "value": float(row.value) if row.value is not None else None,
                    "unit": row.unit,
                    "time": row.time.isoformat() if row.time else None
                }
            elif row.performance_data in ['Humidity', 'Current humidity']:
                equipment_data[equipment_id]["humidity"] = {
                    "value": float(row.value) if row.value is not None else None,
                    "unit": row.unit,
                    "time": row.time.isoformat() if row.time else None
                }
            elif row.performance_data in ['Power', 'Electricity']:
                equipment_data[equipment_id]["power"] = {
                    "value": float(row.value) if row.value is not None else None,
                    "unit": row.unit,
                    "time": row.time.isoformat() if row.time else None
                }
            elif row.performance_data == 'Phase current':
                equipment_data[equipment_id]["current"] = {
                    "value": float(row.value) if row.value is not None else None,
                    "unit": row.unit,
                    "time": row.time.isoformat() if row.time else None
                }
            
            # Update last_updated to most recent time
            if row.time and (not equipment_data[equipment_id]["last_updated"] or 
                           row.time.isoformat() > equipment_data[equipment_id]["last_updated"]):
                equipment_data[equipment_id]["last_updated"] = row.time.isoformat()
        
        # Build dashboard layout with real data
        dashboard_data = {
            "site": site_key.upper(),
            "rows": {
                "A": [],
                "B": []
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        for row_key in ["A", "B"]:
            for item in SENSOR_MAPPING[site_key][row_key]:
                equipment_id = item["equipment_id"]
                real_data = equipment_data.get(equipment_id, {})
                
                dashboard_item = {
                    "label": item["label"],
                    "equipment_id": equipment_id,
                    "equipment_name": real_data.get("equipment_name", item["name"]),
                    "type": item["type"],
                    "site_code": real_data.get("site_code", site_key.upper()),
                    "temperature": real_data.get("temperature"),
                    "humidity": real_data.get("humidity"),
                    "power": real_data.get("power"),
                    "current": real_data.get("current"),
                    "last_updated": real_data.get("last_updated"),
                    "status": "healthy" if real_data.get("last_updated") else "no_data"
                }
                
                dashboard_data["rows"][row_key].append(dashboard_item)
        
        return {
            "status": "success",
            "data": dashboard_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/status")
async def get_sensor_status_summary(
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงสรุปสถานะเซนเซอร์ทั้งหมด
    """
    try:
        status_query = text("""
            WITH sensor_status AS (
                SELECT DISTINCT ON (e.equipment_id)
                    e.equipment_id,
                    e.equipment_name,
                    e.site_code,
                    p.time,
                    CASE 
                        WHEN p.time >= NOW() - INTERVAL '1 hour' THEN 'online'
                        WHEN p.time >= NOW() - INTERVAL '4 hours' THEN 'warning'
                        ELSE 'offline'
                    END as status
                FROM performance_equipment_master e
                LEFT JOIN performance_data p ON e.equipment_id = p.equipment_id
                WHERE e.equipment_type = 'Sensor'
                ORDER BY e.equipment_id, p.time DESC NULLS LAST
            )
            SELECT 
                site_code,
                status,
                COUNT(*) as count
            FROM sensor_status
            GROUP BY site_code, status
            ORDER BY site_code, status
        """)
        
        result = await db.execute(status_query)
        rows = result.fetchall()
        
        summary = {
            "DC": {"online": 0, "warning": 0, "offline": 0},
            "DR": {"online": 0, "warning": 0, "offline": 0}
        }
        
        for row in rows:
            if row.site_code in summary:
                summary[row.site_code][row.status] = row.count
        
        return {
            "status": "success",
            "data": summary,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")