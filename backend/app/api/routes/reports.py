"""
API Routes สำหรับ Reports และ Analytics
Reports and Analytics API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.core.database import get_db, execute_raw_query
from app.auth.dependencies import get_current_user
from app.models.models import User

router = APIRouter()
logger = logging.getLogger(__name__)


# 
#     Power & Energy Report
#     
@router.get("/power", response_model=Dict[str, Any])
async def get_power_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    days: int = Query(7, description="ข้อมูลย้อนหลัง (วัน)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานพลังงาน (PUE, Consumption, UPS)
    """
    try:
        # 1. PUE Trend (Daily)
        pue_query = """
        SELECT 
            time_bucket('1 day', statistical_start_time) as bucket,
            AVG(value_numeric) as avg_pue
        FROM performance_data
        WHERE performance_data LIKE '%PUE%'
        AND statistical_start_time >= NOW() - INTERVAL :days || ' days'
        AND (:site_code IS NULL OR site_code = :site_code)
        GROUP BY bucket
        ORDER BY bucket;
        """
        
        # 2. Total Power Consumption Trend
        power_query = """
        SELECT 
            time_bucket('1 day', statistical_start_time) as bucket,
            SUM(value_numeric) as total_power
        FROM performance_data
        WHERE (performance_data LIKE '%Active Power%' OR performance_data LIKE '%Total Input Power%')
        AND statistical_start_time >= NOW() - INTERVAL :days || ' days'
        AND (:site_code IS NULL OR site_code = :site_code)
        GROUP BY bucket
        ORDER BY bucket;
        """

        # 3. Current UPS Status
        ups_query = """
        SELECT DISTINCT ON (equipment_id)
            equipment_id,
            site_code,
            statistical_start_time,
            MAX(CASE WHEN performance_data LIKE '%Battery capacity%' THEN value_numeric END) as battery_capacity,
            MAX(CASE WHEN performance_data LIKE '%Output load ratio%' THEN value_numeric END) as load_ratio,
            MAX(CASE WHEN performance_data LIKE '%Input active power%' THEN value_numeric END) as input_power
        FROM performance_data
        WHERE (equipment_id LIKE '%UPS%' OR equipment_id LIKE '0x3%')
        AND statistical_start_time >= NOW() - INTERVAL '1 hour'
        AND (:site_code IS NULL OR site_code = :site_code)
        GROUP BY equipment_id, site_code, statistical_start_time
        ORDER BY equipment_id, statistical_start_time DESC;
        """

        params = {"site_code": site_code, "days": days}
        
        pue_result = await execute_raw_query(pue_query, params)
        power_result = await execute_raw_query(power_query, params)
        ups_result = await execute_raw_query(ups_query, params)

        return {
            "pue_trend": [
                {"date": row["bucket"].isoformat(), "value": row["avg_pue"]} 
                for row in pue_result
            ],
            "power_trend": [
                {"date": row["bucket"].isoformat(), "value": row["total_power"]} 
                for row in power_result
            ],
            "ups_status": ups_result
        }

    except Exception as e:
        logger.error(f"Error generating power report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 
#     Cooling & Environment Report
#     
@router.get("/cooling", response_model=Dict[str, Any])
async def get_cooling_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    days: int = Query(7, description="ข้อมูลย้อนหลัง (วัน)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานระบบทำความเย็นและสภาพแวดล้อม
    """
    try:
        # 1. Temperature & Humidity Overview (Daily Avg/Min/Max)
        temp_query = """
        SELECT 
            time_bucket('1 day', statistical_start_time) as bucket,
            AVG(CASE WHEN performance_data LIKE '%temperature%' THEN value_numeric END) as avg_temp,
            MAX(CASE WHEN performance_data LIKE '%temperature%' THEN value_numeric END) as max_temp,
            MIN(CASE WHEN performance_data LIKE '%temperature%' THEN value_numeric END) as min_temp,
            AVG(CASE WHEN performance_data LIKE '%humidity%' THEN value_numeric END) as avg_humid
        FROM performance_data
        WHERE (performance_data LIKE '%temperature%' OR performance_data LIKE '%humidity%')
        AND statistical_start_time >= NOW() - INTERVAL :days || ' days'
        AND (:site_code IS NULL OR site_code = :site_code)
        GROUP BY bucket
        ORDER BY bucket;
        """

        # 2. Hot Spots (Equipment with high temp > 30C in last 24h)
        hotspot_query = """
        SELECT DISTINCT ON (equipment_id)
            equipment_id,
            site_code,
            performance_data as metric,
            value_numeric,
            statistical_start_time
        FROM performance_data
        WHERE performance_data LIKE '%temperature%'
        AND value_numeric > 30
        AND statistical_start_time >= NOW() - INTERVAL '24 hours'
        AND (:site_code IS NULL OR site_code = :site_code)
        ORDER BY equipment_id, value_numeric DESC;
        """

        params = {"site_code": site_code, "days": days}
        
        temp_result = await execute_raw_query(temp_query, params)
        hotspot_result = await execute_raw_query(hotspot_query, params)

        return {
            "environment_trend": [
                {
                    "date": row["bucket"].isoformat(), 
                    "avg_temp": row["avg_temp"],
                    "max_temp": row["max_temp"],
                    "min_temp": row["min_temp"],
                    "avg_humid": row["avg_humid"]
                } 
                for row in temp_result
            ],
            "hotspots": hotspot_result
        }

    except Exception as e:
        logger.error(f"Error generating cooling report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 
#     Executive Summary
#     
@router.get("/executive", response_model=Dict[str, Any])
async def get_executive_summary(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สรุปผู้บริหาร (Executive Summary)
    """
    try:
        # Build queries based on whether site_code is provided
        if site_code:
            pue_query = """
            SELECT AVG(value_numeric) as current_pue
            FROM performance_data
            WHERE performance_data LIKE '%PUE%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND site_code = :site_code;
            """
            power_query = """
            SELECT SUM(value_numeric) as total_power
            FROM performance_data
            WHERE (performance_data LIKE '%Active Power%' 
                   OR performance_data LIKE '%Total Input Power%'
                   OR performance_data = 'Power'
                   OR performance_data = 'Electricity')
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND site_code = :site_code;
            """
            alarm_query = """
            SELECT COUNT(DISTINCT equipment_id) as device_issues
            FROM performance_data
            WHERE performance_data = 'Communications status' 
            AND value_numeric = 0
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND site_code = :site_code;
            """
            params = {"site_code": site_code}
        else:
            pue_query = """
            SELECT AVG(value_numeric) as current_pue
            FROM performance_data
            WHERE performance_data LIKE '%PUE%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour';
            """
            power_query = """
            SELECT SUM(value_numeric) as total_power
            FROM performance_data
            WHERE (performance_data LIKE '%Active Power%' 
                   OR performance_data LIKE '%Total Input Power%'
                   OR performance_data = 'Power'
                   OR performance_data = 'Electricity')
            AND statistical_start_time >= NOW() - INTERVAL '2 hours';
            """
            alarm_query = """
            SELECT COUNT(DISTINCT equipment_id) as device_issues
            FROM performance_data
            WHERE performance_data = 'Communications status' 
            AND value_numeric = 0
            AND statistical_start_time >= NOW() - INTERVAL '1 hour';
            """
            params = {}
        
        pue_result = await execute_raw_query(pue_query, params)
        power_result = await execute_raw_query(power_query, params)
        alarm_result = await execute_raw_query(alarm_query, params)

        current_pue = pue_result[0].get("current_pue") or 1.5 # Fallback if no PUE data
        total_power = power_result[0].get("total_power") or 0
        device_issues = alarm_result[0].get("device_issues") or 0

        # Calculate Health Score based on mock logic (real would be complex)
        # Start at 100, deduct for PUE > 1.6, deduct for alarms
        health_score = 100
        if current_pue > 1.6: health_score -= 10
        if current_pue > 2.0: health_score -= 20
        health_score -= (device_issues * 5)
        health_score = max(0, min(100, health_score))

        return {
            "health_score": health_score,
            "current_pue": current_pue,
            "total_power_kw": total_power,
            "active_issues": device_issues,
            "last_updated": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error generating executive summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/summary")
async def get_system_summary(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สรุปข้อมูลระบบทั้งหมด
    Get system summary report
    """
    try:
        # สถิติระบบทั่วไป
        if site_code:
            general_stats_query = """
            SELECT 
                COUNT(DISTINCT site_code) as total_sites,
                COUNT(DISTINCT equipment_id) as total_equipment,
                COUNT(DISTINCT performance_data) as total_metrics,
                COUNT(*) as total_records,
                MIN(statistical_start_time) as earliest_data,
                MAX(statistical_start_time) as latest_data
            FROM public.performance_data
            WHERE site_code = $1;
            """
            general_stats = await execute_raw_query(general_stats_query, [site_code])
        else:
            # Optimized: Limit to last 30 days to prevent timeouts
            general_stats_query = """
            SELECT 
                COUNT(DISTINCT site_code) as total_sites,
                COUNT(DISTINCT equipment_id) as total_equipment,
                COUNT(DISTINCT performance_data) as total_metrics,
                COUNT(*) as total_records,
                MIN(statistical_start_time) as earliest_data,
                MAX(statistical_start_time) as latest_data
            FROM public.performance_data
            WHERE statistical_start_time >= NOW() - INTERVAL '30 days';
            """
            general_stats = await execute_raw_query(general_stats_query)
        
        stats = general_stats[0] if general_stats else {}
        
        # สถิติรายไซต์
        if site_code:
            site_stats_query = """
            SELECT 
                site_code,
                COUNT(DISTINCT equipment_id) as equipment_count,
                COUNT(DISTINCT performance_data) as metric_count,
                COUNT(*) as record_count,
                MAX(statistical_start_time) as latest_update
            FROM public.performance_data
            WHERE site_code = $1
            GROUP BY site_code
            ORDER BY site_code;
            """
            site_stats = await execute_raw_query(site_stats_query, [site_code])
        else:
            site_stats_query = """
            SELECT 
                site_code,
                COUNT(DISTINCT equipment_id) as equipment_count,
                COUNT(DISTINCT performance_data) as metric_count,
                COUNT(*) as record_count,
                MAX(statistical_start_time) as latest_update
            FROM public.performance_data
            GROUP BY site_code
            ORDER BY site_code;
            """
            site_stats = await execute_raw_query(site_stats_query)
        
        # เมตริกยอดนิยม
        if site_code:
            popular_metrics_query = """
            SELECT 
                performance_data as metric_name,
                unit,
                COUNT(*) as data_count,
                COUNT(DISTINCT site_code) as site_count,
                COUNT(DISTINCT equipment_id) as equipment_count,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value
            FROM public.performance_data
            WHERE value_numeric IS NOT NULL
            AND site_code = $1
            GROUP BY performance_data, unit
            HAVING COUNT(*) >= 10
            ORDER BY data_count DESC
            LIMIT 20;
            """
            popular_metrics = await execute_raw_query(popular_metrics_query, [site_code])
        else:
            popular_metrics_query = """
            SELECT 
                performance_data as metric_name,
                unit,
                COUNT(*) as data_count,
                COUNT(DISTINCT site_code) as site_count,
                COUNT(DISTINCT equipment_id) as equipment_count,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value
            FROM public.performance_data
            WHERE value_numeric IS NOT NULL
            GROUP BY performance_data, unit
            HAVING COUNT(*) >= 10
            ORDER BY data_count DESC
            LIMIT 20;
            """
            popular_metrics = await execute_raw_query(popular_metrics_query)
        
        return {
            "general_statistics": stats,
            "site_statistics": site_stats,
            "popular_metrics": popular_metrics,
            "generated_at": datetime.now().isoformat(),
            "filtered_by_site": site_code
        }
        
    except Exception as e:
        logger.error(f"Error generating system summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานสรุป: {str(e)}"
        )


@router.get("/reports/temperature")
async def get_temperature_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานอุณหภูมิ
    Temperature report
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # แก้ปัญหา Optional parameter ที่ทำให้เกิด AmbiguousParameterError
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_id,
                performance_data as metric_name,
                unit,
                COUNT(*) as data_points,
                AVG(value_numeric) as avg_temp,
                MIN(value_numeric) as min_temp,
                MAX(value_numeric) as max_temp,
                STDDEV(value_numeric) as std_temp,
                MIN(statistical_start_time) as earliest_reading,
                MAX(statistical_start_time) as latest_reading
            FROM public.performance_data
            WHERE statistical_start_time >= $1
            AND (performance_data ILIKE '%temp%' OR unit = '°C' OR unit = '℃')
            AND value_numeric IS NOT NULL
            AND site_code = $2
            GROUP BY site_code, equipment_id, performance_data, unit
            ORDER BY site_code, equipment_id, avg_temp DESC;
            """
            params = [from_time, site_code]
        else:
            query = """
            SELECT 
                site_code,
                equipment_id,
                performance_data as metric_name,
                unit,
                COUNT(*) as data_points,
                AVG(value_numeric) as avg_temp,
                MIN(value_numeric) as min_temp,
                MAX(value_numeric) as max_temp,
                STDDEV(value_numeric) as std_temp,
                MIN(statistical_start_time) as earliest_reading,
                MAX(statistical_start_time) as latest_reading
            FROM public.performance_data
            WHERE statistical_start_time >= $1
            AND (performance_data ILIKE '%temp%' OR unit = '°C' OR unit = '℃')
            AND value_numeric IS NOT NULL
            GROUP BY site_code, equipment_id, performance_data, unit
            ORDER BY site_code, equipment_id, avg_temp DESC;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        # สรุปรายไซต์
        site_summary = {}
        for row in results:
            site = row["site_code"]
            if site not in site_summary:
                site_summary[site] = {
                    "equipment_count": 0,
                    "total_readings": 0,
                    "avg_temperature": 0,
                    "min_temperature": float('inf'),
                    "max_temperature": float('-inf'),
                    "equipment_details": []
                }
            
            site_summary[site]["equipment_count"] += 1
            site_summary[site]["total_readings"] += row["data_points"]
            site_summary[site]["min_temperature"] = min(site_summary[site]["min_temperature"], row["min_temp"])
            site_summary[site]["max_temperature"] = max(site_summary[site]["max_temperature"], row["max_temp"])
            site_summary[site]["equipment_details"].append(row)
        
        # คำนวณ avg รวม
        for site in site_summary:
            details = site_summary[site]["equipment_details"]
            if details:
                total_weighted_avg = sum(d["avg_temp"] * d["data_points"] for d in details)
                total_points = sum(d["data_points"] for d in details)
                site_summary[site]["avg_temperature"] = total_weighted_avg / total_points if total_points > 0 else 0
        
        return {
            "report_type": "temperature",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_summary": site_summary,
            "detailed_readings": results
        }
        
    except Exception as e:
        logger.error(f"Error generating temperature report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานอุณหภูมิ: {str(e)}"
        )


def _normalize_bucket(param: str) -> str:
    allowed = {
        '5 minutes': '5 minutes',
        '15 minutes': '15 minutes',
        '30 minutes': '30 minutes',
        '1 hour': '1 hour',
        '3 hours': '3 hours',
        '6 hours': '6 hours',
        '12 hours': '12 hours',
        '1 day': '1 day',
    }
    return allowed.get(param, '1 hour')


@router.get("/reports/ingestion-series")
async def get_ingestion_series(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    bucket: str = Query('1 hour', description="ช่วงบัคเก็ตเวลาสำหรับสรุป เช่น '1 hour','1 day'"),
    use_cagg: bool = Query(True, description="ใช้ Continuous Aggregate เมื่อเป็นไปได้"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    นับจำนวนระเบียนที่รับเข้าต่อช่วงเวลา ด้วย time_bucket
    คืนรูปแบบ array: [{ timestamp, value }]
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        now = datetime.now()
        bucket_norm = _normalize_bucket(bucket)
        interval_sql = f"INTERVAL '{bucket_norm}'"

        # Prefer CAGG when 1 hour bucket
        if use_cagg and bucket_norm == '1 hour':
            if site_code:
                q = """
                SELECT bucket AS ts, SUM(records)::bigint AS records
                FROM public.cagg_ingest_1h
                WHERE bucket >= $1 AND bucket <= $2 AND site_code = $3
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now, site_code]
            else:
                q = """
                SELECT bucket AS ts, SUM(records)::bigint AS records
                FROM public.cagg_ingest_1h
                WHERE bucket >= $1 AND bucket <= $2
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now]
        else:
            if site_code:
                q = f"""
                SELECT 
                  time_bucket({interval_sql}, statistical_start_time) AS ts,
                  COUNT(*)::bigint AS records
                FROM public.performance_data
                WHERE statistical_start_time >= $1 AND statistical_start_time <= $2 AND site_code = $3
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now, site_code]
            else:
                q = f"""
                SELECT 
                  time_bucket({interval_sql}, statistical_start_time) AS ts,
                  COUNT(*)::bigint AS records
                FROM public.performance_data
                WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now]

        try:
            rows = await execute_raw_query(q, params)
        except Exception as e:
            msg = str(e)
            if use_cagg and 'cagg_ingest_1h' in msg or 'UndefinedTableError' in msg or 'does not exist' in msg:
                # Fallback to on-the-fly aggregation when CAGG is unavailable
                if site_code:
                    q = f"""
                        SELECT 
                          time_bucket({interval_sql}, statistical_start_time) AS ts,
                          COUNT(*)::bigint AS records
                        FROM public.performance_data
                        WHERE statistical_start_time >= $1 AND statistical_start_time <= $2 AND site_code = $3
                        GROUP BY ts
                        ORDER BY ts;
                    """
                    params = [from_time, now, site_code]
                else:
                    q = f"""
                        SELECT 
                          time_bucket({interval_sql}, statistical_start_time) AS ts,
                          COUNT(*)::bigint AS records
                        FROM public.performance_data
                        WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                        GROUP BY ts
                        ORDER BY ts;
                    """
                    params = [from_time, now]
                rows = await execute_raw_query(q, params)
            else:
                raise
        points = []
        for r in rows:
            try:
                ts = r.get('ts'); cnt = r.get('records')
            except Exception:
                ts, cnt = r[0], r[1]
            points.append({
                'timestamp': (ts if isinstance(ts, str) else getattr(ts, 'isoformat', lambda: str(ts))()),
                'value': int(cnt) if cnt is not None else 0,
            })
        return points
    except Exception as e:
        logger.error(f"Error getting ingestion series: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึง ingestion series: {e}")


@router.get("/reports/metric-popularity-series")
async def get_metric_popularity_series(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    bucket: str = Query('1 hour', description="ช่วงบัคเก็ตเวลาสำหรับสรุป"),
    top: int = Query(5, description="จำนวนเมตริกยอดนิยม"),
    use_cagg: bool = Query(True, description="ใช้ Continuous Aggregate เมื่อเป็นไปได้"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    อนุกรมเวลาจำนวนข้อมูลต่อช่วงเวลา แยกตามเมตริกยอดนิยม N อันดับ
    คืนรูปแบบ: [{ metric_name, unit, points: [{timestamp, value}] }]
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        now = datetime.now()
        bucket_norm = _normalize_bucket(bucket)
        interval_sql = f"INTERVAL '{bucket_norm}'"

        # เลือก top metrics ภายในช่วงเวลา
        if site_code:
            top_sql = """
                SELECT performance_data AS metric_name,
                       MIN(unit) AS unit,
                       COUNT(*) AS cnt
                FROM public.performance_data
                WHERE statistical_start_time >= $1 AND site_code = $2
                GROUP BY performance_data
                ORDER BY cnt DESC
                LIMIT $3;
            """
            top_rows = await execute_raw_query(top_sql, [from_time, site_code, top])
        else:
            top_sql = """
                SELECT performance_data AS metric_name,
                       MIN(unit) AS unit,
                       COUNT(*) AS cnt
                FROM public.performance_data
                WHERE statistical_start_time >= $1
                GROUP BY performance_data
                ORDER BY cnt DESC
                LIMIT $2;
            """
            top_rows = await execute_raw_query(top_sql, [from_time, top])

        top_metrics = []
        for tr in top_rows:
            try:
                name = tr.get('metric_name'); unit = tr.get('unit')
            except Exception:
                name, unit = tr[0], tr[1]
            if name:
                top_metrics.append({'metric_name': name, 'unit': unit or ''})

        if not top_metrics:
            return []

        # อนุกรมเวลาแยกตาม metric สำหรับ top
        metric_names = [m['metric_name'] for m in top_metrics]
        # สร้างรายการสำหรับ IN (...)
        # ใช้ ANY ($n) กับ array เพื่อความง่าย
        # Prefer CAGG for 1 hour bucket
        if use_cagg and bucket_norm == '1 hour':
            if site_code:
                series_sql = """
                    SELECT metric_name, bucket AS ts, SUM(cnt)::bigint AS cnt
                    FROM public.cagg_metric_pop_1h
                    WHERE bucket >= $1 AND bucket <= $2 AND site_code = $3 AND metric_name = ANY($4)
                    GROUP BY metric_name, ts
                    ORDER BY metric_name, ts;
                """
                try:
                    series_rows = await execute_raw_query(series_sql, [from_time, now, site_code, metric_names])
                except Exception as e:
                    msg = str(e)
                    if 'cagg_metric_pop_1h' in msg or 'UndefinedTableError' in msg or 'does not exist' in msg:
                        # Fallback to direct aggregation
                        series_sql = f"""
                            SELECT 
                              performance_data AS metric_name,
                              time_bucket({interval_sql}, statistical_start_time) AS ts,
                              COUNT(*)::bigint AS cnt
                            FROM public.performance_data
                            WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                              AND site_code = $3
                              AND performance_data = ANY($4)
                            GROUP BY metric_name, ts
                            ORDER BY metric_name, ts;
                        """
                        series_rows = await execute_raw_query(series_sql, [from_time, now, site_code, metric_names])
                    else:
                        raise
            else:
                series_sql = """
                    SELECT metric_name, bucket AS ts, SUM(cnt)::bigint AS cnt
                    FROM public.cagg_metric_pop_1h
                    WHERE bucket >= $1 AND bucket <= $2 AND metric_name = ANY($3)
                    GROUP BY metric_name, ts
                    ORDER BY metric_name, ts;
                """
                try:
                    series_rows = await execute_raw_query(series_sql, [from_time, now, metric_names])
                except Exception as e:
                    msg = str(e)
                    if 'cagg_metric_pop_1h' in msg or 'UndefinedTableError' in msg or 'does not exist' in msg:
                        series_sql = f"""
                            SELECT 
                              performance_data AS metric_name,
                              time_bucket({interval_sql}, statistical_start_time) AS ts,
                              COUNT(*)::bigint AS cnt
                            FROM public.performance_data
                            WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                              AND performance_data = ANY($3)
                            GROUP BY metric_name, ts
                            ORDER BY metric_name, ts;
                        """
                        series_rows = await execute_raw_query(series_sql, [from_time, now, metric_names])
                    else:
                        raise
        else:
            if site_code:
                series_sql = f"""
                    SELECT 
                      performance_data AS metric_name,
                      time_bucket({interval_sql}, statistical_start_time) AS ts,
                      COUNT(*)::bigint AS cnt
                    FROM public.performance_data
                    WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                      AND site_code = $3
                      AND performance_data = ANY($4)
                    GROUP BY metric_name, ts
                    ORDER BY metric_name, ts;
                """
                series_rows = await execute_raw_query(series_sql, [from_time, now, site_code, metric_names])
            else:
                series_sql = f"""
                    SELECT 
                      performance_data AS metric_name,
                      time_bucket({interval_sql}, statistical_start_time) AS ts,
                      COUNT(*)::bigint AS cnt
                    FROM public.performance_data
                    WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                      AND performance_data = ANY($3)
                    GROUP BY metric_name, ts
                    ORDER BY metric_name, ts;
                """
                series_rows = await execute_raw_query(series_sql, [from_time, now, metric_names])

        series_map: Dict[str, Dict[str, Any]] = {m['metric_name']: { 'metric_name': m['metric_name'], 'unit': m['unit'], 'points': [] } for m in top_metrics}
        for r in series_rows:
            try:
                name = r.get('metric_name'); ts = r.get('ts'); cnt = r.get('cnt')
            except Exception:
                name, ts, cnt = r[0], r[1], r[2]
            if name in series_map:
                series_map[name]['points'].append({
                    'timestamp': (ts if isinstance(ts, str) else getattr(ts, 'isoformat', lambda: str(ts))()),
                    'value': int(cnt) if cnt is not None else 0,
                })

        return list(series_map.values())
    except Exception as e:
        logger.error(f"Error getting metric popularity series: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึง metric popularity series: {e}")


@router.get("/reports/temperature-series")
async def get_temperature_series(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    bucket: str = Query('1 hour', description="ช่วงบัคเก็ตเวลาสำหรับสรุป เช่น '1 hour','30 minutes'"),
    use_cagg: bool = Query(True, description="ใช้ Continuous Aggregate เมื่อเป็นไปได้"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ชุดข้อมูลอนุกรมเวลาอุณหภูมิ ใช้ time_bucket ของ TimescaleDB
    คืนรูปแบบ array: [{ timestamp, avg_temperature, min_temperature, max_temperature, equipment_count }]
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        now = datetime.now()
        interval_sql = f"INTERVAL '{bucket}'"

        if use_cagg and _normalize_bucket(bucket) == '1 hour':
            if site_code:
                q = """
                SELECT bucket AS ts,
                       AVG(avg_temperature)::float8 AS avg_temperature,
                       MIN(min_temperature)::float8 AS min_temperature,
                       MAX(max_temperature)::float8 AS max_temperature,
                       MAX(equipment_count)::bigint AS equipment_count
                FROM public.cagg_temp_1h
                WHERE bucket >= $1 AND bucket <= $2 AND site_code = $3
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now, site_code]
            else:
                q = """
                SELECT bucket AS ts,
                       AVG(avg_temperature)::float8 AS avg_temperature,
                       MIN(min_temperature)::float8 AS min_temperature,
                       MAX(max_temperature)::float8 AS max_temperature,
                       MAX(equipment_count)::bigint AS equipment_count
                FROM public.cagg_temp_1h
                WHERE bucket >= $1 AND bucket <= $2
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now]
            try:
                rows = await execute_raw_query(q, params)
            except Exception as e:
                msg = str(e)
                if 'cagg_temp_1h' in msg or 'UndefinedTableError' in msg or 'does not exist' in msg:
                    # Fallback to on-the-fly aggregation
                    if site_code:
                        q = f"""
                            SELECT 
                              time_bucket({interval_sql}, statistical_start_time) AS ts,
                              AVG(value_numeric)::float8 AS avg_temperature,
                              MIN(value_numeric)::float8 AS min_temperature,
                              MAX(value_numeric)::float8 AS max_temperature,
                              COUNT(DISTINCT equipment_id) AS equipment_count
                            FROM public.performance_data
                            WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                              AND (performance_data ILIKE '%temp%' OR unit IN ('°C','℃'))
                              AND value_numeric IS NOT NULL
                              AND site_code = $3
                            GROUP BY ts
                            ORDER BY ts;
                        """
                        params = [from_time, now, site_code]
                    else:
                        q = f"""
                            SELECT 
                              time_bucket({interval_sql}, statistical_start_time) AS ts,
                              AVG(value_numeric)::float8 AS avg_temperature,
                              MIN(value_numeric)::float8 AS min_temperature,
                              MAX(value_numeric)::float8 AS max_temperature,
                              COUNT(DISTINCT equipment_id) AS equipment_count
                            FROM public.performance_data
                            WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                              AND (performance_data ILIKE '%temp%' OR unit IN ('°C','℃'))
                              AND value_numeric IS NOT NULL
                            GROUP BY ts
                            ORDER BY ts;
                        """
                        params = [from_time, now]
                    rows = await execute_raw_query(q, params)
                else:
                    raise
        else:
            if site_code:
                q = f"""
                SELECT 
                  time_bucket({interval_sql}, statistical_start_time) AS ts,
                  AVG(value_numeric)::float8 AS avg_temperature,
                  MIN(value_numeric)::float8 AS min_temperature,
                  MAX(value_numeric)::float8 AS max_temperature,
                  COUNT(DISTINCT equipment_id) AS equipment_count
                FROM public.performance_data
                WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                  AND (performance_data ILIKE '%temp%' OR unit IN ('°C','℃'))
                  AND value_numeric IS NOT NULL
                  AND site_code = $3
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now, site_code]
            else:
                q = f"""
                SELECT 
                  time_bucket({interval_sql}, statistical_start_time) AS ts,
                  AVG(value_numeric)::float8 AS avg_temperature,
                  MIN(value_numeric)::float8 AS min_temperature,
                  MAX(value_numeric)::float8 AS max_temperature,
                  COUNT(DISTINCT equipment_id) AS equipment_count
                FROM public.performance_data
                WHERE statistical_start_time >= $1 AND statistical_start_time <= $2
                  AND (performance_data ILIKE '%temp%' OR unit IN ('°C','℃'))
                  AND value_numeric IS NOT NULL
                GROUP BY ts
                ORDER BY ts;
                """
                params = [from_time, now]
        if 'rows' not in locals():
            rows = await execute_raw_query(q, params)
        series = []
        for r in rows:
            # Support dict/row/tuple
            try:
                ts = r.get('ts')
                avg_t = r.get('avg_temperature')
                min_t = r.get('min_temperature')
                max_t = r.get('max_temperature')
                eqc = r.get('equipment_count')
            except Exception:
                ts, avg_t, min_t, max_t, eqc = r[0], r[1], r[2], r[3], r[4]
            series.append({
                'timestamp': (ts if isinstance(ts, str) else getattr(ts, 'isoformat', lambda: str(ts))()),
                'avg_temperature': float(avg_t) if avg_t is not None else None,
                'min_temperature': float(min_t) if min_t is not None else None,
                'max_temperature': float(max_t) if max_t is not None else None,
                'equipment_count': int(eqc) if eqc is not None else 0,
            })

        return series
    except Exception as e:
        logger.error(f"Error generating temperature series: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถสร้างชุดข้อมูลอุณหภูมิ: {e}")


@router.get("/reports/equipment-status")
async def get_equipment_status_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานสถานะอุปกรณ์
    Equipment status report
    """
    try:
        # หาอุปกรณ์ที่มีข้อมูลล่าสุด
        latest_data_query = """
        WITH latest_per_equipment AS (
            SELECT 
                site_code,
                equipment_id,
                MAX(statistical_start_time) as latest_time
            FROM public.performance_data
            WHERE ($site_code IS NULL OR site_code = $site_code)
            GROUP BY site_code, equipment_id
        )
        SELECT 
            l.site_code,
            l.equipment_id,
            l.latest_time,
            COUNT(DISTINCT pd.performance_data) as metric_count,
            COUNT(pd.*) as total_records,
            CASE 
                WHEN l.latest_time >= NOW() - INTERVAL '1 hour' THEN 'Online'
                WHEN l.latest_time >= NOW() - INTERVAL '24 hours' THEN 'Recently Active'
                ELSE 'Offline'
            END as status,
            EXTRACT(EPOCH FROM (NOW() - l.latest_time))/3600 as hours_since_last_data
        FROM latest_per_equipment l
        LEFT JOIN public.performance_data pd ON l.site_code = pd.site_code 
            AND l.equipment_id = pd.equipment_id
            AND pd.statistical_start_time >= l.latest_time - INTERVAL '24 hours'
        GROUP BY l.site_code, l.equipment_id, l.latest_time
        ORDER BY l.site_code, l.latest_time DESC;
        """
        
        params = {"site_code": site_code}
        equipment_status = await execute_raw_query(latest_data_query, params)
        
        # สรุปสถานะ
        status_summary = {"Online": 0, "Recently Active": 0, "Offline": 0}
        site_summary = {}
        
        for eq in equipment_status:
            status_summary[eq["status"]] += 1
            
            site = eq["site_code"]
            if site not in site_summary:
                site_summary[site] = {"Online": 0, "Recently Active": 0, "Offline": 0, "total": 0}
            
            site_summary[site][eq["status"]] += 1
            site_summary[site]["total"] += 1
        
        return {
            "report_type": "equipment_status",
            "generated_at": datetime.now().isoformat(),
            "overall_summary": status_summary,
            "site_summary": site_summary,
            "equipment_details": equipment_status,
            "status_definitions": {
                "Online": "ข้อมูลล่าสุดภายใน 1 ชั่วโมง",
                "Recently Active": "ข้อมูลล่าสุดภายใน 24 ชั่วโมง",
                "Offline": "ไม่มีข้อมูลมากกว่า 24 ชั่วโมง"
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating equipment status report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานสถานะอุปกรณ์: {str(e)}"
        )


@router.get("/reports/data-quality")
async def get_data_quality_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ช่วงเวลาตรวจสอบ (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานคุณภาพข้อมูล
    Data quality report
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        query = """
        SELECT 
            site_code,
            equipment_id,
            performance_data as metric_name,
            COUNT(*) as total_records,
            COUNT(value_numeric) as numeric_records,
            COUNT(CASE WHEN value_numeric IS NOT NULL AND value_numeric > 0 THEN 1 END) as positive_values,
            COUNT(CASE WHEN value_text IS NOT NULL AND value_text != '' THEN 1 END) as text_records,
            COUNT(CASE WHEN value_numeric IS NULL AND value_text IS NULL THEN 1 END) as null_records,
            AVG(CASE WHEN value_numeric IS NOT NULL THEN value_numeric END) as avg_value,
            MIN(statistical_start_time) as first_record,
            MAX(statistical_start_time) as last_record,
            unit
        FROM public.performance_data
        WHERE statistical_start_time >= :from_time
        AND ($site_code IS NULL OR site_code = $site_code)
        GROUP BY site_code, equipment_id, performance_data, unit
        HAVING COUNT(*) > 0
        ORDER BY site_code, equipment_id, total_records DESC;
        """
        
        params = {
            "from_time": from_time,
            "site_code": site_code
        }
        
        results = await execute_raw_query(query, params)
        
        # วิเคราะห์คุณภาพ
        quality_analysis = []
        for row in results:
            total = row["total_records"]
            numeric = row["numeric_records"] or 0
            null_count = row["null_records"] or 0
            
            data_completeness = ((total - null_count) / total * 100) if total > 0 else 0
            numeric_percentage = (numeric / total * 100) if total > 0 else 0
            
            quality_score = (data_completeness + numeric_percentage) / 2
            
            if quality_score >= 90:
                quality_rating = "Excellent"
            elif quality_score >= 75:
                quality_rating = "Good"
            elif quality_score >= 50:
                quality_rating = "Fair"
            else:
                quality_rating = "Poor"
            
            quality_analysis.append({
                **row,
                "data_completeness_percent": round(data_completeness, 2),
                "numeric_data_percent": round(numeric_percentage, 2),
                "quality_score": round(quality_score, 2),
                "quality_rating": quality_rating
            })
        
        # สรุปตามไซต์
        site_quality = {}
        for item in quality_analysis:
            site = item["site_code"]
            if site not in site_quality:
                site_quality[site] = {
                    "total_metrics": 0,
                    "excellent_count": 0,
                    "good_count": 0,
                    "fair_count": 0,
                    "poor_count": 0,
                    "avg_quality_score": 0
                }
            
            site_quality[site]["total_metrics"] += 1
            site_quality[site][f"{item['quality_rating'].lower()}_count"] += 1
        
        # คำนวณ avg quality score ต่อไซต์
        for site in site_quality:
            site_metrics = [item for item in quality_analysis if item["site_code"] == site]
            if site_metrics:
                site_quality[site]["avg_quality_score"] = round(
                    sum(item["quality_score"] for item in site_metrics) / len(site_metrics), 2
                )
        
        return {
            "report_type": "data_quality",
            "analysis_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_quality_summary": site_quality,
            "detailed_analysis": quality_analysis,
            "quality_criteria": {
                "Excellent": "≥ 90% คุณภาพข้อมูล",
                "Good": "75-89% คุณภาพข้อมูล",
                "Fair": "50-74% คุณภาพข้อมูล",
                "Poor": "< 50% คุณภาพข้อมูล"
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating data quality report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานคุณภาพข้อมูล: {str(e)}"
        )


@router.get("/reports/export/{report_type}")
async def export_report(
    report_type: str,
    format: str = Query("json", description="รูปแบบการส่งออก (json/csv)"),
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ส่งออกรายงาน
    Export reports in different formats
    """
    try:
        # สำหรับ phase นี้ support เฉพาะ JSON
        if format.lower() not in ["json"]:
            raise HTTPException(
                status_code=400,
                detail="รองรับเฉพาะรูปแบบ JSON ในขณะนี้"
            )
        
        # เลือกรายงานที่จะส่งออก
        if report_type == "summary":
            return await get_system_summary(site_code=site_code, current_user=current_user, db=db)
        elif report_type == "temperature":
            return await get_temperature_report(site_code=site_code, current_user=current_user, db=db)
        elif report_type == "equipment-status":
            return await get_equipment_status_report(site_code=site_code, current_user=current_user, db=db)
        elif report_type == "data-quality":
            return await get_data_quality_report(site_code=site_code, current_user=current_user, db=db)
        else:
            raise HTTPException(
                status_code=404,
                detail=f"ไม่พบประเภทรายงาน: {report_type}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถส่งออกรายงาน: {str(e)}"
        )


# =====================================================
# NEW REPORTS API ENDPOINTS - Complete Redesign
# =====================================================

@router.get("/reports/humidity")
async def get_humidity_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานความชื้น (Humidity Report)
    แสดงข้อมูลความชื้นรายวัน พร้อมสถิติ
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        if site_code:
            query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_humidity,
                MIN(value_numeric) as min_humidity,
                MAX(value_numeric) as max_humidity,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%' OR unit = '%RH')
            AND value_numeric IS NOT NULL
            AND statistical_start_time >= $1
            AND site_code = $2
            GROUP BY bucket
            ORDER BY bucket;
            """
            params = [from_time, site_code]
        else:
            query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_humidity,
                MIN(value_numeric) as min_humidity,
                MAX(value_numeric) as max_humidity,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%' OR unit = '%RH')
            AND value_numeric IS NOT NULL
            AND statistical_start_time >= $1
            GROUP BY bucket
            ORDER BY bucket;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        # Calculate statistics
        all_values = [r.get('avg_humidity') for r in results if r.get('avg_humidity') is not None]
        current_humidity = all_values[-1] if all_values else None
        avg_humidity = sum(all_values) / len(all_values) if all_values else None
        min_humidity = min(all_values) if all_values else None
        max_humidity = max(all_values) if all_values else None
        
        return {
            "report_type": "humidity",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "statistics": {
                "current": round(current_humidity, 2) if current_humidity else None,
                "average": round(avg_humidity, 2) if avg_humidity else None,
                "minimum": round(min_humidity, 2) if min_humidity else None,
                "maximum": round(max_humidity, 2) if max_humidity else None,
                "data_points": sum(r.get('data_points', 0) for r in results)
            },
            "trend": [
                {
                    "timestamp": r.get('bucket').isoformat() if r.get('bucket') else None,
                    "avg": round(r.get('avg_humidity'), 2) if r.get('avg_humidity') else None,
                    "min": round(r.get('min_humidity'), 2) if r.get('min_humidity') else None,
                    "max": round(r.get('max_humidity'), 2) if r.get('max_humidity') else None
                }
                for r in results
            ],
            "threshold": {
                "warning": 60,
                "critical": 70,
                "unit": "%RH"
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating humidity report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานความชื้น: {str(e)}"
        )


@router.get("/reports/pue")
async def get_pue_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    days: int = Query(7, description="ข้อมูลย้อนหลัง (วัน)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงาน PUE (Power Usage Effectiveness)
    แสดงค่า PUE ปัจจุบัน, สถิติ, และ trend
    """
    try:
        from_time = datetime.now() - timedelta(days=days)
        
        # Current PUE
        if site_code:
            current_query = """
            SELECT AVG(value_numeric) as current_pue
            FROM performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND site_code = $1;
            """
            current_result = await execute_raw_query(current_query, [site_code])
        else:
            current_query = """
            SELECT AVG(value_numeric) as current_pue
            FROM performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour';
            """
            current_result = await execute_raw_query(current_query)
        
        current_pue = current_result[0].get('current_pue') if current_result else None
        
        # PUE Trend
        if site_code:
            trend_query = """
            SELECT 
                time_bucket('1 day', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_pue,
                MIN(value_numeric) as min_pue,
                MAX(value_numeric) as max_pue
            FROM public.performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            AND value_numeric < 10
            AND statistical_start_time >= $1
            AND site_code = $2
            GROUP BY bucket
            ORDER BY bucket;
            """
            params = [from_time, site_code]
        else:
            trend_query = """
            SELECT 
                time_bucket('1 day', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_pue,
                MIN(value_numeric) as min_pue,
                MAX(value_numeric) as max_pue
            FROM public.performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            AND value_numeric < 10
            AND statistical_start_time >= $1
            GROUP BY bucket
            ORDER BY bucket;
            """
            params = [from_time]
        
        trend_results = await execute_raw_query(trend_query, params)
        
        all_values = [r.get('avg_pue') for r in trend_results if r.get('avg_pue')]
        
        # Determine efficiency rating
        efficiency_rating = "ดีเยี่ยม"
        if current_pue:
            if current_pue < 1.4:
                efficiency_rating = "ดีเยี่ยม"
            elif current_pue < 1.6:
                efficiency_rating = "ดี"
            elif current_pue < 2.0:
                efficiency_rating = "ปานกลาง"
            else:
                efficiency_rating = "ต้องปรับปรุง"
        
        return {
            "report_type": "pue",
            "time_period": f"ล่าสุด {days} วัน",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "current_pue": round(current_pue, 3) if current_pue else None,
            "efficiency_rating": efficiency_rating,
            "statistics": {
                "average": round(sum(all_values) / len(all_values), 3) if all_values else None,
                "minimum": round(min(all_values), 3) if all_values else None,
                "maximum": round(max(all_values), 3) if all_values else None
            },
            "trend": [
                {
                    "date": r.get('bucket').isoformat() if r.get('bucket') else None,
                    "avg": round(r.get('avg_pue'), 3) if r.get('avg_pue') else None,
                    "min": round(r.get('min_pue'), 3) if r.get('min_pue') else None,
                    "max": round(r.get('max_pue'), 3) if r.get('max_pue') else None
                }
                for r in trend_results
            ],
            "benchmarks": {
                "excellent": 1.4,
                "good": 1.6,
                "average": 2.0,
                "description": "ค่า PUE ที่ดีควรต่ำกว่า 1.6"
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating PUE report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงาน PUE: {str(e)}"
        )


@router.get("/reports/cabinets")
async def get_cabinets_summary(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานสรุปข้อมูลตู้ (Cabinets Summary)
    แสดงข้อมูลอุณหภูมิ ความชื้น และการใช้ไฟฟ้าของแต่ละตู้
    """
    try:
        # Get cabinet data with latest metrics
        if site_code:
            query = """
            WITH latest_data AS (
                SELECT DISTINCT ON (equipment_id, performance_data)
                    equipment_id,
                    equipment_name,
                    site_code,
                    performance_data,
                    value_numeric,
                    unit,
                    statistical_start_time
                FROM public.performance_data
                WHERE statistical_start_time >= NOW() - INTERVAL '1 hour'
                AND site_code = $1
                ORDER BY equipment_id, performance_data, statistical_start_time DESC
            )
            SELECT 
                equipment_id,
                COALESCE(equipment_name, equipment_id) as cabinet_name,
                site_code,
                MAX(CASE WHEN performance_data ILIKE '%temperature%' OR performance_data ILIKE '%temp%' THEN value_numeric END) as temperature,
                MAX(CASE WHEN performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%' THEN value_numeric END) as humidity,
                MAX(CASE WHEN performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%' THEN value_numeric END) as power,
                MAX(statistical_start_time) as last_updated
            FROM latest_data
            GROUP BY equipment_id, equipment_name, site_code
            ORDER BY equipment_id;
            """
            params = [site_code]
        else:
            query = """
            WITH latest_data AS (
                SELECT DISTINCT ON (equipment_id, performance_data)
                    equipment_id,
                    equipment_name,
                    site_code,
                    performance_data,
                    value_numeric,
                    unit,
                    statistical_start_time
                FROM public.performance_data
                WHERE statistical_start_time >= NOW() - INTERVAL '1 hour'
                ORDER BY equipment_id, performance_data, statistical_start_time DESC
            )
            SELECT 
                equipment_id,
                COALESCE(equipment_name, equipment_id) as cabinet_name,
                site_code,
                MAX(CASE WHEN performance_data ILIKE '%temperature%' OR performance_data ILIKE '%temp%' THEN value_numeric END) as temperature,
                MAX(CASE WHEN performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%' THEN value_numeric END) as humidity,
                MAX(CASE WHEN performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%' THEN value_numeric END) as power,
                MAX(statistical_start_time) as last_updated
            FROM latest_data
            GROUP BY equipment_id, equipment_name, site_code
            ORDER BY equipment_id;
            """
            params = []
        
        results = await execute_raw_query(query, params)
        
        # Calculate summary statistics
        temps = [r.get('temperature') for r in results if r.get('temperature') is not None]
        humids = [r.get('humidity') for r in results if r.get('humidity') is not None]
        powers = [r.get('power') for r in results if r.get('power') is not None]
        
        return {
            "report_type": "cabinets",
            "generated_at": datetime.now().isoformat(),
            "site_code": site_code,
            "summary": {
                "total_cabinets": len(results),
                "avg_temperature": round(sum(temps) / len(temps), 2) if temps else None,
                "avg_humidity": round(sum(humids) / len(humids), 2) if humids else None,
                "total_power": round(sum(powers), 2) if powers else None
            },
            "cabinets": [
                {
                    "equipment_id": r.get('equipment_id'),
                    "cabinet_name": r.get('cabinet_name'),
                    "site_code": r.get('site_code'),
                    "temperature": round(r.get('temperature'), 2) if r.get('temperature') else None,
                    "humidity": round(r.get('humidity'), 2) if r.get('humidity') else None,
                    "power": round(r.get('power'), 2) if r.get('power') else None,
                    "last_updated": r.get('last_updated').isoformat() if r.get('last_updated') else None,
                    "status": "warning" if (r.get('temperature') and r.get('temperature') > 28) else "normal"
                }
                for r in results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error generating cabinets report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานตู้: {str(e)}"
        )


@router.get("/reports/cabinet/{equipment_id}")
async def get_cabinet_detail(
    equipment_id: str,
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานละเอียดของตู้ (Cabinet Detail Report)
    แสดงข้อมูลทุก metric ของตู้ที่เลือก พร้อม trend
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Get all metrics for this cabinet
        if site_code:
            metrics_query = """
            SELECT 
                performance_data as metric_name,
                unit,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE equipment_id = $1
            AND site_code = $2
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            GROUP BY performance_data, unit
            ORDER BY performance_data;
            """
            metrics_params = [equipment_id, site_code, from_time]
        else:
            metrics_query = """
            SELECT 
                performance_data as metric_name,
                unit,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE equipment_id = $1
            AND statistical_start_time >= $2
            AND value_numeric IS NOT NULL
            GROUP BY performance_data, unit
            ORDER BY performance_data;
            """
            metrics_params = [equipment_id, from_time]
        
        metrics_results = await execute_raw_query(metrics_query, metrics_params)
        
        # Get temperature trend
        if site_code:
            temp_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND site_code = $2
            AND (performance_data ILIKE '%temperature%' OR performance_data ILIKE '%temp%')
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            temp_params = [equipment_id, site_code, from_time]
        else:
            temp_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND (performance_data ILIKE '%temperature%' OR performance_data ILIKE '%temp%')
            AND statistical_start_time >= $2
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            temp_params = [equipment_id, from_time]
        
        temp_trend = await execute_raw_query(temp_trend_query, temp_params)
        
        # Get humidity trend
        if site_code:
            humid_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND site_code = $2
            AND (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%')
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            humid_params = [equipment_id, site_code, from_time]
        else:
            humid_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%')
            AND statistical_start_time >= $2
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            humid_params = [equipment_id, from_time]
        
        humid_trend = await execute_raw_query(humid_trend_query, humid_params)
        
        # Get power trend
        if site_code:
            power_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND site_code = $2
            AND (performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%')
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            power_params = [equipment_id, site_code, from_time]
        else:
            power_trend_query = """
            SELECT 
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_id = $1
            AND (performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%')
            AND statistical_start_time >= $2
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            power_params = [equipment_id, from_time]
        
        power_trend = await execute_raw_query(power_trend_query, power_params)
        
        return {
            "report_type": "cabinet_detail",
            "equipment_id": equipment_id,
            "site_code": site_code,
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "metrics": [
                {
                    "metric_name": r.get('metric_name'),
                    "unit": r.get('unit'),
                    "average": round(r.get('avg_value'), 2) if r.get('avg_value') else None,
                    "minimum": round(r.get('min_value'), 2) if r.get('min_value') else None,
                    "maximum": round(r.get('max_value'), 2) if r.get('max_value') else None,
                    "data_points": r.get('data_points')
                }
                for r in metrics_results
            ],
            "trends": {
                "temperature": [
                    {"timestamp": r.get('bucket').isoformat(), "value": round(r.get('avg_value'), 2) if r.get('avg_value') else None}
                    for r in temp_trend
                ],
                "humidity": [
                    {"timestamp": r.get('bucket').isoformat(), "value": round(r.get('avg_value'), 2) if r.get('avg_value') else None}
                    for r in humid_trend
                ],
                "power": [
                    {"timestamp": r.get('bucket').isoformat(), "value": round(r.get('avg_value'), 2) if r.get('avg_value') else None}
                    for r in power_trend
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating cabinet detail report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานตู้ละเอียด: {str(e)}"
        )


@router.get("/reports/power-per-equipment")
async def get_power_per_equipment(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานการใช้ไฟฟ้าต่ออุปกรณ์ (Power per Equipment)
    แสดงการใช้ไฟฟ้าของแต่ละอุปกรณ์
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        if site_code:
            query = """
            SELECT 
                equipment_id,
                COALESCE(equipment_name, equipment_id) as equipment_name,
                site_code,
                AVG(value_numeric) as avg_power,
                MIN(value_numeric) as min_power,
                MAX(value_numeric) as max_power,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE (performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%' OR performance_data ILIKE '%Input active power%')
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            GROUP BY equipment_id, equipment_name, site_code
            ORDER BY avg_power DESC;
            """
            params = [from_time, site_code]
        else:
            query = """
            SELECT 
                equipment_id,
                COALESCE(equipment_name, equipment_id) as equipment_name,
                site_code,
                AVG(value_numeric) as avg_power,
                MIN(value_numeric) as min_power,
                MAX(value_numeric) as max_power,
                COUNT(*) as data_points
            FROM public.performance_data
            WHERE (performance_data ILIKE '%power%' OR performance_data ILIKE '%Active Power%' OR performance_data ILIKE '%Input active power%')
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            AND value_numeric > 0
            GROUP BY equipment_id, equipment_name, site_code
            ORDER BY avg_power DESC;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        total_power = sum(r.get('avg_power', 0) for r in results if r.get('avg_power'))
        
        return {
            "report_type": "power_per_equipment",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "total_power_kw": round(total_power, 2),
            "equipment_count": len(results),
            "equipment": [
                {
                    "equipment_id": r.get('equipment_id'),
                    "equipment_name": r.get('equipment_name'),
                    "site_code": r.get('site_code'),
                    "avg_power": round(r.get('avg_power'), 2) if r.get('avg_power') else None,
                    "min_power": round(r.get('min_power'), 2) if r.get('min_power') else None,
                    "max_power": round(r.get('max_power'), 2) if r.get('max_power') else None,
                    "percentage": round((r.get('avg_power', 0) / total_power * 100), 2) if total_power > 0 else 0,
                    "data_points": r.get('data_points')
                }
                for r in results
            ]
        }
        
    except Exception as e:
        logger.error(f"Error generating power per equipment report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานการใช้ไฟฟ้า: {str(e)}"
        )


@router.get("/reports/daily-summary")
async def get_daily_summary(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    date: Optional[str] = Query(None, description="วันที่ (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานสรุปรายวัน (Daily Summary)
    สรุปข้อมูลทุกเมตริกในวันที่เลือก
    """
    try:
        # Parse date or use today
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)")
        else:
            target_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        start_of_day = target_date
        end_of_day = target_date + timedelta(days=1)
        
        # Temperature summary
        if site_code:
            temp_query = """
            SELECT 
                AVG(value_numeric) as avg_temp,
                MIN(value_numeric) as min_temp,
                MAX(value_numeric) as max_temp,
                COUNT(*) as readings
            FROM public.performance_data
            WHERE (performance_data ILIKE '%temperature%' OR unit = '°C' OR unit = '℃')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND site_code = $3
            AND value_numeric IS NOT NULL;
            """
            temp_params = [start_of_day, end_of_day, site_code]
        else:
            temp_query = """
            SELECT 
                AVG(value_numeric) as avg_temp,
                MIN(value_numeric) as min_temp,
                MAX(value_numeric) as max_temp,
                COUNT(*) as readings
            FROM public.performance_data
            WHERE (performance_data ILIKE '%temperature%' OR unit = '°C' OR unit = '℃')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND value_numeric IS NOT NULL;
            """
            temp_params = [start_of_day, end_of_day]
        
        temp_result = await execute_raw_query(temp_query, temp_params)
        
        # Humidity summary
        if site_code:
            humid_query = """
            SELECT 
                AVG(value_numeric) as avg_humid,
                MIN(value_numeric) as min_humid,
                MAX(value_numeric) as max_humid,
                COUNT(*) as readings
            FROM public.performance_data
            WHERE (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND site_code = $3
            AND value_numeric IS NOT NULL;
            """
            humid_params = [start_of_day, end_of_day, site_code]
        else:
            humid_query = """
            SELECT 
                AVG(value_numeric) as avg_humid,
                MIN(value_numeric) as min_humid,
                MAX(value_numeric) as max_humid,
                COUNT(*) as readings
            FROM public.performance_data
            WHERE (performance_data ILIKE '%humidity%' OR performance_data ILIKE '%RH%')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND value_numeric IS NOT NULL;
            """
            humid_params = [start_of_day, end_of_day]
        
        humid_result = await execute_raw_query(humid_query, humid_params)
        
        # PUE summary
        if site_code:
            pue_query = """
            SELECT 
                AVG(value_numeric) as avg_pue,
                MIN(value_numeric) as min_pue,
                MAX(value_numeric) as max_pue
            FROM public.performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND site_code = $3
            AND value_numeric IS NOT NULL
            AND value_numeric > 0 AND value_numeric < 10;
            """
            pue_params = [start_of_day, end_of_day, site_code]
        else:
            pue_query = """
            SELECT 
                AVG(value_numeric) as avg_pue,
                MIN(value_numeric) as min_pue,
                MAX(value_numeric) as max_pue
            FROM public.performance_data
            WHERE performance_data ILIKE '%PUE%'
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND value_numeric IS NOT NULL
            AND value_numeric > 0 AND value_numeric < 10;
            """
            pue_params = [start_of_day, end_of_day]
        
        pue_result = await execute_raw_query(pue_query, pue_params)
        
        # Power summary
        if site_code:
            power_query = """
            SELECT 
                AVG(value_numeric) as avg_power,
                MIN(value_numeric) as min_power,
                MAX(value_numeric) as max_power,
                SUM(value_numeric) / COUNT(*) * 24 as estimated_daily_kwh
            FROM public.performance_data
            WHERE (performance_data ILIKE '%Active Power%' OR performance_data ILIKE '%Total Input Power%')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND site_code = $3
            AND value_numeric IS NOT NULL
            AND value_numeric > 0;
            """
            power_params = [start_of_day, end_of_day, site_code]
        else:
            power_query = """
            SELECT 
                AVG(value_numeric) as avg_power,
                MIN(value_numeric) as min_power,
                MAX(value_numeric) as max_power,
                SUM(value_numeric) / COUNT(*) * 24 as estimated_daily_kwh
            FROM public.performance_data
            WHERE (performance_data ILIKE '%Active Power%' OR performance_data ILIKE '%Total Input Power%')
            AND statistical_start_time >= $1
            AND statistical_start_time < $2
            AND value_numeric IS NOT NULL
            AND value_numeric > 0;
            """
            power_params = [start_of_day, end_of_day]
        
        power_result = await execute_raw_query(power_query, power_params)
        
        # Equipment count
        if site_code:
            equip_query = """
            SELECT COUNT(DISTINCT equipment_id) as equipment_count
            FROM public.performance_data
            WHERE statistical_start_time >= $1
            AND statistical_start_time < $2
            AND site_code = $3;
            """
            equip_params = [start_of_day, end_of_day, site_code]
        else:
            equip_query = """
            SELECT COUNT(DISTINCT equipment_id) as equipment_count
            FROM public.performance_data
            WHERE statistical_start_time >= $1
            AND statistical_start_time < $2;
            """
            equip_params = [start_of_day, end_of_day]
        
        equip_result = await execute_raw_query(equip_query, equip_params)
        
        temp_data = temp_result[0] if temp_result else {}
        humid_data = humid_result[0] if humid_result else {}
        pue_data = pue_result[0] if pue_result else {}
        power_data = power_result[0] if power_result else {}
        equip_data = equip_result[0] if equip_result else {}
        
        return {
            "report_type": "daily_summary",
            "date": target_date.strftime("%Y-%m-%d"),
            "site_code": site_code,
            "generated_at": datetime.now().isoformat(),
            "equipment_count": equip_data.get('equipment_count', 0),
            "temperature": {
                "average": round(temp_data.get('avg_temp'), 2) if temp_data.get('avg_temp') else None,
                "minimum": round(temp_data.get('min_temp'), 2) if temp_data.get('min_temp') else None,
                "maximum": round(temp_data.get('max_temp'), 2) if temp_data.get('max_temp') else None,
                "readings": temp_data.get('readings', 0),
                "unit": "°C"
            },
            "humidity": {
                "average": round(humid_data.get('avg_humid'), 2) if humid_data.get('avg_humid') else None,
                "minimum": round(humid_data.get('min_humid'), 2) if humid_data.get('min_humid') else None,
                "maximum": round(humid_data.get('max_humid'), 2) if humid_data.get('max_humid') else None,
                "readings": humid_data.get('readings', 0),
                "unit": "%RH"
            },
            "pue": {
                "average": round(pue_data.get('avg_pue'), 3) if pue_data.get('avg_pue') else None,
                "minimum": round(pue_data.get('min_pue'), 3) if pue_data.get('min_pue') else None,
                "maximum": round(pue_data.get('max_pue'), 3) if pue_data.get('max_pue') else None
            },
            "power": {
                "average_kw": round(power_data.get('avg_power'), 2) if power_data.get('avg_power') else None,
                "minimum_kw": round(power_data.get('min_power'), 2) if power_data.get('min_power') else None,
                "maximum_kw": round(power_data.get('max_power'), 2) if power_data.get('max_power') else None,
                "estimated_daily_kwh": round(power_data.get('estimated_daily_kwh'), 2) if power_data.get('estimated_daily_kwh') else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating daily summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานสรุปรายวัน: {str(e)}"
        )


# =====================================================
# REDESIGNED REPORTS - Based on Actual Equipment Data
# =====================================================

@router.get("/reports/room-environment")
async def get_room_environment_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานสภาพแวดล้อมห้อง (Room Environment Report)
    ข้อมูลจาก Multi-Func Sensor1 (หน้าห้อง) และ Sensor2 (หลังห้อง)
    รวมอุณหภูมิและความชื้น
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Query for both sensors - front and back of room
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            GROUP BY site_code, equipment_name, performance_data, bucket
            ORDER BY site_code, equipment_name, performance_data, bucket;
            """
            params = [from_time, site_code]
        else:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_value,
                MIN(value_numeric) as min_value,
                MAX(value_numeric) as max_value
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            GROUP BY site_code, equipment_name, performance_data, bucket
            ORDER BY site_code, equipment_name, performance_data, bucket;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        # Current values query
        if site_code:
            current_query = """
            SELECT DISTINCT ON (site_code, equipment_name, performance_data)
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND site_code = $1
            AND value_numeric IS NOT NULL
            ORDER BY site_code, equipment_name, performance_data, statistical_start_time DESC;
            """
            current_params = [site_code]
        else:
            current_query = """
            SELECT DISTINCT ON (site_code, equipment_name, performance_data)
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND value_numeric IS NOT NULL
            ORDER BY site_code, equipment_name, performance_data, statistical_start_time DESC;
            """
            current_params = []
        
        current_results = await execute_raw_query(current_query, current_params)
        
        # Organize data by site and sensor
        sensors = {}
        for r in current_results:
            site = r.get('site_code', 'unknown')
            sensor_name = r.get('equipment_name', '')
            sensor_type = 'front' if 'Sensor1' in sensor_name else 'back'
            metric = r.get('metric', '')
            
            if site not in sensors:
                sensors[site] = {'front': {}, 'back': {}}
            
            if 'Temperature' in metric:
                sensors[site][sensor_type]['temperature'] = {
                    'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                    'unit': '°C'
                }
            elif 'Humidity' in metric:
                sensors[site][sensor_type]['humidity'] = {
                    'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                    'unit': '%RH'
                }
        
        # Organize trend data
        trends = {'temperature': {'front': [], 'back': []}, 'humidity': {'front': [], 'back': []}}
        for r in results:
            sensor_name = r.get('equipment_name', '')
            sensor_type = 'front' if 'Sensor1' in sensor_name else 'back'
            metric = r.get('metric', '')
            
            data_point = {
                'timestamp': r.get('bucket').isoformat() if r.get('bucket') else None,
                'avg': round(r.get('avg_value'), 2) if r.get('avg_value') else None,
                'min': round(r.get('min_value'), 2) if r.get('min_value') else None,
                'max': round(r.get('max_value'), 2) if r.get('max_value') else None,
                'site': r.get('site_code')
            }
            
            if 'Temperature' in metric:
                trends['temperature'][sensor_type].append(data_point)
            elif 'Humidity' in metric:
                trends['humidity'][sensor_type].append(data_point)
        
        return {
            "report_type": "room_environment",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "current_values": sensors,
            "trends": trends,
            "thresholds": {
                "temperature": {"warning": 28, "critical": 30, "unit": "°C"},
                "humidity": {"warning": 60, "critical": 70, "unit": "%RH"}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating room environment report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานสภาพแวดล้อมห้อง: {str(e)}"
        )


@router.get("/reports/room-environment/export")
async def get_room_environment_export(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export ข้อมูลดิบสภาพแวดล้อมห้อง (Raw data export)
    Returns all individual records for the time period, not aggregated data.
    Used for PDF/Excel export requiring all data points.
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Query for raw records - not aggregated
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, equipment_name, performance_data;
            """
            params = [from_time, site_code]
        else:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name ILIKE '%Multi-Func Sensor%'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, site_code, equipment_name, performance_data;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        # Format records for export
        records = []
        for r in results:
            sensor_name = r.get('equipment_name', '')
            sensor_location = 'Front' if 'Sensor1' in sensor_name else 'Back'
            metric = r.get('metric', '')
            metric_type = 'Temperature' if 'Temperature' in metric else 'Humidity' if 'Humidity' in metric else 'Other'
            
            records.append({
                'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                'site': r.get('site_code'),
                'sensor': sensor_name,
                'location': sensor_location,
                'metric': metric_type,
                'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                'unit': '°C' if metric_type == 'Temperature' else '%RH' if metric_type == 'Humidity' else r.get('unit')
            })
        
        return {
            "report_type": "room_environment_export",
            "time_period": f"{hours} hours",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "total_records": len(records),
            "records": records
        }
        
    except Exception as e:
        logger.error(f"Error generating room environment export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถ export ข้อมูลสภาพแวดล้อมห้อง: {str(e)}"
        )

@router.get("/reports/power-system")
async def get_power_system_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    days: int = Query(7, description="ข้อมูลย้อนหลัง (วัน)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานภาพรวมระบบไฟฟ้า (Power System Overview)
    ข้อมูลจาก System-ECC800: PUE, การใช้ไฟ IT/Aircon/Module, Total Energy
    """
    try:
        from_time = datetime.now() - timedelta(days=days)
        
        # Current values
        if site_code:
            current_query = """
            SELECT DISTINCT ON (site_code, performance_data)
                site_code,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND equipment_name NOT LIKE '%Power Module%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND site_code = $1
            AND value_numeric IS NOT NULL
            ORDER BY site_code, performance_data, statistical_start_time DESC;
            """
            current_params = [site_code]
        else:
            current_query = """
            SELECT DISTINCT ON (site_code, performance_data)
                site_code,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND equipment_name NOT LIKE '%Power Module%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND value_numeric IS NOT NULL
            ORDER BY site_code, performance_data, statistical_start_time DESC;
            """
            current_params = []
        
        current_results = await execute_raw_query(current_query, current_params)
        
        # Organize current values by site
        power_data = {}
        for r in current_results:
            site = r.get('site_code', 'unknown')
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit = r.get('unit', '')
            
            if site not in power_data:
                power_data[site] = {}
            
            if 'PUE (hour)' in metric:
                power_data[site]['pue_hourly'] = {'value': round(value, 3) if value else None, 'unit': ''}
            elif 'PUE (day)' in metric:
                power_data[site]['pue_daily'] = {'value': round(value, 3) if value else None, 'unit': ''}
            elif 'Power (day)' in metric:
                power_data[site]['power_daily'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'IT accumulate electric' in metric:
                power_data[site]['it_energy'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Aircon accumulate electric' in metric:
                power_data[site]['aircon_energy'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Module accumulate electric' in metric:
                power_data[site]['module_energy'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Total system input electrical energy (day)' in metric:
                power_data[site]['total_input_daily'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Total system input electrical energy (hour)' in metric:
                power_data[site]['total_input_hourly'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Total electrical energy of system IT load' in metric:
                power_data[site]['it_load_output'] = {'value': round(value, 2) if value else None, 'unit': unit}
        
        # PUE Trend
        if site_code:
            pue_trend_query = """
            SELECT 
                site_code,
                time_bucket('1 day', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_pue
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND performance_data = 'PUE (hour)'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            AND value_numeric > 0 AND value_numeric < 10
            GROUP BY site_code, bucket
            ORDER BY bucket;
            """
            pue_params = [from_time, site_code]
        else:
            pue_trend_query = """
            SELECT 
                site_code,
                time_bucket('1 day', statistical_start_time) as bucket,
                AVG(value_numeric) as avg_pue
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND performance_data = 'PUE (hour)'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            AND value_numeric > 0 AND value_numeric < 10
            GROUP BY site_code, bucket
            ORDER BY bucket;
            """
            pue_params = [from_time]
        
        pue_results = await execute_raw_query(pue_trend_query, pue_params)
        
        pue_trend = [
            {
                'date': r.get('bucket').isoformat() if r.get('bucket') else None,
                'pue': round(r.get('avg_pue'), 3) if r.get('avg_pue') else None,
                'site': r.get('site_code')
            }
            for r in pue_results
        ]
        
        # Energy Trend
        if site_code:
            energy_trend_query = """
            SELECT 
                time_bucket('1 day', statistical_start_time) as bucket,
                SUM(CASE WHEN performance_data ILIKE '%IT accumulate%' THEN value_numeric ELSE 0 END) as it_energy,
                SUM(CASE WHEN performance_data ILIKE '%Aircon accumulate%' THEN value_numeric ELSE 0 END) as aircon_energy
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            energy_params = [from_time, site_code]
        else:
            energy_trend_query = """
            SELECT 
                time_bucket('1 day', statistical_start_time) as bucket,
                SUM(CASE WHEN performance_data ILIKE '%IT accumulate%' THEN value_numeric ELSE 0 END) as it_energy,
                SUM(CASE WHEN performance_data ILIKE '%Aircon accumulate%' THEN value_numeric ELSE 0 END) as aircon_energy
            FROM public.performance_data
            WHERE equipment_name ILIKE '%ECC800%'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            GROUP BY bucket
            ORDER BY bucket;
            """
            energy_params = [from_time]
        
        energy_results = await execute_raw_query(energy_trend_query, energy_params)
        
        energy_trend = [
            {
                'date': r.get('bucket').isoformat() if r.get('bucket') else None,
                'it_energy': round(r.get('it_energy'), 2) if r.get('it_energy') else 0,
                'aircon_energy': round(r.get('aircon_energy'), 2) if r.get('aircon_energy') else 0
            }
            for r in energy_results
        ]
        
        return {
            "report_type": "power_system",
            "time_period": f"ล่าสุด {days} วัน",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "current_values": power_data,
            "pue_trend": pue_trend,
            "energy_trend": energy_trend,
            "pue_benchmarks": {
                "excellent": 1.4,
                "good": 1.6,
                "average": 2.0
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating power system report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานระบบไฟฟ้า: {str(e)}"
        )


@router.get("/reports/ups")
async def get_ups_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานเครื่องสำรองไฟ UPS (UPS Report)
    ข้อมูลจาก Power Distribution-Integrated UPS Cabinet1
    รวม Input/Output metrics, Battery, Load
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Main UPS metrics (not circuit breakers)
        if site_code:
            main_query = """
            SELECT DISTINCT ON (site_code, performance_data)
                site_code,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS Cabinet%'
            AND performance_data NOT LIKE '1QF%'
            AND performance_data NOT LIKE '2QF%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND site_code = $1
            ORDER BY site_code, performance_data, statistical_start_time DESC;
            """
            main_params = [site_code]
        else:
            main_query = """
            SELECT DISTINCT ON (site_code, performance_data)
                site_code,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS Cabinet%'
            AND performance_data NOT LIKE '1QF%'
            AND performance_data NOT LIKE '2QF%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            ORDER BY site_code, performance_data, statistical_start_time DESC;
            """
            main_params = []
        
        main_results = await execute_raw_query(main_query, main_params)
        
        # Organize by site
        ups_data = {}
        for r in main_results:
            site = r.get('site_code', 'unknown')
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit = r.get('unit', '')
            
            if site not in ups_data:
                ups_data[site] = {
                    'input': {},
                    'output': {},
                    'battery': {},
                    'status': {}
                }
            
            # Categorize metrics
            if 'Input total active power' in metric:
                ups_data[site]['input']['total_power'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Input frequency' in metric:
                ups_data[site]['input']['frequency'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Battery capacity' in metric:
                ups_data[site]['battery']['capacity'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Battery temperature' in metric:
                ups_data[site]['battery']['temperature'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Battery voltage' in metric:
                ups_data[site]['battery']['voltage'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Ph. A output active power' in metric:
                ups_data[site]['output']['phase_a_power'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Ph. B output active power' in metric:
                ups_data[site]['output']['phase_b_power'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Ph. C output active power' in metric:
                ups_data[site]['output']['phase_c_power'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'Ph. A output load ratio' in metric:
                ups_data[site]['output']['phase_a_load'] = {'value': round(value, 2) if value else None, 'unit': '%'}
            elif 'Ph. B output load ratio' in metric:
                ups_data[site]['output']['phase_b_load'] = {'value': round(value, 2) if value else None, 'unit': '%'}
            elif 'Ph. C output load ratio' in metric:
                ups_data[site]['output']['phase_c_load'] = {'value': round(value, 2) if value else None, 'unit': '%'}
            elif 'Output frequency' in metric:
                ups_data[site]['output']['frequency'] = {'value': round(value, 2) if value else None, 'unit': unit}
            elif 'UPS running status' in metric:
                ups_data[site]['status']['running'] = {'value': value, 'unit': ''}
            elif 'Power supply status' in metric:
                ups_data[site]['status']['power_supply'] = {'value': value, 'unit': ''}
        
        # Circuit breaker summary
        if site_code:
            cb_query = """
            SELECT 
                site_code,
                SUBSTRING(performance_data FROM 1 FOR 5) as breaker,
                performance_data,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS Cabinet%'
            AND (performance_data LIKE '1QF%' OR performance_data LIKE '2QF%')
            AND performance_data LIKE '%power%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND site_code = $1
            AND value_numeric IS NOT NULL
            GROUP BY site_code, SUBSTRING(performance_data FROM 1 FOR 5), performance_data
            ORDER BY breaker;
            """
            cb_params = [site_code]
        else:
            cb_query = """
            SELECT 
                site_code,
                SUBSTRING(performance_data FROM 1 FOR 5) as breaker,
                performance_data,
                AVG(value_numeric) as avg_value
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS Cabinet%'
            AND (performance_data LIKE '1QF%' OR performance_data LIKE '2QF%')
            AND performance_data LIKE '%power%'
            AND statistical_start_time >= NOW() - INTERVAL '1 hour'
            AND value_numeric IS NOT NULL
            GROUP BY site_code, SUBSTRING(performance_data FROM 1 FOR 5), performance_data
            ORDER BY breaker;
            """
            cb_params = []
        
        cb_results = await execute_raw_query(cb_query, cb_params)
        
        circuit_breakers = {}
        for r in cb_results:
            site = r.get('site_code', 'unknown')
            breaker = r.get('breaker', '')
            value = r.get('avg_value')
            
            if site not in circuit_breakers:
                circuit_breakers[site] = []
            
            cb_exists = next((cb for cb in circuit_breakers[site] if cb['breaker'] == breaker), None)
            if not cb_exists:
                circuit_breakers[site].append({
                    'breaker': breaker,
                    'power': round(value, 2) if value else 0
                })
        
        return {
            "report_type": "ups",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "ups_status": ups_data,
            "circuit_breakers": circuit_breakers,
            "thresholds": {
                "battery_capacity": {"warning": 80, "critical": 50, "unit": "%"},
                "load_ratio": {"warning": 70, "critical": 90, "unit": "%"}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating UPS report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงาน UPS: {str(e)}"
        )


@router.get("/reports/cooling")
async def get_cooling_system_report(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานระบบปรับอากาศ (Cooling System Report)
    ข้อมูลจาก Cooling-NetCol5000 (DC=3 units, DR=2 units)
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Get current values for all cooling units
        if site_code:
            current_query = """
            SELECT DISTINCT ON (site_code, equipment_name, performance_data)
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%NetCol5000%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND site_code = $1
            AND value_numeric IS NOT NULL
            ORDER BY site_code, equipment_name, performance_data, statistical_start_time DESC;
            """
            current_params = [site_code]
        else:
            current_query = """
            SELECT DISTINCT ON (site_code, equipment_name, performance_data)
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time
            FROM public.performance_data
            WHERE equipment_name ILIKE '%NetCol5000%'
            AND statistical_start_time >= NOW() - INTERVAL '2 hours'
            AND value_numeric IS NOT NULL
            ORDER BY site_code, equipment_name, performance_data, statistical_start_time DESC;
            """
            current_params = []
        
        current_results = await execute_raw_query(current_query, current_params)
        
        # Organize by site and unit
        cooling_units = {}
        for r in current_results:
            site = r.get('site_code', 'unknown')
            unit_name = r.get('equipment_name', '')
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit = r.get('unit', '')
            
            if site not in cooling_units:
                cooling_units[site] = {}
            
            if unit_name not in cooling_units[site]:
                cooling_units[site][unit_name] = {
                    'temperature': {},
                    'humidity': {},
                    'power': {},
                    'status': {}
                }
            
            # Key metrics
            if 'Supply-air average temperature' in metric:
                cooling_units[site][unit_name]['temperature']['supply_air'] = round(value, 2) if value else None
            elif 'Return-air average temperature' in metric:
                cooling_units[site][unit_name]['temperature']['return_air'] = round(value, 2) if value else None
            elif 'Cold-aisle average temperature' in metric:
                cooling_units[site][unit_name]['temperature']['cold_aisle'] = round(value, 2) if value else None
            elif 'Hot-aisle average temperature' in metric:
                cooling_units[site][unit_name]['temperature']['hot_aisle'] = round(value, 2) if value else None
            elif 'Outdoor temperature' in metric:
                cooling_units[site][unit_name]['temperature']['outdoor'] = round(value, 2) if value else None
            elif 'Current humidity' in metric:
                cooling_units[site][unit_name]['humidity']['current'] = round(value, 2) if value else None
            elif 'Supply-air average humidity' in metric:
                cooling_units[site][unit_name]['humidity']['supply_air'] = round(value, 2) if value else None
            elif 'Return-air average humidity' in metric:
                cooling_units[site][unit_name]['humidity']['return_air'] = round(value, 2) if value else None
            elif metric == 'Power':
                cooling_units[site][unit_name]['power']['current'] = round(value, 2) if value else None
            elif 'Electricity' in metric:
                cooling_units[site][unit_name]['power']['electricity'] = round(value, 2) if value else None
            elif 'Compressor run status' in metric:
                cooling_units[site][unit_name]['status']['compressor'] = round(value, 0) if value else 0
            elif 'Indoor fan control status' in metric:
                cooling_units[site][unit_name]['status']['indoor_fan'] = round(value, 0) if value else 0
            elif 'On/Off status' in metric:
                cooling_units[site][unit_name]['status']['on_off'] = value
        
        # Summary by site
        summary = {}
        for site, units in cooling_units.items():
            summary[site] = {
                'unit_count': len(units),
                'total_power': sum(
                    u.get('power', {}).get('current', 0) or 0 
                    for u in units.values()
                ),
                'avg_supply_temp': None,
                'avg_return_temp': None
            }
            
            supply_temps = [
                u.get('temperature', {}).get('supply_air') 
                for u in units.values() 
                if u.get('temperature', {}).get('supply_air') is not None
            ]
            return_temps = [
                u.get('temperature', {}).get('return_air') 
                for u in units.values() 
                if u.get('temperature', {}).get('return_air') is not None
            ]
            
            if supply_temps:
                summary[site]['avg_supply_temp'] = round(sum(supply_temps) / len(supply_temps), 2)
            if return_temps:
                summary[site]['avg_return_temp'] = round(sum(return_temps) / len(return_temps), 2)
        
        # Temperature trends
        if site_code:
            trend_query = """
            SELECT 
                equipment_name,
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(CASE WHEN performance_data = 'Supply-air average temperature' THEN value_numeric END) as supply_temp,
                AVG(CASE WHEN performance_data = 'Return-air average temperature' THEN value_numeric END) as return_temp,
                AVG(CASE WHEN performance_data = 'Power' THEN value_numeric END) as power
            FROM public.performance_data
            WHERE equipment_name ILIKE '%NetCol5000%'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            GROUP BY equipment_name, bucket
            ORDER BY equipment_name, bucket;
            """
            trend_params = [from_time, site_code]
        else:
            trend_query = """
            SELECT 
                site_code,
                equipment_name,
                time_bucket('1 hour', statistical_start_time) as bucket,
                AVG(CASE WHEN performance_data = 'Supply-air average temperature' THEN value_numeric END) as supply_temp,
                AVG(CASE WHEN performance_data = 'Return-air average temperature' THEN value_numeric END) as return_temp,
                AVG(CASE WHEN performance_data = 'Power' THEN value_numeric END) as power
            FROM public.performance_data
            WHERE equipment_name ILIKE '%NetCol5000%'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            GROUP BY site_code, equipment_name, bucket
            ORDER BY site_code, equipment_name, bucket;
            """
            trend_params = [from_time]
        
        trend_results = await execute_raw_query(trend_query, trend_params)
        
        trends = [
            {
                'timestamp': r.get('bucket').isoformat() if r.get('bucket') else None,
                'unit': r.get('equipment_name'),
                'site': r.get('site_code', site_code),
                'supply_temp': round(r.get('supply_temp'), 2) if r.get('supply_temp') else None,
                'return_temp': round(r.get('return_temp'), 2) if r.get('return_temp') else None,
                'power': round(r.get('power'), 2) if r.get('power') else None
            }
            for r in trend_results
        ]
        
        return {
            "report_type": "cooling_system",
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "site_code": site_code,
            "summary": summary,
            "units": cooling_units,
            "trends": trends,
            "thresholds": {
                "supply_temp": {"target": 18, "warning": 22, "critical": 25, "unit": "°C"},
                "return_temp": {"target": 24, "warning": 28, "critical": 32, "unit": "°C"}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating cooling system report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานระบบปรับอากาศ: {str(e)}"
        )


# Cabinet mapping configuration
CABINET_MAPPING = {
    "DC": [
        {"name": "IT1", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor1", "power": "Cabinet-IT Cabinet101"},
        {"name": "IT2", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor2", "power": "Cabinet-IT Cabinet102"},
        {"name": "IT3", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor3", "power": "Cabinet-IT Cabinet103"},
        {"name": "IT4", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor4", "power": "Cabinet-IT Cabinet104"},
        {"name": "IT5", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor5", "power": "Cabinet-IT Cabinet105"},
        {"name": "IT6", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor13", "power": "Cabinet-IT Cabinet106"},
        {"name": "IT7", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor12", "power": "Cabinet-IT Cabinet107"},
        {"name": "IT8", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor11", "power": "Cabinet-IT Cabinet108"},
        {"name": "IT9", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor10", "power": "Cabinet-IT Cabinet109"},
        {"name": "IT10", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor9", "power": "Cabinet-IT Cabinet110"},
        {"name": "Network1", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor7", "power": "Net Cabinet1"},
        {"name": "Network2", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor6", "power": "Net Cabinet2"},
        {"name": "Network3", "th_sensor": "Aisle-T/H Sensor Group-T/H Sensor8", "power": "Net Cabinet3"},
    ],
    "DR": [
        {"name": "IT1", "th_sensor": "Aisle-T/H Sensor Group-TH#1", "power": "Cabinet-IT Cabinet101"},
        {"name": "IT2", "th_sensor": "Aisle-T/H Sensor Group-TH#2", "power": "Cabinet-IT Cabinet102"},
        {"name": "IT4", "th_sensor": "Aisle-T/H Sensor Group-TH#8", "power": "Cabinet-IT Cabinet104"},
        {"name": "IT5", "th_sensor": "Aisle-T/H Sensor Group-TH#7", "power": "Cabinet-IT Cabinet105"},
        {"name": "Network1", "th_sensor": "Aisle-T/H Sensor Group-TH#5", "power": "Net Cabinet1"},
        {"name": "Network2", "th_sensor": "Aisle-T/H Sensor Group-TH#4", "power": "Net Cabinet2"},
        {"name": "Network3", "th_sensor": "Aisle-T/H Sensor Group-TH#6", "power": "Net Cabinet3"},
    ]
}


@router.get("/reports/cabinets-data")
async def get_cabinets_data_report(
    site_code: str = Query(..., description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานข้อมูลตามตู้ (Cabinet Data Report)
    ดึงอุณหภูมิ ความชื้น และการใช้ไฟฟ้าของแต่ละตู้ตาม mapping ที่กำหนด
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        mapping = CABINET_MAPPING.get(site_code.upper(), [])
        
        cabinets_data = []
        
        for cabinet in mapping:
            cabinet_info = {
                "name": cabinet["name"],
                "th_sensor_name": cabinet["th_sensor"],
                "power_equipment": cabinet["power"],
                "temperature": None,
                "humidity": None,
                "power": None,
                "energy": None
            }
            
            # Query temperature and humidity from T/H sensor
            th_query = """
            SELECT DISTINCT ON (performance_data)
                performance_data,
                value_numeric,
                unit
            FROM public.performance_data
            WHERE equipment_name = $1
            AND site_code = $2
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            ORDER BY performance_data, statistical_start_time DESC;
            """
            th_results = await execute_raw_query(th_query, [cabinet["th_sensor"], site_code.upper(), from_time])
            
            for r in th_results:
                metric = r.get('performance_data', '')
                value = r.get('value_numeric')
                if 'Temperature' in metric and value is not None:
                    cabinet_info["temperature"] = round(float(value), 1)
                elif 'Humidity' in metric and value is not None:
                    cabinet_info["humidity"] = round(float(value), 1)
            
            # Query power from cabinet equipment
            power_query = """
            SELECT DISTINCT ON (performance_data)
                performance_data,
                value_numeric,
                unit
            FROM public.performance_data
            WHERE equipment_name = $1
            AND site_code = $2
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            ORDER BY performance_data, statistical_start_time DESC;
            """
            power_results = await execute_raw_query(power_query, [cabinet["power"], site_code.upper(), from_time])
            
            for r in power_results:
                metric = r.get('performance_data', '').lower()
                value = r.get('value_numeric')
                if value is not None:
                    if 'power' in metric and 'total' not in metric:
                        cabinet_info["power"] = round(float(value), 2)
                    elif 'energy' in metric or 'electric' in metric:
                        cabinet_info["energy"] = round(float(value), 2)
            
            cabinets_data.append(cabinet_info)
        
        # Calculate summary statistics
        temps = [c["temperature"] for c in cabinets_data if c["temperature"] is not None]
        humids = [c["humidity"] for c in cabinets_data if c["humidity"] is not None]
        powers = [c["power"] for c in cabinets_data if c["power"] is not None]
        
        summary = {
            "total_cabinets": len(cabinets_data),
            "avg_temperature": round(sum(temps) / len(temps), 1) if temps else None,
            "max_temperature": round(max(temps), 1) if temps else None,
            "min_temperature": round(min(temps), 1) if temps else None,
            "avg_humidity": round(sum(humids) / len(humids), 1) if humids else None,
            "total_power": round(sum(powers), 2) if powers else None
        }
        
        return {
            "report_type": "cabinets_data",
            "site_code": site_code.upper(),
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "summary": summary,
            "cabinets": cabinets_data,
            "thresholds": {
                "temperature": {"warning": 28, "critical": 32, "unit": "°C"},
                "humidity": {"warning": 60, "critical": 70, "unit": "%RH"}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating cabinets data report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานข้อมูลตู้: {str(e)}"
        )


@router.get("/reports/ecc800-full")
async def get_ecc800_full_report(
    site_code: str = Query(..., description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานข้อมูล System-ECC800 แบบครบถ้วน
    รวม PUE, Energy breakdown, Power Module data
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Get all ECC800 metrics
        query = """
        SELECT DISTINCT ON (equipment_name, performance_data)
            equipment_name,
            performance_data as metric,
            value_numeric,
            unit,
            statistical_start_time
        FROM public.performance_data
        WHERE equipment_name ILIKE '%ECC800%'
        AND site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '2 hours'
        AND value_numeric IS NOT NULL
        ORDER BY equipment_name, performance_data, statistical_start_time DESC;
        """
        results = await execute_raw_query(query, [site_code.upper()])
        
        # Organize data
        main_metrics = {}
        power_modules = {}
        
        for r in results:
            equip = r.get('equipment_name', '')
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit = r.get('unit', '')
            
            if 'Power Module' in equip:
                module_name = equip.split('-')[-1] if '-' in equip else equip
                if module_name not in power_modules:
                    power_modules[module_name] = {}
                power_modules[module_name][metric] = {
                    'value': round(float(value), 2) if value else None,
                    'unit': unit
                }
            else:
                main_metrics[metric] = {
                    'value': round(float(value), 3) if value else None,
                    'unit': unit
                }
        
        # Get trends
        trend_query = """
        SELECT 
            time_bucket('1 hour', statistical_start_time) as bucket,
            AVG(CASE WHEN performance_data = 'PUE (hour)' THEN value_numeric END) as pue,
            AVG(CASE WHEN performance_data ILIKE '%IT accumulate%' THEN value_numeric END) as it_energy,
            AVG(CASE WHEN performance_data ILIKE '%Aircon accumulate%' THEN value_numeric END) as aircon_energy,
            AVG(CASE WHEN performance_data ILIKE '%Module accumulate%' THEN value_numeric END) as module_energy
        FROM public.performance_data
        WHERE equipment_name = 'System-ECC800'
        AND site_code = $1
        AND statistical_start_time >= $2
        AND value_numeric IS NOT NULL
        GROUP BY bucket
        ORDER BY bucket;
        """
        trend_results = await execute_raw_query(trend_query, [site_code.upper(), from_time])
        
        trends = [
            {
                'timestamp': r.get('bucket').isoformat() if r.get('bucket') else None,
                'pue': round(float(r.get('pue')), 3) if r.get('pue') else None,
                'it_energy': round(float(r.get('it_energy')), 2) if r.get('it_energy') else None,
                'aircon_energy': round(float(r.get('aircon_energy')), 2) if r.get('aircon_energy') else None,
                'module_energy': round(float(r.get('module_energy')), 2) if r.get('module_energy') else None
            }
            for r in trend_results
        ]
        
        return {
            "report_type": "ecc800_full",
            "site_code": site_code.upper(),
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "main_metrics": main_metrics,
            "power_modules": power_modules,
            "trends": trends,
            "pue_benchmarks": {
                "excellent": {"max": 1.4, "label": "ดีเยี่ยม", "color": "#51cf66"},
                "good": {"max": 1.6, "label": "ดี", "color": "#ffd43b"},
                "average": {"max": 2.0, "label": "ปานกลาง", "color": "#ffa94d"},
                "poor": {"max": 99, "label": "ต้องปรับปรุง", "color": "#ff6b6b"}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating ECC800 full report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงาน ECC800: {str(e)}"
        )


@router.get("/reports/cooling-full")
async def get_cooling_full_report(
    site_code: str = Query(..., description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงานระบบปรับอากาศ NetCol5000 แบบครบถ้วน
    รวมข้อมูลอุณหภูมิ ความชื้น สถานะ กำลังไฟ
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Get all NetCol metrics
        query = """
        SELECT DISTINCT ON (equipment_name, performance_data)
            equipment_name,
            performance_data as metric,
            value_numeric,
            unit,
            statistical_start_time
        FROM public.performance_data
        WHERE equipment_name ILIKE '%NetCol5000%'
        AND site_code = $1
        AND statistical_start_time >= NOW() - INTERVAL '2 hours'
        ORDER BY equipment_name, performance_data, statistical_start_time DESC;
        """
        results = await execute_raw_query(query, [site_code.upper()])
        
        # Organize by unit
        units = {}
        for r in results:
            unit_name = r.get('equipment_name', '')
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit_str = r.get('unit', '')
            
            if unit_name not in units:
                units[unit_name] = {
                    'temperature': {},
                    'humidity': {},
                    'power': {},
                    'status': {},
                    'voltage': {}
                }
            
            val = round(float(value), 2) if value else None
            
            # Categorize metrics
            if 'temperature' in metric.lower():
                if 'Supply' in metric:
                    units[unit_name]['temperature']['supply_air'] = val
                elif 'Return' in metric:
                    units[unit_name]['temperature']['return_air'] = val
                elif 'Cold' in metric:
                    units[unit_name]['temperature']['cold_aisle'] = val
                elif 'Hot' in metric:
                    units[unit_name]['temperature']['hot_aisle'] = val
                elif 'Outdoor' in metric:
                    units[unit_name]['temperature']['outdoor'] = val
                elif 'Current' in metric:
                    units[unit_name]['temperature']['current'] = val
            elif 'humidity' in metric.lower():
                if 'Supply' in metric:
                    units[unit_name]['humidity']['supply_air'] = val
                elif 'Return' in metric:
                    units[unit_name]['humidity']['return_air'] = val
                elif 'Cold' in metric:
                    units[unit_name]['humidity']['cold_aisle'] = val
                elif 'Hot' in metric:
                    units[unit_name]['humidity']['hot_aisle'] = val
                elif 'Current' in metric:
                    units[unit_name]['humidity']['current'] = val
            elif metric == 'Power':
                units[unit_name]['power']['current'] = val
            elif 'Electricity' in metric:
                units[unit_name]['power']['electricity'] = val
            elif 'Phase current' in metric:
                units[unit_name]['power']['phase_current'] = val
            elif 'Compressor' in metric:
                units[unit_name]['status']['compressor_rpm'] = val
            elif 'Indoor fan' in metric:
                units[unit_name]['status']['indoor_fan_pct'] = val
            elif 'Outdoor fan' in metric:
                units[unit_name]['status']['outdoor_fan_pct'] = val
            elif 'EEV' in metric:
                units[unit_name]['status']['eev_step'] = val
            elif 'voltage' in metric.lower():
                if 'A-B' in metric:
                    units[unit_name]['voltage']['ab'] = val
                elif 'B-C' in metric:
                    units[unit_name]['voltage']['bc'] = val
                elif 'C-A' in metric:
                    units[unit_name]['voltage']['ca'] = val
        
        # Calculate summary
        outdoor_temps = []
        supply_temps = []
        return_temps = []
        total_power = 0
        
        for unit_data in units.values():
            if unit_data['temperature'].get('outdoor'):
                outdoor_temps.append(unit_data['temperature']['outdoor'])
            if unit_data['temperature'].get('supply_air'):
                supply_temps.append(unit_data['temperature']['supply_air'])
            if unit_data['temperature'].get('return_air'):
                return_temps.append(unit_data['temperature']['return_air'])
            # Try 'current' first, then 'electricity' for power
            unit_power = unit_data['power'].get('current') or unit_data['power'].get('electricity') or 0
            total_power += unit_power
        
        summary = {
            'unit_count': len(units),
            'avg_outdoor_temp': round(sum(outdoor_temps) / len(outdoor_temps), 1) if outdoor_temps else None,
            'avg_supply_temp': round(sum(supply_temps) / len(supply_temps), 1) if supply_temps else None,
            'avg_return_temp': round(sum(return_temps) / len(return_temps), 1) if return_temps else None,
            'total_power': round(total_power, 2)
        }
        
        return {
            "report_type": "cooling_full",
            "site_code": site_code.upper(),
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "summary": summary,
            "units": units,
            "thresholds": {
                "supply_temp": {"target": 18, "warning": 22, "critical": 25},
                "return_temp": {"target": 24, "warning": 28, "critical": 32}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating cooling full report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงานระบบปรับอากาศ: {str(e)}"
        )


@router.get("/reports/ups-full")
async def get_ups_full_report(
    site_code: str = Query(..., description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รายงาน UPS Cabinet แบบครบถ้วน
    แบ่งเป็น: Battery, Input, Output, Environment
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Get all UPS metrics (exclude circuit breakers for main view)
        query = """
        SELECT DISTINCT ON (performance_data)
            performance_data as metric,
            value_numeric,
            unit,
            statistical_start_time
        FROM public.performance_data
        WHERE equipment_name ILIKE '%UPS Cabinet%'
        AND site_code = $1
        AND performance_data NOT LIKE '1QF%'
        AND performance_data NOT LIKE '2QF%'
        AND performance_data NOT LIKE '3QF%'
        AND statistical_start_time >= NOW() - INTERVAL '2 hours'
        ORDER BY performance_data, statistical_start_time DESC;
        """
        results = await execute_raw_query(query, [site_code.upper()])
        
        # Organize by category
        battery = {}
        input_data = {}
        output = {}
        environment = {}
        other = {}
        
        for r in results:
            metric = r.get('metric', '')
            value = r.get('value_numeric')
            unit = r.get('unit', '')
            
            val = round(float(value), 2) if value else None
            data = {'value': val, 'unit': unit}
            
            # Clean metric name for key
            key = metric.replace(' ', '_').replace('.', '').lower()
            
            # Categorize by metric content
            metric_lower = metric.lower()
            
            # Battery metrics
            if any(word in metric_lower for word in ['battery', 'backup']):
                battery[key] = data
            # Input metrics (including BPM and THDi/THDu)
            elif any(word in metric_lower for word in ['input', 'mains', 'bpm', 'thdi', 'thdu', 'l1', 'l2', 'l3']) and 'output' not in metric_lower:
                input_data[key] = data
            # Output metrics
            elif 'output' in metric_lower or ('ph.' in metric_lower and 'output' in metric):
                output[key] = data
            # Environment metrics
            elif any(word in metric_lower for word in ['temperature', 'ambient']):
                environment[key] = data
            # Other metrics (status, etc)
            else:
                other[key] = data
        
        # Get circuit breaker summary
        cb_query = """
        SELECT 
            SUBSTRING(performance_data FROM 1 FOR 4) as breaker,
            SUM(CASE WHEN performance_data LIKE '%power%' THEN value_numeric ELSE 0 END) as total_power,
            AVG(CASE WHEN performance_data LIKE '%load factor%' THEN value_numeric END) as avg_load
        FROM public.performance_data
        WHERE equipment_name ILIKE '%UPS Cabinet%'
        AND site_code = $1
        AND (performance_data LIKE '1QF%' OR performance_data LIKE '2QF%' OR performance_data LIKE '3QF%')
        AND statistical_start_time >= NOW() - INTERVAL '1 hour'
        AND value_numeric IS NOT NULL
        GROUP BY SUBSTRING(performance_data FROM 1 FOR 4)
        ORDER BY breaker;
        """
        cb_results = await execute_raw_query(cb_query, [site_code.upper()])
        
        circuit_breakers = [
            {
                'name': r.get('breaker'),
                'power': round(float(r.get('total_power')), 2) if r.get('total_power') else 0,
                'load': round(float(r.get('avg_load')), 1) if r.get('avg_load') else 0
            }
            for r in cb_results
        ]
        
        return {
            "report_type": "ups_full",
            "site_code": site_code.upper(),
            "time_period": f"ล่าสุด {hours} ชั่วโมง",
            "battery": battery,
            "input": input_data,
            "output": output,
            "environment": environment,
            "other": other,
            "circuit_breakers": circuit_breakers,
            "thresholds": {
                "battery_capacity": {"warning": 80, "critical": 50},
                "load_ratio": {"warning": 70, "critical": 90}
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating UPS full report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้างรายงาน UPS: {str(e)}"
        )


# ============================================================================
# EXPORT ENDPOINTS - Return ALL historical records for comprehensive reports
# ============================================================================

@router.get("/reports/cabinets-data/export")
async def get_cabinets_data_export(
    site_code: str = Query(..., description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export ข้อมูลตู้ DC ทั้งหมด (All Cabinet Data Export)
    Returns all individual records for the time period, not just latest values.
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        mapping = CABINET_MAPPING.get(site_code.upper(), [])
        
        all_records = []
        
        for cabinet in mapping:
            # Query all temperature/humidity records for this cabinet
            th_query = """
            SELECT 
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name = $1
            AND site_code = $2
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time;
            """
            th_results = await execute_raw_query(th_query, [cabinet["th_sensor"], site_code.upper(), from_time])
            
            for r in th_results:
                metric = r.get('metric', '')
                metric_type = 'Temperature' if 'Temperature' in metric else 'Humidity' if 'Humidity' in metric else 'Other'
                all_records.append({
                    'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                    'cabinet': cabinet["name"],
                    'sensor': cabinet["th_sensor"],
                    'metric': metric_type,
                    'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                    'unit': '°C' if metric_type == 'Temperature' else '%RH' if metric_type == 'Humidity' else r.get('unit')
                })
            
            # Query all power records for this cabinet
            power_query = """
            SELECT 
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name = $1
            AND site_code = $2
            AND statistical_start_time >= $3
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time;
            """
            power_results = await execute_raw_query(power_query, [cabinet["power"], site_code.upper(), from_time])
            
            for r in power_results:
                metric = r.get('metric', '')
                all_records.append({
                    'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                    'cabinet': cabinet["name"],
                    'sensor': cabinet["power"],
                    'metric': 'Power' if 'power' in metric.lower() else 'Energy' if 'energy' in metric.lower() else metric,
                    'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                    'unit': r.get('unit', 'kW')
                })
        
        return {
            "report_type": "cabinets_data_export",
            "site_code": site_code.upper(),
            "time_period": f"{hours} hours",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "total_records": len(all_records),
            "records": all_records
        }
        
    except Exception as e:
        logger.error(f"Error generating cabinets data export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถ export ข้อมูลตู้ DC: {str(e)}"
        )


@router.get("/reports/power-system/export")
async def get_power_system_export(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export ข้อมูลระบบไฟฟ้าทั้งหมด (All Power System Data Export)
    Returns all power metrics (PUE, IT Power, Aircon, etc.) for the time period.
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Query all power system records
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE (equipment_name ILIKE '%System-ECC800%' 
                   OR equipment_name ILIKE '%PDU%'
                   OR equipment_name ILIKE '%Power%')
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, equipment_name;
            """
            params = [from_time, site_code.upper()]
        else:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE (equipment_name ILIKE '%System-ECC800%' 
                   OR equipment_name ILIKE '%PDU%'
                   OR equipment_name ILIKE '%Power%')
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, site_code, equipment_name;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        records = []
        for r in results:
            metric = r.get('metric', '')
            # Categorize the metric
            category = 'PUE' if 'PUE' in metric else \
                       'IT Power' if 'IT' in metric else \
                       'Cooling' if 'Aircon' in metric or 'CRAC' in metric else \
                       'Total' if 'Total' in metric else 'Other'
            
            records.append({
                'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                'site': r.get('site_code'),
                'equipment': r.get('equipment_name'),
                'category': category,
                'metric': metric,
                'value': round(r.get('value_numeric'), 3) if r.get('value_numeric') else None,
                'unit': r.get('unit')
            })
        
        return {
            "report_type": "power_system_export",
            "site_code": site_code.upper() if site_code else "ALL",
            "time_period": f"{hours} hours",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "total_records": len(records),
            "records": records
        }
        
    except Exception as e:
        logger.error(f"Error generating power system export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถ export ข้อมูลระบบไฟฟ้า: {str(e)}"
        )


@router.get("/reports/cooling/export")
async def get_cooling_export(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export ข้อมูลระบบทำความเย็นทั้งหมด (All Cooling System Data Export)
    Returns all CRAC/PAC metrics for the time period.
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Query all cooling system records
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE (equipment_name ILIKE '%CRAC%' 
                   OR equipment_name ILIKE '%PAC%'
                   OR equipment_name ILIKE '%Cooling%'
                   OR equipment_name ILIKE '%Aircon%')
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, equipment_name;
            """
            params = [from_time, site_code.upper()]
        else:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE (equipment_name ILIKE '%CRAC%' 
                   OR equipment_name ILIKE '%PAC%'
                   OR equipment_name ILIKE '%Cooling%'
                   OR equipment_name ILIKE '%Aircon%')
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, site_code, equipment_name;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        records = []
        for r in results:
            metric = r.get('metric', '')
            # Categorize
            category = 'Temperature' if 'Temp' in metric else \
                       'Humidity' if 'Humid' in metric else \
                       'Status' if 'Status' in metric or 'Running' in metric else \
                       'Setpoint' if 'Setpoint' in metric or 'Set' in metric else 'Other'
            
            records.append({
                'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                'site': r.get('site_code'),
                'equipment': r.get('equipment_name'),
                'category': category,
                'metric': metric,
                'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                'unit': r.get('unit')
            })
        
        return {
            "report_type": "cooling_export",
            "site_code": site_code.upper() if site_code else "ALL",
            "time_period": f"{hours} hours",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "total_records": len(records),
            "records": records
        }
        
    except Exception as e:
        logger.error(f"Error generating cooling export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถ export ข้อมูลระบบทำความเย็น: {str(e)}"
        )


@router.get("/reports/ups/export")
async def get_ups_export(
    site_code: Optional[str] = Query(None, description="รหัสไซต์ (DC/DR)"),
    hours: int = Query(24, description="ข้อมูลย้อนหลัง (ชั่วโมง)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export ข้อมูล UPS ทั้งหมด (All UPS Data Export)
    Returns all UPS metrics (battery, load, input, output) for the time period.
    """
    try:
        from_time = datetime.now() - timedelta(hours=hours)
        
        # Query all UPS records
        if site_code:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS%'
            AND statistical_start_time >= $1
            AND site_code = $2
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, equipment_name;
            """
            params = [from_time, site_code.upper()]
        else:
            query = """
            SELECT 
                site_code,
                equipment_name,
                performance_data as metric,
                value_numeric,
                unit,
                statistical_start_time as timestamp
            FROM public.performance_data
            WHERE equipment_name ILIKE '%UPS%'
            AND statistical_start_time >= $1
            AND value_numeric IS NOT NULL
            ORDER BY statistical_start_time, site_code, equipment_name;
            """
            params = [from_time]
        
        results = await execute_raw_query(query, params)
        
        records = []
        for r in results:
            metric = r.get('metric', '')
            # Categorize UPS metrics
            category = 'Battery' if 'Battery' in metric or 'Capacity' in metric else \
                       'Load' if 'Load' in metric else \
                       'Input' if 'Input' in metric else \
                       'Output' if 'Output' in metric else \
                       'Temperature' if 'Temp' in metric else 'Other'
            
            records.append({
                'timestamp': r.get('timestamp').isoformat() if r.get('timestamp') else None,
                'site': r.get('site_code'),
                'equipment': r.get('equipment_name'),
                'category': category,
                'metric': metric,
                'value': round(r.get('value_numeric'), 2) if r.get('value_numeric') else None,
                'unit': r.get('unit')
            })
        
        return {
            "report_type": "ups_export",
            "site_code": site_code.upper() if site_code else "ALL",
            "time_period": f"{hours} hours",
            "from_time": from_time.isoformat(),
            "to_time": datetime.now().isoformat(),
            "total_records": len(records),
            "records": records
        }
        
    except Exception as e:
        logger.error(f"Error generating UPS export: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถ export ข้อมูล UPS: {str(e)}"
        )
