import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfessionalDataCenterMonitoring from './components/ProfessionalDataCenterMonitoring';
import SitesPage from './pages/SitesPage';
import EquipmentPage from './pages/EquipmentPage';
import MetricsPage from './pages/MetricsPage';
import EnhancedMetricsPage from './pages/EnhancedMetricsPage';
import ImprovedMetricsPage from './pages/ImprovedMetricsPage';
import FaultsPage from './pages/FaultsPage';
import ImprovedFaultsPage from './pages/ImprovedFaultsPage';
import ReportsPage from './pages/ReportsPage';
import Layout from './components/Layout';

// New redesigned components
import MetricsPageV2 from './components/MetricsPageV2';
import MetricsTestPage from './components/MetricsTestPage';
import ModernDashboardPage from './pages/ModernDashboardPage';
import ResponsiveDataCenterDashboard from './components/ResponsiveDataCenterDashboard';

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
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('ecc800-theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('ecc800-theme', newMode ? 'dark' : 'light');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Router basename="/ecc800">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout darkMode={darkMode} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ProfessionalDataCenterMonitoring />} />
              <Route path="dashboard-modern" element={<ModernDashboardPage />} />
              <Route path="dashboard-responsive" element={<ResponsiveDataCenterDashboard />} />
              <Route path="dashboard-old" element={<DashboardPage />} />
              <Route path="sites" element={<SitesPage />} />
              <Route path="equipment" element={<EquipmentPage />} />
              <Route path="metrics" element={<ImprovedMetricsPage />} />
              <Route path="metrics-enhanced" element={<EnhancedMetricsPage />} />
              <Route path="metrics-v2" element={<MetricsPageV2 />} />
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
