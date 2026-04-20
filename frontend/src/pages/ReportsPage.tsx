import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Collapse,
  useTheme
} from '@mui/material';
import {
  Thermostat,
  Water,
  ElectricBolt,
  Speed,
  Storage,
  Assessment,
  Refresh,
  Download,
  DateRange,
  LocationOn,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  AcUnit,
  Battery90,
  Power,
  ExpandMore,
  ExpandLess,
  DeviceThermostat,
  Bolt,
  Air,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { apiGet } from '../lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Design System
const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const gradientHeader = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// Time range options
const TIME_RANGE_OPTIONS = [
  { value: 1, label: '1 ชั่วโมง' },
  { value: 6, label: '6 ชั่วโมง' },
  { value: 12, label: '12 ชั่วโมง' },
  { value: 24, label: '24 ชั่วโมง' },
  { value: 72, label: '3 วัน' },
  { value: 168, label: '7 วัน' },
];

// Types
interface Site {
  site_code: string;
  site_name: string;
}

interface ReportType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const reportTypes: ReportType[] = [
  { id: 'room', name: 'อุณหภูมิ/ความชื้นห้อง', icon: <Thermostat />, description: 'Multi-Func Sensor หน้า/หลังห้อง', color: '#f06595' },
  { id: 'cabinets', name: 'ข้อมูลตามตู้', icon: <Storage />, description: 'อุณหภูมิ ความชื้น ไฟฟ้า แต่ละตู้', color: '#667eea' },
  { id: 'power', name: 'ระบบไฟฟ้า', icon: <ElectricBolt />, description: 'PUE, การใช้ไฟ IT/Aircon/Total', color: '#ffd43b' },
  { id: 'cooling', name: 'ระบบปรับอากาศ', icon: <AcUnit />, description: 'NetCol5000 (DC:3, DR:2)', color: '#4dabf5' },
  { id: 'ups', name: 'เครื่องสำรองไฟ', icon: <Battery90 />, description: 'Battery, Input, Output', color: '#51cf66' },
];

const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];

// Animated Stat Card
const StatCard: React.FC<{
  title: string;
  value: string | number | null;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | null;
}> = ({ title, value, unit, icon, color, subtitle, trend }) => (
  <Card sx={{
    ...glassCard,
    height: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px ${color}30`
    }
  }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box display="flex" alignItems="baseline" gap={0.5}>
            <Typography variant="h4" fontWeight="bold" sx={{ color }}>
              {value !== null && value !== undefined ? value : '-'}
            </Typography>
            {unit && (
              <Typography variant="body2" color="text.secondary">
                {unit}
              </Typography>
            )}
            {trend && (
              trend === 'up'
                ? <TrendingUp sx={{ color: '#51cf66', fontSize: 20, ml: 1 }} />
                : <TrendingDown sx={{ color: '#ff6b6b', fontSize: 20, ml: 1 }} />
            )}
          </Box>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '12px',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.7 }
            }
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { color, fontSize: 28 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ----------------------------------------------------------------------
// Modern Animated Components (Theme Aware & Responsive)
// ----------------------------------------------------------------------

const AnimatedGauge: React.FC<{
  value: number | null;
  max: number;
  unit: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}> = ({ value, max, unit, label, color, icon }) => {
  const theme = useTheme();
  const percentage = value ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 50; // Radius 50

  return (
    <Box position="relative" display="flex" flexDirection="column" alignItems="center">
      <Box position="relative" sx={{ width: 160, height: 160 }}>
        {/* Background Track */}
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="80"
            cy="80"
            r="50"
            fill="none"
            stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="12"
          />
          {/* Animated Value Track */}
          <motion.circle
            cx="80"
            cy="80"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (percentage / 100) * circumference }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>

        {/* Center Content */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 28, color: color, mb: 0.5, opacity: 0.8 } })}
          </motion.div>
          <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.text.primary, textShadow: theme.palette.mode === 'dark' ? `0 0 10px ${color}80` : 'none' }}>
            {value?.toFixed(1) || '--'}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            {unit}
          </Typography>
        </Box>
      </Box>
      <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mt: -2, fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
};

const SmartSensorCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  temp: number | null;
  humid: number | null;
  delay?: number;
}> = ({ title, icon, temp, humid, delay = 0 }) => {
  const theme = useTheme();
  const getStatusColor = (val: number | null, type: 'temp' | 'humid') => {
    if (!val) return theme.palette.text.disabled;
    if (type === 'temp') return val >= 30 ? theme.palette.error.main : val >= 28 ? theme.palette.warning.main : theme.palette.success.main;
    return val >= 70 ? theme.palette.error.main : val >= 60 ? theme.palette.warning.main : theme.palette.success.main;
  };

  const cardBg = theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(255, 255, 255, 0.7)';

  const iconBg = theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
    : 'linear-gradient(135deg, #f0f4ff 0%, #e6eaff 100%)';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card sx={{
        background: cardBg,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: theme.shadows[4]
      }}>
        {/* Glow Effect - Only in Dark Mode */}
        {theme.palette.mode === 'dark' && (
          <Box sx={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            zIndex: 0
          }} />
        )}

        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box sx={{
              p: 1.5,
              borderRadius: '16px',
              background: iconBg,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2]
            }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="700" color="text.primary">
                {title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <Box
                  component={motion.div}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.success.main, boxShadow: `0 0 8px ${theme.palette.success.main}` }}
                />
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  Active Monitoring
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Thermostat sx={{ fontSize: 16, color: '#f97316' }} />
                  <Typography variant="caption" color="text.secondary">Temp</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: getStatusColor(temp, 'temp') }}>
                  {temp?.toFixed(1) || '--'}
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>°C</Typography>
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Water sx={{ fontSize: 16, color: '#3b82f6' }} />
                  <Typography variant="caption" color="text.secondary">Humid</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ color: getStatusColor(humid, 'humid') }}>
                  {humid?.toFixed(1) || '--'}
                  <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>%</Typography>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Room Environment Report Component - Modern Animated Redesign (v2.1 - Theme Supported)
const RoomEnvironmentReport: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet<any>(`/reports/room-environment?site_code=${siteCode}&hours=${hours}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={40} sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  const currentValues = data?.current_values?.[siteCode.toUpperCase()] || { front: {}, back: {} };
  const trends = data?.trends || { temperature: { front: [], back: [] }, humidity: { front: [], back: [] } };

  const frontTemp = currentValues.front?.temperature?.value;
  const backTemp = currentValues.back?.temperature?.value;
  const frontHumid = currentValues.front?.humidity?.value;
  const backHumid = currentValues.back?.humidity?.value;

  const avgTemp = frontTemp && backTemp ? ((frontTemp + backTemp) / 2) : (frontTemp || backTemp);
  const avgHumid = frontHumid && backHumid ? ((frontHumid + backHumid) / 2) : (frontHumid || backHumid);

  // Merge trend data
  const tempChartData = trends.temperature.front.map((f: any, i: number) => ({
    time: f.timestamp,
    front: f.avg,
    back: trends.temperature.back[i]?.avg
  })).filter((d: any) => d.time);

  const humidChartData = trends.humidity.front.map((f: any, i: number) => ({
    time: f.timestamp,
    front: f.avg,
    back: trends.humidity.back[i]?.avg
  })).filter((d: any) => d.time);

  const chartCardBg = theme.palette.mode === 'dark' ? 'rgba(30,30,40,0.4)' : 'rgba(255,255,255,0.7)';
  const tooltipBg = theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipText = theme.palette.mode === 'dark' ? '#fff' : '#1e293b';

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Header Section */}
      <Box mb={4} position="relative" zIndex={1}>
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Typography variant="h4" fontWeight="800" sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(to right, #fff, #94a3b8)'
              : 'linear-gradient(to right, #1e293b, #475569)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            Room Environment <span style={{ fontSize: '2rem' }}>🌿</span>
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
            Real-time monitoring for {siteCode.toUpperCase()} • Last {hours} Hours
          </Typography>
        </motion.div>
      </Box>

      {/* Hero Gauges */}
      <Box
        display="flex"
        justifyContent="center"
        gap={{ xs: 4, md: 8 }}
        flexWrap="wrap"
        mb={6}
        component={motion.div}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatedGauge
          color="#f97316"
          value={avgTemp}
          max={40}
          unit="°C"
          label="Average Temp"
          icon={<Thermostat />}
        />
        <AnimatedGauge
          color="#3b82f6"
          value={avgHumid}
          max={100}
          unit="%RH"
          label="Average Humidity"
          icon={<Water />}
        />
      </Box>

      {/* Smart Sensor Cards */}
      <Grid container spacing={3} mb={5}>
        <Grid item xs={12}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 2, fontWeight: 600 }}>
            SENSOR READINGS
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <SmartSensorCard
            title="Front Zone (Sensor 1)"
            icon={<Box sx={{ fontSize: 24 }}>🔵</Box>}
            temp={frontTemp}
            humid={frontHumid}
            delay={0.3}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SmartSensorCard
            title="Back Zone (Sensor 2)"
            icon={<Box sx={{ fontSize: 24 }}>🟣</Box>}
            temp={backTemp}
            humid={backHumid}
            delay={0.4}
          />
        </Grid>
      </Grid>

      {/* Modern Interactive Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 2, fontWeight: 600 }}>
            ENVIRONMENTAL TRENDS
          </Typography>
        </Grid>

        {/* Temperature Chart */}
        <Grid item xs={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{
              bgcolor: chartCardBg,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '24px',
              p: { xs: 2, md: 3 }
            }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box p={1} borderRadius={2} bgcolor="rgba(249, 115, 22, 0.1)">
                  <TrendingUp sx={{ color: '#f97316' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">Temperature History</Typography>
              </Box>

              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tempChartData}>
                    <defs>
                      <linearGradient id="colorTempFront" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTempBack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                      tickFormatter={(val) => val ? format(parseISO(val), 'HH:mm') : ''}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '12px',
                        boxShadow: theme.shadows[8]
                      }}
                      itemStyle={{ color: tooltipText }}
                      labelFormatter={(val) => val ? format(parseISO(val), 'MMM dd, HH:mm') : ''}
                      formatter={(value: any) => [`${value?.toFixed(1)}°C`]}
                    />
                    <Area type="monotone" dataKey="front" name="Front" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTempFront)" />
                    <Area type="monotone" dataKey="back" name="Back" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTempBack)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Humidity Chart */}
        <Grid item xs={12} lg={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card sx={{
              bgcolor: chartCardBg,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '24px',
              p: { xs: 2, md: 3 }
            }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box p={1} borderRadius={2} bgcolor="rgba(59, 130, 246, 0.1)">
                  <Water sx={{ color: '#3b82f6' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" color="text.primary">Humidity History</Typography>
              </Box>

              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={humidChartData}>
                    <defs>
                      <linearGradient id="colorHumidFront" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorHumidBack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                      tickFormatter={(val) => val ? format(parseISO(val), 'HH:mm') : ''}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: '12px',
                        boxShadow: theme.shadows[8]
                      }}
                      itemStyle={{ color: tooltipText }}
                      labelFormatter={(val) => val ? format(parseISO(val), 'MMM dd, HH:mm') : ''}
                      formatter={(value: any) => [`${value?.toFixed(1)}%`]}
                    />
                    <Area type="monotone" dataKey="front" name="Front" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidFront)" />
                    <Area type="monotone" dataKey="back" name="Back" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorHumidBack)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Threshold Reference - Responsive */}
        <Grid item xs={12}>
          <Box sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(30,30,40,0.4)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                    Temperature:
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
                      <Typography variant="caption" color="text.secondary">&lt;28°C</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.warning.main }} />
                      <Typography variant="caption" color="text.secondary">28-30°C</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.error.main }} />
                      <Typography variant="caption" color="text.secondary">&gt;30°C</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                    Humidity:
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
                      <Typography variant="caption" color="text.secondary">&lt;60%</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.warning.main }} />
                      <Typography variant="caption" color="text.secondary">60-70%</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.error.main }} />
                      <Typography variant="caption" color="text.secondary">&gt;70%</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// Cabinet Data Report Component
const CabinetDataReport: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet<any>(`/reports/cabinets-data?site_code=${siteCode}&hours=${hours}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const cabinets = data?.cabinets || [];
  const summary = data?.summary || {};

  const getTempColor = (temp: number | null) => {
    if (!temp) return '#999';
    if (temp >= 32) return '#ff6b6b';
    if (temp >= 28) return '#ffa94d';
    return '#51cf66';
  };

  const getHumidColor = (humid: number | null) => {
    if (!humid) return '#999';
    if (humid >= 70) return '#ff6b6b';
    if (humid >= 60) return '#ffa94d';
    return '#4dabf5';
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🗄️ ข้อมูลตามตู้ (Cabinet Data) - {siteCode.toUpperCase()} ({cabinets.length} ตู้)
        </Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="จำนวนตู้ทั้งหมด" value={summary.total_cabinets} icon={<Storage />} color="#667eea" />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="อุณหภูมิเฉลี่ย" value={summary.avg_temperature?.toFixed(1)} unit="°C" icon={<Thermostat />} color={getTempColor(summary.avg_temperature)} />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="อุณหภูมิสูงสุด" value={summary.max_temperature?.toFixed(1)} unit="°C" icon={<TrendingUp />} color="#ff6b6b" />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="อุณหภูมิต่ำสุด" value={summary.min_temperature?.toFixed(1)} unit="°C" icon={<TrendingDown />} color="#51cf66" />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="ความชื้นเฉลี่ย" value={summary.avg_humidity?.toFixed(1)} unit="%RH" icon={<Water />} color="#4dabf5" />
      </Grid>
      <Grid item xs={6} sm={4} md={2}>
        <StatCard title="กำลังไฟรวม" value={summary.total_power?.toFixed(1)} unit="kW" icon={<ElectricBolt />} color="#ffd43b" />
      </Grid>

      {/* Cabinets Table */}
      <Grid item xs={12}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              📋 รายละเอียดแต่ละตู้
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell>ชื่อตู้</TableCell>
                    <TableCell align="center">🌡️ อุณหภูมิ (°C)</TableCell>
                    <TableCell align="center">💧 ความชื้น (%RH)</TableCell>
                    <TableCell align="center">⚡ กำลังไฟ (kW)</TableCell>
                    <TableCell align="center">🔌 พลังงาน (kWh)</TableCell>
                    <TableCell align="center">สถานะ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cabinets.map((cabinet: any) => (
                    <TableRow
                      key={cabinet.name}
                      sx={{
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Storage sx={{ color: cabinet.name.includes('Network') ? '#4dabf5' : '#667eea', fontSize: 20 }} />
                          <strong>{cabinet.name}</strong>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={cabinet.temperature?.toFixed(1) || '-'}
                          size="small"
                          sx={{
                            bgcolor: `${getTempColor(cabinet.temperature)}20`,
                            color: getTempColor(cabinet.temperature),
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={cabinet.humidity?.toFixed(1) || '-'}
                          size="small"
                          sx={{
                            bgcolor: `${getHumidColor(cabinet.humidity)}20`,
                            color: getHumidColor(cabinet.humidity),
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#ffd43b' }}>
                        {cabinet.power?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {cabinet.energy?.toFixed(0) || '-'}
                      </TableCell>
                      <TableCell align="center">
                        {cabinet.temperature && cabinet.temperature < 28 ? (
                          <Chip icon={<CheckCircle />} label="ปกติ" size="small" color="success" variant="outlined" />
                        ) : cabinet.temperature ? (
                          <Chip icon={<Warning />} label="ร้อน" size="small" color="warning" variant="outlined" />
                        ) : (
                          <Chip label="ไม่มีข้อมูล" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Temperature/Humidity Bar Chart */}
      <Grid item xs={12} md={6}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">🌡️ อุณหภูมิแต่ละตู้</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cabinets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 40]} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8 }}
                    formatter={(value: any) => [`${value}°C`, 'อุณหภูมิ']}
                  />
                  <Bar dataKey="temperature" fill="#ff6b6b" radius={[0, 4, 4, 0]} name="อุณหภูมิ (°C)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">💧 ความชื้นแต่ละตู้</Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cabinets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8 }}
                    formatter={(value: any) => [`${value}%RH`, 'ความชื้น']}
                  />
                  <Bar dataKey="humidity" fill="#4dabf5" radius={[0, 4, 4, 0]} name="ความชื้น (%RH)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Power System Report (Enhanced)
const PowerSystemReport: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet<any>(`/reports/ecc800-full?site_code=${siteCode}&hours=${hours}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const metrics = data?.main_metrics || {};
  const powerModules = data?.power_modules || {};
  const trends = data?.trends || [];
  const benchmarks = data?.pue_benchmarks || {};

  const pueValue = metrics['PUE (hour)']?.value || metrics['PUE (day)']?.value;

  const getPUERating = (pue: number | null) => {
    if (!pue) return { label: 'ไม่มีข้อมูล', color: '#999' };
    if (pue < 1.4) return { label: 'ดีเยี่ยม', color: '#51cf66' };
    if (pue < 1.6) return { label: 'ดี', color: '#ffd43b' };
    if (pue < 2.0) return { label: 'ปานกลาง', color: '#ffa94d' };
    return { label: 'ต้องปรับปรุง', color: '#ff6b6b' };
  };

  const pueRating = getPUERating(pueValue);

  // Energy breakdown for pie chart
  const energyData = [
    { name: 'IT Load', value: metrics['IT accumulate electric by hour']?.value || 0, color: '#667eea' },
    { name: 'Aircon', value: metrics['Aircon accumulate electric by hour']?.value || 0, color: '#4dabf5' },
    { name: 'Module', value: metrics['Module accumulate electric by hour']?.value || 0, color: '#ffa94d' },
  ].filter(d => d.value > 0);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ⚡ ระบบไฟฟ้า (System-ECC800) - {siteCode.toUpperCase()}
        </Typography>
      </Grid>

      {/* PUE Gauge */}
      <Grid item xs={12} md={4}>
        <Card sx={{ ...glassCard, textAlign: 'center', py: 2 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              ⚡ ค่า PUE ปัจจุบัน
            </Typography>
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{
                color: pueRating.color,
                my: 2,
                animation: 'glow 2s infinite',
                '@keyframes glow': {
                  '0%, 100%': { textShadow: `0 0 20px ${pueRating.color}50` },
                  '50%': { textShadow: `0 0 40px ${pueRating.color}80` }
                }
              }}
            >
              {pueValue?.toFixed(2) || '-'}
            </Typography>
            <Chip
              icon={pueValue && pueValue < 1.6 ? <CheckCircle /> : <Warning />}
              label={pueRating.label}
              sx={{
                bgcolor: `${pueRating.color}20`,
                color: pueRating.color,
                fontSize: '1rem',
                py: 2.5,
                fontWeight: 'bold'
              }}
            />
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">
                เกณฑ์: &lt;1.4 ดีเยี่ยม | &lt;1.6 ดี | &lt;2.0 ปานกลาง
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Energy Stats */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={4}>
            <StatCard
              title="พลังงาน IT (รายชม.)"
              value={metrics['IT accumulate electric by hour']?.value?.toFixed(2)}
              unit="kWh"
              icon={<Storage />}
              color="#667eea"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <StatCard
              title="พลังงาน Aircon (รายชม.)"
              value={metrics['Aircon accumulate electric by hour']?.value?.toFixed(2)}
              unit="kWh"
              icon={<AcUnit />}
              color="#4dabf5"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <StatCard
              title="พลังงาน Module (รายชม.)"
              value={metrics['Module accumulate electric by hour']?.value?.toFixed(2)}
              unit="kWh"
              icon={<Bolt />}
              color="#ffa94d"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <StatCard
              title="กำลังไฟ (รายวัน)"
              value={metrics['Power (day)']?.value?.toFixed(1)}
              unit="kW"
              icon={<Power />}
              color="#ff6b6b"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <StatCard
              title="พลังงานขาเข้ารวม (ชม.)"
              value={metrics['Total system input electrical energy (hour)']?.value?.toFixed(0)}
              unit="kWh"
              icon={<TrendingUp />}
              color="#51cf66"
            />
          </Grid>
          <Grid item xs={6} md={4}>
            <StatCard
              title="IT Load Output รวม"
              value={metrics['Total electrical energy of system IT load output']?.value?.toFixed(0)}
              unit="kWh"
              icon={<Assessment />}
              color="#845ef7"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Energy Breakdown Pie */}
      <Grid item xs={12} md={4}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">📊 สัดส่วนการใช้พลังงาน (ชม.)</Typography>
            <Box height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={energyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {energyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8 }}
                    formatter={(value: any) => [`${value.toFixed(2)} kWh`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* PUE Trend */}
      <Grid item xs={12} md={8}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">📈 แนวโน้ม PUE และพลังงาน</Typography>
            <Box height={250}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val ? format(parseISO(val), 'HH:mm', { locale: th }) : ''}
                  />
                  <YAxis yAxisId="left" domain={[1, 2.5]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8 }}
                    labelFormatter={(val) => val ? format(parseISO(val), 'dd/MM HH:mm', { locale: th }) : ''}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="pue" stroke="#ff6b6b" strokeWidth={3} dot={false} name="PUE" />
                  <Line yAxisId="right" type="monotone" dataKey="it_energy" stroke="#667eea" strokeWidth={2} dot={false} name="IT (kWh)" />
                  <Line yAxisId="right" type="monotone" dataKey="aircon_energy" stroke="#4dabf5" strokeWidth={2} dot={false} name="Aircon (kWh)" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Power Modules */}
      {Object.keys(powerModules).length > 0 && (
        <Grid item xs={12}>
          <Card sx={glassCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">🔌 Power Modules</Typography>
              <Grid container spacing={2}>
                {Object.entries(powerModules).map(([name, moduleData]: [string, any]) => (
                  <Grid item xs={12} sm={6} md={4} key={name}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{name}</Typography>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">อุณหภูมิภายใน</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#ff6b6b">
                          {moduleData['Inner temperature']?.value || '-'} °C
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">กระแสขาออก</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#ffd43b">
                          {moduleData['Output current']?.value || '-'} A
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">แรงดันขาออก</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#51cf66">
                          {moduleData['Output voltage']?.value || '-'} V
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// Cooling System Report (Enhanced)
const CoolingSystemReport: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet<any>(`/reports/cooling-full?site_code=${siteCode}&hours=${hours}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const summary = data?.summary || {};
  const units = data?.units || {};

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ❄️ ระบบปรับอากาศ (NetCol5000) - {siteCode.toUpperCase()} ({summary.unit_count || 0} เครื่อง)
        </Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid item xs={6} sm={4} md={2.4}>
        <StatCard title="จำนวนเครื่อง" value={summary.unit_count} icon={<AcUnit />} color="#4dabf5" />
      </Grid>
      <Grid item xs={6} sm={4} md={2.4}>
        <StatCard title="🌡️ อุณหภูมินอกห้อง" value={summary.avg_outdoor_temp?.toFixed(1)} unit="°C" icon={<Air />} color="#ffa94d" subtitle="เฉลี่ย" />
      </Grid>
      <Grid item xs={6} sm={4} md={2.4}>
        <StatCard title="ลมจ่าย (Supply)" value={summary.avg_supply_temp?.toFixed(1)} unit="°C" icon={<TrendingDown />} color="#51cf66" subtitle="เฉลี่ย" />
      </Grid>
      <Grid item xs={6} sm={4} md={2.4}>
        <StatCard title="ลมกลับ (Return)" value={summary.avg_return_temp?.toFixed(1)} unit="°C" icon={<TrendingUp />} color="#ff6b6b" subtitle="เฉลี่ย" />
      </Grid>
      <Grid item xs={6} sm={4} md={2.4}>
        <StatCard title="กำลังไฟรวม" value={summary.total_power?.toFixed(1)} unit="kW" icon={<ElectricBolt />} color="#ffd43b" />
      </Grid>

      {/* Units Detail */}
      <Grid item xs={12}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">📋 รายละเอียดเครื่องปรับอากาศ</Typography>
            {Object.entries(units).map(([unitName, unitData]: [string, any]) => (
              <Paper
                key={unitName}
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
                }}
                onClick={() => setExpandedUnit(expandedUnit === unitName ? null : unitName)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={2}>
                    <AcUnit sx={{ color: '#4dabf5', fontSize: 32 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {unitName.replace('Cooling-', '')}
                      </Typography>
                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={`ลมจ่าย: ${unitData.temperature?.supply_air || '-'}°C`}
                          sx={{ bgcolor: '#51cf6620', color: '#51cf66' }}
                        />
                        <Chip
                          size="small"
                          label={`ลมกลับ: ${unitData.temperature?.return_air || '-'}°C`}
                          sx={{ bgcolor: '#ff6b6b20', color: '#ff6b6b' }}
                        />
                        <Chip
                          size="small"
                          label={`นอกห้อง: ${unitData.temperature?.outdoor || '-'}°C`}
                          sx={{ bgcolor: '#ffa94d20', color: '#ffa94d' }}
                        />
                        <Chip
                          size="small"
                          label={`Compressor: ${unitData.status?.compressor_rpm || 0} rpm`}
                          sx={{ bgcolor: '#4dabf520', color: '#4dabf5' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  {expandedUnit === unitName ? <ExpandLess /> : <ExpandMore />}
                </Box>

                <Collapse in={expandedUnit === unitName}>
                  <Box mt={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">อุณหภูมิ</Typography>
                        <Box>
                          <Typography variant="body2">🌡️ ลมจ่าย: <strong>{unitData.temperature?.supply_air || '-'}°C</strong></Typography>
                          <Typography variant="body2">🌡️ ลมกลับ: <strong>{unitData.temperature?.return_air || '-'}°C</strong></Typography>
                          <Typography variant="body2">❄️ Cold Aisle: <strong>{unitData.temperature?.cold_aisle || '-'}°C</strong></Typography>
                          <Typography variant="body2">🔥 Hot Aisle: <strong>{unitData.temperature?.hot_aisle || '-'}°C</strong></Typography>
                          <Typography variant="body2">🌤️ นอกห้อง: <strong>{unitData.temperature?.outdoor || '-'}°C</strong></Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">ความชื้น</Typography>
                        <Box>
                          <Typography variant="body2">💧 ปัจจุบัน: <strong>{unitData.humidity?.current || '-'}%RH</strong></Typography>
                          <Typography variant="body2">💧 ลมจ่าย: <strong>{unitData.humidity?.supply_air || '-'}%RH</strong></Typography>
                          <Typography variant="body2">💧 ลมกลับ: <strong>{unitData.humidity?.return_air || '-'}%RH</strong></Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">สถานะ</Typography>
                        <Box>
                          <Typography variant="body2">🔄 Compressor: <strong>{unitData.status?.compressor_rpm || 0} rpm</strong></Typography>
                          <Typography variant="body2">🌀 พัดลมในร่ม: <strong>{unitData.status?.indoor_fan_pct || 0}%</strong></Typography>
                          <Typography variant="body2">🌀 พัดลมนอก: <strong>{unitData.status?.outdoor_fan_pct || 0}%</strong></Typography>
                          <Typography variant="body2">🔧 EEV: <strong>{unitData.status?.eev_step || 0} step</strong></Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">ไฟฟ้า</Typography>
                        <Box>
                          <Typography variant="body2">⚡ กำลังไฟ: <strong>{unitData.power?.current || '-'} kW</strong></Typography>
                          <Typography variant="body2">🔌 กระแส: <strong>{unitData.power?.phase_current || '-'} A</strong></Typography>
                          <Typography variant="body2">📊 แรงดัน A-B: <strong>{unitData.voltage?.ab || '-'} V</strong></Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// UPS Report (Enhanced)
const UPSReport: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiGet<any>(`/reports/ups-full?site_code=${siteCode}&hours=${hours}`);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const battery = data?.battery || {};
  const input = data?.input || {};
  const output = data?.output || {};
  const environment = data?.environment || {};
  const circuitBreakers = data?.circuit_breakers || [];

  const batteryCapacity = battery.battery_capacity?.value;
  const getBatteryColor = (cap: number | null) => {
    if (!cap) return '#999';
    if (cap > 80) return '#51cf66';
    if (cap > 50) return '#ffd43b';
    return '#ff6b6b';
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🔋 เครื่องสำรองไฟ (UPS Cabinet) - {siteCode.toUpperCase()}
        </Typography>
      </Grid>

      {/* Battery Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Battery90 sx={{ color: '#51cf66' }} /> ข้อมูลแบตเตอรี่ (Battery Status)
        </Typography>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card sx={{ ...glassCard, textAlign: 'center', py: 2 }}>
          <CardContent>
            <Battery90 sx={{ fontSize: 60, color: getBatteryColor(batteryCapacity), mb: 1 }} />
            <Typography variant="h2" fontWeight="bold" sx={{ color: getBatteryColor(batteryCapacity) }}>
              {batteryCapacity?.toFixed(0) || '-'}%
            </Typography>
            <Typography variant="body2" color="text.secondary">ความจุแบตเตอรี่</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} md={2.25}>
        <StatCard title="แรงดัน (Voltage)" value={battery.battery_voltage?.value?.toFixed(0)} unit="V" icon={<Bolt />} color="#ffd43b" />
      </Grid>
      <Grid item xs={6} md={2.25}>
        <StatCard title="กระแส (Current)" value={battery.battery_current?.value?.toFixed(1)} unit="A" icon={<ElectricBolt />} color="#4dabf5" />
      </Grid>
      <Grid item xs={6} md={2.25}>
        <StatCard title="เวลาสำรอง (Backup)" value={battery.backup_time?.value?.toFixed(0)} unit="นาที" icon={<DateRange />} color="#51cf66" />
      </Grid>
      <Grid item xs={6} md={2.25}>
        <StatCard title="ความจุ (Ah)" value={battery.battery_capacity?.value?.toFixed(0)} unit="Ah" icon={<Battery90 />} color="#845ef7" />
      </Grid>

      {/* Input Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 2 }}>
          <TrendingDown sx={{ color: '#4dabf5' }} /> ขาเข้า UPS (UPS Input)
        </Typography>
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="กำลังไฟขาเข้ารวม" value={input.input_total_active_power?.value?.toFixed(1)} unit="kW" icon={<Power />} color="#667eea" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="ความถี่ขาเข้า" value={input.input_frequency?.value?.toFixed(1)} unit="Hz" icon={<Speed />} color="#4dabf5" />
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>⚡ Input 3 Phase</Typography>
            <Grid container spacing={1}>
              {['L1', 'L2', 'L3'].map((phase) => {
                const power = input[`input_${phase.toLowerCase()}_active_power`]?.value;
                const voltage = input[`input_${phase.toLowerCase()}_phase_voltage`]?.value;
                const current = input[`input_${phase.toLowerCase()}_current`]?.value;
                return (
                  <Grid item xs={4} key={phase}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" color="text.secondary">Phase {phase}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="#667eea">{power?.toFixed(1) || '-'} kW</Typography>
                      <Typography variant="caption">{voltage?.toFixed(0) || '-'}V / {current?.toFixed(1) || '-'}A</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Output Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 2 }}>
          <TrendingUp sx={{ color: '#51cf66' }} /> ขาออก UPS (UPS Output)
        </Typography>
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="ความถี่ขาออก" value={output.output_frequency?.value?.toFixed(2)} unit="Hz" icon={<Speed />} color="#51cf66" />
      </Grid>
      <Grid item xs={12} md={9}>
        <Card sx={glassCard}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>📤 Output 3 Phase (A, B, C)</Typography>
            <Grid container spacing={1}>
              {['A', 'B', 'C'].map((phase, idx) => {
                const power = output[`ph._${phase.toLowerCase()}_output_active_power`]?.value;
                const loadRatio = output[`ph._${phase.toLowerCase()}_output_load_ratio`]?.value;
                const voltage = output[`ph._${phase.toLowerCase()}_output_voltage`]?.value;
                const current = output[`ph._${phase.toLowerCase()}_output_current`]?.value;
                const colors = ['#ff6b6b', '#ffd43b', '#51cf66'];
                return (
                  <Grid item xs={4} key={phase}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)' }}>
                      <Typography variant="caption" color="text.secondary">Phase {phase}</Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colors[idx] }}>
                        {power?.toFixed(1) || '-'} kW
                      </Typography>
                      <Box sx={{ mt: 1, mb: 0.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={loadRatio || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: loadRatio && loadRatio > 70 ? '#ff6b6b' : colors[idx],
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="caption">
                        โหลด: <strong>{loadRatio?.toFixed(0) || '-'}%</strong> | {voltage?.toFixed(0) || '-'}V
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Environment Section */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, mt: 2 }}>
          <DeviceThermostat sx={{ color: '#ffa94d' }} /> สภาพแวดล้อมและอื่นๆ
        </Typography>
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="อุณหภูมิแวดล้อม" value={environment.ambient_temperature?.value?.toFixed(1)} unit="°C" icon={<Thermostat />} color="#ffa94d" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="อุณหภูมิ Bar L3" value={environment.mains_input_bar_l3_temperature?.value?.toFixed(1)} unit="°C" icon={<DeviceThermostat />} color="#ff6b6b" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="UPS Output Bar U" value={environment.ups_output_bar_u_temperature?.value?.toFixed(1)} unit="°C" icon={<DeviceThermostat />} color="#4dabf5" />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard title="UPS Output Bar V" value={environment.ups_output_bar_v_temperature?.value?.toFixed(1)} unit="°C" icon={<DeviceThermostat />} color="#51cf66" />
      </Grid>

      {/* Circuit Breakers */}
      {circuitBreakers.length > 0 && (
        <Grid item xs={12}>
          <Card sx={glassCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">🔌 Circuit Breakers ({circuitBreakers.length} ตัว)</Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={circuitBreakers.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: 8 }}
                      formatter={(value: any, name: string) => [
                        `${value.toFixed(2)}`,
                        name === 'power' ? 'กำลังไฟ (kW)' : 'โหลด (%)'
                      ]}
                    />
                    <Legend formatter={(value) => value === 'power' ? 'กำลังไฟ (kW)' : 'โหลด (%)'} />
                    <Bar dataKey="power" fill="#667eea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// Main Reports Page Component
const ReportsPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('DC');
  const [selectedReport, setSelectedReport] = useState<string>('room');
  const [hours, setHours] = useState<number>(24);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await apiGet<Site[]>('/sites');
        setSites(res);
        if (res.length > 0) {
          setSelectedSite(res[0].site_code);
        }
      } catch (err) {
        console.error(err);
        setSites([
          { site_code: 'DC', site_name: 'Data Center' },
          { site_code: 'DR', site_name: 'Disaster Recovery' },
        ]);
      }
    };
    fetchSites();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 100);
  };

  // Get current report name
  const getReportName = () => {
    const report = reportTypes.find(r => r.id === selectedReport);
    return report?.name || 'รายงาน';
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#1a1a2e'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add header
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, 210, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text(`ECC800 Report - ${getReportName()}`, 15, 12);
      pdf.setFontSize(10);
      pdf.text(`Site: ${selectedSite.toUpperCase()} | Period: ${hours} hrs | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 20);

      // Add report image
      const imgData = canvas.toDataURL('image/png');
      let heightLeft = imgHeight;
      let position = 30;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `ECC800_${selectedReport}_${selectedSite}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Excel Export Handler - Fetch all raw records from export endpoints
  const handleExportExcel = async () => {
    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // Thai-friendly report names
      const reportNames: Record<string, string> = {
        room: 'สภาพแวดล้อมห้อง',
        cabinets: 'ข้อมูลตู้ DC',
        power: 'ระบบไฟฟ้า',
        cooling: 'ระบบทำความเย็น',
        ups: 'ระบบ UPS'
      };

      // Create summary sheet
      const summaryData = [
        ['รายงาน ECC800 Data Center'],
        [''],
        ['ประเภทรายงาน', reportNames[selectedReport] || selectedReport],
        ['ไซต์', selectedSite.toUpperCase()],
        ['ช่วงเวลา', `${hours} ชั่วโมง`],
        ['วันที่สร้างรายงาน', format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: th })],
        [''],
      ];

      // Helper function to add records to workbook
      const addRecordsToWorkbook = (records: any[], sheetName: string, columns: Record<string, string>) => {
        if (records.length > 0) {
          const formattedRecords = records.map((r: any) => {
            const row: Record<string, any> = {};
            Object.keys(columns).forEach(key => {
              if (key === 'timestamp' && r[key]) {
                row[columns[key]] = format(parseISO(r[key]), 'dd/MM/yyyy HH:mm:ss');
              } else {
                row[columns[key]] = r[key] !== null && r[key] !== undefined ? r[key] : '';
              }
            });
            return row;
          });
          const sheet = XLSX.utils.json_to_sheet(formattedRecords);
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31)); // Sheet name max 31 chars
        }
      };

      // Export based on report type - fetch ALL raw records
      if (selectedReport === 'room') {
        try {
          const exportData = await apiGet<any>(`/reports/room-environment/export?site_code=${selectedSite}&hours=${hours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              site: 'ไซต์',
              sensor: 'เซ็นเซอร์',
              location: 'ตำแหน่ง',
              metric: 'ประเภท',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            // Separate sheets for Temperature and Humidity
            const tempRecords = exportData.records.filter((r: any) => r.metric === 'Temperature');
            const humidRecords = exportData.records.filter((r: any) => r.metric === 'Humidity');

            if (tempRecords.length > 0) {
              addRecordsToWorkbook(tempRecords, 'อุณหภูมิ', {
                timestamp: 'เวลา',
                location: 'ตำแหน่ง',
                value: 'อุณหภูมิ (°C)'
              });
            }

            if (humidRecords.length > 0) {
              addRecordsToWorkbook(humidRecords, 'ความชื้น', {
                timestamp: 'เวลา',
                location: 'ตำแหน่ง',
                value: 'ความชื้น (%RH)'
              });
            }

            summaryData.push(['จำนวนข้อมูลทั้งหมด', exportData.total_records?.toString() || '0']);
          }
        } catch (e) { console.error('Room data export error', e); }

      } else if (selectedReport === 'cabinets') {
        try {
          // Use new export endpoint for ALL records
          const exportData = await apiGet<any>(`/reports/cabinets-data/export?site_code=${selectedSite}&hours=${hours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              cabinet: 'ตู้',
              sensor: 'เซ็นเซอร์',
              metric: 'ประเภท',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            // Separate sheets by metric type
            const tempRecords = exportData.records.filter((r: any) => r.metric === 'Temperature');
            const humidRecords = exportData.records.filter((r: any) => r.metric === 'Humidity');
            const powerRecords = exportData.records.filter((r: any) => r.metric === 'Power' || r.metric === 'Energy');

            if (tempRecords.length > 0) {
              addRecordsToWorkbook(tempRecords, 'อุณหภูมิตู้', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                value: 'อุณหภูมิ (°C)'
              });
            }

            if (humidRecords.length > 0) {
              addRecordsToWorkbook(humidRecords, 'ความชื้นตู้', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                value: 'ความชื้น (%RH)'
              });
            }

            if (powerRecords.length > 0) {
              addRecordsToWorkbook(powerRecords, 'พลังงานตู้', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                metric: 'ประเภท',
                value: 'ค่า',
                unit: 'หน่วย'
              });
            }

            summaryData.push(['จำนวนข้อมูลทั้งหมด', exportData.total_records?.toString() || '0']);
          }
        } catch (e) { console.error('Cabinet data export error', e); }

      } else if (selectedReport === 'power') {
        try {
          const exportData = await apiGet<any>(`/reports/power-system/export?site_code=${selectedSite}&hours=${hours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              site: 'ไซต์',
              equipment: 'อุปกรณ์',
              category: 'หมวดหมู่',
              metric: 'ตัวชี้วัด',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            // Separate sheets by category
            const categories = ['PUE', 'IT Power', 'Cooling', 'Total'];
            categories.forEach(cat => {
              const catRecords = exportData.records.filter((r: any) => r.category === cat);
              if (catRecords.length > 0) {
                addRecordsToWorkbook(catRecords, cat, {
                  timestamp: 'เวลา',
                  metric: 'ตัวชี้วัด',
                  value: 'ค่า',
                  unit: 'หน่วย'
                });
              }
            });

            summaryData.push(['จำนวนข้อมูลทั้งหมด', exportData.total_records?.toString() || '0']);
          }
        } catch (e) { console.error('Power data export error', e); }

      } else if (selectedReport === 'cooling') {
        try {
          const exportData = await apiGet<any>(`/reports/cooling/export?site_code=${selectedSite}&hours=${hours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              site: 'ไซต์',
              equipment: 'อุปกรณ์',
              category: 'หมวดหมู่',
              metric: 'ตัวชี้วัด',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            // Separate by category
            const categories = ['Temperature', 'Humidity', 'Status', 'Setpoint'];
            categories.forEach(cat => {
              const catRecords = exportData.records.filter((r: any) => r.category === cat);
              if (catRecords.length > 0) {
                const thaiName = cat === 'Temperature' ? 'อุณหภูมิ' :
                  cat === 'Humidity' ? 'ความชื้น' :
                    cat === 'Status' ? 'สถานะ' : 'จุดตั้งค่า';
                addRecordsToWorkbook(catRecords, thaiName, {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  value: 'ค่า',
                  unit: 'หน่วย'
                });
              }
            });

            summaryData.push(['จำนวนข้อมูลทั้งหมด', exportData.total_records?.toString() || '0']);
          }
        } catch (e) { console.error('Cooling data export error', e); }

      } else if (selectedReport === 'ups') {
        try {
          const exportData = await apiGet<any>(`/reports/ups/export?site_code=${selectedSite}&hours=${hours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              site: 'ไซต์',
              equipment: 'อุปกรณ์',
              category: 'หมวดหมู่',
              metric: 'ตัวชี้วัด',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            // Separate by category
            const categories = ['Battery', 'Load', 'Input', 'Output', 'Temperature'];
            categories.forEach(cat => {
              const catRecords = exportData.records.filter((r: any) => r.category === cat);
              if (catRecords.length > 0) {
                const thaiName = cat === 'Battery' ? 'แบตเตอรี่' :
                  cat === 'Load' ? 'โหลด' :
                    cat === 'Input' ? 'อินพุต' :
                      cat === 'Output' ? 'เอาต์พุต' : 'อุณหภูมิ';
                addRecordsToWorkbook(catRecords, thaiName, {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  metric: 'ตัวชี้วัด',
                  value: 'ค่า',
                  unit: 'หน่วย'
                });
              }
            });

            summaryData.push(['จำนวนข้อมูลทั้งหมด', exportData.total_records?.toString() || '0']);
          }
        } catch (e) { console.error('UPS data export error', e); }
      }

      // Insert summary sheet at the beginning
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'สรุปรายงาน');

      // Reorder sheets - put summary first
      const sheetNames = workbook.SheetNames;
      const summaryIndex = sheetNames.indexOf('สรุปรายงาน');
      if (summaryIndex > 0) {
        sheetNames.splice(summaryIndex, 1);
        sheetNames.unshift('สรุปรายงาน');
        workbook.SheetNames = sheetNames;
      }

      const fileName = `ECC800_${reportNames[selectedReport] || selectedReport}_${selectedSite}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const renderReport = () => {
    if (isRefreshing) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

    switch (selectedReport) {
      case 'room':
        return <RoomEnvironmentReport siteCode={selectedSite} hours={hours} />;
      case 'cabinets':
        return <CabinetDataReport siteCode={selectedSite} hours={hours} />;
      case 'power':
        return <PowerSystemReport siteCode={selectedSite} hours={hours} />;
      case 'cooling':
        return <CoolingSystemReport siteCode={selectedSite} hours={hours} />;
      case 'ups':
        return <UPSReport siteCode={selectedSite} hours={hours} />;
      default:
        return <RoomEnvironmentReport siteCode={selectedSite} hours={hours} />;
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" sx={gradientHeader}>
          📊 ศูนย์รายงาน Data Center
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={1}>
          รายงานอุณหภูมิ/ความชื้นห้อง, ข้อมูลตามตู้, ระบบไฟฟ้า, ระบบปรับอากาศ, และเครื่องสำรองไฟ
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ ...glassCard, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Site Selector */}
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>🏢 Site</InputLabel>
                <Select
                  value={selectedSite}
                  label="🏢 Site"
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  {sites.map((site) => (
                    <MenuItem key={site.site_code} value={site.site_code}>
                      {site.site_name || site.site_code.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Report Type Selector */}
            <Grid item xs={6} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>📈 ประเภทรายงาน</InputLabel>
                <Select
                  value={selectedReport}
                  label="📈 ประเภทรายงาน"
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Time Range Selector */}
            <Grid item xs={6} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>⏰ ช่วงเวลา</InputLabel>
                <Select
                  value={hours}
                  label="⏰ ช่วงเวลา"
                  onChange={(e) => setHours(Number(e.target.value))}
                >
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                  disabled={isExporting}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                    flex: 1,
                    minWidth: 80
                  }}
                >
                  รีเฟรช
                </Button>
                <Tooltip title="ส่งออกเป็น PDF">
                  <Button
                    variant="outlined"
                    startIcon={isExporting ? <CircularProgress size={16} /> : <PictureAsPdf />}
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    sx={{
                      borderColor: '#ff6b6b',
                      color: '#ff6b6b',
                      '&:hover': {
                        borderColor: '#ff6b6b',
                        bgcolor: 'rgba(255,107,107,0.1)',
                      },
                      minWidth: 50
                    }}
                  >
                    PDF
                  </Button>
                </Tooltip>
                <Tooltip title="ส่งออกเป็น Excel">
                  <Button
                    variant="outlined"
                    startIcon={isExporting ? <CircularProgress size={16} /> : <TableChart />}
                    onClick={handleExportExcel}
                    disabled={isExporting}
                    sx={{
                      borderColor: '#51cf66',
                      color: '#51cf66',
                      '&:hover': {
                        borderColor: '#51cf66',
                        bgcolor: 'rgba(81,207,102,0.1)',
                      },
                      minWidth: 60
                    }}
                  >
                    Excel
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Type Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedReport}
          onChange={(_, val) => setSelectedReport(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          {reportTypes.map((type) => (
            <Tab
              key={type.id}
              value={type.id}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {React.cloneElement(type.icon as React.ReactElement, { sx: { color: type.color, fontSize: 20 } })}
                  <span>{type.name}</span>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Report Content */}
      <Box ref={reportRef}>
        {renderReport()}
      </Box>
    </Box>
  );
};

export default ReportsPage;
