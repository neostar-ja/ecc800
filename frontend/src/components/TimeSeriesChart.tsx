/**
 * Time Series Chart Component for ECC800
 * คอมโพเนนต์กราฟข้อมูลเวลาสำหรับ ECC800
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import type { TimeSeriesPoint } from '../lib/api';

// Flexible chart data point interface
interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  t?: string;  // Alternative timestamp field
  v?: number;  // Alternative value field
  unit?: string;
}

interface TimeSeriesChartProps {
  data?: TimeSeriesPoint[] | ChartDataPoint[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  yAxisLabel?: string;
  unit?: string | null;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number | null) => string;
}

// Custom tooltip component - คอมโพเนนต์ tooltip แบบกำหนดเอง
const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    const value = dataPoint.value;
    
    return (
      <Paper sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
        <Typography variant="body2" color="primary">
          <strong>เวลา:</strong> {label}
        </Typography>
        <Typography variant="body2" color="secondary">
          <strong>ค่า:</strong> {value?.toFixed(2) || 'N/A'}
        </Typography>
      </Paper>
    );
  }

  return null;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data = [],
  isLoading = false,
  error = null,
  title = 'Time Series Data',
  yAxisLabel = '',
  unit = null,
  height = 400,
  color = '#2196f3',
  showGrid = true,
  showTooltip = true,
  formatValue = (value) => (value !== null ? value.toFixed(2) : 'N/A'),
}) => {
  // Normalize data format - รูปแบบข้อมูลมาตรฐาน
  const chartData = React.useMemo(() => {
    return data.map((point, index) => {
      // Use the correct field names from TimeSeriesPoint interface
      const timestamp = point.timestamp;
      const value = point.value || 0;
      
      return {
        timestamp,
        value: typeof value === 'number' ? value : parseFloat(String(value)) || 0,
        originalIndex: index,
      };
    });
  }, [data]);

  // Format X-axis labels - จัดรูปแบบป้ายชื่อแกน X
  const formatXAxisLabel = React.useCallback((timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      // Choose format based on data range
      if (chartData.length > 0) {
        const firstTime = new Date(chartData[0].timestamp).getTime();
        const lastTime = new Date(chartData[chartData.length - 1].timestamp).getTime();
        const timespan = lastTime - firstTime;
        const hours = timespan / (1000 * 60 * 60);
        
        if (hours <= 24) {
          // แสดงเวลาแบบชั่วโมง:นาที ภาษาไทย
          return format(date, "HH:mm 'น.'", { locale: th });
        } else if (hours <= 24 * 7) {
          // แสดง วัน เดือนแบบย่อ + เวลา
          return format(date, "d MMM HH:mm 'น.'", { locale: th });
        } else {
          // ช่วงยาว แสดง วันที่ + เดือนแบบย่อ
          return format(date, 'd MMM', { locale: th });
        }
      }
      
      return format(date, "HH:mm 'น.'", { locale: th });
    } catch (error) {
      return timestamp;
    }
  }, [chartData]);

  // Format Y-axis labels - จัดรูปแบบป้ายชื่อแกน Y
  const formatYAxisLabel = React.useCallback((value: number) => {
    if (formatValue) {
      return formatValue(value);
    }
    
    // Auto-format based on value range
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else if (value % 1 === 0) {
      return value.toString();
    } else {
      return value.toFixed(1);
    }
  }, [formatValue]);

  // Format tooltip timestamp - จัดรูปแบบเวลาใน tooltip
  const formatTooltipLabel = React.useCallback((timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      // แสดง วันในสัปดาห์ วัน เดือน ปี และเวลาแบบไทย
      return format(date, "EEE d MMM yyyy HH:mm:ss 'น.'", { locale: th });
    } catch (error) {
      return timestamp;
    }
  }, []);

  // Loading state - สถานะกำลังโหลด
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
        sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          กำลังโหลดข้อมูล...
        </Typography>
      </Box>
    );
  }

  // Error state - สถานะข้อผิดพลาด
  if (error) {
    return (
      <Box height={height}>
        <Alert severity="error" sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <div>
            <Typography variant="h6" gutterBottom>
              ไม่สามารถโหลดข้อมูลได้
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </div>
        </Alert>
      </Box>
    );
  }

  // No data state - สถานะไม่มีข้อมูล
  if (!chartData || chartData.length === 0) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
        sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}
      >
        <Typography variant="h6" color="textSecondary" gutterBottom>
          ไม่มีข้อมูลสำหรับแสดงผล
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: height }}>
      {title && (
        <Typography variant="h6" gutterBottom align="center">
          {title}
        </Typography>
      )}
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            tick={{ fontSize: 12 }}
          />
          
          <YAxis 
            tickFormatter={formatYAxisLabel}
            tick={{ fontSize: 12 }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          
          {showTooltip && (
            <Tooltip 
              content={<CustomTooltip />}
              labelFormatter={formatTooltipLabel}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TimeSeriesChart;
