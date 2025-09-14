import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Refresh,
  Settings,
  Fullscreen,
  Info,
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import ResponsiveDataCenterLayout from '../components/ResponsiveDataCenterLayout';

// Modern Dashboard Page Component
const ModernDashboardPage = () => {
  const [lastUpdate, setLastUpdate] = React.useState(new Date());
  const [systemHealth, setSystemHealth] = React.useState(98.5);
  const [activeAlerts, setActiveAlerts] = React.useState(3);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setSystemHealth(95 + Math.random() * 5);
      setActiveAlerts(Math.floor(Math.random() * 6));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const quickStats = [
    {
      title: 'System Health',
      value: `${systemHealth.toFixed(1)}%`,
      trend: systemHealth > 97 ? 'up' : 'down',
      color: systemHealth > 97 ? 'success' : systemHealth > 95 ? 'warning' : 'error',
      icon: systemHealth > 97 ? CheckCircle : Warning
    },
    {
      title: 'Active Equipment',
      value: '247/250',
      trend: 'up',
      color: 'success',
      icon: CheckCircle
    },
    {
      title: 'Power Usage',
      value: '85.2 kW',
      trend: 'down',
      color: 'info',
      icon: TrendingDown
    },
    {
      title: 'Temperature',
      value: '24.5°C',
      trend: 'stable',
      color: 'primary',
      icon: Info
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Server Rack A05 temperature above threshold',
      time: '2 minutes ago',
      equipment: 'A05'
    },
    {
      id: 2,
      type: 'info',
      message: 'Scheduled maintenance completed on CRAC-2',
      time: '15 minutes ago',
      equipment: 'CRAC-2'
    },
    {
      id: 3,
      type: 'error',
      message: 'Network switch B08 connection lost',
      time: '1 hour ago',
      equipment: 'B08'
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      p: 0,
      position: 'relative'
    }}>
      {/* Header Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 0
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              🏢 Modern Data Center Dashboard
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Real-time monitoring and visualization of your data center infrastructure
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`Last Update: ${lastUpdate.toLocaleTimeString()}`}
              variant="outlined"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            />
            <Tooltip title="Refresh Data">
              <IconButton
                sx={{ color: 'white' }}
                onClick={() => setLastUpdate(new Date())}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Quick Stats Cards */}
      <Box sx={{ p: 3, pb: 0 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${
                    stat.color === 'success' ? '#4caf50' :
                    stat.color === 'warning' ? '#ff9800' :
                    stat.color === 'error' ? '#f44336' :
                    stat.color === 'info' ? '#2196f3' : '#9c27b0'
                  } 0%, rgba(255,255,255,0.1) 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    opacity: 0.1,
                    fontSize: '4rem'
                  }}>
                    <stat.icon />
                  </Box>

                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                    {stat.title}
                  </Typography>

                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.value}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stat.trend === 'up' && <TrendingUp sx={{ fontSize: '1rem' }} />}
                    {stat.trend === 'down' && <TrendingDown sx={{ fontSize: '1rem' }} />}
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {stat.trend === 'up' ? 'Improving' :
                       stat.trend === 'down' ? 'Decreasing' : 'Stable'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ p: 3, pt: 0 }}>
        <Grid container spacing={3}>
          {/* 3D Visualization - Takes up most of the space */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={3}
              sx={{
                height: '70vh',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <ResponsiveDataCenterLayout />
            </Paper>
          </Grid>

          {/* Side Panel */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* System Overview */}
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info />
                    System Overview
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Overall Health</Typography>
                      <Typography variant="body2">{systemHealth.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={systemHealth}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: systemHealth > 97 ? 'success.main' :
                                  systemHealth > 95 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Active Racks
                      </Typography>
                      <Typography variant="h6">247/250</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Cooling Units
                      </Typography>
                      <Typography variant="h6">4/4</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Network Switches
                      </Typography>
                      <Typography variant="h6">8/8</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Power Systems
                      </Typography>
                      <Typography variant="h6">6/6</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning />
                    Recent Alerts ({activeAlerts})
                  </Typography>

                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {recentAlerts.map((alert) => (
                      <Alert
                        key={alert.id}
                        severity={alert.type as 'warning' | 'info' | 'error'}
                        variant="outlined"
                        sx={{ mb: 1 }}
                        iconMapping={{
                          warning: <Warning />,
                          info: <Info />,
                          error: <Error />
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {alert.equipment}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                          {alert.time}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 2 }}
                    startIcon={<Warning />}
                  >
                    View All Alerts
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button variant="outlined" startIcon={<Refresh />} size="small">
                      Refresh All Data
                    </Button>
                    <Button variant="outlined" startIcon={<Settings />} size="small">
                      System Settings
                    </Button>
                    <Button variant="outlined" startIcon={<Fullscreen />} size="small">
                      Fullscreen View
                    </Button>
                    <Button variant="outlined" startIcon={<Info />} size="small">
                      Help & Documentation
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Paper
        elevation={1}
        sx={{
          mt: 4,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 0,
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Modern Data Center Monitoring System | Real-time Infrastructure Visualization
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Built with React, Three.js, and Material-UI | Last updated: {lastUpdate.toLocaleString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ModernDashboardPage;