"""
Configuration settings for ECC800 Data Center Monitoring System
การตั้งค่าสำหรับระบบ ECC800 Data Center Monitoring
"""
from pydantic_settings import BaseSettings
from pydantic import Field, AnyHttpUrl
from functools import lru_cache
from typing import List
import os

class Settings(BaseSettings):
    """Application settings - อ่านจาก .env"""
    
    # Database connection - การเชื่อมต่อฐานข้อมูล
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "ecc800"
    POSTGRES_USER: str = "ecc800"
    POSTGRES_PASSWORD: str = "change-me"

    # JWT Configuration - การตั้งค่า JWT
    JWT_SECRET: str = "change-this-jwt-secret"
    JWT_EXPIRES_HOURS: int = 24
    JWT_ALGORITHM: str = "HS256"

    # Application paths - เส้นทางแอปพลิเคชัน
    APP_BASE_PATH: str = "/ecc800"
    PUBLIC_BASE_URL: AnyHttpUrl = Field(default="https://10.251.150.222:3344/ecc800")

    # CORS
    cors_origins: List[str] = ["https://10.251.150.222:3344"]
    
    # Debug mode
    debug: bool = False

    # Security: Allow public (no-auth) metrics endpoints - default False for production
    ALLOW_PUBLIC_METRICS: bool = False
    ALLOW_DEV_TOKEN: bool = False
    
    # Admin users
    admin_username: str = "admin"
    admin_password: str = "change-me-admin"
    analyst_username: str = "analyst"
    analyst_password: str = "change-me-analyst"
    viewer_username: str = "viewer"
    viewer_password: str = "change-me-viewer"

    # Optional table name overrides - กำหนดชื่อตารางเพิ่มเติมถ้าไม่ตรงกับ heuristic
    PERF_TABLE: str | None = None
    FAULT_TABLE: str | None = None
    EQUIP_TABLE: str | None = None
    DATACENTER_TABLE: str | None = None

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def API_PREFIX(self) -> str:
        """API prefix path - เส้นทางแอป API"""
        return f"{self.APP_BASE_PATH}/api"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Async database URL for asyncpg - URL ฐานข้อมูลสำหรับ asyncpg"""
        from urllib.parse import quote_plus
        encoded_password = quote_plus(self.POSTGRES_PASSWORD)
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:"
            f"{encoded_password}@{self.POSTGRES_HOST}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def database_url(self) -> str:
        """Database URL สำหรับ sync connection"""
        from urllib.parse import quote_plus
        encoded_password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql://{self.POSTGRES_USER}:{encoded_password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def database_url_async(self) -> str:
        """Database URL สำหรับ async connection"""
        from urllib.parse import quote_plus
        encoded_password = quote_plus(self.POSTGRES_PASSWORD)
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{encoded_password}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance - รับ instance การตั้งค่าที่แคชไว้"""
    return Settings()

# Backward compatibility - ใช้ได้กับโค้ดเก่า
settings = get_settings()
