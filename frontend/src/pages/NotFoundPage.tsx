import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../contexts/ThemeProvider';
import {
  SentimentVeryDissatisfied,
  ArrowBack,
  Home
} from '@mui/icons-material';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode } = useCustomTheme();

  return (
    <Box
      className="min-h-screen flex items-center justify-center py-12 px-4"
      sx={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1f36 0%, #121827 100%)'
          : 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={isDarkMode ? 8 : 2}
          className="overflow-hidden"
          sx={{
            borderRadius: '16px',
            boxShadow: isDarkMode
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            border: isDarkMode
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <Grid container>
            {/* Left side with gradient */}
            <Grid item xs={12} md={5}
              sx={{
                backgroundImage: 'linear-gradient(135deg, #7B5BA4 0%, #F17422 100%)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 6,
                position: 'relative'
              }}
            >
              <SentimentVeryDissatisfied sx={{ fontSize: 100, mb: 4 }} />
              <Typography variant="h2" className="font-bold" sx={{ fontSize: { xs: '3rem', md: '4rem' } }}>
                404
              </Typography>
              <Typography variant="h5" className="font-medium text-center mt-4">
                ไม่พบหน้าที่คุณกำลังค้นหา
              </Typography>
              
              {/* Decorative elements */}
              <Box sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }} />
              <Box sx={{
                position: 'absolute',
                bottom: 40,
                right: 30,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }} />
            </Grid>
            
            {/* Right side with content */}
            <Grid item xs={12} md={7}>
              <Box className="p-6 sm:p-8 flex flex-col justify-center h-full">
                <Typography variant="h4" className="font-bold mb-4 text-gray-800 dark:text-white">
                  ขออภัย! ไม่พบหน้าที่คุณกำลังค้นหา
                </Typography>
                
                <Typography variant="body1" className="mb-6 text-gray-600 dark:text-gray-300">
                  หน้าที่คุณพยายามเข้าถึงอาจถูกย้าย ถูกลบ หรือไม่มีอยู่ในระบบ กรุณาตรวจสอบ URL อีกครั้ง หรือใช้ตัวเลือกด้านล่างเพื่อเข้าถึงหน้าที่คุณต้องการ
                </Typography>
                
                <Box className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<Home />}
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      backgroundImage: 'linear-gradient(135deg, #7B5BA4 0%, #F17422 100%)',
                      '&:hover': {
                        backgroundImage: 'linear-gradient(135deg, #6A4A93 0%, #E06311 100%)',
                      },
                    }}
                  >
                    กลับไปหน้าหลัก
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                    }}
                  >
                    กลับไปหน้าก่อนหน้า
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFoundPage;