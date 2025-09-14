"""
Schemas สำหรับ Sites และ Equipment APIs
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SiteResponse(BaseModel):
    """ข้อมูลไซต์"""
    site_code: str = Field(..., description="รหัสไซต์")
    site_name: str = Field(..., description="ชื่อไซต์")
    site_type: str = Field(default="Data Center", description="ประเภทไซต์")
    location: str = Field(default="Unknown", description="ตำแหน่งที่ตั้ง")
    description: Optional[str] = Field(None, description="รายละเอียดไซต์")
    is_active: bool = Field(default=True, description="สถานะการใช้งาน")
    equipment_count: int = Field(default=0, description="จำนวนอุปกรณ์")
    latest_data: Optional[datetime] = None
    status: str = "active"  # active, inactive

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }


class EquipmentResponse(BaseModel):
    """Schema สำหรับ response ของ Equipment"""
    site_code: str = Field(..., description="รหัสไซต์")
    equipment_id: str = Field(..., description="รหัสอุปกรณ์")
    original_name: str = Field(..., description="ชื่อเดิมของอุปกรณ์")
    display_name: str = Field(..., description="ชื่อแสดงของอุปกรณ์")
    status: str = Field(default="Active", description="สถานะอุปกรณ์")
    last_updated: Optional[datetime] = Field(None, description="อัปเดตล่าสุด")

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }


class UpdateEquipmentNameRequest(BaseModel):
    """Request สำหรับการอัพเดตชื่ออุปกรณ์"""
    display_name: str = Field(..., min_length=1, max_length=255, description="ชื่อใหม่ที่ต้องการแสดง")


class UpdateEquipmentNameResponse(BaseModel):
    """Response สำหรับการอัพเดตชื่ออุปกรณ์"""
    success: bool = Field(True, description="สถานะการทำงาน")
    message: str = Field(..., description="ข้อความแจ้งผลลัพธ์")
    site_code: str = Field(..., description="รหัสไซต์")
    equipment_id: str = Field(..., description="รหัสอุปกรณ์")
    display_name: str = Field(..., description="ชื่อใหม่ที่อัพเดต")


class EquipmentListResponse(BaseModel):
    """รายการอุปกรณ์ (เก่า - ใช้ EquipmentResponse แทน)"""
    site_code: str
    equipment_id: str
    original_name: str
    display_name: str
    equipment_type: Optional[str] = None
    description: Optional[str] = None


class MetricResponse(BaseModel):
    """ข้อมูล Metric/KPI"""
    metric_name: str
    display_name: str
    data_points: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    unit: Optional[str] = None


class TimeSeriesPoint(BaseModel):
    """จุดข้อมูล Time-series"""
    timestamp: datetime
    value: Optional[float] = None
    unit: Optional[str] = None


class TimeSeriesResponse(BaseModel):
    """ผลลัพธ์ Time-series"""
    site_code: str
    equipment_id: str
    metric_name: str
    interval: str
    data_points: List[TimeSeriesPoint]
    from_time: datetime
    to_time: datetime


class FaultPoint(BaseModel):
    """จุดข้อมูล Fault"""
    timestamp: datetime
    fault_count: int
    severity: Optional[str] = None
    equipment_id: Optional[str] = None


class FaultResponse(BaseModel):
    """ผลลัพธ์ Fault Analysis"""
    site_code: str
    equipment_id: Optional[str] = None
    interval: str
    faults: List[FaultPoint]
    total_faults: int
    from_time: datetime
    to_time: datetime


class KPIResponse(BaseModel):
    """ผลลัพธ์ KPI Report"""
    site_code: str
    from_time: datetime
    to_time: datetime
    metrics: dict  # เก็บค่า KPI ต่างๆ
    summary: str


class HealthResponse(BaseModel):
    """ผลลัพธ์ Health Check"""
    status: str
    database: str
    version: str
    timestamp: datetime
    message: str


class MetricInfo(BaseModel):
    """ข้อมูล Metric"""
    metric_name: str
    display_name: str
    unit: str
    data_points: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    category: str
    description: str
    icon: str
    color: str


class MetricValue(BaseModel):
    """จุดข้อมูล Metric"""
    timestamp: datetime
    value: float
    unit: str


class MetricStats(BaseModel):
    """สถิติของ Metric"""
    min: float
    max: float
    avg: float
    median: float
    std_dev: float
    count: int
    latest: float
    trend: str


class DetailedMetricResponse(BaseModel):
    """ผลลัพธ์รายละเอียด Metric"""
    metric: MetricInfo
    statistics: MetricStats
    data_points: List[MetricValue]
    time_range: dict
    site_code: str
    equipment_id: str

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None
        }
