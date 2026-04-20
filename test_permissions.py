#!/usr/bin/env python3
"""
Test Permission System
ทดสอบว่าระบบสิทธิ์ทำงานถูกต้อง
"""
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
conn = psycopg2.connect(
    host='localhost',
    port=5210,
    database='ecc800',
    user='apirak',
    password='Kanokwan@1987#neostar'
)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("🔍 ทดสอบระบบสิทธิ์")
print("=" * 60)

# ตรวจสอบ menu items
cur.execute('SELECT id, name, display_name, path, icon FROM menu_items ORDER BY "order"')
menus = cur.fetchall()
print(f"\n📋 Menu Items ({len(menus)} items):")
print("-" * 60)
for menu in menus:
    print(f"  [{menu['id']:2d}] {menu['display_name']:25s} {menu['path']:30s} 🎨 {menu['icon']}")

# ตรวจสอบ roles
cur.execute('SELECT id, name, display_name, level FROM roles ORDER BY level DESC')
roles = cur.fetchall()
print(f"\n👥 Roles ({len(roles)} roles):")
print("-" * 60)
for role in roles:
    print(f"  [{role['id']}] {role['display_name']:15s} (level {role['level']:3d})")

# ตรวจสอบ permissions แต่ละ role
print(f"\n🔐 Permissions Matrix:")
print("=" * 60)

for role in roles:
    cur.execute("""
        SELECT 
            mi.display_name,
            mi.path,
            rmp.can_view,
            rmp.can_edit,
            rmp.can_delete
        FROM role_menu_permissions rmp
        JOIN menu_items mi ON mi.id = rmp.menu_item_id
        WHERE rmp.role_id = %s
        ORDER BY mi."order"
    """, (role['id'],))
    
    permissions = cur.fetchall()
    print(f"\n{role['display_name']} (Level {role['level']}):")
    print("-" * 60)
    
    if not permissions:
        print("  ⚠ ไม่มีสิทธิ์ใดๆ")
    else:
        for perm in permissions:
            perms = []
            if perm['can_view']:
                perms.append('👁️ View')
            if perm['can_edit']:
                perms.append('✏️ Edit')
            if perm['can_delete']:
                perms.append('🗑️ Delete')
            
            status = ', '.join(perms) if perms else '❌ No Access'
            print(f"  {perm['display_name']:25s} {perm['path']:30s} → {status}")

# สรุปสิทธิ์
print(f"\n📊 สรุป:")
print("=" * 60)
cur.execute("""
    SELECT 
        r.name,
        r.display_name,
        COUNT(DISTINCT CASE WHEN rmp.can_view THEN rmp.menu_item_id END) as menus_visible,
        COUNT(DISTINCT CASE WHEN rmp.can_edit THEN rmp.menu_item_id END) as menus_editable,
        COUNT(DISTINCT CASE WHEN rmp.can_delete THEN rmp.menu_item_id END) as menus_deletable
    FROM roles r
    LEFT JOIN role_menu_permissions rmp ON r.id = rmp.role_id
    GROUP BY r.id, r.name, r.display_name, r.level
    ORDER BY r.level DESC
""")

for row in cur.fetchall():
    print(f"{row['display_name']:15s}: 👁️ {row['menus_visible']:2d} menus | ✏️ {row['menus_editable']:2d} editable | 🗑️ {row['menus_deletable']:2d} deletable")

# ทดสอบสิทธิ์ตามที่กำหนด
print(f"\n✅ การทดสอบสิทธิ์ตามที่กำหนด:")
print("=" * 60)

test_cases = [
    ('dashboard', ['admin', 'editor', 'viewer']),
    ('datacenter_visualization', ['admin', 'editor', 'viewer']),
    ('sites', ['admin', 'editor']),
    ('equipment', ['admin', 'editor']),
    ('metrics', ['admin', 'editor', 'viewer']),
    ('faults', ['admin', 'editor']),
    ('reports', ['admin', 'editor']),
    ('admin', ['admin']),
]

all_pass = True
for menu_name, expected_roles in test_cases:
    # หา menu
    cur.execute("SELECT id, display_name FROM menu_items WHERE name = %s", (menu_name,))
    menu = cur.fetchone()
    
    if not menu:
        print(f"  ❌ Menu '{menu_name}' not found!")
        all_pass = False
        continue
    
    # หา roles ที่มีสิทธิ์ view
    cur.execute("""
        SELECT r.name
        FROM role_menu_permissions rmp
        JOIN roles r ON r.id = rmp.role_id
        WHERE rmp.menu_item_id = %s AND rmp.can_view = true
    """, (menu['id'],))
    
    actual_roles = [row['name'] for row in cur.fetchall()]
    actual_roles_set = set(actual_roles)
    expected_roles_set = set(expected_roles)
    
    if actual_roles_set == expected_roles_set:
        print(f"  ✅ {menu['display_name']:25s} → {', '.join(expected_roles)}")
    else:
        print(f"  ❌ {menu['display_name']:25s}")
        print(f"      Expected: {', '.join(expected_roles)}")
        print(f"      Actual:   {', '.join(actual_roles)}")
        all_pass = False

if all_pass:
    print(f"\n🎉 ทดสอบผ่านทั้งหมด!")
else:
    print(f"\n⚠️ มีการทดสอบที่ไม่ผ่าน")

cur.close()
conn.close()
