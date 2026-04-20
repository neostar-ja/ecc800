/**
 * Menu Permission Management Component
 * จัดการเมนูและสิทธิ์การเข้าถึงเมนูสำหรับแต่ละบทบาท
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
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  Tabs,
  Tab,
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem as MuiMenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Security as SecurityIcon,
  Menu as MenuIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  rolesApi,
  menuItemsApi,
  permissionsApi,
  Role,
  MenuItem,
  RolePermissionMatrix,
  BulkPermissionUpdate
} from '../services/authExtended';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
  </div>
);

const MenuPermissionManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0); // 0 = เมนู, 1 = สิทธิ์
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [localPermissions, setLocalPermissions] = useState<{
    [roleId: number]: { [menuId: number]: { can_view: boolean; can_edit: boolean; can_delete: boolean } }
  }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Menu management states
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [deleteMenuConfirmOpen, setDeleteMenuConfirmOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null);
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

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list({ is_active: true })
  });

  // Ensure roles is always an array
  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Fetch menu items
  const { data: menuItemsData, isLoading: menusLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => menuItemsApi.listAll()
  });

  // Ensure menuItems is always an array
  const menuItems = Array.isArray(menuItemsData) ? menuItemsData : [];

  // Fetch permission matrix
  const { data: permissionMatrixData, isLoading: permissionsLoading, refetch } = useQuery({
    queryKey: ['permissionMatrix'],
    queryFn: () => permissionsApi.getMatrix()
  });

  // Ensure permissionMatrix is always an array
  const permissionMatrix = Array.isArray(permissionMatrixData) ? permissionMatrixData : [];

  // Initialize local permissions when data loads
  useEffect(() => {
    if (permissionMatrix) {
      const newLocalPermissions: typeof localPermissions = {};
      permissionMatrix.forEach((roleMatrix) => {
        newLocalPermissions[roleMatrix.role_id] = {};
        roleMatrix.permissions.forEach((perm) => {
          newLocalPermissions[roleMatrix.role_id][perm.menu_item_id] = {
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete
          };
        });
      });
      setLocalPermissions(newLocalPermissions);
      setHasChanges(false);
    }
  }, [permissionMatrix]);

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkPermissionUpdate) => permissionsApi.bulkUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'บันทึกสิทธิ์สำเร็จ', severity: 'success' });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `บันทึกล้มเหลว: ${error.message}`, severity: 'error' });
    }
  });

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

  // Menu CRUD mutations
  const createMenuMutation = useMutation({
    mutationFn: (data: typeof menuFormData) => menuItemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setSnackbar({ open: true, message: 'สร้างเมนูสำเร็จ', severity: 'success' });
      handleCloseMenuDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการสร้างเมนู';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof menuFormData> }) => 
      menuItemsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setSnackbar({ open: true, message: 'อัพเดทเมนูสำเร็จ', severity: 'success' });
      handleCloseMenuDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการอัพเดทเมนู';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id: number) => menuItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      queryClient.invalidateQueries({ queryKey: ['permissionMatrix'] });
      setSnackbar({ open: true, message: 'ลบเมนูสำเร็จ', severity: 'success' });
      setDeleteMenuConfirmOpen(false);
      setMenuToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการลบเมนู';
      setSnackbar({ open: true, message, severity: 'error' });
      setDeleteMenuConfirmOpen(false);
    }
  });

  // Menu handlers
  const handleOpenMenuDialog = (menu?: MenuItem) => {
    if (menu) {
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
    }
    setMenuDialogOpen(true);
  };

  const handleCloseMenuDialog = () => {
    setMenuDialogOpen(false);
    setEditingMenu(null);
  };

  const handleSubmitMenu = () => {
    if (editingMenu) {
      updateMenuMutation.mutate({ id: editingMenu.id, data: menuFormData });
    } else {
      createMenuMutation.mutate(menuFormData);
    }
  };

  const handleDeleteMenuClick = (menu: MenuItem) => {
    setMenuToDelete(menu);
    setDeleteMenuConfirmOpen(true);
  };

  const handleConfirmDeleteMenu = () => {
    if (menuToDelete) {
      deleteMenuMutation.mutate(menuToDelete.id);
    }
  };

  // Permission handlers
  const handlePermissionChange = (
    roleId: number,
    menuId: number,
    field: 'can_view' | 'can_edit' | 'can_delete',
    value: boolean
  ) => {
    setLocalPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[roleId]) {
        newPerms[roleId] = {};
      }
      if (!newPerms[roleId][menuId]) {
        newPerms[roleId][menuId] = { can_view: false, can_edit: false, can_delete: false };
      }
      newPerms[roleId][menuId] = {
        ...newPerms[roleId][menuId],
        [field]: value
      };
      
      // If can_edit or can_delete is true, can_view must be true
      if (field !== 'can_view' && value) {
        newPerms[roleId][menuId].can_view = true;
      }
      // If can_view is false, can_edit and can_delete must be false
      if (field === 'can_view' && !value) {
        newPerms[roleId][menuId].can_edit = false;
        newPerms[roleId][menuId].can_delete = false;
      }
      
      return newPerms;
    });
    setHasChanges(true);
  };

  const handleSave = (roleId: number) => {
    if (!localPermissions[roleId]) return;

    const permissions = Object.entries(localPermissions[roleId]).map(([menuId, perms]) => ({
      menu_item_id: parseInt(menuId),
      ...perms
    }));

    bulkUpdateMutation.mutate({ role_id: roleId, permissions });
  };

  const handleSetAllView = (roleId: number, value: boolean) => {
    if (!menuItems) return;
    
    setLocalPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[roleId]) {
        newPerms[roleId] = {};
      }
      menuItems.forEach((menu) => {
        if (!newPerms[roleId][menu.id]) {
          newPerms[roleId][menu.id] = { can_view: false, can_edit: false, can_delete: false };
        }
        newPerms[roleId][menu.id].can_view = value;
        if (!value) {
          newPerms[roleId][menu.id].can_edit = false;
          newPerms[roleId][menu.id].can_delete = false;
        }
      });
      return newPerms;
    });
    setHasChanges(true);
  };

  const handleSetAllEdit = (roleId: number, value: boolean) => {
    if (!menuItems) return;
    
    setLocalPermissions((prev) => {
      const newPerms = { ...prev };
      if (!newPerms[roleId]) {
        newPerms[roleId] = {};
      }
      menuItems.forEach((menu) => {
        if (!newPerms[roleId][menu.id]) {
          newPerms[roleId][menu.id] = { can_view: false, can_edit: false, can_delete: false };
        }
        newPerms[roleId][menu.id].can_edit = value;
        if (value) {
          newPerms[roleId][menu.id].can_view = true;
        }
      });
      return newPerms;
    });
    setHasChanges(true);
  };

  const isLoading = rolesLoading || menusLoading || permissionsLoading;
  const currentRole = roles?.[selectedRoleIndex];

  return (
    <Card>
      <CardHeader
        avatar={<MenuIcon color="primary" />}
        title="จัดการเมนูและสิทธิ์"
        subheader="จัดการเมนูระบบและกำหนดสิทธิ์การเข้าถึงสำหรับแต่ละบทบาท"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
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
          </Box>
        }
      />
      <CardContent>
        {/* Main Tabs: Menu Management & Permissions */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="จัดการเมนู" icon={<MenuIcon />} iconPosition="start" />
          <Tab label="จัดการสิทธิ์" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 1: Menu Management */}
        <TabPanel value={selectedTab} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenMenuDialog()}
            >
              เพิ่มเมนู
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !menuItems || menuItems.length === 0 ? (
            <Alert severity="info">
              ไม่มีข้อมูลเมนู - คลิก "สร้างข้อมูลเริ่มต้น" เพื่อสร้างเมนูเริ่มต้น
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ลำดับ</TableCell>
                    <TableCell>ชื่อเมนู</TableCell>
                    <TableCell>ชื่อแสดง</TableCell>
                    <TableCell>Path</TableCell>
                    <TableCell>Icon</TableCell>
                    <TableCell align="center">แสดงผล</TableCell>
                    <TableCell align="center">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((menu) => (
                    <TableRow key={menu.id} hover>
                      <TableCell>{menu.order}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {menu.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{menu.display_name}</TableCell>
                      <TableCell>
                        <Chip label={menu.path} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{menu.icon || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={menu.is_visible ? 'แสดง' : 'ซ่อน'}
                          size="small"
                          color={menu.is_visible ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="แก้ไข">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenMenuDialog(menu)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteMenuClick(menu)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Tab 2: Permissions Management */}
        <TabPanel value={selectedTab} index={1}>
                {/* Quick Actions */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckIcon />}
                    onClick={() => handleSetAllView(currentRole.id, true)}
                  >
                    เลือกทั้งหมด (View)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => handleSetAllView(currentRole.id, false)}
                  >
                    ยกเลิกทั้งหมด (View)
                  </Button>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckIcon />}
                    onClick={() => handleSetAllEdit(currentRole.id, true)}
                  >
                    เลือกทั้งหมด (Edit)
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={() => handleSetAllEdit(currentRole.id, false)}
                  >
                    ยกเลิกทั้งหมด (Edit)
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  {hasChanges && (
                    <Chip label="มีการเปลี่ยนแปลง" color="warning" size="small" />
                  )}
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave(currentRole.id)}
                    disabled={!hasChanges || bulkUpdateMutation.isPending}
                  >
                    {bulkUpdateMutation.isPending ? <CircularProgress size={20} /> : 'บันทึก'}
                  </Button>
                </Box>

                {/* Permission Matrix Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>เมนู</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Path</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '16%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <ViewIcon fontSize="small" />
                            ดู (View)
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '16%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <EditIcon fontSize="small" />
                            แก้ไข (Edit)
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: '16%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                            ลบ (Delete)
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {menuItems.map((menu) => {
                        const perms = localPermissions[currentRole.id]?.[menu.id] || {
                          can_view: false,
                          can_edit: false,
                          can_delete: false
                        };
                        
                        return (
                          <TableRow key={menu.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {menu.display_name}
                              </Typography>
                              {menu.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {menu.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip label={menu.path} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={perms.can_view}
                                onChange={(e) =>
                                  handlePermissionChange(currentRole.id, menu.id, 'can_view', e.target.checked)
                                }
                                color="success"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={perms.can_edit}
                                onChange={(e) =>
                                  handlePermissionChange(currentRole.id, menu.id, 'can_edit', e.target.checked)
                                }
                                color="warning"
                                disabled={!perms.can_view}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={perms.can_delete}
                                onChange={(e) =>
                                  handlePermissionChange(currentRole.id, menu.id, 'can_delete', e.target.checked)
                                }
                                color="error"
                                disabled={!perms.can_view}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
        </TabPanel>

        {/* Dialog: Add/Edit Menu */}
        <Dialog
          open={menuDialogOpen}
          onClose={handleCloseMenuDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingMenu ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}
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
              <TextField
                label="Icon"
                value={menuFormData.icon}
                onChange={(e) => setMenuFormData({ ...menuFormData, icon: e.target.value })}
                fullWidth
                helperText="ชื่อ icon (เช่น Dashboard, Person)"
              />
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
              {editingMenu ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog: Delete Confirmation */}
        <Dialog
          open={deleteMenuConfirmOpen}
          onClose={() => setDeleteMenuConfirmOpen(false)}
        >
          <DialogTitle>ยืนยันการลบเมนู</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              คุณแน่ใจหรือไม่ที่จะลบเมนู "{menuToDelete?.display_name}"?
            </Alert>
            <Typography variant="body2">
              การลบเมนูจะลบสิทธิ์ที่เกี่ยวข้องทั้งหมดด้วย
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteMenuConfirmOpen(false)}>ยกเลิก</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDeleteMenu}
              disabled={deleteMenuMutation.isPending}
            >
              {deleteMenuMutation.isPending ? <CircularProgress size={20} /> : 'ลบ'}
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

export default MenuPermissionManagement;
