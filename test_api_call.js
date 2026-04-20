#!/usr/bin/env node

/**
 * ทดสอบเรียก API โดยตรงและแสดงผลข้อมูลที่ได้รับ
 */

const https = require('https');

// ปิด SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('='.repeat(80));
console.log('🔍 ทดสอบเรียก Enhanced Metrics API');
console.log('='.repeat(80));
console.log();

// Test parameters from screenshot
const testConfigs = [
  {
    name: 'T/H Sensor5 (ในภาพ)',
    params: {
      equipment_name: 'Aisle-T/H Sensor Group-T/H Sensor5',
      data_center_id: 1,
      period: '1d'
    }
  },
  {
    name: 'T/H Sensor7 (มีข้อมูลล่าสุด)',
    params: {
      equipment_name: 'Aisle-T/H Sensor Group-T/H Sensor7',
      data_center_id: 1,
      period: '1d'
    }
  }
];

async function testAPI(config) {
  return new Promise((resolve, reject) => {
    console.log(`📡 กำลังเรียก API: ${config.name}`);
    console.log(`   Parameters:`, JSON.stringify(config.params, null, 2));
    
    const params = new URLSearchParams(config.params);
    const url = `https://127.0.0.1:3344/ecc800/api/enhanced-metrics?${params}`;
    
    https.get(url, {
      headers: {
        'Accept': 'application/json'
      },
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      
      res.on('end', () => {
        console.log(`   Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   Total Metrics: ${json.metrics?.length || 0}`);
            
            if (json.metrics && json.metrics.length > 0) {
              console.log();
              console.log('   📊 ข้อมูล Metrics:');
              json.metrics.slice(0, 3).forEach((metric, idx) => {
                console.log(`   ${idx + 1}. ${metric.metric_name}`);
                console.log(`      ├─ latest_value: ${metric.latest_value}`);
                console.log(`      ├─ latest_time: ${metric.latest_time}`);
                console.log(`      └─ unit: ${metric.unit}`);
              });
            }
            
            resolve(json);
          } catch (e) {
            console.log(`   ❌ Error parsing JSON: ${e.message}`);
            reject(e);
          }
        } else {
          console.log(`   ⚠️  Response: ${data.substring(0, 200)}`);
          reject(new Error(`Status ${res.statusCode}`));
        }
        console.log();
      });
    }).on('error', (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      console.log();
      reject(err);
    });
  });
}

// Main execution
(async () => {
  try {
    for (const config of testConfigs) {
      try {
        await testAPI(config);
      } catch (e) {
        console.log(`Skipping due to error: ${e.message}\n`);
      }
    }
    
    console.log('='.repeat(80));
    console.log('✅ การทดสอบเสร็จสิ้น');
    console.log('='.repeat(80));
    console.log();
    console.log('📝 สรุป:');
    console.log('   - หากได้ latest_time: "2026-01-22T12:00:00+07:00" แสดงว่า API ถูกต้อง');
    console.log('   - หากยังแสดง 06:00:00 ใน browser แสดงว่าเป็น browser cache');
    console.log('   - แก้ไข: Clear cache (Ctrl+Shift+Delete) และ Hard refresh (Ctrl+Shift+R)');
    console.log();
    
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
