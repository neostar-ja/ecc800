import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Badge,
  ListItem,
  ListItemText,
  ListItemIcon,
  List,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import {
  Computer,
  Visibility,
  Refresh,
  Search,
  CheckCircle,
  Warning,
  Error,
  Edit,
  Save,
  Cancel,
  Analytics,
  Speed,
  Memory,
  Storage,
  NetworkCheck,
  Timeline,
  Assessment,
} from '@mui/icons-material';

import { useSites, useEquipment } from '../lib/hooks';
import { api, EquipmentData, Equipment } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`equipment-tabpanel-${index}`}
      aria-labelledby={`equipment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EquipmentPage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentData | null>(null);
  const [equipmentDetails, setEquipmentDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const queryClient = useQueryClient();

  // Fetch sites
  const { data: sites, isLoading: sitesLoading, error: sitesError } = useSites();

  // Fetch equipment for selected site
  const { data: equipment, isLoading: equipmentLoading, error: equipmentError, refetch } = useEquipment(
    selectedSite,
    searchTerm,
    { enabled: !!selectedSite }
  );

  // Handle equipment details dialog
  const handleViewDetails = useCallback(async (equipmentItem: EquipmentData) => {
    setSelectedEquipment(equipmentItem);
    setDetailsLoading(true);
    setTabValue(0);
    
    try {
      const details = await api.getEquipmentDetails(selectedSite, equipmentItem.equipment_id || '');
      setEquipmentDetails(details);
      setNewEquipmentName(details.equipment?.custom_name || details.equipment?.original_name || equipmentItem.equipment_name || '');
    } catch (error) {
      console.error('Failed to fetch equipment details:', error);
      setSnackbar({
        open: true,
        message: 'ไม่สามารถโหลดรายละเอียดอุปกรณ์ได้',
        severity: 'error'
      });
    } finally {
      setDetailsLoading(false);
    }
  }, [selectedSite]);

  // Handle close details dialog
  const handleCloseDetails = useCallback(() => {
    setSelectedEquipment(null);
    setEquipmentDetails(null);
    setEditingName(false);
    setNewEquipmentName('');
  }, []);

  // Handle save equipment name
  const handleSaveEquipmentName = useCallback(async () => {
    if (!selectedEquipment || !selectedSite) return;
    
    try {
      await api.updateEquipmentName(selectedSite, selectedEquipment.equipment_id || '', newEquipmentName);
      setSnackbar({
        open: true,
        message: 'อัปเดตชื่ออุปกรณ์เรียบร้อยแล้ว',
        severity: 'success'
      });
      setEditingName(false);
      
      // Invalidate and refetch all equipment queries to ensure UI updates
      await queryClient.invalidateQueries({ 
        queryKey: ['equipment', selectedSite] 
      });
      
      // Also invalidate the equipment details if we have them loaded
      if (equipmentDetails) {
        await queryClient.invalidateQueries({ 
          queryKey: ['equipment', selectedSite, selectedEquipment.equipment_id, 'details'] 
        });
      }
      
      // Manual refresh as backup
      refetch();
      
      // Update local state immediately for responsive UI
      if (equipmentDetails) {
        const updatedDetails = { ...equipmentDetails };
        updatedDetails.equipment.custom_name = newEquipmentName;
        updatedDetails.equipment.display_name = newEquipmentName;
        setEquipmentDetails(updatedDetails);
      }
      
    } catch (error) {
      console.error('Failed to update equipment name:', error);
      setSnackbar({
        open: true,
        message: 'ไม่สามารถอัปเดตชื่ออุปกรณ์ได้',
        severity: 'error'
      });
    }
  }, [selectedEquipment, selectedSite, newEquipmentName, refetch, equipmentDetails, queryClient]);

  // Filter equipment based on search term
  const filteredEquipment = equipment?.filter((item: EquipmentData) =>
    item.equipment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
      case 'offline':
        return <Error color="error" />;
      default:
        return <Computer color="disabled" />;
    }
  };

  const getStatusColor = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  if (sitesLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (sitesError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          ไม่สามารถโหลดข้อมูลไซต์ได้: {sitesError.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            🖥️ จัดการอุปกรณ์
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            ติดตามสถานะและจัดการอุปกรณ์ในศูนย์ข้อมูล
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()} disabled={!selectedSite}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="เลือกไซต์"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                variant="outlined"
              >
                <MenuItem value="">-- เลือกไซต์ --</MenuItem>
                {sites?.map((site) => (
                  <MenuItem key={site.site_code} value={site.site_code}>
                    {site.site_name} ({site.site_code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ค้นหาอุปกรณ์"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
                placeholder="ค้นหาตาม ID, ชื่อ, หรือคำอธิบาย"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Equipment Stats */}
      {selectedSite && equipment && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Computer color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {equipment.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      อุปกรณ์ทั้งหมด
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {equipment.filter(item => item.status?.toLowerCase() === 'active' || item.status?.toLowerCase() === 'online').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ออนไลน์
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {equipment.filter(item => item.status?.toLowerCase() === 'warning').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      เตือน
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Error color="error" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {equipment.filter(item => item.status?.toLowerCase() === 'error' || item.status?.toLowerCase() === 'offline').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ขัดข้อง
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Equipment Table */}
      {selectedSite && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 รายการอุปกรณ์ - {sites?.find(s => s.site_code === selectedSite)?.site_name}
            </Typography>

            {equipmentLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  กำลังโหลดข้อมูลอุปกรณ์...
                </Typography>
              </Box>
            ) : equipmentError ? (
              <Alert severity="error">
                ไม่สามารถโหลดข้อมูลอุปกรณ์ได้: {equipmentError.message}
              </Alert>
            ) : filteredEquipment.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Computer sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  {equipment?.length === 0 ? 'ไม่พบอุปกรณ์ในไซต์นี้' : 'ไม่พบอุปกรณ์ที่ตรงกับการค้นหา'}
                </Typography>
                {searchTerm && (
                  <Typography variant="body2" color="textSecondary">
                    ลองเปลี่ยนคำค้นหาหรือเคลียร์ตัวกรอง
                  </Typography>
                )}
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>สถานะ</TableCell>
                      <TableCell>รหัสอุปกรณ์</TableCell>
                      <TableCell>ชื่ออุปกรณ์</TableCell>
                      <TableCell>ประเภท</TableCell>
                      <TableCell>คำอธิบาย</TableCell>
                      <TableCell>ข้อมูลล่าสุด</TableCell>
                      <TableCell align="center">การจัดการ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEquipment.map((item) => (
                      <TableRow key={item.equipment_id || `eq-${Math.random()}`} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(item.status)}
                            <Chip 
                              label={item.status || 'ไม่ทราบ'}
                              color={getStatusColor(item.status)}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {item.equipment_id || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.display_name || item.custom_name || item.equipment_name || item.original_name || 'ไม่ระบุ'}
                            </Typography>
                            {(
                              (item.display_name && item.original_name && item.display_name !== item.original_name) ||
                              (item.custom_name && item.original_name && item.custom_name !== item.original_name)
                            ) && (
                              <Typography variant="caption" color="textSecondary">
                                เดิม: {item.original_name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.equipment_type || item.type || 'ไม่ทราบ'}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {item.description || '-'}
                            </Typography>
                            {/* show additional small stats if present */}
                            <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {item.metrics_count !== undefined && (
                                <Chip label={`Metrics: ${item.metrics_count}`} size="small" />
                              )}
                              {item.total_records !== undefined && (
                                <Chip label={`Records: ${item.total_records.toLocaleString()}`} size="small" />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.last_updated ? (
                            <Typography variant="body2">
                              {new Date(item.last_updated).toLocaleString('th-TH')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              ไม่มีข้อมูล
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="ดูรายละเอียด">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleViewDetails(item)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="แก้ไขชื่อ">
                              <IconButton 
                                size="small" 
                                color="secondary"
                                onClick={() => {
                                  setSelectedEquipment(item);
                                  setNewEquipmentName(item.equipment_name || '');
                                  setEditingName(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Site Selected */}
      {!selectedSite && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Computer sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="textSecondary" gutterBottom>
                เลือกไซต์เพื่อดูอุปกรณ์
              </Typography>
              <Typography variant="body1" color="textSecondary">
                กรุณาเลือกไซต์จากรายการด้านบนเพื่อแสดงรายการอุปกรณ์
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Equipment Details Dialog */}
      <Dialog 
        open={!!selectedEquipment && !editingName} 
        onClose={handleCloseDetails}
        maxWidth="lg"
        fullWidth
      >
                <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Computer sx={{ mr: 1 }} />
              <Box>
                        <Typography variant="h6">
                          รายละเอียดอุปกรณ์: {selectedEquipment?.display_name || selectedEquipment?.custom_name || selectedEquipment?.equipment_name || selectedEquipment?.equipment_id}
                        </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  {sites?.find(s => s.site_code === selectedSite)?.site_name}
                </Typography>
              </Box>
            </Box>
            {selectedEquipment && (
              <Chip 
                icon={getStatusIcon(selectedEquipment.status)}
                label={selectedEquipment.status || 'ไม่ทราบ'}
                color={getStatusColor(selectedEquipment.status)}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>กำลังโหลดรายละเอียด...</Typography>
            </Box>
          ) : equipmentDetails ? (
            <>
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="ข้อมูลทั่วไป" icon={<Computer />} />
                <Tab label="เมทริกและข้อมูล" icon={<Analytics />} />
                <Tab label="ประวัติการทำงาน" icon={<Timeline />} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          📝 ข้อมูลพื้นฐาน
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemIcon><Computer /></ListItemIcon>
                            <ListItemText
                              primary="รหัสอุปกรณ์"
                              secondary={equipmentDetails.equipment?.equipment_id || 'N/A'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><Edit /></ListItemIcon>
                            <ListItemText
                              primary="ชื่อเดิม"
                              secondary={equipmentDetails.equipment?.original_name || 'N/A'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><Badge /></ListItemIcon>
                            <ListItemText
                              primary="ชื่อแสดง"
                              secondary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography>
                                    {equipmentDetails.equipment?.custom_name || equipmentDetails.equipment?.original_name || 'N/A'}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => {
                                      setNewEquipmentName(equipmentDetails.equipment?.custom_name || equipmentDetails.equipment?.original_name || '');
                                      setEditingName(true);
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Box>
                              }
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          📊 สถิติข้อมูล
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemIcon><Speed /></ListItemIcon>
                            <ListItemText
                              primary="จำนวน Metrics"
                              secondary={equipmentDetails.equipment?.metrics_count || 0}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><Storage /></ListItemIcon>
                            <ListItemText
                              primary="จำนวนบันทึกข้อมูล"
                              secondary={(equipmentDetails.equipment?.total_records || 0).toLocaleString()}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon><Assessment /></ListItemIcon>
                            <ListItemText
                              primary="อัปเดตล่าสุด"
                              secondary={equipmentDetails.equipment?.last_updated ? 
                                new Date(equipmentDetails.equipment.last_updated).toLocaleString('th-TH') : 'ไม่มีข้อมูล'}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      📈 Metrics และข้อมูล
                    </Typography>
                    <Box textAlign="center" py={4}>
                      <Analytics sx={{ fontSize: 60, color: 'text.disabled' }} />
                      <Typography variant="h6" color="textSecondary">
                        ข้อมูล Metrics จะแสดงที่นี่
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        อยู่ระหว่างการพัฒนา
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      🕐 ประวัติการทำงาน
                    </Typography>
                    <Box textAlign="center" py={4}>
                      <Timeline sx={{ fontSize: 60, color: 'text.disabled' }} />
                      <Typography variant="h6" color="textSecondary">
                        ประวัติการทำงานจะแสดงที่นี่
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        อยู่ระหว่างการพัฒนา
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </TabPanel>
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                ไม่พบรายละเอียดอุปกรณ์
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editingName} onClose={() => setEditingName(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Edit sx={{ mr: 1 }} />
            แก้ไขชื่ออุปกรณ์
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              อุปกรณ์: {selectedEquipment?.equipment_id}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              ชื่อเดิม: {selectedEquipment?.original_name || selectedEquipment?.equipment_name}
            </Typography>
            <TextField
              fullWidth
              label="ชื่อใหม่"
              value={newEquipmentName}
              onChange={(e) => setNewEquipmentName(e.target.value)}
              placeholder="ป้อนชื่อใหม่สำหรับอุปกรณ์"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingName(false)}>
            ยกเลิก
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEquipmentName}
            disabled={!newEquipmentName.trim()}
            startIcon={<Save />}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EquipmentPage;
