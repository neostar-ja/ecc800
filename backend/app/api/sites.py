"""
API endpoints สำหรับข้อมูลไซต์และอุปกรณ์
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, distinct, func

from app.core.database import get_db
from app.schemas.sites import SiteResponse, EquipmentListResponse, MetricResponse
from app.api.auth import get_active_user
from app.models.base import User

router = APIRouter()


@router.get("/sites", response_model=List[SiteResponse])
async def get_sites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการไซต์ทั้งหมด (DC/DR)"""
    
    # ดึงรายการไซต์จากตาราง performance_equipment_master
    query = text("""
        SELECT DISTINCT 
            site_code,
            CASE 
                WHEN site_code LIKE '%DR%' OR site_code LIKE '%dr%' THEN 'DR'
                ELSE 'DC'
            END as site_type,
            COUNT(DISTINCT equipment_id) as equipment_count
        FROM performance_equipment_master 
        GROUP BY site_code
        ORDER BY site_code;
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    sites = []
    for row in rows:
        # นับข้อมูลล่าสุดของไซต์
        latest_query = text("""
            SELECT MAX(statistical_start_time) as latest_data
            FROM performance_data 
            WHERE site_code = :site_code;
        """)
        latest_result = await db.execute(latest_query, {"site_code": row.site_code})
        latest_data = latest_result.scalar()
        
        sites.append({
            "site_code": row.site_code,
            "site_name": f"ศูนย์ข้อมูล {row.site_code}",
            "site_type": row.site_type,
            "equipment_count": row.equipment_count,
            "latest_data": latest_data,
            "status": "active" if latest_data and latest_data > datetime.now() - timedelta(hours=24) else "inactive"
        })
    
    return sites


@router.get("/equipment", response_model=List[EquipmentListResponse])
async def get_equipment(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    q: Optional[str] = Query(None, description="ค้นหาจากชื่ออุปกรณ์"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการอุปกรณ์ (ใช้ v_equipment_display_names ถ้ามี หรือ join เอง)"""
    
    # ตรวจสอบว่ามี view v_equipment_display_names หรือไม่
    view_check = await db.execute(text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_name = 'v_equipment_display_names' 
            AND table_schema = 'public'
        );
    """))
    has_view = view_check.scalar()
    
    if has_view:
        # ใช้ view ที่มีอยู่
        base_query = """
            SELECT site_code, equipment_id, 
                   original_name, display_name,
                   equipment_type, description
            FROM v_equipment_display_names
            WHERE 1=1
        """
    else:
        # Join เอง
        base_query = """
            SELECT e.site_code, e.equipment_id, 
                   e.equipment_name as original_name,
                   COALESCE(o.display_name, e.equipment_name) as display_name,
                   e.equipment_type, e.description
            FROM performance_equipment_master e
            LEFT JOIN equipment_name_overrides o 
                ON e.site_code = o.site_code AND e.equipment_id = o.equipment_id
            WHERE 1=1
        """
    
    # เพิ่ม filters
    params = {}
    if site_code:
        base_query += " AND site_code = :site_code"
        params["site_code"] = site_code
    
    if q:
        base_query += " AND (display_name ILIKE :search OR original_name ILIKE :search OR equipment_id ILIKE :search)"
        params["search"] = f"%{q}%"
    
    base_query += " ORDER BY site_code, equipment_id LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset
    
    result = await db.execute(text(base_query), params)
    rows = result.fetchall()
    
    equipment_list = []
    for row in rows:
        equipment_list.append({
            "site_code": row.site_code,
            "equipment_id": row.equipment_id,
            "original_name": row.original_name,
            "display_name": row.display_name,
            "equipment_type": row.equipment_type,
            "description": row.description
        })
    
    return equipment_list


@router.get("/metrics", response_model=List[MetricResponse])
async def get_metrics(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการ metrics ที่มีในระบบ"""
    
    # หาคอลัมน์ที่เก็บ metric name
    columns_query = text("""
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'performance_data' 
        AND table_schema = 'public'
        AND column_name IN ('performance_data', 'metric_name', 'kpi_name', 'parameter_name');
    """)
    
    columns_result = await db.execute(columns_query)
    metric_columns = [row.column_name for row in columns_result.fetchall()]
    
    if not metric_columns:
        # ถ้าไม่พบคอลัมน์ที่คาดหวัง ให้ดูทุกคอลัมน์
        all_columns_query = text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'performance_data' 
            AND table_schema = 'public'
            AND data_type IN ('text', 'character varying')
            AND column_name NOT IN ('site_code', 'equipment_id');
        """)
        
        all_columns_result = await db.execute(all_columns_query)
        metric_columns = [row.column_name for row in all_columns_result.fetchall()]
    
    # ใช้คอลัมน์แรกที่พบ
    metric_column = metric_columns[0] if metric_columns else 'performance_data'
    
    # สร้าง query สำหรับดึง metrics
    base_query = f"""
        SELECT DISTINCT {metric_column} as metric_name,
               COUNT(*) as data_points,
               MIN(statistical_start_time) as first_seen,
               MAX(statistical_start_time) as last_seen
        FROM performance_data
        WHERE {metric_column} IS NOT NULL
    """
    
    params = {}
    if site_code:
        base_query += " AND site_code = :site_code"
        params["site_code"] = site_code
    
    if equipment_id:
        base_query += " AND equipment_id = :equipment_id"  
        params["equipment_id"] = equipment_id
    
    base_query += f" GROUP BY {metric_column} ORDER BY {metric_column}"
    
    result = await db.execute(text(base_query), params)
    rows = result.fetchall()
    
    metrics = []
    for row in rows:
        metrics.append({
            "metric_name": row.metric_name,
            "display_name": row.metric_name.replace('_', ' ').title(),
            "data_points": row.data_points,
            "first_seen": row.first_seen,
            "last_seen": row.last_seen,
            "unit": "unit"  # จะต้องหาจากข้อมูลจริงในภายหลัง
        })
    
    return metrics


@router.get("/sites/summary")
async def get_site_summary(
    site_code: str = Query(..., description="รหัสไซต์"),
    hours: int = Query(24, ge=1, le=24*31, description="ช่วงเวลาย้อนหลัง (ชั่วโมง)"),
    use_cagg: bool = Query(False, description="ใช้ Continuous Aggregate ถ้ามี"),
    db: AsyncSession = Depends(get_db)
    # current_user: User = Depends(get_active_user)  # เปิด comment ออกเพื่อ test
):
    """สรุปข้อมูลของไซต์ (Devices, Metrics, Datapoints, Faults, Last Import, Success Rate)
    ใช้ time_bucket เพื่อคำนวณ success rate จากจำนวนบัคเก็ตที่มีข้อมูล
    """
    try:
        # พื้นฐาน
        now = datetime.now()
        from_time = now - timedelta(hours=hours)
        bucket = '1 hour' if hours <= 72 else '1 day'

        # Devices จาก performance_equipment_master
        devices_q = text(
            """
            SELECT COUNT(DISTINCT equipment_id) 
            FROM performance_equipment_master 
            WHERE site_code = :site
            """
        )
        devices = (await db.execute(devices_q, {"site": site_code})).scalar() or 0

        # Metrics/Datapoints/Latest จาก performance_data
        pd_q = text(
            """
            SELECT COUNT(DISTINCT performance_data) AS metric_count,
                   COUNT(*) AS record_count,
                   MAX(statistical_start_time) AS latest_data
            FROM performance_data
            WHERE site_code = :site AND statistical_start_time >= :from_time AND statistical_start_time <= :to_time
            """
        )
        pd_row = (await db.execute(pd_q, {"site": site_code, "from_time": from_time, "to_time": now})).first()
        metrics_count = pd_row.metric_count if pd_row else 0
        record_count = pd_row.record_count if pd_row else 0
        latest_data = pd_row.latest_data if pd_row else None

        # Faults count (best-effort)
        try:
            faults_q = text(
                """
                SELECT COUNT(*) FROM fault_performance_data
                WHERE site_code = :site AND statistical_start_time >= :from_time AND statistical_start_time <= :to_time
                """
            )
            faults = (await db.execute(faults_q, {"site": site_code, "from_time": from_time, "to_time": now})).scalar() or 0
        except Exception:
            faults = 0

        # Success rate: สัดส่วนบัคเก็ตเวลาที่มีข้อมูล
        # ใช้ CAGG ที่มีอยู่จริง (cagg_perf_5m_to_1h แทน cagg_ingest_1h)
        try:
            if use_cagg and bucket == '1 hour':
                # ใช้ CAGG ที่มีอยู่จริง
                sr_q = text(
                    """
                    SELECT time_bucket('1 hour', bucket) AS bucket_hour, SUM(value_avg) AS total_value
                    FROM cagg_perf_5m_to_1h
                    WHERE bucket >= :from_time AND bucket <= :to_time AND site_code = :site
                    GROUP BY bucket_hour
                    ORDER BY bucket_hour
                    """
                )
                rows = (await db.execute(sr_q, {"site": site_code, "from_time": from_time, "to_time": now})).fetchall()
                non_empty = len([r for r in rows if (r.total_value or 0) > 0])
            else:
                sr_q = text(
                    f"""
                    SELECT time_bucket(INTERVAL '{bucket}', statistical_start_time) AS ts, COUNT(*) AS cnt
                    FROM performance_data
                    WHERE site_code = :site AND statistical_start_time >= :from_time AND statistical_start_time <= :to_time
                    GROUP BY ts
                    ORDER BY ts
                    """
                )
                rows = (await db.execute(sr_q, {"site": site_code, "from_time": from_time, "to_time": now})).fetchall()
                non_empty = len(rows)
        except Exception as e:
            # Fallback ถ้า CAGG ไม่มีหรือ query ล้มเหลว
            sr_q = text(
                f"""
                SELECT time_bucket(INTERVAL '{bucket}', statistical_start_time) AS ts, COUNT(*) AS cnt
                FROM performance_data
                WHERE site_code = :site AND statistical_start_time >= :from_time AND statistical_start_time <= :to_time
                GROUP BY ts
                ORDER BY ts
                """
            )
            rows = (await db.execute(sr_q, {"site": site_code, "from_time": from_time, "to_time": now})).fetchall()
            non_empty = len(rows)

        # จำนวนบัคเก็ตทั้งหมดในช่วง
        total_buckets = hours if bucket == '1 hour' else max(1, (now - from_time).days)
        success_rate = (non_empty / total_buckets) * 100 if total_buckets > 0 else 0.0

        # Health score แบบง่าย: freshness + completeness
        freshness_score = 100.0
        if latest_data:
            age_hours = max(0.0, (now - latest_data).total_seconds() / 3600.0)
            # หักคะแนนตามชั่วโมงที่ล่าช้า
            freshness_score = max(0.0, 100.0 - min(100.0, age_hours * 5))
        completeness_score = min(100.0, success_rate)
        health_score = round(0.6 * freshness_score + 0.4 * completeness_score, 2)

        return {
            "site_code": site_code,
            "devices": int(devices),
            "metrics": int(metrics_count or 0),
            "datapoints": int(record_count or 0),
            "faults": int(faults or 0),
            "last_import": latest_data.isoformat() if latest_data else None,
            "success_rate": round(success_rate, 2),
            "health_score": health_score,
            "period": {"hours": hours, "bucket": bucket}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึงสรุปไซต์ได้: {e}")


@router.get("/sites/equipment-breakdown")
async def get_equipment_breakdown(
    site_code: str = Query(..., description="รหัสไซต์"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """แยกจำนวนอุปกรณ์ตามประเภท เพื่อนำไปแสดง Pie Chart"""
    try:
        q = text(
            """
            SELECT COALESCE(equipment_type, 'Unknown') AS type, COUNT(*) AS cnt
            FROM performance_equipment_master
            WHERE site_code = :site
            GROUP BY COALESCE(equipment_type, 'Unknown')
            ORDER BY cnt DESC
            """
        )
        rows = (await db.execute(q, {"site": site_code})).fetchall()
        return [{"type": r.type, "count": int(r.cnt or 0)} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึง breakdown อุปกรณ์ได้: {e}")
