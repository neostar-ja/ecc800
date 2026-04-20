/**
 * User Management Component
 * จัดการผู้ใช้พร้อม Role Assignment
 */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as EditorIcon,
  Person as ViewerIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, Role } from '../services/authExtended';

// User types
interface User {
  id: number;
  username: string;
  email?: string | null;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserCreate {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  role: string;
  is_active?: boolean;
}

interface UserUpdate {
  password?: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}

// API functions
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

const usersApi = {
  list: async () => {
    return apiGet<User[]>('/users/');
  },
  get: async (id: number) => {
    return apiGet<User>(`/users/${id}/`);
  },
  create: async (data: UserCreate) => {
    return apiPost<User>('/users/', data);
  },
  update: async (id: number, data: UserUpdate) => {
    return apiPut<User>(`/users/${id}/`, data);
  },
  delete: async (id: number) => {
    return apiDelete(`/users/${id}/`);
  }
};

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'viewer',
    is_active: true
  });

  // Fetch users
  const { data: users, isLoading: usersLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list()
  });

  // Fetch roles for selection
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list({ is_active: true })
  });

  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleCloseDialog();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Don't pre-fill password
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role,
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 'viewer',
        is_active: true
      });
    }
    setDialogOpen(true);
    setShowPassword(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      full_name: '',
      role: 'viewer',
      is_active: true
    });
    setShowPassword(false);
  };

  const handleSubmit = () => {
    if (editingUser) {
      // When updating, only send password if it's not empty
      const updateData: UserUpdate = {
        email: formData.email || undefined,
        full_name: formData.full_name || undefined,
        role: formData.role,
        is_active: formData.is_active
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ color: '#f44336', fontSize: 18 }} />;
      case 'editor':
        return <EditorIcon sx={{ color: '#ff9800', fontSize: 18 }} />;
      case 'viewer':
        return <ViewerIcon sx={{ color: '#4caf50', fontSize: 18 }} />;
      default:
        return <ViewerIcon sx={{ color: '#2196f3', fontSize: 18 }} />;
    }
  };

  const getRoleColor = (role: string): "error" | "warning" | "success" | "default" => {
    switch (role.toLowerCase()) {
      case 'admin': return 'error';
      case 'editor': return 'warning';
      case 'viewer': return 'success';
      default: return 'default';
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.display_name || roleName;
  };

  return (
    <>
      <Card elevation={0}>
        <CardHeader
          avatar={<PeopleIcon color="primary" />}
          title="จัดการผู้ใช้ (User Management)"
          subheader="จัดการผู้ใช้งานระบบและกำหนดบทบาท"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="รีเฟรช">
                <IconButton onClick={() => refetch()} disabled={usersLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                เพิ่มผู้ใช้
              </Button>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
            </Alert>
          )}

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชื่อผู้ใช้</TableCell>
                    <TableCell>ชื่อ-นามสกุล</TableCell>
                    <TableCell>อีเมล</TableCell>
                    <TableCell align="center">บทบาท</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                    <TableCell align="center">การจัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={getRoleDisplayName(user.role)}
                            size="small"
                            color={getRoleColor(user.role)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                            variant={user.is_active ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="แก้ไข">
                            <IconButton size="small" onClick={() => handleOpenDialog(user)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">ไม่มีข้อมูลผู้ใช้</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="ชื่อผู้ใช้ (Username)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
              disabled={!!editingUser}
              helperText={editingUser ? "ไม่สามารถแก้ไขชื่อผู้ใช้ได้" : ""}
            />
            
            <TextField
              label={editingUser ? "รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              label="ชื่อ-นามสกุล"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="อีเมล"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            
            <FormControl fullWidth required>
              <InputLabel>บทบาท (Role)</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="บทบาท (Role)"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRoleIcon(role.name)}
                      {role.display_name} (Level: {role.level})
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <CircularProgress size={24} />
            ) : (
              editingUser ? 'บันทึก' : 'เพิ่ม'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบผู้ใช้ "{userToDelete?.username}" ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={24} /> : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement;
