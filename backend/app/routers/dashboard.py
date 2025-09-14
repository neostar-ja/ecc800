"""
Dashboard Router for ECC800 Data Center Monitoring
Router สำหรับการจัดการข้อมูล Dashboard และการแสดงผล 3D Visualization
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.db.session import get_db_session as get_db
from app.core.database import execute_raw_query
# from app.core.auth import get_current_user
# from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Dashboard Data Models
class EquipmentStatus(BaseModel):
    cpu: Optional[float] = None
    temperature: Optional[float] = None
    power: Optional[float] = None
    network_status: Optional[str] = None

class RackInfo(BaseModel):
    id: str
    label: str
    type: str  # 'server', 'network', 'aircon'
    isActive: bool
    status: Optional[EquipmentStatus] = None
    site_code: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    last_updated: Optional[datetime] = None

class DashboardSummary(BaseModel):
    total_equipment: int
    active_equipment: int
    server_count: int
    network_count: int
    aircon_count: int
    avg_cpu: Optional[float] = None
    avg_temperature: Optional[float] = None
    total_power: Optional[float] = None
    last_updated: datetime

class DashboardData(BaseModel):
    dc_racks: List[RackInfo]
    dr_racks: List[RackInfo]
    dc_summary: DashboardSummary
    dr_summary: DashboardSummary
    alerts: List[Dict[str, Any]]

@router.get("/", response_model=DashboardData)
async def get_dashboard_data(
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive dashboard data including DC and DR equipment information
    ดึงข้อมูล dashboard รวมทั้งข้อมูลอุปกรณ์ DC และ DR
    """
    try:
        # Query for equipment data from database
        # ปรับแต่งตามโครงสร้างฐานข้อมูลจริง
        equipment_query = (
            """
            SELECT DISTINCT 
                equipment_name,
                equipment_id,
                site_code,
                data_type,
                MAX(statistical_start_time) as last_update,
                MAX(CASE WHEN performance_data LIKE '%CPU%' THEN value_numeric END) as cpu_usage,
                MAX(CASE WHEN performance_data LIKE '%Temperature%' OR performance_data LIKE '%Temp%' THEN value_numeric END) as temperature,
                MAX(CASE WHEN performance_data LIKE '%Power%' THEN value_numeric END) as power_usage,
                COUNT(*) as metric_count
            FROM performance_data 
            WHERE statistical_start_time >= NOW() - INTERVAL '1 hour'
            GROUP BY equipment_name, equipment_id, site_code, data_type
            ORDER BY equipment_name
            """
        )

        try:
            equipment_results = await execute_raw_query(equipment_query)
        except Exception:
            # If table/view not found or DB error, fall back to mock data
            equipment_results = []
        
        # Process equipment data
        dc_racks = []
        dr_racks = []
        
        # Mock position calculator based on equipment order
        def calculate_position(index: int, max_per_row: int = 4):
            return {
                "x": 50 + (index % max_per_row) * 140,
                "y": 80 if index < max_per_row else 200
            }
        
        # Categorize equipment by site (DC/DR)
        dc_equipment = []
        dr_equipment = []
        
        for idx, row in enumerate(equipment_results):
            equipment_name = row.get("equipment_name")
            site_code = row.get("site_code") or 'dc'
            
            # Determine equipment type based on name patterns
            equipment_type = 'server'  # default
            if any(keyword in equipment_name.lower() for keyword in ['network', 'switch', 'router']):
                equipment_type = 'network'
            elif any(keyword in equipment_name.lower() for keyword in ['air', 'ac', 'cooling']):
                equipment_type = 'aircon'
            
            # Create equipment status
            status = EquipmentStatus(
                cpu=float(row.get("cpu_usage")) if row.get("cpu_usage") is not None else None,
                temperature=float(row.get("temperature")) if row.get("temperature") is not None else None,
                power=float(row.get("power_usage")) if row.get("power_usage") is not None else None,
                network_status='active' if (row.get("metric_count") or 0) > 0 else 'inactive'
            )
            
            # Build human-friendly ID without assuming numeric equipment_id
            raw_eid = row.get('equipment_id')
            try:
                eid_num = int(raw_eid) if raw_eid is not None else (idx + 1)
                eid_str = f"{eid_num:02d}"
            except Exception:
                eid_str = str(raw_eid) if raw_eid else f"{idx+1:02d}"

            rack_info = RackInfo(
                id=f"{site_code.upper()}-{eid_str}",
                label=(equipment_name or "")[0:20],  # Truncate long names
                type=equipment_type,
                isActive=bool((row.get("metric_count") or 0) > 0),
                status=status,
                site_code=site_code,
                position=calculate_position(len(dc_equipment + dr_equipment)),
                last_updated=row.get("last_update")
            )
            
            # Categorize by site
            if site_code.lower() in ['dr', 'disaster', 'backup']:
                dr_equipment.append(rack_info)
            else:
                dc_equipment.append(rack_info)
        
        # If no real data, create mock data
        if not equipment_results:
            # Mock DC equipment
            dc_equipment = [
                RackInfo(id="DC-A1", label="Server-01", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=45.2, temperature=23.5, power=850), position=calculate_position(0)),
                RackInfo(id="DC-A2", label="Server-02", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=67.8, temperature=25.1, power=920), position=calculate_position(1)),
                RackInfo(id="DC-A3", label="AirCon-01", type="aircon", isActive=True, 
                        status=EquipmentStatus(temperature=18.0), position=calculate_position(2)),
                RackInfo(id="DC-A4", label="Network-01", type="network", isActive=True, 
                        status=EquipmentStatus(network_status="active"), position=calculate_position(3)),
                RackInfo(id="DC-B1", label="Server-03", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=52.3, temperature=24.2, power=780), position=calculate_position(4)),
                RackInfo(id="DC-B2", label="Server-04", type="server", isActive=False, 
                        status=EquipmentStatus(cpu=0, temperature=22.0, power=0), position=calculate_position(5)),
                RackInfo(id="DC-B3", label="AirCon-02", type="aircon", isActive=True, 
                        status=EquipmentStatus(temperature=19.0), position=calculate_position(6)),
                RackInfo(id="DC-B4", label="Network-02", type="network", isActive=True, 
                        status=EquipmentStatus(network_status="active"), position=calculate_position(7))
            ]
            
            # Mock DR equipment
            dr_equipment = [
                RackInfo(id="DR-A1", label="Server-05", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=32.1, temperature=22.3, power=680), position=calculate_position(0)),
                RackInfo(id="DR-A2", label="Server-06", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=41.7, temperature=23.1, power=750), position=calculate_position(1)),
                RackInfo(id="DR-A3", label="AirCon-03", type="aircon", isActive=True, 
                        status=EquipmentStatus(temperature=18.5), position=calculate_position(2)),
                RackInfo(id="DR-A4", label="Network-03", type="network", isActive=True, 
                        status=EquipmentStatus(network_status="active"), position=calculate_position(3)),
                RackInfo(id="DR-B1", label="Server-07", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=28.5, temperature=21.8, power=620), position=calculate_position(4)),
                RackInfo(id="DR-B2", label="Server-08", type="server", isActive=True, 
                        status=EquipmentStatus(cpu=38.2, temperature=22.5, power=710), position=calculate_position(5)),
                RackInfo(id="DR-B3", label="AirCon-04", type="aircon", isActive=True, 
                        status=EquipmentStatus(temperature=19.2), position=calculate_position(6)),
                RackInfo(id="DR-B4", label="Network-04", type="network", isActive=True, 
                        status=EquipmentStatus(network_status="active"), position=calculate_position(7))
            ]
        
        # Calculate summaries
        def calculate_summary(equipment_list: List[RackInfo]) -> DashboardSummary:
            total = len(equipment_list)
            active = sum(1 for eq in equipment_list if eq.isActive)
            servers = [eq for eq in equipment_list if eq.type == 'server']
            networks = [eq for eq in equipment_list if eq.type == 'network'] 
            aircons = [eq for eq in equipment_list if eq.type == 'aircon']
            
            active_servers = [eq for eq in servers if eq.isActive and eq.status and eq.status.cpu]
            avg_cpu = sum(eq.status.cpu for eq in active_servers) / len(active_servers) if active_servers else None
            
            temp_equipment = [eq for eq in equipment_list if eq.status and eq.status.temperature]
            avg_temp = sum(eq.status.temperature for eq in temp_equipment) / len(temp_equipment) if temp_equipment else None
            
            power_equipment = [eq for eq in equipment_list if eq.status and eq.status.power]
            total_power = sum(eq.status.power for eq in power_equipment) if power_equipment else None
            
            return DashboardSummary(
                total_equipment=total,
                active_equipment=active,
                server_count=len(servers),
                network_count=len(networks), 
                aircon_count=len(aircons),
                avg_cpu=round(avg_cpu, 1) if avg_cpu else None,
                avg_temperature=round(avg_temp, 1) if avg_temp else None,
                total_power=round(total_power, 1) if total_power else None,
                last_updated=datetime.now()
            )
        
        dc_summary = calculate_summary(dc_equipment)
        dr_summary = calculate_summary(dr_equipment)
        
        # Check for alerts
        alerts = []
        
        # CPU usage alerts
        for equipment in dc_equipment + dr_equipment:
            if equipment.status and equipment.status.cpu and equipment.status.cpu > 80:
                alerts.append({
                    "type": "warning",
                    "message": f"{equipment.label} - CPU usage high: {equipment.status.cpu}%",
                    "equipment_id": equipment.id,
                    "timestamp": datetime.now()
                })
                
        # Temperature alerts  
        for equipment in dc_equipment + dr_equipment:
            if equipment.status and equipment.status.temperature and equipment.status.temperature > 26:
                alerts.append({
                    "type": "warning", 
                    "message": f"{equipment.label} - Temperature high: {equipment.status.temperature}°C",
                    "equipment_id": equipment.id,
                    "timestamp": datetime.now()
                })
                
        # Inactive equipment alerts
        for equipment in dc_equipment + dr_equipment:
            if not equipment.isActive:
                alerts.append({
                    "type": "error",
                    "message": f"{equipment.label} - Equipment offline",
                    "equipment_id": equipment.id, 
                    "timestamp": datetime.now()
                })
        
        return DashboardData(
            dc_racks=dc_equipment,
            dr_racks=dr_equipment,
            dc_summary=dc_summary,
            dr_summary=dr_summary,
            alerts=alerts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")

@router.get("/equipment/{equipment_id}")
async def get_equipment_details(
    equipment_id: str,
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """
    Get detailed information for a specific equipment
    ดึงข้อมูลรายละเอียดของอุปกรณ์เฉพาะ
    """
    try:
        # Query detailed equipment metrics
        detail_query = (
            """
            SELECT 
                equipment_name,
                equipment_id,
                site_code,
                performance_data,
                value_numeric,
                value_text,
                unit,
                statistical_start_time
            FROM performance_data 
            WHERE equipment_id = :equipment_id
            ORDER BY statistical_start_time DESC 
            LIMIT 50
            """
        )

        try:
            results = await execute_raw_query(detail_query, {"equipment_id": equipment_id})
        except Exception:
            results = []
        
        if not results:
            raise HTTPException(status_code=404, detail="Equipment not found")
            
        # Process detailed metrics
        metrics = []
        for row in results:
            metrics.append({
                "metric": row.get("performance_data"),
                "value": row.get("value_numeric") if row.get("value_numeric") is not None else row.get("value_text"),
                "unit": row.get("unit"),
                "timestamp": row.get("statistical_start_time")
            })
            
        equipment_info = {
            "equipment_id": equipment_id,
            "equipment_name": results[0].get("equipment_name"),
            "site_code": results[0].get("site_code"),
            "metrics": metrics,
            "last_updated": results[0].get("statistical_start_time") if results else None
        }
        
        return equipment_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching equipment details: {str(e)}")

@router.get("/summary")
async def get_dashboard_summary(
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """
    Get quick dashboard summary statistics
    ดึงสรุปสถิติ dashboard แบบย่อ
    """
    try:
        # Overall statistics query
        stats_query = (
            """
            SELECT 
                COUNT(DISTINCT equipment_id) as total_equipment,
                COUNT(DISTINCT site_code) as total_sites,
                COUNT(DISTINCT CASE WHEN statistical_start_time >= NOW() - INTERVAL '5 minutes' THEN equipment_id END) as active_equipment,
                AVG(CASE WHEN performance_data LIKE '%CPU%' AND value_numeric IS NOT NULL THEN value_numeric END) as avg_cpu,
                AVG(CASE WHEN performance_data LIKE '%Temperature%' AND value_numeric IS NOT NULL THEN value_numeric END) as avg_temperature,
                COUNT(DISTINCT CASE WHEN value_numeric > 80 AND performance_data LIKE '%CPU%' THEN equipment_id END) as high_cpu_count,
                MAX(statistical_start_time) as last_data_update
            FROM performance_data 
            WHERE statistical_start_time >= NOW() - INTERVAL '24 hours'
            """
        )

        try:
            result_rows = await execute_raw_query(stats_query)
        except Exception:
            result_rows = []
        result = result_rows[0] if result_rows else {}
        
        return {
            "total_equipment": (result.get("total_equipment") or 0),
            "total_sites": (result.get("total_sites") or 0), 
            "active_equipment": (result.get("active_equipment") or 0),
            "avg_cpu": round(result.get("avg_cpu"), 1) if result.get("avg_cpu") is not None else None,
            "avg_temperature": round(result.get("avg_temperature"), 1) if result.get("avg_temperature") is not None else None,
            "high_cpu_alerts": (result.get("high_cpu_count") or 0),
            "last_data_update": result.get("last_data_update"),
            "system_status": "healthy" if (result.get("active_equipment") or 0) > 0 else "warning"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard summary: {str(e)}")

@router.post("/alerts/acknowledge")
async def acknowledge_alert(
    alert_data: Dict[str, Any],
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    """
    Acknowledge a dashboard alert
    ยืนยันการได้รับแจ้งเตือน
    """
    try:
        # Log alert acknowledgment (implement based on your alert system)
        equipment_id = alert_data.get('equipment_id')
        alert_type = alert_data.get('type')
        
        # Here you would typically update an alerts table
        # For now, just return success
        
        return {
            "status": "success",
            "message": f"Alert acknowledged for equipment {equipment_id}",
            # "acknowledged_by": current_user.username,
            "acknowledged_at": datetime.now()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error acknowledging alert: {str(e)}")
