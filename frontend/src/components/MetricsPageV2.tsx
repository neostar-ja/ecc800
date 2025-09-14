import React, { useState, useEffect, useCallback } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Chip, IconButton,
  Tabs, Tab, Switch, FormControlLabel,
  Button, Tooltip, Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// Type definitions for API responses
interface SiteSummary {
  site_code: string;
  device_count: number;
  metric_count: number;
  last_update: string | null;
  first_data: string | null;
  status: 'online' | 'warning' | 'offline';
}

interface Device {
  device_code: string;
  equipment_name: string;
  metric_count: number;
  category_count: number;
  last_update: string | null;
  first_data: string | null;
  status: 'online' | 'warning' | 'offline';
}

interface Metric {
  metric_name: string;
  metric_name_th: string;
  metric_name_en: string;
  unit: string;
  decimals: number;
  is_hidden: boolean;
  data_points: number;
  last_update: string | null;
  first_data: string | null;
  data_age_hours: number | null;
}

interface MetricsResponse {
  site_code: string;
  device_code: string;
  categories: Record<string, Metric[]>;
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number | null;
  data_points: number;
}

interface TimeSeries {
  metric_name: string;
  display_name: string;
  unit: string;
  category: string;
  decimals: number;
  data: TimeSeriesPoint[];
}

interface TimeSeriesResponse {
  site_code: string;
  device_code: string;
  from_time: string;
  to_time: string;
  interval: string;
  series: TimeSeries[];
  timestamps: string[];
}

interface SystemStatus {
  total_devices: number;
  total_metrics: number;
  sites: Array<{
    site_code: string;
    active_devices: number;
    active_metrics: number;
    latest_data: string | null;
    hours_since_update: number | null;
    status: 'online' | 'warning';
  }>;
}

// Type definitions for test API responses
interface TestApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

const MetricsPageV2: React.FC = () => {
  // State management
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesResponse | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // seconds
  const [fromTimeInput, setFromTimeInput] = useState<string | null>(null);
  const [toTimeInput, setToTimeInput] = useState<string | null>(null);

  // API configuration - try authenticated v2 endpoints first, fallback to public if unauthorized
  const API_BASE_V2 = '/ecc800/api/metrics/v2';
  const API_BASE_PUBLIC = '/ecc800/api/metrics/public';
  const [usePublicApi, setUsePublicApi] = useState<boolean>(false);

  const API_BASE = () => (usePublicApi ? API_BASE_PUBLIC : API_BASE_V2);

  // Set axios default Authorization header from stored token (if any)
  useEffect(() => {
    const auth = localStorage.getItem('ecc800-auth') || localStorage.getItem('token');
    let token: string | null = null;
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        token = parsed?.state?.token || parsed?.token || null;
      } catch {
        token = auth;
      }
    }

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);
  
  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Load initial data
  useEffect(() => {
    loadSystemStatus();
    loadSites();
  }, []);

  // Load devices when site changes
  useEffect(() => {
    if (selectedSite) {
      loadDevices(selectedSite);
    } else {
      setDevices([]);
      setSelectedDevice('');
    }
  }, [selectedSite]);

  // Load metrics when device changes
  useEffect(() => {
    if (selectedSite && selectedDevice) {
      loadMetrics(selectedSite, selectedDevice);
    } else {
      setMetricsData(null);
    }
  }, [selectedSite, selectedDevice, selectedCategory, showHidden]);

  // Load time series when metrics are selected
  useEffect(() => {
    if (selectedSite && selectedDevice && selectedMetrics.length > 0) {
      // If user hasn't selected a custom range, compute dynamic default from metric metadata
      if (!fromTimeInput && !toTimeInput && metricsData) {
        // gather min(first_data) and max(last_update) across selected metrics
        let minFirst: string | null = null;
        let maxLast: string | null = null;
        Object.values(metricsData.categories).forEach(arr => {
          arr.forEach((m: any) => {
            if (selectedMetrics.includes(m.metric_name)) {
              if (m.first_data) {
                if (!minFirst || new Date(m.first_data) < new Date(minFirst)) minFirst = m.first_data;
              }
              if (m.last_update) {
                if (!maxLast || new Date(m.last_update) > new Date(maxLast)) maxLast = m.last_update;
              }
            }
          });
        });

        // Default to last 7 days if no metadata available
        const to = maxLast ? new Date(maxLast) : new Date();
        const from = minFirst ? new Date(minFirst) : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

        setFromTimeInput(from.toISOString().slice(0,16)); // 'YYYY-MM-DDTHH:mm'
        setToTimeInput(to.toISOString().slice(0,16));
        loadTimeSeries(selectedSite, selectedDevice, selectedMetrics, from.toISOString(), to.toISOString());
      } else {
        loadTimeSeries(selectedSite, selectedDevice, selectedMetrics, fromTimeInput ?? undefined, toTimeInput ?? undefined);
      }
    } else {
      setTimeSeriesData(null);
    }
  }, [selectedSite, selectedDevice, selectedMetrics]);

  // API functions
  const loadSystemStatus = async () => {
    try {
      const response = await axios.get<SystemStatus>(`${API_BASE()}/status`);
      setSystemStatus(response.data);
    } catch (err: any) {
      // If unauthorized or forbidden, fallback to public API
      if (err?.response && (err.response.status === 401 || err.response.status === 403)) {
        console.info('Authenticated API returned 401/403, falling back to public endpoints');
        setUsePublicApi(true);
        try {
          const r2 = await axios.get<SystemStatus>(`${API_BASE_PUBLIC}/status`);
          setSystemStatus(r2.data);
        } catch (e2) {
          console.error('Error loading system status from public endpoint:', e2);
        }
      } else {
        console.error('Error loading system status:', err);
      }
    }
  };

  const loadSites = async () => {
    try {
      setLoading(true);
      try {
        const response = await axios.get<SiteSummary[]>(`${API_BASE()}/sites`);
        setSites(response.data);
      } catch (err: any) {
        if (err?.response && (err.response.status === 401 || err.response.status === 403)) {
          setUsePublicApi(true);
          const r2 = await axios.get<SiteSummary[]>(`${API_BASE_PUBLIC}/sites`);
          setSites(r2.data);
        } else {
          throw err;
        }
      }
      
      // Auto-select first site if available
      if (sites.length > 0 && !selectedSite) {
        setSelectedSite(sites[0].site_code);
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลไซต์ได้');
      console.error('Error loading sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async (siteCode: string) => {
    try {
  const response = await axios.get<Device[]>(`${API_BASE()}/devices`, {
        params: { site_code: siteCode }
      });
  setDevices(response.data);
      
      // Auto-select first device if available
      if (response.data.length > 0 && !selectedDevice) {
        setSelectedDevice(response.data[0].device_code);
      }
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
      console.error('Error loading devices:', err);
    }
  };

  const loadMetrics = async (siteCode: string, deviceCode: string) => {
    try {
      const params: any = { 
        site_code: siteCode, 
        device_code: deviceCode,
        include_hidden: showHidden
      };
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
  const response = await axios.get<MetricsResponse>(`${API_BASE()}/metrics`, { params });
  setMetricsData(response.data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลเมทริกได้');
      console.error('Error loading metrics:', err);
    }
  };

  const loadTimeSeries = async (siteCode: string, deviceCode: string, metrics: string[], fromTime?: string, toTime?: string) => {
    try {
      // Use a time range that has actual data (last 7 days from latest data)
      const toTime = new Date('2025-08-29T10:00:00Z'); // Latest data time
      const fromTime = new Date('2025-08-22T10:00:00Z'); // 7 days before
      
      const params: any = {
        site_code: siteCode,
        device_code: deviceCode,
        metrics: metrics.join(','),
        interval: 'auto'
      };
      if (fromTime) params.from_time = fromTime;
      if (toTime) params.to_time = toTime;

  const response = await axios.get<TimeSeriesResponse>(`${API_BASE()}/timeseries`, { params });
  setTimeSeriesData(response.data as TimeSeriesResponse);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูล time-series ได้');
      console.error('Error loading time series:', err);
    }
  };

  const handleRefresh = useCallback(() => {
    loadSystemStatus();
    if (selectedSite) {
      loadDevices(selectedSite);
      if (selectedDevice) {
        loadMetrics(selectedSite, selectedDevice);
        if (selectedMetrics.length > 0) {
          loadTimeSeries(selectedSite, selectedDevice, selectedMetrics);
        }
      }
    }
  }, [selectedSite, selectedDevice, selectedCategory, showHidden, selectedMetrics]);

  const handleMetricToggle = (metricName: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricName) 
        ? prev.filter(m => m !== metricName)
        : [...prev, metricName]
    );
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'offline': return <ErrorIcon color="error" />;
      default: return <SpeedIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'warning': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'ไม่ระบุ';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'น้อยกว่า 1 ชั่วโมง';
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  };

  const getCategories = () => {
    if (!metricsData) return [];
    return Object.keys(metricsData.categories);
  };

  // Render functions
  const renderSystemOverview = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <SpeedIcon color="primary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{systemStatus?.total_devices || 0}</Typography>
                <Typography color="textSecondary">อุปกรณ์ทั้งหมด</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <TimelineIcon color="secondary" sx={{ mr: 1 }} />
              <Box>
                <Typography variant="h4">{systemStatus?.total_metrics || 0}</Typography>
                <Typography color="textSecondary">เมทริกทั้งหมด</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {systemStatus?.sites.map(site => (
        <Grid item xs={12} md={3} key={site.site_code}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{site.site_code.toUpperCase()}</Typography>
                  <Typography variant="body2">{site.active_devices} อุปกรณ์</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatTimeAgo(site.latest_data)}
                  </Typography>
                </Box>
                <Chip
                  icon={getStatusIcon(site.status)}
                  label={site.status}
                  color={getStatusColor(site.status) as any}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderControls = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>ไซต์</InputLabel>
              <Select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                label="ไซต์"
              >
                {sites.map(site => (
                  <MenuItem key={site.site_code} value={site.site_code}>
                    <Box display="flex" alignItems="center" width="100%">
                      {getStatusIcon(site.status)}
                      <Box ml={1}>
                        <Typography>{site.site_code.toUpperCase()}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {site.device_count} อุปกรณ์
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth disabled={!selectedSite}>
              <InputLabel>อุปกรณ์</InputLabel>
              <Select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                label="อุปกรณ์"
              >
                {devices
                  .sort((a: any, b: any) => a.equipment_name.localeCompare(b.equipment_name, undefined, { numeric: true, sensitivity: 'base' }))
                  .map(device => {
                    const rawName = device.equipment_name || '';
                    const name = rawName.replace(/\(\s*\)/g, '').trim();
                    return (
                      <MenuItem key={device.device_code} value={device.device_code}>
                        <Box display="flex" alignItems="center" width="100%">
                          {getStatusIcon(device.status)}
                          <Box ml={1}>
                            <Typography>{name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {device.metric_count}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })
                }
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth disabled={!metricsData}>
              <InputLabel>หมวดหมู่</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="หมวดหมู่"
              >
                <MenuItem value="all">ทั้งหมด</MenuItem>
                {getCategories().map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={showHidden} 
                    onChange={(e) => setShowHidden(e.target.checked)}
                  />
                }
                label="แสดงเมทริกที่ซ่อน"
              />
              
              <Tooltip title="รีเฟรชข้อมูล">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="รีเฟรชอัตโนมัติ"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1}>
              <input
                type="datetime-local"
                value={fromTimeInput ?? ''}
                onChange={(e) => setFromTimeInput(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <input
                type="datetime-local"
                value={toTimeInput ?? ''}
                onChange={(e) => setToTimeInput(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (selectedSite && selectedDevice && selectedMetrics.length > 0) {
                    const from = fromTimeInput ? new Date(fromTimeInput).toISOString() : undefined;
                    const to = toTimeInput ? new Date(toTimeInput).toISOString() : undefined;
                    loadTimeSeries(selectedSite, selectedDevice, selectedMetrics, from, to);
                  }
                }}
              >
                ใช้ช่วงเวลา
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderMetricsList = () => {
    if (!metricsData) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            เมทริกของอุปกรณ์ {devices.find(d => d.device_code === selectedDevice)?.equipment_name}
          </Typography>
          
          {Object.entries(metricsData.categories).map(([category, metrics]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                {category} ({metrics.length} เมทริก)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {metrics.map(metric => (
                  <Grid item xs={12} sm={6} md={4} key={metric.metric_name}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedMetrics.includes(metric.metric_name) ? 2 : 1,
                        borderColor: selectedMetrics.includes(metric.metric_name) ? 'primary.main' : 'divider'
                      }}
                      onClick={() => handleMetricToggle(metric.metric_name)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="subtitle2" noWrap>
                              {metric.metric_name_th}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {metric.metric_name}
                            </Typography>
                            <Box mt={1}>
                              <Chip 
                                label={metric.unit || 'ไม่ระบุหน่วย'} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                          
                          <Box textAlign="right">
                            <Typography variant="caption" display="block">
                              {metric.data_points?.toLocaleString()} จุดข้อมูล
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {formatTimeAgo(metric.last_update)}
                            </Typography>
                            {metric.is_hidden && (
                              <Chip label="ซ่อน" size="small" color="warning" />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderTimeSeriesChart = () => {
    if (!timeSeriesData || timeSeriesData.series.length === 0) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>กราฟข้อมูล Time-series</Typography>
            <Alert severity="info">
              เลือกเมทริกที่ต้องการดูกราฟ (คลิกที่การ์ดเมทริก)
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Transform data for chart
    const chartData: any[] = [];
    const timeSet = new Set<string>();
    
    // Collect all timestamps
    timeSeriesData.series.forEach(series => {
      series.data.forEach(point => {
        timeSet.add(point.timestamp);
      });
    });
    
    // Create chart data points
    const sortedTimes = Array.from(timeSet).sort();
    sortedTimes.forEach(timestamp => {
      const dataPoint: any = { timestamp: new Date(timestamp).toLocaleString('th-TH') };
      
      timeSeriesData.series.forEach(series => {
        const point = series.data.find(p => p.timestamp === timestamp);
        dataPoint[series.display_name] = point?.value || null;
      });
      
      chartData.push(dataPoint);
    });

    // Generate colors for lines
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            กราฟข้อมูล Time-series ({timeSeriesData.interval})
          </Typography>
          
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                {timeSeriesData.series.map((series, index) => (
                  <Line
                    key={series.metric_name}
                    type="monotone"
                    dataKey={series.display_name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
          
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              ช่วงเวลา: {new Date(timeSeriesData.from_time).toLocaleString('th-TH')} - {new Date(timeSeriesData.to_time).toLocaleString('th-TH')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>กำลังโหลดข้อมูล...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        ECC800 Metrics Dashboard - เวอร์ชันใหม่
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {renderSystemOverview()}
      {renderControls()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="รายการเมทริก" />
          <Tab label="กราฟข้อมูล" disabled={!timeSeriesData} />
        </Tabs>
      </Box>

      {tabValue === 0 && renderMetricsList()}
      {tabValue === 1 && renderTimeSeriesChart()}
    </Box>
  );
};

export default MetricsPageV2;
