#!/usr/bin/env python3
"""
สคริปต์ค้นพบโครงสร้างฐานข้อมูล ECC800
ตามสเปคที่กำหนด
"""
import os
import asyncio
import asyncpg
import json
from datetime import datetime
from dotenv import load_dotenv

# โหลด environment variables
load_dotenv('.env')

async def discover_database():
    """ค้นพบโครงสร้างฐานข้อมูล"""
    
    try:
        # เชื่อมต่อฐานข้อมูล
        conn = await asyncpg.connect(
            host=os.getenv('POSTGRES_HOST'),
            port=int(os.getenv('POSTGRES_PORT')),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            database=os.getenv('POSTGRES_DB')
        )
        
        print("🔍 เริ่มการค้นพบโครงสร้างฐานข้อมูล...")
        
        discovery = {
            "timestamp": datetime.now().isoformat(),
            "database_info": {
                "host": os.getenv('POSTGRES_HOST'),
                "port": os.getenv('POSTGRES_PORT'),
                "database": os.getenv('POSTGRES_DB')
            },
            "hypertables": [],
            "dimensions": [],
            "tables": [],
            "views": [],
            "materialized_views": [],
            "override_status": False,
            "performance_tables": [],
            "fault_tables": []
        }
        
        # 1. ค้นหา hypertables
        print("📊 กำลังค้นหา hypertables...")
        try:
            hypertables_result = await conn.fetch("""
                SELECT hypertable_schema, hypertable_name, num_dimensions, compression_enabled
                FROM timescaledb_information.hypertables
                ORDER BY hypertable_schema, hypertable_name;
            """)
            
            for row in hypertables_result:
                discovery["hypertables"].append({
                    "schema": row["hypertable_schema"],
                    "name": row["hypertable_name"],
                    "dimensions": row["num_dimensions"],
                    "compression": row["compression_enabled"]
                })
                print(f"  ✅ {row['hypertable_schema']}.{row['hypertable_name']}")
        except Exception as e:
            print(f"  ⚠️  ไม่พบ TimescaleDB extension หรือ hypertables: {e}")
        
        # 2. ค้นหามิติเวลา
        print("⏰ กำลังค้นหามิติเวลา...")
        try:
            dimensions_result = await conn.fetch("""
                SELECT hypertable_name, column_name, dimension_type, time_interval
                FROM timescaledb_information.dimensions
                WHERE dimension_type='Time';
            """)
            
            for row in dimensions_result:
                discovery["dimensions"].append({
                    "hypertable": row["hypertable_name"],
                    "column": row["column_name"],
                    "type": row["dimension_type"],
                    "interval": str(row["time_interval"]) if row["time_interval"] else None
                })
                print(f"  ⏱️  {row['hypertable_name']}.{row['column_name']} ({row['time_interval']})")
        except Exception as e:
            print(f"  ⚠️  ไม่สามารถดึงข้อมูลมิติได้: {e}")
        
        # 3. ค้นหาตารางทั้งหมด
        print("🗂️  กำลังค้นหาตาราง...")
        tables_result = await conn.fetch("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog','information_schema', 'timescaledb_information', 'timescaledb_experimental')
            ORDER BY table_schema, table_name;
        """)
        
        for row in tables_result:
            table_info = {
                "schema": row["table_schema"],
                "name": row["table_name"],
                "full_name": f"{row['table_schema']}.{row['table_name']}"
            }
            discovery["tables"].append(table_info)
            
            # จำแนกตารางตามชื่อ
            table_name = row["table_name"].lower()
            if "performance" in table_name and "fault" not in table_name:
                discovery["performance_tables"].append(table_info)
            elif "fault" in table_name:
                discovery["fault_tables"].append(table_info)
        
        print(f"  📋 พบตาราง {len(discovery['tables'])} ตาราง")
        
        # 4. ค้นหา views
        print("👁️  กำลังค้นหา views...")
        views_result = await conn.fetch("""
            SELECT table_schema, table_name
            FROM information_schema.views
            WHERE table_schema NOT IN ('pg_catalog','information_schema', 'timescaledb_information', 'timescaledb_experimental')
            ORDER BY table_schema, table_name;
        """)
        
        for row in views_result:
            discovery["views"].append({
                "schema": row["table_schema"],
                "name": row["table_name"],
                "full_name": f"{row['table_schema']}.{row['table_name']}"
            })
        
        print(f"  👀 พบ views {len(discovery['views'])} รายการ")
        
        # 5. ค้นหา materialized views (CAGG)
        print("🏗️  กำลังค้นหา materialized views...")
        try:
            matviews_result = await conn.fetch("""
                SELECT schemaname, matviewname
                FROM pg_matviews
                WHERE schemaname NOT IN ('pg_catalog','information_schema', 'timescaledb_information');
            """)
            
            for row in matviews_result:
                discovery["materialized_views"].append({
                    "schema": row["schemaname"],
                    "name": row["matviewname"],
                    "full_name": f"{row['schemaname']}.{row['matviewname']}"
                })
        except Exception as e:
            print(f"  ⚠️  ไม่สามารถดึง materialized views: {e}")
        
        # 6. ตรวจสอบตาราง override
        print("🔧 ตรวจสอบตาราง equipment_name_overrides...")
        override_check = await conn.fetchval("""
            SELECT to_regclass('public.equipment_name_overrides') IS NOT NULL AS exists;
        """)
        discovery["override_status"] = override_check
        
        if override_check:
            print("  ✅ ตาราง equipment_name_overrides มีอยู่แล้ว")
        else:
            print("  ❌ ตาราง equipment_name_overrides ยังไม่มี - ต้องสร้าง migration")
        
        # บันทึกผลลัพธ์
        with open('docs/00_discovery.json', 'w', encoding='utf-8') as f:
            json.dump(discovery, f, indent=2, ensure_ascii=False)
        
        print("✅ เสร็จสิ้นการค้นพบโครงสร้าง - บันทึกลง docs/00_discovery.json")
        
        await conn.close()
        return discovery
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return None

async def main():
    """ฟังก์ชันหลัก"""
    discovery = await discover_database()
    
    if discovery:
        # สร้างรายงานสรุป
        print("\n📋 สรุปผลการค้นพบ:")
        print(f"  🗂️  ตาราง: {len(discovery['tables'])} รายการ")
        print(f"  👁️  Views: {len(discovery['views'])} รายการ")
        print(f"  📊 Hypertables: {len(discovery['hypertables'])} รายการ")
        print(f"  🏗️  Materialized Views: {len(discovery['materialized_views'])} รายการ")
        print(f"  📈 Performance tables: {len(discovery['performance_tables'])} รายการ")
        print(f"  🚨 Fault tables: {len(discovery['fault_tables'])} รายการ")
        print(f"  🔧 Override table: {'✅ มี' if discovery['override_status'] else '❌ ไม่มี'}")

if __name__ == "__main__":
    asyncio.run(main())
