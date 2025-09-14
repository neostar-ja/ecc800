"""
API Routes สำหรับ Metrics และ Time-series Data
Metrics and Time-series Data API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import logging

from app.core.database import get_db, execute_raw_query
from app.services.auth import get_current_user
from app.schemas.sites import TimeSeriesResponse, TimeSeriesPoint, MetricResponse
from app.schemas.auth import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/metrics")
async def get_metrics(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายชื่อ metrics ที่มีในระบบ
    Get available metrics list
    """
    try:
        conditions = ["1=1"]
        params = {}
        
        if site_code:
            conditions.append("site_code = :site_code")
            params["site_code"] = site_code
            
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
        
        where_clause = " AND ".join(conditions)
        
        # Query for distinct performance metrics from performance_data column
        query = f"""
        SELECT DISTINCT
            performance_data as metric_name,
            performance_data as display_name,
            COUNT(*) as data_points,
            MIN(statistical_start_time) as first_seen,
            MAX(statistical_start_time) as last_seen,
            COALESCE(ANY_VALUE(unit), 'N/A') as unit
        FROM performance_data
        WHERE {where_clause} AND performance_data IS NOT NULL
        GROUP BY performance_data
        ORDER BY metric_name;
        """
        
        results = await execute_raw_query(query, params)
        
        return [
            {
                "metric_name": row["metric_name"],
                "display_name": row["display_name"],
                "data_points": row["data_points"],
                "first_seen": row["first_seen"],
                "last_seen": row["last_seen"],
                "unit": row["unit"]
            } for row in results
        ]
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล metrics: {str(e)}"
        )


@router.get("/data/time-series")
async def get_time_series_data(
    site_code: str = Query(..., description="รหัสไซต์"),
    equipment_id: str = Query(..., description="รหัสอุปกรณ์"),
    metric: str = Query(..., description="ชื่อ metric"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    interval: str = Query("auto", description="ช่วงเวลา (5m, 1h, 1d, auto)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูล time-series สำหรับ metric ที่ระบุ
    Get time-series data for specified metric
    """
    try:
        # กำหนดเวลา default และแปลงให้เป็น timezone-naive
        if not to_time:
            to_time = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            # Convert to timezone-naive if it has timezone info
            if to_time.tzinfo is not None:
                to_time = to_time.replace(tzinfo=None)
                
        if not from_time:
            from_time = to_time - timedelta(days=1)  # Default 1 day
        else:
            # Convert to timezone-naive if it has timezone info
            if from_time.tzinfo is not None:
                from_time = from_time.replace(tzinfo=None)
        
        # Auto-calculate interval based on time range
        if interval == "auto":
            time_diff = to_time - from_time
            if time_diff <= timedelta(days=3):
                interval = "5 minutes"
            elif time_diff <= timedelta(days=90):
                interval = "1 hour"
            else:
                interval = "1 day"
        
        # Map interval to PostgreSQL time_bucket format
        interval_map = {
            "5m": "5 minutes",
            "1h": "1 hour", 
            "1d": "1 day",
            "5 minutes": "5 minutes",
            "1 hour": "1 hour",
            "1 day": "1 day"
        }
        pg_interval = interval_map.get(interval, "1 hour")
        
        # Convert to PostgreSQL INTERVAL format - แปลงเป็น PostgreSQL INTERVAL
        if pg_interval == "5 minutes":
            interval_sql = "INTERVAL '5 minutes'"
        elif pg_interval == "1 hour":
            interval_sql = "INTERVAL '1 hour'"
        elif pg_interval == "1 day":
            interval_sql = "INTERVAL '1 day'"
        else:
            interval_sql = "INTERVAL '1 hour'"
        
        query = f"""
        SELECT 
            time_bucket({interval_sql}, statistical_start_time) AS timestamp,
            AVG(value_numeric)::float8 AS value,
            ANY_VALUE(unit) AS unit
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND performance_data = :metric
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
          AND value_numeric IS NOT NULL
        GROUP BY timestamp
        ORDER BY timestamp;
        """
        
        params = {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric": metric,
            "from_time": from_time,
            "to_time": to_time
        }
        
        results = await execute_raw_query(query, params)
        
        # Convert results to proper format
        data_points = [
            {
                "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
                "value": float(row["value"]) if row["value"] is not None else None,
                "unit": row["unit"]
            }
            for row in results
        ]
        
        return {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric_name": metric,
            "interval": pg_interval,
            "data_points": data_points,
            "from_time": from_time.isoformat(),
            "to_time": to_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting time series data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล time-series: {str(e)}"
        )


@router.get("/data/faults")
async def get_fault_data(
    site_code: str = Query(..., description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์ (ถ้าไม่ระบุจะดูทุกอุปกรณ์)"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    interval: str = Query("auto", description="ช่วงเวลา (5m, 1h, 1d, auto)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูล faults สำหรับไซต์และอุปกรณ์ที่ระบุ
    Get fault data for specified site and equipment
    """
    try:
        # กำหนดเวลา default และแปลงให้เป็น timezone-naive
        if not to_time:
            to_time = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            if to_time.tzinfo is not None:
                to_time = to_time.replace(tzinfo=None)
                
        if not from_time:
            from_time = to_time - timedelta(days=1)
        else:
            if from_time.tzinfo is not None:
                from_time = from_time.replace(tzinfo=None)
        
        # Auto-calculate interval based on time range
        if interval == "auto":
            time_diff = to_time - from_time
            if time_diff <= timedelta(days=3):
                interval = "5 minutes"
            elif time_diff <= timedelta(days=90):
                interval = "1 hour"
            else:
                interval = "1 day"
        
        # Map interval to PostgreSQL time_bucket format
        interval_map = {
            "5m": "5 minutes",
            "1h": "1 hour",
            "1d": "1 day",
            "5 minutes": "5 minutes",
            "1 hour": "1 hour",
            "1 day": "1 day"
        }
        pg_interval = interval_map.get(interval, "1 hour")
        
        # Build query conditions
        conditions = ["site_code = :site_code"]
        params = {
            "site_code": site_code,
            "from_time": from_time,
            "to_time": to_time
        }
        
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
        
        where_clause = " AND ".join(conditions)
        
        # Convert to PostgreSQL INTERVAL format
        if pg_interval == "5 minutes":
            interval_sql = "INTERVAL '5 minutes'"
        elif pg_interval == "1 hour":
            interval_sql = "INTERVAL '1 hour'"
        elif pg_interval == "1 day":
            interval_sql = "INTERVAL '1 day'"
        else:
            interval_sql = "INTERVAL '1 hour'"
            
        query = f"""
        SELECT 
            time_bucket({interval_sql}, statistical_start_time) AS timestamp,
            COUNT(*) AS fault_count,
            ANY_VALUE(severity) AS severity
        FROM fault_performance_data
        WHERE {where_clause}
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
        GROUP BY timestamp
        ORDER BY timestamp;
        """
        
        results = await execute_raw_query(query, params)
        
        # Convert results to proper format
        fault_points = [
            {
                "timestamp": row["timestamp"].isoformat() if row["timestamp"] else None,
                "fault_count": int(row["fault_count"]) if row["fault_count"] else 0,
                "severity": row["severity"],
                "equipment_id": equipment_id
            }
            for row in results
        ]
        
        total_faults = sum(point["fault_count"] for point in fault_points)
        
        return {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "interval": pg_interval,
            "faults": fault_points,
            "total_faults": total_faults,
            "from_time": from_time.isoformat(),
            "to_time": to_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting fault data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล fault: {str(e)}"
        )
