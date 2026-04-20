// Data Center Layout Configuration
// DC/DR rack configurations with precise positioning

export type RackType = 'server' | 'network' | 'aircon' | 'battery' | 'ups';

// Modern color schemes for realistic thermal zones
export const MODERN_ZONE_COLORS = {
  cold: {
    gradient: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'],
    primary: '#0ea5e9',
    accent: '#38bdf8', 
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #0ea5e9 100%)',
    emoji: '❄️'
  },
  hot: {
    gradient: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444'],
    primary: '#ef4444',
    accent: '#f87171',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #ef4444 100%)', 
    emoji: '🔥'
  }
};

// Professional rack colors with depth and realism
export const MODERN_RACK_COLORS = {
  server: {
    primary: '#1e40af',   // Deep professional blue
    accent: '#3b82f6',    // Bright blue
    highlight: '#60a5fa', // Light blue
    text: '#1e3a8a',      // Dark blue
    icon: '#2563eb'       // Icon blue
  },
  network: {
    primary: '#047857',   // Deep green
    accent: '#10b981',    // Bright green  
    highlight: '#34d399', // Light green
    text: '#064e3b',      // Dark green
    icon: '#059669'       // Icon green
  },
  aircon: {
    primary: '#0c4a6e',   // Deep cyan
    accent: '#0891b2',    // Bright cyan
    highlight: '#22d3ee', // Light cyan
    text: '#164e63',      // Dark cyan
    icon: '#0e7490'       // Icon cyan
  },
  battery: {
    primary: '#c2410c',   // Deep orange
    accent: '#ea580c',    // Bright orange
    highlight: '#fb923c', // Light orange
    text: '#9a3412',      // Dark orange
    icon: '#dc2626'       // Icon orange
  },
  ups: {
    primary: '#7c2d12',   // Deep amber
    accent: '#d97706',    // Bright amber
    highlight: '#fbbf24', // Light amber
    text: '#92400e',      // Dark amber
    icon: '#f59e0b'       // Icon amber
  }
};

// Modern airflow colors for cohesive visualization
export const AIRFLOW_COLORS = {
  cold: {
    particle: '#3b82f6',      // Modern blue
    glow: '#60a5fa',          // Light blue
    trail: '#93c5fd',         // Very light blue
    opacity: 0.7
  },
  hot: {
    particle: '#ef4444',      // Modern red
    glow: '#f87171',          // Light red
    trail: '#fca5a5',         // Very light red
    opacity: 0.6
  }
};

export interface RackItem {
  id: string;          // A1, A2, ...
  label: string;       // IT1, Network1, ...
  type: RackType;
  row: 'A' | 'B';
  side: 'front' | 'back'; // front = แถวหน้า (Row A), back = แถวหลัง (Row B)
  x: number;           // position in px
  y: number;
  temperature?: number;
  cpuUsage?: number;
  powerUsage?: number;
  status?: 'healthy' | 'warning' | 'critical';
}

export interface SiteLayout {
  room: { width: number; height: number; padding: number };
  aisles: {
    hotTop: { x: number; y: number; w: number; h: number };
    coldMid: { x: number; y: number; w: number; h: number };
    hotBottom: { x: number; y: number; w: number; h: number };
  };
  racks: RackItem[];
}

export interface AllLayouts {
  DC: SiteLayout;
  DR: SiteLayout;
}

// Constants for positioning
const ROOM_WIDTH = 1800;
const ROOM_HEIGHT = 800;
const ROOM_PADDING = 100;
const RACK_WIDTH = 160;
const RACK_HEIGHT = 140;
const RACK_GAP_X = 200;
const TOP_ROW_Y = 110;
const BOTTOM_ROW_Y = ROOM_HEIGHT - 270;

// Helper function to calculate rack positions
const placeRow = (row: 'A' | 'B', index: number): { x: number; y: number } => {
  const x = ROOM_PADDING + index * RACK_GAP_X;
  const y = row === 'A' ? TOP_ROW_Y : BOTTOM_ROW_Y;
  return { x, y };
};

// Helper function to map equipment name to type
const getTypeFromLabel = (label: string): RackType => {
  if (label.startsWith('IT')) return 'server';
  if (label.startsWith('Network')) return 'network';
  if (label.startsWith('Air Con')) return 'aircon';
  if (label.includes('Battery')) return 'battery';
  if (label.includes('UPS')) return 'ups';
  return 'server';
};

// Create DC racks according to specification
const createDCRacks = (): RackItem[] => {
  const dcRackSpecs = [
    // Row A (แถวหน้า)
    { id: 'A1', label: 'IT1', row: 'A' as const, index: 0 },
    { id: 'A2', label: 'IT2', row: 'A' as const, index: 1 },
    { id: 'A3', label: 'IT3', row: 'A' as const, index: 2 },
    { id: 'A4', label: 'Air Con3', row: 'A' as const, index: 3 },
    { id: 'A5', label: 'IT4', row: 'A' as const, index: 4 },
    { id: 'A6', label: 'IT5', row: 'A' as const, index: 5 },
    { id: 'A7', label: 'Network1', row: 'A' as const, index: 6 },
    { id: 'A8', label: 'Network2', row: 'A' as const, index: 7 },
    // Row B (แถวหลัง)
    { id: 'B1', label: 'IT6', row: 'B' as const, index: 0 },
    { id: 'B2', label: 'IT7', row: 'B' as const, index: 1 },
    { id: 'B3', label: 'Air Con2', row: 'B' as const, index: 2 },
    { id: 'B4', label: 'IT8', row: 'B' as const, index: 3 },
    { id: 'B5', label: 'IT9', row: 'B' as const, index: 4 },
    { id: 'B6', label: 'Air Con1', row: 'B' as const, index: 5 },
    { id: 'B7', label: 'IT10', row: 'B' as const, index: 6 },
    { id: 'B8', label: 'Network3', row: 'B' as const, index: 7 },
  ];

  return dcRackSpecs.map(spec => {
    const position = placeRow(spec.row, spec.index);
    const type = getTypeFromLabel(spec.label);
    
    // Generate realistic metrics based on type
    let temperature = 22;
    let cpuUsage = 0;
    let powerUsage = 100;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    switch (type) {
      case 'server':
        temperature = 20 + Math.random() * 8; // 20-28°C
        cpuUsage = 40 + Math.random() * 40; // 40-80%
        powerUsage = 300 + Math.random() * 200; // 300-500W
        status = cpuUsage > 75 ? 'warning' : 'healthy';
        break;
      case 'aircon':
        temperature = 15 + Math.random() * 5; // 15-20°C
        cpuUsage = 0;
        powerUsage = 2500 + Math.random() * 500; // 2500-3000W
        break;
      case 'network':
        temperature = 19 + Math.random() * 4; // 19-23°C
        cpuUsage = 10 + Math.random() * 30; // 10-40%
        powerUsage = 100 + Math.random() * 100; // 100-200W
        break;
    }

    return {
      id: spec.id,
      label: spec.label,
      type,
      row: spec.row,
      side: spec.row === 'A' ? 'front' as const : 'back' as const,
      x: position.x,
      y: position.y,
      temperature: Math.round(temperature),
      cpuUsage: Math.round(cpuUsage),
      powerUsage: Math.round(powerUsage),
      status,
    };
  });
};

// Create DR racks according to specification
const createDRRacks = (): RackItem[] => {
  const drRackSpecs = [
    // Row A (แถวหน้า)
    { id: 'A1', label: 'Network3', row: 'A' as const, index: 0 },
    { id: 'A2', label: 'IT5', row: 'A' as const, index: 1 },
    { id: 'A3', label: 'IT4', row: 'A' as const, index: 2 },
    { id: 'A4', label: 'Air Con2', row: 'A' as const, index: 3 },
    { id: 'A5', label: 'Battery Cabinet', row: 'A' as const, index: 4 },
    { id: 'A6', label: 'UPS Cabinet', row: 'A' as const, index: 5 },
    // Row B (แถวหลัง)
    { id: 'B1', label: 'Network1', row: 'B' as const, index: 0 },
    { id: 'B2', label: 'Network2', row: 'B' as const, index: 1 },
    { id: 'B3', label: 'IT3', row: 'B' as const, index: 2 },
    { id: 'B4', label: 'Air Con1', row: 'B' as const, index: 3 },
    { id: 'B5', label: 'IT2', row: 'B' as const, index: 4 },
    { id: 'B6', label: 'IT1', row: 'B' as const, index: 5 },
  ];

  return drRackSpecs.map(spec => {
    const position = placeRow(spec.row, spec.index);
    const type = getTypeFromLabel(spec.label);
    
    // Generate realistic metrics
    let temperature = 22;
    let cpuUsage = 0;
    let powerUsage = 100;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    switch (type) {
      case 'server':
        temperature = 20 + Math.random() * 8;
        cpuUsage = 30 + Math.random() * 35; // DR usually lower usage
        powerUsage = 250 + Math.random() * 150;
        status = 'healthy';
        break;
      case 'aircon':
        temperature = 15 + Math.random() * 5;
        cpuUsage = 0;
        powerUsage = 2200 + Math.random() * 400;
        break;
      case 'network':
        temperature = 19 + Math.random() * 4;
        cpuUsage = 15 + Math.random() * 25;
        powerUsage = 80 + Math.random() * 80;
        break;
      case 'battery':
        temperature = 22 + Math.random() * 6;
        cpuUsage = 0;
        powerUsage = 50 + Math.random() * 30;
        break;
      case 'ups':
        temperature = 25 + Math.random() * 8;
        cpuUsage = 0;
        powerUsage = 800 + Math.random() * 600;
        break;
    }

    return {
      id: spec.id,
      label: spec.label,
      type,
      row: spec.row,
      side: spec.row === 'A' ? 'front' as const : 'back' as const,
      x: position.x,
      y: position.y,
      temperature: Math.round(temperature),
      cpuUsage: Math.round(cpuUsage),
      powerUsage: Math.round(powerUsage),
      status,
    };
  });
};

// Color mapping for rack types - using modern colors
export const RACK_COLORS = MODERN_RACK_COLORS;

// Zone colors - using modern thermal colors
export const ZONE_COLORS = MODERN_ZONE_COLORS;

// Calculate aisle positions
const createAisles = () => ({
  hotTop: {
    x: ROOM_PADDING,
    y: 30,
    w: ROOM_WIDTH - ROOM_PADDING * 2,
    h: 50,
  },
  coldMid: {
    x: ROOM_PADDING,
    y: TOP_ROW_Y + RACK_HEIGHT + 30,
    w: ROOM_WIDTH - ROOM_PADDING * 2,
    h: BOTTOM_ROW_Y - (TOP_ROW_Y + RACK_HEIGHT + 30) - 30,
  },
  hotBottom: {
    x: ROOM_PADDING,
    y: ROOM_HEIGHT - 80,
    w: ROOM_WIDTH - ROOM_PADDING * 2,
    h: 50,
  },
});

// Main layout export
export const LAYOUTS: AllLayouts = {
  DC: {
    room: { width: ROOM_WIDTH, height: ROOM_HEIGHT, padding: ROOM_PADDING },
    aisles: createAisles(),
    racks: createDCRacks(),
  },
  DR: {
    room: { width: ROOM_WIDTH, height: ROOM_HEIGHT, padding: ROOM_PADDING },
    aisles: createAisles(),
    racks: createDRRacks(),
  },
};

// Export constants for components
export {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOM_PADDING,
  RACK_WIDTH,
  RACK_HEIGHT,
  RACK_GAP_X,
  TOP_ROW_Y,
  BOTTOM_ROW_Y,
};