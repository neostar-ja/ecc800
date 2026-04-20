/**
 * Auth Extended API Services
 * API services for roles, menu permissions, Keycloak SSO, and user mapping
 */
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

// ============ Types ============

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  level: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreate {
  name: string;
  display_name: string;
  description?: string;
  level?: number;
  is_active?: boolean;
}

export interface RoleUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  display_name: string;
  path: string;
  icon?: string;
  parent_id?: number;
  order: number;
  is_visible: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  children?: MenuItem[];
}

export interface MenuItemCreate {
  name: string;
  display_name: string;
  path: string;
  icon?: string;
  parent_id?: number;
  order?: number;
  is_visible?: boolean;
  description?: string;
}

export interface RoleMenuPermission {
  id: number;
  role_id: number;
  menu_item_id: number;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionMatrixItem {
  menu_item_id: number;
  menu_name: string;
  menu_display_name: string;
  menu_path: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface RolePermissionMatrix {
  role_id: number;
  role_name: string;
  role_display_name: string;
  permissions: PermissionMatrixItem[];
}

export interface BulkPermissionUpdate {
  role_id: number;
  permissions: {
    menu_item_id: number;
    can_view?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
  }[];
}

export interface AllowedUser {
  username: string;
  role: string;
}

export interface KeycloakConfig {
  id: number;
  is_enabled: boolean;
  server_url: string;
  realm: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope?: string;
  admin_role?: string;
  editor_role?: string;
  viewer_role?: string;
  default_role?: string;
  auto_create_user?: boolean;
  sync_user_info?: boolean;
  allowed_users?: AllowedUser[];
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KeycloakConfigCreate {
  is_enabled: boolean;
  server_url: string;
  realm: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope?: string;
  admin_role?: string;
  editor_role?: string;
  viewer_role?: string;
  default_role?: string;
  auto_create_user?: boolean;
  sync_user_info?: boolean;
  allowed_users?: AllowedUser[];
}

export interface KeycloakConfigUpdate {
  is_enabled?: boolean;
  server_url?: string;
  realm?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  scope?: string;
  admin_role?: string;
  editor_role?: string;
  viewer_role?: string;
  default_role?: string;
  auto_create_user?: boolean;
  sync_user_info?: boolean;
  allowed_users?: AllowedUser[];
}

export interface KeycloakPublicConfig {
  is_enabled: boolean;
  server_url?: string;
  realm?: string;
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
}

export interface KeycloakLoginResponse {
  auth_url: string;
  state: string;
}

// Keycloak User Management Types
export interface KeycloakUserFromServer {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified?: boolean;
  createdTimestamp?: number;
  attributes?: Record<string, any>;
}

export interface KeycloakUserMapping {
  id: number;
  keycloak_user_id: string;
  keycloak_username: string;
  keycloak_email?: string;
  keycloak_full_name?: string;
  local_role: string;
  is_enabled: boolean;
  user_attributes?: Record<string, any>;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KeycloakUserMappingCreate {
  keycloak_user_id: string;
  keycloak_username: string;
  keycloak_email?: string;
  keycloak_full_name?: string;
  local_role: string;
  is_enabled?: boolean;
  user_attributes?: Record<string, any>;
}

export interface KeycloakUserMappingUpdate {
  local_role?: string;
  is_enabled?: boolean;
  user_attributes?: Record<string, any>;
}

export interface KeycloakUserWithMapping {
  keycloak_user: KeycloakUserFromServer;
  mapping?: KeycloakUserMapping;
  has_mapping: boolean;
}

// ============ Roles API ============

export const rolesApi = {
  list: async (params?: { is_active?: boolean }) => {
    return apiGet<Role[]>('/roles/', params);
  },
  
  get: async (id: number) => {
    return apiGet<Role>(`/roles/${id}/`);
  },
  
  create: async (data: RoleCreate) => {
    return apiPost<Role>('/roles/', data);
  },
  
  update: async (id: number, data: RoleUpdate) => {
    return apiPut<Role>(`/roles/${id}/`, data);
  },
  
  delete: async (id: number) => {
    return apiDelete(`/roles/${id}/`);
  },
  
  initDefaults: async () => {
    return apiPost<Role[]>('/roles/init-defaults/', {});
  }
};

// ============ Menu Items API ============

export const menuItemsApi = {
  list: async (params?: { is_visible?: boolean; parent_id?: number }) => {
    return apiGet<MenuItem[]>('/menu-items/', params);
  },
  
  listAll: async () => {
    return apiGet<MenuItem[]>('/menu-items/all');
  },
  
  get: async (id: number) => {
    return apiGet<MenuItem>(`/menu-items/${id}`);
  },
  
  create: async (data: MenuItemCreate) => {
    return apiPost<MenuItem>('/menu-items/', data);
  },
  
  update: async (id: number, data: Partial<MenuItemCreate>) => {
    return apiPut<MenuItem>(`/menu-items/${id}`, data);
  },
  
  delete: async (id: number) => {
    return apiDelete(`/menu-items/${id}`);
  },
  
  initDefaults: async () => {
    return apiPost<MenuItem[]>('/menu-items/init-defaults', {});
  }
};

// ============ Permissions API ============

export const permissionsApi = {
  list: async (params?: { role_id?: number; menu_item_id?: number }) => {
    return apiGet<RoleMenuPermission[]>('/permissions/', params);
  },
  
  getMatrix: async () => {
    return apiGet<RolePermissionMatrix[]>('/permissions/matrix');
  },
  
  getRolePermissions: async (roleId: number) => {
    return apiGet<RolePermissionMatrix>(`/permissions/role/${roleId}`);
  },
  
  getCurrentUserPermissions: async () => {
    return apiGet<PermissionMatrixItem[]>('/permissions/user/current');
  },
  
  create: async (data: Omit<RoleMenuPermission, 'id' | 'created_at' | 'updated_at'>) => {
    return apiPost<RoleMenuPermission>('/permissions/', data);
  },
  
  update: async (id: number, data: { can_view?: boolean; can_edit?: boolean; can_delete?: boolean }) => {
    return apiPut<RoleMenuPermission>(`/permissions/${id}`, data);
  },
  
  delete: async (id: number) => {
    return apiDelete(`/permissions/${id}`);
  },
  
  bulkUpdate: async (data: BulkPermissionUpdate) => {
    return apiPost<RoleMenuPermission[]>('/permissions/bulk-update', data);
  },
  
  initDefaults: async () => {
    return apiPost<RoleMenuPermission[]>('/permissions/init-defaults', {});
  }
};

// ============ Keycloak API ============

export const keycloakApi = {
  // Config management
  getConfig: async () => {
    return apiGet<KeycloakConfig>('/keycloak/config/');
  },
  
  getPublicConfig: async () => {
    return apiGet<KeycloakPublicConfig>('/keycloak/public-config');
  },
  
  createConfig: async (data: KeycloakConfigCreate) => {
    return apiPost<KeycloakConfig>('/keycloak/config/', data);
  },
  
  updateConfig: async (data: Partial<KeycloakConfigCreate>) => {
    return apiPut<KeycloakConfig>('/keycloak/config/', data);
  },
  
  deleteConfig: async () => {
    return apiDelete('/keycloak/config/');
  },
  
  testConnection: async () => {
    return apiPost<{ success: boolean; message: string; realm_info?: any; error?: string }>('/keycloak/test-connection/', {});
  },
  
  // Authentication flow
  initiateLogin: async () => {
    return apiGet<KeycloakLoginResponse>('/keycloak/login');
  },
  
  handleCallback: async (code: string, state: string) => {
    return apiPost<{
      access_token: string;
      token_type: string;
      user: {
        id: number;
        username: string;
        full_name: string;
        email?: string;
        role: string;
      };
    }>('/keycloak/callback', { code, state });
  },
  
  // User management
  getUsers: async (params?: { search?: string; max_results?: number }) => {
    return apiGet<KeycloakUserFromServer[]>('/keycloak/users', params);
  },
  
  getUsersWithMappings: async (params?: { search?: string; max_results?: number }) => {
    return apiGet<KeycloakUserWithMapping[]>('/keycloak/users-with-mappings', params);
  },
  
  // User mappings
  getUserMappings: async () => {
    return apiGet<KeycloakUserMapping[]>('/keycloak/user-mappings');
  },
  
  createUserMapping: async (data: KeycloakUserMappingCreate) => {
    return apiPost<KeycloakUserMapping>('/keycloak/user-mappings', data);
  },
  
  updateUserMapping: async (mappingId: number, data: KeycloakUserMappingUpdate) => {
    return apiPut<KeycloakUserMapping>(`/keycloak/user-mappings/${mappingId}`, data);
  },
  
  deleteUserMapping: async (mappingId: number) => {
    return apiDelete(`/keycloak/user-mappings/${mappingId}`);
  },
  
  getUserMappingByKeycloakId: async (keycloakUserId: string) => {
    return apiGet<KeycloakUserMapping>(`/keycloak/user-mappings/by-keycloak-id/${keycloakUserId}`);
  }
};

