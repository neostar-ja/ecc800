#!/usr/bin/env python3
"""
🎯 ECC800 Fault Info Performance Data Importer
✨ Imports performance data from Fault Information CSV exports
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
import hashlib
import uuid
from datetime import datetime, timezone
import re
import argparse
from pathlib import Path
import json

# ใช้ central log ที่ต้องการแยกตาม site
sys.path.append('/opt/code/ecc800/export_fault')
try:
    from logger_setup import setup_logger, info_th, error_th, success_th, progress_th
    # ใช้ central log จาก environment หรือใช้ logger_setup
    CENTRAL_LOG_FILE = os.environ.get('CENTRAL_LOG', None)
    if CENTRAL_LOG_FILE:
        setup_logger(log_path=CENTRAL_LOG_FILE)
        logging.info = info_th
        logging.error = error_th
        logging.warning = info_th  # fallback
    else:
        # ใช้ default จาก logger_setup
        logging.info = info_th
        logging.error = error_th
        logging.warning = info_th
except ImportError:
    # fallback ถ้าไม่มี logger_setup
    CENTRAL_LOG_FILE = os.environ.get('CENTRAL_LOG', '/opt/code/ecc800/export_fault/logs/fault_import.log')
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(CENTRAL_LOG_FILE, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

class FaultPerformanceImporter:
    """🗄️ Fault Info Performance Data Importer"""
    
    def __init__(self, host, port, database, username, password):
        self.db_config = {
            'host': host,
            'port': port,
            'database': database,
            'user': username,
            'password': password
        }
        self.connection = None
        self.session_id = str(uuid.uuid4())
        
    def connect(self):
        """เชื่อมต่อฐานข้อมูล PostgreSQL"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            logging.info(f"✅ เชื่อมต่อฐานข้อมูลสำเร็จ")
            return True
        except Exception as e:
            logging.error(f"❌ การเชื่อมต่อฐานข้อมูลล้มเหลว: {e}")
            return False
            
    def disconnect(self):
        """ปิดการเชื่อมต่อฐานข้อมูล"""
        if self.connection:
            self.connection.close()
            logging.info("ปิดการเชื่อมต่อฐานข้อมูลแล้ว")
    
    def get_file_hash(self, filepath):
        """Calculate MD5 hash of file"""
        hash_md5 = hashlib.md5()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def clean_data_value(self, value_str):
        """Clean and normalize data values"""
        if pd.isna(value_str) or value_str is None:
            return None, None
            
        # Remove tabs and extra spaces
        clean_value = str(value_str).strip().replace('\t', '')
        
        if clean_value == '' or clean_value.lower() in ['nan', 'null', 'none']:
            return None, None
            
        # Try to convert to numeric
        try:
            # Handle different number formats
            numeric_value = re.sub(r'[^\d\.-]', '', clean_value)
            if numeric_value and numeric_value != '-':
                return clean_value, float(numeric_value)
        except (ValueError, TypeError):
            pass
            
        return clean_value, None
    
    def determine_file_type(self, filepath):
        """Determine file type from filename"""
        filename = os.path.basename(filepath).lower()
        
        if '1_day' in filename or '1day' in filename:
            return 'fault_1_day'
        elif '1_hour' in filename or '1hour' in filename:
            return 'fault_1_hour'
        elif '5_minute' in filename or '5minute' in filename:
            return 'fault_5_minute'
        else:
            return 'fault_unknown'
    
    def is_target_file_type(self, filepath):
        """Check if file is one of the target types (1_day, 1_hour, 5_minute only)"""
        filename = os.path.basename(filepath).lower()
        target_patterns = ['1_day', '1day', '1_hour', '1hour', '5_minute', '5minute']
        return any(pattern in filename for pattern in target_patterns)
    
    def log_import_start(self, filepath, site_code):
        """บันทึกการเริ่มต้น import session"""
        try:
            file_size = os.path.getsize(filepath)
            file_hash = self.get_file_hash(filepath)
            file_type = self.determine_file_type(filepath)
            
            # Ensure site_code is uppercase
            site_code = site_code.upper()
            
            with self.connection.cursor() as cur:
                cur.execute("""
                    INSERT INTO fault_data_import_logs 
                    (import_session_id, site_code, source_file, file_type, file_size, file_hash, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'processing')
                    RETURNING id
                """, (self.session_id, site_code, os.path.basename(filepath), 
                     file_type, file_size, file_hash))
                
                log_id = cur.fetchone()[0]
                self.connection.commit()
                logging.info(f"📊 เริ่ม import session - ID: {log_id} สำหรับไซต์: {site_code}")
                return log_id
                
        except Exception as e:
            logging.error(f"ไม่สามารถบันทึกการเริ่มต้น import: {e}")
            return None
    
    def log_import_complete(self, log_id, records_processed, records_inserted, 
                          records_updated, records_skipped, error_message=None):
        """บันทึกการสิ้นสุด import session"""
        try:
            status = 'completed' if error_message is None else 'failed'
            
            with self.connection.cursor() as cur:
                cur.execute("""
                    UPDATE fault_data_import_logs 
                    SET processing_end_time = CURRENT_TIMESTAMP,
                        records_processed = %s,
                        records_inserted = %s,
                        records_updated = %s,
                        records_skipped = %s,
                        status = %s,
                        error_message = %s
                    WHERE id = %s
                """, (records_processed, records_inserted, records_updated, 
                     records_skipped, status, error_message, log_id))
                
                self.connection.commit()
                logging.info(f"📊 import session เสร็จสิ้น - สถานะ: {status}")
                
        except Exception as e:
            logging.error(f"ไม่สามารถบันทึกการสิ้นสุด import: {e}")
    
    def import_csv_file(self, filepath, site_code='DC'):
        """Import performance data from CSV file using staging table approach"""
        if not self.connection:
            logging.error("No database connection")
            return False
        
        # Ensure site_code is uppercase
        site_code = site_code.upper()
        
        # Check if this is a target file type
        if not self.is_target_file_type(filepath):
            logging.info(f"⏭️ ข้ามไฟล์ที่ไม่ใช่เป้าหมาย: {os.path.basename(filepath)}")
            return True
            
        logging.info(f"🚀 เริ่มนำเข้าข้อมูลสำหรับไซต์ {site_code} ด้วย staging table: {filepath}")
        
        # Start import logging
        log_id = self.log_import_start(filepath, site_code)
        
        records_processed = 0
        records_inserted = 0
        records_updated = 0
        records_skipped = 0
        
        try:
            # Read CSV file
            df = pd.read_csv(filepath)
            logging.info(f"📊 โหลดข้อมูล {len(df):,} แถวจาก CSV")
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Check required columns
            required_cols = ['Equipment', 'Equipment ID', 'Performance Data', 
                           'Statistical Period', 'Statistical Start Time', 'Value', 'Unit']
            
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"ขาดคอลัมน์ที่จำเป็น: {missing_cols}")
            
            # Prepare data for staging
            staging_data = []
            equipment_data = []
            
            logging.info("🚀 เตรียมข้อมูลสำหรับ staging table (ใช้ optimized df.values)...")
            
            # Pre-compute column indices for fast access (50-100x faster than iterrows)
            col_indices = {}
            for col in ['Equipment', 'Equipment ID', 'Performance Data', 'Statistical Period', 
                       'Statistical Start Time', 'Value', 'Unit']:
                if col in df.columns:
                    col_indices[col] = df.columns.get_loc(col)
            
            # Use fast df.values instead of slow iterrows()
            df_values = df.values
            import_start_time = datetime.now()
            
            for idx, row_values in enumerate(df_values):
                records_processed += 1
                
                if records_processed % 10000 == 0:
                    elapsed = (datetime.now() - import_start_time).total_seconds()
                    rate = records_processed / elapsed if elapsed > 0 else 0
                    eta_seconds = (len(df_values) - records_processed) / rate if rate > 0 else 0
                    logging.info(f"เตรียมข้อมูล {records_processed:,}/{len(df_values):,} แถว (ร่วม {rate:.0f} rows/sec, ETA {eta_seconds/60:.1f} นาที)...")
                
                try:
                    # Fast column access using pre-computed indices
                    def get_col(col_name):
                        if col_name in col_indices:
                            val = row_values[col_indices[col_name]]
                            if val is not None and val != '' and (not isinstance(val, float) or not pd.isna(val)):
                                return str(val)
                        return ''
                    
                    # Clean and prepare data
                    equipment_name = get_col('Equipment').strip().replace('\t', '')
                    equipment_id = get_col('Equipment ID').strip()
                    performance_data = get_col('Performance Data').strip().replace('\t', '')
                    statistical_period = get_col('Statistical Period').strip()
                    
                    time_str = get_col('Statistical Start Time')
                    try:
                        statistical_start_time = pd.to_datetime(time_str) if time_str else pd.NaT
                    except:
                        statistical_start_time = pd.NaT
                    
                    value_text, value_numeric = self.clean_data_value(get_col('Value'))
                    unit = get_col('Unit').strip().replace('\t', '') if get_col('Unit') else None
                    
                    # Create data hash for deduplication
                    hash_data = f"{site_code}_{equipment_name}_{equipment_id}_{performance_data}_{statistical_start_time}_{statistical_period}"
                    data_hash = hashlib.md5(hash_data.encode()).hexdigest()
                    
                    # Prepare equipment data
                    equipment_type = self.determine_equipment_type(equipment_name)
                    equipment_data.append((equipment_name, equipment_id, equipment_type, site_code))
                    
                    # Prepare staging data (without id)
                    staging_data.append([
                        site_code, equipment_name, equipment_id, performance_data,
                        statistical_period, statistical_start_time, value_text,
                        value_numeric, unit, 'fault_info', os.path.basename(filepath),
                        data_hash
                    ])
                    
                except Exception as e:
                    records_skipped += 1
                    logging.warning(f"ข้ามแถว {index}: {e}")
                    continue
            
            if not staging_data:
                logging.warning("⚠️ ไม่มีข้อมูลที่ถูกต้องสำหรับการนำเข้า")
                return True
            
            logging.info(f"📤 เตรียมข้อมูลเสร็จ: {len(staging_data):,} แถว")
            
            # Database operations with staging table
            with self.connection.cursor() as cur:
                # 1. Insert equipment data first
                if equipment_data:
                    logging.info("👥 นำเข้าข้อมูลอุปกรณ์...")
                    # Remove duplicates in equipment data
                    unique_equipment = list(set(equipment_data))
                    cur.executemany("""
                        INSERT INTO fault_equipment_master 
                        (equipment_name, equipment_id, equipment_type, site_code)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (equipment_name, equipment_id, site_code) DO NOTHING
                    """, unique_equipment)
                
                # 2. Create staging table
                logging.info("🔧 สร้าง staging table...")
                staging_table = f"fault_staging_{self.session_id.replace('-', '_')}"
                
                cur.execute(f"""
                    CREATE UNLOGGED TABLE {staging_table} (
                        site_code varchar(10),
                        equipment_name varchar(255),
                        equipment_id varchar(50),
                        performance_data varchar(500),
                        statistical_period varchar(50),
                        statistical_start_time timestamp,
                        value_text varchar(100),
                        value_numeric numeric(15,4),
                        unit varchar(50),
                        data_type varchar(20),
                        source_file varchar(255),
                        data_hash varchar(64)
                    )
                """)
                
                # 3. COPY data to staging table
                logging.info(f"📥 ใช้ COPY โหลดข้อมูล {len(staging_data):,} แถวเข้า staging table...")
                
                # Convert data for COPY
                import io
                data_io = io.StringIO()
                for row in staging_data:
                    # Handle None values and escape for COPY
                    escaped_row = []
                    for val in row:
                        if val is None:
                            escaped_row.append('\\N')
                        else:
                            # Escape special characters for COPY
                            str_val = str(val).replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
                            escaped_row.append(str_val)
                    data_io.write('\t'.join(escaped_row) + '\n')
                data_io.seek(0)
                
                cur.copy_from(
                    data_io, 
                    staging_table,
                    columns=['site_code', 'equipment_name', 'equipment_id', 'performance_data',
                            'statistical_period', 'statistical_start_time', 'value_text', 
                            'value_numeric', 'unit', 'data_type', 'source_file', 'data_hash']
                )
                
                staging_count = cur.fetchone()[0] if cur.rowcount == -1 else cur.rowcount
                logging.info(f"✅ โหลดเข้า staging table: {len(staging_data):,} แถว")
                
                # 4. Merge from staging to main table with conflict resolution
                logging.info("🔄 ทำการ MERGE จาก staging เข้าสู่ตารางหลัก...")
                
                merge_sql = f"""
                INSERT INTO fault_performance_data (
                    site_code, equipment_name, equipment_id, performance_data,
                    statistical_period, statistical_start_time, value_text, 
                    value_numeric, unit, data_type, source_file, data_hash
                )
                SELECT 
                    site_code, equipment_name, equipment_id, performance_data,
                    statistical_period, statistical_start_time, value_text, 
                    value_numeric, unit, data_type, source_file, data_hash
                FROM {staging_table}
                ON CONFLICT (site_code, equipment_name, equipment_id, performance_data, 
                           statistical_start_time, statistical_period)
                DO UPDATE SET
                    value_text = EXCLUDED.value_text,
                    value_numeric = EXCLUDED.value_numeric,
                    unit = EXCLUDED.unit,
                    source_file = EXCLUDED.source_file,
                    import_timestamp = NOW(),
                    data_hash = EXCLUDED.data_hash
                WHERE
                    COALESCE(fault_performance_data.value_text,'') IS DISTINCT FROM EXCLUDED.value_text OR
                    COALESCE(fault_performance_data.value_numeric,0) IS DISTINCT FROM EXCLUDED.value_numeric OR
                    COALESCE(fault_performance_data.unit,'') IS DISTINCT FROM EXCLUDED.unit OR
                    COALESCE(fault_performance_data.data_hash,'') IS DISTINCT FROM EXCLUDED.data_hash
                """
                
                cur.execute(merge_sql)
                merge_affected = cur.rowcount
                
                # 5. Get statistics on what happened
                cur.execute(f"""
                    SELECT COUNT(*) as total_staging
                    FROM {staging_table}
                """)
                total_staging = cur.fetchone()[0]
                
                cur.execute(f"""
                    SELECT COUNT(*) 
                    FROM fault_performance_data 
                    WHERE source_file = %s 
                    AND import_timestamp >= NOW() - INTERVAL '2 minutes'
                """, (os.path.basename(filepath),))
                recent_records = cur.fetchone()[0]
                
                # Estimate inserts vs updates
                records_inserted = min(merge_affected, total_staging)
                records_updated = max(0, total_staging - records_inserted)
                
                # 6. Clean up staging table
                logging.info("🗑️ ทำความสะอาด staging table...")
                cur.execute(f"DROP TABLE {staging_table}")
                
                # Commit all changes
                self.connection.commit()
                
            # Log completion
            self.log_import_complete(log_id, records_processed, records_inserted, 
                                   records_updated, records_skipped)
            
            logging.info(f"✅ การนำเข้าเสร็จสิ้นเรียบร้อย:")
            logging.info(f"   📊 ประมวลผลแล้ว: {records_processed:,} รายการ")
            logging.info(f"   ➕ เพิ่มใหม่ (ประมาณ): {records_inserted:,} รายการ")
            logging.info(f"   🔄 อัปเดต (ประมาณ): {records_updated:,} รายการ")
            logging.info(f"   ⏭️ ข้ามไป: {records_skipped:,} รายการ")
            logging.info(f"   🚀 ใช้ staging table method - เร็วและมีประสิทธิภาพ")
            
            return True
            
        except Exception as e:
            error_msg = str(e)
            logging.error(f"❌ การนำเข้าล้มเหลว: {error_msg}")
            if log_id:
                self.log_import_complete(log_id, records_processed, records_inserted,
                                       records_updated, records_skipped, error_msg)
            return False
    
    def determine_equipment_type(self, equipment_name):
        """Determine equipment type from name"""
        name_lower = equipment_name.lower()
        
        if 'system' in name_lower:
            return 'System'
        elif 'cooling' in name_lower or 'netcol' in name_lower:
            return 'Cooling'
        elif 'power' in name_lower or 'ups' in name_lower:
            return 'Power'
        elif 'cabinet' in name_lower:
            return 'Cabinet'
        elif 'sensor' in name_lower:
            return 'Sensor'
        elif 'aisle' in name_lower:
            return 'Environmental'
        else:
            return 'Other'
    
    def generate_import_report(self, site_code='dc'):
        """สร้างรายงานสรุปการนำเข้าข้อมูล"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cur:
                # สรุปการนำเข้าล่าสุด
                cur.execute("""
                    SELECT 
                        file_type,
                        COUNT(*) as import_count,
                        SUM(records_processed) as total_processed,
                        SUM(records_inserted) as total_inserted,
                        SUM(records_updated) as total_updated,
                        SUM(records_skipped) as total_skipped,
                        MAX(processing_end_time) as last_import
                    FROM fault_data_import_logs 
                    WHERE site_code = %s 
                    AND status = 'completed'
                    AND processing_start_time >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY file_type
                    ORDER BY file_type
                """, (site_code,))
                
                imports = cur.fetchall()
                
                # สรุปข้อมูลปัจจุบัน
                cur.execute("""
                    SELECT 
                        equipment_name,
                        equipment_id,
                        COUNT(DISTINCT performance_data) as metrics_count,
                        COUNT(*) as total_records,
                        MIN(statistical_start_time) as earliest_data,
                        MAX(statistical_start_time) as latest_data
                    FROM fault_performance_data 
                    WHERE site_code = %s
                    GROUP BY equipment_name, equipment_id
                    ORDER BY equipment_name, equipment_id
                """, (site_code,))
                
                equipment_summary = cur.fetchall()
                
                # สร้างรายงาน
                report = f"\n🎯 รายงานการนำเข้าข้อมูล ECC800 Fault Info - ไซต์: {site_code}\n"
                report += "=" * 60 + "\n\n"
                
                report += "📊 การนำเข้าล่าสุด (7 วันที่ผ่านมา):\n"
                report += "-" * 40 + "\n"
                for imp in imports:
                    report += f"  {imp['file_type']}: {imp['import_count']} ครั้ง, "
                    report += f"{imp['total_inserted']:,} เพิ่มใหม่, {imp['total_updated']:,} อัปเดต\n"
                
                report += f"\n🔧 สรุปข้อมูลอุปกรณ์:\n"
                report += "-" * 40 + "\n"
                for eq in equipment_summary:
                    report += f"  {eq['equipment_name']} ({eq['equipment_id']}): "
                    report += f"{eq['metrics_count']} ตัวชี้วัด, {eq['total_records']:,} รายการ\n"
                    report += f"    ช่วงข้อมูล: {eq['earliest_data']} ถึง {eq['latest_data']}\n"
                
                return report
                
        except Exception as e:
            logging.error(f"การสร้างรายงานล้มเหลว: {e}")
            return f"การสร้างรายงานล้มเหลว: {e}"

def main():
    parser = argparse.ArgumentParser(description='นำเข้าข้อมูล ECC800 Fault Info Performance Data')
    parser.add_argument('--site', default='DC', choices=['DC', 'DR', 'dc', 'dr'], 
                       help='รหัสไซต์ (DC/DR)')
    parser.add_argument('--files', nargs='+', required=True,
                       help='ไฟล์ CSV ที่จะนำเข้า')
    parser.add_argument('--host', default='10.251.150.222',
                       help='เซิร์ฟเวอร์ฐานข้อมูล')
    parser.add_argument('--port', default='5210',
                       help='พอร์ตฐานข้อมูล')
    parser.add_argument('--database', default='ecc800',
                       help='ชื่อฐานข้อมูล')
    parser.add_argument('--username', default='apirak',
                       help='ชื่อผู้ใช้ฐานข้อมูล')
    parser.add_argument('--password', default='Kanokwan@1987#neostar',
                       help='รหัสผ่านฐานข้อมูล')
    parser.add_argument('--report', action='store_true',
                       help='สร้างรายงานการนำเข้าหลังเสร็จสิ้น')
    
    args = parser.parse_args()
    
    # Ensure site code is uppercase
    args.site = args.site.upper()
    
    # เริ่มต้น importer
    importer = FaultPerformanceImporter(
        args.host, args.port, args.database, args.username, args.password
    )
    
    if not importer.connect():
        sys.exit(1)
    
    try:
        success_count = 0
        total_files = len(args.files)
        
        # ประมวลผลแต่ละไฟล์
        for filepath in args.files:
            if not os.path.exists(filepath):
                logging.error(f"ไม่พบไฟล์: {filepath}")
                continue
                
            logging.info(f"ประมวลผลไฟล์ {success_count + 1}/{total_files}: {filepath}")
            
            if importer.import_csv_file(filepath, args.site):
                success_count += 1
                logging.info(f"✅ นำเข้าสำเร็จ: {filepath}")
            else:
                logging.error(f"❌ นำเข้าไม่สำเร็จ: {filepath}")
        
        # สร้างรายงานถ้าต้องการ
        if args.report:
            report = importer.generate_import_report(args.site)
            
            # ส่งรายงานไปที่ central log แทนการสร้างไฟล์แยก
            logging.info("📊 รายงานการนำเข้าข้อมูล:")
            logging.info("=" * 50)
            for line in report.split('\n'):
                if line.strip():
                    logging.info(line)
            logging.info("=" * 50)
            logging.info("✅ รายงานการนำเข้าเสร็จสิ้น")
        
        logging.info(f"🎉 การนำเข้าเสร็จสิ้น: {success_count}/{total_files} ไฟล์ประมวลผลสำเร็จ")
        
    finally:
        importer.disconnect()

if __name__ == "__main__":
    main()
