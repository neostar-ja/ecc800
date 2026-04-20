import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi, PermissionMatrixItem } from '../services/authExtended';
import { useAuthStore } from '../stores/authStore';

export interface MenuItemData {
  id: number;
  name: string;
  display_name: string;
  path: string;
  icon?: string;
  can_view: boolean;
}

interface PermissionContextType {
  userPermissions: { [menuPath: string]: boolean };
  userMenuItems: MenuItemData[];
  isLoading: boolean;
  canViewMenu: (menuPath: string) => boolean;
  hasPermission: (menuName: string) => boolean;
}

const PermissionContext = React.createContext<PermissionContextType>({
  userPermissions: {},
  userMenuItems: [],
  isLoading: true,
  canViewMenu: () => false,
  hasPermission: () => false
});

export const usePermissions = () => {
  const context = React.useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get authentication state from authStore (reactive)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  // Fetch current user's permissions (only when authenticated)
  const { data: permissions, isLoading, isFetching } = useQuery({
    queryKey: ['currentUserPermissions'],
    queryFn: () => permissionsApi.getCurrentUserPermissions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    enabled: isAuthenticated && !!token // Only fetch when authenticated with token
  });

  // True loading state: when authenticated but permissions not loaded yet
  const actuallyLoading = isAuthenticated && (isLoading || isFetching);

  // Build permission lookup map
  const userPermissions = React.useMemo(() => {
    if (!permissions) return {};
    
    const permMap: { [key: string]: boolean } = {};
    permissions.forEach((perm) => {
      // Map by path
      if (perm.menu_path) {
        permMap[perm.menu_path] = perm.can_view;
      }
      // Map by name
      if (perm.menu_name) {
        permMap[perm.menu_name] = perm.can_view;
      }
    });
    
    return permMap;
  }, [permissions]);

  // Build menu items array from permissions
  const userMenuItems = React.useMemo(() => {
    if (!permissions) return [];
    
    return permissions
      .filter((perm) => perm.can_view)
      .map((perm) => ({
        id: perm.menu_item_id,
        name: perm.menu_name,
        display_name: perm.menu_display_name,
        path: perm.menu_path,
        icon: undefined, // Will be mapped in the component
        can_view: perm.can_view
      }));
  }, [permissions]);

  const canViewMenu = React.useCallback((menuPath: string) => {
    // Debug logging
    console.log('[Permission Debug] Checking access for:', menuPath);
    console.log('[Permission Debug] Available permissions:', userPermissions);
    
    // Admin always has access
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('[Permission Debug] User data:', userData);
        if (userData.role === 'admin') {
          console.log('[Permission Debug] Admin access granted');
          return true;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check permission
    const hasAccess = userPermissions[menuPath] === true;
    console.log('[Permission Debug] Path check result:', hasAccess);
    console.log('[Permission Debug] Returning:', hasAccess);
    return hasAccess;
  }, [userPermissions]);

  const hasPermission = React.useCallback((menuName: string) => {
    // Admin always has access
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') return true;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Check permission
    return userPermissions[menuName] === true;
  }, [userPermissions]);

  return (
    <PermissionContext.Provider 
      value={{ 
        userPermissions, 
        userMenuItems,
        isLoading: actuallyLoading, 
        canViewMenu,
        hasPermission
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
