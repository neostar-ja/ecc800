#!/usr/bin/env python3
"""
ทดสอบการ verify password
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from app.auth.jwt import verify_password

def test_password():
    """ทดสอบ password verification"""
    plain_password = "Admin123!"
    # Hash จากฐานข้อมูล (ส่วนแรกของ hash ที่เราเห็น)
    # ต้องได้ hash เต็มจากฐานข้อมูล
    print("Testing password verification...")
    print(f"Plain password: {plain_password}")

if __name__ == "__main__":
    test_password()
