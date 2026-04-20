/**
 * Keycloak Settings Component
 * ตั้งค่า Keycloak SSO สำหรับการ login
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Typography,
  Divider,
  Chip,
  Paper,
  InputAdornment,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  Key as KeyIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  VpnKey as SSOIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  SupervisorAccount as RoleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keycloakApi, KeycloakConfig, KeycloakConfigCreate } from '../services/authExtended';

const KeycloakSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState<KeycloakConfigCreate>({
    is_enabled: false,
    server_url: '',
    realm: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    scope: 'openid profile email',
    admin_role: 'admin',
    editor_role: 'editor',
    viewer_role: 'viewer',
    default_role: 'viewer',
    auto_create_user: true,
    sync_user_info: true
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch current config
  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ['keycloakConfig'],
    queryFn: () => keycloakApi.getConfig(),
    retry: false
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        is_enabled: config.is_enabled,
        server_url: config.server_url || '',
        realm: config.realm || '',
        client_id: config.client_id || '',
        client_secret: '', // Don't show existing secret
        redirect_uri: config.redirect_uri || '',
        scope: config.scope || 'openid profile email',
        admin_role: config.admin_role || 'admin',
        editor_role: config.editor_role || 'editor',
        viewer_role: config.viewer_role || 'viewer',
        default_role: config.default_role || 'viewer',
        auto_create_user: config.auto_create_user ?? true,
        sync_user_info: config.sync_user_info ?? true
      });
    }
  }, [config]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: KeycloakConfigCreate) => keycloakApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keycloakConfig'] });
      setSnackbar({ open: true, message: 'บันทึกการตั้งค่าสำเร็จ', severity: 'success' });
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: `บันทึกล้มเหลว: ${error.message}`, severity: 'error' });
    }
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () => keycloakApi.testConnection(),
    onSuccess: (data) => {
      setTestResult({
        success: data.success,
        message: data.message,
        details: data.realm_info
      });
    },
    onError: (error: Error) => {
      setTestResult({
        success: false,
        message: error.message
      });
    }
  });

  const handleSave = () => {
    // Only include client_secret if it's been changed
    const dataToSave = { ...formData };
    if (!dataToSave.client_secret) {
      delete dataToSave.client_secret;
    }
    saveMutation.mutate(dataToSave);
  };

  const handleFieldChange = (field: keyof KeycloakConfigCreate) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateRedirectUri = () => {
    const baseUrl = window.location.origin;
    setFormData((prev) => ({
      ...prev,
      redirect_uri: `${baseUrl}/ecc800/auth/keycloak/callback`
    }));
  };

  return (
    <Card>
      <CardHeader
        avatar={<SSOIcon color="primary" />}
        title="การตั้งค่า Keycloak SSO"
        subheader="กำหนดค่าการเชื่อมต่อ Keycloak สำหรับ Single Sign-On"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="รีเฟรช">
              <IconButton onClick={() => refetch()} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Enable/Disable Switch */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_enabled}
                    onChange={handleFieldChange('is_enabled')}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>เปิดใช้งาน Keycloak SSO</Typography>
                    <Chip
                      label={formData.is_enabled ? 'เปิด' : 'ปิด'}
                      color={formData.is_enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                }
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                เมื่อเปิดใช้งาน ปุ่ม "Login with Keycloak" จะแสดงบนหน้า Login
              </Typography>
            </Paper>

            {/* Connection Settings */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon />
                  <Typography fontWeight="medium">การเชื่อมต่อ Keycloak Server</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Server URL"
                      value={formData.server_url}
                      onChange={handleFieldChange('server_url')}
                      fullWidth
                      placeholder="https://keycloak.example.com"
                      helperText="URL ของ Keycloak server (ไม่รวม /auth)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Realm"
                      value={formData.realm}
                      onChange={handleFieldChange('realm')}
                      fullWidth
                      placeholder="my-realm"
                      helperText="ชื่อ Realm ใน Keycloak"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Client ID"
                      value={formData.client_id}
                      onChange={handleFieldChange('client_id')}
                      fullWidth
                      placeholder="ecc800-client"
                      helperText="Client ID ที่สร้างใน Keycloak"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Client Secret"
                      value={formData.client_secret}
                      onChange={handleFieldChange('client_secret')}
                      fullWidth
                      type={showSecret ? 'text' : 'password'}
                      placeholder={config ? '(ไม่เปลี่ยนแปลง)' : 'Enter client secret'}
                      helperText="Client Secret (เว้นว่างเพื่อไม่เปลี่ยนค่าเดิม)"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowSecret(!showSecret)} edge="end">
                              {showSecret ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Redirect URI"
                      value={formData.redirect_uri}
                      onChange={handleFieldChange('redirect_uri')}
                      fullWidth
                      placeholder="https://your-app.com/auth/keycloak/callback"
                      helperText="URL ที่ Keycloak จะ redirect กลับมาหลัง login"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="สร้าง URL อัตโนมัติ">
                              <IconButton onClick={generateRedirectUri} edge="end">
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="OAuth Scopes"
                      value={formData.scope}
                      onChange={handleFieldChange('scope')}
                      fullWidth
                      placeholder="openid profile email"
                      helperText="OAuth scopes ที่ต้องการ (คั่นด้วยช่องว่าง)"
                    />
                  </Grid>
                </Grid>

                {/* Test Connection */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={testMutation.isPending ? <CircularProgress size={16} /> : <TestIcon />}
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending || !formData.server_url || !formData.realm}
                  >
                    ทดสอบการเชื่อมต่อ
                  </Button>
                  
                  {testResult && (
                    <Alert
                      severity={testResult.success ? 'success' : 'error'}
                      sx={{ mt: 2 }}
                      icon={testResult.success ? <SuccessIcon /> : <ErrorIcon />}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {testResult.message}
                      </Typography>
                      {testResult.details && (
                        <Typography variant="caption" component="pre" sx={{ mt: 1 }}>
                          {JSON.stringify(testResult.details, null, 2)}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Role Mapping */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RoleIcon />
                  <Typography fontWeight="medium">การ Map บทบาท</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  กำหนดว่า role ใน Keycloak จะถูก map กับ role ในระบบนี้อย่างไร
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Admin Role (Keycloak)"
                      value={formData.admin_role}
                      onChange={handleFieldChange('admin_role')}
                      fullWidth
                      placeholder="admin"
                      helperText="ชื่อ role ใน Keycloak → Admin"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Editor Role (Keycloak)"
                      value={formData.editor_role}
                      onChange={handleFieldChange('editor_role')}
                      fullWidth
                      placeholder="editor"
                      helperText="ชื่อ role ใน Keycloak → Editor"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Viewer Role (Keycloak)"
                      value={formData.viewer_role}
                      onChange={handleFieldChange('viewer_role')}
                      fullWidth
                      placeholder="viewer"
                      helperText="ชื่อ role ใน Keycloak → Viewer"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Default Role"
                      value={formData.default_role}
                      onChange={handleFieldChange('default_role')}
                      fullWidth
                      placeholder="viewer"
                      helperText="Role ที่ใช้เมื่อไม่พบ role ที่ตรงกับ mapping ด้านบน"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* User Options */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon />
                  <Typography fontWeight="medium">ตัวเลือกผู้ใช้</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.auto_create_user}
                        onChange={handleFieldChange('auto_create_user')}
                      />
                    }
                    label={
                      <Box>
                        <Typography>สร้างผู้ใช้อัตโนมัติ</Typography>
                        <Typography variant="caption" color="text.secondary">
                          สร้างผู้ใช้ใหม่ในระบบโดยอัตโนมัติเมื่อ login ด้วย Keycloak ครั้งแรก
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sync_user_info}
                        onChange={handleFieldChange('sync_user_info')}
                      />
                    }
                    label={
                      <Box>
                        <Typography>Sync ข้อมูลผู้ใช้</Typography>
                        <Typography variant="caption" color="text.secondary">
                          อัพเดทข้อมูลผู้ใช้ (ชื่อ, อีเมล, role) จาก Keycloak ทุกครั้งที่ login
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Save Button */}
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => refetch()}>
                ยกเลิก
              </Button>
              <Button
                variant="contained"
                startIcon={saveMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                บันทึกการตั้งค่า
              </Button>
            </Box>
          </Box>
        )}

        {/* Snackbar */}
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

export default KeycloakSettings;
