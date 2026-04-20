"""
ฐานข้อมูลและการเชื่อมต่อ
"""
import asyncio
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# สร้าง async engine
engine = create_async_engine(
    settings.database_url_async,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=300,
)

# Session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency สำหรับ database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    เริ่มต้นฐานข้อมูล
    """
    from app.models.base import Base
    
    # สร้างตารางทั้งหมด (หากยังไม่มี)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    ปิดการเชื่อมต่อฐานข้อมูล
    """
    await engine.dispose()


async def execute_raw_query(query: str, params=None):
    """
    Execute raw SQL query
    รองรับ params ทั้งแบบ dict และ list/tuple
    """
    from sqlalchemy import text
    
    async with AsyncSessionLocal() as session:
        try:
            # แปลง params ให้เป็นรูปแบบที่ SQLAlchemy รองรับ
            if params is None:
                query_params = {}
            elif isinstance(params, (list, tuple)):
                # Convert positional parameters to named parameters
                # $1, $2, ... becomes :param_1, :param_2, ...
                query_dict = {}
                import re
                for i, param in enumerate(params, 1):
                    param_name = f'param_{i}'
                    query_dict[param_name] = param
                    # Replace $1, $2, etc. with :param_1, :param_2, etc.
                    query = query.replace(f'${i}', f':{param_name}')
                query_params = query_dict
            else:
                # สำหรับ named parameters
                query_params = params
                
            result = await session.execute(text(query), query_params)
            
            # Check if this is a SELECT query (can start with SELECT, WITH, or have SELECT in parentheses)
            query_upper = query.strip().upper()
            is_select = (
                query_upper.startswith('SELECT') or 
                query_upper.startswith('WITH') or
                'SELECT' in query_upper
            )
            
            if is_select:
                rows = result.fetchall()
                if rows:
                    # Convert to dict format
                    columns = result.keys()
                    return [dict(zip(columns, row)) for row in rows]
                return []
            else:
                await session.commit()
                return {"affected_rows": result.rowcount}
        except Exception as e:
            await session.rollback()
            raise e
