"""
Database discovery service for ECC800
บริการค้นหาโครงสร้างฐานข้อมูลสำหรับ ECC800
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import get_settings
import re

settings = get_settings()

# Column name candidates for heuristic matching - ตัวเลือกชื่อคอลัมน์สำหรับการจับคู่แบบ heuristic
CANDIDATE_TIME = ("statistical_start_time", "ts", "time", "timestamp", "created_at", "datetime")
CANDIDATE_VALUE = ("value", "reading", "val", "avg_value", "data_value")
CANDIDATE_METRIC = ("performance_data", "metric", "metric_name", "name")
CANDIDATE_UNIT = ("unit", "uom")
CANDIDATE_SITE = ("site_code", "site", "dc")
CANDIDATE_EQID = ("equipment_id", "eq_id", "equip_id", "device_id")
CANDIDATE_EQNAME = ("equipment_name", "eq_name", "device_name", "name")
CANDIDATE_SEVERITY = ("severity", "level", "fault_level")

@dataclass
class TableMap:
    """Mapping of table structure - การแมปโครงสร้างตาราง"""
    table: str
    time_col: str
    value_col: Optional[str]
    metric_col: Optional[str]
    unit_col: Optional[str]
    site_col: str
    eq_id_col: str
    eq_name_col: Optional[str]
    severity_col: Optional[str] = None  # for faults - สำหรับความผิดพลาด

@dataclass
class DiscoveryResult:
    """Database discovery results - ผลลัพธ์การค้นหาฐานข้อมูล"""
    has_timescaledb: bool
    perf: TableMap
    fault: Optional[TableMap]
    equipment_table: Optional[str]
    datacenter_table: Optional[str]
    view_equipment_display: Optional[str]  # v_equipment_display_names ถ้ามี
    all_tables: List[Tuple[str, str]]  # (schema, table)
    hypertables: List[str] = None

class Discovery:
    """Database structure discovery service - บริการค้นหาโครงสร้างฐานข้อมูล"""
    _cache: Optional[DiscoveryResult] = None

    @staticmethod
    def _choose(cols: list[str], candidates: tuple[str, ...], required: bool = False) -> Optional[str]:
        """
        Choose best matching column name - เลือกชื่อคอลัมน์ที่ตรงที่สุด
        """
        lower = [c.lower() for c in cols]
        # Exact match first - ตรงทุกตัวอักษรก่อน
        for cand in candidates:
            if cand in lower:
                return cols[lower.index(cand)]
        # Contains match - ค้นหาแบบมีคำนั้นอยู่ข้างใน
        for cand in candidates:
            for i, c in enumerate(lower):
                if re.search(rf"\b{re.escape(cand)}\b", c):
                    return cols[i]
        return None if not required else candidates[0]

    @staticmethod
    async def _list_tables(session: AsyncSession) -> List[Tuple[str, str]]:
        """List all tables - รายการตารางทั้งหมด"""
        q = text("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
              AND table_type='BASE TABLE'
            ORDER BY 1,2
        """)
        rs = await session.execute(q)
        return [(r[0], r[1]) for r in rs]

    @staticmethod
    async def _list_columns(session: AsyncSession, schema: str, table: str) -> List[Tuple[str, str]]:
        """List columns for a table - รายการคอลัมน์ของตาราง"""
        q = text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema=:s AND table_name=:t
            ORDER BY ordinal_position
        """)
        rs = await session.execute(q, {"s": schema, "t": table})
        return [(r[0], r[1]) for r in rs]

    @staticmethod
    async def _list_hypertables(session: AsyncSession) -> List[str]:
        """List TimescaleDB hypertables - รายการ hypertables ของ TimescaleDB"""
        try:
            q = text("""
                SELECT schemaname||'.'||tablename 
                FROM timescaledb_information.hypertables
            """)
            rs = await session.execute(q)
            return [r[0] for r in rs]
        except Exception:
            return []

    @classmethod
    async def load(cls, session: AsyncSession) -> DiscoveryResult:
        """
        Load and cache discovery results - โหลดและแคชผลลัพธ์การค้นหา
        """
        if cls._cache:
            return cls._cache

        # 1) Check TimescaleDB extension - ตรวจสอบ extension ของ TimescaleDB
        has_ts = False
        try:
            r = await session.execute(text("SELECT extname FROM pg_extension WHERE extname='timescaledb'"))
            has_ts = r.scalar() is not None
        except Exception:
            has_ts = False

        # 2) List all tables - รายการตารางทั้งหมด
        tables = await cls._list_tables(session)
        
        # List hypertables if TimescaleDB is available
        hypertables = []
        if has_ts:
            hypertables = await cls._list_hypertables(session)

        # 3) Find tables using env overrides or heuristics - ค้นหาตารางโดยใช้การกำหนดใน env หรือ heuristics
        perf_table = settings.PERF_TABLE
        fault_table = settings.FAULT_TABLE
        equip_table = settings.EQUIP_TABLE
        dcenter_table = settings.DATACENTER_TABLE

        def find_table(keyword: str) -> Optional[Tuple[str, str]]:
            """Find table by keyword pattern - ค้นหาตารางด้วยรูปแบบคำหลัก"""
            for s, t in tables:
                if re.search(keyword, f"{s}.{t}", re.IGNORECASE):
                    return (s, t)
            return None

        if not perf_table:
            cand = find_table(r"(performance|perf).*data|^performance_data$")
            if cand: 
                perf_table = ".".join(cand)
        if not fault_table:
            candf = find_table(r"(fault).*data|^fault_performance_data$")
            if candf: 
                fault_table = ".".join(candf)
        if not equip_table:
            cande = find_table(r"(equipment|device)s?$")
            if cande: 
                equip_table = ".".join(cande)
        if not dcenter_table:
            candd = find_table(r"(data_centers?|sites?)$")
            if candd: 
                dcenter_table = ".".join(candd)

        if not perf_table:
            # Try first table that looks like time-series data
            for s, t in tables:
                if 'data' in t.lower() or 'performance' in t.lower():
                    perf_table = f"{s}.{t}"
                    break
            
        if not perf_table:
            raise RuntimeError("ไม่พบตาราง performance (ลองตั้ง PERF_TABLE ใน .env)")

        def split_qual(name: str) -> Tuple[str, str]:
            """Split qualified name - แยกชื่อที่มี schema"""
            if "." in name: 
                s, t = name.split(".", 1)
                return s, t
            return "public", name

        # 4) Analyze performance table columns - วิเคราะห์คอลัมน์ตารางประสิทธิภาพ
        perf_schema, perf_t = split_qual(perf_table)
        pcols = await cls._list_columns(session, perf_schema, perf_t)
        pcolnames = [c[0] for c in pcols]

        time_col = cls._choose(pcolnames, CANDIDATE_TIME, required=True)
        value_col = cls._choose(pcolnames, CANDIDATE_VALUE, required=False)
        metric_col = cls._choose(pcolnames, CANDIDATE_METRIC, required=False)
        unit_col = cls._choose(pcolnames, CANDIDATE_UNIT, required=False)
        site_col = cls._choose(pcolnames, CANDIDATE_SITE, required=True)
        eqid_col = cls._choose(pcolnames, CANDIDATE_EQID, required=True)
        eqname_col = cls._choose(pcolnames, CANDIDATE_EQNAME, required=False)

        perf_map = TableMap(
            table=perf_table,
            time_col=time_col,
            value_col=value_col,
            metric_col=metric_col,
            unit_col=unit_col,
            site_col=site_col,
            eq_id_col=eqid_col,
            eq_name_col=eqname_col,
        )

        # 5) Analyze fault table if exists - วิเคราะห์ตารางความผิดพลาดถ้ามี
        fault_map: Optional[TableMap] = None
        if fault_table:
            f_schema, f_t = split_qual(fault_table)
            fcols = await cls._list_columns(session, f_schema, f_t)
            fcolnames = [c[0] for c in fcols]
            f_time = cls._choose(fcolnames, CANDIDATE_TIME, required=True)
            f_site = cls._choose(fcolnames, CANDIDATE_SITE, required=True)
            f_eqid = cls._choose(fcolnames, CANDIDATE_EQID, required=True)
            f_sev = cls._choose(fcolnames, CANDIDATE_SEVERITY, required=False)
            fault_map = TableMap(
                table=fault_table,
                time_col=f_time,
                value_col=None,
                metric_col=None,
                unit_col=None,
                site_col=f_site,
                eq_id_col=f_eqid,
                eq_name_col=None,
                severity_col=f_sev,
            )

        # 6) Check for equipment display name view - ตรวจสอบวิวชื่อแสดงอุปกรณ์
        view_equipment_display = None
        try:
            rs = await session.execute(text("""
                SELECT table_schema, table_name FROM information_schema.views
                WHERE table_schema NOT IN ('pg_catalog','information_schema')
            """))
            for s, v in rs:
                if v.lower() == "v_equipment_display_names":
                    view_equipment_display = f"{s}.{v}"
        except Exception:
            pass

        result = DiscoveryResult(
            has_timescaledb=has_ts,
            perf=perf_map,
            fault=fault_map,
            equipment_table=equip_table,
            datacenter_table=dcenter_table,
            view_equipment_display=view_equipment_display,
            all_tables=tables,
            hypertables=hypertables,
        )
        cls._cache = result
        return result

    @staticmethod
    def ident(name: str) -> str:
        """
        Safely quote SQL identifier - การ quote identifier SQL อย่างปลอดภัย
        """
        parts = name.split(".")
        def q(p: str) -> str:
            # Simple validation and quoting
            if not re.fullmatch(r"[A-Za-z0-9_]+", p):
                return f'"{p}"'  # Quote if contains special chars
            return p
        return ".".join(q(x) for x in parts)
