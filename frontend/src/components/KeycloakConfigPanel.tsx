/**
 * Keycloak Configuration Panel
 * ตั้งค่าการเชื่อมต่อ Keycloak SSO และผู้ใช้ที่อนุญาต
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  Stack,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  PlayArrow as TestIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keycloakApi, KeycloakConfig, KeycloakConfigCreate, AllowedUser } from '../services/authExtended';

const KeycloakConfigPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [secretChanged, setSecretChanged] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testUsername, setTestUsername] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; user?: any } | null>(null);
  
  // Allowed Users state
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // Form state
  const [formData, setFormData] = useState<KeycloakConfigCreate>({
    is_enabled: false,
    server_url: '',
    realm: '',
    client_id: '',
    client_secret: '',
    redirect_uri: `${window.location.origin}/ecc800/login`,
    scope: 'openid profile email',
    admin_role: 'admin',
    editor_role: 'editor',
    viewer_role: 'viewer',
    default_role: 'viewer',
    auto_create_user: true,
    sync_user_info: true,
    allowed_users: []
  });

  // Fetch existing config
  const { data: config, isLoading } = useQuery({
    queryKey: ['keycloakConfig'],
    queryFn: () => keycloakApi.getConfig(),
    retry: false
  });

  // Initialize form with existing config
  useEffect(() => {
    if (config) {
      const isMasked = config.client_secret && /^[•]+$/.test(config.client_secret);
      
      setFormData({
        is_enabled: config.is_enabled,
        server_url: config.server_url || '',
        realm: config.realm || '',
        client_id: config.client_id || '',
        client_secret: isMasked ? '' : (config.client_secret || ''),
        redirect_uri: config.redirect_uri || `${window.location.origin}/ecc800/login`,
        scope: config.scope || 'openid profile email',
        admin_role: config.admin_role || 'admin',
        editor_role: config.editor_role || 'editor',
        viewer_role: config.viewer_role || 'viewer',
        default_role: config.default_role || 'viewer',
        auto_create_user: config.auto_create_user ?? true,
        sync_user_info: config.sync_user_info ?? true,
        allowed_users: config.allowed_users || []
      });
      setAllowedUsers(config.allowed_users || []);
      setSecretChanged(false);
    }
  }, [config]);

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: (data: KeycloakConfigCreate) => {
      if (config?.id) {
        return keycloakApi.updateConfig(data);
      } else {
        return keycloakApi.createConfig(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keycloakConfig'] });
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' });
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'เกิดข้อผิดพลาดในการบันทึก' 
      });
    }
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () => keycloakApi.testConnection(),
    onSuccess: (data) => {
      if (data.success) {
        setMessage({ type: 'success', text: 'เชื่อมต่อ Keycloak สำเร็จ' });
      } else {
        setMessage({ type: 'error', text: `เชื่อมต่อล้มเหลว: ${data.message}` });
      }
    },
    onError: (error: any) => {
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'ไม่สามารถเชื่อมต่อ Keycloak' 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    const dataToSave = { ...formData, allowed_users: allowedUsers };
    if (!secretChanged && config?.id) {
      delete (dataToSave as any).client_secret;
    }
    
    saveMutation.mutate(dataToSave);
  };

  const handleTestConnection = () => {
    setMessage(null);
    testMutation.mutate();
  };

  const handleChange = (field: keyof KeycloakConfigCreate) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'client_secret') {
      setSecretChanged(true);
    }
  };

  // Allowed Users handlers
  const handleAddUser = () => {
    if (!newUsername.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอก Username' });
      return;
    }
    
    if (allowedUsers.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Username นี้มีอยู่แล้ว' });
      return;
    }
    
    setAllowedUsers(prev => [...prev, { username: newUsername.trim(), role: newRole }]);
    setNewUsername('');
    setNewRole('viewer');
    setMessage(null);
  };

  const handleRemoveUser = (username: string) => {
    setAllowedUsers(prev => prev.filter(u => u.username !== username));
  };

  const handleChangeUserRole = (username: string, role: string) => {
    setAllowedUsers(prev => 
      prev.map(u => u.username === username ? { ...u, role } : u)
    );
  };

  const handleOpenTestDialog = () => {
    setTestDialogOpen(true);
    setTestUsername('');
    setTestPassword('');
    setTestResult(null);
  };

  const handleCloseTestDialog = () => {
    setTestDialogOpen(false);
    setTestUsername('');
    setTestPassword('');
    setTestResult(null);
  };

  const handleTestUser = async () => {
    if (!testUsername || !testPassword) {
      setTestResult({ success: false, message: 'กรุณากรอก Username และ Password' });
      return;
    }

    setTestResult(null);
    try {
      const response = await fetch('/ecc800/api/keycloak/test-user-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });

      const data = await response.json();
      
      if (response.ok) {
        const isAllowed = allowedUsers.some(
          u => u.username.toLowerCase() === data.username.toLowerCase()
        );
        
        if (isAllowed) {
          const userRole = allowedUsers.find(
            u => u.username.toLowerCase() === data.username.toLowerCase()
          )?.role;
          setTestResult({ 
            success: true, 
            message: `✅ ทดสอบ Login สำเร็จ! ผู้ใช้: ${data.username} (สิทธิ์: ${userRole})`,
            user: data 
          });
        } else {
          setTestResult({ 
            success: false, 
            message: `⚠️ Login ถูกต้อง แต่ "${data.username}" ไม่อยู่ในรายชื่อที่อนุญาต (จะไม่สามารถเข้าระบบได้)` 
          });
        }
      } else {
        setTestResult({ 
          success: false, 
          message: `❌ Login ล้มเหลว: ${data.detail || 'ไม่สามารถเข้าสู่ระบบได้'}` 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: `❌ เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถทดสอบได้'}` 
      });
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Status Messages */}
      <Collapse in={message !== null}>
        <Alert 
          severity={message?.type || 'info'}
          onClose={() => setMessage(null)}
          sx={{ mb: 2 }}
          icon={message?.type === 'success' ? <CheckIcon /> : <ErrorIcon />}
        >
          {message?.text}
        </Alert>
      </Collapse>

      {/* Enable/Disable Switch */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_enabled}
              onChange={handleChange('is_enabled')}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1" fontWeight="bold">
                เปิดใช้งาน Keycloak SSO
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ผู้ใช้สามารถ login ผ่าน Keycloak Single Sign-On
              </Typography>
            </Box>
          }
        />
      </Paper>

      {/* Configuration Fields */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" color="primary" />
            ข้อมูลการเชื่อมต่อ Keycloak
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Server URL"
            fullWidth
            required
            value={formData.server_url}
            onChange={handleChange('server_url')}
            placeholder="https://keycloak.example.com"
            helperText="URL ของ Keycloak server"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Realm"
            fullWidth
            required
            value={formData.realm}
            onChange={handleChange('realm')}
            placeholder="master"
            helperText="ชื่อ realm ใน Keycloak"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Client ID"
            fullWidth
            required
            value={formData.client_id}
            onChange={handleChange('client_id')}
            placeholder="ecc800_client"
            helperText="Client ID ที่สร้างใน Keycloak"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Client Secret"
            fullWidth
            required={!config?.id || secretChanged}
            type={showSecret ? 'text' : 'password'}
            value={formData.client_secret}
            onChange={handleChange('client_secret')}
            placeholder={config?.id && !secretChanged ? "••••••••••••" : "กรอก Client Secret"}
            helperText={
              config?.id && !secretChanged 
                ? "มีค่าเดิมอยู่แล้ว - กรอกใหม่หากต้องการเปลี่ยน" 
                : "Client Secret จาก Keycloak"
            }
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowSecret(!showSecret)} edge="end">
                  {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Redirect URI"
            fullWidth
            required
            value={formData.redirect_uri}
            onChange={handleChange('redirect_uri')}
            helperText="URL ที่ Keycloak จะส่งกลับหลัง login"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            label="Scope"
            fullWidth
            value={formData.scope}
            onChange={handleChange('scope')}
            placeholder="openid profile email"
            helperText="OAuth2 scopes ที่ต้องการ"
          />
        </Grid>
      </Grid>

      {/* Divider */}
      <Divider sx={{ my: 4 }} />

      {/* Allowed Users Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="primary" />
          ผู้ใช้ที่อนุญาตให้เข้าสู่ระบบ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          กำหนด Username จาก Keycloak ที่อนุญาตให้เข้าสู่ระบบนี้ได้ หาก User ไม่อยู่ในรายชื่อจะไม่สามารถ Login ได้
        </Typography>

        {/* Add User Form */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
            <TextField
              label="Username"
              size="small"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="ชื่อผู้ใช้ใน Keycloak"
              sx={{ minWidth: 200 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUser();
                }
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>สิทธิ์</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="สิทธิ์"
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
              size="medium"
            >
              เพิ่มผู้ใช้
            </Button>
          </Stack>
        </Paper>

        {/* Users Table */}
        {allowedUsers.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Username</TableCell>
                  <TableCell>สิทธิ์</TableCell>
                  <TableCell align="center" width={80}>ลบ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allowedUsers.map((user) => (
                  <TableRow key={user.username} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">{user.username}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onChange={(e) => handleChangeUserRole(user.username, e.target.value)}
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value="viewer">
                          <Chip size="small" label="Viewer" color="default" />
                        </MenuItem>
                        <MenuItem value="editor">
                          <Chip size="small" label="Editor" color="primary" />
                        </MenuItem>
                        <MenuItem value="admin">
                          <Chip size="small" label="Admin" color="error" />
                        </MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRemoveUser(user.username)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              ยังไม่มีผู้ใช้ในรายชื่อที่อนุญาต - ทุกคนจะไม่สามารถ login ผ่าน Keycloak ได้
            </Typography>
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          จำนวนผู้ใช้ที่อนุญาต: {allowedUsers.length} คน
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={saveMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={saveMutation.isPending}
        >
          บันทึกการตั้งค่า
        </Button>

        <Button
          variant="outlined"
          startIcon={testMutation.isPending ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleTestConnection}
          disabled={testMutation.isPending || !formData.server_url || !formData.realm}
        >
          ทดสอบการเชื่อมต่อ
        </Button>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<TestIcon />}
          onClick={handleOpenTestDialog}
          disabled={!config?.id}
        >
          ทดสอบ User Login
        </Button>
      </Stack>

      {/* Config Status */}
      {config && (
        <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            อัพเดทล่าสุด: {config.updated_at ? new Date(config.updated_at).toLocaleString('th-TH') : '-'} 
            {config.updated_by && ` โดย ${config.updated_by}`}
          </Typography>
        </Paper>
      )}

      {/* Test User Login Dialog */}
      <Dialog open={testDialogOpen} onClose={handleCloseTestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TestIcon color="secondary" />
            <Typography variant="h6">ทดสอบ Login ด้วย Keycloak User</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ใช้ username และ password ของผู้ใช้ใน Keycloak เพื่อทดสอบว่าสามารถ login และอยู่ในรายชื่อที่อนุญาตหรือไม่
            </Typography>
          </Alert>

          <Stack spacing={2}>
            <TextField
              label="Username"
              value={testUsername}
              onChange={(e) => setTestUsername(e.target.value)}
              fullWidth
              autoComplete="off"
              placeholder="ชื่อผู้ใช้ใน Keycloak"
            />
            <TextField
              label="Password"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              fullWidth
              autoComplete="off"
              placeholder="รหัสผ่าน"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTestUser();
                }
              }}
            />
          </Stack>

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {testResult.message}
              </Typography>
              {testResult.success && testResult.user && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    Email: {testResult.user.email || '-'}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Full Name: {testResult.user.full_name || '-'}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog} startIcon={<CloseIcon />}>
            ปิด
          </Button>
          <Button
            variant="contained"
            onClick={handleTestUser}
            startIcon={<TestIcon />}
            color="secondary"
            disabled={!testUsername || !testPassword}
          >
            ทดสอบ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KeycloakConfigPanel;
