"""
Pydantic schemas สำหรับ API requests และ responses
"""

from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from decimal import Decimal
from ipaddress import IPv4Address, IPv6Address, IPv4Network, IPv6Network


# Base schemas
class BaseSchema(BaseModel):
    """Base schema สำหรับ common fields"""
    
    class Config:
        orm_mode = True
        use_enum_values = True
        from_attributes = True


# Authentication schemas
class LoginRequest(BaseModel):
    """การเข้าสู่ระบบ"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class LoginResponse(BaseSchema):
    """ผลการเข้าสู่ระบบ"""
    access_token: str
    token_type: str = "bearer"
    user: 'UserResponse'


# User management schemas
class UserCreate(BaseModel):
    """สร้างผู้ใช้ใหม่"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    role: str = Field("viewer", description="admin, analyst, viewer")
    site_access: Optional[str] = Field(None, description="JSON array of sites")
    is_active: bool = True


class UserUpdate(BaseModel):
    """อัปเดทข้อมูลผู้ใช้"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, description="admin, analyst, viewer")
    site_access: Optional[str] = Field(None, description="JSON array of sites")
    is_active: Optional[bool] = None


class UserResponse(BaseSchema):
    """ข้อมูลผู้ใช้"""
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    role: str
    site_access: Optional[Union[str, List[str]]]  # Allow both string and array
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


class ChangePasswordRequest(BaseModel):
    """เปลี่ยนรหัสผ่าน"""
    current_password: str
    new_password: str = Field(..., min_length=6)


# Data Center schemas
class DataCenterCreate(BaseModel):
    """สร้าง Data Center ใหม่"""
    name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    site_code: str = Field(..., min_length=1, max_length=10)
    ip_address: Optional[Union[str, IPv4Address, IPv6Address]] = Field(None)
    is_active: bool = True
    
    @validator('ip_address')
    def validate_ip_address(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            try:
                # Try to parse as IP address
                import ipaddress
                ipaddress.ip_address(v)
                return v
            except ValueError:
                raise ValueError('Invalid IP address format')
        return str(v)


class DataCenterUpdate(BaseModel):
    """อัปเดต Data Center"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    site_code: Optional[str] = Field(None, min_length=1, max_length=10)
    ip_address: Optional[Union[str, IPv4Address, IPv6Address]] = Field(None)
    is_active: Optional[bool] = None
    
    @validator('ip_address')
    def validate_ip_address(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            try:
                # Try to parse as IP address
                import ipaddress
                ipaddress.ip_address(v)
                return v
            except ValueError:
                raise ValueError('Invalid IP address format')
        return str(v)


class DataCenterResponse(BaseSchema):
    """ข้อมูล Data Center"""
    id: int
    name: str
    location: Optional[str]
    description: Optional[str]
    site_code: Optional[str]  # เปลี่ยนจาก str เป็น Optional[str] เพื่อรองรับ NULL values
    ip_address: Optional[str]  # รองรับ INET type ที่จะถูก convert เป็น string
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]


# Equipment schemas
class EquipmentResponse(BaseSchema):
    """ข้อมูลอุปกรณ์"""
    id: int
    equipment_name: str
    equipment_id: str
    description: Optional[str]
    site_code: Optional[str]
    display_name: Optional[str]  # จากการ join กับ aliases
    data_center: Optional[DataCenterResponse]


class EquipmentAliasCreate(BaseModel):
    """สร้างชื่อแทนของอุปกรณ์"""
    site_code: str = Field(..., max_length=10)
    equipment_id: str = Field(..., max_length=50)
    display_name: str = Field(..., max_length=255)


class EquipmentAliasResponse(BaseSchema):
    """ข้อมูลชื่อแทนของอุปกรณ์"""
    id: int
    site_code: str
    equipment_id: str
    original_name: str
    display_name: str
    updated_by: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


# Time series data schemas
class TimeSeriesDataPoint(BaseModel):
    """จุดข้อมูลในกราฟเวลา"""
    time: datetime
    value: Optional[Union[float, str]]
    unit: Optional[str]
    source: Optional[str] = None
    quality: Optional[str] = None


class TimeSeriesRequest(BaseModel):
    """คำขอข้อมูล time series"""
    site_code: str
    equipment_id: Optional[str] = None
    metric: Optional[str] = None
    start_time: datetime
    end_time: datetime
    interval: Optional[str] = None  # auto, 5m, 1h, 1d


class TimeSeriesResponse(BaseModel):
    """ผลตอบกลับข้อมูล time series"""
    site_code: str
    equipment_id: Optional[str]
    metric: Optional[str]
    interval: str
    data_points: List[TimeSeriesDataPoint]
    total_points: int


# Fault data schemas
class FaultDataResponse(BaseModel):
    """ข้อมูลความผิดพลาด"""
    id: int
    site_code: str
    equipment_name: str
    equipment_id: str
    performance_data: str
    statistical_start_time: datetime
    value_text: str
    value_numeric: Optional[Decimal]
    unit: Optional[str]
    source_file: Optional[str]


# KPI Report schemas
class KPIReport(BaseModel):
    """รายงาน KPI"""
    site_code: str
    report_period: Dict[str, datetime]  # start, end
    temperature_stats: Dict[str, float]  # avg, min, max
    humidity_stats: Dict[str, float]    # avg, min, max
    power_stats: Dict[str, float]       # avg, total
    equipment_count: int
    active_faults: int


# Database views schemas
class DatabaseViewResponse(BaseModel):
    """ข้อมูล database view"""
    schema_name: str
    view_name: str
    view_type: str  # view, materialized_view
    description: Optional[str]


# Health check schema
class HealthResponse(BaseModel):
    """สถานะระบบ"""
    status: str
    database: str
    timestamp: datetime
    version: Optional[str] = "1.0.0"


# Site summary schemas
class SiteMetrics(BaseModel):
    """สรุปข้อมูลของไซต์"""
    site_code: str
    equipment_count: int
    active_equipment: int
    latest_data_time: Optional[datetime]
    temperature_avg: Optional[float]
    humidity_avg: Optional[float]
    power_total: Optional[float]
    fault_count: int


# Equipment name override schemas
class EquipmentNameOverrideCreate(BaseModel):
    """สร้างการแทนที่ชื่ออุปกรณ์"""
    site_code: str = Field(..., min_length=1, max_length=10)
    equipment_id: str = Field(..., min_length=1, max_length=50)
    display_name: str = Field(..., min_length=1, max_length=255)


class EquipmentNameOverrideResponse(BaseSchema):
    """ข้อมูลการแทนที่ชื่ออุปกรณ์"""
    id: int
    site_code: str
    equipment_id: str
    original_name: str
    display_name: str
    updated_by: Optional[str]
    updated_at: Optional[datetime]


# Electricity rate and cost schemas
class ElectricityRateCreate(BaseModel):
    """สร้างอัตราค่าไฟฟ้า"""
    data_center_id: int
    site_code: str = Field(..., min_length=1, max_length=10)
    rate_value: Decimal = Field(..., gt=0, decimal_places=4)  # Baht/kWh
    description: Optional[str] = None
    effective_from: datetime
    effective_to: Optional[datetime] = None


class ElectricityRateUpdate(BaseModel):
    """อัปเดตอัตราค่าไฟฟ้า"""
    rate_value: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    description: Optional[str] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    is_active: Optional[bool] = None


class ElectricityRateResponse(BaseSchema):
    """ข้อมูลอัตราค่าไฟฟ้า"""
    id: int
    data_center_id: int
    site_code: str
    rate_value: Decimal
    rate_unit: str
    description: Optional[str]
    effective_from: datetime
    effective_to: Optional[datetime]
    is_active: bool
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime


class ElectricityCostCreate(BaseModel):
    """สร้างบันทึกค่าไฟฟ้า"""
    data_center_id: int
    site_code: str
    year: int
    month: int
    total_energy_kwh: Decimal = Field(..., ge=0)
    average_rate: Decimal = Field(..., gt=0)
    total_cost_baht: Decimal = Field(..., ge=0)
    days_in_period: Optional[int] = None
    calculation_method: str = "automatic"


class ElectricityCostUpdate(BaseModel):
    """อัปเดตบันทึกค่าไฟฟ้า"""
    total_energy_kwh: Optional[Decimal] = Field(None, ge=0)
    average_rate: Optional[Decimal] = Field(None, gt=0)
    total_cost_baht: Optional[Decimal] = Field(None, ge=0)
    days_in_period: Optional[int] = None
    is_finalized: Optional[bool] = None


class ElectricityCostResponse(BaseSchema):
    """ข้อมูลค่าไฟฟ้า"""
    id: int
    data_center_id: int
    site_code: str
    year: int
    month: int
    month_start: datetime
    month_end: datetime
    total_energy_kwh: Decimal
    average_rate: Decimal
    total_cost_baht: Decimal
    days_in_period: int
    avg_daily_energy_kwh: Decimal
    peak_hour_energy_kwh: Decimal
    is_finalized: bool
    calculation_method: str
    created_by: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime


class ElectricityCostSummary(BaseModel):
    """สรุปค่าไฟฟ้า"""
    site_code: str
    data_center_name: str
    current_month_cost: Decimal
    current_month_energy_kwh: Decimal
    previous_month_cost: Optional[Decimal]
    previous_month_energy_kwh: Optional[Decimal]
    cost_change_percent: Optional[float]  # % เปลี่ยนแปลง
    current_rate: Decimal
    average_daily_cost: Decimal


# Update forward references
LoginResponse.update_forward_refs()
