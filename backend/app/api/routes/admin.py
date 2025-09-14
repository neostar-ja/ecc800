"""
API Routes สำหรับ Admin Panel
Admin Panel API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from app.core.database import get_db, execute_raw_query
from app.services.auth import get_current_user
from app.schemas.auth import User
from app.schemas.schemas import DataCenterResponse, DataCenterCreate, DataCenterUpdate
from pydantic import BaseModel


class RetentionRequest(BaseModel):
    table: str = 'public.performance_data'
    default_days: int = 90


class CompressionRequest(BaseModel):
    table: str = 'public.performance_data'
    compress_after_days: int = 14
    segmentby: list[str] | None = None
    orderby: list[str] | None = None


class ChunkIntervalRequest(BaseModel):
    table: str = 'public.performance_data'
    chunk_interval: str = '1 day'


class CaggPolicy(BaseModel):
    start_offset: str | None = '7 days'
    end_offset: str | None = '1 hour'
    schedule_interval: str | None = '5 minutes'


class CaggRequest(BaseModel):
    table: str = 'public.performance_data'
    time_column: str = 'statistical_start_time'
    group_by: list[str] = ['site_code', 'equipment_id', 'performance_data', 'unit']
    intervals: list[str] = ['5 minutes', '1 hour', '1 day']
    policy: CaggPolicy | None = CaggPolicy()

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/admin/system-info")
async def get_system_info(
    # current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ข้อมูลระบบสำหรับ Admin
    System information for admin dashboard
    """
    try:
        # ตรวจสอบสิทธิ์ admin (ถ้ามี role checking)
        # if hasattr(current_user, 'role') and current_user.role != 'admin':
        #     raise HTTPException(status_code=403, detail="ต้องการสิทธิ์ admin")
        
        # ข้อมูลฐานข้อมูล
        db_info_query = """
        SELECT 
            current_database() as database_name,
            current_user as current_user,
            version() as version,
            NOW() as server_time;
        """
        
        db_info = await execute_raw_query(db_info_query)
        
        # ข้อมูลตารางหลัก
        table_info_query = """
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        """
        
        table_info = await execute_raw_query(table_info_query)
        
        # ข้อมูล TimescaleDB (ถ้ามี)
        timescale_info_query = """
        SELECT 
            hypertable_schema,
            hypertable_name,
            compression_enabled,
            pg_size_pretty(hypertable_size(format('%I.%I', hypertable_schema, hypertable_name))) as hypertable_size
        FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'public';
        """
        
        try:
            timescale_info = await execute_raw_query(timescale_info_query)
        except:
            timescale_info = []  # ถ้าไม่มี TimescaleDB extension
        
        # ข้อมูลสถิติการใช้งาน
        usage_stats_query = """
        SELECT 
            COUNT(DISTINCT site_code) as total_sites,
            COUNT(DISTINCT equipment_id) as total_equipment,
            COUNT(DISTINCT performance_data) as total_metrics,
            COUNT(*) as total_records,
            MIN(statistical_start_time) as earliest_data,
            MAX(statistical_start_time) as latest_data,
            DATE_PART('day', MAX(statistical_start_time) - MIN(statistical_start_time)) as data_span_days
        FROM public.performance_data;
        """
        
        usage_stats = await execute_raw_query(usage_stats_query)
        
        return {
            "system_info": {
                "timestamp": datetime.now().isoformat(),
                "database": db_info[0] if db_info else {},
                "tables": table_info,
                "hypertables": timescale_info,
                "usage_statistics": usage_stats[0] if usage_stats else {}
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูลระบบ: {str(e)}"
        )


@router.post('/admin/timescale/retention')
async def set_retention_policy(req: RetentionRequest, db: AsyncSession = Depends(get_db)):
    """ตั้งค่า Retention Policy บน Hypertable"""
    try:
        try:
            await execute_raw_query(f"SELECT remove_retention_policy('{req.table}');")
        except Exception:
            pass
        await execute_raw_query(
            f"SELECT add_retention_policy('{req.table}', INTERVAL '{req.default_days} days');"
        )
        return {"success": True, "message": f"ตั้งค่า retention {req.default_days} วันสำเร็จ", "table": req.table}
    except Exception as e:
        logger.error(f"Retention policy error: {e}")
        raise HTTPException(status_code=500, detail=f"ตั้งค่า retention ไม่สำเร็จ: {e}")


@router.post('/admin/timescale/compression')
async def set_compression_policy(req: CompressionRequest, db: AsyncSession = Depends(get_db)):
    """ตั้งค่า Compression + นโยบายการบีบอัด"""
    try:
        seg = ','.join(req.segmentby) if req.segmentby else ''
        ordby = ','.join(req.orderby) if req.orderby else 'statistical_start_time'
        await execute_raw_query(f"ALTER TABLE {req.table} SET (timescaledb.compress = true);")
        if seg:
            await execute_raw_query(f"ALTER TABLE {req.table} SET (timescaledb.compress_segmentby = '{seg}');")
        if ordby:
            await execute_raw_query(f"ALTER TABLE {req.table} SET (timescaledb.compress_orderby = '{ordby}');")
        try:
            await execute_raw_query(f"SELECT remove_compression_policy('{req.table}');")
        except Exception:
            pass
        await execute_raw_query(
            f"SELECT add_compression_policy('{req.table}', INTERVAL '{req.compress_after_days} days');"
        )
        return {"success": True, "message": "ตั้งค่า compression สำเร็จ", "table": req.table}
    except Exception as e:
        logger.error(f"Compression policy error: {e}")
        raise HTTPException(status_code=500, detail=f"ตั้งค่า compression ไม่สำเร็จ: {e}")


@router.post('/admin/timescale/chunk-interval')
async def set_chunk_interval(req: ChunkIntervalRequest, db: AsyncSession = Depends(get_db)):
    """ตั้งค่า Chunk Time Interval ของ Hypertable"""
    try:
        await execute_raw_query(
            f"SELECT set_chunk_time_interval('{req.table}', INTERVAL '{req.chunk_interval}');"
        )
        return {"success": True, "message": f"ตั้งค่า chunk_interval = {req.chunk_interval}", "table": req.table}
    except Exception as e:
        logger.error(f"Chunk interval error: {e}")
        raise HTTPException(status_code=500, detail=f"ตั้งค่า chunk interval ไม่สำเร็จ: {e}")


@router.post('/admin/timescale/cagg')
async def create_caggs(req: CaggRequest, db: AsyncSession = Depends(get_db)):
    """สร้าง Continuous Aggregates สำหรับช่วงเวลาที่เลือก และตั้ง refresh policy"""
    try:
        created: list[str] = []
        for interval in req.intervals:
            view_name = f"cagg_perf_{interval.replace(' ', '_').replace('minutes','m').replace('minute','m').replace('hour','h').replace('day','d')}"
            group_cols = ', '.join(req.group_by)
            cagg_sql = f"""
            CREATE MATERIALIZED VIEW IF NOT EXISTS public.{view_name}
            WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
            SELECT
              time_bucket('{interval}', {req.time_column}) AS bucket,
              {group_cols},
              AVG(value_numeric) AS value_avg,
              MIN(value_numeric) AS value_min,
              MAX(value_numeric) AS value_max,
              COUNT(*) AS sample_count
            FROM {req.table}
            WHERE value_numeric IS NOT NULL
            GROUP BY bucket, {group_cols};
            """
            await execute_raw_query(cagg_sql)

            if req.policy:
                start_off = req.policy.start_offset or '7 days'
                end_off = req.policy.end_offset or '1 hour'
                sched = req.policy.schedule_interval or '5 minutes'
                try:
                    await execute_raw_query(
                        f"SELECT remove_continuous_aggregate_policy('public.{view_name}');"
                    )
                except Exception:
                    pass
                add_policy_sql = (
                    "SELECT add_continuous_aggregate_policy("
                    f"'public.{view_name}', START_OFFSET => INTERVAL '{start_off}', "
                    f"END_OFFSET => INTERVAL '{end_off}', SCHEDULE_INTERVAL => INTERVAL '{sched}' );"
                )
                await execute_raw_query(add_policy_sql)
            created.append(view_name)
        return {"success": True, "message": "สร้าง CAGGs/Policy สำเร็จ", "views": created}
    except Exception as e:
        logger.error(f"CAGG error: {e}")
        raise HTTPException(status_code=500, detail=f"สร้าง CAGG ไม่สำเร็จ: {e}")


@router.get('/admin/timescale/current')
async def get_timescale_current(db: AsyncSession = Depends(get_db)):
    """อ่านค่าการตั้งค่าปัจจุบันของ TimescaleDB (อาจคืนได้บางส่วน หากไม่มี extension/views)"""
    result: Dict[str, Any] = {
        "table": "public.performance_data",
        "retention": {},
        "compression": {},
        "chunk_interval": None,
        "cagg": {"views": []},
        "chunks": {
            "count": 0,
            "total_size_pretty": None,
            "top": [],
            "range": {"min_start": None, "max_end": None},
        },
    }
    # Chunk interval
    try:
        q = """
        SELECT chunk_time_interval
        FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'public' AND hypertable_name = 'performance_data';
        """
        r = await execute_raw_query(q)
        if r:
            result["chunk_interval"] = r[0].get("chunk_time_interval")
    except Exception:
        pass

    # Compression settings
    try:
        q = """
        SELECT attname, segmentby_column_index, orderby_column_index
        FROM timescaledb_information.compression_settings
        WHERE hypertable_schema = 'public' AND hypertable_name = 'performance_data'
        ORDER BY COALESCE(segmentby_column_index, 999), COALESCE(orderby_column_index, 999);
        """
        r = await execute_raw_query(q)
        if r:
            segmentby = [row["attname"] for row in r if row.get("segmentby_column_index") is not None]
            orderby = [row["attname"] for row in r if row.get("orderby_column_index") is not None]
            result["compression"].update({
                "segmentby": segmentby,
                "orderby": orderby,
                "enabled": True
            })
    except Exception:
        pass

    # Compression / Retention policy jobs (best-effort)
    try:
        q = """
        SELECT hypertable_name, proc_name, schedule_interval, config
        FROM timescaledb_information.jobs
        WHERE hypertable_schema='public' AND hypertable_name IN ('performance_data')
          AND proc_name IN ('policy_compression','policy_retention','policy_refresh_continuous_aggregate');
        """
        jobs = await execute_raw_query(q)
        for j in jobs:
            proc = (j.get("proc_name") or '').lower()
            cfg = j.get("config")
            if 'compression' in proc:
                result["compression"]["policy"] = {
                    "schedule_interval": j.get("schedule_interval"),
                    "config": cfg
                }
            elif 'retention' in proc:
                # คาดหวังว่า config มีคีย์ drop_after
                drop_after = None
                try:
                    if isinstance(cfg, dict):
                        drop_after = cfg.get('drop_after')
                except Exception:
                    pass
                result["retention"] = {
                    "schedule_interval": j.get("schedule_interval"),
                    "drop_after": drop_after
                }
    except Exception:
        pass

    # Continuous aggregates list (best-effort)
    try:
        q = """
        SELECT view_schema, view_name
        FROM timescaledb_information.continuous_aggregates
        WHERE view_schema='public';
        """
        views = await execute_raw_query(q)
        for v in views:
            result["cagg"]["views"].append(v.get("view_name"))
    except Exception:
        pass

    # Chunk statistics (best-effort)
    try:
        # Count and range
        q_count_range = """
        SELECT 
            COUNT(*) AS cnt,
            MIN(range_start) AS min_start,
            MAX(range_end) AS max_end
        FROM timescaledb_information.chunks
        WHERE hypertable_schema = 'public' AND hypertable_name = 'performance_data';
        """
        r = await execute_raw_query(q_count_range)
        if r:
            row = r[0]
            result["chunks"]["count"] = row.get("cnt", 0)
            result["chunks"]["range"] = {
                "min_start": row.get("min_start"),
                "max_end": row.get("max_end"),
            }

        # Top 5 largest chunks and total size
        q_top = """
        SELECT 
            c.chunk_schema,
            c.chunk_name,
            c.range_start,
            c.range_end,
            pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name)) AS size_bytes,
            pg_size_pretty(pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name))) AS size_pretty
        FROM timescaledb_information.chunks c
        WHERE c.hypertable_schema = 'public' AND c.hypertable_name = 'performance_data'
        ORDER BY size_bytes DESC
        LIMIT 5;
        """
        top_rows = await execute_raw_query(q_top)
        top_list = []
        total_size = 0
        for tr in top_rows:
            size_b = tr.get("size_bytes") if isinstance(tr, dict) else None
            if isinstance(size_b, (int, float)):
                total_size += int(size_b)
            top_list.append({
                "chunk": f"{tr.get('chunk_schema')}.{tr.get('chunk_name')}",
                "range_start": tr.get("range_start"),
                "range_end": tr.get("range_end"),
                "size_pretty": tr.get("size_pretty"),
                "size_bytes": size_b,
            })
        result["chunks"]["top"] = top_list
        if total_size:
            # Pretty print total size of top chunks (approximation)
            try:
                total_size_pretty = (await execute_raw_query(
                    "SELECT pg_size_pretty($1::bigint) AS s;", [total_size]
                ))[0].get("s")
            except Exception:
                total_size_pretty = None
            result["chunks"]["total_size_pretty"] = total_size_pretty
    except Exception:
        pass

    return result


@router.get('/admin/metrics/ingestion-rate')
async def get_ingestion_rate(
    period: str = Query('24h', description="ช่วงเวลา (1h, 4h, 24h, 3d, 7d, 30d)"),
    db: AsyncSession = Depends(get_db)
):
    """นับจำนวนระเบียนที่รับเข้า ต่อชั่วโมง สำหรับช่วงเวลาที่ระบุ"""
    try:
        from datetime import timedelta
        now = datetime.now()
        period_map = {
            '1h': timedelta(hours=1),
            '4h': timedelta(hours=4),
            '24h': timedelta(hours=24),
            '3d': timedelta(days=3),
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
        }
        delta = period_map.get(period, timedelta(hours=24))
        from_time = now - delta

        q = """
        SELECT 
            time_bucket(INTERVAL '1 hour', statistical_start_time) AS ts,
            COUNT(*)::bigint AS records
        FROM public.performance_data
        WHERE statistical_start_time >= :from_time AND statistical_start_time <= :to_time
        GROUP BY ts
        ORDER BY ts;
        """
        rows = await execute_raw_query(q, {"from_time": from_time, "to_time": now})
        points = []
        for r in rows:
            if isinstance(r, dict):
                ts = r.get('ts')
                cnt = r.get('records')
            else:
                ts = r[0]
                cnt = r[1]
            try:
                ts_iso = (ts if isinstance(ts, datetime) else datetime.fromisoformat(str(ts))).isoformat()
            except Exception:
                ts_iso = str(ts)
            try:
                val = int(cnt)
            except Exception:
                val = 0
            points.append({"timestamp": ts_iso, "value": val})

        return {"period": period, "unit": "records/hour", "points": points}
    except Exception as e:
        logger.error(f"Error getting ingestion rate: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึง ingestion rate: {e}")


@router.get('/admin/metrics/chunk-sizes')
async def get_chunk_sizes(
    period: str = Query('30d', description="ช่วงเวลา (7d, 30d, 90d)"),
    db: AsyncSession = Depends(get_db)
):
    """สรุปขนาด chunks ต่อวัน สำหรับ hypertable performance_data"""
    try:
        from datetime import timedelta
        now = datetime.now()
        period_map = {
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90),
        }
        delta = period_map.get(period, timedelta(days=30))
        from_time = now - delta

        q = """
        SELECT 
          time_bucket(INTERVAL '1 day', c.range_start) AS ts,
          SUM(pg_total_relation_size(format('%I.%I', c.chunk_schema, c.chunk_name)))::bigint AS size_bytes
        FROM timescaledb_information.chunks c
        WHERE c.hypertable_schema = 'public' AND c.hypertable_name = 'performance_data'
          AND c.range_start >= :from_time AND c.range_start <= :to_time
        GROUP BY ts
        ORDER BY ts;
        """
        rows = await execute_raw_query(q, {"from_time": from_time, "to_time": now})
        points = []
        for r in rows:
            if isinstance(r, dict):
                ts = r.get('ts')
                sz = r.get('size_bytes')
            else:
                ts = r[0]
                sz = r[1]
            try:
                ts_iso = (ts if isinstance(ts, datetime) else datetime.fromisoformat(str(ts))).isoformat()
            except Exception:
                ts_iso = str(ts)
            try:
                val = int(sz)
            except Exception:
                val = 0
            points.append({"timestamp": ts_iso, "value": val})

        return {"period": period, "unit": "bytes", "points": points}
    except Exception as e:
        logger.error(f"Error getting chunk sizes: {e}")
        raise HTTPException(status_code=500, detail=f"ไม่สามารถดึงขนาด chunks: {e}")



@router.get("/admin/equipment-overrides")
async def get_equipment_overrides(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ดึงรายการชื่อแทนอุปกรณ์ทั้งหมด
    Get all equipment display name overrides
    """
    try:
        query = """
        SELECT 
            ea.id,
            ea.site_code,
            ea.equipment_id,
            ea.original_name,
            ea.alias_name as display_name,
            ea.updated_by,
            ea.created_at,
            ea.updated_at,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM public.performance_data pd 
                    WHERE pd.site_code = ea.site_code 
                    AND pd.equipment_id = ea.equipment_id 
                    AND pd.statistical_start_time >= NOW() - INTERVAL '24 hours'
                ) THEN 'Active'
                ELSE 'Inactive'
            END as equipment_status
        FROM public.equipment_aliases ea
        WHERE (CAST($1 as TEXT) IS NULL OR ea.site_code = CAST($1 as TEXT))
        ORDER BY ea.site_code, ea.equipment_id;
        """
        
        overrides = await execute_raw_query(query, [site_code])
        
        # สถิติ
        total_overrides = len(overrides)
        active_equipment = len([o for o in overrides if o["equipment_status"] == "Active"])
        sites_with_overrides = len(set(o["site_code"] for o in overrides))
        
        return {
            "overrides": overrides,
            "statistics": {
                "total_overrides": total_overrides,
                "active_equipment": active_equipment,
                "inactive_equipment": total_overrides - active_equipment,
                "sites_with_overrides": sites_with_overrides
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment overrides: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล overrides: {str(e)}"
        )


@router.post("/admin/equipment-overrides")
async def create_equipment_override(
    override_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    สร้างหรือแก้ไขชื่อแทนอุปกรณ์
    Create or update equipment display name override
    """
    try:
        site_code = override_data.get("site_code")
        equipment_id = override_data.get("equipment_id")
        display_name = override_data.get("display_name")
        
        if not all([site_code, equipment_id, display_name]):
            raise HTTPException(
                status_code=400,
                detail="ต้องระบุ site_code, equipment_id, และ display_name"
            )
        
        # หาชื่อเดิมจาก performance_data
        original_name_query = """
        SELECT DISTINCT equipment_name as original_name
        FROM public.performance_data
        WHERE site_code = $1 AND equipment_id = $2
        LIMIT 1;
        """
        
        original_result = await execute_raw_query(original_name_query, [site_code, equipment_id])
        original_name = original_result[0]["original_name"] if original_result else equipment_id
        
        # สร้างหรืออัปเดต override
        upsert_query = """
        INSERT INTO public.equipment_aliases 
        (site_code, equipment_id, original_name, alias_name, scope, updated_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'device', $5, NOW(), NOW())
        ON CONFLICT (scope, site_code, equipment_id, alias_name)
        DO UPDATE SET 
            alias_name = EXCLUDED.alias_name,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        RETURNING id, site_code, equipment_id, original_name, alias_name as display_name, updated_by, created_at, updated_at;
        """

        updated_by = getattr(current_user, 'username', 'system')
        result = await execute_raw_query(upsert_query, [
            site_code, equipment_id, original_name, display_name, updated_by
        ])
        
        return {
            "success": True,
            "message": "บันทึกชื่อแทนอุปกรณ์เรียบร้อย",
            "override": result[0] if result else None
        }
        
    except Exception as e:
        logger.error(f"Error creating equipment override: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้าง override: {str(e)}"
        )


@router.delete("/admin/equipment-overrides/{override_id}")
async def delete_equipment_override(
    override_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ลบชื่อแทนอุปกรณ์
    Delete equipment display name override
    """
    try:
        # ตรวจสอบว่ามี override นี้อยู่
        check_query = """
        SELECT * FROM public.equipment_aliases WHERE id = $1;
        """
        
        existing = await execute_raw_query(check_query, [override_id])
        
        if not existing:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ override ที่ระบุ"
            )
        
        # ลบ
        delete_query = """
        DELETE FROM public.equipment_aliases WHERE id = $1;
        """
        
        await execute_raw_query(delete_query, [override_id])
        
        return {
            "success": True,
            "message": "ลบชื่อแทนอุปกรณ์เรียบร้อย",
            "deleted_override": existing[0]
        }
        
    except Exception as e:
        logger.error(f"Error deleting equipment override: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถลบ override: {str(e)}"
        )


@router.post("/admin/refresh-views")
async def refresh_database_views(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    รีเฟรช database views และ continuous aggregates
    Refresh database views and continuous aggregates
    """
    try:
        refreshed_items = []
        
        # ลิสต์ views ที่ต้องการรีเฟรช
        views_to_refresh = [
            "v_equipment_display_names",
            "v_latest_performance_data",
            "v_site_equipment_summary"
        ]
        
        # รีเฟรช materialized views (ถ้ามี)
        for view_name in views_to_refresh:
            try:
                refresh_query = f"""
                REFRESH MATERIALIZED VIEW IF EXISTS public.{view_name};
                """
                await execute_raw_query(refresh_query)
                refreshed_items.append({
                    "name": view_name,
                    "type": "materialized_view",
                    "status": "success"
                })
            except Exception as e:
                refreshed_items.append({
                    "name": view_name,
                    "type": "materialized_view",
                    "status": "error",
                    "error": str(e)
                })
        
        # รีเฟรช continuous aggregates (ถ้ามี TimescaleDB)
        cagg_to_refresh = [
            "cagg_perf_5m_to_1h",
            "cagg_perf_1h_to_1d",
            "cagg_fault_hourly",
            "cagg_fault_daily"
        ]
        
        for cagg_name in cagg_to_refresh:
            try:
                # ตรวจสอบว่ามี CAGG อยู่หรือไม่
                check_query = """
                SELECT 1 FROM timescaledb_information.continuous_aggregates 
                WHERE view_name = $1 AND view_schema = 'public';
                """
                exists = await execute_raw_query(check_query, [cagg_name])
                
                if exists:
                    refresh_query = f"""
                    CALL refresh_continuous_aggregate('{cagg_name}', NULL, NULL);
                    """
                    await execute_raw_query(refresh_query)
                    refreshed_items.append({
                        "name": cagg_name,
                        "type": "continuous_aggregate",
                        "status": "success"
                    })
                else:
                    refreshed_items.append({
                        "name": cagg_name,
                        "type": "continuous_aggregate",
                        "status": "not_found"
                    })
            except Exception as e:
                refreshed_items.append({
                    "name": cagg_name,
                    "type": "continuous_aggregate",
                    "status": "error",
                    "error": str(e)
                })
        
        success_count = len([item for item in refreshed_items if item["status"] == "success"])
        
        return {
            "success": True,
            "message": f"รีเฟรช {success_count} รายการเรียบร้อย",
            "refreshed_items": refreshed_items,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error refreshing views: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถรีเฟรช views: {str(e)}"
        )


@router.get("/admin/database-health")
async def get_database_health(
    # current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ตรวจสอบสุขภาพฐานข้อมูล
    Check database health status
    """
    try:
        health_checks = []
        
        # 1. การเชื่อมต่อฐานข้อมูล
        try:
            connection_query = "SELECT 1 as connected;"
            await execute_raw_query(connection_query)
            health_checks.append({
                "check": "database_connection",
                "status": "healthy",
                "message": "การเชื่อมต่อปกติ"
            })
        except Exception as e:
            health_checks.append({
                "check": "database_connection",
                "status": "unhealthy",
                "message": f"การเชื่อมต่อผิดพลาด: {str(e)}"
            })
        
        # 2. ข้อมูลล่าสุด
        try:
            latest_data_query = """
            SELECT 
                MAX(statistical_start_time) as latest_data,
                COUNT(*) as records_last_hour
            FROM public.performance_data
            WHERE statistical_start_time >= NOW() - INTERVAL '1 hour';
            """
            latest_result = await execute_raw_query(latest_data_query)
            latest_data = latest_result[0] if latest_result else {}
            
            if latest_data.get("records_last_hour", 0) > 0:
                health_checks.append({
                    "check": "recent_data",
                    "status": "healthy",
                    "message": f"มีข้อมูลล่าสุด {latest_data['records_last_hour']} รายการใน 1 ชั่วโมงที่ผ่านมา"
                })
            else:
                health_checks.append({
                    "check": "recent_data",
                    "status": "warning",
                    "message": "ไม่มีข้อมูลใหม่ใน 1 ชั่วโมงที่ผ่านมา"
                })
        except Exception as e:
            health_checks.append({
                "check": "recent_data",
                "status": "error",
                "message": f"ไม่สามารถตรวจสอบข้อมูลล่าสุด: {str(e)}"
            })
        
        # 3. ตรวจสอบ TimescaleDB
        try:
            timescale_query = "SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';"
            timescale_result = await execute_raw_query(timescale_query)
            
            if timescale_result:
                health_checks.append({
                    "check": "timescaledb_extension",
                    "status": "healthy",
                    "message": f"TimescaleDB version {timescale_result[0]['extversion']}"
                })
            else:
                health_checks.append({
                    "check": "timescaledb_extension",
                    "status": "warning",
                    "message": "TimescaleDB extension ไม่ได้ติดตั้ง"
                })
        except Exception as e:
            health_checks.append({
                "check": "timescaledb_extension",
                "status": "error",
                "message": f"ไม่สามารถตรวจสอบ TimescaleDB: {str(e)}"
            })
        
        # 4. ตรวจสอบ disk space (ถ้าเป็นไปได้)
        try:
            disk_query = """
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                pg_size_pretty(pg_total_relation_size('public.performance_data')) as main_table_size;
            """
            disk_result = await execute_raw_query(disk_query)
            disk_info = disk_result[0] if disk_result else {}
            
            health_checks.append({
                "check": "database_size",
                "status": "info",
                "message": f"ขนาดฐานข้อมูล: {disk_info.get('database_size', 'Unknown')}, ตารางหลัก: {disk_info.get('main_table_size', 'Unknown')}"
            })
        except Exception as e:
            health_checks.append({
                "check": "database_size",
                "status": "error",
                "message": f"ไม่สามารถตรวจสอบขนาด: {str(e)}"
            })
        
        # สรุปสุขภาพรวม
        unhealthy_count = len([c for c in health_checks if c["status"] == "unhealthy"])
        error_count = len([c for c in health_checks if c["status"] == "error"])
        warning_count = len([c for c in health_checks if c["status"] == "warning"])
        
        if unhealthy_count > 0 or error_count > 0:
            overall_status = "unhealthy"
        elif warning_count > 0:
            overall_status = "warning"
        else:
            overall_status = "healthy"
        
        return {
            "overall_status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "health_checks": health_checks,
            "summary": {
                "total_checks": len(health_checks),
                "healthy": len([c for c in health_checks if c["status"] == "healthy"]),
                "warnings": warning_count,
                "errors": error_count,
                "unhealthy": unhealthy_count
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking database health: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถตรวจสอบสุขภาพฐานข้อมูล: {str(e)}"
        )


@router.get("/admin/data-centers", response_model=List[DataCenterResponse])
async def get_data_centers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """ดึงรายการ Data Centers ทั้งหมด"""
    
    try:
        from app.models.models import DataCenter
        
        query = select(DataCenter)
        
        # เงื่อนไขการค้นหา
        if search:
            query = query.where(
                or_(
                    DataCenter.name.ilike(f"%{search}%"),
                    DataCenter.location.ilike(f"%{search}%"),
                    DataCenter.site_code.ilike(f"%{search}%")
                )
            )
        
        if is_active is not None:
            query = query.where(DataCenter.is_active == is_active)
        
        # เรียงลำดับและ limit
        query = query.order_by(DataCenter.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        data_centers = result.scalars().all()
        
        # Convert INET to string for JSON serialization
        for dc in data_centers:
            if dc.ip_address:
                dc.ip_address = str(dc.ip_address)
        
        return data_centers
        
    except Exception as e:
        logger.error(f"Error getting data centers: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล Data Centers ได้: {str(e)}"
        )


@router.post("/admin/data-centers")
async def create_data_center(
    data_center_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """สร้าง Data Center ใหม่"""
    
    try:
        from app.models.models import DataCenter
        
        name = data_center_data.get("name")
        location = data_center_data.get("location")
        description = data_center_data.get("description")
        site_code = data_center_data.get("site_code")
        ip_address = data_center_data.get("ip_address")
        is_active = data_center_data.get("is_active", True)
        
        if not name or not site_code:
            raise HTTPException(
                status_code=400,
                detail="ต้องระบุ name และ site_code"
            )
        
        # ตรวจสอบว่า site_code ไม่ซ้ำ
        existing_query = select(DataCenter).where(DataCenter.site_code == site_code)
        existing_result = await db.execute(existing_query)
        existing = existing_result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Site code '{site_code}' ถูกใช้งานแล้ว"
            )
        
        # สร้าง Data Center ใหม่
        new_dc = DataCenter(
            name=name,
            location=location,
            description=description,
            site_code=site_code,
            ip_address=ip_address,
            is_active=is_active
        )
        
        db.add(new_dc)
        await db.commit()
        await db.refresh(new_dc)
        
        # Convert INET to string for JSON serialization
        if new_dc.ip_address:
            new_dc.ip_address = str(new_dc.ip_address)
        
        return {
            "success": True,
            "message": "สร้าง Data Center เรียบร้อย",
            "data_center": {
                "id": new_dc.id,
                "name": new_dc.name,
                "location": new_dc.location,
                "description": new_dc.description,
                "site_code": new_dc.site_code,
                "ip_address": new_dc.ip_address,
                "is_active": new_dc.is_active,
                "created_at": new_dc.created_at.isoformat() if new_dc.created_at else None,
                "updated_at": new_dc.updated_at.isoformat() if new_dc.updated_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating data center: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถสร้าง Data Center ได้: {str(e)}"
        )


@router.put("/admin/data-centers/{data_center_id}")
async def update_data_center(
    data_center_id: int,
    data_center_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """อัปเดตข้อมูล Data Center"""
    
    try:
        from app.models.models import DataCenter
        
        # ค้นหา Data Center ที่ต้องการอัปเดต
        query = select(DataCenter).where(DataCenter.id == data_center_id)
        result = await db.execute(query)
        data_center = result.scalar_one_or_none()
        
        if not data_center:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Data Center ที่ระบุ"
            )
        
        # ตรวจสอบ site_code ไม่ซ้ำ (ถ้ามีการเปลี่ยน)
        new_site_code = data_center_data.get("site_code")
        if new_site_code and new_site_code != data_center.site_code:
            existing_query = select(DataCenter).where(
                DataCenter.site_code == new_site_code,
                DataCenter.id != data_center_id
            )
            existing_result = await db.execute(existing_query)
            existing = existing_result.scalar_one_or_none()
            
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"Site code '{new_site_code}' ถูกใช้งานแล้ว"
                )
        
        # อัปเดตข้อมูล
        for field, value in data_center_data.items():
            if hasattr(data_center, field):
                setattr(data_center, field, value)
        
        await db.commit()
        await db.refresh(data_center)
        
        # Convert INET to string for JSON serialization
        if data_center.ip_address:
            data_center.ip_address = str(data_center.ip_address)
        
        return {
            "success": True,
            "message": "อัปเดต Data Center เรียบร้อย",
            "data_center": {
                "id": data_center.id,
                "name": data_center.name,
                "location": data_center.location,
                "description": data_center.description,
                "site_code": data_center.site_code,
                "ip_address": data_center.ip_address,
                "is_active": data_center.is_active,
                "created_at": data_center.created_at.isoformat() if data_center.created_at else None,
                "updated_at": data_center.updated_at.isoformat() if data_center.updated_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating data center: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถอัปเดต Data Center ได้: {str(e)}"
        )


@router.delete("/admin/data-centers/{data_center_id}")
async def delete_data_center(
    data_center_id: int,
    db: AsyncSession = Depends(get_db)
):
    """ลบ Data Center"""
    
    try:
        from app.models.models import DataCenter
        from app.models.models import Equipment
        
        # ค้นหา Data Center ที่ต้องการลบ
        query = select(DataCenter).where(DataCenter.id == data_center_id)
        result = await db.execute(query)
        data_center = result.scalar_one_or_none()
        
        if not data_center:
            raise HTTPException(
                status_code=404,
                detail="ไม่พบ Data Center ที่ระบุ"
            )
        
        # ตรวจสอบว่ามีอุปกรณ์ที่เกี่ยวข้องหรือไม่
        equipment_query = select(Equipment).where(Equipment.data_center_id == data_center_id)
        equipment_result = await db.execute(equipment_query)
        equipment_list = equipment_result.scalars().all()
        
        if equipment_list:
            raise HTTPException(
                status_code=400,
                detail="ไม่สามารถลบ Data Center ที่มีอุปกรณ์อยู่ได้"
            )
        
        # ลบ Data Center
        await db.delete(data_center)
        await db.commit()
        
        return {
            "success": True,
            "message": "ลบ Data Center เรียบร้อย"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting data center: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถลบ Data Center ได้: {str(e)}"
        )


@router.post('/admin/reports/create-caggs')
async def create_reports_caggs(db: AsyncSession = Depends(get_db)):
    """
    สร้าง Continuous Aggregates สำหรับรายงานหลัก:
    - cagg_ingest_1h: จำนวนแถวต่อชั่วโมง แยกตาม site_code
    - cagg_temp_1h: อุณหภูมิ (avg/min/max) ต่อชั่วโมง แยกตาม site_code
    - cagg_metric_pop_1h: จำนวนแถวต่อชั่วโมง แยกตาม site_code + metric_name
    พร้อมตั้ง refresh policy (schedule 5 minutes, lag 5 minutes)
    """
    created: list[str] = []
    try:
        ingest_sql = """
        CREATE MATERIALIZED VIEW IF NOT EXISTS public.cagg_ingest_1h
        WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
        SELECT
          time_bucket('1 hour', statistical_start_time) AS bucket,
          site_code,
          COUNT(*)::bigint AS records
        FROM public.performance_data
        GROUP BY bucket, site_code;
        """
        await execute_raw_query(ingest_sql)
        created.append('cagg_ingest_1h')

        temp_sql = """
        CREATE MATERIALIZED VIEW IF NOT EXISTS public.cagg_temp_1h
        WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
        SELECT
          time_bucket('1 hour', statistical_start_time) AS bucket,
          site_code,
          AVG(value_numeric)::float8 AS avg_temperature,
          MIN(value_numeric)::float8 AS min_temperature,
          MAX(value_numeric)::float8 AS max_temperature,
          COUNT(DISTINCT equipment_id) AS equipment_count
        FROM public.performance_data
        WHERE value_numeric IS NOT NULL AND (performance_data ILIKE '%temp%' OR unit IN ('°C','℃'))
        GROUP BY bucket, site_code;
        """
        await execute_raw_query(temp_sql)
        created.append('cagg_temp_1h')

        metric_pop_sql = """
        CREATE MATERIALIZED VIEW IF NOT EXISTS public.cagg_metric_pop_1h
        WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
        SELECT
          time_bucket('1 hour', statistical_start_time) AS bucket,
          site_code,
          performance_data AS metric_name,
          COUNT(*)::bigint AS cnt
        FROM public.performance_data
        GROUP BY bucket, site_code, metric_name;
        """
        await execute_raw_query(metric_pop_sql)
        created.append('cagg_metric_pop_1h')

        for view_name in created:
            try:
                await execute_raw_query(
                    f"SELECT remove_continuous_aggregate_policy('public.{view_name}');"
                )
            except Exception:
                pass
            policy_sql = (
                "SELECT add_continuous_aggregate_policy("
                f"'public.{view_name}', START_OFFSET => INTERVAL '7 days', "
                f"END_OFFSET => INTERVAL '5 minutes', SCHEDULE_INTERVAL => INTERVAL '5 minutes');"
            )
            await execute_raw_query(policy_sql)

        return {"success": True, "created": created}
    except Exception as e:
        logger.error(f"Error creating report CAGGs: {e}")
        raise HTTPException(status_code=500, detail=f"สร้าง CAGGs สำหรับ reports ไม่สำเร็จ: {e}")
