"""
API Routes for Role Menu Permissions Management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.models import Role, MenuItem, RoleMenuPermission, User
from app.schemas.auth_extended import (
    RoleMenuPermissionCreate, RoleMenuPermissionUpdate, RoleMenuPermissionResponse,
    PermissionMatrixItem, RolePermissionMatrix, BulkPermissionUpdate
)
from app.api.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/permissions", tags=["Role Permissions"])


@router.get("/", response_model=List[RoleMenuPermissionResponse])
async def list_permissions(
    role_id: Optional[int] = None,
    menu_item_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """รายการ permissions ทั้งหมด"""
    query = select(RoleMenuPermission)
    
    if role_id is not None:
        query = query.where(RoleMenuPermission.role_id == role_id)
    
    if menu_item_id is not None:
        query = query.where(RoleMenuPermission.menu_item_id == menu_item_id)
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/matrix", response_model=List[RolePermissionMatrix])
async def get_permission_matrix(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึง permission matrix สำหรับทุก role"""
    # Get all roles
    roles_result = await db.execute(
        select(Role).where(Role.is_active == True).order_by(Role.level.desc())
    )
    roles = roles_result.scalars().all()
    
    # Get all menu items
    menus_result = await db.execute(
        select(MenuItem).order_by(MenuItem.order)
    )
    menus = menus_result.scalars().all()
    
    # Get all permissions
    perms_result = await db.execute(select(RoleMenuPermission))
    permissions = perms_result.scalars().all()
    
    # Build lookup dict
    perm_lookup = {}
    for p in permissions:
        key = (p.role_id, p.menu_item_id)
        perm_lookup[key] = p
    
    # Build matrix
    matrix = []
    for role in roles:
        perm_items = []
        for menu in menus:
            key = (role.id, menu.id)
            perm = perm_lookup.get(key)
            
            perm_items.append(PermissionMatrixItem(
                menu_item_id=menu.id,
                menu_name=menu.name,
                menu_display_name=menu.display_name,
                menu_path=menu.path,
                can_view=perm.can_view if perm else False,
                can_edit=perm.can_edit if perm else False,
                can_delete=perm.can_delete if perm else False
            ))
        
        matrix.append(RolePermissionMatrix(
            role_id=role.id,
            role_name=role.name,
            role_display_name=role.display_name,
            permissions=perm_items
        ))
    
    return matrix


@router.get("/role/{role_id}", response_model=RolePermissionMatrix)
async def get_role_permissions(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึง permissions ของ role"""
    # Get role
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Get all menu items
    menus_result = await db.execute(
        select(MenuItem).order_by(MenuItem.order)
    )
    menus = menus_result.scalars().all()
    
    # Get permissions for this role
    perms_result = await db.execute(
        select(RoleMenuPermission).where(RoleMenuPermission.role_id == role_id)
    )
    permissions = perms_result.scalars().all()
    
    # Build lookup
    perm_lookup = {p.menu_item_id: p for p in permissions}
    
    # Build permission items
    perm_items = []
    for menu in menus:
        perm = perm_lookup.get(menu.id)
        perm_items.append(PermissionMatrixItem(
            menu_item_id=menu.id,
            menu_name=menu.name,
            menu_display_name=menu.display_name,
            menu_path=menu.path,
            can_view=perm.can_view if perm else False,
            can_edit=perm.can_edit if perm else False,
            can_delete=perm.can_delete if perm else False
        ))
    
    return RolePermissionMatrix(
        role_id=role.id,
        role_name=role.name,
        role_display_name=role.display_name,
        permissions=perm_items
    )


@router.get("/user/current", response_model=List[PermissionMatrixItem])
async def get_current_user_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึง permissions ของ user ที่ login อยู่"""
    # Get user's role
    role_result = await db.execute(
        select(Role).where(Role.name == current_user.role)
    )
    role = role_result.scalar_one_or_none()
    
    # If no role found, return empty permissions
    if not role:
        return []
    
    # Get all menu items
    menus_result = await db.execute(
        select(MenuItem).where(MenuItem.is_visible == True).order_by(MenuItem.order)
    )
    menus = menus_result.scalars().all()
    
    # Get permissions for this role
    perms_result = await db.execute(
        select(RoleMenuPermission).where(RoleMenuPermission.role_id == role.id)
    )
    permissions = perms_result.scalars().all()
    
    # Build lookup
    perm_lookup = {p.menu_item_id: p for p in permissions}
    
    # Build permission items
    perm_items = []
    for menu in menus:
        perm = perm_lookup.get(menu.id)
        if perm and perm.can_view:
            perm_items.append(PermissionMatrixItem(
                menu_item_id=menu.id,
                menu_name=menu.name,
                menu_display_name=menu.display_name,
                menu_path=menu.path,
                can_view=perm.can_view,
                can_edit=perm.can_edit,
                can_delete=perm.can_delete
            ))
    
    return perm_items


@router.post("/", response_model=RoleMenuPermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    perm_data: RoleMenuPermissionCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง permission ใหม่ (Admin only)"""
    # Check role exists
    role = await db.execute(select(Role).where(Role.id == perm_data.role_id))
    if not role.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role not found")
    
    # Check menu exists
    menu = await db.execute(
        select(MenuItem).where(MenuItem.id == perm_data.menu_item_id)
    )
    if not menu.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Menu item not found")
    
    # Check if already exists
    existing = await db.execute(
        select(RoleMenuPermission).where(
            RoleMenuPermission.role_id == perm_data.role_id,
            RoleMenuPermission.menu_item_id == perm_data.menu_item_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Permission already exists")
    
    perm = RoleMenuPermission(**perm_data.model_dump())
    db.add(perm)
    await db.commit()
    await db.refresh(perm)
    
    return perm


@router.put("/{perm_id}", response_model=RoleMenuPermissionResponse)
async def update_permission(
    perm_id: int,
    perm_data: RoleMenuPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """แก้ไข permission (Admin only)"""
    result = await db.execute(
        select(RoleMenuPermission).where(RoleMenuPermission.id == perm_id)
    )
    perm = result.scalar_one_or_none()
    
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    update_data = perm_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(perm, field, value)
    
    await db.commit()
    await db.refresh(perm)
    
    return perm


@router.delete("/{perm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    perm_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ลบ permission (Admin only)"""
    result = await db.execute(
        select(RoleMenuPermission).where(RoleMenuPermission.id == perm_id)
    )
    perm = result.scalar_one_or_none()
    
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    await db.delete(perm)
    await db.commit()


@router.post("/bulk-update", response_model=List[RoleMenuPermissionResponse])
async def bulk_update_permissions(
    bulk_data: BulkPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """Bulk update permissions for a role (Admin only)"""
    # Check role exists
    role = await db.execute(select(Role).where(Role.id == bulk_data.role_id))
    if not role.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role not found")
    
    updated_perms = []
    
    for perm_item in bulk_data.permissions:
        menu_item_id = perm_item.get("menu_item_id")
        if not menu_item_id:
            continue
        
        # Check if permission exists
        result = await db.execute(
            select(RoleMenuPermission).where(
                RoleMenuPermission.role_id == bulk_data.role_id,
                RoleMenuPermission.menu_item_id == menu_item_id
            )
        )
        perm = result.scalar_one_or_none()
        
        if perm:
            # Update existing
            if "can_view" in perm_item:
                perm.can_view = perm_item["can_view"]
            if "can_edit" in perm_item:
                perm.can_edit = perm_item["can_edit"]
            if "can_delete" in perm_item:
                perm.can_delete = perm_item["can_delete"]
        else:
            # Create new
            perm = RoleMenuPermission(
                role_id=bulk_data.role_id,
                menu_item_id=menu_item_id,
                can_view=perm_item.get("can_view", False),
                can_edit=perm_item.get("can_edit", False),
                can_delete=perm_item.get("can_delete", False)
            )
            db.add(perm)
        
        updated_perms.append(perm)
    
    await db.commit()
    
    # Refresh all
    for perm in updated_perms:
        await db.refresh(perm)
    
    return updated_perms


@router.post("/init-defaults", response_model=List[RoleMenuPermissionResponse])
async def init_default_permissions(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง default permissions สำหรับ roles"""
    # Get all roles
    roles_result = await db.execute(select(Role))
    roles = {r.name: r for r in roles_result.scalars().all()}
    
    # Get all menu items
    menus_result = await db.execute(select(MenuItem))
    menus = {m.name: m for m in menus_result.scalars().all()}
    
    if not roles or not menus:
        raise HTTPException(
            status_code=400, 
            detail="Roles and menu items must be initialized first"
        )
    
    # Define default permissions
    # Admin: full access
    # Editor: view/edit most, no admin
    # Viewer: view only (except admin)
    
    default_perms = []
    
    for menu_name, menu in menus.items():
        # Admin gets full access to everything
        if "admin" in roles:
            default_perms.append({
                "role_id": roles["admin"].id,
                "menu_item_id": menu.id,
                "can_view": True,
                "can_edit": True,
                "can_delete": True
            })
        
        # Editor gets view/edit for most, except admin pages
        if "editor" in roles:
            is_admin_menu = menu_name in ["admin", "settings"]
            default_perms.append({
                "role_id": roles["editor"].id,
                "menu_item_id": menu.id,
                "can_view": not is_admin_menu,
                "can_edit": not is_admin_menu,
                "can_delete": False
            })
        
        # Viewer gets view only for non-admin pages
        if "viewer" in roles:
            is_admin_menu = menu_name in ["admin", "settings"]
            default_perms.append({
                "role_id": roles["viewer"].id,
                "menu_item_id": menu.id,
                "can_view": not is_admin_menu,
                "can_edit": False,
                "can_delete": False
            })
    
    created_perms = []
    for perm_data in default_perms:
        # Check if already exists
        existing = await db.execute(
            select(RoleMenuPermission).where(
                RoleMenuPermission.role_id == perm_data["role_id"],
                RoleMenuPermission.menu_item_id == perm_data["menu_item_id"]
            )
        )
        if not existing.scalar_one_or_none():
            perm = RoleMenuPermission(**perm_data)
            db.add(perm)
            created_perms.append(perm)
    
    if created_perms:
        await db.commit()
        for perm in created_perms:
            await db.refresh(perm)
    
    # Return all permissions
    result = await db.execute(select(RoleMenuPermission))
    return result.scalars().all()
