"""
API Routes for Keycloak SSO Configuration and Authentication
"""
import secrets
import httpx
import logging
from typing import Optional, List
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from jose import jwt as jose_jwt

from app.database import get_db
from app.models.models import KeycloakConfig, User, KeycloakUserMapping
from app.schemas.auth_extended import (
    KeycloakConfigCreate, KeycloakConfigUpdate, KeycloakConfigResponse,
    KeycloakConfigPublic, KeycloakLoginResponse, KeycloakCallbackRequest,
    KeycloakUserMappingCreate, KeycloakUserMappingUpdate, KeycloakUserMappingResponse,
    KeycloakUserFromServer, KeycloakUserWithMapping
)
from app.api.deps import get_current_user, get_admin_user
from app.core.config import settings

router = APIRouter(tags=["Keycloak SSO"])
logger = logging.getLogger(__name__)

# In-memory state storage (in production, use Redis)
_oauth_states = {}


@router.get("/config/", response_model=KeycloakConfigResponse)
async def get_keycloak_config(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ดึงการตั้งค่า Keycloak (Admin only)"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Keycloak config not found")
    
    # Mask client_secret for security
    config_dict = config.__dict__.copy()
    if config.client_secret:
        config_dict['client_secret'] = '••••••••'  # Masked
    
    return KeycloakConfigResponse(**config_dict)


@router.get("/public-config", response_model=KeycloakConfigPublic)
async def get_keycloak_public_config(
    db: AsyncSession = Depends(get_db)
):
    """ดึงการตั้งค่า Keycloak สำหรับ Login page (Public)"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config:
        return KeycloakConfigPublic(is_enabled=False)
    
    return KeycloakConfigPublic(
        is_enabled=config.is_enabled,
        server_url=config.server_url if config.is_enabled else None,
        realm=config.realm if config.is_enabled else None,
        client_id=config.client_id if config.is_enabled else None,
        redirect_uri=config.redirect_uri if config.is_enabled else None,
        scope=config.scope if config.is_enabled else None
    )


@router.post("/config/", response_model=KeycloakConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_keycloak_config(
    config_data: KeycloakConfigCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้างหรืออัพเดทการตั้งค่า Keycloak (Admin only)"""
    # Check if config already exists
    result = await db.execute(select(KeycloakConfig).limit(1))
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update existing
        update_data = config_data.model_dump(exclude_unset=True)
        update_data["updated_by"] = admin_user.username
        
        # Don't update client_secret if it's empty
        if 'client_secret' in update_data and not update_data['client_secret']:
            del update_data['client_secret']
        
        for field, value in update_data.items():
            setattr(existing, field, value)
        config = existing
    else:
        # Create new
        config = KeycloakConfig(
            **config_data.model_dump(),
            updated_by=admin_user.username
        )
        db.add(config)
    
    await db.commit()
    await db.refresh(config)
    
    # Mask secret before returning
    config_dict = config.__dict__.copy()
    if config.client_secret:
        config_dict['client_secret'] = '••••••••'
    
    return KeycloakConfigResponse(**config_dict)
    return config


@router.put("/config/", response_model=KeycloakConfigResponse)
async def update_keycloak_config(
    config_data: KeycloakConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """อัพเดทการตั้งค่า Keycloak (Admin only)"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Keycloak config not found. Create it first.")
    
    update_data = config_data.model_dump(exclude_unset=True)
    update_data["updated_by"] = admin_user.username
    
    # Don't update client_secret if it's empty (means user didn't change it)
    if 'client_secret' in update_data and not update_data['client_secret']:
        del update_data['client_secret']
    
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    
    # Mask secret before returning
    config_dict = config.__dict__.copy()
    if config.client_secret:
        config_dict['client_secret'] = '••••••••'
    
    return KeycloakConfigResponse(**config_dict)


@router.post("/test-connection/")
async def test_keycloak_connection(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ทดสอบการเชื่อมต่อ Keycloak (Admin only)"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Keycloak config not found")
    
    if not config.server_url or not config.realm:
        raise HTTPException(status_code=400, detail="Server URL and Realm are required")
    
    try:
        # Try to get realm info
        well_known_url = f"{config.server_url}/realms/{config.realm}/.well-known/openid-configuration"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(well_known_url)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": "Connection successful",
                    "realm_info": response.json()
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed with status {response.status_code}",
                    "error": response.text
                }
                
    except httpx.TimeoutException:
        return {
            "success": False,
            "message": "Connection timeout"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Connection error: {str(e)}"
        }


@router.get("/login", response_model=KeycloakLoginResponse)
async def initiate_keycloak_login(
    db: AsyncSession = Depends(get_db)
):
    """เริ่มต้นกระบวนการ login ด้วย Keycloak"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="Keycloak SSO is not enabled")
    
    if not all([config.server_url, config.realm, config.client_id, config.redirect_uri]):
        raise HTTPException(status_code=400, detail="Keycloak configuration is incomplete")
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Generate PKCE code_verifier and code_challenge
    import hashlib
    import base64
    code_verifier = secrets.token_urlsafe(64)  # 64 bytes = 86 chars base64url
    # Create code_challenge using SHA256
    code_challenge_bytes = hashlib.sha256(code_verifier.encode('ascii')).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge_bytes).rstrip(b'=').decode('ascii')
    
    # Store state and code_verifier temporarily (expires in 10 minutes)
    _oauth_states[state] = {
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "code_verifier": code_verifier
    }
    
    # Clean up old states
    current_time = datetime.utcnow()
    expired_states = [k for k, v in _oauth_states.items() if v["expires_at"] < current_time]
    for k in expired_states:
        del _oauth_states[k]
    
    # Build authorization URL with PKCE
    auth_params = {
        "client_id": config.client_id,
        "redirect_uri": config.redirect_uri,
        "response_type": "code",
        "scope": config.scope or "openid profile email",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256"
    }
    
    auth_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/auth?{urlencode(auth_params)}"
    
    return KeycloakLoginResponse(auth_url=auth_url, state=state)


@router.post("/callback")
async def keycloak_callback(
    callback_data: KeycloakCallbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Handle Keycloak callback after authentication"""
    print(f"[CALLBACK] Received callback with state: {callback_data.state[:20]}...")
    print(f"[CALLBACK] Active states: {list(_oauth_states.keys())[:3]}")
    
    # Verify state
    if callback_data.state not in _oauth_states:
        print(f"[CALLBACK] ERROR: State not found in _oauth_states")
        raise HTTPException(status_code=400, detail="Invalid or expired state")
    
    print(f"[CALLBACK] State verified OK")
    
    # Get code_verifier for PKCE and remove used state
    state_data = _oauth_states[callback_data.state]
    code_verifier = state_data.get("code_verifier")
    print(f"[CALLBACK] Code verifier exists: {code_verifier is not None}")
    del _oauth_states[callback_data.state]
    
    # Get config
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="Keycloak SSO is not enabled")
    
    # Exchange code for token with PKCE code_verifier
    token_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/token"
    
    token_data = {
        "grant_type": "authorization_code",
        "client_id": config.client_id,
        "client_secret": config.client_secret,
        "code": callback_data.code,
        "redirect_uri": config.redirect_uri
    }
    
    # Add code_verifier for PKCE
    if code_verifier:
        token_data["code_verifier"] = code_verifier
    
    print(f"[CALLBACK] Token URL: {token_url}")
    print(f"[CALLBACK] Token data keys: {list(token_data.keys())}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            response = await client.post(token_url, data=token_data)
            
            print(f"[CALLBACK] Token response status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"[CALLBACK] Token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Token exchange failed: {response.text}"
                )
            
            tokens = response.json()
            print(f"[CALLBACK] Token received, keys: {list(tokens.keys())}")
            
            # Try to get userinfo from id_token first (more reliable with reverse proxy)
            id_token = tokens.get("id_token")
            userinfo = None
            
            if id_token:
                try:
                    # Manual decode ID token (JWT is base64url encoded)
                    import base64
                    import json as json_module
                    
                    # Split JWT into parts
                    parts = id_token.split('.')
                    if len(parts) == 3:
                        # Add padding if needed
                        payload = parts[1]
                        padding = 4 - len(payload) % 4
                        if padding != 4:
                            payload += '=' * padding
                        
                        decoded_bytes = base64.urlsafe_b64decode(payload)
                        decoded_id_token = json_module.loads(decoded_bytes.decode('utf-8'))
                        print(f"[CALLBACK] Decoded ID token: {decoded_id_token}")
                    
                    # Build userinfo from id_token
                    userinfo = {
                        "sub": decoded_id_token.get("sub"),
                        "preferred_username": decoded_id_token.get("preferred_username"),
                        "email": decoded_id_token.get("email"),
                        "name": decoded_id_token.get("name"),
                        "given_name": decoded_id_token.get("given_name"),
                        "family_name": decoded_id_token.get("family_name"),
                    }
                    print(f"[CALLBACK] Userinfo from id_token: {userinfo}")
                except Exception as e:
                    print(f"[CALLBACK] Failed to decode id_token: {e}")
            
            # Fallback to userinfo endpoint if id_token doesn't have enough info
            if not userinfo or not userinfo.get("sub"):
                print(f"[CALLBACK] Falling back to userinfo endpoint")
                userinfo_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/userinfo"
                print(f"[CALLBACK] Userinfo URL: {userinfo_url}")
                userinfo_response = await client.get(
                    userinfo_url,
                    headers={"Authorization": f"Bearer {tokens['access_token']}"}
                )
                
                print(f"[CALLBACK] Userinfo response status: {userinfo_response.status_code}")
                
                if userinfo_response.status_code != 200:
                    print(f"[CALLBACK] Userinfo failed: {userinfo_response.text}")
                    print(f"[CALLBACK] Userinfo headers: {dict(userinfo_response.headers)}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Failed to get user info: {userinfo_response.text}"
                    )
                
                userinfo = userinfo_response.json()
                print(f"[CALLBACK] Userinfo from endpoint: {userinfo}")
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Keycloak server timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Keycloak connection error: {str(e)}")
    
    # Get Keycloak user ID
    keycloak_user_id = userinfo.get("sub")
    username = userinfo.get("preferred_username") or userinfo.get("sub")
    email = userinfo.get("email")
    full_name = userinfo.get("name") or f"{userinfo.get('given_name', '')} {userinfo.get('family_name', '')}".strip()
    
    print(f"[CALLBACK] Extracted user info - username: {username}, email: {email}")
    
    # Check if user is in allowed_users list
    allowed_users = config.allowed_users or []
    allowed_user = None
    for au in allowed_users:
        if au.get("username", "").lower() == username.lower():
            allowed_user = au
            break
    
    if not allowed_user:
        raise HTTPException(
            status_code=403, 
            detail=f"ผู้ใช้ '{username}' ไม่ได้รับอนุญาตให้เข้าสู่ระบบนี้ กรุณาติดต่อผู้ดูแลระบบ"
        )
    
    # Use role from allowed_users
    local_role = allowed_user.get("role", "viewer")
    
    # Find or create user
    user_result = await db.execute(select(User).where(User.username == username))
    user = user_result.scalar_one_or_none()
    
    if user:
        # Update user info if sync enabled
        if config.sync_user_info:
            if email:
                user.email = email
            if full_name:
                user.full_name = full_name
            user.role = local_role
            await db.commit()
    else:
        # Create new user if auto-create enabled
        if config.auto_create_user:
            user = User(
                username=username,
                password_hash="keycloak_sso",  # Mark as SSO user
                email=email,
                full_name=full_name or username,
                role=local_role,
                is_active=True,
                site_access=[]  # Empty array for site_access
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            raise HTTPException(
                status_code=403, 
                detail="User not found and auto-creation is disabled"
            )
    
    # Generate local JWT token
    jwt_secret = getattr(settings, "JWT_SECRET", "your-secret-key")
    jwt_algorithm = getattr(settings, "JWT_ALGORITHM", "HS256")
    jwt_expiry_hours = getattr(settings, "JWT_EXPIRY_HOURS", 24)
    
    token_payload = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name,
        "exp": datetime.utcnow() + timedelta(hours=jwt_expiry_hours),
        "iat": datetime.utcnow(),
        "auth_method": "keycloak"
    }
    
    local_token = jose_jwt.encode(token_payload, jwt_secret, algorithm=jwt_algorithm)
    
    return {
        "access_token": local_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
    }


@router.delete("/config", status_code=status.HTTP_204_NO_CONTENT)
async def delete_keycloak_config(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ลบการตั้งค่า Keycloak (Admin only)"""
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(status_code=404, detail="Keycloak config not found")
    
    await db.delete(config)
    await db.commit()


# ============ Keycloak User Management APIs ============

async def _fetch_keycloak_users_internal(
    db: AsyncSession,
    search: Optional[str] = None,
    max_results: int = 100
) -> List[KeycloakUserFromServer]:
    """Internal helper function to fetch users from Keycloak"""
    # Get Keycloak config
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="Keycloak SSO is not enabled")
    
    if not all([config.server_url, config.realm, config.client_id, config.client_secret]):
        raise HTTPException(status_code=400, detail="Keycloak configuration is incomplete")
    
    try:
        # Get admin access token
        token_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/token"
        token_data = {
            "grant_type": "client_credentials",
            "client_id": config.client_id,
            "client_secret": config.client_secret
        }
        
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            # Get token
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=502, 
                    detail=f"Failed to get admin token: {token_response.text}"
                )
            
            access_token = token_response.json()["access_token"]
            
            # Get users from Keycloak
            users_url = f"{config.server_url}/admin/realms/{config.realm}/users"
            params = {"max": max_results}
            if search:
                params["search"] = search
            
            users_response = await client.get(
                users_url,
                headers={"Authorization": f"Bearer {access_token}"},
                params=params
            )
            
            if users_response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to get users: {users_response.text}"
                )
            
            users = users_response.json()
            
            # Convert to schema
            return [KeycloakUserFromServer(**user) for user in users]
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Keycloak server timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Keycloak connection error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching Keycloak users: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")


@router.get("/users", response_model=List[KeycloakUserFromServer])
async def get_keycloak_users(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    search: Optional[str] = Query(None, description="Search by username or email"),
    max_results: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """ดึงรายชื่อผู้ใช้จาก Keycloak server (Admin only)"""
    return await _fetch_keycloak_users_internal(db, search, max_results)


@router.get("/users-with-mappings", response_model=List[KeycloakUserWithMapping])
async def get_keycloak_users_with_mappings(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user),
    search: Optional[str] = Query(None, description="Search by username or email"),
    max_results: int = Query(100, ge=1, le=500)
):
    """ดึงรายชื่อผู้ใช้จาก Keycloak พร้อม role mapping (Admin only)"""
    try:
        # Get users from Keycloak using internal helper function
        keycloak_users = await _fetch_keycloak_users_internal(db, search, max_results)
        
        # Get all mappings
        mappings_result = await db.execute(select(KeycloakUserMapping))
        all_mappings = mappings_result.scalars().all()
        mapping_dict = {m.keycloak_user_id: m for m in all_mappings}
        
        # Combine data
        result = []
        for kc_user in keycloak_users:
            mapping = mapping_dict.get(kc_user.id)
            result.append(KeycloakUserWithMapping(
                keycloak_user=kc_user,
                mapping=KeycloakUserMappingResponse.model_validate(mapping) if mapping else None,
                has_mapping=mapping is not None
            ))
        
        return result
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log detailed error
        logger.error(f"Failed to fetch users with mappings: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch users with mappings: {str(e)}"
        )


@router.get("/user-mappings", response_model=List[KeycloakUserMappingResponse])
async def get_user_mappings(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ดึงรายการ user mappings ทั้งหมด (Admin only)"""
    result = await db.execute(select(KeycloakUserMapping))
    mappings = result.scalars().all()
    return mappings


@router.post("/user-mappings", response_model=KeycloakUserMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_user_mapping(
    mapping_data: KeycloakUserMappingCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """สร้าง mapping ระหว่าง Keycloak user กับ local role (Admin only)"""
    # Check if mapping already exists
    result = await db.execute(
        select(KeycloakUserMapping).where(
            KeycloakUserMapping.keycloak_user_id == mapping_data.keycloak_user_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Mapping already exists for user {mapping_data.keycloak_username}"
        )
    
    # Validate role
    if mapping_data.local_role not in ['admin', 'editor', 'viewer']:
        raise HTTPException(status_code=400, detail="Invalid role. Must be admin, editor, or viewer")
    
    # Create mapping
    mapping = KeycloakUserMapping(
        **mapping_data.model_dump(),
        created_by=admin_user.username,
        updated_by=admin_user.username
    )
    
    db.add(mapping)
    await db.commit()
    await db.refresh(mapping)
    
    return mapping


@router.put("/user-mappings/{mapping_id}", response_model=KeycloakUserMappingResponse)
async def update_user_mapping(
    mapping_id: int,
    mapping_data: KeycloakUserMappingUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """อัพเดท user mapping (Admin only)"""
    result = await db.execute(
        select(KeycloakUserMapping).where(KeycloakUserMapping.id == mapping_id)
    )
    mapping = result.scalar_one_or_none()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="User mapping not found")
    
    # Validate role if provided
    if mapping_data.local_role and mapping_data.local_role not in ['admin', 'editor', 'viewer']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Update fields
    update_data = mapping_data.model_dump(exclude_unset=True)
    update_data["updated_by"] = admin_user.username
    
    for field, value in update_data.items():
        setattr(mapping, field, value)
    
    await db.commit()
    await db.refresh(mapping)
    
    return mapping


@router.delete("/user-mappings/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_mapping(
    mapping_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ลบ user mapping (Admin only)"""
    result = await db.execute(
        select(KeycloakUserMapping).where(KeycloakUserMapping.id == mapping_id)
    )
    mapping = result.scalar_one_or_none()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="User mapping not found")
    
    await db.delete(mapping)
    await db.commit()


@router.get("/user-mappings/by-keycloak-id/{keycloak_user_id}", response_model=KeycloakUserMappingResponse)
async def get_user_mapping_by_keycloak_id(
    keycloak_user_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_admin_user)
):
    """ดึง user mapping โดยใช้ Keycloak user ID (Admin only)"""
    result = await db.execute(
        select(KeycloakUserMapping).where(
            KeycloakUserMapping.keycloak_user_id == keycloak_user_id
        )
    )
    mapping = result.scalar_one_or_none()
    
    if not mapping:
        raise HTTPException(status_code=404, detail="User mapping not found")
    
    return mapping


@router.post("/test-user-login")
async def test_keycloak_user_login(
    credentials: dict,
    db: AsyncSession = Depends(get_db)
):
    """ทดสอบ login ด้วย Keycloak username และ password"""
    username = credentials.get("username")
    password = credentials.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Get Keycloak config
    result = await db.execute(select(KeycloakConfig).limit(1))
    config = result.scalar_one_or_none()
    
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="Keycloak SSO is not enabled")
    
    try:
        # Try to get token with user credentials
        token_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/token"
        token_data = {
            "grant_type": "password",
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "username": username,
            "password": password,
            "scope": config.scope or "openid profile email"
        }
        
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                error_detail = token_response.json().get("error_description", "Invalid credentials")
                raise HTTPException(status_code=401, detail=f"Login failed: {error_detail}")
            
            # Get user info from token
            token_json = token_response.json()
            access_token = token_json.get("access_token")
            
            # Get userinfo
            userinfo_url = f"{config.server_url}/realms/{config.realm}/protocol/openid-connect/userinfo"
            userinfo_response = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code == 200:
                userinfo = userinfo_response.json()
                logger.info(f"Userinfo response: {userinfo}")  # Debug log
                
                # Try different field names that Keycloak might use
                email = userinfo.get("email") or userinfo.get("email_verified") or None
                full_name = userinfo.get("name") or userinfo.get("given_name", "") + " " + userinfo.get("family_name", "")
                full_name = full_name.strip() or None
                
                return {
                    "success": True,
                    "username": userinfo.get("preferred_username", username),
                    "email": email,
                    "full_name": full_name,
                    "message": "Login test successful"
                }
            else:
                logger.warning(f"Failed to get userinfo: {userinfo_response.status_code} - {userinfo_response.text}")
                return {
                    "success": True,
                    "username": username,
                    "message": "Login successful but cannot get user info"
                }
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Keycloak server timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Cannot connect to Keycloak: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test login error: {str(e)}")
