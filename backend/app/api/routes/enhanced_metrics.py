"""
Enhanced Metrics API Routes with Modern Analytics
API สำหรับ Metrics ที่ปรับปรุงแล้วพร้อมการวิเคราะห์สมัยใหม่
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import logging

from app.core.database import get_db, execute_raw_query
from app.auth.dependencies import get_current_user
from app.models.models import User
from app.schemas.sites import DetailedMetricResponse, MetricInfo, MetricStats, MetricValue

router = APIRouter()
logger = logging.getLogger(__name__)


# --- Helpers: safe coercion to avoid bad DB payloads ---
def _safe_int(v, default=0):
    try:
        if v is None:
            return default
        return int(v)
    except Exception:
        try:
            return int(float(str(v)))
        except Exception:
            return default


def _safe_float(v, default=0.0):
    try:
        if v is None:
            return default
        return float(v)
    except Exception:
        try:
            s = str(v).strip()
            return float(s) if s not in ("", "none", "null") else default
        except Exception:
            return default


def _safe_datetime(v, default=None):
    """แปลง datetime ให้ปลอดภัย
    
    ข้อมูลในฐานข้อมูลถูกบันทึกเป็น Bangkok time (UTC+7) แล้ว
    ส่งตรงๆ ไปที่ frontend โดยไม่ต้องแปลง
    """
    if v is None:
        return default or datetime(1970, 1, 1)
    if isinstance(v, datetime):
        return v
    try:
        dt = datetime.fromisoformat(str(v))
        return dt
    except Exception:
        try:
            dt = datetime.fromtimestamp(float(v))
            return dt
        except Exception:
            return default or datetime(1970, 1, 1)


def _datetime_to_iso_bangkok(dt):
    """แปลง datetime เป็น ISO format
    
    ข้อมูลในฐานข้อมูลเก็บเป็น Bangkok time (UTC+7) อยู่แล้ว
    ส่ง ISO format โดยไม่ต้องเพิ่ม timezone suffix
    Frontend ใช้ regex parse โดยไม่สนใจ timezone อยู่แล้ว
    """
    if dt is None:
        return None
    if isinstance(dt, datetime):
        # ส่ง ISO format โดยไม่เพิ่ม timezone suffix
        return dt.isoformat()
    return None


# Response Models
class MetricInfo(BaseModel):
    metric_name: str
    display_name: str
    unit: str
    data_points: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    category: str
    description: str
    icon: str
    color: str

class MetricValue(BaseModel):
    timestamp: datetime
    value: float
    unit: str

class MetricStats(BaseModel):
    min: float
    max: float
    avg: float
    median: float
    std_dev: float
    count: int
    latest: float
    trend: str  # increasing, decreasing, stable

class DetailedMetricResponse(BaseModel):
    metric: MetricInfo
    statistics: MetricStats
    data_points: List[MetricValue]
    time_range: Dict[str, str]
    site_code: str
    equipment_id: str

class MetricCategory(BaseModel):
    name: str
    display_name: str
    icon: str
    color: str
    description: str
    metrics: List[MetricInfo]

def categorize_metric(metric_name: str, unit: str) -> Dict[str, str]:
    """Categorize metrics based on name and unit"""
    metric_lower = metric_name.lower()
    
    if 'temperature' in metric_lower or '℃' in unit or 'temp' in metric_lower:
        return {
            'category': 'environmental',
            'display_name': 'อุณหภูมิ',
            'icon': '🌡️',
            'color': '#f44336',
            'description': 'การวัดอุณหภูมิของสภาพแวดล้อม'
        }
    elif 'humidity' in metric_lower or '%rh' in unit.lower() or 'rh' in metric_lower:
        return {
            'category': 'environmental',
            'display_name': 'ความชื้น',
            'icon': '💧',
            'color': '#2196f3',
            'description': 'ความชื้นสัมพัทธ์ในอากาศ'
        }
    elif 'current' in metric_lower or 'amp' in unit.lower() or unit == 'A':
        return {
            'category': 'electrical',
            'display_name': 'กระแสไฟฟ้า',
            'icon': '⚡',
            'color': '#ff9800',
            'description': 'กระแสไฟฟ้าที่ใช้งาน'
        }
    elif 'power' in metric_lower or 'watt' in unit.lower() or unit == 'W':
        return {
            'category': 'electrical',
            'display_name': 'กำลังไฟฟ้า',
            'icon': '🔌',
            'color': '#ff5722',
            'description': 'กำลังไฟฟ้าที่ใช้งาน'
        }
    elif 'voltage' in metric_lower or 'volt' in unit.lower() or unit == 'V':
        return {
            'category': 'electrical',
            'display_name': 'แรงดันไฟฟ้า',
            'icon': '⚡',
            'color': '#9c27b0',
            'description': 'แรงดันไฟฟ้าระบบ'
        }
    elif 'energy' in metric_lower or 'kwh' in unit.lower():
        return {
            'category': 'electrical',
            'display_name': 'พลังงานไฟฟ้า',
            'icon': '🔋',
            'color': '#4caf50',
            'description': 'พลังงานไฟฟ้าสะสม'
        }
    elif 'load' in metric_lower or 'factor' in metric_lower:
        return {
            'category': 'performance',
            'display_name': 'ประสิทธิภาพระบบ',
            'icon': '📊',
            'color': '#00bcd4',
            'description': 'อัตราการใช้งานระบบ'
        }
    elif 'status' in metric_lower or 'switch' in metric_lower:
        return {
            'category': 'status',
            'display_name': 'สถานะระบบ',
            'icon': '🚦',
            'color': '#607d8b',
            'description': 'สถานะการทำงานของอุปกรณ์'
        }
    else:
        return {
            'category': 'other',
            'display_name': 'อื่นๆ',
            'icon': '📈',
            'color': '#795548',
            'description': 'ข้อมูลอื่นๆ'
        }

@router.get("/enhanced-metrics")
async def get_enhanced_metrics(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    period: Optional[str] = Query('7d', description="ช่วงเวลา (1d, 7d, 30d, 90d)"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงรายชื่อ metrics แบบเรียบง่าย ไม่แบ่งกลุ่ม (Optimized with time filter)
    Get simple metrics list without categories
    """
    try:
        # Calculate time range based on period for better performance
        period_map = {
            '1d': timedelta(days=1),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90),
        }
        delta = period_map.get(period, timedelta(days=7))
        # ใช้ Bangkok timezone (UTC+7) เพื่อให้ตรงกับเวลาในฐานข้อมูล
        bangkok_tz = timezone(timedelta(hours=7))
        from_time = datetime.now(bangkok_tz).replace(tzinfo=None) - delta
        
        conditions = ["performance_data IS NOT NULL"]
        conditions.append("statistical_start_time >= :from_time")  # Critical for performance!
        params = {"from_time": from_time}
        
        if site_code:
            conditions.append("site_code = :site_code")
            params["site_code"] = site_code
            
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
        
        where_clause = " AND ".join(conditions)
        
        # Optimized query with time filter - dramatically faster on hypertables
        query = f"""
        WITH metric_stats AS (
            SELECT 
                performance_data as metric_name,
                COALESCE(unit, 'N/A') as unit,
                COUNT(*) as data_points,
                MIN(statistical_start_time) as first_seen,
                MAX(statistical_start_time) as last_seen,
                AVG(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as avg_value,
                MIN(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as min_value,
                MAX(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as max_value,
                COUNT(CASE WHEN value_numeric IS NOT NULL THEN 1 END) as valid_readings
            FROM performance_data
            WHERE {where_clause}
            GROUP BY performance_data, unit
        ),
        latest_values AS (
            SELECT DISTINCT ON (performance_data)
                performance_data,
                value_numeric as latest_value,
                statistical_start_time as latest_time
            FROM performance_data
            WHERE {where_clause}
              AND value_numeric IS NOT NULL
            ORDER BY performance_data, statistical_start_time DESC
        )
        SELECT 
            ms.metric_name,
            ms.unit,
            ms.data_points,
            ms.first_seen,
            ms.last_seen,
            ms.avg_value,
            ms.min_value,
            ms.max_value,
            ms.valid_readings,
            lv.latest_value,
            lv.latest_time
        FROM metric_stats ms
        LEFT JOIN latest_values lv ON ms.metric_name = lv.performance_data
        WHERE ms.valid_readings > 0  -- Filter out metrics with no valid numeric data
        ORDER BY ms.valid_readings DESC, ms.metric_name;
        """
        
        results = await execute_raw_query(query, params)
        
        # Normalize rows: support dict, row proxy, or tuple
        normalized_results = []
        for row in results:
            if isinstance(row, dict):
                normalized_results.append(row)
                continue
            try:
                keys = getattr(row, 'keys', None) and row.keys()
                if keys:
                    normalized_results.append({k: row[k] for k in keys})
                    continue
            except Exception:
                pass
            try:
                # tuple/iterable fallback
                normalized_results.append({
                    'metric_name': row[0],
                    'unit': row[1],
                    'data_points': row[2],
                    'first_seen': row[3],
                    'last_seen': row[4],
                    'avg_value': row[5],
                    'min_value': row[6],
                    'max_value': row[7],
                    'valid_readings': row[8],
                    'latest_value': row[9] if len(row) > 9 else None,
                    'latest_time': row[10] if len(row) > 10 else None,
                })
            except Exception:
                normalized_results.append({
                    'metric_name': str(row), 
                    'unit': 'N/A', 
                    'data_points': 0,
                    'valid_readings': 0
                })

        metrics_list = []
        for row in normalized_results:
            try:
                metric_info = categorize_metric(row.get("metric_name", ""), row.get("unit", ""))
                
                # Calculate trend using safe coercion
                avg_val = _safe_float(row.get('avg_value'))
                latest_val = _safe_float(row.get('latest_value'))
                if avg_val > 0 and latest_val > 0:
                    if latest_val > avg_val * 1.05:
                        trend = "increasing"
                    elif latest_val < avg_val * 0.95:
                        trend = "decreasing"
                    else:
                        trend = "stable"
                else:
                    trend = "unknown"
                
                # Build plain dict with safe coercion to avoid Pydantic validation errors
                latest_time_raw = row.get('latest_time')
                latest_time_converted = _safe_datetime(latest_time_raw) if latest_time_raw else None
                latest_time_iso = _datetime_to_iso_bangkok(latest_time_converted) if latest_time_converted else None
                
                # Debug logging for timezone fix - ใช้ logger.warning เพื่อให้แน่ใจว่าแสดงผล
                if latest_time_raw:
                    logger.warning(f"[TIMEZONE_DEBUG] {row.get('metric_name')}: raw={latest_time_raw}, converted={latest_time_converted}, iso={latest_time_iso}")
                
                metric_dict = {
                    'metric_name': row.get('metric_name'),
                    'display_name': row.get('metric_name'),
                    'unit': row.get('unit') or '',
                    'data_points': _safe_int(row.get('data_points')),
                    'valid_readings': _safe_int(row.get('valid_readings')),
                    'first_seen': _datetime_to_iso_bangkok(_safe_datetime(row.get('first_seen'))) if row.get('first_seen') else None,
                    'last_seen': _datetime_to_iso_bangkok(_safe_datetime(row.get('last_seen'))) if row.get('last_seen') else None,
                    'latest_value': _safe_float(row.get('latest_value')),
                    'latest_time': latest_time_iso,
                    'avg_value': _safe_float(row.get('avg_value')),
                    'min_value': _safe_float(row.get('min_value')),
                    'max_value': _safe_float(row.get('max_value')),
                    'category': metric_info['category'],
                    'description': metric_info['description'],
                    'icon': metric_info['icon'],
                    'color': metric_info['color'],
                    'trend': trend
                }
                metrics_list.append(metric_dict)
            except Exception as me:
                logger.warning(f"Skipping malformed metric row for {row.get('metric_name')}: {me}")
        
        return {
            'metrics': metrics_list,
            'total_count': len(metrics_list),
            'site_code': site_code,
            'equipment_id': equipment_id
        }
        
    except Exception as e:
        logger.error(f"Error getting enhanced metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล metrics: {str(e)}"
        )

@router.get("/metric/details", response_model=DetailedMetricResponse)
async def get_metric_details(
    metric_name: str = Query(..., description="ชื่อ metric"),
    site_code: str = Query(..., description="รหัสไซต์"),
    equipment_id: str = Query(..., description="รหัสอุปกรณ์"),
    period: str = Query("24h", description="ช่วงเวลา (1h, 4h, 24h, 3d, 7d, 30d, custom)"),
    start_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น (สำหรับ custom)"),
    end_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด (สำหรับ custom)"),
    interval: str = Query("auto", description="ช่วงการรวมข้อมูล (auto, 5m, 1h, 1d)"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงข้อมูลรายละเอียดของ metric พร้อมสถิติและกราฟ
    Get detailed metric information with statistics and chart data
    """
    try:
        # Calculate time range
        # ใช้ Bangkok timezone (UTC+7) เพื่อให้ตรงกับเวลาในฐานข้อมูล
        bangkok_tz = timezone(timedelta(hours=7))
        now = datetime.now(bangkok_tz).replace(tzinfo=None)
        
        if period == "custom" and start_time and end_time:
            from_time = start_time.replace(tzinfo=None) if start_time.tzinfo else start_time
            to_time = end_time.replace(tzinfo=None) if end_time.tzinfo else end_time
        else:
            period_map = {
                "1h": timedelta(hours=1),
                "4h": timedelta(hours=4),
                "24h": timedelta(days=1),
                "3d": timedelta(days=3),
                "7d": timedelta(days=7),
                "30d": timedelta(days=30)
            }
            delta = period_map.get(period, timedelta(days=1))
            from_time = now - delta
            to_time = now
        
        # Auto-calculate interval
        if interval == "auto":
            time_diff = to_time - from_time
            if time_diff <= timedelta(hours=6):
                pg_interval = "5 minutes"
            elif time_diff <= timedelta(days=3):
                pg_interval = "1 hour"
            else:
                pg_interval = "1 day"
        else:
            interval_map = {"5m": "5 minutes", "1h": "1 hour", "1d": "1 day"}
            pg_interval = interval_map.get(interval, "1 hour")
        
        # Get metric info and statistics
        stats_query = f"""
        SELECT 
            performance_data as metric_name,
            COALESCE(unit, 'N/A') as unit,
            COUNT(*) as data_points,
            MIN(statistical_start_time) as first_seen,
            MAX(statistical_start_time) as last_seen,
            AVG(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as avg_value,
            MIN(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as min_value,
            MAX(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as max_value,
            STDDEV(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as std_dev,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value_numeric) as median_value
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND performance_data = :metric_name
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
          AND value_numeric IS NOT NULL
        GROUP BY performance_data, unit;
        """
        
        stats_params = {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric_name": metric_name,
            "from_time": from_time,
            "to_time": to_time
        }
        
        stats_result = await execute_raw_query(stats_query, stats_params)
        
        if not stats_result:
            # Return empty response instead of 404 for metrics with no valid data
            metric_info = categorize_metric(metric_name, "N/A")
            return DetailedMetricResponse(
                metric=MetricInfo(
                    metric_name=metric_name,
                    display_name=metric_name,
                    unit="N/A",
                    data_points=0,
                    first_seen=None,
                    last_seen=None,
                    category=metric_info['category'],
                    description=f"{metric_info['description']} (ไม่มีข้อมูล)",
                    icon=metric_info['icon'],
                    color=metric_info['color']
                ),
                statistics=MetricStats(
                    min=0.0,
                    max=0.0,
                    avg=0.0,
                    median=0.0,
                    std_dev=0.0,
                    count=0,
                    latest=0.0,
                    trend="stable"
                ),
                data_points=[],
                time_range={
                    "from": from_time.isoformat(),
                    "to": to_time.isoformat(),
                    "interval": pg_interval
                },
                site_code=site_code,
                equipment_id=equipment_id
            )

        # Normalize stat_row to dict to avoid attribute access errors
        stat_row = stats_result[0]
        if not isinstance(stat_row, dict):
            try:
                keys = getattr(stat_row, 'keys', None) and stat_row.keys()
                if keys:
                    stat_row = {k: stat_row[k] for k in keys}
                else:
                    # tuple-like fallback
                    stat_row = {
                        'metric_name': stat_row[0],
                        'unit': stat_row[1],
                        'data_points': stat_row[2] if len(stat_row) > 2 else 0,
                        'first_seen': stat_row[3] if len(stat_row) > 3 else None,
                        'last_seen': stat_row[4] if len(stat_row) > 4 else None,
                        'avg_value': stat_row[5] if len(stat_row) > 5 else None,
                        'min_value': stat_row[6] if len(stat_row) > 6 else None,
                        'max_value': stat_row[7] if len(stat_row) > 7 else None,
                        'std_dev': stat_row[8] if len(stat_row) > 8 else None,
                        'median_value': stat_row[9] if len(stat_row) > 9 else None,
                    }
            except Exception:
                stat_row = dict(stat_row) if hasattr(stat_row, '_asdict') else {}

        # Get latest value for trend
        latest_query = f"""
        SELECT value_numeric
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND performance_data = :metric_name
          AND value_numeric IS NOT NULL
        ORDER BY statistical_start_time DESC
        LIMIT 1;
        """

        latest_result = await execute_raw_query(latest_query, {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "metric_name": metric_name
        })

        if latest_result:
            lr = latest_result[0]
            if isinstance(lr, dict):
                latest_value = _safe_float(lr.get('value_numeric'), default=0.0)
            else:
                try:
                    latest_value = _safe_float(lr[0], default=0.0)
                except Exception:
                    latest_value = 0.0
        else:
            latest_value = 0.0

        # Calculate trend using safe coercion
        avg_value = _safe_float(stat_row.get('avg_value')) if stat_row else 0.0
        if latest_value > avg_value * 1.05:
            trend = "increasing"
        elif latest_value < avg_value * 0.95:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Get time series data
        interval_sql = f"INTERVAL '{pg_interval}'"
        
        ts_query = f"""
        SELECT 
            time_bucket({interval_sql}, statistical_start_time) AS timestamp,
            AVG(value_numeric)::float8 AS value,
            MIN(unit) AS unit
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND performance_data = :metric_name
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
          AND value_numeric IS NOT NULL
        GROUP BY timestamp
        ORDER BY timestamp;
        """
        
        ts_results = await execute_raw_query(ts_query, stats_params)
        
        # Create response objects using Pydantic models
        metric_info = categorize_metric(metric_name, stat_row.get("unit", ""))
        
        metric = MetricInfo(
            metric_name=metric_name,
            display_name=metric_name,
            unit=stat_row.get('unit') or '',
            data_points=_safe_int(stat_row.get('data_points')),
            first_seen=_safe_datetime(row.get('first_seen')),
            last_seen=_safe_datetime(row.get('last_seen')),
            category=metric_info['category'],
            description=metric_info['description'],
            icon=metric_info['icon'],
            color=metric_info['color']
        )

        statistics = MetricStats(
            min=_safe_float(stat_row.get('min_value')),
            max=_safe_float(stat_row.get('max_value')),
            avg=_safe_float(stat_row.get('avg_value')),
            median=_safe_float(stat_row.get('median_value')),
            std_dev=_safe_float(stat_row.get('std_dev')),
            count=_safe_int(stat_row.get('data_points')),
            latest=_safe_float(latest_value),
            trend=trend
        )

        data_points = []
        for row in ts_results:
            try:
                if isinstance(row, dict):
                    ts = _safe_datetime(row.get('timestamp'))
                    val = _safe_float(row.get('value'))
                    unit_val = row.get('unit') or ''
                else:
                    # try tuple-like
                    ts = _safe_datetime(row[0])
                    val = _safe_float(row[1])
                    unit_val = row[2] if len(row) > 2 else ''
                
                if ts is not None:
                    data_points.append(MetricValue(
                        timestamp=ts,
                        value=val,
                        unit=unit_val
                    ))
            except Exception:
                # skip malformed time series rows
                continue

        response = DetailedMetricResponse(
            metric=metric,
            statistics=statistics,
            data_points=data_points,
            time_range={
                "from": from_time.isoformat(),
                "to": to_time.isoformat(),
                "interval": pg_interval
            },
            site_code=site_code,
            equipment_id=equipment_id
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting metric details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลรายละเอียด metric: {str(e)}"
        )

@router.get("/sites/{site_code}/equipment")
async def get_site_equipment(
    site_code: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงรายชื่ออุปกรณ์ในไซต์ที่ระบุ (Optimized with TimescaleDB)
    Get equipment list for specific site
    """
    try:
        # Optimized: Use recent data only (last 7 days) for active equipment detection
        # This dramatically reduces scan time on large hypertables
        query = """
        WITH recent_equipment AS (
            SELECT DISTINCT 
                site_code,
                equipment_id
            FROM performance_data
            WHERE site_code = :site_code
            AND statistical_start_time >= NOW() - INTERVAL '7 days'
        ),
        equipment_metrics AS (
            SELECT 
                re.site_code,
                re.equipment_id,
                COUNT(DISTINCT pd.performance_data) as metric_count
            FROM recent_equipment re
            LEFT JOIN performance_data pd ON 
                re.site_code = pd.site_code 
                AND re.equipment_id = pd.equipment_id
                AND pd.statistical_start_time >= NOW() - INTERVAL '7 days'
            GROUP BY re.site_code, re.equipment_id
        )
        SELECT 
            em.site_code,
            em.equipment_id,
            COALESCE(eno.display_name, pem.equipment_name, em.equipment_id) as display_name,
            em.metric_count
        FROM equipment_metrics em
        LEFT JOIN equipment_name_overrides eno ON em.site_code = eno.site_code AND em.equipment_id = eno.equipment_id
        LEFT JOIN performance_equipment_master pem ON em.equipment_id = pem.equipment_id
        ORDER BY display_name, em.equipment_id;
        """
        
        params = {"site_code": site_code}
        results = await execute_raw_query(query, params)
        
        # Normalize and build equipment list
        equipment_list = []
        for row in results:
            if isinstance(row, dict):
                equipment_list.append({
                    'site_code': row.get('site_code'),
                    'equipment_id': row.get('equipment_id'),
                    'display_name': row.get('display_name'),
                    'metric_count': _safe_int(row.get('metric_count'))
                })
            else:
                try:
                    equipment_list.append({
                        'site_code': row[0],
                        'equipment_id': row[1], 
                        'display_name': row[2],
                        'metric_count': _safe_int(row[3])
                    })
                except Exception:
                    continue
        
        return equipment_list
        
    except Exception as e:
        logger.error(f"Error getting site equipment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลอุปกรณ์: {str(e)}"
        )

@router.get("/equipment/{site_code}/{equipment_id}/metrics")
async def get_equipment_metrics_summary(
    site_code: str,
    equipment_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงสรุปข้อมูล metrics ทั้งหมดของอุปกรณ์
    Get summary of all metrics for specific equipment
    """
    try:
        query = """
        WITH latest_values AS (
            SELECT DISTINCT ON (performance_data) 
                performance_data,
                value_numeric,
                unit,
                statistical_start_time
            FROM performance_data
            WHERE site_code = :site_code
              AND equipment_id = :equipment_id
              AND value_numeric IS NOT NULL
            ORDER BY performance_data, statistical_start_time DESC
        ),
        metric_stats AS (
            SELECT 
                performance_data,
                COUNT(*) as total_readings,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value,
                MIN(statistical_start_time) as first_reading,
                MAX(statistical_start_time) as last_reading
            FROM performance_data
            WHERE site_code = :site_code
              AND equipment_id = :equipment_id
              AND value_numeric IS NOT NULL
            GROUP BY performance_data
        )
        SELECT 
            ms.performance_data as metric_name,
            lv.unit,
            lv.value_numeric as latest_value,
            lv.statistical_start_time as latest_time,
            ms.total_readings,
            ms.avg_value,
            ms.min_value,
            ms.max_value,
            ms.first_reading,
            ms.last_reading
        FROM metric_stats ms
        LEFT JOIN latest_values lv ON ms.performance_data = lv.performance_data
        ORDER BY ms.total_readings DESC;
        """
        
        params = {"site_code": site_code, "equipment_id": equipment_id}
        results = await execute_raw_query(query, params)
        
        # Normalize and process results
        normalized_results = []
        for row in results:
            if isinstance(row, dict):
                normalized_results.append(row)
            else:
                try:
                    keys = getattr(row, 'keys', None) and row.keys()
                    if keys:
                        normalized_results.append({k: row[k] for k in keys})
                    else:
                        # tuple fallback
                        normalized_results.append({
                            'metric_name': row[0],
                            'unit': row[1] if len(row) > 1 else None,
                            'latest_value': row[2] if len(row) > 2 else None,
                            'latest_time': row[3] if len(row) > 3 else None,
                            'total_readings': row[4] if len(row) > 4 else 0,
                            'avg_value': row[5] if len(row) > 5 else None,
                            'min_value': row[6] if len(row) > 6 else None,
                            'max_value': row[7] if len(row) > 7 else None,
                            'first_reading': row[8] if len(row) > 8 else None,
                            'last_reading': row[9] if len(row) > 9 else None,
                        })
                except Exception:
                    continue
        
        # Process results with categorization
        metrics_summary = []
        for row in normalized_results:
            try:
                metric_info = categorize_metric(row.get("metric_name", ""), row.get("unit", "") or "")
                
                # Calculate trend (simple version) using safe coercion
                avg_val = _safe_float(row.get("avg_value"))
                latest_val = _safe_float(row.get("latest_value"))
                if avg_val > 0 and latest_val > 0:
                    if latest_val > avg_val * 1.1:
                        trend = "high"
                    elif latest_val < avg_val * 0.9:
                        trend = "low"
                    else:
                        trend = "normal"
                else:
                    trend = "unknown"
                
                metrics_summary.append({
                    "metric_name": row.get("metric_name"),
                    "display_name": row.get("metric_name"),
                    "category": metric_info["category"],
                    "icon": metric_info["icon"],
                    "color": metric_info["color"],
                    "unit": row.get("unit") or "",
                    "latest_value": _safe_float(row.get("latest_value")),
                    "latest_time": _datetime_to_iso_bangkok(_safe_datetime(row.get("latest_time"))) if row.get("latest_time") else None,
                    "avg_value": _safe_float(row.get("avg_value")),
                    "min_value": _safe_float(row.get("min_value")),
                    "max_value": _safe_float(row.get("max_value")),
                    "total_readings": _safe_int(row.get("total_readings")),
                    "trend": trend,
                    "first_reading": _safe_datetime(row.get("first_reading")).isoformat() if row.get("first_reading") else None,
                    "last_reading": _safe_datetime(row.get("last_reading")).isoformat() if row.get("last_reading") else None,
                })
            except Exception as me:
                logger.warning(f"Skipping malformed metric row: {me}")
                continue
        
        return {
            "site_code": site_code,
            "equipment_id": equipment_id,
            "total_metrics": len(metrics_summary),
            "metrics": metrics_summary
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment metrics summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลสรุป metrics: {str(e)}"
        )
