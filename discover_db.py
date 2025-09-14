#!/usr/bin/env python3
"""
สคริปต์ค้นพบโครงสร้างฐานข้อมูล ECC800
Database Discovery Script for ECC800 System
"""

import asyncio
import asyncpg
import json
from datetime import datetime
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# โหลดค่า environment variables
load_dotenv()

class DatabaseDiscovery:

import asyncio
import asyncpg
import os
from datetime import datetime
import json

async def discover_database():
    # Database connection from environment
    conn = await asyncpg.connect(
        host="10.251.150.222",
        port=5210,
        database="ecc800",
        user="apirak",
        password="Kanokwan@1987#neostar"
    )
    
    try:
        print("🔍 Discovering ECC800 Database Schema...")
        
        # 1. Check TimescaleDB hypertables
        hypertables_query = """
        SELECT 
            hypertable_schema as schemaname, 
            hypertable_name as tablename, 
            owner,
            num_dimensions,
            num_chunks,
            compression_enabled,
            COALESCE(
                (SELECT count(*) FROM timescaledb_information.chunks 
                 WHERE hypertable_schema = h.hypertable_schema 
                 AND hypertable_name = h.hypertable_name 
                 AND is_compressed = true), 0
            ) as compressed_chunks,
            COALESCE(
                (SELECT count(*) FROM timescaledb_information.chunks 
                 WHERE hypertable_schema = h.hypertable_schema 
                 AND hypertable_name = h.hypertable_name 
                 AND is_compressed = false), 0
            ) as uncompressed_chunks
        FROM timescaledb_information.hypertables h
        ORDER BY hypertable_schema, hypertable_name;
        """
        
        hypertables = await conn.fetch(hypertables_query)
        
        # 2. Get time dimensions
        dimensions_query = """
        SELECT 
            d.hypertable_schema as schema_name,
            d.hypertable_name as table_name,
            d.column_name,
            d.column_type,
            d.time_interval,
            d.integer_interval,
            d.integer_now_func,
            d.dimension_type
        FROM timescaledb_information.dimensions d
        ORDER BY d.hypertable_schema, d.hypertable_name;
        """
        
        dimensions = await conn.fetch(dimensions_query)
        
        # 3. List all tables and views
        tables_query = """
        SELECT 
            schemaname, 
            tablename, 
            tableowner,
            'table' as object_type
        FROM pg_tables 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_catalog', '_timescaledb_internal', '_timescaledb_cache', '_timescaledb_config')
        
        UNION ALL
        
        SELECT 
            schemaname, 
            viewname as tablename, 
            viewowner as tableowner,
            'view' as object_type
        FROM pg_views 
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast', '_timescaledb_catalog', '_timescaledb_internal', '_timescaledb_cache', '_timescaledb_config')
        
        ORDER BY schemaname, object_type, tablename;
        """
        
        tables = await conn.fetch(tables_query)
        
        # 4. Check for existing override tables
        override_check_query = """
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND (tablename LIKE '%override%' OR tablename LIKE '%display%' OR tablename LIKE '%alias%')
        AND tablename LIKE '%equipment%';
        """
        
        override_tables = await conn.fetch(override_check_query)
        
        # 5. Sample equipment data to understand structure
        equipment_sample_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%equipment%' OR table_name LIKE '%device%')
        ORDER BY table_name;
        """
        
        equipment_tables = await conn.fetch(equipment_sample_query)
        
        # 6. Check for data center/site tables
        site_query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%site%' OR table_name LIKE '%center%' OR table_name LIKE '%location%')
        ORDER BY table_name;
        """
        
        site_tables = await conn.fetch(site_query)
        
        # 7. Check materialized views (CAGGs)
        cagg_query = """
        SELECT 
            materialization_hypertable_schema,
            materialization_hypertable_name,
            view_schema,
            view_name
        FROM timescaledb_information.continuous_aggregates
        ORDER BY view_schema, view_name;
        """
        
        caggs = await conn.fetch(cagg_query)
        
        # Generate discovery report
        report = f"""# การค้นพบโครงสร้างฐานข้อมูล ECC800

## ข้อมูลทั่วไป
- วันที่วิเคราะห์: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- ฐานข้อมูล: {conn.get_server_pid()} (TimescaleDB + PostgreSQL)

## Hypertables (ตารางข้อมูลเวลา)

"""
        
        if hypertables:
            for ht in hypertables:
                report += f"### `{ht['schemaname']}.{ht['tablename']}`\n"
                report += f"- จำนวน Dimensions: {ht['num_dimensions']}\n"
                report += f"- จำนวน Chunks: {ht['num_chunks']}\n"
                report += f"- การบีบอัด: {'เปิดใช้งาน' if ht['compression_enabled'] else 'ปิดใช้งาน'}\n"
                if ht['compression_enabled']:
                    report += f"- Chunks ที่บีบอัด: {ht['compressed_chunks']}\n"
                    report += f"- Chunks ที่ไม่บีบอัด: {ht['uncompressed_chunks']}\n"
                report += "\n"
        else:
            report += "ไม่พบ Hypertables\n\n"
        
        report += "## Time Dimensions\n\n"
        
        if dimensions:
            for dim in dimensions:
                report += f"### `{dim['schema_name']}.{dim['table_name']}`\n"
                report += f"- คอลัมน์เวลา: `{dim['column_name']}` ({dim['column_type']})\n"
                report += f"- ประเภท: {dim['dimension_type']}\n"
                if dim['time_interval']:
                    report += f"- ช่วงเวลา: {dim['time_interval']}\n"
                if dim['integer_interval']:
                    report += f"- ช่วงจำนวนเต็ม: {dim['integer_interval']}\n"
                report += "\n"
        else:
            report += "ไม่พบ Time Dimensions\n\n"
        
        report += "## ตารางและ Views ทั้งหมด\n\n"
        
        current_schema = None
        for table in tables:
            if current_schema != table['schemaname']:
                current_schema = table['schemaname']
                report += f"### Schema: `{current_schema}`\n\n"
            
            icon = "📊" if table['object_type'] == 'table' else "👁️"
            report += f"- {icon} `{table['tablename']}` ({table['object_type']})\n"
        
        report += "\n## Continuous Aggregates (CAGGs)\n\n"
        
        if caggs:
            for cagg in caggs:
                report += f"- `{cagg['view_schema']}.{cagg['view_name']}` → `{cagg['materialization_hypertable_schema']}.{cagg['materialization_hypertable_name']}`\n"
        else:
            report += "ไม่พบ Continuous Aggregates\n"
        
        report += "\n## ตารางสำหรับ Equipment Name Overrides\n\n"
        
        if override_tables:
            report += "พบตารางที่เกี่ยวข้องกับ Override:\n"
            for table in override_tables:
                report += f"- `{table['tablename']}`\n"
        else:
            report += """ไม่พบตารางสำหรับ Override ชื่ออุปกรณ์ - จำเป็นต้องสร้างใหม่

### DDL สำหรับตารางใหม่:

```sql
-- ตารางสำหรับแทนที่ชื่อแสดงผลของอุปกรณ์
CREATE TABLE IF NOT EXISTS public.equipment_name_overrides (
    id BIGSERIAL PRIMARY KEY,
    site_code TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_code, equipment_id)
);

-- View สำหรับแสดงชื่อที่ถูกแทนที่
CREATE OR REPLACE VIEW v_equipment_display_names AS
SELECT 
    e.*,
    COALESCE(eno.display_name, e.equipment_name) as display_name,
    eno.updated_by as name_updated_by,
    eno.updated_at as name_updated_at
FROM equipment e
LEFT JOIN equipment_name_overrides eno 
    ON e.site_code = eno.site_code 
    AND e.equipment_id = eno.equipment_id;
```
"""
        
        # Write report to file
        os.makedirs('/opt/code/ecc800/ecc800/docs', exist_ok=True)
        with open('/opt/code/ecc800/ecc800/docs/00_discovery.md', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("✅ Discovery complete! Report saved to docs/00_discovery.md")
        
        # Return structured data for further processing
        return {
            'hypertables': [dict(ht) for ht in hypertables],
            'dimensions': [dict(dim) for dim in dimensions],
            'tables': [dict(table) for table in tables],
            'caggs': [dict(cagg) for cagg in caggs],
            'override_exists': len(override_tables) > 0,
            'equipment_tables': [dict(et) for et in equipment_tables],
            'site_tables': [dict(st) for st in site_tables]
        }
        
    except Exception as e:
        print(f"❌ Error discovering database: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    discovery_data = asyncio.run(discover_database())
    
    # Save structured data for backend development
    os.makedirs('/opt/code/ecc800/ecc800/docs', exist_ok=True)
    with open('/opt/code/ecc800/ecc800/docs/schema_discovery.json', 'w', encoding='utf-8') as f:
        json.dump(discovery_data, f, indent=2, ensure_ascii=False, default=str)
