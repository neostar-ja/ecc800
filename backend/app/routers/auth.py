"""
API endpoints สำหรับการยืนยันตัวตน Authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.database import get_async_session
from ..schemas.auth import LoginResponse, UserResponse
from ..services.user_service import UserService
from ..auth.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["การยืนยันตัวตน"])


@router.post("/login", response_model=LoginResponse)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_async_session)
):
    """เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน"""
    
    # ตรวจสอบการเข้าสู่ระบบ
    user = await UserService.authenticate_user(db, username, password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # สร้าง access token
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )
