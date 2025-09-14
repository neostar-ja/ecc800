"""
Dependencies สำหรับการยืนยันตัวตนและสิทธิ์
Authentication and authorization dependencies
"""

from typing import List
from functools import wraps
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.database import get_async_session
from ..models.models import User
from ..auth.jwt import verify_token

# Security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_async_session)
) -> User:
    """ดึงข้อมูลผู้ใช้งานปัจจุบันจาก JWT token"""
    
    token = credentials.credentials
    payload = verify_token(token)
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ค้นหาผู้ใช้ในฐานข้อมูล
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ไม่พบผู้ใช้งาน",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="บัญชีผู้ใช้ถูกระงับ"
        )
    
    return user


def require_roles(*allowed_roles: str):
    """Decorator สำหรับตรวจสอบสิทธิ์ตามบทบาท"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # ค้นหา current_user ใน kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if current_user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"ไม่มีสิทธิ์เข้าถึง ต้องการสิทธิ์: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# Role-based dependencies
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """ตรวจสอบสิทธิ์ Admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ต้องการสิทธิ์ Admin"
        )
    return current_user


async def get_analyst_or_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """ตรวจสอบสิทธิ์ Analyst หรือ Admin"""
    if current_user.role not in ["admin", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ต้องการสิทธิ์ Analyst หรือ Admin"
        )
    return current_user
