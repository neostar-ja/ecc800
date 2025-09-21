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
  Container,
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

// Professional Modern Cooling Effect
const ModernCoolingEffect: React.FC<{ 
  x: number; 
  y: number; 
  theme: string;
  isActive: boolean;
}> = ({ x, y, theme, isActive }) => {
  const [pulseRadius, setPulseRadius] = useState(15);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!isActive) return;
    
    const animate = () => {
      setPulseRadius(prev => {
        const newRadius = prev + 0.8;
        return newRadius > 50 ? 15 : newRadius;
      });
      setRotation(prev => (prev + 2) % 360);
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
    <Group x={x} y={y} rotation={rotation}>
      {/* Modern Cooling Rings */}
      {[1, 2, 3].map((ring, i) => (
        <Circle
          key={`cooling-ring-${ring}`}
          x={0}
          y={0}
          radius={pulseRadius + (i * 12)}
          stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
          strokeWidth={3 - (i * 0.5)}
          opacity={0.7 - (i * 0.2)}
          dash={[8, 4]}
        />
      ))}
      
      {/* Central Cooling Core */}
      <Circle
        x={0}
        y={0}
        radius={10}
        fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(147, 197, 253, 0.7)'}
        stroke={theme === 'dark' ? '#60A5FA' : '#2563EB'}
        strokeWidth={3}
      />
      
      {/* Cooling Blades */}
      {[0, 90, 180, 270].map(angle => (
        <Line
          key={`blade-${angle}`}
          points={[
            Math.cos(angle * Math.PI / 180) * 6,
            Math.sin(angle * Math.PI / 180) * 6,
            Math.cos(angle * Math.PI / 180) * 12,
            Math.sin(angle * Math.PI / 180) * 12
          ]}
          stroke={theme === 'dark' ? '#BFDBFE' : '#1E40AF'}
          strokeWidth={3}
          lineCap="round"
        />
      ))}
    </Group>
  );
};

// Modern Professional Rack Component
const ModernRackItem: React.FC<{
  rack: RackData;
  onSelect: (id: string) => void;
  selectedId: string | null;
  theme: string;
}> = ({ rack, onSelect, selectedId, theme }) => {
  const isSelected = selectedId === rack.id;
  const width = 100;
  const height = 140;
  
  const getStatusColor = () => {
    switch (rack.status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };
  
  const getTypeColor = () => {
    const colors = {
      server: '#3B82F6',
      storage: '#8B5CF6',
      network: '#10B981',
      aircon: '#06B6D4',
      ups: '#F59E0B',
      battery: '#EF4444'
    };
    return colors[rack.type] || colors.server;
  };

  const getTypeGradient = () => {
    const baseColor = getTypeColor();
    const lightColor = baseColor + '40';
    return `linear-gradient(135deg, ${baseColor}, ${lightColor})`;
  };
  
  return (
    <Group
      x={rack.position.x}
      y={rack.position.y}
      onClick={() => onSelect(rack.id)}
      onTap={() => onSelect(rack.id)}
    >
      {/* Modern Rack Body with Gradient Effect */}
      <Rect
        width={width}
        height={height}
        fill={getTypeColor()}
        stroke={isSelected ? '#FFFFFF' : getStatusColor()}
        strokeWidth={isSelected ? 4 : 2}
        cornerRadius={8}
        shadowEnabled={true}
        shadowBlur={isSelected ? 15 : 8}
        shadowColor={getStatusColor()}
        shadowOpacity={isSelected ? 0.6 : 0.3}
      />
      
      {/* Glossy Overlay Effect */}
      <Rect
        width={width}
        height={height/3}
        fill="rgba(255, 255, 255, 0.1)"
        cornerRadius={8}
      />
      
      {/* Equipment Name */}
      <Text
        x={8}
        y={15}
        text={rack.name}
        fontSize={11}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#FFFFFF' : '#FFFFFF'}
        fontStyle="bold"
        width={width - 16}
        align="center"
      />
      
      {/* Rack ID */}
      <Text
        x={8}
        y={32}
        text={rack.label}
        fontSize={14}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#E5E7EB' : '#F3F4F6'}
        fontStyle="bold"
        width={width - 16}
        align="center"
      />
      
      {/* Temperature Display */}
      <Text
        x={8}
        y={height - 20}
        text={`${rack.temperature}°C`}
        fontSize={10}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#D1D5DB' : '#E5E7EB'}
        width={width - 16}
        align="center"
      />
      
      {/* Professional Status Light */}
      <Circle
        x={width - 12}
        y={12}
        radius={6}
        fill={getStatusColor()}
        stroke="#FFFFFF"
        strokeWidth={2}
        shadowEnabled={true}
        shadowColor={getStatusColor()}
        shadowBlur={6}
        shadowOpacity={0.8}
      />
      
      {/* Type-specific Modern Indicators */}
      {rack.type === 'server' && (
        <>
          {[1, 2, 3].map(line => (
            <Rect
              key={line}
              x={15}
              y={height - 45 + (line * 8)}
              width={width - 30}
              height={4}
              fill="rgba(255, 255, 255, 0.3)"
              cornerRadius={2}
            />
          ))}
        </>
      )}
      
      {rack.type === 'aircon' && (
        <>
          {[0, 1, 2].map(wave => (
            <Line
              key={wave}
              points={[
                20 + (wave * 10), height/2 - 8,
                30 + (wave * 10), height/2 - 16,
                40 + (wave * 10), height/2 - 8,
                50 + (wave * 10), height/2 - 16,
                60 + (wave * 10), height/2 - 8
              ]}
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth={2}
            />
          ))}
        </>
      )}
      
      {rack.type === 'network' && (
        <>
          {[1, 2, 3, 4].map(dot => (
            <Circle
              key={dot}
              x={20 + (dot - 1) * 15}
              y={height/2}
              radius={3}
              fill="rgba(255, 255, 255, 0.7)"
            />
          ))}
        </>
      )}
      
      {rack.type === 'ups' && (
        <>
          <Rect
            x={20}
            y={height/2 - 8}
            width={width - 40}
            height={16}
            fill="rgba(255, 255, 255, 0.4)"
            cornerRadius={4}
          />
          <Text
            x={width/2}
            y={height/2 - 2}
            text="UPS"
            fontSize={8}
            fontFamily="Arial"
            fill="#FFFFFF"
            fontStyle="bold"
            align="center"
          />
        </>
      )}
      
      {rack.type === 'battery' && (
        <>
          <Rect
            x={25}
            y={height/2 - 12}
            width={width - 50}
            height={24}
            fill="rgba(255, 255, 255, 0.4)"
            cornerRadius={6}
          />
          <Rect
            x={width/2 - 4}
            y={height/2 - 18}
            width={8}
            height={4}
            fill="rgba(255, 255, 255, 0.6)"
            cornerRadius={2}
          />
        </>
      )}
    </Group>
  );
};

const RackLayoutDashboard_Professional: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'split' | 'dc' | 'dr'>('split');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [showAirflow, setShowAirflow] = useState(true);
  
  // Calculate proper dimensions to fit screen without scrolling
  const headerHeight = 64;
  const controlsHeight = 64;
  const availableHeight = window.innerHeight - headerHeight - controlsHeight - 40; // 40px for margins
  const availableWidth = window.innerWidth - 40; // 40px for margins
  
  // Canvas dimensions for perfect fit
  const canvasWidth = viewMode === 'split' ? availableWidth / 2 - 20 : availableWidth;
  const canvasHeight = availableHeight;

  // Perfectly calculated rack positions for no overlap
  const rackWidth = 100;
  const rackHeight = 140;
  const rackSpacingX = 120; // Increased spacing
  const rackSpacingY = 160; // Increased spacing
  
  // Enhanced DC Data - Perfect Layout
  const dcRacks: RackData[] = useMemo(() => [
    // Front Row (Cold Aisle Side)
    {
      id: 'dc-a1',
      label: 'A1',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 60, y: 80 },
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
      position: { x: 60 + rackSpacingX, y: 80 },
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
      position: { x: 60 + rackSpacingX * 2, y: 80 },
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
      position: { x: 60 + rackSpacingX * 3, y: 80 },
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
      position: { x: 60 + rackSpacingX * 4, y: 80 },
      side: 'front',
      temperature: 23,
      cpuUsage: 58,
      powerUsage: 420,
      status: 'healthy'
    },
    
    // Back Row (Hot Aisle Side)
    {
      id: 'dc-b1',
      label: 'B1',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 60, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX * 2, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX * 3, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX * 4, y: 80 + rackSpacingY * 2 },
      side: 'back',
      temperature: 26,
      cpuUsage: 62,
      powerUsage: 430,
      status: 'healthy'
    }
  ], [rackSpacingX, rackSpacingY]);

  // Enhanced DR Data
  const drRacks: RackData[] = useMemo(() => [
    // Front Row
    {
      id: 'dr-a1',
      label: 'A1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 60, y: 80 },
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
      position: { x: 60 + rackSpacingX, y: 80 },
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
      position: { x: 60 + rackSpacingX * 2, y: 80 },
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
      position: { x: 60 + rackSpacingX * 3, y: 80 },
      side: 'front',
      temperature: 24,
      cpuUsage: 55,
      powerUsage: 390,
      status: 'healthy'
    },
    
    // Back Row
    {
      id: 'dr-b1',
      label: 'B1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 60, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX * 2, y: 80 + rackSpacingY * 2 },
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
      position: { x: 60 + rackSpacingX * 3, y: 80 + rackSpacingY * 2 },
      side: 'back',
      temperature: 26,
      cpuUsage: 48,
      powerUsage: 360,
      status: 'healthy'
    }
  ], [rackSpacingX, rackSpacingY]);

  const handleRackSelect = (rackId: string) => {
    setSelectedRack(rackId === selectedRack ? null : rackId);
  };

  const getRackData = (rackId: string): RackData | undefined => {
    return [...dcRacks, ...drRacks].find(rack => rack.id === rackId);
  };

  // Professional Cold Aisle Area (Center)
  const renderProfessionalColdAisle = (offsetX: number, offsetY: number, width: number) => (
    <Group>
      <Rect
        x={offsetX + 30}
        y={offsetY + 240}
        width={width - 60}
        height={100}
        fill={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(147, 197, 253, 0.25)'}
        stroke={isDarkMode ? '#3B82F6' : '#2563EB'}
        strokeWidth={2}
        cornerRadius={12}
        dash={[10, 5]}
      />
      
      {/* Professional Cold Aisle Label */}
      <Text
        x={offsetX + 50}
        y={offsetY + 260}
        text="พื้นที่ลมเย็น (COLD AISLE)"
        fontSize={14}
        fontFamily="Arial"
        fill={isDarkMode ? '#60A5FA' : '#2563EB'}
        fontStyle="bold"
      />
      
      <Text
        x={offsetX + 50}
        y={offsetY + 280}
        text="Temperature: 18-22°C • Optimal Cooling Zone"
        fontSize={10}
        fontFamily="Arial"
        fill={isDarkMode ? '#93C5FD' : '#1E40AF'}
      />
    </Group>
  );

  // Professional Hot Aisles (Top & Bottom)
  const renderProfessionalHotAisles = (offsetX: number, offsetY: number, width: number) => (
    <Group>
      {/* Top Hot Aisle */}
      <Rect
        x={offsetX + 30}
        y={offsetY + 30}
        width={width - 60}
        height={40}
        fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 165, 165, 0.25)'}
        stroke={isDarkMode ? '#EF4444' : '#DC2626'}
        strokeWidth={2}
        cornerRadius={12}
        dash={[10, 5]}
      />
      
      {/* Bottom Hot Aisle */}
      <Rect
        x={offsetX + 30}
        y={offsetY + canvasHeight - 70}
        width={width - 60}
        height={40}
        fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 165, 165, 0.25)'}
        stroke={isDarkMode ? '#EF4444' : '#DC2626'}
        strokeWidth={2}
        cornerRadius={12}
        dash={[10, 5]}
      />
      
      {/* Hot Aisle Labels */}
      <Text
        x={offsetX + 50}
        y={offsetY + 45}
        text="พื้นที่ลมร้อน (HOT AISLE)"
        fontSize={12}
        fontFamily="Arial"
        fill={isDarkMode ? '#F87171' : '#DC2626'}
        fontStyle="bold"
      />
      
      <Text
        x={offsetX + 50}
        y={offsetY + canvasHeight - 55}
        text="พื้นที่ลมร้อน (HOT AISLE)"
        fontSize={12}
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
      bgcolor: isDarkMode ? '#0F172A' : '#F8FAFC'
    }}>
      {/* Professional Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: 1,
          borderColor: 'divider',
          height: headerHeight
        }}
      >
        <Toolbar sx={{ minHeight: `${headerHeight}px !important`, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/dashboard')} color="primary" size="large">
              <ArrowBack />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Storage color="primary" sx={{ fontSize: 28 }} />
              <Typography variant="h5" component="h1" color="text.primary" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                Data Center Rack Layout
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
            <Chip
              label="Live Monitoring"
              color="success"
              icon={<ThermostatAuto />}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Professional Controls */}
      <Box sx={{ 
        height: controlsHeight,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 3,
        bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        borderBottom: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(4px)'
      }}>
        <ButtonGroup variant="contained" size="large" sx={{ borderRadius: 2 }}>
          <Button
            onClick={() => setViewMode('split')}
            variant={viewMode === 'split' ? 'contained' : 'outlined'}
            startIcon={<ViewComfy />}
            sx={{ minWidth: 140 }}
          >
            Unified View
          </Button>
          <Button
            onClick={() => setViewMode('dc')}
            variant={viewMode === 'dc' ? 'contained' : 'outlined'}
            startIcon={<Storage />}
            sx={{ minWidth: 120 }}
          >
            Data Center
          </Button>
          <Button
            onClick={() => setViewMode('dr')}
            variant={viewMode === 'dr' ? 'contained' : 'outlined'}
            startIcon={<Memory />}
            sx={{ minWidth: 140 }}
          >
            Disaster Recovery
          </Button>
        </ButtonGroup>
        
        <Tooltip title="Toggle Air Flow Animation">
          <IconButton
            onClick={() => setShowAirflow(!showAirflow)}
            color={showAirflow ? 'primary' : 'default'}
            size="large"
            sx={{ 
              bgcolor: showAirflow ? 'primary.main' : 'transparent',
              color: showAirflow ? 'primary.contrastText' : 'text.primary',
              '&:hover': { bgcolor: showAirflow ? 'primary.dark' : 'action.hover' }
            }}
          >
            <Air />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Canvas - Perfect Fit */}
      <Box sx={{ 
        display: 'flex',
        height: `${availableHeight}px`,
        p: 2
      }}>
        {/* DC Section */}
        {(viewMode === 'split' || viewMode === 'dc') && (
          <Box sx={{ 
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
            border: 2,
            borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
            borderRadius: 3,
            bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            position: 'relative',
            mr: viewMode === 'split' ? 1 : 0,
            overflow: 'hidden',
            backdropFilter: 'blur(4px)'
          }}>
            <Stage width={canvasWidth} height={canvasHeight}>
              <Layer>
                {/* Professional Background */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill={isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.5)'}
                />
                
                {/* Hot/Cold Aisles */}
                {renderProfessionalHotAisles(0, 0, canvasWidth)}
                {renderProfessionalColdAisle(0, 0, canvasWidth)}
                
                {/* DC Racks */}
                {dcRacks.map((rack) => (
                  <ModernRackItem
                    key={rack.id}
                    rack={rack}
                    onSelect={handleRackSelect}
                    selectedId={selectedRack}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                ))}
                
                {/* Modern Cooling Effects */}
                {showAirflow && dcRacks
                  .filter(rack => rack.type === 'aircon')
                  .map((rack) => (
                    <ModernCoolingEffect
                      key={`cooling-${rack.id}`}
                      x={rack.position.x + 50}
                      y={rack.position.y + 70}
                      theme={isDarkMode ? 'dark' : 'light'}
                      isActive={rack.isActive}
                    />
                  ))
                }
              </Layer>
            </Stage>
            
            {/* DC Header Overlay */}
            <Box sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              px: 2.5,
              py: 1.5,
              borderRadius: 2,
              backdropFilter: 'blur(8px)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 14 }}>
                Data Center (DC) - {dcRacks.length} Racks
              </Typography>
            </Box>
          </Box>
        )}

        {/* DR Section */}
        {(viewMode === 'split' || viewMode === 'dr') && (
          <Box sx={{ 
            width: viewMode === 'split' ? '50%' : '100%',
            height: '100%',
            border: 2,
            borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
            borderRadius: 3,
            bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.8)',
            position: 'relative',
            ml: viewMode === 'split' ? 1 : 0,
            overflow: 'hidden',
            backdropFilter: 'blur(4px)'
          }}>
            <Stage width={canvasWidth} height={canvasHeight}>
              <Layer>
                {/* Professional Background */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fill={isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.5)'}
                />
                
                {/* Hot/Cold Aisles */}
                {renderProfessionalHotAisles(0, 0, canvasWidth)}
                {renderProfessionalColdAisle(0, 0, canvasWidth)}
                
                {/* DR Racks */}
                {drRacks.map((rack) => (
                  <ModernRackItem
                    key={rack.id}
                    rack={rack}
                    onSelect={handleRackSelect}
                    selectedId={selectedRack}
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
              px: 2.5,
              py: 1.5,
              borderRadius: 2,
              backdropFilter: 'blur(8px)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 14 }}>
                Disaster Recovery (DR) - {drRacks.length} Racks
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Professional Selected Rack Panel */}
      {selectedRack && (
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          bgcolor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          p: 3,
          borderRadius: 3,
          boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.15)',
          minWidth: 320,
          border: 1,
          borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
        }}>
          {(() => {
            const rack = getRackData(selectedRack);
            if (!rack) return null;
            
            return (
              <Box>
                <Typography variant="h6" sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontWeight: 700
                }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: rack.status === 'healthy' ? '#10B981' : 
                               rack.status === 'warning' ? '#F59E0B' : '#EF4444'
                    }}
                  />
                  {rack.name} ({rack.label})
                </Typography>
                
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Chip
                      icon={<ThermostatAuto />}
                      label={`${rack.temperature}°C`}
                      color={rack.temperature > 25 ? 'warning' : 'success'}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      icon={<Memory />}
                      label={`${rack.cpuUsage}%`}
                      color={rack.cpuUsage > 80 ? 'error' : 'success'}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      icon={<PowerSettingsNew />}
                      label={`${rack.powerUsage}W`}
                      color="info"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      label={rack.type.toUpperCase()}
                      color="primary"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
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

export default RackLayoutDashboard_Professional;