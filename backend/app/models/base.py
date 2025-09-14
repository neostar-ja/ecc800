"""
โมเดลฐานข้อมูล ECC800
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, BigInteger, Float
from sqlalchemy import Index
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    """ผู้ใช้งานระบบ"""
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="viewer", index=True)
    email = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EquipmentNameOverride(Base):
    """การแก้ไขชื่ออุปกรณ์"""
    __tablename__ = "equipment_name_overrides"

    id = Column(BigInteger, primary_key=True, index=True)
    site_code = Column(String, nullable=False)
    equipment_id = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    updated_by = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_equipment_overrides_site_equipment', 'site_code', 'equipment_id', unique=True),
    )


class PerformanceEquipmentMaster(Base):
    """ข้อมูลหลักอุปกรณ์"""
    __tablename__ = "performance_equipment_master"

    id = Column(Integer, primary_key=True, index=True)
    equipment_name = Column(String, nullable=False)
    equipment_id = Column(String, nullable=False, index=True)
    equipment_type = Column(String)
    site_code = Column(String, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))


class PerformanceData(Base):
    """ข้อมูลประสิทธิภาพ (hypertable)"""
    __tablename__ = "performance_data"

    time = Column(DateTime(timezone=True), primary_key=True)
    site_code = Column(String, primary_key=True)
    equipment_id = Column(String, primary_key=True)
    kpi_name = Column(String, primary_key=True)
    value = Column(Float)
    unit = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FaultPerformanceData(Base):
    """ข้อมูลปัญหาประสิทธิภาพ (hypertable)"""
    __tablename__ = "fault_performance_data"

    time = Column(DateTime(timezone=True), primary_key=True)
    site_code = Column(String, primary_key=True)
    equipment_id = Column(String, primary_key=True)
    fault_type = Column(String, primary_key=True)
    fault_code = Column(String)
    fault_description = Column(Text)
    severity = Column(String)
    status = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# View models (read-only)
class EquipmentDisplayName(Base):
    """View สำหรับชื่อแสดงอุปกรณ์"""
    __tablename__ = "v_equipment_display_names"

    site_code = Column(String, primary_key=True)
    equipment_id = Column(String, primary_key=True)
    original_name = Column(String)
    display_name = Column(String)
    equipment_type = Column(String)
    description = Column(Text)
