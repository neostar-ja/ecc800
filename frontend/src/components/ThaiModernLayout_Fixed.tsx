import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
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
  Zoom,
  Paper,
  Collapse,
  Button,
  useMediaQuery,
  Chip,
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
  Menu as MenuIcon,
  Close,
  DarkMode,
  LightMode,
  NotificationsActive,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Adb,
  Autorenew,
  Settings,
  Info,
  ExpandMore,
  ExpandLess,
  Person,
  ChevronLeft,
  ChevronRight,
  Speed,
  BarChart,
  Storage,
  CloudSync,
  Dns,
  Groups,
  HelpOutline,
  Search,
  Notifications,
  Home,
  ViewInAr,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import { useTheme } from '@mui/material/styles';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// เมนูหลัก
const navItems = [
  { 
    id: 'dashboard', 
    label: 'แดชบอร์ด', 
    path: '/dashboard', 
    icon: Dashboard,
    badge: 'ใหม่',
    badgeColor: 'success'
  },
  { 
    id: 'rack-layout', 
    label: 'ตำแหน่งตู้เครือข่าย', 
    path: '/rack-layout', 
    icon: ViewInAr,
    badge: 'อัปเดต',
    badgeColor: 'info'
  },
  { 
    id: 'sites', 
    label: 'ไซต์', 
    path: '/sites',
    icon: Business
  },
  { 
    id: 'equipment', 
    label: 'อุปกรณ์', 
    path: '/equipment',
    icon: Memory
  },
  { 
    id: 'metrics', 
    label: 'เมตริกซ์', 
    path: '/metrics',
    icon: Analytics
  },
  { 
    id: 'faults', 
    label: 'ข้อผิดพลาด', 
    path: '/faults',
    icon: Warning,
    badge: 'ล่าสุด',
    badgeColor: 'error'
  },
  { 
    id: 'reports', 
    label: 'รายงาน', 
    path: '/reports',
    icon: Assessment
  },
  { 
    id: 'settings', 
    label: 'ตั้งค่าระบบ', 
    path: '/settings',
    icon: Settings
  }
];

// กำหนดสีของระบบ
const themeColors = {
  light: {
    primary: {
      main: '#7B5BA4',
      light: '#9B7DC6',
      dark: '#5A4379',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F17422',
      light: '#F59A5A',
      dark: '#D45E0A',
      contrastText: '#FFFFFF',
    },
    background: {
      paper: '#FFFFFF',
      default: '#F8F9FA',
      darker: '#F0F2F5',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    action: {
      hover: 'rgba(123, 91, 164, 0.08)',
      selected: 'rgba(123, 91, 164, 0.12)',
    }
  },
  dark: {
    primary: {
      main: '#9B7DC6',
      light: '#B598DB',
      dark: '#7B5BA4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59A5A',
      light: '#FFBB80',
      dark: '#D45E0A',
      contrastText: '#FFFFFF',
    },
    background: {
      paper: '#1E293B',
      default: '#111827',
      darker: '#0F172A',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
      disabled: '#64748B',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.12)',
    }
  }
};

// ข้อมูลจำลองการแจ้งเตือน
const notifications = [
  {
    id: 1,
    title: 'ข้อผิดพลาดที่ DB Server',
    message: 'เซิร์ฟเวอร์ DB1 มีการใช้งาน CPU สูงเกินกำหนด',
    type: 'error',
    time: '5 นาทีที่แล้ว',
    isRead: false,
  },
  {
    id: 2,
    title: 'อัปเดตระบบเสร็จสมบูรณ์',
    message: 'อัปเดตเฟิร์มแวร์อุปกรณ์ทั้งหมดเสร็จสมบูรณ์',
    type: 'success',
    time: '1 ชั่วโมงที่แล้ว',
    isRead: true,
  },
];

// คอมโพเนนต์สำหรับเมนูย่อย
const SubMenu = ({ item, open, depth, handleNavigation, isActiveRoute, isSmallScreen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const muiTheme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;
  
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const navItemStyles = {
    px: 2,
    py: 1,
    my: 0.5,
    borderRadius: 2,
    position: 'relative',
    minHeight: 48,
    transition: 'all 0.2s ease-in-out',
    color: isActiveRoute(item.path) ? colors.primary.main : colors.text.primary,
    backgroundColor: isActiveRoute(item.path) ? colors.action.selected : 'transparent',
    '&:hover': {
      backgroundColor: colors.action.hover,
    },
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        sx={{
          ...navItemStyles,
          borderRadius: 2,
          mx: isSmallScreen ? 0.5 : 1,
          mb: 0.5,
          justifyContent: isSmallScreen ? 'center' : 'flex-start',
          '&:hover': {
            backgroundColor: isActiveRoute(item.path) 
              ? 'rgba(25, 118, 210, 0.15)' 
              : 'rgba(0, 0, 0, 0.08)',
            transform: isSmallScreen ? 'scale(1.05)' : 'translateX(4px)',
          },
        }}
        onClick={() => handleNavigation(item.path)}
      >
        <ListItemIcon sx={{ 
          minWidth: isSmallScreen ? 40 : 56,
          color: isActiveRoute(item.path) ? colors.primary.main : colors.text.secondary,
          justifyContent: 'center',
        }}>
          {item.icon && <item.icon />}
        </ListItemIcon>
        
        {!isSmallScreen && (
          <>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: isActiveRoute(item.path) ? 700 : 500,
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: isActiveRoute(item.path) ? colors.primary.main : colors.text.primary,
              }}
            />
            
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  backgroundColor: 
                    item.badgeColor === 'error' ? 'error.main' :
                    item.badgeColor === 'success' ? 'success.main' :
                    item.badgeColor === 'warning' ? 'warning.main' : 'info.main',
                  color: '#fff',
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    </ListItem>
  );
};

// คอมโพเนนต์เทมเพลตหลัก
const ThaiModernLayout = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  
  const isXsScreen = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('lg'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isSmallScreen);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniDrawer, setMiniDrawer] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter(n => !n.isRead).length
  );
  
  // คำนวณความกว้างของ drawer
  const getDrawerWidth = () => {
    if (miniDrawer) return 64;
    if (isTablet) return 240;
    return 280;
  };
  
  const drawerWidth = getDrawerWidth();
  const colors = isDarkMode ? themeColors.dark : themeColors.light;

  // อัปเดต Drawer เมื่อขนาดหน้าจอเปลี่ยน
  useEffect(() => {
    if (isSmallScreen) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isSmallScreen]);
  
  // ฟังก์ชันสำหรับจัดการ Drawer
  const handleDrawerToggle = () => {
    if (isSmallScreen) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setMiniDrawer(!miniDrawer);
    }
  };
  
  // ฟังก์ชันจัดการเมนู User
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // ฟังก์ชันจัดการเมนูการแจ้งเตือน
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };
  
  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };
  
  // ฟังก์ชันนำทาง
  const handleNavigation = (path) => {
    navigate(path);
    if (isSmallScreen) {
      setMobileMenuOpen(false);
    }
  };
  
  // เช็คว่าเส้นทางปัจจุบันตรงกับเมนูใด
  const isActiveRoute = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    if (path !== '/dashboard' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };
  
  // สร้าง Drawer สำหรับเมนูด้านข้าง
  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.background.paper,
        overflowX: 'hidden',
      }}
    >
      {/* โลโก้และปุ่มซ่อนเมนู */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${colors.divider}`,
        }}
      >
        {!miniDrawer ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/wuh_logo.png"
                alt="Walailak University Hospital Logo"
                sx={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain'
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.1rem',
                    color: colors.text.primary,
                  }}
                >
                  ECC800 Monitor
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: colors.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  ระบบเฝ้าระวัง Data Center
                </Typography>
              </Box>
            </Box>
            
            {!isSmallScreen && (
              <IconButton 
                onClick={handleDrawerToggle} 
                size="small"
                sx={{
                  color: colors.text.secondary,
                  '&:hover': {
                    backgroundColor: colors.action.hover,
                    color: colors.primary.main,
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
            )}
          </>
        ) : (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <Box
              component="img"
              src="/wuh_logo.png"
              alt="Walailak University Hospital Logo"
              sx={{
                width: 32,
                height: 32,
                objectFit: 'contain'
              }}
            />
            {!isSmallScreen && (
              <IconButton 
                onClick={handleDrawerToggle} 
                size="small"
                sx={{
                  position: 'absolute',
                  right: 0,
                  color: colors.text.secondary,
                  '&:hover': {
                    backgroundColor: colors.action.hover,
                    color: colors.primary.main,
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* รายการเมนู */}
      <List 
        component="nav"
        sx={{ 
          width: '100%', 
          flexGrow: 1,
          px: 1,
          py: 2,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {navItems.map((item) => (
          <SubMenu
            key={item.id}
            item={item}
            open={!miniDrawer}
            depth={1}
            handleNavigation={handleNavigation}
            isActiveRoute={isActiveRoute}
            isSmallScreen={miniDrawer}
          />
        ))}
      </List>
      
      {/* ส่วนล่างของเมนู */}
      <Box 
        sx={{ 
          p: 2,
          borderTop: `1px solid ${colors.divider}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {/* ปุ่มสลับโหมดสีหน้าจอ */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: miniDrawer ? 'center' : 'space-between',
          }}
        >
          {!miniDrawer && (
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              โหมดสีหน้าจอ
            </Typography>
          )}
          <IconButton 
            onClick={toggleTheme} 
            size="small"
            sx={{ 
              backgroundColor: colors.action.hover,
              color: colors.primary.main,
              '&:hover': {
                backgroundColor: colors.action.selected,
              }
            }}
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Box>
        
        {/* ข้อมูลผู้ใช้ */}
        {!miniDrawer ? (
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: colors.action.hover,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: colors.action.selected,
              }
            }}
            onClick={handleUserMenuOpen}
          >
            <Avatar 
              src={user?.full_name ? `/ecc800/avatar/${user.id}.png` : '/ecc800/avatar/default.png'} 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: colors.primary.main
              }}
            >
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ ml: 1.5, flex: 1, overflow: 'hidden' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: colors.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.full_name || user?.username || 'ผู้ใช้งาน'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.text.secondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
              </Typography>
            </Box>
            <KeyboardArrowRight sx={{ color: colors.text.disabled, fontSize: 18 }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton 
              onClick={handleUserMenuOpen}
              sx={{ 
                backgroundColor: colors.action.hover,
                '&:hover': {
                  backgroundColor: colors.action.selected,
                }
              }}
            >
              <Person />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { 
            md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' 
          },
          ml: { 
            md: drawerOpen ? `${drawerWidth}px` : 0 
          },
          zIndex: muiTheme.zIndex.drawer + 1,
          backgroundColor: colors.background.paper,
          color: colors.text.primary,
          borderBottom: `1px solid ${colors.divider}`,
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                color: colors.text.primary,
                display: { md: 'none' },
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: colors.text.primary,
                  fontSize: { xs: '1.3rem', md: '1.6rem' },
                }}
              >
                {navItems.find(item => 
                  isActiveRoute(item.path)
                )?.label || 'แดชบอร์ด'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: colors.text.secondary,
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.85rem',
                }}
              >
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton sx={{ color: colors.text.primary }}>
              <Search />
            </IconButton>
            
            <IconButton
              onClick={handleNotificationOpen}
              sx={{ color: colors.text.primary }}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton 
              onClick={toggleTheme}
              sx={{ color: colors.text.primary }}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <Box 
              onClick={handleUserMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 1,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                cursor: 'pointer',
                backgroundColor: colors.action.hover,
                '&:hover': {
                  backgroundColor: colors.action.selected,
                }
              }}
            >
              <Avatar 
                src={user?.full_name ? `/ecc800/avatar/${user.id}.png` : '/ecc800/avatar/default.png'} 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: colors.primary.main
                }}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
                  {user?.full_name || user?.username || 'ผู้ใช้งาน'}
                </Typography>
              </Box>
              <KeyboardArrowDown sx={{ color: colors.text.disabled, fontSize: 16 }} />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer สำหรับมือถือ */}
      <Drawer
        variant="temporary"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: '80%',
            maxWidth: 300,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer สำหรับเดสก์ท็อป */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: `1px solid ${colors.divider}`,
            transition: muiTheme.transitions.create('width', {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* เมนูผู้ใช้ */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            backgroundColor: colors.background.paper,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <Typography>โปรไฟล์</Typography>
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <Typography>การตั้งค่า</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <Typography color="error">ออกจากระบบ</Typography>
        </MenuItem>
      </Menu>
      
      {/* เมนูการแจ้งเตือน */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 300,
            maxWidth: 360,
            backgroundColor: colors.background.paper,
            borderRadius: 2,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            การแจ้งเตือน
          </Typography>
        </Box>
        <Divider />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem key={notification.id} sx={{ py: 1.5, px: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: colors.text.secondary }}>
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              ไม่มีการแจ้งเตือนใหม่
            </Typography>
          </Box>
        )}
      </Menu>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: '64px',
          ml: { 
            xs: 0,
            md: drawerOpen ? `${drawerWidth}px` : 0
          },
          backgroundColor: colors.background.default,
          transition: muiTheme.transitions.create(['margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
          minHeight: '100vh',
        }}
      >
        {/* Content Container */}
        <Box 
          sx={{ 
            flex: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ 
            flex: 1,
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
          }}>
            <Outlet />
          </Box>
        </Box>
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            mt: 'auto',
            py: 3,
            px: 3,
            borderTop: `1px solid ${colors.divider}`,
            backgroundColor: colors.background.paper,
          }}
        >
          <Box 
            sx={{ 
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                component="img" 
                src="/wuh_logo.png"
                alt="Walailak University Hospital Logo"
                sx={{ 
                  width: 24,
                  height: 24,
                  objectFit: 'contain'
                }}
              />
              <Typography variant="body2" sx={{ color: colors.text.secondary, fontWeight: 500 }}>
                &copy; {new Date().getFullYear()} โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography 
                component={Link} 
                to="/terms" 
                variant="body2" 
                sx={{ 
                  color: colors.text.secondary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    color: colors.primary.main,
                    textDecoration: 'underline'
                  }
                }}
              >
                เงื่อนไขการใช้งาน
              </Typography>
              <Typography 
                component={Link} 
                to="/privacy" 
                variant="body2" 
                sx={{ 
                  color: colors.text.secondary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    color: colors.primary.main,
                    textDecoration: 'underline'
                  }
                }}
              >
                นโยบายความเป็นส่วนตัว
              </Typography>
              <Typography 
                component={Link} 
                to="/help" 
                variant="body2" 
                sx={{ 
                  color: colors.text.secondary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    color: colors.primary.main,
                    textDecoration: 'underline'
                  }
                }}
              >
                ช่วยเหลือ
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ThaiModernLayout;