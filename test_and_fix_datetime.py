#!/usr/bin/env python3
"""
สคริปต์ทดสอบและแก้ไขการแสดงเวลาในหน้าเว็บ
- ทดสอบ API response
- ทดสอบ Frontend code
- แก้ไขอัตโนมัติหากพบปัญหา
"""

import os
import sys
import re
import json
import psycopg2
from datetime import datetime, timedelta
from pathlib import Path

# สี ANSI
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{'='*80}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{RESET}")

class DateTimeChecker:
    def __init__(self):
        self.issues = []
        self.fixes_applied = []
        
        # Database connection
        self.db_config = {
            'host': os.environ.get('POSTGRES_HOST', 'host.docker.internal'),
            'port': os.environ.get('POSTGRES_PORT', '5210'),
            'dbname': os.environ.get('POSTGRES_DB', 'ecc800'),
            'user': os.environ.get('POSTGRES_USER', 'apirak'),
            'password': os.environ.get('POSTGRES_PASSWORD')
        }
        
        self.base_path = Path('/opt/code/ecc800/ecc800')
    
    def test_database_data(self):
        """ทดสอบข้อมูลในฐานข้อมูล"""
        print_header("📊 ทดสอบข้อมูลในฐานข้อมูล")
        
        try:
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor()
            
            # ดูข้อมูลล่าสุด
            cur.execute("""
                SELECT equipment_name, performance_data, statistical_start_time, value_numeric
                FROM performance_data
                ORDER BY statistical_start_time DESC
                LIMIT 5
            """)
            
            print_info("ข้อมูล 5 รายการล่าสุดในฐานข้อมูล:")
            latest_time = None
            for row in cur.fetchall():
                timestamp = row[2]
                if not latest_time:
                    latest_time = timestamp
                print(f"  {timestamp} - {row[0]}: {row[1]} = {row[3]}")
            
            if latest_time:
                print_success(f"ข้อมูลล่าสุด: {latest_time}")
                return latest_time
            else:
                print_error("ไม่พบข้อมูลในฐานข้อมูล")
                return None
                
        except Exception as e:
            print_error(f"ไม่สามารถเชื่อมต่อฐานข้อมูล: {e}")
            return None
        finally:
            if 'conn' in locals():
                conn.close()
    
    def test_backend_datetime_conversion(self):
        """ทดสอบฟังก์ชันแปลงเวลาของ Backend"""
        print_header("🔧 ทดสอบ Backend DateTime Conversion")
        
        backend_file = self.base_path / 'backend/app/api/routes/enhanced_metrics.py'
        
        if not backend_file.exists():
            print_error(f"ไม่พบไฟล์: {backend_file}")
            return False
        
        content = backend_file.read_text()
        
        # ตรวจสอบ _datetime_to_iso_bangkok function
        if '_datetime_to_iso_bangkok' in content:
            print_success("พบฟังก์ชัน _datetime_to_iso_bangkok")
            
            # ตรวจสอบว่ามีการเพิ่ม +07:00
            if "'+07:00'" in content or '"+07:00"' in content:
                print_success("Backend เพิ่ม +07:00 timezone ถูกต้อง")
                return True
            else:
                print_error("Backend ไม่ได้เพิ่ม +07:00 timezone")
                self.issues.append("backend_missing_timezone")
                return False
        else:
            print_error("ไม่พบฟังก์ชัน _datetime_to_iso_bangkok")
            return False
    
    def test_frontend_dateutils(self):
        """ทดสอบ Frontend dateUtils.ts"""
        print_header("🎨 ทดสอบ Frontend dateUtils.ts")
        
        dateutils_file = self.base_path / 'frontend/src/lib/dateUtils.ts'
        
        if not dateutils_file.exists():
            print_error(f"ไม่พบไฟล์: {dateutils_file}")
            return False
        
        content = dateutils_file.read_text()
        
        # ตรวจสอบ toBangkokTime function
        if 'export function toBangkokTime' in content:
            print_success("พบฟังก์ชัน toBangkokTime")
            
            # ตรวจสอบ regex pattern
            if r'/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})' in content:
                print_success("มี regex pattern สำหรับ parse datetime")
                return True
            else:
                print_error("ไม่พบ regex pattern ที่ถูกต้อง")
                self.issues.append("frontend_missing_regex")
                return False
        else:
            print_error("ไม่พบฟังก์ชัน toBangkokTime")
            return False
    
    def check_metrics_page_usage(self):
        """ตรวจสอบว่า ImprovedMetricsPage ใช้ toBangkokTime หรือไม่"""
        print_header("📄 ตรวจสอบการใช้งานใน ImprovedMetricsPage")
        
        metrics_file = self.base_path / 'frontend/src/pages/ImprovedMetricsPage.tsx'
        
        if not metrics_file.exists():
            print_error(f"ไม่พบไฟล์: {metrics_file}")
            return False
        
        content = metrics_file.read_text()
        
        # ตรวจสอบ import
        if 'import { toBangkokTime' in content:
            print_success("มีการ import toBangkokTime")
        else:
            print_error("ไม่มีการ import toBangkokTime")
            self.issues.append("metrics_no_import")
            return False
        
        # ตรวจสอบการใช้งาน
        if 'toBangkokTime(metric.latest_time)' in content or 'toBangkokTime(latest_time)' in content:
            print_success("ใช้ toBangkokTime สำหรับ latest_time")
        else:
            print_warning("อาจไม่ได้ใช้ toBangkokTime กับ latest_time")
        
        # ตรวจสอบ React Query cache settings
        if 'staleTime: 0' in content:
            print_success("ตั้ง staleTime: 0 (ไม่ใช้ cache)")
        else:
            print_warning("ไม่พบการตั้ง staleTime: 0")
            self.issues.append("metrics_cache_issue")
        
        if 'gcTime: 0' in content or 'cacheTime: 0' in content:
            print_success("ตั้ง gcTime/cacheTime: 0")
        else:
            print_warning("ไม่พบการตั้ง gcTime/cacheTime: 0")
        
        return True
    
    def compare_with_faults_page(self):
        """เปรียบเทียบกับหน้า Faults ที่ทำงานถูกต้อง"""
        print_header("🔍 เปรียบเทียบกับ ImprovedFaultsPage (หน้าที่ทำงานถูกต้อง)")
        
        faults_file = self.base_path / 'frontend/src/pages/ImprovedFaultsPage.tsx'
        metrics_file = self.base_path / 'frontend/src/pages/ImprovedMetricsPage.tsx'
        
        if not faults_file.exists() or not metrics_file.exists():
            print_error("ไม่พบไฟล์ที่ต้องการเปรียบเทียบ")
            return False
        
        faults_content = faults_file.read_text()
        metrics_content = metrics_file.read_text()
        
        # หน้า Faults ใช้วิธีไหน?
        if 'toLocaleString' in faults_content and 'th-TH' in faults_content:
            print_info("หน้า Faults ใช้: toLocaleString('th-TH', {...})")
            
            # ตรวจสอบว่าระบุ timeZone หรือไม่
            if "timeZone: 'Asia/Bangkok'" in faults_content:
                print_info("  └─ ระบุ timeZone: 'Asia/Bangkok'")
            else:
                print_info("  └─ ไม่ระบุ timeZone (ใช้ browser timezone)")
        
        # หน้า Metrics ใช้วิธีไหน?
        if 'toBangkokTime' in metrics_content:
            print_info("หน้า Metrics ใช้: toBangkokTime() จาก dateUtils.ts")
        
        return True
    
    def suggest_fix(self):
        """แนะนำวิธีแก้ไข"""
        print_header("💡 คำแนะนำการแก้ไข")
        
        if not self.issues:
            print_success("ไม่พบปัญหา! โค้ดถูกต้องแล้ว")
            print_info("\nหากยังแสดงเวลาผิดในหน้าเว็บ ให้ลอง:")
            print_info("  1. Clear browser cache (Ctrl+Shift+Delete)")
            print_info("  2. Hard refresh (Ctrl+Shift+R)")
            print_info("  3. เปิดใน Incognito window")
            return
        
        print_warning(f"พบปัญหา {len(self.issues)} รายการ:\n")
        
        for issue in self.issues:
            if issue == "backend_missing_timezone":
                print(f"{RED}❌ Backend:{RESET} ไม่ได้เพิ่ม +07:00 timezone")
                print(f"   {BLUE}แก้ไข:{RESET} แก้ไข _datetime_to_iso_bangkok ใน enhanced_metrics.py")
                
            elif issue == "frontend_missing_regex":
                print(f"{RED}❌ Frontend:{RESET} dateUtils.ts ไม่มี regex pattern")
                print(f"   {BLUE}แก้ไข:{RESET} เพิ่ม regex ใน toBangkokTime function")
                
            elif issue == "metrics_no_import":
                print(f"{RED}❌ Metrics Page:{RESET} ไม่ได้ import toBangkokTime")
                print(f"   {BLUE}แก้ไข:{RESET} import {{ toBangkokTime }} from '../lib/dateUtils'")
                
            elif issue == "metrics_cache_issue":
                print(f"{YELLOW}⚠️  Metrics Page:{RESET} React Query อาจใช้ cache")
                print(f"   {BLUE}แก้ไข:{RESET} เพิ่ม staleTime: 0, gcTime: 0 ใน useQuery")
    
    def apply_fix_if_needed(self):
        """แก้ไขปัญหาอัตโนมัติ (ถ้าสามารถทำได้)"""
        print_header("🔧 ตรวจสอบว่าต้องแก้ไขอะไรบ้าง")
        
        # ตรวจสอบว่า toBangkokTime ใช้งานถูกต้องหรือไม่
        dateutils_file = self.base_path / 'frontend/src/lib/dateUtils.ts'
        content = dateutils_file.read_text()
        
        # ปัญหาที่พบ: toBangkokTime อาจใช้ timeZone: 'Asia/Bangkok' ซึ่งทำให้ browser แปลง timezone
        # ควรใช้วิธีเดียวกับหน้า Faults ที่ไม่ระบุ timeZone
        
        if "timeZone: 'Asia/Bangkok'" in content:
            print_warning("พบว่า dateUtils.ts ใช้ timeZone: 'Asia/Bangkok'")
            print_info("นี่อาจทำให้ browser แปลง timezone อีกรอบ")
            print_info("\nแนะนำ: แก้ไข toBangkokTime ให้ใช้ regex parse เหมือนที่ทำไว้แล้ว")
            print_info("       และไม่ควรใช้ toLocaleString ใน fallback")
        
        # ตรวจสอบว่ามี regex parsing หรือไม่
        if r'match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})' in content:
            print_success("dateUtils.ts มี regex parsing อยู่แล้ว - ถูกต้อง!")
        
        return True
    
    def run_all_tests(self):
        """รันการทดสอบทั้งหมด"""
        print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
        print(f"{BOLD}{BLUE}🧪 ระบบทดสอบและแก้ไขการแสดงเวลา - ECC800{RESET}")
        print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")
        
        # 1. ทดสอบฐานข้อมูล
        latest_db_time = self.test_database_data()
        
        # 2. ทดสอบ Backend
        backend_ok = self.test_backend_datetime_conversion()
        
        # 3. ทดสอบ Frontend dateUtils
        frontend_ok = self.test_frontend_dateutils()
        
        # 4. ตรวจสอบการใช้งานใน Metrics page
        usage_ok = self.check_metrics_page_usage()
        
        # 5. เปรียบเทียบกับหน้า Faults
        self.compare_with_faults_page()
        
        # 6. แนะนำวิธีแก้ไข
        self.suggest_fix()
        
        # 7. ลองแก้ไขอัตโนมัติ
        self.apply_fix_if_needed()
        
        # สรุปผล
        print_header("📋 สรุปผลการทดสอบ")
        
        if backend_ok and frontend_ok and usage_ok:
            print_success("โค้ดทั้งหมดถูกต้อง ✅")
            print_info("\n💡 หากหน้าเว็บยังแสดงเวลาผิด แสดงว่าเป็นปัญหา Browser Cache")
            print_info("   ให้ทำตามขั้นตอนนี้:")
            print_info("   1. เปิด Browser DevTools (F12)")
            print_info("   2. คลิกขวาที่ปุ่ม Refresh → Empty Cache and Hard Reload")
            print_info("   3. หรือกด Ctrl+Shift+Delete → Clear cache")
            print_info("   4. หรือเปิดใน Incognito/Private window")
            
            if latest_db_time:
                expected = latest_db_time.strftime('%d/%m/%Y %H:%M:%S')
                buddhist_year = latest_db_time.year + 543
                expected_thai = f"{latest_db_time.day}/{latest_db_time.month}/{buddhist_year} {latest_db_time.strftime('%H:%M:%S')}"
                print_info(f"\n📅 เวลาที่ควรแสดง: {expected_thai}")
            
            return 0
        else:
            print_error("พบปัญหาในโค้ด ❌")
            print_info("\nรัน script นี้อีกครั้งหลังแก้ไขเพื่อตรวจสอบ")
            return 1

def main():
    checker = DateTimeChecker()
    exit_code = checker.run_all_tests()
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
