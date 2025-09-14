/**
 * React hooks for ECC800 API data fetching
 * React hooks สำหรับดึงข้อมูล API ของ ECC800
 */
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { 
  api, 
  Site, 
  Equipment, 
  TimeSeriesResponse, 
  FaultResponse, 
  KPIReport, 
  SiteMetrics,
  DiscoveryInfo,
  DatabaseView
} from './api';

// Query key factory - โรงงานสร้าง query key
export const queryKeys = {
  health: () => ['health'] as const,
  sites: () => ['sites'] as const,
  siteMetrics: () => ['sites', 'metrics'] as const,
  equipment: (siteCode?: string, search?: string) => ['equipment', siteCode, search] as const,
  metrics: (siteCode?: string, equipmentId?: string) => ['metrics', siteCode, equipmentId] as const,
  timeSeries: (params: {
    site_code: string;
    equipment_id: string;
    metric: string;
    start_time: string;
    end_time: string;
    interval?: string;
  }) => ['timeSeries', params] as const,
  faults: (params: {
    site_code: string;
    equipment_id?: string;
    start_time?: string;
    end_time?: string;
    severity?: string;
  }) => ['faults', params] as const,
  kpiReport: (params: {
    site_code: string;
    start_time?: string;
    end_time?: string;
  }) => ['kpiReport', params] as const,
  views: () => ['views'] as const,
  discovery: () => ['discovery'] as const,
};

/**
 * Health check hook - Hook ตรวจสอบสถานะระบบ
 */
export function useHealth(options?: Omit<UseQueryOptions<{ status: string; db: string }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: () => api.healthCheck(),
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
}

/**
 * Sites data hook - Hook ข้อมูลไซต์
 */
export function useSites(options?: Omit<UseQueryOptions<Site[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.sites(),
    queryFn: () => api.getSites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Site metrics hook - Hook เมทริกไซต์
 */
export function useSiteMetrics(options?: Omit<UseQueryOptions<SiteMetrics[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.siteMetrics(),
    queryFn: () => api.getSiteMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Equipment data hook - Hook ข้อมูลอุปกรณ์
 */
export function useEquipment(
  siteCode?: string, 
  search?: string,
  options?: Omit<UseQueryOptions<Equipment[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.equipment(siteCode, search),
    queryFn: () => api.getEquipment(siteCode, search),
    enabled: !!siteCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Metrics data hook - Hook ข้อมูลเมทริก
 */
export function useMetrics(
  siteCode?: string,
  equipmentId?: string,
  options?: Omit<UseQueryOptions<{ metrics: string[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.metrics(siteCode, equipmentId),
    queryFn: () => api.getMetrics(siteCode, equipmentId),
    enabled: !!siteCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Time series data hook - Hook ข้อมูลเวลา
 */
export function useTimeSeries(
  params: {
    site_code: string;
    equipment_id: string;
    metric: string;
    start_time: string;
    end_time: string;
    interval?: string;
  },
  options?: Omit<UseQueryOptions<TimeSeriesResponse>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.timeSeries(params),
    queryFn: () => api.getTimeSeriesData(params),
    enabled: !!(params.site_code && params.equipment_id && params.metric && params.start_time && params.end_time),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Fault data hook - Hook ข้อมูลความผิดพลาด
 */
export function useFaults(
  params: {
    site_code: string;
    equipment_id?: string;
    start_time?: string;
    end_time?: string;
    severity?: string;
  },
  options?: Omit<UseQueryOptions<FaultResponse[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.faults(params),
    queryFn: () => api.getFaultData(params),
    enabled: !!params.site_code,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * KPI report hook - Hook รายงาน KPI
 */
export function useKPIReport(
  params: {
    site_code: string;
    start_time?: string;
    end_time?: string;
  },
  options?: Omit<UseQueryOptions<KPIReport>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.kpiReport(params),
    queryFn: () => api.getKPIReport(params),
    enabled: !!params.site_code,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Database views hook - Hook วิวฐานข้อมูล
 */
export function useViews(options?: Omit<UseQueryOptions<{ views: DatabaseView[] }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.views(),
    queryFn: () => api.getViews(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Discovery information hook - Hook ข้อมูลการค้นหา
 */
export function useDiscovery(options?: Omit<UseQueryOptions<DiscoveryInfo>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.discovery(),
    queryFn: () => api.getDiscovery(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// Utility hooks - Hook ยูทิลิตี้

/**
 * Combined dashboard data hook - Hook ข้อมูลรวมสำหรับแดชบอร์ด
 */
export function useDashboardData(siteCode?: string) {
  const sites = useSites();
  const siteMetrics = useSiteMetrics();
  
  const kpiParams = siteCode ? { 
    site_code: siteCode,
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString()
  } : null;
  
  const kpiReport = useKPIReport(kpiParams!, { enabled: !!kpiParams });
  
  return {
    sites,
    siteMetrics,
    kpiReport,
    isLoading: sites.isLoading || siteMetrics.isLoading || (kpiParams && kpiReport.isLoading),
    isError: sites.isError || siteMetrics.isError || (kpiParams && kpiReport.isError),
  };
}

/**
 * Equipment with metrics hook - Hook อุปกรณ์พร้อมเมทริก
 */
export function useEquipmentWithMetrics(siteCode?: string, equipmentId?: string) {
  const equipment = useEquipment(siteCode);
  const metrics = useMetrics(siteCode, equipmentId);
  
  return {
    equipment,
    metrics,
    isLoading: equipment.isLoading || (equipmentId && metrics.isLoading),
    isError: equipment.isError || (equipmentId && metrics.isError),
  };
}

/**
 * Time range utilities - ยูทิลิตี้ช่วงเวลา
 */
export const timeRanges = {
  last1Hour: () => ({
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  last4Hours: () => ({
    start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  last12Hours: () => ({
    start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  last24Hours: () => ({
    start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  last7Days: () => ({
    start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  last30Days: () => ({
    start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date().toISOString(),
  }),
  today: () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      start_time: startOfDay.toISOString(),
      end_time: now.toISOString(),
    };
  },
  thisWeek: () => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return {
      start_time: startOfWeek.toISOString(),
      end_time: new Date().toISOString(),
    };
  },
};
