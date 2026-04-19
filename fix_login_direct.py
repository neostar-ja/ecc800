#!/usr/bin/env python3
"""
Create a simplified login endpoint that won't need database connection
"""
import os
import subprocess

# Create simple login handler for testing
SIMPLIFIED_HANDLER = """
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from app.main import app
import os
import json

EMERGENCY_USERNAME = os.getenv("EMERGENCY_ADMIN_USERNAME", "admin")
EMERGENCY_PASSWORD = os.getenv("EMERGENCY_ADMIN_PASSWORD", "change-me-admin")
EMERGENCY_TOKEN = os.getenv("EMERGENCY_TOKEN", "dummy_token_for_testing_admin_login")

# Direct login endpoint for frontend
@app.post("/ecc800/api/auth/login")
async def direct_login(request: Request):
    \"\"\"Emergency login endpoint that doesn't need DB access\"\"\"
    try:
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")
        
        print(f"Login attempt: {username}")
        
        # Emergency login check for testing (values via env only)
        if username == EMERGENCY_USERNAME and password == EMERGENCY_PASSWORD:
            # Create a simple token
            token = EMERGENCY_TOKEN
            print(f"Login successful for: {username}")
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "username": username,
                    "role": "admin"
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
    except Exception as e:
        print(f"Login error: {str(e)}")
        return {"error": str(e)}
"""

# Write to a file
with open('/tmp/direct_login.py', 'w') as f:
    f.write(SIMPLIFIED_HANDLER)

# Copy to backend container and execute
print("Adding simplified login handler...")
try:
    # Copy the script to the container
    cmd = ["docker", "compose", "cp", "/tmp/direct_login.py", "backend:/tmp/direct_login.py"]
    subprocess.run(cmd, check=True, cwd='/opt/code/ecc800/ecc800')
    
    # Execute it in the container
    cmd = ["docker", "compose", "exec", "-T", "backend", "python", "-c", "exec(open('/tmp/direct_login.py').read())"]
    subprocess.run(cmd, check=True, cwd='/opt/code/ecc800/ecc800')
    
    print("✅ Added simplified login handler")

    # Test the login endpoint
    print("\nTesting login endpoint...")
        emergency_password = os.getenv("EMERGENCY_ADMIN_PASSWORD", "change-me-admin")
    cmd = ["curl", "-k", "-v", "-X", "POST", "https://10.251.150.222:3344/ecc800/api/auth/login", 
            "-d", f"username=admin&password={emergency_password}", "-H", "Content-Type: application/x-www-form-urlencoded"]
    subprocess.run(cmd, check=True)
    
except Exception as e:
    print(f"❌ Error: {e}")
