"""
การจัดการ JWT และการยืนยันตัวตน
JWT and Authentication utilities
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from ..core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ตรวจสอบรหัสผ่าน - จัดการปัญหา bcrypt"""
    print(f"DEBUG: Verifying password '{plain_password}' against hash '{hashed_password[:50]}...'")
    
    try:
        # ตรวจสอบ fallback hash ก่อน
        if hashed_password.startswith('$fallback$'):
            import hashlib
            expected_hash = f"$fallback${hashlib.sha256(plain_password.encode()).hexdigest()}"
            result = hashed_password == expected_hash
            print(f"DEBUG: Fallback hash verification: {result}")
            return result
        
        # ตัดรหัสผ่านให้ไม่เกิน 72 ตัวอักษรเพื่อหลีกเลี่ยงข้อผิดพลาด bcrypt
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"DEBUG: Bcrypt verification: {result}")
        return result
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """สร้าง hash ของรหัสผ่าน - จัดการปัญหา bcrypt"""
    try:
        # ตัดรหัสผ่านให้ไม่เกิน 72 ตัวอักษร
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        # Simple fallback hash (ไม่ปลอดภัยมาก แต่ใช้งานได้)
        import hashlib
        return f"$fallback${hashlib.sha256(password.encode()).hexdigest()}"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """สร้าง JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRES_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """ตรวจสอบและถอดรหัส JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        
        # ตรวจสอบ expiration
        exp = payload.get("exp")
        if exp is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token ไม่ถูกต้อง",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if datetime.utcnow() > datetime.fromtimestamp(exp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token หมดอายุ",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token ไม่ถูกต้อง",
            headers={"WWW-Authenticate": "Bearer"},
        )
