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
  Fab,
  Breadcrumbs,
  Link as MuiLink,
  alpha,
  Stack,
  Grid,
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
  Home,
  ViewInAr,
  Timeline,
  LocationOn,
  AccessTime,
  Computer,
  Hub,
  Article,
  Security,
  ContactSupport,
  Notifications,
  AccountCircle,
  PowerSettingsNew,
  Settings as SettingsIcon,
  Help,
  Language,
  Wifi,
  WifiOff,
  Error,
  Warning as WarningIcon,
  NavigateNext,
  MoreVert,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import { useTheme } from '@mui/material/styles';
import { usePermissions } from '../contexts/PermissionContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import LinearProgress from '@mui/material/LinearProgress';
import PipelineStatusIndicator from './PipelineStatusIndicator';

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
    id: 'datacenter-visualization',
    label: 'แบบจำลอง Data Center',
    path: '/datacenter-visualization',
    icon: ViewInAr
  },
  { id: 'sites', label: 'ไซต์', path: '/sites', icon: Business },
  { id: 'equipment', label: 'อุปกรณ์', path: '/equipment', icon: Memory },
  { id: 'metrics', label: 'เมตริกซ์', path: '/metrics', icon: Analytics },
  { id: 'faults', label: 'ข้อผิดพลาด', path: '/faults', icon: Warning, badge: 'ล่าสุด', badgeColor: 'error' },
  { id: 'reports', label: 'รายงาน', path: '/reports', icon: Assessment },
  { id: 'report2', label: 'รายงาน (เดิม)', path: '/report2', icon: Article },
  { 
    id: 'admin-panel', 
    label: 'จัดการระบบ', 
    path: '/admin', 
    icon: AdminPanelSettings, 
    adminOnly: true,
    badge: 'Admin',
    badgeColor: 'warning'
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
    if (item.children && item.children.length > 0) {
      setIsOpen(!isOpen);
    } else if (item.path) {
      handleNavigation(item.path);
    }
  };

  const hasActiveChild = item.children && item.children.some(child => isActiveRoute(child.path));
  const isActive = item.path ? isActiveRoute(item.path) : hasActiveChild;

  const navItemStyles = {
    px: isSmallScreen ? 1 : 2,
    py: 1,
    my: 0.5,
    mx: isSmallScreen ? 0.5 : 0,
    borderRadius: 2,
    position: 'relative',
    minHeight: 48,
    transition: 'all 0.3s ease-in-out',
    color: isActive ? colors.primary.main : colors.text.primary,
    backgroundColor: isActive ? colors.action.selected : 'transparent',
    display: 'flex',
    justifyContent: isSmallScreen ? 'center' : 'flex-start',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: colors.action.hover,
      transform: 'translateX(4px)',
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleClick} sx={navItemStyles}>
          {item.icon && (
            <ListItemIcon 
              sx={{ 
                minWidth: isSmallScreen ? 'auto' : 56,
                color: isActive ? colors.primary.main : colors.text.primary,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease-in-out',
                '& .MuiSvgIcon-root': {
                  fontSize: isSmallScreen ? '1.5rem' : '1.4rem',
                },
              }}
            >
              <item.icon />
            </ListItemIcon>
          )}

          {!isSmallScreen && (
            <>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isActive ? colors.primary.main : colors.text.primary,
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

              {item.children && item.children.length > 0 && (
                isOpen ? <ExpandLess /> : <ExpandMore />
              )}
            </>
          )}
        </ListItemButton>
      </ListItem>

      {item.children && item.children.length > 0 && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <ListItem key={child.id} disablePadding sx={{ pl: 4 }}>
                <ListItemButton
                  sx={{
                    px: 2,
                    py: 0.8,
                    my: 0.2,
                    borderRadius: 2,
                    minHeight: 40,
                    color: isActiveRoute(child.path) ? colors.primary.main : colors.text.primary,
                    backgroundColor: isActiveRoute(child.path) ? colors.action.selected : 'transparent',
                    '&:hover': {
                      backgroundColor: colors.action.hover,
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => handleNavigation(child.path)}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: isActiveRoute(child.path) ? colors.primary.main : colors.text.secondary,
                  }}>
                    {child.icon && <child.icon sx={{ fontSize: 20 }} />}
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary={child.label} 
                    primaryTypographyProps={{ 
                      fontWeight: isActiveRoute(child.path) ? 600 : 400,
                      fontSize: '0.85rem',
                      color: isActiveRoute(child.path) ? colors.primary.main : colors.text.primary,
                    }}
                  />
                  
                  {child.badge && (
                    <Chip
                      label={child.badge}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        borderRadius: '9px',
                        backgroundColor: 
                          child.badgeColor === 'error' ? 'error.main' :
                          child.badgeColor === 'success' ? 'success.main' :
                          child.badgeColor === 'warning' ? 'warning.main' : 'info.main',
                        color: '#fff',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// คอมโพเนนต์เทมเพลตหลัก
const ThaiModernLayout = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { canViewMenu, userMenuItems } = usePermissions();
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter(n => !n.isRead).length
  );
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('th-TH', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  // Icon mapping for menu items
  const iconMap: { [key: string]: React.ElementType } = {
    'dashboard': Dashboard,
    'datacenter-visualization': ViewInAr,
    'datacenter_visualization': ViewInAr,
    'sites': Business,
    'equipment': Memory,
    'metrics': Analytics,
    'faults': Warning,
    'reports': Assessment,
    'report2': Article,
    'admin': AdminPanelSettings,
    'admin-panel': AdminPanelSettings
  };

  // Merge database menu items with static config (for icons and badges)
  const displayNavItems = React.useMemo(() => {
    // If no user menu items loaded yet, use static items
    if (userMenuItems.length === 0) {
      return navItems.filter(item => {
        if (item.adminOnly && user?.role !== 'admin') return false;
        if (!canViewMenu(item.path)) return false;
        return true;
      });
    }

    // Otherwise, use database items and merge with static config
    return userMenuItems.map(dbItem => {
      // Find matching static item for icon/badge config
      const staticItem = navItems.find(ni => 
        ni.path === dbItem.path || ni.id === dbItem.name
      );

      return {
        id: dbItem.name,
        label: dbItem.display_name, // Use database display name
        path: dbItem.path,
        icon: iconMap[dbItem.name] || staticItem?.icon || MenuIcon,
        badge: staticItem?.badge,
        badgeColor: staticItem?.badgeColor,
        adminOnly: staticItem?.adminOnly
      };
    });
  }, [userMenuItems, user?.role, canViewMenu]);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('th-TH', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
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
    // Keep drawer open on larger screens, but always show it for datacenter pages
    if (location.pathname.includes('datacenter')) {
      setDrawerOpen(true);
    } else if (isSmallScreen) {
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
  
  // ฟังก์ชันจัดการ More Options Menu
  const handleMoreOptionsClose = () => {
    setAnchorEl(null);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    handleMoreOptionsClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleMoreOptionsClose();
  };

  const handleHelpClick = () => {
    navigate('/help');
    handleMoreOptionsClose();
  };
  
  // สร้าง Drawer สำหรับเมนูด้านข้าง
  const drawer = (
    <Box
      className="h-full flex flex-col backdrop-blur-xl"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: isDarkMode 
          ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95))'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.95))',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: isDarkMode 
          ? '1px solid rgba(148, 163, 184, 0.15)' 
          : '1px solid rgba(51, 65, 85, 0.1)',
        overflowX: 'hidden',
        boxShadow: isDarkMode
          ? '4px 0 20px rgba(0, 0, 0, 0.3)'
          : '4px 0 20px rgba(51, 65, 85, 0.08)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '1px',
          height: '100%',
          background: isDarkMode 
            ? 'linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.3), transparent)'
            : 'linear-gradient(180deg, transparent, rgba(51, 65, 85, 0.15), transparent)',
        }
      }}
    >
      {/* Professional Sidebar Header - Redesigned */}
      <Box 
        className="transition-all duration-300"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: { xs: 2.5, md: 3 },
          borderBottom: 'none',
          background: 'transparent',
          position: 'relative',
        }}
      >
        {!miniDrawer ? (
          <>
            <Box 
              className="group transition-all duration-300 hover:scale-105"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2,
                flex: 1,
              }}
            >
              {/* Hospital Logo - Larger & Prominent */}
              <Box
                component="img"
                src="/wuh_logo.png"
                alt="WUH Logo"
                className="transition-all duration-300 group-hover:rotate-12"
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'contain',
                  borderRadius: 3,
                  p: 0.8,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.12))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.9))',
                  border: '3px solid',
                  borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
                  boxShadow: isDarkMode 
                    ? '0 10px 30px rgba(99, 102, 241, 0.3), inset 0 2px 8px rgba(255, 255, 255, 0.1)'
                    : '0 10px 30px rgba(99, 102, 241, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.8)',
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  className="font-bold"
                  sx={{ 
                    fontWeight: 900, 
                    fontSize: '1.5rem',
                    lineHeight: 1.1,
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                      : 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '1px',
                    mb: 0.2,
                    textShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  WUH
                </Typography>
                <Typography 
                  variant="body2"
                  sx={{ 
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Data Center
                </Typography>
              </Box>
            </Box>
            
            {!isSmallScreen && (
              <IconButton 
                onClick={handleDrawerToggle} 
                size="small"
                className="transition-all duration-300 hover:scale-110 hover:-rotate-180"
                sx={{
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  background: isDarkMode 
                    ? 'rgba(148, 163, 184, 0.1)'
                    : 'rgba(148, 163, 184, 0.05)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  borderRadius: 2,
                  '&:hover': {
                    background: isDarkMode 
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(99, 102, 241, 0.08)',
                    color: isDarkMode ? '#a5b4fc' : '#6366f1',
                    borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
            )}
          </>
        ) : (
          <Box 
            className="group transition-all duration-300"
            sx={{ 
              width: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            }}
          >
            {/* Hospital Logo for Mini Drawer - Centered */}
            <Box
              component="img"
              src="/wuh_logo.png"
              alt="WUH Logo"
              className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
              sx={{
                width: 44,
                height: 44,
                objectFit: 'contain',
                borderRadius: 2.5,
                p: 0.6,
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.12))'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.9))',
                border: '2px solid',
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
                boxShadow: isDarkMode 
                  ? '0 8px 24px rgba(99, 102, 241, 0.3)'
                  : '0 8px 24px rgba(99, 102, 241, 0.2)',
                mx: 'auto',
              }}
            />
            {!isSmallScreen && (
              <IconButton 
                onClick={handleDrawerToggle} 
                size="small"
                className="transition-all duration-300 hover:scale-110 hover:rotate-180"
                sx={{
                  width: 32,
                  height: 32,
                  mx: 'auto',
                  color: isDarkMode ? '#94a3b8' : '#64748b',
                  background: isDarkMode 
                    ? 'rgba(148, 163, 184, 0.1)'
                    : 'rgba(148, 163, 184, 0.05)',
                  border: '1px solid',
                  borderColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  '&:hover': {
                    background: isDarkMode 
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'rgba(99, 102, 241, 0.08)',
                    color: isDarkMode ? '#a5b4fc' : '#6366f1',
                    borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* Enhanced รายการเมนู */}
      <List 
        component="nav"
        className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
        sx={{ 
          width: '100%', 
          flexGrow: 1,
          px: 2,
          py: 3,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(51,65,85,0.2)',
            borderRadius: '3px',
            '&:hover': {
              background: isDarkMode ? 'rgba(148,163,184,0.5)' : 'rgba(51,65,85,0.4)',
            }
          },
        }}
      >
        {displayNavItems.map((item) => (
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
      
      {/* Enhanced ส่วนล่างของเมนู */}
      <Box 
        className="border-t backdrop-blur-sm"
        sx={{ 
          p: 2,
          borderTop: isDarkMode 
            ? '1px solid rgba(148, 163, 184, 0.2)' 
            : '1px solid rgba(51, 65, 85, 0.1)',
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.8))',
          backdropFilter: 'blur(10px)',
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
      {/* Modern Professional Top Bar */}
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
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.92) 100%)',
          color: colors.text.primary,
          borderBottom: isDarkMode
            ? '1px solid rgba(100, 116, 139, 0.25)'
            : '1px solid rgba(15, 23, 42, 0.1)',
          backdropFilter: 'blur(12px) saturate(140%)',
          WebkitBackdropFilter: 'blur(12px) saturate(140%)',
          boxShadow: isDarkMode
            ? '0 10px 32px rgba(0, 0, 0, 0.4)'
            : '0 6px 20px rgba(15, 23, 42, 0.08)',
          transition: muiTheme.transitions.create(['width', 'margin', 'box-shadow', 'background'], {
            easing: muiTheme.transitions.easing.easeInOut,
            duration: muiTheme.transitions.duration.standard,
          }),
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: '70px !important',
            px: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            gap: 2.5,
          }}
        >
          {/* Left Section - Navigation & Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, md: 2.25 }, flex: 1 }}>
            {/* Mobile Menu Button */}
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: colors.text.primary,
                display: { md: 'none' },
                width: 40,
                height: 40,
                background: isDarkMode
                  ? alpha('#94a3b8', 0.14)
                  : alpha('#334155', 0.08),
                border: `1px solid ${isDarkMode ? alpha('#94a3b8', 0.24) : alpha('#334155', 0.15)}`,
                borderRadius: 2.5,
                transition: muiTheme.transitions.create(['background', 'border-color'], {
                  duration: muiTheme.transitions.duration.shorter,
                }),
                '&:hover': {
                  background: isDarkMode
                    ? alpha('#94a3b8', 0.24)
                    : alpha('#334155', 0.15),
                  borderColor: isDarkMode ? alpha('#94a3b8', 0.35) : alpha('#334155', 0.25),
                }
              }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* Desktop Breadcrumb */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Breadcrumbs
                separator={<NavigateNext fontSize="small" />}
                sx={{
                  '& .MuiBreadcrumbs-separator': {
                    color: colors.text.disabled,
                  },
                  '& .MuiBreadcrumbs-li': {
                    '& a': {
                      color: colors.text.secondary,
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        color: colors.primary.main,
                      },
                    },
                  },
                }}
              >
                <MuiLink
                  component={Link}
                  to="/dashboard"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: colors.text.secondary,
                    textDecoration: 'none',
                    '&:hover': {
                      color: colors.primary.main,
                    },
                  }}
                >
                  <Home sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    หน้าหลัก
                  </Typography>
                </MuiLink>

                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.primary,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {navItems.find(item => isActiveRoute(item.path))?.icon &&
                    React.createElement(navItems.find(item => isActiveRoute(item.path))?.icon, {
                      sx: { fontSize: 16 }
                    })
                  }
                  {navItems.find(item => isActiveRoute(item.path))?.label || 'แดชบอร์ด'}
                </Typography>
              </Breadcrumbs>
            </Box>

            {/* Current Page Indicator for Mobile */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
              {navItems.find(item => isActiveRoute(item.path))?.icon &&
                React.createElement(navItems.find(item => isActiveRoute(item.path))?.icon, {
                  sx: {
                    fontSize: 20,
                    color: colors.primary.main,
                  }
                })
              }
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: colors.text.primary,
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {navItems.find(item => isActiveRoute(item.path))?.label || 'แดชบอร์ด'}
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Status, Actions & User */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.2, md: 1.5 } }}>
            {/* Pipeline Status - Compact Chips */}
            <PipelineStatusIndicator />

            {/* Enhanced DateTime Display */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1.2,
                px: 2,
                py: 0.8,
                borderRadius: 3,
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                border: '1px solid',
                borderColor: isDarkMode ? alpha('#10b981', 0.36) : alpha('#10b981', 0.28),
                boxShadow: isDarkMode
                  ? '0 4px 16px rgba(16, 185, 129, 0.12)'
                  : '0 4px 12px rgba(16, 185, 129, 0.1)',
                transition: muiTheme.transitions.create(['all'], {
                  duration: muiTheme.transitions.duration.shorter,
                }),
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: isDarkMode
                    ? alpha('#10b981', 0.24)
                    : alpha('#10b981', 0.18),
                }}
              >
                <AccessTime sx={{ fontSize: 17, color: isDarkMode ? '#6ee7b7' : '#047857' }} />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? '#86efac' : '#059669',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.25px',
                    display: 'block',
                    mb: -0.2,
                    textTransform: 'uppercase',
                  }}
                >
                  {new Date().toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: isDarkMode ? '#a7f3d0' : '#065f46',
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    fontFamily: '"Courier New", monospace',
                    letterSpacing: '0.5px',
                    lineHeight: 1.2,
                  }}
                >
                  {currentTime}
                </Typography>
              </Box>
            </Box>

            {/* Enhanced Theme Toggle */}
            <Tooltip title={isDarkMode ? "โหมดสว่าง" : "โหมดมืด"} arrow placement="bottom">
              <IconButton
                onClick={toggleTheme}
                sx={{
                  width: 40,
                  height: 40,
                  color: isDarkMode ? '#fbbf24' : '#6366f1',
                  background: isDarkMode
                    ? alpha('#f59e0b', 0.16)
                    : alpha('#6366f1', 0.12),
                  border: '1px solid',
                  borderColor: isDarkMode
                    ? alpha('#f59e0b', 0.32)
                    : alpha('#6366f1', 0.26),
                  borderRadius: 2,
                  transition: muiTheme.transitions.create(['background', 'border-color', 'color', 'transform'], {
                    duration: muiTheme.transitions.duration.shorter,
                  }),
                  '&:hover': {
                    background: isDarkMode
                      ? alpha('#f59e0b', 0.26)
                      : alpha('#6366f1', 0.2),
                    borderColor: isDarkMode
                      ? alpha('#f59e0b', 0.42)
                      : alpha('#6366f1', 0.36),
                    transform: 'scale(1.05)',
                  }
                }}
              >
                {isDarkMode ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {/* Enhanced User Profile Section */}
            <Box
              onClick={handleUserMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: { xs: 0.8, sm: 1.4, md: 1.8 },
                py: 0.7,
                borderRadius: 2.5,
                cursor: 'pointer',
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.09) 0%, rgba(99, 102, 241, 0.06) 100%)',
                border: '1px solid',
                borderColor: isDarkMode
                  ? alpha('#60a5fa', 0.36)
                  : alpha('#3b82f6', 0.24),
                transition: muiTheme.transitions.create(['background', 'border-color', 'box-shadow'], {
                  duration: muiTheme.transitions.duration.shorter,
                }),
                '&:hover': {
                  background: isDarkMode
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.26) 0%, rgba(99, 102, 241, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(99, 102, 241, 0.12) 100%)',
                  borderColor: isDarkMode
                    ? alpha('#60a5fa', 0.48)
                    : alpha('#3b82f6', 0.36),
                  boxShadow: isDarkMode
                    ? '0 4px 16px rgba(59, 130, 246, 0.15)'
                    : '0 4px 12px rgba(59, 130, 246, 0.1)',
                },
              }}
            >
              <Avatar
                src={user?.full_name ? `/ecc800/avatar/${user.id}.png` : '/ecc800/avatar/default.png'}
                sx={{
                  width: { xs: 32, sm: 36, md: 38 },
                  height: { xs: 32, sm: 36, md: 38 },
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  border: '2.5px solid',
                  borderColor: isDarkMode ? alpha('#60a5fa', 0.5) : alpha('#3b82f6', 0.4),
                  boxShadow: isDarkMode
                    ? `0 4px 12px ${alpha('#3b82f6', 0.24)}`
                    : `0 4px 12px ${alpha('#3b82f6', 0.16)}`,
                }}
              >
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: isDarkMode ? '#93c5fd' : '#1e40af',
                    lineHeight: 1.25,
                    fontSize: '0.85rem',
                    mb: -0.2,
                  }}
                >
                  {user?.full_name || user?.username || 'ผู้ใช้งาน'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? '#60a5fa' : '#64748b',
                    fontSize: '0.67rem',
                    fontWeight: 600,
                    display: 'block',
                    letterSpacing: '0.2px',
                  }}
                >
                  {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
                </Typography>
              </Box>
              <KeyboardArrowDown
                sx={{
                  color: isDarkMode ? alpha('#60a5fa', 0.7) : alpha('#3b82f6', 0.6),
                  fontSize: 18,
                  ml: { xs: 0.2, sm: 0.4 },
                  display: { xs: 'none', sm: 'block' },
                  transition: muiTheme.transitions.create(['transform', 'color'], {
                    duration: muiTheme.transitions.duration.shorter,
                  }),
                }}
              />
            </Box>

            {/* More Options Menu */}
            <Tooltip title="ตัวเลือกเพิ่มเติม" arrow placement="bottom">
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  color: colors.text.secondary,
                  '&:hover': {
                    color: colors.primary.main,
                    background: alpha(colors.primary.main, 0.1),
                  },
                }}
              >
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      
      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMoreOptionsClose}
        onClick={handleMoreOptionsClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
          <Typography variant="body2">ตั้งค่า</Typography>
        </MenuItem>
        <MenuItem onClick={handleFullscreenToggle}>
          <Fullscreen sx={{ mr: 2, fontSize: 20 }} />
          <Typography variant="body2">เต็มหน้าจอ</Typography>
        </MenuItem>
        <MenuItem onClick={handleHelpClick}>
          <Help sx={{ mr: 2, fontSize: 20 }} />
          <Typography variant="body2">ช่วยเหลือ</Typography>
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleLogout}>
          <PowerSettingsNew sx={{ mr: 2, fontSize: 20, color: 'error.main' }} />
          <Typography variant="body2" sx={{ color: 'error.main' }}>ออกจากระบบ</Typography>
        </MenuItem>
      </Menu>

      {/* Enhanced Drawer สำหรับมือถือ */}
      <Drawer
        variant="temporary"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        className="md:hidden"
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: '85%',
            maxWidth: 320,
            borderRadius: { xs: 0, sm: '0 16px 16px 0' },
            background: isDarkMode 
              ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98), rgba(51, 65, 85, 0.98))'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.98))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: isDarkMode
              ? '8px 0 32px rgba(0, 0, 0, 0.4)'
              : '8px 0 32px rgba(51, 65, 85, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Enhanced Drawer สำหรับเดสก์ท็อป */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        className="hidden md:block"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: isDarkMode
              ? '4px 0 20px rgba(0, 0, 0, 0.3)'
              : '4px 0 20px rgba(51, 65, 85, 0.08)',
            transition: muiTheme.transitions.create(['width', 'box-shadow'], {
              easing: muiTheme.transitions.easing.easeInOut,
              duration: muiTheme.transitions.duration.standard,
            }),
            '&:hover': {
              boxShadow: isDarkMode
                ? '6px 0 30px rgba(0, 0, 0, 0.4)'
                : '6px 0 30px rgba(51, 65, 85, 0.12)',
            }
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
            minWidth: 280,
            backgroundColor: colors.background.paper,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${colors.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              src={user?.full_name ? `/ecc800/avatar/${user.id}.png` : '/ecc800/avatar/default.png'} 
              sx={{ 
                width: 48, 
                height: 48,
                bgcolor: colors.primary.main,
                border: '2px solid',
                borderColor: colors.primary.light,
              }}
            >
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: colors.text.primary }}>
                {user?.full_name || user?.username || 'ผู้ใช้งาน'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  size="small"
                  label={user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
                  color={user?.role === 'admin' ? 'warning' : 'default'}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
                {user?.role === 'admin' && (
                  <AdminPanelSettings sx={{ fontSize: 16, color: colors.primary.main }} />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Menu Items */}
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          <Typography>โปรไฟล์</Typography>
        </MenuItem>
        
        {user?.role === 'admin' && (
          <MenuItem onClick={() => { 
            navigate('/admin'); 
            handleUserMenuClose(); 
          }}>
            <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
            <Typography>จัดการระบบ</Typography>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <Typography>การตั้งค่า</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon><HelpOutline fontSize="small" /></ListItemIcon>
          <Typography>ช่วยเหลือ</Typography>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{
            color: '#ef4444',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            }
          }}
        >
          <ListItemIcon><Logout fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
          <Typography>ออกจากระบบ</Typography>
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
          pt: '72px', // เพิ่มขึ้นเพื่อรองรับ header ใหม่
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
                {/* Calculate whether this route should use full-width content */}
                {/* Keep hooks at the top of the component; location is already available */}
                <Box sx={{ 
                  flex: 1,
                  width: '100%',
                  // make datacenter pages full width inside the layout (no 1200px cap)
                  maxWidth: (location.pathname.includes('rack-layout-enhanced') || location.pathname.includes('datacenter-visualization')) ? 'none' : '1200px',
                  margin: (location.pathname.includes('rack-layout-enhanced') || location.pathname.includes('datacenter-visualization')) ? 0 : '0 auto',
                  px: (location.pathname.includes('rack-layout-enhanced') || location.pathname.includes('datacenter-visualization')) ? 0 : 0,
                }}>
                  <React.Suspense
                    fallback={
                      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                        <LinearProgress sx={{ width: '60%' }} />
                      </Box>
                    }
                  >
                    <Outlet />
                  </React.Suspense>
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