import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import { LoginOutlined, Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login, isAuthenticated } = useAuthStore()

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.login({ username, password })
      const { access_token, user } = response.data || response
      
      login(access_token, user)
      
    } catch (error: any) {
      console.error('Login error:', error)
      setError(
        error.response?.data?.detail || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <Container maxWidth="sm">
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <Box className="text-center mb-8">
              <img
                src="/ecc800/assets/wuh_logo.png"
                alt="WU Hospital Logo"
                className="h-16 mx-auto mb-4"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <Typography variant="h4" className="font-bold text-primary-600 mb-2">
                ระบบ ECC800
              </Typography>
              <Typography variant="body1" color="textSecondary" className="text-center">
                ระบบแสดงผลข้อมูลห้อง Data Center ECC800<br />
                โรงพยาบาลศูนย์การแพทย์ มหาวิทยาลัยวลัยลักษณ์
              </Typography>
              <Typography variant="caption" color="textSecondary" className="block mt-2">
                พัฒนาโดย กลุ่มงานโครงสร้างพื้นฐานดิจิทัลทางการแพทย์
              </Typography>
            </Box>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <Box className="space-y-6">
                {error && (
                  <Alert severity="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="ชื่อผู้ใช้"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="username"
                  autoFocus
                />

                <TextField
                  fullWidth
                  label="รหัสผ่าน"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="min-w-0 p-2"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !username || !password}
                  className="h-12 mt-6"
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginOutlined />}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </Button>
              </Box>
            </form>

            {/* Demo credentials (for development) */}
            {import.meta.env.DEV && (
              <Box className="mt-6 p-4 bg-gray-50 rounded-lg">
                <Typography variant="caption" className="block mb-2 font-semibold">
                  บัญชีทดสอบ:
                </Typography>
                <Typography variant="caption" className="block">
                  • Admin: admin / Admin123!
                </Typography>
                <Typography variant="caption" className="block">
                  • Analyst: analyst / Analyst123!
                </Typography>
                <Typography variant="caption" className="block">
                  • Viewer: viewer / Viewer123!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </div>
  )
}

export default LoginPage
