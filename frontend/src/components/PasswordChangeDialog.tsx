import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';

interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onPasswordChange: (oldPassword: string, newPassword: string) => Promise<void>;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: 'error' | 'warning' | 'info' | 'success';
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
  };
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ 
  open, 
  onClose, 
  onPasswordChange 
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    let label = 'อ่อนแอมาก';
    let color: 'error' | 'warning' | 'info' | 'success' = 'error';

    if (score >= 5) {
      label = 'แข็งแกร่งมาก';
      color = 'success';
    } else if (score >= 4) {
      label = 'แข็งแกร่ง';
      color = 'info';
    } else if (score >= 3) {
      label = 'ปานกลาง';
      color = 'warning';
    }

    return { score, label, color, checks };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleSubmit = async () => {
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('รหัสผ่านใหม่ไม่แข็งแกร่งพอ กรุณาเลือกรหัสผ่านที่มีความปลอดภัยมากขึ้น');
      return;
    }

    if (oldPassword === newPassword) {
      setError('รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม');
      return;
    }

    setLoading(true);
    try {
      await onPasswordChange(oldPassword, newPassword);
      handleClose();
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowPasswords({ old: false, new: false, confirm: false });
    onClose();
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <Security sx={{ color: '#f59e0b' }} />
        เปลี่ยนรหัสผ่าน
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 1 }}>
              {error}
            </Alert>
          )}

          {/* Current Password */}
          <TextField
            fullWidth
            label="รหัสผ่านปัจจุบัน"
            type={showPasswords.old ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('old')}
                    edge="end"
                    size="small"
                  >
                    {showPasswords.old ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* New Password */}
          <TextField
            fullWidth
            label="รหัสผ่านใหม่"
            type={showPasswords.new ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('new')}
                    edge="end"
                    size="small"
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ความแข็งแกร่งของรหัสผ่าน:
                </Typography>
                <Chip
                  label={passwordStrength.label}
                  color={passwordStrength.color}
                  size="small"
                />
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={(passwordStrength.score / 5) * 100}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                  }
                }}
                color={passwordStrength.color}
              />

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  ข้อกำหนดรหัสผ่าน:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {[
                    { key: 'length', label: 'มีความยาวอย่างน้อย 8 ตัวอักษร' },
                    { key: 'uppercase', label: 'มีตัวอักษรพิมพ์ใหญ่ (A-Z)' },
                    { key: 'lowercase', label: 'มีตัวอักษรพิมพ์เล็ก (a-z)' },
                    { key: 'numbers', label: 'มีตัวเลข (0-9)' },
                    { key: 'symbols', label: 'มีสัญลักษณ์พิเศษ (!@#$%^&*)' },
                  ].map(({ key, label }) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                        <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
                      ) : (
                        <Cancel sx={{ fontSize: 16, color: '#ef4444' }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: passwordStrength.checks[key as keyof typeof passwordStrength.checks] 
                            ? '#22c55e' 
                            : '#6b7280' 
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="ยืนยันรหัสผ่านใหม่"
            type={showPasswords.confirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            variant="outlined"
            error={confirmPassword !== '' && newPassword !== confirmPassword}
            helperText={
              confirmPassword !== '' && newPassword !== confirmPassword 
                ? 'รหัสผ่านไม่ตรงกัน' 
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => togglePasswordVisibility('confirm')}
                    edge="end"
                    size="small"
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          ยกเลิก
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || passwordStrength.score < 3 || newPassword !== confirmPassword}
          sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            }
          }}
        >
          {loading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordChangeDialog;