/**
 * Dashboard Toolbar Component
 * เครื่องมือสำหรับจัดการ Dashboard Objects
 */

import React, { useState } from 'react'
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Button,
  ButtonGroup,
  Tooltip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  Slider,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid
} from '@mui/material'
import {
  Add,
  Delete,
  ContentCopy,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  ZoomOutMap,
  Grid3x3,
  Visibility,
  VisibilityOff,
  Lock,
  LockOpen,
  FlipToFront,
  FlipToBack,
  Save,
  Folder,
  Settings,
  Palette,
  TextFields,
  CropSquare,
  Circle,
  Timeline,
  Image as ImageIcon,
  Edit,
  Preview
} from '@mui/icons-material'
import { useDashboardStore } from '../../stores/dashboardStore'
import type { DashboardObject } from '../../types/dashboard'

interface DashboardToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onSave?: () => void
  onLoad?: () => void
}

const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSave,
  onLoad
}) => {
  const {
    selectedObjectIds,
    canvas,
    editMode,
    addObject,
    deleteObject,
    duplicateObject,
    moveObjectToFront,
    moveObjectToBack,
    updateCanvas,
    setEditMode,
    clearSelection,
    objects
  } = useDashboardStore()

  // State สำหรับ UI
  const [shapeMenuAnchor, setShapeMenuAnchor] = useState<null | HTMLElement>(null)
  const [newObjectDialog, setNewObjectDialog] = useState(false)
  const [newObjectType, setNewObjectType] = useState<string>('rectangle')
  const [newObjectName, setNewObjectName] = useState('')
  const [colorPickerAnchor, setColorPickerAnchor] = useState<null | HTMLElement>(null)

  // Handle การเพิ่ม Object ใหม่
  const handleAddObject = () => {
    setNewObjectDialog(true)
  }

  const handleCreateObject = () => {
    if (!newObjectName.trim()) return

    const newObject: DashboardObject = {
      id: Date.now() + Math.random(), // Temporary ID
      name: newObjectName,
      type: newObjectType as 'rectangle' | 'circle' | 'text' | 'line' | 'image',
      x: Math.random() * (canvas.width - 100),
      y: Math.random() * (canvas.height - 100),
      width: newObjectType === 'text' ? 200 : 100,
      height: newObjectType === 'text' ? 50 : 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      fill: '#2196f3',
      stroke: '#1976d2',
      strokeWidth: 2,
      opacity: 1,
      text: newObjectType === 'text' ? newObjectName : undefined,
      fontFamily: 'Arial',
      fontSize: 16,
      fontStyle: 'normal',
      fontWeight: 'normal',
      textAlign: 'center',
      verticalAlign: 'middle',
      z_index: objects.length + 1,
      visible: true,
      locked: false,
      properties: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    addObject(newObject)
    setNewObjectDialog(false)
    setNewObjectName('')
  }

  // Handle การลบ Objects
  const handleDeleteSelected = () => {
    selectedObjectIds.forEach(id => {
      deleteObject(id)
    })
    clearSelection()
  }

  // Handle การ Duplicate Objects
  const handleDuplicateSelected = () => {
    selectedObjectIds.forEach(id => {
      duplicateObject(id)
    })
  }

  // Handle Toggle Grid
  const handleToggleGrid = () => {
    updateCanvas({ gridEnabled: !canvas.gridEnabled })
  }

  // Handle Edit Mode Toggle
  const handleEditModeToggle = (_event: React.MouseEvent<HTMLElement>, value: boolean) => {
    if (value !== null) {
      setEditMode(value)
    }
  }

  // ตัวเลือกประเภท Object
  const objectTypes = [
    { value: 'rectangle', label: 'Rectangle', icon: <CropSquare /> },
    { value: 'circle', label: 'Circle', icon: <Circle /> },
    { value: 'text', label: 'Text', icon: <TextFields /> },
    { value: 'line', label: 'Line', icon: <Timeline /> },
    { value: 'image', label: 'Image', icon: <ImageIcon /> },
  ]

  const hasSelectedObjects = selectedObjectIds.length > 0

  return (
    <Paper elevation={2} sx={{ mb: 2 }}>
      <Toolbar variant="dense" sx={{ minHeight: '48px', gap: 1 }}>
        {/* Edit Mode Toggle */}
        <ToggleButtonGroup
          value={editMode}
          exclusive
          onChange={handleEditModeToggle}
          aria-label="edit mode"
          size="small"
        >
          <ToggleButton value={true} aria-label="edit mode">
            <Edit />
          </ToggleButton>
          <ToggleButton value={false} aria-label="preview mode">
            <Preview />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Object Creation */}
        <ButtonGroup variant="outlined" size="small">
          <Button
            startIcon={<Add />}
            onClick={handleAddObject}
            disabled={!editMode}
          >
            Add Object
          </Button>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Object Operations */}
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Duplicate Selected">
            <IconButton
              onClick={handleDuplicateSelected}
              disabled={!hasSelectedObjects || !editMode}
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Selected">
            <IconButton
              onClick={handleDeleteSelected}
              disabled={!hasSelectedObjects || !editMode}
              color="error"
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Layer Operations */}
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Bring to Front">
            <IconButton
              onClick={() => selectedObjectIds.forEach(id => moveObjectToFront(id))}
              disabled={!hasSelectedObjects || !editMode}
            >
              <FlipToFront />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send to Back">
            <IconButton
              onClick={() => selectedObjectIds.forEach(id => moveObjectToBack(id))}
              disabled={!hasSelectedObjects || !editMode}
            >
              <FlipToBack />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Zoom Controls */}
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Zoom In">
            <IconButton onClick={onZoomIn}>
              <ZoomIn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={onZoomOut}>
              <ZoomOut />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton onClick={onZoomReset}>
              <ZoomOutMap />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* View Options */}
        <Tooltip title="Toggle Grid">
          <IconButton
            onClick={handleToggleGrid}
            color={canvas.gridEnabled ? 'primary' : 'default'}
          >
            <Grid3x3 />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* File Operations */}
        <ButtonGroup variant="outlined" size="small">
          <Tooltip title="Save Canvas">
            <IconButton onClick={onSave}>
              <Save />
            </IconButton>
          </Tooltip>
          <Tooltip title="Load Template">
            <IconButton onClick={onLoad}>
              <Folder />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Canvas Info */}
        <Typography variant="body2" color="text.secondary">
          Objects: {objects.length} | Selected: {selectedObjectIds.length}
        </Typography>
      </Toolbar>

      {/* New Object Dialog */}
      <Dialog
        open={newObjectDialog}
        onClose={() => setNewObjectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Object</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Object Name"
                value={newObjectName}
                onChange={(e) => setNewObjectName(e.target.value)}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Object Type</InputLabel>
                <Select
                  value={newObjectType}
                  label="Object Type"
                  onChange={(e: SelectChangeEvent) => setNewObjectType(e.target.value)}
                >
                  {objectTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewObjectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateObject}
            variant="contained"
            disabled={!newObjectName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default DashboardToolbar