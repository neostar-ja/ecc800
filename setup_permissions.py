#!/usr/bin/env python3
"""
Setup Menu Items and Permissions Script
กำหนดเมนูและสิทธิ์ตามที่ต้องการ
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection - use environment variables with fallback
conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST', 'localhost'),
    port=int(os.getenv('POSTGRES_PORT', '5432')),
    database=os.getenv('POSTGRES_DB', 'ecc800'),
    user=os.getenv('POSTGRES_USER', 'postgres'),
    password=os.getenv('POSTGRES_PASSWORD', '')
)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("🔧 กำลังอัพเดท Menu Items...")

# อัพเดท menu items ให้ตรงกับ URLs
updates = [
    ("UPDATE menu_items SET path = '/dashboard' WHERE name = 'dashboard'", "Dashboard"),
    ("UPDATE menu_items SET path = '/datacenter-visualization', name = 'datacenter_visualization', display_name = 'Data Center Visualization' WHERE id = 2", "Data Center Visualization"),
    ("UPDATE menu_items SET display_name = 'Sites' WHERE name = 'sites'", "Sites"),
]

for sql, name in updates:
    cur.execute(sql)
    print(f"  ✓ Updated {name}")

# เพิ่ม equipment ถ้ายังไม่มี
cur.execute("""
INSERT INTO menu_items (name, display_name, path, icon, "order", is_visible)
SELECT 'equipment', 'Equipment', '/equipment', 'Memory', 11, true
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'equipment')
RETURNING id
""")
if cur.fetchone():
    print(f"  ✓ Added Equipment menu")
else:
    print(f"  ℹ Equipment menu already exists")

conn.commit()

# ดึงข้อมูล menu items และ roles
cur.execute('SELECT id, name, display_name, path FROM menu_items ORDER BY "order"')
menus = {row['name']: row for row in cur.fetchall()}

cur.execute('SELECT id, name FROM roles')
roles = {row['name']: row['id'] for row in cur.fetchall()}

print(f"\n📋 Menu Items: {len(menus)} items")
for name, menu in menus.items():
    print(f"  - {menu['display_name']}: {menu['path']}")

print(f"\n👥 Roles: {len(roles)} roles")
for name, role_id in roles.items():
    print(f"  - {name}: ID {role_id}")

# กำหนดสิทธิ์ตามที่ต้องการ
print(f"\n🔐 กำลังกำหนดสิทธิ์...")

# Permission mapping: menu_name -> [roles that can view]
permission_map = {
    'dashboard': ['admin', 'editor', 'viewer'],
    'datacenter_visualization': ['admin', 'editor', 'viewer'],
    'sites': ['admin', 'editor'],
    'equipment': ['admin', 'editor'],
    'metrics': ['admin', 'editor', 'viewer'],
    'faults': ['admin', 'editor'],
    'reports': ['admin', 'editor'],
    'admin': ['admin'],  # เฉพาะ admin เท่านั้น
    'settings': ['admin'],
    'power_cooling': ['admin', 'editor'],
    'work_orders': ['admin', 'editor'],
}

# ลบ permissions เก่าทั้งหมด
cur.execute("DELETE FROM role_menu_permissions")
print("  ✓ Cleared old permissions")

# สร้าง permissions ใหม่
count = 0
for menu_name, role_names in permission_map.items():
    if menu_name not in menus:
        print(f"  ⚠ Menu '{menu_name}' not found, skipping...")
        continue
    
    menu_id = menus[menu_name]['id']
    
    for role_name in role_names:
        if role_name not in roles:
            print(f"  ⚠ Role '{role_name}' not found, skipping...")
            continue
        
        role_id = roles[role_name]
        
        # Admin ได้สิทธิ์เต็ม, อื่นๆ ได้แค่ view
        can_edit = (role_name == 'admin')
        can_delete = (role_name == 'admin')
        
        cur.execute("""
            INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_edit, can_delete)
            VALUES (%s, %s, %s, %s, %s)
        """, (role_id, menu_id, True, can_edit, can_delete))
        
        perms = "view"
        if can_edit:
            perms += ", edit"
        if can_delete:
            perms += ", delete"
        
        print(f"  ✓ {menus[menu_name]['display_name']:25s} -> {role_name:10s} [{perms}]")
        count += 1

conn.commit()

print(f"\n✅ สำเร็จ! สร้าง {count} permissions")

# แสดงสรุป
print(f"\n📊 สรุปสิทธิ์:")
cur.execute("""
    SELECT 
        r.name as role_name,
        r.level,
        COUNT(CASE WHEN rmp.can_view THEN 1 END) as view_count,
        COUNT(CASE WHEN rmp.can_edit THEN 1 END) as edit_count,
        COUNT(CASE WHEN rmp.can_delete THEN 1 END) as delete_count
    FROM roles r
    LEFT JOIN role_menu_permissions rmp ON r.id = rmp.role_id
    GROUP BY r.name, r.level
    ORDER BY r.level DESC
""")
for row in cur.fetchall():
    print(f"  {row['role_name']:10s}: View={row['view_count']}, Edit={row['edit_count']}, Delete={row['delete_count']}")

cur.close()
conn.close()

print("\n🎉 เสร็จสิ้น!")
