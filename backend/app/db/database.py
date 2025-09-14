"""
การจัดการฐานข้อมูล Database Management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

# Base สำหรับ SQLAlchemy models
Base = declarative_base()

# Async Engine สำหรับการใช้งานหลัก
async_engine = create_async_engine(
    settings.database_url_async,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Async Session Factory
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Sync Engine สำหรับ Alembic
sync_engine = create_engine(
    settings.database_url,
    pool_pre_ping=True
)


async def get_async_session() -> AsyncSession:
    """สร้าง Database Session สำหรับ Dependency Injection"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> bool:
    """ตรวจสอบการเชื่อมต่อฐานข้อมูล"""
    try:
        async with async_engine.begin() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception:
        return False
