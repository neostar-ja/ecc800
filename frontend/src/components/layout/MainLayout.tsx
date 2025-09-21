import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Badge,
  Tooltip,
  Container,
  useMediaQuery,
  useTheme,
  Chip,
  Slide,
  Fade
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
  MonitorHeart,
  Menu as MenuIcon,
  Close,
  DarkMode,
  LightMode,
  NotificationsActive,
  Settings,
  AccountCircle,
  BubbleChart,
  Timeline,
  Speed,
  BarChart,
  Shield,
  SupportAgent,
  Engineering,
  LocalHospital
} from '@mui/icons-material';

import { useAuthStore } from '../../stores/authStore';
import { useTheme as useCustomTheme } from '../../contexts/ThemeProvider';

// Navigation items for the sidebar and top menu
const navigationItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: Dashboard, path: '/dashboard', description: 'ภาพรวมและการตรวจสอบ' },
  { id: 'sites', label: 'ไซต์', icon: Business, path: '/sites', description: 'การจัดการไซต์' },
  { id: 'equipment', label: 'อุปกรณ์', icon: Memory, path: '/equipment', description: 'สถานะฮาร์ดแวร์' },
  { id: 'metrics', label: 'เมตริกซ์', icon: Analytics, path: '/metrics', description: 'ข้อมูลประสิทธิภาพ' },
  { id: 'faults', label: 'ข้อผิดพลาด', icon: Warning, path: '/faults', description: 'การจัดการแจ้งเตือน' },
  { id: 'reports', label: 'รายงาน', icon: Assessment, path: '/reports', description: 'การวิเคราะห์และรายงาน' },
  { id: 'admin', label: 'ผู้ดูแล', icon: AdminPanelSettings, path: '/admin', description: 'การจัดการระบบ', adminOnly: true },
];

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State for menus and drawers
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  // Check if a route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  // Handle notifications
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: 'อุปกรณ์ออฟไลน์: Server 05', severity: 'error', time: '5 นาทีที่แล้ว' },
    { id: 2, message: 'CPU การใช้งานสูง: DB Cluster', severity: 'warning', time: '20 นาทีที่แล้ว' },
    { id: 3, message: 'การอัพเดตระบบใหม่พร้อมใช้งาน', severity: 'info', time: '1 ชั่วโมงที่แล้ว' },
  ];

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  // Mobile drawer content
  const mobileDrawerContent = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box 
        className="flex items-center justify-between px-4 py-3"
        sx={{
          backgroundImage: 'linear-gradient(135deg, #7B5BA4 0%, #F17422 100%)',
          color: 'white'
        }}
      >
        <Box className="flex items-center gap-2">
          <MonitorHeart fontSize="large" />
          <Typography variant="h6" className="font-bold">
            ECC800 Monitor
          </Typography>
        </Box>
        <IconButton 
          color="inherit" 
          onClick={() => setMobileDrawerOpen(false)}
          className="hover:rotate-90 transition-transform duration-300"
        >
          <Close />
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box className="p-3">
        <Box className="flex items-center space-x-3 mb-2">
          <Avatar 
            className="border-2 border-primary-500"
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.username}`}
          />
          <Box>
            <Typography variant="body1" className="font-medium">
              {user?.full_name || user?.username}
            </Typography>
            <Chip 
              label={user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'analyst' ? 'นักวิเคราะห์' : 'ผู้ชม'} 
              size="small"
              color={user?.role === 'admin' ? 'error' : user?.role === 'analyst' ? 'primary' : 'default'}
              className="text-xs"
            />
          </Box>
        </Box>
      </Box>
      
      <Divider />
      
      <List className="pt-0">
        {filteredNavItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActiveRoute(item.path)}
              className={`
                transition-all duration-300
                ${isActiveRoute(item.path) 
                  ? 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900 dark:to-gray-800 border-r-4 border-primary-500' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
            >
              <ListItemIcon>
                <item.icon 
                  className={isActiveRoute(item.path) ? 'text-primary-500' : ''} 
                />
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                secondary={item.description}
                primaryTypographyProps={{
                  className: isActiveRoute(item.path) ? 'font-medium' : ''
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box className="p-4">
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<Logout />}
          onClick={handleLogout}
          className="mt-2"
        >
          ออกจากระบบ
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="flex flex-col min-h-screen">
      {/* Main AppBar with gradient */}
      <AppBar 
        position="sticky"
        elevation={0}
        className="backdrop-blur-md border-b"
        sx={{
          background: isDarkMode 
            ? 'rgba(15, 23, 42, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
          borderBottom: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(226, 232, 240, 0.8)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: isDarkMode 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar className="px-2 md:px-6">
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileDrawerOpen(true)}
              className="mr-2"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo and brand */}
          <Box className="flex items-center space-x-2">
            <Box className="relative">
              <LocalHospital 
                className="text-primary-500 dark:text-primary-400 text-3xl"
              />
              <Box 
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"
              />
            </Box>
            
            <Box>
              <Typography
                variant="h6"
                component="div"
                className="font-medium text-gray-800 dark:text-white"
              >
                ศูนย์การแพทย์ ม.วลัยลักษณ์
              </Typography>
              <Typography
                variant="caption"
                component="div"
                className="text-gray-500 dark:text-gray-400"
              >
                ระบบติดตาม ECC800
              </Typography>
            </Box>
          </Box>
          
          {/* Desktop navigation */}
          {!isMobile && (
            <Box className="flex items-center ml-8 space-x-1">
              {filteredNavItems.map((item) => (
                <Tooltip 
                  key={item.id} 
                  title={item.description}
                  arrow
                >
                  <Button
                    onClick={() => handleNavigation(item.path)}
                    color="inherit"
                    startIcon={<item.icon />}
                    className={`
                      px-3 py-1.5 rounded-lg transition-all duration-300
                      ${isActiveRoute(item.path) 
                        ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 dark:bg-primary-900/20 font-medium' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                  >
                    {isTablet ? null : item.label}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          )}
          
          <Box className="flex-1" />
          
          {/* Theme toggle */}
          <Tooltip title={`${isDarkMode ? 'โหมดสว่าง' : 'โหมดมืด'}`}>
            <IconButton 
              onClick={toggleTheme} 
              color="inherit"
              className="ml-2"
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="การแจ้งเตือน">
            <IconButton 
              color="inherit"
              className="ml-2"
              onClick={handleNotificationOpen}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsActive />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Tooltip title="บัญชีผู้ใช้">
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
              className="ml-2"
            >
              <Avatar 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || user?.username}`}
                className="w-8 h-8 border-2 border-white dark:border-gray-800"
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          </Tooltip>
          
          {/* User menu dropdown */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              className: 'mt-1 border dark:border-gray-700',
              sx: {
                minWidth: 200,
                backdropFilter: 'blur(10px)',
                background: isDarkMode 
                  ? 'rgba(30, 41, 59, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                overflow: 'visible',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(226, 232, 240, 0.8)',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: -6,
                  right: 14,
                  width: 12,
                  height: 12,
                  backgroundColor: isDarkMode 
                    ? 'rgba(30, 41, 59, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  transform: 'rotate(45deg)',
                  borderTop: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  borderLeft: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  zIndex: 0,
                }
              }
            }}
          >
            <Box className="px-4 py-3">
              <Typography variant="subtitle1" className="font-medium">
                {user?.full_name || user?.username}
              </Typography>
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : user?.role === 'analyst' ? 'นักวิเคราะห์' : 'ผู้ชม'}
              </Typography>
            </Box>
            
            <Divider />
            
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              โปรไฟล์
            </MenuItem>
            
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              ตั้งค่า
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout} className="text-error-600 dark:text-error-400">
              <ListItemIcon>
                <Logout fontSize="small" className="text-error-600 dark:text-error-400" />
              </ListItemIcon>
              ออกจากระบบ
            </MenuItem>
          </Menu>
          
          {/* Notifications menu */}
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              className: 'mt-1 border dark:border-gray-700',
              sx: {
                width: 320,
                maxHeight: 400,
                backdropFilter: 'blur(10px)',
                background: isDarkMode 
                  ? 'rgba(30, 41, 59, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                overflow: 'auto',
                border: isDarkMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(226, 232, 240, 0.8)',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: -6,
                  right: 14,
                  width: 12,
                  height: 12,
                  backgroundColor: isDarkMode 
                    ? 'rgba(30, 41, 59, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  transform: 'rotate(45deg)',
                  borderTop: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  borderLeft: isDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  zIndex: 0,
                }
              }
            }}
          >
            <Box className="px-4 py-3 flex justify-between items-center">
              <Typography variant="subtitle1" className="font-medium">
                การแจ้งเตือน
              </Typography>
              <Chip label={`${notifications.length} ใหม่`} size="small" color="primary" />
            </Box>
            
            <Divider />
            
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    onClick={handleNotificationClose}
                    className="border-b last:border-b-0 dark:border-gray-700 px-4 py-3"
                  >
                    <Box>
                      <Box className="flex justify-between">
                        <Typography variant="body2" className="font-medium mb-1">
                          {notification.message}
                        </Typography>
                        <Chip 
                          label={notification.severity} 
                          size="small" 
                          color={getSeverityColor(notification.severity)}
                          className="ml-2 h-5"
                        />
                      </Box>
                      <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                        {notification.time}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                
                <Box className="p-2 text-center">
                  <Button 
                    size="small" 
                    onClick={() => { handleNotificationClose(); navigate('/notifications'); }}
                  >
                    ดูทั้งหมด
                  </Button>
                </Box>
              </>
            ) : (
              <Box className="p-4 text-center">
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                  ไม่มีการแจ้งเตือนใหม่
                </Typography>
              </Box>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      >
        {mobileDrawerContent}
      </Drawer>
      
      {/* Main Content */}
      <Box className="flex-1 bg-gray-50 dark:bg-gray-900">
        <Container maxWidth="xl" className="py-6">
          <Outlet />
        </Container>
      </Box>
      
      {/* Footer */}
      <Box 
        component="footer" 
        className="py-4 px-6 border-t bg-white dark:bg-gray-800"
        sx={{
          borderTop: isDarkMode 
            ? '1px solid rgba(255, 255, 255, 0.1)' 
            : '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        <Container maxWidth="xl">
          <Box className="flex flex-col md:flex-row justify-between items-center">
            <Box className="mb-4 md:mb-0 text-center md:text-left">
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} ศูนย์การแพทย์มหาวิทยาลัยวลัยลักษณ์
              </Typography>
              <Typography variant="caption" className="text-gray-500 dark:text-gray-500">
                Version 2.0.1 | ทีมโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
              </Typography>
            </Box>
            
            <Box className="flex items-center space-x-4">
              <Tooltip title="ติดต่อสนับสนุน">
                <IconButton size="small" color="inherit">
                  <SupportAgent fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="วิศวกรระบบ">
                <IconButton size="small" color="inherit">
                  <Engineering fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                ติดต่อ: 075-672-000 ต่อ 3344
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;