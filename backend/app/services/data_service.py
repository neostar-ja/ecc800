"""
บริการจัดการข้อมูล Data Centers และ Equipment
"""

from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from ..models.models import DataCenter, Equipment, EquipmentAlias
from ..schemas.schemas import (
    DataCenterResponse,
    EquipmentResponse, 
    EquipmentAliasResponse,
    EquipmentNameOverrideCreate,
    SiteMetrics
)


class DataService:
    """บริการจัดการข้อมูลพื้นฐาน"""
    
    @staticmethod
    async def get_data_centers(db: AsyncSession) -> List[DataCenterResponse]:
        """ดึงข้อมูลศูนย์ข้อมูลทั้งหมด"""
        result = await db.execute(
            select(DataCenter)
            .where(DataCenter.is_active == True)
            .order_by(DataCenter.site_code)
        )
        centers = result.scalars().all()
        
        return [DataCenterResponse.from_orm(center) for center in centers]
    
    @staticmethod
    async def get_equipment_by_site(
        db: AsyncSession, 
        site_code: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[EquipmentResponse]:
        """ดึงข้อมูลอุปกรณ์ตามไซต์ พร้อมชื่อแทน"""
        
        # Query สำหรับ join กับ equipment aliases
        query = """
        SELECT 
            e.id,
            e.equipment_name,
            e.equipment_id,
            e.description,
            e.site_code,
            COALESCE(ea.alias_name, e.equipment_name) as display_name,
            dc.id as dc_id,
            dc.name as dc_name,
            dc.site_code as dc_site_code,
            dc.location as dc_location
        FROM equipment e
        LEFT JOIN equipment_aliases ea ON e.equipment_id = ea.equipment_id 
            AND COALESCE(e.site_code, (SELECT site_code FROM data_centers WHERE id = e.data_center_id)) = ea.site_code
        LEFT JOIN data_centers dc ON e.data_center_id = dc.id
        WHERE 1=1
        """
        
        params = {}
        
        # Filter by site code
        if site_code:
            query += " AND (e.site_code = :site_code OR dc.site_code = :site_code)"
            params["site_code"] = site_code.upper()
        
        # Search functionality
        if search_query:
            query += """ AND (
                e.equipment_name ILIKE :search
                OR e.equipment_id ILIKE :search
                OR ea.alias_name ILIKE :search
            )"""
            params["search"] = f"%{search_query}%"
        
        query += " ORDER BY e.equipment_name"
        
        result = await db.execute(text(query), params)
        rows = result.fetchall()
        
        equipment_list = []
        for row in rows:
            # สร้าง data center object
            data_center = None
            if row.dc_id:
                data_center = DataCenterResponse(
                    id=row.dc_id,
                    name=row.dc_name,
                    location=row.dc_location,
                    site_code=row.dc_site_code,
                    is_active=True,
                    created_at=None,  # จะต้องเพิ่มใน query ถ้าต้องการ
                    updated_at=None
                )
            
            equipment_list.append(EquipmentResponse(
                id=row.id,
                equipment_name=row.equipment_name,
                equipment_id=row.equipment_id,
                description=row.description,
                site_code=row.site_code,
                display_name=row.display_name,
                data_center=data_center
            ))
        
        return equipment_list
    
    @staticmethod
    async def get_site_metrics(db: AsyncSession) -> List[SiteMetrics]:
        """ดึงข้อมูลสรุปของแต่ละไซต์"""
        
        query = """
        WITH site_stats AS (
            SELECT 
                dc.site_code,
                COUNT(DISTINCT e.equipment_id) as equipment_count,
                COUNT(DISTINCT CASE WHEN pd.statistical_start_time >= NOW() - INTERVAL '1 hour' 
                                   THEN e.equipment_id END) as active_equipment,
                MAX(pd.statistical_start_time) as latest_data_time,
                AVG(CASE WHEN pd.performance_data ILIKE '%temp%' OR pd.unit = '°C' 
                         THEN pd.value_numeric END) as temperature_avg,
                AVG(CASE WHEN pd.performance_data ILIKE '%humidity%' OR pd.unit LIKE '%RH%' 
                         THEN pd.value_numeric END) as humidity_avg,
                SUM(CASE WHEN pd.performance_data ILIKE '%power%' OR pd.unit ILIKE '%w%' 
                         THEN pd.value_numeric END) as power_total
            FROM data_centers dc
            LEFT JOIN equipment e ON dc.id = e.data_center_id
            LEFT JOIN performance_data pd ON e.equipment_id = pd.equipment_id 
                AND pd.statistical_start_time >= NOW() - INTERVAL '24 hours'
            WHERE dc.is_active = true
            GROUP BY dc.site_code
        ),
        fault_stats AS (
            SELECT 
                site_code,
                COUNT(*) as fault_count
            FROM fault_performance_data 
            WHERE statistical_start_time >= NOW() - INTERVAL '24 hours'
            GROUP BY site_code
        )
        SELECT 
            s.*,
            COALESCE(f.fault_count, 0) as fault_count
        FROM site_stats s
        LEFT JOIN fault_stats f ON s.site_code = f.site_code
        ORDER BY s.site_code
        """
        
        result = await db.execute(text(query))
        rows = result.fetchall()
        
        metrics = []
        for row in rows:
            metrics.append(SiteMetrics(
                site_code=row.site_code,
                equipment_count=row.equipment_count or 0,
                active_equipment=row.active_equipment or 0,
                latest_data_time=row.latest_data_time,
                temperature_avg=float(row.temperature_avg) if row.temperature_avg else None,
                humidity_avg=float(row.humidity_avg) if row.humidity_avg else None,
                power_total=float(row.power_total) if row.power_total else None,
                fault_count=row.fault_count or 0
            ))
        
        return metrics
    
    @staticmethod
    async def create_equipment_alias(
        db: AsyncSession,
        alias_data: EquipmentNameOverrideCreate,
        updated_by: str
    ) -> EquipmentAliasResponse:
        """สร้างชื่อแทนสำหรับอุปกรณ์"""
        
        # หาชื่อต้นฉบับ
        equipment_query = """
        SELECT equipment_name
        FROM equipment e
        LEFT JOIN data_centers dc ON e.data_center_id = dc.id
        WHERE e.equipment_id = :equipment_id
        AND (e.site_code = :site_code OR dc.site_code = :site_code)
        LIMIT 1
        """
        
        result = await db.execute(text(equipment_query), {
            "equipment_id": alias_data.equipment_id,
            "site_code": alias_data.site_code.upper()
        })
        equipment_row = result.fetchone()
        
        if not equipment_row:
            raise ValueError("ไม่พบอุปกรณ์ที่ระบุ")
        
        # สร้างหรืออัพเดท alias
        alias = EquipmentAlias(
            site_code=alias_data.site_code.upper(),
            equipment_id=alias_data.equipment_id,
            original_name=equipment_row.equipment_name,
            display_name=alias_data.display_name,
            updated_by=updated_by
        )
        
        # ลองใส่ก่อน หากมีอยู่แล้วจะอัพเดท
        merge_query = """
        INSERT INTO equipment_aliases (site_code, equipment_id, original_name, display_name, updated_by, created_at, updated_at)
        VALUES (:site_code, :equipment_id, :original_name, :display_name, :updated_by, NOW(), NOW())
        ON CONFLICT (site_code, equipment_id)
        DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        RETURNING *
        """
        
        result = await db.execute(text(merge_query), {
            "site_code": alias.site_code,
            "equipment_id": alias.equipment_id,
            "original_name": alias.original_name,
            "display_name": alias.display_name,
            "updated_by": alias.updated_by
        })
        
        await db.commit()
        row = result.fetchone()
        
        return EquipmentAliasResponse(
            id=row.id,
            site_code=row.site_code,
            equipment_id=row.equipment_id,
            original_name=row.original_name,
            display_name=row.display_name,
            updated_by=row.updated_by,
            created_at=row.created_at,
            updated_at=row.updated_at
        )
    
    @staticmethod
    async def delete_equipment_alias(db: AsyncSession, alias_id: int) -> bool:
        """ลบชื่อแทนของอุปกรณ์"""
        result = await db.execute(
            text("DELETE FROM equipment_aliases WHERE id = :id"),
            {"id": alias_id}
        )
        await db.commit()
        
        return result.rowcount > 0
    
    @staticmethod
    async def get_database_views(db: AsyncSession) -> List[dict]:
        """ดึงรายการ database views"""
        query = """
        SELECT 
            schemaname as schema_name,
            viewname as view_name,
            'view' as view_type,
            NULL as description
        FROM pg_views 
        WHERE schemaname = 'public'
        
        UNION ALL
        
        SELECT 
            view_schema as schema_name,
            view_name,
            'continuous_aggregate' as view_type,
            'TimescaleDB Continuous Aggregate' as description
        FROM timescaledb_information.continuous_aggregates
        WHERE view_schema = 'public'
        
        ORDER BY schema_name, view_name
        """
        
        result = await db.execute(text(query))
        rows = result.fetchall()
        
        return [dict(row._mapping) for row in rows]
    
    @staticmethod
    async def get_equipment_aliases(db: AsyncSession) -> List[dict]:
        """ดึงรายการชื่อแทนอุปกรณ์ทั้งหมด"""
        
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
        ORDER BY ea.site_code, ea.equipment_id
        """
        
        result = await db.execute(text(query))
        rows = result.fetchall()
        
        return [dict(row._mapping) for row in rows]
