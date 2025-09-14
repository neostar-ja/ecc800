import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Text,
  Html,
  Environment,
  ContactShadows,
  Float,
  MeshDistortMaterial,
  Sphere,
  Box,
  Cylinder,
  Plane,
  useTexture,
  Sparkles,
  Stars,
  Cloud,
  Sky
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
  Button,
  IconButton,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ViewInAr,
  ZoomIn,
  ZoomOut,
  RotateLeft,
  RotateRight,
  Settings,
  Info,
  Thermostat,
  Power,
  NetworkCheck,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Fullscreen,
  FullscreenExit,
  LightMode,
  DarkMode,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import * as THREE from 'three';

// Modern Data Center Configuration
const DATACENTER_CONFIG = {
  dimensions: {
    width: 20,
    length: 30,
    height: 4
  },
  rows: [
    {
      id: 'rowA',
      name: 'Row A - Production',
      position: { x: -8, z: 0 },
      racks: [
        { id: 'A01', type: 'server', label: 'Web Server 01', power: 2.5, temp: 28 },
        { id: 'A02', type: 'server', label: 'App Server 01', power: 3.2, temp: 32 },
        { id: 'A03', type: 'server', label: 'DB Server 01', power: 4.1, temp: 35 },
        { id: 'A04', type: 'network', label: 'Core Switch', power: 1.8, temp: 25 },
        { id: 'A05', type: 'server', label: 'Web Server 02', power: 2.7, temp: 29 },
        { id: 'A06', type: 'server', label: 'App Server 02', power: 3.0, temp: 31 },
        { id: 'A07', type: 'storage', label: 'SAN Storage', power: 2.2, temp: 27 },
        { id: 'A08', type: 'network', label: 'Edge Switch', power: 1.5, temp: 24 }
      ]
    },
    {
      id: 'rowB',
      name: 'Row B - Development',
      position: { x: 0, z: 0 },
      racks: [
        { id: 'B01', type: 'server', label: 'Dev Server 01', power: 2.1, temp: 26 },
        { id: 'B02', type: 'server', label: 'Test Server 01', power: 2.8, temp: 30 },
        { id: 'B03', type: 'server', label: 'Dev Server 02', power: 2.3, temp: 27 },
        { id: 'B04', type: 'network', label: 'Dev Switch', power: 1.2, temp: 23 },
        { id: 'B05', type: 'server', label: 'CI/CD Server', power: 2.9, temp: 31 },
        { id: 'B06', type: 'storage', label: 'Backup Storage', power: 1.9, temp: 25 },
        { id: 'B07', type: 'server', label: 'Monitor Server', power: 2.4, temp: 28 },
        { id: 'B08', type: 'network', label: 'Access Switch', power: 1.3, temp: 22 }
      ]
    },
    {
      id: 'rowC',
      name: 'Row C - Infrastructure',
      position: { x: 8, z: 0 },
      racks: [
        { id: 'C01', type: 'ups', label: 'UPS Unit 01', power: 8.5, temp: 30 },
        { id: 'C02', type: 'ups', label: 'UPS Unit 02', power: 8.7, temp: 31 },
        { id: 'C03', type: 'battery', label: 'Battery Bank 01', power: 0.5, temp: 25 },
        { id: 'C04', type: 'battery', label: 'Battery Bank 02', power: 0.4, temp: 24 },
        { id: 'C05', type: 'aircon', label: 'CRAC Unit 01', power: 12.3, temp: 18 },
        { id: 'C06', type: 'aircon', label: 'CRAC Unit 02', power: 11.8, temp: 19 },
        { id: 'C07', type: 'network', label: 'Firewall', power: 2.1, temp: 26 },
        { id: 'C08', type: 'network', label: 'Load Balancer', power: 1.7, temp: 24 }
      ]
    }
  ],
  cooling: {
    units: [
      { id: 'CRAC1', position: { x: -12, z: -10 }, airflow: 15000 },
      { id: 'CRAC2', position: { x: 12, z: -10 }, airflow: 14500 },
      { id: 'CRAC3', position: { x: -12, z: 10 }, airflow: 15200 },
      { id: 'CRAC4', position: { x: 12, z: 10 }, airflow: 14800 }
    ]
  }
};

// 3D Data Center Room Component
const DataCenterRoom = ({ dimensions, lighting = true }) => {
  const floorRef = useRef();
  const wallsRef = useRef();

  return (
    <group>
      {/* Floor with realistic texture */}
      <Plane
        ref={floorRef}
        args={[dimensions.width, dimensions.length]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.8}
          metalness={0.1}
        />
      </Plane>

      {/* Walls */}
      <group ref={wallsRef}>
        {/* Back wall */}
        <Plane
          args={[dimensions.width, dimensions.height]}
          position={[0, dimensions.height / 2, -dimensions.length / 2]}
        >
          <meshStandardMaterial
            color="#e8e8e8"
            roughness={0.9}
            metalness={0.0}
          />
        </Plane>

        {/* Front wall (glass) */}
        <Plane
          args={[dimensions.width, dimensions.height]}
          position={[0, dimensions.height / 2, dimensions.length / 2]}
        >
          <meshPhysicalMaterial
            color="#87ceeb"
            transmission={0.8}
            opacity={0.3}
            metalness={0.0}
            roughness={0.1}
            thickness={0.1}
          />
        </Plane>

        {/* Left wall */}
        <Plane
          args={[dimensions.length, dimensions.height]}
          position={[-dimensions.width / 2, dimensions.height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial
            color="#e8e8e8"
            roughness={0.9}
            metalness={0.0}
          />
        </Plane>

        {/* Right wall */}
        <Plane
          args={[dimensions.length, dimensions.height]}
          position={[dimensions.width / 2, dimensions.height / 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial
            color="#e8e8e8"
            roughness={0.9}
            metalness={0.0}
          />
        </Plane>
      </group>

      {/* Ceiling with LED lights */}
      <Plane
        args={[dimensions.width, dimensions.length]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, dimensions.height, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={lighting ? 0.2 : 0}
        />
      </Plane>

      {/* LED Light strips */}
      {lighting && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <group key={i}>
              <Box
                position={[
                  -dimensions.width / 2 + (i * dimensions.width / 8),
                  dimensions.height - 0.1,
                  0
                ]}
                args={[dimensions.width / 10, 0.1, 0.5]}
              >
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={0.8}
                />
              </Box>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

// Modern Server Rack Component
const ModernServerRack = ({
  rack,
  position,
  onClick,
  isSelected,
  realTimeData
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [ledState, setLedState] = useState(true);

  useFrame((state) => {
    if (meshRef.current && rack.type === 'server' && realTimeData?.active) {
      // Subtle breathing animation for active racks
      const time = state.clock.getElapsedTime();
      (meshRef.current as any).scale.y = 1 + Math.sin(time * 2) * 0.02;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLedState(prev => !prev);
    }, 1000 + Math.random() * 500);
    return () => clearInterval(interval);
  }, []);

  const getRackColor = () => {
    const status = realTimeData?.status || 'normal';
    if (status === 'critical') return '#ff4444';
    if (status === 'warning') return '#ffaa44';
    if (status === 'offline') return '#666666';

    switch (rack.type) {
      case 'server': return hovered ? '#4488ff' : '#2266dd';
      case 'network': return hovered ? '#00cc88' : '#00aa66';
      case 'storage': return hovered ? '#ff66aa' : '#cc4488';
      case 'ups': return hovered ? '#ffaa44' : '#ff8800';
      case 'battery': return hovered ? '#aacc44' : '#88aa22';
      case 'aircon': return hovered ? '#44ccff' : '#22aaff';
      default: return '#666666';
    }
  };

  const getEmissiveColor = () => {
    if (!realTimeData?.active) return '#000000';
    return getRackColor();
  };

  return (
    <group
      ref={meshRef}
      position={[position.x, 1, position.z]}
      onClick={() => onClick(rack)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main rack body */}
      <Box args={[0.8, 2, 0.6]}>
        <meshStandardMaterial
          color={getRackColor()}
          metalness={0.7}
          roughness={0.3}
          emissive={getEmissiveColor()}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </Box>

      {/* Rack frame */}
      <Box args={[0.82, 2.02, 0.62]}>
        <meshStandardMaterial
          color="#333333"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.8}
        />
      </Box>

      {/* LED indicators */}
      <group position={[0.35, 1.8, 0.25]}>
        {Array.from({ length: 8 }, (_, i) => (
          <Sphere key={i} args={[0.02]} position={[0, -i * 0.2, 0]}>
            <meshStandardMaterial
              color={ledState ? '#00ff00' : '#004400'}
              emissive={ledState ? '#00ff00' : '#000000'}
              emissiveIntensity={ledState ? 0.5 : 0}
            />
          </Sphere>
        ))}
      </group>

      {/* Server units inside rack */}
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          args={[0.7, 0.12, 0.5]}
          position={[0, 1.6 - i * 0.15, 0]}
        >
          <meshStandardMaterial
            color="#111111"
            metalness={0.8}
            roughness={0.2}
            emissive="#001122"
            emissiveIntensity={0.1}
          />
        </Box>
      ))}

      {/* Cooling fans */}
      {rack.type === 'server' && (
        <group position={[0, 0.8, -0.35]}>
          {Array.from({ length: 4 }, (_, i) => (
            <Cylinder
              key={i}
              args={[0.08, 0.08, 0.05]}
              position={[
                (i % 2 === 0 ? -0.2 : 0.2),
                Math.floor(i / 2) * 0.3,
                0
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial
                color="#cccccc"
                metalness={0.6}
                roughness={0.4}
              />
            </Cylinder>
          ))}
        </group>
      )}

      {/* Cables */}
      <group position={[0, -0.8, 0]}>
        {Array.from({ length: 6 }, (_, i) => (
          <Cylinder
            key={i}
            args={[0.01, 0.01, 1.5]}
            position={[
              -0.3 + i * 0.12,
              0,
              Math.sin(i) * 0.1
            ]}
            rotation={[0, 0, Math.PI / 6]}
          >
            <meshStandardMaterial color="#333333" />
          </Cylinder>
        ))}
      </group>

      {/* Rack label */}
      <Html position={[0, 2.2, 0.35]} center>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          minWidth: '80px'
        }}>
          {rack.label}
        </div>
      </Html>

      {/* Status indicator */}
      {realTimeData && (
        <Html position={[0, -1.2, 0.35]} center>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255,255,255,0.9)',
            padding: '2px 6px',
            borderRadius: '12px',
            fontSize: '10px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: realTimeData.status === 'critical' ? '#ff4444' :
                         realTimeData.status === 'warning' ? '#ffaa44' : '#00aa44'
            }} />
            {realTimeData.temp}°C
          </div>
        </Html>
      )}

      {/* Hover effect */}
      {hovered && (
        <Sparkles
          count={20}
          scale={[2, 2, 2]}
          size={2}
          speed={0.3}
          color={getRackColor()}
        />
      )}
    </group>
  );
};

// Cooling System Visualization
const CoolingSystem = ({ coolingUnits }) => {
  return (
    <group>
      {coolingUnits.map((unit, index) => (
        <group key={unit.id} position={[unit.position.x, 1, unit.position.z]}>
          {/* CRAC Unit body */}
          <Box args={[2, 2.5, 1]}>
            <meshStandardMaterial
              color="#e8f4f8"
              metalness={0.3}
              roughness={0.7}
            />
          </Box>

          {/* Intake vents */}
          <group position={[0, 0, 0.6]}>
            {Array.from({ length: 6 }, (_, i) => (
              <Box
                key={i}
                args={[0.3, 0.3, 0.1]}
                position={[
                  -0.6 + (i % 3) * 0.6,
                  0.8 - Math.floor(i / 3) * 0.6,
                  0
                ]}
              >
                <meshStandardMaterial color="#666666" />
              </Box>
            ))}
          </group>

          {/* Exhaust vents with animation */}
          <group position={[0, 0, -0.6]}>
            {Array.from({ length: 6 }, (_, i) => (
              <Box
                key={i}
                args={[0.3, 0.3, 0.1]}
                position={[
                  -0.6 + (i % 3) * 0.6,
                  0.8 - Math.floor(i / 3) * 0.6,
                  0
                ]}
              >
                <meshStandardMaterial
                  color="#444444"
                  emissive="#0066aa"
                  emissiveIntensity={0.2}
                />
              </Box>
            ))}
          </group>

          {/* Airflow visualization */}
          <group position={[0, 0, -0.8]}>
            {Array.from({ length: 20 }, (_, i) => (
              <Sphere
                key={i}
                args={[0.02]}
                position={[
                  (Math.random() - 0.5) * 3,
                  Math.random() * 2,
                  Math.random() * 2
                ]}
              >
                <meshStandardMaterial
                  color="#87ceeb"
                  transparent
                  opacity={0.3}
                />
              </Sphere>
            ))}
          </group>

          {/* Unit label */}
          <Html position={[0, 1.5, 0.6]} center>
            <div style={{
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {unit.id}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};

// Main Modern Data Center Layout Component
const ModernDataCenterLayout = () => {
  const [selectedRack, setSelectedRack] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'
  const [showControls, setShowControls] = useState(true);
  const [lightingEnabled, setLightingEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {};
      DATACENTER_CONFIG.rows.forEach(row => {
        row.racks.forEach(rack => {
          newData[rack.id] = {
            active: Math.random() > 0.1,
            temp: rack.temp + (Math.random() - 0.5) * 5,
            power: rack.power + (Math.random() - 0.5) * 0.5,
            status: Math.random() > 0.9 ? 'critical' :
                    Math.random() > 0.8 ? 'warning' : 'normal'
          };
        });
      });
      setRealTimeData(newData);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRackClick = (rack) => {
    setSelectedRack(rack);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <MUIBox sx={{
      width: '100%',
      height: fullscreen ? '100vh' : '80vh',
      position: 'relative',
      bgcolor: 'background.default'
    }}>
      {/* Control Panel */}
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          p: 2,
          minWidth: 300,
          display: showControls ? 'block' : 'none'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Data Center Controls
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewMode === '3d'}
                  onChange={(e) => setViewMode(e.target.checked ? '3d' : '2d')}
                />
              }
              label="3D View"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={lightingEnabled}
                  onChange={(e) => setLightingEnabled(e.target.checked)}
                />
              }
              label="Lighting"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Overall Status
            </Typography>
            <MUIBox sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircle />}
                label="Systems: 98%"
                color="success"
                size="small"
              />
              <Chip
                icon={<Thermostat />}
                label="Temp: 24°C"
                color="info"
                size="small"
              />
              <Chip
                icon={<Power />}
                label="Power: 85%"
                color="warning"
                size="small"
              />
            </MUIBox>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <MUIBox sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Tooltip title={showControls ? "Hide Controls" : "Show Controls"}>
          <Fab
            size="small"
            onClick={() => setShowControls(!showControls)}
            color="primary"
          >
            {showControls ? <VisibilityOff /> : <Visibility />}
          </Fab>
        </Tooltip>

        <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <Fab
            size="small"
            onClick={toggleFullscreen}
            color="secondary"
          >
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </Fab>
        </Tooltip>
      </MUIBox>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [15, 8, 15],
          fov: 60
        }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={lightingEnabled ? 1 : 0.3}
            castShadow
          />
          <pointLight
            position={[0, DATACENTER_CONFIG.dimensions.height, 0]}
            intensity={lightingEnabled ? 0.5 : 0.1}
          />

          {/* Environment */}
          <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
          />
          <Environment preset="warehouse" />

          {/* Data Center Room */}
          <DataCenterRoom
            dimensions={DATACENTER_CONFIG.dimensions}
            lighting={lightingEnabled}
          />

          {/* Server Racks */}
          {DATACENTER_CONFIG.rows.map((row) =>
            row.racks.map((rack, rackIndex) => (
              <ModernServerRack
                key={rack.id}
                rack={rack}
                position={{
                  x: row.position.x,
                  z: row.position.z - 3 + rackIndex * 1.2
                }}
                onClick={handleRackClick}
                isSelected={selectedRack?.id === rack.id}
                realTimeData={realTimeData[rack.id]}
              />
            ))
          )}

          {/* Cooling System */}
          <CoolingSystem coolingUnits={DATACENTER_CONFIG.cooling.units} />

          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={50}
          />

          {/* Effects */}
          <Sparkles count={50} scale={[30, 30, 30]} size={1} speed={0.2} />
        </Suspense>
      </Canvas>

      {/* Selected Equipment Details Panel */}
      {selectedRack && (
        <Drawer
          anchor="right"
          open={!!selectedRack}
          onClose={() => setSelectedRack(null)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 400,
              p: 2
            }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Equipment Details
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{selectedRack.label}</Typography>
                  <Typography color="textSecondary">{selectedRack.id}</Typography>
                  <Chip
                    label={selectedRack.type}
                    color="primary"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {realTimeData[selectedRack.id] && (
              <>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Temperature
                      </Typography>
                      <Typography variant="h5">
                        {realTimeData[selectedRack.id].temp.toFixed(1)}°C
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Power Usage
                      </Typography>
                      <Typography variant="h5">
                        {realTimeData[selectedRack.id].power.toFixed(1)} kW
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        label={realTimeData[selectedRack.id].status}
                        color={
                          realTimeData[selectedRack.id].status === 'critical' ? 'error' :
                          realTimeData[selectedRack.id].status === 'warning' ? 'warning' : 'success'
                        }
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </Drawer>
      )}

      {/* Loading indicator */}
      <MUIBox sx={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 1000
      }}>
        <Typography variant="body2" color="white">
          Modern Data Center Layout - Real-time Monitoring
        </Typography>
      </MUIBox>
    </MUIBox>
  );
};

export default ModernDataCenterLayout;