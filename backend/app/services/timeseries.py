"""
Time series data service for ECC800
บริการข้อมูลเวลาสำหรับ ECC800
"""
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.discovery import Discovery, DiscoveryResult

def choose_interval(ts_from: datetime, ts_to: datetime) -> str:
    """
    Auto-choose time bucket interval based on date range
    เลือก interval สำหรับ time bucket อัตโนมัติตามช่วงเวลา
    """
    delta = ts_to - ts_from
    minutes = delta.total_seconds() / 60.0
    
    if minutes <= 3 * 24 * 60:   # ≤ 3 วัน
        return "5 minutes"
    elif minutes <= 90 * 24 * 60:  # ≤ 90 วัน
        return "1 hour"
    else:
        return "1 day"

async def fetch_timeseries(
    session: AsyncSession,
    disc: DiscoveryResult,
    site_code: str,
    equipment_id: str,
    metric: str,
    dt_from: datetime,
    dt_to: datetime,
    interval: Optional[str] = None,
    limit_points: int = 1000,
) -> Dict[str, Any]:
    """
    Fetch time series data with automatic bucketing
    ดึงข้อมูลเวลาด้วยการจัดกลุ่มอัตโนมัติ
    """
    # Ensure timezone awareness - ตรวจสอบ timezone
    if dt_from.tzinfo is None:  
        dt_from = dt_from.replace(tzinfo=timezone.utc)
    if dt_to.tzinfo is None:    
        dt_to = dt_to.replace(tzinfo=timezone.utc)
    
    # Convert to naive UTC for database comparison (since columns are stored as timestamp without timezone)
    dt_from = dt_from.astimezone(timezone.utc).replace(tzinfo=None)
    dt_to = dt_to.astimezone(timezone.utc).replace(tzinfo=None)
    
    if interval is None:        
        interval = choose_interval(dt_from, dt_to)

    p = disc.perf
    t_ident = Discovery.ident(p.table)
    tc = Discovery.ident(p.time_col)
    sc = Discovery.ident(p.site_col)
    ec = Discovery.ident(p.eq_id_col)
    mc = Discovery.ident(p.metric_col) if p.metric_col else None
    vc = Discovery.ident(p.value_col) if p.value_col else None
    uc = Discovery.ident(p.unit_col) if p.unit_col else None

    # Build SELECT expressions - สร้างนิพจน์ SELECT
    val_expr = f"AVG({vc})::float8 AS v" if vc else "COUNT(*)::float8 AS v"
    unit_expr = f"MAX({uc}) AS unit" if uc else "NULL::text AS unit"

    # Use gapfill if TimescaleDB available - use time_bucket/time_bucket_gapfill
    bucket_func = "time_bucket_gapfill" if disc.has_timescaledb else None
    
    # Convert interval string to PostgreSQL interval format
    if interval == "5 minutes":
        interval_sql = "INTERVAL '5 minutes'"
    elif interval == "1 hour":
        interval_sql = "INTERVAL '1 hour'"
    elif interval == "1 day":
        interval_sql = "INTERVAL '1 day'"
    else:
        # Default to 5 minutes if unknown interval
        interval_sql = "INTERVAL '5 minutes'"
    
    # Metric filter if column exists - ฟิลเตอร์ metric ถ้ามีคอลัมน์
    metric_filter = f"AND {mc} = :metric" if mc else ""

    # Build bucket expression depending on TimescaleDB availability.
    if bucket_func:
        bucket_expr = f"{bucket_func}({interval_sql}, {tc})"
    else:
        # Emulate buckets using date_trunc. PostgreSQL date_trunc doesn't accept
        # '5 minute' as a field, so emulate 5-minute bins with arithmetic.
        if interval_sql == "INTERVAL '5 minutes'":
            bucket_expr = (
                "date_trunc('minute', " + tc + ") - "
                "(EXTRACT(MINUTE FROM " + tc + ")::integer % 5) * INTERVAL '1 minute'"
            )
        elif interval_sql == "INTERVAL '1 hour'":
            bucket_expr = f"date_trunc('hour', {tc})"
        else:
            bucket_expr = f"date_trunc('day', {tc})"

    sql = f"""
    WITH series AS (
      SELECT {bucket_expr} AS t,
             {val_expr},
             {unit_expr}
      FROM {t_ident}
      WHERE {sc} = :site
        AND {ec} = :eid
        AND {tc} BETWEEN :from AND :to
        {metric_filter}
      GROUP BY t
      ORDER BY t
    )
    SELECT * FROM series
    LIMIT :lim
    """

    params = {
        "site": site_code,
        "eid": equipment_id,
        "from": dt_from,
        "to": dt_to,
        "lim": limit_points,
    }
    
    # Add metric parameter if needed - เพิ่มพารามิเตอร์ metric ถ้าจำเป็น
    if mc:
        params["metric"] = metric

    try:
        rs = await session.execute(text(sql), params)
        rows = []
        for r in rs:
            unit_val = r[2] if len(r) > 2 else None
            rows.append({
                "t": r[0].isoformat() if r[0] else None,
                "v": float(r[1]) if r[1] is not None else None,
                "unit": unit_val
            })
        
        # Get first non-null unit for response metadata
        first_unit = None
        for row in rows:
            if row["unit"]:
                first_unit = row["unit"]
                break
        
        return {
            "meta": {
                "interval": interval, 
                "rows": len(rows),
                "unit": first_unit,
                "table_used": p.table
            }, 
            "data": rows
        }
    except Exception as e:
        raise Exception(f"Error fetching time series: {str(e)}")

async def fetch_faults(
    session: AsyncSession,
    disc: DiscoveryResult,
    site_code: str,
    equipment_id: Optional[str] = None,
    dt_from: Optional[datetime] = None,
    dt_to: Optional[datetime] = None,
    severity: Optional[str] = None,
    interval: Optional[str] = None,
    limit_points: int = 1000,
) -> Dict[str, Any]:
    """
    Fetch fault data with bucketing
    ดึงข้อมูลความผิดพลาดด้วยการจัดกลุ่ม
    """
    if not disc.fault:
        return {"meta": {"interval": interval, "rows": 0}, "data": []}

    # Default time range if not provided - ช่วงเวลาเริ่มต้นถ้าไม่ระบุ
    if dt_from is None:
        dt_from = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    if dt_to is None:
        dt_to = datetime.now(timezone.utc)
    
    # Ensure timezone awareness
    if dt_from.tzinfo is None:  
        dt_from = dt_from.replace(tzinfo=timezone.utc)
    if dt_to.tzinfo is None:    
        dt_to = dt_to.replace(tzinfo=timezone.utc)
    
    # Convert to naive UTC for database comparison (since columns are stored as timestamp without timezone)
    dt_from = dt_from.astimezone(timezone.utc).replace(tzinfo=None)
    dt_to = dt_to.astimezone(timezone.utc).replace(tzinfo=None)
    
    if interval is None:        
        interval = choose_interval(dt_from, dt_to)

    f = disc.fault
    t_ident = Discovery.ident(f.table)
    tc = Discovery.ident(f.time_col)
    sc = Discovery.ident(f.site_col)
    ec = Discovery.ident(f.eq_id_col)
    sev_col = Discovery.ident(f.severity_col) if f.severity_col else None

    # Build WHERE conditions - สร้างเงื่อนไข WHERE
    where_conditions = [f"{sc} = :site"]
    params = {"site": site_code, "from": dt_from, "to": dt_to, "interval": interval, "lim": limit_points}
    
    if equipment_id:
        where_conditions.append(f"{ec} = :eid")
        params["eid"] = equipment_id
    
    if severity and sev_col:
        where_conditions.append(f"{sev_col} = :severity")
        params["severity"] = severity

    where_conditions.append(f"{tc} BETWEEN :from AND :to")
    where_clause = " AND ".join(where_conditions)

    # Severity expression
    sev_expr = f"MAX({sev_col}) AS severity" if sev_col else "NULL::text AS severity"

    bucket_func = "time_bucket" if disc.has_timescaledb else "date_trunc"
    
    # Convert interval string to PostgreSQL interval format - แปลง interval string เป็น PostgreSQL interval
    if interval == "5 minutes":
        interval_sql = "INTERVAL '5 minutes'"
    elif interval == "1 hour":
        interval_sql = "INTERVAL '1 hour'"
    elif interval == "1 day":
        interval_sql = "INTERVAL '1 day'"
    else:
        # Default to 5 minutes if unknown interval
        interval_sql = "INTERVAL '5 minutes'"
    
    bucket_expr = f"{bucket_func}({interval_sql}, {tc})" if disc.has_timescaledb else f"date_trunc('hour', {tc})"

    sql = f"""
    WITH fault_series AS (
      SELECT {bucket_expr} AS t,
             COUNT(*) AS fault_count,
             {sev_expr}
      FROM {t_ident}
      WHERE {where_clause}
      GROUP BY t
      ORDER BY t
    )
    SELECT * FROM fault_series
    LIMIT :lim
    """

    try:
        rs = await session.execute(text(sql), params)
        rows = []
        for r in rs:
            rows.append({
                "t": r[0].isoformat() if r[0] else None,
                "fault_count": int(r[1]) if r[1] is not None else 0,
                "severity": r[2] if len(r) > 2 else None
            })
        
        return {
            "meta": {
                "interval": interval, 
                "rows": len(rows),
                "table_used": f.table
            }, 
            "data": rows
        }
    except Exception as e:
        raise Exception(f"Error fetching faults: {str(e)}")
