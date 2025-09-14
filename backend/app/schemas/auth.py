"""
Schema สำหรับการยืนยันตัวตน
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token payload data"""
    username: Optional[str] = None


class UserBase(BaseModel):
    """User base schema"""
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "viewer"
    is_active: bool = True


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserResponse(UserBase):
    """User response schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Alias for backwards compatibility
User = UserResponse


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
