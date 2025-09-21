/**
 * Dashboard API Service
 * API client สำหรับ Dashboard Objects และ Templates
 */

import type { 
  DashboardObject, 
  DashboardTemplate, 
  CreateDashboardObject,
  UpdateDashboardObject,
  CreateDashboardTemplate,
  UpdateDashboardTemplate,
  BulkUpdateRequest,
  BulkUpdateResponse,
  TemplateApplicationResult,
  CanvasExportData 
} from '../types/dashboard'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// API Client helper
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('authToken')
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

// Dashboard Objects API
export const dashboardObjectsApi = {
  // Get all objects
  getAll: (): Promise<DashboardObject[]> =>
    apiRequest('/dashboard/objects'),

  // Get object by ID
  getById: (id: number): Promise<DashboardObject> =>
    apiRequest(`/dashboard/objects/${id}`),

  // Create new object
  create: (object: Omit<DashboardObject, 'id' | 'created_at' | 'updated_at'>): Promise<DashboardObject> =>
    apiRequest('/dashboard/objects', {
      method: 'POST',
      body: JSON.stringify(object),
    }),

  // Update object
  update: (id: number, updates: Partial<DashboardObject>): Promise<DashboardObject> =>
    apiRequest(`/dashboard/objects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Delete object
  delete: (id: number): Promise<void> =>
    apiRequest(`/dashboard/objects/${id}`, {
      method: 'DELETE',
    }),

  // Bulk operations
  bulkUpdate: (updates: BulkUpdateRequest[]): Promise<BulkUpdateResponse> =>
    apiRequest('/dashboard/objects/bulk', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    }),

  bulkDelete: (ids: number[]): Promise<{ deleted: number }> =>
    apiRequest('/dashboard/objects/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  // Position and ordering
  updatePosition: (id: number, x: number, y: number): Promise<DashboardObject> =>
    apiRequest(`/dashboard/objects/${id}/position`, {
      method: 'PATCH',
      body: JSON.stringify({ x, y }),
    }),

  updateZIndex: (id: number, z_index: number): Promise<DashboardObject> =>
    apiRequest(`/dashboard/objects/${id}/z-index`, {
      method: 'PATCH',
      body: JSON.stringify({ z_index }),
    }),

  // Visibility
  setVisibility: (id: number, visible: boolean): Promise<DashboardObject> =>
    apiRequest(`/dashboard/objects/${id}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ visible }),
    }),

  // Canvas operations
  exportCanvas: (): Promise<CanvasExportData> =>
    apiRequest('/dashboard/export'),

  importCanvas: (data: { objects: DashboardObject[], canvas?: any }): Promise<{ imported: number }> =>
    apiRequest('/dashboard/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  clearCanvas: (): Promise<{ deleted: number }> =>
    apiRequest('/dashboard/clear', {
      method: 'DELETE',
    }),
}

// Dashboard Templates API
export const dashboardTemplatesApi = {
  // Get all templates
  getAll: (): Promise<DashboardTemplate[]> =>
    apiRequest('/dashboard/templates'),

  // Get template by ID
  getById: (id: number): Promise<DashboardTemplate> =>
    apiRequest(`/dashboard/templates/${id}`),

  // Create new template
  create: (template: Omit<DashboardTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DashboardTemplate> =>
    apiRequest('/dashboard/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),

  // Update template
  update: (id: number, updates: Partial<DashboardTemplate>): Promise<DashboardTemplate> =>
    apiRequest(`/dashboard/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Delete template
  delete: (id: number): Promise<void> =>
    apiRequest(`/dashboard/templates/${id}`, {
      method: 'DELETE',
    }),

  // Apply template to canvas
  apply: (templateId: number): Promise<TemplateApplicationResult> =>
    apiRequest(`/dashboard/templates/${templateId}/apply`, {
      method: 'POST',
    }),

  // Clone template
  clone: (id: number, newName?: string): Promise<DashboardTemplate> =>
    apiRequest(`/dashboard/templates/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    }),

  // Save current canvas as template
  saveFromCanvas: (templateData: Omit<DashboardTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<DashboardTemplate> =>
    apiRequest('/dashboard/templates/from-canvas', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
}

// Combined API object for convenience
export const dashboardApi = {
  objects: dashboardObjectsApi,
  templates: dashboardTemplatesApi,
}

export default dashboardApi