#!/usr/bin/env python3
"""
Script to fix login endpoint by mounting it directly to the running backend.
"""
import os
import subprocess
import time

print("Fixing login endpoint on backend container...")

# Create a temporary Python script for the backend
script_content = """
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.main import app
from app.core.database import get_db
from app.services.user_service import UserService
from app.auth.jwt import create_access_token

# Check if the login endpoint is already registered
login_paths = [r.path for r in app.routes if hasattr(r, 'path') and r.path == '/ecc800/api/auth/login']
print(f"Found existing login paths: {login_paths}")

if not login_paths:
    # Create a new login endpoint
    @app.post("/ecc800/api/auth/login")
    async def login(form_data: OAuth2PasswordRequestForm = Depends()):
        try:
            async for db in get_db():
                user = await UserService.authenticate_user(db, form_data.username, form_data.password)
                if not user:
                    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
                token = create_access_token({"sub": user.username, "role": user.role})
                return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "username": user.username, "role": user.role}}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
    
    print("✅ Added login endpoint: /ecc800/api/auth/login")
else:
    print("ℹ️ Login endpoint already exists, no changes made")

# Verify all routes
all_routes = [(r.path, list(r.methods) if hasattr(r, 'methods') else ["GET"]) for r in app.routes if hasattr(r, 'path')]
print(f"All routes ({len(all_routes)}):")
for path, methods in all_routes:
    if 'login' in path or 'auth' in path:
        print(f"  {methods} {path}")
"""

# Write script to a temporary file
with open('/tmp/fix_login.py', 'w') as f:
    f.write(script_content)

# Execute the Python script in the backend container
cmd = ["docker", "compose", "exec", "-T", "backend", "python", "-c", 
       "exec(open('/tmp/fix_login.py').read())"]

try:
    # First copy the script to the container
    copy_cmd = ["docker", "compose", "cp", "/tmp/fix_login.py", "backend:/tmp/fix_login.py"]
    subprocess.run(copy_cmd, check=True, cwd='/opt/code/ecc800/ecc800')
    
    # Then execute it
    result = subprocess.run(cmd, capture_output=True, text=True, cwd='/opt/code/ecc800/ecc800')
    print(result.stdout)
    print(result.stderr)
    
    if result.returncode != 0:
        print(f"❌ Error: Command exited with code {result.returncode}")
    else:
        print("✅ Successfully added login endpoint")
except Exception as e:
    print(f"❌ Error running command: {e}")

print("\nTesting login endpoint with curl...")
time.sleep(1)  # Give the endpoint time to register

# Test the endpoint
test_cmd = ["curl", "-k", "-v", "-X", "POST", "https://10.251.150.222:3344/ecc800/api/auth/login", 
            "-d", "username=admin&password=Admin123!", "-H", "Content-Type: application/x-www-form-urlencoded"]

try:
    test_result = subprocess.run(test_cmd, capture_output=True, text=True)
    print(test_result.stdout)
    print(test_result.stderr)
except Exception as e:
    print(f"❌ Error testing endpoint: {e}")
