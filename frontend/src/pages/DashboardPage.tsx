import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Dashboard,
  Business,
  Memory,
  Warning,
  Speed,
  Thermostat,
  CheckCircle,
  MoreVert,
  Refresh,
  BarChart,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  FilterList,
  Download,
  Storage as Server,
  Info
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for the dashboard
  const systemSummary = {
    totalEquipment: 248,
    onlineEquipment: 241,
    warningEquipment: 5,
    criticalEquipment: 2
  };

  const statusData = [
    { name: 'Online', value: 241, color: '#4caf50' },
    { name: 'Warning', value: 5, color: '#ff9800' },
    { name: 'Critical', value: 2, color: '#f44336' }
  ];

  const performanceData = [
    { name: '00:00', cpu: 45, memory: 60, temperature: 28 },
    { name: '02:00', cpu: 40, memory: 62, temperature: 27 },
    { name: '04:00', cpu: 38, memory: 58, temperature: 26 },
    { name: '06:00', cpu: 42, memory: 60, temperature: 26 },
    { name: '08:00', cpu: 55, memory: 65, temperature: 28 },
    { name: '10:00', cpu: 70, memory: 72, temperature: 30 },
    { name: '12:00', cpu: 75, memory: 80, temperature: 32 },
    { name: '14:00', cpu: 68, memory: 75, temperature: 31 },
    { name: '16:00', cpu: 65, memory: 70, temperature: 30 },
    { name: '18:00', cpu: 60, memory: 68, temperature: 29 },
    { name: '20:00', cpu: 55, memory: 65, temperature: 28 },
    { name: '22:00', cpu: 48, memory: 62, temperature: 27 }
  ];

  const recentAlerts = [
    { id: 1, device: 'Server 05', message: 'High CPU Usage (92%)', severity: 'warning', time: '15 นาทีที่แล้ว' },
    { id: 2, device: 'UPS 02', message: 'Battery Level Low (15%)', severity: 'critical', time: '35 นาทีที่แล้ว' },
    { id: 3, device: 'PDU North', message: 'Approaching Max Power (85%)', severity: 'warning', time: '1 ชั่วโมงที่แล้ว' },
    { id: 4, device: 'Cooling Unit 3', message: 'Temperature Rising (28°C)', severity: 'warning', time: '2 ชั่วโมงที่แล้ว' },
    { id: 5, device: 'Network Switch 1', message: 'Port 24 Down', severity: 'critical', time: '3 ชั่วโมงที่แล้ว' }
  ];

  const topEquipment = [
    { id: 1, name: 'Database Server', metric: 'CPU', value: 85, unit: '%' },
    { id: 2, name: 'Application Server', metric: 'CPU', value: 72, unit: '%' },
    { id: 3, name: 'File Server', metric: 'Disk', value: 94, unit: '%' },
    { id: 4, name: 'Web Server', metric: 'Memory', value: 78, unit: '%' }
  ];
  
  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Simulate refresh
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Get color based on value
  const getColorByValue = (value: number) => {
    if (value < 60) return theme.palette.success.main;
    if (value < 80) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.success.main;
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Warning color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      default: return <CheckCircle color="success" />;
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800 dark:text-white">
            แดชบอร์ด
          </Typography>
          <Box className="flex items-center mt-1">
            <CalendarToday fontSize="small" className="mr-2 text-gray-500 dark:text-gray-400" />
            <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
              อัพเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
        </Box>
        
        <Box className="flex mt-4 md:mt-0">
          <Button 
            variant="outlined"
            startIcon={<FilterList />}
            className="mr-2"
            sx={{ borderRadius: 2 }}
          >
            ตัวกรอง
          </Button>
          
          <Button 
            variant="outlined"
            startIcon={<Download />}
            className="mr-2"
            sx={{ borderRadius: 2 }}
          >
            ส่งออกรายงาน
          </Button>
          
          <Button 
            variant="contained"
            startIcon={refreshing ? null : <Refresh />}
            onClick={handleRefresh}
            sx={{ 
              borderRadius: 2,
              backgroundImage: 'linear-gradient(135deg, #7B5BA4 0%, #F17422 100%)',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #6A4A93 0%, #E06311 100%)',
              },
            }}
          >
            {refreshing ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 20, mr: 1 }}>
                  <CircularProgress size={16} color="inherit" />
                </Box>
                กำลังอัพเดต...
              </Box>
            ) : 'อัพเดต'}
          </Button>
        </Box>
      </Box>
      
      {/* Status Cards */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={isDarkMode ? 2 : 1} 
            className="h-full"
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    color: '#4caf50',
                    width: 56,
                    height: 56
                  }}
                >
                  <Server fontSize="large" />
                </Avatar>
                <Box className="text-right">
                  <Typography variant="h3" className="font-bold text-gray-800 dark:text-white">
                    {systemSummary.totalEquipment}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    อุปกรณ์ทั้งหมด
                  </Typography>
                </Box>
              </Box>
              <Box className="flex items-center">
                <Chip 
                  label={`${systemSummary.onlineEquipment} Online`}
                  size="small"
                  color="success"
                  className="mr-2"
                />
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                  {((systemSummary.onlineEquipment / systemSummary.totalEquipment) * 100).toFixed(1)}% สถานะปกติ
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={isDarkMode ? 2 : 1} 
            className="h-full"
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    width: 56,
                    height: 56
                  }}
                >
                  <Speed fontSize="large" />
                </Avatar>
                <Box className="text-right">
                  <Typography variant="h3" className="font-bold text-gray-800 dark:text-white">
                    62<Typography variant="h6" component="span">%</Typography>
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    เฉลี่ย CPU
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box className="flex justify-between mb-1">
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    0%
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    100%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={62}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#2196f3'
                    }
                  }}
                />
                <Box className="flex items-center mt-2">
                  <TrendingUp className="text-green-500 mr-1" fontSize="small" />
                  <Typography variant="body2" className="text-green-500">
                    5% มากกว่าเมื่อวาน
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={isDarkMode ? 2 : 1} 
            className="h-full"
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    color: '#9c27b0',
                    width: 56,
                    height: 56
                  }}
                >
                  <Memory fontSize="large" />
                </Avatar>
                <Box className="text-right">
                  <Typography variant="h3" className="font-bold text-gray-800 dark:text-white">
                    74<Typography variant="h6" component="span">%</Typography>
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    เฉลี่ย Memory
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box className="flex justify-between mb-1">
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    0%
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    100%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={74}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(156, 39, 176, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#9c27b0'
                    }
                  }}
                />
                <Box className="flex items-center mt-2">
                  <TrendingDown className="text-red-500 mr-1" fontSize="small" />
                  <Typography variant="body2" className="text-red-500">
                    2% น้อยกว่าเมื่อวาน
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={isDarkMode ? 2 : 1} 
            className="h-full"
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Avatar
                  sx={{
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    width: 56,
                    height: 56
                  }}
                >
                  <Thermostat fontSize="large" />
                </Avatar>
                <Box className="text-right">
                  <Typography variant="h3" className="font-bold text-gray-800 dark:text-white">
                    24<Typography variant="h6" component="span">°C</Typography>
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    อุณหภูมิเฉลี่ย
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box className="flex justify-between mb-1">
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    18°C
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    30°C
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={50}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#f44336'
                    }
                  }}
                />
                <Box className="flex items-center mt-2">
                  <CheckCircle className="text-green-500 mr-1" fontSize="small" />
                  <Typography variant="body2" className="text-green-500">
                    อยู่ในช่วงที่ปลอดภัย
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Info */}
      <Grid container spacing={3} className="mb-6">
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={isDarkMode ? 2 : 1}
            sx={{ 
              borderRadius: 4,
              height: '100%',
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-4">
              <Box className="flex justify-between items-center mb-4">
                <Box>
                  <Typography variant="h6" className="font-semibold text-gray-800 dark:text-white">
                    การใช้งานทรัพยากรระบบ (24 ชั่วโมงล่าสุด)
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    ข้อมูลการใช้งาน CPU, Memory และอุณหภูมิ
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleMenuOpen}
                >
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleMenuClose}>ดูรายละเอียด</MenuItem>
                  <MenuItem onClick={handleMenuClose}>ดาวน์โหลด CSV</MenuItem>
                  <MenuItem onClick={handleMenuClose}>กำหนดช่วงเวลา</MenuItem>
                </Menu>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={performanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'} 
                    />
                    <YAxis 
                      stroke={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'} 
                    />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      name="CPU (%)" 
                      stroke="#2196f3" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      name="Memory (%)" 
                      stroke="#9c27b0" 
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      name="Temperature (°C)" 
                      stroke="#f44336" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Box className="flex justify-center mt-4 space-x-6">
                <Box className="flex items-center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: '#2196f3',
                      borderRadius: '50%',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    CPU
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: '#9c27b0',
                      borderRadius: '50%',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    Memory
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: '#f44336',
                      borderRadius: '50%',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    อุณหภูมิ
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Paper 
            elevation={isDarkMode ? 2 : 1}
            sx={{ 
              borderRadius: 4,
              height: '100%',
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-4">
              <Box className="flex justify-between items-center mb-4">
                <Box>
                  <Typography variant="h6" className="font-semibold text-gray-800 dark:text-white">
                    สถานะอุปกรณ์
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    ภาพรวมสถานะของอุปกรณ์ทั้งหมด
                  </Typography>
                </Box>
                <IconButton>
                  <BarChart />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box className="flex justify-between">
                {statusData.map((status) => (
                  <Box key={status.name} className="text-center">
                    <Typography variant="h5" style={{ color: status.color }} className="font-bold">
                      {status.value}
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                      {status.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Recent Alerts and Top Equipment */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={isDarkMode ? 2 : 1}
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-4">
              <Box className="flex justify-between items-center mb-4">
                <Box>
                  <Typography variant="h6" className="font-semibold text-gray-800 dark:text-white">
                    การแจ้งเตือนล่าสุด
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    5 การแจ้งเตือนล่าสุดจากระบบ
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  size="small"
                >
                  ดูทั้งหมด
                </Button>
              </Box>
              
              <Box>
                {recentAlerts.map((alert) => (
                  <Box
                    key={alert.id}
                    sx={{
                      borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                      mb: 2,
                      p: 2,
                      borderRadius: '0 8px 8px 0',
                      backgroundColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <Box className="flex justify-between">
                      <Box>
                        <Typography variant="subtitle2" className="font-medium text-gray-800 dark:text-white">
                          {alert.device}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                          {alert.message}
                        </Typography>
                      </Box>
                      <Box className="text-right">
                        <Chip
                          label={alert.severity}
                          size="small"
                          sx={{
                            backgroundColor: `${getSeverityColor(alert.severity)}20`,
                            color: getSeverityColor(alert.severity),
                            fontWeight: 'medium',
                            mb: 1
                          }}
                        />
                        <Typography variant="caption" display="block" className="text-gray-500 dark:text-gray-400">
                          {alert.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={isDarkMode ? 2 : 1}
            sx={{ 
              borderRadius: 4,
              background: isDarkMode 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.9)',
              border: isDarkMode 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box className="p-4">
              <Box className="flex justify-between items-center mb-4">
                <Box>
                  <Typography variant="h6" className="font-semibold text-gray-800 dark:text-white">
                    อุปกรณ์ที่มีการใช้งานสูงสุด
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
                    อุปกรณ์ที่มีการใช้งานทรัพยากรสูงสุด
                  </Typography>
                </Box>
                <Button
                  variant="text"
                  size="small"
                >
                  ดูทั้งหมด
                </Button>
              </Box>
              
              <Box>
                {topEquipment.map((equipment) => (
                  <Box
                    key={equipment.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <Box className="flex justify-between items-center">
                      <Box>
                        <Typography variant="subtitle2" className="font-medium text-gray-800 dark:text-white">
                          {equipment.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                          {equipment.metric}: {equipment.value}{equipment.unit}
                        </Typography>
                      </Box>
                      <Box width="50%">
                        <Box className="flex justify-between mb-1">
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            0%
                          </Typography>
                          <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                            100%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={equipment.value}
                          sx={{ 
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getColorByValue(equipment.value)
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
              
              <Box className="text-center mt-4">
                <Button
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  ดูรายละเอียดเพิ่มเติม
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
