/**
 * Dashboard Store
 * Zustand store สำหรับจัดการ state ของ Dashboard system
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  DashboardState, 
  DashboardObject, 
  DashboardTemplate, 
  CanvasSettings,
  CanvasExportData,
  CanvasImportData 
} from '../types/dashboard'

// Default canvas settings
const defaultCanvasSettings: CanvasSettings = {
  width: 1200,
  height: 800,
  backgroundColor: '#ffffff',
  gridEnabled: true,
  gridSize: 20,
  gridColor: '#e0e0e0',
  snapToGrid: true,
  showRulers: false,
  zoom: 1,
  panX: 0,
  panY: 0
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      objects: [],
      selectedObjectIds: [],
      templates: [],
      canvas: defaultCanvasSettings,
      editMode: true,
      previewMode: false,
      isLoading: false,
      propertiesPanelVisible: false,
      layersPanelVisible: false,

      // Object actions
      addObject: (object: DashboardObject) =>
        set((state) => {
          state.objects.push(object)
        }),

      updateObject: (id: number, updates: Partial<DashboardObject>) =>
        set((state) => {
          const index = state.objects.findIndex(obj => obj.id === id)
          if (index !== -1) {
            Object.assign(state.objects[index], updates)
          }
        }),

      deleteObject: (id: number) =>
        set((state) => {
          state.objects = state.objects.filter(obj => obj.id !== id)
          state.selectedObjectIds = state.selectedObjectIds.filter(selectedId => selectedId !== id)
        }),

      setSelectedObjects: (ids: number[]) =>
        set((state) => {
          state.selectedObjectIds = ids
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedObjectIds = []
        }),

      // Additional object methods
      duplicateObject: (id: number) =>
        set((state) => {
          const objectToDuplicate = state.objects.find(obj => obj.id === id)
          if (objectToDuplicate) {
            const newObject = {
              ...objectToDuplicate,
              id: Date.now() + Math.random(), // Temporary ID
              name: `${objectToDuplicate.name} Copy`,
              x: objectToDuplicate.x + 20,
              y: objectToDuplicate.y + 20,
            }
            state.objects.push(newObject)
          }
        }),

      moveObjectToFront: (id: number) =>
        set((state) => {
          const maxZIndex = Math.max(...state.objects.map(obj => obj.z_index || 0))
          const index = state.objects.findIndex(obj => obj.id === id)
          if (index !== -1) {
            state.objects[index].z_index = maxZIndex + 1
          }
        }),

      moveObjectToBack: (id: number) =>
        set((state) => {
          const minZIndex = Math.min(...state.objects.map(obj => obj.z_index || 0))
          const index = state.objects.findIndex(obj => obj.id === id)
          if (index !== -1) {
            state.objects[index].z_index = minZIndex - 1
          }
        }),

      selectObject: (id: number) =>
        set((state) => {
          state.selectedObjectIds = [id]
        }),

      // Template actions
      addTemplate: (template: DashboardTemplate) =>
        set((state) => {
          state.templates.push(template)
        }),

      updateTemplate: (id: number, updates: Partial<DashboardTemplate>) =>
        set((state) => {
          const index = state.templates.findIndex(tpl => tpl.id === id)
          if (index !== -1) {
            Object.assign(state.templates[index], updates)
          }
        }),

      deleteTemplate: (id: number) =>
        set((state) => {
          state.templates = state.templates.filter(tpl => tpl.id !== id)
        }),

      // Canvas actions
      setCanvas: (settings: Partial<CanvasSettings>) =>
        set((state) => {
          Object.assign(state.canvas, settings)
        }),

      updateCanvas: (settings: Partial<CanvasSettings>) =>
        set((state) => {
          Object.assign(state.canvas, settings)
        }),

      clearCanvas: () =>
        set((state) => {
          state.objects = []
          state.selectedObjectIds = []
        }),

      resetCanvas: () =>
        set((state) => {
          state.objects = []
          state.selectedObjectIds = []
          state.canvas = { ...defaultCanvasSettings }
        }),

      // UI actions
      setEditMode: (mode: boolean) =>
        set((state) => {
          state.editMode = mode
          state.previewMode = !mode
        }),

      setPreviewMode: (mode: boolean) =>
        set((state) => {
          state.previewMode = mode
          state.editMode = !mode
        }),

      setLoading: (loading: boolean) =>
        set((state) => {
          state.isLoading = loading
        }),

      setPropertiesPanelVisible: (visible: boolean) =>
        set((state) => {
          state.propertiesPanelVisible = visible
        }),

      setLayersPanelVisible: (visible: boolean) =>
        set((state) => {
          state.layersPanelVisible = visible
        }),

      // Data actions
      exportCanvas: (): CanvasExportData => {
        const state = get()
        return {
          objects: state.objects,
          canvas: state.canvas,
          metadata: {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            objectCount: state.objects.length
          }
        }
      },

      importCanvas: (data: CanvasImportData) =>
        set((state) => {
          if (data.objects) {
            state.objects = data.objects
          }
          if (data.canvas) {
            Object.assign(state.canvas, data.canvas)
          }
          if (data.template) {
            // Apply template data if available
            if (data.template.template_data?.objects) {
              state.objects = data.template.template_data.objects
            }
            if (data.template.template_data?.canvas) {
              Object.assign(state.canvas, data.template.template_data.canvas)
            }
          }
          state.selectedObjectIds = []
        })
    })),
    {
      name: 'dashboard-store'
    }
  )
)

// Selector hooks for better performance
export const useSelectedObjects = () => useDashboardStore((state) => 
  state.objects.filter(obj => state.selectedObjectIds.includes(obj.id))
)

export const useCanvasObjects = () => useDashboardStore((state) => state.objects)

export const useCanvasSettings = () => useDashboardStore((state) => state.canvas)

export const useUIState = () => useDashboardStore((state) => ({
  editMode: state.editMode,
  previewMode: state.previewMode,
  isLoading: state.isLoading,
  propertiesPanelVisible: state.propertiesPanelVisible,
  layersPanelVisible: state.layersPanelVisible
}))

export default useDashboardStore