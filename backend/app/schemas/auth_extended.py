"""
Extended Auth Schemas for Roles, Menu Permissions, and Keycloak
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


# ============ Role Schemas ============

class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="ชื่อ unique ของ role")
    display_name: str = Field(..., min_length=1, max_length=100, description="ชื่อแสดงผล")
    description: Optional[str] = Field(None, description="คำอธิบาย")
    level: int = Field(0, ge=0, le=100, description="ระดับสิทธิ์ (0-100)")
    is_active: bool = True


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    level: Optional[int] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None


class RoleResponse(RoleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Menu Item Schemas ============

class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="ชื่อ unique ของเมนู")
    display_name: str = Field(..., min_length=1, max_length=100, description="ชื่อแสดงผล")
    path: str = Field(..., description="URL path")
    icon: Optional[str] = Field(None, max_length=50, description="ชื่อ icon")
    parent_id: Optional[int] = Field(None, description="Parent menu ID")
    order: int = Field(0, ge=0, description="ลำดับการแสดงผล")
    is_visible: bool = True
    description: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    path: Optional[str] = None
    icon: Optional[str] = None
    parent_id: Optional[int] = None
    order: Optional[int] = None
    is_visible: Optional[bool] = None
    description: Optional[str] = None


class MenuItemResponse(MenuItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Note: children is not included to avoid lazy loading issues with async

    class Config:
        from_attributes = True


# ============ Role Menu Permission Schemas ============

class RoleMenuPermissionBase(BaseModel):
    role_id: int
    menu_item_id: int
    can_view: bool = True
    can_edit: bool = False
    can_delete: bool = False


class RoleMenuPermissionCreate(RoleMenuPermissionBase):
    pass


class RoleMenuPermissionUpdate(BaseModel):
    can_view: Optional[bool] = None
    can_edit: Optional[bool] = None
    can_delete: Optional[bool] = None


class RoleMenuPermissionResponse(RoleMenuPermissionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PermissionMatrixItem(BaseModel):
    """Item for permission matrix view"""
    menu_item_id: int
    menu_name: str
    menu_display_name: str
    menu_path: str
    can_view: bool = False
    can_edit: bool = False
    can_delete: bool = False


class RolePermissionMatrix(BaseModel):
    """Complete permission matrix for a role"""
    role_id: int
    role_name: str
    role_display_name: str
    permissions: List[PermissionMatrixItem]


class BulkPermissionUpdate(BaseModel):
    """Bulk update permissions for a role"""
    role_id: int
    permissions: List[dict]  # [{menu_item_id: int, can_view: bool, can_edit: bool, can_delete: bool}]


# ============ Keycloak Config Schemas ============

class AllowedUser(BaseModel):
    """User ที่อนุญาตให้เข้าสู่ระบบผ่าน Keycloak"""
    username: str
    role: str = "viewer"  # Default role เป็น viewer


class KeycloakConfigBase(BaseModel):
    is_enabled: bool = False
    server_url: Optional[str] = Field(None, max_length=500)
    realm: Optional[str] = Field(None, max_length=100)
    client_id: Optional[str] = Field(None, max_length=100)
    redirect_uri: Optional[str] = Field(None, max_length=500)
    scope: str = "openid profile email"
    
    # Role mapping
    admin_role: str = "admin"
    editor_role: str = "editor"
    viewer_role: str = "viewer"
    default_role: str = "viewer"
    
    # Options
    auto_create_user: bool = True
    sync_user_info: bool = True
    
    # Allowed users
    allowed_users: List[AllowedUser] = Field(default_factory=list)


class KeycloakConfigCreate(KeycloakConfigBase):
    client_secret: Optional[str] = Field(None, max_length=500)


class KeycloakConfigUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    server_url: Optional[str] = None
    realm: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    redirect_uri: Optional[str] = None
    scope: Optional[str] = None
    admin_role: Optional[str] = None
    editor_role: Optional[str] = None
    viewer_role: Optional[str] = None
    default_role: Optional[str] = None
    auto_create_user: Optional[bool] = None
    sync_user_info: Optional[bool] = None
    allowed_users: Optional[List[AllowedUser]] = None


class KeycloakConfigResponse(KeycloakConfigBase):
    id: int
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Note: client_secret is not included in response for security

    class Config:
        from_attributes = True


class KeycloakConfigPublic(BaseModel):
    """Public config for frontend login button"""
    is_enabled: bool
    server_url: Optional[str] = None
    realm: Optional[str] = None
    client_id: Optional[str] = None
    redirect_uri: Optional[str] = None
    scope: Optional[str] = None


class KeycloakLoginResponse(BaseModel):
    """Response for Keycloak login initiation"""
    auth_url: str
    state: str


class KeycloakCallbackRequest(BaseModel):
    """Request for Keycloak callback"""
    code: str
    state: str


class KeycloakUserInfo(BaseModel):
    """User info from Keycloak"""
    sub: str  # Subject (user ID in Keycloak)
    preferred_username: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    roles: List[str] = []


# ============ Keycloak User Mapping Schemas ============

class KeycloakUserMappingBase(BaseModel):
    """Base schema for Keycloak user mapping"""
    keycloak_user_id: str = Field(..., description="Keycloak user ID")
    keycloak_username: str = Field(..., description="Keycloak username")
    keycloak_email: Optional[str] = None
    keycloak_full_name: Optional[str] = None
    local_role: str = Field(..., description="Local role (admin, editor, viewer)")
    is_enabled: bool = True
    user_attributes: Optional[dict] = None


class KeycloakUserMappingCreate(KeycloakUserMappingBase):
    """Schema for creating user mapping"""
    pass


class KeycloakUserMappingUpdate(BaseModel):
    """Schema for updating user mapping"""
    local_role: Optional[str] = None
    is_enabled: Optional[bool] = None
    user_attributes: Optional[dict] = None


class KeycloakUserMappingResponse(KeycloakUserMappingBase):
    """Schema for user mapping response"""
    id: int
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KeycloakUserFromServer(BaseModel):
    """User data from Keycloak server"""
    id: str
    username: str
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    enabled: bool = True
    emailVerified: Optional[bool] = None
    createdTimestamp: Optional[int] = None
    attributes: Optional[dict] = None


class KeycloakUserWithMapping(BaseModel):
    """Keycloak user with local role mapping"""
    keycloak_user: KeycloakUserFromServer
    mapping: Optional[KeycloakUserMappingResponse] = None
    has_mapping: bool = False
