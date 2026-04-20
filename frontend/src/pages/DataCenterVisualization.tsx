// Modern Professional Data Center Visualization - Completely Redesigned
import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, ButtonGroup, Button, IconButton, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Stage, Layer, Rect, Group, Circle, Line, Text, Path, Arc, Image as KonvaImage } from 'react-konva';
import ModernAirflowEffect from '../components/ModernAirflowEffect';
import { 
  Storage, 
  Computer, 
  Router, 
  AcUnit, 
  Battery80, 
  PowerOutlined, 
  Memory,
  DeveloperBoard,
  Lan,
  Thermostat,
  BatteryChargingFull,
  PowerSettingsNew,
  CloudQueue,
  Dns,
  Hub
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeProvider';
import { apiClient, DashboardData, DashboardRow } from '../services/api';
import { useQuery } from '@tanstack/react-query';

// Animated Cold Air Inlet Symbol (arrow with gentle pulse and glow)
const ColdInletSymbol: React.FC<{
  x: number;
  y: number;
  direction: 'up' | 'down';
}> = ({ x, y, direction }) => {
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setPhase((p) => (p + 0.06) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scale = 0.9 + 0.1 * Math.sin(phase);
  const yJitter = 1.5 * Math.sin(phase * 1.2);
  const rotation = direction === 'up' ? 0 : 180;

  return (
    <Group x={x} y={y + yJitter} scaleX={scale} scaleY={scale} rotation={rotation} listening={false}>
      {/* Outer glow */}
      <Path
        data={"M -7,6 L 0,-7 L 7,6 Z"}
        fill={'rgba(191,219,254,0.85)'}
        shadowEnabled
        shadowColor={'#60A5FA'}
        shadowBlur={12}
        shadowOpacity={0.9}
        opacity={0.9}
      />
      {/* Inner core */}
      <Path
        data={"M -5,5 L 0,-5 L 5,5 Z"}
        fill={'#60A5FA'}
        stroke={'#93C5FD'}
        strokeWidth={1}
        opacity={0.95}
      />
      {/* trailing accents */}
      <Line points={[-8,10, 8,10]} stroke={'rgba(147,197,253,0.6)'} strokeWidth={2} lineCap="round" opacity={0.7} />
      <Line points={[-6,13, 6,13]} stroke={'rgba(147,197,253,0.45)'} strokeWidth={2} lineCap="round" opacity={0.6} />
    </Group>
  );
};

// Pulsing source marker for cold-air start point (distinct teal/cyan hue)
const ColdSourcePulse: React.FC<{ x: number; y: number }>
  = ({ x, y }) => {
  const [radius, setRadius] = useState(6);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setRadius((r) => (r >= 22 ? 6 : r + 0.6));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);
  const opacity = Math.max(0.15, 1 - (radius - 6) / 20);
  return (
    <Group x={x} y={y} listening={false}>
      <Circle x={0} y={0} radius={radius}
        stroke={'rgba(34,211,238,0.9)'} strokeWidth={2}
        opacity={opacity}
        shadowEnabled shadowBlur={10} shadowColor={'#22D3EE'} shadowOpacity={0.7}
      />
      <Circle x={0} y={0} radius={4}
        fill={'#5EEAD4'} opacity={0.85}
        shadowEnabled shadowBlur={6} shadowColor={'#22D3EE'} shadowOpacity={0.8}
      />
    </Group>
  );
};

// Swirl symbol to convey circulating air in the cold aisle
const ColdAisleSwirlSymbol: React.FC<{ x: number; y: number; size?: number }>
  = ({ x, y, size = 24 }) => {
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setPhase(p => (p + 0.02) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { mounted = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const rotation = (phase / (Math.PI * 2)) * 360;
  const s = size;
  const cx = 0, cy = 0;
  const arc = (r: number, sweep: number) => `M ${cx - r},${cy} a ${r},${r} 0 1,${sweep} ${2*r},0 a ${r},${r} 0 1,${sweep} ${-2*r},0`;
  return (
    <Group x={x} y={y} rotation={rotation} listening={false} opacity={0.9}>
      {/* outer swirl */}
      <Path data={arc(s * 0.55, 1)} stroke={'rgba(165,243,252,0.7)'} strokeWidth={1.4} shadowEnabled shadowBlur={6} shadowColor={'#22D3EE'} />
      {/* middle swirl */}
      <Path data={arc(s * 0.35, 1)} stroke={'rgba(125,211,252,0.9)'} strokeWidth={1.6} />
      {/* inner swirl */}
      <Path data={arc(s * 0.2, 1)} stroke={'rgba(56,189,248,1)'} strokeWidth={1.8} />
      {/* center dot */}
      <Circle x={0} y={0} radius={s * 0.06} fill={'#22D3EE'} opacity={0.95} shadowEnabled shadowBlur={4} shadowColor={'#22D3EE'} />
    </Group>
  );
};

// Professional animated rack icons
const AnimatedRackIcon: React.FC<{
  type: 'server' | 'storage' | 'network' | 'aircon' | 'ups' | 'battery' | 'sensor';
  x: number;
  y: number;
  size: number;
  isActive: boolean;
  theme: string;
}> = ({ type, x, y, size, isActive, theme }) => {
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setPhase(p => (p + 0.05) % (Math.PI * 2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive]);

  const iconColor = theme === 'dark' ? '#FFFFFF' : '#FFFFFF'; // Always white for high contrast
  const iconSecondary = theme === 'dark' ? '#F9FAFB' : '#E5E7EB'; // Light gray
  
  // Use contrasting colors that stand out from any rack color
  // These are vibrant, high-contrast colors independent of rack type
  const accentColors = {
    server: '#FFD700',      // Gold - stands out against all rack colors
    storage: '#FF6B35',     // Vibrant Orange
    network: '#00F5FF',     // Cyan - very visible
    aircon: '#00FF9F',      // Bright Mint Green
    ups: '#FF1493',         // Deep Pink
    battery: '#FFD700',     // Gold
    sensor: '#9D00FF'       // Vivid Purple
  };
  const accentColor = accentColors[type];

  const renderIcon = () => {
    const s = size;

    switch (type) {
      case 'server':
        return (
          <Group>
            {/* Modern Server with gradient chassis */}
            <Rect 
              x={-s*0.45} y={-s*0.35} width={s*0.9} height={s*0.7} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.35 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.35 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Premium blade modules with glow */}
            {[0, 1, 2].map((i) => (
              <Group key={i}>
                <Rect 
                  x={-s*0.38} 
                  y={-s*0.22 + i*s*0.15} 
                  width={s*0.76} 
                  height={s*0.1} 
                  fill={accentColor} 
                  cornerRadius={s*0.02}
                  opacity={0.7 + 0.3 * Math.sin(phase + i * 0.5)}
                  shadowEnabled
                  shadowBlur={6}
                  shadowColor={accentColor}
                  shadowOpacity={0.6}
                />
                {/* Activity LED */}
                <Circle 
                  x={s*0.3} 
                  y={-s*0.17 + i*s*0.15} 
                  radius={s*0.025} 
                  fill={'#10B981'} 
                  opacity={0.8 + 0.2 * Math.sin(phase * 2 + i)}
                  shadowEnabled
                  shadowBlur={4}
                  shadowColor={'#10B981'}
                />
              </Group>
            ))}
            {/* Premium LCD Panel */}
            <Rect 
              x={-s*0.2} y={s*0.18} width={s*0.4} height={s*0.12} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={s*0.26} 
              text="SERVER" 
              fontSize={s*0.08} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
          </Group>
        );

      case 'storage':
        return (
          <Group>
            {/* Premium Storage Array */}
            <Rect 
              x={-s*0.45} y={-s*0.4} width={s*0.9} height={s*0.8} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.4 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.4 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Beautiful Drive Bays 3x2 */}
            {[...Array(6)].map((_, i) => {
              const row = Math.floor(i / 2);
              const col = i % 2;
              const x = -s*0.28 + col*s*0.28;
              const y = -s*0.25 + row*s*0.18;
              const activity = 0.6 + 0.4 * Math.sin(phase * 1.5 + i * 0.4);
              return (
                <Group key={i}>
                  <Rect 
                    x={x} y={y} 
                    width={s*0.22} height={s*0.12} 
                    fill={accentColor} 
                    cornerRadius={s*0.02}
                    opacity={activity}
                    stroke={iconColor}
                    strokeWidth={s*0.005}
                    shadowEnabled
                    shadowBlur={4}
                    shadowColor={accentColor}
                    shadowOpacity={activity * 0.5}
                  />
                  {/* Drive Activity LED */}
                  <Circle 
                    x={x + s*0.18} y={y + s*0.06} 
                    radius={s*0.012} 
                    fill={'#10B981'} 
                    opacity={activity}
                  />
                </Group>
              );
            })}
            {/* SAN Controller Display */}
            <Rect 
              x={-s*0.2} y={s*0.25} width={s*0.4} height={s*0.1} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={s*0.32} 
              text="STORAGE" 
              fontSize={s*0.07} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
          </Group>
        );

      case 'network':
        return (
          <Group>
            {/* Premium Network Switch */}
            <Rect 
              x={-s*0.5} y={-s*0.25} width={s*1.0} height={s*0.5} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.25 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.25 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Beautiful Port Array 2 rows */}
            {[...Array(12)].map((_, i) => {
              const row = Math.floor(i / 6);
              const col = i % 6;
              const x = -s*0.42 + col*s*0.14;
              const y = -s*0.15 + row*s*0.18;
              const activity = 0.3 + 0.7 * Math.sin(phase * 3 + i * 0.3);
              return (
                <Group key={i}>
                  <Rect 
                    x={x} y={y} 
                    width={s*0.11} height={s*0.1} 
                    fill={'#1F2937'} 
                    cornerRadius={s*0.01}
                    stroke={accentColor}
                    strokeWidth={s*0.005}
                  />
                  {/* Port Link LED */}
                  <Circle 
                    x={x + s*0.055} y={y + s*0.02} 
                    radius={s*0.01} 
                    fill={accentColor}
                    opacity={activity}
                    shadowEnabled
                    shadowBlur={3}
                    shadowColor={accentColor}
                    shadowOpacity={activity * 0.6}
                  />
                </Group>
              );
            })}
            {/* Network Status Display */}
            <Rect 
              x={-s*0.25} y={s*0.12} width={s*0.5} height={s*0.1} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={s*0.19} 
              text="NETWORK" 
              fontSize={s*0.07} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
          </Group>
        );

      case 'aircon':
        const fanRotation = (phase / (Math.PI * 2)) * 360;
        return (
          <Group>
            {/* Premium HVAC Unit */}
            <Rect 
              x={-s*0.45} y={-s*0.4} width={s*0.9} height={s*0.8} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.4 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.4 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Beautiful Spinning Fan */}
            <Group rotation={fanRotation}>
              <Circle x={0} y={-s*0.02} radius={s*0.25} fill={'rgba(0,0,0,0.2)'} />
              {[...Array(6)].map((_, i) => {
                const angle = (i * 60) * Math.PI / 180;
                const x1 = Math.cos(angle) * s * 0.06;
                const y1 = Math.sin(angle) * s * 0.06 - s*0.02;
                const x2 = Math.cos(angle) * s * 0.23;
                const y2 = Math.sin(angle) * s * 0.23 - s*0.02;
                return (
                  <Line
                    key={i}
                    points={[x1, y1, x2, y2]}
                    stroke={accentColor}
                    strokeWidth={s*0.025}
                    lineCap="round"
                    opacity={0.8}
                    shadowEnabled
                    shadowBlur={4}
                    shadowColor={accentColor}
                  />
                );
              })}
              <Circle x={0} y={-s*0.02} radius={s*0.05} fill={accentColor} opacity={0.9} />
            </Group>
            {/* HVAC Display */}
            <Rect 
              x={-s*0.18} y={s*0.22} width={s*0.36} height={s*0.1} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={s*0.29} 
              text="HVAC" 
              fontSize={s*0.08} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
            {/* Temperature Indicators */}
            <Circle x={-s*0.35} y={s*0.05} radius={s*0.02} fill={'#67E8F9'} opacity={0.7 + 0.3 * Math.sin(phase)} />
            <Circle x={s*0.35} y={s*0.05} radius={s*0.02} fill={'#F87171'} opacity={0.7 + 0.3 * Math.sin(phase + Math.PI)} />
          </Group>
        );

      case 'ups':
        return (
          <Group>
            {/* Premium UPS Unit */}
            <Rect 
              x={-s*0.45} y={-s*0.35} width={s*0.9} height={s*0.7} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.35 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.35 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Power Modules */}
            <Rect x={-s*0.38} y={-s*0.25} width={s*0.32} height={s*0.4} fill={accentColor} cornerRadius={s*0.02} opacity={0.6} />
            <Rect x={s*0.06} y={-s*0.25} width={s*0.32} height={s*0.4} fill={accentColor} cornerRadius={s*0.02} opacity={0.6} />
            {/* UPS Display Panel */}
            <Rect 
              x={-s*0.25} y={-s*0.12} width={s*0.5} height={s*0.14} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={-s*0.03} 
              text="UPS" 
              fontSize={s*0.1} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
            {/* Power Level Indicators */}
            {[...Array(6)].map((_, i) => {
              const active = i < 4;
              const color = i < 3 ? '#10B981' : i < 5 ? '#F59E0B' : '#EF4444';
              return (
                <Rect
                  key={i}
                  x={-s*0.3 + i*s*0.1}
                  y={s*0.08}
                  width={s*0.08}
                  height={s*0.14}
                  fill={color}
                  opacity={active ? (0.7 + 0.3 * Math.sin(phase + i * 0.3)) : 0.3}
                  cornerRadius={s*0.01}
                  shadowEnabled={active}
                  shadowBlur={3}
                  shadowColor={color}
                />
              );
            })}
            {/* I/O Status LEDs */}
            <Circle x={-s*0.35} y={s*0.25} radius={s*0.025} fill={'#10B981'} opacity={0.8 + 0.2 * Math.sin(phase)} />
            <Circle x={s*0.35} y={s*0.25} radius={s*0.025} fill={'#F59E0B'} opacity={0.8 + 0.2 * Math.sin(phase + Math.PI)} />
          </Group>
        );

      case 'battery':
        return (
          <Group>
            {/* Premium Battery Cabinet */}
            <Rect 
              x={-s*0.45} y={-s*0.4} width={s*0.9} height={s*0.8} 
              fillLinearGradientStartPoint={{ x: 0, y: -s*0.4 }}
              fillLinearGradientEndPoint={{ x: 0, y: s*0.4 }}
              fillLinearGradientColorStops={[0, accentColor, 0.5, iconColor, 1, accentColor]}
              cornerRadius={s*0.06} 
              stroke={accentColor} 
              strokeWidth={s*0.015}
              opacity={0.9}
            />
            {/* Battery Cells 3x2 Grid */}
            {[...Array(6)].map((_, i) => {
              const row = Math.floor(i / 2);
              const col = i % 2;
              const x = -s*0.22 + col*s*0.26;
              const y = -s*0.25 + row*s*0.18;
              const chargeLevel = 0.7 + 0.3 * Math.sin(phase * 0.8 + i * 0.3);
              const chargeColor = chargeLevel > 0.8 ? '#10B981' : chargeLevel > 0.5 ? '#F59E0B' : '#EF4444';
              return (
                <Group key={i}>
                  {/* Battery Cell Body */}
                  <Rect 
                    x={x} y={y} 
                    width={s*0.18} height={s*0.14} 
                    fill={'#1F2937'} 
                    cornerRadius={s*0.02}
                    stroke={accentColor}
                    strokeWidth={s*0.008}
                  />
                  {/* Charge Level Bar */}
                  <Rect 
                    x={x + s*0.01} 
                    y={y + s*0.13 - chargeLevel * s*0.11} 
                    width={s*0.16} 
                    height={chargeLevel * s*0.11} 
                    fill={chargeColor} 
                    cornerRadius={s*0.01}
                    opacity={0.8}
                    shadowEnabled
                    shadowBlur={3}
                    shadowColor={chargeColor}
                  />
                  {/* Battery Terminal */}
                  <Rect x={x + s*0.07} y={y - s*0.018} width={s*0.04} height={s*0.018} fill={accentColor} cornerRadius={s*0.005} />
                </Group>
              );
            })}
            {/* Battery Status Display */}
            <Rect 
              x={-s*0.2} y={s*0.22} width={s*0.4} height={s*0.1} 
              fill={'#000000'} 
              cornerRadius={s*0.03}
              stroke={accentColor}
              strokeWidth={s*0.01}
            />
            <Text 
              x={0} y={s*0.29} 
              text="BATTERY" 
              fontSize={s*0.07} 
              fill={accentColor} 
              align="center" 
              fontFamily="Inter, system-ui"
              fontStyle="bold"
            />
            {/* Charge Lightning Indicator */}
            <Path
              data={`M -${s*0.06},${s*0.08} L ${s*0.06},${s*0.04} L -${s*0.025},${s*0.12} L ${s*0.06},${s*0.16} L -${s*0.06},${s*0.12} L ${s*0.025},${s*0.04} Z`}
              fill={accentColor}
              opacity={0.7 + 0.3 * Math.sin(phase * 2)}
              shadowEnabled
              shadowBlur={4}
              shadowColor={accentColor}
            />
          </Group>
        );

      case 'sensor':
        return (
          <Group>
            {/* Sensor housing */}
            <Rect x={-s*0.4} y={-s*0.3} width={s*0.8} height={s*0.6} fill={iconColor} cornerRadius={s*0.05} />
            {/* Display screen */}
            <Rect x={-s*0.25} y={-s*0.15} width={s*0.5} height={s*0.3} fill={accentColor} cornerRadius={s*0.02} />
            {/* Temperature reading animation */}
            <Text 
              x={0} 
              y={0} 
              text="°C" 
              fontSize={s*0.15} 
              fill={iconColor} 
              align="center" 
              fontFamily="monospace"
            />
            {/* Sensor dots */}
            <Circle x={-s*0.15} y={s*0.2} radius={s*0.03} fill={accentColor} opacity={0.8 + 0.2 * Math.sin(phase)} />
            <Circle x={0} y={s*0.2} radius={s*0.03} fill={accentColor} opacity={0.8 + 0.2 * Math.sin(phase + 0.5)} />
            <Circle x={s*0.15} y={s*0.2} radius={s*0.03} fill={accentColor} opacity={0.8 + 0.2 * Math.sin(phase + 1)} />
          </Group>
        );
    }
  };

  const haloOpacity = 0.3 + (isActive ? 0.25 * (0.5 + 0.5 * Math.sin(phase)) : 0);
  const haloScale = 1 + (isActive ? 0.06 * Math.sin(phase) : 0);
  const pulseIntensity = isActive ? 0.15 * (0.5 + 0.5 * Math.sin(phase * 1.5)) : 0;
  
  // Use neutral gold/white colors for halo to contrast with rack color
  const haloColor = theme === 'dark' ? '#FCD34D' : '#F59E0B'; // Gold
  const haloColorAlt = theme === 'dark' ? '#FFFFFF' : '#E5E7EB'; // White/Gray

  return (
    <Group x={x} y={y} listening={false}>
      {/* Enhanced outer glow ring - Gold/White for high contrast */}
      <Circle
        x={0}
        y={0}
        scaleX={haloScale + 0.1}
        scaleY={haloScale + 0.1}
        radius={size * 0.65}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={size * 0.65}
        fillRadialGradientColorStops={[
          0, `${haloColor}44`,
          0.4, `${haloColor}33`,
          0.8, `${haloColor}11`,
          1, 'rgba(0,0,0,0)'
        ]}
        opacity={haloOpacity * 0.8}
        shadowEnabled
        shadowBlur={15}
        shadowColor={haloColor}
        shadowOpacity={0.5}
      />
      
      {/* Main halo with enhanced effect - Neutral color */}
      <Circle
        x={0}
        y={0}
        scaleX={haloScale}
        scaleY={haloScale}
        radius={size * 0.55}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={size * 0.55}
        fillRadialGradientColorStops={[
          0, `${haloColorAlt}CC`,
          0.5, `${haloColorAlt}88`,
          0.8, `${haloColorAlt}44`,
          1, 'rgba(0,0,0,0)'
        ]}
        opacity={haloOpacity}
        shadowEnabled
        shadowBlur={12}
        shadowColor={haloColorAlt}
        shadowOpacity={0.7}
      />
      
      {/* Pulse ring effect - White/Gold for visibility */}
      {isActive && (
        <Circle
          x={0}
          y={0}
          radius={size * (0.7 + pulseIntensity * 0.3)}
          stroke={haloColor}
          strokeWidth={2.5}
          opacity={0.9 - pulseIntensity}
          shadowEnabled
          shadowBlur={10}
          shadowColor={haloColor}
          shadowOpacity={0.9}
        />
      )}
      
      {/* Icon background removed - no more orange/colored circle behind logo */}
      
      {renderIcon()}
    </Group>
  );
};
const InlineAirflow: React.FC<{
  start: { x: number; y: number };
  end: { x: number; y: number };
  type?: 'cold' | 'hot';
  intensity?: 'normal' | 'high';
  direction?: 'horizontal' | 'vertical';
  showPath?: boolean;
  isFromAC?: boolean;
  perfMode?: 'high' | 'low';
}> = ({ start, end, type = 'cold', intensity = 'normal', direction = 'horizontal', isFromAC = false, perfMode = 'high' }) => {
  const groupRef = useRef<any>(null);
  const mainPathRef = useRef<any>(null);
  const glowPathRef = useRef<any>(null);
  const shimmerPathRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const isHorizontal = direction === 'horizontal';
  const pathData = isHorizontal
    ? `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${start.y + (type === 'cold' ? -20 : 20)} ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} Q ${start.x + (type === 'cold' ? -20 : 20)} ${(start.y + end.y) / 2} ${end.x} ${end.y}`;
  // Note: We keep colors inline in the Path elements below to avoid redeclaration issues.
  // AC-originating lines can still use lower opacity via isFromAC checks in render.
  // use perfMode param and runtime FPS-based throttling
  const [runtimePerfLow, setRuntimePerfLow] = useState(false);
  const perf = perfMode || (runtimePerfLow ? 'low' : 'high');
  // droplet particles are back for realism (guarded by perf mode)
  let baseCount = intensity === 'high' ? 16 : 10;
  let particleCount = perf === 'low' ? Math.max(6, Math.floor(baseCount * 0.5)) : baseCount;

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    // FPS measurement for runtime throttling
    let lastTime = performance.now();
    const frameTimes: number[] = [];
    const measureFPS = (t: number) => {
      const dt = t - lastTime;
      lastTime = t;
      frameTimes.push(dt);
      if (frameTimes.length > 30) frameTimes.shift();
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / (avg || 16.67);
      return fps;
    };

    const animate = (time?: number) => {
      const now = Date.now();
      const fps = measureFPS(time || performance.now());
      // switch runtimePerfLow on sustained low FPS
      if (!runtimePerfLow && fps < 28) setRuntimePerfLow(true);
      if (runtimePerfLow && fps > 34) setRuntimePerfLow(false);
      // animate streamline dash offset and shimmer
  const baseSpeed = perf === 'low' ? 1.1 : 2.2; // slightly faster for clearer motion
  const dashSpeed = baseSpeed * (isFromAC ? 1.35 : 1); // AC flows move a touch faster
      try {
        if (mainPathRef.current) {
          const prev = mainPathRef.current.dashOffset() || 0;
          mainPathRef.current.dashOffset((prev - dashSpeed) % 10000);
        }
        if (shimmerPathRef.current) {
          const prev2 = shimmerPathRef.current.dashOffset() || 0;
          shimmerPathRef.current.dashOffset((prev2 - dashSpeed * 1.6) % 10000);
          const base = type === 'cold' ? (isFromAC ? 0.3 : 0.24) : 0.25;
          const amp = type === 'cold' ? 0.12 : 0.1;
          shimmerPathRef.current.opacity(base + amp * (0.5 + 0.5 * Math.sin(now * 0.002)));
        }
      } catch {}
      // update droplet particles along the path (only elements tagged as 'droplet')
      const children = node.getChildren ? node.getChildren() : [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.className === 'Circle' && child.name && child.name() === 'droplet') {
          const timeScale = (perf === 'low' ? 1.0 : 1.5) * (isFromAC ? 1.2 : 1.0); // AC droplets slightly faster
          const t = ((now * 0.001 * timeScale) + i * 0.25) % 1;
          const progress = t;
          const jitterAmp = type === 'cold' ? (isFromAC ? 0.45 : 0.6) : 1.0; // AC even steadier
          const nx = start.x + (end.x - start.x) * progress + Math.sin(now * 0.001 * 1.1 + i) * jitterAmp;
          const ny = start.y + (end.y - start.y) * progress + Math.cos(now * 0.001 * 1.0 + i) * (jitterAmp * 0.6);
          try {
            child.x(nx);
            child.y(ny);
            child.opacity(0.75 + 0.25 * (1 - progress));
            const sizeBase = type === 'cold' ? 2.0 : 2.0;
            child.radius(sizeBase + (i % 3) * 0.5);
          } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [start.x, start.y, end.x, end.y, type, isFromAC, perf, particleCount]);

  return (
    <Group ref={groupRef}>
      {/* Streamline glow path for realistic airflow ribbon */}
      <Path
        ref={glowPathRef}
        data={pathData}
        stroke={type === 'cold'
          ? (isFromAC ? 'rgba(20,184,166,0.22)' : 'rgba(34,211,238,0.28)')
          : 'rgba(239,68,68,0.30)'}
        strokeWidth={intensity === 'high' ? (isFromAC && type==='cold' ? 6 : 7) : (isFromAC && type==='cold' ? 4.5 : 5)}
        shadowEnabled
        shadowBlur={type === 'cold' ? 16 : 14}
  shadowColor={type === 'cold' ? (isFromAC ? '#14B8A6' : '#22D3EE') : '#EF4444'}
        shadowOpacity={0.5}
        opacity={isFromAC ? 0.55 : 0.4}
        lineCap="round"
      />
      {/* Main streamline with animated dash */}
      <Path
        ref={mainPathRef}
        data={pathData}
        stroke={type === 'cold'
          ? (isFromAC ? 'rgba(20,184,166,0.95)' : 'rgba(34,211,238,0.92)')
          : 'rgba(248,113,113,0.9)'}
        strokeWidth={intensity === 'high' ? 3 : 2}
        dash={isFromAC && type==='cold' ? [4, 7] : [12, 10]}
        dashOffset={0}
        lineCap="round"
        opacity={0.9}
      />
      {/* Shimmer line for added realism */}
      <Path
        ref={shimmerPathRef}
        data={pathData}
        stroke={type === 'cold'
          ? (isFromAC ? 'rgba(153,246,228,0.95)' : 'rgba(165,243,252,0.95)')
          : 'rgba(254,226,226,0.9)'}
        strokeWidth={isFromAC && type==='cold' ? 1.2 : 1.5}
        dash={isFromAC && type==='cold' ? [5, 16] : [12, 22]}
        dashOffset={0}
        lineCap="round"
        opacity={type === 'cold' ? (isFromAC ? 0.35 : 0.3) : 0.3}
      />
      {/* Droplet particles for realism */}
      {[...Array(particleCount)].map((_, i) => (
        <Circle
          key={i}
          name="droplet"
          x={start.x}
          y={start.y}
          radius={type === 'cold' ? 2.0 : 2.0}
          fill={type === 'cold' 
            ? (isFromAC ? (i % 2 === 0 ? '#99F6E4' : '#14B8A6') : (i % 2 === 0 ? '#A5F3FC' : '#22D3EE'))
            : (i % 2 === 0 ? '#FDBA74' : '#FB923C')}
          opacity={type === 'cold' ? (isFromAC ? 0.92 : 0.88) : 0.9}
          shadowEnabled
          shadowColor={type === 'cold' ? (isFromAC ? '#14B8A6' : '#22D3EE') : '#EF4444'}
          shadowBlur={6}
          shadowOpacity={0.6}
        />
      ))}
    </Group>
  );
};

// Small component that uses Konva shapes and animates via an internal RAF-driven tick
const AisleParticles: React.FC<{
  columns: Array<{ x: number }>; // x positions for columns (absolute canvas coords)
  y: number;
  countPerColumn?: number;
}> = ({ columns, y, countPerColumn = 3 }) => {
  const [, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      setTick(Date.now()); // force re-render so Date.now() values change in render
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {columns.map((col, cIdx) => (
        <Group key={`aisle-col-${cIdx}`}>
          {Array.from({ length: countPerColumn }).map((_, i) => (
            <Circle
              key={`aisle-p-${cIdx}-${i}`}
              x={col.x + (i - Math.floor(countPerColumn / 2)) * 8}
              y={
                y +
                Math.sin((Date.now() * 0.001) * (0.06 + i * 0.01) + cIdx * 0.6) *
                  (12 + i * 3)
              }
              radius={2 + (i % 2)}
              fill={'rgba(96,165,250,0.62)'}
              opacity={0.85 - i * 0.18}
              shadowEnabled
              shadowBlur={6}
              shadowColor={'rgba(96,165,250,0.48)'}
            />
          ))}
        </Group>
      ))}
    </>
  );
};

// Modern rack data structure - Updated to match API response
interface ModernRack {
  id: string;
  label: string;
  name: string;
  equipment_name: string;
  equipment_id: string;
  type: 'server' | 'storage' | 'network' | 'aircon' | 'ups' | 'battery' | 'sensor';
  position: { x: number; y: number };
  temperature: number | null;
  humidity: number | null;
  power: number | null;
  status: 'healthy' | 'warning' | 'critical' | 'no_data';
  powerUsage: number;
  isActive: boolean;
  last_updated: string | null;
}

// Modern Professional Rack Component
const ModernRackUnit: React.FC<{
  rack: ModernRack;
  theme: string;
  onSelect: (id: string) => void;
  isSelected: boolean;
  showEffects: boolean;
  perfMode?: 'high' | 'low';
  showFans?: boolean;
  siteTag: 'DC' | 'DR';
  isRowB: boolean;
}> = ({ rack, theme, onSelect, isSelected, showEffects, perfMode = 'high', showFans = true, siteTag, isRowB }) => {
  const [pulseRadius, setPulseRadius] = useState(15);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPhase, setHoverPhase] = useState(0);
  const animationRef = useRef<number>();
  const hoverAnimationRef = useRef<number>();
  
  const isDark = theme === 'dark';
  const width = 150;   // increased rack width
  const height = 210;  // increased rack height
  
  const getTypeColor = () => {
    // Premium color schemes with beautiful gradients and glow effects
    const lightGradients = {
      server: { 
        primary: '#1E40AF', secondary: '#2563EB', tertiary: '#3B82F6', quaternary: '#60A5FA',
        accent: '#3B82F6', glow: '#93C5FD', shadow: '#1E3A8A',
        badge: '#2563EB', badgeText: '#FFFFFF'
      },
      storage: { 
        primary: '#7C3AED', secondary: '#8B5CF6', tertiary: '#A78BFA', quaternary: '#C4B5FD',
        accent: '#8B5CF6', glow: '#C4B5FD', shadow: '#6B21A8',
        badge: '#7C3AED', badgeText: '#FFFFFF'
      }, 
      network: { 
        primary: '#059669', secondary: '#10B981', tertiary: '#34D399', quaternary: '#6EE7B7',
        accent: '#10B981', glow: '#6EE7B7', shadow: '#047857',
        badge: '#059669', badgeText: '#FFFFFF'
      },
      aircon: { 
        primary: '#0284C7', secondary: '#0EA5E9', tertiary: '#38BDF8', quaternary: '#7DD3FC',
        accent: '#0EA5E9', glow: '#7DD3FC', shadow: '#0369A1',
        badge: '#0284C7', badgeText: '#FFFFFF'
      },
      ups: { 
        primary: '#D97706', secondary: '#F59E0B', tertiary: '#FBBF24', quaternary: '#FCD34D',
        accent: '#F59E0B', glow: '#FDE047', shadow: '#B45309',
        badge: '#D97706', badgeText: '#FFFFFF'
      },
      battery: { 
        primary: '#DC2626', secondary: '#EF4444', tertiary: '#F87171', quaternary: '#FCA5A5',
        accent: '#EF4444', glow: '#FCA5A5', shadow: '#991B1B',
        badge: '#DC2626', badgeText: '#FFFFFF'
      },
      sensor: { 
        primary: '#7C3AED', secondary: '#8B5CF6', tertiary: '#A78BFA', quaternary: '#C4B5FD',
        accent: '#8B5CF6', glow: '#C4B5FD', shadow: '#6B21A8',
        badge: '#7C3AED', badgeText: '#FFFFFF'
      }
    };
    
    const darkGradients = {
      server: { 
        primary: '#2563EB', secondary: '#3B82F6', tertiary: '#60A5FA', quaternary: '#93C5FD',
        accent: '#3B82F6', glow: '#93C5FD', shadow: '#1E40AF',
        badge: '#3B82F6', badgeText: '#FFFFFF'
      },
      storage: { 
        primary: '#8B5CF6', secondary: '#A78BFA', tertiary: '#C4B5FD', quaternary: '#DDD6FE',
        accent: '#A78BFA', glow: '#DDD6FE', shadow: '#7C3AED',
        badge: '#8B5CF6', badgeText: '#FFFFFF'
      }, 
      network: { 
        primary: '#10B981', secondary: '#34D399', tertiary: '#6EE7B7', quaternary: '#A7F3D0',
        accent: '#34D399', glow: '#A7F3D0', shadow: '#059669',
        badge: '#10B981', badgeText: '#FFFFFF'
      },
      aircon: { 
        primary: '#0EA5E9', secondary: '#38BDF8', tertiary: '#7DD3FC', quaternary: '#BAE6FD',
        accent: '#38BDF8', glow: '#BAE6FD', shadow: '#0284C7',
        badge: '#0EA5E9', badgeText: '#FFFFFF'
      },
      ups: { 
        primary: '#F59E0B', secondary: '#FBBF24', tertiary: '#FCD34D', quaternary: '#FDE68A',
        accent: '#FBBF24', glow: '#FDE68A', shadow: '#D97706',
        badge: '#F59E0B', badgeText: '#1F2937'
      },
      battery: { 
        primary: '#EF4444', secondary: '#F87171', tertiary: '#FCA5A5', quaternary: '#FECACA',
        accent: '#F87171', glow: '#FECACA', shadow: '#DC2626',
        badge: '#EF4444', badgeText: '#FFFFFF'
      },
      sensor: { 
        primary: '#8B5CF6', secondary: '#A78BFA', tertiary: '#C4B5FD', quaternary: '#DDD6FE',
        accent: '#A78BFA', glow: '#DDD6FE', shadow: '#7C3AED',
        badge: '#8B5CF6', badgeText: '#FFFFFF'
      }
    };
    
    return isDark ? darkGradients[rack.type] : lightGradients[rack.type];
  };

  const getPrimaryColor = () => getTypeColor().primary;

  const getAccentColor = () => {
    const colors = getTypeColor();
    return colors.accent;
  };

  const getSymbolColor = () => {
    // Light colors optimized for icon visibility on dark backgrounds
    const symbols = {
      server: '#E0F2FE',
      storage: '#F3E8FF',
      network: '#D1FAE5',
      aircon: '#CFFAFE',
      ups: '#FEF3C7',
      battery: '#FEE2E2',
      sensor: '#EDE9FE'
    };
    return symbols[rack.type];
  };

  const getStatusColor = () => {
    switch (rack.status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Helper function to get temperature color
  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return '#22D3EE'; // cold - cyan
    if (temp < 25) return '#10B981'; // normal - green
    if (temp < 30) return '#F59E0B'; // warm - yellow
    return '#EF4444'; // hot - red
  };

  // Power usage normalization by type for right-side bar visualization
  const getPowerMax = () => {
    switch (rack.type) {
      case 'aircon': return 3000;
      case 'ups': return 2000;
      case 'storage': return 800;
      case 'server': return 700;
      case 'network': return 300;
      case 'battery': return 200;
      case 'sensor': return 50;
      default: return 500;
    }
  };

  const getTypeIcon = () => {
    const iconPaths = {
      server: 'M3 7v10c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1zm2 2h14v2H5V9zm0 4h14v2H5v-2z',
      storage: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm0 4H9v-2h10v2z',
      network: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
      aircon: 'M22 11h-4.17l3.24-3.24-1.41-1.42L15.83 10H13V7.17l3.24-3.24-1.42-1.41L11 6.34V2H9v4.34L5.18 2.52 3.76 3.94 7 7.17V10H4.17L.93 6.76 2.34 5.34 6.17 9.17H2v2h4.17L2.93 14.41l1.41 1.42L7.17 13H10v2.83l-3.24 3.24 1.42 1.42L12 17.66V22h2v-4.34l3.82 3.82 1.42-1.42L16 16.83V13h2.83l3.24 3.24 1.42-1.42L19.83 11H22z',
      ups: 'M15.67 4H14V2c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v2H6.33C5.6 4 5 4.6 5 5.33v15.33C5 21.4 5.6 22 6.33 22h9.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18H9v-2h4v2zm1-4H8v-2h6v2zm0-4H8V8h6v2z',
      battery: 'M15.67 4H14V2c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C16 4.6 15.4 4 14.67 4z',
      sensor: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    };
    return iconPaths[rack.type];
  };

  // Display name mapping by site/row/position based on user specification
  const getHeaderDisplayName = () => {
    const site = siteTag; // 'DC' | 'DR'
    const rowMatch = rack.label.match(/^([A-Z])(\d+)/i);
    const row = rowMatch ? (rowMatch[1].toUpperCase() as 'A' | 'B') : 'A';
    const pos = rowMatch ? parseInt(rowMatch[2], 10) : 1;

    const map: Record<'DC'|'DR', Record<'A'|'B', Record<number, string>>> = {
      DC: {
        A: {
          1: 'IT1',
          2: 'IT2',
          3: 'IT3',
          4: 'Air Con3',
          5: 'IT4',
          6: 'IT5',
          7: 'Network1',
          8: 'Network2',
        },
        B: {
          1: 'IT6',
          2: 'IT7',
          3: 'Air Con2',
          4: 'IT8',
          5: 'IT9',
          6: 'Air Con1',
          7: 'IT10',
          8: 'Network3',
        },
      },
      DR: {
        A: {
          1: 'Network3',
          2: 'IT5',
          3: 'IT4',
          4: 'Air Con2',
          5: 'Battery',
          6: 'UPS',
        },
        B: {
          1: 'Network1',
          2: 'Network2',
          3: 'IT3',
          4: 'Air Con1',
          5: 'IT2',
          6: 'IT1',
        },
      },
    };

    const name = map[site]?.[row]?.[pos];
    if (name) return name;
    // Fallback to original equipment name if mapping not found
    return rack.equipment_name || rack.name || rack.label;
  };

  useEffect(() => {
    if (!showEffects || !rack.isActive) return;
    
    const animate = () => {
      setPulseRadius(prev => {
        const newRadius = prev + 0.8;
        return newRadius > 35 ? 15 : newRadius;
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
  }, [showEffects, rack.isActive]);

  // Hover animation effect
  useEffect(() => {
    if (!isHovered) return;
    
    let mounted = true;
    const animateHover = () => {
      if (!mounted) return;
      setHoverPhase(prev => (prev + 0.08) % (Math.PI * 2));
      hoverAnimationRef.current = requestAnimationFrame(animateHover);
    };
    
    hoverAnimationRef.current = requestAnimationFrame(animateHover);
    
    return () => {
      mounted = false;
      if (hoverAnimationRef.current) {
        cancelAnimationFrame(hoverAnimationRef.current);
      }
    };
  }, [isHovered]);

  // Enhanced hover effects
  const hoverScale = isHovered ? 1.02 : 1;
  const hoverGlow = isHovered ? 0.3 + 0.1 * Math.sin(hoverPhase) : 0;
  const hoverShadowBlur = isHovered ? 25 + 5 * Math.sin(hoverPhase) : (isSelected ? 20 : 12);

  return (
    <Group
      x={rack.position.x}
      y={rack.position.y}
      scaleX={hoverScale}
      scaleY={hoverScale}
      onClick={() => onSelect(rack.id)}
      onTap={() => onSelect(rack.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced hover glow effect */}
      {isHovered && (
        <Rect
          width={width + 8}
          height={height + 8}
          x={-4}
          y={-4}
          fillRadialGradientStartPoint={{ x: width/2, y: height/2 }}
          fillRadialGradientEndPoint={{ x: width/2, y: height/2 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={(width + height) / 3}
          fillRadialGradientColorStops={[
            0, `${getTypeColor().accent}44`,
            0.5, `${getTypeColor().accent}22`,
            1, 'rgba(0,0,0,0)'
          ]}
          cornerRadius={16}
          opacity={hoverGlow}
        />
      )}

      {/* MUI-inspired elevation shadow layer (dp24) */}
      <Rect
        width={width}
        height={height}
        fillRadialGradientStartPoint={{ x: width/2, y: height * 0.3 }}
        fillRadialGradientEndPoint={{ x: width/2, y: height * 0.3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={Math.max(width, height) * 0.8}
        fillRadialGradientColorStops={[
          0, 'rgba(0,0,0,0)',
          0.7, 'rgba(0,0,0,0.05)',
          1, 'rgba(0,0,0,0.25)'
        ]}
        cornerRadius={16}
        opacity={isHovered ? 1 : 0.7}
      />

      {/* Enhanced Modern rack body with beautiful vertical gradients + glass morphism */}
      <Rect
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: height }}
        fillLinearGradientColorStops={[
          0, getTypeColor().primary,    // Dark top
          0.15, getTypeColor().secondary, // Transition
          0.85, getTypeColor().secondary, // Middle section
          1, getTypeColor().tertiary     // Light bottom
        ]}
        stroke={isSelected ? getTypeColor().accent : (isHovered ? `${getTypeColor().accent}DD` : 'rgba(255,255,255,0.15)')}
        strokeWidth={isSelected ? 4 : (isHovered ? 3 : 1.5)}
        cornerRadius={16} // MUI Paper-like rounded corners
        shadowEnabled={true}
        shadowBlur={hoverShadowBlur}
        shadowColor={isHovered ? getTypeColor().accent : (isSelected ? getTypeColor().accent : 'rgba(0,0,0,0.5)')}
        shadowOpacity={isSelected ? 0.9 : (isHovered ? 0.7 : 0.5)}
        shadowOffset={{ x: isHovered ? 0 : 2, y: isHovered ? 8 : 6 }} // MUI elevation effect
      />

      {/* Glass morphism overlay (frosted glass effect) */}
      <Rect
        width={width}
        height={height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: width, y: height }}
        fillLinearGradientColorStops={[
          0, 'rgba(255, 255, 255, 0.18)',
          0.3, 'rgba(255, 255, 255, 0.08)',
          0.7, 'rgba(255, 255, 255, 0.05)',
          1, 'rgba(255, 255, 255, 0.12)'
        ]}
        cornerRadius={16}
        opacity={0.6}
      />

      {/* Inner border for glass effect depth */}
      <Rect
        width={width - 4}
        height={height - 4}
        x={2}
        y={2}
        stroke={'rgba(255, 255, 255, 0.25)'}
        strokeWidth={1}
        cornerRadius={14}
        opacity={0.7}
      />
      
      {/* Enhanced side PDUs with ultra-modern design and beautiful LED indicators */}
      <Group>
        {/* Left PDU with premium gradient and lighting effects */}
        <Rect 
          x={4} 
          y={16} 
          width={12} 
          height={height - 32} 
          fillLinearGradientStartPoint={{ x: 4, y: 16 }}
          fillLinearGradientEndPoint={{ x: 16, y: 16 }}
          fillLinearGradientColorStops={[
            0, '#1F2937',
            0.3, '#374151',
            0.7, '#4B5563',
            1, '#6B7280'
          ]}
          cornerRadius={6}
          shadowEnabled
          shadowBlur={8}
          shadowColor="rgba(0,0,0,0.7)"
          shadowOpacity={0.9}
          shadowOffset={{ x: 2, y: 2 }}
        />
        
        {/* Beautiful Running LED Strip - Left Side (Centered) */}
        <Group>
          {Array.from({ length: 10 }).map((_, i) => {
            // Enhanced running light effect with smoother animation
            const runningProgress = ((hoverPhase * 3) - i * 0.5) % (Math.PI * 2);
            const brightness = Math.max(0.2, 0.8 * Math.pow((0.5 + 0.5 * Math.sin(runningProgress)), 2));
            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
            const colorIndex = Math.floor((hoverPhase * 2 + i * 0.3)) % colors.length;
            const color = colors[colorIndex];
            
            return (
              <Circle
                key={`left-led-${i}`}
                x={8}  // Centered in the 12px wide strip
                y={30 + i * (height - 60) / 10}  // Evenly distributed
                radius={3.5}
                fill={color}
                opacity={brightness}
                shadowEnabled
                shadowBlur={15}
                shadowColor={color}
                shadowOpacity={brightness * 0.9}
              />
            );
          })}
        </Group>
        
        {/* Right PDU with premium gradient and lighting effects */}
        <Rect 
          x={width - 16} 
          y={16} 
          width={12} 
          height={height - 32} 
          fillLinearGradientStartPoint={{ x: width - 16, y: 16 }}
          fillLinearGradientEndPoint={{ x: width - 4, y: 16 }}
          fillLinearGradientColorStops={[
            0, '#6B7280',
            0.3, '#4B5563',
            0.7, '#374151',
            1, '#1F2937'
          ]}
          cornerRadius={6}
          shadowEnabled
          shadowBlur={8}
          shadowColor="rgba(0,0,0,0.7)"
          shadowOpacity={0.9}
          shadowOffset={{ x: -2, y: 2 }}
        />
        
        {/* Beautiful Running LED Strip - Right Side (Centered) */}
        <Group>
          {Array.from({ length: 10 }).map((_, i) => {
            // Enhanced running light effect with phase offset for wave pattern
            const runningProgress = ((hoverPhase * 3) - i * 0.5 + Math.PI) % (Math.PI * 2);
            const brightness = Math.max(0.2, 0.8 * Math.pow((0.5 + 0.5 * Math.sin(runningProgress)), 2));
            const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
            const colorIndex = Math.floor((hoverPhase * 2 + i * 0.3)) % colors.length;
            const color = colors[colorIndex];
            
            return (
              <Circle
                key={`right-led-${i}`}
                x={width - 8}  // Centered in the 12px wide strip
                y={30 + i * (height - 60) / 10}  // Evenly distributed
                radius={3.5}
                fill={color}
                opacity={brightness}
                shadowEnabled
                shadowBlur={15}
                shadowColor={color}
                shadowOpacity={brightness * 0.9}
              />
            );
          })}
        </Group>
      </Group>

      {/* Simplified top ventilation - only for active equipment */}
      {(['server', 'network', 'storage', 'aircon'].includes(rack.type)) && rack.isActive && (
        <Group>
          {Array.from({ length: 4 }).map((_, i) => (
            <Circle
              key={`vent-${i}`}
              x={30 + i * 25}
              y={40}
              radius={2.5}
              stroke={'rgba(255,255,255,0.5)'}
              strokeWidth={1}
              fill={'rgba(0,0,0,0.3)'}
              opacity={0.7}
            />
          ))}
        </Group>
      )}

      {/* Simplified decorative front mesh - reduced */}
      <Group opacity={0.1}>
        {Array.from({ length: 3 }).map((_, row) => (
          Array.from({ length: 4 }).map((_, col) => (
            <Circle
              key={`mesh-${row}-${col}`}
              x={35 + col * 25}
              y={90 + row * 25}
              radius={1.5}
              fill={'rgba(0,0,0,0.4)'}
            />
          ))
        ))}
      </Group>

      {/* Simplified cable management - only for network/server types */}
      {(['server', 'network', 'storage'].includes(rack.type)) && (
        <Path
          data={`M ${width - 15},${height * 0.35} L ${width - 15},${height * 0.65}`}
          stroke={getTypeColor().accent}
          strokeWidth={2}
          opacity={0.5}
          lineCap="round"
        />
      )}

      {/* Subtle depth effect */}
      <Rect
        width={width - 6}
        height={height - 6}
        x={3}
        y={3}
        fill={getAccentColor()}
        cornerRadius={12}
        opacity={0.08}
      />
      
      {/* Minimal glass overlay */}
      <Rect
        width={width}
        height={height * 0.25}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: height * 0.25 }}
        fillLinearGradientColorStops={[
          0, 'rgba(255, 255, 255, 0.12)',
          1, 'rgba(255, 255, 255, 0.03)'
        ]}
        cornerRadius={16}
      />
      
      {/* Modern gradient name pill with sheen (show rack equipment name) */}
      {(() => {
        const barX = Math.round(width * 0.08);
        const barY = Math.round(height * 0.08);
        const barW = Math.round(width * 0.84);
        const barH = 28;
        return (
          <Group>
            <Rect
              x={barX}
              y={barY}
              width={barW}
              height={barH}
              cornerRadius={barH / 2}
              fillLinearGradientStartPoint={{ x: barX, y: barY }}
              fillLinearGradientEndPoint={{ x: barX + barW, y: barY }}
              fillLinearGradientColorStops={
                theme === 'dark'
                  ? [0, 'rgba(255,255,255,0.20)', 1, 'rgba(255,255,255,0.08)']
                  : [0, 'rgba(255,255,255,0.85)', 1, 'rgba(255,255,255,0.55)']
              }
              stroke={theme === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.10)'}
              strokeWidth={1}
              shadowEnabled
              shadowBlur={12}
              shadowColor={theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.25)'}
              shadowOpacity={0.5}
            />
            {/* Sheen highlight */}
            <Rect
              x={barX + 2}
              y={barY + 2}
              width={barW - 4}
              height={Math.max(10, Math.round(barH * 0.55))}
              cornerRadius={(barH - 4) / 2}
              fillLinearGradientStartPoint={{ x: 0, y: barY + 2 }}
              fillLinearGradientEndPoint={{ x: 0, y: barY + 2 + Math.max(10, Math.round(barH * 0.55)) }}
              fillLinearGradientColorStops={[0, 'rgba(255,255,255,0.35)', 1, 'rgba(255,255,255,0.0)']}
              strokeEnabled={false}
              opacity={theme === 'dark' ? 0.6 : 0.8}
            />
            <Text
              x={0}
              y={barY + 6}
              width={width}
              text={getHeaderDisplayName()}
              fontSize={15}
              letterSpacing={0.5}
              fontFamily="Inter, Arial"
              fill={theme === 'dark' ? '#F9FAFB' : '#0F172A'}
              fontStyle="bold"
              align="center"
              shadowEnabled
              shadowBlur={2}
              shadowColor={theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)'}
              shadowOpacity={0.6}
            />
          </Group>
        );
      })()}

      {/* Equipment Name hidden per request */}
      {/* Intentionally not rendering rack.equipment_name on rack body */}

      {/* Modern Temperature & Humidity Display with Beautiful Icons */}
      {(['server', 'network', 'storage', 'aircon'].includes(rack.type)) && (rack.temperature !== null || rack.humidity !== null) && (
        (() => {
          const hasTemp = rack.temperature !== null;
          const hasHum = rack.humidity !== null;
          const temp = rack.temperature ?? 0;
          const hum = rack.humidity ?? 0;
          const tempColor = getTemperatureColor(temp);
          const humColor = hum < 30 ? '#DC2626' : hum < 70 ? '#10B981' : '#F59E0B';

          const cardW = width - 12;
          const itemH = 26;
          const spacing = 3;
          const cardH = hasTemp && hasHum ? (itemH * 2 + spacing + 12) : (itemH + 8);
          const cardX = 6;
          const cardY = height - cardH - 6;

          return (
            <Group>
              {/* Enhanced Multi-Layer Card Design for Prominence */}
              
              {/* Outer glow layer for depth */}
              <Rect
                x={cardX - 2}
                y={cardY - 2}
                width={cardW + 4}
                height={cardH + 4}
                cornerRadius={16}
                fill={'transparent'}
                stroke={theme === 'dark' ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)'}
                strokeWidth={2}
                shadowEnabled
                shadowBlur={20}
                shadowColor={theme === 'dark' ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.4)'}
                shadowOpacity={0.8}
                shadowOffset={{ x: 0, y: 0 }}
              />
              
              {/* Main Card Background with Gradient */}
              <Rect
                x={cardX}
                y={cardY}
                width={cardW}
                height={cardH}
                cornerRadius={14}
                fillLinearGradientStartPoint={{ x: cardX, y: cardY }}
                fillLinearGradientEndPoint={{ x: cardX, y: cardY + cardH }}
                fillLinearGradientColorStops={
                  theme === 'dark' 
                    ? [0, 'rgba(30, 41, 59, 0.95)', 0.5, 'rgba(51, 65, 85, 0.95)', 1, 'rgba(30, 41, 59, 0.95)']
                    : [0, 'rgba(255, 255, 255, 0.98)', 0.5, 'rgba(248, 250, 252, 0.98)', 1, 'rgba(255, 255, 255, 0.98)']
                }
                stroke={theme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(226, 232, 240, 0.9)'}
                strokeWidth={2}
                shadowEnabled
                shadowBlur={16}
                shadowColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.2)'}
                shadowOpacity={0.5}
                shadowOffset={{ x: 0, y: 4 }}
              />

              {/* Temperature Section */}
              {hasTemp && (
                <Group>
                  {/* Enhanced Thermometer Icon with More Detail */}
                  <Group x={cardX + 8} y={cardY + 7}>
                    {/* Thermometer bulb with gradient */}
                    <Circle
                      x={1.5} y={11} radius={5.5}
                      fillRadialGradientStartPoint={{ x: 1.5, y: 11 }}
                      fillRadialGradientEndPoint={{ x: 1.5, y: 11 }}
                      fillRadialGradientStartRadius={0}
                      fillRadialGradientEndRadius={5.5}
                      fillRadialGradientColorStops={[0, '#FF6B6B', 0.6, '#EF4444', 1, '#DC2626']}
                      shadowEnabled
                      shadowBlur={8}
                      shadowColor={'#EF4444'}
                      shadowOpacity={0.6}
                    />
                    {/* Thermometer tube */}
                    <Rect
                      x={-0.5} y={0} width={4} height={11}
                      cornerRadius={2}
                      fill={'#EF4444'}
                      opacity={0.95}
                    />
                    {/* Mercury indicator */}
                    <Rect
                      x={0.5} y={4} width={2} height={7}
                      fill={'#FFFFFF'}
                      opacity={0.8}
                    />
                    {/* Temperature marks */}
                    <Line
                      points={[4, 3, 6, 3]}
                      stroke={'#FFFFFF'}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                    <Line
                      points={[4, 6, 6, 6]}
                      stroke={'#FFFFFF'}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                    <Line
                      points={[4, 9, 6, 9]}
                      stroke={'#FFFFFF'}
                      strokeWidth={1}
                      opacity={0.7}
                    />
                  </Group>
                  
                  {/* Temperature Value with Enhanced Typography */}
                  <Text 
                    x={cardX + 28} 
                    y={cardY + 8} 
                    text={`${temp.toFixed(1)}°C`} 
                    fontSize={14} 
                    fontFamily="'SF Pro Display', 'Segoe UI', 'Inter', system-ui" 
                    fontStyle="700"
                    fill={theme === 'dark' ? '#F1F5F9' : '#0F172A'}
                    shadowEnabled
                    shadowBlur={2}
                    shadowColor={theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'}
                    shadowOpacity={0.8}
                  />
                  
                  {/* Enhanced Status Indicator with Glow */}
                  <Circle
                    x={cardX + cardW - 14}
                    y={cardY + 13}
                    radius={7}
                    fill={temp < 18 ? '#10B981' : temp < 25 ? '#10B981' : temp < 30 ? '#F59E0B' : '#EF4444'}
                    shadowEnabled
                    shadowBlur={12}
                    shadowColor={temp < 18 ? '#10B981' : temp < 25 ? '#10B981' : temp < 30 ? '#F59E0B' : '#EF4444'}
                    shadowOpacity={0.8}
                  />
                  <Circle
                    x={cardX + cardW - 14}
                    y={cardY + 13}
                    radius={5}
                    fill={temp < 18 ? '#34D399' : temp < 25 ? '#34D399' : temp < 30 ? '#FBBF24' : '#F87171'}
                    opacity={0.8}
                  />
                </Group>
              )}

              {/* Humidity Section */}
              {hasHum && (
                <Group>
                  {/* Enhanced Water Droplet Icon with Gradient */}
                  <Group x={cardX + 8} y={cardY + (hasTemp ? itemH + spacing + 7 : 7)}>
                    <Path
                      data="M 1.5 0 C 0.5 2, -0.5 4, 0 7 C 0 9.5, 3 9.5, 3 7 C 3.5 4, 2.5 2, 1.5 0 Z"
                      fillLinearGradientStartPoint={{ x: 1.5, y: 0 }}
                      fillLinearGradientEndPoint={{ x: 1.5, y: 9.5 }}
                      fillLinearGradientColorStops={[0, '#60A5FA', 0.5, '#3B82F6', 1, '#2563EB']}
                      scale={{ x: 2.2, y: 2.2 }}
                      shadowEnabled
                      shadowBlur={8}
                      shadowColor={'#3B82F6'}
                      shadowOpacity={0.6}
                    />
                    {/* Highlight on droplet */}
                    <Circle
                      x={2} y={6} radius={2}
                      fill={'rgba(255, 255, 255, 0.9)'}
                      opacity={0.7}
                    />
                  </Group>
                  
                  {/* Humidity Value with Enhanced Typography */}
                  <Text 
                    x={cardX + 28} 
                    y={cardY + (hasTemp ? itemH + spacing + 8 : 8)} 
                    text={`${hum.toFixed(0)}%`} 
                    fontSize={14} 
                    fontFamily="'SF Pro Display', 'Segoe UI', 'Inter', system-ui" 
                    fontStyle="700"
                    fill={theme === 'dark' ? '#F1F5F9' : '#0F172A'}
                    shadowEnabled
                    shadowBlur={2}
                    shadowColor={theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)'}
                    shadowOpacity={0.8}
                  />
                  
                  {/* Enhanced Status Indicator with Glow */}
                  <Circle
                    x={cardX + cardW - 14}
                    y={cardY + (hasTemp ? itemH + spacing + 13 : 13)}
                    radius={7}
                    fill={hum < 30 ? '#EF4444' : hum < 70 ? '#10B981' : '#F59E0B'}
                    shadowEnabled
                    shadowBlur={12}
                    shadowColor={hum < 30 ? '#EF4444' : hum < 70 ? '#10B981' : '#F59E0B'}
                    shadowOpacity={0.8}
                  />
                  <Circle
                    x={cardX + cardW - 14}
                    y={cardY + (hasTemp ? itemH + spacing + 13 : 13)}
                    radius={5}
                    fill={hum < 30 ? '#F87171' : hum < 70 ? '#34D399' : '#FBBF24'}
                    opacity={0.8}
                  />
                </Group>
              )}
            </Group>
          );
        })()
      )}

      {/* Status Indicator */}
      <Circle
        x={width - 20}
        y={20}
        radius={6}
        fill={getStatusColor()}
        shadowEnabled
        shadowBlur={8}
        shadowColor={getStatusColor()}
        shadowOpacity={0.6}
      />

      {/* Position chip (A1/B1) - bottom-right, red theme */}
      <Group x={width - 10 - 40} y={height - 10 - 22}>
        <Rect
          width={40}
          height={22}
          cornerRadius={11}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 40, y: 0 }}
          fillLinearGradientColorStops={[0, '#EF4444', 1, '#B91C1C']}
          stroke={'#7F1D1D'}
          strokeWidth={1}
          shadowEnabled
          shadowBlur={8}
          shadowColor={'rgba(239,68,68,0.7)'}
          shadowOpacity={0.8}
        />
        <Text
          x={0}
          y={4}
          width={40}
          text={`${rack.label}`}
          fontSize={12}
          fontFamily="Inter, Arial"
          fill={'#FFFFFF'}
          align="center"
          fontStyle="bold"
        />
      </Group>
      
      
      {/* Decorative gradient strip below name bar (kept minimal) */}
      <Rect
        x={Math.round(width*0.08)}
        y={Math.round(height*0.08) + 32}
        width={Math.round(width*0.84)}
        height={4}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: Math.round(width*0.84), y: 0 }}
        fillLinearGradientColorStops={[
          0, theme === 'dark' ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.45)',
          1, theme === 'dark' ? 'rgba(147,51,234,0.25)' : 'rgba(147,51,234,0.45)'
        ]}
        cornerRadius={2}
        opacity={0.9}
      />

      {/* Enhanced Professional animated rack icon with beautiful colors and effects */}
      <Group x={width / 2} y={height / 2 + 10}>
        {/* Icon background with glow effect */}
        <Circle
          x={0}
          y={0}
          radius={Math.min(width, height) * 0.35}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={Math.min(width, height) * 0.35}
          fillRadialGradientColorStops={[
            0, `${getTypeColor().accent}20`,
            0.6, `${getTypeColor().accent}10`,
            1, 'rgba(0,0,0,0)'
          ]}
          opacity={rack.isActive ? 0.8 : 0.4}
        />
        
        {/* Main icon container */}
        <Group>
          <AnimatedRackIcon
            type={rack.type}
            x={0}
            y={0}
            size={Math.min(width, height) * 0.28}
            isActive={rack.isActive && showEffects}
            theme={theme}
          />
        </Group>

        {/* Activity pulse ring */}
        {rack.isActive && showEffects && (
          <Circle
            x={0}
            y={0}
            radius={pulseRadius}
            stroke={getTypeColor().glow}
            strokeWidth={2}
            opacity={Math.max(0.1, 1 - (pulseRadius - 15) / 20)}
          />
        )}
      </Group>
      
      {/* Status indicators removed per new clean design */}
      
      
      {/* Remove old power usage track; replaced with vertical bars */}
      
      
      {/* All internal icons/symbols removed for new design */}
      
      {/* Icon backdrop removed */}

      {/* Side bars removed */}

      {/* Type label removed by request (avoid text like NETWORK near A1/A2) */}
      
      {/* Type-specific animated visual effects */}

      {/* AC rack airflow removed by request */}

      {/* Modern Airflow Effects - Cold Air: single center intake into rack (dashboard style) */}
      {showEffects && rack.isActive && (
        <Group>
          {/* Per-cabinet cold intake removed: use global cold lines from aisle center */}
        </Group>
      )}

      {/* Modern Airflow Effects - Hot Air: single center exhaust from rack to hot aisle (dashboard style) */}
      {showEffects && rack.isActive && (
        <Group>
          {/* Single center exhaust stream from rack rear to hot aisle */}
          <InlineAirflow
            // offset exhaust slightly to the right so it's distinct from the intake
            start={{ x: width/2 + 10, y: isRowB ? height - Math.round(height*0.04) : Math.round(height*0.04) }}
            end={{ x: width/2 + 10, y: isRowB ? height + Math.round(height*0.38) : -Math.round(height*0.38) }}
            type="hot"
            intensity="high"
            direction="vertical"
          />
        </Group>
      )}
    </Group>
  );
};

// Modern Cooling Effect Component
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
        const newRadius = prev + 1.2;
        return newRadius > 60 ? 15 : newRadius;
      });
      setRotation(prev => (prev + 3) % 360);
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
      {/* Modern cooling rings */}
      {[1, 2, 3, 4].map((ring, i) => (
        <Circle
          key={`cooling-ring-${ring}`}
          x={0}
          y={0}
          radius={pulseRadius + (i * 15)}
          stroke={theme === 'dark' ? '#60A5FA' : '#3B82F6'}
          strokeWidth={4 - (i * 0.5)}
          opacity={0.8 - (i * 0.15)}
          dash={[12, 6]}
        />
      ))}
      
      {/* Central cooling core */}
      <Circle
        x={0}
        y={0}
        radius={12}
        fill={theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(147, 197, 253, 0.9)'}
        stroke={theme === 'dark' ? '#60A5FA' : '#2563EB'}
        strokeWidth={3}
        shadowEnabled={true}
        shadowBlur={15}
        shadowColor="#3B82F6"
        shadowOpacity={0.6}
      />
    </Group>
  );
};

const DataCenterVisualization: React.FC = () => {
  const { isDarkMode, setTheme } = useTheme();
  const [viewMode, setViewMode] = useState<'DC' | 'DR'>('DC');
  const [selectedRack, setSelectedRack] = useState<string | null>(null);
  const [showEffects, setShowEffects] = useState(false);
  const [showFans, setShowFans] = useState(true);
  const [perfMode, setPerfMode] = useState<'high' | 'low'>('high');

  // API Data fetching
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['sensor-dashboard', viewMode],
    queryFn: () => apiClient.getSensorDashboardData(viewMode.toLowerCase() as 'dc' | 'dr'),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3
  });
  
  // Viewport-perfect sizing
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState({ 
    width: wrapperRef.current?.offsetWidth || 800,
    height: wrapperRef.current?.offsetHeight || 600
  });

  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setWrapperSize({ 
          width: Math.max(0, Math.floor(rect.width)), 
          height: Math.max(0, Math.floor(rect.height)) 
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Convert API data to rack format
  const convertApiDataToRacks = (apiData: DashboardData | undefined): ModernRack[] => {
    if (!apiData) return [];

    const racks: ModernRack[] = [];

    // Process row A
    apiData.rows.A.forEach((item, index) => {
      racks.push(convertDashboardRowToRack(item, 'A', index));
    });

    // Process row B  
    apiData.rows.B.forEach((item, index) => {
      racks.push(convertDashboardRowToRack(item, 'B', index));
    });

    return racks;
  };

  const convertDashboardRowToRack = (row: DashboardRow, rowKey: 'A' | 'B', index: number): ModernRack => {
    // Get the display name from mapping first
    const site = viewMode; // 'DC' | 'DR'
    const pos = index + 1;
    const displayName = getDisplayNameFromMapping(site as 'DC'|'DR', rowKey, pos);
    
    // Enhanced rack type determination based on display name and equipment classification
    let rackType: ModernRack['type'] = 'server';
    
    const equipmentName = row.equipment_name.toLowerCase();
    const rackType_lower = row.type?.toLowerCase() || '';
    const displayNameLower = displayName.toLowerCase();
    
    // Determine type based on display name first (most accurate)
    if (displayNameLower.includes('network')) {
      rackType = 'network';
    } 
    else if (displayNameLower.includes('air con') || displayNameLower.includes('aircon')) {
      rackType = 'aircon';
    }
    else if (displayNameLower.includes('ups')) {
      rackType = 'ups';
    }
    else if (displayNameLower.includes('battery')) {
      rackType = 'battery';
    }
    else if (displayNameLower.includes('storage') || displayNameLower.includes('san')) {
      rackType = 'storage';
    }
    else if (displayNameLower.includes('it')) {
      rackType = 'server';
    }
    // Fallback to original equipment classification
    else if (rackType_lower === 'cooling' || 
        equipmentName.includes('netcol') || 
        equipmentName.includes('air con') || 
        equipmentName.includes('aircon') ||
        equipmentName.includes('cooling') ||
        equipmentName.includes('hvac')) {
      rackType = 'aircon';
    } 
    // UPS equipment
    else if (rackType_lower === 'ups' || 
             equipmentName.includes('ups') ||
             equipmentName.includes('uninterruptible')) {
      rackType = 'ups';
    }
    // Battery equipment  
    else if (rackType_lower === 'power' || 
             rackType_lower === 'battery' ||
             equipmentName.includes('battery') ||
             equipmentName.includes('batt')) {
      rackType = 'battery';
    }
    // Network equipment (switches, routers, firewalls)
    else if (equipmentName.includes('network') || 
             equipmentName.includes('switch') ||
             equipmentName.includes('router') ||
             equipmentName.includes('firewall') ||
             equipmentName.includes('gateway') ||
             equipmentName.includes('access point') ||
             equipmentName.includes('wireless')) {
      rackType = 'network';
    }
    // Storage equipment
    else if (equipmentName.includes('storage') ||
             equipmentName.includes('san') ||
             equipmentName.includes('nas') ||
             equipmentName.includes('disk') ||
             equipmentName.includes('backup')) {
      rackType = 'storage';
    }
    // IT servers and computing equipment (default case)
    else if (equipmentName.includes('it') ||
             equipmentName.includes('server') ||
             equipmentName.includes('compute') ||
             rackType_lower === 'sensor') {
      rackType = 'server'; // IT equipment defaults to server type
    }

    // Helper function to get display name from mapping
    function getDisplayNameFromMapping(site: 'DC'|'DR', row: 'A'|'B', pos: number): string {
      const map: Record<'DC'|'DR', Record<'A'|'B', Record<number, string>>> = {
        DC: {
          A: {
            1: 'IT1', 2: 'IT2', 3: 'IT3', 4: 'Air Con3', 5: 'IT4', 6: 'IT5', 7: 'Network1', 8: 'Network2',
          },
          B: {
            1: 'IT6', 2: 'IT7', 3: 'Air Con2', 4: 'IT8', 5: 'IT9', 6: 'Air Con1', 7: 'IT10', 8: 'Network3',
          },
        },
        DR: {
          A: {
            1: 'Network3', 2: 'IT5', 3: 'IT4', 4: 'Air Con2', 5: 'Battery', 6: 'UPS',
          },
          B: {
            1: 'Network1', 2: 'Network2', 3: 'IT3', 4: 'Air Con1', 5: 'IT2', 6: 'IT1',
          },
        },
      };
      return map[site]?.[row]?.[pos] || `${row}${pos}`;
    }

    // Get temperature value
    const temperature = row.temperature?.value || null;
    const humidity = row.humidity?.value || null;
    const power = row.power?.value || null;

    // Estimate power usage based on type
    let powerUsage = 0;
    if (rackType === 'aircon') {
      powerUsage = power || 2500;
    } else if (rackType === 'ups') {
      powerUsage = power || 1500;
    } else if (rackType === 'battery') {
      powerUsage = power || 100;
    } else {
      powerUsage = power || 450; // default for servers/sensors
    }

    return {
      id: `${viewMode.toLowerCase()}-${rowKey.toLowerCase()}${index + 1}`,
      label: row.label,
      name: row.equipment_name,
      equipment_name: row.equipment_name,
      equipment_id: row.equipment_id,
      type: rackType,
      position: { x: 80 + index * 140, y: rowKey === 'A' ? 100 : 400 },
      temperature,
      humidity,
      power,
      status: row.status,
      powerUsage,
      isActive: row.status !== 'no_data',
      last_updated: row.last_updated
    };
  };

  const currentRacks = convertApiDataToRacks(dashboardData?.data);

  // Calculate centered positions for racks (dynamic for different counts)
  // Layout dimensions updated for larger racks
  const rackWidth = 150;
  const rackHeight = 210;
  const rackSpacing = rackWidth + 20;
  
  // Get unique column positions for each row to determine equipment count per row
  const topRowRacks = currentRacks.filter(rack => rack.id.includes('-a'));
  const bottomRowRacks = currentRacks.filter(rack => rack.id.includes('-b'));
  const maxRacksPerRow = Math.max(topRowRacks.length, bottomRowRacks.length);
  
  const totalRacksWidth = maxRacksPerRow * 120 + (maxRacksPerRow - 1) * (rackSpacing - 120);
  const centerX = (wrapperSize.width - totalRacksWidth) / 2;
  
  // Enhanced air zone calculations - Professional sizing (Cold aisle 6.25x hot aisle)
  const hotAirHeight = 40;    // Hot aisle height
  const coldAirHeight = 160;  // Reduced cold aisle height to make room for larger racks
  const hotAirSpacing = 8;    // Professional spacing for hot air zones
  const coldAirSpacing = 0;   // No spacing - cold air directly adjacent to racks
  
  const topRowY = (wrapperSize.height * 0.12); // Slightly higher to fit new total height
  const bottomRowY = topRowY + rackHeight + coldAirSpacing + coldAirHeight;
  
  // Hot air zones (professional spacing)
  const topHotZoneY = topRowY - hotAirSpacing - hotAirHeight;
  const bottomHotZoneY = bottomRowY + rackHeight + hotAirSpacing;
  
  // Cold air zone (ultra-wide professional design) - 6.25x hot aisle
  const coldZoneY = topRowY + rackHeight + coldAirSpacing;

  // Update rack positions to be centered (handles both DC:16 and DR:12 layouts)
  const centeredRacks = currentRacks.map((rack, index) => {
    const isTopRow = rack.id.includes('-a');
    const columnIndex = parseInt(rack.label.slice(1)) - 1; // A1 -> 0, A2 -> 1, etc.
    
    return {
      ...rack,
      position: {
        x: centerX + columnIndex * rackSpacing,
        y: isTopRow ? topRowY : bottomRowY
      }
    };
  });

  // After computing centered positions, build rack rects and fan positions and attach to ModernAirflowEffect defaults
  (function attachAirflowDefaults() {
    try {
      const rackWidthLocal = rackWidth;
      const rackHeightLocal = rackHeight;
      const allRackRects = centeredRacks.map(r => ({ x: r.position.x, y: r.position.y, width: rackWidthLocal, height: rackHeightLocal }));
      const fansLocal = centeredRacks.filter(r => r.type === 'aircon').map(r => ({ x: r.position.x + rackWidthLocal / 2, y: r.position.y + 30, size: 28, rpm: 220 }));
      (ModernAirflowEffect as any).defaultRackRects = allRackRects;
      (ModernAirflowEffect as any).defaultFans = fansLocal;
    } catch (e) {}
  })();

  // propagate runtime toggles to ModernAirflowEffect defaults so component reads them
  useEffect(() => {
    try {
      (ModernAirflowEffect as any).defaultFansEnabled = showFans;
      (ModernAirflowEffect as any).defaultPerfMode = perfMode;
    } catch (e) {}
  }, [showFans, perfMode]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'IBM Plex Sans Thai, system-ui, sans-serif'
    }}>
      {/* Redesigned Modern Top Bar with IBM Plex Sans */}
      <Box sx={{ 
        position: 'relative',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%)',
        padding: '20px 40px',
        marginBottom: '16px',
        boxShadow: '0 8px 32px rgba(30, 64, 175, 0.25)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          animation: 'shimmerSweep 4s ease-in-out infinite'
        },
        '@keyframes shimmerSweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        }
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          
          {/* Left - Effects Toggle Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={() => setShowEffects(!showEffects)}
              sx={{
                minWidth: '140px',
                padding: '12px 24px',
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 'bold',
                fontFamily: 'IBM Plex Sans Thai, system-ui',
                letterSpacing: '0.5px',
                background: showEffects 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: showEffects
                  ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  background: showEffects 
                    ? 'linear-gradient(135deg, #059669, #047857)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2))',
                  transform: 'translateY(-2px)',
                  boxShadow: showEffects
                    ? '0 8px 28px rgba(16, 185, 129, 0.5)'
                    : '0 6px 20px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {showEffects ? '✨ Effects On' : '⚡ Effects Off'}
            </Button>
          </Box>

          {/* Center - Title */}
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                fontFamily: 'IBM Plex Sans Thai, system-ui',
                background: 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 50%, #bae6fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                letterSpacing: '1px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                marginBottom: '4px'
              }}
            >
              Data Center Visualization
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'IBM Plex Sans Thai, system-ui',
                fontWeight: '600',
                fontSize: '15px',
                letterSpacing: '0.5px'
              }}
            >
              Real-time Infrastructure Monitoring · {viewMode} Location
            </Typography>
          </Box>

          {/* Right - DC/DR Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
              }}
            >
              <Button
                onClick={() => setViewMode('DC')}
                sx={{
                  minWidth: '120px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  fontFamily: 'IBM Plex Sans Thai, system-ui',
                  letterSpacing: '0.5px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: viewMode === 'DC'
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
                    : 'transparent',
                  color: viewMode === 'DC' ? '#1e40af' : 'rgba(255, 255, 255, 0.85)',
                  boxShadow: viewMode === 'DC'
                    ? '0 6px 20px rgba(30, 64, 175, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    : 'none',
                  transform: viewMode === 'DC' ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    background: viewMode === 'DC'
                      ? 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.02)',
                    boxShadow: viewMode === 'DC'
                      ? '0 8px 28px rgba(30, 64, 175, 0.4)'
                      : '0 4px 16px rgba(255, 255, 255, 0.1)'
                  }
                }}
                startIcon={<Dns sx={{ fontSize: 20 }} />}
              >
                DC Site
              </Button>
              <Button
                onClick={() => setViewMode('DR')}
                sx={{
                  minWidth: '120px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  fontFamily: 'IBM Plex Sans Thai, system-ui',
                  letterSpacing: '0.5px',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: viewMode === 'DR'
                    ? 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
                    : 'transparent',
                  color: viewMode === 'DR' ? '#1e40af' : 'rgba(255, 255, 255, 0.85)',
                  boxShadow: viewMode === 'DR'
                    ? '0 6px 20px rgba(30, 64, 175, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                    : 'none',
                  transform: viewMode === 'DR' ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    background: viewMode === 'DR'
                      ? 'linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.02)',
                    boxShadow: viewMode === 'DR'
                      ? '0 8px 28px rgba(30, 64, 175, 0.4)'
                      : '0 4px 16px rgba(255, 255, 255, 0.1)'
                  }
                }}
                startIcon={<CloudQueue sx={{ fontSize: 20 }} />}
              >
                DR Site
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Visualization Area */}
      <Box
        ref={wrapperRef}
        sx={{
          flex: 1,
          width: '100%',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Stage width={wrapperSize.width} height={wrapperSize.height}>
          <Layer>
            {/* Modern floor background */}
            <Rect
              x={0}
              y={0}
              width={wrapperSize.width}
              height={wrapperSize.height}
              fill={isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.5)'}
            />
            
            {/* Professional Ultra-Wide Cold Aisle - Deep Blue Tone */}
            <Rect
              x={centerX - 30}
              y={coldZoneY}
              width={totalRacksWidth + 60}
              height={coldAirHeight}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: coldAirHeight }}
              fillLinearGradientColorStops={[
                0, isDarkMode ? 'rgba(29, 78, 216, 0.35)' : 'rgba(59, 130, 246, 0.38)',
                0.3, isDarkMode ? 'rgba(37, 99, 235, 0.40)' : 'rgba(96, 165, 250, 0.42)',
                0.7, isDarkMode ? 'rgba(37, 99, 235, 0.40)' : 'rgba(96, 165, 250, 0.42)',
                1, isDarkMode ? 'rgba(29, 78, 216, 0.35)' : 'rgba(59, 130, 246, 0.38)'
              ]}
              stroke={isDarkMode ? '#2563EB' : '#3B82F6'}
              strokeWidth={5}
              cornerRadius={30}
              dash={[25, 15]}
              shadowEnabled={true}
              shadowBlur={35}
              shadowColor={isDarkMode ? '#1E40AF' : '#2563EB'}
              shadowOpacity={0.5}
            />
            
            {/* Modern Hot Aisle Zones - Subtle and Integrated */}
            {/* Top Hot Aisle */}
            <Rect
              x={centerX - 15}
              y={topHotZoneY}
              width={totalRacksWidth + 30}
              height={hotAirHeight}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: hotAirHeight }}
              fillLinearGradientColorStops={[
                0, isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 165, 165, 0.2)',
                0.5, isDarkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                1, isDarkMode ? 'rgba(185, 28, 28, 0.15)' : 'rgba(220, 38, 38, 0.2)'
              ]}
              cornerRadius={15}
              opacity={0.7}
            />
            
            {/* Bottom Hot Aisle */}
            <Rect
              x={centerX - 15}
              y={bottomHotZoneY}
              width={totalRacksWidth + 30}
              height={hotAirHeight}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: 0, y: hotAirHeight }}
              fillLinearGradientColorStops={[
                0, isDarkMode ? 'rgba(185, 28, 28, 0.15)' : 'rgba(220, 38, 38, 0.2)',
                0.5, isDarkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(239, 68, 68, 0.25)',
                1, isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 165, 165, 0.2)'
              ]}
              cornerRadius={15}
              opacity={0.7}
            />
            
            {/* Elegant Zone Labels */}
            <Text
              x={wrapperSize.width / 2}
              y={coldZoneY + coldAirHeight / 2}
              text="COLD AISLE • พื้นที่ลมเย็น"
              fontSize={16}
              fontFamily="Inter, system-ui, sans-serif"
              fill={isDarkMode ? '#93C5FD' : '#1E40AF'}
              fontStyle="600"
              align="center"
              offsetX={80}
              opacity={0.9}
            />
            
            <Text
              x={wrapperSize.width / 2}
              y={topHotZoneY + hotAirHeight / 2}
              text="HOT EXHAUST"
              fontSize={12}
              fontFamily="Inter, system-ui, sans-serif"
              fill={isDarkMode ? '#FCA5A5' : '#DC2626'}
              fontStyle="500"
              align="center"
              offsetX={35}
              opacity={0.7}
            />
            
            <Text
              x={wrapperSize.width / 2}
              y={bottomHotZoneY + hotAirHeight / 2}
              text="HOT EXHAUST"
              fontSize={12}
              fontFamily="Inter, system-ui, sans-serif"
              fill={isDarkMode ? '#FCA5A5' : '#DC2626'}
              fontStyle="500"
              align="center"
              offsetX={35}
              opacity={0.7}
            />
            

            

            

            

            
            {/* Render centered modern racks */}
            {centeredRacks.map((rack) => (
              <ModernRackUnit
                key={rack.id}
                rack={rack}
                theme={isDarkMode ? 'dark' : 'light'}
                onSelect={(id) => setSelectedRack(id === selectedRack ? null : id)}
                isSelected={selectedRack === rack.id}
                showEffects={showEffects}
                perfMode={perfMode}
                showFans={showFans}
                siteTag={viewMode}
                isRowB={rack.id.includes('-b')}
              />
            ))}
          </Layer>

          {/* Effects overlay layer: per-rack cold intake from aisle center (excluding aircon/battery/ups) */}
          <Layer listening={false}>
            {showEffects && (
              (() => {
                // for each rack (non-AC/battery/UPS), draw a cold streamline from aisle center to rack face
                const items = centeredRacks.filter(r => !['aircon','battery','ups'].includes(r.type));
                const acItems = centeredRacks.filter(r => r.type === 'aircon');
                return (
                  <Group>
                    {/* Aircon airflow: from AC rack face into the cold aisle center */}
                    {acItems.map((r) => {
                      const isTop = r.id.includes('-a');
                      const rackCenterX = r.position.x + rackWidth / 2;
                      const startY = isTop ? (r.position.y + rackHeight) : r.position.y; // AC face edge
                      const endY = coldZoneY + coldAirHeight / 2;
                      // render three streams (left, center, right) for richness
                      const offsets = [-12, 0, 12];
                      return (
                        <Group key={`ac-out-${r.id}`}>
                          {offsets.map((ox, i) => (
                            <InlineAirflow
                              key={`ac-line-${r.id}-${i}`}
                              start={{ x: rackCenterX + ox, y: startY }}
                              end={{ x: rackCenterX + (ox === 0 ? 0 : ox * 0.6), y: endY }}
                              type="cold"
                              intensity="normal"
                              direction="vertical"
                              isFromAC
                              perfMode={perfMode}
                            />
                          ))}
                          {/* tapered tip toward convergence (emerald) */}
                          <Path
                            data={`M ${rackCenterX - 6},${endY - 2} L ${rackCenterX + 6},${endY - 2} L ${rackCenterX},${endY + 8} Z`}
                            fill={'#10B981'}
                            opacity={0.9}
                            shadowEnabled
                            shadowBlur={6}
                            shadowColor={'#10B981'}
                          />
                          {/* swirl at the convergence point */}
                          <ColdAisleSwirlSymbol x={rackCenterX} y={endY} size={22} />
                        </Group>
                      );
                    })}
                    {items.map((r, idx) => {
                      const isTop = r.id.includes('-a');
                      const rackCenterX = r.position.x + rackWidth / 2;
                      const startY = coldZoneY + coldAirHeight / 2; // center of cold aisle
                      const endY = isTop ? (r.position.y + rackHeight) : r.position.y; // to rack face edge
                      return (
                        <Group key={`cold-intake-${r.id}`}>
                          {/* distinct cold source pulse at start point */}
                          <ColdSourcePulse x={rackCenterX} y={startY} />
                          {/* animated inlet symbol near rack face */}
                          <ColdInletSymbol
                            x={rackCenterX}
                            y={isTop ? (endY - 8) : (endY + 8)}
                            direction={isTop ? 'up' : 'down'}
                          />
                          <InlineAirflow
                            start={{ x: rackCenterX, y: startY }}
                            end={{ x: rackCenterX, y: endY }}
                            type="cold"
                            intensity="normal"
                            direction="vertical"
                          />
                        </Group>
                      );
                    })}
                    {/* Ambient swirl symbols across the cold aisle for aesthetics */}
                    {(() => {
                      const swirlCount = Math.max(3, Math.floor(totalRacksWidth / 400));
                      const arr = Array.from({ length: swirlCount });
                      return (
                        <Group>
                          {arr.map((_, i) => (
                            <ColdAisleSwirlSymbol
                              key={`ambient-swirl-${i}`}
                              x={centerX + (i + 0.5) * (totalRacksWidth / swirlCount)}
                              y={coldZoneY + coldAirHeight / 2 + ((i % 2 === 0) ? -20 : 20)}
                              size={20}
                            />
                          ))}
                        </Group>
                      );
                    })()}
                  </Group>
                );
              })()
            )}
          </Layer>
          
        </Stage>

        {/* Loading Overlay */}
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(0,0,0,0.5)"
            zIndex={1000}
          >
            <Typography variant="h6" color="white">
              กำลังโหลดข้อมูลเซนเซอร์...
            </Typography>
          </Box>
        )}

        {/* Error Overlay */}
        {error && (
          <Box
            position="absolute"
            top={16}
            right={16}
            bgcolor="rgba(244, 67, 54, 0.9)"
            color="white"
            p={2}
            borderRadius={1}
            zIndex={1000}
          >
            <Typography variant="body2">
              เกิดข้อผิดพลาดในการโหลดข้อมูล
            </Typography>
            <Button
              size="small"
              color="inherit"
              onClick={() => refetch()}
              sx={{ mt: 1 }}
            >
              ลองใหม่
            </Button>
          </Box>
        )}

        {/* Data Info Panel hidden per request */}

        {/* Selected Rack Info */}
        {selectedRack && currentRacks.find(r => r.id === selectedRack) && (
          <Box
            position="absolute"
            top={16}
            right={16}
            bgcolor={isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'}
            p={2}
            borderRadius={1}
            minWidth={250}
            zIndex={999}
          >
            {(() => {
              const rack = currentRacks.find(r => r.id === selectedRack)!;
              return (
                <div>
                  <Typography variant="h6" gutterBottom>
                    {rack.label}: {rack.equipment_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    ID: {rack.equipment_id}
                  </Typography>
                  
                  {rack.temperature !== null && (
                    <Typography variant="body2">
                      🌡️ อุณหภูมิ: {rack.temperature.toFixed(1)}°C
                    </Typography>
                  )}
                  
                  {rack.humidity !== null && (
                    <Typography variant="body2">
                      💧 ความชื้น: {rack.humidity.toFixed(1)}%
                    </Typography>
                  )}
                  
                  {rack.power !== null && (
                    <Typography variant="body2">
                      ⚡ กำลังไฟ: {rack.power.toFixed(1)}W
                    </Typography>
                  )}
                  
                  <Typography variant="body2" sx={{ 
                    color: rack.status === 'healthy' ? 'success.main' : 
                           rack.status === 'warning' ? 'warning.main' : 'error.main'
                  }}>
                    สถานะ: {rack.status === 'healthy' ? 'ปกติ' : 
                            rack.status === 'warning' ? 'เตือน' : 
                            rack.status === 'no_data' ? 'ไม่มีข้อมูล' : 'วิกฤต'}
                  </Typography>
                  
                  {rack.last_updated && (
                    <Typography variant="caption" color="textSecondary">
                      อัปเดต: {new Date(rack.last_updated).toLocaleString('th-TH')}
                    </Typography>
                  )}
                </div>
              );
            })()}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DataCenterVisualization;