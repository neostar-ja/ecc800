/**
 * Properties Panel Component
 * สำหรับแก้ไขคุณสมบัติของ Dashboard Objects
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  IconButton,
  Chip,
  Button,
  SelectChangeEvent
} from '@mui/material'
import {
  ExpandMore,
  Palette,
  FormatSize,
  Transform,
  Visibility,
  Settings,
  Delete
} from '@mui/icons-material'
import { HexColorPicker } from 'react-colorful'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DashboardObject } from '../../types/dashboard'

interface PropertiesPanelProps {
  width?: number
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ width = 300 }) => {
  const {
    objects,
    selectedObjectIds,
    updateObject,
    deleteObject,
    clearSelection
  } = useDashboardStore()

  // สำหรับจัดการสี
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'stroke' | null>(null)
  const [tempColor, setTempColor] = useState('#ffffff')

  // Get selected objects
  const selectedObjects = objects.filter(obj => selectedObjectIds.includes(obj.id))
  const singleObject = selectedObjects.length === 1 ? selectedObjects[0] : null

  // Handle property updates
  const handleUpdateProperty = (property: keyof DashboardObject, value: any) => {
    selectedObjectIds.forEach(id => {
      updateObject(id, { [property]: value })
    })
  }

  // Handle color picker
  const handleColorChange = (color: string) => {
    setTempColor(color)
  }

  const handleColorApply = (type: 'fill' | 'stroke') => {
    handleUpdateProperty(type === 'fill' ? 'fill' : 'stroke', tempColor)
    setShowColorPicker(null)
  }

  const openColorPicker = (type: 'fill' | 'stroke', currentColor: string) => {
    setTempColor(currentColor)
    setShowColorPicker(type)
  }

  // Handle delete
  const handleDelete = () => {
    selectedObjectIds.forEach(id => deleteObject(id))
    clearSelection()
  }

  // แสดงข้อความเมื่อไม่มี object ที่เลือก
  if (selectedObjects.length === 0) {
    return (
      <Paper sx={{ width, height: '100%', p: 3 }}>
        <Typography variant="h6" color="text.secondary" align="center">
          Select an object to edit properties
        </Typography>
      </Paper>
    )
  }

  // แสดงข้อความเมื่อเลือกหลาย objects
  const isMultiSelection = selectedObjects.length > 1

  return (
    <Paper sx={{ width, height: '100%', overflow: 'auto' }}>
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Properties
          </Typography>
          {isMultiSelection && (
            <Chip label={`${selectedObjects.length} objects`} size="small" />
          )}
          <IconButton onClick={handleDelete} color="error" size="small">
            <Delete />
          </IconButton>
        </Box>

        {/* Basic Properties */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">Basic</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Name - แสดงเฉพาะเมื่อเลือก object เดียว */}
              {singleObject && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={singleObject.name}
                    onChange={(e) => handleUpdateProperty('name', e.target.value)}
                  />
                </Grid>
              )}

              {/* Type - แสดงเฉพาะเมื่อเลือก object เดียว */}
              {singleObject && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={singleObject.type}
                      label="Type"
                      onChange={(e: SelectChangeEvent) => handleUpdateProperty('type', e.target.value)}
                    >
                      <MenuItem value="rectangle">Rectangle</MenuItem>
                      <MenuItem value="circle">Circle</MenuItem>
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="line">Line</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Visibility */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={singleObject?.visible ?? true}
                      onChange={(e) => handleUpdateProperty('visible', e.target.checked)}
                    />
                  }
                  label="Visible"
                />
              </Grid>

              {/* Draggable */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={singleObject?.locked ?? true}
                      onChange={(e) => handleUpdateProperty('locked', e.target.checked)}
                    />
                  }
                  label="Draggable"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Transform Properties */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Transform sx={{ mr: 1 }} />
            <Typography variant="subtitle2">Transform</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Position */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="X Position"
                  type="number"
                  value={singleObject?.x ?? 0}
                  onChange={(e) => handleUpdateProperty('x', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Y Position"
                  type="number"
                  value={singleObject?.y ?? 0}
                  onChange={(e) => handleUpdateProperty('y', parseFloat(e.target.value) || 0)}
                />
              </Grid>

              {/* Size */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Width"
                  type="number"
                  value={singleObject?.width ?? 100}
                  onChange={(e) => handleUpdateProperty('width', parseFloat(e.target.value) || 100)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Height"
                  type="number"
                  value={singleObject?.height ?? 100}
                  onChange={(e) => handleUpdateProperty('height', parseFloat(e.target.value) || 100)}
                />
              </Grid>

              {/* Rotation */}
              <Grid item xs={12}>
                <Typography gutterBottom variant="body2">
                  Rotation: {Math.round(singleObject?.rotation ?? 0)}°
                </Typography>
                <Slider
                  value={singleObject?.rotation ?? 0}
                  onChange={(_, value) => handleUpdateProperty('rotation', value)}
                  min={0}
                  max={360}
                  marks={[
                    { value: 0, label: '0°' },
                    { value: 90, label: '90°' },
                    { value: 180, label: '180°' },
                    { value: 270, label: '270°' },
                    { value: 360, label: '360°' }
                  ]}
                />
              </Grid>

              {/* Scale */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Scale X"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={singleObject?.scaleX ?? 1}
                  onChange={(e) => handleUpdateProperty('scaleX', parseFloat(e.target.value) || 1)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Scale Y"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  value={singleObject?.scaleY ?? 1}
                  onChange={(e) => handleUpdateProperty('scaleY', parseFloat(e.target.value) || 1)}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Appearance Properties */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Palette sx={{ mr: 1 }} />
            <Typography variant="subtitle2">Appearance</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Fill Color */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>Fill Color:</Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 30,
                      backgroundColor: singleObject?.fill ?? '#ffffff',
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => openColorPicker('fill', singleObject?.fill ?? '#ffffff')}
                  />
                  <TextField
                    size="small"
                    value={singleObject?.fill ?? '#ffffff'}
                    onChange={(e) => handleUpdateProperty('fill', e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
              </Grid>

              {/* Stroke Color */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>Stroke:</Typography>
                  <Box
                    sx={{
                      width: 40,
                      height: 30,
                      backgroundColor: singleObject?.stroke ?? '#000000',
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => openColorPicker('stroke', singleObject?.stroke ?? '#000000')}
                  />
                  <TextField
                    size="small"
                    value={singleObject?.stroke ?? '#000000'}
                    onChange={(e) => handleUpdateProperty('stroke', e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
              </Grid>

              {/* Stroke Width */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Stroke Width"
                  type="number"
                  inputProps={{ min: 0, step: 0.5 }}
                  value={singleObject?.strokeWidth ?? 1}
                  onChange={(e) => handleUpdateProperty('strokeWidth', parseFloat(e.target.value) || 0)}
                />
              </Grid>

              {/* Opacity */}
              <Grid item xs={12}>
                <Typography gutterBottom variant="body2">
                  Opacity: {Math.round((singleObject?.opacity ?? 1) * 100)}%
                </Typography>
                <Slider
                  value={singleObject?.opacity ?? 1}
                  onChange={(_, value) => handleUpdateProperty('opacity', value)}
                  min={0}
                  max={1}
                  step={0.01}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 0.5, label: '50%' },
                    { value: 1, label: '100%' }
                  ]}
                />
              </Grid>

              {/* Z-Index */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Z-Index (Layer)"
                  type="number"
                  value={singleObject?.z_index ?? 1}
                  onChange={(e) => handleUpdateProperty('z_index', parseInt(e.target.value) || 1)}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Text Properties - แสดงเฉพาะสำหรับ text objects */}
        {singleObject?.type === 'text' && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <FormatSize sx={{ mr: 1 }} />
              <Typography variant="subtitle2">Text</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Text Content"
                    multiline
                    rows={3}
                    value={singleObject.text ?? ''}
                    onChange={(e) => handleUpdateProperty('text', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Font Size"
                    type="number"
                    value={singleObject.fontSize ?? 16}
                    onChange={(e) => handleUpdateProperty('fontSize', parseFloat(e.target.value) || 16)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Font Family</InputLabel>
                    <Select
                      value={singleObject.fontFamily ?? 'Arial'}
                      label="Font Family"
                      onChange={(e: SelectChangeEvent) => handleUpdateProperty('fontFamily', e.target.value)}
                    >
                      <MenuItem value="Arial">Arial</MenuItem>
                      <MenuItem value="Helvetica">Helvetica</MenuItem>
                      <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                      <MenuItem value="Georgia">Georgia</MenuItem>
                      <MenuItem value="Verdana">Verdana</MenuItem>
                      <MenuItem value="monospace">Monospace</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Font Style</InputLabel>
                    <Select
                      value={singleObject.fontStyle ?? 'normal'}
                      label="Font Style"
                      onChange={(e: SelectChangeEvent) => handleUpdateProperty('fontStyle', e.target.value)}
                    >
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="bold">Bold</MenuItem>
                      <MenuItem value="italic">Italic</MenuItem>
                      <MenuItem value="bold italic">Bold Italic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {/* Color Picker Dialog */}
      {showColorPicker && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
            borderRadius: 2
          }}
        >
          <Typography variant="h6" gutterBottom>
            Choose {showColorPicker === 'fill' ? 'Fill' : 'Stroke'} Color
          </Typography>
          <HexColorPicker color={tempColor} onChange={handleColorChange} />
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowColorPicker(null)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => handleColorApply(showColorPicker)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  )
}

export default PropertiesPanel