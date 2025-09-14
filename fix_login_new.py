#!/usr/bin/env python3
"""
Adds a login endpoint directly to the FastAPI app by editing main.py
"""
import os
import subprocess

print("Creating a new version of main.py with login endpoint...")

# New main.py content with login endpoint
MAIN_PY = """
\"\"\"
ECC800 Data Center Monitoring System
แอปพลิเคชันหลักสำหรับระบบติดตามศูนย์ข้อมูล ECC800
\"\"\"
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn

# Initialize variables
settings = None
init_db = close_db = None

try:
    from app.core.config import settings
    from app.core.database import init_db, close_db
    print("✓ Core modules imported successfully")
except ImportError as e:
    print(f"✗ Core import error: {e}")
    class Settings:
        app_base_path = "/ecc800"
        cors_origins = ["*"]
        debug = False
    settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    \"\"\"จัดการ lifecycle ของแอป\"\"\"
    try:
        # เริ่มต้นฐานข้อมูล
        if 'init_db' in globals():
            await init_db()
        yield
    except Exception as e:
        print(f"Lifespan error: {e}")
        yield
    finally:
        # ปิดการเชื่อมต่อฐานข้อมูล
        try:
            if close_db:
                await close_db()
        except Exception as e:
            print(f"Close DB error: {e}")


# สร้าง FastAPI app
app = FastAPI(
    title="ECC800 Monitoring System",
    description="ระบบติดตามและจัดการศูนย์ข้อมูล ECC800 โรงพยาบาล",
    version="1.0.0",
    docs_url=f"{getattr(settings, 'app_base_path', '/ecc800')}/docs",
    redoc_url=f"{getattr(settings, 'app_base_path', '/ecc800')}/redoc",
    openapi_url=f"{getattr(settings, 'app_base_path', '/ecc800')}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'cors_origins', ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Import and register routers
def setup_routers():
    \"\"\"Setup API routers\"\"\"
    try:
        from app.api.routes import sites, analytics, metrics
        # auth routers (api and optional legacy)
        from app.api import auth as api_auth
        # legacy router may import DB sync/async drivers and fail in some environments;
        # import it optionally so the API token endpoints still load.
        try:
            from app.routers import auth as legacy_auth
            legacy_auth_available = True
        except Exception as _err:
            legacy_auth_available = False

        # Register API routers (standard)
        app.include_router(
            sites.router,
            prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api",
            tags=["Sites & Equipment"],
        )

        app.include_router(
            metrics.router,
            prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api",
            tags=["Metrics & Time-series"],
        )

        app.include_router(
            analytics.router,
            prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api",
            tags=["Analytics"],
        )

        # Register authentication routers:
        # - legacy_auth.router has prefix "/auth" so including it under /ecc800/api
        #   will expose endpoints like /ecc800/api/auth/login (used by some frontend builds)
        if legacy_auth_available:
            app.include_router(
                legacy_auth.router,
                prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api",
                tags=["Authentication (legacy)"],
            )
        else:
            print("⚠️ legacy auth router not available; skipping legacy /auth routes")

        # - api_auth.router exposes token/me endpoints; include under /ecc800/api/auth
        app.include_router(
            api_auth.router,
            prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api/auth",
            tags=["Authentication"],
        )

        # - compatibility router to expose /login for legacy frontend builds
        try:
            from app.routers import auth_compat
            app.include_router(
                auth_compat.router,
                prefix=f"{getattr(settings, 'app_base_path', '/ecc800')}/api/auth",
                tags=["Authentication (compat)"],
            )
        except Exception as e:
            print(f"⚠️ auth_compat router not available: {e}")
        
        print("✅ All routers registered successfully")
        
        # Debug: show registered routes
        api_routes = [r for r in app.routes if hasattr(r, 'path') and 'api' in r.path]
        print(f"✅ Total API routes registered: {len(api_routes)}")
        for route in api_routes:
            if hasattr(route, 'path'):
                methods = getattr(route, 'methods', {'GET'})
                print(f"  {methods} {route.path}")
                
        return True
    except Exception as e:
        print(f"❌ Router setup error: {e}")
        import traceback
        traceback.print_exc()
        return False


# Setup routers immediately
setup_routers()

# Health check endpoint
@app.get("/health")
@app.get(f"{getattr(settings, 'app_base_path', '/ecc800')}/health")
async def health_check():
    \"\"\"ตรวจสอบสุขภาพของระบบ\"\"\"
    try:
        # ตรวจสอบฐานข้อมูลโดยใช้ execute_raw_query
        from app.core.database import execute_raw_query
        
        # Simple database test
        result = await execute_raw_query("SELECT 1 as test_value")
        db_status = "ok" if result and result[0]["test_value"] == 1 else "error"
        
        return {
            "status": "ok",
            "database": db_status,
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "message": "ระบบ ECC800 พร้อมใช้งาน"
        }
    except Exception as e:
        return {
            "status": "ok",
            "database": "error",
            "error": str(e),
            "version": "1.0.0", 
            "timestamp": datetime.now().isoformat(),
            "message": "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล แต่ระบบยังใช้งานได้"
        }


# Root endpoint
@app.get("/")
@app.get(f"{getattr(settings, 'app_base_path', '/ecc800')}")
async def root():
    \"\"\"หน้าแรกของ API\"\"\"
    return {
        "message": "ยินดีต้อนรับสู่ระบบติดตาม ECC800 ศูนย์ข้อมูลโรงพยาบาล",
        "version": "1.0.0",
        "docs": f"{getattr(settings, 'public_base_url', 'https://10.251.150.222:3344')}{getattr(settings, 'app_base_path', '/ecc800')}/docs",
        "health": f"{getattr(settings, 'public_base_url', 'https://10.251.150.222:3344')}{getattr(settings, 'app_base_path', '/ecc800')}/health",
        "api_routes_count": len([r for r in app.routes if hasattr(r, 'path') and 'api' in r.path])
    }


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "ไม่พบทรัพยากรที่ร้องขอ"}
    )


# Login endpoint for frontend
@app.post(f"{getattr(settings, 'app_base_path', '/ecc800')}/api/auth/login")
async def login_endpoint(form_data: OAuth2PasswordRequestForm = Depends()):
    \"\"\"Login endpoint for frontend that expects /ecc800/api/auth/login\"\"\"
    from app.core.database import get_db
    from app.services.user_service import UserService
    from app.auth.jwt import create_access_token
    
    try:
        print(f"Login attempt: {form_data.username}")
        async for db in get_db():
            user = await UserService.authenticate_user(db, form_data.username, form_data.password)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Incorrect username or password"
                )
            token = create_access_token({"sub": user.username, "role": user.role})
            print(f"Login successful for user: {user.username}")
            return {
                "access_token": token, 
                "token_type": "bearer", 
                "user": {
                    "id": user.id, 
                    "username": user.username, 
                    "role": user.role
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")


@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        access_log=True
    )
"""

# Write the new main.py to a file
with open('/opt/code/ecc800/ecc800/backend/app/main.py.new', 'w') as f:
    f.write(MAIN_PY)

# Copy the new file to the backend container and restart
try:
    # First, backup the original main.py
    os.system('cd /opt/code/ecc800/ecc800 && cp backend/app/main.py backend/app/main.py.bak')
    
    # Replace main.py with our new version
    os.system('cd /opt/code/ecc800/ecc800 && mv backend/app/main.py.new backend/app/main.py')
    
    # Restart the backend container
    os.system('cd /opt/code/ecc800/ecc800 && docker compose restart backend')
    
    print("✅ Backend restarted with new main.py")
    
    # Wait for the backend to start up
    import time
    time.sleep(3)
    
    # Test the login endpoint
    cmd = ['curl', '-k', '-v', '-X', 'POST', 'https://10.251.150.222:3344/ecc800/api/auth/login', 
           '-d', 'username=admin&password=Admin123!', 
           '-H', 'Content-Type: application/x-www-form-urlencoded']
    
    print("\nTesting login endpoint...")
    subprocess.run(cmd)
    
except Exception as e:
    print(f"❌ Error: {e}")
