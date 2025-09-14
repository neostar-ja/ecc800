"""
Authentication Service สำหรับ ECC800 Monitoring System
Authentication and Authorization Services
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.schemas.auth import User, TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token scheme
security = HTTPBearer()

# Mock users สำหรับทดสอบ
MOCK_USERS = {
    "admin": {
        "user_id": "admin",
        "username": "admin",
        "email": "admin@hospital.local",
        "full_name": "ผู้ดูแลระบบ",
        "role": "admin",
        "is_active": True,
        "id": 1,
        "created_at": datetime(2025, 1, 1, 0, 0, 0),
        "updated_at": datetime(2025, 1, 1, 0, 0, 0),
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # secret
    },
    "operator": {
        "user_id": "operator",
        "username": "operator", 
        "email": "operator@hospital.local",
        "full_name": "ผู้ปฏิบัติการ",
        "role": "operator",
        "is_active": True,
        "id": 2,
        "created_at": datetime(2025, 1, 1, 0, 0, 0),
        "updated_at": datetime(2025, 1, 1, 0, 0, 0),
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # secret
    }
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบรหัสผ่าน"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """สร้าง hash ของรหัสผ่าน"""
    return pwd_context.hash(password)


def get_user(username: str) -> Optional[dict]:
    """ดึงข้อมูลผู้ใช้"""
    return MOCK_USERS.get(username)


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """ตรวจสอบข้อมูลประจำตัวผู้ใช้"""
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """สร้าง JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRES_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """ดึงข้อมูลผู้ใช้ปัจจุบันจาก token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ไม่สามารถยืนยันตัวตนได้",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    
    return User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        updated_at=user["updated_at"]
    )


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """ดึงข้อมูลผู้ใช้ที่ใช้งานอยู่"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="ผู้ใช้ไม่ได้เปิดใช้งาน")
    return current_user


def check_permission(user: User, required_role: str) -> bool:
    """ตรวจสอบสิทธิ์การใช้งาน"""
    role_hierarchy = {
        "viewer": 1,
        "operator": 2, 
        "admin": 3
    }
    
    user_level = role_hierarchy.get(user.role, 0)
    required_level = role_hierarchy.get(required_role, 999)
    
    return user_level >= required_level


def require_role(required_role: str):
    """Decorator สำหรับตรวจสอบสิทธิ์"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not check_permission(current_user, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"ไม่มีสิทธิ์ใช้งานฟีเจอร์นี้ (ต้องการสิทธิ์: {required_role})"
            )
        return current_user
    return role_checker
