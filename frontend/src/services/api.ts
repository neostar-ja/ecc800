/**
 * API Client สำหรับระบบ ECC800
 */

const API_BASE = '/ecc800/api';

export interface Site {
  site_code: string;
  site_name: string;
  site_type: 'DC' | 'DR';
  equipment_count: number;
  latest_data: string | null;
  status: 'active' | 'inactive';
}

export interface Equipment {
  site_code: string;
  equipment_id: string;
  original_name: string;
  display_name: string;
  equipment_type: string | null;
  description: string | null;
}

export interface Metric {
  metric_name: string;
  display_name: string;
  data_points: number;
  first_seen: string | null;
  last_seen: string | null;
  unit: string | null;
}

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

export interface KPIResponse {
  total_sites: number;
  total_equipment: number;
  total_metrics: number;
  data_points: number;
  avg_values: { [key: string]: number };
  site_comparison: { [key: string]: { equipment_count: number; avg_temperature: number } };
}

// Sensor Data Interfaces
export interface SensorMetric {
  value: number | null;
  unit: string | null;
  time: string | null;
}

export interface SensorData {
  equipment_id: string;
  equipment_name: string;
  site_code: string;
  temperature: SensorMetric | null;
  humidity: SensorMetric | null;
  power: SensorMetric | null;
  current: SensorMetric | null;
  last_updated: string | null;
  status: 'healthy' | 'warning' | 'critical' | 'no_data';
}

export interface DashboardRow {
  label: string;
  equipment_id: string;
  equipment_name: string;
  type: 'sensor' | 'cooling' | 'ups' | 'power';
  site_code: string;
  temperature: SensorMetric | null;
  humidity: SensorMetric | null;
  power: SensorMetric | null;
  current: SensorMetric | null;
  last_updated: string | null;
  status: 'healthy' | 'warning' | 'critical' | 'no_data';
}

export interface DashboardData {
  site: string;
  rows: {
    A: DashboardRow[];
    B: DashboardRow[];
  };
  last_updated: string;
}

export interface SensorStatusSummary {
  DC: { online: number; warning: number; offline: number };
  DR: { online: number; warning: number; offline: number };
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  full_name: string;
  email: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE;
    // Try multiple token keys for compatibility
    this.token = localStorage.getItem('auth_token') || 
                 localStorage.getItem('token') || 
                 (() => {
                   const authData = localStorage.getItem('ecc800-auth');
                   if (authData) {
                     try {
                       const parsed = JSON.parse(authData);
                       return parsed.state?.token || parsed.token;
                     } catch {
                       return null;
                     }
                   }
                   return null;
                 })();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/ecc800/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${this.baseUrl}/../auth/token`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    return await response.json();
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/../auth/me');
  }

  // Sites and Equipment
  async getSites(): Promise<Site[]> {
    return this.request<Site[]>('/sites');
  }

  async getEquipment(params?: {
    site_code?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<Equipment[]> {
    const query = new URLSearchParams();
    if (params?.site_code) query.set('site_code', params.site_code);
    if (params?.q) query.set('q', params.q);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    return this.request<Equipment[]>(`/equipment?${query}`);
  }

  async getMetrics(params?: {
    site_code?: string;
    equipment_id?: string;
  }): Promise<Metric[]> {
    const query = new URLSearchParams();
    if (params?.site_code) query.set('site_code', params.site_code);
    if (params?.equipment_id) query.set('equipment_id', params.equipment_id);

    return this.request<Metric[]>(`/metrics?${query}`);
  }

  // Time-series Data
  async getTimeSeriesData(params: {
    site_code: string;
    equipment_id: string;
    metric: string;
    from_time: string;
    to_time: string;
    interval?: string;
  }): Promise<TimeSeriesResponse> {
    const query = new URLSearchParams({
      site_code: params.site_code,
      equipment_id: params.equipment_id,
      metric: params.metric,
      from_time: params.from_time,
      to_time: params.to_time,
    });

    if (params.interval) {
      query.set('interval', params.interval);
    }

    return this.request<TimeSeriesResponse>(`/data/time-series?${query}`);
  }

  async getFaults(params: {
    site_code: string;
    from_time: string;
    to_time: string;
    equipment_id?: string;
    severity?: string;
  }): Promise<FaultResponse> {
    const query = new URLSearchParams({
      site_code: params.site_code,
      from_time: params.from_time,
      to_time: params.to_time,
    });

    if (params.equipment_id) query.set('equipment_id', params.equipment_id);
    if (params.severity) query.set('severity', params.severity);

    return this.request<FaultResponse>(`/faults?${query}`);
  }

  async getKPIReport(params: {
    site_code: string;
    from_time: string;
    to_time: string;
  }): Promise<KPIResponse> {
    const query = new URLSearchParams(params);
    return this.request<KPIResponse>(`/reports/kpi?${query}`);
  }

  // Sensor API endpoints
  async getSensorLatestData(site?: string): Promise<{ data: SensorData[]; timestamp: string }> {
    const params = site ? `?site=${site}` : '';
    return this.request<{ data: SensorData[]; timestamp: string }>(`/sensor/latest${params}`);
  }

  async getSensorDashboardData(site: 'dc' | 'dr'): Promise<{ data: DashboardData; timestamp: string }> {
    return this.request<{ data: DashboardData; timestamp: string }>(`/sensor/dashboard?site=${site}`);
  }

  async getSensorStatusSummary(): Promise<{ data: SensorStatusSummary; timestamp: string }> {
    return this.request<{ data: SensorStatusSummary; timestamp: string }>('/sensor/status');
  }

  // Health Check
  async getHealth(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/../health');
  }
}

export const apiClient = new ApiClient();
