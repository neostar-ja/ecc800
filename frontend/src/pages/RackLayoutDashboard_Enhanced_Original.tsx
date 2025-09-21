import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  ButtonGroup,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
  Paper,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Fab,
  Zoom,
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
  CenterFocusStrong,
  ViewStream,
  ViewComfy,
  ViewCompact,
  Refresh,
  Speed,
  ThermostatAuto,
  Air,
  CompareArrows,
  Cyclone,
  Layers,
} from '@mui/icons-material';
import { Stage, Layer, Rect, Text, Group, Circle, Path, Arrow, Line, Star } from 'react-konva';
import Konva from 'konva';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';

// Enhanced interfaces
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
  powerUsage?: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface AirFlowParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
}

// Modern Enhanced Rack Component
const ModernRackItem = ({ 
  rack, 
  isSelected, 
  onSelect, 
  theme,
  scale = 1
}: { 
  rack: RackData; 
  isSelected: boolean; 
  onSelect: (id: string) => void; 
  theme: 'light' | 'dark';
  scale?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  const width = 140 * scale;
  const height = 200 * scale;
  
  // Enhanced color system
  const getColors = () => {
    const intensity = rack.isActive ? 1 : 0.6;
    const statusColors = {
      healthy: theme === 'dark' ? '#10B981' : '#059669',
      warning: theme === 'dark' ? '#F59E0B' : '#D97706',
      critical: theme === 'dark' ? '#EF4444' : '#DC2626'
    };
    
    const typeColors: any = {
      server: {
        primary: theme === 'dark' ? '#374151' : '#4B5563',
        secondary: theme === 'dark' ? '#1F2937' : '#374151',
        accent: statusColors[rack.status],
        glow: statusColors[rack.status] + '40'
      },
      network: {
        primary: theme === 'dark' ? '#1E40AF' : '#2563EB',
        secondary: theme === 'dark' ? '#1D4ED8' : '#1E40AF',
        accent: statusColors[rack.status],
        glow: statusColors[rack.status] + '40'
      },
      aircon: {
        primary: theme === 'dark' ? '#0891B2' : '#0EA5E9',
        secondary: theme === 'dark' ? '#0E7490' : '#0891B2',
        accent: statusColors[rack.status],
        glow: statusColors[rack.status] + '40'
      },
      battery: {
        primary: theme === 'dark' ? '#D97706' : '#F59E0B',
        secondary: theme === 'dark' ? '#B45309' : '#D97706',
        accent: statusColors[rack.status],
        glow: statusColors[rack.status] + '40'
      },
      ups: {
        primary: theme === 'dark' ? '#7C3AED' : '#8B5CF6',
        secondary: theme === 'dark' ? '#6D28D9' : '#7C3AED',
        accent: statusColors[rack.status],
        glow: statusColors[rack.status] + '40'
      }
    };
    
    return typeColors[rack.type] || typeColors.server;
  };
  
  const colors = getColors();
  const pulseIntensity = 0.3 + Math.sin(pulse) * 0.2;
  
  return (
    <Group
      x={rack.position.x}
      y={rack.position.y}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(rack.id)}
      scaleX={hovered || isSelected ? 1.05 : 1}
      scaleY={hovered || isSelected ? 1.05 : 1}
    >
      {/* Glow effect */}
      <Rect
        width={width + 20}
        height={height + 20}
        x={-10}
        y={-10}
        cornerRadius={15}
        fill={colors.glow}
        opacity={rack.isActive ? pulseIntensity * 0.6 : 0.2}
        blur={10}
      />
      
      {/* Main rack body with gradient */}
      <Rect
        width={width}
        height={height}
        cornerRadius={12}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: height }}
        fillLinearGradientColorStops={[
          0, colors.primary,
          0.5, colors.secondary,
          1, colors.primary
        ]}
        stroke={colors.accent}
        strokeWidth={isSelected ? 4 : 2}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={8}
        shadowOffset={{ x: 4, y: 4 }}
        shadowOpacity={0.6}
      />
      
      {/* Status LED */}
      <Circle
        x={width - 15}
        y={15}
        radius={6}
        fill={colors.accent}
        opacity={rack.isActive ? pulseIntensity : 0.5}
      />
      
      {/* Equipment Icon */}
      <Group x={width / 2} y={40} scaleX={scale} scaleY={scale}>
        {getRackIcon(rack.type, colors)}
      </Group>
      
      {/* Server panels simulation */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Rect
          key={i}
          x={10}
          y={80 + i * 20}
          width={width - 20}
          height={15}
          cornerRadius={2}
          fill={colors.secondary}
          opacity={rack.isActive ? 0.8 - i * 0.1 : 0.4}
          stroke={colors.accent}
          strokeWidth={0.5}
        />
      ))}
      
      {/* Performance bars */}
      {rack.cpuUsage && (
        <Group>
          <Text
            x={10}
            y={height - 40}
            text={`CPU: ${rack.cpuUsage}%`}
            fontSize={10 * scale}
            fill={theme === 'dark' ? '#E5E7EB' : '#374151'}
          />
          <Rect
            x={10}
            y={height - 25}
            width={width - 20}
            height={4}
            fill={colors.secondary}
            opacity={0.3}
            cornerRadius={2}
          />
          <Rect
            x={10}
            y={height - 25}
            width={(width - 20) * (rack.cpuUsage / 100)}
            height={4}
            fill={colors.accent}
            cornerRadius={2}
          />
        </Group>
      )}
      
      {/* Rack label */}
      <Text
        x={width / 2}
        y={height + 10}
        text={rack.label}
        fontSize={12 * scale}
        fill={theme === 'dark' ? '#E5E7EB' : '#374151'}
        fontStyle="bold"
        align="center"
        width={width}
      />
    </Group>
  );
};

// Enhanced icons for different rack types
const getRackIcon = (type: string, colors: any) => {
  const iconColor = colors.accent;
  
  switch (type) {
    case 'server':
      return (
        <Group>
          <Rect width={30} height={20} fill={iconColor} opacity={0.3} cornerRadius={3} />
          <Rect x={2} y={2} width={26} height={4} fill={iconColor} cornerRadius={1} />
          <Rect x={2} y={8} width={26} height={4} fill={iconColor} cornerRadius={1} />
          <Rect x={2} y={14} width={26} height={4} fill={iconColor} cornerRadius={1} />
        </Group>
      );
    case 'network':
      return (
        <Group>
          <Rect width={30} height={20} fill={iconColor} opacity={0.3} cornerRadius={3} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Circle
              key={i}
              x={4 + (i % 4) * 6}
              y={6 + Math.floor(i / 4) * 8}
              radius={2}
              fill={iconColor}
            />
          ))}
        </Group>
      );
    case 'aircon':
      return (
        <Group>
          <Circle radius={15} fill={iconColor} opacity={0.3} />
          <Path
            data="M-8,-8 L8,8 M8,-8 L-8,8 M-12,0 L12,0 M0,-12 L0,12"
            stroke={iconColor}
            strokeWidth={2}
          />
        </Group>
      );
    case 'battery':
      return (
        <Group>
          <Rect width={24} height={16} cornerRadius={2} fill={iconColor} opacity={0.3} stroke={iconColor} strokeWidth={1} />
          <Rect x={24} y={4} width={4} height={8} cornerRadius={1} fill={iconColor} />
          <Rect x={3} y={3} width={18} height={10} cornerRadius={1} fill={iconColor} opacity={0.8} />
        </Group>
      );
    case 'ups':
      return (
        <Group>
          <Rect width={30} height={20} cornerRadius={3} fill={iconColor} opacity={0.3} />
          <Path
            data="M8,6 L12,6 L10,10 L14,10 L8,16 L10,12 L6,12 Z"
            fill={iconColor}
          />
        </Group>
      );
    default:
      return (
        <Rect width={30} height={20} fill={iconColor} opacity={0.5} cornerRadius={3} />
      );
  }
};

// Enhanced Airflow Particles Component
const AirflowParticles = ({ 
  width, 
  height, 
  isHot = false, 
  intensity = 1 
}: { 
  width: number; 
  height: number; 
  isHot?: boolean; 
  intensity?: number;
}) => {
  const [particles, setParticles] = useState<AirFlowParticle[]>([]);
  
  useEffect(() => {
    // Initialize particles
    const initialParticles: AirFlowParticle[] = Array.from({ length: 50 * intensity }, (_, i) => ({
      id: i.toString(),
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (isHot ? 2 : 1),
      vy: isHot ? -Math.random() * 2 - 1 : Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      size: Math.random() * 3 + 1,
      color: isHot ? '#ef4444' : '#3b82f6'
    }));
    
    setParticles(initialParticles);
    
    // Animation loop
    const animate = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.vx + width) % width,
        y: isHot 
          ? (particle.y + particle.vy < 0 ? height : particle.y + particle.vy)
          : (particle.y + particle.vy > height ? 0 : particle.y + particle.vy),
        opacity: 0.3 + Math.sin(Date.now() * 0.01 + parseInt(particle.id)) * 0.3
      })));
    };
    
    const interval = setInterval(animate, 50);
    return () => clearInterval(interval);
  }, [width, height, isHot, intensity]);
  
  return (
    <Group>
      {particles.map(particle => (
        <Circle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          radius={particle.size}
          fill={particle.color}
          opacity={particle.opacity}
        />
      ))}
    </Group>
  );
};

// Main Data Center View with Enhanced Features
const EnhancedDataCenterView = ({ 
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
  const [showAirflow, setShowAirflow] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  
  // Calculate optimal stage dimensions
  const stageDimensions = useMemo(() => {
    const padding = 100;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    racks.forEach(rack => {
      minX = Math.min(minX, rack.position.x - 100);
      maxX = Math.max(maxX, rack.position.x + 100);
      minY = Math.min(minY, rack.position.y - 120);
      maxY = Math.max(maxY, rack.position.y + 120);
    });
    
    return {
      width: Math.max(1200, maxX - minX + padding * 2),
      height: Math.max(800, maxY - minY + padding * 2),
      offsetX: minX - padding,
      offsetY: minY - padding
    };
  }, [racks]);
  
  const handleZoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'in') {
      setScale(prev => Math.min(prev * 1.2, 3));
    } else if (direction === 'out') {
      setScale(prev => Math.max(prev / 1.2, 0.3));
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };
  
  const bgColors = {
    main: theme === 'dark' ? '#0f172a' : '#f8fafc',
    coldAisle: theme === 'dark' ? '#1e40af20' : '#dbeafe60',
    hotAisle: theme === 'dark' ? '#dc262620' : '#fee2e260',
    floor: theme === 'dark' ? '#1f2937' : '#e5e7eb'
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      bgcolor: bgColors.main,
      borderRadius: 3,
      overflow: 'hidden',
      border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`
    }}>
      {/* Enhanced Control Panel */}
      <Paper sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        p: 2,
        borderRadius: 2,
        bgcolor: theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          
          {/* Zoom Controls */}
          <ButtonGroup size="small" variant="outlined">
            <Tooltip title="ขยาย">
              <IconButton onClick={() => handleZoom('in')}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="ย่อ">
              <IconButton onClick={() => handleZoom('out')}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="พอดีหน้าจอ">
              <IconButton onClick={() => handleZoom('fit')}>
                <CenterFocusStrong />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          
          {/* View Mode Toggle */}
          <ButtonGroup size="small" variant="outlined" sx={{ mt: 1 }}>
            <Button
              variant={viewMode === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('overview')}
              startIcon={<ViewComfy />}
            >
              ภาพรวม
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('detailed')}
              startIcon={<ViewStream />}
            >
              รายละเอียด
            </Button>
          </ButtonGroup>
          
          {/* Airflow Toggle */}
          <Button
            variant={showAirflow ? 'contained' : 'outlined'}
            onClick={() => setShowAirflow(!showAirflow)}
            startIcon={<Air />}
            size="small"
            sx={{ mt: 1 }}
          >
            การไหลเวียนอากาศ
          </Button>
          
          {/* Status Summary */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              สถานะระบบ
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip
                size="small"
                icon={<Storage />}
                label={`ตู้ทั้งหมด: ${racks.length}`}
                color="info"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<PowerSettingsNew />}
                label={`ใช้งาน: ${racks.filter(r => r.isActive).length}`}
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                icon={<ThermostatAuto />}
                label="อุณหภูมิปกติ"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Main Canvas */}
      <Stage
        ref={stageRef}
        width={window.innerWidth - 100}
        height={window.innerHeight - 150}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer>
          {/* Data Center Floor Grid */}
          <Group>
            {Array.from({ length: Math.ceil(stageDimensions.width / 100) }).map((_, i) => (
              <Line
                key={`v-${i}`}
                points={[i * 100, 0, i * 100, stageDimensions.height]}
                stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            {Array.from({ length: Math.ceil(stageDimensions.height / 100) }).map((_, i) => (
              <Line
                key={`h-${i}`}
                points={[0, i * 100, stageDimensions.width, i * 100]}
                stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
          </Group>
          
          {/* Hot and Cold Aisles */}
          <Group>
            {/* Cold Aisle (Blue zones) */}
            <Rect
              x={100}
              y={100}
              width={stageDimensions.width - 200}
              height={150}
              fill={bgColors.coldAisle}
              cornerRadius={10}
            />
            <Text
              x={stageDimensions.width / 2}
              y={130}
              text="🌀 COLD AISLE - ทางเดินลมเย็น"
              fontSize={16}
              fill={theme === 'dark' ? '#60a5fa' : '#2563eb'}
              fontStyle="bold"
              align="center"
              width={stageDimensions.width - 200}
            />
            
            {/* Hot Aisle (Red zones) */}
            <Rect
              x={100}
              y={400}
              width={stageDimensions.width - 200}
              height={150}
              fill={bgColors.hotAisle}
              cornerRadius={10}
            />
            <Text
              x={stageDimensions.width / 2}
              y={430}
              text="🔥 HOT AISLE - ทางเดินลมร้อน"
              fontSize={16}
              fill={theme === 'dark' ? '#f87171' : '#dc2626'}
              fontStyle="bold"
              align="center"
              width={stageDimensions.width - 200}
            />
          </Group>
          
          {/* Airflow Particles */}
          {showAirflow && (
            <Group>
              <AirflowParticles
                width={stageDimensions.width - 200}
                height={150}
                isHot={false}
                intensity={0.5}
              />
              <Group y={400}>
                <AirflowParticles
                  width={stageDimensions.width - 200}
                  height={150}
                  isHot={true}
                  intensity={0.8}
                />
              </Group>
            </Group>
          )}
          
          {/* Rack Items */}
          {racks.map(rack => (
            <ModernRackItem
              key={rack.id}
              rack={rack}
              isSelected={selectedRackId === rack.id}
              onSelect={onRackSelect}
              theme={theme}
              scale={viewMode === 'detailed' ? 1.2 : 1}
            />
          ))}
          
          {/* Airflow Direction Indicators */}
          {showAirflow && (
            <Group>
              {Array.from({ length: 8 }).map((_, i) => (
                <Group key={i}>
                  <Arrow
                    x={200 + i * 150}
                    y={180}
                    points={[0, 0, 0, -30]}
                    pointerLength={8}
                    pointerWidth={6}
                    fill="#60a5fa"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    opacity={0.7}
                  />
                  <Arrow
                    x={200 + i * 150}
                    y={420}
                    points={[0, 0, 0, 30]}
                    pointerLength={8}
                    pointerWidth={6}
                    fill="#f87171"
                    stroke="#f87171"
                    strokeWidth={2}
                    opacity={0.7}
                  />
                </Group>
              ))}
            </Group>
          )}
        </Layer>
      </Stage>
    </Box>
  );
};

// Main Dashboard Component
const RackLayoutDashboard: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewMode, setViewMode] = useState<'split' | 'dc' | 'dr'>('split');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  
  // Mock data with enhanced properties
  const dcRacks: RackData[] = [
    {
      id: 'dc-01',
      label: 'DC-Server-01',
      type: 'server',
      isActive: true,
      position: { x: 200, y: 300 },
      side: 'front',
      temperature: 24,
      cpuUsage: 85,
      powerUsage: 650,
      status: 'healthy'
    },
    {
      id: 'dc-02',
      label: 'DC-Network-01',
      type: 'network',
      isActive: true,
      position: { x: 400, y: 300 },
      side: 'front',
      temperature: 22,
      cpuUsage: 45,
      powerUsage: 280,
      status: 'healthy'
    },
    {
      id: 'dc-03',
      label: 'DC-Storage-01',
      type: 'server',
      isActive: true,
      position: { x: 600, y: 300 },
      side: 'front',
      temperature: 26,
      cpuUsage: 92,
      powerUsage: 720,
      status: 'warning'
    },
    {
      id: 'dc-04',
      label: 'DC-AC-01',
      type: 'aircon',
      isActive: true,
      position: { x: 800, y: 300 },
      side: 'side',
      temperature: 18,
      cpuUsage: 0,
      powerUsage: 1200,
      status: 'healthy'
    },
    {
      id: 'dc-05',
      label: 'DC-UPS-01',
      type: 'ups',
      isActive: true,
      position: { x: 200, y: 600 },
      side: 'back',
      temperature: 28,
      cpuUsage: 0,
      powerUsage: 800,
      status: 'healthy'
    },
    {
      id: 'dc-06',
      label: 'DC-Battery-01',
      type: 'battery',
      isActive: true,
      position: { x: 400, y: 600 },
      side: 'back',
      temperature: 25,
      cpuUsage: 0,
      powerUsage: 0,
      status: 'healthy'
    },
  ];
  
  const drRacks: RackData[] = [
    {
      id: 'dr-01',
      label: 'DR-Server-01',
      type: 'server',
      isActive: false,
      position: { x: 200, y: 300 },
      side: 'front',
      temperature: 22,
      cpuUsage: 15,
      powerUsage: 180,
      status: 'healthy'
    },
    {
      id: 'dr-02',
      label: 'DR-Network-01',
      type: 'network',
      isActive: true,
      position: { x: 400, y: 300 },
      side: 'front',
      temperature: 21,
      cpuUsage: 25,
      powerUsage: 150,
      status: 'healthy'
    },
    {
      id: 'dr-03',
      label: 'DR-Storage-01',
      type: 'server',
      isActive: false,
      position: { x: 600, y: 300 },
      side: 'front',
      temperature: 20,
      cpuUsage: 8,
      powerUsage: 120,
      status: 'healthy'
    },
  ];
  
  const handleRackSelect = (rackId: string) => {
    setSelectedRack(rackId === selectedRack ? null : rackId);
  };
  
  const contentSection = (
    <Box sx={{ 
      display: 'flex',
      flexDirection: viewMode === 'split' && !isMobile ? 'row' : 'column',
      gap: 3,
      height: viewMode === 'split' && !isMobile ? '100vh' : 'auto',
      width: '100%',
      maxWidth: '100vw', // เพิ่มความกว้างเต็มจอ
      mx: 'auto'
    }}>
      {(viewMode === 'split' || viewMode === 'dc') && (
        <Box sx={{ 
          flex: 1, 
          height: viewMode === 'split' && !isMobile ? '90vh' : '80vh',
          minHeight: '600px'
        }}>
          <EnhancedDataCenterView
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
          height: viewMode === 'split' && !isMobile ? '90vh' : '80vh',
          minHeight: '600px'
        }}>
          <EnhancedDataCenterView
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
  );
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      width: '100%',
      maxWidth: '100vw', // ขยายความกว้างเต็มจอ
      height: '100vh',
      overflow: 'hidden',
      px: { xs: 1, md: 2 } // ลด padding ด้านข้าง
    }}>
      {/* View Mode Selector */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        py: 2
      }}>
        <ButtonGroup variant="contained" size="large">
          <Button
            onClick={() => setViewMode('split')}
            variant={viewMode === 'split' ? 'contained' : 'outlined'}
            startIcon={<ViewComfy />}
          >
            แสดงทั้งคู่
          </Button>
          <Button
            onClick={() => setViewMode('dc')}
            variant={viewMode === 'dc' ? 'contained' : 'outlined'}
            startIcon={<Storage />}
            color="primary"
          >
            Data Center
          </Button>
          <Button
            onClick={() => setViewMode('dr')}
            variant={viewMode === 'dr' ? 'contained' : 'outlined'}
            startIcon={<Storage />}
            color="secondary"
          >
            Disaster Recovery
          </Button>
        </ButtonGroup>
      </Box>
      
      {contentSection}
    </Box>
  );
};

export default RackLayoutDashboard;