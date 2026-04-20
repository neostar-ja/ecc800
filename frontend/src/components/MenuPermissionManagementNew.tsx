/**
 * Professional All-in-One Menu & Permission Management
 * ระบบจัดการเมนูและสิทธิ์แบบครบวงจร - ใช้งานง่าย สวยงาม เป็นมืออาชีพ
 * แสดงเป็น Permission Matrix พร้อมฟีเจอร์ CRUD เมนูในหน้าเดียว
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem as MuiMenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  FormControlLabel,
  Avatar,
  Stack,
  ButtonGroup,
  InputAdornment,
  Grid,
  Divider,
  Switch,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Menu as MenuIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as EditorIcon,
  Person as ViewerIcon,
  Save as SaveIcon,
  RestartAlt as DiscardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Memory as MemoryIcon,
  Analytics as AnalyticsIcon,
  Warning as WarningIcon,
  Assessment as ReportIcon,
  Business as BusinessIcon,
  ViewInAr as ViewInArIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Storage as StorageIcon,
  Power as PowerIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Devices as DevicesIcon,
  Computer as ComputerIcon,
  Cloud as CloudIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  AccountTree as AccountTreeIcon,
  DataUsage as DataUsageIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  Router as RouterIcon,
  Lan as LanIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  rolesApi,
  menuItemsApi,
  permissionsApi,
  Role,
  MenuItem,
  BulkPermissionUpdate
} from '../services/authExtended';

// Icon mapping for menu icons
const iconMap: { [key: string]: React.ElementType } = {
  Dashboard: DashboardIcon,
  Storage: StorageIcon,
  Analytics: AnalyticsIcon,
  Warning: WarningIcon,
  Power: PowerIcon,
  Assignment: AssignmentIcon,
  Assessment: ReportIcon,
  AdminPanelSettings: AdminIcon,
  Settings: SettingsIcon,
  Business: BusinessIcon,
  Memory: MemoryIcon,
  ViewInAr: ViewInArIcon,
  Security: SecurityIcon,
  People: PeopleIcon,
  Devices: DevicesIcon,
  Computer: ComputerIcon,
  Cloud: CloudIcon,
  Lock: LockIcon,
  Notifications: NotificationsIcon,
  Description: DescriptionIcon,
  Home: HomeIcon,
  Work: WorkIcon,
  AccountTree: AccountTreeIcon,
  DataUsage: DataUsageIcon,
  Speed: SpeedIcon,
  TrendingUp: TrendingUpIcon,
  Build: BuildIcon,
  Router: RouterIcon,
  Lan: LanIcon,
  Menu: MenuIcon,
};

const MenuPermissionManagementReadOnly: React.FC = () => {
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Menu add dialog states
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuFormData, setMenuFormData] = useState<{
    name: string;
    display_name: string;
    path: string;
    icon?: string;
    parent_id?: number;
    order: number;
    is_visible: boolean;
    description?: string;
  }>({
    name: '',
    display_name: '',
    path: '',
    icon: '',
    parent_id: undefined,
    order: 1,
    is_visible: true,
    description: ''
  });

  // Local permissions state for new menu
  const [newMenuPermissions, setNewMenuPermissions] = useState<{
    [roleName: string]: boolean;
  }>({});

  // Local permissions state for editing existing permissions
  const [localPermissions, setLocalPermissions] = useState<{
    [roleId: number]: { [menuId: number]: { can_view: boolean } }
  }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list({ is_active: true })
  });

  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Fetch menu items
  const { data: menuItemsData, isLoading: menusLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => menuItemsApi.listAll()
  });

  const menuItems = Array.isArray(menuItemsData) ? menuItemsData : [];

  // Fetch permission matrix
  const { data: permissionMatrixData, isLoading: permissionsLoading, refetch } = useQuery({
    queryKey: ['permissionMatrix'],
    queryFn: () => permissionsApi.getMatrix()
  });

  const permissionMatrix = Array.isArray(permissionMatrixData) ? permissionMatrixData : [];

  // Initialize local permissions when data loads
  useEffect(() => {
    if (permissionMatrix) {
      const newLocalPermissions: typeof localPermissions = {};
      permissionMatrix.forEach((roleMatrix) => {
        newLocalPermissions[roleMatrix.role_id] = {};
        roleMatrix.permissions.forEach((perm) => {
          newLocalPermissions[roleMatrix.role_id][perm.menu_item_id] = {
            can_view: perm.can_view
          };
        });
      });
      setLocalPermissions(newLocalPermissions);
      setHasChanges(false);
    }
  }, [permissionMatrix]);

  // Init defaults mutation
  const initDefaultsMutation = useMutation({
    mutationFn: async () => {
      await menuItemsApi.initDefaults();
      await permissionsApi.initDefaults();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'สร้างข้อมูลเริ่มต้นสำเร็จ', severity: 'success' });
    }
  });

  // Bulk update mutation for saving permissions
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkPermissionUpdate) => permissionsApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'บันทึกสิทธิ์สำเร็จ', severity: 'success' });
      setHasChanges(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  });

  // Create menu mutation
  const createMenuMutation = useMutation({
    mutationFn: async (data: typeof menuFormData) => {
      // First create the menu
      const newMenu = await menuItemsApi.create(data);
      
      // Then set permissions for each role based on newMenuPermissions
      for (const role of roles) {
        const canView = newMenuPermissions[role.name] || false;
        if (canView) {
          await permissionsApi.create({
            role_id: role.id,
            menu_item_id: newMenu.id,
            can_view: true,
            can_edit: false,
            can_delete: false
          });
        }
      }
      
      return newMenu;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'สร้างเมนูและกำหนดสิทธิ์สำเร็จ', severity: 'success' });
      handleCloseMenuDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการสร้างเมนู';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  });

  // Update menu mutation
  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof menuFormData> }) => {
      return menuItemsApi.update(id, data);
    },
    onSuccess: () => {
      // Invalidate menu items to update the menu list
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      // Invalidate permissions to refresh the sidebar menu with new names
      queryClient.invalidateQueries({ queryKey: ['currentUserPermissions'] });
      // Invalidate permission matrix to update the permission table
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'แก้ไขเมนูสำเร็จ - เมนูด้านข้างจะอัปเดตทันที', severity: 'success' });
      handleCloseMenuDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการแก้ไข';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  });

  // Delete menu mutation
  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: number) => {
      return menuItemsApi.delete(menuId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserPermissions'] });
      setSnackbar({ open: true, message: 'ลบเมนูสำเร็จ', severity: 'success' });
      handleCloseDeleteDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการลบเมนู';
      setSnackbar({ open: true, message, severity: 'error' });
      handleCloseDeleteDialog();
    }
  });

  // Initialize new menu permissions when roles load
  useEffect(() => {
    if (roles.length > 0) {
      const initialPerms: { [roleName: string]: boolean } = {};
      roles.forEach(role => {
        initialPerms[role.name] = role.name === 'admin'; // Admin gets access by default
      });
      setNewMenuPermissions(initialPerms);
    }
  }, [roles]);

  // Menu handlers
  const handleOpenMenuDialog = (menu?: MenuItem) => {
    if (menu && menu.id) {
      // Edit mode - ต้องมี id ที่ valid
      setEditingMenu(menu);
      setMenuFormData({
        name: menu.name,
        display_name: menu.display_name,
        path: menu.path,
        icon: menu.icon || '',
        parent_id: menu.parent_id || undefined,
        order: menu.order,
        is_visible: menu.is_visible,
        description: menu.description || ''
      });
    } else {
      // Add mode
      setEditingMenu(null);
      setMenuFormData({
        name: '',
        display_name: '',
        path: '',
        icon: '',
        parent_id: undefined,
        order: menuItems.length + 1,
        is_visible: true,
        description: ''
      });
      // Reset permissions - admin gets access by default
      const initialPerms: { [roleName: string]: boolean } = {};
      roles.forEach(role => {
        initialPerms[role.name] = role.name === 'admin';
      });
      setNewMenuPermissions(initialPerms);
    }
    setMenuDialogOpen(true);
  };

  const handleCloseMenuDialog = () => {
    setMenuDialogOpen(false);
    setEditingMenu(null);
  };

  const handleOpenDeleteDialog = (menu: MenuItem) => {
    setMenuToDelete(menu);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setMenuToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (menuToDelete) {
      deleteMenuMutation.mutate(menuToDelete.id);
    }
  };

  const handleSubmitMenu = () => {
    if (editingMenu && editingMenu.id) {
      updateMenuMutation.mutate({ id: editingMenu.id, data: menuFormData });
    } else {
      createMenuMutation.mutate(menuFormData);
    }
  };

  const handleNewMenuPermissionChange = (roleName: string, value: boolean) => {
    setNewMenuPermissions(prev => ({
      ...prev,
      [roleName]: value
    }));
  };

  // Permission change handler
  const handlePermissionToggle = (roleId: number, menuId: number) => {
    setLocalPermissions(prev => {
      const newPerms = { ...prev };
      if (!newPerms[roleId]) newPerms[roleId] = {};
      if (!newPerms[roleId][menuId]) {
        newPerms[roleId][menuId] = { can_view: false };
      }
      newPerms[roleId][menuId].can_view = !newPerms[roleId][menuId].can_view;
      return newPerms;
    });
    setHasChanges(true);
  };

  // Save all changes
  const handleSaveAllChanges = async () => {
    // Build bulk update data for each role
    const updates: Promise<any>[] = [];
    
    for (const roleId in localPermissions) {
      const permissions = Object.entries(localPermissions[parseInt(roleId)]).map(([menuId, perms]) => ({
        menu_item_id: parseInt(menuId),
        can_view: perms.can_view,
        can_edit: false,
        can_delete: false
      }));

      updates.push(
        bulkUpdateMutation.mutateAsync({
          role_id: parseInt(roleId),
          permissions
        })
      );
    }

    try {
      await Promise.all(updates);
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    // Reinitialize from server data
    const newLocalPermissions: typeof localPermissions = {};
    permissionMatrix.forEach((roleMatrix) => {
      newLocalPermissions[roleMatrix.role_id] = {};
      roleMatrix.permissions.forEach((perm) => {
        newLocalPermissions[roleMatrix.role_id][perm.menu_item_id] = {
          can_view: perm.can_view
        };
      });
    });
    setLocalPermissions(newLocalPermissions);
    setHasChanges(false);
  };

  // Helper functions
  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ color: '#f44336', fontSize: 16 }} />;
      case 'editor':
        return <EditorIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
      case 'viewer':
        return <ViewerIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
      default:
        return <ViewerIcon sx={{ color: '#2196f3', fontSize: 16 }} />;
    }
  };

  // Get permission for a specific role and menu (from local state)
  const getPermission = (roleId: number, menuId: number) => {
    if (localPermissions[roleId] && localPermissions[roleId][menuId]) {
      return localPermissions[roleId][menuId];
    }
    return { can_view: false };
  };

  const isLoading = rolesLoading || menusLoading || permissionsLoading;

  return (
    <Card>
      <CardHeader
        avatar={<MenuIcon color="primary" />}
        title="สิทธิ์เมนู (Menu Permissions)"
        subheader="จัดการเมนูและสิทธิ์การเข้าถึงสำหรับแต่ละบทบาท - คลิกที่ไอคอนเพื่อเปลี่ยนสิทธิ์"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasChanges && (
              <>
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  startIcon={<DiscardIcon />}
                  onClick={handleDiscardChanges}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAllChanges}
                  disabled={bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? <CircularProgress size={16} /> : 'บันทึกทั้งหมด'}
                </Button>
              </>
            )}
            <Tooltip title="รีเฟรช">
              <IconButton onClick={() => refetch()} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              onClick={() => initDefaultsMutation.mutate()}
              disabled={initDefaultsMutation.isPending}
            >
              {initDefaultsMutation.isPending ? <CircularProgress size={16} /> : 'สร้างข้อมูลเริ่มต้น'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenMenuDialog}
            >
              เพิ่มเมนู
            </Button>
          </Box>
        }
      />
      <CardContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !menuItems || menuItems.length === 0 ? (
          <Alert severity="info">
            ไม่มีข้อมูลเมนู - คลิก "สร้างข้อมูลเริ่มต้น" เพื่อสร้างเมนูเริ่มต้น
          </Alert>
        ) : (
          <>
            {/* Legend */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">สัญลักษณ์:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                <Typography variant="body2">= เห็นได้</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CancelIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
                <Typography variant="body2">= ไม่เห็น</Typography>
              </Box>
              {hasChanges && (
                <Alert severity="warning" sx={{ ml: 'auto', py: 0 }}>
                  มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก - กรุณาคลิก "บันทึกทั้งหมด"
                </Alert>
              )}
            </Box>

            {/* Main Table: Menu with Role Permissions */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>ลำดับ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: '150px' }}>เมนู</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Path</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: '80px' }}>แสดงผล</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>จัดการ</TableCell>
                    {/* Dynamic role columns */}
                    {roles.map((role) => (
                      <TableCell 
                        key={role.id} 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          width: '100px',
                          bgcolor: role.name === 'admin' ? 'error.50' : 
                                   role.name === 'editor' ? 'warning.50' : 
                                   'success.50'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          {getRoleIcon(role.name)}
                          <Typography variant="caption" fontWeight="bold">
                            {role.display_name}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((menu) => (
                    <TableRow key={`${menu.id}-${menu.icon || 'noicon'}-${menu.display_name}`} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {menu.order}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {(() => {
                            const IconComponent = iconMap[menu.icon || ''] || MenuIcon;
                            return <IconComponent fontSize="small" color="action" />;
                          })()}
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {menu.display_name}
                            </Typography>
                            {menu.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {menu.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={menu.path} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={menu.is_visible ? 'แสดง' : 'ซ่อน'}
                          size="small"
                          color={menu.is_visible ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="แก้ไขเมนู">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenMenuDialog(menu)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบเมนู">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDeleteDialog(menu)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      {/* Role permission cells */}
                      {roles.map((role) => {
                        const perm = getPermission(role.id, menu.id);
                        return (
                          <TableCell key={role.id} align="center">
                            <IconButton
                              size="small"
                              onClick={() => handlePermissionToggle(role.id, menu.id)}
                              sx={{
                                '&:hover': {
                                  bgcolor: perm.can_view ? 'error.50' : 'success.50'
                                }
                              }}
                            >
                              {perm.can_view ? (
                                <Tooltip title="คลิกเพื่อเปลี่ยนเป็น 'ไม่เห็น'">
                                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                                </Tooltip>
                              ) : (
                                <Tooltip title="คลิกเพื่อเปลี่ยนเป็น 'เห็นได้'">
                                  <CancelIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                                </Tooltip>
                              )}
                            </IconButton>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>สรุป:</strong> ระบบมี {menuItems.length} เมนู และ {roles.length} บทบาท
              </Typography>
            </Box>
          </>
        )}

        {/* Dialog: Add/Edit Menu with Permission Assignment */}
        <Dialog
          open={menuDialogOpen}
          onClose={handleCloseMenuDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingMenu ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่และกำหนดสิทธิ์'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="ชื่อเมนู (name)"
                value={menuFormData.name}
                onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                required
                fullWidth
                helperText="ชื่อเมนูภาษาอังกฤษ (เช่น dashboard, users)"
              />
              <TextField
                label="ชื่อแสดง (display_name)"
                value={menuFormData.display_name}
                onChange={(e) => setMenuFormData({ ...menuFormData, display_name: e.target.value })}
                required
                fullWidth
                helperText="ชื่อที่แสดงในเมนู"
              />
              <TextField
                label="Path"
                value={menuFormData.path}
                onChange={(e) => setMenuFormData({ ...menuFormData, path: e.target.value })}
                required
                fullWidth
                helperText="เส้นทาง URL (เช่น /dashboard, /users)"
              />
              <FormControl fullWidth required>
                <InputLabel>Icon</InputLabel>
                <Select
                  value={menuFormData.icon || ''}
                  onChange={(e) => setMenuFormData({ ...menuFormData, icon: e.target.value })}
                  label="Icon"
                  renderValue={(selected) => {
                    const IconComponent = iconMap[selected] || MenuIcon;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconComponent fontSize="small" />
                        <Typography variant="body2">{selected}</Typography>
                      </Box>
                    );
                  }}
                >
                  {Object.keys(iconMap).sort().map((iconName) => {
                    const IconComponent = iconMap[iconName];
                    return (
                      <MuiMenuItem key={iconName} value={iconName}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconComponent fontSize="small" />
                          <Typography variant="body2">{iconName}</Typography>
                        </Box>
                      </MuiMenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <TextField
                label="ลำดับ (order)"
                type="number"
                value={menuFormData.order}
                onChange={(e) => setMenuFormData({ ...menuFormData, order: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="คำอธิบาย"
                value={menuFormData.description}
                onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <FormControl fullWidth>
                <InputLabel>แสดงผล</InputLabel>
                <Select
                  value={menuFormData.is_visible ? 'true' : 'false'}
                  onChange={(e) => setMenuFormData({ ...menuFormData, is_visible: e.target.value === 'true' })}
                  label="แสดงผล"
                >
                  <MuiMenuItem value="true">แสดง</MuiMenuItem>
                  <MuiMenuItem value="false">ซ่อน</MuiMenuItem>
                </Select>
              </FormControl>

              {/* Permission Assignment Section */}
              {!editingMenu && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    กำหนดสิทธิ์การเห็นเมนู:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    {roles.map((role) => (
                    <Box 
                      key={role.id} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1,
                        borderRadius: 1,
                        bgcolor: newMenuPermissions[role.name] ? 'success.50' : 'background.paper',
                        border: '1px solid',
                        borderColor: newMenuPermissions[role.name] ? 'success.main' : 'grey.300',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: newMenuPermissions[role.name] ? 'success.100' : 'grey.100'
                        }
                      }}
                      onClick={() => handleNewMenuPermissionChange(role.name, !newMenuPermissions[role.name])}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRoleIcon(role.name)}
                        <Typography variant="body2">
                          {role.display_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Level: {role.level})
                        </Typography>
                      </Box>
                      {newMenuPermissions[role.name] ? (
                        <Chip 
                          label="เห็นได้" 
                          size="small" 
                          color="success" 
                          icon={<CheckCircleIcon />}
                        />
                      ) : (
                        <Chip 
                          label="ไม่เห็น" 
                          size="small" 
                          variant="outlined"
                          icon={<CancelIcon />}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMenuDialog}>ยกเลิก</Button>
            <Button
              variant="contained"
              onClick={handleSubmitMenu}
              disabled={
                !menuFormData.name ||
                !menuFormData.display_name ||
                !menuFormData.path ||
                createMenuMutation.isPending ||
                updateMenuMutation.isPending
              }
            >
              {(createMenuMutation.isPending || updateMenuMutation.isPending) ? (
                <CircularProgress size={20} />
              ) : (
                editingMenu ? 'บันทึก' : 'เพิ่มเมนู'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ color: 'error.main' }}>
            ยืนยันการลบเมนู
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              คุณต้องการลบเมนู <strong>{menuToDelete?.display_name}</strong> หรือไม่?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              ⚠️ การลบเมนูจะลบสิทธิ์ที่เกี่ยวข้องทั้งหมด และไม่สามารถกู้คืนได้
            </Typography>
            {menuToDelete && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>ชื่อเมนู:</strong> {menuToDelete.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Path:</strong> {menuToDelete.path}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDeleteDialog}
              disabled={deleteMenuMutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleteMenuMutation.isPending}
              startIcon={deleteMenuMutation.isPending ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deleteMenuMutation.isPending ? 'กำลังลบ...' : 'ลบเมนู'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default MenuPermissionManagementReadOnly;
