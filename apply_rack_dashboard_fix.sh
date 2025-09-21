#!/bin/bash

# This script updates the RackLayoutDashboard.tsx with the new implementation
# Usage: ./apply_rack_dashboard_fix.sh

echo "Starting RackLayoutDashboard.tsx update..."

# Target file
TARGET_FILE="/opt/code/ecc800/ecc800/frontend/src/pages/RackLayoutDashboard.tsx"

# Check if target file exists
if [ ! -f "$TARGET_FILE" ]; then
    echo "Error: Target file not found at $TARGET_FILE"
    exit 1
fi

# Create backup of original file
echo "Creating backup of original file..."
cp "$TARGET_FILE" "$TARGET_FILE.bak"

if [ $? -ne 0 ]; then
    echo "Error: Failed to create backup file"
    exit 1
fi

echo "Backup created successfully at $TARGET_FILE.bak"

# Now we'll directly write the new content to the file
echo "Updating file with new implementation..."

cat > "$TARGET_FILE" << 'EOL'
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Storage,
  Memory,
  Router,
  AcUnit,
  BatteryChargingFull,
  PowerSettingsNew,
  ZoomIn,
  ZoomOut,
  FullscreenExit,
  ViewStream,
  ViewComfy,
  ViewCompact,
  Refresh,
  Info
} from '@mui/icons-material';
import { Stage, Layer, Rect, Text, Group, Circle, Path, Arrow, Line, Star, RegularPolygon } from 'react-konva';
import Konva from 'konva';
import { useCustomTheme } from '../contexts/ThemeProvider';
import ThaiModernLayout from '../components/ThaiModernLayout';

// Define interfaces for type safety
interface Position {
  x: number;
  y: number;
}

interface RackData {
  id: string;
  label: string;
  type: string;
  isActive: boolean;
  position: Position;
  side?: string;
  temperature?: number;
  cpuUsage?: number;
}

// Modern RackItem component using Konva
const ModernRackItem = ({ 
  rack, 
  isSelected, 
  onSelect, 
  theme 
}: { 
  rack: RackData; 
  isSelected: boolean; 
  onSelect: (id: string) => void; 
  theme: 'light' | 'dark';
}) => {
  const [hovered, setHovered] = useState(false);
  const scale = 1.3;
  const width = 130;
  const height = 180;
  
  // Gradient colors based on rack type and state
  const getColors = () => {
    const baseColors: any = {
      server: {
        primary: theme === 'dark' ? '#374151' : '#4B5563',
        secondary: theme === 'dark' ? '#1F2937' : '#374151',
        accent: theme === 'dark' ? '#6B7280' : '#9CA3AF'
      },
      network: {
        primary: theme === 'dark' ? '#1D4ED8' : '#2563EB',
        secondary: theme === 'dark' ? '#1E40AF' : '#1D4ED8',
        accent: theme === 'dark' ? '#3B82F6' : '#60A5FA'
      },
      aircon: {
        primary: theme === 'dark' ? '#059669' : '#10B981',
        secondary: theme === 'dark' ? '#047857' : '#059669',
        accent: theme === 'dark' ? '#34D399' : '#6EE7B7'
      },
      battery: {
        primary: theme === 'dark' ? '#D97706' : '#F59E0B',
        secondary: theme === 'dark' ? '#B45309' : '#D97706',
        accent: theme === 'dark' ? '#FBBF24' : '#FCD34D'
      },
      ups: {
        primary: theme === 'dark' ? '#7C3AED' : '#8B5CF6',
        secondary: theme === 'dark' ? '#6D28D9' : '#7C3AED',
        accent: theme === 'dark' ? '#A78BFA' : '#C4B5FD'
      }
    };
    
    return baseColors[rack.type] || baseColors.server;
  };
  
  const colors = getColors();
  
  // Determine status color
  const getStatusColor = () => {
    if (!rack.isActive) return '#EF4444';
    if (rack.type === 'server' && rack.cpuUsage && rack.cpuUsage > 80) return '#F59E0B';
    if (rack.type === 'server' && rack.temperature && rack.temperature > 30) return '#F59E0B';
    return '#10B981';
  };
  
  // Get icon based on rack type
  const getIcon = () => {
    switch (rack.type) {
      case 'network':
        return (
          <Group>
            {/* Network icon */}
            <Circle radius={12} fill={colors.accent} opacity={0.2} />
            <Circle radius={12} stroke={colors.accent} strokeWidth={1.5} />
            <Line
              points={[0, -8, 0, 8]}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Line
              points={[-8, 0, 8, 0]}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Path
              data="M -6,-6 C -2,-2 2,-2 6,-6 M -6,6 C -2,2 2,2 6,6"
              stroke={colors.accent}
              strokeWidth={1.5}
            />
          </Group>
        );
      case 'aircon':
        return (
          <Group>
            {/* AC icon */}
            <Circle radius={12} fill={colors.accent} opacity={0.2} />
            <RegularPolygon
              sides={6}
              radius={10}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Arrow
              points={[0, -12, 0, 12]}
              pointerLength={3}
              pointerWidth={3}
              fill={colors.accent}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Arrow
              points={[-12, 0, 12, 0]}
              pointerLength={3}
              pointerWidth={3}
              fill={colors.accent}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
          </Group>
        );
      case 'battery':
        return (
          <Group>
            {/* Battery icon */}
            <Rect
              width={20}
              height={15}
              cornerRadius={2}
              fill={colors.accent}
              opacity={0.2}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Rect
              x={20}
              y={4}
              width={4}
              height={7}
              cornerRadius={1}
              fill={colors.accent}
            />
            <Rect
              x={3}
              y={3}
              width={14}
              height={9}
              cornerRadius={1}
              fill={colors.accent}
              opacity={0.6}
            />
          </Group>
        );
      case 'ups':
        return (
          <Group>
            {/* UPS icon */}
            <Star
              numPoints={5}
              innerRadius={7}
              outerRadius={12}
              fill={colors.accent}
              opacity={0.6}
            />
            <Path
              data="M 0,-10 L -3,0 L 3,0 L 0,10"
              stroke={colors.accent}
              strokeWidth={2}
              fill={colors.accent}
              opacity={0.8}
            />
          </Group>
        );
      default:
        return (
          <Group>
            {/* Server icon */}
            <Rect
              width={24}
              height={18}
              x={-12}
              y={-9}
              cornerRadius={2}
              fill={colors.accent}
              opacity={0.2}
              stroke={colors.accent}
              strokeWidth={1.5}
            />
            <Rect
              width={20}
              height={2}
              x={-10}
              y={-6}
              fill={colors.accent}
            />
            <Rect
              width={20}
              height={2}
              x={-10}
              y={-2}
              fill={colors.accent}
            />
            <Rect
              width={20}
              height={2}
              x={-10}
              y={2}
              fill={colors.accent}
            />
            <Rect
              width={20}
              height={2}
              x={-10}
              y={6}
              fill={colors.accent}
            />
          </Group>
        );
    }
  };
  
  // Get metric displays
  const getMetrics = () => {
    const items = [];
    
    if (rack.temperature) {
      items.push({
        label: `${rack.temperature}°C`,
        color: rack.temperature > 28 ? '#EF4444' : 
               rack.temperature > 25 ? '#F59E0B' : '#10B981'
      });
    }
    
    if (rack.type === 'server' && rack.cpuUsage) {
      items.push({
        label: `CPU ${rack.cpuUsage}%`,
        color: rack.cpuUsage > 80 ? '#EF4444' : 
               rack.cpuUsage > 60 ? '#F59E0B' : '#10B981'
      });
    }
    
    return (
      <Group y={30}>
        {items.map((item, index) => (
          <Group key={index} y={index * 20}>
            <Rect
              width={70}
              height={18}
              x={-35}
              cornerRadius={9}
              fill={item.color}
              opacity={0.2}
              stroke={item.color}
              strokeWidth={1}
            />
            <Text
              text={item.label}
              fontSize={11}
              fontFamily="'IBM Plex Sans Thai', system-ui"
              fontStyle="bold"
              fill={item.color}
              align="center"
              verticalAlign="middle"
              width={70}
              height={18}
              x={-35}
            />
          </Group>
        ))}
      </Group>
    );
  };
  
  return (
    <Group
      x={rack.position.x}
      y={rack.position.y}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(rack.id)}
      onTap={() => onSelect(rack.id)}
    >
      {/* Main rack body */}
      <Rect
        width={width}
        height={height}
        x={-width / 2}
        y={-height / 2}
        cornerRadius={12}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[
          0, colors.primary,
          0.5, colors.secondary,
          1, colors.primary
        ]}
        shadowColor="black"
        shadowBlur={isSelected || hovered ? 20 : 10}
        shadowOpacity={isSelected || hovered ? 0.5 : 0.3}
        shadowOffset={{ x: 5, y: 5 }}
        stroke={isSelected ? colors.accent : colors.secondary}
        strokeWidth={isSelected || hovered ? 3 : 2}
      />
      
      {/* Glass effect */}
      <Rect
        width={width - 16}
        height={height - 16}
        x={-width / 2 + 8}
        y={-height / 2 + 8}
        cornerRadius={8}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width - 16, y: height - 16 }}
        fillLinearGradientColorStops={[
          0, 'rgba(255,255,255,0.1)',
          0.5, 'rgba(255,255,255,0.05)',
          1, 'rgba(255,255,255,0.02)'
        ]}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
      />
      
      {/* Status indicator */}
      <Circle
        x={-width / 2 + 16}
        y={-height / 2 + 16}
        radius={6}
        fill={getStatusColor()}
      />
      
      {/* Badge with ID */}
      <Group x={width / 2 - 20} y={height / 2 - 15}>
        <Rect
          width={30}
          height={20}
          x={-15}
          y={-10}
          cornerRadius={5}
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />
        <Text
          text={rack.id}
          fontSize={12}
          fontFamily="'IBM Plex Sans Thai', monospace"
          fontStyle="bold"
          fill="white"
          align="center"
          verticalAlign="middle"
          width={30}
          height={20}
          x={-15}
          y={-10}
        />
      </Group>
      
      {/* Type icon */}
      <Group x={-width / 2 + 45} y={-height / 2 + 45}>
        {getIcon()}
      </Group>
      
      {/* Rack label */}
      <Text
        text={rack.label}
        fontSize={16}
        fontFamily="'IBM Plex Sans Thai', system-ui"
        fontStyle="bold"
        fill="white"
        align="center"
        width={width - 20}
        x={-width / 2 + 10}
        y={-15}
      />
      
      {/* Metrics */}
      {getMetrics()}
      
      {/* Enhanced glowing effect when selected or hovered */}
      {(isSelected || hovered) && (
        <Rect
          width={width}
          height={height}
          x={-width / 2}
          y={-height / 2}
          cornerRadius={12}
          stroke={colors.accent}
          strokeWidth={2}
          opacity={0.6}
          shadowColor={colors.accent}
          shadowBlur={20}
          shadowOpacity={0.5}
        />
      )}
    </Group>
  );
};

// Data Center View Component using Konva
const DataCenterView = ({ 
  racks, 
  title, 
  site, 
  onRackSelect, 
  selectedRackId,
  theme
}: { 
  racks: RackData[]; 
  title: string; 
  site: string; 
  onRackSelect: (id: string) => void; 
  selectedRackId: string | null;
  theme: 'light' | 'dark';
}) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Calculate stage dimensions based on rack positions
  const getDimensions = () => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    racks.forEach(rack => {
      minX = Math.min(minX, rack.position.x - 80);
      maxX = Math.max(maxX, rack.position.x + 80);
      minY = Math.min(minY, rack.position.y - 100);
      maxY = Math.max(maxY, rack.position.y + 100);
    });
    
    return {
      width: maxX - minX + 100,
      height: maxY - minY + 100
    };
  };
  
  const dimensions = getDimensions();
  
  // Handle zoom in/out
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') {
      setScale(prev => Math.min(prev + 0.1, 2));
    } else if (direction === 'out') {
      setScale(prev => Math.max(prev - 0.1, 0.5));
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };
  
  // Background colors based on theme
  const getBgColors = () => {
    return theme === 'dark' 
      ? { main: '#1F2937', cold: '#1E40AF', hot: '#B91C1C' }
      : { main: '#F9FAFB', cold: '#DBEAFE', hot: '#FEE2E2' };
  };
  
  const bgColors = getBgColors();
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      bgcolor: theme === 'dark' ? 'background.paper' : 'background.default',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: 3
    }}>
      {/* Title bar */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        bgcolor: theme === 'dark' ? 'background.paper' : 'primary.main',
        color: theme === 'dark' ? 'text.primary' : 'common.white',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => handleZoom('out')}
            sx={{ color: theme === 'dark' ? 'text.secondary' : 'common.white' }}
          >
            <ZoomOut />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleZoom('reset')}
            sx={{ color: theme === 'dark' ? 'text.secondary' : 'common.white' }}
          >
            <FullscreenExit />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleZoom('in')}
            sx={{ color: theme === 'dark' ? 'text.secondary' : 'common.white' }}
          >
            <ZoomIn />
          </IconButton>
        </Box>
      </Box>
      
      {/* Konva stage with racks */}
      <Box sx={{ 
        width: '100%', 
        height: 'calc(100% - 64px)',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: theme === 'dark' ? '#111827' : '#F3F4F6'
      }}>
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable
          onDragEnd={(e) => {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }}
        >
          <Layer>
            {/* Background zones */}
            <Rect
              width={dimensions.width}
              height={150}
              fill={bgColors.hot}
              opacity={0.2}
            />
            <Rect
              width={dimensions.width}
              height={400}
              y={150}
              fill={bgColors.cold}
              opacity={0.2}
            />
            <Rect
              width={dimensions.width}
              height={150}
              y={550}
              fill={bgColors.hot}
              opacity={0.2}
            />
            
            {/* Hot/Cold indicators */}
            <Group x={700} y={75}>
              <Rect
                width={100}
                height={30}
                cornerRadius={15}
                fill="#EF4444"
                opacity={0.8}
              />
              <Text
                text="🔥 35°C"
                fontSize={14}
                fontFamily="'IBM Plex Sans Thai', system-ui"
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                width={100}
                height={30}
              />
            </Group>
            
            <Group x={700} y={350}>
              <Rect
                width={100}
                height={30}
                cornerRadius={15}
                fill="#3B82F6"
                opacity={0.8}
              />
              <Text
                text="❄️ 18°C"
                fontSize={14}
                fontFamily="'IBM Plex Sans Thai', system-ui"
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                width={100}
                height={30}
              />
            </Group>
            
            <Group x={700} y={625}>
              <Rect
                width={100}
                height={30}
                cornerRadius={15}
                fill="#EF4444"
                opacity={0.8}
              />
              <Text
                text="🔥 35°C"
                fontSize={14}
                fontFamily="'IBM Plex Sans Thai', system-ui"
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                width={100}
                height={30}
              />
            </Group>
            
            {/* Rack items */}
            {racks.map(rack => (
              <ModernRackItem
                key={`${site}-${rack.id}`}
                rack={rack}
                isSelected={selectedRackId === rack.id}
                onSelect={onRackSelect}
                theme={theme}
              />
            ))}
          </Layer>
        </Stage>
      </Box>
    </Box>
  );
};

// Main Rack Layout Dashboard
const RackLayoutDashboard = () => {
  const [viewMode, setViewMode] = useState<'split' | 'dc' | 'dr'>('split');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [dcRacks, setDcRacks] = useState<RackData[]>([]);
  const [drRacks, setDrRacks] = useState<RackData[]>([]);
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  useEffect(() => {
    // Load Google Fonts for IBM Plex Sans Thai
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // DC Configuration with real data structure
    const dcConfig = [
      // Row A (Front - facing cold aisle)
      { id: 'A1', label: 'IT1', type: 'server', isActive: true, temperature: 24, cpuUsage: 45 },
      { id: 'A2', label: 'IT2', type: 'server', isActive: true, temperature: 23, cpuUsage: 52 },
      { id: 'A3', label: 'IT3', type: 'server', isActive: true, temperature: 25, cpuUsage: 38 },
      { id: 'A4', label: 'Air Con3', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'A5', label: 'IT4', type: 'server', isActive: true, temperature: 22, cpuUsage: 67 },
      { id: 'A6', label: 'IT5', type: 'server', isActive: true, temperature: 26, cpuUsage: 41 },
      { id: 'A7', label: 'Network1', type: 'network', isActive: true },
      { id: 'A8', label: 'Network2', type: 'network', isActive: true },
      
      // Row B (Back - facing cold aisle)
      { id: 'B1', label: 'IT6', type: 'server', isActive: true, temperature: 25, cpuUsage: 33 },
      { id: 'B2', label: 'IT7', type: 'server', isActive: true, temperature: 27, cpuUsage: 58 },
      { id: 'B3', label: 'Air Con2', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'B4', label: 'IT8', type: 'server', isActive: true, temperature: 24, cpuUsage: 71 },
      { id: 'B5', label: 'IT9', type: 'server', isActive: true, temperature: 23, cpuUsage: 29 },
      { id: 'B6', label: 'Air Con1', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'B7', label: 'IT10', type: 'server', isActive: true, temperature: 26, cpuUsage: 44 },
      { id: 'B8', label: 'Network3', type: 'network', isActive: true },
    ];

    // DR Configuration
    const drConfig = [
      // Row A (Front - 6 items)
      { id: 'A1', label: 'Network3', type: 'network', isActive: true },
      { id: 'A2', label: 'IT5', type: 'server', isActive: true, temperature: 24, cpuUsage: 35 },
      { id: 'A3', label: 'IT4', type: 'server', isActive: true, temperature: 25, cpuUsage: 42 },
      { id: 'A4', label: 'Air Con2', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'A5', label: 'Battery Cabinet', type: 'battery', isActive: true },
      { id: 'A6', label: 'UPS Cabinet', type: 'ups', isActive: true },

      // Row B (Back - 6 items)
      { id: 'B1', label: 'IT3', type: 'server', isActive: true, temperature: 23, cpuUsage: 39 },
      { id: 'B2', label: 'Air Con1', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'B3', label: 'IT2', type: 'server', isActive: true, temperature: 22, cpuUsage: 48 },
      { id: 'B4', label: 'Network1', type: 'network', isActive: true },
      { id: 'B5', label: 'Network2', type: 'network', isActive: true },
      { id: 'B6', label: 'IT1', type: 'server', isActive: true, temperature: 24, cpuUsage: 55 },
    ];

    // Position racks function for DC
    const positionRacks = (config: any[]) => {
      const cols = 8;
      const gapX = 170;
      const rackWidth = 125 * 1.30;
      const totalWidth = (cols - 1) * gapX + rackWidth;
      const viewWidth = 1400;
      const startX = Math.max(20, (viewWidth - totalWidth) / 2);
      
      return config.map((rack, index) => ({
        ...rack,
        position: {
          x: startX + (index % cols) * gapX,
          y: index < cols ? 160 : 540
        },
        side: index < cols ? 'front' : 'back'
      }));
    };

    // Position racks function for DR
    const positionRacksDR = (config: any[]) => {
      const cols = 6;
      const gapX = 220;
      const rackWidth = 125 * 1.30;
      const totalWidth = (cols - 1) * gapX + rackWidth;
      const viewWidth = 1400;
      const startX = Math.max(20, (viewWidth - totalWidth) / 2);
      
      return config.map((rack, index) => {
        const col = index % cols;
        const row = index < cols ? 0 : 1;
        return {
          ...rack,
          position: {
            x: startX + col * gapX,
            y: row === 0 ? 160 : 540,
          },
          side: row === 0 ? 'front' : 'back',
        };
      });
    };

    setDcRacks(positionRacks(dcConfig));
    setDrRacks(positionRacksDR(drConfig));
  }, []);

  const handleRackSelect = (rackId: string) => {
    setSelectedRack(prevId => prevId === rackId ? null : rackId);
  };
  
  const handleViewChange = (newView: 'split' | 'dc' | 'dr') => {
    setViewMode(newView);
    // Reset selection when changing views
    setSelectedRack(null);
  };
  
  const contentSection = (
    <>
      {/* View selection */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          borderRadius: 2,
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Typography variant="h6">เลือกมุมมอง:</Typography>
        
        <ButtonGroup variant="contained" color="primary">
          <Button 
            variant={viewMode === 'split' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('split')}
            startIcon={<ViewStream />}
          >
            DC + DR
          </Button>
          <Button 
            variant={viewMode === 'dc' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('dc')}
            startIcon={<ViewComfy />}
          >
            Data Center (DC)
          </Button>
          <Button 
            variant={viewMode === 'dr' ? 'contained' : 'outlined'}
            onClick={() => handleViewChange('dr')}
            startIcon={<ViewCompact />}
          >
            Disaster Recovery (DR)
          </Button>
        </ButtonGroup>
      </Paper>
      
      {/* Selected rack details */}
      {selectedRack && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            borderRadius: 2,
            mb: 2,
            border: 1,
            borderColor: 'primary.main',
            bgcolor: isDarkMode ? 'background.paper' : 'rgba(25, 118, 210, 0.05)'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'primary.main',
              mb: 2
            }}
          >
            <Info />
            รายละเอียดตู้ที่เลือก
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          {(() => {
            const dcRack = dcRacks.find(r => r.id === selectedRack);
            const drRack = drRacks.find(r => r.id === selectedRack);
            const rack = dcRack || drRack;
            const site = dcRack ? 'Data Center (DC)' : 'Disaster Recovery (DR)';
            
            return rack ? (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 3,
                '& > div': {
                  minWidth: { xs: '100%', sm: '45%', md: '30%' },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }
              }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">ศูนย์ข้อมูล / Site</Typography>
                  <Typography variant="body1" fontWeight="medium">{site}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">รหัส / ID</Typography>
                  <Typography variant="body1" fontWeight="medium">{rack.id}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">ชื่อ / Label</Typography>
                  <Typography variant="body1" fontWeight="medium">{rack.label}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">ประเภท / Type</Typography>
                  <Chip 
                    label={rack.type} 
                    color={
                      rack.type === 'server' ? 'default' :
                      rack.type === 'network' ? 'primary' :
                      rack.type === 'aircon' ? 'success' :
                      rack.type === 'battery' ? 'warning' : 'secondary'
                    }
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                    icon={
                      rack.type === 'server' ? <Memory /> :
                      rack.type === 'network' ? <Router /> :
                      rack.type === 'aircon' ? <AcUnit /> :
                      rack.type === 'battery' ? <BatteryChargingFull /> : <PowerSettingsNew />
                    }
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">สถานะ / Status</Typography>
                  <Chip 
                    label={rack.isActive ? "ทำงานปกติ" : "ไม่ทำงาน"} 
                    color={rack.isActive ? "success" : "error"}
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">ตำแหน่ง / Position</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {rack.id.startsWith('A') ? 'แถวหน้า (Front Row)' : 'แถวหลัง (Back Row)'}
                  </Typography>
                </Box>
                
                {rack.temperature && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">อุณหภูมิ / Temperature</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      color={
                        rack.temperature > 28 ? 'error.main' :
                        rack.temperature > 25 ? 'warning.main' : 'success.main'
                      }
                    >
                      {rack.temperature}°C
                    </Typography>
                  </Box>
                )}
                
                {rack.cpuUsage && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">การใช้งาน CPU / CPU Usage</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      color={
                        rack.cpuUsage > 80 ? 'error.main' :
                        rack.cpuUsage > 60 ? 'warning.main' : 'success.main'
                      }
                    >
                      {rack.cpuUsage}%
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : null;
          })()}
        </Paper>
      )}
      
      {/* Main content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: viewMode === 'split' ? 'row' : 'column' },
        gap: 2,
        flex: 1,
        height: viewMode === 'split' ? { xs: '140vh', md: '80vh' } : '80vh'
      }}>
        {(viewMode === 'split' || viewMode === 'dc') && (
          <Box sx={{ 
            flex: 1, 
            height: viewMode === 'split' ? '100%' : '100%',
            minHeight: { xs: '500px', md: viewMode === 'split' ? '100%' : '700px' }
          }}>
            <DataCenterView
              racks={dcRacks}
              title="Data Center (DC)"
              site="DC"
              onRackSelect={handleRackSelect}
              selectedRackId={selectedRack}
              theme={isDarkMode ? 'dark' : 'light'}
            />
          </Box>
        )}
        
        {(viewMode === 'split' || viewMode === 'dr') && (
          <Box sx={{ 
            flex: 1, 
            height: viewMode === 'split' ? '100%' : '100%',
            minHeight: { xs: '500px', md: viewMode === 'split' ? '100%' : '700px' }
          }}>
            <DataCenterView
              racks={drRacks}
              title="Disaster Recovery (DR)"
              site="DR"
              onRackSelect={handleRackSelect}
              selectedRackId={selectedRack}
              theme={isDarkMode ? 'dark' : 'light'}
            />
          </Box>
        )}
      </Box>
    </>
  );
  
  return (
    <ThaiModernLayout>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%'
      }}>
        {/* Page header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2
        }}>
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: isDarkMode ? 'text.primary' : 'primary.main'
            }}
          >
            <Storage sx={{ fontSize: 36 }} />
            ตำแหน่งตู้เครือข่าย
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="รีเฟรช" arrow>
              <IconButton 
                color="primary"
                onClick={() => window.location.reload()}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="ข้อมูลเพิ่มเติม" arrow>
              <IconButton 
                color="primary"
                onClick={() => console.log('Show info')}
              >
                <Info />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {contentSection}
      </Box>
    </ThaiModernLayout>
  );
};

export default RackLayoutDashboard;
EOL

if [ $? -ne 0 ]; then
    echo "Error: Failed to update file"
    echo "Restoring backup..."
    cp "$TARGET_FILE.bak" "$TARGET_FILE"
    exit 1
fi

echo "File update completed successfully!"
echo "To revert changes, run: cp $TARGET_FILE.bak $TARGET_FILE"

echo "Done!"