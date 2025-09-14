import React, { useState, useEffect } from 'react';

// Professional Server Rack Component with enhanced Modern styling
function ServerRack({ position, id, label, type = 'server', isActive = true, onClick, site = 'DC', realData = {} }) {
  const [hovered, setHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  // Enlarge rack size with more vertical space for future info
  const RACK_SCALE_X = 1.30;
  const RACK_SCALE_Y = 1.50;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const getColor = () => {
    if (type === 'network') return hovered ? '#0ea5e9' : '#0284c7';
    if (type === 'aircon') return hovered ? '#10b981' : '#059669';
    if (type === 'battery') return hovered ? '#f59e0b' : '#d97706';
    if (type === 'ups') return hovered ? '#8b5cf6' : '#7c3aed';
    return hovered ? '#64748b' : '#475569';
  };

  const getSecondaryColor = () => {
    if (type === 'network') return '#075985';
    if (type === 'aircon') return '#047857';
    if (type === 'battery') return '#b45309';
    if (type === 'ups') return '#6d28d9';
    return '#334155';
  };

  const getIcon = () => {
    if (type === 'network') return '🌐';
    if (type === 'aircon') return '❄️';
    if (type === 'battery') return '🔋';
    if (type === 'ups') return '⚡';
    return '�';
  };

  const getCpuUsage = () => {
    if (realData.cpuUsage) return Math.round(realData.cpuUsage);
    return 35 + Math.round(Math.random() * 45);
  };

  const getTemperature = () => {
    if (realData.temperature) return realData.temperature;
    if (type === 'aircon') return 18;
    return 22 + Math.round(Math.random() * 8);
  };

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) scale(${RACK_SCALE_X}, ${RACK_SCALE_Y})`}
      onClick={() => onClick && onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Advanced gradient definitions */}
      <defs>
        <linearGradient id={`rackGrad-${site}-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: getColor(), stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: getSecondaryColor(), stopOpacity: 0.9}} />
          <stop offset="100%" style={{stopColor: getSecondaryColor(), stopOpacity: 1}} />
        </linearGradient>
        
        <filter id={`glow-${site}-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feColorMatrix in="coloredBlur" type="matrix" 
            values="1 0 0 0 0.2  0 1 0 0 0.4  0 0 1 0 1  0 0 0 1 0"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id={`modernShadow-${site}-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="4" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.3)"/>
        </filter>

        <radialGradient id={`coolEffect-${site}-${id}`} cx="50%" cy="30%" r="80%">
          <stop offset="0%" style={{stopColor: "#ffffff", stopOpacity: 0.9}} />
          <stop offset="30%" style={{stopColor: "#e0f2fe", stopOpacity: 0.7}} />
          <stop offset="60%" style={{stopColor: "#0ea5e9", stopOpacity: 0.4}} />
          <stop offset="100%" style={{stopColor: "#075985", stopOpacity: 0.1}} />
        </radialGradient>

        <linearGradient id={`modernGlass-${site}-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: "rgba(255,255,255,0.3)", stopOpacity: 1}} />
          <stop offset="50%" style={{stopColor: "rgba(255,255,255,0.1)", stopOpacity: 0.5}} />
          <stop offset="100%" style={{stopColor: "rgba(255,255,255,0.05)", stopOpacity: 0.2}} />
        </linearGradient>
      </defs>
      
      {/* Ultra-modern 3D-style rack body */}
      <g filter={`url(#modernShadow-${site}-${id})`}>
        <rect
          width="125"
          height="100"
          fill={`url(#rackGrad-${site}-${id})`}
          stroke={hovered ? "#fbbf24" : "#475569"}
          strokeWidth={hovered ? "5" : "3"}
          rx="12"
          ry="12"
        >
          <animate
            attributeName="stroke-opacity"
            values={hovered ? "0.5;1;0.5" : "1"}
            dur="1.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values={hovered ? "3;5;3" : "2.5"}
            dur="1.8s"
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Advanced glass morphism effect */}
        <rect
          x="4"
          y="4"
          width="117"
          height="90"
          fill={`url(#modernGlass-${site}-${id})`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          rx="10"
          ry="10"
        >
          <animate
            attributeName="opacity"
            values="0.6;0.9;0.6"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>

        {/* Premium edge lighting */}
        <rect
          x="2"
          y="2"
          width="121"
          height="96"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          rx="11"
          ry="11"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0 400;200 200;400 0"
            dur="4s"
            repeatCount="indefinite"
          />
        </rect>
        
        {/* Air conditioning ultra-modern cooling effect */}
        {type === 'aircon' && (
          <g>
            <rect
              width="125"
              height="85"
              fill={`url(#coolEffect-${site}-${id})`}
              rx="12"
              ry="12"
            >
              <animate
                attributeName="opacity"
                values="0.2;0.9;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </rect>
            
            {/* Premium cooling particle system */}
            {[...Array(12)].map((_, i) => (
              <g key={i}>
                <circle
                  r={2 + (i % 3) * 0.5}
                  fill={i % 2 === 0 ? "#ffffff" : "#0ea5e9"}
                  opacity="0.8"
                  filter="url(#glow-${site}-${id})"
                >
                  <animateMotion
                    dur={`${1.5 + i * 0.2}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.15}s`}
                    path={`M ${15 + i * 8} 85 Q ${25 + i * 8} 45 Q ${35 + i * 8} 20 ${45 + i * 8} 0`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;1;0.5;0"
                    dur={`${1.5 + i * 0.2}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.15}s`}
                  />
                  <animate
                    attributeName="r"
                    values={`${1 + (i % 3) * 0.5};${3 + (i % 3) * 0.5};${1 + (i % 3) * 0.5}`}
                    dur={`${1.5 + i * 0.2}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.15}s`}
                  />
                </circle>
              </g>
            ))}
            
            {/* Advanced cooling waves */}
            {[...Array(4)].map((_, i) => (
              <ellipse
                key={`wave-${i}`}
                cx="62"
                cy="42"
                rx="20"
                ry="10"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                opacity="0.4"
              >
                <animate
                  attributeName="rx"
                  values={`${20 + i * 10};${60 + i * 15};${20 + i * 10}`}
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                />
                <animate
                  attributeName="ry"
                  values={`${10 + i * 5};${25 + i * 8};${10 + i * 5}`}
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0;0.6;0"
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.8}s`}
                />
              </ellipse>
            ))}
          </g>
        )}
      </g>
      
      {/* Modern status indicators */}
      <g transform="translate(15, 15)">
        <circle
          cx="0"
          cy="0"
          r="4"
          fill={isActive ? '#22c55e' : '#ef4444'}
          stroke="#ffffff"
          strokeWidth="1"
        >
          {isActive && (
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        
        <circle
          cx="0"
          cy="12"
          r="3"
          fill={isActive ? (animationPhase % 2 === 0 ? '#3b82f6' : '#06b6d4') : '#94a3b8'}
          stroke="#ffffff"
          strokeWidth="1"
        >
          <animate
            attributeName="fill"
            values="#3b82f6;#06b6d4;#3b82f6"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Row ID badge (bottom-right) */}
      <g transform="translate(92, 82)">
        <rect width="28" height="16" rx="8" ry="8" fill="rgba(255,255,255,0.9)" stroke="#94a3b8" strokeWidth="0.8" />
        <text x="14" y="12" textAnchor="middle" fontSize="9" fill="#111827" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="700">
          {id}
        </text>
      </g>
      
      {/* Enhanced type-specific elements */}
      {type === 'aircon' && (
        <g>
          {/* Advanced fan animation */}
          <g transform="translate(90, 40)">
            <circle cx="0" cy="0" r="16" fill="rgba(14, 165, 233, 0.1)" stroke="#0ea5e9" strokeWidth="2"/>
            <g>
              <path d="M-12,0 L12,0 M0,-12 L0,12 M-8,-8 L8,8 M-8,8 L8,-8" 
                    stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round"/>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </g>
          </g>
          
          {/* Temperature display */}
          <text x="62" y="68" textAnchor="middle" fontSize="10" fill="#ffffff" 
                fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
            {getTemperature()}°C
          </text>
        </g>
      )}
      
      {type === 'network' && (
        <g>
          {/* Modern network ports */}
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x={35 + (i % 6) * 12}
              y={40 + Math.floor(i / 6) * 8}
              width="8"
              height="4"
              fill={Math.random() > 0.4 ? '#22c55e' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth="0.5"
              rx="2"
            >
              {Math.random() > 0.6 && (
                <animate
                  attributeName="fill"
                  values="#22c55e;#06b6d4;#22c55e"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              )}
            </rect>
          ))}
          
          {/* Data flow indicator */}
          <text x="62" y="68" textAnchor="middle" fontSize="9" fill="#ffffff" 
                fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="500">
            📊 ONLINE
          </text>
        </g>
      )}
      
      {(type === 'battery' || type === 'ups') && (
        <g>
          {/* Advanced power indicator bars */}
          {[...Array(8)].map((_, i) => (
            <rect
              key={i}
              x={25 + i * 12}
              y="35"
              width="8"
              height="25"
              fill={i < 6 ? '#22c55e' : i < 7 ? '#fbbf24' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth="1"
              rx="3"
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur={`${1.5 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
          
          {/* Status text */}
          <text x="62" y="74" textAnchor="middle" fontSize="9" fill="#ffffff" 
                fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
            {type === 'battery' ? '🔋 OK' : '⚡ ON'}
          </text>
        </g>
      )}
      
      {type === 'server' && (
        <g>
          {/* Modern ventilation design */}
          {[...Array(8)].map((_, i) => (
            <g key={i}>
              <rect
                x={32 + i * 11}
                y="22"
                width="7"
                height="3"
                fill="rgba(255,255,255,0.2)"
                rx="1"
              />
              <rect
                x={32 + i * 11}
                y="32"
                width="7"
                height="3"
                fill="rgba(255,255,255,0.2)"
                rx="1"
              />
            </g>
          ))}
          
          {/* Modern CPU/Memory indicator */}
          <rect x="35" y="50" width="55" height="10" fill="rgba(255,255,255,0.1)" 
                stroke="rgba(255,255,255,0.3)" strokeWidth="1" rx="5"/>
          <rect x="37" y="52" width={51 * (getCpuUsage() / 100)} height="6" 
                fill={getCpuUsage() > 80 ? '#ef4444' : getCpuUsage() > 60 ? '#fbbf24' : '#22c55e'} rx="3">
            <animate
              attributeName="width"
              values={`${51 * 0.3};${51 * 0.7};${51 * (getCpuUsage() / 100)}`}
              dur="3s"
              repeatCount="indefinite"
            />
          </rect>
          
          <text x="62" y="74" textAnchor="middle" fontSize="8" fill="#ffffff" 
                fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="500">
            CPU: {getCpuUsage()}%
          </text>
        </g>
      )}
      
      {/* Modern equipment icon */}
      <text x="12" y="50" fontSize="18" fill="#ffffff">
        {getIcon()}
      </text>
      
      {/* Equipment label with modern typography */}
      <text
        x="62"
        y="15"
        textAnchor="middle"
        fontSize="11"
        fill="white"
        fontFamily="'IBM Plex Sans Thai', system-ui"
        fontWeight="700"
      >
        {label}
      </text>
    </g>
  );
}

// Ultra-Modern Enhanced Airflow Component
function ModernAirflowEffect({ start, end, type = 'cold', intensity = 'normal', direction = 'horizontal' }) {
  const isHorizontal = direction === 'horizontal';
  const pathData = isHorizontal 
    ? `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${start.y + (type === 'cold' ? -25 : 25)} ${end.x} ${end.y}`
    : `M ${start.x} ${start.y} Q ${start.x + (type === 'cold' ? -25 : 25)} ${(start.y + end.y) / 2} ${end.x} ${end.y}`;
  
  const color = type === 'cold' ? '#0ea5e9' : '#ef4444';
  const glowColor = type === 'cold' ? '#38bdf8' : '#f87171';
  const particleCount = intensity === 'high' ? 12 : 8;
  
  return (
    <g>
      {/* Premium airflow path with advanced gradients */}
      <defs>
        <linearGradient id={`ultraAirflowGrad-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: color, stopOpacity: 0.1}} />
          <stop offset="20%" style={{stopColor: glowColor, stopOpacity: 0.6}} />
          <stop offset="50%" style={{stopColor: "#ffffff", stopOpacity: 0.9}} />
          <stop offset="80%" style={{stopColor: glowColor, stopOpacity: 0.6}} />
          <stop offset="100%" style={{stopColor: color, stopOpacity: 0.1}} />
        </linearGradient>
        
        <filter id={`airflowGlow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feColorMatrix in="coloredBlur" type="matrix" 
            values="1 0 0 0 0.1  0 1 0 0 0.3  0 0 1 0 0.9  0 0 0 1 0"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        
      </defs>
      
      {/* Multi-layer airflow effect */}
      <path
        d={pathData}
        stroke={`url(#ultraAirflowGrad-${type})`}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        filter={`url(#airflowGlow-${type})`}
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 30;30 0;0 30"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-width"
          values="6;10;6"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      
      {/* Additional glow layer */}
      <path
        d={pathData}
        stroke={glowColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      >
        <animate
          attributeName="stroke-dasharray"
          values="5 15;15 5;5 15"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
      
      {/* Ultra-enhanced airflow particles */}
      {[...Array(particleCount)].map((_, i) => (
        <g key={i}>
          <circle
            r={2 + (i % 3) * 0.8}
            fill={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? glowColor : color}
            opacity="0.9"
            filter={`url(#airflowGlow-${type})`}
          >
            <animateMotion
              dur={`${1.5 + i * 0.25}s`}
              repeatCount="indefinite"
              begin={`${i * 0.2}s`}
              path={pathData}
            />
            <animate
              attributeName="opacity"
              values="0;1;0.5;0"
              dur={`${1.5 + i * 0.25}s`}
              repeatCount="indefinite"
              begin={`${i * 0.2}s`}
            />
            <animate
              attributeName="r"
              values={`${1 + (i % 3) * 0.5};${4 + (i % 3) * 0.8};${1 + (i % 3) * 0.5}`}
              dur={`${1.5 + i * 0.25}s`}
              repeatCount="indefinite"
              begin={`${i * 0.2}s`}
            />
          </circle>
          
          {/* ENHANCED: Add secondary particle trail for more realistic air flow */}
          <circle
            r={1 + (i % 2) * 0.3}
            fill={i % 2 === 0 ? "#bae6fd" : "#fecaca"}
            opacity="0.6"
            filter={`url(#airflowGlow-${type})`}
          >
            <animateMotion
              dur={`${2.0 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.3 + 0.5}s`}
              path={pathData}
            />
            <animate
              attributeName="opacity"
              values="0;0.8;0.3;0"
              dur={`${2.0 + i * 0.3}s`}
              repeatCount="indefinite"
              begin={`${i * 0.3 + 0.5}s`}
            />
          </circle>
        </g>
      ))}
    </g>
  );
}

// Main Enhanced Professional Data Center Monitoring Component
function ProfessionalDataCenterMonitoring() {
  const [selectedRack, setSelectedRack] = useState(null);
  const [currentView, setCurrentView] = useState('split');
  const [dcRacks, setDcRacks] = useState([]);
  const [drRacks, setDrRacks] = useState([]);
  const [realTimeData, setRealTimeData] = useState({});

  useEffect(() => {
    // Load Google Fonts for IBM Plex Sans Thai
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Enhanced DC Configuration with real data structure
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

    // DR: top 6, bottom 6; Battery next to UPS (UPS last), Network1/2 center near IT1
    const drConfig = [
      // Row A (Front - 6 items)
      { id: 'A1', label: 'Network3', type: 'network', isActive: true },
      { id: 'A2', label: 'IT5', type: 'server', isActive: true, temperature: 24, cpuUsage: 35 },
      { id: 'A3', label: 'IT4', type: 'server', isActive: true, temperature: 25, cpuUsage: 42 },
      { id: 'A4', label: 'Air Con2', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'A5', label: 'Battery Cabinet', type: 'battery', isActive: true }, // Next to UPS
      { id: 'A6', label: 'UPS Cabinet', type: 'ups', isActive: true },        // Last (rightmost)

      // Row B (Back - 6 items)
      { id: 'B1', label: 'IT3', type: 'server', isActive: true, temperature: 23, cpuUsage: 39 },
      { id: 'B2', label: 'Air Con1', type: 'aircon', isActive: true, temperature: 18 },
      { id: 'B3', label: 'IT2', type: 'server', isActive: true, temperature: 22, cpuUsage: 48 },
      { id: 'B4', label: 'Network1', type: 'network', isActive: true },       // Center-left near IT1
      { id: 'B5', label: 'Network2', type: 'network', isActive: true },       // Center-right near IT1
      { id: 'B6', label: 'IT1', type: 'server', isActive: true, temperature: 24, cpuUsage: 55 }, // Rightmost
    ];

    const positionRacks = (config, offsetX = 0) => {
      // DC: 8 columns grid, centered horizontally, increased spacing
      const cols = 8;
      const gapX = 170;
      const rackWidth = 125 * 1.30; // scaled visual width (X scale)
      const totalWidth = (cols - 1) * gapX + rackWidth;
      const viewWidth = 1400;
      const startX = Math.max(20, (viewWidth - totalWidth) / 2);
      return config.map((rack, index) => ({
        ...rack,
        position: {
          x: startX + (index % cols) * gapX,
          // ENHANCED: Position racks to align with expanded cold aisle (150-430)
          // Row A (front): positioned at top of cold aisle area
          // Row B (back): positioned at bottom of cold aisle area
          y: index < cols ? 160 : 380
        },
        side: index < cols ? 'front' : 'back'
      }));
    };

    // Positioning: DC keeps 8x2 grid; DR uses 6x2 grid with even spacing
    const positionRacksDR = (config, offsetX = 0) => {
      // DR: 6 columns grid, centered horizontally, increased spacing
      const cols = 6;
      const gapX = 220;
      const rackWidth = 125 * 1.30; // scaled visual width (X scale)
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
            // ENHANCED: Position racks to align with expanded cold aisle (150-430)
            // Row A (front): positioned at top of cold aisle area
            // Row B (back): positioned at bottom of cold aisle area
            y: row === 0 ? 160 : 380,
          },
          side: row === 0 ? 'front' : 'back',
        };
      });
    };

    setDcRacks(positionRacks(dcConfig, 0));
    setDrRacks(positionRacksDR(drConfig, 0));

    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        systemStatus: Math.random() > 0.1 ? 'operational' : 'warning'
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRackClick = (rackId) => {
    setSelectedRack(selectedRack === rackId ? null : rackId);
  };

  const renderEnhancedDataCenterView = (racks, title, site, svgWidth = "100%", svgHeight = "650") => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(226, 232, 240, 0.8)'
    }}>
      {/* Enhanced Data Center Header */}
      <div style={{
        background: site === 'DC' ? 
          'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #0ea5e9 100%)' : 
          'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%)',
        padding: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 6px 0',
          fontSize: '1.3rem',
          fontFamily: "'IBM Plex Sans Thai', system-ui",
          fontWeight: '700'
        }}>
          {site === 'DC' ? '🏢' : '🚨'} {title}
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          fontFamily: "'IBM Plex Sans Thai', system-ui",
          fontWeight: '400',
          opacity: 0.9
        }}>
          {site === 'DC' ? 'ศูนย์ข้อมูลหลัก - Primary Data Center' : 'ศูนย์ข้อมูลสำรอง - Disaster Recovery Site'}
        </p>
      </div>

      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${currentView === 'split' ? 1400 : 1500} ${currentView === 'split' ? 600 : 650}`}
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'block'
        }}
      >
        {/* Enhanced SVG Definitions */}
        <defs>
          <pattern id={`modernGrid-${site}`} width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.4"/>
          </pattern>
          
          {/* Enhanced Modern Gradients */}
          <linearGradient id={`modernColdZone-${site}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#e0f2fe", stopOpacity:0.4}} />
            <stop offset="50%" style={{stopColor:"#0ea5e9", stopOpacity:0.25}} />
            <stop offset="100%" style={{stopColor:"#0284c7", stopOpacity:0.15}} />
          </linearGradient>
          
          <linearGradient id={`modernHotZone-${site}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor:"#fef2f2", stopOpacity:0.4}} />
            <stop offset="50%" style={{stopColor:"#ef4444", stopOpacity:0.25}} />
            <stop offset="100%" style={{stopColor:"#dc2626", stopOpacity:0.15}} />
          </linearGradient>

          {/* Modern Arrow Markers (match hot arrows color) */}
          <marker id={`modernArrow-${site}`} markerWidth="14" markerHeight="10" 
                  refX="12" refY="5" orient="auto" fill="#ef4444">
            <polygon points="0 0, 14 5, 0 10" />
          </marker>
        </defs>
        
        <rect width="100%" height="100%" fill={`url(#modernGrid-${site})`} />
        
        {/* Containment Zones */}
        
        
        
        {/* Cold Aisle - Center (Cold air supply from AC units) - ENHANCED SIZE */}
        <rect x="40" y="150" width="1320" height="280" 
              fill={`url(#modernColdZone-${site})`} 
              stroke="#0ea5e9" 
              strokeWidth="6" 
              rx="18" />
        <text x="700" y="290" textAnchor="middle" fontSize="18" 
              fill="#0369a1" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="700">
          ❄️ COLD AISLE - ทางเดินลมเย็น (18°C)
        </text>
        
        {/* Cold Air Distribution Lines */}
        <line x1="40" y1="290" x2="1360" y2="290" 
              stroke="#0ea5e9" strokeWidth="3" strokeDasharray="10,5" opacity="0.6"/>
        <text x="700" y="305" textAnchor="middle" fontSize="12" 
              fill="#0369a1" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="500">
          Cold Air Distribution Line
        </text>
        

        {/* Hot Air Exhaust Zones - Behind Server Rows - ENHANCED SIZE & EQUAL SPACING */}
        {/* Front Row Hot Exhaust - INCREASED SIZE */}
        <rect x="40" y="15" width="1320" height="60" 
              fill={`url(#modernHotZone-${site})`} 
              stroke="#dc2626" 
              strokeWidth="4" 
              rx="12" />
        <text x="700" y="35" textAnchor="middle" fontSize="14" 
              fill="#dc2626" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
          🔥 HOT EXHAUST - อากาศร้อนออก (35°C) - Row A
        </text>
        <text x="700" y="55" textAnchor="middle" fontSize="12" 
              fill="#dc2626" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="400">
          พื้นที่ระบายความร้อนขนาด 60px
        </text>

        {/* Back Row Hot Exhaust - INCREASED SIZE & EQUAL TO FRONT */}
        <rect x="40" y="470" width="1320" height="60" 
              fill={`url(#modernHotZone-${site})`} 
              stroke="#dc2626" 
              strokeWidth="4" 
              rx="12" />
        <text x="700" y="490" textAnchor="middle" fontSize="14" 
              fill="#dc2626" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
          🔥 HOT EXHAUST - อากาศร้อนออก (35°C) - Row B
        </text>
        <text x="700" y="510" textAnchor="middle" fontSize="12" 
              fill="#dc2626" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="400">
          พื้นที่ระบายความร้อนขนาด 60px
        </text>

        {/* Correct Data Center Airflow Physics */}
        {racks.map((rack, index) => (
          <g key={`correctAirflow-${site}-${rack.id}`}>
            {/* Air Conditioning Cold Air Supply */}
            {rack.type === 'aircon' && (
              <g>
                {/* Cold air distribution to center cold aisle */}
                <ModernAirflowEffect
                  start={{x: rack.position.x + 62, y: rack.side === 'front' ? 180 : 350}}
                  end={{x: rack.position.x + 62, y: 270}}
                  type="cold"
                  intensity="high"
                  direction="vertical"
                />
                
                {/* Enhanced cooling effect visualization */}
                <circle
                  cx={rack.position.x + 62}
                  cy={270}
                  r="40"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="4"
                  opacity="0.7"
                  strokeDasharray="8,4"
                >
                  <animate
                    attributeName="r"
                    values="25;55;25"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.4;0.9"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}

            {/* Server Rack Airflow Physics */}
            {(rack.type === 'server' || rack.type === 'it' || rack.type === 'network' || rack.type === 'storage') && (
              <g>
                {/* Cold air intake from center aisle (front of server) */}
                <ModernAirflowEffect
                  start={{x: rack.position.x + 62, y: 270}}
                  end={{x: rack.position.x + 62, y: rack.position.y + 52}}
                  type="cold"
                  intensity="normal"
                  direction="vertical"
                />
                
                {/* Hot air exhaust to rear (back of server) */}
                <ModernAirflowEffect
                  start={{x: rack.position.x + 62, y: rack.position.y + 42}}
                  end={{x: rack.position.x + 62, y: rack.side === 'front' ? 40 : 490}}
                  type="hot"
                  intensity="normal"
                  direction="vertical"
                />
                
                {/* Server intake indicator */}
                <circle
                  cx={rack.position.x + 62}
                  cy={270}
                  r="8"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="2"
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    values="6;12;6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Server exhaust indicator */}
                <circle
                  cx={rack.position.x + 62}
                  cy={rack.side === 'front' ? 40 : 490}
                  r="10"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="8;15;8"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            )}
          </g>
        ))}
        
        {/* Correct Airflow Directional Indicators */}
        {[...Array(6)].map((_, i) => (
          <g key={`correctAirflowArrows-${i}`}>
            {/* Cold air intake arrows - Front row servers (removed for cleaner view) */}
            
            {/* Hot air exhaust arrows - Front row servers (removed) */}

            {/* Cold air intake arrows - Back row servers (removed for cleaner view) */}
            
            {/* Hot air exhaust arrows - Back row servers (removed) */}
          </g>
        ))}
        
        {/* Enhanced Modern Server Racks */}
        {racks.map(rack => (
          <ServerRack
            key={`${site}-${rack.id}`}
            position={rack.position}
            id={rack.id}
            label={rack.label}
            type={rack.type}
            isActive={rack.isActive}
            onClick={handleRackClick}
            site={site}
            realData={rack}
          />
        ))}
        
        {/* Enhanced Selection Highlight (adjusted to larger rack size) */}
        {selectedRack && racks.find(r => r.id === selectedRack) && (
          <g transform={`translate(${racks.find(r => r.id === selectedRack).position.x - 10}, ${racks.find(r => r.id === selectedRack).position.y - 10})`}>
            <rect width="170" height="135" fill="none" stroke="#fbbf24" strokeWidth="5" rx="14">
              <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="stroke-width" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
            </rect>
          </g>
        )}
        
        {/* ENHANCED: Air Flow Direction Arrows */}
        {/* Cold Air Flow Arrows - From AC units to cold aisle */}
        <defs>
          {/* Cold air flow marker */}
          <marker id={`coldFlowArrow-${site}`} markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto" fill="#0ea5e9">
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
          
          {/* Hot air flow marker */}
          <marker id={`hotFlowArrow-${site}`} markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto" fill="#ef4444">
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
        
        {/* Cold Air Flow Arrows - AC units to cold aisle */}
        <line x1="200" y1="50" x2="350" y2="200" 
              stroke="#0ea5e9" strokeWidth="3" 
              markerEnd={`url(#coldFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 20;20 0" dur="2s" repeatCount="indefinite"/>
        </line>
        <line x1="1200" y1="50" x2="1050" y2="200" 
              stroke="#0ea5e9" strokeWidth="3" 
              markerEnd={`url(#coldFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 20;20 0" dur="2s" repeatCount="indefinite"/>
        </line>
        
        {/* Hot Air Flow Arrows - From servers to exhaust zones */}
        <line x1="350" y1="300" x2="200" y2="80" 
              stroke="#ef4444" strokeWidth="3" 
              markerEnd={`url(#hotFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 15;15 0" dur="1.5s" repeatCount="indefinite"/>
        </line>
        <line x1="1050" y1="300" x2="1200" y2="80" 
              stroke="#ef4444" strokeWidth="3" 
              markerEnd={`url(#hotFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 15;15 0" dur="1.5s" repeatCount="indefinite"/>
        </line>
        
        <line x1="350" y1="350" x2="200" y2="520" 
              stroke="#ef4444" strokeWidth="3" 
              markerEnd={`url(#hotFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 15;15 0" dur="1.5s" repeatCount="indefinite"/>
        </line>
        <line x1="1050" y1="350" x2="1200" y2="520" 
              stroke="#ef4444" strokeWidth="3" 
              markerEnd={`url(#hotFlowArrow-${site})`} 
              opacity="0.7">
          <animate attributeName="stroke-dasharray" values="0 15;15 0" dur="1.5s" repeatCount="indefinite"/>
        </line>
        
        {/* ENHANCED: Temperature Indicators for Different Zones */}
        {/* Cold Aisle Temperature */}
        <g transform="translate(700, 250)">
          <rect width="120" height="30" fill="rgba(14, 165, 233, 0.9)" 
                stroke="#0ea5e9" strokeWidth="2" rx="15"/>
          <text x="60" y="20" textAnchor="middle" fontSize="12" 
                fill="white" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
            ❄️ 18°C
          </text>
        </g>
        
        {/* Hot Exhaust Temperature - Row A */}
        <g transform="translate(700, 45)">
          <rect width="120" height="30" fill="rgba(239, 68, 68, 0.9)" 
                stroke="#ef4444" strokeWidth="2" rx="15"/>
          <text x="60" y="20" textAnchor="middle" fontSize="12" 
                fill="white" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
            🔥 35°C
          </text>
        </g>
        
        {/* Hot Exhaust Temperature - Row B */}
        <g transform="translate(700, 495)">
          <rect width="120" height="30" fill="rgba(239, 68, 68, 0.9)" 
                stroke="#ef4444" strokeWidth="2" rx="15"/>
          <text x="60" y="20" textAnchor="middle" fontSize="12" 
                fill="white" fontFamily="'IBM Plex Sans Thai', system-ui" fontWeight="600">
            🔥 35°C
          </text>
        </g>
      </svg>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 30%, #292524 60%, #44403c 100%)',
      padding: '24px',
      fontFamily: "'IBM Plex Sans Thai', system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: '1800px',
        margin: '0 auto'
      }}>
        {/* Ultra-Modern Professional Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Subtle animated background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
            opacity: 0.7
          }}></div>
          
          <div style={{
            padding: '48px 40px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '20px'
            }}>
              {/* Hospital Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
              }}>
                🏥
              </div>
              
              {/* Title */}
              <div style={{ textAlign: 'left' }}>
                <h1 style={{
                  margin: 0,
                  fontSize: '2.5rem',
                  fontFamily: "'IBM Plex Sans Thai', system-ui",
                  fontWeight: '700',
                  color: '#f8fafc',
                  lineHeight: '1.1'
                }}>
                  Data Center Monitoring
                </h1>
                <h2 style={{
                  margin: '8px 0 0 0',
                  fontSize: '1.25rem',
                  fontFamily: "'IBM Plex Sans Thai', system-ui",
                  fontWeight: '500',
                  color: '#cbd5e1',
                  lineHeight: '1.2'
                }}>
                  โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
                </h2>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              background: 'rgba(34, 197, 94, 0.15)',
              borderRadius: '30px',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}></div>
              </div>
              <span style={{
                fontSize: '1rem',
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: '600',
                color: '#22c55e'
              }}>
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* View Controls - Dropdown Selector */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
          padding: '20px 40px',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="view-select" style={{
              fontFamily: "'IBM Plex Sans Thai', system-ui",
              fontWeight: 600,
              color: '#475569'
            }}>
              มุมมอง:
            </label>
            <select
              id="view-select"
              value={currentView}
              onChange={(e) => setCurrentView(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#0f172a',
                fontSize: '1rem',
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <option value="split">DC + DR</option>
              <option value="dc-full">DC</option>
              <option value="dr-full">DR</option>
            </select>
          </div>
        </div>

        {/* Enhanced Main Dashboard Content */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          borderRadius: currentView === 'split' ? '0' : '0 0 20px 20px',
          padding: currentView === 'split' ? '32px' : '40px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          borderTop: 'none'
        }}>
          {currentView === 'split' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px'
            }}>
              {renderEnhancedDataCenterView(dcRacks, "Data Center (DC)", "DC", "100%", "600")}
              {renderEnhancedDataCenterView(drRacks, "Disaster Recovery (DR)", "DR", "100%", "600")}
            </div>
          )}

          {currentView === 'dc-full' && (
            renderEnhancedDataCenterView(dcRacks, "Primary Data Center (DC) - มุมมองแบบเต็ม", "DC", "100%", "680")
          )}

          {currentView === 'dr-full' && (
            renderEnhancedDataCenterView(drRacks, "Disaster Recovery (DR) - มุมมองแบบเต็ม", "DR", "100%", "680")
          )}
        </div>

        {/* Enhanced Professional Info Panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          borderRadius: '0 0 20px 20px',
          padding: '32px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.08)',
          marginTop: currentView === 'split' ? '0' : '-20px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          borderTop: currentView === 'split' ? '1px solid rgba(226, 232, 240, 0.5)' : 'none'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {/* Enhanced System Status */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '28px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 12px 24px rgba(16, 185, 129, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite'
              }}></div>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '1.4rem',
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: '700',
                position: 'relative'
              }}>🌟 สถานะระบบ - System Status</h3>
              <div style={{ fontSize: '1rem', lineHeight: '1.8', fontFamily: "'IBM Plex Sans Thai', system-ui", fontWeight: '500', position: 'relative' }}>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🟢</span> ระบบทำงานปกติทุกส่วน - All Systems Operational
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🌡️</span> อุณหภูมิ: ปกติ (18-24°C) - Temperature Normal
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💨</span> การไหลเวียนอากาศ: เหมาะสม - Airflow Optimal
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚡</span> ไฟฟ้า: เสถียร - Power Stable
                </p>
              </div>
            </div>

            {/* Enhanced Equipment Overview */}
            <div style={{
              background: 'white',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '1.4rem',
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: '700',
                color: '#1f2937'
              }}>📊 สรุปอุปกรณ์ - Equipment Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: '💻', label: 'เครื่องแม่ข่าย - Servers', count: '16 เครื่อง', color: '#64748b' },
                  { icon: '❄️', label: 'เครื่องปรับอากาศ - Air Conditioning', count: '6 เครื่อง', color: '#0ea5e9' },
                  { icon: '🌐', label: 'อุปกรณ์เครือข่าย - Network Equipment', count: '6 เครื่อง', color: '#6366f1' },
                  { icon: '⚡', label: 'ระบบไฟฟ้า - Power Infrastructure', count: '2 เครื่อง', color: '#f59e0b' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ 
                      fontSize: '1rem', 
                      fontFamily: "'IBM Plex Sans Thai', system-ui",
                      fontWeight: '500',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span style={{ 
                      fontFamily: "'IBM Plex Sans Thai', system-ui",
                      fontWeight: '700', 
                      color: item.color,
                      fontSize: '1rem'
                    }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Hospital Information */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              padding: '28px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: '0 12px 24px rgba(59, 130, 246, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30%',
                left: '-30%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: 'pulse 4s ease-in-out infinite'
              }}></div>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '1.4rem',
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: '700',
                position: 'relative'
              }}>🏥 ข้อมูลสถานพยาบาล - Facility Information</h3>
              <div style={{ 
                fontSize: '1rem', 
                lineHeight: '1.8', 
                fontFamily: "'IBM Plex Sans Thai', system-ui",
                fontWeight: '500',
                position: 'relative'
              }}>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>�️</span> มหาวิทยาลัยวลัยลักษณ์ - Walailak University
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏥</span> โรงพยาบาลศูนย์การแพทย์ - Medical Center Hospital
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💻</span> โครงสร้างพื้นฐานดิจิทัลทางการแพทย์ - Medical Digital Infrastructure
                </p>
                <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📍</span> จ.นครศรีธรรมราช - Nakhon Si Thammarat, Thailand
                </p>
              </div>
            </div>

            {/* Enhanced Selected Equipment Details */}
            {selectedRack && (
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                padding: '28px',
                borderRadius: '16px',
                color: 'white',
                gridColumn: currentView === 'split' ? 'span 1' : 'span 2',
                boxShadow: '0 12px 24px rgba(245, 158, 11, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
              <div style={{
                position: 'absolute',
                bottom: '-40%',
                right: '-40%',
                width: '80%',
                height: '80%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              }}></div>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '1.4rem',
                  fontFamily: "'IBM Plex Sans Thai', system-ui",
                  fontWeight: '700',
                  position: 'relative'
                }}>🎯 รายละเอียดอุปกรณ์ที่เลือก - Selected Equipment Details</h3>
                <div style={{ fontSize: '1rem', fontFamily: "'IBM Plex Sans Thai', system-ui", fontWeight: '500', position: 'relative' }}>
                  {(() => {
                    const dcRack = dcRacks.find(r => r.id === selectedRack);
                    const drRack = drRacks.find(r => r.id === selectedRack);
                    const rack = dcRack || drRack;
                    const site = dcRack ? 'DC' : 'DR';
                    
                    return rack ? (
                      <div style={{ lineHeight: '1.8' }}>
                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>🏢 ศูนย์ข้อมูล - Site:</strong> {site === 'DC' ? 'ศูนย์ข้อมูลหลัก - Primary Data Center' : 'ศูนย์ข้อมูลสำรอง - Disaster Recovery'}
                        </p>
                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>🏷️ รหัส - ID:</strong> {selectedRack} | <strong>ชื่อ - Label:</strong> {rack.label}
                        </p>
                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>📋 ประเภท - Type:</strong> {rack.type} | <strong>สถานะ - Status:</strong> {rack.isActive ? '🟢 ทำงาน - Active' : '🔴 ไม่ทำงาน - Inactive'}
                        </p>
                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>📍 ตำแหน่ง - Position:</strong> {selectedRack.startsWith('A') ? 'แถวหน้า - Front Row' : 'แถวหลัง - Back Row'}
                        </p>
                        {rack.temperature && (
                          <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>🌡️ อุณหภูมิ - Temperature:</strong> {rack.temperature}°C
                          </p>
                        )}
                        {rack.cpuUsage && (
                          <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong>⚙️ การใช้งาน CPU:</strong> {rack.cpuUsage}%
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

export default ProfessionalDataCenterMonitoring;
