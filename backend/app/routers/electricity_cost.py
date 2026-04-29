"""
API endpoints สำหรับการจัดการค่าไฟฟ้า (Electricity Cost Management)
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, text
from sqlalchemy.orm import selectinload
from datetime import datetime, date
import calendar
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from ..db.database import get_async_session
from ..auth.dependencies import get_current_user, get_admin_user
from ..models.models import User, ElectricityRate, ElectricityCost, DataCenter
from ..schemas.schemas import (
    ElectricityRateCreate,
    ElectricityRateUpdate,
    ElectricityRateResponse,
    ElectricityCostCreate,
    ElectricityCostUpdate,
    ElectricityCostResponse,
    ElectricityCostSummary,
)

router = APIRouter(prefix="/electricity-cost", tags=["ค่าไฟฟ้า"])


# ============================================================================
# Electricity Rate Management (Admin only)
# ============================================================================

@router.post("/rates", response_model=ElectricityRateResponse)
async def create_electricity_rate(
    rate_data: ElectricityRateCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """สร้างอัตราค่าไฟฟ้าใหม่"""
    try:
        # ตรวจสอบว่า data center มีอยู่
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == rate_data.data_center_id)
        )
        if not dc_result.scalar():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ไม่พบ Data Center"
            )
        
        # สร้างอัตราใหม่
        new_rate = ElectricityRate(
            data_center_id=rate_data.data_center_id,
            site_code=rate_data.site_code,
            rate_value=rate_data.rate_value,
            description=rate_data.description,
            effective_from=rate_data.effective_from,
            effective_to=rate_data.effective_to,
            created_by=current_user.username
        )
        
        db.add(new_rate)
        await db.commit()
        await db.refresh(new_rate)
        
        return new_rate
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการสร้างอัตราค่าไฟฟ้า: {str(e)}"
        )


@router.get("/rates/all")
async def get_all_rates(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงอัตราค่าไฟฟ้าทั้งหมดของทุก Data Center"""
    result = await db.execute(
        select(ElectricityRate)
        .order_by(desc(ElectricityRate.effective_from))
    )
    rates = result.scalars().all()
    return rates


@router.get("/rates/{rate_id}", response_model=ElectricityRateResponse)
async def get_electricity_rate(
    rate_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูลอัตราค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityRate).where(ElectricityRate.id == rate_id)
    )
    rate = result.scalar()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบอัตราค่าไฟฟ้า"
        )
    
    return rate


@router.get("/rates/datacenter/{data_center_id}", response_model=List[ElectricityRateResponse])
async def get_datacenter_rates(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงอัตราค่าไฟฟ้าทั้งหมดของ Data Center"""
    result = await db.execute(
        select(ElectricityRate)
        .where(ElectricityRate.data_center_id == data_center_id)
        .order_by(desc(ElectricityRate.effective_from))
    )
    rates = result.scalars().all()
    
    return rates


@router.get("/rates/datacenter/{data_center_id}/current", response_model=Optional[ElectricityRateResponse])
async def get_current_rate(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงอัตราค่าไฟฟ้าปัจจุบานของ Data Center"""
    now = datetime.utcnow()
    result = await db.execute(
        select(ElectricityRate)
        .where(
            and_(
                ElectricityRate.data_center_id == data_center_id,
                ElectricityRate.is_active == True,
                ElectricityRate.effective_from <= now,
                (ElectricityRate.effective_to.is_(None) | (ElectricityRate.effective_to >= now))
            )
        )
        .order_by(desc(ElectricityRate.effective_from))
        .limit(1)
    )
    rate = result.scalar()
    
    return rate


@router.put("/rates/{rate_id}", response_model=ElectricityRateResponse)
async def update_electricity_rate(
    rate_id: int,
    rate_data: ElectricityRateUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """อัปเดตอัตราค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityRate).where(ElectricityRate.id == rate_id)
    )
    rate = result.scalar()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบอัตราค่าไฟฟ้า"
        )
    
    # อัปเดตเฉพาะฟิลด์ที่ได้รับ
    update_data = rate_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rate, key, value)
    
    rate.updated_by = current_user.username
    
    await db.commit()
    await db.refresh(rate)
    
    return rate


@router.delete("/rates/{rate_id}")
async def delete_electricity_rate(
    rate_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ลบอัตราค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityRate).where(ElectricityRate.id == rate_id)
    )
    rate = result.scalar()
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบอัตราค่าไฟฟ้า"
        )
    
    await db.delete(rate)
    await db.commit()
    
    return {"message": "ลบอัตราค่าไฟฟ้าสำเร็จ"}


# ============================================================================
# Electricity Cost Management
# ============================================================================

@router.post("/costs", response_model=ElectricityCostResponse)
async def create_electricity_cost(
    cost_data: ElectricityCostCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """สร้างบันทึกค่าไฟฟ้า"""
    try:
        # ตรวจสอบว่า data center มีอยู่
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == cost_data.data_center_id)
        )
        if not dc_result.scalar():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ไม่พบ Data Center"
            )
        
        # คำนวณวันที่เริ่มต้นและสิ้นสุดของเดือน
        start_date = datetime(cost_data.year, cost_data.month, 1)
        next_month = start_date + relativedelta(months=1)
        end_date = next_month - relativedelta(days=1)
        
        # ตรวจสอบว่าไม่มีบันทึกซ้ำสำหรับเดือนนี้
        existing = await db.execute(
            select(ElectricityCost).where(
                and_(
                    ElectricityCost.data_center_id == cost_data.data_center_id,
                    ElectricityCost.year == cost_data.year,
                    ElectricityCost.month == cost_data.month
                )
            )
        )
        if existing.scalar():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="มีบันทึกค่าไฟฟ้าสำหรับเดือนนี้แล้ว"
            )
        
        # สร้างบันทึกใหม่
        new_cost = ElectricityCost(
            data_center_id=cost_data.data_center_id,
            site_code=cost_data.site_code,
            year=cost_data.year,
            month=cost_data.month,
            month_start=start_date,
            month_end=end_date,
            total_energy_kwh=cost_data.total_energy_kwh,
            average_rate=cost_data.average_rate,
            total_cost_baht=cost_data.total_cost_baht,
            days_in_period=cost_data.days_in_period or 30,
            calculation_method=cost_data.calculation_method,
            created_by=current_user.username
        )
        
        # คำนวณค่า avg_daily_energy_kwh
        if new_cost.days_in_period > 0:
            new_cost.avg_daily_energy_kwh = new_cost.total_energy_kwh / new_cost.days_in_period
        
        db.add(new_cost)
        await db.commit()
        await db.refresh(new_cost)
        
        return new_cost
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการสร้างบันทึกค่าไฟฟ้า: {str(e)}"
        )


@router.get("/costs/{cost_id}", response_model=ElectricityCostResponse)
async def get_electricity_cost(
    cost_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูลค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityCost).where(ElectricityCost.id == cost_id)
    )
    cost = result.scalar()
    
    if not cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบบันทึกค่าไฟฟ้า"
        )
    
    return cost


@router.get("/costs/datacenter/{data_center_id}", response_model=List[ElectricityCostResponse])
async def get_datacenter_costs(
    data_center_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    limit: int = 12,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูลค่าไฟฟ้าของ Data Center"""
    query = select(ElectricityCost).where(
        ElectricityCost.data_center_id == data_center_id
    )
    
    if year is not None:
        query = query.where(ElectricityCost.year == year)
    
    if month is not None:
        query = query.where(ElectricityCost.month == month)
    
    result = await db.execute(
        query.order_by(
            desc(ElectricityCost.year),
            desc(ElectricityCost.month)
        ).limit(limit)
    )
    costs = result.scalars().all()
    
    return costs


@router.get("/costs/datacenter/{data_center_id}/current", response_model=Optional[ElectricityCostResponse])
async def get_current_month_cost(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงค่าไฟฟ้าของเดือนปัจจุบัน"""
    now = datetime.utcnow()
    result = await db.execute(
        select(ElectricityCost).where(
            and_(
                ElectricityCost.data_center_id == data_center_id,
                ElectricityCost.year == now.year,
                ElectricityCost.month == now.month
            )
        )
    )
    cost = result.scalar()
    
    return cost


@router.get("/costs/summary/{data_center_id}", response_model=ElectricityCostSummary)
async def get_cost_summary(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงสรุปค่าไฟฟ้า (เดือนปัจจุบันและเดือนก่อนหน้า)"""
    try:
        now = datetime.utcnow()
        
        # ดึง data center
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = dc_result.scalar()
        if not data_center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ไม่พบ Data Center"
            )
        
        # ดึงค่าไฟฟ้าของเดือนปัจจุบัน
        current_cost_result = await db.execute(
            select(ElectricityCost).where(
                and_(
                    ElectricityCost.data_center_id == data_center_id,
                    ElectricityCost.year == now.year,
                    ElectricityCost.month == now.month
                )
            )
        )
        current_cost = current_cost_result.scalar()
        
        # ดึงค่าไฟฟ้าของเดือนที่แล้ว
        prev_month = now - relativedelta(months=1)
        prev_cost_result = await db.execute(
            select(ElectricityCost).where(
                and_(
                    ElectricityCost.data_center_id == data_center_id,
                    ElectricityCost.year == prev_month.year,
                    ElectricityCost.month == prev_month.month
                )
            )
        )
        prev_cost = prev_cost_result.scalar()
        
        # ดึงอัตราปัจจุบัน
        current_rate_result = await db.execute(
            select(ElectricityRate).where(
                and_(
                    ElectricityRate.data_center_id == data_center_id,
                    ElectricityRate.is_active == True,
                    ElectricityRate.effective_from <= now,
                    (ElectricityRate.effective_to.is_(None) | (ElectricityRate.effective_to >= now))
                )
            ).order_by(desc(ElectricityRate.effective_from)).limit(1)
        )
        current_rate = current_rate_result.scalar()
        
        # คำนวณ cost change %
        cost_change_percent = None
        if current_cost and prev_cost:
            if prev_cost.total_cost_baht > 0:
                cost_change_percent = float(
                    (current_cost.total_cost_baht - prev_cost.total_cost_baht) 
                    / prev_cost.total_cost_baht * 100
                )
        
        # คำนวณค่าไฟเฉลี่ยต่อวัน
        avg_daily_cost = Decimal(0)
        if current_cost:
            if current_cost.days_in_period > 0:
                avg_daily_cost = current_cost.total_cost_baht / current_cost.days_in_period
        
        return ElectricityCostSummary(
            site_code=data_center.site_code,
            data_center_name=data_center.name,
            current_month_cost=current_cost.total_cost_baht if current_cost else Decimal(0),
            current_month_energy_kwh=current_cost.total_energy_kwh if current_cost else Decimal(0),
            previous_month_cost=prev_cost.total_cost_baht if prev_cost else None,
            previous_month_energy_kwh=prev_cost.total_energy_kwh if prev_cost else None,
            cost_change_percent=cost_change_percent,
            current_rate=current_rate.rate_value if current_rate else Decimal(0),
            average_daily_cost=avg_daily_cost
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"เกิดข้อผิดพลาดในการดึงสรุปค่าไฟฟ้า: {str(e)}"
        )


@router.put("/costs/{cost_id}", response_model=ElectricityCostResponse)
async def update_electricity_cost(
    cost_id: int,
    cost_data: ElectricityCostUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """อัปเดตบันทึกค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityCost).where(ElectricityCost.id == cost_id)
    )
    cost = result.scalar()
    
    if not cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบบันทึกค่าไฟฟ้า"
        )
    
    # ถ้า finalized แล้ว ไม่สามารถแก้ไขได้
    if cost.is_finalized and cost_data.is_finalized != True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่สามารถแก้ไขบันทึกค่าไฟฟ้าที่ยืนยันแล้ว"
        )
    
    # อัปเดตเฉพาะฟิลด์ที่ได้รับ
    update_data = cost_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cost, key, value)
    
    # คำนวณ avg_daily_energy_kwh
    if cost.days_in_period > 0:
        cost.avg_daily_energy_kwh = cost.total_energy_kwh / cost.days_in_period
    
    cost.updated_by = current_user.username
    
    await db.commit()
    await db.refresh(cost)
    
    return cost


@router.delete("/costs/{cost_id}")
async def delete_electricity_cost(
    cost_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ลบบันทึกค่าไฟฟ้า"""
    result = await db.execute(
        select(ElectricityCost).where(ElectricityCost.id == cost_id)
    )
    cost = result.scalar()
    
    if not cost:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบบันทึกค่าไฟฟ้า"
        )
    
    if cost.is_finalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่สามารถลบบันทึกค่าไฟฟ้าที่ยืนยันแล้ว"
        )
    
    await db.delete(cost)
    await db.commit()
    
    return {"message": "ลบบันทึกค่าไฟฟ้าสำเร็จ"}


# ============================================================================
# Real-time Electricity Cost Calculation from performance_data
# ============================================================================

# Equipment IDs for power data per site
POWER_EQUIPMENT = {
    "DC": "0x1003",
    "DR": "0x100B",
}

async def _calculate_energy_for_period(
    db: AsyncSession,
    site_code: str,
    start_time: datetime,
    end_time: datetime
) -> Dict[str, Any]:
    """คำนวณพลังงาน (kWh) จาก performance_data สำหรับช่วงเวลาที่กำหนด"""
    equipment_id = POWER_EQUIPMENT.get(site_code)
    if not equipment_id:
        return {"total_energy_kwh": 0, "data_points": 0, "avg_power_kw": 0, "peak_power_kw": 0}

    query = text("""
        SELECT 
            COUNT(*) as data_points,
            COALESCE(SUM(value_numeric), 0) as total_energy_kwh,
            COALESCE(AVG(value_numeric), 0) as avg_power_kw,
            COALESCE(MAX(value_numeric), 0) as peak_power_kw
        FROM performance_data 
        WHERE site_code = :site_code 
          AND equipment_id = :equipment_id
          AND performance_data = 'Input total active power'
          AND statistical_start_time >= :start_time
          AND statistical_start_time < :end_time
          AND value_numeric IS NOT NULL
    """)

    result = await db.execute(query, {
        "site_code": site_code,
        "equipment_id": equipment_id,
        "start_time": start_time,
        "end_time": end_time,
    })
    row = result.fetchone()

    if row:
        return {
            "total_energy_kwh": float(row.total_energy_kwh),
            "data_points": int(row.data_points),
            "avg_power_kw": float(row.avg_power_kw),
            "peak_power_kw": float(row.peak_power_kw),
        }
    return {"total_energy_kwh": 0, "data_points": 0, "avg_power_kw": 0, "peak_power_kw": 0}


async def _get_active_rate(db: AsyncSession, data_center_id: int, at_time: datetime = None) -> Optional[float]:
    """ดึงอัตราค่าไฟที่ใช้งานอยู่"""
    if at_time is None:
        at_time = datetime.utcnow()
    result = await db.execute(
        select(ElectricityRate)
        .where(
            and_(
                ElectricityRate.data_center_id == data_center_id,
                ElectricityRate.is_active == True,
                ElectricityRate.effective_from <= at_time,
                (ElectricityRate.effective_to.is_(None) | (ElectricityRate.effective_to >= at_time))
            )
        )
        .order_by(desc(ElectricityRate.effective_from))
        .limit(1)
    )
    rate = result.scalar()
    return float(rate.rate_value) if rate else None


@router.get("/costs/calculate/{data_center_id}")
async def calculate_realtime_cost(
    data_center_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """คำนวณค่าไฟฟ้าแบบ Real-time จาก performance_data"""
    try:
        # ดึง data center
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = dc_result.scalar()
        if not data_center:
            raise HTTPException(status_code=404, detail="ไม่พบ Data Center")

        now = datetime.utcnow()
        target_year = year or now.year
        target_month = month or now.month

        # คำนวณช่วงเวลาของเดือน
        month_start = datetime(target_year, target_month, 1)
        days_in_month = calendar.monthrange(target_year, target_month)[1]
        month_end = datetime(target_year, target_month, days_in_month, 23, 59, 59)

        # ถ้าเป็นเดือนปัจจุบัน ใช้เวลาปัจจุบันเป็น end
        if target_year == now.year and target_month == now.month:
            actual_end = now
            elapsed_days = now.day
        else:
            actual_end = month_end
            elapsed_days = days_in_month

        # คำนวณพลังงาน
        energy = await _calculate_energy_for_period(
            db, data_center.site_code, month_start, actual_end
        )

        # ดึงอัตราค่าไฟ
        rate = await _get_active_rate(db, data_center_id, month_start)
        if rate is None:
            rate = 5.12  # default

        total_cost = energy["total_energy_kwh"] * rate
        avg_daily_energy = energy["total_energy_kwh"] / max(elapsed_days, 1)
        avg_daily_cost = total_cost / max(elapsed_days, 1)

        # Projected cost for full month (ถ้าเป็นเดือนปัจจุบัน)
        projected_cost = None
        projected_energy = None
        if target_year == now.year and target_month == now.month and elapsed_days > 0:
            projected_energy = avg_daily_energy * days_in_month
            projected_cost = projected_energy * rate

        return {
            "data_center_id": data_center_id,
            "data_center_name": data_center.name,
            "site_code": data_center.site_code,
            "year": target_year,
            "month": target_month,
            "month_name": calendar.month_name[target_month],
            "days_in_month": days_in_month,
            "elapsed_days": elapsed_days,
            "total_energy_kwh": round(energy["total_energy_kwh"], 2),
            "avg_power_kw": round(energy["avg_power_kw"], 2),
            "peak_power_kw": round(energy["peak_power_kw"], 2),
            "rate_baht_per_kwh": rate,
            "total_cost_baht": round(total_cost, 2),
            "avg_daily_energy_kwh": round(avg_daily_energy, 2),
            "avg_daily_cost_baht": round(avg_daily_cost, 2),
            "projected_monthly_cost": round(projected_cost, 2) if projected_cost else None,
            "projected_monthly_energy": round(projected_energy, 2) if projected_energy else None,
            "data_points": energy["data_points"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการคำนวณค่าไฟฟ้า: {str(e)}"
        )


@router.get("/costs/monthly-history/{data_center_id}")
async def get_monthly_history(
    data_center_id: int,
    months: int = Query(6, ge=1, le=24, description="จำนวนเดือนย้อนหลัง"),
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูลค่าไฟฟ้ารายเดือนย้อนหลัง (คำนวณจาก performance_data)"""
    try:
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = dc_result.scalar()
        if not data_center:
            raise HTTPException(status_code=404, detail="ไม่พบ Data Center")

        rate = await _get_active_rate(db, data_center_id)
        if rate is None:
            rate = 5.12

        now = datetime.utcnow()
        history = []

        for i in range(months):
            target_date = now - relativedelta(months=i)
            target_year = target_date.year
            target_month = target_date.month

            month_start = datetime(target_year, target_month, 1)
            days_in_month = calendar.monthrange(target_year, target_month)[1]
            month_end = datetime(target_year, target_month, days_in_month, 23, 59, 59)

            if target_year == now.year and target_month == now.month:
                actual_end = now
                elapsed_days = now.day
            else:
                actual_end = month_end
                elapsed_days = days_in_month

            energy = await _calculate_energy_for_period(
                db, data_center.site_code, month_start, actual_end
            )

            total_cost = energy["total_energy_kwh"] * rate
            avg_daily = energy["total_energy_kwh"] / max(elapsed_days, 1)

            history.append({
                "year": target_year,
                "month": target_month,
                "month_name": calendar.month_name[target_month],
                "month_label": f"{calendar.month_abbr[target_month]} {target_year}",
                "days_in_period": elapsed_days,
                "total_energy_kwh": round(energy["total_energy_kwh"], 2),
                "avg_power_kw": round(energy["avg_power_kw"], 2),
                "peak_power_kw": round(energy["peak_power_kw"], 2),
                "total_cost_baht": round(total_cost, 2),
                "avg_daily_energy_kwh": round(avg_daily, 2),
                "avg_daily_cost_baht": round((total_cost / max(elapsed_days, 1)), 2),
                "rate_baht_per_kwh": rate,
                "data_points": energy["data_points"],
                "is_current_month": (target_year == now.year and target_month == now.month),
            })

        return {
            "data_center_id": data_center_id,
            "data_center_name": data_center.name,
            "site_code": data_center.site_code,
            "current_rate": rate,
            "months_count": months,
            "history": history,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาดในการดึงข้อมูลย้อนหลัง: {str(e)}"
        )


@router.get("/costs/realtime-summary/{data_center_id}")
async def get_realtime_cost_summary(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """สรุปค่าไฟฟ้าแบบ Real-time (เดือนปัจจุบัน vs เดือนที่แล้ว) จาก performance_data"""
    try:
        dc_result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = dc_result.scalar()
        if not data_center:
            raise HTTPException(status_code=404, detail="ไม่พบ Data Center")

        now = datetime.utcnow()
        rate = await _get_active_rate(db, data_center_id)
        if rate is None:
            rate = 5.12

        # เดือนปัจจุบัน
        cur_start = datetime(now.year, now.month, 1)
        cur_energy = await _calculate_energy_for_period(
            db, data_center.site_code, cur_start, now
        )
        cur_cost = cur_energy["total_energy_kwh"] * rate
        cur_days = now.day

        # เดือนที่แล้ว
        prev_date = now - relativedelta(months=1)
        prev_start = datetime(prev_date.year, prev_date.month, 1)
        prev_days_in_month = calendar.monthrange(prev_date.year, prev_date.month)[1]
        prev_end = datetime(prev_date.year, prev_date.month, prev_days_in_month, 23, 59, 59)
        prev_energy = await _calculate_energy_for_period(
            db, data_center.site_code, prev_start, prev_end
        )
        prev_cost = prev_energy["total_energy_kwh"] * rate

        # % change
        cost_change_percent = None
        if prev_cost > 0:
            cost_change_percent = round(((cur_cost - prev_cost) / prev_cost) * 100, 1)

        avg_daily_cost = cur_cost / max(cur_days, 1)

        return {
            "site_code": data_center.site_code,
            "data_center_name": data_center.name,
            "current_month_cost": round(cur_cost, 2),
            "current_month_energy_kwh": round(cur_energy["total_energy_kwh"], 2),
            "previous_month_cost": round(prev_cost, 2),
            "previous_month_energy_kwh": round(prev_energy["total_energy_kwh"], 2),
            "cost_change_percent": cost_change_percent,
            "current_rate": rate,
            "average_daily_cost": round(avg_daily_cost, 2),
            "avg_power_kw": round(cur_energy["avg_power_kw"], 2),
            "peak_power_kw": round(cur_energy["peak_power_kw"], 2),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"เกิดข้อผิดพลาด: {str(e)}"
        )




