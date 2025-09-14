import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Button,
  Tabs,
  Tab,
  Paper,
  Avatar,
  LinearProgress,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
  ShowChart,
  DataUsage,
  FilterList,
  ViewModule,
  ViewList,
  ExpandMore,
  Fullscreen,
  Share,
  Download,
  Settings,
  Notifications,
  Speed,
  Battery90,
  Thermostat,
  Opacity,
  ElectricBolt,
  Computer,
  Sensors,
  DeviceHub,
  Assessment,
  BarChart,
  PieChart,
  DonutSmall,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import { useSites, useEquipment, useTimeSeries, useMetrics } from '../lib/hooks';
import { useAuthStore } from '../stores/authStore';
import { timeRanges } from '../lib/hooks';
import TimeSeriesChart from '../components/TimeSeriesChart';
import { apiGet } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

// Enhanced Types
interface MetricInfo {
  metric_name: string;
  display_name: string;
  unit: string;
  data_points: number;
  first_seen: string;
  last_seen: string;
  category: string;
  description: string;
  icon: string;
  color: string;
}

interface MetricCategory {
  name: string;
  display_name: string;
  icon: string;
  color: string;
  description: string;
  metrics: MetricInfo[];
}

interface MetricStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  std_dev: number;
  count: number;
  latest: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface DetailedMetric {
  metric: MetricInfo;
  statistics: MetricStats;
  data_points: Array<{
    timestamp: string;
    value: number;
    unit: string;
  }>;
  time_range: {
    from: string;
    to: string;
    interval: string;
  };
  site_code: string;
  equipment_id: string;
}

const EnhancedMetricsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // States
  const [selectedSite, setSelectedSite] = useState<string>(searchParams.get('site') || '');
  const [selectedEquipment, setSelectedEquipment] = useState<string>(searchParams.get('equipment') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedMetric, setSelectedMetric] = useState<string>(searchParams.get('metric') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [period, setPeriod] = useState<string>('24h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedDetailMetric, setSelectedDetailMetric] = useState<string>('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Remove URL update - keep URL clean without parameters
  // useEffect(() => {
  //   const params = new URLSearchParams();
  //   if (selectedSite) params.set('site', selectedSite);
  //   if (selectedEquipment) params.set('equipment', selectedEquipment);
  //   if (selectedCategory !== 'all') params.set('category', selectedCategory);
  //   if (selectedMetric) params.set('metric', selectedMetric);
  //   setSearchParams(params);
  // }, [selectedSite, selectedEquipment, selectedCategory, selectedMetric, setSearchParams]);

  // Fetch data
  const { data: sites, isLoading: sitesLoading } = useSites();
  const { data: equipment } = useEquipment(selectedSite, undefined, { enabled: !!selectedSite });
  
  // Enhanced metrics data - show loading state better
  const { data: enhancedMetrics, isLoading: metricsLoading, refetch: refetchMetrics, error: metricsError } = useQuery({
    queryKey: ['enhanced-metrics', selectedSite, selectedEquipment],
    queryFn: () => {
      const params: any = {};
      if (selectedSite) params.site_code = selectedSite;
      if (selectedEquipment) params.equipment_id = selectedEquipment;
      return apiGet<MetricCategory[]>('/enhanced-metrics', params);
    },
    enabled: !!selectedSite, // Only require site, not equipment
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 2,
  });

  // Detailed metric data
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['metric-details', selectedDetailMetric, selectedSite, selectedEquipment, period],
    queryFn: () => apiGet<DetailedMetric>(`/metric/${encodeURIComponent(selectedDetailMetric)}/details`, {
      site_code: selectedSite,
      equipment_id: selectedEquipment,
      period: period,
    }),
    enabled: !!(selectedDetailMetric && selectedSite && selectedEquipment),
  });

  // Equipment metrics summary
  interface EquipmentSummary {
    equipment_id: string;
    display_name?: string;
    total_metrics: number;
    metrics: Array<{
      metric_name: string;
      latest_value?: number;
      unit?: string;
      icon?: string;
      trend?: string;
    }>;
  }

  const { data: equipmentSummary } = useQuery<EquipmentSummary | undefined>({
    queryKey: ['equipment-metrics-summary', selectedSite, selectedEquipment],
    queryFn: () => apiGet<EquipmentSummary>(`/equipment/${selectedSite}/${selectedEquipment}/metrics`),
    enabled: !!(selectedSite && selectedEquipment),
  });

  // Auto-refresh effect
  useEffect(() => {
    // In browser, setInterval returns a number. Use number | undefined to be safe.
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        refetchMetrics();
      }, 30000) as unknown as number;
    }
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [autoRefresh, refetchMetrics]);

  // Helper functions
  const getIconComponent = (iconStr: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      '🌡️': <Thermostat />,
      '💧': <Opacity />,
      '⚡': <ElectricBolt />,
      '🔌': <ElectricBolt />,
      '🔋': <Battery90 />,
      '📊': <Assessment />,
      '🚦': <Sensors />,
      '📈': <ShowChart />,
    };
    return iconMap[iconStr] || <Timeline />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp color="success" />;
      case 'decreasing':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="info" />;
    }
  };

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)} ${unit}`;
  };

  // Filter metrics by category
  const filteredCategories = enhancedMetrics?.filter(category => 
    selectedCategory === 'all' || category.name === selectedCategory
  ) || [];

  const allMetrics = enhancedMetrics?.flatMap(cat => cat.metrics) || [];

  // Loading state
  if (sitesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 3 }}>
            กำลังโหลดข้อมูลระบบ...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Handle metric detail view
  const handleMetricClick = (metricName: string) => {
    setSelectedDetailMetric(metricName);
    setDetailDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header with Actions */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              📊 Enhanced Metrics Analytics
            </Typography>
            <Typography variant="h6" color="textSecondary">
              ระบบวิเคราะห์เมตริกขั้นสูง - ติดตามและวิเคราะห์ประสิทธิภาพแบบเรียลไทม์
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label="Auto Refresh"
            />
            <IconButton onClick={() => refetchMetrics()} disabled={metricsLoading}>
              <Refresh />
            </IconButton>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              // newMode can be null; type it explicitly to avoid 'unknown' inference
              onChange={(e: React.MouseEvent<HTMLElement>, newMode: 'grid' | 'list' | null) => {
                if (newMode) setViewMode(newMode);
              }}
              size="small"
            >
              <ToggleButton value="grid"><ViewModule /></ToggleButton>
              <ToggleButton value="list"><ViewList /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Control Panel */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="🏢 เลือกไซต์"
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setSelectedEquipment('');
                  setSelectedMetric('');
                }}
                variant="outlined"
                size="small"
              >
                <MenuItem value="">-- เลือกไซต์ --</MenuItem>
                {sites?.map((site) => (
                  <MenuItem key={site.site_code} value={site.site_code}>
                    {site.site_name} ({site.site_code.toUpperCase()})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="🔧 เลือกอุปกรณ์"
                value={selectedEquipment}
                onChange={(e) => {
                  setSelectedEquipment(e.target.value);
                  setSelectedMetric('');
                }}
                variant="outlined"
                size="small"
                disabled={!selectedSite}
              >
                <MenuItem value="">-- เลือกอุปกรณ์ --</MenuItem>
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
                label="📂 หมวดหมู่เมตริก"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="all">-- ทั้งหมด --</MenuItem>
                {enhancedMetrics?.map((category) => (
                  <MenuItem key={category.name} value={category.name}>
                    {category.icon} {category.display_name} ({category.metrics.length})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="⏰ ช่วงเวลา"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                variant="outlined"
                size="small"
              >
                <MenuItem value="1h">1 ชั่วโมง</MenuItem>
                <MenuItem value="4h">4 ชั่วโมง</MenuItem>
                <MenuItem value="24h">24 ชั่วโมง</MenuItem>
                <MenuItem value="3d">3 วัน</MenuItem>
                <MenuItem value="7d">7 วัน</MenuItem>
                <MenuItem value="30d">30 วัน</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Equipment Summary */}
      {equipmentSummary && (
        <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})` }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold">
                🎯 สรุปข้อมูลอุปกรณ์: {equipment?.find(eq => eq.equipment_id === selectedEquipment)?.display_name}
              </Typography>
              <Chip 
                label={`${equipmentSummary.total_metrics} เมตริก`} 
                color="primary" 
                variant="filled"
              />
            </Box>
            <Grid container spacing={2}>
              {equipmentSummary.metrics?.slice(0, 4).map((metric: any, index: number) => (
                <Grid item xs={12} sm={6} md={3} key={metric.metric_name}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                    onClick={() => handleMetricClick(metric.metric_name)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box mb={1}>
                        {getIconComponent(metric.icon)}
                      </Box>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {formatValue(metric.latest_value, metric.unit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {metric.metric_name}
                      </Typography>
                      <Box mt={1}>
                        <Chip 
                          size="small" 
                          label={metric.trend}
                          color={metric.trend === 'high' ? 'error' : metric.trend === 'low' ? 'warning' : 'success'}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Metrics Categories */}
      {selectedSite ? (
        metricsLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 3 }}>
              กำลังโหลดข้อมูลเมตริก...
            </Typography>
          </Box>
        ) : metricsError ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            <Typography variant="h6">ไม่สามารถโหลดข้อมูลเมตริกได้</Typography>
            <Typography variant="body2">
              Error: {metricsError instanceof Error ? metricsError.message : 'Unknown error'}
            </Typography>
          </Alert>
        ) : enhancedMetrics && enhancedMetrics.length > 0 ? (
          <Box>
            {filteredCategories.map((category) => (
              <Accordion key={category.name} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: category.color }}>
                      {getIconComponent(category.icon)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {category.display_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {category.description} • {category.metrics.length} เมตริก
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {category.metrics.map((metric) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={metric.metric_name}>
                        <Card
                          sx={{
                            height: '100%',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: `1px solid ${alpha(metric.color, 0.3)}`,
                            '&:hover': {
                              transform: 'translateY(-6px)',
                              boxShadow: `0 8px 25px ${alpha(metric.color, 0.3)}`,
                              borderColor: metric.color,
                            },
                          }}
                          onClick={() => handleMetricClick(metric.metric_name)}
                        >
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                              <Avatar sx={{ bgcolor: alpha(metric.color, 0.1), color: metric.color }}>
                                {getIconComponent(metric.icon)}
                              </Avatar>
                              <Chip size="small" label={metric.data_points.toLocaleString()} />
                            </Box>
                            
                            <Typography variant="h6" noWrap title={metric.metric_name}>
                              {metric.display_name}
                            </Typography>
                            
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                              หน่วย: {metric.unit}
                            </Typography>
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="textSecondary">
                                ข้อมูลล่าสุด: {new Date(metric.last_seen).toLocaleString('th-TH')}
                              </Typography>
                              <IconButton size="small" color="primary">
                                <ShowChart />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : enhancedMetrics && enhancedMetrics.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="h6">ไม่พบข้อมูลเมตริก</Typography>
            <Typography variant="body2">
              ไม่มีข้อมูลเมตริกสำหรับไซต์ {selectedSite} {selectedEquipment && `และอุปกรณ์ ${selectedEquipment}`}
            </Typography>
          </Alert>
        ) : null
      ) : (
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <DeviceHub sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h4" color="textSecondary" gutterBottom>
            เลือกไซต์และอุปกรณ์
          </Typography>
          <Typography variant="body1" color="textSecondary">
            กรุณาเลือกไซต์และอุปกรณ์จากแผงควบคุมด้านบนเพื่อดูข้อมูลเมตริก
          </Typography>
        </Paper>
      )}

      {/* Detailed Metric Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              📊 รายละเอียดเมตริก: {selectedDetailMetric}
            </Typography>
            <Box>
              <IconButton onClick={() => refetchMetrics()}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : detailData ? (
            <Box>
              {/* Statistics Cards */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {formatValue(detailData.statistics.latest, detailData.metric.unit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ค่าปัจจุบัน
                      </Typography>
                      <Box mt={1}>
                        {getTrendIcon(detailData.statistics.trend)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {formatValue(detailData.statistics.avg, detailData.metric.unit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ค่าเฉลี่ย
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {formatValue(detailData.statistics.max, detailData.metric.unit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ค่าสูงสุด
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {formatValue(detailData.statistics.min, detailData.metric.unit)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ค่าต่ำสุด
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Chart */}
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={3}>
                    📈 กราฟแสดงแนวโน้ม - {period} ย้อนหลัง
                  </Typography>
                  {detailData.data_points.length > 0 ? (
                    <TimeSeriesChart
                      data={detailData.data_points.map(point => ({
                        timestamp: point.timestamp,
                        value: point.value,
                        label: `${point.value.toFixed(2)} ${point.unit}`
                      }))}
                      title={`${detailData.metric.display_name} (${detailData.metric.unit})`}
                      yAxisLabel={detailData.metric.unit}
                      color={detailData.metric.color}
                    />
                  ) : (
                    <Typography>ไม่มีข้อมูลในช่วงเวลาที่เลือก</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Typography>ไม่สามารถโหลดข้อมูลได้</Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>ปิด</Button>
          <Button variant="contained" startIcon={<Download />}>
            ส่งออกข้อมูล
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => refetchMetrics()}
      >
        <Refresh />
      </Fab>
    </Container>
  );
};

export default EnhancedMetricsPage;
