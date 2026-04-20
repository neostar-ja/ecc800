// Canvas Floor - Main Konva Stage with pan/zoom functionality
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useLayoutStore } from '../../state/useLayoutStore';
import { ROOM_WIDTH, ROOM_HEIGHT } from '../../data/layout';

interface CanvasFloorProps {
  children: React.ReactNode;
  width: number;
  height: number;
}

export const CanvasFloor: React.FC<CanvasFloorProps> = ({ children, width, height }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const { zoom, panX, panY, setZoom, setPan } = useLayoutStore();
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.3, Math.min(3, newScale)); // Clamp zoom

    setZoom(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setPan(newPos.x, newPos.y);
  };

  // Handle stage drag
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage;
    setPan(stage.x(), stage.y());
  };

  // Handle stage drag start/end
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  // Sync store state with stage
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) {
      stage.scale({ x: zoom, y: zoom });
      stage.position({ x: panX, y: panY });
      stage.batchDraw();
    }
  }, [zoom, panX, panY]);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      draggable={true}
      onWheel={handleWheel}
      onDragMove={handleDragMove}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <Layer>
        {children}
      </Layer>
    </Stage>
  );
};