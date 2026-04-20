/**
 * Role Management Component
 * จัดการบทบาท/สิทธิ์ผู้ใช้งาน (Admin, Editor, Viewer)
 */
import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Typography,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as EditorIcon,
  Visibility as ViewerIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, Role, RoleCreate, RoleUpdate } from '../services/authExtended';

const RoleManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [formData, setFormData] = useState<RoleCreate>({
    name: '',
    display_name: '',
    description: '',
    level: 10,
    is_active: true
  });

  // Fetch roles
  const { data: rolesData, isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list()
  });

  // Ensure roles is always an array
  const roles = Array.isArray(rolesData) ? rolesData : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('สร้างบทบาทสำเร็จ');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการสร้างบทบาท';
      setErrorMessage(message);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) => rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('อัพเดทบทบาทสำเร็จ');
      handleCloseDialog();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการอัพเดทบทบาท';
      setErrorMessage(message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('ลบบทบาทสำเร็จ');
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการลบบทบาท';
      setErrorMessage(message);
      setDeleteConfirmOpen(false);
    }
  });

  // Init defaults mutation
  const initDefaultsMutation = useMutation({
    mutationFn: () => rolesApi.initDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('สร้างบทบาทเริ่มต้นสำเร็จ');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการสร้างบทบาทเริ่มต้น';
      setErrorMessage(message);
    }
  });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        level: role.level,
        is_active: role.is_active
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        level: 10,
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      level: 10,
      is_active: true
    });
  };

  const handleSubmit = () => {
    // Validation
    setErrorMessage('');
    if (!formData.name || formData.name.trim() === '') {
      setErrorMessage('กรุณากรอกชื่อบทบาท');
      return;
    }
    if (!formData.display_name || formData.display_name.trim() === '') {
      setErrorMessage('กรุณากรอกชื่อแสดง');
      return;
    }
    if (formData.level < 0 || formData.level > 100) {
      setErrorMessage('ระดับสิทธิ์ต้องอยู่ระหว่าง 0-100');
      return;
    }

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.id);
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return <AdminIcon sx={{ color: '#f44336' }} />;
      case 'editor':
        return <EditorIcon sx={{ color: '#ff9800' }} />;
      case 'viewer':
        return <ViewerIcon sx={{ color: '#4caf50' }} />;
      default:
        return <SecurityIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 80) return 'error';
    if (level >= 40) return 'warning';
    return 'success';
  };

  return (
    <Card>
      <CardHeader
        avatar={<SecurityIcon color="primary" />}
        title="จัดการบทบาท (Roles)"
        subheader="กำหนดบทบาทและระดับสิทธิ์การเข้าถึงระบบ"
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
              {initDefaultsMutation.isPending ? <CircularProgress size={16} /> : 'สร้าง Default Roles'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              เพิ่มบทบาท
            </Button>
          </Box>
        }
      />
      <CardContent>
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as Error).message}
          </Alert>
        )}

        {isLoading ? (
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
                          <IconButton size="small" onClick={() => handleOpenDialog(role)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(role)}
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

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingRole ? 'แก้ไขบทบาท' : 'เพิ่มบทบาทใหม่'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="ชื่อบทบาท (Name)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                helperText="ใช้สำหรับระบบ (ภาษาอังกฤษ ไม่มีเว้นวรรค)"
                disabled={!!editingRole}
              />
              <TextField
                label="ชื่อแสดง (Display Name)"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="คำอธิบาย"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <Box>
                <Typography gutterBottom>ระดับสิทธิ์: {formData.level}</Typography>
                <Slider
                  value={formData.level}
                  onChange={(_, value) => setFormData({ ...formData, level: value as number })}
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
              variant="contained"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : editingRole ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
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
            <Button onClick={() => setDeleteConfirmOpen(false)}>ยกเลิก</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <CircularProgress size={20} /> : 'ลบ'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RoleManagement;
