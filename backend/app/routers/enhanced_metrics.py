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
from app.services.auth import get_current_user
from app.schemas.auth import User

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
    if v is None:
        return default or datetime(1970, 1, 1)
    if isinstance(v, datetime):
        return v
    try:
        # Try common ISO formats
        return datetime.fromisoformat(str(v))
    except Exception:
        try:
            # Fallback: try parse as float timestamp
            return datetime.fromtimestamp(float(v))
        except Exception:
            return default or datetime(1970, 1, 1)


def _generate_chart_config(metric_name: str, unit: str, data_points: List) -> Dict[str, Any]:
    """Generate chart configuration based on metric type and data"""
    metric_lower = metric_name.lower()
    
    # Determine chart type based on metric
    if 'temperature' in metric_lower:
        chart_type = "line"
        color = "#f44336"
        y_axis_config = {"min": "auto", "max": "auto", "format": "{value} ℃"}
    elif 'humidity' in metric_lower:
        chart_type = "line" 
        color = "#2196f3"
        y_axis_config = {"min": 0, "max": 100, "format": "{value} %"}
    elif 'voltage' in metric_lower:
        chart_type = "line"
        color = "#9c27b0"
        y_axis_config = {"min": "auto", "max": "auto", "format": "{value} V"}
    elif 'current' in metric_lower:
        chart_type = "line"
        color = "#ff9800"
        y_axis_config = {"min": 0, "max": "auto", "format": "{value} A"}
    elif 'power' in metric_lower:
        chart_type = "area"
        color = "#ff5722"
        y_axis_config = {"min": 0, "max": "auto", "format": "{value} W"}
    elif 'energy' in metric_lower or 'kwh' in unit.lower():
        chart_type = "column"
        color = "#4caf50"
        y_axis_config = {"min": 0, "max": "auto", "format": "{value} kWh"}
    elif 'load' in metric_lower or 'factor' in metric_lower:
        chart_type = "area"
        color = "#00bcd4"
        y_axis_config = {"min": 0, "max": 100, "format": "{value} %"}
    else:
        chart_type = "line"
        color = "#795548"
        y_axis_config = {"min": "auto", "max": "auto", "format": f"{{value}} {unit}"}
    
    # Calculate data statistics for chart scaling
    values = [dp.value for dp in data_points if dp and dp.value is not None]
    if values:
        min_val = min(values)
        max_val = max(values)
        avg_val = sum(values) / len(values)
        
        # Add buffer for better visualization
        range_buffer = (max_val - min_val) * 0.1 if max_val != min_val else abs(avg_val) * 0.1
        if y_axis_config["min"] == "auto":
            y_axis_config["min"] = max(0, min_val - range_buffer) if min_val >= 0 else min_val - range_buffer
        if y_axis_config["max"] == "auto":
            y_axis_config["max"] = max_val + range_buffer
    
    return {
        "type": chart_type,
        "color": color,
        "y_axis": y_axis_config,
        "x_axis": {
            "type": "datetime",
            "format": "DD/MM HH:mm" if len(data_points) <= 48 else "DD/MM"
        },
        "tooltip": {
            "format": f"{{value}} {unit}",
            "show_time": True,
            "show_range": chart_type == "area"
        },
        "animation": {
            "enabled": len(data_points) <= 1000,
            "duration": 800
        },
        "legend": {
            "show": False
        },
        "grid": {
            "show": True,
            "stroke_dasharray": "3,3"
        }
    }


# Response Models
class MetricInfo(BaseModel):
    metric_name: str
    display_name: str
    unit: str
    data_points: int
    first_seen: datetime
    last_seen: datetime
    category: str
    description: str
    icon: str
    color: str

class MetricValue(BaseModel):
    timestamp: datetime
    value: float
    min_val: Optional[float] = None
    max_val: Optional[float] = None
    sample_count: Optional[int] = None
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

class TimeRangeOption(BaseModel):
    value: str
    label: str
    description: str

class TimeRangeInfo(BaseModel):
    earliest_data: Optional[datetime]
    latest_data: Optional[datetime]
    total_records: int
    total_metrics: int

class DetailedMetricResponse(BaseModel):
    metric: MetricInfo
    statistics: MetricStats
    data_points: List[MetricValue]
    time_range: Dict[str, str]
    site_code: str
    equipment_id: str
    chart_config: Dict[str, Any]

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
    period: str = Query("24h", description="ช่วงเวลา (1h, 4h, 24h, 3d, 7d, 30d, custom)"),
    start_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น (สำหรับ custom)"),
    end_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด (สำหรับ custom)"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงรายชื่อ metrics ที่จัดกลุ่มตามประเภทพร้อมข้อมูลเพิ่มเติม
    Get categorized metrics list with enhanced information
    """
    try:
        # Calculate time range based on period
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
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
        
        conditions = ["performance_data IS NOT NULL"]
        params = {}
        
        if site_code:
            conditions.append("site_code = :site_code")
            params["site_code"] = site_code
            
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
        
        # Add time range filter
        conditions.append("statistical_start_time >= :from_time")
        conditions.append("statistical_start_time <= :to_time")
        params["from_time"] = from_time
        params["to_time"] = to_time
        
        where_clause = " AND ".join(conditions)
        
        # Use a simpler, more reliable query without complex CTEs
        query = f"""
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
        ORDER BY data_points DESC, performance_data;
        """
        
        results = await execute_raw_query(query, params)

        # Get latest values in a separate query for each metric
        latest_values = {}
        if results:
            for row in results:
                metric_name = None
                if isinstance(row, dict):
                    metric_name = row.get('metric_name')
                elif hasattr(row, '__getitem__'):
                    try:
                        metric_name = row[0]  # first column should be metric_name
                    except:
                        continue
                
                if metric_name:
                    # Get latest value for this metric
                    latest_query = f"""
                    SELECT value_numeric, statistical_start_time
                    FROM performance_data
                    WHERE {where_clause} AND performance_data = :metric_name AND value_numeric IS NOT NULL
                    ORDER BY statistical_start_time DESC
                    LIMIT 1;
                    """
                    latest_params = dict(params)
                    latest_params['metric_name'] = metric_name
                    
                    try:
                        latest_result = await execute_raw_query(latest_query, latest_params)
                        if latest_result and len(latest_result) > 0:
                            latest_row = latest_result[0]
                            if isinstance(latest_row, dict):
                                latest_values[metric_name] = {
                                    'latest_value': latest_row.get('value_numeric'),
                                    'latest_time': latest_row.get('statistical_start_time')
                                }
                            elif hasattr(latest_row, '__getitem__'):
                                latest_values[metric_name] = {
                                    'latest_value': latest_row[0],
                                    'latest_time': latest_row[1]
                                }
                    except Exception as e:
                        logger.warning(f"Failed to get latest value for {metric_name}: {e}")
                        latest_values[metric_name] = {'latest_value': None, 'latest_time': None}
        
        results = await execute_raw_query(query, params)

        # Normalize rows to mapping (dict-like) to avoid string-indexing or tuple issues
        normalized_results = []
        for row in results:
            if isinstance(row, dict):
                normalized_results.append(row)
            else:
                # try attribute access or mapping view
                try:
                    if hasattr(row, '_mapping'):
                        mapping = row._mapping
                        normalized_results.append(dict(mapping))
                        continue
                    elif hasattr(row, 'keys') and callable(row.keys):
                        keys = row.keys()
                        normalized_results.append({k: row[k] for k in keys})
                        continue
                except Exception:
                    pass
                try:
                    # fallback: assume iterable/tuple with known ordering
                    normalized_results.append({
                        'metric_name': row[0],
                        'unit': row[1],
                        'data_points': row[2],
                        'first_seen': row[3],
                        'last_seen': row[4],
                        'avg_value': row[5] if len(row) > 5 else None,
                        'min_value': row[6] if len(row) > 6 else None,
                        'max_value': row[7] if len(row) > 7 else None,
                        'valid_readings': row[8] if len(row) > 8 else row[2],  # Use row[8] or fallback to data_points
                        'latest_value': row[9] if len(row) > 9 else None,
                        'latest_time': row[10] if len(row) > 10 else row[4],  # Use row[10] or fallback to last_seen
                    })
                except Exception:
                    # last resort: convert to string map
                    normalized_results.append({'metric_name': str(row), 'unit': 'N/A', 'data_points': 0})

        # Build simple metrics list (no categories) as requested
        metrics_list = []
        for row in normalized_results:
            try:
                metric_info = categorize_metric(row.get("metric_name", ""), row.get("unit", ""))
                
                # Get latest values for this metric - include time filter
                metric_name = row.get('metric_name')
                latest_info = latest_values.get(metric_name, {})
                
                # Get latest value within the time range
                latest_query = f"""
                SELECT value_numeric, statistical_start_time
                FROM performance_data
                WHERE {where_clause} AND performance_data = :metric_name 
                  AND statistical_start_time >= :from_time
                  AND statistical_start_time <= :to_time
                  AND value_numeric IS NOT NULL
                ORDER BY statistical_start_time DESC
                LIMIT 1;
                """
                latest_params = dict(params)
                latest_params['metric_name'] = metric_name
                
                try:
                    latest_result = await execute_raw_query(latest_query, latest_params)
                    if latest_result and len(latest_result) > 0:
                        latest_row = latest_result[0]
                        if isinstance(latest_row, dict):
                            latest_info = {
                                'latest_value': latest_row.get('value_numeric'),
                                'latest_time': latest_row.get('statistical_start_time')
                            }
                        elif hasattr(latest_row, '__getitem__'):
                            latest_info = {
                                'latest_value': latest_row[0],
                                'latest_time': latest_row[1]
                            }
                except Exception as e:
                    logger.warning(f"Failed to get latest value for {metric_name}: {e}")
                    latest_info = {'latest_value': None, 'latest_time': None}
                
                # Calculate trend using safe coercion
                avg_val = _safe_float(row.get('avg_value'))
                latest_val = _safe_float(latest_info.get('latest_value'))
                if avg_val > 0 and latest_val > 0:
                    if latest_val > avg_val * 1.05:
                        trend = "increasing"
                    elif latest_val < avg_val * 0.95:
                        trend = "decreasing"
                    else:
                        trend = "stable"
                else:
                    trend = "unknown"
                
                # Build plain dict with safe coercion
                metric_dict = {
                    'metric_name': row.get('metric_name'),
                    'display_name': row.get('metric_name'),  # Use metric_name as display_name
                    'unit': row.get('unit') or '',
                    'data_points': _safe_int(row.get('data_points')),
                    'valid_readings': _safe_int(row.get('valid_readings', row.get('data_points'))),
                    'first_seen': _safe_datetime(row.get('first_seen')).isoformat() if row.get('first_seen') else None,
                    'last_seen': _safe_datetime(row.get('last_seen')).isoformat() if row.get('last_seen') else None,
                    'latest_value': _safe_float(latest_info.get('latest_value')),
                    'latest_time': _safe_datetime(latest_info.get('latest_time')).isoformat() if latest_info.get('latest_time') else None,
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
        
        # Return enhanced format with time range info
        return {
            'metrics': metrics_list,
            'total_count': len(metrics_list),
            'site_code': site_code,
            'equipment_id': equipment_id,
            'time_range': {
                'period': period,
                'from_time': from_time.isoformat(),
                'to_time': to_time.isoformat(),
                'custom_range': period == "custom"
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting enhanced metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล metrics: {str(e)}"
        )

@router.get("/sites/{site_code}/equipment")
async def get_site_equipment(
    site_code: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงรายชื่ออุปกรณ์ในไซต์ที่ระบุ
    Get equipment list for specific site
    """
    try:
        query = """
        SELECT DISTINCT 
            pd.site_code,
            pd.equipment_id,
            COALESCE(eno.display_name, pem.equipment_name, pd.equipment_id) as display_name,
            COUNT(DISTINCT pd.performance_data) as metric_count
        FROM performance_data pd
        LEFT JOIN equipment_name_overrides eno ON pd.site_code = eno.site_code AND pd.equipment_id = eno.equipment_id
        LEFT JOIN performance_equipment_master pem ON pd.equipment_id = pem.equipment_id
        WHERE pd.site_code = :site_code
        GROUP BY pd.site_code, pd.equipment_id, eno.display_name, pem.equipment_name
        ORDER BY display_name, pd.equipment_id;
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

@router.get("/metric/{metric_name}/details", response_model=DetailedMetricResponse)
async def get_metric_details(
    metric_name: str,
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
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
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
        
        # Get metric info and statistics - Use simpler aggregation
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
            COALESCE(STDDEV(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END), 0) as std_dev
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
            raise HTTPException(status_code=404, detail="ไม่พบข้อมูลสำหรับ metric นี้")

        # normalize stat_row
        stat_row = stats_result[0] if isinstance(stats_result[0], dict) else None
        if stat_row is None:
            try:
                keys = getattr(stats_result[0], 'keys', None) and stats_result[0].keys()
                stat_row = {k: stats_result[0][k] for k in keys} if keys else None
            except Exception:
                pass
        if stat_row is None:
            # fallback tuple mapping assuming known order
            row = stats_result[0]
            stat_row = {
                'metric_name': row[0], 'unit': row[1], 'data_points': row[2],
                'first_seen': row[3], 'last_seen': row[4], 'avg_value': row[5] if len(row) > 5 else None,
                'min_value': row[6] if len(row) > 6 else None, 'max_value': row[7] if len(row) > 7 else None,
                'std_dev': row[8] if len(row) > 8 else None
            }
        
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

        if latest_result and len(latest_result) > 0:
            lr = latest_result[0]
            if isinstance(lr, dict):
                latest_value = float(lr.get("value_numeric") or 0.0)
            else:
                try:
                    latest_value = float(lr[0])
                except Exception:
                    latest_value = 0.0
        else:
            latest_value = 0.0
        
        # Calculate trend
        avg_value = float(stat_row["avg_value"]) if stat_row["avg_value"] else 0.0
        if latest_value > avg_value * 1.05:
            trend = "increasing"
        elif latest_value < avg_value * 0.95:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Get time series data with proper time range filtering
        # Build a safe bucket expression for grouping. PostgreSQL's date_trunc
        # does not accept '5 minute' as a direct field. Emulate 5-minute buckets
        # using arithmetic on minutes when TimescaleDB's time_bucket isn't used.
        if pg_interval == "5 minutes":
            # truncate to minute then subtract the modulo minutes to get 5-min bins
            bucket_expr = (
                "date_trunc('minute', statistical_start_time) - "
                "(EXTRACT(MINUTE FROM statistical_start_time)::integer % 5) * INTERVAL '1 minute'"
            )
        elif pg_interval == "1 hour":
            bucket_expr = "date_trunc('hour', statistical_start_time)"
        else:  # "1 day"
            bucket_expr = "date_trunc('day', statistical_start_time)"

        ts_query = f"""
        SELECT
            ({bucket_expr}) AS timestamp,
            AVG(value_numeric) AS value,
            MIN(value_numeric) AS min_val,
            MAX(value_numeric) AS max_val,
            COUNT(*) AS sample_count,
            MAX(unit) AS unit
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND performance_data = :metric_name
          AND statistical_start_time >= :from_time
          AND statistical_start_time <= :to_time
          AND value_numeric IS NOT NULL
        GROUP BY ({bucket_expr})
        ORDER BY timestamp;
        """
        
        ts_results = await execute_raw_query(ts_query, stats_params)

        # normalize ts_results
        normalized_ts = []
        for r in ts_results:
            if isinstance(r, dict):
                normalized_ts.append(r)
            else:
                try:
                    keys = getattr(r, 'keys', None) and r.keys()
                    if keys:
                        normalized_ts.append({k: r[k] for k in keys})
                        continue
                except Exception:
                    pass
                try:
                    normalized_ts.append({
                        'timestamp': r[0], 
                        'value': r[1], 
                        'min_val': r[2] if len(r) > 2 else None,
                        'max_val': r[3] if len(r) > 3 else None,
                        'sample_count': r[4] if len(r) > 4 else None,
                        'unit': r[5] if len(r) > 5 else ''
                    })
                except Exception:
                    normalized_ts.append({
                        'timestamp': None, 
                        'value': None, 
                        'min_val': None,
                        'max_val': None,
                        'sample_count': None,
                        'unit': ''
                    })
        
        # Create response objects
        metric_info = categorize_metric(metric_name, stat_row["unit"])
        
        metric = MetricInfo(
            metric_name=metric_name,
            display_name=metric_name,
            unit=stat_row["unit"],
            data_points=stat_row["data_points"],
            first_seen=stat_row["first_seen"],
            last_seen=stat_row["last_seen"],
            category=metric_info["category"],
            description=metric_info["description"],
            icon=metric_info["icon"],
            color=metric_info["color"]
        )
        
        statistics = MetricStats(
            min=_safe_float(stat_row.get("min_value")),
            max=_safe_float(stat_row.get("max_value")),
            avg=avg_value,
            median=avg_value,  # Use avg as median approximation
            std_dev=_safe_float(stat_row.get("std_dev")),
            count=_safe_int(stat_row.get("data_points")),
            latest=_safe_float(latest_value),
            trend=trend
        )
        
        data_points = [
            MetricValue(
                timestamp=_safe_datetime(row.get("timestamp")),
                value=_safe_float(row.get("value")),
                min_val=_safe_float(row.get("min_val")) if row.get("min_val") is not None else None,
                max_val=_safe_float(row.get("max_val")) if row.get("max_val") is not None else None,
                sample_count=_safe_int(row.get("sample_count")) if row.get("sample_count") is not None else None,
                unit=row.get("unit") or ""
            )
            for row in normalized_ts
        ]
        
        # Generate chart configuration based on metric type
        chart_config = _generate_chart_config(metric_name, stat_row["unit"], data_points)
        
        return DetailedMetricResponse(
            metric=metric,
            statistics=statistics,
            data_points=data_points,
            time_range={
                "from": from_time.isoformat(),
                "to": to_time.isoformat(),
                "interval": pg_interval,
                "period": period
            },
            site_code=site_code,
            equipment_id=equipment_id,
            chart_config=chart_config
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting metric details: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลรายละเอียด metric: {str(e)}"
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
        
        # Process results with categorization
        metrics_summary = []
        for row in results:
            rn = row if isinstance(row, dict) else None
            if rn is None:
                try:
                    keys = getattr(row, 'keys', None) and row.keys()
                    rn = {k: row[k] for k in keys} if keys else None
                except Exception:
                    pass
            if rn is None:
                # fallback tuple mapping
                rn = {
                    'metric_name': row[0], 'unit': row[1] if len(row) > 1 else '', 'latest_value': row[2] if len(row) > 2 else None,
                    'latest_time': row[3] if len(row) > 3 else None, 'total_readings': row[4] if len(row) > 4 else 0,
                    'avg_value': row[5] if len(row) > 5 else None, 'min_value': row[6] if len(row) > 6 else None,
                    'max_value': row[7] if len(row) > 7 else None, 'first_reading': row[8] if len(row) > 8 else None,
                    'last_reading': row[9] if len(row) > 9 else None
                }

            metric_info = categorize_metric(rn.get("metric_name"), rn.get("unit") or "")
            
            # Calculate trend (simple version)
            if rn.get("avg_value") and rn.get("latest_value"):
                avg_val = float(rn.get("avg_value"))
                latest_val = float(rn.get("latest_value"))
                if latest_val > avg_val * 1.1:
                    trend = "high"
                elif latest_val < avg_val * 0.9:
                    trend = "low"
                else:
                    trend = "normal"
            else:
                trend = "unknown"
            
            metrics_summary.append({
                "metric_name": rn.get("metric_name"),
                "display_name": rn.get("metric_name"),
                "category": metric_info["category"],
                "icon": metric_info["icon"],
                "color": metric_info["color"],
                "unit": rn.get("unit") or "",
                "latest_value": float(rn.get("latest_value")) if rn.get("latest_value") else None,
                "latest_time": rn.get("latest_time"),
                "avg_value": float(rn.get("avg_value")) if rn.get("avg_value") else None,
                "min_value": float(rn.get("min_value")) if rn.get("min_value") else None,
                "max_value": float(rn.get("max_value")) if rn.get("max_value") else None,
                "total_readings": rn.get("total_readings"),
                "trend": trend,
                "first_reading": rn.get("first_reading"),
                "last_reading": rn.get("last_reading")
            })
        
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

@router.get("/time-ranges")
async def get_time_ranges(
    current_user: User = Depends(get_current_user)
):
    """
    ดึงตัวเลือกช่วงเวลาที่ใช้งานได้
    Get available time range options
    """
    return {
        "predefined": [
            {"value": "1h", "label": "1 ชั่วโมงที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 1 ชั่วโมง"},
            {"value": "4h", "label": "4 ชั่วโมงที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 4 ชั่วโมง"},
            {"value": "24h", "label": "24 ชั่วโมงที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 1 วัน"},
            {"value": "3d", "label": "3 วันที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 3 วัน"},
            {"value": "7d", "label": "7 วันที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 1 สัปดาห์"},
            {"value": "30d", "label": "30 วันที่ผ่านมา", "description": "ข้อมูลย้อนหลัง 1 เดือน"},
            {"value": "custom", "label": "ช่วงเวลาที่กำหนดเอง", "description": "เลือกวันที่เริ่มต้นและสิ้นสุด"}
        ],
        "intervals": [
            {"value": "auto", "label": "อัตโนมัติ", "description": "ระบบเลือกช่วงเวลาที่เหมาะสม"},
            {"value": "5m", "label": "ทุก 5 นาที", "description": "รวมข้อมูลทุก 5 นาที"},
            {"value": "1h", "label": "ทุก 1 ชั่วโมง", "description": "รวมข้อมูลทุกชั่วโมง"},
            {"value": "1d", "label": "ทุก 1 วัน", "description": "รวมข้อมูลรายวัน"}
        ]
    }

@router.get("/equipment/{site_code}/{equipment_id}/data-range")
async def get_equipment_data_range(
    site_code: str,
    equipment_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงช่วงเวลาของข้อมูลที่มีอยู่สำหรับอุปกรณ์
    Get available data time range for equipment
    """
    try:
        query = """
        SELECT 
            MIN(statistical_start_time) as earliest_data,
            MAX(statistical_start_time) as latest_data,
            COUNT(*) as total_records,
            COUNT(DISTINCT performance_data) as total_metrics
        FROM performance_data
        WHERE site_code = :site_code
          AND equipment_id = :equipment_id
          AND value_numeric IS NOT NULL;
        """
        
        params = {"site_code": site_code, "equipment_id": equipment_id}
        results = await execute_raw_query(query, params)
        
        if results and len(results) > 0:
            row = results[0]
            if isinstance(row, dict):
                return {
                    "site_code": site_code,
                    "equipment_id": equipment_id,
                    "earliest_data": row.get("earliest_data").isoformat() if row.get("earliest_data") else None,
                    "latest_data": row.get("latest_data").isoformat() if row.get("latest_data") else None,
                    "total_records": row.get("total_records"),
                    "total_metrics": row.get("total_metrics")
                }
            else:
                return {
                    "site_code": site_code,
                    "equipment_id": equipment_id,
                    "earliest_data": row[0].isoformat() if row[0] else None,
                    "latest_data": row[1].isoformat() if row[1] else None,
                    "total_records": row[2],
                    "total_metrics": row[3]
                }
        else:
            return {
                "site_code": site_code,
                "equipment_id": equipment_id,
                "earliest_data": None,
                "latest_data": None,
                "total_records": 0,
                "total_metrics": 0
            }
        
    except Exception as e:
        logger.error(f"Error getting equipment data range: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงช่วงเวลาข้อมูล: {str(e)}"
        )
