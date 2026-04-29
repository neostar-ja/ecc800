import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { format, parse } from 'date-fns';
import { th } from 'date-fns/locale';

const monthNames = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const ElectricityCostReport = () => {
  const [costs, setCosts] = useState([]);
  const [dataCenters, setDataCenters] = useState([]);
  const [selectedDC, setSelectedDC] = useState<number | string>(0);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const API_BASE_URL = '/api/v1';

  useEffect(() => {
    loadDataCenters();
  }, []);

  useEffect(() => {
    if (selectedDC) {
      loadCosts();
    }
  }, [selectedDC, selectedYear]);

  const loadDataCenters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sites`);
      const dcs = response.data.data || response.data;
      setDataCenters(dcs);
      if (dcs.length > 0) {
        setSelectedDC(dcs[0].id);
      }
    } catch (err) {
      console.error('Error loading data centers:', err);
      setError('ไม่สามารถโหลดข้อมูล Data Center');
    }
  };

  const loadCosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/electricity-cost/costs/datacenter/${selectedDC}?year=${selectedYear}`
      );
      setCosts(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading costs:', err);
      if (err.response?.status === 404) {
        setCosts([]);
      } else {
        setError('ไม่สามารถโหลดข้อมูลค่าไฟฟ้า');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getMonthName = (month) => monthNames[month - 1];

  // Prepare data for chart
  const chartData = costs.map((cost) => ({
    month: getMonthName(cost.month),
    energy: parseFloat(cost.total_energy_kwh),
    cost: parseFloat(cost.total_cost_baht),
    avgDaily: parseFloat(cost.avg_daily_energy_kwh),
  }));

  // Calculate totals
  const totalCost = costs.reduce((sum, c) => sum + parseFloat(c.total_cost_baht), 0);
  const totalEnergy = costs.reduce((sum, c) => sum + parseFloat(c.total_energy_kwh), 0);
  const averageMonthlyRate = costs.length > 0 ? totalCost / totalEnergy : 0;

  const currentDC = dataCenters.find((dc) => dc.id === selectedDC);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Data Center</InputLabel>
            <Select
              value={selectedDC}
              onChange={(e) => setSelectedDC(e.target.value)}
              label="Data Center"
            >
              {dataCenters.map((dc) => (
                <MenuItem key={dc.id} value={dc.id}>
                  {dc.name} ({dc.site_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>ปี</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="ปี"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <MenuItem key={year} value={year}>
                  {year + 543}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                รวมค่าไฟฟ้า ({selectedYear + 543})
              </Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c' }}>
                ฿{totalCost.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                รวมพลังงาน ({selectedYear + 543})
              </Typography>
              <Typography variant="h5" sx={{ color: '#3498db' }}>
                {totalEnergy.toLocaleString('th-TH', { maximumFractionDigits: 0 })} kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                อัตราเฉลี่ย ({selectedYear + 543})
              </Typography>
              <Typography variant="h5" sx={{ color: '#27ae60' }}>
                ฿{averageMonthlyRate.toLocaleString('th-TH', { maximumFractionDigits: 4 })}/kWh
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                เฉลี่ยต่อเดือน
              </Typography>
              <Typography variant="h5" sx={{ color: '#f39c12' }}>
                ฿{(totalCost / (costs.length || 1)).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardHeader title={`รายงานค่าไฟฟ้า - ${currentDC?.name || 'N/A'} (ปี ${selectedYear + 543})`} />
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="ตารางข้อมูล" />
            <Tab label="กราฟพลังงาน" />
            <Tab label="กราฟค่าไฟ" />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Table Tab */}
            {tabValue === 0 && (
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>เดือน</strong></TableCell>
                        <TableCell align="right"><strong>พลังงาน (kWh)</strong></TableCell>
                        <TableCell align="right"><strong>อัตรา (Baht/kWh)</strong></TableCell>
                        <TableCell align="right"><strong>ค่าไฟ (Baht)</strong></TableCell>
                        <TableCell align="right"><strong>เฉลี่ยต่อวัน (kWh)</strong></TableCell>
                        <TableCell align="center"><strong>สถานะ</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            ไม่มีข้อมูลค่าไฟฟ้า
                          </TableCell>
                        </TableRow>
                      ) : (
                        costs.map((cost) => (
                          <TableRow key={cost.id} hover>
                            <TableCell>
                              <strong>{getMonthName(cost.month)}</strong>
                            </TableCell>
                            <TableCell align="right">
                              {parseFloat(cost.total_energy_kwh).toLocaleString('th-TH', {
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {parseFloat(cost.average_rate).toFixed(4)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: '#e74c3c' }}>
                              ฿{parseFloat(cost.total_cost_baht).toLocaleString('th-TH', {
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {parseFloat(cost.avg_daily_energy_kwh).toLocaleString('th-TH', {
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell align="center">
                              {cost.is_finalized ? (
                                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                                  ยืนยัน
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ color: '#f39c12' }}>
                                  ร่าง
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}

            {/* Energy Chart Tab */}
            {tabValue === 1 && (
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      labelFormatter={(label) => `เดือน ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="energy" fill="#3498db" name="พลังงาน (kWh)" />
                    <Bar dataKey="avgDaily" fill="#9b59b6" name="เฉลี่ยต่อวัน (kWh)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            )}

            {/* Cost Chart Tab */}
            {tabValue === 2 && (
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                      labelFormatter={(label) => `เดือน ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="#e74c3c"
                      strokeWidth={2}
                      name="ค่าไฟ (Baht)"
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            )}
          </>
        )}
      </Card>
    </Box>
  );
};

export default ElectricityCostReport;
