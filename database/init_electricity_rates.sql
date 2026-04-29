-- Initialize electricity rates with sample data
-- เริ่มต้นอัตราค่าไฟฟ้าด้วยข้อมูลตัวอย่าง

-- For DC (Central Data Center) - ค่า tariff ปกติ 5.12 Baht/kWh
INSERT INTO electricity_rates (
    data_center_id,
    site_code,
    rate_value,
    rate_unit,
    description,
    effective_from,
    effective_to,
    is_active,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    dc.id,
    dc.site_code,
    5.12,
    'Baht/kWh',
    'ค่าไฟเบิกจ่ายปกติ ปี 2026',
    '2026-01-01 00:00:00+00:00',
    NULL,
    true,
    'system',
    NOW(),
    NOW()
FROM data_centers dc
WHERE dc.site_code = 'DC'
  AND NOT EXISTS (
    SELECT 1 FROM electricity_rates er 
    WHERE er.data_center_id = dc.id 
      AND er.is_active = true
  )
ON CONFLICT DO NOTHING;

-- For DR (Disaster Recovery) - ค่า tariff เบาบาง 4.89 Baht/kWh (สม 24 ชั่วโมง ใช้ต่ำ)
INSERT INTO electricity_rates (
    data_center_id,
    site_code,
    rate_value,
    rate_unit,
    description,
    effective_from,
    effective_to,
    is_active,
    created_by,
    created_at,
    updated_at
)
SELECT 
    dc.id,
    dc.site_code,
    4.89,
    'Baht/kWh',
    'ค่าไฟเบิกจ่ายปกติ ปี 2026 (DR Site)',
    '2026-01-01 00:00:00+00:00',
    NULL,
    true,
    'system',
    NOW(),
    NOW()
FROM data_centers dc
WHERE dc.site_code = 'DR'
  AND NOT EXISTS (
    SELECT 1 FROM electricity_rates er 
    WHERE er.data_center_id = dc.id 
      AND er.is_active = true
  )
ON CONFLICT DO NOTHING;

-- Log completion
SELECT 'Electricity rates initialized successfully' as status;
