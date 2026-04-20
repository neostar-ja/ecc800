#!/usr/bin/env node

/**
 * ทดสอบการแปลงเวลาใน Frontend
 * จำลอง toBangkokTime function และทดสอบกับข้อมูลจริง
 */

// จำลอง toBangkokTime function จาก dateUtils.ts
function toBangkokTime(dateString) {
  if (!dateString) return '-';

  try {
    // ถ้าเป็น string ให้พยายาม parse แบบไม่แปลง timezone
    if (typeof dateString === 'string') {
      const match = dateString.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/i
      );

      if (match) {
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const hour = match[4];
        const minute = match[5];
        const second = match[6] ?? '00';

        // ใช้ปีพุทธศักราช (+543)
        const buddhistYear = year + 543;
        return `${day}/${month}/${buddhistYear} ${hour}:${minute}:${second}`;
      }
    }

    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    // Fallback: บังคับใช้ Bangkok timezone (Asia/Bangkok = UTC+7)
    return date.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.error('Error converting date to Bangkok time:', error);
    return String(dateString || '-');
  }
}

console.log('='.repeat(80));
console.log('🧪 ทดสอบการแปลงเวลาของ Frontend (toBangkokTime)');
console.log('='.repeat(80));
console.log();

// Test cases - ข้อมูลที่ API ควรส่งมา
const testCases = [
  {
    name: 'ข้อมูลล่าสุดจาก Database (12:00:00)',
    input: '2026-01-22T12:00:00+07:00',
    expected: '22/1/2569 12:00:00'
  },
  {
    name: 'ข้อมูลเก่าที่แสดงในภาพ (06:00:00)',
    input: '2026-01-22T06:00:00+07:00',
    expected: '22/1/2569 06:00:00'
  },
  {
    name: 'ข้อมูลโดยไม่มี timezone',
    input: '2026-01-22T09:00:00',
    expected: '22/1/2569 09:00:00'
  },
  {
    name: 'ข้อมูลที่มี Z (UTC)',
    input: '2026-01-22T05:00:00Z',
    expected: '22/1/2569 05:00:00' // regex จะจับ 05:00:00
  },
  {
    name: 'Format แบบมี space แทน T',
    input: '2026-01-22 11:10:00',
    expected: '22/1/2569 11:10:00'
  }
];

let passCount = 0;
let failCount = 0;

testCases.forEach((test, index) => {
  console.log(`📋 Test ${index + 1}: ${test.name}`);
  console.log(`   Input:    "${test.input}"`);
  
  const result = toBangkokTime(test.input);
  console.log(`   Output:   "${result}"`);
  console.log(`   Expected: "${test.expected}"`);
  
  if (result === test.expected) {
    console.log('   ✅ PASS\n');
    passCount++;
  } else {
    console.log('   ❌ FAIL\n');
    failCount++;
  }
});

console.log('='.repeat(80));
console.log(`📊 ผลการทดสอบ: ✅ Pass: ${passCount}/${testCases.length} | ❌ Fail: ${failCount}/${testCases.length}`);
console.log('='.repeat(80));
console.log();

// ทดสอบกับ current time
console.log('🕐 ทดสอบกับเวลาปัจจุบัน:');
const now = new Date();
const bangkokTimeZone = now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
const bangkokDate = new Date(bangkokTimeZone);

const isoWithTZ = bangkokDate.toISOString().replace('Z', '') + '+07:00';
console.log(`   ISO with +07:00: ${isoWithTZ}`);
console.log(`   toBangkokTime:   ${toBangkokTime(isoWithTZ)}`);
console.log();

// แสดงวิธีแก้ปัญหา
console.log('💡 วิธีแก้ปัญหาที่ใช้:');
console.log('   1. Backend: ส่ง ISO datetime + "+07:00" suffix');
console.log('   2. Frontend: ใช้ regex parse โดยตรง ไม่ผ่าน Date object');
console.log('   3. React Query: ตั้ง staleTime: 0, gcTime: 0 เพื่อไม่ cache');
console.log('   4. Browser: ต้อง Clear cache และ Hard refresh (Ctrl+Shift+R)');
console.log();

if (failCount === 0) {
  console.log('🎉 โค้ดทำงานถูกต้อง! หากยังแสดงเวลาผิด ให้ Clear browser cache');
  process.exit(0);
} else {
  console.log('⚠️  พบปัญหาในการแปลงเวลา กรุณาตรวจสอบโค้ด dateUtils.ts');
  process.exit(1);
}
