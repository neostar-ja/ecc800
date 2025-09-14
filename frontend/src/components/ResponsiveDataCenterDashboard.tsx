import React, { useState, useEffect } from 'react';
import {
  Box,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Fab,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ViewInAr,
  Settings,
  Info,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Fullscreen,
  FullscreenExit,
  Menu,
  Close,
  Dashboard,
  Assessment,
  Warning,
  Memory,
  Thermostat,
  Power,
  NetworkCheck,
  ExpandMore
} from '@mui/icons-material';
import ModernDataCenterDashboard from './ModernDataCenterDashboard';

// Responsive Data Center Dashboard Wrapper
const ResponsiveDataCenterDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // System metrics simulation
  const [systemMetrics, setSystemMetrics] = useState({
    temperature: 24.5,
    humidity: 45,
    powerUsage: 85.2,
    airflow: 12000,
    uptime: 99.9,
    alerts: 2,
    onlineRacks: 23,
    totalRacks: 24
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        temperature: 22 + Math.random() * 6,
        humidity: 40 + Math.random() * 15,
        powerUsage: 80 + Math.random() * 15,
        airflow: 11000 + Math.random() * 2000,
        uptime: 99.5 + Math.random() * 0.4,
        alerts: Math.floor(Math.random() * 6),
        onlineRacks: 22 + Math.floor(Math.random() * 3),
        totalRacks: 24
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const MobileQuickStats = () => (
    <Drawer
      anchor="bottom"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          height: '70vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Data Center Overview</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Temperature
                </Typography>
                <Typography variant="h5" color="primary">
                  {systemMetrics.temperature.toFixed(1)}°C
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Power Usage
                </Typography>
                <Typography variant="h5" color="warning.main">
                  {systemMetrics.powerUsage.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Online Racks
                </Typography>
                <Typography variant="h5" color="success.main">
                  {systemMetrics.onlineRacks}/{systemMetrics.totalRacks}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Active Alerts
                </Typography>
                <Typography variant="h5" color="error.main">
                  {systemMetrics.alerts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Recent Alerts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Server A03 temperature warning"
                secondary="2 minutes ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Info color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Maintenance completed"
                secondary="15 minutes ago"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<ViewInAr />} size="small">
          3D View
        </Button>
        <Button variant="outlined" startIcon={<Settings />} size="small">
          Settings
        </Button>
        <Button variant="outlined" startIcon={<Info />} size="small">
          System Info
        </Button>
        <Button
          variant="outlined"
          startIcon={fullscreen ? <FullscreenExit /> : <Fullscreen />}
          size="small"
          onClick={toggleFullscreen}
        >
          {fullscreen ? 'Exit FS' : 'Fullscreen'}
        </Button>
      </Box>
    </Drawer>
  );

  const TabletMetricsPanel = () => (
    !isMobile && isTablet && (
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          zIndex: 1000,
          p: 2,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Temperature
          </Typography>
          <Typography variant="h6" color="primary">
            {systemMetrics.temperature.toFixed(1)}°C
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Power Usage
          </Typography>
          <Typography variant="h6" color="warning.main">
            {systemMetrics.powerUsage.toFixed(1)}%
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Online Racks
          </Typography>
          <Typography variant="h6" color="success.main">
            {systemMetrics.onlineRacks}/{systemMetrics.totalRacks}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Alerts
          </Typography>
          <Typography variant="h6" color="error.main">
            {systemMetrics.alerts}
          </Typography>
        </Box>
      </Paper>
    )
  );

  const MobileBottomNavigation = () => (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: isMobile ? 'block' : 'none'
      }}
      elevation={3}
    >
      <BottomNavigation
        value={bottomNavValue}
        onChange={(event, newValue) => {
          setBottomNavValue(newValue);
          if (newValue === 0) setMobileDrawerOpen(true);
        }}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px'
          }
        }}
      >
        <BottomNavigationAction
          label="Overview"
          icon={<Dashboard />}
        />
        <BottomNavigationAction
          label="Metrics"
          icon={<Assessment />}
        />
        <BottomNavigationAction
          label="Alerts"
          icon={<Warning />}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<Settings />}
        />
      </BottomNavigation>
    </Paper>
  );

  const MobileActionButtons = () => (
    <Box sx={{
      position: 'absolute',
      bottom: 80,
      right: 16,
      zIndex: 1000,
      display: isMobile ? 'flex' : 'none',
      flexDirection: 'column',
      gap: 1
    }}>
      <Tooltip title="Quick Overview">
        <Fab
          size="small"
          color="primary"
          onClick={() => setMobileDrawerOpen(true)}
        >
          <Dashboard />
        </Fab>
      </Tooltip>

      <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
        <Fab
          size="small"
          color="secondary"
          onClick={toggleFullscreen}
        >
          {fullscreen ? <FullscreenExit /> : <Fullscreen />}
        </Fab>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{
      width: '100%',
      height: isMobile ? '100vh' : 'auto',
      position: 'relative',
      overflow: isMobile ? 'hidden' : 'visible'
    }}>
      {/* Main Dashboard */}
      <ModernDataCenterDashboard />

      {/* Mobile Quick Stats Drawer */}
      <MobileQuickStats />

      {/* Tablet Metrics Panel */}
      <TabletMetricsPanel />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Mobile Action Buttons */}
      <MobileActionButtons />

      {/* Status Bar for all devices */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: 'rgba(0,0,0,0.7)',
        color: 'white',
        p: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="body2">
          🏢 Modern Data Center - Real-time Monitoring
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            Status: <span style={{ color: '#4caf50' }}>● Online</span>
          </Typography>
          <Typography variant="body2">
            Last Update: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Mobile-specific adjustments */}
      {isMobile && (
        <Box sx={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          zIndex: 999,
          p: 1,
          bgcolor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>
            Tap equipment for details • Swipe to navigate
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ResponsiveDataCenterDashboard;