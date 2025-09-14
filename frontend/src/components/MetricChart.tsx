import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';

interface DataPoint {
  timestamp: string;
  value: number;
  min_val?: number;
  max_val?: number;
  sample_count?: number;
  unit: string;
}

interface ChartConfig {
  type: 'line' | 'area' | 'column';
  color: string;
  y_axis: {
    min: number | string;
    max: number | string;
    format: string;
  };
  x_axis: {
    type: string;
    format: string;
  };
  tooltip: {
    format: string;
    show_time: boolean;
    show_range: boolean;
  };
  animation: {
    enabled: boolean;
    duration: number;
  };
  legend: {
    show: boolean;
  };
  grid: {
    show: boolean;
    stroke_dasharray: string;
  };
}

interface MetricChartProps {
  data: DataPoint[];
  title: string;
  config: ChartConfig;
  height?: number;
}

const MetricChart: React.FC<MetricChartProps> = ({
  data,
  title,
  config,
  height = 400
}) => {
  const theme = useTheme();

  // Process data for chart
  const chartData = useMemo(() => {
    return data.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      displayTime: new Date(point.timestamp).toLocaleString('th-TH', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      value: point.value,
      min_val: point.min_val,
      max_val: point.max_val,
      sample_count: point.sample_count,
      unit: point.unit,
      formattedValue: `${point.value.toFixed(2)} ${point.unit}`
    }));
  }, [data]);

  // Calculate statistics for reference lines
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const values = chartData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <Paper sx={{ p: 2, border: `1px solid ${config.color}`, backgroundColor: 'background.paper' }}>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {new Date(data.timestamp).toLocaleString('th-TH')}
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          {data.formattedValue}
        </Typography>
        
        {data.min_val !== undefined && data.max_val !== undefined && data.min_val !== data.max_val && (
          <Typography variant="body2" color="textSecondary">
            ช่วง: {data.min_val.toFixed(2)} - {data.max_val.toFixed(2)} {data.unit}
          </Typography>
        )}
        
        {data.sample_count && data.sample_count > 1 && (
          <Typography variant="body2" color="textSecondary">
            จำนวนตัวอย่าง: {data.sample_count} จุด
          </Typography>
        )}
      </Paper>
    );
  };

  // Format Y-axis ticks
  const formatYAxis = (value: number) => {
    return `${value.toFixed(1)}`;
  };

  // Format X-axis ticks
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (chartData.length <= 24) {
      return date.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } else if (chartData.length <= 168) {
      return date.toLocaleDateString('th-TH', { month: 'short', day: '2-digit' });
    } else {
      return date.toLocaleDateString('th-TH', { month: 'short', day: '2-digit' });
    }
  };

  if (chartData.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
        sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}
      >
        <Typography variant="h6" color="textSecondary">
          📊 ไม่มีข้อมูลในช่วงเวลาที่เลือก
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="textPrimary" fontWeight="bold">
        {title}
      </Typography>
      
      <ResponsiveContainer width="100%" height={height}>
        {config.type === 'line' ? (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid 
              strokeDasharray={config.grid.stroke_dasharray} 
              stroke={alpha(theme.palette.divider, 0.3)} 
            />
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
              stroke={theme.palette.text.secondary}
            />
            <YAxis 
              domain={[
                typeof config.y_axis.min === 'string' ? 'dataMin' : config.y_axis.min,
                typeof config.y_axis.max === 'string' ? 'dataMax' : config.y_axis.max
              ]}
              tickFormatter={formatYAxis}
              stroke={theme.palette.text.secondary}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines */}
            {stats && (
              <>
                <ReferenceLine 
                  y={stats.avg} 
                  stroke={alpha(config.color, 0.7)} 
                  strokeDasharray="5 5"
                  label={{ value: "เฉลี่ย", position: "insideTopRight" }}
                />
              </>
            )}
            
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, fill: config.color }}
              animationDuration={config.animation.enabled ? config.animation.duration : 0}
            />
            
            {/* Brush for zooming */}
            {chartData.length > 50 && (
              <Brush 
                dataKey="displayTime"
                height={30}
                stroke={config.color}
                fill={alpha(config.color, 0.1)}
              />
            )}
          </LineChart>
        ) : config.type === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray={config.grid.stroke_dasharray} />
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              domain={[
                typeof config.y_axis.min === 'string' ? 'dataMin' : config.y_axis.min,
                typeof config.y_axis.max === 'string' ? 'dataMax' : config.y_axis.max
              ]}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {stats && (
              <ReferenceLine 
                y={stats.avg} 
                stroke={alpha(config.color, 0.7)} 
                strokeDasharray="5 5"
                label={{ value: "เฉลี่ย", position: "insideTopRight" }}
              />
            )}
            
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              fill={alpha(config.color, 0.3)}
              strokeWidth={2}
              animationDuration={config.animation.enabled ? config.animation.duration : 0}
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray={config.grid.stroke_dasharray} />
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
            />
            <YAxis 
              domain={[
                typeof config.y_axis.min === 'string' ? 'dataMin' : config.y_axis.min,
                typeof config.y_axis.max === 'string' ? 'dataMax' : config.y_axis.max
              ]}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar 
              dataKey="value" 
              fill={config.color}
              animationDuration={config.animation.enabled ? config.animation.duration : 0}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default MetricChart;
