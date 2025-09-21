"""
Pydantic schemas สำหรับ Dashboard Objects API
"""

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from decimal import Decimal
import json


class DashboardObjectBase(BaseModel):
    """Base schema สำหรับ Dashboard Object"""
    name: str = Field(..., min_length=1, max_length=255)
    object_type: str = Field(..., description="server, aircon, network, ups, battery, cable, rack")
    
    # Position and size
    x: float = Field(0, ge=0, description="X coordinate")
    y: float = Field(0, ge=0, description="Y coordinate") 
    width: float = Field(100, gt=0, description="Width")
    height: float = Field(50, gt=0, description="Height")
    rotation: float = Field(0, ge=0, le=360, description="Rotation in degrees")
    
    # Visual properties
    color: str = Field("#4A90E2", regex=r"^#[0-9A-Fa-f]{6}$", description="Hex color")
    background_color: Optional[str] = Field("#FFFFFF", regex=r"^#[0-9A-Fa-f]{6}$")
    border_color: Optional[str] = Field("#000000", regex=r"^#[0-9A-Fa-f]{6}$")
    border_width: float = Field(1, ge=0, le=20, description="Border width")
    opacity: float = Field(1.0, ge=0.0, le=1.0, description="Opacity 0.0 - 1.0")
    
    # Object properties
    properties: Optional[Dict[str, Any]] = Field(None, description="Custom properties as JSON")
    description: Optional[str] = Field(None, max_length=1000)
    equipment_id: Optional[str] = Field(None, max_length=50)
    
    # Display settings
    is_visible: bool = Field(True)
    is_interactive: bool = Field(True)
    layer_order: int = Field(0, description="Z-index")

    @validator('object_type')
    def validate_object_type(cls, v):
        allowed_types = ['server', 'aircon', 'network', 'ups', 'battery', 'cable', 'rack', 'switch', 'router', 'firewall', 'storage']
        if v not in allowed_types:
            raise ValueError(f'object_type must be one of {allowed_types}')
        return v

    class Config:
        orm_mode = True
        from_attributes = True


class DashboardObjectCreate(DashboardObjectBase):
    """สร้าง Dashboard Object ใหม่"""
    data_center_id: int = Field(..., description="Data Center ID")


class DashboardObjectUpdate(BaseModel):
    """อัปเดท Dashboard Object"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    object_type: Optional[str] = None
    
    # Position and size
    x: Optional[float] = Field(None, ge=0)
    y: Optional[float] = Field(None, ge=0) 
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    rotation: Optional[float] = Field(None, ge=0, le=360)
    
    # Visual properties
    color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    background_color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    border_color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    border_width: Optional[float] = Field(None, ge=0, le=20)
    opacity: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    properties: Optional[Dict[str, Any]] = None
    description: Optional[str] = Field(None, max_length=1000)
    equipment_id: Optional[str] = Field(None, max_length=50)
    
    # Display settings
    is_visible: Optional[bool] = None
    is_interactive: Optional[bool] = None
    layer_order: Optional[int] = None

    @validator('object_type')
    def validate_object_type(cls, v):
        if v is not None:
            allowed_types = ['server', 'aircon', 'network', 'ups', 'battery', 'cable', 'rack', 'switch', 'router', 'firewall', 'storage']
            if v not in allowed_types:
                raise ValueError(f'object_type must be one of {allowed_types}')
        return v


class DashboardObjectResponse(DashboardObjectBase):
    """Response schema สำหรับ Dashboard Object"""
    id: int
    data_center_id: int
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True


# Dashboard Template Schemas
class DashboardTemplateBase(BaseModel):
    """Base schema สำหรับ Dashboard Template"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    
    # Canvas settings
    canvas_width: int = Field(1920, ge=800, le=4096)
    canvas_height: int = Field(1080, ge=600, le=2160)
    canvas_background: str = Field("#F5F5F5", regex=r"^#[0-9A-Fa-f]{6}$")
    
    # Settings
    is_public: bool = Field(False)
    is_default: bool = Field(False)
    version: str = Field("1.0", max_length=20)


class DashboardTemplateCreate(DashboardTemplateBase):
    """สร้าง Dashboard Template ใหม่"""
    data_center_id: Optional[int] = None
    template_data: Dict[str, Any] = Field(..., description="Template data as JSON")


class DashboardTemplateUpdate(BaseModel):
    """อัปเดท Dashboard Template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    template_data: Optional[Dict[str, Any]] = None
    
    canvas_width: Optional[int] = Field(None, ge=800, le=4096)
    canvas_height: Optional[int] = Field(None, ge=600, le=2160)
    canvas_background: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    
    is_public: Optional[bool] = None
    is_default: Optional[bool] = None
    version: Optional[str] = Field(None, max_length=20)


class DashboardTemplateResponse(DashboardTemplateBase):
    """Response schema สำหรับ Dashboard Template"""
    id: int
    data_center_id: Optional[int] = None
    template_data: Dict[str, Any]
    
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True


# Bulk Operations
class DashboardObjectsBulkCreate(BaseModel):
    """สร้าง Dashboard Objects หลายรายการพร้อมกัน"""
    objects: List[DashboardObjectCreate]


class DashboardObjectsBulkUpdate(BaseModel):
    """อัปเดท Dashboard Objects หลายรายการพร้อมกัน"""
    updates: List[Dict[str, Any]]  # [{"id": 1, "x": 100, "y": 200}, ...]


class DashboardObjectsBulkResponse(BaseModel):
    """Response สำหรับ bulk operations"""
    success_count: int
    failed_count: int
    objects: List[DashboardObjectResponse]
    errors: List[str] = []


# Canvas Export/Import
class CanvasExportResponse(BaseModel):
    """Export canvas data"""
    data_center_id: int
    objects: List[DashboardObjectResponse]
    canvas_settings: Dict[str, Any]
    export_timestamp: datetime
    
    
class CanvasImportRequest(BaseModel):
    """Import canvas data"""
    data_center_id: int
    objects: List[DashboardObjectCreate]
    canvas_settings: Optional[Dict[str, Any]] = None
    clear_existing: bool = Field(False, description="Clear existing objects before import")