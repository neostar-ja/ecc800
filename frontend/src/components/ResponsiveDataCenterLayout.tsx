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
  Paper
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
  Warning
} from '@mui/icons-material';
import ModernDataCenterLayout from './ModernDataCenterLayout';

// Responsive Data Center Layout Wrapper
const ResponsiveDataCenterLayout = () => {
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
    alerts: 2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        temperature: 22 + Math.random() * 6,
        humidity: 40 + Math.random() * 15,
        powerUsage: 80 + Math.random() * 15,
        airflow: 11000 + Math.random() * 2000,
        uptime: 99.5 + Math.random() * 0.4,
        alerts: Math.floor(Math.random() * 5)
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

  const MobileControls = () => (
    <Drawer
      anchor="bottom"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          height: '60vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          p: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Data Center Controls</Typography>
        <IconButton onClick={() => setMobileDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Temperature
              </Typography>
              <Typography variant="h4" color="primary">
                {systemMetrics.temperature.toFixed(1)}°C
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Power Usage
              </Typography>
              <Typography variant="h4" color="warning.main">
                {systemMetrics.powerUsage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Humidity
              </Typography>
              <Typography variant="h4" color="info.main">
                {systemMetrics.humidity.toFixed(0)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Airflow
              </Typography>
              <Typography variant="h4" color="success.main">
                {(systemMetrics.airflow / 1000).toFixed(1)}k CFM
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<ViewInAr />} size="small">
              3D View
            </Button>
            <Button variant="outlined" startIcon={<Settings />} size="small">
              Settings
            </Button>
            <Button variant="outlined" startIcon={<Info />} size="small">
              Info
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
        </Grid>
      </Grid>
    </Drawer>
  );

  const DesktopMetricsPanel = () => (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        p: 2,
        minWidth: 280,
        maxWidth: 320,
        display: isMobile ? 'none' : 'block'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Dashboard />
        System Metrics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Temperature
            </Typography>
            <Typography variant="h5" color="primary">
              {systemMetrics.temperature.toFixed(1)}°C
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Power Usage
            </Typography>
            <Typography variant="h5" color="warning.main">
              {systemMetrics.powerUsage.toFixed(1)}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Humidity
            </Typography>
            <Typography variant="h5" color="info.main">
              {systemMetrics.humidity.toFixed(0)}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Uptime
            </Typography>
            <Typography variant="h5" color="success.main">
              {systemMetrics.uptime.toFixed(1)}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
            <Warning color="warning" />
            <Typography variant="body2">
              {systemMetrics.alerts} Active Alerts
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
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
        }}
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px'
          }
        }}
      >
        <BottomNavigationAction
          label="Controls"
          icon={<Settings />}
          onClick={() => setMobileDrawerOpen(true)}
        />
        <BottomNavigationAction
          label="Metrics"
          icon={<Assessment />}
          onClick={() => setMobileDrawerOpen(true)}
        />
        <BottomNavigationAction
          label="Alerts"
          icon={<Warning />}
          onClick={() => setMobileDrawerOpen(true)}
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
      <Tooltip title="Controls">
        <Fab
          size="small"
          color="primary"
          onClick={() => setMobileDrawerOpen(true)}
        >
          <Menu />
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
      height: isMobile ? '100vh' : '90vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main 3D Layout */}
      <ModernDataCenterLayout />

      {/* Desktop Metrics Panel */}
      <DesktopMetricsPanel />

      {/* Mobile Controls Drawer */}
      <MobileControls />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNavigation />

      {/* Mobile Action Buttons */}
      <MobileActionButtons />

      {/* Tablet-specific adjustments */}
      {isTablet && !isMobile && (
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
            alignItems: 'center'
          }}
        >
          <Chip
            icon={<ViewInAr />}
            label="3D View"
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<Settings />}
            label="Controls"
            color="secondary"
            variant="outlined"
          />
          <Chip
            icon={<Info />}
            label="Info"
            color="info"
            variant="outlined"
          />
        </Paper>
      )}

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
    </Box>
  );
};

export default ResponsiveDataCenterLayout;