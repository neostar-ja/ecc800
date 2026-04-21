import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Container,
  Divider,
  Stack,
  LinearProgress,
  keyframes
} from '@mui/material';
import {
  Refresh,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  Power,
  Thermostat,
  Opacity,
  Memory,
  Speed,
  AcUnit,
  PowerSettingsNew,
  BoltOutlined,
  ElectricBolt
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import { apiGet } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';

// ============ ANIMATIONS ============
const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.6; transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px currentColor; }
  50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const scaleIn = keyframes`
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const formatNumber = (value: unknown, digits: number, fallback = '--'): string => {
  return isFiniteNumber(value) ? value.toFixed(digits) : fallback;
};

const safeNumber = (value: unknown, fallback = 0): number => {
  return isFiniteNumber(value) ? value : fallback;
};

// ============ ENHANCED PUE CARD WITH GAUGE + CHART ============
interface EnhancedPUECardProps {
  value: number | null;
  trendData: Array<{ time: string; value: number }>;
  site: 'DC' | 'DR';
  lastUpdated?: string | null;
}

const EnhancedPUECard: React.FC<EnhancedPUECardProps> = ({ value, trendData, site, lastUpdated }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // ใช้ค่าล่าสุดจาก trend data (เข็มจะชี้ที่นี่)
  const latestValue = trendData && trendData.length > 0 
    ? trendData[trendData.length - 1].value 
    : (value || null);
  
  const normalizedValue = latestValue ? Math.max(1.0, Math.min(3.0, latestValue)) : 1.5;
  const angle = -90 + (((normalizedValue - 1.0) / 2.0) * 180);
  
  const getColor = (pue: number) => {
    if (pue <= 1.5) return '#00e676';
    if (pue <= 2.0) return '#ffa726';
    return '#ef5350';
  };
  
  const color = value ? getColor(normalizedValue) : '#999';
  const siteColor = site === 'DC' ? '#2196f3' : '#9c27b0';
  
  return (
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha(siteColor, 0.15)} 0%, ${alpha(color, 0.08)} 100%)`
          : `linear-gradient(135deg, ${alpha(siteColor, 0.08)} 0%, ${alpha(color, 0.04)} 100%)`,
        border: `2px solid ${alpha(siteColor, 0.3)}`,
        borderRadius: 4,
        p: { xs: 2, sm: 2.5, md: 3 },
        animation: `${fadeIn} 0.6s ease-out`,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 12px 32px ${alpha(siteColor, 0.25)}`,
          transform: 'translateY(-2px)',
        },
        // Top accent bar
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${siteColor} 0%, ${color} 100%)`,
        },
        // Ambient glow
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 60%)`,
          pointerEvents: 'none',
          animation: `${glow} 4s ease-in-out infinite`,
        }
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={2}
        gap={{ xs: 1, sm: 0 }}
        position="relative"
        zIndex={1}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1.2,
              background: `linear-gradient(135deg, ${alpha(siteColor, 0.15)} 0%, ${alpha(color, 0.1)} 100%)`,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${alpha(siteColor, 0.25)}, inset 0 1px 0 ${alpha(siteColor, 0.1)}`,
              border: `2px solid ${alpha(siteColor, 0.3)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at top right, ${alpha(color, 0.2)}, transparent)`,
                pointerEvents: 'none',
              }
            }}
          >
            <ElectricBolt sx={{ color: color, fontSize: 32, position: 'relative', zIndex: 1 }} />
          </Box>
          <Box>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="900" sx={{
                background: `linear-gradient(135deg, ${siteColor} 0%, ${color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: -0.5,
              }}>
                PUE
              </Typography>
              <Typography variant="caption" color={alpha(siteColor, 0.7)} fontWeight="bold" fontSize="0.65rem">
                ⚡ EFFICIENCY
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem" fontWeight={500} sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
              Power Usage Effectiveness
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<ElectricBolt />}
          label="LIVE"
          size="small"
          sx={{
            bgcolor: alpha(color, 0.15),
            color: color,
            fontWeight: 'bold',
            border: `1px solid ${alpha(color, 0.3)}`,
            animation: `${pulse} 2s infinite`,
            boxShadow: `0 0 12px ${alpha(color, 0.4)}`,
          }}
        />
      </Box>

      {/* Gauge - Responsive SVG */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%',
          maxWidth: 240,
          height: { xs: 140, sm: 160 },
          mx: 'auto', 
          mb: 1 
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 240 160" 
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradient for arc */}
            <linearGradient id={`pue-gradient-${site}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e676" />
              <stop offset="50%" stopColor="#ffa726" />
              <stop offset="100%" stopColor="#ef5350" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id={`glow-${site}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Drop shadow for needle */}
            <filter id={`needle-shadow-${site}`}>
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Background arc */}
          <path
            d="M 30 120 A 90 90 0 0 1 210 120"
            fill="none"
            stroke={alpha(theme.palette.text.primary, 0.06)}
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Colored arc with animation */}
          <path
            d="M 30 120 A 90 90 0 0 1 210 120"
            fill="none"
            stroke={`url(#pue-gradient-${site})`}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray="282.7"
            strokeDashoffset="0"
            style={{
              animation: `${shimmer} 3s ease-in-out infinite`
            }}
          />
          
          {/* Tick marks */}
          {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x1 = 120 + 75 * Math.cos(rad);
            const y1 = 120 + 75 * Math.sin(rad);
            const x2 = 120 + 85 * Math.cos(rad);
            const y2 = 120 + 85 * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={alpha(theme.palette.text.primary, 0.15)}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Needle - Enhanced speedometer style (beautiful like mile gauge) */}
          <defs>
            <linearGradient id={`needle-gradient-${site}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={alpha(color, 0.95)} />
              <stop offset="50%" stopColor={color} />
              <stop offset="100%" stopColor={alpha(color, 0.8)} />
            </linearGradient>
            <filter id={`needle-glow-${site}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g
            transform={`rotate(${angle} 120 120)`}
            style={{ 
              transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: `url(#needle-shadow-${site})`
            }}
          >
            {/* Needle body - Tapered design like speedometer */}
            <path
              d="M 118 120 L 117 55 L 119.5 42 L 120 38 L 120.5 42 L 123 55 L 122 120 Z"
              fill={`url(#needle-gradient-${site})`}
              stroke={alpha(color, 0.4)}
              strokeWidth="0.5"
              style={{
                filter: `url(#needle-glow-${site})`
              }}
            />
            
            {/* Needle highlight - left side */}
            <path
              d="M 119 115 L 118.2 58 L 119.7 43 L 120 40 Z"
              fill={alpha('#ffffff', 0.35)}
              opacity="0.6"
            />
            
            {/* Sharp tip with glow */}
            <circle
              cx="120"
              cy="38"
              r="3.5"
              fill={color}
              stroke={alpha('#ffffff', 0.5)}
              strokeWidth="0.5"
              style={{
                filter: `url(#needle-glow-${site})`
              }}
            />
            
            {/* Tip highlight */}
            <circle
              cx="119.5"
              cy="37.5"
              r="1.5"
              fill={alpha('#ffffff', 0.7)}
            />
          </g>
          
          {/* Center hub - Enhanced like speedometer */}
          <defs>
            <radialGradient id={`hub-gradient-${site}`}>
              <stop offset="0%" stopColor={alpha('#ffffff', 0.9)} />
              <stop offset="40%" stopColor={alpha(color, 0.15)} />
              <stop offset="80%" stopColor={alpha(color, 0.4)} />
              <stop offset="100%" stopColor={color} />
            </radialGradient>
            <radialGradient id={`hub-inner-${site}`}>
              <stop offset="0%" stopColor={alpha(color, 0.3)} />
              <stop offset="100%" stopColor={color} />
            </radialGradient>
          </defs>
          
          {/* Outer ring */}
          <circle 
            cx="120" 
            cy="120" 
            r="16" 
            fill={`url(#hub-gradient-${site})`} 
            stroke={color} 
            strokeWidth="2.5"
            style={{
              filter: `url(#glow-${site})`
            }}
          />
          
          {/* Middle ring with pulse */}
          <circle 
            cx="120" 
            cy="120" 
            r="10" 
            fill={`url(#hub-inner-${site})`}
            style={{
              animation: `${pulse} 2s infinite`
            }}
          />
          
          {/* Inner highlight */}
          <circle 
            cx="120" 
            cy="120" 
            r="5" 
            fill={theme.palette.background.paper}
            opacity="0.9"
          />
          
          {/* Center dot */}
          <circle 
            cx="120" 
            cy="120" 
            r="2" 
            fill={color}
          />
          
          {/* Scale labels */}
          <text x="20" y="135" fontSize="12" fontWeight="600" fill={theme.palette.text.secondary}>1.0</text>
          <text x="115" y="25" fontSize="12" fontWeight="600" fill={theme.palette.text.secondary} textAnchor="middle">2.0</text>
          <text x="215" y="135" fontSize="12" fontWeight="600" fill={theme.palette.text.secondary} textAnchor="end">3.0</text>
        </svg>
        
        {/* Value Display - Positioned below gauge */}
        <Box
          sx={{
            position: 'absolute',
            top: '90%',
            left: '50%',
            transform: 'translate(-50%, 0)',
            textAlign: 'center',
            mt: 1,
          }}
        >
          <Typography
            variant="h2"
            fontWeight="900"
            sx={{
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: `0 2px 10px ${alpha(color, 0.3)}`,
              animation: `${fadeIn} 0.8s ease-out`,
            }}
          >
            {formatNumber(latestValue, 2, 'N/A')}
          </Typography>
        </Box>
      </Box>

      {/* PUE Trend Chart */}
      {trendData && trendData.length > 0 && (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            24-Hour Trend
          </Typography>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id={`pue-chart-gradient-${site}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.05)} vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: theme.palette.text.secondary }}
                axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
                tickLine={false}
                tickFormatter={(value) => new Date(value).getHours().toString().padStart(2, '0')}
              />
              <YAxis
                domain={[1.0, 2.0]}
                tick={{ fontSize: 9, fill: theme.palette.text.secondary }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  background: isDark ? alpha('#000', 0.9) : alpha('#fff', 0.95),
                  border: `1px solid ${alpha(color, 0.3)}`,
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleTimeString('th-TH')}
                formatter={(value: any) => [formatNumber(value, 2, 'N/A'), 'PUE']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#pue-chart-gradient-${site})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Quick Stats - Redesigned for equal sizing and responsive */}
      <Grid container spacing={1} mt={1}>
        <Grid item xs={6}>
          <Box textAlign="center" p={{ xs: 0.75, sm: 1 }} bgcolor={alpha(color, 0.08)} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }}>Target</Typography>
            <Typography variant={{ xs: 'caption', sm: 'body2' }} fontWeight="bold" color={color}>≤ 1.5</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box textAlign="center" bgcolor={alpha(color, 0.08)} borderRadius={2} py={{ xs: 0.4, sm: 0.5 }} px={1}>
            <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }} display="block" mb={0.3}>
              Status
            </Typography>
            <Chip
              label={
                latestValue
                  ? latestValue <= 1.5
                    ? 'EXCELLENT'
                    : latestValue <= 2.0
                    ? 'GOOD'
                    : 'FAIR'
                  : 'NO DATA'
              }
              size="small"
              sx={{
                bgcolor: alpha(color, 0.2),
                color: color,
                fontWeight: 'bold',
                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                height: { xs: 18, sm: 20 },
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

// ============ ROOM ENVIRONMENT CARD ============
interface RoomEnvironmentCardProps {
  site: 'DC' | 'DR';
  frontTemp: number | null;
  backTemp: number | null;
  frontHumid: number | null;
  backHumid: number | null;
}

const RoomEnvironmentCard: React.FC<RoomEnvironmentCardProps> = ({ 
  site, frontTemp, backTemp, frontHumid, backHumid 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const siteColor = site === 'DC' ? '#2196f3' : '#9c27b0';

  const getStatusColor = (val: number | null, type: 'temp' | 'humid') => {
    if (!val) return '#6b7280';
    if (type === 'temp') {
      return val >= 30 ? '#ef4444' : val >= 28 ? '#f59e0b' : '#10b981';
    }
    return val >= 70 ? '#ef4444' : val >= 60 ? '#f59e0b' : '#10b981';
  };

  const getStatusLabel = (val: number | null, type: 'temp' | 'humid') => {
    if (!val) return 'N/A';
    if (type === 'temp') {
      return val >= 30 ? 'สูง' : val >= 28 ? 'เตือน' : 'ปกติ';
    }
    return val >= 70 ? 'สูง' : val >= 60 ? 'เตือน' : 'ปกติ';
  };

  const MetricCard = ({ 
    label, 
    value, 
    unit, 
    icon, 
    type, 
    animationDelay = 0 
  }: { 
    label: string; 
    value: number | null; 
    unit: string; 
    icon: string; 
    type: 'temp' | 'humid';
    animationDelay?: number;
  }) => {
    const statusColor = getStatusColor(value, type);
    const statusLabel = getStatusLabel(value, type);
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          background: isDark 
            ? `linear-gradient(135deg, ${alpha(statusColor, 0.12)} 0%, ${alpha('#000', 0.3)} 100%)`
            : `linear-gradient(135deg, ${alpha(statusColor, 0.08)} 0%, ${alpha('#fff', 0.6)} 100%)`,
          border: `2px solid ${alpha(statusColor, 0.25)}`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: `${fadeIn} 0.6s ease-out ${animationDelay}ms`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 24px ${alpha(statusColor, 0.2)}`,
            border: `2px solid ${alpha(statusColor, 0.4)}`,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${statusColor} 0%, ${alpha(statusColor, 0.5)} 100%)`,
          }
        }}
      >
        {/* Icon Badge */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: '1.8rem',
            opacity: 0.15,
            animation: `${float} 3s ease-in-out infinite`,
          }}
        >
          {icon}
        </Box>

        {/* Label */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          fontWeight={600} 
          display="block" 
          mb={1}
          letterSpacing={0.5}
          textTransform="uppercase"
          fontSize="0.7rem"
        >
          {label}
        </Typography>

        {/* Value */}
        <Box display="flex" alignItems="baseline" gap={0.5} mb={1.5}>
          <Typography 
            variant="h3" 
            fontWeight="900" 
            sx={{
              background: `linear-gradient(135deg, ${statusColor} 0%, ${alpha(statusColor, 0.7)} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            {value !== null ? value.toFixed(1) : '--'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            fontWeight="bold"
            sx={{ opacity: 0.7 }}
          >
            {unit}
          </Typography>
        </Box>

        {/* Status Badge */}
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            bgcolor: alpha(statusColor, 0.15),
            color: statusColor,
            fontWeight: 'bold',
            fontSize: '0.65rem',
            height: 22,
            border: `1px solid ${alpha(statusColor, 0.3)}`,
            animation: value && ((type === 'temp' && value >= 28) || (type === 'humid' && value >= 60))
              ? `${pulse} 2s infinite`
              : 'none',
          }}
        />
      </Paper>
    );
  };

  return (
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#f97316', 0.15)} 0%, ${alpha('#3b82f6', 0.12)} 50%, ${alpha('#8b5cf6', 0.10)} 100%)`
          : `linear-gradient(135deg, ${alpha('#f97316', 0.08)} 0%, ${alpha('#3b82f6', 0.06)} 50%, ${alpha('#8b5cf6', 0.05)} 100%)`,
        border: `2px solid ${alpha('#f97316', 0.25)}`,
        borderRadius: 4,
        p: { xs: 2, sm: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        animation: `${fadeIn} 0.6s ease-out`,
        // Glassmorphism effect
        backdropFilter: 'blur(10px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, #f97316 0%, #3b82f6 50%, #8b5cf6 100%)`,
        },
        // Animated background pattern
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          opacity: 0.6,
        }
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        gap={1.5} 
        mb={3}
        position="relative"
        zIndex={1}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: alpha('#f97316', 0.15),
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              boxShadow: `0 4px 12px ${alpha('#f97316', 0.3)}`,
              animation: `${float} 3s ease-in-out infinite`,
            }}
          >
            🌡️
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="#f97316" letterSpacing={-0.5}>
              สภาวะห้อง
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              อุณหภูมิและความชื้น
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<Speed />}
          label="LIVE"
          size="small"
          sx={{
            bgcolor: alpha('#f97316', 0.15),
            color: '#f97316',
            fontWeight: 'bold',
            border: `1px solid ${alpha('#f97316', 0.3)}`,
            animation: `${pulse} 2s infinite`,
          }}
        />
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={2} position="relative" zIndex={1}>
        {/* Temperature Section */}
        <Grid item xs={12}>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1} 
            mb={1.5}
            p={1}
            bgcolor={alpha('#ef4444', 0.08)}
            borderRadius={2}
          >
            <Thermostat sx={{ color: '#ef4444', fontSize: 20 }} />
            <Typography variant="caption" fontWeight="bold" color="#ef4444" letterSpacing={0.5}>
              ตรวจสอบอุณหภูมิ
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={6}>
          <MetricCard
            label="อุณหภูมิด้านหน้า"
            value={frontTemp}
            unit="°C"
            icon="🌡️"
            type="temp"
            animationDelay={0}
          />
        </Grid>

        <Grid item xs={6}>
          <MetricCard
            label="อุณหภูมิด้านหลัง"
            value={backTemp}
            unit="°C"
            icon="🌡️"
            type="temp"
            animationDelay={100}
          />
        </Grid>

        {/* Humidity Section */}
        <Grid item xs={12}>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1} 
            mt={1}
            mb={1.5}
            p={1}
            bgcolor={alpha('#3b82f6', 0.08)}
            borderRadius={2}
          >
            <Opacity sx={{ color: '#3b82f6', fontSize: 20 }} />
            <Typography variant="caption" fontWeight="bold" color="#3b82f6" letterSpacing={0.5}>
              ตรวจสอบความชื้น
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <MetricCard
            label="ความชื้นด้านหน้า"
            value={frontHumid}
            unit="%RH"
            icon="💧"
            type="humid"
            animationDelay={200}
          />
        </Grid>

        <Grid item xs={6}>
          <MetricCard
            label="ความชื้นด้านหลัง"
            value={backHumid}
            unit="%RH"
            icon="💧"
            type="humid"
            animationDelay={300}
          />
        </Grid>
      </Grid>
    </Card>
  );
};

// ============ ENHANCED COOLING SYSTEM CARD ============
interface CoolingUnit {
  // unit_id removed from backend
  unit_name: string;
  status: string;
  temperature: number;
  humidity: number;
  power_kw: number;
  efficiency: number;
}

interface EnhancedCoolingCardProps {
  site: 'DC' | 'DR';
  coolingUnits: CoolingUnit[];
  lastUpdated?: string | null;
}

const EnhancedCoolingCard: React.FC<EnhancedCoolingCardProps> = ({ site, coolingUnits, lastUpdated }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const siteColor = site === 'DC' ? '#2196f3' : '#9c27b0';
  
  const onlineUnits = coolingUnits.filter(u => u.status === 'ON').length;
  const validEfficiencyUnits = coolingUnits.filter((u) => isFiniteNumber(u.efficiency));
  const avgEfficiency = coolingUnits.length > 0 
    ? (validEfficiencyUnits.reduce((sum, u) => sum + u.efficiency, 0) / (validEfficiencyUnits.length || 1))
    : 0;
  
  // Fixed minimum height to fit 3 units (DC max)
  // Each unit takes ~130px + 16px spacing = ~146px per unit
  // 3 units = ~438px, add some padding = 480px total for units area
  const minUnitsAreaHeight = 480;
  
  return (
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha('#00bcd4', 0.12)} 0%, ${alpha('#1a237e', 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha('#00bcd4', 0.08)} 0%, ${alpha('#e3f2fd', 0.5)} 100%)`,
        border: `2px solid ${alpha('#00bcd4', 0.3)}`,
        borderRadius: 4,
        p: { xs: 2, sm: 2.5, md: 3 },
        animation: `${fadeIn} 0.6s ease-out`,
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, #00bcd4 0%, #00e5ff 100%)`,
        }
      }}
    >
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }} 
        mb={3}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              bgcolor: alpha('#00bcd4', 0.15),
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${alpha('#00bcd4', 0.3)}`,
            }}
          >
            <AcUnit sx={{ fontSize: { xs: 28, sm: 32 }, color: '#00bcd4' }} />
          </Box>
          <Box>
            <Typography variant={{ xs: 'subtitle1', sm: 'h6' }} fontWeight="bold" color="#00bcd4">
              ระบบปรับอากาศ (Cooling System)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
              {coolingUnits.length} เครื่อง
            </Typography>
          </Box>
        </Box>
        <Box textAlign={{ xs: 'left', sm: 'right' }}>
          <Typography variant={{ xs: 'h5', sm: 'h4' }} fontWeight="900" color="#00bcd4">
            {formatNumber(avgEfficiency, 1)}%
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            ประสิทธิภาพเฉลี่ย
          </Typography>
          <Typography variant="caption" color="text.secondary" fontSize="0.65rem" sx={{ opacity: 0.7 }}>
            {lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
              : '--'}
          </Typography>
        </Box>
      </Box>

      {/* Individual AC Units - Fixed Area for 3 units, no scrollbar */}
      <Stack 
        spacing={2} 
        sx={{ 
          minHeight: { xs: 'auto', md: minUnitsAreaHeight },
          mb: 2,
          flex: 1,
        }}
      >
        {coolingUnits.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            minHeight={{ xs: 150, sm: 200 }}
            sx={{ opacity: 0.5, py: 3 }}
          >
            <AcUnit sx={{ fontSize: { xs: 40, sm: 48 }, color: 'text.disabled', mb: 1.5, opacity: 0.4 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              ไม่พบข้อมูลระบบปรับอากาศ
            </Typography>
          </Box>
        ) : (
          coolingUnits.map((unit, index) => (
          <Paper
            key={`${unit.unit_name}-${index}`}
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              background: isDark 
                ? alpha('#000', 0.2)
                : alpha('#fff', 0.6),
              border: `1px solid ${unit.status === 'ON' ? alpha('#00e676', 0.3) : alpha('#f44336', 0.3)}`,
              borderRadius: 3,
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: `0 4px 12px ${alpha(unit.status === 'ON' ? '#00e676' : '#f44336', 0.15)}`,
              }
            }}
          >
            {/* Unit Header */}
            <Box 
              display="flex" 
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between" 
              alignItems={{ xs: 'flex-start', sm: 'center' }} 
              mb={2}
              gap={{ xs: 1, sm: 0 }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: { xs: 40, sm: 48 },
                    height: { xs: 40, sm: 48 },
                    borderRadius: 2,
                    background: unit.status === 'ON'
                      ? `linear-gradient(135deg, ${alpha('#00e676', 0.2)} 0%, ${alpha('#00bcd4', 0.1)} 100%)`
                      : `linear-gradient(135deg, ${alpha('#f44336', 0.2)} 0%, ${alpha('#d32f2f', 0.1)} 100%)`,
                    border: `2px solid ${unit.status === 'ON' ? '#00e676' : '#f44336'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Spinning Fan Icon */}
                  <AcUnit 
                    sx={{ 
                      fontSize: { xs: 22, sm: 26 }, 
                      color: unit.status === 'ON' ? '#00e676' : '#f44336',
                      animation: unit.status === 'ON' ? `${spin} 2s linear infinite` : 'none',
                    }} 
                  />
                  {unit.status === 'ON' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: '#00e676',
                        boxShadow: `0 0 10px ${alpha('#00e676', 0.8)}`,
                        animation: `${pulse} 2s infinite`,
                      }}
                    />
                  )}
                </Box>
                <Box>
                  <Typography variant={{ xs: 'body2', sm: 'subtitle2' }} fontWeight="bold">
                    {unit.unit_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }}>
                    {unit.status === 'ON' ? 'กำลังทำงาน' : 'หยุดทำงาน'}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={unit.status === 'ON' ? 'เปิด (ON)' : 'ปิด (OFF)'}
                size="small"
                sx={{
                  bgcolor: unit.status === 'ON' ? alpha('#00e676', 0.15) : alpha('#f44336', 0.15),
                  color: unit.status === 'ON' ? '#00e676' : '#f44336',
                  fontWeight: 'bold',
                  fontSize: '0.7rem',
                  height: 24,
                  px: 1,
                }}
              />
            </Box>

            {/* Metrics Grid */}
            <Grid container spacing={{ xs: 1, sm: 1.5 }}>
              <Grid item xs={4}>
                <Box
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha('#f44336', 0.08)} 0%, transparent 100%)`,
                    border: `1px solid ${alpha('#f44336', 0.15)}`,
                    borderRadius: 2,
                    minHeight: { xs: 75, sm: 95 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Thermostat sx={{ fontSize: { xs: 18, sm: 20 }, color: '#f44336', mb: 0.5 }} />
                  <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color="#f44336">
                    {formatNumber(unit.temperature, 1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }} fontWeight={600}>
                    อุณหภูมิ (°C)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha('#2196f3', 0.08)} 0%, transparent 100%)`,
                    border: `1px solid ${alpha('#2196f3', 0.15)}`,
                    borderRadius: 2,
                    minHeight: { xs: 75, sm: 95 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Opacity sx={{ fontSize: { xs: 18, sm: 20 }, color: '#2196f3', mb: 0.5 }} />
                  <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color="#2196f3">
                    {formatNumber(unit.humidity, 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }} fontWeight={600}>
                    ความชื้น (%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${alpha('#ff9800', 0.08)} 0%, transparent 100%)`,
                    border: `1px solid ${alpha('#ff9800', 0.15)}`,
                    borderRadius: 2,
                    minHeight: { xs: 75, sm: 95 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <BoltOutlined sx={{ fontSize: { xs: 18, sm: 20 }, color: '#ff9800', mb: 0.5 }} />
                  <Typography variant={{ xs: 'h6', sm: 'h5' }} fontWeight="bold" color="#ff9800">
                    {formatNumber(unit.power_kw, 2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.65rem', sm: '0.7rem' }} fontWeight={600}>
                    กำลังไฟฟ้า (kW)
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Efficiency Bar */}
            <Box mt={{ xs: 1, sm: 1.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="caption" color="text.secondary" fontSize={{ xs: '0.7rem', sm: '0.75rem' }} fontWeight={600}>
                  ประสิทธิภาพ (Efficiency)
                </Typography>
                <Typography variant="caption" fontWeight="bold" color={safeNumber(unit.efficiency) >= 85 ? '#00e676' : '#ffa726'} fontSize={{ xs: '0.65rem', sm: '0.7rem' }}>
                  {formatNumber(unit.efficiency, 1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={safeNumber(unit.efficiency)}
                sx={{
                  height: { xs: 5, sm: 6 },
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.text.primary, 0.08),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: safeNumber(unit.efficiency) >= 85
                      ? `linear-gradient(90deg, #00e676 0%, #00bcd4 100%)`
                      : `linear-gradient(90deg, #ffa726 0%, #ff9800 100%)`,
                  }
                }}
              />
            </Box>
          </Paper>
        ))
        )}
      </Stack>
    </Card>
  );
};

// ============ OLD COMPONENTS (Keep for compatibility) ============
interface ModernPUECardProps {
  value: number | null;
  label?: string;
  site: 'DC' | 'DR';
}

const ModernPUECard: React.FC<ModernPUECardProps> = ({ value, label = 'PUE', site }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const normalizedValue = value ? Math.max(1.0, Math.min(3.0, value)) : 1.5;
  const percentage = ((normalizedValue - 1.0) / 2.0) * 100;
  
  const getColor = (pue: number) => {
    if (pue <= 1.5) return { main: '#00e676', light: '#69f0ae', bg: 'rgba(0, 230, 118, 0.1)' };
    if (pue <= 2.0) return { main: '#ffa726', light: '#ffb74d', bg: 'rgba(255, 167, 38, 0.1)' };
    return { main: '#ef5350', light: '#e57373', bg: 'rgba(239, 83, 80, 0.1)' };
  };
  
  const colors = value ? getColor(normalizedValue) : { main: '#999', light: '#bbb', bg: 'rgba(150, 150, 150, 0.1)' };
  const siteColor = site === 'DC' ? '#2196f3' : '#9c27b0';
  
  return (
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha(siteColor, 0.15)} 0%, ${alpha(colors.main, 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(siteColor, 0.08)} 0%, ${alpha(colors.main, 0.03)} 100%)`,
        border: `2px solid ${alpha(siteColor, 0.3)}`,
        borderRadius: 4,
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        animation: `${fadeIn} 0.6s ease-out`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${alpha(colors.main, 0.2)}, transparent)`,
          animation: `${shimmer} 3s infinite`,
        }
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="overline" fontWeight="bold" sx={{ color: siteColor, letterSpacing: 1.5 }}>
          {site} • {label}
        </Typography>
        <Chip
          icon={<Speed />}
          label="LIVE"
          size="small"
          sx={{
            bgcolor: alpha(colors.main, 0.2),
            color: colors.main,
            fontWeight: 'bold',
            animation: `${pulse} 2s infinite`,
          }}
        />
      </Box>

      {/* Main Value */}
      <Box display="flex" alignItems="baseline" gap={1} mb={2}>
        <Typography
          variant="h1"
          fontWeight="900"
          sx={{
            background: `linear-gradient(135deg, ${colors.main} 0%, ${colors.light} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '4rem',
            lineHeight: 1,
          }}
        >
          {value ? value.toFixed(2) : '--'}
        </Typography>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Efficiency
          </Typography>
          <Typography variant="h6" color={colors.main} fontWeight="bold">
            {value ? (value <= 1.5 ? 'Excellent' : value <= 2.0 ? 'Good' : 'Fair') : 'N/A'}
          </Typography>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary">
            Performance
          </Typography>
          <Typography variant="caption" fontWeight="bold" color={colors.main}>
            {percentage.toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha(colors.main, 0.1),
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${colors.main} 0%, ${colors.light} 100%)`,
              borderRadius: 4,
            }
          }}
        />
        <Box display="flex" justifyContent="space-between" mt={0.5}>
          <Typography variant="caption" fontSize="0.65rem" color="text.secondary">1.0 Ideal</Typography>
          <Typography variant="caption" fontSize="0.65rem" color="text.secondary">3.0 Poor</Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={1}>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(colors.main, 0.05)} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block">Target</Typography>
            <Typography variant="body2" fontWeight="bold" color={colors.main}>≤ 1.5</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(colors.main, 0.05)} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
            <CheckCircle sx={{ fontSize: 20, color: colors.main }} />
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(colors.main, 0.05)} borderRadius={2}>
            <Typography variant="caption" color="text.secondary" display="block">Trend</Typography>
            <TrendingDown sx={{ fontSize: 20, color: '#00e676' }} />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

// ============ AC STATUS COMPONENT ============
interface ACStatusProps {
  site: 'DC' | 'DR';
  units: number;
  onlineUnits: number;
  avgTemp?: number;
}

const ACStatusCard: React.FC<ACStatusProps> = ({ site, units, onlineUnits, avgTemp }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const siteColor = site === 'DC' ? '#2196f3' : '#9c27b0';
  
  // Mock data สำหรับแต่ละ AC unit
  const acUnits = Array.from({ length: units }, (_, i) => ({
    id: `NetCol-${site}-${i + 1}`,
    name: `AC Unit ${i + 1}`,
    online: i < onlineUnits,
    temp: avgTemp ? avgTemp + (Math.random() * 2 - 1) : null,
    power: (15 + Math.random() * 5).toFixed(1),
  }));
  
  return (
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha(siteColor, 0.1)} 0%, ${alpha('#1a237e', 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(siteColor, 0.05)} 0%, ${alpha('#e3f2fd', 0.3)} 100%)`,
        border: `2px solid ${alpha(siteColor, 0.2)}`,
        borderRadius: 3,
        p: 2.5,
        animation: `${fadeIn} 0.6s ease-out`,
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <AcUnit sx={{ color: '#00bcd4', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold" color={siteColor}>
              Cooling System
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {site} • {onlineUnits}/{units} Active
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${((onlineUnits / units) * 100).toFixed(0)}%`}
          size="small"
          sx={{
            bgcolor: alpha('#00bcd4', 0.15),
            color: '#00bcd4',
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        />
      </Box>

      {/* AC Units Grid */}
      <Grid container spacing={1.5}>
        {acUnits.map((unit, idx) => (
          <Grid item xs={12} sm={6} md={units === 3 ? 4 : 6} key={unit.id}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: unit.online
                  ? `linear-gradient(135deg, ${alpha('#00bcd4', 0.08)} 0%, ${alpha('#00e676', 0.05)} 100%)`
                  : alpha(theme.palette.text.primary, 0.03),
                border: `1px solid ${unit.online ? alpha('#00bcd4', 0.3) : alpha(theme.palette.text.primary, 0.1)}`,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(unit.online ? '#00bcd4' : theme.palette.text.primary, 0.2)}`,
                },
              }}
            >
              {/* Status Indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: unit.online ? '#00e676' : '#f44336',
                  boxShadow: unit.online ? `0 0 12px ${alpha('#00e676', 0.6)}` : 'none',
                  animation: unit.online ? `${pulse} 2s infinite` : 'none',
                }}
              />

              {/* Unit Info */}
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <PowerSettingsNew
                  sx={{
                    color: unit.online ? '#00e676' : '#f44336',
                    fontSize: 24,
                  }}
                />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {unit.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    {unit.id}
                  </Typography>
                </Box>
              </Box>

              {/* Metrics */}
              {unit.online && (
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      p={0.75}
                      bgcolor={alpha('#00bcd4', 0.08)}
                      borderRadius={1}
                    >
                      <Thermostat sx={{ fontSize: 16, color: '#00bcd4' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                          Temp
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {unit.temp ? `${unit.temp.toFixed(1)}°C` : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      p={0.75}
                      bgcolor={alpha('#ffa726', 0.08)}
                      borderRadius={1}
                    >
                      <BoltOutlined sx={{ fontSize: 16, color: '#ffa726' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                          Power
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {unit.power} kW
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Offline State */}
              {!unit.online && (
                <Box textAlign="center" py={1}>
                  <Typography variant="caption" color="error" fontWeight="bold">
                    OFFLINE
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

// ============ PUE Gauge Component (Keep original for compatibility) ============
interface PUEGaugeProps {
  value: number | null;
  label?: string;
}

const PUEGauge: React.FC<PUEGaugeProps> = ({ value, label = 'PUE' }) => {
  const theme = useTheme();
  
  // Calculate gauge position (PUE range 1.0 - 3.0)
  const normalizedValue = value ? Math.max(1.0, Math.min(3.0, value)) : 1.5;
  const percentage = ((normalizedValue - 1.0) / 2.0) * 100; // 0-100%
  const angle = -90 + (percentage / 100) * 180; // -90 to 90 degrees
  
  // Color based on PUE value (green: 1.0-1.5, yellow: 1.5-2.0, red: 2.0+)
  const getColor = (pue: number) => {
    if (pue <= 1.5) return '#4caf50';
    if (pue <= 2.0) return '#ff9800';
    return '#f44336';
  };
  
  const color = value ? getColor(normalizedValue) : '#999';
  
  return (
    <Box sx={{ position: 'relative', width: 200, height: 120, mx: 'auto' }}>
      {/* SVG Gauge */}
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={alpha(theme.palette.text.primary, 0.1)}
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={`url(#gradient-${label})`}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4caf50" />
            <stop offset="50%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#f44336" />
          </linearGradient>
        </defs>
        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="30"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 100 100)`}
          style={{ transition: 'transform 0.5s ease' }}
        />
        {/* Center circle */}
        <circle cx="100" cy="100" r="8" fill={color} />
      </svg>
      
      {/* Value display */}
      <Box
        sx={{
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" fontWeight="bold" color={color}>
          {value ? value.toFixed(2) : '--'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
      
      {/* Min/Max labels */}
      <Typography
        variant="caption"
        sx={{ position: 'absolute', bottom: 0, left: 10 }}
        color="text.secondary"
      >
        1.0
      </Typography>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', bottom: 0, right: 10 }}
        color="text.secondary"
      >
        3.0
      </Typography>
    </Box>
  );
};

// ============ Metric Card Component ============
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit = '',
  trend,
  color = 'primary'
}) => {
  const theme = useTheme();
  
  // Type-safe color access
  const getColorValue = (colorKey: string): string => {
    const palette: any = theme.palette;
    return palette[colorKey]?.main || palette.primary.main;
  };
  
  const mainColor = getColorValue(color);
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(mainColor, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        borderLeft: `4px solid ${mainColor}`
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          {trend && (
            <Box sx={{ color: trend === 'up' ? 'error.main' : trend === 'down' ? 'success.main' : 'text.secondary' }}>
              {trend === 'up' && <TrendingUp fontSize="small" />}
              {trend === 'down' && <TrendingDown fontSize="small" />}
            </Box>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value !== null && value !== undefined ? value : '--'}
          {value !== null && unit && (
            <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
              {unit}
            </Typography>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
};

// ============ MODERN CHART Component ============
interface ModernChartProps {
  data: Array<{ time: string; value: number }>;
  color: string;
  label: string;
  unit?: string;
  type?: 'area' | 'line' | 'bar';
}

const ModernChart: React.FC<ModernChartProps> = ({ 
  data, 
  color, 
  label, 
  unit = '',
  type = 'area' 
}) => {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  
  if (!data || data.length === 0) {
    return (
      <Card
        elevation={0}
        sx={{
          height: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.01)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          borderRadius: 3,
        }}
      >
        <Box textAlign="center">
          <TrendingUp sx={{ fontSize: 48, color: alpha(color, 0.3), mb: 1 }} />
          <Typography color="text.secondary">ไม่มีข้อมูล</Typography>
        </Box>
      </Card>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  
  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        background: isDarkMode
          ? `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha('#000', 0.3)} 100%)`
          : `linear-gradient(135deg, ${alpha(color, 0.03)} 0%, ${alpha('#fff', 0.5)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        animation: `${fadeIn} 0.8s ease-out`,
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" color={color}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            24 ชั่วโมงที่ผ่านมา
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h6" fontWeight="bold" color={color}>
            {formatNumber(data[data.length - 1]?.value, 1)}
            <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
              {unit}
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ปัจจุบัน
          </Typography>
        </Box>
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
            <filter id={`shadow-${label.replace(/\s/g, '')}`}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={alpha(theme.palette.text.primary, 0.05)} 
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            axisLine={{ stroke: alpha(theme.palette.text.primary, 0.1) }}
            tickLine={false}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getHours().toString().padStart(2, '0')}:00`;
            }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
            axisLine={false}
            tickLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <RechartsTooltip
            contentStyle={{
              background: isDarkMode ? alpha('#000', 0.9) : alpha('#fff', 0.95),
              border: `1px solid ${alpha(color, 0.3)}`,
              borderRadius: 8,
              padding: '8px 12px',
              boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleString('th-TH', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }}
            formatter={(value: any) => [`${formatNumber(value, 2)} ${unit}`, label]}
          />
          {type === 'area' && (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#gradient-${label.replace(/\s/g, '')})`}
              filter={`url(#shadow-${label.replace(/\s/g, '')})`}
              animationDuration={1000}
            />
          )}
          {type === 'line' && (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={false}
              animationDuration={1000}
            />
          )}
          {type === 'bar' && (
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Stats Footer */}
      <Grid container spacing={1} mt={1}>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(color, 0.05)} borderRadius={1.5}>
            <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
              สูงสุด
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={color}>
              {maxValue.toFixed(1)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(color, 0.05)} borderRadius={1.5}>
            <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
              เฉลี่ย
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={color}>
              {avgValue.toFixed(1)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center" p={1} bgcolor={alpha(color, 0.05)} borderRadius={1.5}>
            <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
              ต่ำสุด
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={color}>
              {minValue.toFixed(1)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

// ============ Mini Chart Component (Keep for backwards compatibility) ============
interface MiniChartProps {
  data: Array<{ time: string; value: number }>;
  color: string;
  label: string;
  unit?: string;
}

const MiniChart: React.FC<MiniChartProps> = ({ data, color, label, unit = '' }) => {
  // Use ModernChart instead
  return <ModernChart data={data} color={color} label={label} unit={unit} type="area" />;
};

// ============ Main Dashboard Component ============
const NewDashboardPage: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-realtime'],
    queryFn: async () => {
      const [dashboardData, roomEnvDC, roomEnvDR, upsDC, upsDR] = await Promise.all([
        apiGet<any>('/dashboard-realtime/realtime', { hours: 24 }),
        apiGet<any>('/reports/room-environment', { site_code: 'DC', hours: 1 }).catch(() => null),
        apiGet<any>('/reports/room-environment', { site_code: 'DR', hours: 1 }).catch(() => null),
        apiGet<any>('/reports/ups-full', { site_code: 'DC', hours: 1 }).catch(() => null),
        apiGet<any>('/reports/ups-full', { site_code: 'DR', hours: 1 }).catch(() => null),
      ]);
      return {
        ...dashboardData,
        roomEnvironment: {
          dc: roomEnvDC,
          dr: roomEnvDR
        },
        ups: {
          dc: upsDC,
          dr: upsDR
        }
      };
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
    staleTime: 20000
  });
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container 
        maxWidth={false} 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4 }, 
          px: { xs: 2, sm: 3, md: 4 }, 
          maxWidth: '100%', 
          mx: 'auto' 
        }}
      >
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            ไม่สามารถโหลดข้อมูลได้
          </Typography>
          <Typography color="text.secondary" paragraph>
            {(error as Error).message}
          </Typography>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Paper>
      </Container>
    );
  }
  
  const dcSite = data?.dc;
  const drSite = data?.dr;
  
  // Room Environment Data
  const roomEnvDC = data?.roomEnvironment?.dc?.current_values?.DC || { front: {}, back: {} };
  const roomEnvDR = data?.roomEnvironment?.dr?.current_values?.DR || { front: {}, back: {} };
  
  // UPS Data
  const upsDC = data?.ups?.dc?.battery?.backup_time?.value;
  const upsDR = data?.ups?.dr?.battery?.backup_time?.value;
  
  // Render site column with ENHANCED DESIGN & RESPONSIVE
  const renderSiteColumn = (site: any, siteLabel: 'DC' | 'DR', siteColor: string, roomEnv: any, upsBackupTime: number | null) => {
    if (!site) return null;
    
    // Use ONLY real cooling data from API - NO MOCK DATA
    const coolingUnits = site.cooling_units || [];
    
    return (
      <Grid item xs={12} lg={6}>
        <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {/* SITE HEADER WITH UPS BACKUP TIME */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              background: `linear-gradient(135deg, ${alpha(theme.palette[siteColor].main, 0.12)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `2px solid ${alpha(theme.palette[siteColor].main, 0.25)}`,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${theme.palette[siteColor].main} 0%, ${theme.palette[siteColor].light} 100%)`,
              }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h2" fontWeight="900" color={theme.palette[siteColor].main}>
                  {siteLabel}
                </Typography>
                <Typography variant="body2" color="text.secondary" textTransform="uppercase" letterSpacing={1}>
                  {siteLabel === 'DC' ? 'Primary' : 'Backup'} Data Center
                </Typography>
              </Box>
              <Box textAlign="right">
                {/* UPS Backup Time */}
                {upsBackupTime !== null && (
                  <Box 
                    sx={{ 
                      mb: 1,
                      p: 1.5,
                      bgcolor: alpha('#10b981', 0.1),
                      border: `1px solid ${alpha('#10b981', 0.3)}`,
                      borderRadius: 2,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontSize="1.5rem">🔋</Typography>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
                          เวลาสำรองไฟ UPS
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="#10b981">
                          {upsBackupTime.toFixed(1)} นาที
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                {/* Last Updated */}
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.7rem">
                  อัพเดทล่าสุด
                </Typography>
                <Typography variant="caption" color={theme.palette[siteColor].main} fontWeight="bold">
                  {site.last_updated ? new Date(site.last_updated).toLocaleString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : '--'}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          {/* ENHANCED PUE CARD WITH GAUGE + CHART */}
          <EnhancedPUECard 
            value={site.pue_current} 
            trendData={site.pue_trend || []}
            site={siteLabel}
            lastUpdated={site.last_updated || null}
          />
          
          {/* ROOM ENVIRONMENT CARD */}
          <RoomEnvironmentCard
            site={siteLabel}
            frontTemp={roomEnv.front?.temperature?.value}
            backTemp={roomEnv.back?.temperature?.value}
            frontHumid={roomEnv.front?.humidity?.value}
            backHumid={roomEnv.back?.humidity?.value}
          />
          
          {/* ENHANCED COOLING SYSTEM CARD - Moved to bottom */}
          <EnhancedCoolingCard
            site={siteLabel}
            coolingUnits={coolingUnits}
            lastUpdated={site.last_updated || null}
          />
        </Stack>
      </Grid>
    );
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDarkMode
          ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e8edf5 50%, #f5f7fa 100%)',
        pb: { xs: 4, sm: 5, md: 6 },
      }}
    >
      <Container 
        maxWidth={false} 
        sx={{ 
          pt: { xs: 2, sm: 3, md: 4 }, 
          px: { xs: 1, sm: 2, md: 3, lg: 4 }, 
          maxWidth: '100%', 
          mx: 'auto' 
        }}
      >
        {/* MODERN HEADER */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: isDarkMode
              ? `linear-gradient(135deg, ${alpha('#1e88e5', 0.15)} 0%, ${alpha('#7b1fa2', 0.15)} 100%)`
              : `linear-gradient(135deg, ${alpha('#2196f3', 0.08)} 0%, ${alpha('#9c27b0', 0.08)} 100%)`,
            border: `2px solid ${alpha(isDarkMode ? '#1e88e5' : '#2196f3', 0.3)}`,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #2196f3 0%, #9c27b0 50%, #2196f3 100%)',
              backgroundSize: '200% 100%',
              animation: `${shimmer} 3s linear infinite`,
            },
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography
                variant="h2"
                fontWeight="900"
                sx={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                WUH Datacenter Monitor Dashboard
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}>
                <Box>
                  <IconButton
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    sx={{
                      bgcolor: autoRefresh ? alpha('#00e676', 0.15) : alpha(theme.palette.text.primary, 0.05),
                      color: autoRefresh ? '#00e676' : 'text.secondary',
                      border: `2px solid ${autoRefresh ? alpha('#00e676', 0.3) : alpha(theme.palette.text.primary, 0.1)}`,
                      '&:hover': {
                        bgcolor: autoRefresh ? alpha('#00e676', 0.25) : alpha(theme.palette.text.primary, 0.08),
                      },
                    }}
                  >
                    <Speed />
                  </IconButton>
                </Box>
              </Tooltip>
              <Tooltip title="Refresh now">
                <IconButton
                  onClick={handleRefresh}
                  sx={{
                    bgcolor: alpha('#2196f3', 0.15),
                    color: '#2196f3',
                    border: `2px solid ${alpha('#2196f3', 0.3)}`,
                    '&:hover': {
                      bgcolor: alpha('#2196f3', 0.25),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>
        
        {/* Two Column Layout - Responsive */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {renderSiteColumn(dcSite, 'DC', 'primary', roomEnvDC, upsDC)}
          {renderSiteColumn(drSite, 'DR', 'secondary', roomEnvDR, upsDR)}
        </Grid>
      </Container>
    </Box>
  );
};

export default NewDashboardPage;
