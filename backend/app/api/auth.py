"""
API endpoints สำหรับการยืนยันตัวตน
"""
from datetime import datetime, timedelta
from typing import Annotated
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import JWTError, jwt
import os

from app.core.config import settings
from app.core.database import get_db
from app.models.base import User
from app.schemas.auth import Token, UserCreate, UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.APP_BASE_PATH}/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบรหัสผ่าน"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """สร้าง hash ของรหัสผ่าน"""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """สร้าง JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRES_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    """หาผู้ใช้จาก username"""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, username: str, password: str) -> User | None:
    """ยืนยันตัวตน"""
    user = await get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """ได้รับข้อมูลผู้ใช้ปัจจุบันจาก JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    
    return user


async def get_active_user(current_user: User = Depends(get_current_user)) -> User:
    """ได้รับข้อมูลผู้ใช้ที่ active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    """เข้าสู่ระบบและรับ access token"""
    try:
        user = await authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_active_user)):
    """ได้รับข้อมูลผู้ใช้ปัจจุบัน"""
    return current_user


@router.post("/initialize", response_model=dict)
async def initialize_users(db: AsyncSession = Depends(get_db)):
    """สร้างผู้ใช้เริ่มต้น (admin, analyst, viewer)"""
    try:
        users_to_create = [
            {
                "username": settings.admin_username,
                "password": settings.admin_password,
                "role": "admin",
                "full_name": "Administrator",
                "email": "admin@hospital.local"
            },
            {
                "username": settings.analyst_username,
                "password": settings.analyst_password,
                "role": "analyst",
                "full_name": "Data Analyst",
                "email": "analyst@hospital.local"
            },
            {
                "username": settings.viewer_username,
                "password": settings.viewer_password,
                "role": "viewer",
                "full_name": "Report Viewer",
                "email": "viewer@hospital.local"
            }
        ]
        
        created_users = []
        
        for user_data in users_to_create:
            # ตรวจสอบว่ามีผู้ใช้นี้แล้วหรือไม่
            existing_user = await get_user_by_username(db, user_data["username"])
            
            if not existing_user:
                # สร้างผู้ใช้ใหม่
                hashed_password = get_password_hash(user_data["password"])
                db_user = User(
                    username=user_data["username"],
                    password_hash=hashed_password,
                    role=user_data["role"],
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    is_active=True
                )
                
                db.add(db_user)
                created_users.append(user_data["username"])
        
        await db.commit()
        
        return {
            "message": "ผู้ใช้เริ่มต้นถูกสร้างเรียบร้อยแล้ว",
            "created_users": created_users
        }
    except Exception as e:
        logger.error(f"Initialize users error: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize users: {str(e)}"
        )


@router.post("/dev-token", response_model=Token)
async def dev_token():
    """Development helper: return a JWT for the admin user when ALLOW_DEV_TOKEN=true.

    This endpoint is intentionally gated and should NOT be enabled in production.
    It exists to make automated tests in local/dev environments easier.
    """
    if os.environ.get("ALLOW_DEV_TOKEN", "false").lower() != "true":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dev token not allowed")

    # Create a token for the default admin user
    access_token = create_access_token(data={"sub": settings.admin_username, "role": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}
