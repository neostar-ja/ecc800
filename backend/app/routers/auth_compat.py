from fastapi import APIRouter, Form, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.user_service import UserService
from app.auth.jwt import create_access_token

router = APIRouter()


@router.post("/login")
async def legacy_login(
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Compatibility endpoint: POST /auth/login expected by some frontend builds."""
    user = await UserService.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})

    return {"access_token": access_token, "token_type": "bearer", "user": {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
    }}
