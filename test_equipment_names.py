#!/usr/bin/env python3
"""
สคริปต์สำหรับทดสอบการแก้ไขชื่ออุปกรณ์
Script for testing equipment name changes
"""

import asyncio
import asyncpg
import json
from datetime import datetime
import os

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': int(os.getenv('POSTGRES_PORT', '5432')),
    'database': os.getenv('POSTGRES_DB', 'ecc800'),
    'user': os.getenv('POSTGRES_USER', 'ecc800'),
    'password': os.getenv('POSTGRES_PASSWORD', 'change-me')
}

async def test_equipment_names():
    """ทดสอบระบบการแก้ไขชื่ออุปกรณ์"""
    
    try:
        # เชื่อมต่อฐานข้อมูล
        conn = await asyncpg.connect(**DATABASE_CONFIG)
        print("✅ เชื่อมต่อฐานข้อมูลสำเร็จ")
        
        # 1. ตรวจสอบอุปกรณ์ที่มีอยู่
        print("\n📋 รายการอุปกรณ์ที่มีอยู่:")
        equipment_query = """
        SELECT DISTINCT site_code, equipment_id, equipment_name
        FROM performance_equipment_master 
        WHERE site_code = 'dc'
        ORDER BY equipment_id
        LIMIT 10;
        """
        
        equipment_list = await conn.fetch(equipment_query)
        
        if not equipment_list:
            print("❌ ไม่พบอุปกรณ์ในระบบ")
            return
            
        for eq in equipment_list:
            print(f"   🖥️ {eq['site_code']}/{eq['equipment_id']}: {eq['equipment_name']}")
        
        # 2. สร้าง override ชื่อสำหรับอุปกรณ์ตัวอย่าง
        print("\n🔧 สร้างการ override ชื่อสำหรับอุปกรณ์ตัวอย่าง...")
        
        test_overrides = [
            ('dc', 'dc/0x01', 'เซิร์ฟเวอร์หลัก #1'),
            ('dc', 'dc/0x02', 'เซิร์ฟเวอร์สำรอง #2'), 
            ('dc', 'dc/0x03', 'ระบบจัดเก็บข้อมูล'),
            ('dc', 'dc/0x04', 'เครื่องเสมือน VMware'),
            ('dc', 'dc/0x05', 'ระบบควบคุมอุณหภูมิ')
        ]
        
        for site_code, equipment_id, display_name in test_overrides:
            # ตรวจสอบว่าอุปกรณ์มีจริง
            check_query = """
            SELECT equipment_name FROM performance_equipment_master 
            WHERE site_code = $1 AND equipment_id = $2;
            """
            
            existing = await conn.fetchrow(check_query, site_code, equipment_id)
            if existing:
                original_name = existing['equipment_name']
                
                # Insert override
                override_query = """
                INSERT INTO equipment_name_overrides 
                    (site_code, equipment_id, original_name, display_name, updated_by, updated_at)
                VALUES ($1, $2, $3, $4, 'test_script', NOW())
                ON CONFLICT (site_code, equipment_id) 
                DO UPDATE SET 
                    display_name = EXCLUDED.display_name,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = NOW();
                """
                
                await conn.execute(override_query, 
                    site_code, equipment_id, original_name, display_name)
                
                print(f"   ✅ {equipment_id}: '{original_name}' → '{display_name}'")
            else:
                print(f"   ❌ ไม่พบอุปกรณ์ {equipment_id}")
        
        # 3. ตรวจสอบผลลัพธ์
        print("\n📊 ตรวจสอบผลลัพธ์การ override:")
        
        result_query = """
        SELECT 
            em.site_code,
            em.equipment_id,
            em.equipment_name as original_name,
            eno.display_name,
            eno.updated_by,
            eno.updated_at
        FROM performance_equipment_master em
        LEFT JOIN equipment_name_overrides eno 
            ON em.site_code = eno.site_code 
            AND em.equipment_id = eno.equipment_id
        WHERE em.site_code = 'dc'
        ORDER BY em.equipment_id
        LIMIT 20;
        """
        
        results = await conn.fetch(result_query)
        
        for row in results:
            display_name = row['display_name'] or row['original_name']
            override_status = "✏️ แก้ไขแล้ว" if row['display_name'] else "📝 ชื่อเดิม"
            
            print(f"   {row['equipment_id']:10} | {display_name:25} | {override_status}")
            if row['display_name']:
                print(f"              {'':10} | ชื่อเดิม: {row['original_name']}")
                print(f"              {'':10} | แก้ไขโดย: {row['updated_by']} เมื่อ {row['updated_at']}")
        
        # 4. ทดสอบ API query รวม override
        print("\n🔍 ทดสอบ query แบบรวม override (เหมือน API):")
        
        api_query = """
        SELECT 
            em.site_code,
            em.equipment_id,
            em.equipment_name as original_name,
            COALESCE(eno.display_name, em.equipment_name) as display_name,
            CASE WHEN eno.display_name IS NOT NULL THEN eno.display_name ELSE NULL END as custom_name,
            'Active' as status,
            MAX(pd.time) as last_updated
        FROM performance_equipment_master em
        LEFT JOIN equipment_name_overrides eno 
            ON em.site_code = eno.site_code 
            AND em.equipment_id = eno.equipment_id
        LEFT JOIN performance_data pd 
            ON em.site_code = pd.site_code 
            AND em.equipment_id = pd.equipment_id
        WHERE em.site_code = 'dc'
        GROUP BY em.site_code, em.equipment_id, em.equipment_name, eno.display_name
        ORDER BY em.equipment_id
        LIMIT 10;
        """
        
        api_results = await conn.fetch(api_query)
        
        for row in api_results:
            status = "🔄 มีชื่อกำหนดเอง" if row['custom_name'] else "📋 ชื่อเดิม"
            print(f"   API: {row['equipment_id']:12} → {row['display_name']:25} | {status}")
        
        # 5. สถิติ
        print("\n📈 สถิติการ override:")
        
        stats_query = """
        SELECT 
            COUNT(*) as total_equipment,
            COUNT(eno.id) as overridden_equipment,
            ROUND(COUNT(eno.id) * 100.0 / COUNT(*), 2) as override_percentage
        FROM performance_equipment_master em
        LEFT JOIN equipment_name_overrides eno 
            ON em.site_code = eno.site_code 
            AND em.equipment_id = eno.equipment_id
        WHERE em.site_code = 'dc';
        """
        
        stats = await conn.fetchrow(stats_query)
        
        print(f"   📊 อุปกรณ์ทั้งหมด: {stats['total_equipment']}")
        print(f"   🔄 มีการแก้ไขชื่อ: {stats['overridden_equipment']}")
        print(f"   📈 เปอร์เซ็นต์: {stats['override_percentage']}%")
        
        print("\n🎉 การทดสอบเสร็จสมบูรณ์!")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'conn' in locals():
            await conn.close()


if __name__ == "__main__":
    print("🧪 เริ่มทดสอบระบบการแก้ไขชื่ออุปกรณ์")
    print("=" * 60)
    asyncio.run(test_equipment_names())
