// RackNode - Individual rack visualization with modern styling, icons, and text
import React, { useEffect, useState, useRef } from 'react';
import { Group, Rect, Text, Circle, Path, Line } from 'react-konva';
import Konva from 'konva';
import { RackItem, MODERN_RACK_COLORS, RACK_WIDTH, RACK_HEIGHT } from '../../data/layout';
import { useLayoutStore, useAnimationToggles } from '../../state/useLayoutStore';

interface RackNodeProps {
  rack: RackItem;
}

export const RackNode: React.FC<RackNodeProps> = ({ rack }) => {
  const { selectedRackId, selectRack } = useLayoutStore();
  const { showBlinkingLights, showFanRotation, showCoolingGlow } = useAnimationToggles();
  
  const [pulseAlpha, setPulseAlpha] = useState(0.8);
  const [fanRotation, setFanRotation] = useState(0);
  const [glowRadius, setGlowRadius] = useState(15);
  const animationRef = useRef<number>();
  
  const isSelected = selectedRackId === rack.id;
  const rackColor = MODERN_RACK_COLORS[rack.type];

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (showBlinkingLights) {
        setPulseAlpha(prev => {
          const newAlpha = prev + 0.02;
          return newAlpha > 1 ? 0.5 : newAlpha;
        });
      }
      
      if (showFanRotation && rack.type === 'aircon') {
        setFanRotation(prev => (prev + 3) % 360);
      }
      
      if (showCoolingGlow && rack.type === 'aircon') {
        setGlowRadius(prev => {
          const newRadius = prev + 0.5;
          return newRadius > 30 ? 15 : newRadius;
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showBlinkingLights, showFanRotation, showCoolingGlow, rack.type]);

  // Handle rack click
  const handleClick = () => {
    selectRack(isSelected ? null : rack.id);
  };

  // Get status color
  const getStatusColor = () => {
    switch (rack.status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Render type-specific icon
  const renderIcon = () => {
    const iconColor = rackColor.icon;
    const centerX = RACK_WIDTH / 2;
    const centerY = 40;

    switch (rack.type) {
      case 'server':
        return (
          <Group x={centerX} y={centerY}>
            <Rect x={-15} y={-10} width={30} height={20} fill={iconColor} opacity={0.3} cornerRadius={3} />
            <Rect x={-13} y={-8} width={26} height={4} fill={iconColor} cornerRadius={1} />
            <Rect x={-13} y={-2} width={26} height={4} fill={iconColor} cornerRadius={1} />
            <Rect x={-13} y={4} width={26} height={4} fill={iconColor} cornerRadius={1} />
          </Group>
        );
      
      case 'network':
        return (
          <Group x={centerX} y={centerY}>
            <Rect x={-15} y={-10} width={30} height={20} fill={iconColor} opacity={0.3} cornerRadius={3} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Circle
                key={i}
                x={-11 + (i % 4) * 6}
                y={-4 + Math.floor(i / 4) * 8}
                radius={2}
                fill={iconColor}
              />
            ))}
          </Group>
        );
      
      case 'aircon':
        return (
          <Group x={centerX} y={centerY} rotation={showFanRotation ? fanRotation : 0}>
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
          <Group x={centerX} y={centerY}>
            <Rect x={-12} y={-8} width={24} height={16} cornerRadius={2} fill={iconColor} opacity={0.3} stroke={iconColor} strokeWidth={1} />
            <Rect x={12} y={-4} width={4} height={8} cornerRadius={1} fill={iconColor} />
            <Rect x={-9} y={-5} width={18} height={10} cornerRadius={1} fill={iconColor} opacity={0.8} />
          </Group>
        );
      
      case 'ups':
        return (
          <Group x={centerX} y={centerY}>
            <Rect x={-15} y={-10} width={30} height={20} cornerRadius={3} fill={iconColor} opacity={0.3} />
            <Path
              data="M-7,-4 L-3,-4 L-5,2 L-1,2 L-7,8 L-5,2 L-9,2 Z"
              fill={iconColor}
            />
          </Group>
        );
      
      default:
        return (
          <Rect 
            x={centerX - 15} 
            y={centerY - 10} 
            width={30} 
            height={20} 
            fill={iconColor} 
            opacity={0.5} 
            cornerRadius={3} 
          />
        );
    }
  };

  return (
    <Group
      x={rack.x}
      y={rack.y}
      onClick={handleClick}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'grab';
      }}
    >
      {/* Cooling Glow Effect for Air Conditioning */}
      {showCoolingGlow && rack.type === 'aircon' && (
        <Circle
          x={RACK_WIDTH / 2}
          y={RACK_HEIGHT / 2}
          radius={glowRadius}
          fillRadialGradientStartPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={glowRadius}
          fillRadialGradientColorStops={[0, '#8BE1FF', 0.5, '#8BE1FF40', 1, 'transparent']}
          opacity={0.6}
        />
      )}
      
      {/* Main Rack Body */}
      <Rect
        width={RACK_WIDTH}
        height={RACK_HEIGHT}
        cornerRadius={24}
        fill={rackColor.primary}
        stroke={isSelected ? '#FFFFFF' : getStatusColor()}
        strokeWidth={isSelected ? 4 : 2}
        opacity={0.9}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={8}
        shadowOffset={{ x: 4, y: 4 }}
        shadowOpacity={0.6}
      />
      
      {/* Equipment Icon */}
      {renderIcon()}
      
      {/* Server Panels/Slots */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Rect
          key={i}
          x={15}
          y={70 + i * 12}
          width={RACK_WIDTH - 30}
          height={8}
          cornerRadius={2}
          fill={rackColor.accent}
          opacity={0.6}
          stroke={rackColor.text}
          strokeWidth={0.5}
        />
      ))}
      
      {/* Status LED - Enhanced design */}
      {showBlinkingLights && (
        <Group>
          {/* LED Background */}
          <Circle
            x={RACK_WIDTH - 12}
            y={12}
            radius={5}
            fill="rgba(0,0,0,0.3)"
          />
          {/* LED Light */}
          <Circle
            x={RACK_WIDTH - 12}
            y={12}
            radius={3}
            fill={getStatusColor()}
            opacity={pulseAlpha}
            shadowColor={getStatusColor()}
            shadowBlur={3}
            shadowOpacity={0.6}
          />
        </Group>
      )}

      {/* CPU Usage Bar - Servers only */}
      {rack.type === 'server' && typeof rack.cpuUsage === 'number' && rack.cpuUsage > 0 && (
        <Group>
          <Text
            x={8}
            y={RACK_HEIGHT - 28}
            text={`CPU ${rack.cpuUsage}%`}
            fontSize={8}
            fill="rgba(255,255,255,0.9)"
            fontFamily="Inter, Arial, sans-serif"
            fontStyle="bold"
          />
          <Rect
            x={8}
            y={RACK_HEIGHT - 20}
            width={RACK_WIDTH - 16}
            height={3}
            fill="rgba(255,255,255,0.2)"
            cornerRadius={2}
          />
          <Rect
            x={8}
            y={RACK_HEIGHT - 20}
            width={(RACK_WIDTH - 16) * (rack.cpuUsage / 100)}
            height={3}
            fill={rack.cpuUsage > 80 ? '#EF4444' : rack.cpuUsage > 60 ? '#F59E0B' : '#10B981'}
            cornerRadius={2}
            shadowColor={rack.cpuUsage > 80 ? '#EF4444' : rack.cpuUsage > 60 ? '#F59E0B' : '#10B981'}
            shadowBlur={2}
            shadowOpacity={0.4}
          />
        </Group>
      )}
      
      {/* Equipment Label - Clean design with just the equipment name */}
      <Text
        x={RACK_WIDTH / 2}
        y={RACK_HEIGHT - 35}
        text={rack.label}
        fontSize={13}
        fontStyle="bold"
        fill="#FFFFFF"
        align="center"
        offsetX={25}
        fontFamily="Inter, Arial, sans-serif"
        shadowColor="rgba(0,0,0,0.5)"
        shadowBlur={1}
        shadowOffset={{ x: 0, y: 1 }}
      />

      {/* Rack Position ID - Top corner badge */}
      <Group>
        {/* Position Badge Background */}
        <Rect
          x={8}
          y={8}
          width={24}
          height={16}
          cornerRadius={8}
          fill="rgba(0,0,0,0.7)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />
        {/* Position Text */}
        <Text
          x={20}
          y={16}
          text={rack.id}
          fontSize={10}
          fontStyle="bold"
          fill="#FFFFFF"
          align="center"
          offsetX={6}
          fontFamily="Inter, Arial, sans-serif"
        />
      </Group>

      {/* Temperature Display - Bottom right */}
      {rack.temperature && (
        <Text
          x={RACK_WIDTH - 8}
          y={RACK_HEIGHT - 12}
          text={`${rack.temperature.toFixed(0)}°C`}
          fontSize={9}
          fill="rgba(255,255,255,0.8)"
          align="right"
          fontFamily="Inter, Arial, sans-serif"
          fontStyle="bold"
        />
      )}
    </Group>
  );
};