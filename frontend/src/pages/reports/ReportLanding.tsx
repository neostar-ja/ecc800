import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    ElectricBolt as PowerIcon,
    AcUnit as CoolingIcon,
    Construction as ConstructionIcon,
    ArrowForward
} from '@mui/icons-material';
import { glassCardClass, sectionTitleClass } from '../../styles/designSystem';

interface ReportLandingProps {
    onSelectReport: (reportId: string, days: number) => void;
}

const ReportLanding: React.FC<ReportLandingProps> = ({ onSelectReport }) => {
    const theme = useTheme();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [days, setDays] = useState<number>(7);
    const [openConfig, setOpenConfig] = useState(false);

    const reportTypes = [
        {
            id: 'executive',
            title: 'Executive Summary',
            description: 'ภาพรวมระบบ คะแนนสุขภาพ และ KPIs สำคัญสำหรับผู้บริหาร',
            icon: <DashboardIcon sx={{ fontSize: 60, color: '#2196f3' }} />,
            color: '#2196f3',
            defaultDays: 1 // usually real-time or today
        },
        {
            id: 'power',
            title: 'Power & Energy',
            description: 'วิเคราะห์ PUE, การใช้พลังงาน, และสถานะ UPS อย่างละเอียด',
            icon: <PowerIcon sx={{ fontSize: 60, color: '#ffb74d' }} />,
            color: '#ffb74d',
            defaultDays: 7
        },
        {
            id: 'cooling',
            title: 'Cooling & Environment',
            description: 'แผนที่ความร้อน (Heatmap), กราฟอุณหภูมิ และความชื้น',
            icon: <CoolingIcon sx={{ fontSize: 60, color: '#00e5ff' }} />,
            color: '#00e5ff',
            defaultDays: 7
        },
        {
            id: 'quality',
            title: 'Data Quality & Logs',
            description: 'ตรวจสอบคุณภาพข้อมูลและ Log การทำงาน (Coming Soon)',
            icon: <ConstructionIcon sx={{ fontSize: 60, color: '#9e9e9e' }} />,
            color: '#9e9e9e',
            locked: true,
            defaultDays: 1
        }
    ];

    const handleCardClick = (type: any) => {
        if (type.locked) return;
        setSelectedType(type.id);
        setDays(type.defaultDays);
        setOpenConfig(true);
    };

    const handleConfirm = () => {
        if (selectedType) {
            onSelectReport(selectedType, days);
            setOpenConfig(false);
        }
    };

    return (
        <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Hero Section */}
            <Box textAlign="center" mb={6} mt={4}>
                <Typography variant="h3" fontWeight="bold" gutterBottom sx={{
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Reports & Analytics Center
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    เลือกประเภทรายงานที่ต้องการวิเคราะห์
                </Typography>
            </Box>

            {/* Grid Selection */}
            <Grid container spacing={4} maxWidth="lg" justifyContent="center">
                {reportTypes.map((type) => (
                    <Grid item xs={12} sm={6} md={3} key={type.id}>
                        <Card
                            className={glassCardClass}
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                opacity: type.locked ? 0.6 : 1,
                                cursor: type.locked ? 'not-allowed' : 'pointer',
                                '&:hover': !type.locked ? {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 12px 24px rgba(0,0,0,0.1), 0 0 0 2px ${type.color}`,
                                } : {}
                            }}
                        >
                            <CardActionArea
                                onClick={() => handleCardClick(type)}
                                disabled={type.locked}
                                sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                            >
                                <Box mb={2} p={2} borderRadius="50%" bgcolor={`${type.color}20`}>
                                    {type.icon}
                                </Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {type.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {type.description}
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Config Dialog */}
            <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="xs" fullWidth>
                <DialogTitle className={sectionTitleClass} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    ตั้งค่ารายงาน
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box py={2}>
                        <FormControl fullWidth>
                            <InputLabel>เลือกช่วงเวลาข้อมูล</InputLabel>
                            <Select
                                value={days}
                                label="เลือกช่วงเวลาข้อมูล"
                                onChange={(e) => setDays(Number(e.target.value))}
                            >
                                <MenuItem value={1}>24 ชั่วโมงล่าสุด</MenuItem>
                                <MenuItem value={3}>3 วันย้อนหลัง</MenuItem>
                                <MenuItem value={7}>7 วันย้อนหลัง</MenuItem>
                                <MenuItem value={30}>30 วันย้อนหลัง</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenConfig(false)} color="inherit">
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        endIcon={<ArrowForward />}
                        sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            color: 'white',
                            px: 3
                        }}
                    >
                        สร้างรายงาน
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default ReportLanding;
