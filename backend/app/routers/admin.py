"""
API endpoints สำหรับการจัดการระบบ (Admin เท่านั้น)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..db.database import get_async_session
from ..auth.dependencies import get_admin_user
from ..models.models import User
from ..schemas.schemas import (
    EquipmentNameOverrideCreate,
    EquipmentAliasResponse,
    DataCenterCreate,
    DataCenterUpdate,
    DataCenterResponse
)
from ..services.data_service import DataService

router = APIRouter(prefix="/admin", tags=["การจัดการระบบ"])


@router.get("/system-info")
async def get_system_info(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ดึงข้อมูลระบบและฐานข้อมูล"""
    
    try:
        return await DataService.get_system_info(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลระบบได้: {str(e)}"
        )


@router.get("/database-health")
async def get_database_health(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ตรวจสอบสุขภาพฐานข้อมูล"""
    
    try:
        return await DataService.get_database_health(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถตรวจสอบสุขภาพฐานข้อมูลได้: {str(e)}"
        )


@router.get("/equipment-overrides")
async def get_equipment_overrides(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ดึงรายการชื่อแทนอุปกรณ์ทั้งหมด"""
    
    try:
        return await DataService.get_equipment_aliases(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลชื่อแทนอุปกรณ์ได้: {str(e)}"
        )


@router.post("/equipment-overrides", response_model=EquipmentAliasResponse)
async def create_equipment_override(
    override_data: EquipmentNameOverrideCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """สร้างหรืออัพเดทชื่อแทนของอุปกรณ์"""
    
    try:
        return await DataService.create_equipment_alias(
            db, override_data, current_user.username
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/equipment-overrides/{override_id}")
async def update_equipment_override(
    override_id: int,
    override_data: EquipmentNameOverrideCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """อัพเดทชื่อแทนของอุปกรณ์"""
    
    try:
        return await DataService.update_equipment_alias(
            db, override_id, override_data, current_user.username
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/equipment-overrides/{override_id}")
async def delete_equipment_override(
    override_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ลบชื่อแทนของอุปกรณ์"""
    
    success = await DataService.delete_equipment_alias(db, override_id)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="ไม่พบข้อมูลที่ต้องการลบ"
        )
    
    return {"message": "ลบข้อมูลเรียบร้อยแล้ว"}


@router.post("/refresh-views")
async def refresh_continuous_aggregates(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """รีเฟรช TimescaleDB Continuous Aggregates"""
    
    try:
        return await DataService.refresh_continuous_aggregates(db)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถรีเฟรช views ได้: {str(e)}"
        )


@router.post("/views/rebuild-cagg")
async def rebuild_continuous_aggregate(
    view_name: str,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """สร้างใหม่ Continuous Aggregate"""
    
    from sqlalchemy import text
    
    # ตรวจสอบว่า view มีอยู่จริง
    check_query = """
    SELECT 1 FROM timescaledb_information.continuous_aggregates 
    WHERE view_name = :view_name AND view_schema = 'public'
    """
    
    result = await db.execute(text(check_query), {"view_name": view_name})
    
    if not result.fetchone():
        raise HTTPException(
            status_code=404,
            detail="ไม่พบ Continuous Aggregate ที่ระบุ"
        )
    
    # สั่ง refresh
    refresh_query = f"CALL refresh_continuous_aggregate('{view_name}', NULL, NULL)"
    
    try:
        await db.execute(text(refresh_query))
        await db.commit()
        
        return {"message": f"รีเฟรช {view_name} เรียบร้อยแล้ว"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถรีเฟรช view ได้: {str(e)}"
        )


@router.get("/data-centers", response_model=List[DataCenterResponse])
async def get_data_centers(
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ดึงรายการ Data Centers ทั้งหมด"""
    
    try:
        from ..models.models import DataCenter
        result = await db.execute(
            select(DataCenter).order_by(DataCenter.created_at.desc())
        )
        data_centers = result.scalars().all()
        return data_centers
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล Data Centers ได้: {str(e)}"
        )


@router.post("/data-centers", response_model=DataCenterResponse)
async def create_data_center(
    data_center_data: DataCenterCreate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """สร้าง Data Center ใหม่"""
    
    try:
        from ..models.models import DataCenter
        
        # ตรวจสอบว่า site_code ไม่ซ้ำ
        existing = await db.execute(
            select(DataCenter).where(DataCenter.site_code == data_center_data.site_code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Site code '{data_center_data.site_code}' ถูกใช้งานแล้ว"
            )
        
        # สร้าง Data Center ใหม่
        new_dc = DataCenter(
            name=data_center_data.name,
            location=data_center_data.location,
            description=data_center_data.description,
            site_code=data_center_data.site_code,
            ip_address=data_center_data.ip_address,
            is_active=data_center_data.is_active
        )
        
        db.add(new_dc)
        await db.commit()
        await db.refresh(new_dc)
        
        return new_dc
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้าง Data Center ได้: {str(e)}"
        )


@router.put("/data-centers/{data_center_id}", response_model=DataCenterResponse)
async def update_data_center(
    data_center_id: int,
    data_center_data: DataCenterUpdate,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """อัปเดตข้อมูล Data Center"""
    
    try:
        from ..models.models import DataCenter
        
        # ค้นหา Data Center ที่ต้องการอัปเดต
        result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = result.scalar_one_or_none()
        
        if not data_center:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Data Center ที่ระบุ"
            )
        
        # ตรวจสอบ site_code ไม่ซ้ำ (ถ้ามีการเปลี่ยน)
        if data_center_data.site_code and data_center_data.site_code != data_center.site_code:
            existing = await db.execute(
                select(DataCenter).where(
                    DataCenter.site_code == data_center_data.site_code,
                    DataCenter.id != data_center_id
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail=f"Site code '{data_center_data.site_code}' ถูกใช้งานแล้ว"
                )
        
        # อัปเดตข้อมูล
        update_data = data_center_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(data_center, field, value)
        
        await db.commit()
        await db.refresh(data_center)
        
        return data_center
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถอัปเดต Data Center ได้: {str(e)}"
        )


@router.delete("/data-centers/{data_center_id}")
async def delete_data_center(
    data_center_id: int,
    db: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_admin_user)
):
    """ลบ Data Center"""
    
    try:
        from ..models.models import DataCenter
        
        # ค้นหา Data Center ที่ต้องการลบ
        result = await db.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = result.scalar_one_or_none()
        
        if not data_center:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Data Center ที่ระบุ"
            )
        
        # ตรวจสอบว่ามีอุปกรณ์ที่เกี่ยวข้องหรือไม่
        from ..models.models import Equipment
        equipment_count = await db.execute(
            select(func.count()).select_from(Equipment).where(Equipment.data_center_id == data_center_id)
        )
        if equipment_count.scalar() > 0:
            raise HTTPException(
                status_code=400,
                detail="ไม่สามารถลบ Data Center ที่มีอุปกรณ์อยู่ได้"
            )
        
        # ลบ Data Center
        await db.delete(data_center)
        await db.commit()
        
        return {"message": "ลบ Data Center เรียบร้อยแล้ว"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถลบ Data Center ได้: {str(e)}"
        )
