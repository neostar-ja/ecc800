import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Fade,
  Zoom,
  Container,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Router as RouterIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Update as UpdateIcon,
  Schedule as ScheduleIcon,
  Power as PowerIcon,
  PowerOff as PowerOffIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Download as Download,
  Computer,
  AcUnit,
  Router,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  ContactSupport,
  Article,
  Security
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import UnifiedAdminManagement from '../components/UnifiedAdminManagement';
import TimeSeriesChart from '../components/TimeSeriesChart';
import ElectricityRateManagement from '../components/ElectricityRateManagement';

// Add custom CSS animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Helper: format date-time to Thai locale
const formatDT = (v: any, withSeconds: boolean = true) => {
  try {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    const opts: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
    };
    return d.toLocaleString('th-TH', opts);
  } catch {
    return String(v || '-');
  }
};
interface SystemInfo {
  timestamp: string;
  database: any;
  tables: any[];
  hypertables: any[];
  usage_statistics: any;
}

interface EquipmentOverride {
  id: number;
  site_code: string;
  equipment_id: string;
  original_name: string;
  display_name: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  equipment_status: string;
}

interface HealthCheck {
  check: string;
  status: string;
  message: string;
}

interface DataCenter {
  id: number;
  name: string;
  location?: string;
  description?: string;
  site_code: string;
  ip_address?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [overrideDialog, setOverrideDialog] = useState(false);
  const [editingOverride, setEditingOverride] = useState<EquipmentOverride | null>(null);
  const [openEditSiteDialog, setOpenEditSiteDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [editSiteForm, setEditSiteForm] = useState({
    site_name: '',
    site_type: '',
    description: ''
  });
  const [overrideForm, setOverrideForm] = useState({
    site_code: '',
    equipment_id: '',
    display_name: ''
  });
  const [dataCenters, setDataCenters] = useState<DataCenter[]>([]);
  const [dataCenterDialog, setDataCenterDialog] = useState(false);
  const [editingDataCenter, setEditingDataCenter] = useState<DataCenter | null>(null);
  const [dataCenterForm, setDataCenterForm] = useState({
    name: '',
    location: '',
    description: '',
    site_code: '',
    ip_address: '',
    is_active: true
  });
  const queryClient = useQueryClient();
  // Timescale settings state
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [retentionCustom, setRetentionCustom] = useState<string>('');

  const [compressAfterDays, setCompressAfterDays] = useState<number>(14);
  const [compressSegmentby, setCompressSegmentby] = useState<string>('equipment_id,performance_data');
  const [compressOrderby, setCompressOrderby] = useState<string>('statistical_start_time');

  const [chunkInterval, setChunkInterval] = useState<string>('1 day');
  const [chunkAuto, setChunkAuto] = useState<boolean>(true);

  const [cagg5m, setCagg5m] = useState<boolean>(true);
  const [cagg1h, setCagg1h] = useState<boolean>(true);
  const [cagg1d, setCagg1d] = useState<boolean>(true);
  const [caggSchedule, setCaggSchedule] = useState<string>('5 minutes');
  const [caggLag, setCaggLag] = useState<string>('5 minutes');

  // Mutations for Timescale settings
  const retentionMutation = useMutation({
    mutationFn: async () => apiPost('/admin/timescale/retention', { default_days: retentionDays }),
  });
  const compressionMutation = useMutation({
    mutationFn: async () => apiPost('/admin/timescale/compression', {
      compress_after_days: compressAfterDays,
      segmentby: compressSegmentby.split(',').map(s => s.trim()).filter(Boolean),
      orderby: compressOrderby.split(',').map(s => s.trim()).filter(Boolean),
    }),
  });
  const chunkMutation = useMutation({
    mutationFn: async () => apiPost('/admin/timescale/chunk-interval', {
      chunk_interval: chunkInterval,
    }),
  });
  const caggMutation = useMutation({
    mutationFn: async () => {
      const intervals: string[] = [];
      if (cagg5m) intervals.push('5 minutes');
      if (cagg1h) intervals.push('1 hour');
      if (cagg1d) intervals.push('1 day');
      return apiPost('/admin/timescale/cagg', {
        intervals,
        policy: { schedule_interval: caggSchedule, start_offset: '7 days', end_offset: caggLag },
      });
    },
  });

  // Fetch current settings
  const fetchCurrentMutation = useMutation({
    mutationFn: async () => apiGet<any>('/admin/timescale/current'),
    onSuccess: (data) => {
      if (data?.chunk_interval) setChunkInterval(String(data.chunk_interval));
      if (data?.compression?.segmentby) setCompressSegmentby((data.compression.segmentby || []).join(','));
      if (data?.compression?.orderby) setCompressOrderby((data.compression.orderby || []).join(','));
      // Retention drop_after เช่น '90 days' → ดึงตัวเลข
      const da = data?.retention?.drop_after as string | undefined;
      if (da) {
        const m = da.match(/(\d+)/);
        if (m) setRetentionDays(Number(m[1]));
      }
      // CAGG: ตรวจชื่อ view เพื่อ set สวิตช์อย่างคร่าวๆ
      const views: string[] = data?.cagg?.views || [];
      setCagg5m(views.some(v => v.includes('5') && (v.includes('m') || v.includes('minute'))));
      setCagg1h(views.some(v => v.includes('1') && v.includes('h')));
      setCagg1d(views.some(v => v.includes('1') && v.includes('d')));
    }
  });

  // SQL Preview Dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSQL, setPreviewSQL] = useState('');
  const openPreview = (sql: string) => { setPreviewSQL(sql); setPreviewOpen(true); };
  const closePreview = () => setPreviewOpen(false);

  // API Base URL
  const API_BASE = '/ecc800/api';

  // System Info Query
  const { data: systemInfo, isLoading: systemLoading } = useQuery({
    queryKey: ['systemInfo'],
    queryFn: async () => {
      return await apiGet<SystemInfo>('/admin/system-info');
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Equipment Overrides Query
  const { data: overridesData, isLoading: overridesLoading } = useQuery({
    queryKey: ['equipmentOverrides'],
    queryFn: async () => {
      return await apiGet<any>('/admin/equipment-overrides');
    }
  });

  // Database Health Query
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['databaseHealth'],
    queryFn: async () => {
      return await apiGet<any>('/admin/database-health');
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Timescale current settings for overview
  const { data: tsCurrent, isLoading: tsLoading } = useQuery({
    queryKey: ['timescaleCurrent'],
    queryFn: async () => apiGet<any>('/admin/timescale/current'),
    refetchInterval: 60000,
  });

  // Ingestion rate (last 7 days)
  const [ingestionPeriod, setIngestionPeriod] = useState<string>('24h');
  const { data: ingestionRate, isLoading: ingestionLoading } = useQuery({
    queryKey: ['ingestionRate', ingestionPeriod],
    queryFn: async () => apiGet<any>('/admin/metrics/ingestion-rate', { period: ingestionPeriod }),
    refetchInterval: 60000,
  });

  // Chunk sizes (last 30 days)
  const [chunkPeriod, setChunkPeriod] = useState<string>('30d');
  const { data: chunkSizes, isLoading: chunkSizesLoading } = useQuery({
    queryKey: ['chunkSizes', chunkPeriod],
    queryFn: async () => apiGet<any>('/admin/metrics/chunk-sizes', { period: chunkPeriod }),
    refetchInterval: 120000,
  });

  // Sites Query
  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      return await apiGet<any>('/sites');
    }
  });

  // Data Centers Query
  const dataCentersQuery = useQuery({
    queryKey: ['dataCenters'],
    queryFn: async () => {
      return await apiGet<DataCenter[]>('/admin/data-centers');
    }
  });

  // Refresh Views Mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return await apiPost('/admin/refresh-views', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemInfo'] });
    }
  });

  // Equipment Override Mutations
  const createOverrideMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOverride) {
        // Update existing
        return await apiPost(`/admin/equipment-overrides/${editingOverride.id}`, data);
      } else {
        // Create new
        return await apiPost('/admin/equipment-overrides', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentOverrides'] });
      setOverrideDialog(false);
      setOverrideForm({ site_code: '', equipment_id: '', display_name: '' });
      setEditingOverride(null);
    }
  });

  const deleteOverrideMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiDelete(`/admin/equipment-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipmentOverrides'] });
    }
  });

  // Site Update Mutation
  const updateSiteMutation = useMutation({
    mutationFn: async (data: { site_id: string, site_name: string, site_type: string, description: string }) => {
      return await apiPost(`/sites/${data.site_id}`, {
        site_name: data.site_name,
        site_type: data.site_type,
        description: data.description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setOpenEditSiteDialog(false);
    }
  });

  // Data Center Mutations
  const createDataCenterMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDataCenter) {
        // Update existing - ใช้ PUT สำหรับการแก้ไข
        return await apiPut(`/admin/data-centers/${editingDataCenter.id}`, data);
      } else {
        // Create new - ใช้ POST สำหรับการสร้างใหม่
        return await apiPost('/admin/data-centers', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataCenters'] });
      setDataCenterDialog(false);
      setDataCenterForm({
        name: '',
        location: '',
        description: '',
        site_code: '',
        ip_address: '',
        is_active: true
      });
      setEditingDataCenter(null);
    }
  });

  const deleteDataCenterMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiDelete(`/admin/data-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataCenters'] });
    }
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveSite = () => {
    if (editingSite) {
      updateSiteMutation.mutate({
        site_id: editingSite.site_id,
        site_name: editSiteForm.site_name,
        site_type: editSiteForm.site_type,
        description: editSiteForm.description
      });
    }
  };

  const handleOpenOverrideDialog = (override?: EquipmentOverride) => {
    if (override) {
      setEditingOverride(override);
      setOverrideForm({
        site_code: override.site_code,
        equipment_id: override.equipment_id,
        display_name: override.display_name
      });
    } else {
      setEditingOverride(null);
      setOverrideForm({ site_code: '', equipment_id: '', display_name: '' });
    }
    setOverrideDialog(true);
  };

  const handleCloseOverrideDialog = () => {
    setOverrideDialog(false);
    setEditingOverride(null);
    setOverrideForm({ site_code: '', equipment_id: '', display_name: '' });
  };

  const handleSaveOverride = () => {
    if (editingOverride) {
      // Update existing
      createOverrideMutation.mutate(overrideForm);
    } else {
      // Create new
      createOverrideMutation.mutate(overrideForm);
    }
  };

  const handleDeleteOverride = (id: number) => {
    if (window.confirm('ต้องการลบชื่อแทนอุปกรณ์นี้หรือไม่?')) {
      deleteOverrideMutation.mutate(id);
    }
  };

  const handleSaveEditSite = () => {
    if (editingSite) {
      updateSiteMutation.mutate({
        site_id: editingSite.site_id,
        site_name: editSiteForm.site_name,
        site_type: editSiteForm.site_type,
        description: editSiteForm.description
      });
    }
  };

  const handleCloseEditSiteDialog = () => {
    setOpenEditSiteDialog(false);
    setEditingSite(null);
    setEditSiteForm({ site_name: '', site_type: '', description: '' });
  };

  const handleOpenDataCenterDialog = (dataCenter?: DataCenter) => {
    if (dataCenter) {
      setEditingDataCenter(dataCenter);
      setDataCenterForm({
        name: dataCenter.name,
        location: dataCenter.location || '',
        description: dataCenter.description || '',
        site_code: dataCenter.site_code,
        ip_address: dataCenter.ip_address || '',
        is_active: dataCenter.is_active
      });
    } else {
      setEditingDataCenter(null);
      setDataCenterForm({ name: '', location: '', description: '', site_code: '', ip_address: '', is_active: true });
    }
    setDataCenterDialog(true);
  };

  const handleCloseDataCenterDialog = () => {
    setDataCenterDialog(false);
    setEditingDataCenter(null);
    setDataCenterForm({ name: '', location: '', description: '', site_code: '', ip_address: '', is_active: true });
  };

  const handleSaveDataCenter = () => {
    if (editingDataCenter) {
      // Update existing
      createDataCenterMutation.mutate(dataCenterForm);
    } else {
      // Create new
      createDataCenterMutation.mutate(dataCenterForm);
    }
  };

  const handleDeleteDataCenter = (id: number) => {
    if (window.confirm('ต้องการลบ Data Center นี้หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      deleteDataCenterMutation.mutate(id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'unhealthy':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ผู้ดูแลระบบ
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        จัดการระบบและฐานข้อมูล ECC800
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs" variant="scrollable" scrollButtons="auto">
          <Tab label="ภาพรวมระบบ" />
          <Tab label="ชื่อแทนอุปกรณ์" />
          <Tab label="สุขภาพฐานข้อมูล" />
          <Tab label="การจัดการผู้ใช้ & สิทธิ์" />
          <Tab label="จัดการ Data Center" />
          <Tab label="การตั้งค่า Timescale" />
          <Tab label="การจัดการ Dashboard" />
          <Tab label="จัดการเนื้อหา" icon={<EditIcon />} />
        </Tabs>
      </Box>

      {/* Tab 1: System Overview */}
      {tabValue === 0 && (
        <Box sx={{ mt: 3 }}>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid #1976d2' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">ไซต์ทั้งหมด</Typography>
                  <Typography variant="h4">{systemInfo?.usage_statistics?.total_sites ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid #2e7d32' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">อุปกรณ์ทั้งหมด</Typography>
                  <Typography variant="h4">{systemInfo?.usage_statistics?.total_equipment ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid #ed6c02' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">เมตริกทั้งหมด</Typography>
                  <Typography variant="h4">{systemInfo?.usage_statistics?.total_metrics ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: '4px solid #9c27b0' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">ข้อมูลทั้งหมด</Typography>
                  <Typography variant="h4">{(systemInfo?.usage_statistics?.total_records ?? 0).toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* DB Health + Timescale Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title="สถานะระบบฐานข้อมูล"
                  action={healthLoading ? <CircularProgress size={20} /> : (
                    <Chip
                      label={healthData?.overall_status || 'unknown'}
                      color={getStatusColor(healthData?.overall_status || 'default') as any}
                      size="small"
                    />
                  )}
                />
                <CardContent>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    ฐานข้อมูล: {systemInfo?.database?.database_name || 'N/A'} | ผู้ใช้: {systemInfo?.database?.current_user || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    เวลาเซิร์ฟเวอร์: {formatDT(systemInfo?.database?.server_time)}
                  </Typography>
                  {healthData?.health_checks?.slice(0,4).map((c: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: .5 }}>
                      <Box sx={{ mr: 1 }}>{getStatusIcon(c.status)}</Box>
                      <Typography variant="body2">{c.message}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="ภาพรวม TimescaleDB" action={<Button size="small" startIcon={<SettingsIcon />} onClick={() => setTabValue(5)}>ตั้งค่า</Button>} />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Chunk Interval</Typography>
                      <Typography variant="h6">{(tsCurrent as any)?.chunk_interval || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Chunks</Typography>
                      <Typography variant="h6">{(tsCurrent as any)?.chunks?.count || 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Retention</Typography>
                      <Typography variant="h6">{(tsCurrent as any)?.retention?.drop_after || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Compression</Typography>
                      <Typography variant="h6">{(tsCurrent as any)?.compression?.enabled ? 'เปิดใช้งาน' : 'ปิด'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">ช่วงข้อมูลตาม Chunk</Typography>
                      <Typography variant="body2">{formatDT((tsCurrent as any)?.chunks?.range?.min_start)} ถึง {formatDT((tsCurrent as any)?.chunks?.range?.max_end)}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Top chunks */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Top Chunks ตามขนาด" />
                <CardContent>
                  {(tsCurrent as any)?.chunks?.top?.length ? (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Chunk</TableCell>
                            <TableCell>ช่วงเวลา</TableCell>
                            <TableCell align="right">ขนาด</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(tsCurrent as any).chunks.top.map((ch: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{ch.chunk}</TableCell>
                              <TableCell>{formatDT(ch.range_start)} → {formatDT(ch.range_end)}</TableCell>
                              <TableCell align="right">{ch.size_pretty}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">ไม่มีข้อมูล Chunk</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Mini charts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Ingestion Rate (records/ชั่วโมง)"
                  action={
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>ช่วงเวลา</InputLabel>
                      <Select
                        value={ingestionPeriod}
                        label="ช่วงเวลา"
                        onChange={(e) => setIngestionPeriod(e.target.value)}
                      >
                        <MenuItem value="24h">24 ชม.</MenuItem>
                        <MenuItem value="3d">3 วัน</MenuItem>
                        <MenuItem value="7d">7 วัน</MenuItem>
                        <MenuItem value="30d">30 วัน</MenuItem>
                      </Select>
                    </FormControl>
                  }
                />
                <CardContent>
                  <TimeSeriesChart
                    data={(ingestionRate?.points || [])}
                    isLoading={ingestionLoading}
                    title=""
                    yAxisLabel="records/hr"
                    height={240}
                    color="#1976d2"
                    showGrid={true}
                    formatValue={(v) => (v !== null ? Math.round(v).toString() : '0')}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="ขนาด Chunks ต่อวัน (GB)"
                  action={
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>ช่วงเวลา</InputLabel>
                      <Select
                        value={chunkPeriod}
                        label="ช่วงเวลา"
                        onChange={(e) => setChunkPeriod(e.target.value)}
                      >
                        <MenuItem value="7d">7 วัน</MenuItem>
                        <MenuItem value="30d">30 วัน</MenuItem>
                        <MenuItem value="90d">90 วัน</MenuItem>
                      </Select>
                    </FormControl>
                  }
                />
                <CardContent>
                  <TimeSeriesChart
                    data={(chunkSizes?.points || []).map((p: any) => ({ timestamp: p.timestamp, value: (p.value || 0) / (1024*1024*1024) }))}
                    isLoading={chunkSizesLoading}
                    title=""
                    yAxisLabel="GB"
                    height={240}
                    color="#ed6c02"
                    showGrid={true}
                    formatValue={(v) => v !== null ? v.toFixed(1) : '0'}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Quick actions */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="การจัดการรวดเร็ว" />
                <CardContent>
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                      {refreshMutation.isPending ? 'กำลังรีเฟรช…' : 'รีเฟรช Views'}
                    </Button>
                    <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setTabValue(5)}>
                      ไปที่การตั้งค่า Timescale
                    </Button>
                    <Button variant="text" onClick={() => { queryClient.invalidateQueries({ queryKey: ['systemInfo'] }); queryClient.invalidateQueries({ queryKey: ['databaseHealth'] }); queryClient.invalidateQueries({ queryKey: ['timescaleCurrent'] }); }}>
                      รีโหลดภาพรวม
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 2: Equipment Overrides */}
      {tabValue === 1 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">จัดการชื่อแทนอุปกรณ์</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenOverrideDialog()}
            >
              เพิ่มชื่อแทน
            </Button>
          </Box>

          {overridesData?.statistics && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{overridesData.statistics.total_overrides}</Typography>
                    <Typography variant="body2" color="text.secondary">ชื่อแทนทั้งหมด</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{overridesData.statistics.active_equipment}</Typography>
                    <Typography variant="body2" color="text.secondary">อุปกรณ์ที่ใช้งาน</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{overridesData.statistics.inactive_equipment}</Typography>
                    <Typography variant="body2" color="text.secondary">อุปกรณ์ที่ไม่ได้ใช้งาน</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{overridesData.statistics.sites_with_overrides}</Typography>
                    <Typography variant="body2" color="text.secondary">ไซต์ที่มีการตั้งค่า</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <Card>
            <CardContent>
              {overridesLoading ? (
                <CircularProgress />
              ) : overridesData?.overrides && overridesData.overrides.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ไซต์</TableCell>
                        <TableCell>อุปกรณ์ ID</TableCell>
                        <TableCell>ชื่อเดิม</TableCell>
                        <TableCell>ชื่อแสดง</TableCell>
                        <TableCell>สถานะ</TableCell>
                        <TableCell>แก้ไขโดย</TableCell>
                        <TableCell>อัปเดตล่าสุด</TableCell>
                        <TableCell>การดำเนินการ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overridesData.overrides.map((override: EquipmentOverride) => (
                        <TableRow key={override.id}>
                          <TableCell>{override.site_code}</TableCell>
                          <TableCell>{override.equipment_id}</TableCell>
                          <TableCell>{override.original_name}</TableCell>
                          <TableCell>{override.display_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={override.equipment_status}
                              color={override.equipment_status === 'Active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{override.updated_by}</TableCell>
                          <TableCell>{new Date(override.updated_at).toLocaleDateString('th-TH')}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenOverrideDialog(override)}
                              sx={{ mr: 1 }}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DeleteIcon />}
                              color="error"
                              onClick={() => handleDeleteOverride(override.id)}
                            >
                              ลบ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>ไม่มีข้อมูลชื่อแทนอุปกรณ์</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 3: Database Health */}
      {tabValue === 2 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Overall Health Status */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="สถานะสุขภาพฐานข้อมูล" />
                <CardContent>
                  {healthLoading ? (
                    <CircularProgress />
                  ) : healthData ? (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getStatusIcon(healthData.overall_status)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          สถานะรวม: {healthData.overall_status === 'healthy' ? 'ปกติ' :
                                     healthData.overall_status === 'warning' ? 'เตือน' : 'ผิดปกติ'}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2 }}>
                        ตรวจสอบล่าสุด: {new Date(healthData.timestamp).toLocaleString('th-TH')}
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" color="success.main">
                                {healthData.summary.healthy}
                              </Typography>
                              <Typography variant="body2">ปกติ</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" color="warning.main">
                                {healthData.summary.warnings}
                              </Typography>
                              <Typography variant="body2">เตือน</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6" color="error.main">
                                {healthData.summary.errors}
                              </Typography>
                              <Typography variant="body2">ผิดพลาด</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="h6">
                                {healthData.summary.total_checks}
                              </Typography>
                              <Typography variant="body2">การตรวจสอบทั้งหมด</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  ) : (
                    <Typography color="error">ไม่สามารถโหลดข้อมูลสุขภาพ</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Health Checks Details */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="รายละเอียดการตรวจสอบ" />
                <CardContent>
                  {healthData?.health_checks && healthData.health_checks.length > 0 ? (
                    <List>
                      {healthData.health_checks.map((check: HealthCheck, index: number) => (
                        <React.Fragment key={index}>
                          <ListItem>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              {getStatusIcon(check.status)}
                              <Box sx={{ ml: 2, flex: 1 }}>
                                <Typography variant="subtitle2">
                                  {check.check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {check.message}
                                </Typography>
                              </Box>
                              <Chip
                                label={check.status}
                                color={getStatusColor(check.status) as any}
                                size="small"
                              />
                            </Box>
                          </ListItem>
                          {index < healthData.health_checks.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography>ไม่มีข้อมูลการตรวจสอบ</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 5: Timescale Settings */}
      {tabValue === 5 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Retention Policy */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Retention Policy (อายุข้อมูล)" subheader="กำหนดการเก็บข้อมูลตามช่วงเวลา" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" label="ค่าเริ่มต้น (วัน)" value={retentionDays}
                        onChange={(e) => setRetentionDays(Number(e.target.value))} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="กำหนดเฉพาะ (เช่น metric=temperature:180)" placeholder="คั่นด้วยคอมมา" value={retentionCustom}
                        onChange={(e) => setRetentionCustom(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">ตัวอย่าง: equipment=UPS01:365, site=dc:180, metric=humidity:120</Alert>
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" startIcon={<SaveIcon />} disabled={retentionMutation.isPending}
                          onClick={() => retentionMutation.mutate()}>บันทึก</Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchCurrentMutation.mutate()}>ย้อนกลับค่าเดิม</Button>
                        <Button variant="text" onClick={() => openPreview(
                          `SELECT public.remove_retention_policy('public.performance_data');\n`+
                          `SELECT public.add_retention_policy('public.performance_data', INTERVAL '${retentionDays} days');`
                        )}>แสดง SQL ที่จะรัน</Button>
                      </Stack>
                      {retentionMutation.isSuccess && (<Alert sx={{ mt: 2 }} severity="success">บันทึก Retention สำเร็จ</Alert>)}
                      {retentionMutation.isError && (<Alert sx={{ mt: 2 }} severity="error">บันทึกไม่สำเร็จ</Alert>)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Compression Policy */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Compression Policy (บีบอัดข้อมูล)" subheader="ตั้งค่าการบีบอัดเพื่อประหยัดพื้นที่และเพิ่มความเร็ว" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth type="number" label="บีบอัดหลัง (วัน)" value={compressAfterDays}
                        onChange={(e) => setCompressAfterDays(Number(e.target.value))} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="segmentby" value={compressSegmentby}
                        onChange={(e) => setCompressSegmentby(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="orderby" value={compressOrderby}
                        onChange={(e) => setCompressOrderby(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" startIcon={<SaveIcon />} disabled={compressionMutation.isPending}
                          onClick={() => compressionMutation.mutate()}>บันทึก</Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchCurrentMutation.mutate()}>ย้อนกลับค่าเดิม</Button>
                        <Button variant="text" onClick={() => openPreview(
                          `ALTER TABLE public.performance_data SET (timescaledb.compress = true);\n`+
                          (compressSegmentby?`ALTER TABLE public.performance_data SET (timescaledb.compress_segmentby = '${compressSegmentby}');\n`:``)+
                          (compressOrderby?`ALTER TABLE public.performance_data SET (timescaledb.compress_orderby = '${compressOrderby}');\n`:``)+
                          `SELECT public.remove_compression_policy('public.performance_data');\n`+
                          `SELECT public.add_compression_policy('public.performance_data', INTERVAL '${compressAfterDays} days');`
                        )}>แสดง SQL ที่จะรัน</Button>
                      </Stack>
                      {compressionMutation.isSuccess && (<Alert sx={{ mt: 2 }} severity="success">บันทึก Compression สำเร็จ</Alert>)}
                      {compressionMutation.isError && (<Alert sx={{ mt: 2 }} severity="error">บันทึกไม่สำเร็จ</Alert>)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Chunk Interval */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Chunk Interval (ขนาดชิ้นส่วน)" subheader="กำหนดช่วงเวลาในการแบ่งข้อมูล" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="chunk_time_interval" value={chunkInterval}
                        onChange={(e) => setChunkInterval(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel control={<Switch checked={chunkAuto} onChange={(e)=> setChunkAuto(e.target.checked)} />} label="แนะนำอัตโนมัติ (Auto)" />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">แนะนำ: 1 วันสำหรับข้อมูลหนาแน่น, 3–7 วันสำหรับปริมาณข้อมูลต่ำ</Alert>
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" startIcon={<SaveIcon />} disabled={chunkMutation.isPending}
                          onClick={() => chunkMutation.mutate()}>บันทึก</Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchCurrentMutation.mutate()}>ย้อนกลับค่าเดิม</Button>
                        <Button variant="text" onClick={() => openPreview(
                          `SELECT public.set_chunk_time_interval('public.performance_data', INTERVAL '${chunkInterval}');`
                        )}>แสดง SQL ที่จะรัน</Button>
                      </Stack>
                      {chunkMutation.isSuccess && (<Alert sx={{ mt: 2 }} severity="success">บันทึก Chunk Interval สำเร็จ</Alert>)}
                      {chunkMutation.isError && (<Alert sx={{ mt: 2 }} severity="error">บันทึกไม่สำเร็จ</Alert>)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Continuous Aggregates */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Continuous Aggregates (มุมมองสรุปต่อเนื่อง)" subheader="สร้าง CAGG สำหรับ 5 นาที, 1 ชั่วโมง, 1 วัน" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2}>
                        <FormControlLabel control={<Switch checked={cagg5m} onChange={(e)=> setCagg5m(e.target.checked)} />} label="5 นาที" />
                        <FormControlLabel control={<Switch checked={cagg1h} onChange={(e)=> setCagg1h(e.target.checked)} />} label="1 ชั่วโมง" />
                        <FormControlLabel control={<Switch checked={cagg1d} onChange={(e)=> setCagg1d(e.target.checked)} />} label="1 วัน" />
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="refresh_policy (ทุก)" value={caggSchedule}
                        onChange={(e) => setCaggSchedule(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="refresh_lag (ดีเลย์)" value={caggLag}
                        onChange={(e) => setCaggLag(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">ตัวอย่าง: refresh ทุก 5 นาที, lag 5 นาที เพื่อรองรับ late data</Alert>
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" startIcon={<SaveIcon />} disabled={caggMutation.isPending}
                          onClick={() => caggMutation.mutate()}>บันทึก</Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchCurrentMutation.mutate()}>ย้อนกลับค่าเดิม</Button>
                        <Button variant="text" onClick={() => {
                          const intervals: string[] = [];
                          if (cagg5m) intervals.push('5 minutes');
                          if (cagg1h) intervals.push('1 hour');
                          if (cagg1d) intervals.push('1 day');
                          const sql = intervals.map(iv => (
                            `CREATE MATERIALIZED VIEW IF NOT EXISTS public.cagg_perf_${iv.replace(' ','_').replace('minutes','m').replace('minute','m').replace('hour','h').replace('day','d')}\n`+
                            `WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS\n`+
                            `SELECT time_bucket('${iv}', statistical_start_time) AS bucket, site_code, equipment_id, performance_data, unit,\n`+
                            `AVG(value_numeric) AS value_avg, MIN(value_numeric) AS value_min, MAX(value_numeric) AS value_max, COUNT(*) AS sample_count\n`+
                            `FROM public.performance_data WHERE value_numeric IS NOT NULL\n`+
                            `GROUP BY bucket, site_code, equipment_id, performance_data, unit;\n`+
                            `SELECT public.remove_continuous_aggregate_policy('public.cagg_perf_${iv.replace(' ','_').replace('minutes','m').replace('minute','m').replace('hour','h').replace('day','d')}');\n`+
                            `SELECT public.add_continuous_aggregate_policy('public.cagg_perf_${iv.replace(' ','_').replace('minutes','m').replace('minute','m').replace('hour','h').replace('day','d')}', START_OFFSET => INTERVAL '7 days', END_OFFSET => INTERVAL '${caggLag}', SCHEDULE_INTERVAL => INTERVAL '${caggSchedule}');`
                          )).join('\n\n');
                          openPreview(sql);
                        }}>แสดง SQL ที่จะรัน</Button>
                      </Stack>
                      {caggMutation.isSuccess && (<Alert sx={{ mt: 2 }} severity="success">สร้าง Continuous Aggregates สำเร็จ</Alert>)}
                      {caggMutation.isError && (<Alert sx={{ mt: 2 }} severity="error">ดำเนินการไม่สำเร็จ</Alert>)}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Reorder / Compression Order */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Reorder / Compression Order" subheader="ตั้งค่าการจัดเรียงข้อมูลเพื่อประสิทธิภาพการอ่าน" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="orderby" value={compressOrderby}
                        onChange={(e)=> setCompressOrderby(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="orderby (รอง)" placeholder="site_code, equipment_id" />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="เงื่อนไขเพิ่มเติม (ตัวกรอง)" placeholder="เช่น metric=temperature" />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={() => compressionMutation.mutate()} disabled={compressionMutation.isPending}>บันทึก</Button>
                        <Button variant="outlined" startIcon={<RefreshIcon />}>รีเซ็ต</Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* คู่มือการใช้งาน */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="คู่มือการใช้งานการตั้งค่า Timescale (ภาษาไทย)" />
                <CardContent>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    ดาวน์โหลดไฟล์คำอธิบายการตั้งค่า TimescaleDB สำหรับ ECC800 (Retention, Compression, Chunk Interval, Continuous Aggregates)
                  </Typography>
                  <Button variant="outlined" startIcon={<Download />} onClick={() => {
                    const md = `# คู่มือการตั้งค่า TimescaleDB สำหรับ ECC800\n\n` +
`หัวข้อนี้อธิบายวิธีตั้งค่า Retention Policy, Compression Policy, Chunk Interval และ Continuous Aggregates ให้เหมาะสมกับข้อมูลจริงของระบบ ECC800.\n\n` +
`## 1) Retention Policy (อายุข้อมูล)\n- ค่าเริ่มต้น (วัน): กำหนดอายุข้อมูล (เช่น 90/180/365)\n- ผลกระทบ: ข้อมูลที่เก่ากว่าช่วงเวลาที่กำหนดจะถูกลบแบบ background โดย TimescaleDB\n\n` +
`## 2) Compression Policy (บีบอัดข้อมูล)\n- compress หลัง N วัน: บีบอัดข้อมูลที่เก่ากว่า N วันเพื่อประหยัดพื้นที่\n- segmentby: คอลัมน์สำหรับแยก segment เช่น equipment_id, performance_data\n- orderby: คอลัมน์สำหรับเรียงภายใน segment เช่น statistical_start_time\n\n` +
`## 3) Chunk Interval (ขนาดชิ้นข้อมูล)\n- แนะนำ 1 วันสำหรับข้อมูลหนาแน่น หรือ 3–7 วันสำหรับข้อมูลเบาบาง\n- ส่งผลต่อจำนวน/ขนาดของ chunk และประสิทธิภาพการ query/บีบอัด\n\n` +
`## 4) Continuous Aggregates (สรุปต่อเนื่อง)\n- CAGG 5 นาที / 1 ชั่วโมง / 1 วัน: สร้างมุมมองสรุปเพื่อลดภาระการคำนวณ real-time\n- refresh_policy: รอบเวลา refresh เช่น schedule ทุก 5 นาที, lag 5 นาที เพื่อรองรับข้อมูลมาช้า\n\n` +
`## แนวทางแนะนำเริ่มต้น\n- Retention: 180 วัน, Compression: หลัง 14 วัน (segmentby: equipment_id,performance_data / orderby: statistical_start_time)\n- Chunk Interval: 1 วัน, CAGG: เปิด 5 นาทีและ 1 ชั่วโมง (schedule: 5 minutes, lag: 5 minutes)\n\n` +
`รองรับการปรับแต่งตามปริมาณข้อมูลจริงของแต่ละไซต์/อุปกรณ์.\n`;
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'TimescaleDB_ECC800_Guide_TH.md';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>ดาวน์โหลดคู่มือการใช้งาน</Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* SQL Preview Dialog */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle>แสดง SQL ที่จะรัน</DialogTitle>
        <DialogContent>
          <TextField multiline fullWidth minRows={10} value={previewSQL} onChange={()=>{}} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>ปิด</Button>
        </DialogActions>
      </Dialog>

      {/* Tab 4: User Management - ใช้ UnifiedAdminManagement แทน */}
      {tabValue === 3 && (
        <UnifiedAdminManagement />
      )}

      {/* Tab 5: Data Center Management */}
      {tabValue === 4 && (
        <Fade in={tabValue === 4} timeout={500}>
          <Container maxWidth="xl">
            <Box sx={{ mt: 3 }}>
              {/* Header Section */}
              <Box sx={{ 
                mb: 4, 
                p: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 3,
                color: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BusinessIcon sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="h4" component="h1" fontWeight="bold">
                    จัดการ Data Center
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  จัดการศูนย์ข้อมูลและการตั้งค่าต่างๆ ของระบบ ECC800
                </Typography>
              </Box>

              {/* Statistics Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={tabValue === 4} style={{ transitionDelay: '100ms' }}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                      }
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <StorageIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                          {dataCentersQuery.data?.length || 0}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Data Centers ทั้งหมด
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={tabValue === 4} style={{ transitionDelay: '200ms' }}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(79, 172, 254, 0.4)'
                      }
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <PowerIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                          {dataCentersQuery.data?.filter(dc => dc.is_active).length || 0}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Data Centers ที่ใช้งาน
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={tabValue === 4} style={{ transitionDelay: '300ms' }}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(245, 87, 108, 0.4)'
                      }
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <PowerOffIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                          {dataCentersQuery.data?.filter(dc => !dc.is_active).length || 0}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          Data Centers ที่ปิดใช้งาน
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Zoom in={tabValue === 4} style={{ transitionDelay: '400ms' }}>
                    <Card sx={{ 
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: '#333',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(168, 237, 234, 0.3)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 40px rgba(168, 237, 234, 0.4)'
                      }
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <DashboardIcon sx={{ fontSize: 48, mb: 2, color: '#667eea' }} />
                        <Typography variant="h3" fontWeight="bold" sx={{ mb: 1, color: '#667eea' }}>
                          {dataCentersQuery.data?.length ? Math.round((dataCentersQuery.data.filter(dc => dc.is_active).length / dataCentersQuery.data.length) * 100) : 0}%
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666' }}>
                          อัตราการใช้งาน
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              </Grid>

              {/* Data Centers Table */}
              <Zoom in={tabValue === 4} style={{ transitionDelay: '500ms' }}>
                <Card sx={{ 
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CloudIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                          รายการ Data Centers
                        </Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      borderBottom: '1px solid #e0e0e0'
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    {dataCentersQuery.isLoading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={6}>
                        <CircularProgress size={60} sx={{ mr: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          กำลังโหลดข้อมูล...
                        </Typography>
                      </Box>
                    ) : dataCentersQuery.error ? (
                      <Alert 
                        severity="error" 
                        sx={{ m: 3 }}
                        icon={<ErrorIcon />}
                      >
                        <Typography variant="h6" fontWeight="bold">
                          เกิดข้อผิดพลาดในการดึงข้อมูล
                        </Typography>
                        <Typography variant="body2">
                          {dataCentersQuery.error instanceof Error ? dataCentersQuery.error.message : 'Unknown error'}
                        </Typography>
                      </Alert>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <BusinessIcon sx={{ mr: 1, fontSize: 18 }} />
                                  ชื่อ Data Center
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
                                  Site Code
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationIcon sx={{ mr: 1, fontSize: 18 }} />
                                  ตำแหน่ง
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <RouterIcon sx={{ mr: 1, fontSize: 18 }} />
                                  IP Address
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PowerIcon sx={{ mr: 1, fontSize: 18 }} />
                                  สถานะ
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <ScheduleIcon sx={{ mr: 1, fontSize: 18 }} />
                                  สร้างเมื่อ
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <UpdateIcon sx={{ mr: 1, fontSize: 18 }} />
                                  อัพเดทเมื่อ
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <BuildIcon sx={{ mr: 1, fontSize: 18 }} />
                                  การดำเนินการ
                                </Box>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dataCentersQuery.data?.map((dataCenter: DataCenter, index: number) => (
                              <TableRow 
                                key={dataCenter.id}
                                sx={{ 
                                  '&:hover': { 
                                    backgroundColor: '#f8f9fa',
                                    transform: 'scale(1.01)',
                                    transition: 'all 0.2s ease-in-out'
                                  },
                                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar 
                                      sx={{ 
                                        mr: 2, 
                                        bgcolor: dataCenter.is_active ? 'primary.main' : 'grey.400',
                                        width: 40,
                                        height: 40
                                      }}
                                    >
                                      <BusinessIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body1" fontWeight="medium">
                                        {dataCenter.name}
                                      </Typography>
                                      {dataCenter.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {dataCenter.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    badgeContent={dataCenter.site_code} 
                                    color="primary"
                                    sx={{ 
                                      '& .MuiBadge-badge': { 
                                        fontSize: '0.7rem',
                                        height: 20,
                                        minWidth: 20
                                      }
                                    }}
                                  >
                                    <Chip
                                      label={dataCenter.site_code || 'N/A'}
                                      color="primary"
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                                    <Typography variant="body2">
                                      {dataCenter.location || 'ไม่ระบุ'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <RouterIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                      {dataCenter.ip_address || 'ไม่ระบุ'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    icon={dataCenter.is_active ? <CheckCircleIcon /> : <PowerOffIcon />}
                                    label={dataCenter.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                    color={dataCenter.is_active ? 'success' : 'default'}
                                    size="small"
                                    sx={{ 
                                      fontWeight: 'medium',
                                      '& .MuiChip-icon': { fontSize: 16 }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ScheduleIcon sx={{ mr: 1, color: 'action.active', fontSize: 16 }} />
                                    <Typography variant="body2">
                                      {new Date(dataCenter.created_at).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <UpdateIcon sx={{ mr: 1, color: 'action.active', fontSize: 16 }} />
                                    <Typography variant="body2">
                                      {dataCenter.updated_at ? 
                                        new Date(dataCenter.updated_at).toLocaleDateString('th-TH', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        }) : 
                                        'ไม่เคยอัพเดท'
                                      }
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={1} justifyContent="center">
                                    <Tooltip title="แก้ไข Data Center" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDataCenterDialog(dataCenter)}
                                        sx={{ 
                                          color: 'primary.main',
                                          '&:hover': { 
                                            backgroundColor: 'primary.light',
                                            color: 'primary.contrastText'
                                          }
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="ลบ Data Center" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteDataCenter(dataCenter.id)}
                                        sx={{ 
                                          color: 'error.main',
                                          '&:hover': { 
                                            backgroundColor: 'error.light',
                                            color: 'error.contrastText'
                                          }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Zoom>

              {/* Electricity Rate Management Section */}
              <Box sx={{ mt: 4 }}>
                <ElectricityRateManagement />
              </Box>
            </Box>
          </Container>
        </Fade>
      )}

      {/* Equipment Override Dialog */}
      <Dialog open={overrideDialog} onClose={handleCloseOverrideDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOverride ? 'แก้ไขชื่อแทนอุปกรณ์' : 'เพิ่มชื่อแทนอุปกรณ์'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="รหัสไซต์"
              value={overrideForm.site_code}
              onChange={(e) => setOverrideForm({ ...overrideForm, site_code: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="เช่น dc, dr"
            />
            <TextField
              fullWidth
              label="รหัสอุปกรณ์"
              value={overrideForm.equipment_id}
              onChange={(e) => setOverrideForm({ ...overrideForm, equipment_id: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="เช่น 6835e472848f77af"
            />
            <TextField
              fullWidth
              label="ชื่อแสดง"
              value={overrideForm.display_name}
              onChange={(e) => setOverrideForm({ ...overrideForm, display_name: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="เช่น Cabinet-IT Cabinet101"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOverrideDialog}>ยกเลิก</Button>
          <Button
            onClick={handleSaveOverride}
            variant="contained"
            disabled={createOverrideMutation.isPending}
          >
            {createOverrideMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Site Edit Dialog */}
      <Dialog open={openEditSiteDialog} onClose={() => setOpenEditSiteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>แก้ไขข้อมูล Site</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Site Name"
              value={editSiteForm.site_name}
              onChange={(e) => setEditSiteForm({ ...editSiteForm, site_name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Site Type"
              select
              SelectProps={{ native: true }}
              value={editSiteForm.site_type}
              onChange={(e) => setEditSiteForm({ ...editSiteForm, site_type: e.target.value })}
              sx={{ mb: 2 }}
            >
              <option value="DC">Data Center</option>
              <option value="DR">Disaster Recovery</option>
            </TextField>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editSiteForm.description}
              onChange={(e) => setEditSiteForm({ ...editSiteForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditSiteDialog}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleSaveEditSite}
            disabled={updateSiteMutation.isPending}
          >
            {updateSiteMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Center Dialog */}
      <Dialog 
        open={dataCenterDialog} 
        onClose={handleCloseDataCenterDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'center'
        }}>
          <BusinessIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" fontWeight="bold">
            {editingDataCenter ? 'แก้ไข Data Center' : 'เพิ่ม Data Center ใหม่'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              ข้อมูลพื้นฐาน
            </Typography>
            <Divider sx={{ mb: 3 }} />
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ชื่อ Data Center"
                value={dataCenterForm.name}
                onChange={(e) => setDataCenterForm({ ...dataCenterForm, name: e.target.value })}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Code"
                value={dataCenterForm.site_code}
                onChange={(e) => setDataCenterForm({ ...dataCenterForm, site_code: e.target.value })}
                required
                variant="outlined"
                placeholder="เช่น DC, DR"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  startAdornment: <SettingsIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ตำแหน่ง"
                value={dataCenterForm.location}
                onChange={(e) => setDataCenterForm({ ...dataCenterForm, location: e.target.value })}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={dataCenterForm.ip_address}
                onChange={(e) => setDataCenterForm({ ...dataCenterForm, ip_address: e.target.value })}
                variant="outlined"
                placeholder="เช่น 192.168.1.100"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  startAdornment: <RouterIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="คำอธิบาย"
                multiline
                rows={4}
                value={dataCenterForm.description}
                onChange={(e) => setDataCenterForm({ ...dataCenterForm, description: e.target.value })}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                p: 3, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                backgroundColor: '#f8f9fa'
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dataCenterForm.is_active}
                      onChange={(e, checked) => setDataCenterForm({ ...dataCenterForm, is_active: checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'success.main',
                          '&:hover': {
                            backgroundColor: 'success.main',
                          },
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'success.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {dataCenterForm.is_active ? (
                        <PowerIcon sx={{ mr: 1, color: 'success.main' }} />
                      ) : (
                        <PowerOffIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      )}
                      <Typography variant="body1" fontWeight="medium">
                        {dataCenterForm.is_active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                  สถานะการใช้งานของ Data Center นี้
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0'
        }}>
          <Button 
            onClick={handleCloseDataCenterDialog}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveDataCenter}
            variant="contained"
            disabled={createDataCenterMutation.isPending}
            startIcon={createDataCenterMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            {createDataCenterMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 6: Dashboard Management */}
      {tabValue === 6 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Dashboard Configuration */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                mb: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <DashboardIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    การจัดการ Dashboard
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
                    ปรับแต่งการแสดงผลข้อมูล Dashboard, จัดการสี, ชื่อแสดง, และการเลือกข้อมูลที่จะแสดงใน 3D Visualization
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Equipment Display Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Computer sx={{ color: 'primary.main' }} />
                      <Typography variant="h6">การตั้งค่าการแสดงผลอุปกรณ์</Typography>
                    </Box>
                  }
                  subheader="จัดการชื่อแสดงและสีของอุปกรณ์ใน Dashboard"
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    🏢 <strong>Data Center (DC):</strong> อุปกรณ์หลักที่ให้บริการ
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    🔄 <strong>Disaster Recovery (DR):</strong> อุปกรณ์สำรองฉุกเฉิน
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    ประเภทอุปกรณ์:
                  </Typography>
                  <Stack spacing={1}>
                    <Chip 
                      icon={<Computer />} 
                      label="เซิร์ฟเวอร์ (Server)" 
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<AcUnit />} 
                      label="เครื่องปรับอากาศ (Air Conditioning)" 
                      sx={{ backgroundColor: '#00aa66', color: 'white' }}
                    />
                    <Chip 
                      icon={<Router />} 
                      label="เครือข่าย (Network)" 
                      sx={{ backgroundColor: '#2266dd', color: 'white' }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Color & Theme Settings */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaletteIcon sx={{ color: 'secondary.main' }} />
                      <Typography variant="h6">การตั้งค่าสีและธีม</Typography>
                    </Box>
                  }
                  subheader="ปรับแต่งสีและธีมของ Dashboard"
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        สี DC (Data Center):
                      </Typography>
                      <Box sx={{ 
                        width: '100%', 
                        height: 40, 
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        borderRadius: 2,
                        border: '2px solid #e0e0e0'
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        สี DR (Disaster Recovery):
                      </Typography>
                      <Box sx={{ 
                        width: '100%', 
                        height: 40, 
                        background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
                        borderRadius: 2,
                        border: '2px solid #e0e0e0'
                      }} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        สีสถานะอุปกรณ์:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label="ทำงานปกติ" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
                        <Chip size="small" label="เตือน" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
                        <Chip size="small" label="ข้อผิดพลาด" sx={{ backgroundColor: '#f44336', color: 'white' }} />
                        <Chip size="small" label="ไม่ทำงาน" sx={{ backgroundColor: '#9e9e9e', color: 'white' }} />
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Data Selection Settings */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon sx={{ color: 'success.main' }} />
                      <Typography variant="h6">การเลือกข้อมูลที่จะแสดงผล</Typography>
                    </Box>
                  }
                  subheader="เลือกประเภทข้อมูลและเมตริกส์ที่จะแสดงใน Dashboard"
                />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        📊 เมตริกส์ที่แสดงผล:
                      </Typography>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="การใช้งาน CPU (%)"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="อุณหภูมิ (°C)"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="การใช้ไฟฟ้า (W)"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="สถานะเครือข่าย"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        🔄 การอัปเดตอัตโนมัติ:
                      </Typography>
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>ความถี่การรีเฟรช</InputLabel>
                        <Select defaultValue={30} label="ความถี่การรีเฟรช">
                          <MenuItem value={10}>ทุก 10 วินาที</MenuItem>
                          <MenuItem value={30}>ทุก 30 วินาที</MenuItem>
                          <MenuItem value={60}>ทุก 1 นาที</MenuItem>
                          <MenuItem value={300}>ทุก 5 นาที</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="รีเฟรชอัตโนมัติ"
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        ⚠️ การแจ้งเตือน:
                      </Typography>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="แจ้งเตือน CPU สูง (>80%)"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="แจ้งเตือนอุณหภูมิสูง (>25°C)"
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="แจ้งเตือนอุปกรณ์ออฟไลน์"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.default' }}>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                  >
                    รีเฟรช Dashboard
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    บันทึกการตั้งค่า
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    component="a"
                    href="/ecc800/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ดู Dashboard
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DashboardIcon />}
                    component="a"
                    href="/ecc800/admin/dashboard-config"
                    sx={{
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
                      }
                    }}
                  >
                    จัดการ Dashboard Config
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 7: Content Management */}
      {tabValue === 7 && (
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            {/* Header */}
            <Grid item xs={12}>
              <Card sx={{ 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                mb: 3
              }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <EditIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    จัดการเนื้อหา
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
                    แก้ไขเนื้อหาของหน้า ศูนย์ช่วยเหลือ, ข้อกำหนดการใช้งาน, และนโยบายความเป็นส่วนตัว
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Help Page Content */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContactSupport sx={{ color: '#667eea' }} />
                      <Typography variant="h6">ศูนย์ช่วยเหลือ (Help)</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href="/ecc800/help"
                      target="_blank"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      ดูหน้า
                    </Button>
                  }
                  subheader="แก้ไขเนื้อหาหน้าศูนย์ช่วยเหลือ"
                />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      📝 หน้านี้แสดงคำถามที่พบบ่อย, วิธีการติดต่อ, และข้อมูลสำหรับผู้ใช้งาน
                    </Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    URL: <strong>https://10.251.150.222:3344/ecc800/help</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ mt: 1 }}
                  >
                    แก้ไขเนื้อหา
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Terms Page Content */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Article sx={{ color: '#f093fb' }} />
                      <Typography variant="h6">ข้อกำหนดการใช้งาน (Terms)</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href="/ecc800/terms"
                      target="_blank"
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      }}
                    >
                      ดูหน้า
                    </Button>
                  }
                  subheader="แก้ไขข้อกำหนดและเงื่อนไขการใช้งาน"
                />
                <CardContent>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      ⚠️ การแก้ไขข้อกำหนดจะมีผลกับผู้ใช้งานทั้งหมด กรุณาตรวจสอบอย่างละเอียดก่อนบันทึก
                    </Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    URL: <strong>https://10.251.150.222:3344/ecc800/terms</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ mt: 1 }}
                  >
                    แก้ไขเนื้อหา
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Privacy Page Content */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3 }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security sx={{ color: '#4facfe' }} />
                      <Typography variant="h6">นโยบายความเป็นส่วนตัว (Privacy)</Typography>
                    </Box>
                  }
                  action={
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      component="a"
                      href="/ecc800/privacy"
                      target="_blank"
                      sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      }}
                    >
                      ดูหน้า
                    </Button>
                  }
                  subheader="แก้ไขนโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูล"
                />
                <CardContent>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      🔒 นโยบายนี้เกี่ยวข้องกับกฎหมาย PDPA กรุณาปรึกษานักกฎหมายก่อนแก้ไข
                    </Typography>
                  </Alert>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    URL: <strong>https://10.251.150.222:3344/ecc800/privacy</strong>
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ mt: 1 }}
                  >
                    แก้ไขเนื้อหา
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 1, ml: 1 }}
                  >
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.default' }}>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e085eb 0%, #e54f62 100%)',
                      }
                    }}
                  >
                    บันทึกการเปลี่ยนแปลงทั้งหมด
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UpdateIcon />}
                  >
                    ดูประวัติการแก้ไข
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdminPage;
