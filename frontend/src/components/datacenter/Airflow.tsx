// Airflow - Modern realistic airflow from rack fronts with beautiful particle effects
import React, { useEffect, useState, useRef } from 'react';
import { Group, Circle, Line, Arrow, Path } from 'react-konva';
import { useCurrentLayout, useAnimationToggles } from '../../state/useLayoutStore';
import { AIRFLOW_COLORS } from '../../data/layout';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
  life: number;
  type: 'cold' | 'hot';
}

export const Airflow: React.FC = () => {
  const layout = useCurrentLayout();
  const { showAirflow } = useAnimationToggles();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dashOffset, setDashOffset] = useState(0);
  const animationRef = useRef<number>();
  const particleIdCounter = useRef(0);

  // Create particles for airflow visualization from rack fronts
  const createParticle = (type: 'hot' | 'cold'): Particle => {
    const id = `particle-${particleIdCounter.current++}`;
    
    if (type === 'cold') {
      // Cold air particles from AC units (aircon racks)
      const airconRacks = layout.racks.filter(rack => rack.type === 'aircon');
      if (airconRacks.length === 0) {
        // Fallback to center if no AC units
        return {
          id,
          x: layout.aisles.coldMid.x + Math.random() * layout.aisles.coldMid.w,
          y: layout.aisles.coldMid.y + layout.aisles.coldMid.h / 2,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() > 0.5 ? -2 : 2,
          opacity: AIRFLOW_COLORS.cold.opacity,
          size: 2 + Math.random() * 3,
          color: AIRFLOW_COLORS.cold.particle,
          life: 100 + Math.random() * 100,
          type: 'cold',
        };
      }
      
      // Emit from random AC unit front
      const sourceRack = airconRacks[Math.floor(Math.random() * airconRacks.length)];
      return {
        id,
        x: sourceRack.x + 80, // Front of rack (center)
        y: sourceRack.y + 30 + Math.random() * 80, // Vary height
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        opacity: AIRFLOW_COLORS.cold.opacity,
        size: 3 + Math.random() * 4,
        color: AIRFLOW_COLORS.cold.particle,
        life: 120 + Math.random() * 100,
        type: 'cold',
      };
    } else {
      // Hot air particles from server/network equipment fronts
      const heatSources = layout.racks.filter(rack => 
        rack.type === 'server' || rack.type === 'network' || rack.type === 'ups'
      );
      
      if (heatSources.length === 0) {
        // Fallback
        const isTop = Math.random() > 0.5;
        const aisle = isTop ? layout.aisles.hotTop : layout.aisles.hotBottom;
        return {
          id,
          x: aisle.x + Math.random() * aisle.w,
          y: aisle.y + aisle.h / 2,
          vx: (Math.random() - 0.5) * 1.5,
          vy: isTop ? -1.5 : 1.5,
          opacity: AIRFLOW_COLORS.hot.opacity,
          size: 2 + Math.random() * 2,
          color: AIRFLOW_COLORS.hot.particle,
          life: 80 + Math.random() * 80,
          type: 'hot',
        };
      }
      
      // Emit from random heat-generating equipment front
      const sourceRack = heatSources[Math.floor(Math.random() * heatSources.length)];
      return {
        id,
        x: sourceRack.x + 80, // Front of rack (center)
        y: sourceRack.y + 20 + Math.random() * 100, // Vary height
        vx: (Math.random() - 0.5) * 2,
        vy: sourceRack.row === 'A' ? -2 : 2, // Move to appropriate hot aisle
        opacity: AIRFLOW_COLORS.hot.opacity,
        size: 2.5 + Math.random() * 3,
        color: AIRFLOW_COLORS.hot.particle,
        life: 90 + Math.random() * 90,
        type: 'hot',
      };
    }
  };

  // Animation loop
  useEffect(() => {
    if (!showAirflow) {
      setParticles([]);
      return;
    }

    const animate = () => {
      // Update dash offset for animated arrows
      setDashOffset(prev => (prev + 1) % 20);
      
      // Update particles
      setParticles(prevParticles => {
        let newParticles = prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
            opacity: particle.opacity * 0.995,
          }))
          .filter(particle => particle.life > 0 && particle.opacity > 0.1);

        // Add new particles occasionally
        if (Math.random() < 0.3) {
          newParticles.push(createParticle('cold'));
        }
        if (Math.random() < 0.2) {
          newParticles.push(createParticle('hot'));
        }

        // Limit total particles
        return newParticles.slice(-50);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showAirflow, layout]);

  if (!showAirflow) return null;

  return (
    <Group>
      {/* Cold Air Flow Arrows - from Cold Aisle to Racks */}
      {layout.racks
        .filter(rack => rack.row === 'A')
        .map((rack, index) => (
          <Arrow
            key={`cold-arrow-${index}`}
            points={[
              layout.aisles.coldMid.x + layout.aisles.coldMid.w / 2,
              layout.aisles.coldMid.y + 20,
              rack.x + 80,
              rack.y + 70,
            ]}
            stroke="#3B82F6"
            strokeWidth={2}
            opacity={0.6}
            dash={[8, 4]}
            dashOffset={dashOffset}
            pointerLength={8}
            pointerWidth={8}
          />
        ))}
      
      {layout.racks
        .filter(rack => rack.row === 'B')
        .map((rack, index) => (
          <Arrow
            key={`cold-arrow-b-${index}`}
            points={[
              layout.aisles.coldMid.x + layout.aisles.coldMid.w / 2,
              layout.aisles.coldMid.y + layout.aisles.coldMid.h - 20,
              rack.x + 80,
              rack.y + 70,
            ]}
            stroke="#3B82F6"
            strokeWidth={2}
            opacity={0.6}
            dash={[8, 4]}
            dashOffset={dashOffset}
            pointerLength={8}
            pointerWidth={8}
          />
        ))}

      {/* Hot Air Flow Arrows - from Racks to Hot Aisles */}
      {layout.racks
        .filter(rack => rack.row === 'A')
        .map((rack, index) => (
          <Arrow
            key={`hot-arrow-${index}`}
            points={[
              rack.x + 80,
              rack.y,
              layout.aisles.hotTop.x + 100 + index * 180,
              layout.aisles.hotTop.y + layout.aisles.hotTop.h / 2,
            ]}
            stroke="#F97316"
            strokeWidth={2}
            opacity={0.5}
            dash={[6, 6]}
            dashOffset={-dashOffset}
            pointerLength={6}
            pointerWidth={6}
          />
        ))}
      
      {layout.racks
        .filter(rack => rack.row === 'B')
        .map((rack, index) => (
          <Arrow
            key={`hot-arrow-b-${index}`}
            points={[
              rack.x + 80,
              rack.y + 140,
              layout.aisles.hotBottom.x + 100 + index * 180,
              layout.aisles.hotBottom.y + layout.aisles.hotBottom.h / 2,
            ]}
            stroke="#F97316"
            strokeWidth={2}
            opacity={0.5}
            dash={[6, 6]}
            dashOffset={-dashOffset}
            pointerLength={6}
            pointerWidth={6}
          />
        ))}

      {/* Animated Particles */}
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
      
      {/* Additional Cold Air Circulation Lines */}
      <Line
        points={[
          layout.aisles.coldMid.x,
          layout.aisles.coldMid.y + layout.aisles.coldMid.h / 2,
          layout.aisles.coldMid.x + layout.aisles.coldMid.w,
          layout.aisles.coldMid.y + layout.aisles.coldMid.h / 2,
        ]}
        stroke="#60A5FA"
        strokeWidth={3}
        opacity={0.4}
        dash={[12, 8]}
        dashOffset={dashOffset * 2}
      />
    </Group>
  );
};