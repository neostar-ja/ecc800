/**
 * API Client for ECC800 Data Center Monitoring System
 * ไคลเอนต์ API สำหรับระบบติดตามศูนย์ข้อมูล ECC800
 */

// API base URL from environment - URL พื้นฐาน API จากสภาพแวดล้อม
const API_BASE = import.meta.env.VITE_API_BASE || "/ecc800/api";

/**
 * Get authorization headers - รับ header การอนุญาต
 */
function getAuthHeaders(): Record<string, string> {
  // Try to get token from Zustand store first, then localStorage
  const authData = localStorage.getItem('ecc800-auth');
  let token: string | null = null;
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.state?.token || parsed.token;
    } catch {
      // Fallback to simple token storage
      token = localStorage.getItem("token");
    }
  } else {
    token = localStorage.getItem("token");
  }
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle API response errors - จัดการข้อผิดพลาดของการตอบกลับ API
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("ecc800-auth");
      // Use relative path instead of absolute
      if (window.location.pathname !== "/ecc800/" && window.location.pathname !== "/ecc800/login") {
        window.location.href = "/ecc800/login";
      }
      throw new Error("Unauthorized");
    }
    
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Generic GET request - คำขอ GET ทั่วไป
 */
export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(API_BASE + path, window.location.origin);
  
  // Add query parameters - เพิ่มพารามิเตอร์ query
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse<T>(response);
}

/**
 * Generic POST request - คำขอ POST ทั่วไป
 */
export async function apiPost<T>(path: string, data?: any): Promise<T> {
  const url = API_BASE + path;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...getAuthHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return handleResponse<T>(response);
}

/**
 * Form POST request - คำขอ POST แบบฟอร์ม
 */
export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const url = API_BASE + path;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      ...getAuthHeaders(),
    },
    body: formData,
  });
  
  return handleResponse<T>(response);
}

/**
 * Generic PUT request - คำขอ PUT ทั่วไป
 */
export async function apiPut<T>(path: string, data?: any): Promise<T> {
  const url = API_BASE + path;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...getAuthHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return handleResponse<T>(response);
}

/**
 * Generic DELETE request - คำขอ DELETE ทั่วไป
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const url = API_BASE + path;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      ...getAuthHeaders(),
    },
  });
  
  return handleResponse<T>(response);
}

// Type definitions - คำนิยามประเภท

export interface LoginRequest {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  // Additional property for backward compatibility
  data?: {
    access_token: string;
    token_type: string;
    user: User;
  };
}

export interface Site {
  site_code: string;
  site_name: string;
}

export interface Equipment {
  site_code: string;
  equipment_id: string;
  display_name?: string;
  original_name?: string;
  equipment_name?: string;
  // optional override / alias
  custom_name?: string;
  // optional stats returned by detailed endpoints
  metrics_count?: number;
  total_records?: number;
  // Additional properties for compatibility
  equipment_type?: string;
  type?: string;
  status?: string;
  description?: string;
  last_updated?: string;
}

// Alias for backward compatibility
export type EquipmentData = Equipment;

export interface TimeSeriesPoint {
  timestamp: string;
  value: number | null;
  unit: string | null;
}

export interface TimeSeriesResponse {
  site_code: string;
  equipment_id: string;
  metric_name: string;
  interval: string;
  data_points: TimeSeriesPoint[];
  from_time: string;
  to_time: string;
}

export interface FaultPoint {
  timestamp: string;
  fault_count: number;
  severity: string | null;
  equipment_id?: string | null;
}

export interface FaultResponse {
  site_code: string;
  equipment_id: string | null;
  interval: string;
  faults: FaultPoint[];
  total_faults: number;
  from_time: string;
  to_time: string;
}

export interface KPIReport {
  site_code: string;
  period: {
    from: string;
    to: string;
  };
  kpis: {
    temperature?: {
      avg: number;
      min: number;
      max: number;
      unit: string;
    };
    humidity?: {
      avg: number;
      unit: string;
    };
    power?: {
      avg: number;
      unit: string;
    };
    equipment_count?: number;
    fault_count?: number;
  };
}

export interface DatabaseView {
  schema: string;
  name: string;
  full_name: string;
  purpose: string;
  definition: string;
}

export interface DiscoveryInfo {
  has_timescaledb: boolean;
  hypertables: string[];
  tables: {
    performance: {
      table: string;
      columns: {
        time: string;
        value?: string;
        metric?: string;
        unit?: string;
        site: string;
        equipment_id: string;
        equipment_name?: string;
      };
    };
    fault?: any;
    equipment?: string;
    datacenter?: string;
  };
  views: {
    equipment_display?: string;
  };
  all_tables: string[];
}

// Legacy type compatibility - ความเข้ากันได้กับประเภทเก่า
export interface DataCenter {
  site_code: string;
  site_name: string;
  name?: string;
  location?: string;
}

export interface SiteMetrics {
  site_code: string;
  equipment_count: number;
  fault_count: number;
  temperature_avg?: number;
  humidity_avg?: number;
  power_avg?: number;
}

// Main API client - ไคลเอนต์ API หลัก
export const api = {
  // Health check - ตรวจสอบสถานะ
  healthCheck: () => apiGet<{ status: string; db: string }>("/health"),
  
  // Authentication - การยืนยันตัวตน
  login: async (credentials: LoginRequest) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    return apiPostForm<LoginResponse>("/auth/login", formData);
  },
  
  // Sites - ไซต์
  getSites: () => apiGet<Site[]>("/sites"),
  
  getSiteMetrics: async (): Promise<SiteMetrics[]> => {
    // Get all sites first
    const sites = await apiGet<Site[]>("/sites");
    
    // Get KPI for each site
    const metrics: SiteMetrics[] = [];
    for (const site of sites) {
      try {
        const kpi = await apiGet<KPIReport>("/reports/kpi", { site_code: site.site_code });
        metrics.push({
          site_code: site.site_code,
          equipment_count: kpi.kpis.equipment_count || 0,
          fault_count: kpi.kpis.fault_count || 0,
          temperature_avg: kpi.kpis.temperature?.avg,
          humidity_avg: kpi.kpis.humidity?.avg,
          power_avg: kpi.kpis.power?.avg,
        });
      } catch (error) {
        console.error(`Error getting metrics for ${site.site_code}:`, error);
        metrics.push({
          site_code: site.site_code,
          equipment_count: 0,
          fault_count: 0,
        });
      }
    }
    
    return metrics;
  },
  
  // Metrics - เมทริก
  getMetrics: (siteCode?: string, equipmentId?: string) =>
    apiGet<{ metrics: string[] }>("/metrics", { site_code: siteCode, equipment_id: equipmentId }),
  
  // Equipment - อุปกรณ์
  getEquipment: (siteCode?: string, search?: string) => {
    if (!siteCode) return Promise.resolve([]);
    
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const queryString = params.toString();
    
    return apiGet<Equipment[]>(`/sites/${siteCode}/equipment${queryString ? '?' + queryString : ''}`);
  },

  getEquipmentDetails: (siteCode: string, equipmentId: string) => 
    apiGet<{
      equipment: Equipment & {
        original_name?: string;
        custom_name?: string;
        metrics_count?: number;
        total_records?: number;
        latest_data?: string;
        first_data?: string;
        created_at?: string;
        updated_at?: string;
      };
      metrics: Array<{
        metric_name: string;
        unit?: string;
        data_type?: string;
        data_points: number;
        first_reading?: string;
        latest_reading?: string;
        avg_value?: number;
        min_value?: number;
        max_value?: number;
      }>;
      recent_data: Array<{
        metric: string;
        timestamp: string;
        value_numeric?: number;
        value_text?: string;
        unit?: string;
      }>;
    }>(`/equipment/${siteCode}/${equipmentId}/details`),

  updateEquipmentName: (siteCode: string, equipmentId: string, displayName: string) =>
    apiPut<{
      success: boolean;
      message: string;
      site_code: string;
      equipment_id: string;
      display_name: string;
    }>(`/equipment/${siteCode}/${equipmentId}/name`, { display_name: displayName }),

  // Time series data - ข้อมูลอนุกรมเวลา
  getTimeSeriesData: (params: {
    site_code: string;
    equipment_id?: string;
    metric?: string;
    start_time: string;
    end_time: string;
    interval?: string;
  }) => {
    // Map to backend parameter names
    const mappedParams = {
      site_code: params.site_code,
      equipment_id: params.equipment_id || '',
      metric: params.metric || '',
      from_time: params.start_time,
      to_time: params.end_time,
      interval: params.interval
    };
    
    return apiGet<TimeSeriesResponse>("/data/time-series", mappedParams);
  },
  
  // Fault data - ข้อมูลความผิดพลาด
  getFaultData: (params: {
    site_code: string;
    equipment_id?: string;
    start_time?: string;
    end_time?: string;
    severity?: string;
  }) => {
    // Call the correct endpoint with path parameter
    const queryParams = new URLSearchParams();
    if (params.equipment_id) queryParams.set('equipment_id', params.equipment_id);
    if (params.start_time) queryParams.set('from_time', params.start_time);
    if (params.end_time) queryParams.set('to_time', params.end_time);
    if (params.severity) queryParams.set('severity', params.severity);
    
    const queryString = queryParams.toString();
    const endpoint = `/faults/${params.site_code}${queryString ? '?' + queryString : ''}`;
    
    return apiGet<FaultResponse[]>(endpoint);
  },
  
  // KPI reports - รายงาน KPI
  getKPIReport: (params: {
    site_code: string;
    start_time?: string;
    end_time?: string;
  }) => {
    // Map to backend parameter names
    const mappedParams = {
      site_code: params.site_code,
      from_time: params.start_time,
      to_time: params.end_time
    };
    
    return apiGet<KPIReport>("/reports/kpi", mappedParams);
  },
  
  // Database views - วิวฐานข้อมูล
  getViews: () => apiGet<{ views: DatabaseView[] }>("/views"),
  
  // Discovery info - ข้อมูลการค้นหา
  getDiscovery: () => apiGet<DiscoveryInfo>("/discovery"),
};

// Export for compatibility - ส่งออกเพื่อความเข้ากันได้
export default api;
