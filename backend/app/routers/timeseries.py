"""
API endpoints สำหรับข้อมูล TimescaleDB
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_async_session
from ..auth.dependencies import get_current_user
from ..models.models import User
from ..schemas.schemas import TimeSeriesResponse, KPIReport
from ..services.timeseries_service import TimeSeriesService

router = APIRouter(prefix="/data", tags=["ข้อมูลเวลา"])


@router.get("/time-series", response_model=TimeSeriesResponse)
async def get_time_series_data(
    site_code: str = Query(..., description="รหัสไซต์ (DC, DR)"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    metric: Optional[str] = Query(None, description="ชื่อ metric"),
    start_time: datetime = Query(..., description="เวลาเริ่มต้น"),
    end_time: datetime = Query(..., description="เวลาสิ้นสุด"), 
    interval: Optional[str] = Query("auto", description="ช่วงเวลา (auto, 5m, 1h, 1d)"),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูล time series จาก TimescaleDB"""
    
    # ตรวจสอบช่วงเวลา
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น")
    
    # จำกัดช่วงเวลาสูงสุด 30 วัน
    max_days = 30
    if (end_time - start_time).days > max_days:
        raise HTTPException(
            status_code=400, 
            detail=f"ช่วงเวลาต้องไม่เกิน {max_days} วัน"
        )
    
    return await TimeSeriesService.get_performance_data(
        db, site_code, equipment_id, metric, start_time, end_time, interval
    )


@router.get("/faults")
async def get_fault_data(
    site_code: str = Query(..., description="รหัสไซต์ (DC, DR)"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    start_time: datetime = Query(default_factory=lambda: datetime.now() - timedelta(days=1)),
    end_time: datetime = Query(default_factory=datetime.now),
    severity: Optional[str] = Query(None, description="ระดับความรุนแรง"),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูล fault จาก TimescaleDB"""
    
    return await TimeSeriesService.get_fault_data(
        db, site_code, equipment_id, start_time, end_time, severity
    )


@router.get("/metrics")
async def get_available_metrics(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงรายการ metrics ที่มีอยู่"""
    
    from sqlalchemy import text
    
    query = """
    SELECT DISTINCT 
        performance_data as metric,
        unit,
        COUNT(*) as data_count,
        MAX(statistical_start_time) as latest_time
    FROM performance_data 
    WHERE 1=1
    """
    
    params = {}
    
    if site_code:
        query += " AND site_code = :site_code"
        params["site_code"] = site_code.lower()
    
    if equipment_id:
        query += " AND equipment_id = :equipment_id"
        params["equipment_id"] = equipment_id
    
    query += " GROUP BY performance_data, unit ORDER BY performance_data"
    
    result = await db.execute(text(query), params)
    rows = result.fetchall()
    
    return [
        {
            "metric": row.metric,
            "unit": row.unit,
            "data_count": row.data_count,
            "latest_time": row.latest_time
        }
        for row in rows
    ]
