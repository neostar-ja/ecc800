import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper, CircularProgress } from '@mui/material';
import { Lock as LockIcon, Home as HomeIcon } from '@mui/icons-material';
import { usePermissions } from '../contexts/PermissionContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPath: string;
  fallbackPath?: string;
}

/**
 * Protected Route Component
 * ป้องกันการเข้าถึง route ที่ไม่มีสิทธิ์
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPath, 
  fallbackPath = '/dashboard' 
}) => {
  const { canViewMenu, isLoading } = usePermissions();

  // Loading state - show better loading UI
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          กำลังตรวจสอบสิทธิ์...
        </Typography>
        <Typography variant="body2" color="text.disabled">
          กรุณารอสักครู่
        </Typography>
      </Box>
    );
  }

  // Check permission
  const hasAccess = canViewMenu(requiredPath);

  if (!hasAccess) {
    // Show access denied page instead of redirect
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffebee 100%)'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'error.main',
              mb: 3
            }}
          >
            <LockIcon sx={{ fontSize: 60, color: 'white' }} />
          </Box>
          
          <Typography variant="h4" gutterBottom color="error" fontWeight="bold">
            ไม่มีสิทธิ์เข้าถึง
          </Typography>
          
          <Typography variant="h6" gutterBottom color="text.secondary" sx={{ mb: 4 }}>
            คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ
            เพื่อขอสิทธิ์การเข้าถึง
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<HomeIcon />}
              onClick={() => window.location.href = fallbackPath}
            >
              กลับหน้าหลัก
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => window.history.back()}
            >
              ย้อนกลับ
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>ข้อมูลเพิ่มเติม:</strong><br />
              Path ที่พยายามเข้าถึง: <code>{requiredPath}</code>
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Has permission, render children
  return <>{children}</>;
};

export default ProtectedRoute;
