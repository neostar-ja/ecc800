"""
Schema สำหรับข้อมูลอุปกรณ์
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class EquipmentBase(BaseModel):
    """Equipment base schema"""
    equipment_id: str
    site_code: str
    equipment_name: str
    equipment_type: Optional[str] = None
    description: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    """Equipment response schema"""
    original_name: str

    class Config:
        from_attributes = True


class PerformanceDataResponse(BaseModel):
    """Performance data response"""
    time: datetime
    kpi_name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


class FaultDataResponse(BaseModel):
    """Fault data response"""
    time: datetime
    fault_type: str
    fault_code: Optional[str] = None
    fault_description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


class EquipmentDetailResponse(EquipmentResponse):
    """Equipment detail response with recent data"""
    recent_performance: List[PerformanceDataResponse] = []
    recent_faults: List[FaultDataResponse] = []


class EquipmentSummaryResponse(BaseModel):
    """Equipment summary statistics"""
    total_equipment: int
    total_sites: int
    equipment_types: int
    latest_update: Optional[datetime] = None


class EquipmentNameOverrideBase(BaseModel):
    """Equipment name override base"""
    site_code: str
    equipment_id: str
    original_name: str
    display_name: str


class EquipmentNameOverrideCreate(EquipmentNameOverrideBase):
    """Equipment name override creation"""
    pass


class EquipmentNameOverrideResponse(EquipmentNameOverrideBase):
    """Equipment name override response"""
    id: int
    updated_by: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
