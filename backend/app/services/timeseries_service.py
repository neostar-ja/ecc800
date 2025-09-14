"""
บริการจัดการข้อมูล TimescaleDB Time-series Data Service
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from decimal import Decimal

from ..schemas.schemas import (
    TimeSeriesDataPoint, 
    TimeSeriesResponse, 
    KPIReport,
    SiteMetrics
)


class TimeSeriesService:
    """บริการจัดการข้อมูล time-series"""
    
    @staticmethod
    async def get_performance_data(
        db: AsyncSession,
        site_code: str,
        start_time: datetime,
        end_time: datetime,
        equipment_id: Optional[str] = None,
        metric: Optional[str] = None,
        interval: Optional[str] = None
    ) -> TimeSeriesResponse:
        """ดึงข้อมูล performance จาก TimescaleDB"""
        
        # กำหนด interval อัตโนมัติ
        if interval is None or interval == "auto":
            time_diff = end_time - start_time
            if time_diff <= timedelta(hours=6):
                interval = "5m"
            elif time_diff <= timedelta(days=2):
                interval = "1h"
            else:
                interval = "1d"
        
        # สร้าง query สำหรับ performance data
        base_query = """
        SELECT 
            time,
            AVG(value_numeric) as avg_value,
            unit,
            'performance' as source,
            'ok' as quality
        FROM performance_data 
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        """
        
        params = {
            "site_code": site_code.lower(),
            "start_time": start_time,
            "end_time": end_time
        }
        
        # เพิ่มเงื่อนไข equipment_id
        if equipment_id:
            base_query += " AND equipment_id = :equipment_id"
            params["equipment_id"] = equipment_id
        
        # เพิ่มเงื่อนไข metric
        if metric:
            base_query += " AND performance_data = :metric"
            params["metric"] = metric
        
        # เพิ่ม time bucket aggregation
        if interval == "5m":
            query = f"""
            SELECT 
                time_bucket('5 minutes', statistical_start_time) as time,
                AVG(value_numeric) as avg_value,
                FIRST(unit, statistical_start_time) as unit,
                'performance' as source,
                'ok' as quality
            FROM performance_data 
            WHERE site_code = :site_code
            AND statistical_start_time >= :start_time
            AND statistical_start_time <= :end_time
            """
        elif interval == "1h":
            query = f"""
            SELECT 
                time_bucket('1 hour', statistical_start_time) as time,
                AVG(value_numeric) as avg_value,
                FIRST(unit, statistical_start_time) as unit,
                'performance' as source,
                'ok' as quality
            FROM performance_data 
            WHERE site_code = :site_code
            AND statistical_start_time >= :start_time
            AND statistical_start_time <= :end_time
            """
        else:  # 1d
            query = f"""
            SELECT 
                time_bucket('1 day', statistical_start_time) as time,
                AVG(value_numeric) as avg_value,
                FIRST(unit, statistical_start_time) as unit,
                'performance' as source,
                'ok' as quality
            FROM performance_data 
            WHERE site_code = :site_code
            AND statistical_start_time >= :start_time
            AND statistical_start_time <= :end_time
            """
        
        # เพิ่มเงื่อนไขเพิ่มเติม
        if equipment_id:
            query += " AND equipment_id = :equipment_id"
        
        if metric:
            query += " AND performance_data = :metric"
        
        query += " GROUP BY time ORDER BY time"
        
        # Execute query
        result = await db.execute(text(query), params)
        rows = result.fetchall()
        
        # แปลงข้อมูลเป็น TimeSeriesDataPoint
        data_points = []
        for row in rows:
            data_points.append(TimeSeriesDataPoint(
                time=row.time,
                value=float(row.avg_value) if row.avg_value is not None else None,
                unit=row.unit,
                source=row.source,
                quality=row.quality
            ))
        
        return TimeSeriesResponse(
            site_code=site_code,
            equipment_id=equipment_id,
            metric=metric,
            interval=interval,
            data_points=data_points,
            total_points=len(data_points)
        )
    
    @staticmethod
    async def get_fault_data(
        db: AsyncSession,
        site_code: str,
        start_time: datetime,
        end_time: datetime,
        equipment_id: Optional[str] = None,
        severity: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """ดึงข้อมูล fault จาก TimescaleDB"""
        
        query = """
        SELECT 
            id,
            site_code,
            equipment_name,
            equipment_id,
            performance_data,
            statistical_start_time,
            value_text,
            value_numeric,
            unit,
            source_file
        FROM fault_performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        """
        
        params = {
            "site_code": site_code.lower(),
            "start_time": start_time,
            "end_time": end_time
        }
        
        if equipment_id:
            query += " AND equipment_id = :equipment_id"
            params["equipment_id"] = equipment_id
        
        query += " ORDER BY statistical_start_time DESC LIMIT 1000"
        
        result = await db.execute(text(query), params)
        rows = result.fetchall()
        
        return [dict(row._mapping) for row in rows]
    
    @staticmethod
    async def get_kpi_report(
        db: AsyncSession,
        site_code: str,
        start_time: datetime,
        end_time: datetime
    ) -> KPIReport:
        """สร้างรายงาน KPI สำหรับไซต์"""
        
        # อุณหภูมิ
        temp_query = """
        SELECT 
            AVG(value_numeric) as avg_temp,
            MIN(value_numeric) as min_temp,
            MAX(value_numeric) as max_temp
        FROM performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        AND (performance_data ILIKE '%temperature%' 
             OR performance_data ILIKE '%temp%'
             OR unit = '°C')
        """
        
        # ความชื้น
        humidity_query = """
        SELECT 
            AVG(value_numeric) as avg_humidity,
            MIN(value_numeric) as min_humidity,
            MAX(value_numeric) as max_humidity
        FROM performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        AND (performance_data ILIKE '%humidity%'
             OR unit = '%RH'
             OR unit = '%')
        """
        
        # พลังงาน
        power_query = """
        SELECT 
            AVG(value_numeric) as avg_power,
            SUM(value_numeric) as total_power
        FROM performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        AND (performance_data ILIKE '%power%'
             OR performance_data ILIKE '%watt%'
             OR unit ILIKE '%w'
             OR unit ILIKE '%kw')
        """
        
        # จำนวนอุปกรณ์
        equipment_query = """
        SELECT COUNT(DISTINCT equipment_id) as equipment_count
        FROM performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        """
        
        # ข้อผิดพลาด
        fault_query = """
        SELECT COUNT(*) as fault_count
        FROM fault_performance_data
        WHERE site_code = :site_code
        AND statistical_start_time >= :start_time
        AND statistical_start_time <= :end_time
        """
        
        params = {
            "site_code": site_code.lower(),
            "start_time": start_time,
            "end_time": end_time
        }
        
        # Execute queries
        temp_result = await db.execute(text(temp_query), params)
        temp_row = temp_result.fetchone()
        
        humidity_result = await db.execute(text(humidity_query), params)
        humidity_row = humidity_result.fetchone()
        
        power_result = await db.execute(text(power_query), params)
        power_row = power_result.fetchone()
        
        equipment_result = await db.execute(text(equipment_query), params)
        equipment_row = equipment_result.fetchone()
        
        fault_result = await db.execute(text(fault_query), params)
        fault_row = fault_result.fetchone()
        
        return KPIReport(
            site_code=site_code,
            report_period={"start": start_time, "end": end_time},
            temperature_stats={
                "avg": float(temp_row.avg_temp) if temp_row.avg_temp else 0.0,
                "min": float(temp_row.min_temp) if temp_row.min_temp else 0.0,
                "max": float(temp_row.max_temp) if temp_row.max_temp else 0.0,
            },
            humidity_stats={
                "avg": float(humidity_row.avg_humidity) if humidity_row.avg_humidity else 0.0,
                "min": float(humidity_row.min_humidity) if humidity_row.min_humidity else 0.0,
                "max": float(humidity_row.max_humidity) if humidity_row.max_humidity else 0.0,
            },
            power_stats={
                "avg": float(power_row.avg_power) if power_row.avg_power else 0.0,
                "total": float(power_row.total_power) if power_row.total_power else 0.0,
            },
            equipment_count=equipment_row.equipment_count or 0,
            active_faults=fault_row.fault_count or 0
        )
