import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  IconButton,
  Chip,
  Button,
  Paper,
  Avatar,
  Divider,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Select,
  FormControl,
  InputLabel,
  Skeleton,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh,
  ShowChart,
  Thermostat,
  Opacity,
  ElectricBolt,
  Computer,
  Sensors,
  Assessment,
  Download,
  Speed,
  Battery90,
  CheckCircle,
  CalendarMonth,
  Schedule,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

import { useSites } from '../lib/hooks';
import { useAuthStore } from '../stores/authStore';
import TimeSeriesChart from '../components/TimeSeriesChart';
import MetricChart from '../components/MetricChart';
import AdvancedMetricAnalysis from '../components/AdvancedMetricAnalysis';
import { apiGet } from '../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toBangkokTime, toBangkokDate } from '../lib/dateUtils';

// Types
interface MetricInfo {
  metric_name: string;
  display_name: string;
  unit: string;
  data_points: number;
  valid_readings: number;
  first_seen?: string;
  last_seen?: string;
  latest_value?: number;
  latest_time?: string;
  avg_value?: number;
  min_value?: number;
  max_value?: number;
  category: string;
  description: string;
  icon: string;
  color: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
}

interface MetricsResponse {
  metrics: MetricInfo[];
  total_count: number;
  site_code?: string;
  equipment_id?: string;
  time_range?: {
    period: string;
    from_time: string;
    to_time: string;
    custom_range: boolean;
  };
}

interface Equipment {
  site_code: string;
  equipment_id: string;
  display_name: string;
  metric_count: number;
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

interface ChartConfig {
  type: 'line' | 'area' | 'column';
  color: string;
  y_axis: any;
  x_axis: any;
  tooltip: any;
  animation: any;
  legend: any;
  grid: any;
}

interface DetailedMetric {
  metric: MetricInfo;
  statistics: MetricStats;
  data_points: Array<{
    timestamp: string;
    value: number;
    min_val?: number;
    max_val?: number;
    sample_count?: number;
    unit: string;
  }>;
  time_range: {
    from: string;
    to: string;
    interval: string;
    period: string;
  };
  site_code: string;
  equipment_id: string;
  chart_config: ChartConfig;
}

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  '🌡️': Thermostat,
  '💧': Opacity,
  '⚡': ElectricBolt,
  '🔌': ElectricBolt,
  '🔋': Battery90,
  '📊': Assessment,
  '🚦': Sensors,
  '📈': ShowChart,
};

const TREND_ICON_META: Record<string, { Icon: typeof TrendingFlat; color: 'success' | 'error' | 'info' | 'disabled' }> = {
  increasing: { Icon: TrendingUp, color: 'success' },
  decreasing: { Icon: TrendingDown, color: 'error' },
  stable: { Icon: TrendingFlat, color: 'info' },
  unknown: { Icon: TrendingFlat, color: 'disabled' },
};

const TREND_LABELS: Record<string, string> = {
  increasing: 'เพิ่มขึ้น',
  decreasing: 'ลดลง',
  stable: 'คงที่',
  unknown: 'ไม่ทราบแนวโน้ม',
};

const formatMetricValue = (value: number | null | undefined, unit: string) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  const safeUnit = String(unit || '');
  return `${value.toFixed(2)} ${safeUnit}`;
};

interface MetricCardProps {
  metric: MetricInfo;
  onClick: (metricName: string) => void;
}

const MetricCardComponent: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  const theme = useTheme();
  
  // Safely get icon component with fallback
  const icon = String(metric.icon || '📊');
  const IconComponent = ICON_COMPONENTS[icon] || Timeline;
  
  // Safely get trend info with fallback
  const trend = String(metric.trend || 'unknown');
  const trendInfo = TREND_ICON_META[trend] || TREND_ICON_META.unknown;
  const TrendIcon = trendInfo.Icon;
  const trendColor = trendInfo.color;
  const trendLabel = TREND_LABELS[trend] || TREND_LABELS.unknown;
  
  // Safely get color with fallback
  const accentColor = metric.color || theme.palette.primary.main;

  const handleCardClick = useCallback(() => onClick(metric.metric_name), [metric.metric_name, onClick]);

  const latestDisplay = useMemo(() => {
    if (metric.latest_value === undefined || metric.latest_value === null) {
      return null;
    }
    return formatMetricValue(metric.latest_value, metric.unit);
  }, [metric.latest_value, metric.unit]);

  const latestTimestamp = useMemo(() => {
    if (!metric.latest_time) return null;
    return toBangkokTime(metric.latest_time);
  }, [metric.latest_time]);

  const rangeDisplay = useMemo(() => {
    if (
      metric.min_value === undefined ||
      metric.min_value === null ||
      metric.max_value === undefined ||
      metric.max_value === null
    ) {
      return null;
    }
    return `${formatMetricValue(metric.min_value, metric.unit)} - ${formatMetricValue(metric.max_value, metric.unit)}`;
  }, [metric.max_value, metric.min_value, metric.unit]);

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(accentColor, 0.3)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(accentColor, 0.3)}`,
          borderColor: accentColor,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Avatar sx={{ bgcolor: alpha(accentColor, 0.1), color: accentColor }}>
            <IconComponent />
          </Avatar>
          <Box textAlign="right">
            <Chip size="small" label={String(metric.valid_readings?.toLocaleString() || '0')} title="จำนวนข้อมูลที่ถูกต้อง" />
          </Box>
        </Box>

        <Typography variant="h6" noWrap title={String(metric.metric_name)} gutterBottom>
          {String(metric.display_name || metric.metric_name || 'Unknown')}
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          หน่วย: {String(metric.unit || 'N/A')}
        </Typography>

        {latestDisplay ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {latestDisplay}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TrendIcon color={trendColor} />
              <Typography variant="caption" color="textSecondary">
                {trendLabel}
              </Typography>
            </Box>
            {latestTimestamp && (
              <Typography variant="caption" color="textSecondary" display="block">
                อัพเดต: {latestTimestamp}
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" color="textSecondary" fontWeight="bold">
              ไม่มีข้อมูล
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ยังไม่มีค่าล่าสุด
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          {metric.avg_value !== undefined && metric.avg_value !== null && (
            <Typography variant="body2" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
              📊 เฉลี่ย: <strong>{formatMetricValue(metric.avg_value, metric.unit)}</strong>
            </Typography>
          )}

          {rangeDisplay && (
            <Typography variant="body2" color="textSecondary" display="block" sx={{ mb: 0.5 }}>
              📈 ช่วง: {rangeDisplay}
            </Typography>
          )}

          <Typography variant="body2" color="success.main" display="block" sx={{ mb: 0.5 }}>
            ✅ ข้อมูลถูกต้อง: <strong>{String(metric.valid_readings?.toLocaleString() || '0')}</strong> จุด
          </Typography>

          <Typography variant="body2" color="info.main" display="block">
            📦 ข้อมูลทั้งหมด: <strong>{String(metric.data_points?.toLocaleString() || '0')}</strong> จุด
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {metric.first_seen && metric.last_seen
              ? `ช่วงข้อมูล: ${toBangkokDate(metric.first_seen)} - ${toBangkokDate(metric.last_seen)}`
              : 'ไม่มีข้อมูลช่วงเวลา'}
          </Typography>
          <IconButton
            size="small"
            color="primary"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <ShowChart />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

const MetricCard = MetricCardComponent;

const ImprovedMetricsPage: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // States
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedMetricFilter, setSelectedMetricFilter] = useState<string>('');
  const [period, setPeriod] = useState<string>('24h');
  // Draft values (edited by user)
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate] = useState<string>('');
  // Applied values (used for queries)
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedDetailMetric, setSelectedDetailMetric] = useState<string>('');
  const [exporting, setExporting] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch data
  // Auto-enable sites loading on mount to prevent race condition
  const [sitesEnabled, setSitesEnabled] = useState<boolean>(true);
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useSites({ enabled: sitesEnabled });
  
  // Fetch equipment for selected site with aggressive caching
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['site-equipment', selectedSite],
    queryFn: () => apiGet<Equipment[]>(`/sites/${selectedSite}/equipment`),
    enabled: !!selectedSite,
    staleTime: 10 * 60 * 1000, // 10 minutes - equipment rarely changes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  // Enhanced metrics data - only fetch when equipment is selected
  const { 
    data: metricsData, 
    isLoading: metricsLoading, 
    refetch: refetchMetrics, 
    error: metricsError 
  } = useQuery({
    queryKey: ['enhanced-metrics', selectedSite, selectedEquipment, period, appliedStartDate, appliedEndDate],
    queryFn: () => {
      const params: any = {};
      if (selectedSite) params.site_code = selectedSite;
      if (selectedEquipment) params.equipment_id = selectedEquipment;
      if (period) params.period = period;
      if (period === 'custom' && appliedStartDate && appliedEndDate) {
        params.start_time = appliedStartDate;
        params.end_time = appliedEndDate;
      }
      params._ts = Date.now();
      return apiGet<MetricsResponse>('/enhanced-metrics', params);
    },
    enabled: !!(selectedSite && selectedEquipment), // Only fetch when both site and equipment are selected
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 0, // ข้อมูลเก่าทันที บังคับ refetch
    gcTime: 0, // ไม่เก็บ cache (gcTime แทน cacheTime ใน react-query v5)
    retry: 2,
  });

  // Detailed metric data
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['metric-details', selectedDetailMetric, selectedSite, selectedEquipment, period, appliedStartDate, appliedEndDate],
    queryFn: () => {
      const params: any = {
        metric_name: selectedDetailMetric,
        site_code: selectedSite,
        equipment_id: selectedEquipment,
        period: period,
      };
      if (period === 'custom' && appliedStartDate && appliedEndDate) {
        params.start_time = appliedStartDate;
        params.end_time = appliedEndDate;
      }
      params._ts = Date.now();
      return apiGet<DetailedMetric>('/metric/details', params);
    },
    enabled: !!(selectedDetailMetric && selectedSite && selectedEquipment),
    staleTime: 0, // ข้อมูลเก่าทันที บังคับ refetch
    gcTime: 0, // ไม่เก็บ cache
  });

  // Auto-refresh effect
  useEffect(() => {
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

  // Prefill custom range when user selects custom period
  useEffect(() => {
    if (period === 'custom') {
      const fmtLocal = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      if (!draftEndDate) {
        const now = new Date();
        setDraftEndDate(fmtLocal(now));
      }
      if (!draftStartDate) {
        const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        setDraftStartDate(fmtLocal(anHourAgo));
      }
    }
  }, [period]);

  // Prefetch equipment when user opens site dropdown
  const handleSiteDropdownOpen = useCallback(() => {
    // If we have sites, prefetch equipment for each site to make dropdown loading instant
    if (sites && sites.length > 0) {
      sites.forEach(site => {
        queryClient.prefetchQuery({
          queryKey: ['site-equipment', site.site_code],
          queryFn: () => apiGet<Equipment[]>(`/sites/${site.site_code}/equipment`),
          staleTime: 10 * 60 * 1000,
        });
      });
    }
  }, [sites, queryClient]);

  // Helper functions
  const handleMetricClick = useCallback((metricName: string) => {
    if (!selectedEquipment) {
      setSnackbar({
        open: true,
        message: 'กรุณาเลือกอุปกรณ์ก่อนดูรายละเอียดเมตริก',
        severity: 'warning'
      });
      return;
    }
    
    // Now enable the dialog since we've improved the API
    setSelectedDetailMetric(metricName);
    setDetailDialogOpen(true);
  }, [selectedEquipment]);

  // Handle site selection
  const handleSiteChange = (siteCode: string) => {
    setSelectedSite(siteCode);
    setSelectedEquipment(''); // Clear equipment when site changes
    setSelectedMetricFilter(''); // Clear metric filter when site changes
  };

  // Handle equipment selection
  const handleEquipmentChange = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    setSelectedMetricFilter(''); // Clear metric filter when equipment changes
  };

  // Filter metrics based on selected metric filter
  const filteredMetrics = useMemo(() => {
    const metrics = metricsData?.metrics ?? [];
    if (!selectedMetricFilter) {
      return metrics;
    }
    const query = selectedMetricFilter.toLowerCase();
    return metrics.filter((metric) => {
      const name = metric.metric_name?.toLowerCase?.() ?? '';
      const display = metric.display_name?.toLowerCase?.() ?? '';
      return name.includes(query) || display.includes(query);
    });
  }, [metricsData, selectedMetricFilter]);

  // IMPORTANT: These hooks MUST be called before any conditional returns
  // to comply with React's Rules of Hooks
  const selectedSiteInfo = useMemo(() => {
    if (!sites || !selectedSite) return undefined;
    return sites.find((s) => s.site_code === selectedSite);
  }, [sites, selectedSite]);

  const selectedEquipmentInfo = useMemo(() => {
    if (!equipment || !selectedEquipment) return undefined;
    return equipment.find((eq) => eq.equipment_id === selectedEquipment);
  }, [equipment, selectedEquipment]);

  // Loading state - wait for sites to load completely
  if (sitesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 3, mt: 2 }}>
            กำลังโหลดข้อมูลระบบ...
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            กำลังโหลดรายการไซต์และอุปกรณ์
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state - show error if sites failed to load
  if (sitesError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            ⚠️ ไม่สามารถโหลดข้อมูลระบบได้
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {sitesError instanceof Error ? sitesError.message : 'Unknown error'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            โหลดใหม่อีกครั้ง
          </Button>
        </Box>
      </Container>
    );
  }

  // Ensure sites data exists
  if (!sites || sites.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" flexDirection="column">
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            📊 ไม่พบข้อมูลไซต์ในระบบ
          </Typography>
          <Typography variant="body2" color="textSecondary">
            กรุณาติดต่อผู้ดูแลระบบ
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              📊 Metrics Analytics
            </Typography>
            <Typography variant="h6" color="textSecondary">
              ระบบวิเคราะห์เมตริกแบบเรียลไทม์ - เลือกไซต์และอุปกรณ์เพื่อดูข้อมูล
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label="Auto Refresh"
            />
            <IconButton onClick={() => refetchMetrics()} disabled={metricsLoading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        {/* Control Panel */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>🏢 เลือกไซต์</InputLabel>
                <Select
                  value={selectedSite}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  label="🏢 เลือกไซต์"
                >
                  <MenuItem value="">-- เลือกไซต์ --</MenuItem>
                  {sites?.map((site) => {
                    const siteName = String(site.site_name || site.site_code || 'Unknown');
                    const siteCode = String(site.site_code || '').toUpperCase();
                    return (
                      <MenuItem key={site.site_code} value={site.site_code}>
                        {siteName} ({siteCode})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>🔧 เลือกอุปกรณ์</InputLabel>
                <Select
                  value={selectedEquipment}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  label="🔧 เลือกอุปกรณ์"
                  disabled={!selectedSite}
                >
                  <MenuItem value="">-- เลือกอุปกรณ์ --</MenuItem>
                  {equipmentLoading ? (
                    <MenuItem disabled>กำลังโหลด...</MenuItem>
                  ) : (
                    equipment
                      ?.sort((a: any, b: any) => {
                        const nameA = String(a.display_name || a.equipment_id || '');
                        const nameB = String(b.display_name || b.equipment_id || '');
                        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
                      })
                      .map((eq) => {
                        const rawName = String(eq.display_name || eq.equipment_id || '');
                        const name = rawName.replace(/\(\s*\)/g, '').trim();
                        const count = eq.metric_count != null ? String(eq.metric_count) : '';
                        return (
                          <MenuItem key={eq.equipment_id} value={eq.equipment_id}>
                            {name}{count ? ` ${count}` : ''}
                          </MenuItem>
                        );
                      })
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>📊 เลือกเมตริก</InputLabel>
                <Select
                  value={selectedMetricFilter}
                  onChange={(e) => setSelectedMetricFilter(e.target.value)}
                  label="📊 เลือกเมตริก"
                  disabled={!selectedEquipment}
                >
                  <MenuItem value="">-- แสดงเมตริกทั้งหมด --</MenuItem>
                  {metricsData?.metrics.map((metric) => {
                    const displayName = String(metric.display_name || metric.metric_name || '');
                    const unit = String(metric.unit || '');
                    return (
                      <MenuItem key={metric.metric_name} value={metric.metric_name}>
                        {displayName} ({unit})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>⏰ ช่วงเวลา</InputLabel>
                <Select
                value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  label="⏰ ช่วงเวลา"
                >
                  <MenuItem value="1h">1 ชั่วโมง</MenuItem>
                  <MenuItem value="4h">4 ชั่วโมง</MenuItem>
                  <MenuItem value="24h">24 ชั่วโมง</MenuItem>
                  <MenuItem value="3d">3 วัน</MenuItem>
                  <MenuItem value="7d">7 วัน</MenuItem>
                  <MenuItem value="30d">30 วัน</MenuItem>
                  <MenuItem value="custom">📅 กำหนดเอง</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Date Range Fields - Modern styled with MUI + Tailwind */}
            {period === 'custom' && (
              <Grid item xs={12}>
                <Paper elevation={0} className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl" sx={{ p: { xs: 2, md: 3 } }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="เริ่มต้น (วันที่และเวลา)"
                        type="datetime-local"
                        value={draftStartDate}
                        onChange={(e) => setDraftStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarMonth fontSize="small" color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="เลือกวันและเวลาเริ่มต้น"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="สิ้นสุด (วันที่และเวลา)"
                        type="datetime-local"
                        value={draftEndDate}
                        onChange={(e) => setDraftEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Schedule fontSize="small" color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        helperText="เลือกวันและเวลาสิ้นสุด"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CheckCircle />}
                        className="shadow-md"
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          py: 1.1,
                        }}
                        disabled={!(draftStartDate && draftEndDate && new Date(draftStartDate) <= new Date(draftEndDate))}
                        onClick={() => {
                          setAppliedStartDate(draftStartDate);
                          setAppliedEndDate(draftEndDate);
                          refetchMetrics();
                        }}
                      >
                        ตกลง
                      </Button>
                    </Grid>

                    {draftStartDate && draftEndDate && new Date(draftStartDate) > new Date(draftEndDate) && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="error">
                          ช่วงเวลาไม่ถูกต้อง: เวลาเริ่มต้นควรไม่มากกว่าเวลาสิ้นสุด
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Selection Summary */}
          {selectedSite && (
            <Box mt={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={<Computer />}
                  label={`ไซต์: ${String(selectedSiteInfo?.site_name ?? selectedSite).toUpperCase()} (${String(selectedSite).toUpperCase()})`}
                  color="primary"
                  variant="filled"
                />
                {selectedEquipment && (
                  <Chip
                    icon={<Sensors />}
                    label={`อุปกรณ์: ${String(selectedEquipmentInfo?.display_name ?? selectedEquipment)}`}
                    color="secondary"
                    variant="filled"
                  />
                )}
                {selectedEquipment && metricsData && (
                  <Chip
                    icon={<Assessment />}
                    label={`${String(filteredMetrics.length || 0)}/${String(metricsData.total_count || 0)} เมตริก`}
                    color="success"
                    variant="outlined"
                  />
                )}
                {selectedEquipment && period && (
                  <Chip
                    icon={<Speed />}
                    label={period === 'custom' && appliedStartDate && appliedEndDate ? 
                      `${new Date(appliedStartDate).toLocaleString('th-TH')} - ${new Date(appliedEndDate).toLocaleString('th-TH')}` :
                      period === '1h' ? '1 ชั่วโมง' :
                      period === '4h' ? '4 ชั่วโมง' :
                      period === '24h' ? '24 ชั่วโมง' :
                      period === '3d' ? '3 วัน' :
                      period === '7d' ? '7 วัน' :
                      period === '30d' ? '30 วัน' : period
                    }
                    color="warning"
                    variant="outlined"
                  />
                )}
                {selectedEquipment && selectedMetricFilter && (
                  <Chip
                    icon={<ShowChart />}
                    label={`กรอง: ${selectedMetricFilter}`}
                    color="info"
                    variant="filled"
                    onDelete={() => setSelectedMetricFilter('')}
                  />
                )}
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Metrics Display */}
      {selectedSite && selectedEquipment ? (
        metricsLoading ? (
          <Box>
            <Typography variant="h6" gutterBottom>กำลังโหลดข้อมูลเมตริก...</Typography>
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="rectangular" width={60} height={20} />
                      </Box>
                      <Skeleton variant="text" sx={{ fontSize: '1.2rem' }} />
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : metricsError ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            <Typography variant="h6">ไม่สามารถโหลดข้อมูลเมตริกได้</Typography>
            <Typography variant="body2">
              Error: {metricsError instanceof Error ? metricsError.message : 'Unknown error'}
            </Typography>
          </Alert>
        ) : metricsData && filteredMetrics.length > 0 ? (
          <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              📈 เมตริกที่เลือก ({String(filteredMetrics.length || 0)} จาก {String(metricsData.total_count || 0)} รายการ)
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
              {selectedEquipment
                ? `แสดงเฉพาะเมตริกของอุปกรณ์: ${String(selectedEquipmentInfo?.display_name ?? selectedEquipment)}`
                : 'แสดงเมตริกทั้งหมดในไซต์'
              }
              {selectedMetricFilter && ` - กรองด้วย: "${String(selectedMetricFilter)}"`}
            </Typography>

            <Grid container spacing={3}>
              {filteredMetrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={metric.metric_name}>
                  <MetricCard metric={metric} onClick={handleMetricClick} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : metricsData && metricsData.metrics.length > 0 && filteredMetrics.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="h6">ไม่พบเมตริกที่ตรงกับการค้นหา</Typography>
            <Typography variant="body2">
              ไม่มีเมตริกที่ตรงกับการกรอง "{String(selectedMetricFilter)}" - ลองใช้คำค้นหาอื่น หรือล้างตัวกรอง
            </Typography>
          </Alert>
        ) : metricsData && metricsData.metrics.length === 0 ? (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="h6">ไม่พบข้อมูลเมตริก</Typography>
            <Typography variant="body2">
              ไม่มีข้อมูลเมตริกสำหรับ {selectedEquipment ? 'อุปกรณ์นี้' : 'ไซต์นี้'}
              {!selectedEquipment && ' (ลองเลือกอุปกรณ์เฉพาะเจาะจง)'}
            </Typography>
          </Alert>
        ) : null
      ) : selectedSite && !selectedEquipment ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
          <Sensors sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" color="warning.main" gutterBottom fontWeight="bold">
            เลือกอุปกรณ์เพื่อดูเมตริก
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            คุณได้เลือกไซต์ "<strong>{String(selectedSiteInfo?.site_name ?? selectedSite).toUpperCase()}</strong>" แล้ว
          </Typography>
          <Typography variant="body2" color="textSecondary">
            กรุณาเลือกอุปกรณ์จาก dropdown ด้านบนเพื่อดูข้อมูลเมตริกเฉพาะเจาะจง
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
            💡 การไม่โหลดเมตริกตอนเลือกไซต์เท่านั้น จะช่วยลดการใช้งานทรัพยากรและเพิ่มความเร็ว
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Computer sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h4" color="textSecondary" gutterBottom>
            เลือกไซต์เพื่อเริ่มต้น
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
            กรุณาเลือกไซต์จากแผงควบคุมด้านบนเพื่อดูรายการอุปกรณ์
          </Typography>
          <Typography variant="body2" color="textSecondary">
            หลังจากเลือกไซต์และอุปกรณ์แล้ว จะแสดงข้อมูลเมตริกโดยละเอียด
          </Typography>
        </Paper>
      )}

      {/* Detailed Metric Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              📊 รายละเอียดเมตริก: {selectedDetailMetric}
            </Typography>
            <IconButton onClick={() => refetchMetrics()}>
              <Refresh />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : detailData ? (
            <AdvancedMetricAnalysis
              data={detailData}
              onClose={() => setDetailDialogOpen(false)}
              context={{
                site_code: selectedSite,
                equipment_id: selectedEquipment,
                equipment_name: selectedEquipmentInfo?.display_name,
                metric_name: detailData.metric?.display_name || selectedDetailMetric,
              }}
            />
          ) : (
            <Typography>ไม่สามารถโหลดข้อมูลได้</Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>ปิด</Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            title="ส่งออก Excel"
            disabled={!selectedDetailMetric || exporting}
            onClick={async () => {
              try {
                if (!selectedDetailMetric || !selectedSite || !selectedEquipment) return;
                setExporting(true);
                // Always fetch high-resolution (1h) for export
                const params: any = {
                  metric_name: selectedDetailMetric,
                  site_code: selectedSite,
                  equipment_id: selectedEquipment,
                  period: period,
                  interval: '1h',
                };
                if (period === 'custom' && appliedStartDate && appliedEndDate) {
                  params.start_time = appliedStartDate;
                  params.end_time = appliedEndDate;
                }
                const fullData = await apiGet<DetailedMetric>('/metric/details', params);

                const site = selectedSite || '';
                const equipId = selectedEquipment || '';
                const equipName = selectedEquipmentInfo?.display_name || '';
                const metricDisp = fullData.metric?.display_name || selectedDetailMetric || '';

                const escapeCsvField = (v: any) => {
                  if (v === null || v === undefined) return '';
                  const s = String(v);
                  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
                };
                const human = (ts: string) => {
                  try {
                    const d = new Date(ts);
                    return d.toLocaleString('th-TH', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                  } catch {
                    return ts;
                  }
                };
                const toCompactTs = (iso: string) => {
                  try {
                    const d = new Date(iso);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    return (
                      d.getFullYear().toString() +
                      pad(d.getMonth() + 1) +
                      pad(d.getDate()) +
                      pad(d.getHours()) +
                      pad(d.getMinutes())
                    );
                  } catch {
                    return iso.replace(/\D/g, '').slice(0, 12) || 'time';
                  }
                };

                const header = ['time', 'site', 'equipment', 'metric', 'value', 'unit', 'interval', 'period'];
                const rows: string[] = [header.join(',')];
                for (const p of fullData.data_points) {
                  rows.push([
                    escapeCsvField(human(p.timestamp as any)),
                    escapeCsvField(site),
                    escapeCsvField(equipName || equipId),
                    escapeCsvField(metricDisp),
                    escapeCsvField(p.value),
                    escapeCsvField(p.unit ?? ''),
                    escapeCsvField(fullData.time_range.interval || ''),
                    escapeCsvField(fullData.time_range.period || period),
                  ].join(','));
                }

                const fromTs = toCompactTs(fullData.time_range.from);
                const toTs = toCompactTs(fullData.time_range.to);
                const filename = `${site || 'site'}_${(equipName || equipId || 'equip')}_${fullData.metric.metric_name}_1h_${fromTs}_${toTs}.csv`;
                const content = '\ufeff' + rows.join('\n');

                const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert('ไม่สามารถส่งออก CSV ได้');
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'กำลังส่งออก...' : 'ส่งออก Excel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => refetchMetrics()}
        disabled={metricsLoading}
      >
        <Refresh />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ImprovedMetricsPage;
