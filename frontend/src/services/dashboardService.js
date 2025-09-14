/**
 * Dashboard API Services
 * บริการ API สำหรับ Dashboard และการแสดงผลข้อมูล 3D Visualization
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE || '/ecc800/api';

// Dashboard API endpoints
export const dashboardAPI = {
  /**
   * Get comprehensive dashboard data
   * ดึงข้อมูล dashboard รวม
   */
  getDashboardData: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  /**
   * Get dashboard summary statistics
   * ดึงสรุปสถิติ dashboard
   */
  getDashboardSummary: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },

  /**
   * Get detailed equipment information
   * ดึงข้อมูลรายละเอียดอุปกรณ์
   */
  getEquipmentDetails: async (equipmentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/equipment/${equipmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching equipment details for ${equipmentId}:`, error);
      throw error;
    }
  },

  /**
   * Acknowledge an alert
   * ยืนยันการได้รับแจ้งเตือน
   */
  acknowledgeAlert: async (alertData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/dashboard/alerts/acknowledge`, alertData);
      return response.data;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }
};

// Hook สำหรับใช้งาน Dashboard data
import { useState, useEffect } from 'react';

export const useDashboardData = (refreshInterval = 30000) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardAPI.getDashboardData();
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh if interval is provided
    let interval;
    if (refreshInterval > 0) {
      interval = setInterval(fetchDashboardData, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshInterval]);

  return {
    dashboardData,
    loading,
    error,
    lastUpdated,
    refetch: fetchDashboardData
  };
};

export const useDashboardSummary = (refreshInterval = 60000) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardAPI.getDashboardSummary();
      setSummaryData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard summary');
      console.error('Dashboard summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    let interval;
    if (refreshInterval > 0) {
      interval = setInterval(fetchSummary, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshInterval]);

  return {
    summaryData,
    loading,
    error,
    refetch: fetchSummary
  };
};

// Equipment detail hook
export const useEquipmentDetails = (equipmentId) => {
  const [equipmentData, setEquipmentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEquipmentDetails = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardAPI.getEquipmentDetails(id);
      setEquipmentData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch equipment details');
      console.error('Equipment details fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) {
      fetchEquipmentDetails(equipmentId);
    } else {
      setEquipmentData(null);
      setError(null);
    }
  }, [equipmentId]);

  return {
    equipmentData,
    loading,
    error,
    refetch: () => fetchEquipmentDetails(equipmentId)
  };
};

export default dashboardAPI;