"""
API endpoints สำหรับข้อมูล Time-series และ Analytics
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.schemas.sites import TimeSeriesResponse, FaultResponse, KPIResponse, TimeSeriesPoint, FaultPoint
from app.api.auth import get_active_user
from app.models.base import User

router = APIRouter()


def determine_interval(from_time: datetime, to_time: datetime) -> str:
    """กำหนด interval อัตโนมัติตามช่วงเวลา"""
    duration = to_time - from_time
    
    if duration <= timedelta(days=3):
        return '5 minutes'
    elif duration <= timedelta(days=90):
        return '1 hour'
    else:
        return '1 day'


@router.get("/data/time-series", response_model=TimeSeriesResponse)
async def get_time_series_data(
    site_code: str = Query(..., description="รหัสไซต์"),
    equipment_id: str = Query(..., description="รหัสอุปกรณ์"),
    metric: str = Query(..., description="ชื่อ metric"),
    from_time: datetime = Query(..., description="เริ่มจากเวลา (ISO format)"),
    to_time: datetime = Query(..., description="ถึงเวลา (ISO format)"),
    interval: Optional[str] = Query("auto", description="ช่วงเวลา (auto, 5min, 1hour, 1day)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """ดึงข้อมูล Time-series"""
    
    # กำหนด interval อัตโนมัติ
    if interval == "auto":
        interval = determine_interval(from_time, to_time)
    
    # แมป interval เป็นรูปแบบ PostgreSQL
    interval_map = {
        "5min": "5 minutes",
        "1hour": "1 hour", 
        "1day": "1 day",
        "5 minutes": "5 minutes",
        "1 hour": "1 hour",
        "1 day": "1 day"
    }
    pg_interval = interval_map.get(interval, "5 minutes")
    
    # Convert to PostgreSQL INTERVAL format - แปลงเป็น PostgreSQL INTERVAL
    if pg_interval == "5 minutes":
        interval_sql = "INTERVAL '5 minutes'"
    elif pg_interval == "1 hour":
        interval_sql = "INTERVAL '1 hour'"
    elif pg_interval == "1 day":
        interval_sql = "INTERVAL '1 day'"
    else:
        interval_sql = "INTERVAL '5 minutes'"
    
    # หาคอลัมน์ที่เก็บ metric และ value
    columns_query = text("""
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_name = 'performance_data' 
        AND table_schema = 'public'
        AND column_name IN ('performance_data', 'metric_name', 'kpi_name', 'parameter_name');
    """)
    
    columns_result = await db.execute(columns_query)
    metric_columns = [row.column_name for row in columns_result.fetchall()]
    metric_column = metric_columns[0] if metric_columns else 'performance_data'
    
    # หาคอลัมน์ value
    value_columns_query = text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'performance_data'
        AND table_schema = 'public'
        AND data_type IN ('numeric', 'double precision', 'real', 'integer', 'bigint');
    """)
    
    value_columns_result = await db.execute(value_columns_query)
    value_columns = [row.column_name for row in value_columns_result.fetchall()]
    value_column = next((col for col in value_columns if 'value' in col.lower()), value_columns[0] if value_columns else 'value')
    
    # สร้าง query
    query = text(f"""
        SELECT time_bucket_gapfill({interval_sql}, statistical_start_time) AS t,
               AVG({value_column})::float8 AS v,
               'unit' AS unit
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND {metric_column} = :metric
          AND statistical_start_time BETWEEN :from_time AND :to_time
        GROUP BY t
        ORDER BY t;
    """)
    
    try:
        result = await db.execute(query, {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric": metric,
            "from_time": from_time,
            "to_time": to_time
        })
        rows = result.fetchall()
    except Exception as e:
        # ถ้า time_bucket_gapfill ไม่มี ใช้ time_bucket ธรรมดา
        simple_query = text(f"""
            SELECT date_trunc('hour', statistical_start_time) AS t,
                   AVG({value_column})::float8 AS v,
                   'unit' AS unit
            FROM performance_data
            WHERE site_code = :site_code
              AND equipment_id = :equipment_id
              AND {metric_column} = :metric
              AND statistical_start_time BETWEEN :from_time AND :to_time
            GROUP BY t
            ORDER BY t;
        """)
        
        result = await db.execute(simple_query, {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric": metric,
            "from_time": from_time,
            "to_time": to_time
        })
        rows = result.fetchall()
    
    # แปลงผลลัพธ์
    data_points = []
    for row in rows:
        data_points.append(TimeSeriesPoint(
            timestamp=row.t,
            value=row.v,
            unit=row.unit
        ))
    
    return TimeSeriesResponse(
        site_code=site_code,
        equipment_id=equipment_id,
        metric_name=metric,
        interval=interval,
        data_points=data_points,
        from_time=from_time,
        to_time=to_time
    )


@router.get("/faults", response_model=FaultResponse)
async def get_faults_data(
    site_code: str = Query(..., description="รหัสไซต์"),
    from_time: datetime = Query(..., description="เริ่มจากเวลา"),
    to_time: datetime = Query(..., description="ถึงเวลา"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    severity: Optional[str] = Query(None, description="ระดับความรุนแรง"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """ดึงข้อมูล Faults/ปัญหา"""
    
    # กำหนด interval
    interval = determine_interval(from_time, to_time)
    
    # หาคอลัมน์ severity
    severity_columns_query = text("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'fault_performance_data'
        AND table_schema = 'public'
        AND column_name IN ('severity', 'fault_severity', 'level', 'priority');
    """)
    
    severity_result = await db.execute(severity_columns_query)
    severity_columns = [row.column_name for row in severity_result.fetchall()]
    severity_column = severity_columns[0] if severity_columns else 'severity'
    
    # สร้าง query
    base_query = f"""
        SELECT date_trunc('hour', statistical_start_time) AS t,
               COUNT(*) AS fault_count,
               ANY_VALUE({severity_column}) AS severity
        FROM fault_performance_data
        WHERE site_code = :site_code
          AND statistical_start_time BETWEEN :from_time AND :to_time
    """
    
    params = {
        "site_code": site_code,
        "from_time": from_time,
        "to_time": to_time
    }
    
    if equipment_id:
        base_query += " AND equipment_id = :equipment_id"
        params["equipment_id"] = equipment_id
    
    if severity:
        base_query += f" AND {severity_column} = :severity"
        params["severity"] = severity
    
    base_query += " GROUP BY t ORDER BY t"
    
    result = await db.execute(text(base_query), params)
    rows = result.fetchall()
    
    # แปลงผลลัพธ์
    faults = []
    total_faults = 0
    
    for row in rows:
        faults.append(FaultPoint(
            timestamp=row.t,
            fault_count=row.fault_count,
            severity=row.severity
        ))
        total_faults += row.fault_count
    
    return FaultResponse(
        site_code=site_code,
        equipment_id=equipment_id,
        interval=interval,
        faults=faults,
        total_faults=total_faults,
        from_time=from_time,
        to_time=to_time
    )


@router.get("/reports/kpi", response_model=KPIResponse)
async def get_kpi_report(
    site_code: str = Query(..., description="รหัสไซต์"),
    from_time: datetime = Query(..., description="เริ่มจากเวลา"),
    to_time: datetime = Query(..., description="ถึงเวลา"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """สร้างรายงาน KPI สำหรับไซต์"""
    
    # หาข้อมูลสรุปจาก performance_data
    kpi_query = text("""
        SELECT 
            COUNT(DISTINCT equipment_id) as equipment_count,
            COUNT(*) as total_data_points,
            MIN(statistical_start_time) as first_data,
            MAX(statistical_start_time) as last_data
        FROM performance_data
        WHERE site_code = :site_code
          AND statistical_start_time BETWEEN :from_time AND :to_time;
    """)
    
    kpi_result = await db.execute(kpi_query, {
        "site_code": site_code,
        "from_time": from_time,
        "to_time": to_time
    })
    kpi_row = kpi_result.fetchone()
    
    # นับ faults
    fault_query = text("""
        SELECT COUNT(*) as fault_count
        FROM fault_performance_data  
        WHERE site_code = :site_code
          AND statistical_start_time BETWEEN :from_time AND :to_time;
    """)
    
    fault_result = await db.execute(fault_query, {
        "site_code": site_code,
        "from_time": from_time,
        "to_time": to_time
    })
    fault_count = fault_result.scalar() or 0
    
    # สร้าง metrics dictionary
    metrics = {
        "equipment_count": kpi_row.equipment_count or 0,
        "total_data_points": kpi_row.total_data_points or 0,
        "fault_count": fault_count,
        "first_data": kpi_row.first_data.isoformat() if kpi_row.first_data else None,
        "last_data": kpi_row.last_data.isoformat() if kpi_row.last_data else None,
        "data_coverage_hours": None
    }
    
    if kpi_row.first_data and kpi_row.last_data:
        duration = kpi_row.last_data - kpi_row.first_data
        metrics["data_coverage_hours"] = duration.total_seconds() / 3600
    
    summary = f"ไซต์ {site_code}: พบอุปกรณ์ {metrics['equipment_count']} เครื่อง, ข้อมูล {metrics['total_data_points']} จุด, ปัญหา {fault_count} ครั้ง"
    
    return KPIResponse(
        site_code=site_code,
        from_time=from_time,
        to_time=to_time,
        metrics=metrics,
        summary=summary
    )
