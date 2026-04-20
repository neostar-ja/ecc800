import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Don't catch non-Error objects or promise-like objects (Suspense)
    if (!error || !(error instanceof Error) || (typeof error === 'object' && 'then' in error)) {
      throw error;
    }
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Don't catch Suspense errors
    if (error && typeof error === 'object' && 'then' in error) {
      return;
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state when resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys || [];
      
      if (prevKeys.length !== currentKeys.length || 
          prevKeys.some((key, i) => key !== currentKeys[i])) {
        this.reset();
      }
    }
  }

  private reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReset = () => {
    this.reset();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error.main" fontWeight="bold">
              ⚠️ เกิดข้อผิดพลาด
            </Typography>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 3 }}>
              ขออภัย เกิดข้อผิดพลาดในการแสดงผล
            </Typography>

            {this.state.error && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1, color: 'text.secondary' }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.handleReset}
                size="large"
              >
                โหลดหน้าใหม่
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => window.history.back()}
                size="large"
              >
                กลับหน้าก่อนหน้า
              </Button>
            </Box>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 3, display: 'block' }}>
              หากปัญหายังคงมีอยู่ กรุณาติดต่อผู้ดูแลระบบ
            </Typography>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
