import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeProvider';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfessionalDataCenterMonitoring from './components/ProfessionalDataCenterMonitoring';
import RackLayoutDashboard from './pages/RackLayoutDashboard';
import RackLayoutDashboardFixed from './pages/RackLayoutDashboard_Fixed';
import RackLayoutDashboardEnhanced from './pages/RackLayoutDashboard_Enhanced';
import RackLayoutDashboardEnhancedOriginal from './pages/RackLayoutDashboard_Enhanced_Original';
import RackLayoutDashboardEnhancedFixed from './pages/RackLayoutDashboard_EnhancedFixed';
import SitesPage from './pages/SitesPage';
import EquipmentPage from './pages/EquipmentPage';
import MetricsPage from './pages/MetricsPage';
import ImprovedMetricsPage from './pages/ImprovedMetricsPage';
import FaultsPage from './pages/FaultsPage';
import ImprovedFaultsPage from './pages/ImprovedFaultsPage';
import ReportsPage from './pages/ReportsPage';
import ThaiModernLayout from './components/ThaiModernLayout';

// Components
import MetricsTestPage from './components/MetricsTestPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <div>{children}</div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <div>{children}</div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router basename="/ecc800">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <ThaiModernLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ProfessionalDataCenterMonitoring />} />
              <Route path="dashboard-old" element={<DashboardPage />} />
              <Route path="rack-layout" element={<RackLayoutDashboard />} />
              <Route path="rack-layout-fixed" element={<RackLayoutDashboardFixed />} />
              <Route path="rack-layout-enhanced" element={<RackLayoutDashboardEnhancedFixed />} />
              <Route path="rack-layout-enhanced-original" element={<RackLayoutDashboardEnhancedOriginal />} />
              <Route path="sites" element={<SitesPage />} />
              <Route path="equipment" element={<EquipmentPage />} />
              <Route path="metrics" element={<ImprovedMetricsPage />} />
              <Route path="metrics-old" element={<MetricsPage />} />
              <Route path="faults" element={<ImprovedFaultsPage />} />
              <Route path="faults-old" element={<FaultsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
            
            {/* Test page without authentication */}
            <Route path="/test-metrics" element={<MetricsTestPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
