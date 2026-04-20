/**
 * Keycloak User Mapping Panel
 * จัดการการ map user จาก Keycloak กับ role ในระบบ
 * ผู้ใช้สามารถเลือก users จาก Keycloak และกำหนด role แบบ individual
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  Badge,
  Avatar,
  InputAdornment,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  keycloakApi, 
  KeycloakUserWithMapping, 
  KeycloakUserMappingCreate,
  KeycloakUserMappingUpdate
} from '../services/authExtended';

const KeycloakUserMappingPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<KeycloakUserWithMapping | null>(null);
  const [newMappingRole, setNewMappingRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch users with mappings
  const { data: usersData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['keycloakUsersWithMappings', searchTerm],
    queryFn: () => keycloakApi.getUsersWithMappings({ 
      search: searchTerm || undefined,
      max_results: 100 
    }),
    staleTime: 30000, // Cache for 30 seconds
    retry: false // Don't retry on error
  });

  // Create mapping mutation
  const createMappingMutation = useMutation({
    mutationFn: (data: KeycloakUserMappingCreate) => keycloakApi.createUserMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keycloakUsersWithMappings'] });
      setMessage({ type: 'success', text: 'เพิ่มการกำหนดสิทธิ์สำเร็จ' });
      handleCloseAddDialog();
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'เกิดข้อผิดพลาดในการเพิ่มสิทธิ์' 
      });
    }
  });

  // Update mapping mutation
  const updateMappingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: KeycloakUserMappingUpdate }) => 
      keycloakApi.updateUserMapping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keycloakUsersWithMappings'] });
      setMessage({ type: 'success', text: 'อัพเดทสิทธิ์สำเร็จ' });
      handleCloseEditDialog();
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'เกิดข้อผิดพลาดในการอัพเดท' 
      });
    }
  });

  // Delete mapping mutation
  const deleteMappingMutation = useMutation({
    mutationFn: (mappingId: number) => keycloakApi.deleteUserMapping(mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keycloakUsersWithMappings'] });
      setMessage({ type: 'success', text: 'ลบการกำหนดสิทธิ์สำเร็จ' });
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบ' 
      });
    }
  });

  const handleAddMapping = () => {
    if (!selectedUser) return;

    const fullName = [
      selectedUser.keycloak_user.firstName,
      selectedUser.keycloak_user.lastName
    ].filter(Boolean).join(' ') || selectedUser.keycloak_user.username;

    const mappingData: KeycloakUserMappingCreate = {
      keycloak_user_id: selectedUser.keycloak_user.id,
      keycloak_username: selectedUser.keycloak_user.username,
      keycloak_email: selectedUser.keycloak_user.email,
      keycloak_full_name: fullName,
      local_role: newMappingRole,
      is_enabled: true
    };

    setMessage(null);
    createMappingMutation.mutate(mappingData);
  };

  const handleUpdateMapping = () => {
    if (!selectedUser || !selectedUser.mapping) return;

    const updateData: KeycloakUserMappingUpdate = {
      local_role: newMappingRole
    };

    setMessage(null);
    updateMappingMutation.mutate({ 
      id: selectedUser.mapping.id, 
      data: updateData 
    });
  };

  const handleDeleteMapping = (mappingId: number) => {
    if (window.confirm('คุณต้องการลบการกำหนดสิทธิ์นี้หรือไม่?')) {
      setMessage(null);
      deleteMappingMutation.mutate(mappingId);
    }
  };

  const handleOpenAddDialog = (user: KeycloakUserWithMapping) => {
    setSelectedUser(user);
    setNewMappingRole('viewer');
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setSelectedUser(null);
  };

  const handleOpenEditDialog = (user: KeycloakUserWithMapping) => {
    setSelectedUser(user);
    setNewMappingRole(user.mapping?.local_role as any || 'viewer');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const getRoleChip = (role: string) => {
    const roleColors: Record<string, 'error' | 'warning' | 'info'> = {
      admin: 'error',
      editor: 'warning',
      viewer: 'info'
    };
    
    const roleLabels: Record<string, string> = {
      admin: 'Admin',
      editor: 'Editor',
      viewer: 'Viewer'
    };

    return (
      <Chip 
        label={roleLabels[role] || role} 
        color={roleColors[role] || 'default'} 
        size="small"
        icon={<SecurityIcon />}
      />
    );
  };

  const filteredUsers = usersData || [];
  const mappedCount = filteredUsers.filter(u => u.has_mapping).length;
  const unmappedCount = filteredUsers.length - mappedCount;

  // Show connection error
  if (isError) {
    const errorMessage = (error as any)?.response?.data?.detail || 'ไม่สามารถเชื่อมต่อ Keycloak ได้';
    const isConfigError = errorMessage.includes('not enabled') || errorMessage.includes('incomplete');
    
    return (
      <Box>
        <Alert severity={isConfigError ? 'warning' : 'error'} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {isConfigError ? 'ยังไม่ได้ตั้งค่า Keycloak SSO' : 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}
          </Typography>
          <Typography variant="body2">
            {errorMessage}
          </Typography>
          {isConfigError && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              กรุณาไปที่แท็บ "Keycloak Configuration" เพื่อตั้งค่าการเชื่อมต่อก่อน
            </Typography>
          )}
        </Alert>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          ลองอีกครั้ง
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={5}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>กำลังโหลดรายชื่อผู้ใช้จาก Keycloak...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Status Message */}
      <Collapse in={message !== null}>
        <Alert 
          severity={message?.type || 'info'}
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
        >
          {message?.text}
        </Alert>
      </Collapse>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>วิธีใช้งาน:</strong> เลือกผู้ใช้จาก Keycloak แล้วกำหนด Role ในระบบ 
          (Admin, Editor, หรือ Viewer) การกำหนดสิทธิ์แบบนี้จะมีความสำคัญสูงกว่าการแปลง role อัตโนมัติจาก Keycloak
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Typography variant="caption" color="text.secondary">
            ผู้ใช้ทั้งหมด
          </Typography>
          <Typography variant="h4" color="primary">
            {filteredUsers.length}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
          <Typography variant="caption" color="text.secondary">
            กำหนดสิทธิ์แล้ว
          </Typography>
          <Typography variant="h4" color="success.main">
            {mappedCount}
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <Typography variant="caption" color="text.secondary">
            ยังไม่ได้กำหนด
          </Typography>
          <Typography variant="h4" color="warning.main">
            {unmappedCount}
          </Typography>
        </Paper>
      </Stack>

      {/* Search and Actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="ค้นหาผู้ใช้..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          รีเฟรช
        </Button>
      </Stack>

      {/* Users Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ผู้ใช้</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell align="center">สถานะ</TableCell>
              <TableCell align="center">Role ในระบบ</TableCell>
              <TableCell align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    ไม่พบผู้ใช้ใน Keycloak หรือยังไม่ได้ตั้งค่าการเชื่อมต่อ
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const fullName = [
                  user.keycloak_user.firstName,
                  user.keycloak_user.lastName
                ].filter(Boolean).join(' ');

                return (
                  <TableRow key={user.keycloak_user.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {(fullName || user.keycloak_user.username).charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {fullName || user.keycloak_user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.keycloak_user.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {user.keycloak_user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {user.keycloak_user.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={user.keycloak_user.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        color={user.keycloak_user.enabled ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {user.has_mapping && user.mapping ? (
                        getRoleChip(user.mapping.local_role)
                      ) : (
                        <Chip 
                          label="ยังไม่กำหนด" 
                          size="small" 
                          variant="outlined"
                          color="warning"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {user.has_mapping && user.mapping ? (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="แก้ไขสิทธิ์">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบการกำหนดสิทธิ์">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMapping(user.mapping!.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Tooltip title="กำหนดสิทธิ์">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleOpenAddDialog(user)}
                            disabled={!user.keycloak_user.enabled}
                          >
                            กำหนดสิทธิ์
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Mapping Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon color="primary" />
            <Typography variant="h6">กำหนดสิทธิ์ผู้ใช้</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ข้อมูลผู้ใช้จาก Keycloak
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {[selectedUser.keycloak_user.firstName, selectedUser.keycloak_user.lastName]
                    .filter(Boolean).join(' ') || selectedUser.keycloak_user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Username: {selectedUser.keycloak_user.username}
                </Typography>
                {selectedUser.keycloak_user.email && (
                  <Typography variant="body2" color="text.secondary">
                    Email: {selectedUser.keycloak_user.email}
                  </Typography>
                )}
              </Paper>

              <FormControl fullWidth>
                <InputLabel>Role ในระบบ</InputLabel>
                <Select
                  value={newMappingRole}
                  onChange={(e) => setNewMappingRole(e.target.value as any)}
                  label="Role ในระบบ"
                >
                  <MenuItem value="viewer">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('viewer')}
                      <Typography variant="body2">- ดูข้อมูลได้อย่างเดียว</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="editor">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('editor')}
                      <Typography variant="body2">- ดูและแก้ไขข้อมูลได้</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('admin')}
                      <Typography variant="body2">- สิทธิ์เต็มในการจัดการทุกอย่าง</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} startIcon={<CloseIcon />}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleAddMapping}
            startIcon={createMappingMutation.isPending ? <CircularProgress size={20} /> : <CheckIcon />}
            disabled={createMappingMutation.isPending}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Mapping Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EditIcon color="primary" />
            <Typography variant="h6">แก้ไขสิทธิ์ผู้ใช้</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUser && (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ข้อมูลผู้ใช้
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedUser.mapping?.keycloak_full_name || selectedUser.keycloak_user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Username: {selectedUser.keycloak_user.username}
                </Typography>
              </Paper>

              <FormControl fullWidth>
                <InputLabel>Role ในระบบ</InputLabel>
                <Select
                  value={newMappingRole}
                  onChange={(e) => setNewMappingRole(e.target.value as any)}
                  label="Role ในระบบ"
                >
                  <MenuItem value="viewer">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('viewer')}
                      <Typography variant="body2">- ดูข้อมูลได้อย่างเดียว</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="editor">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('editor')}
                      <Typography variant="body2">- ดูและแก้ไขข้อมูลได้</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getRoleChip('admin')}
                      <Typography variant="body2">- สิทธิ์เต็มในการจัดการทุกอย่าง</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} startIcon={<CloseIcon />}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateMapping}
            startIcon={updateMappingMutation.isPending ? <CircularProgress size={20} /> : <CheckIcon />}
            disabled={updateMappingMutation.isPending}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KeycloakUserMappingPanel;
