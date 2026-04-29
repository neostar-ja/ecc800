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
} from '@mui/material';
import {
  Error,
  Warning,
  Info,
  Refresh,
  Timeline,
  Assessment,
  Download,
  FilterList,
  Search,
  History,
  NotificationImportant,
  Report,
  BugReport,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '../lib/api';
import { useSites } from '../lib/hooks';

// API Functions
const fetchSites = async () => {
  return apiGet('/sites');
};

const fetchEquipment = async (siteCode: string) => {
  if (!siteCode) return [];
  return apiGet(`/sites/${siteCode}/equipment`);
};

// Helper: Convert time range to date parameters
const getDateRangeFromTimeRange = (timeRange: string): { dt_from: string; dt_to: string } => {
  const now = new Date();
  let startDate = new Date(now);
  
  switch (timeRange) {
    case '1h':
      startDate.setHours(startDate.getHours() - 1);
      break;
    case '4h':
      startDate.setHours(startDate.getHours() - 4);
      break;
    case '24h':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '3d':
      startDate.setDate(startDate.getDate() - 3);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 1); // Default to 24h
  }
  
  return {
    dt_from: startDate.toISOString().split('T')[0] + ' 00:00:00',
    dt_to: now.toISOString().split('T')[0] + ' 23:59:59',
  };
};

const fetchFaults = async (siteCode: string, equipmentId: string, timeRange: string, severity?: string) => {
  if (!siteCode || !equipmentId) return { data: [], meta: { total_count: 0 } };
  
  const dateRange = getDateRangeFromTimeRange(timeRange);
  
  const params: any = {
    site_code: siteCode,
    equipment_id: equipmentId,
    ...dateRange,
  };
  
  if (severity && severity !== 'all') {
    params.severity = severity;
  }
  
  try {
    const result = await apiGet('/faults', params);
    // Ensure we have the right structure
    return {
      data: result.data || result || [],
      meta: result.meta || { total_count: 0 },
    };
  } catch (err) {
    console.error('Error fetching faults:', err);
    return { data: [], meta: { total_count: 0 } };
  }
};

const fetchFaultsSummary = async (siteCode: string, equipmentId: string, timeRange: string) => {
  if (!siteCode || !equipmentId) return null;
  
  try {
    const faults = await fetchFaults(siteCode, equipmentId, timeRange);
    const data = faults.data || [];
    
    // Calculate summary from fault data
    const summary = {
      total_faults: data.length,
      affected_equipment: 1, // Since we're filtering by equipment_id
      fault_types: new Set((data as any[]).map((f: any) => f.fault_type || f.metric_name)).size,
      latest_fault: data.length > 0 ? data[0]?.timestamp : undefined,
    };
    
    return summary;
  } catch (err) {
    console.error('Error fetching faults summary:', err);
    return null;
  }
};

const fetchTimeRanges = async () => {
  return {
    predefined: [
      { value: '1h', label: '1 ชั่วโมงล่าสุด', description: 'Last 1 hour' },
      { value: '4h', label: '4 ชั่วโมงล่าสุด', description: 'Last 4 hours' },
      { value: '24h', label: '24 ชั่วโมงล่าสุด', description: 'Last 24 hours' },
      { value: '3d', label: '3 วันล่าสุด', description: 'Last 3 days' },
      { value: '7d', label: '7 วันล่าสุด', description: 'Last 7 days' },
      { value: '30d', label: '30 วันล่าสุด', description: 'Last 30 days' },
    ],
    severities: [
      { value: 'all', label: 'ทั้งหมด', color: '#666' },
      { value: 'critical', label: 'วิกฤต', color: '#f44336' },
      { value: 'warning', label: 'เตือน', color: '#ff9800' },
      { value: 'info', label: 'ข้อมูล', color: '#2196f3' },
    ],
  };
};

// Type definitions
interface FaultsSummary {
  total_faults: number;
  affected_equipment: number;
  fault_types: number;
  latest_fault?: {
    timestamp: string;
    equipment_id: string;
    severity: string;
  };
}

interface FaultData {
  id: string;
  timestamp: string;
  equipment_id: string;
  severity: string;
  message: string;
  fault_type?: string;
}

interface TimeRangeData {
  predefined: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  severities: Array<{
    value: string;
    label: string;
    color: string;
  }>;
}

// Severity configuration
const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        color: '#f44336',
        bgcolor: '#ffebee',
        icon: <Error />,
        label: 'วิกฤต'
      };
    case 'warning':
      return {
        color: '#ff9800',
        bgcolor: '#fff3e0',
        icon: <Warning />,
        label: 'เตือน'
      };
    case 'info':
      return {
        color: '#2196f3',
        bgcolor: '#e3f2fd',
        icon: <Info />,
        label: 'ข้อมูล'
      };
    default:
      return {
        color: '#757575',
        bgcolor: '#f5f5f5',
        icon: <Info />,
        label: 'ทั่วไป'
      };
  }
};

const ImprovedFaultsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Queries
  const { data: sites, isLoading: sitesLoading } = useSites();

  const equipmentQuery = useQuery({
    queryKey: ['equipment', selectedSite],
    queryFn: () => fetchEquipment(selectedSite),
    enabled: !!selectedSite,
    staleTime: 10 * 60 * 1000, // 10 minutes - equipment rarely changes
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const timeRangesQuery = useQuery({
    queryKey: ['faultTimeRanges'],
    queryFn: fetchTimeRanges,
  });

  const faultsQuery = useQuery({
    queryKey: ['faults', selectedSite, selectedEquipment, selectedTimeRange, selectedSeverity],
    queryFn: () => fetchFaults(selectedSite, selectedEquipment, selectedTimeRange, selectedSeverity),
    enabled: !!(selectedSite && selectedEquipment),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const summaryQuery = useQuery({
    queryKey: ['faultsSummary', selectedSite, selectedEquipment, selectedTimeRange],
    queryFn: () => fetchFaultsSummary(selectedSite, selectedEquipment, selectedTimeRange),
    enabled: !!(selectedSite && selectedEquipment),
  });

  // Data with proper types
  const summary: any = summaryQuery.data || {};
  const faults: any = faultsQuery.data || [];
  const timeRanges: any = timeRangesQuery.data || {};
  const equipment: any = equipmentQuery.data || [];

  // Reset equipment when site changes
  useEffect(() => {
    if (selectedSite) {
      setSelectedEquipment('');
    }
  }, [selectedSite]);

  // Auto refresh
  useEffect(() => {
    let interval: number;
    if (autoRefresh && selectedSite && selectedEquipment) {
      interval = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['faults'] });
        queryClient.invalidateQueries({ queryKey: ['faultsSummary'] });
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedSite, selectedEquipment, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['faults'] });
    queryClient.invalidateQueries({ queryKey: ['faultsSummary'] });
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const FaultCard: React.FC<{ fault: any }> = ({ fault }) => {
    const severityConfig = getSeverityConfig(fault.severity);
    
    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          border: `2px solid ${alpha(severityConfig.color, 0.1)}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${alpha(severityConfig.color, 0.15)}`,
            border: `2px solid ${alpha(severityConfig.color, 0.3)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar
                sx={{
                  bgcolor: severityConfig.bgcolor,
                  color: severityConfig.color,
                  width: 40,
                  height: 40,
                }}
              >
                {severityConfig.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  {fault.fault_type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {fault.equipment_name}
                </Typography>
              </Box>
            </Box>
            
            <Chip
              label={severityConfig.label}
              sx={{
                bgcolor: severityConfig.bgcolor,
                color: severityConfig.color,
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                ค่าปัจจุบัน
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {fault.value} {fault.unit}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                เวลาที่เกิด
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {formatDateTime(fault.timestamp)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                สถานะ
              </Typography>
              <Chip
                label={fault.status === 'active' ? 'กำลังเกิดขึ้น' : 'แก้ไขแล้ว'}
                size="small"
                color={fault.status === 'active' ? 'error' : 'success'}
                variant="outlined"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const SummaryCard: React.FC = () => {
    if (summaryQuery.isLoading) {
      return (
        <Card sx={{ height: 200 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress />
          </CardContent>
        </Card>
      );
    }

    if (!summaryQuery.data) {
      return null;
    }

    const summary = summaryQuery.data;
    
    return (
      <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)` }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment /> สรุปข้อมูล Faults
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                  {(summary as any)?.total_faults || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Faults
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                  {(summary as any)?.affected_equipment || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Affected Equipment
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                  {(summary as any)?.fault_types || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fault Types
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                  {(summary as any)?.latest_fault ? formatDateTime((summary as any).latest_fault) : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Latest Fault
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Report sx={{ fontSize: 40, color: theme.palette.error.main }} />
          Enhanced Faults Monitor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ระบบติดตามและวิเคราะห์ข้อผิดพลาดของอุปกรณ์ในศูนย์ข้อมูล
        </Typography>
      </Box>

      {/* Controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Site Selection */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>เลือกไซต์</InputLabel>
              <Select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                label="เลือกไซต์"
                disabled={sitesLoading}
              >
                {sites?.map((site: any) => (
                  <MenuItem key={site.site_code} value={site.site_code}>
                    {site.site_code} - {site.site_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Equipment Selection */}
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>เลือกอุปกรณ์</InputLabel>
              <Select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                label="เลือกอุปกรณ์"
                disabled={!selectedSite || equipmentQuery.isLoading}
              >
                {equipment
                  ?.sort((a: any, b: any) => (a.display_name || a.equipment_name || a.equipment_id).localeCompare(b.display_name || b.equipment_name || b.equipment_id, undefined, { numeric: true, sensitivity: 'base' }))
                  .map((equip: any) => (
                    <MenuItem key={equip.equipment_id} value={equip.equipment_id}>
                      {equip.display_name || equip.equipment_name || equip.equipment_id}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Time Range Selection */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ช่วงเวลา</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                label="ช่วงเวลา"
              >
                {timeRanges.predefined?.map((range: any) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Severity Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ระดับความรุนแรง</InputLabel>
              <Select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                label="ระดับความรุนแรง"
              >
                {timeRanges.severities?.map((severity: any) => (
                  <MenuItem key={severity.value} value={severity.value}>
                    {severity.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Controls */}
          <Grid item xs={12} sm={12} md={3}>
            <Box display="flex" gap={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    size="small"
                  />
                }
                label="Auto Refresh"
                sx={{ mr: 2 }}
              />
              
              <IconButton
                onClick={handleRefresh}
                disabled={faultsQuery.isFetching}
                sx={{ bgcolor: 'background.paper' }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Card */}
      {selectedSite && selectedEquipment && (
        <Box mb={4}>
          <SummaryCard />
        </Box>
      )}

      {/* Content */}
      {!selectedSite || !selectedEquipment ? (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`
          }}
        >
          <BugReport sx={{ fontSize: 80, color: theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.secondary }}>
            เลือกไซต์และอุปกรณ์เพื่อดู Faults
          </Typography>
          <Typography variant="body1" color="text.secondary">
            กรุณาเลือกไซต์และอุปกรณ์ที่ต้องการตรวจสอบข้อมูล faults
          </Typography>
        </Paper>
      ) : faultsQuery.isLoading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: 200 }}>
                <CardContent>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" height={30} sx={{ mt: 1 }} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : faultsQuery.error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          เกิดข้อผิดพลาดในการดึงข้อมูล faults: {(faultsQuery.error as Error).message}
        </Alert>
      ) : !faults || faults.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)}, ${alpha(theme.palette.info.main, 0.05)})`
          }}
        >
          <NotificationImportant sx={{ fontSize: 80, color: theme.palette.success.main, mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: theme.palette.success.main }}>
            ไม่พบ Faults
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ไม่มีข้อมูล faults ในช่วงเวลาที่เลือก อุปกรณ์ทำงานปกติ
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {faults.map((fault: any) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={fault.id}>
              <FaultCard fault={fault} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating refresh button */}
      {selectedSite && selectedEquipment && (
        <Fab
          color="primary"
          onClick={handleRefresh}
          disabled={faultsQuery.isFetching}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <Refresh />
        </Fab>
      )}
    </Container>
  );
};

export default ImprovedFaultsPage;
