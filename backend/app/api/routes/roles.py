"""
API Routes for Roles Management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.database import get_db
from app.models.models import Role, RoleMenuPermission, User
from app.schemas.auth_extended import (
    RoleCreate, RoleUpdate, RoleResponse
)
from app.api.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=List[RoleResponse])
async def list_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """รายการ roles ทั้งหมด"""
    query = select(Role)
    
    if is_active is not None:
        query = query.where(Role.is_active == is_active)
    
    query = query.order_by(Role.level.desc(), Role.name).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{role_id}/", response_model=RoleResponse)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึงข้อมูล role"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    return role


@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง role ใหม่ (Admin only)"""
    # Check if name already exists
    existing = await db.execute(select(Role).where(Role.name == role_data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    role = Role(**role_data.model_dump())
    db.add(role)
    await db.commit()
    await db.refresh(role)
    
    return role


@router.put("/{role_id}/", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """แก้ไข role (Admin only)"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if new name conflicts with existing
    if role_data.name and role_data.name != role.name:
        existing = await db.execute(select(Role).where(Role.name == role_data.name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Role name already exists")
    
    update_data = role_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    
    await db.commit()
    await db.refresh(role)
    
    return role


@router.delete("/{role_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ลบ role (Admin only)"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if role is in use
    users_count = await db.execute(
        select(func.count(User.id)).where(User.role == role.name)
    )
    if users_count.scalar() > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete role that is assigned to users"
        )
    
    # Delete related permissions first
    await db.execute(
        delete(RoleMenuPermission).where(RoleMenuPermission.role_id == role_id)
    )
    
    await db.delete(role)
    await db.commit()


@router.post("/init-defaults/", response_model=List[RoleResponse])
async def init_default_roles(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง default roles (Admin, Editor, Viewer)"""
    default_roles = [
        {
            "name": "admin",
            "display_name": "Administrator",
            "description": "Full system access - can manage users, settings, and all data",
            "level": 100,
            "is_active": True
        },
        {
            "name": "editor",
            "display_name": "Editor",
            "description": "Can view and edit data, but cannot manage users or system settings",
            "level": 50,
            "is_active": True
        },
        {
            "name": "viewer",
            "display_name": "Viewer",
            "description": "Read-only access - can only view data",
            "level": 10,
            "is_active": True
        }
    ]
    
    created_roles = []
    for role_data in default_roles:
        # Check if already exists
        existing = await db.execute(select(Role).where(Role.name == role_data["name"]))
        if not existing.scalar_one_or_none():
            role = Role(**role_data)
            db.add(role)
            created_roles.append(role)
    
    if created_roles:
        await db.commit()
        for role in created_roles:
            await db.refresh(role)
    
    # Return all roles
    result = await db.execute(select(Role).order_by(Role.level.desc()))
    return result.scalars().all()
