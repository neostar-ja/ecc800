import React, { useState, useEffect } from 'react';

// Professional Server Rack Component
function ServerRack({ position, id, label, type = 'server', isActive = true, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  const getColor = () => {
    if (type === 'network') return hovered ? '#4488ff' : '#2266dd';
    if (type === 'aircon') return hovered ? '#00cc88' : '#00aa66';
    return hovered ? '#8888aa' : '#666688';
  };

  const getSecondaryColor = () => {
    if (type === 'network') return '#1144aa';
    if (type === 'aircon') return '#008844';
    return '#444466';
  };

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={() => onClick && onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Main rack body with gradient */}
      <defs>
        <linearGradient id={`rackGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: getColor(), stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: getSecondaryColor(), stopOpacity: 1}} />
        </linearGradient>
        
        {type === 'aircon' && (
          <radialGradient id={`coolEffect-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor: "#ccffff", stopOpacity: 0.3}} />
            <stop offset="100%" style={{stopColor: "#66ccff", stopOpacity: 0.1}} />
          </radialGradient>
        )}
      </defs>
      
      <rect
        width="130"
        height="85"
        fill={`url(#rackGrad-${id})`}
        stroke={hovered ? "#ffdd00" : "#333"}
        strokeWidth={hovered ? "3" : "2"}
        rx="6"
        filter={hovered ? "drop-shadow(0 0 10px rgba(255,221,0,0.5))" : "none"}
      />
      
      {/* Air conditioning cooling effect */}
      {type === 'aircon' && (
        <rect
          width="130"
          height="85"
          fill={`url(#coolEffect-${id})`}
          rx="6"
        >
          <animate
            attributeName="opacity"
            values="0.5;0.8;0.5"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>
      )}
      
      {/* Front panel */}
      <rect
        x="5"
        y="5"
        width="120"
        height="75"
        fill={getSecondaryColor()}
        stroke="#111"
        strokeWidth="1"
        rx="3"
        opacity="0.9"
      />
      
      {/* Status lights */}
      <circle
        cx="20"
        cy="20"
        r="4"
        fill={isActive ? '#00ff00' : '#ff0000'}
        stroke="#000"
        strokeWidth="1"
        opacity={isActive ? 1 : 0.5}
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
        cx="20"
        cy="32"
        r="4"
        fill={isActive ? '#00ff00' : '#ff0000'}
        stroke="#000"
        strokeWidth="1"
        opacity={isActive ? 1 : 0.5}
      >
        {isActive && (
          <animate
            attributeName="opacity"
            values="1;0.6;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      
      {/* Type-specific elements */}
      {type === 'aircon' && (
        <g>
          {/* Fan blades */}
          <g transform="translate(95, 35)">
            <circle cx="0" cy="0" r="15" fill="none" stroke="#cceeff" strokeWidth="2" opacity="0.7"/>
            <g>
              <path d="M-10,0 L10,0 M0,-10 L0,10 M-7,-7 L7,7 M-7,7 L7,-7" stroke="#aaccdd" strokeWidth="2"/>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="1s"
                repeatCount="indefinite"
              />
            </g>
          </g>
          
          {/* Temperature display */}
          <text x="65" y="60" textAnchor="middle" fontSize="10" fill="#ccffff" fontFamily="monospace">
            18°C
          </text>
        </g>
      )}
      
      {type === 'network' && (
        <g>
          {/* Network ports */}
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x={35 + (i % 6) * 12}
              y={45 + Math.floor(i / 6) * 8}
              width="8"
              height="4"
              fill={Math.random() > 0.3 ? '#00ff88' : '#ffaa00'}
              stroke="#000"
              strokeWidth="0.5"
              rx="1"
            >
              {Math.random() > 0.7 && (
                <animate
                  attributeName="fill"
                  values="#00ff88;#88ff00;#00ff88"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
            </rect>
          ))}
          
          {/* Data flow indicator */}
          <text x="65" y="68" textAnchor="middle" fontSize="8" fill="#88ffaa" fontFamily="monospace">
            📡 ACTIVE
          </text>
        </g>
      )}
      
      {type === 'server' && (
        <g>
          {/* Ventilation grilles */}
          {[...Array(8)].map((_, i) => (
            <rect
              key={i}
              x={35 + i * 11}
              y="25"
              width="8"
              height="2"
              fill="#222"
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <rect
              key={i}
              x={35 + i * 11}
              y="35"
              width="8"
              height="2"
              fill="#222"
            />
          ))}
          
          {/* CPU/Memory indicator */}
          <rect x="40" y="50" width="50" height="8" fill="#334455" stroke="#556677" strokeWidth="1" rx="2"/>
          <rect x="42" y="52" width={46 * (0.3 + Math.random() * 0.5)} height="4" fill="#66aa88" rx="1">
            <animate
              attributeName="width"
              values="15;35;25;40;30"
              dur="4s"
              repeatCount="indefinite"
            />
          </rect>
          <text x="65" y="68" textAnchor="middle" fontSize="8" fill="#aabbcc" fontFamily="monospace">
            CPU: {Math.floor(30 + Math.random() * 50)}%
          </text>
        </g>
      )}
      
      {/* Equipment label */}
      <text
        x="65"
        y="15"
        textAnchor="middle"
        fontSize="11"
        fill="white"
        fontFamily="Arial"
        fontWeight="bold"
      >
        {label}
      </text>
      
      {/* Position ID */}
      <text
        x="115"
        y="15"
        textAnchor="middle"
        fontSize="9"
        fill="#cccccc"
        fontFamily="monospace"
      >
        {id}
      </text>
    </g>
  );
}

// Enhanced Professional Airflow Component
function AirflowEffect({ start, end, type = 'cold' }) {
  const pathData = `M ${start.x} ${start.y} Q ${(start.x + end.x) / 2} ${start.y - 20} ${end.x} ${end.y}`;
  const color = type === 'cold' ? '#66ccff' : '#ff6666';
  
  return (
    <g>
      {/* Main airflow path */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth="3"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 20;20 0"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      
      {/* Airflow particles */}
      {[...Array(5)].map((_, i) => (
        <circle
          key={i}
          r="2"
          fill={color}
          opacity="0.8"
        >
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            begin={`${i * 0.6}s`}
            path={pathData}
          />
        </circle>
      ))}
    </g>
  );
}

// Main Professional Data Center Component
function ProfessionalDataCenter() {
  const [selectedRack, setSelectedRack] = useState(null);
  const [racks, setRacks] = useState([]);

  useEffect(() => {
    // Define rack configuration based on requirements
    const rackConfig = [
      // Row A
      { id: 'A1', label: 'IT1', type: 'server', isActive: true },
      { id: 'A2', label: 'IT2', type: 'server', isActive: true },
      { id: 'A3', label: 'IT3', type: 'server', isActive: true },
      { id: 'A4', label: 'Air Con3', type: 'aircon', isActive: true },
      { id: 'A5', label: 'IT4', type: 'server', isActive: true },
      { id: 'A6', label: 'IT5', type: 'server', isActive: true },
      { id: 'A7', label: 'Network1', type: 'network', isActive: true },
      { id: 'A8', label: 'Network2', type: 'network', isActive: true },
      
      // Row B
      { id: 'B1', label: 'IT6', type: 'server', isActive: true },
      { id: 'B2', label: 'IT7', type: 'server', isActive: true },
      { id: 'B3', label: 'Air Con2', type: 'aircon', isActive: true },
      { id: 'B4', label: 'IT8', type: 'server', isActive: true },
      { id: 'B5', label: 'IT9', type: 'server', isActive: true },
      { id: 'B6', label: 'Air Con1', type: 'aircon', isActive: true },
      { id: 'B7', label: 'IT10', type: 'server', isActive: true },
      { id: 'B8', label: 'Network3', type: 'network', isActive: true },
    ];

    const initialRacks = rackConfig.map((config, index) => ({
      ...config,
      position: {
        x: 50 + (index % 8) * 140,
        y: index < 8 ? 80 : 350
      },
      side: index < 8 ? 'top' : 'bottom'
    }));
    
    setRacks(initialRacks);
  }, []);

  const handleRackClick = (rackId) => {
    setSelectedRack(selectedRack === rackId ? null : rackId);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Professional Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          padding: '24px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #60a5fa, #34d399)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🏢 ECC800 Data Center Containment System
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1rem',
            opacity: 0.8
          }}>
            Professional Hot/Cold Aisle Configuration - 16 Rack Infrastructure
          </p>
        </div>

        {/* Main Dashboard Container */}
        <div style={{
          padding: '24px',
          background: 'white'
        }}>
          <svg 
            width="100%" 
            height="600" 
            viewBox="0 0 1200 600" 
            style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
            }}
          >
            {/* Professional SVG Definitions */}
            <defs>
              <pattern id="professionalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
              
              {/* Enhanced Professional Gradients */}
              <linearGradient id="coldZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:"#0ea5e9", stopOpacity:0.3}} />
                <stop offset="50%" style={{stopColor:"#0284c7", stopOpacity:0.2}} />
                <stop offset="100%" style={{stopColor:"#0369a1", stopOpacity:0.1}} />
              </linearGradient>
              
              <linearGradient id="hotZoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:"#ef4444", stopOpacity:0.3}} />
                <stop offset="50%" style={{stopColor:"#dc2626", stopOpacity:0.2}} />
                <stop offset="100%" style={{stopColor:"#b91c1c", stopOpacity:0.1}} />
              </linearGradient>

              {/* Professional Arrow Markers */}
              <marker id="airflowArrow" markerWidth="12" markerHeight="8" 
                      refX="10" refY="4" orient="auto" fill="#0ea5e9">
                <polygon points="0 0, 12 4, 0 8" />
              </marker>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#professionalGrid)" />
            
            {/* Professional Containment Zones */}
            
            {/* Cold Aisle - Top */}
            <rect x="40" y="60" width="1120" height="120" 
                  fill="url(#coldZoneGrad)" 
                  stroke="#0ea5e9" 
                  strokeWidth="2" 
                  rx="8" />
            <text x="600" y="45" textAnchor="middle" fontSize="16" 
                  fill="#0369a1" fontFamily="system-ui" fontWeight="600">
              ❄️ COLD AISLE - SUPPLY AIR (18°C)
            </text>
            
            {/* Hot Aisle - Center */}
            <rect x="40" y="190" width="1120" height="140" 
                  fill="url(#hotZoneGrad)" 
                  stroke="#dc2626" 
                  strokeWidth="2" 
                  rx="8" />
            <text x="600" y="265" textAnchor="middle" fontSize="16" 
                  fill="#b91c1c" fontFamily="system-ui" fontWeight="600">
              🔥 HOT AISLE - RETURN AIR (35°C)
            </text>
            
            {/* Cold Aisle - Bottom */}
            <rect x="40" y="340" width="1120" height="120" 
                  fill="url(#coldZoneGrad)" 
                  stroke="#0ea5e9" 
                  strokeWidth="2" 
                  rx="8" />
            <text x="600" y="485" textAnchor="middle" fontSize="16" 
                  fill="#0369a1" fontFamily="system-ui" fontWeight="600">
              ❄️ COLD AISLE - SUPPLY AIR (18°C)
            </text>

            {/* Professional Airflow Effects */}
            {racks.map((rack, index) => (
              rack.type === 'aircon' && (
                <g key={`professional-airflow-${rack.id}`}>
                  {/* Enhanced cold air distribution */}
                  <AirflowEffect
                    start={{x: rack.position.x + 65, y: 260}}
                    end={{x: rack.position.x + 65, y: rack.side === 'top' ? 180 : 340}}
                    type="cold"
                  />
                  
                  {/* Professional cooling effect */}
                  <circle
                    cx={rack.position.x + 65}
                    cy={260}
                    r="30"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="20;40;20"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0.2;0.6"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )
            ))}
            
            {/* Professional Airflow Arrows */}
            {[...Array(8)].map((_, i) => (
              <g key={`professional-arrows-${i}`}>
                <path
                  d={`M ${115 + i * 140} 250 L ${115 + i * 140} 190`}
                  stroke="#0ea5e9"
                  strokeWidth="3"
                  markerEnd="url(#airflowArrow)"
                  opacity="0.7"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 12;12 0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
                
                <path
                  d={`M ${115 + i * 140} 280 L ${115 + i * 140} 340`}
                  stroke="#0ea5e9"
                  strokeWidth="3"
                  markerEnd="url(#airflowArrow)"
                  opacity="0.7"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    values="0 12;12 0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            ))}
            
            {/* Professional Server Racks */}
            {racks.map(rack => (
              <ServerRack
                key={rack.id}
                position={rack.position}
                id={rack.id}
                label={rack.label}
                type={rack.type}
                isActive={rack.isActive}
                onClick={handleRackClick}
              />
            ))}
            
            {/* Professional Selection Highlight */}
            {selectedRack && racks.find(r => r.id === selectedRack) && (
              <g transform={`translate(${racks.find(r => r.id === selectedRack).position.x - 8}, ${racks.find(r => r.id === selectedRack).position.y - 8})`}>
                <rect width="146" height="101" fill="none" stroke="#f59e0b" strokeWidth="3" rx="8">
                  <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="stroke-width" values="3;5;3" dur="1.5s" repeatCount="indefinite"/>
                </rect>
              </g>
            )}
            
            {/* Professional Row Labels */}
            <text x="20" y="125" textAnchor="middle" fontSize="14" 
                  fill="#0369a1" fontFamily="system-ui" fontWeight="600" 
                  transform="rotate(-90 20 125)">ROW A</text>
            <text x="20" y="395" textAnchor="middle" fontSize="14" 
                  fill="#0369a1" fontFamily="system-ui" fontWeight="600" 
                  transform="rotate(-90 20 395)">ROW B</text>
            
            {/* Professional Position Numbers */}
            {[...Array(8)].map((_, i) => (
              <g key={i}>
                <text x={115 + i * 140} y="35" textAnchor="middle" fontSize="12" 
                      fill="#6b7280" fontFamily="system-ui" fontWeight="500">
                  {i + 1}
                </text>
                <text x={115 + i * 140} y="520" textAnchor="middle" fontSize="12" 
                      fill="#6b7280" fontFamily="system-ui" fontWeight="500">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Professional Info Panel */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Equipment Summary */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>📊 Equipment Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  background: '#f3f4f6',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#6b7280',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>💾 IT Servers (10 units)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  background: '#f3f4f6',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#10b981',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>❄️ Air Conditioning (3 units)</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  background: '#f3f4f6',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    background: '#3b82f6',
                    borderRadius: '50%'
                  }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#374151' }}>📡 Network Equipment (3 units)</span>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937'
              }}>⚙️ System Parameters</h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                <p style={{ margin: '8px 0' }}>🌡️ Optimal temperature: 18-24°C</p>
                <p style={{ margin: '8px 0' }}>💨 Airflow: Hot Aisle → Cold Aisle</p>
                <p style={{ margin: '8px 0' }}>⚡ Power efficiency: 95% PUE</p>
                <p style={{ margin: '8px 0' }}>🖱️ Click equipment for details</p>
              </div>
            </div>

            {/* Selected Equipment Details */}
            {selectedRack && (
              <div style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                padding: '20px',
                borderRadius: '12px',
                color: 'white',
                gridColumn: 'span 2'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>🎯 Selected Equipment Details</h3>
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ margin: '6px 0' }}>
                    <strong>ID:</strong> {selectedRack} | <strong>Label:</strong> {racks.find(r => r.id === selectedRack)?.label}
                  </p>
                  <p style={{ margin: '6px 0' }}>
                    <strong>Type:</strong> {racks.find(r => r.id === selectedRack)?.type}
                  </p>
                  <p style={{ margin: '6px 0' }}>
                    <strong>Status:</strong> {racks.find(r => r.id === selectedRack)?.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </p>
                  <p style={{ margin: '6px 0' }}>
                    <strong>Row:</strong> {selectedRack.startsWith('A') ? 'A (Front Row)' : 'B (Back Row)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalDataCenter;