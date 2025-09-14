"""
โมเดลข้อมูลหลักของระบบ ECC800
SQLAlchemy models for ECC800 system
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

Base = declarative_base()


class User(Base):
    """ผู้ใช้งานระบบ"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), nullable=False)  # admin, analyst, viewer
    email = Column(String(255))  # อีเมล (ไม่บังคับ)
    site_access = Column(String(255))  # JSON array of sites
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DataCenter(Base):
    """ศูนย์ข้อมูล (DC/DR)"""
    __tablename__ = "data_centers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    description = Column(Text)
    site_code = Column(String(10), unique=True, nullable=False, index=True)  # DC, DR
    ip_address = Column(INET)  # เปลี่ยนจาก String(45) เป็น INET
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Equipment(Base):
    """อุปกรณ์ในระบบ"""
    __tablename__ = "equipment"
    
    id = Column(Integer, primary_key=True, index=True)
    data_center_id = Column(Integer, ForeignKey("data_centers.id"), nullable=False)
    equipment_name = Column(String(255), nullable=False, index=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    description = Column(Text)
    site_code = Column(String(10), index=True)  # DC, DR
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_equipment_site_id', 'site_code', 'equipment_id'),
    )


class EquipmentAlias(Base):
    """การแทนที่ชื่อแสดงผลของอุปกรณ์"""
    __tablename__ = "equipment_aliases"
    
    id = Column(Integer, primary_key=True, index=True)
    site_code = Column(String(10), nullable=False, index=True)
    equipment_id = Column(String(50), nullable=False, index=True)
    original_name = Column(String(255), nullable=False)
    alias_name = Column(String(255), nullable=False)  # ใช้ alias_name แทน display_name
    scope = Column(Text)  # เพิ่มคอลัมน์ scope
    updated_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_equipment_alias_unique', 'site_code', 'equipment_id', unique=True),
    )


# Performance Data และ Fault Data เป็น reflection จาก TimescaleDB hypertables
# เนื่องจากเป็นตารางที่มีอยู่แล้วและมี time-series partitioning
