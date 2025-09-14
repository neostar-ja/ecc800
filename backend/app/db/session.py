"""
Database session management for ECC800
การจัดการเซสชันฐานข้อมูลสำหรับ ECC800
"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
from app.core.config import get_settings

# Get settings instance - รับ instance การตั้งค่า
settings = get_settings()

# Create async engine - สร้าง async engine
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.debug,
    poolclass=NullPool,  # ให้เชื่อมต่อ on-demand, ปลอดภัยกับ Timescale/PG ภายนอก
    pool_pre_ping=True,
)

# Create session maker - สร้างตัวสร้างเซสชัน
SessionLocal = async_sessionmaker(
    engine, 
    autoflush=False, 
    expire_on_commit=False, 
    class_=AsyncSession
)

@asynccontextmanager
async def get_session():
    """Get async database session - รับเซสชันฐานข้อมูล async"""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Dependency for FastAPI - Dependency สำหรับ FastAPI
async def get_db_session() -> AsyncSession:
    """FastAPI dependency for database session"""
    async with get_session() as session:
        yield session
