import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  Thermostat,
  Opacity,
  ElectricBolt,
  Computer,
  Refresh,
  ShowChart,
  DataUsage,
} from '@mui/icons-material';

import { useSites, useEquipment, useTimeSeries, useMetrics } from '../lib/hooks';
import { useAuthStore } from '../stores/authStore';
import { timeRanges } from '../lib/hooks';
import TimeSeriesChart from '../components/TimeSeriesChart';

const MetricsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last24Hours');

  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated) {
      // Show login modal or redirect
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Get time range
  const getTimeRange = () => {
    switch (selectedTimeRange) {
      case 'last1Hour':
        return timeRanges.last1Hour();
      case 'last4Hours':
        return timeRanges.last4Hours();
      case 'last12Hours':
        return timeRanges.last12Hours();
      case 'last24Hours':
      default:
        return timeRanges.last24Hours();
    }
  };

  const timeRange = getTimeRange();

  // Fetch sites
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useSites();

  // Fetch equipment for selected site
  const { data: equipment } = useEquipment(
    selectedSite,
    undefined, // search term
    { enabled: !!selectedSite }
  );
  
  // Fetch available metrics for selected site + equipment (device-first)
  const { data: metricsList, isLoading: metricsListLoading, error: metricsListError } =
    useMetrics(selectedSite, selectedEquipment, { enabled: !!(selectedSite && selectedEquipment) });

  // Fetch time-series data
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch } = useTimeSeries(
    selectedSite && selectedMetric ? {
      site_code: selectedSite,
      equipment_id: selectedEquipment || 'ALL',
      metric: selectedMetric,
      start_time: timeRange.start_time,
      end_time: timeRange.end_time,
    } : { 
      site_code: '', 
      equipment_id: '', 
      metric: '',
      start_time: '',
      end_time: ''
    },
    { enabled: !!(selectedSite && selectedMetric) }
  );

  // Available metrics
  const availableMetrics = [
    { value: 'temperature', label: '🌡️ อุณหภูมิ (Temperature)', icon: <Thermostat /> },
    { value: 'humidity', label: '💧 ความชื้น (Humidity)', icon: <Opacity /> },
    { value: 'power', label: '⚡ การใช้ไฟฟ้า (Power)', icon: <ElectricBolt /> },
    { value: 'cpu_usage', label: '💻 CPU Usage', icon: <Computer /> },
    { value: 'memory_usage', label: '🧠 Memory Usage', icon: <DataUsage /> },
    { value: 'disk_usage', label: '💾 Disk Usage', icon: <DataUsage /> },
    { value: 'network_io', label: '🌐 Network I/O', icon: <ShowChart /> },
  ];

  const getMetricIcon = (metricName: string) => {
    const metric = availableMetrics.find(m => m.value === metricName);
    return metric?.icon || <Timeline />;
  };

  const getMetricLabel = (metricName: string) => {
    const metric = availableMetrics.find(m => m.value === metricName);
    return metric?.label || metricName;
  };

  const getMetricUnit = (metricName: string) => {
    switch (metricName) {
      case 'temperature':
        return '°C';
      case 'humidity':
        return '%';
      case 'power':
        return 'W';
      case 'cpu_usage':
      case 'memory_usage':
      case 'disk_usage':
        return '%';
      case 'network_io':
        return 'MB/s';
      default:
        return '';
    }
  };

  if (sitesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (sitesError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          ไม่สามารถโหลดข้อมูลไซต์ได้: {sitesError.message}
        </Alert>
      </Container>
    );
  }

  // Prepare chart data
  const chartData = metricsData?.data_points?.map(point => ({
    timestamp: new Date(point.timestamp).toISOString(),
    value: typeof point.value === 'number' ? point.value : parseFloat(String(point.value)) || 0,
    label: `${typeof point.value === 'number' ? point.value.toFixed(2) : point.value || 0} ${getMetricUnit(selectedMetric)}`,
  })) || [];

  // Calculate statistics
  const values = chartData.map(d => d.value).filter(v => !isNaN(v));
  const stats = values.length > 0 ? {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    count: values.length,
  } : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 วิเคราะห์เมตริก
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            ติดตามและวิเคราะห์เมตริกประสิทธิภาพระบบ
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()} disabled={!(selectedSite && selectedMetric)}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="เลือกไซต์"
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setSelectedEquipment('');
                }}
                variant="outlined"
              >
                <MenuItem value="">-- เลือกไซต์ --</MenuItem>
                {sites?.map((site) => (
                  <MenuItem key={site.site_code} value={site.site_code}>
                    {site.site_name} ({site.site_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="เลือกอุปกรณ์ (ทั้งหมด)"
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value);
                  // clear previously selected metric when equipment changes
                  setSelectedMetric('');
                }}
                variant="outlined"
                disabled={!selectedSite}
              >
                <MenuItem value="">-- ทั้งหมด --</MenuItem>
                {equipment
                  ?.sort((a: any, b: any) => (a.display_name || a.equipment_name || '').localeCompare(b.display_name || b.equipment_name || '', undefined, { numeric: true, sensitivity: 'base' }))
                  .map((eq) => {
                    const rawName = eq.display_name || eq.equipment_name || 'ไม่ระบุ';
                    const name = rawName.replace(/\(\s*\)/g, '').trim();
                    return (
                      <MenuItem key={eq.equipment_id} value={eq.equipment_id || ''}>
                        {name}
                      </MenuItem>
                    );
                  })}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="เลือกเมตริก (เมทริก ของอุปกรณ์ที่เลือก)"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                variant="outlined"
                disabled={!selectedEquipment}
              >
                <MenuItem value="">-- เลือกเมตริก --</MenuItem>
                {metricsListLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={18} sx={{ mr: 1 }} /> กำลังโหลดข้อมูลเมตริก...
                  </MenuItem>
                ) : metricsListError ? (
                  <MenuItem disabled>
                    ไม่สามารถโหลดรายการเมตริก: {metricsListError.message}
                  </MenuItem>
                ) : (() => {
                  const list: any[] = metricsList && (metricsList as any).metrics ? (metricsList as any).metrics : (metricsList as any) || [];
                  if (!list || list.length === 0) {
                    return [<MenuItem key="none" disabled>ไม่พบเมตริกสำหรับอุปกรณ์นี้</MenuItem>];
                  }
                  return list.map((m: any) => {
                    const name = typeof m === 'string' ? m : (m.metric_name || m.metric || m.display_name || m.name);
                    const label = typeof m === 'string' ? m : (m.display_name || m.metric_name || name);
                    return (
                      <MenuItem key={name} value={name}>
                        {label}
                      </MenuItem>
                    );
                  });
                })()}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>ช่วงเวลา</InputLabel>
                <Select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  label="ช่วงเวลา"
                >
                  <MenuItem value="last1Hour">1 ชั่วโมงล่าสุด</MenuItem>
                  <MenuItem value="last4Hours">4 ชั่วโมงล่าสุด</MenuItem>
                  <MenuItem value="last12Hours">12 ชั่วโมงล่าสุด</MenuItem>
                  <MenuItem value="last24Hours">24 ชั่วโมงล่าสุด</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metric Statistics */}
      {selectedSite && selectedMetric && stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.avg.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ค่าเฉลี่ย {getMetricUnit(selectedMetric)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  {getMetricIcon(selectedMetric)}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h4">
                      {stats.min.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ค่าต่ำสุด {getMetricUnit(selectedMetric)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  {getMetricIcon(selectedMetric)}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h4">
                      {stats.max.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ค่าสูงสุด {getMetricUnit(selectedMetric)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <DataUsage color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.count.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      จุดข้อมูล
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Metrics Chart */}
      {selectedSite && selectedMetric && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              {getMetricIcon(selectedMetric)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                📈 {getMetricLabel(selectedMetric)} - {sites?.find(s => s.site_code === selectedSite)?.site_name}
              </Typography>
              {selectedEquipment && (
                <Chip
                  label={equipment?.find(eq => eq.equipment_id === selectedEquipment)?.equipment_name || selectedEquipment}
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>

            {metricsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  กำลังโหลดข้อมูลเมตริก...
                </Typography>
              </Box>
            ) : metricsError ? (
              <Alert severity="error">
                ไม่สามารถโหลดข้อมูลเมตริกได้: {metricsError.message}
              </Alert>
            ) : chartData.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ShowChart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  ไม่พบข้อมูลเมตริก
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ไม่มีข้อมูลสำหรับเมตริกและช่วงเวลาที่เลือก
                </Typography>
              </Box>
            ) : (
              <TimeSeriesChart
                data={chartData}
                title={`${getMetricLabel(selectedMetric)} (${getMetricUnit(selectedMetric)})`}
                yAxisLabel={getMetricUnit(selectedMetric)}
                color="#2196f3"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Metrics Overview */}
      {selectedSite && !selectedMetric && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 เมตริกที่มีให้เลือก - {sites?.find(s => s.site_code === selectedSite)?.site_name}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              เลือกเมตริกที่ต้องการวิเคราะห์จากรายการด้านล่าง
            </Typography>
            
            <Grid container spacing={2}>
              {availableMetrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} key={metric.value}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 },
                    }}
                    onClick={() => setSelectedMetric(metric.value)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center">
                        {metric.icon}
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          {metric.label}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* No Site Selected */}
      {!selectedSite && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Timeline sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                เลือกไซต์เพื่อดูเมตริก
              </Typography>
              <Typography variant="body1" color="textSecondary">
                กรุณาเลือกไซต์จากรายการด้านบนเพื่อเริ่มวิเคราะห์เมตริก
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default MetricsPage;
