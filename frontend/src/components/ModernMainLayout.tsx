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
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Switch,
  FormControlLabel,
  Badge,
  Tooltip,
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
  Menu as MenuIcon,
  Close,
  DarkMode,
  LightMode,
  NotificationsActive,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import PipelineStatusIndicator from './PipelineStatusIndicator';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Dashboard, path: '/dashboard', description: 'Overview & Monitoring' },
  { id: 'sites', label: 'Sites', icon: Business, path: '/sites', description: 'Site Management' },
  { id: 'equipment', label: 'Equipment', icon: Memory, path: '/equipment', description: 'Hardware Status' },
  { id: 'metrics', label: 'Metrics', icon: Analytics, path: '/metrics', description: 'Performance Data' },
  { id: 'faults', label: 'Faults', icon: Warning, path: '/faults', description: 'Alert Management' },
  { id: 'reports', label: 'Reports', icon: Assessment, path: '/reports', description: 'Analytics & Reports' },
  { id: 'admin', label: 'Admin', icon: AdminPanelSettings, path: '/admin', description: 'System Administration', adminOnly: true },
];

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  // Modern glassmorphism navigation bar
  const NavigationBar = () => (
    <AppBar
      position="fixed"
      className="backdrop-blur-lg border-b border-white/10 dark:border-gray-800/50"
      sx={{
        background: isDarkMode 
          ? 'rgba(15, 15, 35, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 8px 32px rgba(123, 91, 164, 0.15)',
        backdropFilter: 'blur(16px)',
        borderBottom: isDarkMode 
          ? '1px solid rgba(203, 213, 225, 0.1)' 
          : '1px solid rgba(148, 163, 184, 0.2)',
      }}
    >
      <Toolbar className="px-4 lg:px-6">
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="primary"
            aria-label="menu"
            onClick={() => setMobileDrawerOpen(true)}
            className="mr-2 hover:scale-110 transition-all duration-300"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo & Brand */}
        <Box className="flex items-center space-x-3 mr-8">
          <Box className="relative">
            <MonitorHeart 
              className="text-3xl lg:text-4xl text-primary-500 drop-shadow-lg animate-pulse"
            />
            <Box className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
          </Box>
          <Box>
            <Typography
              variant="h6"
              className="font-ibm-flex font-bold text-primary-600 dark:text-primary-400 text-lg lg:text-xl"
            >
              ECC800 Monitor
            </Typography>
            <Typography
              variant="caption"
              className="font-ibm-flex text-gray-600 dark:text-gray-300 text-xs"
            >
              Walailak University Medical Center
            </Typography>
          </Box>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box className="flex-1 flex items-center space-x-2">
            {filteredNavItems.map((item) => (
              <Tooltip key={item.id} title={item.description} arrow>
                <Button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    px-4 py-2 rounded-xl font-ibm-flex transition-all duration-300 hover:scale-105
                    ${isActiveRoute(item.path)
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg scale-105'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-800'
                    }
                  `}
                  startIcon={<item.icon />}
                >
                  {isTablet ? item.id.charAt(0).toUpperCase() : item.label}
                </Button>
              </Tooltip>
            ))}
          </Box>
        )}

        <Box className="flex-1" />

        {/* Dark Mode Toggle */}
        <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`} arrow>
          <IconButton
            onClick={toggleTheme}
            className="mr-3 hover:scale-110 transition-all duration-300"
            color="primary"
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>

        {/* Pipeline Status Component */}
        <PipelineStatusIndicator />

        {/* Notifications */}
        <Tooltip title="Notifications" arrow>
          <IconButton
            className="mr-3 hover:scale-110 transition-all duration-300"
            color="primary"
          >
            <Badge badgeContent={3} color="error" className="animate-bounce">
              <NotificationsActive />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Box className="flex items-center space-x-3">
          {!isMobile && (
            <Box className="text-right">
              <Typography variant="body2" className="font-ibm-flex font-semibold text-gray-800 dark:text-gray-200">
                {user?.full_name || user?.username}
              </Typography>
              <Chip
                size="small"
                label={user?.role?.toUpperCase()}
                color={user?.role === 'admin' ? 'error' : 'primary'}
                className="text-xs font-ibm-flex"
              />
            </Box>
          )}
          
          <IconButton
            onClick={handleUserMenuOpen}
            className="hover:scale-110 transition-all duration-300"
          >
            <Avatar
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg"
            >
              <AccountCircle />
            </Avatar>
          </IconButton>
        </Box>

        {/* User Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          className="mt-2"
          PaperProps={{
            className: 'rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg',
            sx: {
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
            }
          }}
        >
          <MenuItem onClick={handleUserMenuClose} className="font-ibm-flex">
            <AccountCircle className="mr-3" />
            Profile Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} className="font-ibm-flex text-red-600 dark:text-red-400">
            <Logout className="mr-3" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      PaperProps={{
        className: 'w-80 backdrop-blur-lg',
        sx: {
          background: isDarkMode 
            ? 'rgba(15, 15, 35, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRight: isDarkMode 
            ? '1px solid rgba(203, 213, 225, 0.1)' 
            : '1px solid rgba(148, 163, 184, 0.2)',
        }
      }}
    >
      <Box className="p-4">
        <Box className="flex items-center justify-between mb-6">
          <Box className="flex items-center space-x-3">
            <MonitorHeart className="text-3xl text-primary-500" />
            <Typography variant="h6" className="font-ibm-flex font-bold text-primary-600 dark:text-primary-400">
              ECC800
            </Typography>
          </Box>
          <IconButton onClick={() => setMobileDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>

        {/* User Info */}
        <Box className="mb-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <Box className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500">
              <AccountCircle />
            </Avatar>
            <Box>
              <Typography variant="body1" className="font-ibm-flex font-semibold">
                {user?.full_name || user?.username}
              </Typography>
              <Chip
                size="small"
                label={user?.role?.toUpperCase()}
                color={user?.role === 'admin' ? 'error' : 'primary'}
                className="text-xs"
              />
            </Box>
          </Box>
        </Box>

        {/* Dark Mode Toggle */}
        <Box className="mb-4 px-2">
          <FormControlLabel
            control={
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                color="primary"
              />
            }
            label={
              <Box className="flex items-center space-x-2">
                {isDarkMode ? <DarkMode /> : <LightMode />}
                <span className="font-ibm-flex">
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </Box>
            }
          />
        </Box>

        <Divider className="my-4" />

        {/* Navigation Items */}
        <List className="space-y-1">
          {filteredNavItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                className={`
                  rounded-xl transition-all duration-300 hover:scale-105 mx-2
                  ${isActiveRoute(item.path)
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'hover:bg-primary-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <ListItemIcon className={isActiveRoute(item.path) ? 'text-white' : ''}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{ className: 'font-ibm-flex font-semibold' }}
                  secondaryTypographyProps={{ className: 'font-ibm-flex text-xs' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <NavigationBar />
      <MobileDrawer />
      
      {/* Main Content */}
      <Box
        className="pt-20 lg:pt-24"
        component="main"
      >
        <Container
          maxWidth={false}
          className="px-4 lg:px-8 py-6 lg:py-8"
        >
          <Box className="animate-fade-in">
            <Outlet />
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16"
      >
        <Container maxWidth={false} className="px-4 lg:px-8 py-8">
          <Box className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Box>
              <Typography variant="h6" className="font-ibm-flex font-bold mb-4 text-primary-600 dark:text-primary-400">
                ECC800 Data Center Monitoring
              </Typography>
              <Typography variant="body2" className="font-ibm-flex text-gray-600 dark:text-gray-300">
                Advanced monitoring system for Walailak University Medical Center's data infrastructure.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" className="font-ibm-flex font-semibold mb-4">
                Contact Information
              </Typography>
              <Typography variant="body2" className="font-ibm-flex text-gray-600 dark:text-gray-300 mb-2">
                📍 Walailak University Medical Center
              </Typography>
              <Typography variant="body2" className="font-ibm-flex text-gray-600 dark:text-gray-300 mb-2">
                📞 075-672-000 ext. 3344
              </Typography>
              <Typography variant="body2" className="font-ibm-flex text-gray-600 dark:text-gray-300">
                🌐 Medical Digital Infrastructure Team
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" className="font-ibm-flex font-semibold mb-4">
                System Status
              </Typography>
              <Box className="flex items-center space-x-2 mb-2">
                <Box className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <Typography variant="body2" className="font-ibm-flex text-gray-600 dark:text-gray-300">
                  All Systems Operational
                </Typography>
              </Box>
              <Typography variant="caption" className="font-ibm-flex text-gray-500">
                Last Updated: {new Date().toLocaleString('th-TH')}
              </Typography>
            </Box>
          </Box>

          <Divider className="my-6" />

          <Box className="text-center">
            <Typography variant="body2" className="font-ibm-flex text-gray-500 dark:text-gray-400">
              © 2025 Walailak University Medical Center. All rights reserved. | Version 2.0
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;