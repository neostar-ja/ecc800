"""
API Routes สำหรับการจัดการผู้ใช้
User Management API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from typing import List, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.auth.dependencies import get_admin_user, get_current_user
from app.models.models import User
from app.schemas.schemas import (
    UserResponse, UserCreate, UserUpdate, ChangePasswordRequest
)
from app.auth.jwt import get_password_hash, verify_password

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0, description="Skip records"),
    limit: int = Query(100, ge=1, le=1000, description="Limit records"),
    search: Optional[str] = Query(None, description="Search by username or full name"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status")
):
    """
    รายการผู้ใช้ทั้งหมด (Admin เท่านั้น)
    List all users (Admin only)
    """
    try:
        # Build query conditions
        conditions = ["1=1"]
        params = {"skip": skip, "limit": limit}
        
        if search:
            conditions.append("(LOWER(username) LIKE LOWER(:search) OR LOWER(full_name) LIKE LOWER(:search))")
            params["search"] = f"%{search}%"
            
        if role:
            conditions.append("role = :role")
            params["role"] = role
            
        if is_active is not None:
            conditions.append("is_active = :is_active")
            params["is_active"] = is_active
        
        where_clause = " AND ".join(conditions)
        
        query = text(f"""
            SELECT id, username, full_name, email, role, site_access, is_active, 
                   created_at, updated_at
            FROM users
            WHERE {where_clause}
            ORDER BY username
            LIMIT :limit OFFSET :skip
        """)
        
        result = await db.execute(query, params)
        users = [dict(row) for row in result.mappings()]
        
        return users
        
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list users: {str(e)}"
        )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายละเอียดผู้ใช้ (Admin เท่านั้น)
    Get user details (Admin only)
    """
    try:
        query = text("""
            SELECT id, username, full_name, email, role, site_access, is_active, 
                   created_at, updated_at
            FROM users
            WHERE id = :user_id
        """)
        
        result = await db.execute(query, {"user_id": user_id})
        user = result.mappings().first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        return dict(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user: {str(e)}"
        )


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สร้างผู้ใช้ใหม่ (Admin เท่านั้น)
    Create new user (Admin only)
    """
    try:
        # Check if username already exists
        check_query = text("SELECT id FROM users WHERE username = :username")
        existing = await db.execute(check_query, {"username": user_data.username})
        
        if existing.mappings().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Convert site_access string to array if provided
        site_access_array = None
        if user_data.site_access:
            if isinstance(user_data.site_access, str):
                try:
                    import json
                    site_access_array = json.loads(user_data.site_access)
                except json.JSONDecodeError:
                    # If not valid JSON, split by comma
                    site_access_array = [s.strip() for s in user_data.site_access.split(',')]
            else:
                site_access_array = user_data.site_access
        
        # Create user
        insert_query = text("""
            INSERT INTO users (username, password_hash, full_name, email, role, 
                             site_access, is_active, created_at, updated_at)
            VALUES (:username, :password_hash, :full_name, :email, :role, 
                    :site_access, :is_active, NOW(), NOW())
            RETURNING id, username, full_name, email, role, site_access, is_active, 
                     created_at, updated_at
        """)
        
        result = await db.execute(insert_query, {
            "username": user_data.username,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "email": user_data.email,
            "role": user_data.role,
            "site_access": site_access_array,
            "is_active": user_data.is_active
        })
        
        await db.commit()
        new_user = result.mappings().first()
        
        logger.info(f"User created: {user_data.username} by {current_user.username}")
        return dict(new_user)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    อัปเดทข้อมูลผู้ใช้ (Admin เท่านั้น)
    Update user (Admin only)
    """
    try:
        # Check if user exists
        check_query = text("SELECT id, username FROM users WHERE id = :user_id")
        existing = await db.execute(check_query, {"user_id": user_id})
        existing_user = existing.mappings().first()
        
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if new username is already taken (if username is being updated)
        if user_data.username and user_data.username != existing_user["username"]:
            username_check = text("SELECT id FROM users WHERE username = :username AND id != :user_id")
            existing_username = await db.execute(username_check, {
                "username": user_data.username,
                "user_id": user_id
            })
            
            if existing_username.mappings().first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists"
                )
        
        # Build update query
        update_fields = []
        params = {"user_id": user_id}
        
        if user_data.username is not None:
            update_fields.append("username = :username")
            params["username"] = user_data.username
            
        if user_data.full_name is not None:
            update_fields.append("full_name = :full_name")
            params["full_name"] = user_data.full_name
            
        if user_data.email is not None:
            update_fields.append("email = :email")
            params["email"] = user_data.email
            
        if user_data.role is not None:
            update_fields.append("role = :role")
            params["role"] = user_data.role
            
        if user_data.site_access is not None:
            update_fields.append("site_access = :site_access")
            params["site_access"] = user_data.site_access
            
        if user_data.is_active is not None:
            update_fields.append("is_active = :is_active")
            params["is_active"] = user_data.is_active
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        update_fields.append("updated_at = NOW()")
        
        update_query = text(f"""
            UPDATE users
            SET {', '.join(update_fields)}
            WHERE id = :user_id
            RETURNING id, username, full_name, email, role, site_access, is_active, 
                     created_at, updated_at
        """)
        
        result = await db.execute(update_query, params)
        await db.commit()
        
        updated_user = result.mappings().first()
        
        logger.info(f"User updated: {user_id} by {current_user.username}")
        return dict(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ลบผู้ใช้ (Admin เท่านั้น)
    Delete user (Admin only)
    """
    try:
        # Check if user exists
        check_query = text("SELECT id, username FROM users WHERE id = :user_id")
        existing = await db.execute(check_query, {"user_id": user_id})
        existing_user = existing.mappings().first()
        
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent self-deletion
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Delete user
        delete_query = text("DELETE FROM users WHERE id = :user_id")
        await db.execute(delete_query, {"user_id": user_id})
        await db.commit()
        
        logger.info(f"User deleted: {existing_user['username']} by {current_user.username}")
        return {"message": "User deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


@router.post("/users/{user_id}/change-password")
async def admin_change_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    เปลี่ยนรหัสผ่านของผู้ใช้ (Admin เท่านั้น)
    Change user password (Admin only)
    """
    try:
        # Check if user exists
        check_query = text("SELECT id, username FROM users WHERE id = :user_id")
        existing = await db.execute(check_query, {"user_id": user_id})
        existing_user = existing.mappings().first()
        
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate new password
        if len(new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Hash new password
        password_hash = get_password_hash(new_password)
        
        # Update password
        update_query = text("""
            UPDATE users 
            SET password_hash = :password_hash, updated_at = NOW()
            WHERE id = :user_id
        """)
        
        await db.execute(update_query, {
            "password_hash": password_hash,
            "user_id": user_id
        })
        await db.commit()
        
        logger.info(f"Password changed for user {existing_user['username']} by {current_user.username}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error changing password for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


@router.post("/change-password")
async def change_own_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    เปลี่ยนรหัสผ่านของตัวเอง
    Change own password
    """
    try:
        # Verify current password
        if not verify_password(request.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        if len(request.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long"
            )
        
        # Hash new password
        password_hash = get_password_hash(request.new_password)
        
        # Update password
        update_query = text("""
            UPDATE users 
            SET password_hash = :password_hash, updated_at = NOW()
            WHERE id = :user_id
        """)
        
        await db.execute(update_query, {
            "password_hash": password_hash,
            "user_id": current_user.id
        })
        await db.commit()
        
        logger.info(f"Password changed by user {current_user.username}")
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error changing password for user {current_user.username}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )


@router.get("/roles")
async def get_available_roles(
    # current_user: User = Depends(get_admin_user)
):
    """
    รายการ roles ที่มี
    Available roles
    """
    return {
        "roles": [
            {"value": "admin", "label": "Administrator", "description": "Full system access"},
            {"value": "analyst", "label": "Data Analyst", "description": "Data analysis and reporting"},
            {"value": "viewer", "label": "Viewer", "description": "View-only access"}
        ]
    }


@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สถิติผู้ใช้
    User statistics
    """
    try:
        stats_query = text("""
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE is_active = true) as active_users,
                COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
                COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
                COUNT(*) FILTER (WHERE role = 'analyst') as analyst_users,
                COUNT(*) FILTER (WHERE role = 'viewer') as viewer_users,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
            FROM users
        """)
        
        result = await db.execute(stats_query)
        stats = result.mappings().first()
        
        return dict(stats)
        
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user stats: {str(e)}"
        )
