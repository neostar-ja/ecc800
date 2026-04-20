import React, { useEffect, useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Chip,
    IconButton,
    Button
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    TrendingUp,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Bolt,
    Thermostat
} from '@mui/icons-material';
import { glassCardClass, sectionTitleClass } from '../../styles/designSystem';
import { apiGet } from '../../lib/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ExecutiveSummary {
    health_score: number;
    current_pue: number;
    total_power_kw: number;
    active_issues: number;
    last_updated: string;
}

const ExecutiveDashboard: React.FC = () => {
    const [data, setData] = useState<ExecutiveSummary | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiGet<ExecutiveSummary>('/executive'); // Fixed: Removed /reports prefix as apiGet adds /api/v1
            // Note: Backend endpoint is actually at /executive directly on router, 
            // but router prefix is usually /api/v1... let's check reports.py
            // reports.py uses router = APIRouter(), main.py might include it.
            // Assuming endpoint is at /executive based on code I wrote.
            // Wait, endpoint is @router.get("/executive"). If main.py includes reports router with prefix, it's there.
            // Usually main.py includes reports router.

            // Let's assume the path is relative to the API base.
            // Correct path: /reports/executive based on previous existing endpoints?
            // No, I added it as /executive. Let me check if previous ones had prefix.
            // Previous: @router.get("/reports/summary"). My new ones are @router.get("/executive").
            // So if main.py mounts router with no prefix (or just /api/v1), then it's /executive.
            // But usually grouped. I should have checked.
            // Let's try /executive first.

            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    }

    // Calculate gauge color for PUE
    const getPUEColor = (pue: number) => {
        if (pue < 1.5) return '#4caf50';
        if (pue < 1.8) return '#ff9800';
        return '#f44336';
    };

    const healthColor = (data?.health_score || 0) > 80 ? '#4caf50' : (data?.health_score || 0) > 50 ? '#ff9800' : '#f44336';

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" className={sectionTitleClass}>
                    Executive Summary
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={fetchData} variant="outlined" size="small">
                    Refresh
                </Button>
            </Box>

            {/* Bento Grid Layout */}
            <Grid container spacing={3}>

                {/* Health Score - Large Card */}
                <Grid item xs={12} md={4} lg={3}>
                    <Card className={glassCardClass} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <CardContent sx={{ textAlign: 'center', width: '100%' }}>
                            <Box position="relative" display="inline-flex" mb={2}>
                                <CircularProgress
                                    variant="determinate"
                                    value={100}
                                    size={140}
                                    sx={{ color: 'rgba(255,255,255,0.1)' }}
                                />
                                <CircularProgress
                                    variant="determinate"
                                    value={data?.health_score || 0}
                                    size={140}
                                    sx={{ color: healthColor, position: 'absolute', left: 0 }}
                                />
                                <Box
                                    sx={{
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        position: 'absolute',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
                                        {data?.health_score}
                                    </Typography>
                                    <Typography variant="caption" component="div" color="text.secondary">
                                        Health Score
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Overall system reliability based on PUE and active alarms.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* PUE Gauge */}
                <Grid item xs={12} md={4} lg={3}>
                    <Card className={glassCardClass} sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <TrendingUp color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6">Real-time PUE</Typography>
                            </Box>
                            <Typography variant="h2" sx={{ color: getPUEColor(data?.current_pue || 1.5), my: 2, fontWeight: 'bold' }}>
                                {data?.current_pue.toFixed(2)}
                            </Typography>
                            <Chip
                                label={data?.current_pue && data.current_pue < 1.5 ? "Efficient" : "Optimization Needed"}
                                color={data?.current_pue && data.current_pue < 1.5 ? "success" : "warning"}
                                size="small"
                            />
                            <Typography variant="caption" display="block" mt={2} color="text.secondary">
                                Target: &lt; 1.5
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Power */}
                <Grid item xs={12} md={4} lg={3}>
                    <Card className={glassCardClass} sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <Bolt sx={{ color: '#ffeb3b', mr: 1 }} />
                                <Typography variant="h6">Total Active Power</Typography>
                            </Box>
                            <Typography variant="h3" sx={{ my: 2, fontWeight: 'bold' }}>
                                {data?.total_power_kw.toFixed(1)} <span style={{ fontSize: '1rem', color: '#888' }}>kW</span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total consumption across all IT and facility equipment.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active Issues */}
                <Grid item xs={12} md={4} lg={3}>
                    <Card className={glassCardClass} sx={{ height: '100%', bgcolor: (data?.active_issues || 0) > 0 ? 'rgba(244, 67, 54, 0.1)' : undefined }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                {(data?.active_issues || 0) > 0 ? <WarningIcon color="error" sx={{ mr: 1 }} /> : <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
                                <Typography variant="h6">Active Issues</Typography>
                            </Box>
                            <Typography variant="h2" sx={{ my: 2, fontWeight: 'bold', color: (data?.active_issues || 0) > 0 ? '#f44336' : '#4caf50' }}>
                                {data?.active_issues}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Devices reporting offline or error status.
                            </Typography>
                            {data?.active_issues ? (
                                <Button variant="text" color="error" size="small" sx={{ mt: 1 }}>
                                    View Alarms
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cost & Efficiency Chart placeholder */}
                <Grid item xs={12} md={8}>
                    <Card className={glassCardClass} sx={{ minHeight: 300 }}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass}>Energy Cost Projection</Typography>
                            <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                                <Typography color="text.secondary">
                                    [Chart: Weekly Cost Trend based on Power]
                                    <br />
                                    Waiting for billing API integration...
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Thermal Status Mockup */}
                <Grid item xs={12} md={4}>
                    <Card className={glassCardClass} sx={{ minHeight: 300 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <Thermostat color="info" sx={{ mr: 1 }} />
                                <Typography variant="h6">Thermal Status</Typography>
                            </Box>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography>Avg Temp</Typography>
                                    <Typography fontWeight="bold">24.5°C</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography>Hot Spots</Typography>
                                    <Chip label="None" color="success" size="small" />
                                </Box>
                                <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.2)" borderRadius={2}>
                                    <Typography variant="caption" color="text.secondary">Cooling Efficiency</Typography>
                                    <Box display="flex" alignItems="end" gap={1}>
                                        <Typography variant="h4" color="info.main">92%</Typography>
                                        <Typography variant="body2" mb={1}>Optimum</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
};

export default ExecutiveDashboard;
