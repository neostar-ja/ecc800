import React from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Memory,
  Analytics,
  Warning,
  Assessment,
  AdminPanelSettings,
  Logout,
  Close,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

const drawerWidth = 240;

const menuItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: Dashboard, path: '/dashboard' },
  { id: 'dashboard-modern', label: 'แดชบอร์ดสมัยใหม่', icon: Dashboard, path: '/dashboard-modern' },
  { id: 'dashboard-responsive', label: 'แดชบอร์ด Responsive', icon: Dashboard, path: '/dashboard-responsive' },
  { id: 'sites', label: 'ไซต์', icon: Business, path: '/sites' },
  { id: 'equipment', label: 'อุปกรณ์', icon: Memory, path: '/equipment' },
  { id: 'metrics', label: 'เมตริก', icon: Analytics, path: '/metrics' },
  { id: 'faults', label: 'ข้อผิดพลาด', icon: Warning, path: '/faults' },
  { id: 'reports', label: 'รายงาน', icon: Assessment, path: '/reports' },
  { id: 'admin', label: 'ผู้ดูแล', icon: AdminPanelSettings, path: '/admin' },
];

interface LayoutProps {
  darkMode?: boolean;
  toggleTheme?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ darkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notification, hideNotification } = useNotificationStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'primary.main',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ECC800 โรงพยาบาลวไลยอลงกรณ์ในพระบรมราชูปถัมภ์
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.full_name}
          </Typography>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            ออกจากระบบ
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img
              src="/wuh_logo.png"
              alt="WUH Logo"
              style={{ height: '40px', width: 'auto' }}
            />
            <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              ECC800
            </Typography>
          </Box>
        </Toolbar>
        
        <List>
          {menuItems
            .filter((item) => {
              // Hide admin menu for non-admin users
              if (item.id === 'admin' && user?.role !== 'admin') {
                return false;
              }
              return true;
            })
            .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 'bold',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'grey.50',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification?.type || 'info'}
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={hideNotification}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout;
