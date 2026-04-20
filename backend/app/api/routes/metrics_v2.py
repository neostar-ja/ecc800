"""
New Metrics API v2 - Redesigned based on database analysis
Uses database views for better performance and user-friendly data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import logging

from app.core.database import get_db, execute_raw_query
from app.auth.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/v2")
logger = logging.getLogger(__name__)

# Create separate router for public endpoints (no auth required)
public_router = APIRouter(prefix="/public")
logger = logging.getLogger(__name__)

# Simple in-memory TTL cache for timeseries queries
_timeseries_cache: dict = {}
_TIMESERIES_CACHE_TTL = 60  # seconds

def _cache_get(key: str):
    entry = _timeseries_cache.get(key)
    if not entry:
        return None
    expires_at, data = entry
    import time
    if time.time() > expires_at:
        try:
            del _timeseries_cache[key]
        except KeyError:
            pass
        return None
    return data

def _cache_set(key: str, data: Any, ttl: int = None):
    import time
    if ttl is None:
        ttl = _TIMESERIES_CACHE_TTL
    _timeseries_cache[key] = (time.time() + ttl, data)

# Public endpoints - no authentication required
@public_router.get("/sites")
async def get_sites_summary_public(
    db: AsyncSession = Depends(get_db)
):
    """
    Get sites summary with device and metric counts - PUBLIC ACCESS
    Uses v_sites_summary view
    """
    try:
        query = """
        SELECT
            site_code,
            device_count,
            metric_count,
            last_update,
            first_data,
            CASE
                WHEN last_update > NOW() - INTERVAL '1 hour' THEN 'online'
                WHEN last_update > NOW() - INTERVAL '24 hours' THEN 'warning'
                ELSE 'offline'
            END as status
        FROM v_sites_summary
        ORDER BY site_code;
        """

        results = await execute_raw_query(query, {})

        return [
            {
                "site_code": row["site_code"],
                "device_count": row["device_count"],
                "metric_count": row["metric_count"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "status": row["status"]
            } for row in results
        ]

    except Exception as e:
        logger.error(f"Error getting sites summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลไซต์: {str(e)}"
        )


@public_router.get("/devices")
async def get_devices_by_site_public(
    site_code: str = Query(..., description="รหัสไซต์ (dc/dr)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get devices for a site with display names and metric counts - PUBLIC ACCESS
    Uses v_metrics_by_device view
    """
    try:
        query = """
        SELECT
            device_code,
            equipment_name,
            COUNT(DISTINCT metric_name) as metric_count,
            COUNT(DISTINCT category) as category_count,
            MAX(last_update) as last_update,
            MIN(first_data) as first_data,
            CASE
                WHEN MAX(last_update) > NOW() - INTERVAL '1 hour' THEN 'online'
                WHEN MAX(last_update) > NOW() - INTERVAL '24 hours' THEN 'warning'
                ELSE 'offline'
            END as status
        FROM v_metrics_by_device
        WHERE site_code = :site_code
        GROUP BY device_code, equipment_name
        ORDER BY device_code;
        """

        params = {"site_code": site_code}
        results = await execute_raw_query(query, params)

        return [
            {
                "device_code": row["device_code"],
                "equipment_name": row["equipment_name"],
                "metric_count": row["metric_count"],
                "category_count": row["category_count"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "status": row["status"]
            } for row in results
        ]

    except Exception as e:
        logger.error(f"Error getting devices for site {site_code}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลอุปกรณ์: {str(e)}"
        )


@public_router.get("/metrics")
async def get_metrics_by_device_public(
    site_code: str = Query(..., description="รหัสไซต์"),
    device_code: str = Query(..., description="รหัสอุปกรณ์"),
    category: Optional[str] = Query(None, description="หมวดหมู่เมทริก"),
    include_hidden: bool = Query(False, description="รวมเมทริกที่ซ่อนไว้"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get metrics for specific device grouped by category - PUBLIC ACCESS
    Uses v_metrics_by_device view with display name resolution
    """
    try:
        conditions = ["site_code = :site_code", "device_code = :device_code"]
        params = {"site_code": site_code, "device_code": device_code}

        if category:
            conditions.append("category = :category")
            params["category"] = category

        if not include_hidden:
            conditions.append("is_hidden = false")

        where_clause = " AND ".join(conditions)

        query = f"""
        SELECT
            metric_name,
            metric_name_th,
            metric_name_en,
            unit,
            category,
            decimals,
            is_hidden,
            data_points,
            last_update,
            first_data
        FROM v_metrics_by_device
        WHERE {where_clause}
        ORDER BY category, metric_name_th;
        """

        results = await execute_raw_query(query, params)

        # Group by category
        categories = {}
        for row in results:
            cat = row["category"] or "General"
            if cat not in categories:
                categories[cat] = []

            categories[cat].append({
                "metric_name": row["metric_name"],
                "metric_name_th": row["metric_name_th"],
                "metric_name_en": row["metric_name_en"],
                "unit": row["unit"],
                "decimals": row["decimals"],
                "is_hidden": row["is_hidden"],
                "data_points": row["data_points"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "data_age_hours": (
                    (datetime.now(timezone.utc) - row["last_update"]).total_seconds() / 3600
                    if row["last_update"] else None
                )
            })

        return {
            "site_code": site_code,
            "device_code": device_code,
            "categories": categories
        }

    except Exception as e:
        logger.error(f"Error getting metrics for device {device_code}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลเมทริก: {str(e)}"
        )


@public_router.get("/timeseries")
async def get_timeseries_data_public(
    site_code: str = Query(..., description="รหัสไซต์"),
    device_code: str = Query(..., description="รหัสอุปกรณ์"),
    metrics: str = Query(..., description="รายชื่อเมทริก (คั่นด้วยจุลภาค)"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    interval: str = Query("auto", description="ช่วงเวลา (5m, 1h, 1d, auto)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get time-series data for multiple metrics using v_timeseries_data view - PUBLIC ACCESS
    Returns data optimized for charting with proper display names
    """
    try:
        # Parse metrics list
        metric_list = [m.strip() for m in metrics.split(",") if m.strip()]
        if not metric_list:
            raise HTTPException(status_code=400, detail="ต้องระบุเมทริกอย่างน้อย 1 รายการ")

        # Set default time range
        if not to_time:
            to_time = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            if to_time.tzinfo is not None:
                to_time = to_time.replace(tzinfo=None)

        if not from_time:
            from_time = to_time - timedelta(hours=24)  # Default 24 hours
        else:
            if from_time.tzinfo is not None:
                from_time = from_time.replace(tzinfo=None)

        # Auto-calculate interval
        if interval == "auto":
            time_diff = to_time - from_time
            if time_diff <= timedelta(hours=6):
                interval = "5 minutes"
            elif time_diff <= timedelta(days=7):
                interval = "1 hour"
            else:
                interval = "1 day"

        # Map intervals
        interval_map = {
            "5m": "5 minutes", "1h": "1 hour", "1d": "1 day",
            "5 minutes": "5 minutes", "1 hour": "1 hour", "1 day": "1 day"
        }
        pg_interval = interval_map.get(interval, "1 hour")

        # Build metrics condition
        metric_placeholders = ", ".join([f":metric_{i}" for i in range(len(metric_list))])
        metric_params = {f"metric_{i}": metric for i, metric in enumerate(metric_list)}

        # Debug: Log parameters
        logger.info(f"Timeseries query params: site_code={site_code}, device_code={device_code}, metrics={metric_list}, from_time={from_time}, to_time={to_time}")

        query = f"""
        SELECT
            time_bucket(INTERVAL '{pg_interval}', time) AS timestamp,
            metric_name,
            metric_name_th,
            unit,
            category,
            decimals,
            AVG(value::numeric) AS value,
            COUNT(*) as data_points
        FROM v_timeseries_data
        WHERE site_code = :site_code
          AND device_code = :device_code
          AND metric_name IN ({metric_placeholders})
          AND time >= :from_time
          AND time <= :to_time
          AND value IS NOT NULL
        GROUP BY timestamp, metric_name, metric_name_th, unit, category, decimals
        ORDER BY timestamp, metric_name;
        """

        params = {
            "site_code": site_code,
            "device_code": device_code,
            "from_time": from_time,
            "to_time": to_time,
            **metric_params
        }

        logger.info(f"Final query: {query}")
        logger.info(f"Query params: {params}")

        results = await execute_raw_query(query, params)
        logger.info(f"Query returned {len(results)} rows")

        # Transform data for charting
        series_data = {}
        timestamps = set()

        for row in results:
            metric_key = row["metric_name"]
            timestamp = row["timestamp"].isoformat() if row["timestamp"] else None

            if metric_key not in series_data:
                series_data[metric_key] = {
                    "metric_name": row["metric_name"],
                    "display_name": row["metric_name_th"],
                    "unit": row["unit"],
                    "category": row["category"],
                    "decimals": row["decimals"],
                    "data": []
                }

            if timestamp:
                timestamps.add(timestamp)
                series_data[metric_key]["data"].append({
                    "timestamp": timestamp,
                    "value": float(row["value"]) if row["value"] is not None else None,
                    "data_points": row["data_points"]
                })

        return {
            "site_code": site_code,
            "device_code": device_code,
            "from_time": from_time.isoformat(),
            "to_time": to_time.isoformat(),
            "interval": pg_interval,
            "series": list(series_data.values()),
            "timestamps": sorted(list(timestamps))
        }

    except Exception as e:
        logger.error(f"Error getting timeseries data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล time-series: {str(e)}"
        )


@public_router.get("/status")
async def get_system_status_public(
    db: AsyncSession = Depends(get_db)
):
    """
    Get overall system status summary - PUBLIC ACCESS
    """
    try:
        # Simplified query first
        query = """
        SELECT 
            site_code,
            device_count,
            metric_count,
            last_update,
            first_data
        FROM v_sites_summary
        ORDER BY site_code;
        """
        
        results = await execute_raw_query(query, {})
        
        total_devices = 0
        total_metrics = 0
        sites_list = []
        
        for row in results:
            device_count = int(row["device_count"]) if row["device_count"] else 0
            metric_count = int(row["metric_count"]) if row["metric_count"] else 0
            
            total_devices += device_count
            total_metrics += metric_count
            
            # Calculate hours since update
            hours_since = None
            if row["last_update"]:
                from datetime import datetime, timezone
                last_update = row["last_update"]
                if hasattr(last_update, 'replace') and last_update.tzinfo is None:
                    last_update = last_update.replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                diff = now - last_update
                hours_since = diff.total_seconds() / 3600
            
            status = "online" if hours_since and hours_since < 2 else "warning"
            
            sites_list.append({
                "site_code": row["site_code"],
                "active_devices": device_count,
                "active_metrics": metric_count,
                "latest_data": row["last_update"].isoformat() if row["last_update"] else None,
                "hours_since_update": hours_since,
                "status": status
            })
        
        return {
            "total_devices": total_devices,
            "total_metrics": total_metrics,
            "sites": sites_list
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลสถานะระบบ: {str(e)}"
        )


@router.get("/sites")
async def get_sites_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get sites summary with device and metric counts
    Uses v_sites_summary view
    """
    try:
        query = """
        SELECT 
            site_code,
            device_count,
            metric_count,
            last_update,
            first_data,
            CASE 
                WHEN last_update > NOW() - INTERVAL '1 hour' THEN 'online'
                WHEN last_update > NOW() - INTERVAL '24 hours' THEN 'warning' 
                ELSE 'offline'
            END as status
        FROM v_sites_summary
        ORDER BY site_code;
        """
        
        results = await execute_raw_query(query, {})
        
        return [
            {
                "site_code": row["site_code"],
                "device_count": row["device_count"],
                "metric_count": row["metric_count"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "status": row["status"]
            } for row in results
        ]
        
    except Exception as e:
        logger.error(f"Error getting sites summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลไซต์: {str(e)}"
        )


@router.get("/devices")
async def get_devices_by_site(
    site_code: str = Query(..., description="รหัสไซต์ (dc/dr)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get devices for a site with display names and metric counts
    Uses v_metrics_by_device view
    """
    try:
        query = """
        SELECT 
            device_code,
            equipment_name,
            COUNT(DISTINCT metric_name) as metric_count,
            COUNT(DISTINCT category) as category_count,
            MAX(last_update) as last_update,
            MIN(first_data) as first_data,
            CASE 
                WHEN MAX(last_update) > NOW() - INTERVAL '1 hour' THEN 'online'
                WHEN MAX(last_update) > NOW() - INTERVAL '24 hours' THEN 'warning'
                ELSE 'offline'
            END as status
        FROM v_metrics_by_device 
        WHERE site_code = :site_code 
        GROUP BY device_code, equipment_name
        ORDER BY device_code;
        """
        
        params = {"site_code": site_code}
        results = await execute_raw_query(query, params)
        
        return [
            {
                "device_code": row["device_code"],
                "equipment_name": row["equipment_name"],
                "metric_count": row["metric_count"],
                "category_count": row["category_count"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "status": row["status"]
            } for row in results
        ]
        
    except Exception as e:
        logger.error(f"Error getting devices for site {site_code}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลอุปกรณ์: {str(e)}"
        )


@router.get("/metrics")
async def get_metrics_by_device(
    site_code: str = Query(..., description="รหัสไซต์"),
    device_code: str = Query(..., description="รหัสอุปกรณ์"),
    category: Optional[str] = Query(None, description="หมวดหมู่เมทริก"),
    include_hidden: bool = Query(False, description="รวมเมทริกที่ซ่อนไว้"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get metrics for specific device grouped by category
    Uses v_metrics_by_device view with display name resolution
    """
    try:
        conditions = ["site_code = :site_code", "device_code = :device_code"]
        params = {"site_code": site_code, "device_code": device_code}
        
        if category:
            conditions.append("category = :category")
            params["category"] = category
            
        if not include_hidden:
            conditions.append("is_hidden = false")
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT 
            metric_name,
            metric_name_th,
            metric_name_en,
            unit,
            category,
            decimals,
            is_hidden,
            data_points,
            last_update,
            first_data
        FROM v_metrics_by_device
        WHERE {where_clause}
        ORDER BY category, metric_name_th;
        """
        
        results = await execute_raw_query(query, params)
        
        # Group by category
        categories = {}
        for row in results:
            cat = row["category"] or "General"
            if cat not in categories:
                categories[cat] = []
            
            categories[cat].append({
                "metric_name": row["metric_name"],
                "metric_name_th": row["metric_name_th"],
                "metric_name_en": row["metric_name_en"],
                "unit": row["unit"],
                "decimals": row["decimals"],
                "is_hidden": row["is_hidden"],
                "data_points": row["data_points"],
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
                "first_data": row["first_data"].isoformat() if row["first_data"] else None,
                "data_age_hours": (
                    (datetime.now(timezone.utc) - row["last_update"]).total_seconds() / 3600
                    if row["last_update"] else None
                )
            })
        
        return {
            "site_code": site_code,
            "device_code": device_code,
            "categories": categories
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics for device {device_code}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลเมทริก: {str(e)}"
        )


@router.get("/timeseries")
async def get_timeseries_data(
    site_code: str = Query(..., description="รหัสไซต์"),
    device_code: str = Query(..., description="รหัสอุปกรณ์"),
    metrics: str = Query(..., description="รายชื่อเมทริก (คั่นด้วยจุลภาค)"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    interval: str = Query("auto", description="ช่วงเวลา (5m, 1h, 1d, auto)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get time-series data for multiple metrics using v_timeseries_data view
    Returns data optimized for charting with proper display names
    """
    try:
        # Parse metrics list
        metric_list = [m.strip() for m in metrics.split(",") if m.strip()]
        if not metric_list:
            raise HTTPException(status_code=400, detail="ต้องระบุเมทริกอย่างน้อย 1 รายการ")
        
        # Set default time range
        if not to_time:
            to_time = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            if to_time.tzinfo is not None:
                to_time = to_time.replace(tzinfo=None)
                
        if not from_time:
            from_time = to_time - timedelta(hours=24)  # Default 24 hours
        else:
            if from_time.tzinfo is not None:
                from_time = from_time.replace(tzinfo=None)
        
        # Auto-calculate interval
        if interval == "auto":
            time_diff = to_time - from_time
            if time_diff <= timedelta(hours=6):
                interval = "5 minutes"
            elif time_diff <= timedelta(days=7):
                interval = "1 hour"
            else:
                interval = "1 day"
        
        # Map intervals
        interval_map = {
            "5m": "5 minutes", "1h": "1 hour", "1d": "1 day",
            "5 minutes": "5 minutes", "1 hour": "1 hour", "1 day": "1 day"
        }
        pg_interval = interval_map.get(interval, "1 hour")
        
        # Build metrics condition
        metric_placeholders = ", ".join([f":metric_{i}" for i in range(len(metric_list))])
        metric_params = {f"metric_{i}": metric for i, metric in enumerate(metric_list)}
        
        # Debug: Log parameters
        logger.info(f"Timeseries query params: site_code={site_code}, device_code={device_code}, metrics={metric_list}, from_time={from_time}, to_time={to_time}")
        
        query = f"""
        SELECT 
            time_bucket(INTERVAL '{pg_interval}', time) AS timestamp,
            metric_name,
            metric_name_th,
            unit,
            category,
            decimals,
            AVG(value::numeric) AS value,
            COUNT(*) as data_points
        FROM v_timeseries_data
        WHERE site_code = :site_code
          AND device_code = :device_code
          AND metric_name IN ({metric_placeholders})
          AND time >= :from_time
          AND time <= :to_time
          AND value IS NOT NULL
        GROUP BY timestamp, metric_name, metric_name_th, unit, category, decimals
        ORDER BY timestamp, metric_name;
        """
        
        params = {
            "site_code": site_code,
            "device_code": device_code,
            "from_time": from_time,
            "to_time": to_time,
            **metric_params
        }
        
        logger.info(f"Final query: {query}")
        logger.info(f"Query params: {params}")
        
        results = await execute_raw_query(query, params)
        logger.info(f"Query returned {len(results)} rows")

        # Transform data for charting
        series_data = {}
        timestamps = set()

        for row in results:
            metric_key = row["metric_name"]
            timestamp = row["timestamp"].isoformat() if row["timestamp"] else None

            if metric_key not in series_data:
                series_data[metric_key] = {
                    "metric_name": row["metric_name"],
                    "display_name": row["metric_name_th"],
                    "unit": row["unit"],
                    "category": row["category"],
                    "decimals": row["decimals"],
                    "data": []
                }

            if timestamp:
                timestamps.add(timestamp)
                series_data[metric_key]["data"].append({
                    "timestamp": timestamp,
                    "value": float(row["value"]) if row["value"] is not None else None,
                    "data_points": row["data_points"]
                })

        return {
            "site_code": site_code,
            "device_code": device_code,
            "from_time": from_time.isoformat(),
            "to_time": to_time.isoformat(),
            "interval": pg_interval,
            "series": list(series_data.values()),
            "timestamps": sorted(list(timestamps))
        }
        
    except Exception as e:
        logger.error(f"Error getting timeseries data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล time-series: {str(e)}"
        )


@router.get("/status")
async def get_system_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get overall system status summary
    """
    try:
        query = """
        WITH recent_data AS (
            SELECT 
                site_code,
                COUNT(DISTINCT device_code) as active_devices,
                COUNT(DISTINCT metric_name) as active_metrics,
                MAX(last_update) as latest_data,
                MIN(first_data) as oldest_data
            FROM v_metrics_by_device 
            WHERE last_update > NOW() - INTERVAL '7 days'
            GROUP BY site_code
        )
        SELECT 
            site_code,
            active_devices,
            active_metrics,
            latest_data,
            oldest_data,
            EXTRACT(EPOCH FROM (NOW() - latest_data))/3600 as hours_since_update
        FROM recent_data
        ORDER BY site_code;
        """
        
        results = await execute_raw_query(query, {})
        
        total_devices = sum(row["active_devices"] for row in results)
        total_metrics = sum(row["active_metrics"] for row in results)
        
        return {
            "total_devices": total_devices,
            "total_metrics": total_metrics,
            "sites": [
                {
                    "site_code": row["site_code"],
                    "active_devices": row["active_devices"],
                    "active_metrics": row["active_metrics"],
                    "latest_data": row["latest_data"].isoformat() if row["latest_data"] else None,
                    "hours_since_update": float(row["hours_since_update"]) if row["hours_since_update"] else None,
                    "status": "online" if row["hours_since_update"] and row["hours_since_update"] < 2 else "warning"
                } for row in results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลสถานะระบบ: {str(e)}"
        )
