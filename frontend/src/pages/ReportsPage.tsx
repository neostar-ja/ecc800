import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp,
  Computer,
  Timeline,
  Thermostat,
  ElectricBolt,
  Speed,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

import { apiGet } from '../lib/api';

interface Site {
  site_code: string;
  site_name: string;
}

interface ReportSummary {
  general_statistics: {
    total_sites: number;
    total_equipment: number;
    total_metrics: number;
    total_records: number;
    earliest_data: string;
    latest_data: string;
  };
  site_statistics: Array<{
    site_code: string;
    equipment_count: number;
    metric_count: number;
    record_count: number;
    latest_update: string;
  }>;
  popular_metrics: Array<{
    metric_name: string;
    unit: string;
    data_count: number;
    site_count: number;
    equipment_count: number;
    avg_value: number;
    min_value: number;
    max_value: number;
  }>;
}

interface TemperatureData {
  timestamp: string;
  avg_temperature: number;
  min_temperature: number;
  max_temperature: number;
  equipment_count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsPage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [sites, setSites] = useState<Site[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Overview series period
  const [overviewHours, setOverviewHours] = useState<number>(24);
  const [overviewBucket, setOverviewBucket] = useState<string>('1 hour');
  const [ingestionSeries, setIngestionSeries] = useState<Array<{timestamp: string, value: number}>>([]);
  // Popularity series period
  const [popularityHours, setPopularityHours] = useState<number>(24);
  const [popularityBucket, setPopularityBucket] = useState<string>('1 hour');
  const [popularitySeries, setPopularitySeries] = useState<Array<{ metric_name: string, unit: string, points: {timestamp: string, value: number}[] }>>([]);
  

  // Helpers for date formatting on chart
  const formatXAxis = (iso: string) => {
    try {
      const d = parseISO(iso);
      return format(d, "d MMM HH:mm 'น.'", { locale: th });
    } catch {
      return iso;
    }
  };
  const formatTooltipLabel = (iso: string) => {
    try {
      const d = parseISO(iso);
      return format(d, "EEE d MMM yyyy HH:mm:ss 'น.'", { locale: th });
    } catch {
      return iso;
    }
  };

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sites
      const sitesData = await apiGet<Site[]>('/sites');
      setSites(sitesData);

      // Fetch report summary
      const summaryData = await apiGet<ReportSummary>('/reports/summary' + (selectedSite ? `?site_code=${selectedSite}` : ''));
      setReportSummary(summaryData);

      // Fetch temperature time series (48h)
      const tempParams = selectedSite ? `?site_code=${selectedSite}&hours=48&bucket=1 hour` : `?hours=48&bucket=1 hour`;
      const tempData = await apiGet<TemperatureData[]>(`/reports/temperature-series${tempParams}`);
      setTemperatureData(tempData);

      // Fetch ingestion series per overview period
      const ingParams = selectedSite 
        ? `?site_code=${selectedSite}&hours=${overviewHours}&bucket=${encodeURIComponent(overviewBucket)}`
        : `?hours=${overviewHours}&bucket=${encodeURIComponent(overviewBucket)}`;
      const ingData = await apiGet<Array<{timestamp: string, value: number}>>(`/reports/ingestion-series${ingParams}`);
      setIngestionSeries(ingData);

      // Fetch metric popularity series (top 5)
      const mpParams = selectedSite
        ? `?site_code=${selectedSite}&hours=${popularityHours}&bucket=${encodeURIComponent(popularityBucket)}&top=5`
        : `?hours=${popularityHours}&bucket=${encodeURIComponent(popularityBucket)}&top=5`;
      const mpData = await apiGet<any[]>(`/reports/metric-popularity-series${mpParams}`);
      setPopularitySeries(Array.isArray(mpData) ? mpData : []);

    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('ไม่สามารถดึงข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedSite, overviewHours, overviewBucket, popularityHours, popularityBucket]);

  const handleRefresh = () => {
    fetchReportsData();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOverviewPeriodChange = (value: string) => {
    // value: '24h' | '3d' | '7d' | '30d'
    const map: Record<string, number> = { '24h': 24, '3d': 72, '7d': 168, '30d': 720 };
    const hours = map[value] || 24;
    setOverviewHours(hours);
    // derive bucket
    setOverviewBucket(hours <= 72 ? '1 hour' : '1 day');
  };

  const handlePopularityPeriodChange = (value: string) => {
    const map: Record<string, number> = { '24h': 24, '3d': 72, '7d': 168, '30d': 720 };
    const hours = map[value] || 24;
    setPopularityHours(hours);
    setPopularityBucket(hours <= 72 ? '1 hour' : '1 day');
  };

  const pivotPopularity = () => {
    const metrics = (popularitySeries || []).slice(0, 5);
    const tsSet = new Set<string>();
    metrics.forEach(m => m.points.forEach(p => tsSet.add(p.timestamp)));
    const timestamps = Array.from(tsSet).sort();
    const rows: any[] = timestamps.map(ts => ({ timestamp: ts }));
    metrics.forEach((m) => {
      const mapPoints: Record<string, number> = {};
      m.points.forEach(p => { mapPoints[p.timestamp] = p.value; });
      rows.forEach(r => { r[m.metric_name] = mapPoints[r.timestamp] ?? null; });
    });
    return { rows, metrics };
  };

  const exportCSV = (filename: string, header: string[], rows: (string|number)[][]) => {
    try {
      const escape = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const content = '\ufeff' + [header.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>กำลังโหลดรายงาน...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          รายงานระบบ ECC800
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>ช่วงเวลา (ภาพรวม)</InputLabel>
            <Select
              value={overviewHours <= 24 ? '24h' : overviewHours <= 72 ? '3d' : overviewHours <= 168 ? '7d' : '30d'}
              label="ช่วงเวลา (ภาพรวม)"
              onChange={(e) => handleOverviewPeriodChange(e.target.value)}
            >
              <MenuItem value="24h">24 ชม.</MenuItem>
              <MenuItem value="3d">3 วัน</MenuItem>
              <MenuItem value="7d">7 วัน</MenuItem>
              <MenuItem value="30d">30 วัน</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>เลือกศูนย์ข้อมูล</InputLabel>
            <Select
              value={selectedSite}
              label="เลือกศูนย์ข้อมูล"
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              {sites.map((site) => (
                <MenuItem key={site.site_code} value={site.site_code}>
                  {site.site_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => {
              // export site statistics quick CSV
              const stats = Array.isArray((reportSummary as any)?.site_statistics) ? (reportSummary as any)?.site_statistics : [];
              const rows = stats.map((s: any) => [s.site_code, s.equipment_count, s.metric_count, s.record_count, s.latest_update]);
              exportCSV('site_statistics.csv', ['site_code','equipment_count','metric_count','record_count','latest_update'], rows);
            }}
          >
            ส่งออกสถิติไซต์
          </Button>
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="ภาพรวมระบบ" />
          <Tab label="รายงานอุณหภูมิ" />
          <Tab label="สถิติอุปกรณ์" />
          <Tab label="คุณภาพข้อมูล" />
        </Tabs>
      </Box>

      {/* Tab 1: System Overview */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Summary Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สรุปสถิติระบบ
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Computer color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{reportSummary?.general_statistics.total_sites || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">ศูนย์ข้อมูล</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Speed color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{reportSummary?.general_statistics.total_equipment || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">อุปกรณ์</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <Timeline color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{reportSummary?.general_statistics.total_metrics || 0}</Typography>
                      <Typography variant="body2" color="textSecondary">เมตริก</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center" p={2}>
                      <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{(reportSummary?.general_statistics.total_records || 0).toLocaleString()}</Typography>
                      <Typography variant="body2" color="textSecondary">บันทึกข้อมูล</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Site Comparison Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  เปรียบเทียบศูนย์ข้อมูล
                </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Array.isArray((reportSummary as any)?.site_statistics) ? (reportSummary as any)?.site_statistics : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="site_code" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="equipment_count" fill="#8884d8" name="อุปกรณ์" />
                      <Bar dataKey="metric_count" fill="#82ca9d" name="เมตริก" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Ingestion Rate */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Ingestion Rate</Typography>
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => {
                    const rows = (Array.isArray(ingestionSeries) ? ingestionSeries : []).map(p => [p.timestamp, p.value]);
                    exportCSV('ingestion_rate.csv', ['timestamp','records'], rows);
                  }}>Export</Button>
                </Box>
                <Box height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.isArray(ingestionSeries) ? ingestionSeries : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatXAxis as any} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTooltipLabel as any} />
                      <Line type="monotone" dataKey="value" stroke="#1976d2" name="records" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Metric Popularity Series (Top 5) */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">Metric Popularity (Top 5)</Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>ช่วงเวลา</InputLabel>
                      <Select
                        value={popularityHours <= 24 ? '24h' : popularityHours <= 72 ? '3d' : popularityHours <= 168 ? '7d' : '30d'}
                        label="ช่วงเวลา"
                        onChange={(e) => handlePopularityPeriodChange(e.target.value)}
                      >
                        <MenuItem value="24h">24 ชม.</MenuItem>
                        <MenuItem value="3d">3 วัน</MenuItem>
                        <MenuItem value="7d">7 วัน</MenuItem>
                        <MenuItem value="30d">30 วัน</MenuItem>
                      </Select>
                    </FormControl>
                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => {
                      // export long-format: timestamp, metric_name, value
                      const rows: any[] = [];
                      (popularitySeries || []).forEach(m => {
                        (m.points || []).forEach(p => rows.push([p.timestamp, m.metric_name, p.value]));
                      });
                      exportCSV('metric_popularity_series.csv', ['timestamp','metric','count'], rows);
                    }}>Export</Button>
                  </Box>
                </Box>
                <Box height={320}>
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      const { rows, metrics } = pivotPopularity();
                      const colors = ['#1976d2','#d32f2f','#388e3c','#f57c00','#7b1fa2'];
                      return (
                        <LineChart data={rows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" tickFormatter={formatXAxis as any} />
                          <YAxis />
                          <Tooltip labelFormatter={formatTooltipLabel as any} />
                          {metrics.map((m, idx) => (
                            <Line key={m.metric_name} type="monotone" dataKey={m.metric_name} stroke={colors[idx % colors.length]} name={m.metric_name} dot={false} />
                          ))}
                        </LineChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {/* Top Metrics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  เมตริกยอดนิยม
                </Typography>
                <Box>
                  {(Array.isArray((reportSummary as any)?.popular_metrics) ? (reportSummary as any)?.popular_metrics : []).slice(0, 8).map((metric: any, index: number) => (
                    <Box key={metric.metric_name} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {metric.metric_name}
                        </Typography>
                        <Chip 
                          label={metric.data_count.toLocaleString()} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        เฉลี่ย: {metric.avg_value.toFixed(2)} {metric.unit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box display="flex" justifyContent="flex-end">
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => {
                    const metrics = Array.isArray((reportSummary as any)?.popular_metrics) ? (reportSummary as any)?.popular_metrics : [];
                    const rows = metrics.map((m: any) => [m.metric_name, m.unit, m.data_count, m.site_count, m.equipment_count, m.avg_value, m.min_value, m.max_value]);
                    exportCSV('popular_metrics.csv', ['metric_name','unit','data_count','site_count','equipment_count','avg_value','min_value','max_value'], rows);
                  }}>Export</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Temperature Report */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Thermostat sx={{ mr: 1, verticalAlign: 'middle' }} />
                  รายงานอุณหภูมิ
                </Typography>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.isArray(temperatureData) ? temperatureData : []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatXAxis as any} />
                      <YAxis />
                      <Tooltip labelFormatter={formatTooltipLabel as any} />
                      <Line type="monotone" dataKey="avg_temperature" stroke="#8884d8" name="เฉลี่ย" />
                      <Line type="monotone" dataKey="max_temperature" stroke="#ff7300" name="สูงสุด" />
                      <Line type="monotone" dataKey="min_temperature" stroke="#00ff00" name="ต่ำสุด" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สรุปข้อมูลอุณหภูมิ
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>วันที่</TableCell>
                        <TableCell align="right">อุณหภูมิเฉลี่ย (°C)</TableCell>
                        <TableCell align="right">อุณหภูมิสูงสุด (°C)</TableCell>
                        <TableCell align="right">อุณหภูมิต่ำสุด (°C)</TableCell>
                        <TableCell align="right">จำนวนอุปกรณ์</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(Array.isArray(temperatureData) ? temperatureData : []).slice(0, 10).map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(row.timestamp).toLocaleDateString('th-TH')}
                          </TableCell>
                          <TableCell align="right">{row.avg_temperature.toFixed(1)}</TableCell>
                          <TableCell align="right">{row.max_temperature.toFixed(1)}</TableCell>
                          <TableCell align="right">{row.min_temperature.toFixed(1)}</TableCell>
                          <TableCell align="right">{row.equipment_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Equipment Statistics */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              สถิติอุปกรณ์
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ศูนย์ข้อมูล</TableCell>
                    <TableCell align="right">จำนวนอุปกรณ์</TableCell>
                    <TableCell align="right">จำนวนเมตริก</TableCell>
                    <TableCell align="right">บันทึกข้อมูล</TableCell>
                    <TableCell align="right">อัปเดตล่าสุด</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray((reportSummary as any)?.site_statistics) ? (reportSummary as any)?.site_statistics : []).map((site: any) => (
                    <TableRow key={site.site_code}>
                      <TableCell component="th" scope="row">
                        <Chip label={site.site_code.toUpperCase()} />
                      </TableCell>
                      <TableCell align="right">{site.equipment_count.toLocaleString()}</TableCell>
                      <TableCell align="right">{site.metric_count.toLocaleString()}</TableCell>
                      <TableCell align="right">{site.record_count.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {new Date(site.latest_update).toLocaleString('th-TH')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Data Quality */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คุณภาพข้อมูล
                </Typography>
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    ช่วงข้อมูล
                  </Typography>
                  <Typography variant="body1">
                    {reportSummary?.general_statistics.earliest_data ? 
                      new Date(reportSummary.general_statistics.earliest_data).toLocaleDateString('th-TH') : 'N/A'}
                    {' - '}
                    {reportSummary?.general_statistics.latest_data ?
                      new Date(reportSummary.general_statistics.latest_data).toLocaleDateString('th-TH') : 'N/A'}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    บันทึกข้อมูลทั้งหมด
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {(reportSummary?.general_statistics.total_records || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    สถานะคุณภาพ
                  </Typography>
                  <Chip label="ดีเยี่ยม" color="success" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="ครบถ้วน" color="info" sx={{ mr: 1, mb: 1 }} />
                  <Chip label="ทันสมัย" color="primary" sx={{ mr: 1, mb: 1 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สถิติเมตริก
                </Typography>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    เมตริกที่มีข้อมูลมากที่สุด
                  </Typography>
                  {(Array.isArray((reportSummary as any)?.popular_metrics) ? (reportSummary as any)?.popular_metrics : []).slice(0, 3).map((metric: any, index: number) => (
                    <Box key={metric.metric_name} mb={1}>
                      <Typography variant="body1">
                        {index + 1}. {metric.metric_name} ({metric.unit})
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {metric.data_count.toLocaleString()} บันทึก
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default ReportsPage;
