import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { apiGet } from '../lib/api';

interface ElectricityCostCardProps {
  dataCenterId: number;
  dataCenterName: string;
  siteCode: string;
}

const ElectricityCostCard: React.FC<ElectricityCostCardProps> = ({ dataCenterId, dataCenterName, siteCode }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCostSummary();
  }, [dataCenterId]);

  const loadCostSummary = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any>(
        `/electricity-cost/costs/realtime-summary/${dataCenterId}`
      );
      setSummary(data);
      setError('');
    } catch (err: any) {
      console.error('Error loading cost summary:', err);
      setError('ไม่สามารถโหลดข้อมูลค่าไฟฟ้า');
    } finally {
      setLoading(false);
    }
  };

  const getCostChangeColor = () => {
    if (!summary?.cost_change_percent) return '#78909c';
    if (summary.cost_change_percent > 0) return '#ef5350';
    if (summary.cost_change_percent < 0) return '#66bb6a';
    return '#42a5f5';
  };

  const getCostChangeIcon = () => {
    if (!summary?.cost_change_percent) return <TrendingFlatIcon sx={{ fontSize: 18 }} />;
    if (summary.cost_change_percent > 0) return <TrendingUpIcon sx={{ fontSize: 18 }} />;
    if (summary.cost_change_percent < 0) return <TrendingDownIcon sx={{ fontSize: 18 }} />;
    return <TrendingFlatIcon sx={{ fontSize: 18 }} />;
  };

  const accentColor = siteCode === 'DC' ? '#ffa726' : '#ab47bc';

  return (
    <Paper
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha('#000', 0.3)} 100%)`
          : `linear-gradient(135deg, ${alpha(accentColor, 0.08)} 0%, ${alpha('#fff', 0.98)} 100%)`,
        border: `1px solid ${alpha(accentColor, 0.2)}`,
        borderRadius: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          border: `1px solid ${alpha(accentColor, 0.4)}`,
          boxShadow: isDark 
            ? `0 8px 16px ${alpha(accentColor, 0.1)}` 
            : `0 8px 16px ${alpha(accentColor, 0.12)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, ${alpha(accentColor, 0.2)} 100%)`,
        },
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Header - Compact */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
          <Box display="flex" alignItems="center" gap={0.8} flex={1}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha(accentColor, 0.05)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ElectricBoltIcon sx={{ color: accentColor, fontSize: 20 }} />
            </Box>
            <Box minWidth={0}>
              <Typography 
                variant="subtitle2" 
                fontWeight={700} 
                color="text.primary"
                noWrap
                sx={{ fontSize: '0.9rem' }}
              >
                ค่าไฟฟ้า
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>
                เดือนนี้
              </Typography>
            </Box>
          </Box>
          <Tooltip title="รีเฟรช">
            <IconButton
              size="small"
              onClick={loadCostSummary}
              disabled={loading}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: accentColor },
                p: 0.5,
              }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {error ? (
          <Box 
            sx={{
              p: 1,
              borderRadius: 1,
              background: alpha('#d32f2f', 0.08),
              border: `1px solid ${alpha('#d32f2f', 0.2)}`,
            }}
          >
            <Typography variant="caption" color="error" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
              ⚠️ {error}
            </Typography>
          </Box>
        ) : loading ? (
          <Box>
            <Box display="flex" gap={1} mb={1}>
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="40%" height={24} />
            </Box>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={0.75}>
              <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        ) : summary ? (
          <Box>
            {/* Main Values - 2 Columns */}
            <Grid container spacing={1} mb={1.5}>
              {/* Cost */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    background: isDark 
                      ? alpha(accentColor, 0.1)
                      : alpha(accentColor, 0.06),
                    border: `1px solid ${alpha(accentColor, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.4 }}
                  >
                    💰 ค่าไฟรวม
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.3}>
                    <Typography
                      sx={{
                        color: accentColor,
                        fontWeight: 800,
                        fontSize: { xs: '1.4rem', sm: '1.6rem' },
                        lineHeight: 1,
                        letterSpacing: '-0.5px',
                      }}
                    >
                      ฿{summary.current_month_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.6rem', fontWeight: 600 }}
                    >
                      บาท
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Energy */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    background: isDark 
                      ? alpha(accentColor, 0.1)
                      : alpha(accentColor, 0.06),
                    border: `1px solid ${alpha(accentColor, 0.2)}`,
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    display="block"
                    sx={{ fontSize: '0.65rem', fontWeight: 600, mb: 0.4 }}
                  >
                    ⚡ พลังงาน
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={0.3}>
                    <Typography
                      sx={{
                        color: 'text.primary',
                        fontWeight: 800,
                        fontSize: { xs: '1.4rem', sm: '1.6rem' },
                        lineHeight: 1,
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {summary.current_month_energy_kwh?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: '0.6rem', fontWeight: 600 }}
                    >
                      kWh
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Stats Row - 3 Columns Compact */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 0.75,
                pt: 1.5,
                borderTop: `1px solid ${alpha(accentColor, 0.1)}`,
              }}
            >
              {/* Rate */}
              <Box 
                textAlign="center"
                sx={{
                  p: 0.75,
                  borderRadius: 1,
                  background: isDark 
                    ? alpha(accentColor, 0.06)
                    : alpha(accentColor, 0.04),
                  border: `1px solid ${alpha(accentColor, 0.1)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: alpha(accentColor, 0.08),
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  display="block" 
                  sx={{ fontSize: '0.6rem', fontWeight: 600, mb: 0.4 }}
                >
                  💳 อัตรา
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: accentColor }}>
                  ฿{summary.current_rate?.toFixed(2)}
                </Typography>
              </Box>

              {/* Daily Avg */}
              <Box 
                textAlign="center"
                sx={{
                  p: 0.75,
                  borderRadius: 1,
                  background: isDark 
                    ? alpha(accentColor, 0.06)
                    : alpha(accentColor, 0.04),
                  border: `1px solid ${alpha(accentColor, 0.1)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: alpha(accentColor, 0.08),
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  display="block" 
                  sx={{ fontSize: '0.6rem', fontWeight: 600, mb: 0.4 }}
                >
                  📊 เฉลี่ย/วัน
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'text.primary' }}>
                  ฿{summary.average_daily_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>

              {/* Change */}
              <Box 
                textAlign="center"
                sx={{
                  p: 0.75,
                  borderRadius: 1,
                  background: isDark 
                    ? alpha(accentColor, 0.06)
                    : alpha(accentColor, 0.04),
                  border: `1px solid ${alpha(accentColor, 0.1)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: alpha(accentColor, 0.08),
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  display="block" 
                  sx={{ fontSize: '0.6rem', fontWeight: 600, mb: 0.3 }}
                >
                  📈 เทียบ ด.ก่อน
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                  <Box sx={{ color: getCostChangeColor(), display: 'flex', fontSize: '0.8rem' }}>
                    {getCostChangeIcon()}
                  </Box>
                  <Typography
                    sx={{ 
                      color: getCostChangeColor(), 
                      fontSize: '0.9rem',
                      fontWeight: 800 
                    }}
                  >
                    {summary.cost_change_percent !== null
                      ? `${summary.cost_change_percent > 0 ? '+' : ''}${summary.cost_change_percent?.toFixed(1)}%`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box 
            sx={{
              p: 1,
              textAlign: 'center',
              borderRadius: 1,
              background: isDark 
                ? alpha('#000', 0.1)
                : alpha('#f5f5f5', 0.3),
              border: `1px dashed ${alpha(accentColor, 0.2)}`,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
              ยังไม่มีข้อมูล
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ElectricityCostCard;
