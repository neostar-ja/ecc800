import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  Box, 
  Cylinder,
  Sphere,
  Environment,
  Html,
  Billboard,
  Plane,
  useTexture
} from '@react-three/drei';
import { 
  Box as MUIBox, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Chip,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Computer,
  Router,
  AcUnit,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import * as THREE from 'three';
import { useDashboardData } from '../services/dashboardService';

// Data Center Containment Configuration ตามที่กำหนด
const CONTAINMENT_CONFIG = {
  rowA: [
    { position: 'A1', type: 'IT1', equipment: 'server', label: 'IT1' },
    { position: 'A2', type: 'IT2', equipment: 'server', label: 'IT2' },
    { position: 'A3', type: 'IT3', equipment: 'server', label: 'IT3' },
    { position: 'A4', type: 'Air Con3', equipment: 'aircon', label: 'Air Con3' },
    { position: 'A5', type: 'IT4', equipment: 'server', label: 'IT4' },
    { position: 'A6', type: 'IT5', equipment: 'server', label: 'IT5' },
    { position: 'A7', type: 'Network1', equipment: 'network', label: 'Network1' },
    { position: 'A8', type: 'Network2', equipment: 'network', label: 'Network2' }
  ],
  rowB: [
    { position: 'B1', type: 'IT6', equipment: 'server', label: 'IT6' },
    { position: 'B2', type: 'IT7', equipment: 'server', label: 'IT7' },
    { position: 'B3', type: 'Air Con2', equipment: 'aircon', label: 'Air Con2' },
    { position: 'B4', type: 'IT8', equipment: 'server', label: 'IT8' },
    { position: 'B5', type: 'IT9', equipment: 'server', label: 'IT9' },
    { position: 'B6', type: 'Air Con1', equipment: 'aircon', label: 'Air Con1' },
    { position: 'B7', type: 'IT10', equipment: 'server', label: 'IT10' },
    { position: 'B8', type: 'Network3', equipment: 'network', label: 'Network3' }
  ]
};

// 3D Server Rack Component
const ServerRack = ({ 
  position, 
  rackConfig, 
  realData, 
  onClick, 
  isSelected,
  animationTime 
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Animation สำหรับ Server - พัดลม CPU
  useFrame((state, delta) => {
    if (meshRef.current && rackConfig.equipment === 'server') {
      meshRef.current.rotation.y += delta * 2; // Gentle rotation
    }
  });

  const getColor = () => {
    const isActive = realData?.isActive ?? true;
    if (!isActive) return '#ff4444'; // Red for offline
    
    switch (rackConfig.equipment) {
      case 'server':
        return hovered ? '#4488ff' : '#2266dd';
      case 'aircon':
        return hovered ? '#00cc88' : '#00aa66';
      case 'network':
        return hovered ? '#ffaa44' : '#ff8800';
      default:
        return '#666666';
    }
  };

  const getTemperatureColor = () => {
    const temp = realData?.status?.temperature;
    if (!temp) return '#4488ff';
    
    if (temp > 25) return '#ff4444'; // Hot - Red
    if (temp > 20) return '#ffaa44'; // Warm - Orange
    return '#4488ff'; // Cool - Blue
  };

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onClick?.(rackConfig)}
    >
      {/* Main Rack Body */}
      <Box
        args={[1.8, 2.2, 0.8]}
        position={[0, 1.1, 0]}
        ref={meshRef}
      >
        <meshStandardMaterial 
          color={getColor()}
          metalness={0.7}
          roughness={0.3}
          emissive={new THREE.Color(getColor()).multiplyScalar(0.1)}
        />
      </Box>

      {/* Equipment-specific details */}
      {rackConfig.equipment === 'server' && (
        <>
          {/* CPU Indicators */}
          <Sphere args={[0.1]} position={[-0.6, 1.8, 0.45]}>
            <meshStandardMaterial
              color={realData?.isActive ? '#00ff00' : '#ff0000'}
              emissive={realData?.isActive ? new THREE.Color('#004400') : new THREE.Color('#440000')}
            />
          </Sphere>
          
          {/* Temperature Indicator */}
          <Sphere args={[0.1]} position={[0.6, 1.8, 0.45]}>
            <meshStandardMaterial
              color={getTemperatureColor()}
              emissive={new THREE.Color(getTemperatureColor()).multiplyScalar(0.3)}
            />
          </Sphere>

          {/* Fan Animation */}
          <group position={[0, 1.8, 0.45]}>
            <Cylinder args={[0.3, 0.3, 0.05]} rotation={[0, animationTime * 10, 0]}>
              <meshStandardMaterial
                color="#66ccff"
                transparent
                opacity={0.7}
              />
            </Cylinder>
          </group>
        </>
      )}

      {rackConfig.equipment === 'aircon' && (
        <>
          {/* Cooling Fan - ใหญ่กว่าและหมุนเร็วกว่า */}
          <group position={[0, 1.8, 0.45]}>
            <Cylinder args={[0.6, 0.6, 0.1]} rotation={[0, animationTime * 15, 0]}>
              <meshStandardMaterial
                color="#00ffff"
                transparent
                opacity={0.6}
              />
            </Cylinder>
          </group>

          {/* Cooling Effect Particles */}
          <group position={[0, 1.2, 0.45]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Sphere
                key={i}
                args={[0.02]}
                position={[
                  Math.cos(i * Math.PI / 4 + animationTime * 2) * 0.3,
                  Math.sin(animationTime * 2 + i) * 0.2,
                  0
                ]}
              >
                <meshStandardMaterial
                  color={Math.random() > 0.5 ? '#00ff88' : '#88ffff'}
                  emissive={new THREE.Color('#002288')}
                />
              </Sphere>
            ))}
          </group>
        </>
      )}

      {rackConfig.equipment === 'network' && (
        <>
          {/* Network Activity Lights */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={i}
              args={[0.08, 0.08, 0.02]}
              position={[-0.6 + i * 0.4, 1.6, 0.45]}
            >
              <meshStandardMaterial
                color={Math.sin(animationTime * 5 + i) > 0 ? '#00ff00' : '#004400'}
                emissive={Math.sin(animationTime * 5 + i) > 0 ? new THREE.Color('#002200') : new THREE.Color('#000000')}
              />
            </Box>
          ))}
        </>
      )}

      {/* Rack Label */}
      <Html position={[0, 2.8, 0]} center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          minWidth: '60px'
        }}>
          <div>{rackConfig.position}</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {rackConfig.label}
          </div>
          {realData?.status?.temperature && (
            <div style={{ fontSize: '10px', color: getTemperatureColor() }}>
              {realData.status.temperature.toFixed(1)}°C
            </div>
          )}
        </div>
      </Html>

      {/* Selection Indicator */}
      {isSelected && (
        <Box args={[2.2, 2.6, 1.2]} position={[0, 1.1, 0]}>
          <meshStandardMaterial
            color="#ffff00"
            transparent
            opacity={0.2}
            wireframe
          />
        </Box>
      )}
    </group>
  );
};

// Airflow Visualization Component
const AirflowSystem = ({ animationTime }) => {
  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Cold aisle (center) particles
      positions[i * 3] = (Math.random() - 0.5) * 16; // x
      positions[i * 3 + 1] = Math.random() * 3; // y
      positions[i * 3 + 2] = -2 + Math.random() * 4; // z center area
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0.02;
      velocities[i * 3 + 2] = Math.random() > 0.5 ? 0.05 : -0.05; // Hot/Cold flow
    }
    
    return { positions, velocities };
  }, []);

  const particlesRef = useRef();

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Update particle positions for airflow animation
        positions[i + 1] += particles.velocities[i + 1]; // y movement
        positions[i + 2] += particles.velocities[i + 2]; // z movement (cold/hot aisle)
        
        // Reset particles that move too far
        if (positions[i + 1] > 4) {
          positions[i + 1] = 0;
          positions[i] = (Math.random() - 0.5) * 16;
          positions[i + 2] = -2 + Math.random() * 4;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Hot Aisle Zones (behind racks) */}
      <Plane args={[16, 8]} position={[0, 1, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#ff6666"
          transparent
          opacity={0.1}
        />
      </Plane>

      {/* Cold Aisle Zone (center) */}
      <Plane args={[16, 8]} position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#6666ff"
          transparent
          opacity={0.1}
        />
      </Plane>

      {/* Airflow Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particles.positions}
            count={particles.positions.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#88ccff"
          transparent
          opacity={0.6}
        />
      </points>
    </>
  );
};

// Main Data Center Scene
const DataCenterScene = ({ dashboardData, selectedRack, onRackSelect }) => {
  const [animationTime, setAnimationTime] = useState(0);

  useFrame((state, delta) => {
    setAnimationTime(prev => prev + delta);
  });

  const createRackPosition = (row, index) => {
    const x = -7 + index * 2; // 8 racks across
    const z = row === 'A' ? -1.5 : 1.5; // Row A in front, Row B in back
    return [x, 0, z];
  };

  // Map real data to rack positions
  const mapRealDataToRacks = (rackConfig, realData) => {
    // Simple mapping - สามารถปรับแต่งให้ซับซ้อนมากขึ้น
    if (!realData || !Array.isArray(realData)) return null;
    
    // Find matching equipment by type
    const matchingEquipment = realData.find(item => 
      item.type === rackConfig.equipment || 
      (rackConfig.equipment === 'server' && item.type === 'server') ||
      (rackConfig.equipment === 'aircon' && item.type === 'aircon') ||
      (rackConfig.equipment === 'network' && item.type === 'network')
    );
    
    return matchingEquipment || null;
  };

  return (
    <>
      {/* Environment and Lighting */}
      <Environment preset="warehouse" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 10, 0]} intensity={0.5} />

      {/* Airflow System */}
      <AirflowSystem animationTime={animationTime} />

      {/* Row A - Front */}
      {CONTAINMENT_CONFIG.rowA.map((rackConfig, index) => (
        <ServerRack
          key={`A-${index}`}
          position={createRackPosition('A', index)}
          rackConfig={rackConfig}
          realData={mapRealDataToRacks(rackConfig, dashboardData?.dc_racks)}
          onClick={onRackSelect}
          isSelected={selectedRack?.position === rackConfig.position}
          animationTime={animationTime}
        />
      ))}

      {/* Row B - Back */}
      {CONTAINMENT_CONFIG.rowB.map((rackConfig, index) => (
        <ServerRack
          key={`B-${index}`}
          position={createRackPosition('B', index)}
          rackConfig={rackConfig}
          realData={mapRealDataToRacks(rackConfig, dashboardData?.dc_racks)}
          onClick={onRackSelect}
          isSelected={selectedRack?.position === rackConfig.position}
          animationTime={animationTime}
        />
      ))}

      {/* Floor Grid */}
      <gridHelper args={[20, 20, '#444444', '#444444']} position={[0, 0, 0]} />
      
      {/* Floor */}
      <Plane args={[20, 12]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Plane>

      {/* Hot/Cold Aisle Labels */}
      <Html position={[0, 3, -3]} center>
        <div style={{ color: '#ff6666', fontSize: '14px', fontWeight: 'bold' }}>
          🔥 HOT AISLE 🔥
        </div>
      </Html>
      
      <Html position={[0, 3, 3]} center>
        <div style={{ color: '#6666ff', fontSize: '14px', fontWeight: 'bold' }}>
          ❄️ COLD AISLE ❄️
        </div>
      </Html>
    </>
  );
};

// Main Three.js Dashboard Component
const ThreeJsDashboard = () => {
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const [selectedRack, setSelectedRack] = useState(null);

  const handleRackSelect = (rackConfig) => {
    setSelectedRack(rackConfig);
  };

  if (isLoading) {
    return (
      <MUIBox display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </MUIBox>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading dashboard data: {error.message}
      </Alert>
    );
  }

  return (
    <MUIBox>
      {/* Dashboard Header */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          🏢 ECC800 Data Center Containment System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Professional 3D Data Center Visualization with Hot/Cold Aisle Containment
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">DC Summary</Typography>
              <Typography>
                Equipment: {dashboardData?.dc_summary?.active_equipment}/{dashboardData?.dc_summary?.total_equipment}
              </Typography>
              <Typography>
                Avg Temperature: {dashboardData?.dc_summary?.avg_temperature?.toFixed(1) || 'N/A'}°C
              </Typography>
              <Typography>
                Total Power: {dashboardData?.dc_summary?.total_power || 'N/A'}W
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">DR Summary</Typography>
              <Typography>
                Equipment: {dashboardData?.dr_summary?.active_equipment}/{dashboardData?.dr_summary?.total_equipment}
              </Typography>
              <Typography>
                Avg Temperature: {dashboardData?.dr_summary?.avg_temperature?.toFixed(1) || 'N/A'}°C
              </Typography>
              <Typography>
                Total Power: {dashboardData?.dr_summary?.total_power || 'N/A'}W
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3D Visualization */}
      <Paper elevation={3} sx={{ height: '600px', mb: 2 }}>
        <Canvas
          camera={{ 
            position: [0, 15, 10], 
            fov: 60 
          }}
          style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
        >
          <Suspense fallback={null}>
            <DataCenterScene
              dashboardData={dashboardData}
              selectedRack={selectedRack}
              onRackSelect={handleRackSelect}
            />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </Paper>

      {/* Selected Rack Details */}
      {selectedRack && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Equipment: {selectedRack.position} - {selectedRack.label}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2">
                <strong>Position:</strong> {selectedRack.position}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedRack.equipment}
              </Typography>
              <Typography variant="body2">
                <strong>Label:</strong> {selectedRack.label}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Legend */}
      <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Equipment Legend
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Chip icon={<Computer />} label="Server (Blue)" sx={{ backgroundColor: '#2266dd', color: 'white' }} />
          </Grid>
          <Grid item>
            <Chip icon={<AcUnit />} label="Air Conditioning (Green)" sx={{ backgroundColor: '#00aa66', color: 'white' }} />
          </Grid>
          <Grid item>
            <Chip icon={<Router />} label="Network (Orange)" sx={{ backgroundColor: '#ff8800', color: 'white' }} />
          </Grid>
          <Grid item>
            <Chip icon={<Warning />} label="Offline (Red)" sx={{ backgroundColor: '#ff4444', color: 'white' }} />
          </Grid>
        </Grid>
      </Paper>
    </MUIBox>
  );
};

export default ThreeJsDashboard;