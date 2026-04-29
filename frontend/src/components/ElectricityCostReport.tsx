import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import { ElectricBolt, Power, TrendingUp, TrendingDown } from '@mui/icons-material';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, AreaChart, Area } from 'recharts';
import { apiGet } from '../lib/api';

const glassCard = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: 4,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
};

const StatCard: React.FC<{ title: string; value: React.ReactNode; unit?: string; icon: React.ReactNode; color: string; subtitle?: string; trend?: 'up' | 'down' | null }> = ({ title, value, unit, icon, color, subtitle, trend }) => (
  <Card sx={{ ...glassCard, height: '100%', position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.1, transform: 'scale(2.5)', color }}>
      {icon}
    </Box>
    <CardContent sx={{ position: 'relative', zIndex: 1, p: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary" fontWeight="bold">{title}</Typography>
      </Box>
      <Box display="flex" alignItems="baseline" gap={0.5}>
        <Typography variant="h4" fontWeight="900" sx={{ color }}>
          {value || '-'}
        </Typography>
        {unit && <Typography variant="body2" color="text.secondary">{unit}</Typography>}
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {trend === 'up' ? <TrendingUp fontSize="small" sx={{ color: '#ef5350' }} /> : trend === 'down' ? <TrendingDown fontSize="small" sx={{ color: '#66bb6a' }} /> : null}
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const ElectricityCostReport: React.FC<{ siteCode: string }> = ({ siteCode }) => {
  const theme = useTheme();
  const [costData, setCostData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dataCenterId = siteCode === 'DC' ? 1 : 2;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [summary, history] = await Promise.all([
          apiGet<any>(`/electricity-cost/costs/realtime-summary/${dataCenterId}`),
          apiGet<any>(`/electricity-cost/costs/monthly-history/${dataCenterId}?months=8`),
        ]);
        setCostData(summary);
        setHistoryData(history);
      } catch (err) {
        console.error('Error loading electricity cost data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, dataCenterId]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (!costData || !historyData) return null;

  const chartData = (historyData?.history || []).slice().reverse().map((h: any) => ({
    month: h.month_label,
    energy: h.total_energy_kwh,
    cost: h.total_cost_baht,
    avgPower: h.avg_power_kw,
    days: h.days_in_period,
  }));

  const tooltipBg = theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipText = theme.palette.mode === 'dark' ? '#fff' : '#1e293b';

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          💰 ค่าไฟฟ้า (Electricity Cost) - {siteCode.toUpperCase()}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          คำนวณจากข้อมูล Input Total Active Power × อัตราค่าไฟ ({costData.current_rate} Baht/kWh)
        </Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid item xs={6} md={3}>
        <StatCard
          title="ค่าไฟเดือนนี้"
          value={`฿${costData.current_month_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          icon={<ElectricBolt />}
          color="#ffa726"
          subtitle={`${costData.current_month_energy_kwh?.toLocaleString('th-TH', { maximumFractionDigits: 0 })} kWh`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          title="ค่าไฟเดือนที่แล้ว"
          value={`฿${costData.previous_month_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
          icon={<ElectricBolt />}
          color="#42a5f5"
          subtitle={`${costData.previous_month_energy_kwh?.toLocaleString('th-TH', { maximumFractionDigits: 0 })} kWh`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          title="กำลังไฟเฉลี่ย"
          value={costData.avg_power_kw?.toFixed(1)}
          unit="kW"
          icon={<Power />}
          color="#66bb6a"
          subtitle={`Peak: ${costData.peak_power_kw?.toFixed(1)} kW`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          title="เปลี่ยนแปลง"
          value={costData.cost_change_percent !== null ? `${costData.cost_change_percent > 0 ? '+' : ''}${costData.cost_change_percent?.toFixed(1)}%` : 'N/A'}
          icon={costData.cost_change_percent > 0 ? <TrendingUp /> : <TrendingDown />}
          color={costData.cost_change_percent > 0 ? '#ef5350' : '#66bb6a'}
          subtitle="เทียบเดือนที่แล้ว"
          trend={costData.cost_change_percent > 0 ? 'up' : costData.cost_change_percent < 0 ? 'down' : null}
        />
      </Grid>

      {/* Monthly Cost Chart */}
      {chartData.length > 0 && (
        <>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...glassCard, p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 ค่าไฟรายเดือน (Baht)
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffa726" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#ff7043" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.palette.divider}`, borderRadius: 12, boxShadow: theme.shadows[8] }}
                      itemStyle={{ color: tooltipText }}
                      formatter={(value: any) => [`฿${value?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`, 'ค่าไฟ']}
                    />
                    <Bar dataKey="cost" fill="url(#costGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ ...glassCard, p: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚡ พลังงานรายเดือน (kWh)
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#42a5f5" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.palette.divider}`, borderRadius: 12, boxShadow: theme.shadows[8] }}
                      itemStyle={{ color: tooltipText }}
                      formatter={(value: any) => [`${value?.toLocaleString('th-TH', { maximumFractionDigits: 0 })} kWh`, 'พลังงาน']}
                    />
                    <Area type="monotone" dataKey="energy" stroke="#42a5f5" strokeWidth={3} fillOpacity={1} fill="url(#energyGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          {/* Monthly Details Table */}
          <Grid item xs={12}>
            <Card sx={glassCard}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📋 รายละเอียดค่าไฟรายเดือน
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>เดือน</strong></TableCell>
                        <TableCell align="right"><strong>พลังงาน (kWh)</strong></TableCell>
                        <TableCell align="right"><strong>กำลังไฟเฉลี่ย (kW)</strong></TableCell>
                        <TableCell align="right"><strong>กำลังไฟสูงสุด (kW)</strong></TableCell>
                        <TableCell align="right"><strong>อัตรา (฿/kWh)</strong></TableCell>
                        <TableCell align="right"><strong>ค่าไฟ (Baht)</strong></TableCell>
                        <TableCell align="right"><strong>เฉลี่ย/วัน (฿)</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(historyData?.history || []).map((row: any, idx: number) => (
                        <TableRow key={idx} sx={{ bgcolor: row.is_current_month ? 'rgba(255,167,38,0.08)' : 'inherit' }}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {row.month_label}
                              {row.is_current_month && (
                                <Chip label="ปัจจุบัน" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{row.total_energy_kwh?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell align="right">{row.avg_power_kw?.toFixed(1)}</TableCell>
                          <TableCell align="right">{row.peak_power_kw?.toFixed(1)}</TableCell>
                          <TableCell align="right">{row.rate_baht_per_kwh?.toFixed(4)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight={600} color={row.is_current_month ? '#ffa726' : 'text.primary'}>
                              ฿{row.total_cost_baht?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">฿{row.avg_daily_cost_baht?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ElectricityCostReport;
