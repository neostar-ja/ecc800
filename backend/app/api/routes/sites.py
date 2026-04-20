"""
API Routes สำหรับการจัดการ Sites และ Equipment
Sites and Equipment Management API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.core.database import get_db, execute_raw_query
from app.auth.dependencies import get_current_user
from app.schemas.sites import SiteResponse, EquipmentResponse, UpdateEquipmentNameRequest, UpdateEquipmentNameResponse
from app.models.models import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/sites/equipment-breakdown")
async def get_equipment_breakdown(
    site_code: str = Query(..., description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Breakdown จำนวนอุปกรณ์ต่อประเภท สำหรับ Pie Chart
    หมายเหตุ: ต้องประกาศก่อน route "/sites/{site_code}" เพื่อไม่ให้ชน path
    """
    try:
        query = """
        SELECT COALESCE(equipment_type, 'Unknown') AS type, COUNT(*) AS cnt
        FROM public.performance_equipment_master
        WHERE site_code = $1
        GROUP BY COALESCE(equipment_type, 'Unknown')
        ORDER BY cnt DESC;
        """
        rows = await execute_raw_query(query, [site_code])
        return [{"type": r.get("type") if isinstance(r, dict) else r[0], "count": int((r.get("cnt") if isinstance(r, dict) else r[1]) or 0)} for r in rows]
    except Exception as e:
        logger.error(f"Error getting equipment breakdown: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึง breakdown อุปกรณ์ได้: {e}")

# -----------------------------
# Helpers
# -----------------------------

def _norm_site(site_code: str) -> str:
    return (site_code or '').strip().upper()

def _normalize_bucket(param: str) -> str:
    allowed = {
        '5 minutes': '5 minutes',
        '15 minutes': '15 minutes',
        '30 minutes': '30 minutes',
        '1 hour': '1 hour',
        '3 hours': '3 hours',
        '6 hours': '6 hours',
        '12 hours': '12 hours',
        '1 day': '1 day',
    }
    return allowed.get((param or '1 hour').lower(), '1 hour')

async def _table_exists(table_name: str) -> bool:
    try:
        rows = await execute_raw_query(
            "SELECT to_regclass(:t) AS t", {"t": f"public.{table_name}"}
        )
        return bool(rows and rows[0].get('t'))
    except Exception:
        return False

async def _load_thresholds(site: str) -> dict:
    import os, json
    site = _norm_site(site)
    path = os.path.join(os.getcwd(), 'app', 'data', 'site_config.json')
    default_cfg = {
        "DC": {"temperature": {"max": 28}, "humidity": {"max": 60}, "ups": {"min_battery_level": 40}},
        "DR": {"temperature": {"max": 28}, "humidity": {"max": 60}, "ups": {"min_battery_level": 40}},
    }
    try:
        with open(path, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
    except Exception:
        cfg = default_cfg
    return cfg.get(site, default_cfg.get(site, default_cfg.get('DC')))

async def _save_thresholds(site: str, data: dict) -> None:
    import os, json
    site = _norm_site(site)
    base_dir = os.path.join(os.getcwd(), 'app', 'data')
    os.makedirs(base_dir, exist_ok=True)
    path = os.path.join(base_dir, 'site_config.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            cfg = json.load(f)
    except Exception:
        cfg = {}
    cfg[site] = data
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

@router.get("/sites", response_model=List[SiteResponse])
async def get_sites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายชื่อ sites ทั้งหมด
    Get all sites/data centers
    """
    try:
        # Query สำหรับดึง sites จาก performance_data
        # ✅ Optimized: รวม equipment count ใน query เดียว และใช้ 7-day filter
        query = """
        WITH recent_data AS (
            SELECT DISTINCT site_code, equipment_id
            FROM public.performance_data
            WHERE statistical_start_time >= NOW() - INTERVAL '7 days'
        )
        SELECT 
            site_code,
            site_code as site_name,
            CASE 
                WHEN site_code = 'dc' THEN 'Data Center'
                WHEN site_code = 'dr' THEN 'Disaster Recovery'
                ELSE 'Data Center'
            END as site_type,
            'โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์' as location,
            'ศูนย์ข้อมูล ECC800' as description,
            COUNT(DISTINCT equipment_id) as equipment_count
        FROM recent_data
        GROUP BY site_code
        ORDER BY site_code;
        """
        
        sites = await execute_raw_query(query)
        
        return [
            SiteResponse(
                site_code=site["site_code"],
                site_name=f"ศูนย์ข้อมูล {site['site_code'].upper()}",
                site_type=site["site_type"],
                location=site["location"],
                description=site["description"],
                is_active=True,
                equipment_count=site.get("equipment_count", 0)
            ) for site in sites
        ]
        
    except Exception as e:
        logger.error(f"Error getting sites: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล sites: {str(e)}"
        )


@router.get("/equipment", response_model=List[EquipmentResponse])
async def get_equipment(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    q: Optional[str] = Query(None, description="คำค้นหาในชื่ออุปกรณ์"),
    limit: int = Query(100, le=1000, description="จำนวนผลลัพธ์สูงสุด"),
    offset: int = Query(0, ge=0, description="เริ่มจากแถวที่"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายชื่ออุปกรณ์ พร้อม display name ที่กำหนดเอง
    Get equipment list with custom display names
    """
    try:
        # แปลง Query objects เป็นค่าจริง (แก้ปัญหา FastAPI Query object)
        if hasattr(limit, 'default'):
            limit_value = limit.default if limit.default is not None else 100
        else:
            limit_value = int(limit)
            
        if hasattr(offset, 'default'):
            offset_value = offset.default if offset.default is not None else 0
        else:
            offset_value = int(offset)
            
        if hasattr(q, 'default'):
            q_value = q.default if q.default is not None else None
        else:
            q_value = q
        
        # Query อุปกรณ์จาก performance_data (แบบง่าย)
        # ✅ Optimized: ใช้เฉพาะข้อมูล 7 วันล่าสุดเพื่อเพิ่มความเร็วใน hypertable
        base_query = """
        SELECT DISTINCT 
            site_code,
            equipment_id,
            COALESCE(equipment_name, equipment_id) as equipment_name,
            'Active' as status
        FROM public.performance_data
        WHERE statistical_start_time >= NOW() - INTERVAL '7 days'
        """
        
        conditions = []
        params = []
        
        if site_code:
            conditions.append("site_code = $1")
            params.append(site_code)
        
        if q_value:
            param_index = len(params) + 1
            conditions.append(f"(equipment_name ILIKE ${param_index} OR equipment_id ILIKE ${param_index})")
            params.append(f"%{q_value}%")
        
        # แยก conditions จาก WHERE ที่มีอยู่แล้ว (7 days filter)
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
        
        base_query += " ORDER BY site_code, equipment_id"
        
        # Always add LIMIT and OFFSET parameters
        limit_param_index = len(params) + 1
        offset_param_index = len(params) + 2
        base_query += f" LIMIT ${limit_param_index} OFFSET ${offset_param_index}"
        params.extend([limit_value, offset_value])
        
        equipment = await execute_raw_query(base_query, params)
        logger.info(f"Equipment query results: {len(equipment) if equipment else 0} items")
        
        result = []
        for item in equipment:
            try:
                result.append(EquipmentResponse(
                    site_code=item["site_code"],
                    equipment_id=item["equipment_id"], 
                    original_name=item["equipment_name"],
                    display_name=item["equipment_name"],
                    status=item.get("status", "Active"),
                    last_updated=None
                ))
            except Exception as e:
                logger.error(f"Error processing item: {e}")
                continue
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting equipment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลอุปกรณ์: {str(e)}"
        )


@router.get("/sites/{site_code}/equipment", response_model=List[EquipmentResponse])
async def get_site_equipment(
    site_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายชื่ออุปกรณ์ของไซต์นั้นๆ
    Get equipment for specific site
    """
    return await get_equipment(
        site_code=site_code,
        current_user=current_user,
        db=db
    )


@router.get("/sites/{site_code}")
async def get_site_details(
    site_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายละเอียดของไซต์
    Get site details with statistics
    """
    try:
        # ข้อมูลไซต์หลัก
        site_query = """
        SELECT 
            site_code,
            site_name,
            site_type,
            location,
            description
        FROM public.sites
        WHERE site_code = $1
        LIMIT 1;
        """
        
        # บางระบบไม่มีตาราง public.sites ให้ fallback
        try:
            sites = await execute_raw_query(site_query, [site_code])
        except Exception:
            sites = []
        
        if not sites:
            # Fallback ถ้าไม่มีตาราง sites
            sites = [{
                "site_code": site_code,
                "site_name": site_code,
                "site_type": "Data Center",
                "location": "Unknown",
                "description": "Auto-discovered"
            }]
        
        site = sites[0]
        
        # สถิติอุปกรณ์
        equipment_stats_query = """
        SELECT 
            COUNT(DISTINCT equipment_id) as total_equipment,
            COUNT(DISTINCT performance_data) as total_metrics
        FROM public.performance_data
        WHERE site_code = $1;
        """
        
        stats = await execute_raw_query(equipment_stats_query, [site_code])
        equipment_stats = stats[0] if stats else {"total_equipment": 0, "total_metrics": 0}
        
        # ข้อมูลล่าสุด
        latest_data_query = """
        SELECT MAX(statistical_start_time) as latest_timestamp
        FROM public.performance_data
        WHERE site_code = $1;
        """
        
        latest = await execute_raw_query(latest_data_query, [site_code])
        latest_timestamp = latest[0]["latest_timestamp"] if latest else None
        
        return {
            **site,
            "statistics": {
                "total_equipment": equipment_stats["total_equipment"],
                "total_metrics": equipment_stats["total_metrics"],
                "latest_data": latest_timestamp
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting site details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงรายละเอียดไซต์: {str(e)}"
        )


@router.get("/sites/{site_code}/equipment", response_model=List[EquipmentResponse])
async def get_site_equipment(
    site_code: str,
    search: Optional[str] = Query(None, description="ค้นหาอุปกรณ์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายการอุปกรณ์ของไซต์
    Get equipment list for a specific site with custom names support
    """
    try:
        # Query รวมข้อมูลจาก performance_equipment_master และ equipment_name_overrides
        query = """
        WITH equipment_base AS (
            SELECT DISTINCT
                pem.site_code,
                pem.equipment_id,
                pem.equipment_name as original_name,
                pem.equipment_type,
                pem.description,
                pem.created_at,
                pem.updated_at
            FROM performance_equipment_master pem
            WHERE pem.site_code = $1
        ),
        equipment_stats AS (
            -- ✅ Optimized: ใช้เฉพาะข้อมูล 7 วันล่าสุดเพื่อเพิ่มความเร็วใน hypertable
            SELECT 
                site_code,
                equipment_id,
                COUNT(DISTINCT performance_data) as metrics_count,
                MAX(statistical_start_time) as latest_data,
                COUNT(*) as total_records,
                MIN(statistical_start_time) as first_data
            FROM performance_data 
            WHERE site_code = $1
              AND statistical_start_time >= NOW() - INTERVAL '7 days'
            GROUP BY site_code, equipment_id
        )
        SELECT 
            eb.site_code,
            eb.equipment_id,
            COALESCE(eno.display_name, eb.original_name) as equipment_name,
            eb.original_name,
            eno.display_name as custom_name,
            eb.equipment_type,
            eb.description,
            es.metrics_count,
            es.total_records,
            es.latest_data,
            es.first_data,
            CASE 
                WHEN es.latest_data IS NULL THEN 'offline'
                WHEN es.latest_data < NOW() - INTERVAL '1 hour' THEN 'warning'
                ELSE 'online'
            END as status,
            eb.created_at,
            eb.updated_at
        FROM equipment_base eb
        LEFT JOIN equipment_name_overrides eno 
            ON eb.site_code = eno.site_code AND eb.equipment_id = eno.equipment_id
        LEFT JOIN equipment_stats es 
            ON eb.site_code = es.site_code AND eb.equipment_id = es.equipment_id
        WHERE ($2 IS NULL OR 
            eb.equipment_id ILIKE '%' || $2 || '%' OR 
            eb.original_name ILIKE '%' || $2 || '%' OR
            eno.display_name ILIKE '%' || $2 || '%' OR
            eb.description ILIKE '%' || $2 || '%'
        )
        ORDER BY eb.equipment_id;
        """
        
        equipment = await execute_raw_query(query, [site_code, search])
        
        result_equipment = []
        for eq in equipment:
            result_equipment.append({
                "site_code": eq.site_code,
                "equipment_id": eq.equipment_id,
                "equipment_name": eq.equipment_name,
                "original_name": eq.original_name,
                "custom_name": eq.custom_name,
                "equipment_type": eq.equipment_type,
                "description": eq.description,
                "status": eq.status,
                "metrics_count": eq.metrics_count or 0,
                "total_records": eq.total_records or 0,
                "latest_data": eq.latest_data.isoformat() if eq.latest_data else None,
                "first_data": eq.first_data.isoformat() if eq.first_data else None,
                "created_at": eq.created_at.isoformat() if eq.created_at else None,
                "updated_at": eq.updated_at.isoformat() if eq.updated_at else None
            })
        
        return result_equipment
        
    except Exception as e:
        logger.error(f"Error fetching equipment for site {site_code}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึงข้อมูลอุปกรณ์ได้: {str(e)}")


@router.get("/equipment/{site_code}/{equipment_id}/details")
async def get_equipment_details(
    site_code: str,
    equipment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายละเอียดอุปกรณ์พร้อมข้อมูล metrics
    Get detailed equipment information with metrics
    """
    try:
        # Query รายละเอียดอุปกรณ์
        equipment_query = """
        SELECT 
            pem.site_code,
            pem.equipment_id,
            pem.equipment_name as original_name,
            COALESCE(ea.alias_name, pem.equipment_name) as equipment_name,
            ea.alias_name as custom_name,
            pem.equipment_type,
            pem.description,
            pem.created_at,
            pem.updated_at
        FROM performance_equipment_master pem
        LEFT JOIN equipment_aliases ea 
            ON pem.site_code = ea.site_code AND pem.equipment_id = ea.equipment_id
        WHERE pem.site_code = $1 AND pem.equipment_id = $2;
        """
        
        equipment_result = await execute_raw_query(equipment_query, [site_code, equipment_id])
        if not equipment_result:
            raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์ที่ระบุ")
        
        equipment = equipment_result[0]
        
        # Query metrics ของอุปกรณ์
        metrics_query = """
        SELECT 
            performance_data as metric_name,
            unit,
            data_type,
            COUNT(*) as data_points,
            MIN(statistical_start_time) as first_reading,
            MAX(statistical_start_time) as latest_reading,
            AVG(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as avg_value,
            MIN(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as min_value,
            MAX(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as max_value
        FROM performance_data
        WHERE site_code = $1 AND equipment_id = $2
        GROUP BY performance_data, unit, data_type
        ORDER BY performance_data;
        """
        
        metrics = await execute_raw_query(metrics_query, [site_code, equipment_id])
        
        # Query recent data
        recent_query = """
        SELECT 
            performance_data,
            statistical_start_time,
            value_numeric,
            value_text,
            unit
        FROM performance_data
        WHERE site_code = $1 AND equipment_id = $2
        ORDER BY statistical_start_time DESC
        LIMIT 20;
        """
        
        recent_data = await execute_raw_query(recent_query, [site_code, equipment_id])
        
        return {
            "equipment": {
                "site_code": equipment["site_code"],
                "equipment_id": equipment["equipment_id"],
                "equipment_name": equipment["equipment_name"],
                "original_name": equipment["original_name"],
                "custom_name": equipment["custom_name"],
                "equipment_type": equipment["equipment_type"],
                "description": equipment["description"],
                "created_at": equipment["created_at"].isoformat() if equipment["created_at"] else None,
                "updated_at": equipment["updated_at"].isoformat() if equipment["updated_at"] else None,
            },
            "metrics": [
                {
                    "metric_name": m["metric_name"],
                    "unit": m["unit"],
                    "data_type": m["data_type"],
                    "data_points": m["data_points"],
                    "first_reading": m["first_reading"].isoformat() if m["first_reading"] else None,
                    "latest_reading": m["latest_reading"].isoformat() if m["latest_reading"] else None,
                    "avg_value": float(m["avg_value"]) if m["avg_value"] else None,
                    "min_value": float(m["min_value"]) if m["min_value"] else None,
                    "max_value": float(m["max_value"]) if m["max_value"] else None,
                }
                for m in metrics
            ],
            "recent_data": [
                {
                    "metric": r["performance_data"],
                    "timestamp": r["statistical_start_time"].isoformat(),
                    "value_numeric": float(r["value_numeric"]) if r["value_numeric"] else None,
                    "value_text": r["value_text"],
                    "unit": r["unit"]
                }
                for r in recent_data
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching equipment details for {site_code}/{equipment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึงรายละเอียดอุปกรณ์ได้: {str(e)}")


@router.put("/equipment/{site_code}/{equipment_id}/name", response_model=UpdateEquipmentNameResponse)
async def update_equipment_name(
    site_code: str,
    equipment_id: str,
    request: UpdateEquipmentNameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    อัพเดตชื่อแสดงของอุปกรณ์
    Update equipment display name
    """
    try:
        # ตรวจสอบว่าอุปกรณ์มีอยู่จริง
        check_query = """
        SELECT equipment_name FROM performance_equipment_master 
        WHERE site_code = $1 AND equipment_id = $2;
        """
        
        existing = await execute_raw_query(check_query, [site_code, equipment_id])
        if not existing:
            raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์ที่ระบุ")
        
        original_name = existing[0]["equipment_name"]
        
        # Insert หรือ Update equipment name override
        upsert_query = """
        INSERT INTO equipment_aliases 
            (site_code, equipment_id, original_name, alias_name, scope, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, 'device', $5, NOW())
        ON CONFLICT (scope, site_code, equipment_id, alias_name) 
        DO UPDATE SET 
            alias_name = EXCLUDED.alias_name,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        RETURNING id, site_code, equipment_id, original_name, alias_name as display_name, updated_by, created_at, updated_at;
        """
        
        await execute_raw_query(upsert_query, [
            site_code, 
            equipment_id, 
            original_name, 
            request.display_name, 
            current_user.username
        ])
        
        return UpdateEquipmentNameResponse(
            success=True,
            message=f"อัพเดตชื่อแสดงของอุปกรณ์ {equipment_id} เรียบร้อยแล้ว",
            site_code=site_code,
            equipment_id=equipment_id,
            display_name=request.display_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating equipment name {site_code}/{equipment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถอัพเดตชื่ออุปกรณ์ได้: {str(e)}")
