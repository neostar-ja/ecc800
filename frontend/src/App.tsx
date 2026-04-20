import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './contexts/ThemeProvider';
import { PermissionProvider } from './contexts/PermissionContext';
import { CircularProgress, Box } from '@mui/material';

// Page imports (lazy-loaded)
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const NewDashboardPage = React.lazy(() => import('./pages/NewDashboardPage'));
const SitesPage = React.lazy(() => import('./pages/SitesPage'));
const EquipmentPage = React.lazy(() => import('./pages/EquipmentPage'));
const MetricsPage = React.lazy(() => import('./pages/MetricsPage'));
const FaultsPage = React.lazy(() => import('./pages/FaultsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPageNew')); // Updated to new modern Reports UI
const ReportsPage2 = React.lazy(() => import('./pages/ReportsPage')); // Original Reports UI
const DataCenterVisualization = React.lazy(() => import('./pages/DataCenterVisualization'));
const RackLayoutDashboard = React.lazy(() => import('./pages/RackLayoutDashboard'));
const RackLayoutDashboardFixed = React.lazy(() => import('./pages/RackLayoutDashboard_Fixed'));
const RackLayoutDashboardEnhancedFixed = React.lazy(() => import('./pages/RackLayoutDashboard_EnhancedFixed'));
const RackLayoutDashboardEnhancedOriginal = React.lazy(() => import('./pages/RackLayoutDashboard_Enhanced_Original'));
const ImprovedMetricsPage = React.lazy(() => import('./pages/ImprovedMetricsPage'));
const ImprovedFaultsPage = React.lazy(() => import('./pages/ImprovedFaultsPage'));
const CensorPage = React.lazy(() => import('./pages/CensorPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));

// Layout and Component imports
import ThaiModernLayout from './components/ThaiModernLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Auth imports
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function SimpleProtectedRoute({ children }: { children: React.ReactNode }) {
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

// Token expiration checker component
function TokenExpirationChecker() {
  const checkTokenExpiration = useAuthStore((state) => state.checkTokenExpiration);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Check token expiration immediately
    checkTokenExpiration();
    
    // Check every 5 minutes
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkTokenExpiration]);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      // Don't redirect if already on login page
      if (currentPath !== '/ecc800/' && currentPath !== '/ecc800/login') {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);
  
  return null;
}

function App() {
  const Loader = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <CircularProgress size={48} thickness={4} />
    </Box>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PermissionProvider>
          <Router basename="/ecc800">
            <TokenExpirationChecker />
            <ErrorBoundary>
              <Suspense fallback={Loader}>
                <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={
                  <SimpleProtectedRoute>
                    <ThaiModernLayout />
                  </SimpleProtectedRoute>
                }>
                <Route path="dashboard" element={
                  <ProtectedRoute requiredPath="/dashboard">
                    <NewDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="dashboard-old" element={<DashboardPage />} />
                <Route path="rack-layout" element={<RackLayoutDashboard />} />
                <Route path="rack-layout-fixed" element={<RackLayoutDashboardFixed />} />
                <Route path="rack-layout-enhanced" element={<RackLayoutDashboardEnhancedFixed />} />
                <Route path="rack-layout-enhanced-original" element={<RackLayoutDashboardEnhancedOriginal />} />
                {/* redirect nested datacenter route to the standalone page to avoid global template */}
                <Route path="datacenter-visualization" element={
                  <ProtectedRoute requiredPath="/datacenter-visualization">
                    <DataCenterVisualization />
                  </ProtectedRoute>
                } />
                <Route path="sites" element={
                  <ProtectedRoute requiredPath="/sites">
                    <SitesPage />
                  </ProtectedRoute>
                } />
                <Route path="equipment" element={
                  <ProtectedRoute requiredPath="/equipment">
                    <EquipmentPage />
                  </ProtectedRoute>
                } />
                <Route path="metrics" element={
                  <ProtectedRoute requiredPath="/metrics">
                    <Suspense fallback={Loader}>
                      <ImprovedMetricsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="metrics-old" element={<MetricsPage />} />
                <Route path="censor" element={
                  <ProtectedRoute requiredPath="/censor">
                    <Suspense fallback={Loader}>
                      <CensorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="faults" element={
                  <ProtectedRoute requiredPath="/faults">
                    <ImprovedFaultsPage />
                  </ProtectedRoute>
                } />
                <Route path="faults-old" element={<FaultsPage />} />
                <Route path="reports" element={
                  <ProtectedRoute requiredPath="/reports">
                    <ReportsPage />
                  </ProtectedRoute>
                } />
                <Route path="reports2" element={
                  <ProtectedRoute requiredPath="/reports">
                    <ReportsPage2 />
                  </ProtectedRoute>
                } />
                <Route path="datacenter-visualization-standalone" element={<Navigate to="/datacenter-visualization" replace />} />
                
                {/* Public information pages */}
                <Route path="terms" element={<TermsPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="help" element={<HelpPage />} />
                
                {/* Admin-only routes */}
                <Route path="admin" element={
                  <AdminRoute>
                    <ProtectedRoute requiredPath="/admin">
                      <AdminPage />
                    </ProtectedRoute>
                  </AdminRoute>
                } />
              </Route>
              
              {/* Test page without authentication */}
              <Route path="/test-metrics" element={<div>Test Page</div>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          </Router>
        </PermissionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
