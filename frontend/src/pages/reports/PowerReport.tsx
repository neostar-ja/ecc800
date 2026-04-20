import React, { useEffect, useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';
import { glassCardClass, sectionTitleClass } from '../../styles/designSystem';
import { apiGet } from '../../lib/api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface UPSStatus {
    equipment_id: string;
    site_code: string;
    battery_capacity: number;
    load_ratio: number;
    input_power: number;
}

interface PowerReportData {
    pue_trend: { date: string, value: number }[];
    power_trend: { date: string, value: number }[];
    ups_status: UPSStatus[];
}

interface PowerReportProps {
    days?: number;
}

const PowerReport: React.FC<PowerReportProps> = ({ days = 7 }) => {
    const [data, setData] = useState<PowerReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiGet<PowerReportData>(`/power?days=${days}`);
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    const formatXAxis = (iso: string) => {
        try {
            return format(parseISO(iso), 'dd MMM', { locale: th });
        } catch {
            return iso;
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" className={sectionTitleClass}>
                    Power & Energy Analytics ({days} Days)
                </Typography>
                <Box display="flex" gap={1}>
                    <Button startIcon={<DownloadIcon />} variant="outlined" size="small">Export</Button>
                    <Button startIcon={<RefreshIcon />} onClick={fetchData} variant="contained" size="small">Refresh</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* PUE Trend Chart */}
                <Grid item xs={12} md={6}>
                    <Card className={glassCardClass}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass} gutterBottom>
                                PUE Trend
                            </Typography>
                            <Box height={300}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data?.pue_trend || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatXAxis} />
                                        <YAxis domain={[1, 'auto']} />
                                        <Tooltip labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy', { locale: th })} />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" name="PUE" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Power Consumption Chart */}
                <Grid item xs={12} md={6}>
                    <Card className={glassCardClass}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass} gutterBottom>
                                Total Energy Consumption
                            </Typography>
                            <Box height={300}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.power_trend || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatXAxis} />
                                        <YAxis />
                                        <Tooltip labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy', { locale: th })} />
                                        <Legend />
                                        <Bar dataKey="value" fill="#82ca9d" name="Energy (kWh)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* UPS Status Table */}
                <Grid item xs={12}>
                    <Card className={glassCardClass}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass} gutterBottom>
                                UPS System Status
                            </Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Equipment ID</TableCell>
                                            <TableCell align="center">Battery Capacity</TableCell>
                                            <TableCell align="center">Load Ratio</TableCell>
                                            <TableCell align="right">Input Power (kW)</TableCell>
                                            <TableCell align="center">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(data?.ups_status || []).map((row) => (
                                            <TableRow key={row.equipment_id}>
                                                <TableCell component="th" scope="row">
                                                    <Typography variant="body2" fontWeight="bold">{row.equipment_id.split('-').pop() || row.equipment_id}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{row.site_code}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box display="flex" alignItems="center" justifyContent="center">
                                                        <CircularProgress variant="determinate" value={row.battery_capacity || 0} size={24} sx={{ mr: 1, color: (row.battery_capacity || 0) < 50 ? 'error.main' : 'success.main' }} />
                                                        {row.battery_capacity ? row.battery_capacity.toFixed(0) : '0'}%
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">{(row.load_ratio || 0).toFixed(1)}%</TableCell>
                                                <TableCell align="right">{(row.input_power || 0).toFixed(2)}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={row.battery_capacity > 20 ? "Normal" : "Low Battery"}
                                                        color={row.battery_capacity > 20 ? "success" : "error"}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!data?.ups_status || data.ups_status.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">No UPS data available</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PowerReport;
