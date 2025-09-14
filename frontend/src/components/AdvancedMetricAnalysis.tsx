import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  Analytics,
  DataArray,
  Download,
  ZoomIn,
} from '@mui/icons-material';
import MetricChart from './MetricChart';

interface MetricValue {
  timestamp: string;
  value: number;
  min_val?: number;
  max_val?: number;
  sample_count?: number;
  unit: string;
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
  metric: {
    metric_name: string;
    display_name: string;
    unit: string;
    data_points: number;
    category: string;
    description: string;
    icon: string;
    color: string;
  };
  statistics: MetricStats;
  data_points: MetricValue[];
  time_range: {
    from: string;
    to: string;
    interval: string;
    period: string;
  };
  chart_config: ChartConfig;
}

interface AdvancedMetricAnalysisProps {
  data: DetailedMetric;
  onClose: () => void;
  context?: {
    site_code?: string;
    equipment_id?: string;
    equipment_name?: string;
    metric_name?: string;
  };
}

const AdvancedMetricAnalysis: React.FC<AdvancedMetricAnalysisProps> = ({ data, onClose, context }) => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);

  // --- Helper: แปลง timestamp เป็นรูปแบบ YYYYMMDDHHmm ---
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

  // --- Helper: escape ฟิลด์ CSV ตาม RFC 4180 ---
  const escapeCsvField = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const buildCsv = (): { filename: string; content: string } => {
    const header = ['timestamp', 'value', 'unit', 'min_val', 'max_val', 'sample_count'];
    const rows: string[] = [header.join(',')];

    for (const p of data.data_points) {
      rows.push(
        [
          escapeCsvField(p.timestamp),
          // เก็บ precision เดิมจาก backend โดยไม่ format เพิ่ม
          escapeCsvField(p.value),
          escapeCsvField(p.unit ?? ''),
          p.min_val === undefined ? '' : escapeCsvField(p.min_val),
          p.max_val === undefined ? '' : escapeCsvField(p.max_val),
          p.sample_count === undefined ? '' : escapeCsvField(p.sample_count),
        ].join(',')
      );
    }

    const fromTs = toCompactTs(data.time_range.from);
    const toTs = toCompactTs(data.time_range.to);
    const filename = `${data.metric.metric_name}_${(data as any).site_code ?? 'site'}_${(data as any).equipment_id ?? 'equip'}_${data.time_range.period}_${fromTs}_${toTs}.csv`;
    // เพิ่ม BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
    const content = '\ufeff' + rows.join('\n');
    return { filename, content };
  };

  // --- Excel-friendly CSV: เวลาอ่านง่าย + เพิ่ม Site/อุปกรณ์/เมตริก + ตัด min/max ออก ---
  const buildExcelFriendlyCsv = (): { filename: string; content: string } => {
    const site = context?.site_code ?? (data as any).site_code ?? '';
    const equipId = context?.equipment_id ?? (data as any).equipment_id ?? '';
    const equipName = context?.equipment_name ?? '';
    const metricDisp = context?.metric_name ?? data.metric?.display_name ?? data.metric?.metric_name ?? '';

    const header = ['time', 'site', 'equipment', 'metric', 'value', 'unit', 'sample_count', 'interval', 'period'];
    const rows: string[] = [header.join(',')];

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

    for (const p of data.data_points) {
      rows.push([
        escapeCsvField(human(p.timestamp)),
        escapeCsvField(site),
        escapeCsvField(equipName || equipId),
        escapeCsvField(metricDisp),
        escapeCsvField(p.value),
        escapeCsvField(p.unit ?? ''),
        p.sample_count === undefined ? '' : escapeCsvField(p.sample_count),
        escapeCsvField(data.time_range.interval || ''),
        escapeCsvField(data.time_range.period || ''),
      ].join(','));
    }

    const fromTs = toCompactTs(data.time_range.from);
    const toTs = toCompactTs(data.time_range.to);
    const filename = `${site || 'site'}_${(equipName || equipId || 'equip')}_${data.metric.metric_name}_${data.time_range.period}_${fromTs}_${toTs}.csv`;
    const content = '\\ufeff' + rows.join('\\n');
    return { filename, content };
  };

  // Calculate advanced statistics
  const advancedStats = React.useMemo(() => {
    const values = data.data_points.map(d => d.value);
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Detect outliers (values outside 1.5 * IQR)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = values.filter(v => v < lowerBound || v > upperBound);
    
    // Calculate coefficient of variation
    const cv = data.statistics.std_dev / data.statistics.avg * 100;
    
    // Calculate recent trend (last 10% of data)
    const recentCount = Math.max(1, Math.floor(values.length * 0.1));
    const recentValues = values.slice(-recentCount);
    const oldValues = values.slice(0, recentCount);
    
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const oldAvg = oldValues.reduce((a, b) => a + b, 0) / oldValues.length;
    const trendChange = ((recentAvg - oldAvg) / oldAvg) * 100;

    return {
      q1,
      q3,
      iqr,
      outliers: outliers.length,
      outlierPercentage: (outliers.length / values.length) * 100,
      cv,
      recentTrend: trendChange,
      stability: cv < 10 ? 'stable' : cv < 25 ? 'moderate' : 'volatile',
      dataQuality: (values.length / data.metric.data_points) * 100
    };
  }, [data]);

  const TabPanel = ({ children, value, index }: any) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab icon={<Timeline />} label="📈 กราฟและแนวโน้ม" />
          <Tab icon={<Analytics />} label="📊 สถิติขั้นสูง" />
          <Tab icon={<DataArray />} label="📋 ข้อมูลดิบ" />
        </Tabs>
      </Box>

      {/* Tab 1: Chart and Trends */}
      <TabPanel value={selectedTab} index={0}>
        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    📈 {data.metric.display_name} ({data.metric.unit})
                  </Typography>
                  <Box>
                    <Chip 
                      label={data.time_range.period === 'custom' ? 'ช่วงที่กำหนด' : data.time_range.period}
                      color="primary" 
                      size="small"
                    />
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <ZoomIn />
                    </IconButton>
                  </Box>
                </Box>
                
                <MetricChart
                  data={data.data_points}
                  title=""
                  config={data.chart_config}
                  height={450}
                />
                
                <Typography variant="body2" color="textSecondary" mt={2}>
                  ⏰ ช่วงข้อมูล: {new Date(data.time_range.from).toLocaleString('th-TH')} 
                  {' → '} {new Date(data.time_range.to).toLocaleString('th-TH')}
                  {' | '} รวมข้อมูลทุก: {data.time_range.interval}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics Cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {data.statistics.latest.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ค่าปัจจุบัน
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {data.metric.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {data.statistics.avg.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ค่าเฉลี่ย
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {data.metric.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {data.statistics.max.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      สูงสุด
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {data.metric.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {data.statistics.min.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ต่ำสุด
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {data.metric.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Trend Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 การวิเคราะห์แนวโน้ม
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  {data.statistics.trend === 'increasing' ? (
                    <>
                      <TrendingUp color="success" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" color="success.main">แนวโน้มเพิ่มขึ้น</Typography>
                        <Typography variant="body2" color="textSecondary">
                          ค่าปัจจุบันสูงกว่าค่าเฉลี่ย {((data.statistics.latest / data.statistics.avg - 1) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </>
                  ) : data.statistics.trend === 'decreasing' ? (
                    <>
                      <TrendingDown color="error" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" color="error.main">แนวโน้มลดลง</Typography>
                        <Typography variant="body2" color="textSecondary">
                          ค่าปัจจุบันต่ำกว่าค่าเฉลี่ย {((1 - data.statistics.latest / data.statistics.avg) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Analytics color="info" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" color="info.main">แนวโน้มคงที่</Typography>
                        <Typography variant="body2" color="textSecondary">
                          ค่าปัจจุบันใกล้เคียงกับค่าเฉลี่ย
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 2: Advanced Statistics */}
      <TabPanel value={selectedTab} index={1}>
        {advancedStats && (
          <Grid container spacing={3}>
            {/* Statistical Distribution */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 การกระจายทางสถิติ
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Q1 (25%):</strong> {advancedStats.q1.toFixed(2)} {data.metric.unit}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>Q3 (75%):</strong> {advancedStats.q3.toFixed(2)} {data.metric.unit}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>IQR:</strong> {advancedStats.iqr.toFixed(2)} {data.metric.unit}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>ส่วนเบี่ยงเบนมาตรฐาน:</strong> {data.statistics.std_dev.toFixed(3)}
                    </Typography>
                    <Typography variant="body2">
                      • <strong>ค่าสัมประสิทธิ์ความแปรปรวน:</strong> {advancedStats.cv.toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Data Quality */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🎯 คุณภาพข้อมูล
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>ความครบถ้วน:</strong> {advancedStats.dataQuality.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>ค่าผิดปกติ:</strong> {advancedStats.outliers} จุด ({advancedStats.outlierPercentage.toFixed(1)}%)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      • <strong>ความเสถียร:</strong> {
                        advancedStats.stability === 'stable' ? '🟢 เสถียร' :
                        advancedStats.stability === 'moderate' ? '🟡 ปานกลาง' : '🔴 ผันผวน'
                      }
                    </Typography>
                    <Typography variant="body2">
                      • <strong>แนวโน้มล่าสุด:</strong> {
                        advancedStats.recentTrend > 5 ? '📈 เพิ่มขึ้นอย่างรวดเร็ว' :
                        advancedStats.recentTrend > 1 ? '📈 เพิ่มขึ้นเล็กน้อย' :
                        advancedStats.recentTrend > -1 ? '➡️ คงที่' :
                        advancedStats.recentTrend > -5 ? '📉 ลดลงเล็กน้อย' : '📉 ลดลงอย่างรวดเร็ว'
                      } ({advancedStats.recentTrend.toFixed(1)}%)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Performance Indicators */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⚡ ตัวชี้วัดประสิทธิภาพ
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <Typography variant="h5" color="primary">
                          {((data.statistics.latest / data.statistics.avg) * 100).toFixed(0)}%
                        </Typography>
                        <Typography variant="caption">เทียบกับเฉลี่ย</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                        <Typography variant="h5" color="success.main">
                          {data.data_points.length.toLocaleString()}
                        </Typography>
                        <Typography variant="caption">จุดข้อมูล</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                        <Typography variant="h5" color="warning.main">
                          {((data.statistics.max - data.statistics.min) / data.statistics.avg * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">ช่วงความแปรปรวน</Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                        <Typography variant="h5" color="info.main">
                          {data.time_range.interval}
                        </Typography>
                        <Typography variant="caption">ความละเอียดเวลา</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Tab 3: Raw Data Table */}
      <TabPanel value={selectedTab} index={2}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                📋 ข้อมูลดิบ ({data.data_points.length.toLocaleString()} รายการ)
              </Typography>
              {/* ปุ่มส่งออกถูกย้ายไปไว้ที่ DialogActions ตามคำขอ */}
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>⏰ เวลา</strong></TableCell>
                    <TableCell align="right"><strong>📊 ค่า</strong></TableCell>
                    <TableCell><strong>📏 หน่วย</strong></TableCell>
                    {data.data_points.some(p => p.min_val !== undefined) && (
                      <TableCell align="right"><strong>📉 ต่ำสุด</strong></TableCell>
                    )}
                    {data.data_points.some(p => p.max_val !== undefined) && (
                      <TableCell align="right"><strong>📈 สูงสุด</strong></TableCell>
                    )}
                    {data.data_points.some(p => p.sample_count !== undefined) && (
                      <TableCell align="right"><strong>🔢 ตัวอย่าง</strong></TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data_points.slice(0, 100).map((point, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        {new Date(point.timestamp).toLocaleString('th-TH')}
                      </TableCell>
                      <TableCell align="right">
                        <strong>{point.value.toFixed(3)}</strong>
                      </TableCell>
                      <TableCell>{point.unit}</TableCell>
                      {data.data_points.some(p => p.min_val !== undefined) && (
                        <TableCell align="right">
                          {point.min_val !== undefined ? point.min_val.toFixed(3) : '-'}
                        </TableCell>
                      )}
                      {data.data_points.some(p => p.max_val !== undefined) && (
                        <TableCell align="right">
                          {point.max_val !== undefined ? point.max_val.toFixed(3) : '-'}
                        </TableCell>
                      )}
                      {data.data_points.some(p => p.sample_count !== undefined) && (
                        <TableCell align="right">
                          {point.sample_count || '-'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {data.data_points.length > 100 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                แสดง 100 รายการแรก จาก {data.data_points.length.toLocaleString()} รายการทั้งหมด
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default AdvancedMetricAnalysis;
