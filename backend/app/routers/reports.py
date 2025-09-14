"""
API endpoints สำหรับรายงาน KPI และสรุปผล
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_async_session
from ..auth.dependencies import get_current_user, get_analyst_or_admin_user
from ..models.models import User
from ..schemas.schemas import KPIReport
from ..services.timeseries_service import TimeSeriesService

router = APIRouter(prefix="/reports", tags=["รายงาน"])


@router.get("/kpi", response_model=KPIReport)
async def get_kpi_report(
    site_code: str = Query(..., description="รหัสไซต์ (DC, DR)"),
    start_time: datetime = Query(default_factory=lambda: datetime.now() - timedelta(days=1)),
    end_time: datetime = Query(default_factory=datetime.now),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_analyst_or_admin_user)  # ต้อง analyst+ เท่านั้น
):
    """สร้างรายงาน KPI สำหรับไซต์"""
    
    return await TimeSeriesService.get_kpi_report(db, site_code, start_time, end_time)
