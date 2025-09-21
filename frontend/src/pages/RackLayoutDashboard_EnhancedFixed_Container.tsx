import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  ButtonGroup,
  Button,
  Card,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
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
} from '@mui/icons-material';
import { Stage, Layer, Rect, Group, Circle, Line, Text } from 'react-konva';
import { useTheme } from '../contexts/ThemeProvider';

// Interfaces
interface RackData {
  id: string;
  label: string;
  name: string;
  type: 'server' | 'storage' | 'network' | 'aircon' | 'ups' | 'battery';
  isActive: boolean;
  position: { x: number; y: number };
  side: 'front' | 'side';
  temperature: number;
  cpuUsage: number;
  powerUsage: number;
  status: 'healthy' | 'warning' | 'critical';
}

// Enhanced Cooling Effect Component
const CoolingEffect: React.FC<{ 
  x: number; 
  y: number; 
  theme: string;
  isActive: boolean;
}> = ({ x, y, theme, isActive }) => {
  const [pulseRadius, setPulseRadius] = useState(20);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    if (!isActive) return;
    
    const animate = () => {
      setPulseRadius(prev => {
        const newRadius = prev + 1.5;
        return newRadius > 60 ? 15 : newRadius;
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
      {/* Cooling Radial Waves */}
      {[1, 2, 3, 4].map((wave, i) => (
        <Circle
          key={`cooling-${wave}`}
          x={x}
          y={y}
          radius={pulseRadius + (i * 15)}
          stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
          strokeWidth={3 - (i * 0.5)}
          opacity={0.7 - (i * 0.15)}
        />
      ))}
      
      {/* Central Cooling Core */}
      <Circle
        x={x}
        y={y}
        radius={12}
        fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)'}
        stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
        strokeWidth={3}
      />
      
      {/* Snowflake Pattern */}
      <Group>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <Line
            key={`snowflake-${angle}`}
            points={[
              x + Math.cos(angle * Math.PI / 180) * 6,
              y + Math.sin(angle * Math.PI / 180) * 6,
              x + Math.cos(angle * Math.PI / 180) * 10,
              y + Math.sin(angle * Math.PI / 180) * 10
            ]}
            stroke={theme === 'dark' ? '#BFDBFE' : '#1E40AF'}
            strokeWidth={2}
          />
        ))}
      </Group>
    </Group>
  );
};

// Enhanced Status Indicator Component  
const StatusIndicator: React.FC<{
  rack: RackData;
  theme: string;
}> = ({ rack, theme }) => {
  const [blink, setBlink] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(prev => !prev);
    }, rack.status === 'critical' ? 250 : 800);
    
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
      y={rack.position.y + 15}
      radius={7}
      fill={blink ? getStatusColor() : 'transparent'}
      stroke={getStatusColor()}
      strokeWidth={2}
      shadowEnabled={true}
      shadowColor={getStatusColor()}
      shadowBlur={10}
      shadowOpacity={blink ? 0.8 : 0.4}
    />
  );
};

// Enhanced Air Flow Particles Component
const AirFlowParticles: React.FC<{ width: number; height: number; theme: string }> = ({ width, height, theme }) => {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    opacity: number; 
    speed: number;
    direction: 'horizontal' | 'vertical';
  }>>([]);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const particleCount = 25;
    const initialParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      opacity: Math.random() * 0.6 + 0.3,
      speed: Math.random() * 2 + 1,
      direction: i % 2 === 0 ? 'horizontal' : 'vertical' as 'horizontal' | 'vertical'
    }));
    setParticles(initialParticles);
    
    const animate = () => {
      setParticles(prev => prev.map(particle => {
        let newX = particle.x;
        let newY = particle.y;
        
        if (particle.direction === 'horizontal') {
          newX = (particle.x + particle.speed) % width;
          newY = particle.y + Math.sin(particle.x * 0.008) * 0.8;
        } else {
          newY = (particle.y + particle.speed) % height;
          newX = particle.x + Math.cos(particle.y * 0.008) * 0.6;
        }
        
        return {
          ...particle,
          x: newX,
          y: newY,
          opacity: 0.4 + Math.sin(particle.x * 0.01 + particle.y * 0.01) * 0.3
        };
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height]);
  
  return (
    <Group>
      {particles.map(particle => (
        <Circle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          radius={2.5}
          fill={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
          opacity={particle.opacity}
        />
      ))}
    </Group>
  );
};

// Enhanced Rack Item Component with Names
const EnhancedRackItem: React.FC<{
  rack: RackData;
  scale: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
  theme: string;
}> = ({ rack, scale, onSelect, selectedId, theme }) => {
  const isSelected = selectedId === rack.id;
  const width = 130 * scale;
  const height = 180 * scale;
  
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
      {/* Main rack body */}
      <Rect
        width={width}
        height={height}
        fill={getTypeColor()}
        stroke={isSelected ? '#FFF' : getStatusColor()}
        strokeWidth={isSelected ? 4 : 2}
        cornerRadius={8}
        shadowEnabled={isSelected}
        shadowBlur={isSelected ? 12 : 0}
        shadowColor={getStatusColor()}
        shadowOpacity={0.6}
      />
      
      {/* Rack Name Label */}
      <Text
        x={10}
        y={15}
        text={rack.name}
        fontSize={12}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#F9FAFB' : '#FFFFFF'}
        fontStyle="bold"
        width={width - 20}
        align="center"
      />
      
      {/* Rack ID Label */}
      <Text
        x={10}
        y={35}
        text={rack.label}
        fontSize={10}
        fontFamily="Arial"
        fill={theme === 'dark' ? '#D1D5DB' : '#E5E7EB'}
        width={width - 20}
        align="center"
      />
      
      {/* Status indicator */}
      <Circle
        x={width - 15}
        y={15}
        radius={8}
        fill={getStatusColor()}
        stroke={theme === 'dark' ? '#1F2937' : '#FFF'}
        strokeWidth={2}
      />
      
      {/* Type-specific visual indicators */}
      {rack.type === 'server' && (
        <>
          <Rect
            x={15}
            y={height - 40}
            width={width - 30}
            height={8}
            fill={theme === 'dark' ? '#374151' : '#E5E7EB'}
            cornerRadius={2}
          />
          <Rect
            x={15}
            y={height - 28}
            width={width - 30}
            height={8}
            fill={theme === 'dark' ? '#374151' : '#E5E7EB'}
            cornerRadius={2}
          />
        </>
      )}
      
      {rack.type === 'aircon' && (
        <>
          <Line
            points={[20, height/2 - 15, width - 20, height/2 - 15]}
            stroke={theme === 'dark' ? '#BFDBFE' : '#3B82F6'}
            strokeWidth={3}
          />
          <Line
            points={[20, height/2, width - 20, height/2]}
            stroke={theme === 'dark' ? '#BFDBFE' : '#3B82F6'}
            strokeWidth={3}
          />
          <Line
            points={[20, height/2 + 15, width - 20, height/2 + 15]}
            stroke={theme === 'dark' ? '#BFDBFE' : '#3B82F6'}
            strokeWidth={3}
          />
        </>
      )}
      
      {rack.type === 'network' && (
        <>
          {[1, 2, 3, 4].map(dot => (
            <Circle
              key={dot}
              x={25 + (dot - 1) * 20}
              y={height/2}
              radius={4}
              fill={theme === 'dark' ? '#34D399' : '#10B981'}
            />
          ))}
        </>
      )}
      
      {rack.type === 'ups' && (
        <Rect
          x={30}
          y={height/2 - 10}
          width={width - 60}
          height={20}
          fill={theme === 'dark' ? '#FCD34D' : '#F59E0B'}
          cornerRadius={4}
        />
      )}
      
      {rack.type === 'battery' && (
        <>
          <Rect
            x={25}
            y={height/2 - 15}
            width={width - 50}
            height={30}
            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
            cornerRadius={6}
          />
          <Rect
            x={width/2 - 5}
            y={height/2 - 20}
            width={10}
            height={5}
            fill={theme === 'dark' ? '#F87171' : '#EF4444'}
            cornerRadius={2}
          />
        </>
      )}
    </Group>
  );
};

const RackLayoutDashboard_EnhancedFixed: React.FC = () => {
  console.log('EnhancedFixed Complete Dashboard rendering...');
  const { isDarkMode } = useTheme();
  const [viewMode, setViewMode] = useState<'split' | 'dc' | 'dr'>('split');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [showAirflow, setShowAirflow] = useState(true);
  
  // Enhanced DC Data with proper Hot/Cold Aisle Layout
  const dcRacks: RackData[] = useMemo(() => [
    // DC Row A (Cold Aisle - Front Row)
    {
      id: 'dc-a1',
      label: 'A1',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 50, y: 50 },
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
      position: { x: 200, y: 50 },
      side: 'front',
      temperature: 24,
      cpuUsage: 72,
      powerUsage: 480,
      status: 'healthy'
    },
    {
      id: 'dc-a3',
      label: 'A3',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 350, y: 50 },
      side: 'front',
      temperature: 23,
      cpuUsage: 58,
      powerUsage: 420,
      status: 'healthy'
    },
    {
      id: 'dc-a4',
      label: 'A4',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 500, y: 50 },
      side: 'front',
      temperature: 16,
      cpuUsage: 0,
      powerUsage: 2800,
      status: 'healthy'
    },
    {
      id: 'dc-a5',
      label: 'A5',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 650, y: 50 },
      side: 'front',
      temperature: 21,
      cpuUsage: 81,
      powerUsage: 520,
      status: 'warning'
    },
    {
      id: 'dc-a6',
      label: 'A6',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 800, y: 50 },
      side: 'front',
      temperature: 25,
      cpuUsage: 44,
      powerUsage: 380,
      status: 'healthy'
    },
    {
      id: 'dc-a7',
      label: 'A7',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 950, y: 50 },
      side: 'front',
      temperature: 20,
      cpuUsage: 15,
      powerUsage: 120,
      status: 'healthy'
    },
    {
      id: 'dc-a8',
      label: 'A8',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 1100, y: 50 },
      side: 'front',
      temperature: 19,
      cpuUsage: 18,
      powerUsage: 140,
      status: 'healthy'
    },
    // DC Row B (Hot Aisle - Back Row)
    {
      id: 'dc-b1',
      label: 'B1',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 50, y: 350 },
      side: 'side',
      temperature: 18,
      cpuUsage: 0,
      powerUsage: 2600,
      status: 'healthy'
    },
    {
      id: 'dc-b2',
      label: 'B2',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 200, y: 350 },
      side: 'side',
      temperature: 26,
      cpuUsage: 78,
      powerUsage: 510,
      status: 'healthy'
    },
    {
      id: 'dc-b3',
      label: 'B3',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 350, y: 350 },
      side: 'side',
      temperature: 17,
      cpuUsage: 0,
      powerUsage: 2700,
      status: 'healthy'
    },
    {
      id: 'dc-b4',
      label: 'B4',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 500, y: 350 },
      side: 'side',
      temperature: 27,
      cpuUsage: 85,
      powerUsage: 550,
      status: 'warning'
    },
    {
      id: 'dc-b5',
      label: 'B5',
      name: 'Air Con',
      type: 'aircon',
      isActive: true,
      position: { x: 650, y: 350 },
      side: 'side',
      temperature: 16,
      cpuUsage: 0,
      powerUsage: 2900,
      status: 'healthy'
    },
    {
      id: 'dc-b6',
      label: 'B6',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 800, y: 350 },
      side: 'side',
      temperature: 25,
      cpuUsage: 62,
      powerUsage: 430,
      status: 'healthy'
    },
    {
      id: 'dc-b7',
      label: 'B7',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 950, y: 350 },
      side: 'side',
      temperature: 21,
      cpuUsage: 22,
      powerUsage: 160,
      status: 'healthy'
    },
    {
      id: 'dc-b8',
      label: 'B8',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 1100, y: 350 },
      side: 'side',
      temperature: 20,
      cpuUsage: 19,
      powerUsage: 130,
      status: 'healthy'
    }
  ], []);

  // Enhanced DR Data with proper Hot/Cold Aisle Layout
  const drRacks: RackData[] = useMemo(() => [
    // DR Row A (Cold Aisle - Front Row)
    {
      id: 'dr-a1',
      label: 'A1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 50, y: 50 },
      side: 'front',
      temperature: 21,
      cpuUsage: 25,
      powerUsage: 180,
      status: 'healthy'
    },
    {
      id: 'dr-a2',
      label: 'A2',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 250, y: 50 },
      side: 'front',
      temperature: 22,
      cpuUsage: 28,
      powerUsage: 200,
      status: 'healthy'
    },
    {
      id: 'dr-a3',
      label: 'A3',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 450, y: 50 },
      side: 'front',
      temperature: 24,
      cpuUsage: 55,
      powerUsage: 390,
      status: 'healthy'
    },
    {
      id: 'dr-a4',
      label: 'A4',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 650, y: 50 },
      side: 'front',
      temperature: 28,
      cpuUsage: 0,
      powerUsage: 1200,
      status: 'healthy'
    },
    {
      id: 'dr-a5',
      label: 'A5',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 850, y: 50 },
      side: 'front',
      temperature: 29,
      cpuUsage: 0,
      powerUsage: 1150,
      status: 'warning'
    },
    {
      id: 'dr-a6',
      label: 'A6',
      name: 'Battery',
      type: 'battery',
      isActive: true,
      position: { x: 1050, y: 50 },
      side: 'front',
      temperature: 25,
      cpuUsage: 0,
      powerUsage: 50,
      status: 'healthy'
    },
    // DR Row B (Hot Aisle - Back Row)
    {
      id: 'dr-b1',
      label: 'B1',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 50, y: 350 },
      side: 'side',
      temperature: 23,
      cpuUsage: 32,
      powerUsage: 220,
      status: 'healthy'
    },
    {
      id: 'dr-b2',
      label: 'B2',
      name: 'Network',
      type: 'network',
      isActive: true,
      position: { x: 250, y: 350 },
      side: 'side',
      temperature: 24,
      cpuUsage: 30,
      powerUsage: 210,
      status: 'healthy'
    },
    {
      id: 'dr-b3',
      label: 'B3',
      name: 'IT Server',
      type: 'server',
      isActive: true,
      position: { x: 450, y: 350 },
      side: 'side',
      temperature: 26,
      cpuUsage: 48,
      powerUsage: 360,
      status: 'healthy'
    },
    {
      id: 'dr-b4',
      label: 'B4',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 650, y: 350 },
      side: 'side',
      temperature: 30,
      cpuUsage: 0,
      powerUsage: 1300,
      status: 'healthy'
    },
    {
      id: 'dr-b5',
      label: 'B5',
      name: 'UPS',
      type: 'ups',
      isActive: true,
      position: { x: 850, y: 350 },
      side: 'side',
      temperature: 31,
      cpuUsage: 0,
      powerUsage: 1250,
      status: 'warning'
    },
    {
      id: 'dr-b6',
      label: 'B6',
      name: 'Battery',
      type: 'battery',
      isActive: true,
      position: { x: 1050, y: 350 },
      side: 'side',
      temperature: 27,
      cpuUsage: 0,
      powerUsage: 45,
      status: 'healthy'
    }
  ], []);

  const handleRackSelect = (rackId: string) => {
    setSelectedRack(rackId === selectedRack ? null : rackId);
  };

  const getRackData = (rackId: string): RackData | undefined => {
    return [...dcRacks, ...drRacks].find(rack => rack.id === rackId);
  };

  // Enhanced canvas dimensions - much larger for full screen
  const canvasWidth = viewMode === 'split' ? 1400 : 1300;
  const canvasHeight = viewMode === 'split' ? 600 : 550;

  // Render Hot/Cold Aisle Backgrounds
  const renderHotColdBackground = (offsetX: number, offsetY: number) => (
    <Group>
      {/* Cold Aisle (Blue Zone) */}
      <Rect
        x={offsetX}
        y={offsetY}
        width={canvasWidth / (viewMode === 'split' ? 2.1 : 1.1)}
        height={240}
        fill={isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(147, 197, 253, 0.2)'}
        stroke={isDarkMode ? '#3B82F6' : '#2563EB'}
        strokeWidth={2}
        cornerRadius={8}
      />
      
      {/* Cold Aisle Label */}
      <Text
        x={offsetX + 20}
        y={offsetY + 15}
        text="COLD AISLE (16-24°C)"
        fontSize={14}
        fontFamily="Arial"
        fill={isDarkMode ? '#60A5FA' : '#2563EB'}
        fontStyle="bold"
      />
      
      {/* Hot Aisle (Red Zone) */}
      <Rect
        x={offsetX}
        y={offsetY + 280}
        width={canvasWidth / (viewMode === 'split' ? 2.1 : 1.1)}
        height={240}
        fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 165, 165, 0.2)'}
        stroke={isDarkMode ? '#EF4444' : '#DC2626'}
        strokeWidth={2}
        cornerRadius={8}
      />
      
      {/* Hot Aisle Label */}
      <Text
        x={offsetX + 20}
        y={offsetY + 295}
        text="HOT AISLE (25-35°C)"
        fontSize={14}
        fontFamily="Arial"
        fill={isDarkMode ? '#F87171' : '#DC2626'}
        fontStyle="bold"
      />
    </Group>
  );

  return (
    <Container maxWidth={false} sx={{ width: '100%', minHeight: '100vh', py: 2 }}>
      <Box sx={{ width: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}>
              <ViewComfy color="primary" />
              Data Center Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Enterprise Rack Infrastructure Monitoring
            </Typography>
          </Box>
          
          <Chip
            label="Operational"
            color="success"
            icon={<ThermostatAuto />}
            sx={{ fontSize: '0.875rem' }}
          />
        </Box>

        {/* View Mode Controls */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <ButtonGroup variant="contained" size="large">
            <Button
              onClick={() => setViewMode('split')}
              variant={viewMode === 'split' ? 'contained' : 'outlined'}
              startIcon={<ViewComfy />}
            >
              Unified View
              <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                Both DC & DR
              </Typography>
            </Button>
            <Button
              onClick={() => setViewMode('dc')}
              variant={viewMode === 'dc' ? 'contained' : 'outlined'}
              startIcon={<Storage />}
            >
              Data Center
              <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                Primary Site
              </Typography>
            </Button>
            <Button
              onClick={() => setViewMode('dr')}
              variant={viewMode === 'dr' ? 'contained' : 'outlined'}
              startIcon={<Memory />}
            >
              Disaster Recovery
              <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
                Backup Site
              </Typography>
            </Button>
          </ButtonGroup>
          
          <Tooltip title="Toggle Airflow Animation">
            <IconButton
              onClick={() => setShowAirflow(!showAirflow)}
              color={showAirflow ? 'primary' : 'default'}
              size="large"
            >
              <Air />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Main Canvas Layout */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          flexDirection: { xs: 'column', lg: viewMode === 'split' ? 'row' : 'column' },
          width: '100%'
        }}>
          {/* DC Section */}
          {(viewMode === 'split' || viewMode === 'dc') && (
            <Card sx={{ 
              flex: viewMode === 'split' ? 1 : 'none',
              width: viewMode === 'split' ? 'auto' : '100%',
              minHeight: 600
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Storage color="primary" />
                    <Typography variant="h6">Data Center (DC)</Typography>
                    <Chip 
                      label={`${dcRacks.length} Active Racks`} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>
                  <Tooltip title="Refresh DC Status">
                    <IconButton size="small">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ 
                  width: '100%', 
                  overflowX: 'auto',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Stage width={canvasWidth} height={canvasHeight}>
                    <Layer>
                      {/* Hot/Cold Aisle Background */}
                      {renderHotColdBackground(0, 0)}
                      
                      {/* Air Flow Particles */}
                      {showAirflow && (
                        <AirFlowParticles 
                          width={canvasWidth} 
                          height={canvasHeight} 
                          theme={isDarkMode ? 'dark' : 'light'} 
                        />
                      )}
                      
                      {/* DC Racks */}
                      {dcRacks.map((rack) => (
                        <EnhancedRackItem
                          key={rack.id}
                          rack={rack}
                          scale={1}
                          onSelect={handleRackSelect}
                          selectedId={selectedRack}
                          theme={isDarkMode ? 'dark' : 'light'}
                        />
                      ))}
                      
                      {/* Air Conditioning Cooling Effects */}
                      {dcRacks
                        .filter(rack => rack.type === 'aircon' && rack.isActive)
                        .map((rack) => (
                          <CoolingEffect
                            key={`cooling-${rack.id}`}
                            x={rack.position.x + 65}
                            y={rack.position.y + 90}
                            theme={isDarkMode ? 'dark' : 'light'}
                            isActive={rack.isActive}
                          />
                        ))
                      }
                      
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
                </Box>
              </CardContent>
            </Card>
          )}

          {/* DR Section */}
          {(viewMode === 'split' || viewMode === 'dr') && (
            <Card sx={{ 
              flex: viewMode === 'split' ? 1 : 'none',
              width: viewMode === 'split' ? 'auto' : '100%',
              minHeight: 600
            }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2 
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Memory color="error" />
                    <Typography variant="h6">Disaster Recovery (DR)</Typography>
                    <Chip 
                      label={`${drRacks.length} Active Racks`} 
                      size="small" 
                      color="error" 
                      variant="outlined" 
                    />
                  </Box>
                  <Tooltip title="Refresh DR Status">
                    <IconButton size="small">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{ 
                  width: '100%', 
                  overflowX: 'auto',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Stage width={canvasWidth} height={canvasHeight}>
                    <Layer>
                      {/* Hot/Cold Aisle Background */}
                      {renderHotColdBackground(0, 0)}
                      
                      {/* Air Flow Particles */}
                      {showAirflow && (
                        <AirFlowParticles 
                          width={canvasWidth} 
                          height={canvasHeight} 
                          theme={isDarkMode ? 'dark' : 'light'} 
                        />
                      )}
                      
                      {/* DR Racks */}
                      {drRacks.map((rack) => (
                        <EnhancedRackItem
                          key={rack.id}
                          rack={rack}
                          scale={1}
                          onSelect={handleRackSelect}
                          selectedId={selectedRack}
                          theme={isDarkMode ? 'dark' : 'light'}
                        />
                      ))}
                      
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
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Selected Rack Details */}
        {selectedRack && (
          <Card sx={{ mt: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              {(() => {
                const rack = getRackData(selectedRack);
                if (!rack) return null;
                
                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: rack.status === 'healthy' ? 'success.main' : 
                                   rack.status === 'warning' ? 'warning.main' : 'error.main'
                        }}
                      />
                      {rack.name} ({rack.label})
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<ThermostatAuto />}
                        label={`Temperature: ${rack.temperature}°C`}
                        color={rack.temperature > 25 ? 'warning' : 'success'}
                        variant="outlined"
                      />
                      <Chip
                        icon={<Memory />}
                        label={`CPU: ${rack.cpuUsage}%`}
                        color={rack.cpuUsage > 80 ? 'error' : rack.cpuUsage > 60 ? 'warning' : 'success'}
                        variant="outlined"
                      />
                      <Chip
                        icon={<PowerSettingsNew />}
                        label={`Power: ${rack.powerUsage}W`}
                        color="info"
                        variant="outlined"
                      />
                      <Chip
                        label={`Type: ${rack.type.toUpperCase()}`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default RackLayoutDashboard_EnhancedFixed;