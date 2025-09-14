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
    """คลาสสำหรับค้นพบโครงสร้างฐานข้อมูล"""
    
    def __init__(self):
        self.host = os.getenv('POSTGRES_HOST', 'localhost')
        self.port = int(os.getenv('POSTGRES_PORT', '5432'))
        self.database = os.getenv('POSTGRES_DB', 'ecc800')
        self.username = os.getenv('POSTGRES_USER', 'postgres')
        self.password = os.getenv('POSTGRES_PASSWORD', '')
        
        self.connection_string = f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        
    async def connect(self) -> asyncpg.Connection:
        """เชื่อมต่อฐานข้อมูล"""
        return await asyncpg.connect(self.connection_string)
    
    async def discover_hypertables(self, conn: asyncpg.Connection) -> List[Dict[str, Any]]:
        """ค้นพบ hypertables ของ TimescaleDB"""
        query = """
        SELECT 
            hypertable_schema,
            hypertable_name,
            num_dimensions,
            compression_enabled,
            num_chunks,
            table_size
        FROM timescaledb_information.hypertables
        ORDER BY hypertable_schema, hypertable_name;
        """
        try:
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"⚠️ ไม่สามารถดึงข้อมูل hypertables: {e}")
            return []
    
    async def discover_dimensions(self, conn: asyncpg.Connection) -> List[Dict[str, Any]]:
        """ค้นพบมิติของ hypertables"""
        query = """
        SELECT 
            hypertable_name,
            column_name,
            dimension_type,
            time_interval
        FROM timescaledb_information.dimensions
        WHERE dimension_type = 'Time'
        ORDER BY hypertable_name, column_name;
        """
        try:
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"⚠️ ไม่สามารถดึงข้อมูล dimensions: {e}")
            return []
    
    async def discover_tables_and_views(self, conn: asyncpg.Connection) -> Dict[str, List[Dict[str, Any]]]:
        """ค้นพบตารางและวิวทั้งหมด"""
        
        # ตาราง
        tables_query = """
        SELECT 
            table_schema,
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_schema = t.table_schema AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'timescaledb_information', 'timescaledb_experimental')
        AND table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name;
        """
        
        # วิว
        views_query = """
        SELECT 
            table_schema,
            table_name as view_name,
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_schema = v.table_schema AND table_name = v.table_name) as column_count
        FROM information_schema.views v
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'timescaledb_information', 'timescaledb_experimental')
        ORDER BY table_schema, table_name;
        """
        
        # Materialized views
        matviews_query = """
        SELECT 
            schemaname as table_schema,
            matviewname as view_name,
            definition
        FROM pg_matviews
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'timescaledb_information')
        ORDER BY schemaname, matviewname;
        """
        
        try:
            tables = await conn.fetch(tables_query)
            views = await conn.fetch(views_query)
            matviews = await conn.fetch(matviews_query)
            
            return {
                'tables': [dict(row) for row in tables],
                'views': [dict(row) for row in views],
                'materialized_views': [dict(row) for row in matviews]
            }
        except Exception as e:
            print(f"⚠️ ไม่สามารถดึงข้อมูลตารางและวิว: {e}")
            return {'tables': [], 'views': [], 'materialized_views': []}
    
    async def check_equipment_override_table(self, conn: asyncpg.Connection) -> Dict[str, Any]:
        """ตรวจสอบตาราง equipment_name_overrides"""
        check_query = """
        SELECT to_regclass('public.equipment_name_overrides') IS NOT NULL AS exists;
        """
        
        try:
            result = await conn.fetchrow(check_query)
            exists = result['exists']
            
            if exists:
                count_query = "SELECT COUNT(*) as count FROM public.equipment_name_overrides;"
                count_result = await conn.fetchrow(count_query)
                return {
                    'exists': True,
                    'record_count': count_result['count']
                }
            else:
                return {'exists': False, 'record_count': 0}
        except Exception as e:
            print(f"⚠️ ไม่สามารถตรวจสอบตาราง equipment_name_overrides: {e}")
            return {'exists': False, 'record_count': 0}
    
    async def analyze_data_structure(self, conn: asyncpg.Connection) -> Dict[str, Any]:
        """วิเคราะห์โครงสร้างข้อมูลหลัก"""
        analysis = {}
        
        # ค้นหาตารางที่เกี่ยวข้องกับ performance และ fault
        performance_tables_query = """
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_name ILIKE '%performance%'
        OR table_name ILIKE '%data%'
        OR table_name ILIKE '%metric%'
        ORDER BY table_name;
        """
        
        fault_tables_query = """
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_name ILIKE '%fault%'
        OR table_name ILIKE '%alarm%'
        OR table_name ILIKE '%alert%'
        ORDER BY table_name;
        """
        
        site_tables_query = """
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_name ILIKE '%site%'
        OR table_name ILIKE '%center%'
        OR table_name ILIKE '%location%'
        ORDER BY table_name;
        """
        
        try:
            analysis['performance_related'] = [dict(row) for row in await conn.fetch(performance_tables_query)]
            analysis['fault_related'] = [dict(row) for row in await conn.fetch(fault_tables_query)]
            analysis['site_related'] = [dict(row) for row in await conn.fetch(site_tables_query)]
            
            # ตรวจสอบตัวอย่างข้อมูล
            if analysis['performance_related']:
                table_name = analysis['performance_related'][0]['table_name']
                schema_name = analysis['performance_related'][0]['table_schema']
                sample_query = f"SELECT * FROM {schema_name}.{table_name} LIMIT 3;"
                try:
                    sample_data = await conn.fetch(sample_query)
                    analysis['sample_performance_data'] = [dict(row) for row in sample_data]
                except Exception as e:
                    analysis['sample_performance_data'] = f"Error: {e}"
            
        except Exception as e:
            print(f"⚠️ ไม่สามารถวิเคราะห์โครงสร้างข้อมูล: {e}")
            analysis['error'] = str(e)
        
        return analysis
    
    async def run_discovery(self) -> Dict[str, Any]:
        """รันการค้นพบทั้งหมด"""
        print("🔍 เริ่มต้นการค้นพบโครงสร้างฐานข้อมูล ECC800...")
        
        try:
            conn = await asyncpg.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password
            )
            print("✅ เชื่อมต่อฐานข้อมูลสำเร็จ")
            
            # รวบรวมข้อมูลทั้งหมด
            discovery_data = {
                'timestamp': datetime.now().isoformat(),
                'connection_info': {
                    'host': self.host,
                    'port': self.port,
                    'database': self.database,
                    'username': self.username
                },
                'hypertables': await self.discover_hypertables(conn),
                'dimensions': await self.discover_dimensions(conn),
                'database_objects': await self.discover_tables_and_views(conn),
                'equipment_override_table': await self.check_equipment_override_table(conn),
                'data_analysis': await self.analyze_data_structure(conn)
            }
            
            await conn.close()
            print("✅ การค้นพบเสร็จสิ้น")
            
            return discovery_data
            
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาดในการค้นพบ: {e}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

async def main():
    """ฟังก์ชันหลัก"""
    discovery = DatabaseDiscovery()
    data = await discovery.run_discovery()
    
    # บันทึกผลลัพธ์
    with open('db_discovery.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    print("\n📊 สรุปผลการค้นพบ:")
    if 'error' not in data:
        print(f"📅 วันเวลา: {data['timestamp']}")
        print(f"🖥️ ฐานข้อมูล: {data['connection_info']['host']}:{data['connection_info']['port']}/{data['connection_info']['database']}")
        print(f"📈 Hypertables: {len(data['hypertables'])} ตาราง")
        print(f"📊 ตารางทั้งหมด: {len(data['database_objects']['tables'])} ตาราง")
        print(f"👁️ วิวทั้งหมด: {len(data['database_objects']['views'])} วิว")
        print(f"🔧 Override table: {'มี' if data['equipment_override_table']['exists'] else 'ไม่มี'}")
    else:
        print(f"❌ ข้อผิดพลาด: {data['error']}")
    
    print(f"\n💾 ผลลัพธ์บันทึกใน: db_discovery.json")

if __name__ == "__main__":
    asyncio.run(main())
