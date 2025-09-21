/**
 * Dashboard Hook
 * Custom hook สำหรับจัดการ Dashboard state และ operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { useDashboardStore } from '../stores/dashboardStore'
import { dashboardApi } from '../services/dashboardApi'
import type { 
  DashboardState, 
  DashboardObject, 
  DashboardTemplate, 
  CanvasSettings,
  CanvasExportData,
  CanvasImportData,
  CreateDashboardObject,
  CreateDashboardTemplate 
} from '../types/dashboard'

export interface UseDashboardOptions {
  autoSave?: boolean
  autoSaveInterval?: number // milliseconds
}

export const useDashboard = (options: UseDashboardOptions = {}) => {
  const {
    autoSave = true,
    autoSaveInterval = 30000 // 30 seconds
  } = options

  const queryClient = useQueryClient()
  
  // Dashboard store
  const {
    objects,
    templates,
    selectedObjectIds,
    canvas,
    isLoading,
    editMode,
    setLoading,
    addObject,
    updateObject,
    deleteObject,
    setSelectedObjects,
    setCanvas,
    clearCanvas,
    exportCanvas,
    importCanvas
  } = useDashboardStore()

  // Auto-save state
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load all objects
  const {
    data: dashboardObjects,
    isLoading: isLoadingObjects,
    error: objectsError,
    refetch: refetchObjects
  } = useQuery({
    queryKey: ['dashboard-objects'],
    queryFn: () => dashboardApi.objects.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  // Load all templates
  const {
    data: dashboardTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['dashboard-templates'],
    queryFn: () => dashboardApi.templates.getAll(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  })

  // Create object mutation
  const createObjectMutation = useMutation({
    mutationFn: (objectData: CreateDashboardObject) => 
      dashboardApi.objects.create(objectData),
    onSuccess: (newObject) => {
      // Update local store
      addObject(newObject)
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-objects'] })
      setHasUnsavedChanges(false)
    },
    onError: (error) => {
      console.error('Create object error:', error)
    }
  })

  // Update object mutation
  const updateObjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number, updates: Partial<DashboardObject> }) =>
      dashboardApi.objects.update(id, updates),
    onSuccess: (updatedObject) => {
      updateObject(updatedObject.id, updatedObject)
      queryClient.invalidateQueries({ queryKey: ['dashboard-objects'] })
      setHasUnsavedChanges(false)
    },
    onError: (error) => {
      console.error('Update object error:', error)
    }
  })

  // Delete object mutation
  const deleteObjectMutation = useMutation({
    mutationFn: (id: number) => dashboardApi.objects.delete(id),
    onSuccess: (_, deletedId) => {
      deleteObject(deletedId)
      queryClient.invalidateQueries({ queryKey: ['dashboard-objects'] })
      setHasUnsavedChanges(false)
    },
    onError: (error) => {
      console.error('Delete object error:', error)
    }
  })

  // Bulk operations
  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: { id: number, data: Partial<DashboardObject> }[]) =>
      dashboardApi.objects.bulkUpdate(updates.map(u => ({ id: u.id, data: u.data }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-objects'] })
      setHasUnsavedChanges(false)
    }
  })

  // Template operations
  const saveTemplateMutation = useMutation({
    mutationFn: (templateData: CreateDashboardTemplate) =>
      dashboardApi.templates.create(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-templates'] })
    }
  })

  const loadTemplateMutation = useMutation({
    mutationFn: (templateId: number) =>
      dashboardApi.templates.apply(templateId),
    onSuccess: (data) => {
      importCanvas(data)
      setHasUnsavedChanges(false)
    }
  })

  // Canvas operations
  const saveCanvasMutation = useMutation({
    mutationFn: async () => {
      const canvasData = exportCanvas()
      
      // Prepare bulk updates
      const updates = objects.map(obj => ({
        id: obj.id,
        data: obj
      }))
      
      // Execute bulk update
      if (updates.length > 0) {
        await dashboardApi.objects.bulkUpdate(updates.map(u => ({ id: u.id, data: u.data })))
      }
      
      return canvasData
    },
    onSuccess: () => {
      setLastSaveTime(new Date())
      setHasUnsavedChanges(false)
      queryClient.invalidateQueries({ queryKey: ['dashboard-objects'] })
    },
    onError: (error) => {
      console.error('Save canvas error:', error)
    }
  })

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges) return

    const interval = setInterval(() => {
      if (hasUnsavedChanges && editMode) {
        saveCanvasMutation.mutate()
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, hasUnsavedChanges, editMode, autoSaveInterval, saveCanvasMutation])

  // Track changes
  useEffect(() => {
    if (objects.length > 0 && !isLoadingObjects) {
      setHasUnsavedChanges(true)
    }
  }, [objects, isLoadingObjects])

  // Object management functions
  const handleCreateObject = useCallback(async (objectData: CreateDashboardObject) => {
    return createObjectMutation.mutate(objectData)
  }, [createObjectMutation])

  const handleUpdateObject = useCallback(async (id: number, updates: Partial<DashboardObject>) => {
    return updateObjectMutation.mutate({ id, updates })
  }, [updateObjectMutation])

  const handleDeleteObject = useCallback(async (id: number) => {
    return deleteObjectMutation.mutate(id)
  }, [deleteObjectMutation])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedObjectIds.length === 0) return
    
    const deletePromises = selectedObjectIds.map(id => deleteObjectMutation.mutate(id))
    await Promise.all(deletePromises)
    setSelectedObjects([])
  }, [selectedObjectIds, deleteObjectMutation, setSelectedObjects])

  // Canvas management
  const handleSaveCanvas = useCallback(() => {
    return saveCanvasMutation.mutate()
  }, [saveCanvasMutation])

  const handleLoadTemplate = useCallback((templateId: number) => {
    return loadTemplateMutation.mutate(templateId)
  }, [loadTemplateMutation])

  const handleSaveTemplate = useCallback((templateData: CreateDashboardTemplate) => {
    return saveTemplateMutation.mutate(templateData)
  }, [saveTemplateMutation])

  const handleClearCanvas = useCallback(() => {
    clearCanvas()
    setHasUnsavedChanges(true)
  }, [clearCanvas])

  // Export for external use
  const handleExportCanvas = useCallback(() => {
    return exportCanvas()
  }, [exportCanvas])

  const handleImportCanvas = useCallback((data: any) => {
    importCanvas(data)
    setHasUnsavedChanges(true)
  }, [importCanvas])

  return {
    // Data
    objects,
    templates,
    dashboardObjects,
    dashboardTemplates,
    selectedObjectIds,
    canvas,
    
    // Loading states
    isLoading: isLoading || isLoadingObjects || isLoadingTemplates,
    isLoadingObjects,
    isLoadingTemplates,
    isSaving: saveCanvasMutation.isPending,
    
    // Error states
    objectsError,
    templatesError,
    
    // Status
    hasUnsavedChanges,
    lastSaveTime,
    editMode,
    
    // Object operations
    createObject: handleCreateObject,
    updateObject: handleUpdateObject,
    deleteObject: handleDeleteObject,
    deleteSelected: handleDeleteSelected,
    
    // Canvas operations
    saveCanvas: handleSaveCanvas,
    loadTemplate: handleLoadTemplate,
    saveTemplate: handleSaveTemplate,
    clearCanvas: handleClearCanvas,
    exportCanvas: handleExportCanvas,
    importCanvas: handleImportCanvas,
    
    // Utility functions
    refetchObjects,
    refetchTemplates,
    
    // Mutations for advanced use
    mutations: {
      createObject: createObjectMutation,
      updateObject: updateObjectMutation,
      deleteObject: deleteObjectMutation,
      bulkUpdate: bulkUpdateMutation,
      saveCanvas: saveCanvasMutation,
      loadTemplate: loadTemplateMutation,
      saveTemplate: saveTemplateMutation
    }
  }
}

export type UseDashboardReturn = ReturnType<typeof useDashboard>