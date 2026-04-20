import React, { useEffect, useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Button
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon, AcUnit } from '@mui/icons-material';
import { glassCardClass, sectionTitleClass } from '../../styles/designSystem';
import { apiGet } from '../../lib/api';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface CoolingReportData {
    environment_trend: {
        date: string;
        avg_temp: number;
        max_temp: number;
        min_temp: number;
        avg_humid: number;
    }[];
    hotspots: {
        equipment_id: string;
        site_code: string;
        metric: string;
        value_numeric: number;
        statistical_start_time: string;
    }[];
}

interface CoolingReportProps {
    days?: number;
}

const CoolingReport: React.FC<CoolingReportProps> = ({ days = 7 }) => {
    const [data, setData] = useState<CoolingReportData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiGet<CoolingReportData>(`/cooling?days=${days}`);
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
                    Environmental Control ({days} Days)
                </Typography>
                <Box display="flex" gap={1}>
                    <Button startIcon={<DownloadIcon />} variant="outlined" size="small">Export</Button>
                    <Button startIcon={<RefreshIcon />} onClick={fetchData} variant="contained" size="small">Refresh</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Temperature & Humidity Trend */}
                <Grid item xs={12}>
                    <Card className={glassCardClass}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass} gutterBottom>
                                Temperature & Humidity Trends
                            </Typography>
                            <Box height={400}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data?.environment_trend || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatXAxis} />
                                        <YAxis yAxisId="left" orientation="left" domain={[15, 35]} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
                                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
                                        <Tooltip labelFormatter={(label) => format(parseISO(label), 'dd MMM yyyy', { locale: th })} />
                                        <Legend />
                                        <Area yAxisId="left" type="monotone" dataKey="min_temp" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="Min Temp" />
                                        <Area yAxisId="left" type="monotone" dataKey="max_temp" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.1} name="Max Temp" />
                                        <Line yAxisId="left" type="monotone" dataKey="avg_temp" stroke="#ff7300" strokeWidth={2} name="Avg Temp" />
                                        <Line yAxisId="right" type="monotone" dataKey="avg_humid" stroke="#4dabf5" strokeWidth={2} name="Humidity" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Hot Spots List */}
                <Grid item xs={12} md={6}>
                    <Card className={glassCardClass} sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                                <AcUnit color="error" sx={{ mr: 1 }} />
                                <Typography variant="h6" className={sectionTitleClass}>
                                    Recent Hot Spots (&gt;30°C)
                                </Typography>
                            </Box>

                            {(!data?.hotspots || data.hotspots.length === 0) ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height={200} flexDirection="column">
                                    <Typography color="text.secondary">No hot spots detected in last 24h</Typography>
                                    <Button variant="contained" color="success" sx={{ mt: 2 }} disabled>All Systems Normal</Button>
                                </Box>
                            ) : (
                                <Box maxHeight={300} overflow="auto">
                                    {data.hotspots.map((spot, idx) => (
                                        <Box key={idx} p={2} mb={1} bgcolor="rgba(244, 67, 54, 0.1)" borderRadius={2} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {spot.equipment_id}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(parseISO(spot.statistical_start_time), 'HH:mm')} - {spot.site_code}
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" color="error" fontWeight="bold">
                                                {spot.value_numeric.toFixed(1)}°C
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Cooling Efficiency Heatmap Placeholder */}
                <Grid item xs={12} md={6}>
                    <Card className={glassCardClass} sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" className={sectionTitleClass} gutterBottom>
                                Cooling Capacity Status
                            </Typography>
                            <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                                <Typography color="text.secondary">
                                    [Component: Floor Plan Heatmap]
                                    <br />
                                    Requires floor plan assets mapping
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
};

export default CoolingReport;
