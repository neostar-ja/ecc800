import React, { useState } from 'react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
  Timeline,
  BugReport,
  Computer,
} from '@mui/icons-material';

import { useSites, useFaults, useEquipment } from '../lib/hooks';
import { timeRanges } from '../lib/hooks';
import TimeSeriesChart from '../components/TimeSeriesChart';

const FaultsPage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last24Hours');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');

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

  // Fetch fault data for selected site
  const { data: faultDataList, isLoading: faultLoading, error: faultError, refetch } = useFaults(
    selectedSite ? {
      site_code: selectedSite,
      start_time: timeRange.start_time,
      end_time: timeRange.end_time,
      equipment_id: selectedEquipment || undefined,
    } : { site_code: '' },
    { enabled: !!selectedSite }
  );

  // Combine fault data from all equipment
  const faultData = React.useMemo(() => {
    if (!faultDataList || faultDataList.length === 0) return null;
    
    // Combine all faults into a single response
    const allFaults = faultDataList.flatMap(item => item.faults || []);
    const totalFaults = faultDataList.reduce((sum, item) => sum + (item.total_faults || 0), 0);
    
    const currentTimeRange = getTimeRange();
    
    return {
      site_code: selectedSite,
      equipment_id: null,
      interval: faultDataList[0]?.interval || 'raw',
      faults: allFaults,
      total_faults: totalFaults,
      from_time: faultDataList[0]?.from_time || currentTimeRange.start_time,
      to_time: faultDataList[0]?.to_time || currentTimeRange.end_time,
    };
  }, [faultDataList, selectedSite, selectedTimeRange]);

  const getSeverityIcon = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <Error color="error" />;
      case 'warning':
      case 'medium':
        return <Warning color="warning" />;
      case 'info':
      case 'low':
        return <Info color="info" />;
      default:
        return <BugReport color="disabled" />;
    }
  };

  const getSeverityColor = (severity?: string): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'warning':
      case 'medium':
        return 'warning';
      case 'info':
      case 'low':
        return 'info';
      default:
        return 'default';
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
          ไม่สามารถโหลดข้อมูลไซต์ได้: {String(sitesError)}
        </Alert>
      </Container>
    );
  }

  // Prepare chart data from fault data
  const chartData = React.useMemo(() => {
    if (!faultData?.faults) return [];
    
    return faultData.faults.map(point => ({
      timestamp: new Date(point.timestamp).toISOString(),
      value: point.fault_count || 0,
      label: `${point.fault_count || 0} เหตุการณ์`,
    }));
  }, [faultData]);

  // Calculate fault statistics
  const faultStats = React.useMemo(() => {
    if (!faultData?.faults) return { total: 0, critical: 0, warning: 0, resolved: 0 };
    
    const total = faultData.total_faults;
    const critical = faultData.faults.filter(f => f.severity?.toLowerCase().includes('critical') || f.severity?.toLowerCase().includes('high')).length;
    const warning = faultData.faults.filter(f => f.severity?.toLowerCase().includes('warning') || f.severity?.toLowerCase().includes('medium')).length;
    const resolved = 0; // Backend doesn't provide status info, so assume all are unresolved
    
    return { total, critical, warning, resolved };
  }, [faultData]);

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
          ไม่สามารถโหลดข้อมูลไซต์ได้: {String(sitesError)}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            🚨 จัดการเหตุการณ์ผิดปกติ
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            ติดตามและวิเคราะห์เหตุการณ์ผิดปกติในระบบ
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()} disabled={!selectedSite}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="เลือกไซต์"
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setSelectedEquipment(''); // Reset equipment selection
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
            
            <Grid item xs={12} md={4}>
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

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="เลือกอุปกรณ์ (ทั้งหมด)"
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                variant="outlined"
                disabled={!selectedSite}
              >
                <MenuItem value="">-- ทั้งหมด --</MenuItem>
                {equipment
                  ?.sort((a: any, b: any) => (a.equipment_name || a.equipment_id || '').localeCompare(b.equipment_name || b.equipment_id || '', undefined, { numeric: true, sensitivity: 'base' }))
                  .map((eq) => (
                    <MenuItem key={eq.equipment_id} value={eq.equipment_id || ''}>
                      {eq.equipment_name || eq.equipment_id || 'ไม่ระบุ'}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Fault Statistics */}
      {selectedSite && faultData && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <BugReport color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {faultStats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      เหตุการณ์ทั้งหมด
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
                  <Error color="error" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {faultStats.critical}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      วิกฤต
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
                  <Warning color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {faultStats.warning}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      เตือน
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
                  <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {faultStats.resolved}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      แก้ไขแล้ว
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Fault Trend Chart */}
      {selectedSite && chartData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 แนวโน้มเหตุการณ์ผิดปกติ
            </Typography>
            <TimeSeriesChart
              data={chartData}
              title="จำนวนเหตุการณ์ผิดปกติ"
              yAxisLabel="จำนวนเหตุการณ์"
              color="#f44336"
            />
          </CardContent>
        </Card>
      )}

      {/* Fault Events Table */}
      {selectedSite && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 รายการเหตุการณ์ผิดปกติ - {sites?.find(s => s.site_code === selectedSite)?.site_name}
            </Typography>

            {faultLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  กำลังโหลดข้อมูลเหตุการณ์ผิดปกติ...
                </Typography>
              </Box>
            ) : faultError ? (
              <Alert severity="error">
                ไม่สามารถโหลดข้อมูลเหตุการณ์ผิดปกติได้: {faultError.message}
              </Alert>
            ) : !faultData?.faults || faultData.faults.length === 0 ? (
              <Box textAlign="center" py={4}>
                <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  ไม่พบเหตุการณ์ผิดปกติ
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  ระบบทำงานปกติในช่วงเวลาที่เลือก
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>เวลา</TableCell>
                      <TableCell>อุปกรณ์</TableCell>
                      <TableCell>ความรุนแรง</TableCell>
                      <TableCell>รายละเอียด</TableCell>
                      <TableCell>สถานะ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faultData.faults.map((fault, index) => (
                      <TableRow key={`fault-${index}`} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {fault.timestamp ? new Date(fault.timestamp).toLocaleString('th-TH') : 'ไม่ระบุ'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Computer fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {fault.equipment_id || 'ไม่ระบุ'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getSeverityIcon(fault.severity || undefined)}
                            <Chip 
                              label={fault.severity || 'ไม่ทราบ'}
                              color={getSeverityColor(fault.severity || undefined)}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {`จำนวน: ${fault.fault_count}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={'กำลังดำเนินการ'}
                            color={'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Site Selected */}
      {!selectedSite && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Warning sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                เลือกไซต์เพื่อดูเหตุการณ์ผิดปกติ
              </Typography>
              <Typography variant="body1" color="textSecondary">
                กรุณาเลือกไซต์จากรายการด้านบนเพื่อแสดงข้อมูลเหตุการณ์ผิดปกติ
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default FaultsPage;
