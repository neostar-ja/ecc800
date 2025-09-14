"""
API Routes สำหรับ Analytics และ Performance Monitoring
Analytics and Performance Monitoring API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.core.database import get_db, execute_raw_query
from app.services.auth import get_current_user
from app.schemas.sites import TimeSeriesResponse, TimeSeriesPoint, FaultResponse, FaultPoint, KPIResponse
from app.schemas.auth import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/performance/{site_code}")
async def get_performance_metrics(
    site_code: str,
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    interval: str = Query("1h", description="ช่วงเวลา (1h, 1d, 1w)"),
    metrics: Optional[str] = Query(None, description="metrics ที่ต้องการ (comma-separated)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูล Performance Metrics
    Get performance metrics for site/equipment
    """
    try:
        # กำหนดเวลา default ถ้าไม่ระบุ
        if not to_time:
            to_time = datetime.now()
        if not from_time:
            from_time = to_time - timedelta(hours=24)  # ล่าสุด 24 ชั่วโมง
        
        # แปลง timezone-aware datetime เป็น timezone-naive สำหรับ database
        if from_time.tzinfo is not None:
            from_time = from_time.replace(tzinfo=None)
        if to_time.tzinfo is not None:
            to_time = to_time.replace(tzinfo=None)
        
        # สร้าง WHERE conditions
        conditions = ["site_code = :site_code"]
        params = {
            "site_code": site_code,
            "from_time": from_time,
            "to_time": to_time
        }
        
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
            
        if metrics:
            metric_list = [m.strip() for m in metrics.split(',')]
            placeholders = ','.join([f"':metric_{i}'" for i in range(len(metric_list))])
            conditions.append(f"performance_data = ANY(ARRAY[{placeholders}])")
            for i, metric in enumerate(metric_list):
                params[f"metric_{i}"] = metric
        
        where_clause = " AND ".join(conditions)
        
        # Query ข้อมูลจาก hypertable
        query = f"""
        SELECT 
            site_code,
            equipment_id,
            performance_data as metric_name,
            statistical_start_time as timestamp,
            value_numeric as value,
            unit
        FROM public.performance_data
        WHERE {where_clause}
        AND statistical_start_time >= :from_time
        AND statistical_start_time <= :to_time
        ORDER BY statistical_start_time, equipment_id, performance_data
        LIMIT 10000;
        """
        
        results = await execute_raw_query(query, params)
        
        # จัดกลุ่มข้อมูลตาม equipment และ metric
        grouped_data = {}
        for row in results:
            key = f"{row['equipment_id']}_{row['metric_name']}"
            if key not in grouped_data:
                grouped_data[key] = {
                    "site_code": row["site_code"],
                    "equipment_id": row["equipment_id"],
                    "metric_name": row["metric_name"],
                    "data_points": []
                }
            
            grouped_data[key]["data_points"].append(
                TimeSeriesPoint(
                    timestamp=row["timestamp"],
                    value=float(row["value"]) if row["value"] is not None else None,
                    unit=row.get("unit")
                )
            )
        
        # แปลงเป็น TimeSeriesResponse
        response = []
        for data in grouped_data.values():
            response.append(
                TimeSeriesResponse(
                    site_code=data["site_code"],
                    equipment_id=data["equipment_id"],
                    metric_name=data["metric_name"],
                    interval=interval,
                    data_points=data["data_points"],
                    from_time=from_time,
                    to_time=to_time
                )
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล performance: {str(e)}"
        )


@router.get("/faults/{site_code}")
async def get_fault_analysis(
    site_code: str,
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    severity: Optional[str] = Query(None, description="ระดับความรุนแรง"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    วิเคราะห์ข้อมูล Fault/Error
    Get fault analysis for site/equipment
    """
    try:
        # กำหนดเวลา default
        if not to_time:
            to_time = datetime.now()
        if not from_time:
            from_time = to_time - timedelta(days=7)  # ล่าสุด 7 วัน
        
        # แปลง timezone-aware datetime เป็น timezone-naive สำหรับ database
        if from_time.tzinfo is not None:
            from_time = from_time.replace(tzinfo=None)
        if to_time.tzinfo is not None:
            to_time = to_time.replace(tzinfo=None)
        
        # สร้าง conditions และ parameters
        conditions = ["site_code = $1"]
        params = [site_code]
        
        if equipment_id:
            conditions.append(f"equipment_id = ${len(params) + 1}")
            params.append(equipment_id)
            
        if severity:
            conditions.append(f"severity = ${len(params) + 1}")
            params.append(severity)
        
        where_clause = " AND ".join(conditions)
        
        # ตรวจสอบว่ามี fault_performance_data หรือไม่
        check_fault_table_query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'fault_performance_data'
        );
        """
        
        has_fault_table_result = await execute_raw_query(check_fault_table_query)
        has_fault_table = has_fault_table_result[0]["exists"] if has_fault_table_result else False
        
        if has_fault_table:
            # Query จาก fault table
            query = f"""
            SELECT 
                site_code,
                equipment_id,
                statistical_start_time as timestamp,
                COALESCE(value_numeric, 0)::integer as fault_count,
                COALESCE(value_text, 'Unknown') as severity
            FROM public.fault_performance_data
            WHERE {where_clause}
            AND statistical_start_time >= ${len(params) + 1}
            AND statistical_start_time <= ${len(params) + 2}
            ORDER BY statistical_start_time, equipment_id;
            """
        else:
            # Fallback: มองหา fault จาก performance_data
            query = f"""
            SELECT 
                site_code,
                equipment_id,
                statistical_start_time as timestamp,
                CASE 
                    WHEN performance_data ILIKE '%fault%' OR performance_data ILIKE '%error%' 
                    THEN COALESCE(value_numeric, 0)::integer
                    ELSE 0
                END as fault_count,
                'Unknown' as severity
            FROM public.performance_data
            WHERE {where_clause}
            AND statistical_start_time >= ${len(params) + 1}
            AND statistical_start_time <= ${len(params) + 2}
            AND (performance_data ILIKE '%fault%' OR performance_data ILIKE '%error%' OR performance_data ILIKE '%alarm%')
            ORDER BY statistical_start_time, equipment_id;
            """
        
        params.extend([from_time, to_time])
        results = await execute_raw_query(query, params)
        
        # จัดกลุ่มข้อมูลตาม equipment
        grouped_faults = {}
        total_faults = 0
        
        for row in results:
            eq_id = row["equipment_id"] or "all"
            if eq_id not in grouped_faults:
                grouped_faults[eq_id] = []
            
            fault_count = int(row.get("fault_count", 0))
            total_faults += fault_count
            
            grouped_faults[eq_id].append(
                FaultPoint(
                    timestamp=row["timestamp"],
                    fault_count=fault_count,
                    severity=row.get("severity", "Unknown"),
                    equipment_id=row["equipment_id"]
                )
            )
        
        # สร้าง response
        response = []
        for eq_id, faults in grouped_faults.items():
            response.append(
                FaultResponse(
                    site_code=site_code,
                    equipment_id=eq_id if eq_id != "all" else None,
                    interval="raw",
                    faults=faults,
                    total_faults=sum(f.fault_count for f in faults),
                    from_time=from_time,
                    to_time=to_time
                )
            )
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting fault analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล fault: {str(e)}"
        )


@router.get("/kpi/{site_code}")
async def get_kpi_report(
    site_code: str,
    from_time: Optional[datetime] = Query(None, description="เวลาเริ่มต้น"),
    to_time: Optional[datetime] = Query(None, description="เวลาสิ้นสุด"),
    report_type: str = Query("summary", description="ประเภทรายงาน (summary, detailed)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สร้างรายงาน KPI/ประสิทธิภาพ
    Generate KPI/Performance Report
    """
    try:
        # กำหนดเวลา default
        if not to_time:
            to_time = datetime.now()
        if not from_time:
            from_time = to_time - timedelta(days=30)  # ล่าสุด 30 วัน
        
        # แปลง timezone-aware datetime เป็น timezone-naive สำหรับ database
        if from_time.tzinfo is not None:
            from_time = from_time.replace(tzinfo=None)
        if to_time.tzinfo is not None:
            to_time = to_time.replace(tzinfo=None)
        
        # Query สำหรับสถิติหลัก
        stats_query = """
        SELECT 
            COUNT(DISTINCT equipment_id) as total_equipment,
            COUNT(*) as total_records,
            MIN(statistical_start_time) as earliest_data,
            MAX(statistical_start_time) as latest_data,
            COUNT(DISTINCT performance_data) as total_kpis
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= $2
        AND statistical_start_time <= $3;
        """
        
        stats_result = await execute_raw_query(stats_query, [site_code, from_time, to_time])
        stats = stats_result[0] if stats_result else {}
        
        # Query สำหรับ KPI หลัก
        kpi_query = """
        SELECT 
            performance_data as kpi_name,
            COUNT(*) as data_points,
            AVG(value_numeric::numeric) as avg_value,
            MIN(value_numeric::numeric) as min_value,
            MAX(value_numeric::numeric) as max_value,
            STDDEV(value_numeric::numeric) as std_dev
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= $2
        AND statistical_start_time <= $3
        AND value_numeric IS NOT NULL
        GROUP BY performance_data
        ORDER BY data_points DESC
        LIMIT 20;
        """
        
        kpi_results = await execute_raw_query(kpi_query, [site_code, from_time, to_time])
        
        # จัดรูปแบบ KPI metrics
        kpi_metrics = {}
        for kpi in kpi_results:
            kpi_metrics[kpi["kpi_name"]] = {
                "data_points": kpi["data_points"],
                "average": float(kpi["avg_value"]) if kpi["avg_value"] else None,
                "minimum": float(kpi["min_value"]) if kpi["min_value"] else None,
                "maximum": float(kpi["max_value"]) if kpi["max_value"] else None,
                "std_deviation": float(kpi["std_dev"]) if kpi["std_dev"] else None
            }
        
        # สร้างสรุป
        summary = f"""
        KPI Report สำหรับไซต์ {site_code}
        ช่วงเวลา: {from_time.strftime('%Y-%m-%d %H:%M')} ถึง {to_time.strftime('%Y-%m-%d %H:%M')}
        
        สถิติรวม:
        - อุปกรณ์ทั้งหมด: {stats.get('total_equipment', 0)} เครื่อง
        - บันทึกข้อมูลทั้งหมด: {stats.get('total_records', 0):,} รายการ
        - KPI ทั้งหมด: {stats.get('total_kpis', 0)} ตัวชี้วัด
        - ข้อมูลเก่าสุด: {stats.get('earliest_data', 'ไม่มี')}
        - ข้อมูลล่าสุด: {stats.get('latest_data', 'ไม่มี')}
        
        KPI ยอดนิยม: {', '.join(list(kpi_metrics.keys())[:5])}
        """
        
        return KPIResponse(
            site_code=site_code,
            from_time=from_time,
            to_time=to_time,
            metrics=kpi_metrics,
            summary=summary.strip()
        )
        
    except Exception as e:
        logger.error(f"Error generating KPI report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงาน KPI: {str(e)}"
        )


@router.get("/dashboard/{site_code}")
async def get_dashboard_data(
    site_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงข้อมูลสำหรับ Dashboard แบบรวดเร็ว
    Get quick dashboard data for site
    """
    try:
        # ข้อมูลสำคัญล่าสุด
        overview_query = """
        SELECT 
            COUNT(DISTINCT equipment_id) as equipment_count,
            MAX(statistical_start_time) as latest_update,
            COUNT(*) as total_metrics,
            COUNT(DISTINCT DATE(statistical_start_time)) as active_days
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '30 days';
        """
        
        overview = await execute_raw_query(overview_query, [site_code])
        overview_data = overview[0] if overview else {}
        
        # KPI สำคัญ 24 ชั่วโมงล่าสุด
        recent_kpi_query = """
        SELECT 
            performance_data as kpi_name,
            AVG(value_numeric::numeric) as avg_24h,
            COUNT(*) as measurements
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '24 hours'
        AND value_numeric IS NOT NULL
        GROUP BY performance_data
        ORDER BY measurements DESC
        LIMIT 10;
        """
        
        recent_kpis = await execute_raw_query(recent_kpi_query, [site_code])
        
        # ข้อมูล trending (เปรียบเทียบกับสัปดาห์ที่แล้ว)
        trend_query = """
        SELECT 
            'last_24h' as period,
            COUNT(*) as metric_count,
            COUNT(DISTINCT equipment_id) as active_equipment
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '24 hours'
        
        UNION ALL
        
        SELECT 
            'prev_24h' as period,
            COUNT(*) as metric_count,
            COUNT(DISTINCT equipment_id) as active_equipment
        FROM public.performance_data
        WHERE site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '48 hours'
        AND statistical_start_time < NOW() - INTERVAL '24 hours';
        """
        
        trend_data = await execute_raw_query(trend_query, [site_code])
        
        # จัดรูปแบบผลลัพธ์
        dashboard = {
            "site_code": site_code,
            "overview": {
                "equipment_count": overview_data.get("equipment_count", 0),
                "latest_update": overview_data.get("latest_update"),
                "total_metrics": overview_data.get("total_metrics", 0),
                "active_days": overview_data.get("active_days", 0)
            },
            "recent_kpis": [
                {
                    "name": kpi["kpi_name"],
                    "average_24h": float(kpi["avg_24h"]) if kpi["avg_24h"] else 0,
                    "measurements": kpi["measurements"]
                } for kpi in recent_kpis
            ],
            "trends": {item["period"]: {
                "metric_count": item["metric_count"],
                "active_equipment": item["active_equipment"]
            } for item in trend_data}
        }
        
        return dashboard
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล dashboard: {str(e)}"
        )
