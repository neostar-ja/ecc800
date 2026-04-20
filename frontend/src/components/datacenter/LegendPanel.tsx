// LegendPanel - Color coding legend and rack information panel
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Storage,
  Router,
  AcUnit,
  Battery3Bar,
  PowerSettingsNew,
  ThermostatAuto,
  Memory,
  ElectricBolt,
} from '@mui/icons-material';
import { RACK_COLORS, ZONE_COLORS } from '../../data/layout';
import { useLayoutStore, useCurrentLayout } from '../../state/useLayoutStore';
import classNames from 'classnames';

export const LegendPanel: React.FC = () => {
  const { selectedRackId, site } = useLayoutStore();
  const layout = useCurrentLayout();
  
  const selectedRack = selectedRackId 
    ? layout.racks.find(rack => rack.id === selectedRackId)
    : null;

  // Color legend items
  const legendItems = [
    {
      type: 'server' as const,
      label: 'IT Server',
      icon: <Storage />,
      color: RACK_COLORS.server,
      description: 'เซิร์ฟเวอร์และระบบคอมพิวเตอร์',
    },
    {
      type: 'network' as const,
      label: 'Network Equipment',
      icon: <Router />,
      color: RACK_COLORS.network,
      description: 'อุปกรณ์เครือข่ายและสวิตช์',
    },
    {
      type: 'aircon' as const,
      label: 'Air Conditioning',
      icon: <AcUnit />,
      color: RACK_COLORS.aircon,
      description: 'เครื่องปรับอากาศและระบายความร้อน',
    },
    {
      type: 'battery' as const,
      label: 'Battery Cabinet',
      icon: <Battery3Bar />,
      color: RACK_COLORS.battery,
      description: 'ตู้แบตเตอรี่สำรอง',
    },
    {
      type: 'ups' as const,
      label: 'UPS System',
      icon: <PowerSettingsNew />,
      color: RACK_COLORS.ups,
      description: 'ระบบไฟฟ้าสำรอง UPS',
    },
  ];

  // Zone legend items
  const zoneItems = [
    {
      label: 'Cold Aisle (พื้นที่ลมเย็น)',
      color: ZONE_COLORS.cold.primary,
      description: '18-22°C • Optimal cooling zone',
    },
    {
      label: 'Hot Aisle (พื้นที่ลมร้อน)',
      color: ZONE_COLORS.hot.primary,
      description: '25-35°C • Heat exhaust zone',
    },
  ];

  return (
    <Box className="w-80 space-y-4">
      {/* Equipment Legend */}
      <Paper elevation={2} className="p-4">
        <Typography variant="h6" className="font-bold text-gray-800 mb-3">
          อุปกรณ์ใน {site} Site
        </Typography>
        <div className="space-y-2">
          {legendItems.map((item) => {
            const count = layout.racks.filter(rack => rack.type === item.type).length;
            return (
              <div key={item.type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color.primary }}
                />
                <div className="text-gray-600" style={{ color: item.color.icon }}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <Typography variant="body2" className="font-medium">
                    {item.label}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {item.description}
                  </Typography>
                </div>
                <Chip
                  label={`${count}`}
                  size="small"
                  variant="outlined"
                  className="text-xs"
                />
              </div>
            );
          })}
        </div>
      </Paper>

      {/* Zone Legend */}
      <Paper elevation={2} className="p-4">
        <Typography variant="h6" className="font-bold text-gray-800 mb-3">
          โซนอุณหภูมิ
        </Typography>
        <div className="space-y-2">
          {zoneItems.map((zone, index) => (
            <div key={index} className="flex items-center gap-3 p-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: zone.color }}
              />
              <div className="flex-1">
                <Typography variant="body2" className="font-medium">
                  {zone.label}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {zone.description}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </Paper>

      {/* Selected Rack Details */}
      {selectedRack && (
        <Card elevation={3} className="border-l-4" style={{ borderLeftColor: RACK_COLORS[selectedRack.type].primary }}>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: RACK_COLORS[selectedRack.type].primary }}
              />
              <Typography variant="h6" className="font-bold">
                {selectedRack.id}: {selectedRack.label}
              </Typography>
            </div>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <div className="flex items-center gap-1 text-gray-600">
                  <ThermostatAuto fontSize="small" />
                  <Typography variant="body2">
                    {selectedRack.temperature}°C
                  </Typography>
                </div>
              </Grid>
              
              {typeof selectedRack.cpuUsage === 'number' && selectedRack.cpuUsage > 0 && (
                <Grid item xs={6}>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Memory fontSize="small" />
                    <Typography variant="body2">
                      {selectedRack.cpuUsage}%
                    </Typography>
                  </div>
                </Grid>
              )}
              
              <Grid item xs={6}>
                <div className="flex items-center gap-1 text-gray-600">
                  <ElectricBolt fontSize="small" />
                  <Typography variant="body2">
                    {selectedRack.powerUsage}W
                  </Typography>
                </div>
              </Grid>
              
              <Grid item xs={6}>
                <Chip
                  label={selectedRack.status?.toUpperCase()}
                  size="small"
                  className={classNames(
                    'font-medium',
                    {
                      'bg-green-100 text-green-800': selectedRack.status === 'healthy',
                      'bg-yellow-100 text-yellow-800': selectedRack.status === 'warning',
                      'bg-red-100 text-red-800': selectedRack.status === 'critical',
                    }
                  )}
                />
              </Grid>
            </Grid>
            
            <Divider className="my-3" />
            
            <Typography variant="caption" className="text-gray-500">
              Position: Row {selectedRack.row} ({selectedRack.side}) • Type: {selectedRack.type}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Paper elevation={2} className="p-4">
        <Typography variant="h6" className="font-bold text-gray-800 mb-3">
          Site Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" className="text-gray-600">
              Total Racks
            </Typography>
            <Typography variant="h5" className="font-bold text-blue-600">
              {layout.racks.length}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" className="text-gray-600">
              Active Systems
            </Typography>
            <Typography variant="h5" className="font-bold text-green-600">
              {layout.racks.filter(r => r.status === 'healthy').length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};