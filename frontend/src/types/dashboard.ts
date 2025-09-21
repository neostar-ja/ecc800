/**
 * Dashboard Types
 * Type definitions สำหรับ Dashboard system
 */

export interface DashboardObject {
  id: number
  name: string
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'image'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
  fill: string
  stroke: string
  strokeWidth: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  image_url?: string
  visible: boolean
  locked: boolean
  z_index: number
  parent_id?: number
  dashboard_id?: number
  properties: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface DashboardTemplate {
  id: number
  name: string
  description?: string
  thumbnail?: string
  category: string
  is_public: boolean
  template_data: {
    objects: DashboardObject[]
    canvas: CanvasSettings
    version: string
  }
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface CanvasSettings {
  width: number
  height: number
  backgroundColor: string
  gridEnabled: boolean
  gridSize: number
  gridColor: string
  snapToGrid: boolean
  showRulers: boolean
  zoom: number
  panX: number
  panY: number
}

export interface DashboardState {
  // Objects
  objects: DashboardObject[]
  selectedObjectIds: number[]
  
  // Templates
  templates: DashboardTemplate[]
  
  // Canvas
  canvas: CanvasSettings
  
  // UI State
  editMode: boolean
  previewMode: boolean
  isLoading: boolean
  propertiesPanelVisible: boolean
  layersPanelVisible: boolean
  
  // Actions - Objects
  addObject: (object: DashboardObject) => void
  updateObject: (id: number, updates: Partial<DashboardObject>) => void
  deleteObject: (id: number) => void
  setSelectedObjects: (ids: number[]) => void
  clearSelection: () => void
  duplicateObject: (id: number) => void
  moveObjectToFront: (id: number) => void
  moveObjectToBack: (id: number) => void
  selectObject: (id: number) => void
  
  // Actions - Templates
  addTemplate: (template: DashboardTemplate) => void
  updateTemplate: (id: number, updates: Partial<DashboardTemplate>) => void
  deleteTemplate: (id: number) => void
  
  // Actions - Canvas
  setCanvas: (settings: Partial<CanvasSettings>) => void
  updateCanvas: (settings: Partial<CanvasSettings>) => void
  clearCanvas: () => void
  resetCanvas: () => void
  
  // Actions - UI
  setEditMode: (mode: boolean) => void
  setPreviewMode: (mode: boolean) => void
  setLoading: (loading: boolean) => void
  setPropertiesPanelVisible: (visible: boolean) => void
  setLayersPanelVisible: (visible: boolean) => void
  
  // Actions - Data
  exportCanvas: () => {
    objects: DashboardObject[]
    canvas: CanvasSettings
    metadata: {
      version: string
      exportedAt: string
      objectCount: number
    }
  }
  importCanvas: (data: {
    objects?: DashboardObject[]
    canvas?: Partial<CanvasSettings>
    template?: DashboardTemplate
  }) => void
}

// Creation/Update types
export type CreateDashboardObject = Omit<DashboardObject, 'id' | 'created_at' | 'updated_at'>
export type UpdateDashboardObject = Partial<DashboardObject>

export type CreateDashboardTemplate = Omit<DashboardTemplate, 'id' | 'created_at' | 'updated_at'>
export type UpdateDashboardTemplate = Partial<DashboardTemplate>

// API Response types
export interface DashboardObjectsResponse {
  objects: DashboardObject[]
  total: number
  page: number
  limit: number
}

export interface DashboardTemplatesResponse {
  templates: DashboardTemplate[]
  total: number
  page: number
  limit: number
}

// Canvas export/import types
export interface CanvasExportData {
  objects: DashboardObject[]
  canvas: CanvasSettings
  metadata: {
    version: string
    exportedAt: string
    objectCount: number
  }
}

export interface CanvasImportData {
  objects?: DashboardObject[]
  canvas?: Partial<CanvasSettings>
  template?: DashboardTemplate
}

// Template application types
export interface TemplateApplicationResult {
  objects: DashboardObject[]
  template: DashboardTemplate
  appliedAt: string
}

// Bulk operation types
export interface BulkUpdateRequest {
  id: number
  data: Partial<DashboardObject>
}

export interface BulkUpdateResponse {
  updated: number
  failed: number
  results: Array<{
    id: number
    success: boolean
    error?: string
  }>
}

// Object positioning and manipulation
export interface ObjectPosition {
  x: number
  y: number
}

export interface ObjectSize {
  width: number
  height: number
}

export interface ObjectTransform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
}

// Selection and interaction
export interface SelectionBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface DragState {
  isDragging: boolean
  startPos: ObjectPosition
  currentPos: ObjectPosition
  objectId?: number
}

// Grid and snapping
export interface GridSettings {
  enabled: boolean
  size: number
  color: string
  snapToGrid: boolean
}

// Zoom and pan
export interface ViewportState {
  zoom: number
  panX: number
  panY: number
}

export default {}