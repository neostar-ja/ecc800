import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  ButtonGroup,
  Button,
  Chip,
  Tooltip,
  IconButton,
  AppBar,
  Toolbar,
  Grid,
} from '@mui/material';
import {
  Storage,
  ViewComfy,
  Memory,
  Router,
  AcUnit,
  BatteryChargingFull,
  ThermostatAuto,
  Air,
  Refresh,
  PowerSettingsNew,
  Fullscreen,
  FullscreenExit,
  ArrowBack,
} from '@mui/icons-material';
import { Stage, Layer, Rect, Group, Circle, Line, Text } from 'react-konva';
import { useTheme } from '../contexts/ThemeProvider';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface RackData {
  id: string;
  label: string;
  name: string;
  type: 'server' | 'storage' | 'network' | 'aircon' | 'ups' | 'battery';
  isActive: boolean;
  position: { x: number; y: number };
  side: 'front' | 'back';
  temperature: number;
  cpuUsage: number;
  powerUsage: number;
  status: 'healthy' | 'warning' | 'critical';
}

// Enhanced Cooling Effect for Cold Aisle (Center)
const ColdAisleCoolingEffect: React.FC<{ 
  x: number; 
  y: number; 
  theme: string;
  isActive: boolean;
}> = ({ x, y, theme, isActive }) => {
  const [pulseRadius, setPulseRadius] = useState(25);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!isActive) return;
    
    const animate = () => {
      setPulseRadius(prev => {
        const newRadius = prev + 1;
        return newRadius > 80 ? 25 : newRadius;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <Group>
      {/* Cold Air Waves */}
      {[1, 2, 3, 4, 5].map((wave, i) => (
        <Circle
          key={`cold-wave-${wave}`}
          x={x}
          y={y}
          radius={pulseRadius + (i * 20)}
          stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
          strokeWidth={4 - (i * 0.6)}
          opacity={0.8 - (i * 0.15)}
        />
      ))}
      
      {/* Cold Air Core */}
      <Circle
        x={x}
        y={y}
        radius={18}
        fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(147, 197, 253, 0.6)'}
        stroke={theme === 'dark' ? '#60A5FA' : '#2563EB'}
        strokeWidth={4}
      />
      
      {/* Snowflake Effect */}
      <Group>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <Line
            key={`snowflake-${angle}`}
            points={[
              x + Math.cos(angle * Math.PI / 180) * 10,
              y + Math.sin(angle * Math.PI / 180) * 10,
              x + Math.cos(angle * Math.PI / 180) * 16,
              y + Math.sin(angle * Math.PI / 180) * 16
            ]}
            stroke={theme === 'dark' ? '#BFDBFE' : '#1E40AF'}
            strokeWidth={3}
          />
        ))}
      </Group>
    </Group>
  );
};

// Hot Aisle Effect (Behind Racks)
const HotAisleEffect: React.FC<{ 
  x: number; 
  y: number; 
  width: number;
  theme: string;
}> = ({ x, y, width, theme }) => {
  const [heatWave, setHeatWave] = useState(0);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const animate = () => {
      setHeatWave(prev => (prev + 2) % 360);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <Group>
      {/* Heat Wave Lines */}
      {[0, 1, 2, 3, 4].map(line => (
        <Line
          key={`heat-${line}`}
          points={[
            x + (line * width / 5),
            y + Math.sin(heatWave * Math.PI / 180 + line) * 8,
            x + (line * width / 5),
            y + 40 + Math.sin(heatWave * Math.PI / 180 + line) * 8
          ]}
          stroke={theme === 'dark' ? '#F87171' : '#EF4444'}
          strokeWidth={3}
          opacity={0.6}
        />
      ))}
    </Group>
  );
};

// Professional Status Indicator
const StatusIndicator: React.FC<{
  rack: RackData;
  theme: string;
}> = ({ rack, theme }) => {
  const [blink, setBlink] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(prev => !prev);
    }, rack.status === 'critical' ? 200 : 1000);
    
    return () => clearInterval(interval);
  }, [rack.status]);
  
  const getStatusColor = () => {
    switch (rack.status) {
      case 'healthy': return theme === 'dark' ? '#10B981' : '#059669';
      case 'warning': return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'critical': return theme === 'dark' ? '#EF4444' : '#DC2626';
      default: return theme === 'dark' ? '#6B7280' : '#9CA3AF';
    }
  };
  
  return (
    <Circle
      x={rack.position.x + 120}
      y={rack.position.y + 12}
      radius={8}
      fill={blink ? getStatusColor() : 'transparent'}
      stroke={getStatusColor()}
      strokeWidth={3}
      shadowEnabled={true}
      shadowColor={getStatusColor()}
      shadowBlur={12}
      shadowOpacity={blink ? 0.9 : 0.5}
    />
  );
};

// Professional Rack Component
const ProfessionalRackItem: React.FC<{
  rack: RackData;
  scale: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  theme: string;
}> = ({ rack, scale, onSelect, selectedId, theme }) => {
  const isSelected = selectedId === rack.id;
  const width = 140 * scale;
  const height = 200 * scale;
  
  const getStatusColor = () => {
    switch (rack.status) {
      case 'healthy': return theme === 'dark' ? '#10B981' : '#059669';
      case 'warning': return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'critical': return theme === 'dark' ? '#EF4444' : '#DC2626';
      default: return theme === 'dark' ? '#6B7280' : '#4B5563';
    }
  };
  
  const getTypeColor = () => {
    const colors = {
      server: theme === 'dark' ? '#3B82F6' : '#1E40AF',
      storage: theme === 'dark' ? '#8B5CF6' : '#5B21B6',
      network: theme === 'dark' ? '#10B981' : '#047857',
      aircon: theme === 'dark' ? '#06B6D4' : '#0891B2',
      ups: theme === 'dark' ? '#F59E0B' : '#D97706',
      battery: theme === 'dark' ? '#EF4444' : '#DC2626'
    };
    return colors[rack.type] || colors.server;
  };
  
  return (
    <Group
      x={rack.position.x}
      y={rack.position.y}
      onClick={() => onSelect(rack.id)}
      onTap={() => onSelect(rack.id)}
    >
      {/* Main rack body with gradient effect */}
      <Rect
        width={width}
        height={height}
        fill={getTypeColor()}
        stroke={isSelected ? '#FFFFFF' : getStatusColor()}
        strokeWidth={isSelected ? 5 : 3}
        cornerRadius={12}
        shadowEnabled={true}
        shadowBlur={isSelected ? 20 : 8}
        shadowColor={getStatusColor()}
        shadowOpacity={isSelected ? 0.8 : 0.4}
      />
      
      {/* Equipment Name - Large and prominent */}
      <Text
        x={12}
        y={20}
        text={rack.name}
        fontSize={14}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#F9FAFB' : '#FFFFFF'}
        fontStyle="bold"
        width={width - 24}
        align="center"
      />
      
      {/* Rack ID */}
      <Text
        x={12}
        y={45}
        text={rack.label}
        fontSize={11}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#D1D5DB' : '#E5E7EB'}
        width={width - 24}
        align="center"
      />
      
      {/* Temperature Display */}
      <Text
        x={12}
        y={height - 35}
        text={`${rack.temperature}°C`}
        fontSize={10}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#F3F4F6' : '#E5E7EB'}
        width={width - 24}
        align="center"
      />
      
      {/* Status indicator */}
      <Circle
        x={width - 18}
        y={18}
        radius={10}
        fill={getStatusColor()}
        stroke={theme === 'dark' ? '#1F2937' : '#FFF'}
        strokeWidth={3}
      />
      
      {/* Type-specific professional indicators */}
      {rack.type === 'server' && (
        <>
          <Rect
            x={20}
            y={height - 55}
            width={width - 40}
            height={6}
            fill={theme === 'dark' ? '#374151' : '#E5E7EB'}
            cornerRadius={3}
          />
          <Rect
            x={20}
            y={height - 45}
            width={width - 40}
            height={6}
            fill={theme === 'dark' ? '#374151' : '#E5E7EB'}
            cornerRadius={3}
          />
        </>
      )}
      
      {rack.type === 'aircon' && (
        <>
          {[0, 1, 2, 3].map(line => (
            <Line
              key={line}
              points={[25, height/2 - 20 + (line * 8), width - 25, height/2 - 20 + (line * 8)]}
              stroke={theme === 'dark' ? '#BFDBFE' : '#3B82F6'}
              strokeWidth={3}
            />
          ))}
        </>
      )}
      
      {rack.type === 'network' && (
        <>
          {[1, 2, 3, 4, 5].map(dot => (
            <Circle
              key={dot}
              x={25 + (dot - 1) * 18}
              y={height/2}
              radius={5}
              fill={theme === 'dark' ? '#34D399' : '#10B981'}
            />
          ))}
        </>
      )}
      
      {rack.type === 'ups' && (
        <Rect
          x={25}
          y={height/2 - 12}
          width={width - 50}
          height={24}
          fill={theme === 'dark' ? '#FCD34D' : '#F59E0B'}
          cornerRadius={6}
        />
      )}
      
      {rack.type === 'battery' && (
        <>
          <Rect
            x={25}
            y={height/2 - 18}
            width={width - 50}
            height={36}
            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
            cornerRadius={8}
          />
          <Rect
            x={width/2 - 8}
            y={height/2 - 25}
            width={16}
            height={7}
            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
            cornerRadius={3}
          />
        </>
      )}
    </Group>
  );
};

const RackLayoutDashboard_FullScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'split' | 'dc' | 'dr'>('split');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [showAirflow, setShowAirflow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Get full viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const canvasWidth = viewportWidth - 40;
  const canvasHeight = viewportHeight - 160; // Account for header and controls
  
  // Enhanced DC Data - Professional Hot/Cold Aisle Layout
  const dcRacks: RackData[] = useMemo(() => [
    // Front Row Racks (Facing Cold Aisle - Center)
    {
      id: 'dc-a1',
      label: 'A1',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 80, y: 100 },
      side: 'front',
      temperature: 22,
      cpuUsage: 65,
      powerUsage: 450,
      status: 'healthy'
    },
    {
      id: 'dc-a2',
      label: 'A2',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 250, y: 100 },
      side: 'front',
      temperature: 24,
      cpuUsage: 72,
      powerUsage: 480,
      status: 'healthy'
    },
    {
      id: 'dc-a3',
      label: 'A3',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 420, y: 100 },
      side: 'front',
      temperature: 16,
      cpuUsage: 0,
      powerUsage: 2800,
      status: 'healthy'
    },
    {
      id: 'dc-a4',
      label: 'A4',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 590, y: 100 },
      side: 'front',
      temperature: 20,
      cpuUsage: 15,
      powerUsage: 120,
      status: 'healthy'
    },
    {
      id: 'dc-a5',
      label: 'A5',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 760, y: 100 },
      side: 'front',
      temperature: 23,
      cpuUsage: 58,
      powerUsage: 420,
      status: 'healthy'
    },
    {
      id: 'dc-a6',
      label: 'A6',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 930, y: 100 },
      side: 'front',
      temperature: 25,
      cpuUsage: 81,
      powerUsage: 520,
      status: 'warning'
    },
    
    // Back Row Racks (Facing Hot Aisle - Behind)
    {
      id: 'dc-b1',
      label: 'B1',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 80, y: 450 },
      side: 'back',
      temperature: 28,
      cpuUsage: 78,
      powerUsage: 510,
      status: 'healthy'
    },
    {
      id: 'dc-b2',
      label: 'B2',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 250, y: 450 },
      side: 'back',
      temperature: 27,
      cpuUsage: 85,
      powerUsage: 550,
      status: 'warning'
    },
    {
      id: 'dc-b3',
      label: 'B3',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 420, y: 450 },
      side: 'back',
      temperature: 17,
      cpuUsage: 0,
      powerUsage: 2700,
      status: 'healthy'
    },
    {
      id: 'dc-b4',
      label: 'B4',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 590, y: 450 },
      side: 'back',
      temperature: 21,
      cpuUsage: 22,
      powerUsage: 160,
      status: 'healthy'
    },
    {
      id: 'dc-b5',
      label: 'B5',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 760, y: 450 },
      side: 'back',
      temperature: 26,
      cpuUsage: 62,
      powerUsage: 430,
      status: 'healthy'
    },
    {
      id: 'dc-b6',
      label: 'B6',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 930, y: 450 },
      side: 'back',
      temperature: 29,
      cpuUsage: 75,
      powerUsage: 480,
      status: 'healthy'
    }
  ], []);

  // DR Racks - Similar structure but with different equipment
  const drRacks: RackData[] = useMemo(() => [
    // Front Row (Facing Cold Aisle)
    {
      id: 'dr-a1',
      label: 'A1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 120, y: 100 },
      side: 'front',
      temperature: 21,
      cpuUsage: 25,
      powerUsage: 180,
      status: 'healthy'
    },
    {
      id: 'dr-a2',
      label: 'A2',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 320, y: 100 },
      side: 'front',
      temperature: 28,
      cpuUsage: 0,
      powerUsage: 1200,
      status: 'healthy'
    },
    {
      id: 'dr-a3',
      label: 'A3',
      name: 'Battery',
      type: 'battery',
      isActive: true,
      position: { x: 520, y: 100 },
      side: 'front',
      temperature: 25,
      cpuUsage: 0,
      powerUsage: 50,
      status: 'healthy'
    },
    {
      id: 'dr-a4',
      label: 'A4',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 720, y: 100 },
      side: 'front',
      temperature: 24,
      cpuUsage: 55,
      powerUsage: 390,
      status: 'healthy'
    },
    
    // Back Row (Facing Hot Aisle)
    {
      id: 'dr-b1',
      label: 'B1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 120, y: 400 },
      side: 'back',
      temperature: 23,
      cpuUsage: 32,
      powerUsage: 220,
      status: 'healthy'
    },
    {
      id: 'dr-b2',
      label: 'B2',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 320, y: 400 },
      side: 'back',
      temperature: 30,
      cpuUsage: 0,
      powerUsage: 1300,
      status: 'healthy'
    },
    {
      id: 'dr-b3',
      label: 'B3',
      name: 'Battery',
      type: 'battery',
      isActive: true,
      position: { x: 520, y: 400 },
      side: 'back',
      temperature: 27,
      cpuUsage: 0,
      powerUsage: 45,
      status: 'healthy'
    },
    {
      id: 'dr-b4',
      label: 'B4',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 720, y: 400 },
      side: 'back',
      temperature: 26,
      cpuUsage: 48,
      powerUsage: 360,
      status: 'healthy'
    }
  ], []);

  const handleRackSelect = (rackId: string) => {
    setSelectedRack(rackId === selectedRack ? null : rackId);
  };

  const getRackData = (rackId: string): RackData | undefined => {
    return [...dcRacks, ...drRacks].find(rack => rack.id === rackId);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Enhanced Cold Aisle Background (Center)
  const renderColdAisle = (offsetX: number, offsetY: number, width: number) => (
    <Group>
      <Rect
        x={offsetX + 50}
        y={offsetY + 320}
        width={width - 100}
        height={120}
        fill={isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(147, 197, 253, 0.3)'}
        stroke={isDarkMode ? '#3B82F6' : '#2563EB'}
        strokeWidth={3}
        cornerRadius={15}
      />
      
      {/* Cold Aisle Label */}
      <Text
        x={offsetX + 70}
        y={offsetY + 340}
        text="พื้นที่ลมเย็น (COLD AISLE)"
        fontSize={18}
        fontFamily="Arial"
        fill={isDarkMode ? '#60A5FA' : '#2563EB'}
        fontStyle="bold"
      />
      
      <Text
        x={offsetX + 70}
        y={offsetY + 365}
        text="Temperature: 18-22°C • Optimal Cooling Zone"
        fontSize={12}
        fontFamily="Arial"
        fill={isDarkMode ? '#93C5FD' : '#1E40AF'}
      />
    </Group>
  );

  // Enhanced Hot Aisle Background (Behind Racks)
  const renderHotAisle = (offsetX: number, offsetY: number, width: number) => (
    <Group>
      {/* Hot Aisle Top */}
      <Rect
        x={offsetX + 50}
        y={offsetY + 40}
        width={width - 100}
        height={50}
        fill={isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(252, 165, 165, 0.3)'}
        stroke={isDarkMode ? '#EF4444' : '#DC2626'}
        strokeWidth={3}
        cornerRadius={15}
      />
      
      {/* Hot Aisle Bottom */}
      <Rect
        x={offsetX + 50}
        y={offsetY + 660}
        width={width - 100}
        height={50}
        fill={isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(252, 165, 165, 0.3)'}
        stroke={isDarkMode ? '#EF4444' : '#DC2626'}
        strokeWidth={3}
        cornerRadius={15}
      />
      
      {/* Hot Aisle Labels */}
      <Text
        x={offsetX + 70}
        y={offsetX < 50 ? offsetY + 55 : offsetY + 675}
        text="พื้นที่ลมร้อน (HOT AISLE)"
        fontSize={16}
        fontFamily="Arial"
        fill={isDarkMode ? '#F87171' : '#DC2626'}
        fontStyle="bold"
      />
    </Group>
  );

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      bgcolor: 'background.default',
      position: 'relative'
    }}>
      {/* Professional Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} color="primary">
              <ArrowBack />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Storage color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h5" component="h1" color="text.primary" sx={{ fontWeight: 'bold' }}>
                Data Center Rack Layout
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label="Live Monitoring"
              color="success"
              icon={<ThermostatAuto />}
              variant="outlined"
            />
            <Tooltip title="Toggle Fullscreen">
              <IconButton onClick={toggleFullscreen} color="primary">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Professional Controls */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <ButtonGroup variant="contained" size="large">
          <Button
            onClick={() => setViewMode('split')}
            variant={viewMode === 'split' ? 'contained' : 'outlined'}
            startIcon={<ViewComfy />}
          >
            Unified View
          </Button>
          <Button
            onClick={() => setViewMode('dc')}
            variant={viewMode === 'dc' ? 'contained' : 'outlined'}
            startIcon={<Storage />}
          >
            Data Center
          </Button>
          <Button
            onClick={() => setViewMode('dr')}
            variant={viewMode === 'dr' ? 'contained' : 'outlined'}
            startIcon={<Memory />}
          >
            Disaster Recovery
          </Button>
        </ButtonGroup>
        
        <Tooltip title="Toggle Air Flow Animation">
          <IconButton
            onClick={() => setShowAirflow(!showAirflow)}
            color={showAirflow ? 'primary' : 'default'}
            size="large"
          >
            <Air />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Canvas - Full Screen */}
      <Box sx={{ 
        width: '100%', 
        height: 'calc(100vh - 140px)',
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* DC Section */}
        {(viewMode === 'split' || viewMode === 'dc') && (
          <Box sx={{ 
            flex: viewMode === 'split' ? 1 : 'auto',
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
            border: theme => `2px solid ${theme.palette.divider}`,
            borderRadius: 2,
            m: 1,
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stage 
              width={viewMode === 'split' ? canvasWidth / 2 : canvasWidth} 
              height={canvasHeight}
            >
              <Layer>
                {/* Professional Data Center Background */}
                <Rect
                  x={0}
                  y={0}
                  width={viewMode === 'split' ? canvasWidth / 2 : canvasWidth}
                  height={canvasHeight}
                  fill={isDarkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(249, 250, 251, 0.5)'}
                />
                
                {/* Cold Aisle (Center) */}
                {renderColdAisle(0, 0, viewMode === 'split' ? canvasWidth / 2 : canvasWidth)}
                
                {/* Hot Aisles (Behind Racks) */}
                {renderHotAisle(0, 0, viewMode === 'split' ? canvasWidth / 2 : canvasWidth)}
                
                {/* DC Racks */}
                {dcRacks.map((rack) => (
                  <ProfessionalRackItem
                    key={rack.id}
                    rack={rack}
                    scale={1}
                    onSelect={handleRackSelect}
                    selectedId={selectedRack}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                ))}
                
                {/* Cold Aisle Cooling Effects */}
                {showAirflow && dcRacks
                  .filter(rack => rack.type === 'aircon')
                  .map((rack) => (
                    <ColdAisleCoolingEffect
                      key={`cooling-${rack.id}`}
                      x={rack.position.x + 70}
                      y={rack.position.y + 100}
                      theme={isDarkMode ? 'dark' : 'light'}
                      isActive={rack.isActive}
                    />
                  ))
                }
                
                {/* Hot Aisle Effects */}
                {showAirflow && (
                  <>
                    <HotAisleEffect
                      x={50}
                      y={40}
                      width={(viewMode === 'split' ? canvasWidth / 2 : canvasWidth) - 100}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                    <HotAisleEffect
                      x={50}
                      y={660}
                      width={(viewMode === 'split' ? canvasWidth / 2 : canvasWidth) - 100}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                  </>
                )}
                
                {/* Status Indicators */}
                {dcRacks.map((rack) => (
                  <StatusIndicator
                    key={`status-${rack.id}`}
                    rack={rack}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                ))}
              </Layer>
            </Stage>
            
            {/* DC Header Overlay */}
            <Box sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Data Center (DC) - {dcRacks.length} Racks
              </Typography>
            </Box>
          </Box>
        )}

        {/* DR Section */}
        {(viewMode === 'split' || viewMode === 'dr') && (
          <Box sx={{ 
            flex: viewMode === 'split' ? 1 : 'auto',
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
            border: theme => `2px solid ${theme.palette.divider}`,
            borderRadius: 2,
            m: 1,
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Stage 
              width={viewMode === 'split' ? canvasWidth / 2 : canvasWidth} 
              height={canvasHeight}
            >
              <Layer>
                {/* Professional DR Background */}
                <Rect
                  x={0}
                  y={0}
                  width={viewMode === 'split' ? canvasWidth / 2 : canvasWidth}
                  height={canvasHeight}
                  fill={isDarkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(249, 250, 251, 0.5)'}
                />
                
                {/* Cold Aisle (Center) */}
                {renderColdAisle(0, 0, viewMode === 'split' ? canvasWidth / 2 : canvasWidth)}
                
                {/* Hot Aisles (Behind Racks) */}
                {renderHotAisle(0, 0, viewMode === 'split' ? canvasWidth / 2 : canvasWidth)}
                
                {/* DR Racks */}
                {drRacks.map((rack) => (
                  <ProfessionalRackItem
                    key={rack.id}
                    rack={rack}
                    scale={1}
                    onSelect={handleRackSelect}
                    selectedId={selectedRack}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                ))}
                
                {/* Hot Aisle Effects */}
                {showAirflow && (
                  <>
                    <HotAisleEffect
                      x={50}
                      y={40}
                      width={(viewMode === 'split' ? canvasWidth / 2 : canvasWidth) - 100}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                    <HotAisleEffect
                      x={50}
                      y={660}
                      width={(viewMode === 'split' ? canvasWidth / 2 : canvasWidth) - 100}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                  </>
                )}
                
                {/* Status Indicators */}
                {drRacks.map((rack) => (
                  <StatusIndicator
                    key={`status-${rack.id}`}
                    rack={rack}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                ))}
              </Layer>
            </Stage>
            
            {/* DR Header Overlay */}
            <Box sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 1
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Disaster Recovery (DR) - {drRacks.length} Racks
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Selected Rack Info Panel */}
      {selectedRack && (
        <Box sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 2,
          boxShadow: 4,
          minWidth: 300,
          border: 1,
          borderColor: 'divider'
        }}>
          {(() => {
            const rack = getRackData(selectedRack);
            if (!rack) return null;
            
            return (
              <Box>
                <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Circle
                    sx={{
                      width: 12,
                      height: 12,
                      bgcolor: rack.status === 'healthy' ? 'success.main' : 
                               rack.status === 'warning' ? 'warning.main' : 'error.main'
                    }}
                  />
                  {rack.name} ({rack.label})
                </Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Chip
                      icon={<ThermostatAuto />}
                      label={`${rack.temperature}°C`}
                      color={rack.temperature > 25 ? 'warning' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      icon={<Memory />}
                      label={`${rack.cpuUsage}%`}
                      color={rack.cpuUsage > 80 ? 'error' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      icon={<PowerSettingsNew />}
                      label={`${rack.powerUsage}W`}
                      color="info"
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      label={rack.type.toUpperCase()}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            );
          })()}
        </Box>
      )}
    </Box>
  );
};

export default RackLayoutDashboard_FullScreen;