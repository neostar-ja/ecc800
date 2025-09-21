import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  Logout
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, isAuthenticated } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const theme = useTheme();
  const navigate = useNavigate();
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
      <Box sx={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
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
        width: '800px', 
        height: '800px', 
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
        width: '700px', 
        height: '700px', 
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
          width: '90%',
          maxWidth: 1000,
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
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
          width: '30%',
          p: 4, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(123, 91, 164, 0.1) 0%, rgba(241, 116, 34, 0.1) 100%)' 
            : 'linear-gradient(135deg, rgba(123, 91, 164, 0.05) 0%, rgba(241, 116, 34, 0.05) 100%)',
          borderRight: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.05)' 
            : '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Zoom in timeout={500}>
            <Box sx={{ textAlign: 'center' }}>
              <Box 
                component="img" 
                src="/wuh_logo.png"
                alt="Walailak University Hospital Logo"
                sx={{ 
                  width: 140,
                  height: 140,
                  objectFit: 'contain',
                  mb: 3
                }}
              />
              <Typography variant="h5" sx={{ 
                fontWeight: 700,
                mb: 1,
                color: isDarkMode ? '#fff' : '#333',
              }}>
                ECC800 Monitor
              </Typography>
              <Typography variant="body2" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                mb: 2
              }}>
                ศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
              <Typography variant="caption" sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                display: 'block'
              }}>
                กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
              </Typography>
            </Box>
          </Zoom>
        </Box>

        {/* Form Section */}
        <Box sx={{ 
          width: '70%',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Fade in timeout={500}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  mb: 1,
                  background: 'linear-gradient(45deg, #7B5BA4, #F17422)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  เข้าสู่ระบบ
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
                }}>
                  กรุณาเข้าสู่ระบบเพื่อใช้งาน ECC800 Monitor
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
                  maxWidth: 450,
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
                      mb: 3,
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
                      mb: 3,
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
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Zoom in timeout={800}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Login />}
                        sx={{
                          py: 1.5,
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
                  <Grid item xs={12} sm={6}>
                    <Zoom in timeout={900}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          borderColor: '#F17422',
                          color: '#F17422',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: '#e05e00',
                            color: '#e05e00',
                            backgroundColor: 'rgba(241, 116, 34, 0.05)',
                            boxShadow: '0 6px 20px rgba(241, 116, 34, 0.2)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box 
                            component="img" 
                            src="https://www.keycloak.org/resources/images/keycloak_icon_512px.svg" 
                            alt="Keycloak" 
                            sx={{ width: 20, height: 20 }} 
                          />
                          Keycloak SSO
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
                <Divider sx={{ mt: 4, mb: 2 }} />
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  textAlign: 'center',
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
