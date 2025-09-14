import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

interface User {
  id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  role: string;
  site_access: string[] | string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  email: string;
  role: string;
  site_access: string[];
  is_active: boolean;
}

interface Role {
  value: string;
  label: string;
  description: string;
}

export const UserManagement: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form data state
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'viewer',
    site_access: [],
    is_active: true
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load users and roles on component mount
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // API Functions
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiGet<User[]>('/admin/users');
      setUsers(response);
    } catch (error: any) {
      showSnackbar('Failed to load users: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiGet<{ roles: Role[] }>('/admin/roles');
      setRoles(response.roles || []);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      // Default roles if API fails
      setRoles([
        { value: 'admin', label: 'Administrator', description: 'Full system access' },
        { value: 'analyst', label: 'Data Analyst', description: 'Data analysis and reporting' },
        { value: 'viewer', label: 'Viewer', description: 'View-only access' }
      ]);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      // Convert site_access array to JSON string for API
      const apiData = {
        ...userData,
        site_access: JSON.stringify(userData.site_access)
      };
      await apiPost('/admin/users', apiData);
      loadUsers();
      showSnackbar('User created successfully!', 'success');
      closeDialog();
    } catch (error: any) {
      showSnackbar('Failed to create user: ' + error.message, 'error');
    }
  };

  const updateUser = async (userId: number, userData: Partial<UserFormData>) => {
    try {
      // Convert site_access array to JSON string for API if provided
      const apiData = {
        ...userData,
        site_access: userData.site_access ? JSON.stringify(userData.site_access) : undefined
      };
      await apiPut(`/admin/users/${userId}`, apiData);
      loadUsers();
      showSnackbar('User updated successfully!', 'success');
      closeDialog();
    } catch (error: any) {
      showSnackbar('Failed to update user: ' + error.message, 'error');
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      await apiDelete(`/admin/users/${userId}`);
      loadUsers();
      showSnackbar('User deleted successfully!', 'success');
      setDeleteDialogOpen(false);
    } catch (error: any) {
      showSnackbar('Failed to delete user: ' + error.message, 'error');
    }
  };

  const changePassword = async (userId: number, passwordData: any) => {
    try {
      await apiPost(`/admin/users/${userId}/change-password`, passwordData);
      showSnackbar('Password changed successfully!', 'success');
      setPasswordDialogOpen(false);
    } catch (error: any) {
      showSnackbar('Failed to change password: ' + error.message, 'error');
    }
  };

  // Helper functions
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openCreateDialog = () => {
    setFormMode('create');
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'viewer',
      site_access: [],
      is_active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    
    // Parse site_access if it's a string
    let siteAccessArray: string[] = [];
    if (user.site_access) {
      if (typeof user.site_access === 'string') {
        try {
          siteAccessArray = JSON.parse(user.site_access);
        } catch {
          siteAccessArray = user.site_access.split(',').map(s => s.trim());
        }
      } else {
        siteAccessArray = user.site_access;
      }
    }

    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role,
      site_access: siteAccessArray,
      is_active: user.is_active
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setPasswordDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (formMode === 'create') {
      await createUser(formData);
    } else if (selectedUser) {
      const updateData = { ...formData };
      // Don't send password if it's empty during edit
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      await updateUser(selectedUser.id, updateData);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    if (selectedUser) {
      await changePassword(selectedUser.id, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
    }
  };

  const formatSiteAccess = (siteAccess: string[] | string | null): string => {
    if (!siteAccess) return 'None';
    if (typeof siteAccess === 'string') {
      try {
        const parsed = JSON.parse(siteAccess);
        return Array.isArray(parsed) ? parsed.join(', ') : siteAccess;
      } catch {
        return siteAccess;
      }
    }
    return Array.isArray(siteAccess) ? siteAccess.join(', ') : 'None';
  };

  const getRoleLabel = (roleValue: string): string => {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          การจัดการผู้ใช้
        </Typography>
        <Box>
          <Tooltip title="รีเฟรชข้อมูล">
            <IconButton onClick={loadUsers} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            เพิ่มผู้ใช้
          </Button>
        </Box>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ชื่อผู้ใช้</TableCell>
              <TableCell>ชื่อเต็ม</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell>บทบาท</TableCell>
              <TableCell>สิทธิ์เข้าถึงไซต์</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วันที่สร้าง</TableCell>
              <TableCell>การดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.full_name || '-'}</TableCell>
                <TableCell>{user.email || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={getRoleLabel(user.role)}
                    color={user.role === 'admin' ? 'error' : user.role === 'analyst' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatSiteAccess(user.site_access)}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('th-TH')}
                </TableCell>
                <TableCell>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" onClick={() => openEditDialog(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="เปลี่ยนรหัสผ่าน">
                    <IconButton size="small" onClick={() => openPasswordDialog(user)}>
                      <KeyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => openDeleteDialog(user)}
                      disabled={user.username === 'admin'} // Prevent deleting admin
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? 'สร้างผู้ใช้ใหม่' : 'แก้ไขผู้ใช้'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="ชื่อผู้ใช้"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              margin="normal"
              required
              disabled={formMode === 'edit'}
            />
            
            {formMode === 'create' && (
              <Box sx={{ position: 'relative' }}>
                <TextField
                  fullWidth
                  label="รหัสผ่าน"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  margin="normal"
                  required
                />
                <IconButton
                  sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOffIcon /> : <ViewIcon />}
                </IconButton>
              </Box>
            )}

            <TextField
              fullWidth
              label="ชื่อเต็ม"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>บทบาท</InputLabel>
              <Select
                value={formData.role}
                label="บทบาท"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="สิทธิ์เข้าถึงไซต์ (คั่นด้วยเครื่องหมายจุลภาค)"
              value={formData.site_access.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                site_access: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              margin="normal"
              helperText="ใส่รหัสไซต์คั่นด้วยเครื่องหมายจุลภาค (เช่น DC, DR, TEST)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="ใช้งาน"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>ยกเลิก</Button>
          <Button onClick={handleSubmit} variant="contained">
            {formMode === 'create' ? 'สร้าง' : 'อัปเดต'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>เปลี่ยนรหัสผ่านสำหรับ {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="รหัสผ่านปัจจุบัน"
            type="password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="รหัสผ่านใหม่"
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>ยกเลิก</Button>
          <Button onClick={handlePasswordChange} variant="contained">
            เปลี่ยนรหัสผ่าน
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณแน่ใจหรือไม่ที่ต้องการลบผู้ใช้ "{selectedUser?.username}"?
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
          <Button 
            onClick={() => selectedUser && deleteUser(selectedUser.id)} 
            color="error"
            variant="contained"
          >
            ลบ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
