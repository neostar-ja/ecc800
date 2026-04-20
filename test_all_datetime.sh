#!/bin/bash
#
# สคริปต์รวมการทดสอบทั้งหมด
# ทดสอบโค้ด Backend, Frontend และหน้าเว็บ
#

echo "================================================================================"
echo "🧪 ระบบทดสอบการแสดงเวลา - ECC800 (ครบทุกด้าน)"
echo "================================================================================"
echo ""

cd /opt/code/ecc800/ecc800

# 1. ทดสอบโค้ด Backend และ Frontend
echo "📝 [1/3] ทดสอบโค้ด Backend และ Frontend..."
echo "--------------------------------------------------------------------------------"
python3 test_and_fix_datetime.py
CODE_TEST_RESULT=$?
echo ""

# 2. ทดสอบ JavaScript function
echo "📝 [2/3] ทดสอบ JavaScript toBangkokTime function..."
echo "--------------------------------------------------------------------------------"
node test_frontend_datetime.js
JS_TEST_RESULT=$?
echo ""

# 3. ทดสอบหน้าเว็บจริง (ถ้ามี Selenium)
echo "📝 [3/3] ทดสอบหน้าเว็บจริง..."
echo "--------------------------------------------------------------------------------"
if command -v chromium-chromedriver &> /dev/null || command -v chromedriver &> /dev/null; then
    python3 test_web_datetime.py 2>&1 | head -100
    WEB_TEST_RESULT=$?
else
    echo "⚠️  ไม่พบ ChromeDriver - ข้ามการทดสอบหน้าเว็บ"
    echo "ℹ️  ติดตั้งด้วย: sudo apt-get install chromium-chromedriver"
    WEB_TEST_RESULT=2
fi
echo ""

# สรุปผล
echo "================================================================================"
echo "📊 สรุปผลการทดสอบทั้งหมด"
echo "================================================================================"
echo ""

if [ $CODE_TEST_RESULT -eq 0 ]; then
    echo "✅ [1/3] ทดสอบโค้ด Backend/Frontend: ผ่าน"
else
    echo "❌ [1/3] ทดสอบโค้ด Backend/Frontend: ไม่ผ่าน"
fi

if [ $JS_TEST_RESULT -eq 0 ]; then
    echo "✅ [2/3] ทดสอบ JavaScript function: ผ่าน"
else
    echo "❌ [2/3] ทดสอบ JavaScript function: ไม่ผ่าน"
fi

if [ $WEB_TEST_RESULT -eq 0 ]; then
    echo "✅ [3/3] ทดสอบหน้าเว็บจริง: ผ่าน"
elif [ $WEB_TEST_RESULT -eq 2 ]; then
    echo "⏭️  [3/3] ทดสอบหน้าเว็บจริง: ข้าม (ไม่มี ChromeDriver)"
else
    echo "❌ [3/3] ทดสอบหน้าเว็บจริง: ไม่ผ่าน"
fi

echo ""
echo "================================================================================"

# ตรวจสอบผลรวม
if [ $CODE_TEST_RESULT -eq 0 ] && [ $JS_TEST_RESULT -eq 0 ]; then
    echo "🎉 โค้ดทั้งหมดถูกต้อง!"
    echo ""
    echo "💡 หากหน้าเว็บยังแสดงเวลาผิด ให้ทำตามนี้:"
    echo "   1. เปิด Browser (Chrome/Firefox)"
    echo "   2. กด Ctrl+Shift+Delete"
    echo "   3. เลือก 'Cached images and files'"
    echo "   4. กด 'Clear data'"
    echo "   5. Hard Refresh (Ctrl+Shift+R) หน้า metrics"
    echo "   6. หรือเปิดใน Incognito window (Ctrl+Shift+N)"
    echo ""
    echo "📅 เวลาที่ควรแสดง: ข้อมูลล่าสุดจากฐานข้อมูล (12:00:00 หรือใหม่กว่า)"
    echo "   แสดงเป็น: 22/1/2569 12:00:00 (ปีพุทธศักราช)"
    echo ""
    exit 0
else
    echo "⚠️  พบปัญหาบางส่วน - ตรวจสอบรายละเอียดข้างบน"
    echo ""
    exit 1
fi
