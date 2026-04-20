// TopBar - Modern clean control panel with beautiful MUI + TailwindCSS styling
import React, { useRef } from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  Paper,
  Chip,
  Badge,
} from '@mui/material';
import {
  Storage,
  Backup,
  CenterFocusStrong,
  Download,
  Air,
  Cyclone,
  Lightbulb,
  Settings,
} from '@mui/icons-material';
import { useLayoutStore } from '../../state/useLayoutStore';
import classNames from 'classnames';

interface TopBarProps {
  onExportPNG?: (dataURL: string) => void;
  onExportJSON?: (data: any) => void;
  stageRef?: React.RefObject<any>;
}

export const TopBar: React.FC<TopBarProps> = ({ onExportPNG, onExportJSON, stageRef }) => {
  const {
    site,
    showAirflow,
    showCoolingGlow,
    showBlinkingLights,
    showFanRotation,
    setSite,
    toggleAirflow,
    toggleCoolingGlow,
    toggleBlinkingLights,
    toggleFanRotation,
    resetView,
    layout,
  } = useLayoutStore();

  // Export functions
  const handleExportPNG = () => {
    if (stageRef?.current && onExportPNG) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      onExportPNG(dataURL);
      
      // Auto-download
      const link = document.createElement('a');
      link.download = `datacenter-${site.toLowerCase()}-layout.png`;
      link.href = dataURL;
      link.click();
    }
  };

  const handleExportJSON = () => {
    if (onExportJSON) {
      const data = {
        site,
        layout,
        timestamp: new Date().toISOString(),
      };
      onExportJSON(data);
      
      // Auto-download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = `datacenter-${site.toLowerCase()}-layout.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  };

  return (
    <Paper 
      elevation={3} 
      className="w-full bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200"
      sx={{
        borderRadius: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <Box className="container mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-6">
          
          {/* Logo and Title Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                <Storage className="text-white" fontSize="medium" />
              </div>
              <div>
                <Typography 
                  variant="h5" 
                  className="font-bold text-gray-800 tracking-wide"
                  sx={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ECC800 Data Center
                </Typography>
                <Typography 
                  variant="body2" 
                  className="text-gray-500 font-medium"
                >
                  Infrastructure Monitoring
                </Typography>
              </div>
            </div>
          </div>

          {/* Site Selection - Modern Cards */}
          <div className="flex items-center gap-3">
            <Typography 
              variant="body2" 
              className="text-gray-600 font-semibold uppercase tracking-wide text-xs"
            >
              Site Selection
            </Typography>
            <div className="flex gap-2">
              <Button
                onClick={() => setSite('DC')}
                variant={site === 'DC' ? 'contained' : 'outlined'}
                startIcon={<Storage />}
                className={classNames(
                  'px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-sm',
                  site === 'DC' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-200' 
                    : 'text-blue-600 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                )}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  minWidth: '100px',
                }}
              >
                DC Primary
              </Button>
              <Button
                onClick={() => setSite('DR')}
                variant={site === 'DR' ? 'contained' : 'outlined'}
                startIcon={<Backup />}
                className={classNames(
                  'px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-sm',
                  site === 'DR' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-orange-200' 
                    : 'text-orange-600 border-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                )}
                sx={{
                  textTransform: 'none',
                  borderRadius: '12px',
                  minWidth: '100px',
                }}
              >
                DR Backup
              </Button>
            </div>
          </div>

          {/* Animation Controls - Clean Toggle Cards */}
          <div className="flex items-center gap-4">
            <Typography 
              variant="body2" 
              className="text-gray-600 font-semibold uppercase tracking-wide text-xs"
            >
              Effects
            </Typography>
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
              <Tooltip title="Toggle Airflow Effects" arrow>
                <div className="flex items-center">
                  <IconButton 
                    size="small"
                    onClick={toggleAirflow}
                    className={classNames(
                      'transition-all duration-200',
                      showAirflow 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-400 hover:text-blue-500'
                    )}
                  >
                    <Air />
                  </IconButton>
                  <Switch
                    checked={showAirflow}
                    onChange={toggleAirflow}
                    size="small"
                    sx={{
                      '& .MuiSwitch-thumb': {
                        backgroundColor: showAirflow ? '#3B82F6' : '#CBD5E1',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: showAirflow ? '#DBEAFE' : '#F1F5F9',
                      },
                    }}
                  />
                </div>
              </Tooltip>

              <Divider orientation="vertical" flexItem className="mx-1" />

              <Tooltip title="Toggle Equipment Lights" arrow>
                <div className="flex items-center">
                  <IconButton 
                    size="small"
                    onClick={toggleBlinkingLights}
                    className={classNames(
                      'transition-all duration-200',
                      showBlinkingLights 
                        ? 'text-yellow-600 bg-yellow-50' 
                        : 'text-gray-400 hover:text-yellow-500'
                    )}
                  >
                    <Lightbulb />
                  </IconButton>
                  <Switch
                    checked={showBlinkingLights}
                    onChange={toggleBlinkingLights}
                    size="small"
                    sx={{
                      '& .MuiSwitch-thumb': {
                        backgroundColor: showBlinkingLights ? '#EAB308' : '#CBD5E1',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: showBlinkingLights ? '#FEF3C7' : '#F1F5F9',
                      },
                    }}
                  />
                </div>
              </Tooltip>

              <Divider orientation="vertical" flexItem className="mx-1" />

              <Tooltip title="Toggle Fan Rotation" arrow>
                <div className="flex items-center">
                  <IconButton 
                    size="small"
                    onClick={toggleFanRotation}
                    className={classNames(
                      'transition-all duration-200',
                      showFanRotation 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-gray-400 hover:text-green-500'
                    )}
                  >
                    <Cyclone />
                  </IconButton>
                  <Switch
                    checked={showFanRotation}
                    onChange={toggleFanRotation}
                    size="small"
                    sx={{
                      '& .MuiSwitch-thumb': {
                        backgroundColor: showFanRotation ? '#16A34A' : '#CBD5E1',
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: showFanRotation ? '#DCFCE7' : '#F1F5F9',
                      },
                    }}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Tooltip title="Reset View" arrow>
              <IconButton 
                onClick={resetView} 
                className="bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600"
                sx={{ borderRadius: '10px' }}
              >
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export Layout" arrow>
              <IconButton 
                onClick={handleExportPNG}
                className="bg-white shadow-sm border border-gray-200 hover:bg-gray-50 text-gray-600"
                sx={{ borderRadius: '10px' }}
              >
                <Download />
              </IconButton>
            </Tooltip>
          </div>

        </div>
      </Box>
    </Paper>
  );
};