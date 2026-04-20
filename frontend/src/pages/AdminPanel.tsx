import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Security,
  Settings,
  Analytics,
  Storage,
  Speed,
  Router,
  Computer,
  NetworkCheck,
  Timeline,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

const AdminPanel: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data for admin dashboard
  const systemStats = {
    totalUsers: 125,
    activeUsers: 98,
    totalDevices: 456,
    activeDevices: 442,
    systemHealth: 98.5,
    uptime: '99.9%',
  };

  const recentActivities = [
    { id: 1, user: 'นาย ก', action: 'เข้าสู่ระบบ', time: '2 นาทีที่แล้ว', type: 'info' },
    { id: 2, user: 'นาง ข', action: 'แก้ไขข้อมูลอุปกรณ์', time: '5 นาทีที่แล้ว', type: 'warning' },
    { id: 3, user: 'นาย ค', action: 'สร้างรายงาน', time: '10 นาทีที่แล้ว', type: 'success' },
    { id: 4, user: 'Admin', action: 'อัพเดทระบบ', time: '1 ชั่วโมงที่แล้ว', type: 'info' },
  ];

  const systemAlerts = [
    { id: 1, title: 'Server Load สูง', description: 'CPU ใช้งาน 85%', severity: 'warning', time: '5 นาทีที่แล้ว' },
    { id: 2, title: 'อุปกรณ์ออฟไลน์', description: 'Router #45 ไม่ตอบสนอง', severity: 'error', time: '10 นาทีที่แล้ว' },
    { id: 3, title: 'Backup สำเร็จ', description: 'ข้อมูลสำรองเสร็จสมบูรณ์', severity: 'success', time: '30 นาทีที่แล้ว' },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <Error sx={{ color: '#ef4444' }} />;
      case 'warning': return <Warning sx={{ color: '#f59e0b' }} />;
      case 'success': return <CheckCircle sx={{ color: '#22c55e' }} />;
      default: return <Info sx={{ color: '#3b82f6' }} />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'error': return <Error sx={{ color: '#ef4444' }} />;
      case 'warning': return <Warning sx={{ color: '#f59e0b' }} />;
      case 'success': return <CheckCircle sx={{ color: '#22c55e' }} />;
      default: return <Info sx={{ color: '#3b82f6' }} />;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AdminPanelSettings sx={{ fontSize: 32, color: '#f59e0b' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1f2937' }}>
            จัดการระบบ
          </Typography>
          <Chip
            label="Admin Only"
            color="warning"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body1" color="text.secondary">
          ยินดีต้อนรับ คุณ{user?.full_name || user?.username} | แดชบอร์ดการจัดการระบบ ECC800
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                    {systemStats.totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    ผู้ใช้งานทั้งหมด
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    ออนไลน์: {systemStats.activeUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Router sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                    {systemStats.totalDevices}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    อุปกรณ์ทั้งหมด
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    ออนไลน์: {systemStats.activeDevices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Speed sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                    {systemStats.systemHealth}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    ประสิทธิภาพระบบ
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Uptime: {systemStats.uptime}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Analytics sx={{ fontSize: 40, color: 'white' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                    847
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    เหตุการณ์วันนี้
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    แจ้งเตือน: 12
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Management Tools */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  เครื่องมือจัดการ
                </Typography>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <People sx={{ fontSize: 40, color: '#3b82f6', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      จัดการผู้ใช้
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      เพิ่ม แก้ไข ลบผู้ใช้
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Router sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      จัดการอุปกรณ์
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      กำหนดค่าอุปกรณ์
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Security sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ความปลอดภัย
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ตั้งค่าความปลอดภัย
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(139, 92, 246, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Storage sx={{ fontSize: 40, color: '#8b5cf6', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      จัดการข้อมูล
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      สำรองและกู้คืนข้อมูล
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Analytics sx={{ fontSize: 40, color: '#ef4444', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      รายงานระบบ
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      วิเคราะห์และรายงาน
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Settings sx={{ fontSize: 40, color: '#6366f1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ตั้งค่าระบบ
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      กำหนดค่าระบบ
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  กิจกรรมล่าสุด
                </Typography>
                <Button size="small" startIcon={<Timeline />}>
                  ดูทั้งหมด
                </Button>
              </Box>
              
              <List>
                {recentActivities.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {activity.user}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {activity.action}
                          </Typography>
                        </Box>
                      }
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  แจ้งเตือนระบบ
                </Typography>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {systemAlerts.map((alert) => (
                  <Paper 
                    key={alert.id}
                    sx={{ 
                      p: 2,
                      border: '1px solid',
                      borderColor: alert.severity === 'error' ? '#fecaca' : 
                                   alert.severity === 'warning' ? '#fed7aa' : '#bbf7d0',
                      backgroundColor: alert.severity === 'error' ? '#fef2f2' : 
                                       alert.severity === 'warning' ? '#fff7ed' : '#f0fdf4'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      {getSeverityIcon(alert.severity)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {alert.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {alert.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>

              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                startIcon={<Warning />}
              >
                ดูการแจ้งเตือนทั้งหมด
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminPanel;