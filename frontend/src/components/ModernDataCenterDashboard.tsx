import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Avatar,
  Badge,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab
} from '@mui/material';
import {
  ViewInAr,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Settings,
  Info,
  Thermostat,
  Power,
  NetworkCheck,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Fullscreen,
  FullscreenExit,
  LightMode,
  DarkMode,
  Visibility,
  VisibilityOff,
  Dashboard,
  Memory,
  AcUnit,
  BatteryChargingFull,
  Router,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Speed,
  Storage,
  CloudQueue
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';

// Modern Data Center Configuration
const DATACENTER_CONFIG = {
  dimensions: {
    width: 1200,
    height: 800
  },
  rows: [
    {
      id: 'rowA',
      name: 'Production Row A',
      position: { x: 100, y: 200 },
      racks: [
        { id: 'A01', type: 'server', label: 'Web Server 01', power: 2.5, temp: 28, status: 'online' },
        { id: 'A02', type: 'server', label: 'App Server 01', power: 3.2, temp: 32, status: 'online' },
        { id: 'A03', type: 'server', label: 'DB Server 01', power: 4.1, temp: 35, status: 'warning' },
        { id: 'A04', type: 'network', label: 'Core Switch', power: 1.8, temp: 25, status: 'online' },
        { id: 'A05', type: 'server', label: 'Web Server 02', power: 2.7, temp: 29, status: 'online' },
        { id: 'A06', type: 'server', label: 'App Server 02', power: 3.0, temp: 31, status: 'online' },
        { id: 'A07', type: 'storage', label: 'SAN Storage', power: 2.2, temp: 27, status: 'online' },
        { id: 'A08', type: 'network', label: 'Edge Switch', power: 1.5, temp: 24, status: 'offline' }
      ]
    },
    {
      id: 'rowB',
      name: 'Development Row B',
      position: { x: 100, y: 350 },
      racks: [
        { id: 'B01', type: 'server', label: 'Dev Server 01', power: 2.1, temp: 26, status: 'online' },
        { id: 'B02', type: 'server', label: 'Test Server 01', power: 2.8, temp: 30, status: 'online' },
        { id: 'B03', type: 'server', label: 'Dev Server 02', power: 2.3, temp: 27, status: 'online' },
        { id: 'B04', type: 'network', label: 'Dev Switch', power: 1.2, temp: 23, status: 'online' },
        { id: 'B05', type: 'server', label: 'CI/CD Server', power: 2.9, temp: 31, status: 'online' },
        { id: 'B06', type: 'storage', label: 'Backup Storage', power: 1.9, temp: 25, status: 'online' },
        { id: 'B07', type: 'server', label: 'Monitor Server', power: 2.4, temp: 28, status: 'online' },
        { id: 'B08', type: 'network', label: 'Access Switch', power: 1.3, temp: 22, status: 'online' }
      ]
    },
    {
      id: 'rowC',
      name: 'Infrastructure Row C',
      position: { x: 100, y: 500 },
      racks: [
        { id: 'C01', type: 'ups', label: 'UPS Unit 01', power: 8.5, temp: 30, status: 'online' },
        { id: 'C02', type: 'ups', label: 'UPS Unit 02', power: 8.7, temp: 31, status: 'online' },
        { id: 'C03', type: 'battery', label: 'Battery Bank 01', power: 0.5, temp: 25, status: 'online' },
        { id: 'C04', type: 'battery', label: 'Battery Bank 02', power: 0.4, temp: 24, status: 'online' },
        { id: 'C05', type: 'aircon', label: 'CRAC Unit 01', power: 12.3, temp: 18, status: 'online' },
        { id: 'C06', type: 'aircon', label: 'CRAC Unit 02', power: 11.8, temp: 19, status: 'online' },
        { id: 'C07', type: 'network', label: 'Firewall', power: 2.1, temp: 26, status: 'online' },
        { id: 'C08', type: 'network', label: 'Load Balancer', power: 1.7, temp: 24, status: 'online' }
      ]
    }
  ]
};

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  }
}));

const RackCard = styled(Card)<{ status: string }>(({ theme, status }) => ({
  background: status === 'online' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
             status === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
             status === 'offline' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
             'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  color: 'white',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: status === 'online' ? '#22c55e' :
                status === 'warning' ? '#f59e0b' :
                status === 'offline' ? '#ef4444' : '#6b7280',
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  }
}));

const AnimatedRack = styled(Box)({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.8 }
  }
});

// Modern Server Rack Component
const ModernServerRack: React.FC<{
  rack: any;
  onClick: (rack: any) => void;
  isSelected: boolean;
}> = ({ rack, onClick, isSelected }) => {
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (rack.status === 'warning' || rack.status === 'offline') {
      const interval = setInterval(() => setPulse(prev => !prev), 1000);
      return () => clearInterval(interval);
    }
  }, [rack.status]);

  const getIcon = () => {
    switch (rack.type) {
      case 'server': return <Memory />;
      case 'network': return <Router />;
      case 'storage': return <Storage />;
      case 'aircon': return <AcUnit />;
      case 'battery': return <BatteryChargingFull />;
      case 'ups': return <Power />;
      default: return <Memory />;
    }
  };

  const getStatusColor = () => {
    switch (rack.status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  return (
    <Tooltip title={`${rack.label} - ${rack.temp}°C - ${rack.power}kW`}>
      <RackCard
        status={rack.status}
        onClick={() => onClick(rack)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          transform: isSelected ? 'scale(1.1)' : hovered ? 'scale(1.05)' : 'scale(1)',
          zIndex: isSelected ? 10 : hovered ? 5 : 1,
          ...(pulse && {
            animation: 'pulse 1s infinite'
          })
        }}
      >
        <CardContent sx={{ p: 2, position: 'relative' }}>
          {/* Status Indicator */}
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Badge
              variant="dot"
              color={getStatusColor() as any}
              sx={{
                '& .MuiBadge-dot': {
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  animation: rack.status !== 'online' ? 'pulse 2s infinite' : 'none'
                }
              }}
            />
          </Box>

          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Avatar sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              width: 48,
              height: 48,
              animation: hovered ? 'bounce 0.6s ease-in-out' : 'none'
            }}>
              {getIcon()}
            </Avatar>
          </Box>

          {/* Label */}
          <Typography variant="body2" sx={{
            fontWeight: 600,
            textAlign: 'center',
            fontSize: '0.75rem',
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {rack.label}
          </Typography>

          {/* Metrics */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Temp
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {rack.temp}°C
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Power
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {rack.power}kW
              </Typography>
            </Box>
          </Box>

          {/* Hover Effect */}
          {hovered && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              animation: 'fadeIn 0.3s ease-in-out'
            }} />
          )}
        </CardContent>
      </RackCard>
    </Tooltip>
  );
};

// Control Panel Component
const ControlPanel: React.FC<{
  showControls: boolean;
  onToggleControls: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}> = ({
  showControls,
  onToggleControls,
  zoom,
  onZoomChange,
  darkMode,
  onToggleDarkMode,
  fullscreen,
  onToggleFullscreen
}) => {
  return (
    <Drawer
      anchor="right"
      open={showControls}
      onClose={onToggleControls}
      sx={{
        '& .MuiDrawer-paper': {
          width: 320,
          p: 2,
          bgcolor: 'background.paper',
          borderLeft: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          Control Panel
        </Typography>
        <Divider />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Zoom Control */}
        <Box>
          <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ZoomIn />
            Zoom Level: {Math.round(zoom * 100)}%
          </Typography>
          <Slider
            value={zoom}
            onChange={(_, value) => onZoomChange(value as number)}
            min={0.5}
            max={2}
            step={0.1}
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Theme Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={onToggleDarkMode}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {darkMode ? <DarkMode /> : <LightMode />}
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </Box>
          }
        />

        {/* View Options */}
        <Box>
          <Typography variant="body2" gutterBottom>
            View Options
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Show Labels"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Show Metrics"
            />
            <FormControlLabel
              control={<Switch />}
              label="Show Cables"
            />
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<Refresh />}>
              Refresh Data
            </Button>
            <Button variant="outlined" size="small" startIcon={<Info />}>
              System Info
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={fullscreen ? <FullscreenExit /> : <Fullscreen />}
              onClick={onToggleFullscreen}
            >
              {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

// Main Modern Data Center Dashboard Component
const ModernDataCenterDashboard: React.FC = () => {
  const theme = useTheme();
  const [selectedRack, setSelectedRack] = useState<any>(null);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any>({});
  const [tabValue, setTabValue] = useState(0);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData: any = {};
      DATACENTER_CONFIG.rows.forEach(row => {
        row.racks.forEach(rack => {
          newData[rack.id] = {
            ...rack,
            temp: rack.temp + (Math.random() - 0.5) * 2,
            power: rack.power + (Math.random() - 0.5) * 0.2,
            status: Math.random() > 0.95 ? 'warning' :
                    Math.random() > 0.98 ? 'offline' : 'online'
          };
        });
      });
      setRealTimeData(newData);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRackClick = (rack: any) => {
    setSelectedRack(rack);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const systemMetrics = {
    temperature: 24.5,
    humidity: 45,
    powerUsage: 85.2,
    airflow: 12000,
    uptime: 99.9,
    alerts: 2
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: darkMode ? 'grey.900' : 'grey.50',
      p: 3,
      position: 'relative'
    }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: darkMode
            ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
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
              label={`Last Update: ${new Date().toLocaleTimeString()}`}
              variant="outlined"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
            />
            <Tooltip title="Toggle Controls">
              <IconButton
                sx={{ color: 'white' }}
                onClick={() => setShowControls(!showControls)}
              >
                {showControls ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Data Center Visualization */}
        <Grid item xs={12} lg={9}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewInAr />
                  Data Center Layout
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Zoom In">
                    <IconButton onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                      <ZoomIn />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Zoom Out">
                    <IconButton onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                      <ZoomOut />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reset View">
                    <IconButton onClick={() => setZoom(1)}>
                      <RotateLeft />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Data Center Canvas */}
              <Box
                sx={{
                  height: 600,
                  bgcolor: darkMode ? '#1a1a1a' : '#f8f9fa',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.3s ease-in-out'
                }}
              >
                {/* Background Grid */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }}
                />

                {/* Server Rows */}
                {DATACENTER_CONFIG.rows.map((row, rowIndex) => (
                  <Box key={row.id} sx={{ mb: 4 }}>
                    {/* Row Label */}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: darkMode ? 'grey.300' : 'grey.700',
                        textAlign: 'center'
                      }}
                    >
                      {row.name}
                    </Typography>

                    {/* Rack Grid */}
                    <Grid container spacing={2} sx={{ px: 2 }}>
                      {row.racks.map((rack, rackIndex) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={rack.id}>
                          <ModernServerRack
                            rack={realTimeData[rack.id] || rack}
                            onClick={handleRackClick}
                            isSelected={selectedRack?.id === rack.id}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Side Panel */}
        <Grid item xs={12} lg={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* System Overview */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Dashboard />
                  System Overview
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Overall Health</Typography>
                    <Typography variant="body2">{systemMetrics.uptime}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={systemMetrics.uptime}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: systemMetrics.uptime > 97 ? 'success.main' :
                                systemMetrics.uptime > 95 ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Temperature
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {systemMetrics.temperature.toFixed(1)}°C
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Power Usage
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {systemMetrics.powerUsage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Humidity
                      </Typography>
                      <Typography variant="h6" color="info.main">
                        {systemMetrics.humidity}%
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Airflow
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {(systemMetrics.airflow / 1000).toFixed(1)}k CFM
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>

            {/* Equipment Details */}
            {selectedRack && (
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Equipment Details
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {selectedRack.label}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {selectedRack.id}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Status</Typography>
                      <Chip
                        label={selectedRack.status}
                        color={
                          selectedRack.status === 'online' ? 'success' :
                          selectedRack.status === 'warning' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Temperature</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedRack.temp}°C
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Power Usage</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedRack.power} kW
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Type</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedRack.type}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </StyledCard>
            )}

            {/* Alerts Panel */}
            <StyledCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning />
                  Active Alerts ({systemMetrics.alerts})
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Alert severity="warning" variant="outlined" sx={{ py: 1 }}>
                    <Typography variant="body2">
                      Server A03 temperature above threshold
                    </Typography>
                  </Alert>

                  <Alert severity="info" variant="outlined" sx={{ py: 1 }}>
                    <Typography variant="body2">
                      Scheduled maintenance completed
                    </Typography>
                  </Alert>
                </Box>

                <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                  View All Alerts
                </Button>
              </CardContent>
            </StyledCard>
          </Box>
        </Grid>
      </Grid>

      {/* Control Panel */}
      <ControlPanel
        showControls={showControls}
        onToggleControls={() => setShowControls(!showControls)}
        zoom={zoom}
        onZoomChange={setZoom}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => setShowControls(true)}
      >
        <Settings />
      </Fab>
    </Box>
  );
};

export default ModernDataCenterDashboard;