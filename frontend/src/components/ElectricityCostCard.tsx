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
    <Card
      elevation={0}
      sx={{
        background: isDark
          ? `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha('#000', 0.4)} 100%)`
          : `linear-gradient(135deg, ${alpha(accentColor, 0.12)} 0%, ${alpha('#fff', 0.95)} 100%)`,
        border: `1px solid ${alpha(accentColor, 0.3)}`,
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        mt: 2,
        mb: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, ${alpha(accentColor, 0.3)} 100%)`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                bgcolor: alpha(accentColor, 0.15),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ElectricBoltIcon sx={{ color: accentColor, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                ค่าไฟฟ้าเดือนนี้
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                Electricity Cost
              </Typography>
            </Box>
          </Box>
          <Tooltip title="รีเฟรช">
            <IconButton
              size="small"
              onClick={loadCostSummary}
              disabled={loading}
              sx={{ color: 'text.secondary' }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {error ? (
          <Typography variant="caption" color="error">{error}</Typography>
        ) : loading ? (
          <Box>
            <Skeleton variant="text" width="60%" height={36} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
          </Box>
        ) : summary ? (
          <Box>
            {/* Main Cost */}
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: accentColor,
                textShadow: isDark ? `0 0 20px ${alpha(accentColor, 0.3)}` : 'none',
                mb: 0.5,
                fontSize: { xs: '1.6rem', sm: '1.9rem' },
              }}
            >
              ฿{summary.current_month_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </Typography>

            {/* Energy */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              พลังงาน: {summary.current_month_energy_kwh?.toLocaleString('th-TH', { maximumFractionDigits: 0 })} kWh
            </Typography>

            {/* Stats Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 1,
                pt: 1.5,
                borderTop: `1px solid ${alpha(accentColor, 0.15)}`,
              }}
            >
              {/* Rate */}
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
                  อัตรา
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  ฿{summary.current_rate?.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.6rem">
                  /kWh
                </Typography>
              </Box>

              {/* Daily Avg */}
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
                  เฉลี่ย/วัน
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  ฿{summary.average_daily_cost?.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </Typography>
              </Box>

              {/* Month Change */}
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.65rem">
                  เทียบ ด.ก่อน
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.3}>
                  <Box sx={{ color: getCostChangeColor() }}>
                    {getCostChangeIcon()}
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: getCostChangeColor() }}
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
          <Typography variant="body2" color="text.secondary">
            ยังไม่มีข้อมูลค่าไฟฟ้า
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ElectricityCostCard;
