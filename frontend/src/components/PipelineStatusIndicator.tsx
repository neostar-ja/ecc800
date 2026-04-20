import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Chip, Tooltip, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import StorageIcon from '@mui/icons-material/Storage';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface PipelineStatus {
  pipeline_id: string;
  status: string;
  phase?: string;
  message?: string;
  updated_at?: string;
}

/** Map pipeline state → color + icon */
const getChipProps = (status: string, phase?: string) => {
  const p = (phase || '').toLowerCase();
  const s = (status || '').toLowerCase();

  if (s === 'error' || p === 'error') {
    return {
      color: '#ef4444',
      bg: alpha('#ef4444', 0.15),
      border: alpha('#ef4444', 0.4),
      icon: <ErrorIcon sx={{ fontSize: 15 }} />,
    };
  }
  if (p === 'exporting') {
    return {
      color: '#06b6d4',
      bg: alpha('#06b6d4', 0.12),
      border: alpha('#06b6d4', 0.35),
      icon: <CloudDownloadIcon sx={{ fontSize: 15 }} />,
    };
  }
  if (p === 'extracting') {
    return {
      color: '#f59e0b',
      bg: alpha('#f59e0b', 0.12),
      border: alpha('#f59e0b', 0.35),
      icon: <UnarchiveIcon sx={{ fontSize: 15 }} />,
    };
  }
  if (p === 'importing') {
    return {
      color: '#10b981',
      bg: alpha('#10b981', 0.12),
      border: alpha('#10b981', 0.35),
      icon: <StorageIcon sx={{ fontSize: 15 }} />,
    };
  }
  if (s === 'completed' || s === 'success' || p === 'completed') {
    return {
      color: '#22c55e',
      bg: alpha('#22c55e', 0.12),
      border: alpha('#22c55e', 0.3),
      icon: <CheckCircleIcon sx={{ fontSize: 15 }} />,
    };
  }
  // default: running / unknown
  return {
    color: '#8b5cf6',
    bg: alpha('#8b5cf6', 0.12),
    border: alpha('#8b5cf6', 0.35),
    icon: <SyncIcon sx={{ fontSize: 15 }} />,
  };
};

/** Shorten long pipeline names for chip display */
const shortName = (id: string) => {
  if (!id) return '';
  // Take only the first 2 significant words
  return id
    .replace(/pipeline/gi, '')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ')
    .trim() || id.slice(0, 12);
};

const PipelineStatusIndicator: React.FC = () => {
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/ecc800/api/pipeline/status');
      if (response.data && response.data.pipelines) {
        setPipelines(response.data.pipelines);
      }
    } catch (error) {
      console.error('Error fetching pipeline status', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 8000);
    return () => clearInterval(intervalId);
  }, []);

  if (pipelines.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.8,
        flexWrap: 'nowrap',
        mr: { xs: 0, md: 1 },
      }}
    >
      <AnimatePresence mode="popLayout">
        {pipelines.map((pipe) => {
          const chip = getChipProps(pipe.status, pipe.phase);
          const phaseLabel = pipe.phase || pipe.status;
          const isRunning = pipe.status === 'running';
          const tooltipText = [
            pipe.pipeline_id,
            phaseLabel,
            pipe.message,
            pipe.updated_at
              ? `อัปเดตล่าสุด: ${new Date(pipe.updated_at).toLocaleTimeString('th-TH')}`
              : '',
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <motion.div
              key={pipe.pipeline_id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Tooltip title={tooltipText} arrow placement="bottom">
                <Chip
                  size="small"
                  icon={
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: chip.color,
                        animation: isRunning ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                        '@keyframes pulse-glow': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                      }}
                    >
                      {chip.icon}
                    </Box>
                  }
                  label={`${shortName(pipe.pipeline_id)} · ${phaseLabel}`}
                  sx={{
                    height: 28,
                    borderRadius: '14px',
                    backgroundColor: chip.bg,
                    border: `1px solid ${chip.border}`,
                    color: chip.color,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: '0.01em',
                    cursor: 'default',
                    transition: 'all 0.2s ease',
                    '& .MuiChip-icon': {
                      ml: '6px',
                      mr: '-2px',
                    },
                    '& .MuiChip-label': {
                      px: 1,
                    },
                    '&:hover': {
                      backgroundColor: alpha(chip.color, 0.2),
                      boxShadow: `0 2px 8px ${alpha(chip.color, 0.25)}`,
                    },
                  }}
                />
              </Tooltip>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
};

export default PipelineStatusIndicator;
