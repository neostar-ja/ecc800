"""
API endpoints สำหรับข้อมูลอุปกรณ์
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, and_, or_, func
from sqlalchemy.orm import joinedload

from app.core.database import get_db, execute_raw_query
from app.models.base import (
    PerformanceEquipmentMaster, 
    EquipmentDisplayName, 
    PerformanceData,
    FaultPerformanceData,
    EquipmentNameOverride,
    User
)
from app.schemas.equipment import (
    EquipmentResponse,
    EquipmentDetailResponse,
    PerformanceDataResponse,
    FaultDataResponse,
    EquipmentSummaryResponse,
    EquipmentNameOverrideCreate,
    EquipmentNameOverrideResponse
)
from app.api.auth import get_active_user

router = APIRouter()


@router.get("/summary", response_model=EquipmentSummaryResponse)
async def get_equipment_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """สรุปข้อมูลอุปกรณ์ทั้งหมด"""
    
    # นับจำนวนอุปกรณ์ทั้งหมด
    total_equipment_result = await db.execute(
        select(func.count(PerformanceEquipmentMaster.id))
    )
    total_equipment = total_equipment_result.scalar()
    
    # นับจำนวนไซต์
    sites_result = await db.execute(
        select(func.count(func.distinct(PerformanceEquipmentMaster.site_code)))
    )
    total_sites = sites_result.scalar()
    
    # นับจำนวนประเภทอุปกรณ์
    types_result = await db.execute(
        select(func.count(func.distinct(PerformanceEquipmentMaster.equipment_type)))
        .where(PerformanceEquipmentMaster.equipment_type.isnot(None))
    )
    equipment_types = types_result.scalar()
    
    # ข้อมูลล่าสุด - เช็คจาก performance_data
    latest_data_result = await db.execute(
        select(func.max(PerformanceData.time))
    )
    latest_update = latest_data_result.scalar()
    
    return {
        "total_equipment": total_equipment or 0,
        "total_sites": total_sites or 0,
        "equipment_types": equipment_types or 0,
        "latest_update": latest_update
    }


@router.get("/", response_model=List[EquipmentResponse])
async def get_equipment_list(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_type: Optional[str] = Query(None, description="ประเภทอุปกรณ์"),
    search: Optional[str] = Query(None, description="ค้นหาจากชื่ออุปกรณ์"),
    limit: int = Query(100, ge=1, le=1000, description="จำนวนผลลัพธ์"),
    offset: int = Query(0, ge=0, description="เริ่มจากรายการที่"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการอุปกรณ์ทั้งหมด"""
    
    # สร้าง query โดยใช้ view ที่มีชื่อแสดงผล
    query = select(EquipmentDisplayName)
    
    # กรองตามเงื่อนไข
    if site_code:
        query = query.where(EquipmentDisplayName.site_code == site_code)
    
    if equipment_type:
        query = query.where(EquipmentDisplayName.equipment_type == equipment_type)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                EquipmentDisplayName.display_name.ilike(search_term),
                EquipmentDisplayName.original_name.ilike(search_term),
                EquipmentDisplayName.equipment_id.ilike(search_term)
            )
        )
    
    # จำกัดผลลัพธ์
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    equipment_list = result.scalars().all()
    
    return [
        {
            "equipment_id": eq.equipment_id,
            "site_code": eq.site_code,
            "equipment_name": eq.display_name,
            "original_name": eq.original_name,
            "equipment_type": eq.equipment_type,
            "description": eq.description
        }
        for eq in equipment_list
    ]


@router.get("/sites", response_model=List[str])
async def get_site_codes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการรหัสไซต์ทั้งหมด"""
    
    result = await db.execute(
        select(PerformanceEquipmentMaster.site_code)
        .distinct()
        .order_by(PerformanceEquipmentMaster.site_code)
    )
    
    return [site[0] for site in result.all()]


@router.get("/types", response_model=List[str])
async def get_equipment_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการประเภทอุปกรณ์ทั้งหมด"""
    
    result = await db.execute(
        select(PerformanceEquipmentMaster.equipment_type)
        .distinct()
        .where(PerformanceEquipmentMaster.equipment_type.isnot(None))
        .order_by(PerformanceEquipmentMaster.equipment_type)
    )
    
    return [eq_type[0] for eq_type in result.all()]


@router.get("/{site_code}/{equipment_id}", response_model=EquipmentDetailResponse)
async def get_equipment_detail(
    site_code: str,
    equipment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายละเอียดอุปกรณ์"""
    
    # หาข้อมูลอุปกรณ์
    equipment_result = await db.execute(
        select(EquipmentDisplayName)
        .where(
            and_(
                EquipmentDisplayName.site_code == site_code,
                EquipmentDisplayName.equipment_id == equipment_id
            )
        )
    )
    equipment = equipment_result.scalar_one_or_none()
    
    if not equipment:
        raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์ที่ระบุ")
    
    # หาข้อมูลประสิทธิภาพล่าสุด (5 รายการ)
    performance_result = await db.execute(
        select(PerformanceData)
        .where(
            and_(
                PerformanceData.site_code == site_code,
                PerformanceData.equipment_id == equipment_id
            )
        )
        .order_by(PerformanceData.time.desc())
        .limit(5)
    )
    performance_data = performance_result.scalars().all()
    
    # หาข้อมูลปัญหาล่าสุด (5 รายการ)
    fault_result = await db.execute(
        select(FaultPerformanceData)
        .where(
            and_(
                FaultPerformanceData.site_code == site_code,
                FaultPerformanceData.equipment_id == equipment_id
            )
        )
        .order_by(FaultPerformanceData.time.desc())
        .limit(5)
    )
    fault_data = fault_result.scalars().all()
    
    return {
        "equipment_id": equipment.equipment_id,
        "site_code": equipment.site_code,
        "equipment_name": equipment.display_name,
        "original_name": equipment.original_name,
        "equipment_type": equipment.equipment_type,
        "description": equipment.description,
        "recent_performance": [
            {
                "time": p.time,
                "kpi_name": p.kpi_name,
                "value": p.value,
                "unit": p.unit,
                "status": p.status
            }
            for p in performance_data
        ],
        "recent_faults": [
            {
                "time": f.time,
                "fault_type": f.fault_type,
                "fault_code": f.fault_code,
                "fault_description": f.fault_description,
                "severity": f.severity,
                "status": f.status
            }
            for f in fault_data
        ]
    }


# Equipment name override endpoints (สำหรับ admin/analyst เท่านั้น)
@router.post("/overrides", response_model=EquipmentNameOverrideResponse)
async def create_equipment_override(
    override_data: EquipmentNameOverrideCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """สร้างหรืออัปเดต equipment name override (admin/analyst เท่านั้น)"""
    
    if current_user.role not in ["admin", "analyst"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ในการแก้ไขชื่ออุปกรณ์")
    
    # ตรวจสอบว่ามี override อยู่แล้วหรือไม่
    existing_result = await db.execute(
        select(EquipmentNameOverride)
        .where(
            and_(
                EquipmentNameOverride.site_code == override_data.site_code,
                EquipmentNameOverride.equipment_id == override_data.equipment_id
            )
        )
    )
    existing_override = existing_result.scalar_one_or_none()
    
    if existing_override:
        # อัปเดต
        existing_override.display_name = override_data.display_name
        existing_override.updated_by = current_user.username
        await db.commit()
        await db.refresh(existing_override)
        return existing_override
    else:
        # สร้างใหม่
        new_override = EquipmentNameOverride(
            site_code=override_data.site_code,
            equipment_id=override_data.equipment_id,
            original_name=override_data.original_name,
            display_name=override_data.display_name,
            updated_by=current_user.username
        )
        db.add(new_override)
        await db.commit()
        await db.refresh(new_override)
        return new_override


@router.get("/overrides", response_model=List[EquipmentNameOverrideResponse])
async def get_equipment_overrides(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """รายการ equipment name overrides ทั้งหมด"""
    
    query = select(EquipmentNameOverride)
    
    if site_code:
        query = query.where(EquipmentNameOverride.site_code == site_code)
    
    result = await db.execute(query.order_by(EquipmentNameOverride.updated_at.desc()))
    return result.scalars().all()



# Compatibility endpoint used by frontend to update equipment display name
@router.put("/{site_code}/{equipment_id}/name")
async def update_equipment_display_name(
    site_code: str,
    equipment_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_active_user)
):
    """
    Update or create an equipment display name override.
    Accepts JSON body: { "display_name": "..." }
    """
    # authorization
    if current_user.role not in ["admin", "analyst"]:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ในการแก้ไขชื่ออุปกรณ์")

    display_name = payload.get('display_name') if isinstance(payload, dict) else None
    if not display_name or not isinstance(display_name, str):
        raise HTTPException(status_code=400, detail="display_name is required")

    # Look for existing override
    existing_result = await db.execute(
        select(EquipmentNameOverride)
        .where(
            and_(
                EquipmentNameOverride.site_code == site_code,
                EquipmentNameOverride.equipment_id == equipment_id
            )
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.display_name = display_name
        existing.updated_by = current_user.username
        await db.commit()
        await db.refresh(existing)
        
        # Refresh the EquipmentDisplayName view to ensure updated data is visible
        try:
            await execute_raw_query("REFRESH MATERIALIZED VIEW IF EXISTS equipment_display_name;")
        except Exception as e:
            # If it's not a materialized view, this will fail silently
            pass
            
        return {
            "success": True,
            "message": "updated",
            "site_code": site_code,
            "equipment_id": equipment_id,
            "display_name": display_name
        }

    # If no existing override, try to find original name from master
    master_result = await db.execute(
        select(PerformanceEquipmentMaster)
        .where(
            and_(
                PerformanceEquipmentMaster.site_code == site_code,
                PerformanceEquipmentMaster.equipment_id == equipment_id
            )
        )
    )
    master = master_result.scalar_one_or_none()
    original_name = None
    if master:
        original_name = getattr(master, 'equipment_name', None) or getattr(master, 'original_name', None)

    new_override = EquipmentNameOverride(
        site_code=site_code,
        equipment_id=equipment_id,
        original_name=original_name or '',
        display_name=display_name,
        updated_by=current_user.username
    )
    db.add(new_override)
    await db.commit()
    await db.refresh(new_override)

    # Refresh the EquipmentDisplayName view to ensure updated data is visible
    try:
        await execute_raw_query("REFRESH MATERIALIZED VIEW IF EXISTS equipment_display_name;")
    except Exception as e:
        # If it's not a materialized view, this will fail silently
        pass

    return {
        "success": True,
        "message": "created",
        "site_code": site_code,
        "equipment_id": equipment_id,
        "display_name": display_name
    }
