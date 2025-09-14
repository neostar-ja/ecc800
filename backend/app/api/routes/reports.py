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
from app.services.auth import get_current_user
from app.schemas.auth import User

router = APIRouter()
logger = logging.getLogger(__name__)

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
            general_stats_query = """
            SELECT 
                COUNT(DISTINCT site_code) as total_sites,
                COUNT(DISTINCT equipment_id) as total_equipment,
                COUNT(DISTINCT performance_data) as total_metrics,
                COUNT(*) as total_records,
                MIN(statistical_start_time) as earliest_data,
                MAX(statistical_start_time) as latest_data
            FROM public.performance_data;
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
