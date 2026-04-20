"""
โมเดลข้อมูลหลักของระบบ ECC800
SQLAlchemy models for ECC800 system
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey, Index, ARRAY
from sqlalchemy.dialects.postgresql import INET, JSONB
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
    site_access = Column(ARRAY(String))  # Array of site names/codes
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


class DashboardObject(Base):
    """วัตถุในแดชบอร์ด 2D Canvas"""
    __tablename__ = "dashboard_objects"
    
    id = Column(Integer, primary_key=True, index=True)
    data_center_id = Column(Integer, ForeignKey("data_centers.id"), nullable=False)
    name = Column(String(255), nullable=False)  # ชื่อแสดงผล
    object_type = Column(String(50), nullable=False, index=True)  # server, aircon, network, ups, battery, cable, rack
    
    # Position and size
    x = Column(Numeric(10, 2), nullable=False, default=0)  # X coordinate
    y = Column(Numeric(10, 2), nullable=False, default=0)  # Y coordinate
    width = Column(Numeric(10, 2), nullable=False, default=100)  # Width
    height = Column(Numeric(10, 2), nullable=False, default=50)  # Height
    rotation = Column(Numeric(10, 2), nullable=False, default=0)  # Rotation in degrees
    
    # Visual properties
    color = Column(String(10), nullable=False, default="#4A90E2")  # Hex color
    background_color = Column(String(10), default="#FFFFFF")  # Background color
    border_color = Column(String(10), default="#000000")  # Border color
    border_width = Column(Numeric(5, 2), default=1)  # Border width
    opacity = Column(Numeric(3, 2), default=1.0)  # 0.0 - 1.0
    
    # Object properties (JSON)
    properties = Column(Text)  # JSON string for custom properties
    
    # Metadata
    description = Column(Text)  # คำอธิบายของวัตถุ
    equipment_id = Column(String(50), index=True)  # Link to equipment if applicable
    is_visible = Column(Boolean, default=True)  # แสดง/ซ่อน
    is_interactive = Column(Boolean, default=True)  # สามารถ interact ได้หรือไม่
    layer_order = Column(Integer, default=0)  # Z-index
    
    created_by = Column(String(50))  # ผู้สร้าง
    updated_by = Column(String(50))  # ผู้แก้ไขล่าสุด
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    data_center = relationship("DataCenter")
    
    # Indexes
    __table_args__ = (
        Index('idx_dashboard_objects_datacenter_type', 'data_center_id', 'object_type'),
        Index('idx_dashboard_objects_visible', 'is_visible'),
    )


class Role(Base):
    """บทบาท/สิทธิ์ผู้ใช้งาน"""
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # admin, editor, viewer
    display_name = Column(String(100), nullable=False)  # ชื่อแสดงผล
    description = Column(Text)  # คำอธิบาย
    level = Column(Integer, default=0)  # ระดับสิทธิ์ (ยิ่งสูง = สิทธิ์มาก)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MenuItem(Base):
    """รายการเมนู/หน้าในระบบ"""
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # ชื่อ unique ของเมนู
    display_name = Column(String(100), nullable=False)  # ชื่อแสดงผล
    path = Column(String(255), nullable=False)  # URL path เช่น /dashboard, /metrics
    icon = Column(String(50))  # ชื่อ icon (MUI icon name)
    parent_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)  # เมนูหลัก (ถ้าเป็น sub-menu)
    order = Column(Integer, default=0)  # ลำดับการแสดงผล
    is_visible = Column(Boolean, default=True)  # แสดงในเมนูหรือไม่
    description = Column(Text)  # คำอธิบาย
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Self-referential relationship
    parent = relationship("MenuItem", remote_side=[id], backref="children")


class RoleMenuPermission(Base):
    """ความสัมพันธ์ระหว่างบทบาทและสิทธิ์การเข้าถึงเมนู"""
    __tablename__ = "role_menu_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    can_view = Column(Boolean, default=True)  # สามารถดูได้
    can_edit = Column(Boolean, default=False)  # สามารถแก้ไขได้
    can_delete = Column(Boolean, default=False)  # สามารถลบได้
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    role = relationship("Role", backref="menu_permissions")
    menu_item = relationship("MenuItem", backref="role_permissions")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_role_menu_unique', 'role_id', 'menu_item_id', unique=True),
    )


class KeycloakConfig(Base):
    """การตั้งค่า Keycloak SSO"""
    __tablename__ = "keycloak_config"
    
    id = Column(Integer, primary_key=True, index=True)
    is_enabled = Column(Boolean, default=False)  # เปิด/ปิดการใช้งาน
    server_url = Column(String(500))  # URL ของ Keycloak server
    realm = Column(String(100))  # Realm name
    client_id = Column(String(100))  # Client ID
    client_secret = Column(String(500))  # Client secret (encrypted)
    redirect_uri = Column(String(500))  # Redirect URI หลัง login
    scope = Column(String(255), default="openid profile email")  # OAuth scopes
    
    # Role mapping
    admin_role = Column(String(100), default="admin")  # Keycloak role -> admin
    editor_role = Column(String(100), default="editor")  # Keycloak role -> editor
    viewer_role = Column(String(100), default="viewer")  # Keycloak role -> viewer
    default_role = Column(String(50), default="viewer")  # Default role if no mapping
    
    # Options
    auto_create_user = Column(Boolean, default=True)  # สร้าง user อัตโนมัติ
    sync_user_info = Column(Boolean, default=True)  # sync ข้อมูล user
    
    # Allowed users - JSON array of {username: string, role: string}
    allowed_users = Column(JSONB, default=[])  # รายชื่อ user ที่อนุญาตให้เข้าสู่ระบบ
    
    updated_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class KeycloakUserMapping(Base):
    """การ map user จาก Keycloak กับ role ในระบบ"""
    __tablename__ = "keycloak_user_mapping"
    
    id = Column(Integer, primary_key=True, index=True)
    keycloak_user_id = Column(String(255), unique=True, index=True, nullable=False)
    keycloak_username = Column(String(255), index=True, nullable=False)
    keycloak_email = Column(String(255))
    keycloak_full_name = Column(String(255))
    local_role = Column(String(50), nullable=False)  # admin, editor, viewer
    is_enabled = Column(Boolean, default=True)
    user_attributes = Column(JSONB)  # Additional attributes from Keycloak
    
    created_by = Column(String(50))
    updated_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DashboardTemplate(Base):
    """เทมเพลตแดshboard สำหรับการจัดเก็บและนำกลับมาใช้"""
    __tablename__ = "dashboard_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # ชื่อเทมเพลต
    description = Column(Text)  # คำอธิบาย
    data_center_id = Column(Integer, ForeignKey("data_centers.id"), nullable=True)  # อ้างอิงถ้าเป็นเทมเพลตเฉพาะ DC
    
    # Template data (JSON)
    template_data = Column(Text, nullable=False)  # JSON string ของ objects ทั้งหมด
    
    # Canvas settings
    canvas_width = Column(Integer, default=1920)
    canvas_height = Column(Integer, default=1080)
    canvas_background = Column(String(10), default="#F5F5F5")
    
    # Metadata
    is_public = Column(Boolean, default=False)  # เทมเพลตสาธารณะหรือส่วนตัว
    is_default = Column(Boolean, default=False)  # เทมเพลตเริ่มต้น
    version = Column(String(20), default="1.0")
    
    created_by = Column(String(50))
    updated_by = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    data_center = relationship("DataCenter")


# Performance Data และ Fault Data เป็น reflection จาก TimescaleDB hypertables
# เนื่องจากเป็นตารางที่มีอยู่แล้วและมี time-series partitioning
