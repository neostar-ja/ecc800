import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Fade,
  FormControlLabel,
  Checkbox,
  Zoom,
  Paper,
  useTheme,
  Grid,
  Divider,
} from '@mui/material';
import {
  Login,
  Visibility,
  VisibilityOff,
  LockOutlined,
  DarkMode,
  LightMode,
  AccountCircle,
  Logout,
  Security
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import { keycloakApi, KeycloakPublicConfig } from '../services/authExtended';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keycloakLoading, setKeycloakLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [keycloakConfig, setKeycloakConfig] = useState<KeycloakPublicConfig | null>(null);
  
  const { login, isAuthenticated } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Fetch Keycloak config on mount
  useEffect(() => {
    const fetchKeycloakConfig = async () => {
      try {
        const config = await keycloakApi.getPublicConfig();
        setKeycloakConfig(config);
      } catch (error) {
        console.log('Keycloak config not available');
      }
    };
    fetchKeycloakConfig();
  }, []);

  // Handle Keycloak callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (code && state) {
      handleKeycloakCallback(code, state);
    }
  }, [location.search]);

  const handleKeycloakCallback = async (code: string, state: string) => {
    setKeycloakLoading(true);
    setError('');
    
    try {
      const response = await keycloakApi.handleCallback(code, state);
      const { access_token, user } = response;
      
      // Store token and user data (add is_active as it's required by User interface)
      localStorage.setItem('token', access_token);
      useAuthStore.setState({
        token: access_token,
        user: {
          ...user,
          is_active: true  // Keycloak users are active by default
        },
        isAuthenticated: true,
      });
      
      // Clear URL params and navigate
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Keycloak callback error:', error);
      setError(error.response?.data?.detail || 'Keycloak authentication failed');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setKeycloakLoading(false);
    }
  };

  const handleKeycloakLogin = async () => {
    setKeycloakLoading(true);
    setError('');
    
    try {
      const response = await keycloakApi.initiateLogin();
      // Redirect to Keycloak login page
      window.location.href = response.auth_url;
    } catch (error: any) {
      console.error('Keycloak login error:', error);
      setError(error.response?.data?.detail || 'ไม่สามารถเชื่อมต่อ Keycloak ได้');
      setKeycloakLoading(false);
    }
  };

    // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้');
      return;
    }
    if (!password.trim()) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.login({ username: username.trim(), password });
      const { access_token, user } = response.data || response;
      
      // Store token and user data directly
      localStorage.setItem('token', access_token);
      useAuthStore.setState({
        token: access_token,
        user: user,
        isAuthenticated: true,
      });
      
      // Invalidate permissions cache to force refetch with new token
      queryClient.invalidateQueries({ queryKey: ['currentUserPermissions'] });
      
      // Wait a bit for permissions to load before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      if (error.response?.status === 401) {
        errorMessage = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      } else if (error.response?.status === 422) {
        errorMessage = 'ข้อมูลที่กรอกไม่ถูกต้อง';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    navigate('/login');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDarkMode
        ? 'linear-gradient(to right, #0f1729 0%, #162032 100%)'
        : 'linear-gradient(to right, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Theme Toggle */}
      <Box sx={{ 
        position: 'absolute', 
        top: { xs: 16, sm: 24 }, 
        right: { xs: 16, sm: 24 }, 
        zIndex: 10 
      }}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              transform: 'scale(1.05)'
            }
          }}
        >
          {isDarkMode ? 
            <LightMode sx={{ color: 'white' }} /> : 
            <DarkMode sx={{ color: '#333' }} />
          }
        </IconButton>
      </Box>

      {/* Decorative Circles */}
      <Box sx={{ 
        position: 'absolute', 
        top: '-50%', 
        left: '-10%', 
        width: { xs: '400px', sm: '600px', md: '800px' }, 
        height: { xs: '400px', sm: '600px', md: '800px' }, 
        borderRadius: '50%',
        background: isDarkMode 
          ? 'radial-gradient(circle, rgba(123, 91, 164, 0.1) 0%, rgba(123, 91, 164, 0) 70%)' 
          : 'radial-gradient(circle, rgba(123, 91, 164, 0.08) 0%, rgba(123, 91, 164, 0) 70%)',
        zIndex: 1
      }} />
      
      <Box sx={{ 
        position: 'absolute', 
        bottom: '-30%', 
        right: '-5%', 
        width: { xs: '350px', sm: '500px', md: '700px' }, 
        height: { xs: '350px', sm: '500px', md: '700px' }, 
        borderRadius: '50%',
        background: isDarkMode 
          ? 'radial-gradient(circle, rgba(241, 116, 34, 0.1) 0%, rgba(241, 116, 34, 0) 70%)' 
          : 'radial-gradient(circle, rgba(241, 116, 34, 0.08) 0%, rgba(241, 116, 34, 0) 70%)',
        zIndex: 1
      }} />

      {/* Main Login Container */}
      <Paper
        elevation={isDarkMode ? 4 : 2}
        sx={{
          width: { xs: '95%', sm: '90%', md: '90%' },
          maxWidth: { xs: '100%', sm: 800, md: 1000 },
          minHeight: { xs: 'auto', sm: 'auto' },
          borderRadius: { xs: 2, sm: 4 },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          background: isDarkMode ? 'rgba(22, 28, 41, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: isDarkMode 
            ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
            : '0 20px 40px rgba(0, 0, 0, 0.1)',
          zIndex: 2
        }}
      >
        {/* Logo Section */}
        <Box sx={{ 
          width: { xs: '100%', md: '30%' },
          p: { xs: 3, sm: 4 }, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(123, 91, 164, 0.1) 0%, rgba(241, 116, 34, 0.1) 100%)' 
            : 'linear-gradient(135deg, rgba(123, 91, 164, 0.05) 0%, rgba(241, 116, 34, 0.05) 100%)',
          borderRight: { xs: 'none', md: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.05)' 
            : '1px solid rgba(0, 0, 0, 0.05)' },
          borderBottom: { xs: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.05)' 
            : '1px solid rgba(0, 0, 0, 0.05)', md: 'none' }
        }}>
          <Zoom in timeout={500}>
            <Box sx={{ textAlign: 'center' }}>
              <Box 
                component="img" 
                src="/wuh_logo.png"
                alt="Walailak University Hospital Logo"
                sx={{ 
                  width: { xs: 100, sm: 120, md: 140 },
                  height: { xs: 100, sm: 120, md: 140 },
                  objectFit: 'contain',
                  mb: { xs: 2, sm: 3 }
                }}
              />
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' },
                color: isDarkMode ? '#fff' : '#333',
              }}>
                WUH Data Center Monitor
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                ศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
              <Typography variant="caption" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                display: 'block',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
              </Typography>
            </Box>
          </Zoom>
        </Box>

        {/* Form Section */}
        <Box sx={{ 
          width: { xs: '100%', md: '70%' },
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Fade in timeout={500}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                  background: 'linear-gradient(45deg, #7B5BA4, #F17422)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  เข้าสู่ระบบ
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' }
                }}>
                  กรุณาเข้าสู่ระบบเพื่อใช้งาน WUH Data Center Monitor
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Fade in>
                  <Alert 
                    severity="error" 
                    variant="filled"
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                    }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Login Form */}
              <Box 
                component="form" 
                onSubmit={handleLogin}
                sx={{ 
                  maxWidth: { xs: '100%', sm: 450 },
                  mx: 'auto'
                }}
              >
                <Zoom in timeout={600}>
                  <TextField
                    fullWidth
                    label="ชื่อผู้ใช้"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ 
                      mb: { xs: 2, sm: 3 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7B5BA4'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7B5BA4'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle 
                            sx={{ 
                              color: '#7B5BA4',
                              fontSize: 20
                            }} 
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Zoom>

                <Zoom in timeout={700}>
                  <TextField
                    fullWidth
                    label="รหัสผ่าน"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ 
                      mb: { xs: 2, sm: 3 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7B5BA4'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#7B5BA4'
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined 
                            sx={{ 
                              color: '#7B5BA4',
                              fontSize: 20
                            }} 
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Zoom>

                {/* Remember Me */}
                <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{
                          color: '#7B5BA4',
                          '&.Mui-checked': {
                            color: '#7B5BA4'
                          }
                        }}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">จำการเข้าสู่ระบบ</Typography>}
                  />
                </Box>

                {/* Login Buttons */}
                <Grid container spacing={{ xs: 2, sm: 2 }}>
                  <Grid item xs={12}>
                    <Zoom in timeout={800}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Login />}
                        sx={{
                          py: { xs: 1.25, sm: 1.5 },
                          borderRadius: 2,
                          fontWeight: 600,
                          backgroundColor: '#7B5BA4',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: '#6a4c93',
                            boxShadow: '0 6px 20px rgba(123, 91, 164, 0.4)'
                          }
                        }}
                      >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                      </Button>
                    </Zoom>
                  </Grid>
                  <Grid item xs={12}>
                    <Zoom in timeout={900}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={handleKeycloakLogin}
                        disabled={keycloakLoading || !keycloakConfig?.is_enabled}
                        sx={{
                          py: { xs: 1.25, sm: 1.5 },
                          borderRadius: 2,
                          fontWeight: 600,
                          borderColor: keycloakConfig?.is_enabled ? '#F17422' : 'grey.400',
                          color: keycloakConfig?.is_enabled ? '#F17422' : 'grey.500',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: '#e05e00',
                            color: '#e05e00',
                            backgroundColor: 'rgba(241, 116, 34, 0.05)',
                            boxShadow: '0 6px 20px rgba(241, 116, 34, 0.2)'
                          },
                          '&.Mui-disabled': {
                            borderColor: 'grey.400',
                            color: 'grey.500'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {keycloakLoading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Security 
                              sx={{ 
                                fontSize: 20,
                                color: keycloakConfig?.is_enabled ? '#F17422' : 'grey.500'
                              }} 
                            />
                          )}
                          {keycloakLoading ? 'กำลังเชื่อมต่อ...' : keycloakConfig?.is_enabled ? 'Keycloak SSO' : 'Keycloak SSO (ปิดใช้งาน)'}
                        </Box>
                      </Button>
                    </Zoom>
                  </Grid>
                </Grid>

                {/* Logout Button (for testing) */}
                {isAuthenticated && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="text"
                      color="error"
                      onClick={handleLogout}
                      startIcon={<Logout />}
                      size="small"
                    >
                      ออกจากระบบ
                    </Button>
                  </Box>
                )}

                {/* Footer */}
                <Divider sx={{ mt: { xs: 3, sm: 4 }, mb: 2 }} />
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  textAlign: 'center',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                }}>
                  © 2025 กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
                </Typography>
              </Box>
            </Box>
          </Fade>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
