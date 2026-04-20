"""
Dashboard Router - Enhanced Real-time Data for DC/DR Sites
Provides comprehensive metrics for dashboard visualization
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from app.core.database import execute_raw_query
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard-realtime", tags=["Dashboard"])

# Response Models
class SiteMetrics(BaseModel):
    """Metrics for a single site (DC or DR)"""
    site_code: str
    # PUE Metrics
    pue_current: Optional[float] = None
    pue_trend: List[Dict[str, Any]] = []
    
    # Equipment Summary
    total_equipment: int = 0
    online_equipment: int = 0
    offline_equipment: int = 0
    warning_equipment: int = 0
    
    # Power Metrics
    total_power_kw: Optional[float] = None
    power_trend: List[Dict[str, Any]] = []
    
    # Environmental Metrics
    avg_temperature: Optional[float] = None
    avg_humidity: Optional[float] = None
    temperature_trend: List[Dict[str, Any]] = []
    
    # Cooling System
    cooling_units: List[Dict[str, Any]] = []
    
    # Top Equipment by Power/Load
    top_equipment: List[Dict[str, Any]] = []
    
    # Recent Alerts
    recent_alerts: List[Dict[str, Any]] = []
    
    last_updated: Optional[datetime] = None

class DashboardResponse(BaseModel):
    """Complete dashboard data for both sites"""
    dc: SiteMetrics
    dr: SiteMetrics
    timestamp: Optional[datetime] = None

@router.get("/realtime", response_model=DashboardResponse)
async def get_dashboard_realtime(
    hours: int = Query(24, description="Hours of historical data for trends")
):
    """
    Get real-time dashboard data for DC and DR sites
    ดึงข้อมูล Dashboard แบบเรียลไทม์สำหรับ DC และ DR
    """
    
    # Calculate time range for trends
    now = datetime.now()
    from_time = now - timedelta(hours=hours)
    
    # Helper function to get site metrics
    async def get_site_metrics(site_code: str) -> SiteMetrics:
        
        # 1. Get equipment counts and status
        equipment_status_query = """
        WITH latest_data AS (
            SELECT DISTINCT ON (equipment_id)
                equipment_id,
                statistical_start_time,
                value_numeric
            FROM performance_data
            WHERE site_code = :site_code
                AND statistical_start_time >= NOW() - INTERVAL '30 minutes'
            ORDER BY equipment_id, statistical_start_time DESC
        )
        SELECT 
            COUNT(DISTINCT equipment_id) as total_equipment,
            COUNT(DISTINCT CASE WHEN value_numeric IS NOT NULL THEN equipment_id END) as online_equipment
        FROM performance_data
        WHERE site_code = :site_code
            AND statistical_start_time >= NOW() - INTERVAL '30 minutes'
        """
        
        eq_result = await execute_raw_query(equipment_status_query, {"site_code": site_code})
        eq_stats = eq_result[0] if (isinstance(eq_result, list) and eq_result) else {"total_equipment": 0, "online_equipment": 0}
        
        total_eq = eq_stats.get("total_equipment", 0)
        online_eq = eq_stats.get("online_equipment", 0)
        
        # Determine cooling equipment IDs for this site
        # DC: 3 units - 0x04, 0x1007, 0x100B
        # DR: 2 units - 0x04, 0x100C
        cooling_equipment_ids = []
        if site_code == 'DC':
            cooling_equipment_ids = ['0x04', '0x1007', '0x100B']
        else:  # DR
            cooling_equipment_ids = ['0x04', '0x100C']
        
        # 2. Get power consumption from COOLING UNITS ONLY
        # This ensures Total Power is calculated ONLY from cooling system
        power_query = """
        SELECT 
            SUM(value_numeric) as total_power,
            AVG(value_numeric) as avg_power
        FROM performance_data
        WHERE site_code = :site_code
            AND equipment_id = ANY(:equipment_ids)
            AND statistical_start_time >= NOW() - INTERVAL '5 minutes'
            AND (
                LOWER(performance_data) LIKE '%power%'
                OR LOWER(performance_data) LIKE '%kw%'
                OR LOWER(performance_data) LIKE '%watt%'
            )
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            AND value_numeric < 1000000  -- Filter out unreasonable values
        """
        
        power_result = await execute_raw_query(power_query, {
            "site_code": site_code,
            "equipment_ids": cooling_equipment_ids
        })
        power_stats = power_result[0] if (isinstance(power_result, list) and power_result) else {}
        # Convert from W to kW if needed (values above 1000 are likely in W)
        total_power_raw = power_stats.get("total_power")
        if total_power_raw:
            # If total power > 1000, assume it's in Watts and convert to kW
            total_power = float(total_power_raw) / 1000.0 if total_power_raw > 1000 else float(total_power_raw)
        else:
            total_power = None
        
        # 3. Get temperature and humidity from COOLING UNITS ONLY
        # This ensures Avg Temperature is calculated ONLY from cooling system
        env_query = """
        SELECT 
            AVG(CASE WHEN LOWER(performance_data) LIKE '%temp%' THEN value_numeric END) as avg_temp,
            AVG(CASE WHEN LOWER(performance_data) LIKE '%humid%' THEN value_numeric END) as avg_humidity
        FROM performance_data
        WHERE site_code = :site_code
            AND equipment_id = ANY(:equipment_ids)
            AND statistical_start_time >= NOW() - INTERVAL '15 minutes'
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            AND value_numeric < 100  -- Reasonable range for temp/humidity
        """
        
        env_result = await execute_raw_query(env_query, {
            "site_code": site_code,
            "equipment_ids": cooling_equipment_ids
        })
        env_stats = env_result[0] if (isinstance(env_result, list) and env_result) else {}
        
        # 4. Get real PUE data from equipment_id 0x01 with PUE (hour) metric
        pue_query = """
        SELECT 
            value_numeric as pue_value
        FROM performance_data
        WHERE site_code = :site_code
            AND equipment_id = '0x01'
            AND performance_data = 'PUE (hour)'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND value_numeric IS NOT NULL
            AND value_numeric BETWEEN 1.0 AND 3.0
        ORDER BY statistical_start_time DESC
        LIMIT 1
        """
        
        pue_result = await execute_raw_query(pue_query, {"site_code": site_code})
        pue_current = None
        if pue_result and len(pue_result) > 0:
            pue_current = float(pue_result[0].get("pue_value"))
        
        # NO FALLBACK - Use only real database values
        
        # 5. Get real PUE trend data from equipment_id 0x01, PUE (hour) metric
        pue_trend_query = """
        SELECT 
            time_bucket('1 hour', statistical_start_time) as hour,
            AVG(CASE WHEN equipment_id = '0x01' AND performance_data = 'PUE (hour)'
                          AND value_numeric BETWEEN 1.0 AND 3.0
                THEN value_numeric END) as avg_pue,
            AVG(CASE WHEN (LOWER(performance_data) LIKE '%power%' OR LOWER(performance_data) LIKE '%kw%')
                          AND value_numeric > 0 AND value_numeric < 10000
                THEN value_numeric END) as avg_power,
            AVG(CASE WHEN LOWER(performance_data) LIKE '%temp%' 
                          AND value_numeric > 0 AND value_numeric < 100
                THEN value_numeric END) as avg_temp
        FROM performance_data
        WHERE site_code = :site_code
            AND statistical_start_time >= :from_time
            AND value_numeric IS NOT NULL
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24
        """
        
        trend_query = pue_trend_query
        
        trend_result = await execute_raw_query(trend_query, {
            "site_code": site_code,
            "from_time": from_time
        })
        
        # Format trend data
        power_trend = []
        temp_trend = []
        pue_trend = []
        
        for row in reversed(trend_result):  # Reverse to chronological order
            hour = row.get("hour")
            avg_pue = row.get("avg_pue")
            avg_power = row.get("avg_power")
            avg_temp = row.get("avg_temp")
            
            if hour:
                hour_str = hour.strftime("%Y-%m-%d %H:00") if isinstance(hour, datetime) else str(hour)
                
                # Use ONLY real PUE data from database
                if avg_pue:
                    pue_trend.append({"time": hour_str, "value": round(float(avg_pue), 2)})
                
                if avg_power:
                    power_trend.append({"time": hour_str, "value": float(avg_power)})
                
                if avg_temp:
                    temp_trend.append({"time": hour_str, "value": float(avg_temp)})
        
        # 6. Get top equipment by power consumption
        top_equipment_query = """
        SELECT 
            pd.equipment_id,
            pd.equipment_name,
            AVG(pd.value_numeric) as avg_power,
            MAX(pd.value_numeric) as max_power
        FROM performance_data pd
        WHERE pd.site_code = :site_code
            AND pd.statistical_start_time >= NOW() - INTERVAL '15 minutes'
            AND (LOWER(pd.performance_data) LIKE '%power%' OR LOWER(pd.performance_data) LIKE '%kw%')
            AND pd.value_numeric IS NOT NULL
            AND pd.value_numeric > 0
        GROUP BY pd.equipment_id, pd.equipment_name
        ORDER BY avg_power DESC
        LIMIT 5
        """
        
        top_eq_result = await execute_raw_query(top_equipment_query, {"site_code": site_code})
        top_equipment = [
            {
                "equipment_id": row.get("equipment_id"),
                "name": row.get("equipment_name"),
                "power": float(row.get("avg_power", 0)),
                "max_power": float(row.get("max_power", 0))
            }
            for row in top_eq_result
        ]
        
        # 7. Get recent alerts/faults
        alerts_query = """
        SELECT 
            fault_code,
            equipment_id,
            performance_data as metric_name,
            alarm_level,
            statistical_start_time as timestamp
        FROM fault_performance_data
        WHERE site_code = :site_code
            AND statistical_start_time >= NOW() - INTERVAL '24 hours'
            AND alarm_level IN ('Critical', 'Warning')
        ORDER BY statistical_start_time DESC
        LIMIT 10
        """
        
        try:
            alerts_result = await execute_raw_query(alerts_query, {"site_code": site_code})
            recent_alerts = [
                {
                    "fault_code": row.get("fault_code"),
                    "equipment_id": row.get("equipment_id"),
                    "metric": row.get("metric_name"),
                    "severity": row.get("alarm_level"),
                    "timestamp": row.get("timestamp").isoformat() if row.get("timestamp") else None
                }
                for row in alerts_result
            ]
        except Exception:
            recent_alerts = []
        
        # 8. Get real cooling units data from NetCol5000 equipment
        # DC: 3 units - Cooling-NetCol5000-A05-01, Cooling-NetCol5000-A05-02, Cooling-NetCol5000-A05-03
        # DR: 2 units - Cooling-NetCol5000-A0501, Cooling-NetCol5000-A0502
        # Note: cooling_equipment_ids already defined above for power/temp queries
        
        try:
            cooling_query = """
            WITH latest_cooling AS (
                SELECT DISTINCT ON (equipment_id, performance_data)
                    equipment_id,
                    performance_data,
                    value_numeric,
                    statistical_start_time
                FROM performance_data
                WHERE site_code = :site_code
                    AND equipment_id = ANY(:equipment_ids)
                    AND statistical_start_time >= NOW() - INTERVAL '1 day'
                    AND value_numeric IS NOT NULL
                    AND (
                        LOWER(performance_data) LIKE '%temp%'
                        OR LOWER(performance_data) LIKE '%humid%'
                        OR LOWER(performance_data) LIKE '%power%'
                    )
                ORDER BY equipment_id, performance_data, statistical_start_time DESC
            )
            SELECT 
                equipment_id,
                MAX(CASE WHEN LOWER(performance_data) LIKE '%temp%' THEN value_numeric END) as temperature,
                MAX(CASE WHEN LOWER(performance_data) LIKE '%humid%' THEN value_numeric END) as humidity,
                MAX(CASE WHEN LOWER(performance_data) LIKE '%power%' THEN value_numeric END) as power_kw,
                MAX(statistical_start_time) as last_update
            FROM latest_cooling
            GROUP BY equipment_id
            ORDER BY equipment_id
            """
            
            cooling_result = await execute_raw_query(cooling_query, {
                "site_code": site_code,
                "equipment_ids": cooling_equipment_ids
            })
        except Exception as e:
            print(f"[ERROR] Cooling query error for {site_code}: {e}")
            cooling_result = []
        
        cooling_units = []
        
        # Map equipment IDs to proper NetCol5000 unit names
        # Based on user requirements:
        # DC: Cooling-NetCol5000-A05-01, A05-02, A05-03
        # DR: Cooling-NetCol5000-A0501 (two units with same naming pattern)
        unit_names = {
            # DC Equipment
            '0x04': 'Cooling-NetCol5000-A05-01',
            '0x1007': 'Cooling-NetCol5000-A05-02',
            '0x100B': 'Cooling-NetCol5000-A05-03',
            # DR Equipment
            # Note: User specified 2 units but performance_data shows 0x04 and 0x100C
            # Using A0501 naming pattern for both
        }
        
        # Add DR names dynamically based on site
        if site_code == 'DR':
            unit_names['0x04'] = 'Cooling-NetCol5000-A0501'
            unit_names['0x100C'] = 'Cooling-NetCol5000-A0502'
        
        for idx, row in enumerate(cooling_result):
            # Handle both dict and tuple/string results
            if isinstance(row, dict):
                equipment_id = row.get("equipment_id", "")
                temperature = row.get("temperature")
                humidity = row.get("humidity")
                power_kw = row.get("power_kw")
                
                # Determine status based on available data
                # Priority: 1) Check On/Off status metric, 2) Check if data is recent
                status = "offline"
                if temperature is not None:
                    # Equipment has recent temperature data - likely online
                    status = "ON"
                    
                    # Try to get actual On/Off status from database
                    try:
                        status_query = """
                        SELECT value_numeric
                        FROM performance_data
                        WHERE site_code = :site_code
                          AND equipment_id = :eq_id
                          AND performance_data = 'On/Off status of system'
                          AND statistical_start_time >= NOW() - INTERVAL '1 day'
                        ORDER BY statistical_start_time DESC
                        LIMIT 1
                        """
                        status_result = await execute_raw_query(status_query, {
                            'site_code': site_code,
                            'eq_id': equipment_id
                        })
                        
                        if status_result and status_result[0].get('value_numeric') is not None:
                            # ON = 1, OFF = 0 in database
                            is_on = float(status_result[0].get('value_numeric')) == 1.0
                            status = "ON" if is_on else "OFF"
                    except Exception as e:
                        # If status query fails, keep default "ON" since we have data
                        pass
            else:
                # Skip non-dict results
                continue
            
            unit_name = unit_names.get(equipment_id, f"Cooling-NetCol5000-Unit{idx + 1}")
            
            # Convert power from W to kW first
            power_kw_converted = round(float(power_kw / 1000), 2) if power_kw else None
            
            # Calculate REAL efficiency based on actual performance metrics
            # Efficiency = (Cooling Output / Power Input) * 100
            # For HVAC: Good efficiency means low power consumption for good cooling
            # We'll calculate based on temperature performance and power usage
            efficiency = 0
            try:
                # Get ideal temperature range (20-24°C is optimal for data centers)
                if temperature is not None and power_kw_converted is not None and power_kw_converted > 0:
                    # Temperature performance: closer to 22°C = better (100% at 22°C)
                    temp_diff = abs(float(temperature) - 22.0)
                    temp_performance = max(0, 100 - temp_diff * 5)
                    
                    # Power efficiency: lower power consumption = better
                    # Normalize power (0.01-0.10 kW range)
                    # 0.01 kW = 100%, 0.10 kW = 0%
                    power_efficiency = max(0, 100 - (power_kw_converted - 0.01) * 1111)
                    
                    # Combined efficiency (weighted: 60% temp, 40% power)
                    efficiency = (temp_performance * 0.6) + (power_efficiency * 0.4)
                    efficiency = min(100, max(0, efficiency))  # Clamp to 0-100
                else:
                    efficiency = 0
            except Exception as e:
                print(f"[ERROR] Efficiency calculation error: {e}")
                efficiency = 0
            
            cooling_units.append({
                # Remove unit_id from response (don't show 0x04, etc.)
                # "unit_id": equipment_id,
                "unit_name": unit_name,
                "status": status,
                "temperature": round(float(temperature), 1) if temperature else None,
                "humidity": round(float(humidity), 1) if humidity else None,
                "power_kw": power_kw_converted,
                "efficiency": round(efficiency, 1)
            })
        
        # NO MOCK DATA - Show only real data from database
        
        # 9. Get latest real timestamp from database for this site
        latest_time_query = """
        SELECT MAX(ts) as last_updated
        FROM (
            SELECT MAX(statistical_start_time) as ts
            FROM performance_data
            WHERE site_code = :site_code

            UNION ALL

            SELECT MAX(statistical_start_time) as ts
            FROM fault_performance_data
            WHERE site_code = :site_code
        ) t
        """

        latest_time_result = await execute_raw_query(latest_time_query, {"site_code": site_code})
        site_last_updated = None
        if isinstance(latest_time_result, list) and latest_time_result:
            site_last_updated = latest_time_result[0].get("last_updated")

        # Build response
        return SiteMetrics(
            site_code=site_code,
            pue_current=pue_current,
            pue_trend=pue_trend,
            total_equipment=total_eq,
            online_equipment=online_eq,
            offline_equipment=total_eq - online_eq,
            warning_equipment=len([a for a in recent_alerts if a.get("severity") == "Warning"]),
            total_power_kw=total_power,
            power_trend=power_trend,
            avg_temperature=float(env_stats.get("avg_temp")) if env_stats.get("avg_temp") else None,
            avg_humidity=float(env_stats.get("avg_humidity")) if env_stats.get("avg_humidity") else None,
            temperature_trend=temp_trend,
            cooling_units=cooling_units,
            top_equipment=top_equipment,
            recent_alerts=recent_alerts,
            last_updated=site_last_updated
        )
    
    # Get metrics for both sites
    dc_metrics = await get_site_metrics("DC")
    dr_metrics = await get_site_metrics("DR")
    
    dashboard_last_updated = max(
        [ts for ts in [dc_metrics.last_updated, dr_metrics.last_updated] if ts is not None],
        default=None
    )

    return DashboardResponse(
        dc=dc_metrics,
        dr=dr_metrics,
        timestamp=dashboard_last_updated
    )

@router.get("/summary")
async def get_dashboard_summary():
    """
    Get quick summary statistics
    ดึงสถิติสรุปแบบรวดเร็ว
    """
    
    query = """
    SELECT 
        site_code,
        COUNT(DISTINCT equipment_id) as equipment_count,
        COUNT(DISTINCT CASE WHEN statistical_start_time >= NOW() - INTERVAL '30 minutes' THEN equipment_id END) as active_count,
        COUNT(*) as total_metrics
    FROM performance_data
    WHERE statistical_start_time >= NOW() - INTERVAL '1 hour'
    GROUP BY site_code
    """
    
    result = await execute_raw_query(query)
    
    summary = {}
    for row in result:
        summary[row.get("site_code")] = {
            "equipment_count": row.get("equipment_count"),
            "active_count": row.get("active_count"),
            "total_metrics": row.get("total_metrics")
        }
    
    return {
        "dc": summary.get("DC", {}),
        "dr": summary.get("DR", {}),
        "timestamp": datetime.now()
    }
