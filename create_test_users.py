#!/usr/bin/env python3
"""
Create Test Users for Permission Testing
สร้าง test users สำหรับทดสอบระบบสิทธิ์
"""
import psycopg2
from passlib.context import CryptContext

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
conn = psycopg2.connect(
    host='localhost',
    port=5210,
    database='ecc800',
    user='apirak',
    password='Kanokwan@1987#neostar'
)
cur = conn.cursor()

print("👥 สร้าง Test Users...")
print("=" * 60)

# Test users
test_users = [
    {
        'username': 'test_viewer',
        'password': 'viewer123',
        'full_name': 'Test Viewer User',
        'role': 'viewer',
        'email': 'viewer@test.com'
    },
    {
        'username': 'test_editor',
        'password': 'editor123',
        'full_name': 'Test Editor User',
        'role': 'editor',
        'email': 'editor@test.com'
    },
]

created = []
for user in test_users:
    # ตรวจสอบว่ามี user นี้อยู่แล้วหรือไม่
    cur.execute("SELECT id FROM users WHERE username = %s", (user['username'],))
    existing = cur.fetchone()
    
    if existing:
        print(f"  ℹ️  {user['username']:15s} already exists (role: {user['role']})")
        continue
    
    # Hash password
    hashed_password = pwd_context.hash(user['password'])
    
    # สร้าง user
    cur.execute("""
        INSERT INTO users (username, password_hash, full_name, role, email, is_active)
        VALUES (%s, %s, %s, %s, %s, true)
        RETURNING id
    """, (
        user['username'],
        hashed_password,
        user['full_name'],
        user['role'],
        user['email']
    ))
    
    user_id = cur.fetchone()[0]
    print(f"  ✅ {user['username']:15s} created (ID: {user_id}, role: {user['role']})")
    created.append(user)

conn.commit()

if created:
    print(f"\n✅ สร้าง {len(created)} users สำเร็จ!")
    print("\n📝 ข้อมูล Login:")
    print("=" * 60)
    for user in created:
        print(f"  Username: {user['username']}")
        print(f"  Password: {user['password']}")
        print(f"  Role:     {user['role']}")
        print()
else:
    print(f"\nℹ️  Test users มีอยู่แล้วทั้งหมด")

# แสดง users ทั้งหมด
print("\n👤 Users ทั้งหมดในระบบ:")
print("=" * 60)
cur.execute("""
    SELECT id, username, full_name, role, is_active, email
    FROM users
    ORDER BY 
        CASE role
            WHEN 'admin' THEN 1
            WHEN 'editor' THEN 2
            WHEN 'viewer' THEN 3
            ELSE 4
        END,
        username
""")

for row in cur.fetchall():
    status = "✅" if row[4] else "❌"
    print(f"  {status} [{row[0]:2d}] {row[1]:15s} | {row[3]:8s} | {row[2]}")

cur.close()
conn.close()

print("\n🎉 พร้อมทดสอบระบบสิทธิ์!")
print("\n📌 ขั้นตอนการทดสอบ:")
print("  1. เปิดเบราว์เซอร์ที่ https://10.251.150.222:3344/ecc800")
print("  2. Login ด้วย test_viewer / viewer123")
print("  3. ตรวจสอบว่าเห็นเมนูเฉพาะ: Dashboard, Data Center Visualization, Metrics")
print("  4. Logout และ Login ด้วย test_editor / editor123")
print("  5. ตรวจสอบว่าเห็นเมนูเพิ่มเติม: Sites, Equipment, Faults, Reports, ฯลฯ")
print("  6. ลอง access URL โดยตรง เช่น /equipment ด้วย viewer จะต้องถูก block")
