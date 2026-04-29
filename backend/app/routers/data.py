"""
Data API routes for ECC800
เส้นทาง API ข้อมูลสำหรับ ECC800
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from app.db.session import get_db_session
from app.services.discovery import Discovery
from app.services.timeseries import fetch_timeseries, fetch_faults

router = APIRouter(tags=["data"])

@router.get("/health")
async def health_check(session: AsyncSession = Depends(get_db_session)):
    """
    Health check endpoint - ตรวจสอบสถานะระบบ
    """
    try:
        await session.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@router.get("/sites")
async def list_sites(session: AsyncSession = Depends(get_db_session)):
    """
    List all sites/data centers - รายการไซต์/ศูนย์ข้อมูลทั้งหมด
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        
        # Try data centers table first - ลองตาราง data centers ก่อน
        if disc.datacenter_table:
            t = Discovery.ident(disc.datacenter_table)
            # Get column information - รับข้อมูลคอลัมน์
            rs = await session.execute(text(f"SELECT * FROM {t} LIMIT 0"))
            cols = [c.name for c in rs.cursor.description] if hasattr(rs, 'cursor') else []
            
            # Guess column names - เดาชื่อคอลัมน์
            c_code = next((c for c in cols if c.lower() in ("site_code", "site", "dc", "code")), cols[0] if cols else "site_code")
            c_name = next((c for c in cols if "name" in c.lower()), c_code)
            
            try:
                rs2 = await session.execute(text(f'SELECT "{c_code}" as site_code, "{c_name}" as site_name FROM {t}'))
                return [dict(r._mapping) for r in rs2]
            except Exception:
                pass
        
        # Fallback to distinct from performance table - ใช้ distinct จากตารางประสิทธิภาพ
        p = disc.perf
        t = Discovery.ident(p.table)
        sc = Discovery.ident(p.site_col)
        
        rs = await session.execute(text(f"SELECT DISTINCT {sc} as site_code FROM {t} WHERE {sc} IS NOT NULL ORDER BY {sc}"))
        return [{"site_code": r[0], "site_name": r[0]} for r in rs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing sites: {str(e)}")

@router.get("/equipment")
async def list_equipment(
    site_code: str = Query(..., description="Site code filter"),
    q: Optional[str] = Query(None, description="Search query for equipment name"),
    session: AsyncSession = Depends(get_db_session),
):
    """
    List equipment for a site - รายการอุปกรณ์ของไซต์
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        
        # Try equipment display view first - ลองวิวแสดงชื่ออุปกรณ์ก่อน
        if disc.view_equipment_display:
            v = Discovery.ident(disc.view_equipment_display)
            where_clause = "WHERE site_code = :s"
            params = {"s": site_code}
            
            if q:
                where_clause += " AND (display_name ILIKE :q OR original_name ILIKE :q)"
                params["q"] = f"%{q}%"
                
            rs = await session.execute(text(f"""
                SELECT site_code, equipment_id, display_name, original_name
                FROM {v} {where_clause}
                ORDER BY display_name
            """), params)
            return [dict(r._mapping) for r in rs]

        # Fallback to performance table - ใช้ตารางประสิทธิภาพ
        p = disc.perf
        t = Discovery.ident(p.table)
        sc, ec = Discovery.ident(p.site_col), Discovery.ident(p.eq_id_col)
        name_expr = f", {Discovery.ident(p.eq_name_col)} AS equipment_name" if p.eq_name_col else ""
        
        sql = f"""
            SELECT DISTINCT {sc} AS site_code, {ec} AS equipment_id{name_expr}
            FROM {t} 
            WHERE {sc} = :s
            ORDER BY {ec}
        """
        
        rs = await session.execute(text(sql), {"s": site_code})
        rows = []
        for r in rs:
            m = dict(r._mapping)
            m["display_name"] = m.get("equipment_name") or m["equipment_id"]
            if not q or q.lower() in m["display_name"].lower():
                rows.append(m)
        
        return rows
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing equipment: {str(e)}")

@router.get("/metrics")
async def list_metrics(
    site_code: Optional[str] = Query(None, description="Site code filter"),
    equipment_id: Optional[str] = Query(None, description="Equipment ID filter"),
    session: AsyncSession = Depends(get_db_session),
):
    """
    List available metrics - รายการเมทริกส์ที่มี
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        p = disc.perf
        
        if not p.metric_col:
            return {"metrics": [], "message": "No metric column found in performance table"}
        
        t = Discovery.ident(p.table)
        sc, ec, mc = Discovery.ident(p.site_col), Discovery.ident(p.eq_id_col), Discovery.ident(p.metric_col)
        
        where_conditions = []
        params = {}
        
        if site_code:
            where_conditions.append(f"{sc} = :s")
            params["s"] = site_code
            
        if equipment_id:
            where_conditions.append(f"{ec} = :e")
            params["e"] = equipment_id
            
        where_clause = ("WHERE " + " AND ".join(where_conditions)) if where_conditions else ""
        
        rs = await session.execute(text(f"SELECT DISTINCT {mc} FROM {t} {where_clause} WHERE {mc} IS NOT NULL ORDER BY {mc}"), params)
        metrics = [r[0] for r in rs]
        
        return {"metrics": metrics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing metrics: {str(e)}")

@router.get("/data/time-series")
async def get_timeseries(
    site_code: str = Query(..., description="Site code"),
    equipment_id: str = Query(..., description="Equipment ID"),
    metric: str = Query(..., description="Metric name"),
    dt_from: datetime = Query(..., description="Start datetime (ISO format)"),
    dt_to: datetime = Query(..., description="End datetime (ISO format)"),
    interval: Optional[str] = Query(None, description="Time bucket interval (e.g., '1 hour')"),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Get time series data - รับข้อมูลเวลา
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        return await fetch_timeseries(
            session, disc, site_code, equipment_id, metric, 
            dt_from, dt_to, interval
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time series: {str(e)}")

@router.get("/faults")
async def get_faults(
    site_code: str = Query(..., description="Site code"),
    equipment_id: Optional[str] = Query(None, description="Equipment ID filter"),
    dt_from: Optional[datetime] = Query(None, description="Start datetime"),
    dt_to: Optional[datetime] = Query(None, description="End datetime"),
    severity: Optional[str] = Query(None, description="Severity filter"),
    interval: Optional[str] = Query(None, description="Time bucket interval"),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Get fault data - รับข้อมูลความผิดพลาด
    """
    try:
        # Ensure transaction is clean before discovery
        try:
            await session.rollback()
        except:
            pass
        
        # Commit any pending transaction to reset state
        try:
            await session.commit()
        except:
            pass
        
        disc = await Discovery.load(session)
        return await fetch_faults(
            session, disc, site_code, equipment_id, 
            dt_from, dt_to, severity, interval
        )
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR in get_faults: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Error fetching faults: {str(e)}")

@router.get("/reports/kpi")
async def get_kpi_report(
    site_code: str = Query(..., description="Site code"),
    dt_from: Optional[datetime] = Query(None, description="Start datetime"),
    dt_to: Optional[datetime] = Query(None, description="End datetime"),
    session: AsyncSession = Depends(get_db_session),
):
    """
    Get KPI report data - รับข้อมูลรายงาน KPI
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        
        # Default to last 24 hours if no date range - เริ่มต้น 24 ชั่วโมงล่าสุดถ้าไม่มีช่วงเวลา
        if dt_from is None:
            dt_from = datetime.now(timezone.utc) - timedelta(hours=24)
        if dt_to is None:
            dt_to = datetime.now(timezone.utc)
            
        p = disc.perf
        t = Discovery.ident(p.table)
        sc = Discovery.ident(p.site_col)
        tc = Discovery.ident(p.time_col)
        
        # Base query conditions
        base_params = {
            "site": site_code,
            "from": dt_from,
            "to": dt_to
        }
        
        kpis = {}
        
        # Temperature metrics - เมทริกอุณหภูมิ
        if p.metric_col and p.value_col:
            mc = Discovery.ident(p.metric_col)
            vc = Discovery.ident(p.value_col)
            
            temp_query = f"""
                SELECT 
                    AVG({vc})::float8 as avg_temp,
                    MIN({vc})::float8 as min_temp,
                    MAX({vc})::float8 as max_temp
                FROM {t}
                WHERE {sc} = :site 
                  AND {tc} BETWEEN :from AND :to
                  AND {mc} ~* '(temp|temperature)'
                  AND {vc} IS NOT NULL
            """
            
            try:
                rs = await session.execute(text(temp_query), base_params)
                temp_result = rs.first()
                if temp_result and temp_result[0] is not None:
                    kpis["temperature"] = {
                        "avg": round(temp_result[0], 1),
                        "min": round(temp_result[1], 1),
                        "max": round(temp_result[2], 1),
                        "unit": "°C"
                    }
            except Exception:
                pass
                
            # Humidity metrics - เมทริกความชื้น
            humidity_query = f"""
                SELECT AVG({vc})::float8 as avg_humidity
                FROM {t}
                WHERE {sc} = :site 
                  AND {tc} BETWEEN :from AND :to
                  AND {mc} ~* 'humidity'
                  AND {vc} IS NOT NULL
            """
            
            try:
                rs = await session.execute(text(humidity_query), base_params)
                humidity_result = rs.first()
                if humidity_result and humidity_result[0] is not None:
                    kpis["humidity"] = {
                        "avg": round(humidity_result[0], 1),
                        "unit": "%"
                    }
            except Exception:
                pass
                
            # Power/Load metrics - เมทริกกำลังไฟ/โหลด
            power_query = f"""
                SELECT AVG({vc})::float8 as avg_power
                FROM {t}
                WHERE {sc} = :site 
                  AND {tc} BETWEEN :from AND :to
                  AND ({mc} ILIKE '%load%' OR {mc} ILIKE '%power%')
                  AND {vc} IS NOT NULL
            """
            
            try:
                rs = await session.execute(text(power_query), base_params)
                power_result = rs.first()
                if power_result and power_result[0] is not None:
                    kpis["power"] = {
                        "avg": round(power_result[0], 1),
                        "unit": "W"
                    }
            except Exception:
                pass
        
        # Equipment count - จำนวนอุปกรณ์
        if p.eq_id_col:
            ec = Discovery.ident(p.eq_id_col)
            eq_query = f"""
                SELECT COUNT(DISTINCT {ec}) as equipment_count
                FROM {t}
                WHERE {sc} = :site 
                  AND {tc} BETWEEN :from AND :to
            """
            
            try:
                rs = await session.execute(text(eq_query), base_params)
                eq_result = rs.first()
                if eq_result:
                    kpis["equipment_count"] = int(eq_result[0])
            except Exception:
                kpis["equipment_count"] = 0
        
        # Fault count if fault table exists - จำนวนความผิดพลาดถ้ามีตาราง fault
        if disc.fault:
            try:
                fault_data = await fetch_faults(session, disc, site_code, None, dt_from, dt_to)
                total_faults = sum(item["fault_count"] for item in fault_data["data"])
                kpis["fault_count"] = total_faults
            except Exception:
                kpis["fault_count"] = 0
        else:
            kpis["fault_count"] = 0
            
        return {
            "site_code": site_code,
            "period": {
                "from": dt_from.isoformat(),
                "to": dt_to.isoformat()
            },
            "kpis": kpis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating KPI report: {str(e)}")

@router.get("/views")
async def list_views(session: AsyncSession = Depends(get_db_session)):
    """
    List database views - รายการวิวฐานข้อมูล
    """
    try:
        rs = await session.execute(text("""
            SELECT schemaname, viewname, definition
            FROM pg_views
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, viewname
        """))
        
        views = []
        for r in rs:
            schema, name, definition = r[0], r[1], r[2]
            
            # Guess purpose from name - เดาจุดประสงค์จากชื่อ
            purpose = "Unknown"
            name_lower = name.lower()
            if "equipment" in name_lower and "display" in name_lower:
                purpose = "Equipment display names"
            elif "performance" in name_lower:
                purpose = "Performance data view"
            elif "fault" in name_lower:
                purpose = "Fault data view"
            elif "summary" in name_lower or "report" in name_lower:
                purpose = "Summary/Report view"
                
            views.append({
                "schema": schema,
                "name": name,
                "full_name": f"{schema}.{name}",
                "purpose": purpose,
                "definition": definition[:200] + "..." if len(definition) > 200 else definition
            })
            
        return {"views": views}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing views: {str(e)}")

@router.get("/discovery")
async def get_discovery_info(session: AsyncSession = Depends(get_db_session)):
    """
    Get database discovery information - รับข้อมูลการค้นหาฐานข้อมูล
    """
    try:
        # Ensure transaction is clean before discovery
        await session.rollback()
        
        disc = await Discovery.load(session)
        
        return {
            "has_timescaledb": disc.has_timescaledb,
            "hypertables": disc.hypertables or [],
            "tables": {
                "performance": {
                    "table": disc.perf.table,
                    "columns": {
                        "time": disc.perf.time_col,
                        "value": disc.perf.value_col,
                        "metric": disc.perf.metric_col,
                        "unit": disc.perf.unit_col,
                        "site": disc.perf.site_col,
                        "equipment_id": disc.perf.eq_id_col,
                        "equipment_name": disc.perf.eq_name_col,
                    }
                },
                "fault": disc.fault.__dict__ if disc.fault else None,
                "equipment": disc.equipment_table,
                "datacenter": disc.datacenter_table,
            },
            "views": {
                "equipment_display": disc.view_equipment_display
            },
            "all_tables": [f"{schema}.{table}" for schema, table in disc.all_tables]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting discovery info: {str(e)}")
