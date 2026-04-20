// Aisles - Modern thermal zones with realistic colors and clean design
import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import { useCurrentLayout } from '../../state/useLayoutStore';
import { MODERN_ZONE_COLORS } from '../../data/layout';

export const Aisles: React.FC = () => {
  const layout = useCurrentLayout();
  const { aisles } = layout;

  return (
    <Group>
      {/* Hot Aisle (Top) - Modern gradient */}
      <Rect
        x={aisles.hotTop.x}
        y={aisles.hotTop.y}
        width={aisles.hotTop.w}
        height={aisles.hotTop.h}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: aisles.hotTop.w, y: aisles.hotTop.h }}
        fillLinearGradientColorStops={[
          0, MODERN_ZONE_COLORS.hot.gradient[0],
          0.3, MODERN_ZONE_COLORS.hot.gradient[2],
          0.7, MODERN_ZONE_COLORS.hot.gradient[4],
          1, MODERN_ZONE_COLORS.hot.gradient[5]
        ]}
        opacity={0.8}
        cornerRadius={12}
      />
      
      {/* Hot Aisle Label (Top) */}
      <Text
        x={aisles.hotTop.x + 30}
        y={aisles.hotTop.y + 18}
        text={`${MODERN_ZONE_COLORS.hot.emoji} HOT AISLE - พื้นที่ลมร้อน`}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
        fontStyle="bold"
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={1}
        shadowOffset={{ x: 1, y: 1 }}
      />

      {/* Cold Aisle (Middle) - Modern blue gradient */}
      <Rect
        x={aisles.coldMid.x}
        y={aisles.coldMid.y}
        width={aisles.coldMid.w}
        height={aisles.coldMid.h}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: aisles.coldMid.w, y: aisles.coldMid.h }}
        fillLinearGradientColorStops={[
          0, MODERN_ZONE_COLORS.cold.gradient[0],
          0.3, MODERN_ZONE_COLORS.cold.gradient[2], 
          0.7, MODERN_ZONE_COLORS.cold.gradient[4],
          1, MODERN_ZONE_COLORS.cold.gradient[5]
        ]}
        opacity={0.8}
        cornerRadius={12}
      />
      
      {/* Cold Aisle Label */}
      <Text
        x={aisles.coldMid.x + aisles.coldMid.w / 2}
        y={aisles.coldMid.y + aisles.coldMid.h / 2 - 8}
        text={`${MODERN_ZONE_COLORS.cold.emoji} COLD AISLE - พื้นที่ลมเย็น`}
        fontSize={18}
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
        fontStyle="bold"
        align="center"
        offsetX={120}
        shadowColor="rgba(0,0,0,0.4)"
        shadowBlur={2}
      />
      
      <Text
        x={aisles.coldMid.x + aisles.coldMid.w / 2}
        y={aisles.coldMid.y + aisles.coldMid.h / 2 + 15}
        text="Temperature: 18-22°C • Optimal Cooling Zone"
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill="rgba(255,255,255,0.9)"
        align="center"
        offsetX={140}
      />

      {/* Hot Aisle (Bottom) - Modern gradient */}
      <Rect
        x={aisles.hotBottom.x}
        y={aisles.hotBottom.y}
        width={aisles.hotBottom.w}
        height={aisles.hotBottom.h}
        fillLinearGradientStartPoint={{ x: 0, y: aisles.hotBottom.h }}
        fillLinearGradientEndPoint={{ x: aisles.hotBottom.w, y: 0 }}
        fillLinearGradientColorStops={[
          0, MODERN_ZONE_COLORS.hot.gradient[0],
          0.3, MODERN_ZONE_COLORS.hot.gradient[2],
          0.7, MODERN_ZONE_COLORS.hot.gradient[4],
          1, MODERN_ZONE_COLORS.hot.gradient[5]
        ]}
        opacity={0.8}
        cornerRadius={12}
      />
      
      {/* Hot Aisle Label (Bottom) */}
      <Text
        x={aisles.hotBottom.x + 30}
        y={aisles.hotBottom.y + 18}
        text={`${MODERN_ZONE_COLORS.hot.emoji} HOT AISLE - พื้นที่ลมร้อน`}
        fontSize={14}
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
        fontStyle="bold"
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={1}
        shadowOffset={{ x: 1, y: 1 }}
      />
    </Group>
  );
};