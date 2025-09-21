/**
 * Konva Canvas Component สำหรับ Dashboard
 * ใช้ React-Konva สำหรับการ render 2D objects
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Circle, Text, Image, Line, Group } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DashboardObject } from '../../types/dashboard'
import { Box, Paper } from '@mui/material'

interface KonvaCanvasProps {
  width: number
  height: number
  onObjectSelect?: (objectId: number) => void
  onObjectUpdate?: (objectId: number, updates: Partial<DashboardObject>) => void
}

// Component สำหรับแสดง Grid
const GridLayer: React.FC<{ 
  width: number; 
  height: number; 
  gridSize: number; 
  visible: boolean 
}> = ({ width, height, gridSize, visible }) => {
  if (!visible) return null

  const lines: JSX.Element[] = []

  // สร้างเส้น Vertical
  for (let i = 0; i < width / gridSize; i++) {
    lines.push(
      <Line
        key={`v${i}`}
        points={[i * gridSize, 0, i * gridSize, height]}
        stroke="#e0e0e0"
        strokeWidth={0.5}
        opacity={0.5}
      />
    )
  }

  // สร้างเส้น Horizontal
  for (let i = 0; i < height / gridSize; i++) {
    lines.push(
      <Line
        key={`h${i}`}
        points={[0, i * gridSize, width, i * gridSize]}
        stroke="#e0e0e0"
        strokeWidth={0.5}
        opacity={0.5}
      />
    )
  }

  return <>{lines}</>
}

// Component สำหรับแสดง Object แต่ละประเภท
const DashboardObjectRenderer: React.FC<{
  object: DashboardObject
  isSelected: boolean
  onSelect: (id: number) => void
  onUpdate: (id: number, updates: Partial<DashboardObject>) => void
}> = ({ object, isSelected, onSelect, onUpdate }) => {
  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    onUpdate(object.id, {
      x: node.x(),
      y: node.y(),
    })
  }, [object.id, onUpdate])

  const handleTransformEnd = useCallback((e: KonvaEventObject<Event>) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale and update size
    node.scaleX(1)
    node.scaleY(1)

    onUpdate(object.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    })
  }, [object.id, onUpdate])

  const commonProps = {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    rotation: object.rotation,
    scaleX: object.scaleX,
    scaleY: object.scaleY,
    opacity: object.opacity,
    visible: object.visible,
    draggable: object.locked,
    fill: object.fill,
    stroke: object.stroke,
    strokeWidth: object.strokeWidth,
    onClick: () => onSelect(object.id),
    onTap: () => onSelect(object.id),
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  }

  // เลือกประเภท Shape ตาม type
  switch (object.type) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          cornerRadius={5}
        />
      )

    case 'circle':
      return (
        <Circle
          {...commonProps}
          radius={Math.min(object.width, object.height) / 2}
        />
      )

    case 'text':
      return (
        <Text
          {...commonProps}
          text={object.text || object.name}
          fontSize={object.fontSize || 16}
          fontFamily={object.fontFamily || 'Arial'}
          fontStyle={object.fontStyle || 'normal'}
          align="left"
          verticalAlign="top"
          wrap="word"
        />
      )

    case 'line':
      return (
        <Line
          {...commonProps}
          points={[0, 0, object.width, object.height]}
        />
      )

    default:
      return (
        <Rect
          {...commonProps}
          cornerRadius={2}
        />
      )
  }
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onObjectSelect,
  onObjectUpdate
}) => {
  const stageRef = useRef<any>(null)
  const {
    objects,
    selectedObjectIds,
    canvas,
    selectObject,
    clearSelection,
    updateObject,
    editMode
  } = useDashboardStore()

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()

    const scaleBy = 1.1
    const stage = e.target.getStage()
    if (!stage) return

    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
    const clampedScale = Math.max(0.1, Math.min(5, newScale))

    setScale(clampedScale)
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    })
  }, [])

  // Handle stage click (deselect when clicking empty area)
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) {
      clearSelection()
    }
  }, [clearSelection])

  // Handle object selection
  const handleObjectSelect = useCallback((objectId: number) => {
    selectObject(objectId)
    onObjectSelect?.(objectId)
  }, [selectObject, onObjectSelect])

  // Handle object updates
  const handleObjectUpdate = useCallback((objectId: number, updates: Partial<DashboardObject>) => {
    updateObject(objectId, updates)
    onObjectUpdate?.(objectId, updates)
  }, [updateObject, onObjectUpdate])

  // Sort objects by z-index
  const sortedObjects = [...objects].sort((a, b) => a.z_index - b.z_index)

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        position: 'relative',
        cursor: editMode ? 'default' : 'grab'
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        draggable={!editMode}
      >
        {/* Background Layer */}
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvas.width}
            height={canvas.height}
            fill={canvas.backgroundColor}
          />
        </Layer>

        {/* Grid Layer */}
        <Layer>
          <GridLayer
            width={canvas.width}
            height={canvas.height}
            gridSize={canvas.gridSize}
            visible={canvas.gridEnabled}
          />
        </Layer>

        {/* Objects Layer */}
        <Layer>
          {sortedObjects.map((object) => (
            <DashboardObjectRenderer
              key={object.id}
              object={object}
              isSelected={selectedObjectIds.includes(object.id)}
              onSelect={handleObjectSelect}
              onUpdate={handleObjectUpdate}
            />
          ))}
        </Layer>

        {/* Selection Layer (for selection rectangles, handles, etc.) */}
        <Layer>
          {selectedObjectIds.map((objectId) => {
            const object = objects.find(obj => obj.id === objectId)
            if (!object || !editMode) return null

            return (
              <Group key={`selection-${objectId}`}>
                {/* Selection Rectangle */}
                <Rect
                  x={object.x - 2}
                  y={object.y - 2}
                  width={object.width + 4}
                  height={object.height + 4}
                  stroke="#2196f3"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="transparent"
                />
                
                {/* Selection Handles */}
                {[
                  { x: -4, y: -4 }, // Top-left
                  { x: object.width, y: -4 }, // Top-right
                  { x: -4, y: object.height }, // Bottom-left
                  { x: object.width, y: object.height }, // Bottom-right
                ].map((handle, index) => (
                  <Rect
                    key={index}
                    x={object.x + handle.x}
                    y={object.y + handle.y}
                    width={8}
                    height={8}
                    fill="#2196f3"
                    stroke="#ffffff"
                    strokeWidth={1}
                    draggable
                  />
                ))}
              </Group>
            )
          })}
        </Layer>
      </Stage>

      {/* Canvas Info Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          px: 2,
          py: 1,
          borderRadius: 1,
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}
      >
        Zoom: {Math.round(scale * 100)}% | Objects: {objects.length} | Selected: {selectedObjectIds.length}
      </Box>
    </Paper>
  )
}

export default KonvaCanvas