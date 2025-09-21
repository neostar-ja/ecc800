import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const RackLayoutDashboard_Simple: React.FC = () => {
  console.log('Simple Dashboard rendering...');
  
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      p: 3,
      width: '100%',
      height: '100vh'
    }}>
      <Typography variant="h4" component="h1">
        Enhanced Rack Layout Dashboard (Simple Test)
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary">
          Data Center
        </Button>
        <Button variant="contained" color="secondary">
          Disaster Recovery
        </Button>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        border: '2px dashed #ccc', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">
          Canvas Area - ระบบทำงานปกติ!
        </Typography>
      </Box>
    </Box>
  );
};

export default RackLayoutDashboard_Simple;