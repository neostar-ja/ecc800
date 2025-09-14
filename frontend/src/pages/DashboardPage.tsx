import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Memory,
  Warning,
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        แดshบอร์ด
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Business color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    จำนวนไซต์
                  </Typography>
                  <Typography variant="h4">
                    12
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Memory color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    จำนวนอุปกรณ์
                  </Typography>
                  <Typography variant="h4">
                    248
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning color="error" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    ข้อผิดพลาด
                  </Typography>
                  <Typography variant="h4">
                    7
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Dashboard color="success" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    ใช้งานได้
                  </Typography>
                  <Typography variant="h4">
                    97%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            สถานะระบบ
          </Typography>
          <Typography variant="body1">
            ระบบกำลังทำงานปกติ - ข้อมูลล่าสุด: {new Date().toLocaleString('th-TH')}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default DashboardPage;
