"""
API Routes for Menu Items Management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.database import get_db
from app.models.models import MenuItem, RoleMenuPermission
from app.models.models import User
from app.schemas.auth_extended import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse
)
from app.api.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/menu-items", tags=["Menu Items"])


@router.get("/", response_model=List[MenuItemResponse])
async def list_menu_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_visible: Optional[bool] = None,
    parent_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """รายการเมนูทั้งหมด"""
    query = select(MenuItem)
    
    if is_visible is not None:
        query = query.where(MenuItem.is_visible == is_visible)
    
    if parent_id is not None:
        query = query.where(MenuItem.parent_id == parent_id)
    else:
        # Get only top-level items if no parent specified
        query = query.where(MenuItem.parent_id.is_(None))
    
    query = query.order_by(MenuItem.order, MenuItem.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/all", response_model=List[MenuItemResponse])
async def list_all_menu_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """รายการเมนูทั้งหมด (flat list)"""
    query = select(MenuItem).order_by(MenuItem.order, MenuItem.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{menu_id}", response_model=MenuItemResponse)
async def get_menu_item(
    menu_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูลเมนู"""
    query = select(MenuItem).where(MenuItem.id == menu_id)
    result = await db.execute(query)
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    return menu


@router.post("/", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    menu_data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้างเมนูใหม่ (Admin only)"""
    # Check if name already exists
    existing = await db.execute(select(MenuItem).where(MenuItem.name == menu_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Menu name already exists")
    
    # Check parent exists if specified
    if menu_data.parent_id:
        parent = await db.execute(
            select(MenuItem).where(MenuItem.id == menu_data.parent_id)
        )
        if not parent.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Parent menu not found")
    
    menu = MenuItem(**menu_data.model_dump())
    db.add(menu)
    await db.commit()
    await db.refresh(menu)
    
    return menu


@router.put("/{menu_id}", response_model=MenuItemResponse)
async def update_menu_item(
    menu_id: int,
    menu_data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """แก้ไขเมนู (Admin only)"""
    result = await db.execute(select(MenuItem).where(MenuItem.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Check if new name conflicts
    if menu_data.name and menu_data.name != menu.name:
        existing = await db.execute(select(MenuItem).where(MenuItem.name == menu_data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Menu name already exists")
    
    update_data = menu_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(menu, field, value)
    
    await db.commit()
    await db.refresh(menu)
    
    return menu


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    menu_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ลบเมนู (Admin only)"""
    result = await db.execute(select(MenuItem).where(MenuItem.id == menu_id))
    menu = result.scalar_one_or_none()
    
    if not menu:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Check for children
    children_count = await db.execute(
        select(func.count(MenuItem.id)).where(MenuItem.parent_id == menu_id)
    )
    if children_count.scalar() > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete menu with children. Delete children first."
        )
    
    # Delete related permissions
    await db.execute(
        delete(RoleMenuPermission).where(RoleMenuPermission.menu_item_id == menu_id)
    )
    
    await db.delete(menu)
    await db.commit()


@router.post("/init-defaults", response_model=List[MenuItemResponse])
async def init_default_menus(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง default menu items"""
    default_menus = [
        {
            "name": "dashboard",
            "display_name": "Dashboard",
            "path": "/",
            "icon": "Dashboard",
            "order": 1,
            "is_visible": True,
            "description": "Main dashboard with overview"
        },
        {
            "name": "datacenter",
            "display_name": "Data Center",
            "path": "/datacenter",
            "icon": "Storage",
            "order": 2,
            "is_visible": True,
            "description": "Data center visualization"
        },
        {
            "name": "metrics",
            "display_name": "Metrics",
            "path": "/metrics",
            "icon": "Analytics",
            "order": 3,
            "is_visible": True,
            "description": "Metrics and monitoring"
        },
        {
            "name": "faults",
            "display_name": "Faults",
            "path": "/faults",
            "icon": "Warning",
            "order": 4,
            "is_visible": True,
            "description": "Fault management"
        },
        {
            "name": "power_cooling",
            "display_name": "Power & Cooling",
            "path": "/power-cooling",
            "icon": "Power",
            "order": 5,
            "is_visible": True,
            "description": "Power and cooling monitoring"
        },
        {
            "name": "work_orders",
            "display_name": "Work Orders",
            "path": "/work-orders",
            "icon": "Assignment",
            "order": 6,
            "is_visible": True,
            "description": "Work order management"
        },
        {
            "name": "reports",
            "display_name": "Reports",
            "path": "/reports",
            "icon": "Assessment",
            "order": 7,
            "is_visible": True,
            "description": "Reports and analytics"
        },
        {
            "name": "admin",
            "display_name": "Administration",
            "path": "/admin",
            "icon": "AdminPanelSettings",
            "order": 100,
            "is_visible": True,
            "description": "System administration"
        },
        {
            "name": "settings",
            "display_name": "Settings",
            "path": "/settings",
            "icon": "Settings",
            "order": 101,
            "is_visible": True,
            "description": "System settings"
        }
    ]
    
    created_menus = []
    for menu_data in default_menus:
        # Check if already exists
        existing = await db.execute(
            select(MenuItem).where(MenuItem.name == menu_data["name"])
        )
        if not existing.scalar_one_or_none():
            menu = MenuItem(**menu_data)
            db.add(menu)
            created_menus.append(menu)
    
    if created_menus:
        await db.commit()
        for menu in created_menus:
            await db.refresh(menu)
    
    # Return all menus
    result = await db.execute(select(MenuItem).order_by(MenuItem.order))
    return result.scalars().all()
