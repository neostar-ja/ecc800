"""
บริการจัดการผู้ใช้งาน User Management Service
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from ..models.models import User
from ..schemas.schemas import UserResponse
from ..auth.jwt import get_password_hash, verify_password


class UserService:
    """บริการจัดการผู้ใช้งาน"""
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]:
        """ตรวจสอบการเข้าสู่ระบบ"""
        # ค้นหาผู้ใช้
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # ตรวจสอบรหัสผ่าน
        if not verify_password(password, user.password_hash):
            return None
        
        # ตรวจสอบสถานะ active
        if not user.is_active:
            return None
        
        return user
    
    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """ค้นหาผู้ใช้ด้วยชื่อผู้ใช้"""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """ค้นหาผู้ใช้ด้วย ID"""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_user(
        db: AsyncSession, 
        username: str, 
        password: str, 
        role: str = "viewer",
        is_active: bool = True
    ) -> User:
        """สร้างผู้ใช้ใหม่"""
        try:
            # เช็คว่าผู้ใช้ซ้ำไหม
            existing_user = await UserService.get_user_by_username(db, username)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ชื่อผู้ใช้นี้มีอยู่แล้ว"
                )
            
            # สร้างผู้ใช้ใหม่
            password_hash = get_password_hash(password)
            user = User(
                username=username,
                password_hash=password_hash,
                role=role,
                is_active=is_active
            )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            return user
            
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ไม่สามารถสร้างผู้ใช้ได้ อาจมีชื่อผู้ใช้ซ้ำ"
            )
