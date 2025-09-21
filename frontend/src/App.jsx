import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Import layouts
import MainLayout from './components/layout/MainLayout';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SitesPage from './pages/SitesPage';
import EquipmentPage from './pages/EquipmentPage';
import MetricsPage from './pages/MetricsPage';
import FaultsPage from './pages/FaultsPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import MetricsTestPage from './components/MetricsTestPage';
import MetricsPageV2 from './components/MetricsPageV2';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/metrics" element={<MetricsPageV2 />} />
        <Route path="/metrics-old" element={<MetricsPage />} />
        <Route path="/test-metrics" element={<MetricsTestPage />} />
        <Route path="/faults" element={<FaultsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        } />
      </Route>
      
      {/* Not found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}