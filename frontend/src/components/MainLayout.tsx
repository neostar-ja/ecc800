import React from 'react';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  alpha,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Memory,
  Analytics,
  Warning,
  Assessment,
  AdminPanelSettings,
  AccountCircle,
  Logout,
  MonitorHeart,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Dashboard, path: '/dashboard' },
  { id: 'sites', label: 'Sites', icon: Business, path: '/sites' },
  { id: 'equipment', label: 'Equipment', icon: Memory, path: '/equipment' },
  { id: 'metrics', label: 'Metrics', icon: Analytics, path: '/metrics' },
  { id: 'faults', label: 'Faults', icon: Warning, path: '/faults' },
  { id: 'reports', label: 'Reports', icon: Assessment, path: '/reports' },
  { id: 'admin', label: 'Admin', icon: AdminPanelSettings, path: '/admin' },
];

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ px: 0, justifyContent: 'space-between' }}>
            {/* Logo และ Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img 
                  src="/wuh_logo.png" 
                  alt="WUH Logo" 
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '6px'
                  }}
                />
                <Box>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      lineHeight: 1.2,
                      color: 'white'
                    }}
                  >
                    ECC800 Monitor
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.75rem',
                      fontWeight: 400
                    }}
                  >
                    Data Center Management System
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center', 
              gap: 1,
              flex: 1,
              justifyContent: 'center',
              mx: 4
            }}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      color: 'white',
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      backgroundColor: isActive(item.path) 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                    startIcon={<Icon sx={{ fontSize: '1.1rem' }} />}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={user?.role || 'User'}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  '& .MuiChip-label': {
                    textTransform: 'capitalize',
                  }
                }}
              />
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleUserMenuOpen}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }
                }}
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  elevation: 8,
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    minWidth: 200,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                <MenuItem onClick={handleUserMenuClose} sx={{ py: 1.5 }}>
                  <AccountCircle sx={{ mr: 2, opacity: 0.7 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {user?.username || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.role || 'Role'}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <Logout sx={{ mr: 2, opacity: 0.7 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          pt: 10, // เว้นที่สำหรับ AppBar
          pb: 8,  // เว้นที่สำหรับ Footer
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 3,
          px: 3,
          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: 2,
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                ECC800 Data Center Monitoring System
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ระบบติดตามและแสดงผลข้อมูลประสิทธิภาพของห้อง Data Center
              </Typography>
              <Typography variant="body2" color="text.secondary">
                โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                พัฒนาโดย
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                © 2025 Walailak University Medical Center
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;