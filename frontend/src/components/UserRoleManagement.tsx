/**
 * User & Role Management Component (Combined)
 * รวมหน้าจัดการผู้ใช้และบทบาทในหน้าเดียว
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
  InputAdornment,
  Divider,
  Grid,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as EditorIcon,
  Person as ViewerIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, Role, RoleCreate, RoleUpdate } from '../services/authExtended';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

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

const UserRoleManagement: React.FC = () => {
  const queryClient = useQueryClient();
  
  // User states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userFormData, setUserFormData] = useState<UserCreate>({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'viewer',
    is_active: true
  });

  // Role states
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleConfirmOpen, setDeleteRoleConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [roleFormData, setRoleFormData] = useState<RoleCreate>({
    name: '',
    display_name: '',
    description: '',
    level: 10,
    is_active: true
  });

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list()
  });

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list()
  });

  const roles = Array.isArray(rolesData) ? rolesData : [];
  const activeRoles = roles.filter(r => r.is_active);

  // ====== USER MUTATIONS ======
  const createUserMutation = useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('สร้างผู้ใช้สำเร็จ');
      handleCloseUserDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      setErrorMessage(message);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('อัพเดทผู้ใช้สำเร็จ');
      handleCloseUserDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      setErrorMessage(message);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage('ลบผู้ใช้สำเร็จ');
      setDeleteUserConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      setErrorMessage(message);
      setDeleteUserConfirmOpen(false);
    }
  });

  // ====== ROLE MUTATIONS ======
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('สร้างบทบาทสำเร็จ');
      handleCloseRoleDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการสร้างบทบาท';
      setErrorMessage(message);
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('อัพเดทบทบาทสำเร็จ');
      handleCloseRoleDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการอัพเดทบทบาท';
      setErrorMessage(message);
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('ลบบทบาทสำเร็จ');
      setDeleteRoleConfirmOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการลบบทบาท';
      setErrorMessage(message);
      setDeleteRoleConfirmOpen(false);
    }
  });

  const initDefaultsMutation = useMutation({
    mutationFn: () => rolesApi.initDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('สร้างบทบาทเริ่มต้นสำเร็จ');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      setErrorMessage(message);
    }
  });

  // ====== USER HANDLERS ======
  const handleOpenUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        username: user.username,
        password: '',
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role,
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 'viewer',
        is_active: true
      });
    }
    setUserDialogOpen(true);
    setShowPassword(false);
  };

  const handleCloseUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
    setUserFormData({
      username: '',
      password: '',
      email: '',
      full_name: '',
      role: 'viewer',
      is_active: true
    });
    setShowPassword(false);
  };

  const handleSubmitUser = () => {
    if (editingUser) {
      const updateData: UserUpdate = {
        email: userFormData.email || undefined,
        full_name: userFormData.full_name || undefined,
        role: userFormData.role,
        is_active: userFormData.is_active
      };
      if (userFormData.password) {
        updateData.password = userFormData.password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      createUserMutation.mutate(userFormData);
    }
  };

  const handleDeleteUserClick = (user: User) => {
    setUserToDelete(user);
    setDeleteUserConfirmOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  // ====== ROLE HANDLERS ======
  const handleOpenRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        level: role.level,
        is_active: role.is_active
      });
    } else {
      setEditingRole(null);
      setRoleFormData({
        name: '',
        display_name: '',
        description: '',
        level: 10,
        is_active: true
      });
    }
    setRoleDialogOpen(true);
  };

  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
    setEditingRole(null);
    setRoleFormData({
      name: '',
      display_name: '',
      description: '',
      level: 10,
      is_active: true
    });
  };

  const handleSubmitRole = () => {
    setErrorMessage('');
    if (!roleFormData.name || roleFormData.name.trim() === '') {
      setErrorMessage('กรุณากรอกชื่อบทบาท');
      return;
    }
    if (!roleFormData.display_name || roleFormData.display_name.trim() === '') {
      setErrorMessage('กรุณากรอกชื่อแสดง');
      return;
    }
    if (roleFormData.level < 0 || roleFormData.level > 100) {
      setErrorMessage('ระดับสิทธิ์ต้องอยู่ระหว่าง 0-100');
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data: roleFormData });
    } else {
      createRoleMutation.mutate(roleFormData);
    }
  };

  const handleDeleteRoleClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteRoleConfirmOpen(true);
  };

  const handleConfirmDeleteRole = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  // ====== HELPER FUNCTIONS ======
  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
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

  const getLevelColor = (level: number): "error" | "warning" | "success" => {
    if (level >= 80) return 'error';
    if (level >= 40) return 'warning';
    return 'success';
  };

  const getRoleDisplayName = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role?.display_name || roleName;
  };

  const handleRefresh = () => {
    refetchUsers();
    refetchRoles();
  };

  const isLoading = usersLoading || rolesLoading;

  return (
    <Box>
      {/* Alerts */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ====== USERS SECTION ====== */}
        <Grid item xs={12}>
          <Card elevation={0}>
            <CardHeader
              avatar={<PeopleIcon color="primary" />}
              title="จัดการผู้ใช้ (User Management)"
              subheader="จัดการผู้ใช้งานระบบและกำหนดบทบาท"
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="รีเฟรช">
                    <IconButton onClick={handleRefresh} disabled={isLoading}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenUserDialog()}
                  >
                    เพิ่มผู้ใช้
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {usersError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล: {(usersError as Error).message}
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
                                <IconButton size="small" onClick={() => handleOpenUserDialog(user)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ลบ">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteUserClick(user)}
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
        </Grid>

        {/* ====== ROLES SECTION ====== */}
        <Grid item xs={12}>
          <Card elevation={0}>
            <CardHeader
              avatar={<SecurityIcon color="primary" />}
              title="จัดการบทบาท (Roles)"
              subheader="กำหนดบทบาทและระดับสิทธิ์การเข้าถึงระบบ"
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => initDefaultsMutation.mutate()}
                    disabled={initDefaultsMutation.isPending}
                  >
                    {initDefaultsMutation.isPending ? <CircularProgress size={16} /> : 'สร้าง Default Roles'}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenRoleDialog()}
                  >
                    เพิ่มบทบาท
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {rolesError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล: {(rolesError as Error).message}
                </Alert>
              )}

              {rolesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>บทบาท</TableCell>
                        <TableCell>ชื่อแสดง</TableCell>
                        <TableCell>คำอธิบาย</TableCell>
                        <TableCell align="center">ระดับสิทธิ์</TableCell>
                        <TableCell align="center">สถานะ</TableCell>
                        <TableCell align="center">การจัดการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roles && roles.length > 0 ? (
                        roles.map((role) => (
                          <TableRow key={role.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getRoleIcon(role.name)}
                                <Typography variant="body2" fontWeight="medium">
                                  {role.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{role.display_name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                                {role.description || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={role.level}
                                size="small"
                                color={getLevelColor(role.level)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={role.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                size="small"
                                color={role.is_active ? 'success' : 'default'}
                                variant={role.is_active ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="แก้ไข">
                                <IconButton size="small" onClick={() => handleOpenRoleDialog(role)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="ลบ">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteRoleClick(role)}
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
                            <Typography color="text.secondary">
                              ไม่มีข้อมูลบทบาท - คลิก "สร้าง Default Roles" เพื่อเริ่มต้น
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ====== USER DIALOGS ====== */}
      {/* Create/Edit User Dialog */}
      <Dialog open={userDialogOpen} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="ชื่อผู้ใช้ (Username)"
              value={userFormData.username}
              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
              required
              fullWidth
              disabled={!!editingUser}
              helperText={editingUser ? "ไม่สามารถแก้ไขชื่อผู้ใช้ได้" : ""}
            />
            
            <TextField
              label={editingUser ? "รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)" : "รหัสผ่าน"}
              type={showPassword ? 'text' : 'password'}
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
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
              value={userFormData.full_name}
              onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="อีเมล"
              type="email"
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              fullWidth
            />
            
            <FormControl fullWidth required>
              <InputLabel>บทบาท (Role)</InputLabel>
              <Select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                label="บทบาท (Role)"
              >
                {activeRoles.map((role) => (
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
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>ยกเลิก</Button>
          <Button 
            onClick={handleSubmitUser} 
            variant="contained" 
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
          >
            {(createUserMutation.isPending || updateUserMutation.isPending) ? (
              <CircularProgress size={24} />
            ) : (
              editingUser ? 'บันทึก' : 'เพิ่ม'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserConfirmOpen} onClose={() => setDeleteUserConfirmOpen(false)}>
        <DialogTitle>ยืนยันการลบ</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบผู้ใช้ "{userToDelete?.username}" ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserConfirmOpen(false)}>ยกเลิก</Button>
          <Button 
            onClick={handleConfirmDeleteUser} 
            color="error" 
            variant="contained"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? <CircularProgress size={24} /> : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====== ROLE DIALOGS ====== */}
      {/* Create/Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRole ? 'แก้ไขบทบาท' : 'เพิ่มบทบาทใหม่'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="ชื่อบทบาท (Name)"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              fullWidth
              required
              helperText="ใช้สำหรับระบบ (ภาษาอังกฤษ ไม่มีเว้นวรรค)"
              disabled={!!editingRole}
            />
            <TextField
              label="ชื่อแสดง (Display Name)"
              value={roleFormData.display_name}
              onChange={(e) => setRoleFormData({ ...roleFormData, display_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="คำอธิบาย"
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box>
              <Typography gutterBottom>ระดับสิทธิ์: {roleFormData.level}</Typography>
              <Slider
                value={roleFormData.level}
                onChange={(_, value) => setRoleFormData({ ...roleFormData, level: value as number })}
                min={0}
                max={100}
                step={10}
                marks={[
                  { value: 0, label: '0' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                ระดับยิ่งสูง = สิทธิ์ยิ่งมาก (Admin: 100, Editor: 50, Viewer: 10)
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={roleFormData.is_active}
                  onChange={(e) => setRoleFormData({ ...roleFormData, is_active: e.target.checked })}
                />
              }
              label="เปิดใช้งาน"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRole}
            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            {createRoleMutation.isPending || updateRoleMutation.isPending ? (
              <CircularProgress size={20} />
            ) : editingRole ? 'บันทึก' : 'เพิ่ม'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={deleteRoleConfirmOpen} onClose={() => setDeleteRoleConfirmOpen(false)}>
        <DialogTitle>ยืนยันการลบบทบาท</DialogTitle>
        <DialogContent>
          <Typography>
            คุณต้องการลบบทบาท <strong>{roleToDelete?.display_name}</strong> หรือไม่?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            บทบาทที่มีผู้ใช้งานอยู่จะไม่สามารถลบได้
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRoleConfirmOpen(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteRole}
            disabled={deleteRoleMutation.isPending}
          >
            {deleteRoleMutation.isPending ? <CircularProgress size={20} /> : 'ลบ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRoleManagement;
