"""
Enhanced Faults API Routes with Modern Analytics
API สำหรับ Faults ที่ปรับปรุงแล้วพร้อมการวิเคราะห์สมัยใหม่
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
        if isinstance(v, str):
            # Handle different datetime formats
            for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S']:
                try:
                    return datetime.strptime(v, fmt)
                except ValueError:
                    continue
        return default or datetime(1970, 1, 1)
    except Exception:
        return default or datetime(1970, 1, 1)


def _get_time_filter_sql(time_range: str) -> tuple[str, Dict[str, Any]]:
    """
    Generate SQL WHERE clause and parameters for time filtering
    """
    now = datetime.now()
    params = {}
    
    if time_range == "1h":
        start_time = now - timedelta(hours=1)
    elif time_range == "4h":
        start_time = now - timedelta(hours=4)
    elif time_range == "24h":
        start_time = now - timedelta(hours=24)
    elif time_range == "3d":
        start_time = now - timedelta(days=3)
    elif time_range == "7d":
        start_time = now - timedelta(days=7)
    elif time_range == "30d":
        start_time = now - timedelta(days=30)
    else:
        # Default to 24h if invalid range
        start_time = now - timedelta(hours=24)
    
    params['start_time'] = start_time
    params['end_time'] = now
    
    return "statistical_start_time >= :start_time AND statistical_start_time <= :end_time", params


def _get_severity_level(performance_data: str, value: Any) -> str:
    """
    Determine fault severity based on performance data name and value
    """
    data_lower = performance_data.lower()
    
    # Temperature thresholds
    if "temperature" in data_lower:
        temp = _safe_float(value)
        if temp > 35:
            return "critical"
        elif temp > 30:
            return "warning"
        else:
            return "info"
    
    # Humidity thresholds  
    elif "humidity" in data_lower:
        humidity = _safe_float(value)
        if humidity > 80 or humidity < 20:
            return "critical"
        elif humidity > 70 or humidity < 30:
            return "warning"
        else:
            return "info"
    
    # Voltage thresholds
    elif "voltage" in data_lower or "volt" in data_lower:
        voltage = _safe_float(value)
        if voltage < 180 or voltage > 250:
            return "critical"
        elif voltage < 200 or voltage > 240:
            return "warning"
        else:
            return "info"
    
    # Current thresholds
    elif "current" in data_lower:
        current = _safe_float(value)
        if current > 100:
            return "critical"
        elif current > 80:
            return "warning"
        else:
            return "info"
    
    # Default severity
    return "info"


def _format_fault_record(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format a fault record for API response
    """
    value = row.get('value_text') or row.get('value_numeric')
    severity = _get_severity_level(row.get('performance_data', ''), value)
    
    return {
        "id": _safe_int(row.get('id')),
        "site_code": str(row.get('site_code', '')).upper(),
        "equipment_name": str(row.get('equipment_name', '')),
        "equipment_id": str(row.get('equipment_id', '')),
        "fault_type": str(row.get('performance_data', '')),
        "description": str(row.get('performance_data', '')),
        "value": str(value or ''),
        "unit": str(row.get('unit', '')),
        "severity": severity,
        "timestamp": _safe_datetime(row.get('statistical_start_time')),
        "duration": "5 Min",  # From statistical_period
        "status": "active",   # Assume active for recent data
        "source": str(row.get('source_file', '')),
        "import_time": _safe_datetime(row.get('import_timestamp'))
    }


# --- API Endpoints ---

@router.get("/enhanced-faults")
async def get_enhanced_faults(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC, DR)"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    time_range: str = Query("24h", description="ช่วงเวลา (1h, 4h, 24h, 3d, 7d, 30d)"),
    severity: Optional[str] = Query(None, description="ระดับความรุนแรง (info, warning, critical)"),
    limit: int = Query(100, description="จำนวนข้อมูลสูงสุด"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงข้อมูล faults ที่ปรับปรุงแล้ว
    Enhanced faults data retrieval
    """
    try:
        # Build WHERE conditions
        conditions = []
        params = {}
        
        # Time filter
        time_sql, time_params = _get_time_filter_sql(time_range)
        conditions.append(time_sql)
        params.update(time_params)
        
        # Site filter
        if site_code:
            conditions.append("LOWER(site_code) = :site_code")
            params['site_code'] = site_code.lower()
        
        # Equipment filter
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params['equipment_id'] = equipment_id
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Main query
        query = f"""
        SELECT 
            id,
            site_code,
            equipment_name,
            equipment_id,
            performance_data,
            statistical_start_time,
            value_text,
            value_numeric,
            unit,
            statistical_period,
            source_file,
            import_timestamp
        FROM fault_performance_data
        {where_clause}
        ORDER BY statistical_start_time DESC, id DESC
        LIMIT :limit
        """
        
        params['limit'] = limit
        
        result = await execute_raw_query(query, params)
        
        # Format results
        faults = []
        for row in result:
            formatted_fault = _format_fault_record(row)
            
            # Apply severity filter if specified
            if severity and formatted_fault['severity'] != severity:
                continue
                
            faults.append(formatted_fault)
        
        return faults
        
    except Exception as e:
        logger.error(f"Error in get_enhanced_faults: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล faults: {str(e)}"
        )


@router.get("/enhanced-faults/summary")
async def get_enhanced_faults_summary(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    time_range: str = Query("24h", description="ช่วงเวลา"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    สรุปข้อมูล faults
    Faults summary statistics
    """
    try:
        # Build WHERE conditions
        conditions = []
        params = {}
        
        # Time filter
        time_sql, time_params = _get_time_filter_sql(time_range)
        conditions.append(time_sql)
        params.update(time_params)
        
        # Site filter
        if site_code:
            conditions.append("LOWER(site_code) = :site_code")
            params['site_code'] = site_code.lower()
        
        # Equipment filter
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params['equipment_id'] = equipment_id
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Summary query
        query = f"""
        SELECT 
            COUNT(*) as total_faults,
            COUNT(DISTINCT equipment_id) as affected_equipment,
            COUNT(DISTINCT performance_data) as fault_types,
            MIN(statistical_start_time) as earliest_fault,
            MAX(statistical_start_time) as latest_fault
        FROM fault_performance_data
        {where_clause}
        """
        
        result = await execute_raw_query(query, params)
        
        if result:
            summary = result[0]
            return {
                "total_faults": _safe_int(summary.get('total_faults')),
                "affected_equipment": _safe_int(summary.get('affected_equipment')),
                "fault_types": _safe_int(summary.get('fault_types')),
                "earliest_fault": _safe_datetime(summary.get('earliest_fault')),
                "latest_fault": _safe_datetime(summary.get('latest_fault')),
                "time_range": time_range
            }
        else:
            return {
                "total_faults": 0,
                "affected_equipment": 0,
                "fault_types": 0,
                "earliest_fault": None,
                "latest_fault": None,
                "time_range": time_range
            }
        
    except Exception as e:
        logger.error(f"Error in get_faults_summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงสรุปข้อมูล faults: {str(e)}"
        )


@router.get("/enhanced-faults/types")
async def get_enhanced_fault_types(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    time_range: str = Query("24h", description="ช่วงเวลา"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ดึงประเภท fault ที่มี
    Get available fault types
    """
    try:
        # Build WHERE conditions
        conditions = []
        params = {}
        
        # Time filter
        time_sql, time_params = _get_time_filter_sql(time_range)
        conditions.append(time_sql)
        params.update(time_params)
        
        # Site filter
        if site_code:
            conditions.append("LOWER(site_code) = :site_code")
            params['site_code'] = site_code.lower()
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Fault types query
        query = f"""
        SELECT 
            performance_data as fault_type,
            COUNT(*) as count,
            COUNT(DISTINCT equipment_id) as equipment_count,
            MAX(statistical_start_time) as latest_occurrence
        FROM fault_performance_data
        {where_clause}
        GROUP BY performance_data
        ORDER BY count DESC
        LIMIT 50
        """
        
        result = await execute_raw_query(query, params)
        
        fault_types = []
        for row in result:
            fault_types.append({
                "fault_type": str(row.get('fault_type', '')),
                "count": _safe_int(row.get('count')),
                "equipment_count": _safe_int(row.get('equipment_count')),
                "latest_occurrence": _safe_datetime(row.get('latest_occurrence'))
            })
        
        return fault_types
        
    except Exception as e:
        logger.error(f"Error in get_fault_types: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงประเภท faults: {str(e)}"
        )


@router.get("/enhanced-faults/timeline")
async def get_enhanced_faults_timeline(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    time_range: str = Query("24h", description="ช่วงเวลา"),
    interval: str = Query("1h", description="ช่วงเวลารวม (1h, 4h, 1d)"),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    ข้อมูล faults ตามเวลา (timeline)
    Faults timeline data
    """
    try:
        # Build WHERE conditions
        conditions = []
        params = {}
        
        # Time filter
        time_sql, time_params = _get_time_filter_sql(time_range)
        conditions.append(time_sql)
        params.update(time_params)
        
        # Site filter
        if site_code:
            conditions.append("LOWER(site_code) = :site_code")
            params['site_code'] = site_code.lower()
        
        # Equipment filter
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params['equipment_id'] = equipment_id
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        # Determine time grouping
        if interval == "1h":
            time_group = "date_trunc('hour', statistical_start_time)"
        elif interval == "4h":
            time_group = "date_trunc('hour', statistical_start_time) + INTERVAL '4 hour' * FLOOR(EXTRACT(hour FROM statistical_start_time) / 4)"
        elif interval == "1d":
            time_group = "date_trunc('day', statistical_start_time)"
        else:
            time_group = "date_trunc('hour', statistical_start_time)"
        
        # Timeline query
        query = f"""
        SELECT 
            {time_group} as time_bucket,
            COUNT(*) as fault_count,
            COUNT(DISTINCT equipment_id) as equipment_count,
            COUNT(DISTINCT performance_data) as fault_type_count
        FROM fault_performance_data
        {where_clause}
        GROUP BY time_bucket
        ORDER BY time_bucket
        """
        
        result = await execute_raw_query(query, params)
        
        timeline = []
        for row in result:
            timeline.append({
                "timestamp": _safe_datetime(row.get('time_bucket')),
                "fault_count": _safe_int(row.get('fault_count')),
                "equipment_count": _safe_int(row.get('equipment_count')),
                "fault_type_count": _safe_int(row.get('fault_type_count'))
            })
        
        return timeline
        
    except Exception as e:
        logger.error(f"Error in get_faults_timeline: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล timeline: {str(e)}"
        )


@router.get("/enhanced-faults/time-ranges")
async def get_fault_time_ranges(
    current_user: User = Depends(get_current_user)
):
    """
    ดึงตัวเลือกช่วงเวลาที่ใช้งานได้สำหรับ faults
    Get available time range options for faults
    """
    return {
        "predefined": [
            {"value": "1h", "label": "1 ชั่วโมงที่ผ่านมา", "description": "ข้อมูล faults ย้อนหลัง 1 ชั่วโมง"},
            {"value": "4h", "label": "4 ชั่วโมงที่ผ่านมา", "description": "ข้อมูล faults ย้อนหลัง 4 ชั่วโมง"},
            {"value": "24h", "label": "24 ชั่วโมงที่ผ่านมา", "description": "ข้อมูل faults ย้อนหลัง 1 วัน"},
            {"value": "3d", "label": "3 วันที่ผ่านมา", "description": "ข้อมูล faults ย้อนหลัง 3 วัน"},
            {"value": "7d", "label": "7 วันที่ผ่านมา", "description": "ข้อมูล faults ย้อนหลัง 1 สัปดาห์"},
            {"value": "30d", "label": "30 วันที่ผ่านมา", "description": "ข้อมูล faults ย้อนหลัง 1 เดือน"}
        ],
        "intervals": [
            {"value": "1h", "label": "ทุก 1 ชั่วโมง", "description": "รวมข้อมูลทุกชั่วโมง"},
            {"value": "4h", "label": "ทุก 4 ชั่วโมง", "description": "รวมข้อมูลทุก 4 ชั่วโมง"},
            {"value": "1d", "label": "ทุก 1 วัน", "description": "รวมข้อมูลรายวัน"}
        ],
        "severities": [
            {"value": "all", "label": "ทั้งหมด", "description": "แสดง faults ทุกระดับ"},
            {"value": "critical", "label": "วิกฤต", "description": "faults ที่ต้องแก้ไขด่วน"},
            {"value": "warning", "label": "เตือน", "description": "faults ที่ควรติดตาม"},
            {"value": "info", "label": "ข้อมูล", "description": "faults ทั่วไป"}
        ]
    }
