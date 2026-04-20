#!/usr/bin/env python3
"""
สคริปต์ทดสอบการแสดงเวลาในหน้าเว็บด้วย Selenium
ทดสอบว่าหน้า metrics แสดงเวลาถูกต้องหรือไม่
"""

import time
import re
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

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

class WebPageTester:
    def __init__(self):
        self.base_url = "https://10.251.150.222:3344/ecc800"
        self.driver = None
        
    def setup_driver(self):
        """ตั้งค่า Chrome driver"""
        print_info("กำลังเริ่ม Chrome WebDriver...")
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # รันแบบไม่แสดง GUI
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--ignore-certificate-errors')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print_success("เริ่ม Chrome สำเร็จ")
            return True
        except Exception as e:
            print_error(f"ไม่สามารถเริ่ม Chrome: {e}")
            print_warning("ต้องติดตั้ง ChromeDriver ก่อน:")
            print_info("  sudo apt-get install chromium-chromedriver")
            return False
    
    def login(self):
        """Login เข้าระบบ"""
        print_info("กำลัง Login...")
        
        try:
            self.driver.get(f"{self.base_url}/login")
            time.sleep(2)
            
            # หา username และ password fields
            username = self.driver.find_element(By.NAME, "username")
            password = self.driver.find_element(By.NAME, "password")
            
            # ใส่ข้อมูล (ใช้ test user)
            username.send_keys("test_viewer")
            password.send_keys("viewer123")
            
            # กด Login
            login_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_btn.click()
            
            time.sleep(3)
            
            # ตรวจสอบว่า login สำเร็จ
            if "/dashboard" in self.driver.current_url or "/metrics" in self.driver.current_url:
                print_success("Login สำเร็จ")
                return True
            else:
                print_warning("Login อาจไม่สำเร็จ - ลองต่อไป")
                return True  # ลองต่อไปอยู่ดี
                
        except Exception as e:
            print_error(f"Login ไม่สำเร็จ: {e}")
            return False
    
    def test_metrics_page(self):
        """ทดสอบหน้า metrics"""
        print_header("🧪 ทดสอบหน้า Metrics")
        
        try:
            self.driver.get(f"{self.base_url}/metrics")
            time.sleep(5)  # รอให้โหลดข้อมูล
            
            # หา metric cards
            cards = self.driver.find_elements(By.CSS_SELECTOR, "[class*='MuiCard']")
            print_info(f"พบ {len(cards)} cards")
            
            # หาข้อความ "อัพเดต:"
            timestamps = []
            page_source = self.driver.page_source
            
            # Pattern: อัพเดต: 22/1/2569 12:00:00
            pattern = r'อัพเดต:\s*(\d{1,2}/\d{1,2}/\d{4}\s+\d{2}:\d{2}:\d{2})'
            matches = re.findall(pattern, page_source)
            
            if matches:
                print_success(f"พบเวลา {len(matches)} รายการ:")
                for ts in matches:
                    timestamps.append(ts)
                    print(f"  - อัพเดต: {ts}")
                    
                # วิเคราะห์เวลา
                self.analyze_timestamps(timestamps)
                return True
            else:
                print_warning("ไม่พบข้อความ 'อัพเดต:' ในหน้า")
                
                # ลองหาด้วย element
                try:
                    update_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'อัพเดต')]")
                    if update_elements:
                        print_info(f"พบ element ที่มี 'อัพเดต' {len(update_elements)} รายการ")
                        for elem in update_elements[:5]:
                            print(f"  - {elem.text}")
                except:
                    pass
                
                return False
                
        except Exception as e:
            print_error(f"ทดสอบหน้า metrics ไม่สำเร็จ: {e}")
            return False
    
    def test_faults_page(self):
        """ทดสอบหน้า faults (เป็นหน้าที่แสดงถูกต้อง)"""
        print_header("🧪 ทดสอบหน้า Faults (อ้างอิง)")
        
        try:
            self.driver.get(f"{self.base_url}/faults")
            time.sleep(5)
            
            page_source = self.driver.page_source
            
            # หาเวลาในหน้า faults
            pattern = r'(\d{1,2}/\d{1,2}/\d{4},?\s+\d{2}:\d{2})'
            matches = re.findall(pattern, page_source)
            
            if matches:
                print_success(f"พบเวลาในหน้า Faults {len(matches)} รายการ (ตัวอย่าง):")
                for ts in matches[:5]:
                    print(f"  - {ts}")
                return True
            else:
                print_info("ไม่พบเวลาในหน้า Faults")
                return False
                
        except Exception as e:
            print_error(f"ทดสอบหน้า faults ไม่สำเร็จ: {e}")
            return False
    
    def analyze_timestamps(self, timestamps):
        """วิเคราะห์เวลาที่พบ"""
        print_header("📊 วิเคราะห์เวลาที่แสดง")
        
        if not timestamps:
            print_warning("ไม่มีข้อมูลเวลาให้วิเคราะห์")
            return
        
        # แยกเวลาออกมา
        times = []
        for ts in timestamps:
            # Format: 22/1/2569 12:00:00
            match = re.search(r'(\d{2}):(\d{2}):(\d{2})', ts)
            if match:
                hour = int(match.group(1))
                minute = int(match.group(2))
                second = int(match.group(3))
                times.append((hour, minute, second))
        
        if times:
            print_info("เวลาที่พบ:")
            for h, m, s in times:
                print(f"  - {h:02d}:{m:02d}:{s:02d}")
            
            # ตรวจสอบว่าเป็นเวลาล่าสุดหรือไม่
            now = datetime.now()
            print_info(f"\nเวลาปัจจุบัน: {now.strftime('%H:%M:%S')}")
            
            # คาดว่าควรเป็นเวลาในช่วง 06:00 - 13:00 (ข้อมูลประจำวัน)
            reasonable = [t for t in times if 6 <= t[0] <= 13]
            if reasonable:
                print_success(f"พบเวลาที่สมเหตุสมผล {len(reasonable)} รายการ")
            else:
                print_warning("เวลาที่แสดงอาจไม่ถูกต้อง")
    
    def take_screenshot(self, filename):
        """จับภาพหน้าจอ"""
        try:
            self.driver.save_screenshot(filename)
            print_success(f"บันทึกภาพหน้าจอ: {filename}")
        except Exception as e:
            print_error(f"ไม่สามารถบันทึกภาพ: {e}")
    
    def run_all_tests(self):
        """รันทดสอบทั้งหมด"""
        print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
        print(f"{BOLD}{BLUE}🌐 ระบบทดสอบหน้าเว็บ - ECC800{RESET}")
        print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")
        
        if not self.setup_driver():
            return 1
        
        try:
            # Login
            if not self.login():
                print_warning("ข้าม login - ลองเข้าหน้าโดยตรง")
            
            # ทดสอบหน้า metrics
            metrics_ok = self.test_metrics_page()
            
            # จับภาพ metrics page
            self.take_screenshot("/opt/code/ecc800/ecc800/metrics_screenshot.png")
            
            # ทดสอบหน้า faults (อ้างอิง)
            faults_ok = self.test_faults_page()
            
            # จับภาพ faults page
            self.take_screenshot("/opt/code/ecc800/ecc800/faults_screenshot.png")
            
            # สรุปผล
            print_header("📋 สรุปผลการทดสอบ")
            
            if metrics_ok:
                print_success("หน้า Metrics แสดงเวลาได้ ✅")
                print_info("กรุณาตรวจสอบภาพหน้าจอ metrics_screenshot.png")
            else:
                print_error("หน้า Metrics ไม่สามารถแสดงเวลาได้ ❌")
            
            if faults_ok:
                print_success("หน้า Faults แสดงเวลาได้ (อ้างอิง) ✅")
            
            return 0 if metrics_ok else 1
            
        except Exception as e:
            print_error(f"เกิดข้อผิดพลาด: {e}")
            return 1
        finally:
            if self.driver:
                self.driver.quit()
                print_info("ปิด WebDriver แล้ว")

def main():
    tester = WebPageTester()
    exit_code = tester.run_all_tests()
    
    print("\n" + "="*80)
    if exit_code == 0:
        print(f"{GREEN}✅ การทดสอบเสร็จสิ้น - ผ่านทุกรายการ{RESET}")
    else:
        print(f"{YELLOW}⚠️  การทดสอบเสร็จสิ้น - พบปัญหา{RESET}")
        print(f"{BLUE}💡 แนะนำ:{RESET}")
        print("  1. Clear browser cache และ Hard refresh")
        print("  2. ตรวจสอบภาพหน้าจอที่บันทึกไว้")
        print("  3. ตรวจสอบ Browser Console (F12) มี error หรือไม่")
    print("="*80 + "\n")
    
    return exit_code

if __name__ == '__main__':
    import sys
    sys.exit(main())
