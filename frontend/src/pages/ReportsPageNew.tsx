/**
 * 🎯 ReportsPage - Modern Responsive Design
 * =============================================
 * UI ใหม่ที่ออกแบบใหม่ทั้งหมด:
 * - รองรับทุกอุปกรณ์ ทุกขนาดหน้าจอ (Mobile-first, centered on mobile)
 * - Dark/Light mode support
 * - Modern cards, charts, graphs, icons, emojis, animations
 * - MUI + Tailwind CSS integration
 * - Virtual scrolling for large data lists
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  Slide,
  Fade,
  Drawer,
  SwipeableDrawer,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Avatar,
  Stack
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
  TableChart,
  DarkMode,
  LightMode,
  FilterList,
  Close,
  KeyboardArrowUp,
  Notifications,
  MoreVert,
  Timeline,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart,
  BubbleChart,
  Dashboard,
  Insights,
  Analytics,
  WbSunny,
  NightsStay,
  Opacity,
  Whatshot,
  Thunderstorm,
  CloudQueue,
  Memory,
  Router,
  Dns,
  AccessTime,
  FlashOn,
  ViewModule,
  Error,
} from '@mui/icons-material';
import { format, parseISO, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { apiGet } from '../lib/api';
import ElectricityCostReport from '../components/ElectricityCostReport';
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
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap
} from 'recharts';
import { FixedSizeList as VirtualList, ListChildComponentProps } from 'react-window';

// ============================================================
// 🎨 Design System Constants
// ============================================================

const GRADIENT_PRESETS = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  orange: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  green: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ocean: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
  fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  night: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
};

const CHART_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', 
  '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
  '#fa709a', '#fee140', '#0093E9', '#80D0C7'
];

// Helper function for safe number formatting
const safeToFixed = (value: any, decimals: number = 1, fallback: string = '—'): string => {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
};

const REPORT_TYPES = [
  { 
    id: 'room', 
    name: 'อุณหภูมิ/ความชื้นห้อง', 
    icon: <Thermostat />, 
    description: 'Multi-Func Sensor หน้า/หลังห้อง', 
    color: '#f06595',
    gradient: GRADIENT_PRESETS.fire,
    emoji: '🌡️'
  },
  { 
    id: 'cabinets', 
    name: 'ข้อมูลตามตู้', 
    icon: <Storage />, 
    description: 'อุณหภูมิ ความชื้น ไฟฟ้า แต่ละตู้', 
    color: '#667eea',
    gradient: GRADIENT_PRESETS.purple,
    emoji: '🗄️'
  },
  { 
    id: 'power', 
    name: 'ระบบไฟฟ้า', 
    icon: <ElectricBolt />, 
    description: 'PUE, การใช้ไฟ IT/Aircon/Total', 
    color: '#ffd43b',
    gradient: GRADIENT_PRESETS.sunset,
    emoji: '⚡'
  },
  { 
    id: 'cooling', 
    name: 'ระบบปรับอากาศ', 
    icon: <AcUnit />, 
    description: 'NetCol5000 (DC:3, DR:2)', 
    color: '#4dabf5',
    gradient: GRADIENT_PRESETS.blue,
    emoji: '❄️'
  },
  { 
    id: 'ups', 
    name: 'เครื่องสำรองไฟ', 
    icon: <Battery90 />, 
    description: 'Battery, Input, Output', 
    color: '#51cf66',
    gradient: GRADIENT_PRESETS.green,
    emoji: '🔋'
  },
];

const TIME_RANGE_OPTIONS = [
  { value: 1, label: '1 ชั่วโมง', short: '1H', icon: '🕐' },
  { value: 6, label: '6 ชั่วโมง', short: '6H', icon: '🕕' },
  { value: 12, label: '12 ชั่วโมง', short: '12H', icon: '🕛' },
  { value: 24, label: '24 ชั่วโมง (1 วัน)', short: '1D', icon: '📅' },
  { value: 72, label: '3 วัน', short: '3D', icon: '📆' },
  { value: 168, label: '7 วัน (1 สัปดาห์)', short: '7D', icon: '📊' },
  { value: 720, label: '30 วัน (1 เดือน)', short: '30D', icon: '📈' },
  { value: -1, label: '🗓️ กำหนดเอง...', short: 'Custom', icon: '🎯' },
];

// ============================================================
// 🎭 Animation Variants
// ============================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  }
};

const cardHoverVariants = {
  rest: { scale: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [0.7, 1, 0.7],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
};

// ============================================================
// 🧩 Reusable Components
// ============================================================

// Animated Loading Skeleton
const AnimatedSkeleton: React.FC<{ height?: number; variant?: 'rectangular' | 'circular' | 'text' }> = ({ 
  height = 200, 
  variant = 'rectangular' 
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Skeleton 
        variant={variant} 
        height={height} 
        sx={{ 
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          '&::after': {
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }
        }} 
        animation="wave" 
      />
    </Box>
  );
};

// Glass Card Component
interface GlassCardProps {
  children: React.ReactNode;
  gradient?: string;
  animate?: boolean;
  onClick?: () => void;
  selected?: boolean;
  sx?: any;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  gradient, 
  animate = true, 
  onClick,
  selected = false,
  sx = {}
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div
      variants={animate ? itemVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      whileHover={onClick ? { scale: 1.02, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      style={{ height: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          background: isDark 
            ? 'rgba(30, 41, 59, 0.7)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          borderRadius: 4,
          boxShadow: selected
            ? `0 0 0 2px ${theme.palette.primary.main}, 0 8px 32px rgba(0,0,0,0.1)`
            : '0 8px 32px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          position: 'relative',
          '&::before': gradient ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: gradient,
          } : {},
          ...sx
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

// Animated Stat Card with Emoji
interface AnimatedStatCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  icon: React.ReactNode;
  emoji?: string;
  color: string;
  gradient?: string;
  trend?: 'up' | 'down' | null;
  trendValue?: string;
  subtitle?: string;
  loading?: boolean;
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ 
  title, 
  value, 
  unit, 
  icon, 
  emoji,
  color, 
  gradient,
  trend, 
  trendValue,
  subtitle,
  loading = false
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (loading) {
    return (
      <GlassCard>
        <CardContent>
          <AnimatedSkeleton height={120} />
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard gradient={gradient}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {emoji && (
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  style={{ fontSize: '1.2rem' }}
                >
                  {emoji}
                </motion.span>
              )}
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontWeight: 500 }}
              >
                {title}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="baseline" gap={0.5} flexWrap="wrap">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  sx={{ 
                    color,
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                    lineHeight: 1.2
                  }}
                >
                  {value !== null && value !== undefined ? value : '—'}
                </Typography>
              </motion.div>
              {unit && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
                >
                  {unit}
                </Typography>
              )}
            </Box>

            {/* Trend indicator */}
            {trend && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <motion.div animate={pulseAnimation}>
                  {trend === 'up' ? (
                    <TrendingUp sx={{ color: '#10b981', fontSize: 18 }} />
                  ) : (
                    <TrendingDown sx={{ color: '#ef4444', fontSize: 18 }} />
                  )}
                </motion.div>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: trend === 'up' ? '#10b981' : '#ef4444',
                    fontWeight: 600 
                  }}
                >
                  {trendValue}
                </Typography>
              </Box>
            )}

            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Animated Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { 
                  color, 
                  fontSize: { xs: 28, md: 36 }
                } 
              })}
            </Box>
          </motion.div>
        </Box>
      </CardContent>
    </GlassCard>
  );
};

// Animated Gauge/Donut Chart
interface AnimatedGaugeProps {
  value: number | null;
  max: number;
  unit: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedGauge: React.FC<AnimatedGaugeProps> = ({ 
  value, 
  max, 
  unit, 
  label, 
  color, 
  icon,
  size = 'medium'
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const sizeConfig = {
    small: { width: 100, strokeWidth: 8, fontSize: 'h5' },
    medium: { width: 140, strokeWidth: 10, fontSize: 'h4' },
    large: { width: 180, strokeWidth: 12, fontSize: 'h3' },
  };
  
  const config = sizeConfig[size];
  const percentage = value !== null ? Math.min((value / max) * 100, 100) : 0;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.width / 2;

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      gap={1}
    >
      <Box position="relative" sx={{ width: config.width, height: config.width }}>
        <svg 
          width={config.width} 
          height={config.width} 
          viewBox={`0 0 ${config.width} ${config.width}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth={config.strokeWidth}
          />
          {/* Animated value track */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ 
              strokeDashoffset: circumference - (percentage / 100) * circumference 
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ 
              filter: `drop-shadow(0 0 8px ${color}60)` 
            }}
          />
        </svg>

        {/* Center content */}
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
          {icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { fontSize: 20, color, opacity: 0.7, mb: 0.5 } 
              })}
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Typography 
              variant={config.fontSize as any}
              fontWeight="bold" 
              sx={{ color: theme.palette.text.primary }}
            >
              {safeToFixed(value, 1)}
            </Typography>
          </motion.div>
          <Typography 
            variant="caption" 
            sx={{ color: theme.palette.text.secondary }}
          >
            {unit}
          </Typography>
        </Box>
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: theme.palette.text.secondary, 
          fontWeight: 500,
          textAlign: 'center'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// Chart Card Wrapper with Loading State
interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emoji?: string;
  children: React.ReactNode;
  loading?: boolean;
  height?: number;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  subtitle,
  icon, 
  emoji,
  children, 
  loading = false,
  height = 300,
  actions
}) => {
  const theme = useTheme();

  return (
    <GlassCard>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            {emoji && (
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ fontSize: '1.5rem' }}
              >
                {emoji}
              </motion.span>
            )}
            {icon && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.main + '15',
                }}
              >
                {React.cloneElement(icon as React.ReactElement, {
                  sx: { color: theme.palette.primary.main, fontSize: 20 }
                })}
              </Box>
            )}
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {actions}
        </Box>

        <Box sx={{ height, position: 'relative' }}>
          {loading ? (
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <CircularProgress size={40} />
              </motion.div>
            </Box>
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </GlassCard>
  );
};

// Empty State Component
const EmptyState: React.FC<{ 
  message?: string; 
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ 
  message = 'ไม่มีข้อมูล', 
  icon,
  action 
}) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    py={8}
    gap={2}
  >
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {icon || <span style={{ fontSize: '4rem' }}>📭</span>}
    </motion.div>
    <Typography color="text.secondary" variant="h6">
      {message}
    </Typography>
    {action}
  </Box>
);

// Scroll to Top FAB
const ScrollToTopFab: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Fab
        size="small"
        color="primary"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <KeyboardArrowUp />
      </Fab>
    </Zoom>
  );
};

// ============================================================
// 🎨 Enhanced UI Components
// ============================================================

// Live Status Indicator
const LiveStatusIndicator: React.FC<{ isConnected?: boolean }> = ({ isConnected = true }) => {
  const theme = useTheme();
  return (
    <motion.div
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Chip
        size="small"
        icon={
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: isConnected ? '#10b981' : '#ef4444',
              boxShadow: isConnected 
                ? '0 0 10px #10b981' 
                : '0 0 10px #ef4444',
            }}
          />
        }
        label={isConnected ? 'กำลังอัพเดท' : 'ออฟไลน์'}
        sx={{
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(16, 185, 129, 0.08)',
          color: isConnected ? '#10b981' : '#ef4444',
          fontWeight: 600,
          fontSize: '0.75rem',
          border: `1px solid ${isConnected ? '#10b98130' : '#ef444430'}`,
        }}
      />
    </motion.div>
  );
};

// Report Type Card (New improved card-based tab)
interface ReportTypeCardProps {
  type: typeof REPORT_TYPES[0];
  selected: boolean;
  onClick: () => void;
}

const ReportTypeCard: React.FC<ReportTypeCardProps> = ({ type, selected, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
    >
      <Paper
        onClick={onClick}
        elevation={selected ? 8 : 0}
        sx={{
          p: 2,
          cursor: 'pointer',
          borderRadius: 3,
          minWidth: 100,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: selected 
            ? type.gradient 
            : isDark 
              ? 'rgba(30, 41, 59, 0.5)' 
              : 'rgba(255, 255, 255, 0.8)',
          border: `2px solid ${selected ? 'transparent' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: type.color,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <motion.span
          animate={selected ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 1, repeat: selected ? Infinity : 0, repeatDelay: 2 }}
          style={{ fontSize: '1.8rem', display: 'block' }}
        >
          {type.emoji}
        </motion.span>
        <Typography 
          variant="caption" 
          fontWeight="bold"
          sx={{ 
            color: selected ? '#fff' : 'text.primary',
            display: 'block',
            mt: 0.5,
            fontSize: '0.7rem',
          }}
        >
          {type.name}
        </Typography>
        {selected && (
          <motion.div
            layoutId="activeTab"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              height: 4,
              background: '#fff',
              borderRadius: 4,
            }}
          />
        )}
      </Paper>
    </motion.div>
  );
};

// ============================================================
// 📊 Report Section Components
// ============================================================

// Overview Dashboard
const OverviewSection: React.FC<{ 
  siteCode: string; 
  hours: number;
  onNavigate?: (reportId: string) => void;
}> = ({ siteCode, hours, onNavigate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [executive, roomEnv] = await Promise.all([
          apiGet<any>('/executive').catch(() => null),
          apiGet<any>(`/reports/room-environment?site_code=${siteCode}&hours=${hours}`).catch(() => null),
        ]);
        setData({ executive, roomEnv });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteCode, hours]);

  const exec = data?.executive || {};
  const roomData = data?.roomEnv?.current_values?.[siteCode.toUpperCase()] || {};

  // Mock data for overview charts
  const systemHealthData = [
    { name: 'Power', value: 92, fill: '#667eea' },
    { name: 'Cooling', value: 88, fill: '#4dabf5' },
    { name: 'Network', value: 95, fill: '#51cf66' },
    { name: 'Storage', value: 85, fill: '#ffd43b' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Hero Stats Row with Enhanced Design */}
        <Grid item xs={12}>
          <Box 
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              mb: 2,
              background: isDark
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Animated Background Orbs */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)',
                filter: 'blur(40px)',
                animation: 'pulse 4s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
                  '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                },
              }}
            />
            
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      background: GRADIENT_PRESETS.purple,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    📊
                  </Box>
                </motion.div>
                <Box>
                  <Typography 
                    variant={isMobile ? 'h5' : 'h4'}
                    fontWeight="800"
                    sx={{
                      background: isDark
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                    }}
                  >
                    ภาพรวมระบบ Data Center
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Real-time Monitoring & Analytics • Site: {siteCode.toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Chip
                  icon={
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: '#10b981',
                          boxShadow: '0 0 12px #10b981'
                        }} 
                      />
                    </motion.div>
                  }
                  label="System Operational"
                  sx={{
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                  }}
                />
              </motion.div>
            </Box>
          </Box>
        </Grid>

        {/* Main KPIs - Enhanced 3 cards layout */}
        <Grid item xs={12} sm={4} md={4}>
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AnimatedStatCard
              title="Health Score"
              value={exec.health_score || 95}
              unit="/100"
              icon={<CheckCircle />}
              emoji="💚"
              color="#10b981"
              gradient={GRADIENT_PRESETS.green}
              trend="up"
              trendValue="+2.5%"
              loading={loading}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AnimatedStatCard
              title="ค่า PUE"
              value={safeToFixed(exec.current_pue, 2)}
              icon={<Speed />}
              emoji="⚡"
              color="#667eea"
              gradient={GRADIENT_PRESETS.purple}
              subtitle="Target: < 1.5"
              loading={loading}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={4} md={4}>
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AnimatedStatCard
              title="กำลังไฟรวม"
              value={safeToFixed(exec.total_power_kw, 1)}
              unit="kW"
              icon={<Bolt />}
              emoji="🔌"
              color="#f59e0b"
              gradient={GRADIENT_PRESETS.sunset}
              loading={loading}
            />
          </motion.div>
        </Grid>

        {/* Environment Gauges - Enhanced */}
        <Grid item xs={12} md={6}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <GlassCard>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>🌡️</span>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        สภาพแวดล้อมห้อง
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Real-time Environmental Data
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    size="small"
                    label="Live"
                    sx={{
                      bgcolor: '#10b98120',
                      color: '#10b981',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
                
                <Box 
                  display="flex" 
                  justifyContent="space-around" 
                  flexWrap="wrap"
                  gap={3}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <AnimatedGauge
                    value={roomData.front?.temperature?.value || 24.5}
                    max={40}
                    unit="°C"
                    label="อุณหภูมิเฉลี่ย"
                    color="#f97316"
                    icon={<Thermostat />}
                  />
                  <AnimatedGauge
                    value={roomData.front?.humidity?.value || 55}
                    max={100}
                    unit="%RH"
                    label="ความชื้นเฉลี่ย"
                    color="#3b82f6"
                    icon={<Water />}
                  />
                </Box>
              </CardContent>
            </GlassCard>
          </motion.div>
        </Grid>

        {/* System Health Radar - Enhanced */}
        <Grid item xs={12} md={6}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ChartCard
              title="ความพร้อมของระบบ"
              subtitle="System Readiness Score"
              emoji="🎯"
              height={280}
              loading={loading}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={systemHealthData}>
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#764ba2" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <PolarGrid 
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: theme.palette.text.primary, 
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ 
                      fill: theme.palette.text.secondary, 
                      fontSize: 10 
                    }}
                    axisLine={false}
                  />
                  <Radar
                    name="Health Score"
                    dataKey="value"
                    stroke="#667eea"
                    strokeWidth={3}
                    fill="url(#radarGradient)"
                    fillOpacity={0.6}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 12,
                      boxShadow: theme.shadows[8]
                    }}
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>
          </motion.div>
        </Grid>

        {/* Quick Actions - Enhanced */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>🚀</span>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        การดำเนินการด่วน
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quick access to detailed reports
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  {REPORT_TYPES.filter(r => r.id !== 'overview').map((report, index) => (
                    <Grid item xs={6} sm={4} md={2} key={report.id}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.08, y: -5 }} 
                        whileTap={{ scale: 0.95 }}
                      >
                        <Paper
                          onClick={() => onNavigate?.(report.id)}
                          sx={{
                            p: 2.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: isDark 
                              ? 'rgba(255,255,255,0.03)' 
                              : 'rgba(0,0,0,0.02)',
                            border: `2px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              background: `${report.color}10`,
                              borderColor: report.color,
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 24px ${report.color}40`,
                              '&::before': {
                                opacity: 1,
                              }
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: `linear-gradient(90deg, ${report.color} 0%, transparent 100%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                            }
                          }}
                        >
                          <motion.span
                            style={{ fontSize: '2.2rem', display: 'block', marginBottom: 8 }}
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                          >
                            {report.emoji}
                          </motion.span>
                          <Typography 
                            variant="body2" 
                            fontWeight="700" 
                            noWrap
                            sx={{
                              color: 'text.primary',
                              fontSize: '0.85rem',
                            }}
                          >
                            {report.name}
                          </Typography>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// Room Environment Report (Enhanced)
const RoomEnvironmentSection: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const currentValues = data?.current_values?.[siteCode.toUpperCase()] || { front: {}, back: {} };
  const trends = data?.trends || { temperature: { front: [], back: [] }, humidity: { front: [], back: [] } };

  const frontTemp = currentValues.front?.temperature?.value;
  const backTemp = currentValues.back?.temperature?.value;
  const frontHumid = currentValues.front?.humidity?.value;
  const backHumid = currentValues.back?.humidity?.value;

  const avgTemp = frontTemp && backTemp ? ((frontTemp + backTemp) / 2) : (frontTemp || backTemp);
  const avgHumid = frontHumid && backHumid ? ((frontHumid + backHumid) / 2) : (frontHumid || backHumid);

  // Prepare chart data
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

  const getStatusColor = (val: number | null, type: 'temp' | 'humid') => {
    if (!val) return theme.palette.text.disabled;
    if (type === 'temp') {
      return val >= 30 ? theme.palette.error.main : val >= 28 ? theme.palette.warning.main : theme.palette.success.main;
    }
    return val >= 70 ? theme.palette.error.main : val >= 60 ? theme.palette.warning.main : theme.palette.success.main;
  };

  const getStatusLabel = (val: number | null, type: 'temp' | 'humid') => {
    if (!val) return 'ไม่มีข้อมูล';
    if (type === 'temp') {
      return val >= 30 ? 'วิกฤต' : val >= 28 ? 'เฝ้าระวัง' : 'ปกติ';
    }
    return val >= 70 ? 'วิกฤต' : val >= 60 ? 'เฝ้าระวัง' : 'ปกติ';
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      style={{ width: '100%' }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Enhanced Header with Gradient Background */}
        <Grid item xs={12}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                borderRadius: 4,
                p: { xs: 2.5, md: 4 },
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #f97316 0%, #3b82f6 100%)',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2.5}>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Box
                      sx={{
                        width: { xs: 56, md: 68 },
                        height: { xs: 56, md: 68 },
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        boxShadow: '0 12px 28px rgba(249, 115, 22, 0.4)',
                      }}
                    >
                      🌡️
                    </Box>
                  </motion.div>
                  <Box>
                    <Typography 
                      variant={isMobile ? 'h5' : 'h4'}
                      fontWeight="900"
                      sx={{
                        background: isDark
                          ? 'linear-gradient(135deg, #fff 0%, #f97316 50%, #3b82f6 100%)'
                          : 'linear-gradient(135deg, #1e293b 0%, #f97316 50%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                        mb: 0.5,
                      }}
                    >
                      สภาพแวดล้อมห้อง
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                      <Chip 
                        label={siteCode.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          fontSize: '0.75rem',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ข้อมูลย้อนหลัง {hours} ชั่วโมง
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Quick Stats Pills */}
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <Chip
                    icon={<Thermostat sx={{ fontSize: 18 }} />}
                    label={`${safeToFixed(avgTemp, 1)}°C`}
                    sx={{
                      bgcolor: isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.1)',
                      color: '#f97316',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: '1px solid rgba(249,115,22,0.3)',
                    }}
                  />
                  <Chip
                    icon={<Water sx={{ fontSize: 18 }} />}
                    label={`${safeToFixed(avgHumid, 1)}%`}
                    sx={{
                      bgcolor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)',
                      color: '#3b82f6',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: '1px solid rgba(59,130,246,0.3)',
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Enhanced Hero Gauges with 3D Effect */}
        <Grid item xs={12}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: { xs: 3, md: 5 },
                background: isDark
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isDark
                  ? '0 20px 60px rgba(0,0,0,0.4)'
                  : '0 20px 60px rgba(0,0,0,0.08)',
              }}
            >
              <Box 
                display="flex" 
                justifyContent="space-around"
                gap={{ xs: 3, md: 6 }}
                flexWrap="wrap"
              >
                <AnimatedGauge
                  value={avgTemp}
                  max={40}
                  unit="°C"
                  label="อุณหภูมิเฉลี่ย"
                  color="#f97316"
                  icon={<Thermostat />}
                  size="large"
                />
                <AnimatedGauge
                  value={avgHumid}
                  max={100}
                  unit="%RH"
                  label="ความชื้นเฉลี่ย"
                  color="#3b82f6"
                  icon={<Water />}
                  size="large"
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Enhanced Sensor Cards with Modern Design */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            style={{ height: '100%' }}
          >
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                p: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 100%)',
                border: `2px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    🔵
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 0.5 }}>
                      หน้าห้อง (Front)
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Box 
                          sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: '#22c55e',
                            boxShadow: '0 0 12px #22c55e'
                          }} 
                        />
                      </motion.div>
                      <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 700 }}>
                        Active Monitoring
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(251,146,60,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(254,243,199,0.3) 100%)',
                        border: `1px solid ${isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.2)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '2px',
                          background: 'linear-gradient(90deg, #f97316, #fb923c)',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Thermostat sx={{ fontSize: 20, color: '#f97316' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          TEMPERATURE
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                        <Typography 
                          variant="h3" 
                          fontWeight="900" 
                          sx={{ 
                            color: getStatusColor(frontTemp, 'temp'),
                            lineHeight: 1,
                          }}
                        >
                          {safeToFixed(frontTemp, 1)}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={700}>
                          °C
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(frontTemp, 'temp')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(frontTemp, 'temp'),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </Paper>
                  </motion.div>
                </Grid>
                <Grid item xs={6}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(96,165,250,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(219,234,254,0.3) 100%)',
                        border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '2px',
                          background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Water sx={{ fontSize: 20, color: '#3b82f6' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          HUMIDITY
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                        <Typography 
                          variant="h3" 
                          fontWeight="900" 
                          sx={{ 
                            color: getStatusColor(frontHumid, 'humid'),
                            lineHeight: 1,
                          }}
                        >
                          {safeToFixed(frontHumid, 1)}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={700}>
                          %
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(frontHumid, 'humid')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(frontHumid, 'humid'),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </Paper>
                  </motion.div>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            style={{ height: '100%' }}
          >
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                p: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(216, 180, 254, 0.12) 100%)',
                border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    🟣
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ mb: 0.5 }}>
                      หลังห้อง (Back)
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Box 
                          sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: '#22c55e',
                            boxShadow: '0 0 12px #22c55e'
                          }} 
                        />
                      </motion.div>
                      <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 700 }}>
                        Active Monitoring
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(251,146,60,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(254,243,199,0.3) 100%)',
                        border: `1px solid ${isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.2)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '2px',
                          background: 'linear-gradient(90deg, #f97316, #fb923c)',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Thermostat sx={{ fontSize: 20, color: '#f97316' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          TEMPERATURE
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                        <Typography 
                          variant="h3" 
                          fontWeight="900" 
                          sx={{ 
                            color: getStatusColor(backTemp, 'temp'),
                            lineHeight: 1,
                          }}
                        >
                          {safeToFixed(backTemp, 1)}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={700}>
                          °C
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(backTemp, 'temp')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(backTemp, 'temp'),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </Paper>
                  </motion.div>
                </Grid>
                <Grid item xs={6}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2.5, 
                        borderRadius: 3,
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(96,165,250,0.1) 100%)'
                          : 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(219,234,254,0.3) 100%)',
                        border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '2px',
                          background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <Water sx={{ fontSize: 20, color: '#3b82f6' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700}>
                          HUMIDITY
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                        <Typography 
                          variant="h3" 
                          fontWeight="900" 
                          sx={{ 
                            color: getStatusColor(backHumid, 'humid'),
                            lineHeight: 1,
                          }}
                        >
                          {safeToFixed(backHumid, 1)}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" fontWeight={700}>
                          %
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(backHumid, 'humid')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(backHumid, 'humid'),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    </Paper>
                  </motion.div>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Grid>

        {/* Temperature Chart */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="ประวัติอุณหภูมิ"
            emoji="📈"
            icon={<TrendingUp />}
            height={300}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempChartData}>
                <defs>
                  <linearGradient id="tempFrontGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tempBackGrad" x1="0" y1="0" x2="0" y2="1">
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
                  width={35}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 12,
                    boxShadow: theme.shadows[8]
                  }}
                  labelFormatter={(val) => val ? format(parseISO(val as string), 'MMM dd, HH:mm') : ''}
                  formatter={(value: any) => [`${safeToFixed(value, 1)}°C`]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="front" 
                  name="Front" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#tempFrontGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="back" 
                  name="Back" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#tempBackGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Humidity Chart */}
        <Grid item xs={12} lg={6}>
          <ChartCard
            title="ประวัติความชื้น"
            emoji="💧"
            icon={<Water />}
            height={300}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={humidChartData}>
                <defs>
                  <linearGradient id="humid Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="humidBackGrad" x1="0" y1="0" x2="0" y2="1">
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
                  width={35}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 12,
                    boxShadow: theme.shadows[8]
                  }}
                  labelFormatter={(val) => val ? format(parseISO(val as string), 'MMM dd, HH:mm') : ''}
                  formatter={(value: any) => [`${safeToFixed(value, 1)}%`]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="front" 
                  name="Front" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#humidFrontGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="back" 
                  name="Back" 
                  stroke="#22c55e" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#humidBackGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Status Legend */}
        <Grid item xs={12}>
          <GlassCard>
            <CardContent sx={{ py: 2, px: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                      🌡️ อุณหภูมิ:
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {[
                        { color: theme.palette.success.main, label: '<28°C ปกติ' },
                        { color: theme.palette.warning.main, label: '28-30°C เฝ้าระวัง' },
                        { color: theme.palette.error.main, label: '>30°C วิกฤต' },
                      ].map((item, i) => (
                        <Box key={i} display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: item.color,
                            boxShadow: `0 0 4px ${item.color}`
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>
                      💧 ความชื้น:
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {[
                        { color: theme.palette.success.main, label: '<60% ปกติ' },
                        { color: theme.palette.warning.main, label: '60-70% เฝ้าระวัง' },
                        { color: theme.palette.error.main, label: '>70% วิกฤต' },
                      ].map((item, i) => (
                        <Box key={i} display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: item.color,
                            boxShadow: `0 0 4px ${item.color}`
                          }} />
                          <Typography variant="caption" color="text.secondary">
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// ============================================================
// 🗄️ Cabinets Section
// ============================================================
const CabinetsSection: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'temp' | 'power'>('name');
  const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'warning'>('all');

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

  const cabinets = data?.cabinets || [];
  const summary = data?.summary || {};

  const getTempColor = (temp: number | null) => {
    if (!temp) return theme.palette.text.disabled;
    if (temp >= 32) return '#ef4444';
    if (temp >= 28) return '#f59e0b';
    return '#10b981';
  };

  const getHumidColor = (humid: number | null) => {
    if (!humid) return theme.palette.text.disabled;
    if (humid >= 70) return '#ef4444';
    if (humid >= 60) return '#f59e0b';
    return '#3b82f6';
  };

  const getTempStatus = (temp: number | null): 'normal' | 'warning' | 'error' => {
    if (!temp) return 'normal';
    if (temp >= 32) return 'error';
    if (temp >= 28) return 'warning';
    return 'normal';
  };

  // Filter and sort cabinets
  const filteredCabinets = cabinets.filter((cab: any) => {
    if (filterStatus === 'all') return true;
    const status = getTempStatus(cab.temperature);
    if (filterStatus === 'normal') return status === 'normal';
    if (filterStatus === 'warning') return status === 'warning' || status === 'error';
    return true;
  });

  const sortedCabinets = [...filteredCabinets].sort((a: any, b: any) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'temp') return (b.temperature || 0) - (a.temperature || 0);
    if (sortBy === 'power') return (b.power || 0) - (a.power || 0);
    return 0;
  });

  const statusCounts = {
    normal: cabinets.filter((c: any) => getTempStatus(c.temperature) === 'normal').length,
    warning: cabinets.filter((c: any) => getTempStatus(c.temperature) === 'warning').length,
    error: cabinets.filter((c: any) => getTempStatus(c.temperature) === 'error').length,
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
      style={{ width: '100%' }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Enhanced Header with Gradient and Controls */}
        <Grid item xs={12}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Paper
              elevation={0}
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                borderRadius: 4,
                p: { xs: 2.5, md: 4 },
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
                <Box display="flex" alignItems="center" gap={2.5}>
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Box
                      sx={{
                        width: { xs: 56, md: 68 },
                        height: { xs: 56, md: 68 },
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      🗄️
                    </Box>
                  </motion.div>
                  <Box>
                    <Typography 
                      variant={isMobile ? 'h5' : 'h4'}
                      fontWeight="900"
                      sx={{
                        background: isDark
                          ? 'linear-gradient(135deg, #fff 0%, #667eea 50%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #1e293b 0%, #667eea 50%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                        mb: 0.5,
                      }}
                    >
                      ข้อมูลตามตู้
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                      <Chip 
                        label={siteCode.toUpperCase()}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff',
                          fontSize: '0.75rem',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {cabinets.length} ตู้ • ข้อมูลย้อนหลัง {hours} ชั่วโมง
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* View Controls */}
                <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => val && setViewMode(val)}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                      borderRadius: 2,
                      '& .MuiToggleButton-root': {
                        px: 2,
                        py: 0.5,
                        border: 'none',
                        '&.Mui-selected': {
                          bgcolor: '#667eea',
                          color: '#fff',
                          '&:hover': { bgcolor: '#5568d3' },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="grid">
                      <ViewModule sx={{ fontSize: 18, mr: 0.5 }} />
                      Grid
                    </ToggleButton>
                    <ToggleButton value="table">
                      <TableChart sx={{ fontSize: 18, mr: 0.5 }} />
                      Table
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl 
                    size="small" 
                    sx={{ 
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                        borderRadius: 2,
                      },
                    }}
                  >
                    <InputLabel>จัดเรียง</InputLabel>
                    <Select
                      value={sortBy}
                      label="จัดเรียง"
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <MenuItem value="name">ชื่อตู้</MenuItem>
                      <MenuItem value="temp">อุณหภูมิ</MenuItem>
                      <MenuItem value="power">กำลังไฟ</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl 
                    size="small" 
                    sx={{ 
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                        borderRadius: 2,
                      },
                    }}
                  >
                    <InputLabel>สถานะ</InputLabel>
                    <Select
                      value={filterStatus}
                      label="สถานะ"
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                      <MenuItem value="all">ทั้งหมด</MenuItem>
                      <MenuItem value="normal">ปกติ</MenuItem>
                      <MenuItem value="warning">มีปัญหา</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Status Overview Pills */}
              <Box display="flex" gap={2} flexWrap="wrap">
                <Paper
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(236,253,245,0.5) 100%)',
                    border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      ปกติ
                    </Typography>
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#10b981', lineHeight: 1 }}>
                      {statusCounts.normal}
                    </Typography>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(254,243,199,0.5) 100%)',
                    border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Warning sx={{ color: '#f59e0b', fontSize: 24 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      เฝ้าระวัง
                    </Typography>
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#f59e0b', lineHeight: 1 }}>
                      {statusCounts.warning}
                    </Typography>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(254,226,226,0.5) 100%)',
                    border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Error sx={{ color: '#ef4444', fontSize: 24 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      วิกฤต
                    </Typography>
                    <Typography variant="h6" fontWeight="900" sx={{ color: '#ef4444', lineHeight: 1 }}>
                      {statusCounts.error}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="จำนวนตู้"
            value={summary.total_cabinets || cabinets.length}
            icon={<Storage />}
            emoji="📦"
            color="#667eea"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="อุณหภูมิเฉลี่ย"
            value={safeToFixed(summary.avg_temperature, 1)}
            unit="°C"
            icon={<Thermostat />}
            emoji="🌡️"
            color={getTempColor(summary.avg_temperature)}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="อุณหภูมิสูงสุด"
            value={safeToFixed(summary.max_temperature, 1)}
            unit="°C"
            icon={<TrendingUp />}
            emoji="🔥"
            color="#ef4444"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="อุณหภูมิต่ำสุด"
            value={safeToFixed(summary.min_temperature, 1)}
            unit="°C"
            icon={<TrendingDown />}
            emoji="❄️"
            color="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="ความชื้นเฉลี่ย"
            value={safeToFixed(summary.avg_humidity, 1)}
            unit="%RH"
            icon={<Water />}
            emoji="💧"
            color="#3b82f6"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <AnimatedStatCard
            title="กำลังไฟรวม"
            value={safeToFixed(summary.total_power, 1)}
            unit="kW"
            icon={<Bolt />}
            emoji="⚡"
            color="#f59e0b"
            loading={loading}
          />
        </Grid>

        {/* Cabinets Charts */}
        <Grid item xs={12} md={6}>
          <ChartCard
            title="อุณหภูมิแต่ละตู้"
            emoji="🌡️"
            height={300}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cabinets.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 10 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80} 
                  tick={{ fontSize: 10, fill: theme.palette.text.secondary }} 
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8
                  }}
                  formatter={(value: any) => [`${value}°C`, 'อุณหภูมิ']}
                />
                <Bar 
                  dataKey="temperature" 
                  fill="#f97316" 
                  radius={[0, 4, 4, 0]} 
                  name="อุณหภูมิ"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard
            title="ความชื้นแต่ละตู้"
            emoji="💧"
            height={300}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cabinets.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80} 
                  tick={{ fontSize: 10, fill: theme.palette.text.secondary }} 
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8
                  }}
                  formatter={(value: any) => [`${value}%RH`, 'ความชื้น']}
                />
                <Bar 
                  dataKey="humidity" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]} 
                  name="ความชื้น"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Virtualized Cabinet List - Enhanced Grid/Table View */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              p: 3,
              background: isDark
                ? 'rgba(30, 41, 59, 0.4)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <Typography variant="h6" fontWeight="bold">
                  รายละเอียดแต่ละตู้
                </Typography>
                <Chip 
                  label={`${sortedCabinets.length}/${cabinets.length} รายการ`} 
                  size="small" 
                  sx={{
                    bgcolor: '#667eea20',
                    color: '#667eea',
                    fontWeight: 700,
                  }}
                />
              </Box>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : sortedCabinets.length > 0 ? (
              viewMode === 'grid' ? (
                <Grid container spacing={2}>
                  {sortedCabinets.map((cabinet: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={cabinet.name || index}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -8 }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 3,
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                              : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                            border: `2px solid ${
                              getTempStatus(cabinet.temperature) === 'error' 
                                ? 'rgba(239,68,68,0.3)'
                                : getTempStatus(cabinet.temperature) === 'warning'
                                ? 'rgba(245,158,11,0.3)'
                                : 'rgba(16,185,129,0.2)'
                            }`,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: getTempStatus(cabinet.temperature) === 'error'
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : getTempStatus(cabinet.temperature) === 'warning'
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : 'linear-gradient(90deg, #10b981, #059669)',
                            },
                          }}
                        >
                          {/* Cabinet Header */}
                          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: cabinet.name?.includes('Network')
                                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                              }}
                            >
                              <Storage sx={{ color: '#fff', fontSize: 22 }} />
                            </Box>
                            <Box flex={1}>
                              <Typography 
                                variant="subtitle2" 
                                fontWeight="800" 
                                sx={{ 
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cabinet.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cabinet Unit
                              </Typography>
                            </Box>
                          </Box>

                          {/* Metrics Grid */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                            {/* Temperature */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: isDark
                                  ? `${getTempColor(cabinet.temperature)}15`
                                  : `${getTempColor(cabinet.temperature)}08`,
                                border: `1px solid ${getTempColor(cabinet.temperature)}30`,
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Thermostat sx={{ fontSize: 14, color: getTempColor(cabinet.temperature) }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  TEMP
                                </Typography>
                              </Box>
                              <Typography 
                                variant="h6" 
                                fontWeight="900" 
                                sx={{ 
                                  color: getTempColor(cabinet.temperature),
                                  lineHeight: 1,
                                }}
                              >
                                {safeToFixed(cabinet.temperature, 1)}
                                <Typography component="span" variant="caption" fontWeight={700}>
                                  °C
                                </Typography>
                              </Typography>
                            </Paper>

                            {/* Humidity */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: isDark
                                  ? `${getHumidColor(cabinet.humidity)}15`
                                  : `${getHumidColor(cabinet.humidity)}08`,
                                border: `1px solid ${getHumidColor(cabinet.humidity)}30`,
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Water sx={{ fontSize: 14, color: getHumidColor(cabinet.humidity) }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  HUMID
                                </Typography>
                              </Box>
                              <Typography 
                                variant="h6" 
                                fontWeight="900" 
                                sx={{ 
                                  color: getHumidColor(cabinet.humidity),
                                  lineHeight: 1,
                                }}
                              >
                                {safeToFixed(cabinet.humidity, 1)}
                                <Typography component="span" variant="caption" fontWeight={700}>
                                  %
                                </Typography>
                              </Typography>
                            </Paper>

                            {/* Power */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: isDark ? '#f59e0b15' : '#f59e0b08',
                                border: '1px solid #f59e0b30',
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Bolt sx={{ fontSize: 14, color: '#f59e0b' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  POWER
                                </Typography>
                              </Box>
                              <Typography 
                                variant="h6" 
                                fontWeight="900" 
                                sx={{ 
                                  color: '#f59e0b',
                                  lineHeight: 1,
                                }}
                              >
                                {safeToFixed(cabinet.power, 2)}
                                <Typography component="span" variant="caption" fontWeight={700}>
                                  kW
                                </Typography>
                              </Typography>
                            </Paper>

                            {/* Energy */}
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                background: isDark ? '#8b5cf615' : '#8b5cf608',
                                border: '1px solid #8b5cf630',
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Bolt sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  ENERGY
                                </Typography>
                              </Box>
                              <Typography 
                                variant="h6" 
                                fontWeight="900" 
                                sx={{ 
                                  color: '#8b5cf6',
                                  lineHeight: 1,
                                }}
                              >
                                {safeToFixed(cabinet.energy, 0)}
                                <Typography component="span" variant="caption" fontWeight={700}>
                                  kWh
                                </Typography>
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Status Badge */}
                          <Box display="flex" justifyContent="center">
                            {getTempStatus(cabinet.temperature) === 'normal' ? (
                              <Chip 
                                icon={<CheckCircle sx={{ fontSize: 16 }} />} 
                                label="ปกติ" 
                                size="small"
                                sx={{
                                  bgcolor: '#10b981',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 24,
                                }}
                              />
                            ) : getTempStatus(cabinet.temperature) === 'warning' ? (
                              <Chip 
                                icon={<Warning sx={{ fontSize: 16 }} />} 
                                label="เฝ้าระวัง" 
                                size="small"
                                sx={{
                                  bgcolor: '#f59e0b',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 24,
                                }}
                              />
                            ) : (
                              <Chip 
                                icon={<Error sx={{ fontSize: 16 }} />} 
                                label="วิกฤต" 
                                size="small"
                                sx={{
                                  bgcolor: '#ef4444',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  height: 24,
                                }}
                              />
                            )}
                          </Box>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3, 
                    bgcolor: 'transparent',
                    maxHeight: 600,
                    '&::-webkit-scrollbar': {
                      width: 8,
                      height: 8,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      borderRadius: 4,
                    },
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          ชื่อตู้
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          🌡️ อุณหภูมิ
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          💧 ความชื้น
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          ⚡ กำลังไฟ
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          🔌 พลังงาน
                        </TableCell>
                        <TableCell 
                          align="center"
                          sx={{ 
                            fontWeight: 900,
                            bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)',
                            borderBottom: `2px solid ${isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)'}`,
                          }}
                        >
                          สถานะ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedCabinets.map((cabinet: any, index: number) => (
                        <TableRow
                          key={cabinet.name || index}
                          component={motion.tr}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          sx={{
                            '&:hover': { 
                              bgcolor: isDark ? 'rgba(102,126,234,0.08)' : 'rgba(102,126,234,0.04)',
                            },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1.5,
                                  background: cabinet.name?.includes('Network')
                                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Storage sx={{ color: '#fff', fontSize: 18 }} />
                              </Box>
                              <Typography fontWeight={700}>
                                {cabinet.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${safeToFixed(cabinet.temperature, 1)}°C`}
                              size="small"
                              sx={{
                                bgcolor: getTempColor(cabinet.temperature),
                                color: '#fff',
                                fontWeight: 700,
                                minWidth: 70,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${safeToFixed(cabinet.humidity, 1)}%`}
                              size="small"
                              sx={{
                                bgcolor: getHumidColor(cabinet.humidity),
                                color: '#fff',
                                fontWeight: 700,
                                minWidth: 70,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={700} sx={{ color: '#f59e0b' }}>
                              {safeToFixed(cabinet.power, 2)} kW
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="text.secondary">
                              {safeToFixed(cabinet.energy, 0)} kWh
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {getTempStatus(cabinet.temperature) === 'normal' ? (
                              <Chip 
                                icon={<CheckCircle sx={{ fontSize: 16 }} />} 
                                label="ปกติ" 
                                size="small"
                                sx={{
                                  bgcolor: '#10b981',
                                  color: '#fff',
                                  fontWeight: 700,
                                }}
                              />
                            ) : getTempStatus(cabinet.temperature) === 'warning' ? (
                              <Chip 
                                icon={<Warning sx={{ fontSize: 16 }} />} 
                                label="เฝ้าระวัง" 
                                size="small"
                                sx={{
                                  bgcolor: '#f59e0b',
                                  color: '#fff',
                                  fontWeight: 700,
                                }}
                              />
                            ) : (
                              <Chip 
                                icon={<Error sx={{ fontSize: 16 }} />} 
                                label="วิกฤต" 
                                size="small"
                                sx={{
                                  bgcolor: '#ef4444',
                                  color: '#fff',
                                  fontWeight: 700,
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              <EmptyState message="ไม่พบข้อมูลตู้" />
            )}
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// ============================================================
// ⚡ Power Section
// ============================================================
const PowerSection: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

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

  const metrics = data?.main_metrics || {};
  const powerModules = data?.power_modules || {};
  const trends = data?.trends || [];
  
  const pueValue = metrics['PUE (hour)']?.value || metrics['PUE (day)']?.value;

  const getPUERating = (pue: number | null): { label: string; color: string; emoji: string } => {
    if (!pue) return { label: 'ไม่มีข้อมูล', color: '#6b7280', emoji: '❓' };
    if (pue < 1.4) return { label: 'ดีเยี่ยม', color: '#10b981', emoji: '🏆' };
    if (pue < 1.6) return { label: 'ดี', color: '#3b82f6', emoji: '👍' };
    if (pue < 2.0) return { label: 'ปานกลาง', color: '#f59e0b', emoji: '⚠️' };
    return { label: 'ต้องปรับปรุง', color: '#ef4444', emoji: '🔴' };
  };

  const pueRating = getPUERating(pueValue);

  // Energy breakdown pie chart data
  const energyData = [
    { name: 'IT Load', value: metrics['IT accumulate electric by hour']?.value || 0, color: '#667eea' },
    { name: 'Aircon', value: metrics['Aircon accumulate electric by hour']?.value || 0, color: '#4dabf5' },
    { name: 'Module', value: metrics['Module accumulate electric by hour']?.value || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Calculate efficiency score
  const itLoad = metrics['IT accumulate electric by hour']?.value || 0;
  const airconLoad = metrics['Aircon accumulate electric by hour']?.value || 0;
  const totalLoad = itLoad + airconLoad + (metrics['Module accumulate electric by hour']?.value || 0);
  const coolingRatio = itLoad > 0 ? airconLoad / itLoad : 0;
  
  const getEfficiencyScore = (): { score: number; label: string; color: string } => {
    if (!pueValue) return { score: 0, label: 'ไม่มีข้อมูล', color: '#6b7280' };
    const score = Math.max(0, Math.min(100, 100 - (pueValue - 1) * 100));
    if (score >= 80) return { score, label: 'ดีเยี่ยม', color: '#10b981' };
    if (score >= 60) return { score, label: 'ดี', color: '#3b82f6' };
    if (score >= 40) return { score, label: 'ปานกลาง', color: '#f59e0b' };
    return { score, label: 'ต้องปรับปรุง', color: '#ef4444' };
  };
  
  const efficiency = getEfficiencyScore();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Enhanced Header */}
        <Grid item xs={12}>
          <Box
            sx={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 50%, rgba(234,179,8,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(245,158,11,0.03) 50%, rgba(234,179,8,0.05) 100%)',
              borderRadius: 4,
              p: { xs: 2, md: 3 },
              mb: 2,
              border: `1px solid ${isDark ? 'rgba(251,191,36,0.2)' : 'rgba(245,158,11,0.2)'}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <motion.span
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '2.5rem' }}
                >
                  ⚡
                </motion.span>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="800"
                    sx={{
                      background: 'linear-gradient(to right, #fbbf24, #f59e0b, #d97706)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                    }}
                  >
                    ระบบไฟฟ้า (System-ECC800)
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip
                      label={`📍 ${siteCode.toUpperCase()}`}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(251,191,36,0.2)' : 'rgba(245,158,11,0.1)',
                      }}
                    />
                    <Chip
                      label={`🕒 ${hours} ชั่วโมง`}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(251,191,36,0.2)' : 'rgba(245,158,11,0.1)',
                      }}
                    />
                    <Chip
                      label={`⚡ ${safeToFixed(totalLoad, 1)} kWh`}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(251,191,36,0.3)' : 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, val) => val && setViewMode(val)}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    border: `2px solid ${viewMode === 'overview' ? '#3b82f6' : '#f59e0b'}`,
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      fontWeight: 600,
                      transition: 'all 0.3s',
                      '&.Mui-selected': {
                        bgcolor: isDark ? 'rgba(251,191,36,0.3)' : 'rgba(245,158,11,0.2)',
                        color: '#f59e0b',
                        fontWeight: 800,
                      },
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="overview">
                    <Dashboard sx={{ fontSize: 18, mr: 0.5 }} />
                    ภาพรวม
                    {viewMode === 'overview' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                  <ToggleButton value="detailed">
                    <ViewModule sx={{ fontSize: 18, mr: 0.5 }} />
                    รายละเอียด
                    {viewMode === 'detailed' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* PUE Hero Card - Enhanced */}
        <Grid item xs={12} md={6} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(245,158,11,0.03) 100%)',
                border: `2px solid ${pueRating.color}`,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                boxShadow: isDark
                  ? `0 8px 32px ${pueRating.color}30`
                  : `0 4px 20px ${pueRating.color}20`,
              }}
            >
              {/* Top accent bar */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(to right, ${pueRating.color}, ${pueRating.color}80)`,
                }}
              />
              
              <Box textAlign="center">
                <Typography variant="overline" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 1.5 }}>
                  ⚡ ค่า PUE ปัจจุบัน
                </Typography>
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                  <Typography
                    variant="h1"
                    fontWeight="900"
                    sx={{ 
                      color: pueRating.color,
                      fontSize: { xs: '3.5rem', md: '5rem' },
                      my: 2,
                      textShadow: isDark ? `0 0 40px ${pueRating.color}60, 0 0 20px ${pueRating.color}40` : 'none',
                      lineHeight: 1,
                    }}
                  >
                    {safeToFixed(pueValue, 2)}
                  </Typography>
                </motion.div>
                
                <Box display="flex" justifyContent="center" gap={1} mb={3}>
                  <Chip
                    icon={<span style={{ fontSize: '1.2rem' }}>{pueRating.emoji}</span>}
                    label={pueRating.label}
                    sx={{
                      bgcolor: `${pueRating.color}30`,
                      color: pueRating.color,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      px: 2,
                      border: `1px solid ${pueRating.color}50`,
                    }}
                  />
                </Box>
                
                {/* Efficiency Score Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight="600">ประสิทธิภาพ</Typography>
                    <Typography variant="caption" fontWeight="700" color={efficiency.color}>
                      {efficiency.score.toFixed(0)}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${efficiency.score}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(to right, ${efficiency.color}, ${efficiency.color}80)`,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">เป้าหมาย</Typography>
                    <Typography variant="h6" fontWeight="700" color="success.main">
                      &lt; 1.5
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">ส่วนต่าง</Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="700"
                      color={pueValue && pueValue < 1.5 ? 'success.main' : 'warning.main'}
                    >
                      {pueValue ? (pueValue - 1.5 > 0 ? '+' : '') + (pueValue - 1.5).toFixed(2) : '—'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Energy Stats - Enhanced */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(102,126,234,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(102,126,234,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(102,126,234,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#667eea' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                  }}
                >
                  <Memory sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>💻</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                พลังงาน IT Load
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#667eea">
                  {safeToFixed(itLoad, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  kWh
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${((itLoad / totalLoad) * 100).toFixed(0)}% ของทั้งหมด`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(102,126,234,0.2)',
                    color: '#667eea',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(77,171,245,0.1) 0%, rgba(77,171,245,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(77,171,245,0.05) 0%, rgba(77,171,245,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(77,171,245,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#4dabf5' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #4dabf5 0%, #00c6ff 100%)',
                    boxShadow: '0 4px 12px rgba(77,171,245,0.3)',
                  }}
                >
                  <AcUnit sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>❄️</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                พลังงาน Aircon
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#4dabf5">
                  {safeToFixed(airconLoad, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  kWh
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${((airconLoad / totalLoad) * 100).toFixed(0)}% ของทั้งหมด`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(77,171,245,0.2)',
                    color: '#4dabf5',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Cooling Ratio Card - New */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(245,158,11,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#f59e0b' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }}
                >
                  <Typography variant="h6" fontWeight="900" color="#fff">%</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>🔄</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                อัตราส่วนทำความเย็น
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#f59e0b">
                  {safeToFixed(coolingRatio, 2)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  :1
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={coolingRatio < 1 ? 'ดีเยี่ยม' : coolingRatio < 1.5 ? 'ดี' : 'ต้องปรับปรุง'}
                  size="small"
                  sx={{
                    bgcolor: coolingRatio < 1 ? 'rgba(16,185,129,0.2)' : coolingRatio < 1.5 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                    color: coolingRatio < 1 ? '#10b981' : coolingRatio < 1.5 ? '#f59e0b' : '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        {/* Total Power Card - New */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(139,92,246,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#8b5cf6' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                  }}
                >
                  <Bolt sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>⚡</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                พลังงานรวมทั้งหมด
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#8b5cf6">
                  {safeToFixed(totalLoad, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  kWh
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${(totalLoad / hours).toFixed(1)} kW เฉลี่ย/ชม.`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(139,92,246,0.2)',
                    color: '#8b5cf6',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Energy Distribution - Enhanced */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  <Typography variant="h6">🥧</Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="800">
                    สัดส่วนการใช้พลังงาน
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    แบ่งตามประเภทโหลด
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <Box flex={1}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={energyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {energyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8
                        }}
                        formatter={(value: any) => [`${safeToFixed(value, 2)} kWh`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                
                <Box flex={1} display="flex" flexDirection="column" justifyContent="center" gap={2}>
                  {energyData.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: 1,
                                bgcolor: item.color,
                              }}
                            />
                            <Typography variant="body2" fontWeight="600">
                              {item.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="700" color={item.color}>
                            {safeToFixed(item.value, 1)} kWh
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 6,
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / totalLoad) * 100}%` }}
                            transition={{ duration: 1, delay: 0.6 + idx * 0.1 }}
                            style={{
                              height: '100%',
                              background: item.color,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {((item.value / totalLoad) * 100).toFixed(1)}% ของทั้งหมด
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* PUE Trend Chart - Enhanced */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 4,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.divider}`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  }}
                >
                  <Typography variant="h6">📈</Typography>
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="800">
                    แนวโน้ม PUE และพลังงาน
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ข้อมูล {hours} ชั่วโมงล่าสุด
                  </Typography>
                </Box>
              </Box>
              
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={trends}>
                  <defs>
                    <linearGradient id="pueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="itGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="airconGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4dabf5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4dabf5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    tickFormatter={(val) => val ? format(parseISO(val), 'HH:mm') : ''}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis 
                    yAxisId="left" 
                    domain={[1, 2.5]} 
                    tick={{ fontSize: 11, fill: '#ef4444' }}
                    stroke="#ef4444"
                    label={{ value: 'PUE', angle: -90, position: 'insideLeft', fill: '#ef4444' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                    stroke={theme.palette.text.secondary}
                    label={{ value: 'kWh', angle: 90, position: 'insideRight' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(val) => val ? format(parseISO(val), 'dd MMM HH:mm', { locale: th }) : ''}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: 10 }}
                    iconType="line"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="pue"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#pueGradient)"
                    name="PUE"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="it_energy"
                    stroke="#667eea"
                    strokeWidth={2}
                    fill="url(#itGradient)"
                    name="IT Load (kWh)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="aircon_energy"
                    stroke="#4dabf5"
                    strokeWidth={2}
                    fill="url(#airconGradient)"
                    name="Aircon (kWh)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Overview Summary - Only in Overview mode */}
        {viewMode === 'overview' && Object.keys(powerModules).length > 0 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(5,150,105,0.01) 100%)',
                  border: `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      }}
                    >
                      <Typography variant="h6">🔌</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="800">
                        Power Modules Summary
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.keys(powerModules).length} โมดูลทั้งหมด • คลิก "รายละเอียด" เพื่อดูข้อมูลแต่ละโมดูล
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={`✅ ${Object.keys(powerModules).length} โมดูลออนไลน์`}
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.2)',
                      color: '#10b981',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  {/* Average Metrics Summary */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Thermostat sx={{ fontSize: 20, color: '#f97316' }} />
                        <Typography variant="body2" fontWeight="700" color="text.secondary">
                          อุณหภูมิเฉลี่ย
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="900" color="#f97316">
                        {(() => {
                          const temps = Object.values(powerModules)
                            .map((m: any) => m['Inner temperature']?.value)
                            .filter((t): t is number => t != null);
                          return temps.length > 0 
                            ? safeToFixed(temps.reduce((a, b) => a + b, 0) / temps.length, 1)
                            : '—';
                        })()}
                        <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                          °C
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.05)',
                        border: '1px solid rgba(251,191,36,0.2)',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <FlashOn sx={{ fontSize: 20, color: '#f59e0b' }} />
                        <Typography variant="body2" fontWeight="700" color="text.secondary">
                          กระแสรวม
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="900" color="#f59e0b">
                        {(() => {
                          const currents = Object.values(powerModules)
                            .map((m: any) => m['Output current']?.value)
                            .filter((c): c is number => c != null);
                          return currents.length > 0 
                            ? safeToFixed(currents.reduce((a, b) => a + b, 0), 1)
                            : '—';
                        })()}
                        <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                          A
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Bolt sx={{ fontSize: 20, color: '#10b981' }} />
                        <Typography variant="body2" fontWeight="700" color="text.secondary">
                          แรงดันเฉลี่ย
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="900" color="#10b981">
                        {(() => {
                          const voltages = Object.values(powerModules)
                            .map((m: any) => m['Output voltage']?.value)
                            .filter((v): v is number => v != null);
                          return voltages.length > 0 
                            ? safeToFixed(voltages.reduce((a, b) => a + b, 0) / voltages.length, 1)
                            : '—';
                        })()}
                        <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                          V
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)',
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Bolt sx={{ fontSize: 20, color: '#8b5cf6' }} />
                        <Typography variant="body2" fontWeight="700" color="text.secondary">
                          กำลังไฟรวม
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight="900" color="#8b5cf6">
                        {(() => {
                          const powers = Object.values(powerModules).map((m: any) => {
                            const c = m['Output current']?.value;
                            const v = m['Output voltage']?.value;
                            return c && v ? (c * v / 1000) : 0;
                          });
                          return safeToFixed(powers.reduce((a, b) => a + b, 0), 2);
                        })()}
                        <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                          kW
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}

        {/* Power Modules - Enhanced (Only show in Detailed mode) */}
        {viewMode === 'detailed' && Object.keys(powerModules).length > 0 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      }}
                    >
                      <Typography variant="h6">🔌</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="800">
                        Power Modules
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.keys(powerModules).length} โมดูลทั้งหมด
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={viewMode === 'detailed' ? 'แสดงรายละเอียด' : 'แสดงภาพรวม'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Grid container spacing={2}>
                  {Object.entries(powerModules).map(([name, moduleData]: [string, any], idx) => {
                    const temp = moduleData['Inner temperature']?.value;
                    const current = moduleData['Output current']?.value;
                    const voltage = moduleData['Output voltage']?.value;
                    const power = current && voltage ? (current * voltage / 1000).toFixed(2) : null;
                    
                    const getTempStatus = (t: number) => {
                      if (!t) return { label: 'ไม่ทราบ', color: '#6b7280' };
                      if (t < 40) return { label: 'ปกติ', color: '#10b981' };
                      if (t < 50) return { label: 'เฝ้าระวัง', color: '#f59e0b' };
                      return { label: 'สูง', color: '#ef4444' };
                    };
                    
                    const tempStatus = getTempStatus(temp);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={name}>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55 + idx * 0.05 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                        >
                          <Paper 
                            sx={{ 
                              p: 2.5, 
                              borderRadius: 3,
                              background: isDark
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.02) 100%)'
                                : 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(5,150,105,0.01) 100%)',
                              border: `2px solid ${tempStatus.color}40`,
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.3s',
                            }}
                          >
                            {/* Top accent */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: `linear-gradient(to right, ${tempStatus.color}, ${tempStatus.color}80)`,
                              }}
                            />
                            
                            {/* Header */}
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                              <Typography variant="subtitle1" fontWeight="800" sx={{ fontSize: '0.95rem' }}>
                                {name}
                              </Typography>
                              <Chip
                                label={tempStatus.label}
                                size="small"
                                sx={{
                                  bgcolor: `${tempStatus.color}20`,
                                  color: tempStatus.color,
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            </Box>
                            
                            {/* Metrics Grid */}
                            <Grid container spacing={1.5}>
                              {/* Temperature */}
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <Thermostat sx={{ fontSize: 14, color: '#f97316' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                      อุณหภูมิ
                                    </Typography>
                                  </Box>
                                  <Typography variant="h6" fontWeight="900" color="#f97316">
                                    {temp || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    °C
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              {/* Current */}
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.05)',
                                    border: '1px solid rgba(251,191,36,0.2)',
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <FlashOn sx={{ fontSize: 14, color: '#f59e0b' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                      กระแส
                                    </Typography>
                                  </Box>
                                  <Typography variant="h6" fontWeight="900" color="#f59e0b">
                                    {current || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    A
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              {/* Voltage */}
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <Bolt sx={{ fontSize: 14, color: '#10b981' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                      แรงดัน
                                    </Typography>
                                  </Box>
                                  <Typography variant="h6" fontWeight="900" color="#10b981">
                                    {voltage || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    V
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              {/* Power (calculated) */}
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                    <Bolt sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                                      กำลังไฟ
                                    </Typography>
                                  </Box>
                                  <Typography variant="h6" fontWeight="900" color="#8b5cf6">
                                    {power || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    kW
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
};

// ============================================================
// ❄️ Cooling Section
// ============================================================
const CoolingSection: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

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

  const summary = data?.summary || {};
  const units = data?.units || {};
  
  // Calculate efficiency metrics
  const deltaT = (summary.avg_return_temp || 0) - (summary.avg_supply_temp || 0);
  const coolingCapacity = (summary.total_power || 0) * 3.517; // Convert kW to tons (approx)
  const avgEER = coolingCapacity > 0 && summary.total_power > 0 
    ? coolingCapacity / summary.total_power 
    : 0;
  
  const getEfficiencyStatus = (eer: number): { label: string; color: string } => {
    if (eer >= 3.0) return { label: 'ดีเยี่ยม', color: '#10b981' };
    if (eer >= 2.5) return { label: 'ดี', color: '#3b82f6' };
    if (eer >= 2.0) return { label: 'ปานกลาง', color: '#f59e0b' };
    return { label: 'ต้องปรับปรุง', color: '#ef4444' };
  };
  
  const efficiencyStatus = getEfficiencyStatus(avgEER);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Enhanced Header */}
        <Grid item xs={12}>
          <Box
            sx={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(77,171,245,0.1) 0%, rgba(0,242,254,0.05) 50%, rgba(59,130,246,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(77,171,245,0.05) 0%, rgba(0,242,254,0.03) 50%, rgba(59,130,246,0.05) 100%)',
              borderRadius: 4,
              p: { xs: 2, md: 3 },
              mb: 2,
              border: `1px solid ${isDark ? 'rgba(77,171,245,0.2)' : 'rgba(59,130,246,0.2)'}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <motion.span
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  style={{ fontSize: '2.5rem' }}
                >
                  ❄️
                </motion.span>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="800"
                    sx={{
                      background: 'linear-gradient(to right, #4dabf5, #00f2fe, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                    }}
                  >
                    ระบบปรับอากาศ (NetCol5000)
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip
                      label={`📍 ${siteCode.toUpperCase()}`}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(77,171,245,0.2)' : 'rgba(59,130,246,0.1)',
                      }}
                    />
                    <Chip
                      label={`🕒 ${hours} ชั่วโมง`}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(77,171,245,0.2)' : 'rgba(59,130,246,0.1)',
                      }}
                    />
                    <Chip
                      label={`🌀 ${summary.unit_count || 0} เครื่อง`}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(77,171,245,0.3)' : 'rgba(59,130,246,0.15)',
                        color: '#4dabf5',
                      }}
                    />
                    <Chip
                      label={`⚡ ${safeToFixed(summary.total_power, 1)} kW`}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, val) => val && setViewMode(val)}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    border: `2px solid ${viewMode === 'overview' ? '#3b82f6' : '#4dabf5'}`,
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      fontWeight: 600,
                      transition: 'all 0.3s',
                      '&.Mui-selected': {
                        bgcolor: isDark ? 'rgba(77,171,245,0.3)' : 'rgba(59,130,246,0.2)',
                        color: '#4dabf5',
                        fontWeight: 800,
                      },
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(77,171,245,0.15)' : 'rgba(59,130,246,0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="overview">
                    <Dashboard sx={{ fontSize: 18, mr: 0.5 }} />
                    ภาพรวม
                    {viewMode === 'overview' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                  <ToggleButton value="detailed">
                    <ViewModule sx={{ fontSize: 18, mr: 0.5 }} />
                    รายละเอียด
                    {viewMode === 'detailed' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Summary Stats - Enhanced */}
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(77,171,245,0.1) 0%, rgba(77,171,245,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(77,171,245,0.05) 0%, rgba(77,171,245,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(77,171,245,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#4dabf5' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #4dabf5 0%, #00f2fe 100%)',
                    boxShadow: '0 4px 12px rgba(77,171,245,0.3)',
                  }}
                >
                  <AcUnit sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>🌀</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                เครื่องออนไลน์
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#4dabf5">
                  {summary.unit_count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  เครื่อง
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label="ทำงานปกติ"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16,185,129,0.2)',
                    color: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(16,185,129,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(16,185,129,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#10b981' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  }}
                >
                  <Air sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>🌬️</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                ลมจ่าย (Supply Air)
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#10b981">
                  {safeToFixed(summary.avg_supply_temp, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  °C
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={summary.avg_supply_temp < 20 ? 'เย็นสบาย' : 'ปกติ'}
                  size="small"
                  sx={{
                    bgcolor: summary.avg_supply_temp < 20 ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                    color: summary.avg_supply_temp < 20 ? '#3b82f6' : '#10b981',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(239,68,68,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#ef4444' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  }}
                >
                  <Thermostat sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>🔥</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                ลมกลับ (Return Air)
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#ef4444">
                  {safeToFixed(summary.avg_return_temp, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  °C
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`ΔT: ${safeToFixed(deltaT, 1)}°C`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(239,68,68,0.2)',
                    color: '#ef4444',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -4 }}
          >
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.03) 100%)',
                border: '2px solid',
                borderColor: 'rgba(245,158,11,0.3)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: '#f59e0b' }} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }}
                >
                  <Bolt sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.2rem' }}>⚡</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" fontWeight="600" gutterBottom>
                กำลังไฟรวม
              </Typography>
              
              <Box display="flex" alignItems="baseline" gap={0.5} mb={1}>
                <Typography variant="h4" fontWeight="900" color="#f59e0b">
                  {safeToFixed(summary.total_power, 1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                  kW
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`~${safeToFixed(coolingCapacity, 1)} ตัน`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(245,158,11,0.2)',
                    color: '#f59e0b',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        {/* Additional Metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0.03) 100%)',
                border: `2px solid ${efficiencyStatus.color}`,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)',
                boxShadow: isDark
                  ? `0 8px 32px ${efficiencyStatus.color}30`
                  : `0 4px 20px ${efficiencyStatus.color}20`,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: `linear-gradient(to right, ${efficiencyStatus.color}, ${efficiencyStatus.color}80)`,
                }}
              />
              
              <Box textAlign="center">
                <Typography variant="overline" color="text.secondary" fontWeight="700" sx={{ letterSpacing: 1.5 }}>
                  🎯 ประสิทธิภาพ EER
                </Typography>
                
                <Typography
                  variant="h2"
                  fontWeight="900"
                  sx={{ 
                    color: efficiencyStatus.color,
                    fontSize: { xs: '2.5rem', md: '3rem' },
                    my: 1,
                    textShadow: isDark ? `0 0 30px ${efficiencyStatus.color}60` : 'none',
                  }}
                >
                  {safeToFixed(avgEER, 2)}
                </Typography>
                
                <Chip
                  label={efficiencyStatus.label}
                  sx={{
                    bgcolor: `${efficiencyStatus.color}30`,
                    color: efficiencyStatus.color,
                    fontWeight: 700,
                    mb: 2,
                    border: `1px solid ${efficiencyStatus.color}50`,
                  }}
                />
                
                <Typography variant="caption" color="text.secondary" display="block">
                  Cooling Capacity / Power
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  เป้าหมาย: ≥ 2.5 (Efficient)
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(245,158,11,0.03) 100%)',
                border: '2px solid rgba(245,158,11,0.3)',
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  }}
                >
                  <WbSunny sx={{ fontSize: 24, color: '#fff' }} />
                </Box>
                <Typography variant="h6" fontWeight="800">อุณหภูมินอกห้อง</Typography>
              </Box>
              
              <Box display="flex" alignItems="baseline" gap={1} mb={2}>
                <Typography variant="h3" fontWeight="900" color="#f59e0b">
                  {safeToFixed(summary.avg_outdoor_temp, 1)}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="600">
                  °C
                </Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">ส่วนต่างกับ Supply:</Typography>
                  <Typography variant="body2" fontWeight="700" color="#f59e0b">
                    +{safeToFixed((summary.avg_outdoor_temp || 0) - (summary.avg_supply_temp || 0), 1)}°C
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">ความแตกต่าง (ΔT):</Typography>
                  <Typography variant="body2" fontWeight="700" color="#ef4444">
                    {safeToFixed(deltaT, 1)}°C
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} sm={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" fontWeight="800" mb={2}>📊 สรุปภาพรวม</Typography>
              
              <Stack spacing={1.5}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">กำลังเฉลี่ย/เครื่อง:</Typography>
                  <Typography variant="body2" fontWeight="700">
                    {safeToFixed((summary.total_power || 0) / (summary.unit_count || 1), 2)} kW
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Cooling Capacity:</Typography>
                  <Typography variant="body2" fontWeight="700" color="#4dabf5">
                    {safeToFixed(coolingCapacity, 1)} ตัน
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Temperature Delta:</Typography>
                  <Typography variant="body2" fontWeight="700" color="#ef4444">
                    {safeToFixed(deltaT, 1)}°C
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">สถานะระบบ:</Typography>
                  <Chip
                    label="ปกติ"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.2)',
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </motion.div>
        </Grid>

        {/* Units Detail - Only show in Detailed mode */}
        {viewMode === 'detailed' && (
        <Grid item xs={12}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
                <Typography variant="h6" fontWeight="bold">
                  รายละเอียดเครื่องปรับอากาศ
                </Typography>
              </Box>
              
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : Object.keys(units).length > 0 ? (
                <Stack spacing={2}>
                  {Object.entries(units).map(([unitName, unitData]: [string, any], index) => (
                    <motion.div
                      key={unitName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          }
                        }}
                        onClick={() => setExpandedUnit(expandedUnit === unitName ? null : unitName)}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                          <Box display="flex" alignItems="center" gap={2}>
                            <motion.div
                              animate={{ rotate: expandedUnit === unitName ? 360 : 0 }}
                              transition={{ duration: 0.5 }}
                            >
                              <AcUnit sx={{ color: '#4dabf5', fontSize: 32 }} />
                            </motion.div>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {unitName.replace('Cooling-', '')}
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                                <Chip
                                  size="small"
                                  label={`Supply: ${unitData.temperature?.supply_air || '—'}°C`}
                                  sx={{ bgcolor: '#10b98120', color: '#10b981', fontSize: '0.7rem' }}
                                />
                                <Chip
                                  size="small"
                                  label={`Return: ${unitData.temperature?.return_air || '—'}°C`}
                                  sx={{ bgcolor: '#ef444420', color: '#ef4444', fontSize: '0.7rem' }}
                                />
                                <Chip
                                  size="small"
                                  label={`Compressor: ${unitData.status?.compressor_rpm || 0} rpm`}
                                  sx={{ bgcolor: '#4dabf520', color: '#4dabf5', fontSize: '0.7rem' }}
                                />
                              </Box>
                            </Box>
                          </Box>
                          {expandedUnit === unitName ? <ExpandLess /> : <ExpandMore />}
                        </Box>

                        <AnimatePresence>
                          {expandedUnit === unitName && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Divider sx={{ my: 2 }} />
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                                    🌡️ อุณหภูมิ
                                  </Typography>
                                  <Stack spacing={0.5} mt={1}>
                                    <Typography variant="body2">ลมจ่าย: <strong>{unitData.temperature?.supply_air || '—'}°C</strong></Typography>
                                    <Typography variant="body2">ลมกลับ: <strong>{unitData.temperature?.return_air || '—'}°C</strong></Typography>
                                    <Typography variant="body2">Cold Aisle: <strong>{unitData.temperature?.cold_aisle || '—'}°C</strong></Typography>
                                    <Typography variant="body2">Hot Aisle: <strong>{unitData.temperature?.hot_aisle || '—'}°C</strong></Typography>
                                    <Typography variant="body2">นอกห้อง: <strong>{unitData.temperature?.outdoor || '—'}°C</strong></Typography>
                                  </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                                    💧 ความชื้น
                                  </Typography>
                                  <Stack spacing={0.5} mt={1}>
                                    <Typography variant="body2">ปัจจุบัน: <strong>{unitData.humidity?.current || '—'}%RH</strong></Typography>
                                    <Typography variant="body2">ลมจ่าย: <strong>{unitData.humidity?.supply_air || '—'}%RH</strong></Typography>
                                    <Typography variant="body2">ลมกลับ: <strong>{unitData.humidity?.return_air || '—'}%RH</strong></Typography>
                                  </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                                    🔄 สถานะ
                                  </Typography>
                                  <Stack spacing={0.5} mt={1}>
                                    <Typography variant="body2">Compressor: <strong>{unitData.status?.compressor_rpm || 0} rpm</strong></Typography>
                                    <Typography variant="body2">พัดลมในร่ม: <strong>{unitData.status?.indoor_fan_pct || 0}%</strong></Typography>
                                    <Typography variant="body2">พัดลมนอก: <strong>{unitData.status?.outdoor_fan_pct || 0}%</strong></Typography>
                                    <Typography variant="body2">EEV: <strong>{unitData.status?.eev_step || 0} step</strong></Typography>
                                  </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                                    ⚡ ไฟฟ้า
                                  </Typography>
                                  <Stack spacing={0.5} mt={1}>
                                    <Typography variant="body2">กำลังไฟ: <strong>{unitData.power?.current || '—'} kW</strong></Typography>
                                    <Typography variant="body2">กระแส: <strong>{unitData.power?.phase_current || '—'} A</strong></Typography>
                                    <Typography variant="body2">แรงดัน A-B: <strong>{unitData.voltage?.ab || '—'} V</strong></Typography>
                                  </Stack>
                                </Grid>
                              </Grid>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Paper>
                    </motion.div>
                  ))}
                </Stack>
              ) : (
                <EmptyState message="ไม่พบข้อมูลเครื่องปรับอากาศ" />
              )}
            </CardContent>
          </GlassCard>
        </Grid>
        )}
        
        {/* Overview Summary - Only in Overview mode */}
        {viewMode === 'overview' && Object.keys(units).length > 0 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #4dabf5 0%, #00f2fe 100%)',
                      }}
                    >
                      <Typography variant="h6">📋</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="800">
                        สรุปเครื่องปรับอากาศ
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Object.keys(units).length} เครื่องทั้งหมด • คลิก "รายละเอียด" เพื่อดูข้อมูลแต่ละเครื่อง
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={`✅ ${Object.keys(units).length} เครื่องออนไลน์`}
                    sx={{
                      bgcolor: 'rgba(16,185,129,0.2)',
                      color: '#10b981',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                
                <Grid container spacing={2}>
                  {Object.entries(units).slice(0, 4).map(([unitName, unitData]: [string, any], idx) => (
                    <Grid item xs={12} sm={6} md={3} key={unitName}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: isDark ? 'rgba(77,171,245,0.05)' : 'rgba(77,171,245,0.03)',
                          border: '1px solid rgba(77,171,245,0.2)',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                          <AcUnit sx={{ color: '#4dabf5', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight="700">
                            {unitName.replace('Cooling-', '')}
                          </Typography>
                        </Box>
                        
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Supply:</Typography>
                            <Typography variant="caption" fontWeight="700" color="#10b981">
                              {unitData.temperature?.supply_air || '—'}°C
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Return:</Typography>
                            <Typography variant="caption" fontWeight="700" color="#ef4444">
                              {unitData.temperature?.return_air || '—'}°C
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Compressor:</Typography>
                            <Typography variant="caption" fontWeight="700" color="#4dabf5">
                              {unitData.status?.compressor_rpm || 0} rpm
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Power:</Typography>
                            <Typography variant="caption" fontWeight="700" color="#f59e0b">
                              {unitData.power?.current || '—'} kW
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                  
                  {Object.keys(units).length > 4 && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: isDark ? 'rgba(77,171,245,0.05)' : 'rgba(77,171,245,0.03)',
                          border: '1px dashed rgba(77,171,245,0.3)',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          และอีก {Object.keys(units).length - 4} เครื่อง... 
                          <Typography component="span" fontWeight="700" color="primary" sx={{ ml: 1 }}>
                            คลิก "รายละเอียด" เพื่อดูทั้งหมด
                          </Typography>
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
};

// ============================================================
// 🔋 UPS Section
// ============================================================
const UPSSection: React.FC<{ siteCode: string; hours: number }> = ({ siteCode, hours }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

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

  const battery = data?.battery || {};
  const input = data?.input || {};
  const output = data?.output || {};
  const environment = data?.environment || {};
  const other = data?.other || {};
  const circuitBreakers = data?.circuit_breakers || [];

  const batteryCapacity = battery.battery_capacity?.value;
  const batteryVoltage = battery.battery_voltage?.value;
  const batteryCurrent = battery.battery_current?.value;
  const backupTime = battery.backup_time?.value;
  const batteryTemp = battery.battery_temperature?.value;
  
  // Calculate efficiency metrics
  const inputPower = input.input_total_active_power?.value || 0;
  const outputPowerA = output.ph_a_output_active_power?.value || output['ph._a_output_active_power']?.value || 0;
  const outputPowerB = output.ph_b_output_active_power?.value || output['ph._b_output_active_power']?.value || 0;
  const outputPowerC = output.ph_c_output_active_power?.value || output['ph._c_output_active_power']?.value || 0;
  const totalOutputPower = outputPowerA + outputPowerB + outputPowerC;
  const efficiency = inputPower > 0 ? (totalOutputPower / inputPower) * 100 : 0;
  
  // Load balance calculation
  const avgLoad = totalOutputPower / 3;
  const maxDeviation = Math.max(
    Math.abs(outputPowerA - avgLoad),
    Math.abs(outputPowerB - avgLoad),
    Math.abs(outputPowerC - avgLoad)
  );
  const loadBalance = avgLoad > 0 ? (1 - maxDeviation / avgLoad) * 100 : 100;
  
  const getEfficiencyStatus = (eff: number): { label: string; color: string } => {
    if (eff >= 95) return { label: 'ดีเยี่ยม', color: '#10b981' };
    if (eff >= 90) return { label: 'ดี', color: '#3b82f6' };
    if (eff >= 85) return { label: 'ปานกลาง', color: '#f59e0b' };
    return { label: 'ต้องปรับปรุง', color: '#ef4444' };
  };
  
  const efficiencyStatus = getEfficiencyStatus(efficiency);
  
  const getBatteryColor = (cap: number | null) => {
    if (!cap) return '#6b7280';
    if (cap > 80) return '#10b981';
    if (cap > 50) return '#f59e0b';
    return '#ef4444';
  };

  const getBatteryEmoji = (cap: number | null) => {
    if (!cap) return '🔋';
    if (cap > 80) return '🔋';
    if (cap > 50) return '🪫';
    return '⚠️';
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return '#6b7280';
    if (status === 'Normal' || status === '1') return '#10b981';
    return '#ef4444';
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Enhanced Header */}
        <Grid item xs={12}>
          <Box
            sx={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(56,249,215,0.05) 50%, rgba(5,150,105,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(56,249,215,0.03) 50%, rgba(5,150,105,0.05) 100%)',
              borderRadius: 4,
              p: { xs: 2, md: 3 },
              mb: 2,
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.2)'}`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Box
                    sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #38f9d7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                    }}
                  >
                    ⚡
                  </Box>
                </motion.div>
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="800"
                    sx={{
                      background: 'linear-gradient(to right, #10b981, #38f9d7, #059669)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                    }}
                  >
                    เครื่องสำรองไฟ UPS
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip
                      label={`📍 ${siteCode.toUpperCase()}`}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        bgcolor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.1)',
                      }}
                    />
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label="UPS Online"
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.5)',
                      }}
                    />
                    <Chip
                      icon={batteryCapacity && batteryCapacity > 80 ? <CheckCircle sx={{ fontSize: 16 }} /> : <Warning sx={{ fontSize: 16 }} />}
                      label={`🔋 ${safeToFixed(batteryCapacity, 0)}%`}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: `${getBatteryColor(batteryCapacity)}30`,
                        color: getBatteryColor(batteryCapacity),
                        border: `1px solid ${getBatteryColor(batteryCapacity)}`,
                      }}
                    />
                    <Chip
                      label={`⚡ ${safeToFixed(totalOutputPower, 1)} kW`}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        bgcolor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, val) => val && setViewMode(val)}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    border: `2px solid ${viewMode === 'overview' ? '#10b981' : '#38f9d7'}`,
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      fontWeight: 600,
                      transition: 'all 0.3s',
                      '&.Mui-selected': {
                        bgcolor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
                        color: '#10b981',
                        fontWeight: 800,
                      },
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                      },
                    },
                  }}
                >
                  <ToggleButton value="overview">
                    <Dashboard sx={{ fontSize: 18, mr: 0.5 }} />
                    ภาพรวม
                    {viewMode === 'overview' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                  <ToggleButton value="detailed">
                    <ViewModule sx={{ fontSize: 18, mr: 0.5 }} />
                    รายละเอียด
                    {viewMode === 'detailed' && (
                      <CheckCircle sx={{ fontSize: 16, ml: 0.5, color: '#10b981' }} />
                    )}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* 💰 Electricity Cost Report */}
        <Grid item xs={12}>
          <ElectricityCostReport siteCode={siteCode} />
        </Grid>

        {/* Overview Mode - Key Metrics */}
        {viewMode === 'overview' && (
          <>
            {/* Key Performance Indicators */}
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark
                      ? `linear-gradient(135deg, ${getBatteryColor(batteryCapacity)}20 0%, ${getBatteryColor(batteryCapacity)}10 100%)`
                      : `linear-gradient(135deg, ${getBatteryColor(batteryCapacity)}15 0%, ${getBatteryColor(batteryCapacity)}05 100%)`,
                    border: `2px solid ${getBatteryColor(batteryCapacity)}`,
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: isDark
                      ? `0 8px 32px ${getBatteryColor(batteryCapacity)}30`
                      : `0 4px 20px ${getBatteryColor(batteryCapacity)}20`,
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: getBatteryColor(batteryCapacity) }} />
                  
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Battery90 sx={{ fontSize: 48, color: getBatteryColor(batteryCapacity), mb: 1 }} />
                  </motion.div>
                  <Typography variant="h2" fontWeight="900" color={getBatteryColor(batteryCapacity)}>
                    {safeToFixed(batteryCapacity, 0)}
                    <Typography component="span" variant="h5" fontWeight="700">
                      %
                    </Typography>
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ mt: 1, color: getBatteryColor(batteryCapacity) }}>
                    Battery Capacity
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {batteryCapacity && batteryCapacity > 80 
                      ? '✅ สถานะปกติ' 
                      : batteryCapacity && batteryCapacity > 50 
                      ? '⚠️ ควรตรวจสอบ' 
                      : '🔴 ระดับต่ำ'}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ y: -4 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)',
                    border: `2px solid rgba(16,185,129,0.3)`,
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#10b981' }} />
                  
                  <AccessTime sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="h2" fontWeight="900" color="#10b981">
                    {safeToFixed(backupTime, 0)}
                    <Typography component="span" variant="h6" fontWeight="700" sx={{ ml: 0.5 }}>
                      นาที
                    </Typography>
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ mt: 1, color: '#10b981' }}>
                    เวลาสำรอง
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Backup Time Available
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark
                      ? `linear-gradient(135deg, ${efficiencyStatus.color}20 0%, ${efficiencyStatus.color}10 100%)`
                      : `linear-gradient(135deg, ${efficiencyStatus.color}15 0%, ${efficiencyStatus.color}05 100%)`,
                    border: `2px solid ${efficiencyStatus.color}`,
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: isDark
                      ? `0 8px 32px ${efficiencyStatus.color}30`
                      : `0 4px 20px ${efficiencyStatus.color}20`,
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: efficiencyStatus.color }} />
                  
                  <Speed sx={{ fontSize: 48, color: efficiencyStatus.color, mb: 1 }} />
                  <Typography variant="h2" fontWeight="900" color={efficiencyStatus.color}>
                    {safeToFixed(efficiency, 1)}
                    <Typography component="span" variant="h5" fontWeight="700">
                      %
                    </Typography>
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ mt: 1, color: efficiencyStatus.color }}>
                    ประสิทธิภาพ
                  </Typography>
                  <Chip
                    label={efficiencyStatus.label}
                    size="small"
                    sx={{
                      bgcolor: `${efficiencyStatus.color}30`,
                      color: efficiencyStatus.color,
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: '0.7rem',
                    }}
                  />
                </Paper>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ y: -4 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)',
                    border: `2px solid rgba(245,158,11,0.3)`,
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: '#f59e0b' }} />
                  
                  <ElectricBolt sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h2" fontWeight="900" color="#f59e0b">
                    {safeToFixed(totalOutputPower, 1)}
                    <Typography component="span" variant="h6" fontWeight="700" sx={{ ml: 0.5 }}>
                      kW
                    </Typography>
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ mt: 1, color: '#f59e0b' }}>
                    กำลังไฟขาออก
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Total Output Power
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
            
            {/* Load Balance Visualization */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #667eea 100%)',
                      }}
                    >
                      <Typography variant="h6">⚖️</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="800">สมดุลโหลด 3 Phase</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Load Balance: {safeToFixed(loadBalance, 1)}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Stack spacing={2}>
                    {[
                      { label: 'Phase A', value: outputPowerA, color: '#3b82f6' },
                      { label: 'Phase B', value: outputPowerB, color: '#10b981' },
                      { label: 'Phase C', value: outputPowerC, color: '#f59e0b' },
                    ].map((phase, idx) => (
                      <Box key={phase.label}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight="600">{phase.label}</Typography>
                          <Typography variant="body2" fontWeight="700" color={phase.color}>
                            {safeToFixed(phase.value, 2)} kW
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 12,
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: totalOutputPower > 0 ? `${(phase.value / totalOutputPower) * 100}%` : '0%' }}
                            transition={{ duration: 1, delay: 0.4 + idx * 0.1 }}
                            style={{
                              height: '100%',
                              background: `linear-gradient(to right, ${phase.color}, ${phase.color}80)`,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {totalOutputPower > 0 ? safeToFixed((phase.value / totalOutputPower) * 100, 1) : 0}% ของโหลดรวม
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
            
            {/* Summary Stats */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="h6" fontWeight="800" mb={2}>📊 สรุปข้อมูล UPS</Typography>
                  
                  <Stack spacing={1.5}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">🔋 แรงดันแบต:</Typography>
                      <Typography variant="body2" fontWeight="700">
                        {safeToFixed(batteryVoltage, 1)} V
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">⚡ กระแสแบต:</Typography>
                      <Typography variant="body2" fontWeight="700">
                        {safeToFixed(batteryCurrent, 2)} A
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">🌡️ อุณหภูมิแบต:</Typography>
                      <Typography variant="body2" fontWeight="700" color={batteryTemp && batteryTemp > 30 ? '#f59e0b' : '#10b981'}>
                        {safeToFixed(batteryTemp, 1)} °C
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">📊 Input Power:</Typography>
                      <Typography variant="body2" fontWeight="700" color="#3b82f6">
                        {safeToFixed(inputPower, 2)} kW
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">📊 Output Power:</Typography>
                      <Typography variant="body2" fontWeight="700" color="#10b981">
                        {safeToFixed(totalOutputPower, 2)} kW
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">🎯 Load Balance:</Typography>
                      <Chip
                        label={loadBalance >= 90 ? 'ดีเยี่ยม' : loadBalance >= 80 ? 'ดี' : 'ต้องปรับ'}
                        size="small"
                        sx={{
                          bgcolor: loadBalance >= 90 ? 'rgba(16,185,129,0.2)' : loadBalance >= 80 ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)',
                          color: loadBalance >= 90 ? '#10b981' : loadBalance >= 80 ? '#3b82f6' : '#f59e0b',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Stack>
                  
                  <Box mt={2} p={2} bgcolor={isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.03)'} borderRadius={2}>
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                      💡 คลิก "รายละเอียด" เพื่อดูข้อมูลครบถ้วน
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </>
        )}

        {/* Battery Status Section - Redesigned (Detailed Mode Only) */}
        {viewMode === 'detailed' && (
        <Grid item xs={12}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  🔋
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    สถานะแบตเตอรี่
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Battery Status & Information
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {/* Battery Capacity - Hero */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      background: isDark 
                        ? `linear-gradient(135deg, ${getBatteryColor(batteryCapacity)}20 0%, ${getBatteryColor(batteryCapacity)}10 100%)`
                        : `linear-gradient(135deg, ${getBatteryColor(batteryCapacity)}15 0%, ${getBatteryColor(batteryCapacity)}05 100%)`,
                      border: `2px solid ${getBatteryColor(batteryCapacity)}`,
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Battery90 sx={{ fontSize: 60, color: getBatteryColor(batteryCapacity), mb: 2 }} />
                    </motion.div>
                    <Typography variant="h2" fontWeight="900" color={getBatteryColor(batteryCapacity)}>
                      {safeToFixed(batteryCapacity, 0)}
                      <Typography component="span" variant="h4" fontWeight="700">
                        %
                      </Typography>
                    </Typography>
                    <Typography variant="body1" fontWeight="600" sx={{ mt: 1, color: getBatteryColor(batteryCapacity) }}>
                      Battery Capacity
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {batteryCapacity && batteryCapacity > 80 
                        ? '✅ สถานะปกติ' 
                        : batteryCapacity && batteryCapacity > 50 
                        ? '⚠️ ควรตรวจสอบ' 
                        : '🔴 ระดับต่ำ'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Battery Voltage */}
                <Grid item xs={6} md={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Bolt sx={{ color: '#3b82f6', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        แรงดัน
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#3b82f6">
                      {safeToFixed(batteryVoltage, 1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Volts (V)
                    </Typography>
                  </Paper>
                </Grid>

                {/* Battery Current */}
                <Grid item xs={6} md={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ElectricBolt sx={{ color: '#f59e0b', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        กระแส
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#f59e0b">
                      {safeToFixed(batteryCurrent, 2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Amperes (A)
                    </Typography>
                  </Paper>
                </Grid>

                {/* Backup Time */}
                <Grid item xs={6} md={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime sx={{ color: '#10b981', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        เวลาสำรอง
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#10b981">
                      {safeToFixed(backupTime, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      นาที (min)
                    </Typography>
                  </Paper>
                </Grid>

                {/* Battery Temperature */}
                <Grid item xs={6} md={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: isDark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.05)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Thermostat sx={{ color: '#f97316', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        อุณหภูมิ
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#f97316">
                      {safeToFixed(batteryTemp, 1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      องศา (°C)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
        )}

        {/* Input Section - Redesigned (Detailed Mode Only) */}
        {viewMode === 'detailed' && (
        <Grid item xs={12}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #667eea 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  📥
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ข้อมูลขาเข้า UPS
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Input Power & Line Parameters
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Total Power Cards */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <ElectricBolt sx={{ color: '#f59e0b', fontSize: 32 }} />
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                        Total Active Power
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="#f59e0b">
                      {safeToFixed(input.input_total_active_power?.value, 2)}
                      <Typography component="span" variant="h5" fontWeight="600" sx={{ ml: 1 }}>
                        kW
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(102,126,234,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(102,126,234,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Bolt sx={{ color: '#667eea', fontSize: 32 }} />
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                        Total Apparent Power
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="#667eea">
                      {safeToFixed(input.input_total_appearance_power?.value, 2, safeToFixed(input.input_total_apparent_power?.value, 2))}
                      <Typography component="span" variant="h5" fontWeight="600" sx={{ ml: 1 }}>
                        kVA
                      </Typography>
                    </Typography>
                  </Paper>
                </Grid>

                {/* Line Voltage - 3 Phase */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600">
                    ⚡ Line Voltage (3-Phase)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L1-L2</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#3b82f6" mt={0.5}>
                          {safeToFixed(input['input_l1-l2_line_voltage']?.value, 1)} V
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L2-L3</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#10b981" mt={0.5}>
                          {safeToFixed(input['input_l2-l3_line_voltage']?.value, 1)} V
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L3-L1</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#f59e0b" mt={0.5}>
                          {safeToFixed(input['input_l3-l1_line_voltage']?.value, 1)} V
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>

                {/* L1/L2/L3 Active Power */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600">
                    ⚡ Active Power per Phase
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)', border: '1px solid', borderColor: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L1 Active Power</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#3b82f6" mt={0.5}>
                          {safeToFixed(input.input_l1_active_power?.value, 2)} kW
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L2 Active Power</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#10b981" mt={0.5}>
                          {safeToFixed(input.input_l2_active_power?.value, 2)} kW
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.04)', border: '1px solid', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L3 Active Power</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#f59e0b" mt={0.5}>
                          {safeToFixed(input.input_l3_active_power?.value, 2)} kW
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>

                {/* THDi (Total Harmonic Distortion) */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600">
                    📊 THDi - Total Harmonic Distortion (Current)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L1 THDi</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#ef4444" mt={0.5}>
                          {safeToFixed(input.l1_thdi?.value, 1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L2 THDi</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#ef4444" mt={0.5}>
                          {safeToFixed(input.l2_thdi?.value, 1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">L3 THDi</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#ef4444" mt={0.5}>
                          {safeToFixed(input.l3_thdi?.value, 1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Input Frequency & Power Factor */}
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Speed sx={{ color: '#10b981', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">Input Frequency</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#10b981">
                      {safeToFixed(input.input_frequency?.value, 2)} Hz
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Timeline sx={{ color: '#667eea', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">Power Factor</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#667eea">
                      {safeToFixed(input.input_l1_power_factor?.value, 3)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
        )}

        {/* Output Section - Redesigned (Detailed Mode Only) */}
        {viewMode === 'detailed' && (
        <Grid item xs={12}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  📤
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    ข้อมูลขาออก UPS
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Output Power Distribution & Load Management
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Phase A/B/C Output Active Power - Hero Cards */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <FlashOn sx={{ color: '#3b82f6', fontSize: 32 }} />
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                        Phase A Active Power
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="#3b82f6">
                      {safeToFixed(output.ph_a_output_active_power?.value, 2, safeToFixed(output['ph._a_output_active_power']?.value, 2))}
                      <Typography component="span" variant="h5" fontWeight="600" sx={{ ml: 1 }}>
                        kW
                      </Typography>
                    </Typography>
                    <Box mt={2} display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">Load Ratio:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#3b82f6">
                        {safeToFixed(output.ph_a_output_load_ratio?.value, 1, safeToFixed(output['ph._a_output_load_ratio']?.value, 1))}%
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <FlashOn sx={{ color: '#10b981', fontSize: 32 }} />
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                        Phase B Active Power
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="#10b981">
                      {safeToFixed(output.ph_b_output_active_power?.value, 2, safeToFixed(output['ph._b_output_active_power']?.value, 2))}
                      <Typography component="span" variant="h5" fontWeight="600" sx={{ ml: 1 }}>
                        kW
                      </Typography>
                    </Typography>
                    <Box mt={2} display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">Load Ratio:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#10b981">
                        {safeToFixed(output.ph_b_output_load_ratio?.value, 1, safeToFixed(output['ph._b_output_load_ratio']?.value, 1))}%
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <FlashOn sx={{ color: '#f59e0b', fontSize: 32 }} />
                      <Typography variant="subtitle1" color="text.secondary" fontWeight="600">
                        Phase C Active Power
                      </Typography>
                    </Box>
                    <Typography variant="h3" fontWeight="900" color="#f59e0b">
                      {safeToFixed(output.ph_c_output_active_power?.value, 2, safeToFixed(output['ph._c_output_active_power']?.value, 2))}
                      <Typography component="span" variant="h5" fontWeight="600" sx={{ ml: 1 }}>
                        kW
                      </Typography>
                    </Typography>
                    <Box mt={2} display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">Load Ratio:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#f59e0b">
                        {safeToFixed(output.ph_c_output_load_ratio?.value, 1, safeToFixed(output['ph._c_output_load_ratio']?.value, 1))}%
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Additional Output Metrics */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="600">
                    📊 Output Parameters
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Total Load</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#ef4444" mt={0.5}>
                          {safeToFixed(output.load_ratio?.value, 1)}%
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Active Power</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#f59e0b" mt={0.5}>
                          {safeToFixed(output.active_power?.value, 2)} kW
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Apparent Power</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#667eea" mt={0.5}>
                          {safeToFixed(output.apparent_power?.value, 2)} kVA
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Frequency</Typography>
                        <Typography variant="h5" fontWeight="bold" color="#10b981" mt={0.5}>
                          {safeToFixed(output.frequency?.value, 2, safeToFixed(output.output_frequency?.value, 2))} Hz
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Power Factor & Current */}
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(102,126,234,0.1)' : 'rgba(102,126,234,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(102,126,234,0.3)' : 'rgba(102,126,234,0.2)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <BarChartIcon sx={{ color: '#667eea', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">Power Factor</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#667eea">
                      {safeToFixed(output.power_factor?.value, 3)}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', border: '1px solid', borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ElectricBolt sx={{ color: '#3b82f6', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">Current Phase A</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="#3b82f6">
                      {safeToFixed(output.current_a?.value, 2)} A
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
        )}

        {/* Environment - Redesigned (Detailed Mode Only) */}
        {viewMode === 'detailed' && (
        <Grid item xs={12}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}
                >
                  🌡️
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    สภาพแวดล้อม
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Environmental Monitoring & IT Equipment
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Temperature Cards */}
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Thermostat sx={{ fontSize: 48, color: '#f97316', mb: 1 }} />
                    </motion.div>
                    <Typography variant="h3" fontWeight="900" color="#f97316" mt={1}>
                      {safeToFixed(environment.ambient_temperature?.value, 1, safeToFixed(environment.cabinet_temp?.value, 1))}
                      <Typography component="span" variant="h5" fontWeight="600">
                        °C
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" mt={1}>
                      Ambient Temperature
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <Thermostat sx={{ fontSize: 48, color: '#ef4444', mb: 1 }} />
                    <Typography variant="h3" fontWeight="900" color="#ef4444" mt={1}>
                      {safeToFixed(environment.mains_input_bar_l3_temp?.value, 1, safeToFixed(environment['mains_input_bar_l3_temp.']?.value, 1))}
                      <Typography component="span" variant="h5" fontWeight="600">
                        °C
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" mt={1}>
                      Mains Input Bar L3
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <Water sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
                    <Typography variant="h3" fontWeight="900" color="#3b82f6" mt={1}>
                      {safeToFixed(environment.cabinet_humid?.value, 0)}
                      <Typography component="span" variant="h5" fontWeight="600">
                        %
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" mt={1}>
                      ความชื้นตู้
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isDark 
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)',
                      border: '2px solid',
                      borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                      textAlign: 'center',
                    }}
                  >
                    <ElectricBolt sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
                    <Typography variant="h3" fontWeight="900" color="#f59e0b" mt={1}>
                      {safeToFixed(environment.it_equipment_input_total_energy?.value, 2, safeToFixed(other?.it_equipment_input_total_energy?.value, 2))}
                      <Typography component="span" variant="h6" fontWeight="600">
                        kWh
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="600" mt={1}>
                      IT Equipment Energy
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
        )}

        {/* Circuit Breakers Section - NEW (Detailed Mode Only) */}
        {viewMode === 'detailed' && circuitBreakers.length > 0 && (
          <Grid item xs={12}>
            <GlassCard>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    🔌
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      Circuit Breakers
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {circuitBreakers.length} Circuit Breakers Monitored
                    </Typography>
                  </Box>
                </Box>

                {/* Circuit Breaker Chart */}
                <Box height={280} mb={3}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={circuitBreakers.slice(0, 20)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} />
                      <RechartsTooltip
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)', 
                          border: 'none', 
                          borderRadius: 12,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}
                        formatter={(value: any, name: string) => [
                          `${safeToFixed(value, 2)}`,
                          name === 'power' ? 'กำลังไฟ (kW)' : 'โหลด (%)'
                        ]}
                      />
                      <Legend 
                        formatter={(value) => value === 'power' ? 'กำลังไฟ (kW)' : 'โหลด (%)'}
                        wrapperStyle={{ paddingTop: 10 }}
                      />
                      <Bar dataKey="power" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="power" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Circuit Breaker Cards Grid */}
                <Typography variant="subtitle2" color="text.secondary" mb={2} fontWeight="600">
                  📋 รายละเอียด Circuit Breakers
                </Typography>
                <Grid container spacing={2}>
                  {circuitBreakers.map((cb: any, index: number) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)'
                            : 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(139,92,246,0.2)',
                          }
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight="600" noWrap>
                          {cb.name || `CB ${index + 1}`}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color="#8b5cf6" mt={0.5}>
                          {safeToFixed(cb.power, 2)}
                          <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                            kW
                          </Typography>
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>
        )}

        {/* System Status - keep existing */}
        <Grid item xs={12} md={6}>
          <GlassCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <Typography variant="h6" fontWeight="bold">
                  สถานะระบบ
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: '#10b98120',
                      border: '1px solid #10b981'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle sx={{ color: '#10b981' }} />
                      <Typography variant="body1" fontWeight="600" color="#10b981">
                        UPS Online
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: batteryCapacity && batteryCapacity > 50 ? '#10b98120' : '#ef444420',
                      border: `1px solid ${batteryCapacity && batteryCapacity > 50 ? '#10b981' : '#ef4444'}`
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {batteryCapacity && batteryCapacity > 50 ? (
                        <CheckCircle sx={{ color: '#10b981' }} />
                      ) : (
                        <Warning sx={{ color: '#ef4444' }} />
                      )}
                      <Typography 
                        variant="body1" 
                        fontWeight="600" 
                        color={batteryCapacity && batteryCapacity > 50 ? '#10b981' : '#ef4444'}
                      >
                        Battery {batteryCapacity && batteryCapacity > 50 ? 'OK' : 'Low'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    </motion.div>
  );
};

// ============================================================
// 🎯 Main Component
// ============================================================

const ReportsPageNew: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [selectedSite, setSelectedSite] = useState<string>('dc');
  const [selectedReport, setSelectedReport] = useState<string>('room');
  const [hours, setHours] = useState<number>(24);
  const [sites, setSites] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesData = await apiGet<any[]>('/sites');
        if (sitesData && sitesData.length > 0) {
          setSites(sitesData);
          setSelectedSite(sitesData[0].site_code);
        }
      } catch (err) {
        console.error(err);
        setSites([{ site_code: 'dc', site_name: 'Data Center' }]);
      }
    };
    fetchSites();
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleTimeRangeChange = (value: number) => {
    if (value === -1) {
      // Open custom date picker
      setCustomDateOpen(true);
    } else {
      setHours(value);
      setIsCustomRange(false);
    }
  };

  const handleApplyCustomDate = () => {
    if (startDate && endDate) {
      const diffHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      setHours(diffHours);
      setIsCustomRange(true);
      setCustomDateOpen(false);
    }
  };

  const getTimeRangeLabel = () => {
    if (isCustomRange && startDate && endDate) {
      return `${format(startDate, 'dd MMM', { locale: th })} - ${format(endDate, 'dd MMM', { locale: th })}`;
    }
    const option = TIME_RANGE_OPTIONS.find(opt => opt.value === hours);
    return option ? option.label : `${hours} ชั่วโมง`;
  };

  // Excel Export Handler - Export all data based on selected date range
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      setExportProgress(10);

      // Thai-friendly report names
      const reportNames: Record<string, string> = {
        room: 'สภาพแวดล้อมห้อง',
        cabinets: 'ข้อมูลตู้ DC',
        power: 'ระบบไฟฟ้า',
        cooling: 'ระบบทำความเย็น',
        ups: 'ระบบ UPS'
      };

      // Determine export range
      let exportHours = hours;
      let dateRangeText = '';
      if (isCustomRange && startDate && endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        exportHours = Math.round(diffMs / (1000 * 60 * 60));
        dateRangeText = `${format(startDate, 'dd/MM/yyyy HH:mm')} - ${format(endDate, 'dd/MM/yyyy HH:mm')}`;
      } else {
        const endTime = new Date();
        const startTime = subDays(endTime, exportHours / 24);
        dateRangeText = `${format(startTime, 'dd/MM/yyyy HH:mm')} - ${format(endTime, 'dd/MM/yyyy HH:mm')}`;
      }

      // Get current report name
      const currentReportName = reportNames[selectedReport] || selectedReport;

      // Create summary sheet
      const summaryData = [
        [`รายงาน ECC800 Data Center - ${currentReportName}`],
        [''],
        ['ประเภทรายงาน', currentReportName],
        ['ไซต์', selectedSite.toUpperCase()],
        ['ช่วงเวลา', dateRangeText],
        ['จำนวนชั่วโมง', `${exportHours} ชั่วโมง`],
        ['จำนวนวัน', `${(exportHours / 24).toFixed(1)} วัน`],
        ['วันที่สร้างรายงาน', format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: th })],
        ['สร้างโดย', 'ECC800 Monitoring System'],
        [''],
      ];

      // Helper function to add records to workbook
      const addRecordsToWorkbook = (records: any[], sheetName: string, columns: Record<string, string>) => {
        if (records && records.length > 0) {
          const formattedRecords = records.map((r: any) => {
            const row: Record<string, any> = {};
            Object.keys(columns).forEach(key => {
              if (key === 'timestamp' && r[key]) {
                try {
                  row[columns[key]] = format(parseISO(r[key]), 'dd/MM/yyyy HH:mm:ss');
                } catch {
                  row[columns[key]] = r[key];
                }
              } else {
                row[columns[key]] = r[key] !== null && r[key] !== undefined ? r[key] : '';
              }
            });
            return row;
          });
          const sheet = XLSX.utils.json_to_sheet(formattedRecords);
          // Auto-size columns
          const maxWidth = 30;
          const cols = Object.keys(columns).map(() => ({ wch: maxWidth }));
          sheet['!cols'] = cols;
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName.substring(0, 31));
        }
      };

      let totalRecords = 0;

      // Export only the current selected report
      if (selectedReport === 'room') {
        // 1. Room Environment Data
        setExportProgress(30);
        try {
          const exportData = await apiGet<any>(`/reports/room-environment/export?site_code=${selectedSite}&hours=${exportHours}`);
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

            const tempRecords = exportData.records.filter((r: any) => r.metric === 'Temperature');
            const humidRecords = exportData.records.filter((r: any) => r.metric === 'Humidity');

            setExportProgress(50);
            if (tempRecords.length > 0) {
              addRecordsToWorkbook(tempRecords, 'อุณหภูมิ', {
                timestamp: 'เวลา',
                location: 'ตำแหน่ง',
                value: 'อุณหภูมิ (°C)'
              });
            }

            setExportProgress(70);
            if (humidRecords.length > 0) {
              addRecordsToWorkbook(humidRecords, 'ความชื้น', {
                timestamp: 'เวลา',
                location: 'ตำแหน่ง',
                value: 'ความชื้น (%RH)'
              });
            }

            totalRecords += exportData.records.length;
            summaryData.push(['จำนวนข้อมูล', `${exportData.records.length.toLocaleString()} รายการ`]);
          }
        } catch (e) { 
          console.error('Room data export error', e);
          summaryData.push(['สถานะ', 'ไม่สามารถดึงข้อมูลได้']);
        }

      } else if (selectedReport === 'cabinets') {
        // 2. Cabinet Data
        setExportProgress(30);
        try {
          const exportData = await apiGet<any>(`/reports/cabinets-data/export?site_code=${selectedSite}&hours=${exportHours}`);
          if (exportData?.records && exportData.records.length > 0) {
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              cabinet: 'ตู้',
              sensor: 'เซ็นเซอร์',
              metric: 'ประเภท',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            const tempRecords = exportData.records.filter((r: any) => r.metric === 'Temperature');
            const humidRecords = exportData.records.filter((r: any) => r.metric === 'Humidity');
            const powerRecords = exportData.records.filter((r: any) => r.metric === 'Power' || r.metric === 'Energy');

            setExportProgress(45);
            if (tempRecords.length > 0) {
              addRecordsToWorkbook(tempRecords, 'อุณหภูมิตู้', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                value: 'อุณหภูมิ (°C)'
              });
            }

            setExportProgress(60);
            if (humidRecords.length > 0) {
              addRecordsToWorkbook(humidRecords, 'ความชื้นตู้', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                value: 'ความชื้น (%RH)'
              });
            }

            setExportProgress(75);
            if (powerRecords.length > 0) {
              addRecordsToWorkbook(powerRecords, 'พลังงาน', {
                timestamp: 'เวลา',
                cabinet: 'ตู้',
                metric: 'ประเภท',
                value: 'ค่า',
                unit: 'หน่วย'
              });
            }

            totalRecords += exportData.records.length;
            summaryData.push(['จำนวนข้อมูล', `${exportData.records.length.toLocaleString()} รายการ`]);
          }
        } catch (e) { 
          console.error('Cabinet data export error', e);
          summaryData.push(['สถานะ', 'ไม่สามารถดึงข้อมูลได้']);
        }

      } else if (selectedReport === 'power') {
        // 3. Power System
        setExportProgress(30);
        try {
          const exportData = await apiGet<any>(`/reports/power-system/export?site_code=${selectedSite}&hours=${exportHours}`);
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

            const categories = ['PUE', 'IT Power', 'Cooling', 'Total'];
            let progressStep = 40;
            categories.forEach(cat => {
              const catRecords = exportData.records.filter((r: any) => r.category === cat);
              if (catRecords.length > 0) {
                const sheetName = cat === 'PUE' ? 'PUE' : cat === 'IT Power' ? 'IT Power' : cat === 'Cooling' ? 'Cooling' : 'Total Power';
                addRecordsToWorkbook(catRecords, sheetName, {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  metric: 'ตัวชี้วัด',
                  value: 'ค่า',
                  unit: 'หน่วย'
                });
              }
              progressStep += 12;
              setExportProgress(progressStep);
            });

            totalRecords += exportData.records.length;
            summaryData.push(['จำนวนข้อมูล', `${exportData.records.length.toLocaleString()} รายการ`]);
          }
        } catch (e) { 
          console.error('Power data export error', e);
          summaryData.push(['สถานะ', 'ไม่สามารถดึงข้อมูลได้']);
        }

      } else if (selectedReport === 'cooling') {
        // 4. Cooling System
        setExportProgress(30);
        try {
          const exportData = await apiGet<any>(`/reports/cooling/export?site_code=${selectedSite}&hours=${exportHours}`);
          if (exportData?.records && exportData.records.length > 0) {
            // 1. ข้อมูลทั้งหมด (All Data)
            addRecordsToWorkbook(exportData.records, 'ข้อมูลทั้งหมด', {
              timestamp: 'เวลา',
              site: 'ไซต์',
              equipment: 'อุปกรณ์',
              category: 'หมวดหมู่',
              metric: 'ตัวชี้วัด',
              value: 'ค่า',
              unit: 'หน่วย'
            });

            setExportProgress(40);

            // 2. แยกตาม Category
            const categories = ['Temperature', 'Humidity', 'Status', 'Setpoint'];
            const categoryData: Record<string, any[]> = {};
            
            categories.forEach(cat => {
              categoryData[cat] = exportData.records.filter((r: any) => r.category === cat);
            });

            // Temperature Sheet
            if (categoryData['Temperature'].length > 0) {
              addRecordsToWorkbook(categoryData['Temperature'], 'อุณหภูมิ', {
                timestamp: 'เวลา',
                equipment: 'อุปกรณ์',
                metric: 'ตัวชี้วัด',
                value: 'ค่า (°C)',
                unit: 'หน่วย'
              });
            }
            setExportProgress(50);

            // Humidity Sheet
            if (categoryData['Humidity'].length > 0) {
              addRecordsToWorkbook(categoryData['Humidity'], 'ความชื้น', {
                timestamp: 'เวลา',
                equipment: 'อุปกรณ์',
                metric: 'ตัวชี้วัด',
                value: 'ค่า (%RH)',
                unit: 'หน่วย'
              });
            }
            setExportProgress(55);

            // Status Sheet
            if (categoryData['Status'].length > 0) {
              addRecordsToWorkbook(categoryData['Status'], 'สถานะ', {
                timestamp: 'เวลา',
                equipment: 'อุปกรณ์',
                metric: 'ตัวชี้วัด',
                value: 'ค่า',
                unit: 'หน่วย'
              });
            }
            setExportProgress(60);

            // Setpoint Sheet
            if (categoryData['Setpoint'].length > 0) {
              addRecordsToWorkbook(categoryData['Setpoint'], 'ค่าตั้ง', {
                timestamp: 'เวลา',
                equipment: 'อุปกรณ์',
                metric: 'ตัวชี้วัด',
                value: 'ค่า',
                unit: 'หน่วย'
              });
            }
            setExportProgress(65);

            // 3. แยกตามอุปกรณ์แต่ละตัว (Per Equipment)
            const equipmentMap: Record<string, any[]> = {};
            exportData.records.forEach((r: any) => {
              const eqName = r.equipment || 'Unknown';
              if (!equipmentMap[eqName]) {
                equipmentMap[eqName] = [];
              }
              equipmentMap[eqName].push(r);
            });

            let equipmentProgress = 65;
            const equipmentList = Object.keys(equipmentMap).slice(0, 10); // Top 10 equipment
            
            equipmentList.forEach((eqName, idx) => {
              const shortName = eqName.replace(/Cooling-/gi, '').replace(/NetCol/gi, '').substring(0, 25);
              addRecordsToWorkbook(equipmentMap[eqName], shortName, {
                timestamp: 'เวลา',
                category: 'หมวดหมู่',
                metric: 'ตัวชี้วัด',
                value: 'ค่า',
                unit: 'หน่วย'
              });
              equipmentProgress += Math.floor(15 / equipmentList.length);
              setExportProgress(Math.min(equipmentProgress, 80));
            });

            // 4. สรุปตามประเภทอุณหภูมิ (Temperature Breakdown)
            const tempRecords = categoryData['Temperature'];
            if (tempRecords.length > 0) {
              const supplyTemp = tempRecords.filter((r: any) => 
                r.metric?.toLowerCase().includes('supply') || 
                r.metric?.toLowerCase().includes('sai')
              );
              const returnTemp = tempRecords.filter((r: any) => 
                r.metric?.toLowerCase().includes('return') || 
                r.metric?.toLowerCase().includes('rai')
              );
              const outdoorTemp = tempRecords.filter((r: any) => 
                r.metric?.toLowerCase().includes('outdoor') || 
                r.metric?.toLowerCase().includes('outside') ||
                r.metric?.toLowerCase().includes('ambient')
              );

              if (supplyTemp.length > 0) {
                addRecordsToWorkbook(supplyTemp, 'อุณหภูมิ-Supply Air', {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  value: 'ค่า (°C)'
                });
              }

              if (returnTemp.length > 0) {
                addRecordsToWorkbook(returnTemp, 'อุณหภูมิ-Return Air', {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  value: 'ค่า (°C)'
                });
              }

              if (outdoorTemp.length > 0) {
                addRecordsToWorkbook(outdoorTemp, 'อุณหภูมิ-Outdoor', {
                  timestamp: 'เวลา',
                  equipment: 'อุปกรณ์',
                  value: 'ค่า (°C)'
                });
              }
            }

            setExportProgress(85);

            // 5. Power/Energy Data (if available)
            const powerRecords = exportData.records.filter((r: any) => 
              r.metric?.toLowerCase().includes('power') || 
              r.metric?.toLowerCase().includes('energy') ||
              r.metric?.toLowerCase().includes('watt') ||
              r.metric?.toLowerCase().includes('current') ||
              r.metric?.toLowerCase().includes('voltage')
            );
            
            if (powerRecords.length > 0) {
              addRecordsToWorkbook(powerRecords, 'พลังงาน', {
                timestamp: 'เวลา',
                equipment: 'อุปกรณ์',
                metric: 'ตัวชี้วัด',
                value: 'ค่า',
                unit: 'หน่วย'
              });
            }

            totalRecords += exportData.records.length;
            summaryData.push(['จำนวนข้อมูล', `${exportData.records.length.toLocaleString()} รายการ`]);
            summaryData.push(['จำนวนอุปกรณ์', `${Object.keys(equipmentMap).length} เครื่อง`]);
            summaryData.push(['ประเภทข้อมูล', categories.join(', ')]);
          }
        } catch (e) { 
          console.error('Cooling data export error', e);
          summaryData.push(['สถานะ', 'ไม่สามารถดึงข้อมูลได้']);
        }

      } else if (selectedReport === 'ups') {
        // 5. UPS System
        setExportProgress(30);
        try {
          const exportData = await apiGet<any>(`/reports/ups/export?site_code=${selectedSite}&hours=${exportHours}`);
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

            const categories = ['Battery', 'Load', 'Input', 'Output', 'Temperature'];
            let progressStep = 40;
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
              progressStep += 8;
              setExportProgress(progressStep);
            });

            totalRecords += exportData.records.length;
            summaryData.push(['จำนวนข้อมูล', `${exportData.records.length.toLocaleString()} รายการ`]);
          }
        } catch (e) { 
          console.error('UPS data export error', e);
          summaryData.push(['สถานะ', 'ไม่สามารถดึงข้อมูลได้']);
        }
      }

      // Add total summary
      summaryData.push(['']);
      summaryData.push(['รวมทั้งหมด', `${totalRecords.toLocaleString()} รายการ`]);
      summaryData.push(['']);
      summaryData.push(['หมายเหตุ:']);
      summaryData.push(['- ข้อมูลจากแท็บ: ' + currentReportName]);
      summaryData.push(['- เวลาที่แสดงเป็นเวลาท้องถิ่น (Local Time)']);
      summaryData.push(['- ข้อมูลได้รับการประมวลผลและตรวจสอบความถูกต้องแล้ว']);

      setExportProgress(90);

      // Insert summary sheet at the beginning
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      // Style summary sheet
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, '📊 สรุป');

      // Reorder sheets - put summary first
      const sheetNames = workbook.SheetNames;
      const summaryIndex = sheetNames.indexOf('📊 สรุป');
      if (summaryIndex > 0) {
        sheetNames.splice(summaryIndex, 1);
        sheetNames.unshift('📊 สรุป');
        workbook.SheetNames = sheetNames;
      }

      setExportProgress(95);

      // Generate filename with report type and date range
      const reportShortName = selectedReport === 'room' ? 'Room' :
        selectedReport === 'cabinets' ? 'Cabinets' :
          selectedReport === 'power' ? 'Power' :
            selectedReport === 'cooling' ? 'Cooling' :
              selectedReport === 'ups' ? 'UPS' : 'Report';
      
      const fileName = `ECC800_${reportShortName}_${selectedSite.toUpperCase()}_${format(startDate || subDays(new Date(), exportHours / 24), 'yyyyMMdd')}-${format(endDate || new Date(), 'yyyyMMdd')}_${format(new Date(), 'HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportProgress(100);
      
      // Success notification
      setTimeout(() => {
        alert(`✅ Export สำเร็จ!\n\nแท็บ: ${currentReportName}\nไฟล์: ${fileName}\nข้อมูลทั้งหมด: ${totalRecords.toLocaleString()} รายการ`);
      }, 500);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('❌ เกิดข้อผิดพลาดในการสร้าง Excel\n\nกรุณาลองใหม่อีกครั้ง');
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };

  const renderReport = () => {
    if (isRefreshing) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <CircularProgress size={48} />
          </motion.div>
        </Box>
      );
    }

    switch (selectedReport) {
      case 'overview':
        return <OverviewSection siteCode={selectedSite} hours={hours} onNavigate={setSelectedReport} />;
      case 'room':
        return <RoomEnvironmentSection siteCode={selectedSite} hours={hours} />;
      case 'cabinets':
        return <CabinetsSection siteCode={selectedSite} hours={hours} />;
      case 'power':
        return <PowerSection siteCode={selectedSite} hours={hours} />;
      case 'cooling':
        return <CoolingSection siteCode={selectedSite} hours={hours} />;
      case 'ups':
        return <UPSSection siteCode={selectedSite} hours={hours} />;
      default:
        return <RoomEnvironmentSection siteCode={selectedSite} hours={hours} />;
    }
  };

  // Filter content for drawer
  const FilterContent = () => (
    <Box sx={{ p: 3, width: isMobile ? '100%' : 320 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          🔍 ตัวกรอง
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <Close />
          </IconButton>
        )}
      </Box>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>🏢 ไซต์</InputLabel>
          <Select
            value={selectedSite}
            label="🏢 ไซต์"
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {sites.map((site) => (
              <MenuItem key={site.site_code} value={site.site_code}>
                {site.site_name || site.site_code.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>⏰ ช่วงเวลา</InputLabel>
          <Select
            value={isCustomRange ? -1 : hours}
            label="⏰ ช่วงเวลา"
            onChange={(e) => handleTimeRangeChange(e.target.value as number)}
            renderValue={() => getTimeRangeLabel()}
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  <span>{opt.icon}</span>
                  <Typography>{opt.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Refresh />}
            onClick={() => {
              handleRefresh();
              setFilterDrawerOpen(false);
            }}
            sx={{
              background: GRADIENT_PRESETS.purple,
              '&:hover': { background: GRADIENT_PRESETS.ocean }
            }}
          >
            รีเฟรช
          </Button>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PictureAsPdf />}
            sx={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={isExporting ? <CircularProgress size={16} /> : <TableChart />}
            onClick={handleExportExcel}
            disabled={isExporting}
            sx={{ 
              borderColor: '#10b981', 
              color: '#10b981',
              '&:hover': {
                borderColor: '#059669',
                bgcolor: 'rgba(16, 185, 129, 0.08)',
              }
            }}
          >
            {isExporting ? `${exportProgress}%` : 'Excel'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        p: { xs: 2, sm: 3, md: 4 },
        // Centered content on mobile
        maxWidth: isMobile ? 720 : '100%',
        mx: 'auto',
        position: 'relative',
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300,
          background: isDark
            ? 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Enhanced Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section - Enhanced */}
          <Box 
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              p: { xs: 2, md: 3 },
              mb: 3,
              background: isDark
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              backdropFilter: 'blur(10px)',
              boxShadow: isDark 
                ? '0 8px 32px rgba(0,0,0,0.2)'
                : '0 8px 32px rgba(0,0,0,0.06)',
            }}
          >
            {/* Animated Gradient Orbs */}
            <Box
              sx={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                  '50%': { transform: 'translate(-20px, -20px) scale(1.1)' },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -60,
                left: -60,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(118, 75, 162, 0.2) 0%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'float 8s ease-in-out infinite',
                animationDelay: '2s',
              }}
            />
            
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="flex-start"
              flexWrap="wrap"
              gap={3}
              sx={{ position: 'relative', zIndex: 1 }}
            >
            <Box>
              <Box display="flex" alignItems="center" gap={2.5} mb={1.5}>
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Box
                    sx={{
                      width: { xs: 50, md: 60 },
                      height: { xs: 50, md: 60 },
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '1.6rem', md: '2rem' },
                      boxShadow: '0 12px 28px rgba(102, 126, 234, 0.5)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -2,
                        borderRadius: 3,
                        padding: 2,
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        opacity: 0.3,
                      },
                    }}
                  >
                    📊
                  </Box>
                </motion.div>
                <Box>
                  <Typography 
                    variant={isMobile ? 'h5' : 'h4'}
                    fontWeight="900"
                    sx={{
                      background: isDark
                        ? 'linear-gradient(135deg, #fff 0%, #e0e7ff 40%, #c7d2fe 100%)'
                        : 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.02em',
                      mb: 0.5,
                    }}
                  >
                    ศูนย์รายงาน Data Center
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {format(new Date(), 'HH:mm:ss • dd MMM yyyy', { locale: th })}
                  </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Site Selector & Time Range - Enhanced */}
            <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
              {/* Site Toggle */}
              <ToggleButtonGroup
                value={selectedSite}
                exclusive
                onChange={(_, val) => val && setSelectedSite(val)}
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                  borderRadius: 2.5,
                  p: 0.5,
                  boxShadow: isDark 
                    ? '0 4px 12px rgba(0,0,0,0.3)'
                    : '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    },
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                      }
                    }
                  }
                }}
              >
                {sites.map((site) => (
                  <ToggleButton key={site.site_code} value={site.site_code}>
                    <LocationOn sx={{ fontSize: 18, mr: 0.5 }} />
                    {site.site_code.toUpperCase()}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              {/* Time Range Selector */}
              <FormControl 
                size="small"
                sx={{
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                    borderRadius: 2.5,
                    fontWeight: 600,
                    '& fieldset': {
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              >
                <InputLabel>⌚ ช่วงเวลา</InputLabel>
                <Select
                  value={isCustomRange ? -1 : hours}
                  label="⌚ ช่วงเวลา"
                  onChange={(e) => handleTimeRangeChange(e.target.value as number)}
                  renderValue={() => getTimeRangeLabel()}
                >
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{opt.icon}</span>
                        <Typography>{opt.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Refresh Button */}
              {!isMobile && (
                <>
                  <Tooltip title="รีเฟรชข้อมูล">
                    <IconButton 
                      onClick={handleRefresh}
                      sx={{ 
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: '#fff',
                        }
                      }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>

                  {/* Export Excel Button */}
                  <Tooltip title={isExporting ? `กำลัง Export... ${exportProgress}%` : 'ดาวน์โหลดข้อมูลเป็น Excel'}>
                    <Box sx={{ position: 'relative' }}>
                      <Button
                        variant="contained"
                        startIcon={isExporting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <TableChart />}
                        onClick={handleExportExcel}
                        disabled={isExporting}
                        sx={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          px: 3,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                          },
                          '&:disabled': {
                            background: 'rgba(16, 185, 129, 0.3)',
                            color: 'rgba(255,255,255,0.6)',
                          }
                        }}
                      >
                        {isExporting ? `${exportProgress}%` : 'Export Excel'}
                      </Button>
                      {isExporting && exportProgress > 0 && (
                        <LinearProgress 
                          variant="determinate" 
                          value={exportProgress} 
                          sx={{ 
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            borderRadius: 1,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#fff',
                            }
                          }} 
                        />
                      )}
                    </Box>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          </Box>
        </motion.div>

        {/* Report Type Cards */}
        <Box sx={{ mb: 3 }}>
          <Box 
            display="flex" 
            gap={1.5} 
            sx={{ 
              overflowX: 'auto', 
              pb: 1,
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { 
                bgcolor: 'rgba(0,0,0,0.2)', 
                borderRadius: 2 
              },
            }}
          >
            {REPORT_TYPES.map((type) => (
              <ReportTypeCard
                key={type.id}
                type={type}
                selected={selectedReport === type.id}
                onClick={() => setSelectedReport(type.id)}
              />
            ))}
          </Box>
        </Box>

        {/* Report Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedReport}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderReport()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Mobile Filter Drawer */}
      <SwipeableDrawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onOpen={() => setFilterDrawerOpen(true)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: isMobile ? 24 : 0,
            borderTopRightRadius: isMobile ? 24 : 0,
            maxHeight: isMobile ? '80vh' : '100vh',
          }
        }}
      >
        <FilterContent />
      </SwipeableDrawer>

      {/* Custom Date Picker Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <Drawer
          anchor="right"
          open={customDateOpen}
          onClose={() => setCustomDateOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100%', sm: 400 },
              p: 3,
            }
          }}
        >
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                🎯 กำหนดช่วงเวลาเอง
              </Typography>
              <IconButton onClick={() => setCustomDateOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <Stack spacing={3}>
              <DatePicker
                label="📅 วันที่เริ่มต้น"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                maxDate={endDate || new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />

              <DatePicker
                label="📅 วันที่สิ้นสุด"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />

              {startDate && endDate && (
                <Alert severity="info" icon={<DateRange />}>
                  <Typography variant="body2">
                    ระยะเวลา: <strong>{Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}</strong> วัน
                    (<strong>{Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))}</strong> ชั่วโมง)
                  </Typography>
                </Alert>
              )}

              <Divider />

              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setCustomDateOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApplyCustomDate}
                  disabled={!startDate || !endDate}
                  sx={{
                    background: GRADIENT_PRESETS.purple,
                    '&:hover': { background: GRADIENT_PRESETS.ocean }
                  }}
                >
                  ✅ ใช้งาน
                </Button>
              </Box>
            </Stack>
          </Box>
        </Drawer>
      </LocalizationProvider>

      {/* Scroll to Top */}
      <ScrollToTopFab />

      {/* Custom Date Range Picker Dialog */}
      <Drawer
        anchor="bottom"
        open={customDateOpen}
        onClose={() => setCustomDateOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '80vh',
            background: isDark 
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                📅 เลือกช่วงเวลา
              </Typography>
              <Typography variant="caption" color="text.secondary">
                เลือกวันที่เริ่มและสิ้นสุดสำหรับการดูข้อมูล
              </Typography>
            </Box>
            <IconButton onClick={() => setCustomDateOpen(false)}>
              <Close />
            </IconButton>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
            <Stack spacing={3}>
              <DatePicker
                label="วันที่เริ่มต้น"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                maxDate={endDate || new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      startAdornment: <DateRange sx={{ mr: 1, color: 'text.secondary' }} />,
                    }
                  },
                }}
              />

              <DatePicker
                label="วันที่สิ้นสุด"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      startAdornment: <DateRange sx={{ mr: 1, color: 'text.secondary' }} />,
                    }
                  },
                }}
              />

              {startDate && endDate && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                    border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    📈 ข้อมูลที่จะแสดง:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • ช่วงเวลา: {format(startDate, 'dd MMM yyyy', { locale: th })} - {format(endDate, 'dd MMM yyyy', { locale: th })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • รวม: {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} วัน ({Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))} ชั่วโมง)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    💡 ข้อมูลทั้งหมดจาก 5 ระบบจะถูก Export ลงในไฟล์ Excel
                  </Typography>
                </Paper>
              )}

              <Box display="flex" gap={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setCustomDateOpen(false)}
                  sx={{ py: 1.5 }}
                >
                  ยกเลิก
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleApplyCustomDate}
                  disabled={!startDate || !endDate}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    }
                  }}
                >
                  ตกลง
                </Button>
              </Box>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ReportsPageNew;
