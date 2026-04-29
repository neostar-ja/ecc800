import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

const ElectricityRateManagement = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [dataCenters, setDataCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    data_center_id: '',
    site_code: '',
    rate_value: '',
    description: '',
    effective_from: '',
    effective_to: '',
    is_active: true,
  });

  useEffect(() => {
    loadDataCenters();
    loadAllRates();
  }, []);

  const loadDataCenters = async () => {
    try {
      const data = await apiGet<any[]>('/admin/data-centers');
      setDataCenters(data || []);
    } catch (err) {
      console.error('Error loading data centers:', err);
      // Fallback to sites
      try {
        const res2 = await apiGet<any>('/sites');
        setDataCenters(res2.data || res2 || []);
      } catch (e2) {
        setError('ไม่สามารถโหลดข้อมูล Data Center');
      }
    }
  };

  const loadAllRates = async () => {
    setLoading(true);
    try {
      const data = await apiGet<any[]>('/electricity-cost/rates/all');
      setRates(data || []);
      setError('');
    } catch (err: any) {
      console.error('Error loading rates:', err);
      setError('ไม่สามารถโหลดข้อมูลอัตราค่าไฟฟ้า: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      data_center_id: dataCenters[0]?.id?.toString() || '',
      site_code: dataCenters[0]?.site_code || '',
      rate_value: '',
      description: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      is_active: true,
    });
    setOpenDialog(true);
  };

  const handleEditClick = (rate: any) => {
    setEditingId(rate.id);
    setFormData({
      data_center_id: rate.data_center_id?.toString(),
      site_code: rate.site_code,
      rate_value: rate.rate_value?.toString(),
      description: rate.description || '',
      effective_from: rate.effective_from?.split('T')[0] || '',
      effective_to: rate.effective_to ? rate.effective_to.split('T')[0] : '',
      is_active: rate.is_active,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setFormData({
      data_center_id: '',
      site_code: '',
      rate_value: '',
      description: '',
      effective_from: '',
      effective_to: '',
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Clean up payload: convert empty strings to null for optional dates
      // and ensure numbers are correctly typed
      const payload: any = {
        rate_value: parseFloat(formData.rate_value),
        description: formData.description || null,
        effective_from: formData.effective_from || null,
        effective_to: formData.effective_to || null,
        is_active: formData.is_active,
      };

      if (editingId) {
        // For update, we only send fields in ElectricityRateUpdate schema
        await apiPut(`/electricity-cost/rates/${editingId}`, payload);
        setSuccess('อัปเดตอัตราค่าไฟฟ้าสำเร็จ');
      } else {
        // For create, we need data_center_id and site_code
        const createPayload = {
          ...payload,
          data_center_id: parseInt(formData.data_center_id),
          site_code: formData.site_code,
        };
        await apiPost('/electricity-cost/rates', createPayload);
        setSuccess('สร้างอัตราค่าไฟฟ้าสำเร็จ');
      }

      handleCloseDialog();
      loadAllRates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('คุณแน่ใจหรือว่าต้องการลบอัตราค่าไฟฟ้านี้?')) {
      try {
        setLoading(true);
        await apiDelete(`/electricity-cost/rates/${id}`);
        setSuccess('ลบอัตราค่าไฟฟ้าสำเร็จ');
        loadAllRates();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDataCenterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dcId = parseInt(e.target.value);
    const selectedDC = dataCenters.find((dc: any) => dc.id === dcId);
    setFormData((prev) => ({
      ...prev,
      data_center_id: String(dcId),
      site_code: selectedDC?.site_code || '',
    }));
  };

  const getDCName = (dcId: number) => {
    const dc = dataCenters.find((d: any) => d.id === dcId);
    return dc ? `${dc.name} (${dc.site_code})` : `ID: ${dcId}`;
  };

  return (
    <Box>
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ElectricBoltIcon sx={{ mr: 2, color: '#ffa726' }} />
              <Typography variant="h6" fontWeight="bold">
                จัดการอัตราค่าไฟฟ้า
              </Typography>
            </Box>
          }
          subheader="ตั้งค่าอัตราค่าไฟฟ้า (Baht/kWh) สำหรับแต่ละ Data Center"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              เพิ่มอัตรา
            </Button>
          }
          sx={{ 
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            borderBottom: '1px solid #ffcc80'
          }}
        />
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

          {loading && !rates.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell><strong>Data Center</strong></TableCell>
                    <TableCell align="right"><strong>อัตรา (Baht/kWh)</strong></TableCell>
                    <TableCell><strong>คำอธิบาย</strong></TableCell>
                    <TableCell><strong>วันที่เริ่มต้น</strong></TableCell>
                    <TableCell><strong>วันที่สิ้นสุด</strong></TableCell>
                    <TableCell><strong>สถานะ</strong></TableCell>
                    <TableCell align="center"><strong>จัดการ</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          ยังไม่มีข้อมูลอัตราค่าไฟฟ้า กรุณาเพิ่มอัตราค่าไฟ
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rates.map((rate: any) => (
                      <TableRow key={rate.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {getDCName(rate.data_center_id)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1.05rem' }}>
                            ฿{parseFloat(rate.rate_value).toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {rate.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {rate.effective_from ? format(new Date(rate.effective_from), 'dd MMM yyyy', { locale: th }) : '-'}
                        </TableCell>
                        <TableCell>
                          {rate.effective_to
                            ? format(new Date(rate.effective_to), 'dd MMM yyyy', { locale: th })
                            : <Chip label="ไม่มีกำหนด" size="small" color="info" variant="outlined" />}
                        </TableCell>
                        <TableCell>
                          {rate.is_active ? (
                            <Chip label="ใช้งาน" size="small" color="success" />
                          ) : (
                            <Chip label="ปิด" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="แก้ไข">
                            <IconButton size="small" onClick={() => handleEditClick(rate)} disabled={loading}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบ">
                            <IconButton size="small" color="error" onClick={() => handleDelete(rate.id)} disabled={loading}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ElectricBoltIcon />
            {editingId ? 'แก้ไขอัตราค่าไฟฟ้า' : 'เพิ่มอัตราค่าไฟฟ้าใหม่'}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Data Center"
                name="data_center_id"
                value={formData.data_center_id}
                onChange={handleDataCenterChange}
                SelectProps={{ native: true }}
                disabled={editingId !== null}
              >
                <option value="">-- เลือก Data Center --</option>
                {dataCenters.map((dc: any) => (
                  <option key={dc.id} value={dc.id}>
                    {dc.name} ({dc.site_code})
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="อัตราค่าไฟ (Baht/kWh)"
                name="rate_value"
                type="number"
                value={formData.rate_value}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: '0.0001' }}
                helperText="เช่น 5.1200 บาท/kWh"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="คำอธิบาย"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="เช่น ค่าไฟเบิกจ่าย 2026"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="วันที่เริ่มต้น"
                name="effective_from"
                type="date"
                value={formData.effective_from}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="วันที่สิ้นสุด (ไม่บังคับ)"
                name="effective_to"
                type="date"
                value={formData.effective_to}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    color="success"
                  />
                }
                label="เปิดการใช้งาน"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={loading || !formData.rate_value || !formData.data_center_id}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {loading ? <CircularProgress size={24} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ElectricityRateManagement;
