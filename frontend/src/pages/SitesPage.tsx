import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import { Refresh, Download } from '@mui/icons-material';
import { apiGet } from '../lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface SiteItem { site_code: string; site_name?: string }
interface Summary { devices:number; metrics:number; datapoints:number; faults:number; last_import:string; success_rate:number; health_score:number }

const fmtX = (iso: string) => { try { const d = parseISO(iso); return format(d, "d MMM HH:mm 'น.'", { locale: th }); } catch { return iso; } };
const fmtTooltip = (iso: string) => { try { const d = parseISO(iso); return format(d, "EEE d MMM yyyy HH:mm:ss 'น.'", { locale: th }); } catch { return iso; } };

const SitesPage: React.FC = () => {
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [leftSite, setLeftSite] = useState<string>('');
  const [rightSite, setRightSite] = useState<string>('');
  const [period, setPeriod] = useState<string>('24h');
  const [loading, setLoading] = useState<boolean>(false);

  // Data states
  const [leftSummary, setLeftSummary] = useState<Summary | null>(null);
  const [rightSummary, setRightSummary] = useState<Summary | null>(null);
  const [leftTemp, setLeftTemp] = useState<any[]>([]);
  const [rightTemp, setRightTemp] = useState<any[]>([]);
  const [leftIngest, setLeftIngest] = useState<any[]>([]);
  const [rightIngest, setRightIngest] = useState<any[]>([]);
  const [leftBreakdown, setLeftBreakdown] = useState<any[]>([]);
  const [rightBreakdown, setRightBreakdown] = useState<any[]>([]);
  const [leftFaults, setLeftFaults] = useState<any[]>([]);
  const [rightFaults, setRightFaults] = useState<any[]>([]);
  const hours = useMemo(() => ({'24h':24,'3d':72,'7d':168,'30d':720}[period] || 24), [period]);
  const bucket = hours <= 72 ? '1 hour' : '1 day';

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Sites list
      if (sites.length === 0) {
        const s = await apiGet<any[]>('/sites');
        const list = Array.isArray(s) ? s : (s && Array.isArray((s as any).items) ? (s as any).items : []);
        setSites(list);
        if (!leftSite && list.length) setLeftSite(list[0].site_code);
        if (!rightSite && list.length > 1) setRightSite(list[1].site_code);
      }
      const fetchSide = async (site: string) => {
        if (!site) return { summary:null, temp:[], ingest:[], breakdown:[] };
        const summary = await apiGet<any>(`/sites/summary?site_code=${encodeURIComponent(site)}&hours=${hours}&use_cagg=true`);
        const tempResp = await apiGet<any[]>(`/reports/temperature-series?site_code=${encodeURIComponent(site)}&hours=${hours}&bucket=${encodeURIComponent(bucket)}&use_cagg=true`);
        const ingestResp = await apiGet<any[]>(`/reports/ingestion-series?site_code=${encodeURIComponent(site)}&hours=${hours}&bucket=${encodeURIComponent(bucket)}&use_cagg=true`);
        const breakdownResp = await apiGet<any[]>(`/sites/equipment-breakdown?site_code=${encodeURIComponent(site)}`);
        const time_range = ({24:'24h',72:'3d',168:'7d',720:'30d'} as any)[hours] || '24h';
        const faultsResp = await apiGet<any[]>(`/enhanced-faults?site_code=${encodeURIComponent(site)}&time_range=${time_range}&limit=50`);
        const temp = Array.isArray(tempResp) ? tempResp : [];
        const ingest = Array.isArray(ingestResp) ? ingestResp : [];
        const breakdown = Array.isArray(breakdownResp) ? breakdownResp : [];
        const faults = Array.isArray(faultsResp) ? faultsResp : [];
        return { summary, temp, ingest, breakdown, faults };
      };
      const [L, R] = await Promise.all([fetchSide(leftSite), fetchSide(rightSite)]);
      setLeftSummary(L.summary); setRightSummary(R.summary);
      setLeftTemp(L.temp); setRightTemp(R.temp);
      setLeftIngest(L.ingest); setRightIngest(R.ingest);
      setLeftBreakdown(L.breakdown); setRightBreakdown(R.breakdown);
      setLeftFaults(L.faults || []); setRightFaults(R.faults || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [leftSite, rightSite, period]);

  const KPI = ({ title, value }: { title: string; value: any }) => (
    <Box textAlign="center" p={1}>
      <Typography variant="h5">{value ?? '-'}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </Box>
  );

  const COLORS = ['#1976d2','#d32f2f','#388e3c','#f57c00','#7b1fa2','#0097a7'];

  const exportCSV = (filename: string, header: string[], rows: (string|number|null)[][]) => {
    try {
      const esc = (v:any)=>{ if(v===null||v===undefined) return ''; const s=String(v); return /[",\n]/.test(s)? '"'+s.replace(/"/g,'""')+'"': s; };
      const content = '\ufeff' + [header.join(','), ...rows.map(r=>r.map(esc).join(','))].join('\n');
      const blob = new Blob([content], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">ECC800 Dashboard - Sites (DC vs DR)</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>ช่วงเวลา</InputLabel>
            <Select value={period} label="ช่วงเวลา" onChange={(e)=>setPeriod(e.target.value)}>
              <MenuItem value="24h">24 ชม.</MenuItem>
              <MenuItem value="3d">3 วัน</MenuItem>
              <MenuItem value="7d">7 วัน</MenuItem>
              <MenuItem value="30d">30 วัน</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAll} disabled={loading}>Refresh</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={()=>{ /* TODO: export all */ }}>Export</Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Site Selectors */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6">DC (ซ้าย)</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>เลือกไซต์ (DC)</InputLabel>
                <Select value={leftSite} label="เลือกไซต์ (DC)" onChange={(e)=>setLeftSite(e.target.value)}>
                  {(Array.isArray(sites)?sites:[]).map(s=> (<MenuItem key={s.site_code} value={s.site_code}>{s.site_code}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            {/* KPIs */}
            <Grid container spacing={1}>
              <Grid item xs={4}><KPI title="Devices" value={leftSummary?.devices}/></Grid>
              <Grid item xs={4}><KPI title="Metrics" value={leftSummary?.metrics}/></Grid>
              <Grid item xs={4}><KPI title="Datapoints" value={leftSummary?.datapoints?.toLocaleString()}/></Grid>
              <Grid item xs={4}><KPI title="Faults" value={leftSummary?.faults}/></Grid>
              <Grid item xs={4}><KPI title="Success Rate" value={`${leftSummary?.success_rate ?? 0}%`}/></Grid>
              <Grid item xs={4}><KPI title="Health Score" value={<Chip label={leftSummary?.health_score ?? 0} color={(leftSummary?.health_score ?? 0)>80?'success':(leftSummary?.health_score ?? 0)>60?'warning':'default'}/>} /></Grid>
            </Grid>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6">DR (ขวา)</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>เลือกไซต์ (DR)</InputLabel>
                <Select value={rightSite} label="เลือกไซต์ (DR)" onChange={(e)=>setRightSite(e.target.value)}>
                  {(Array.isArray(sites)?sites:[]).map(s=> (<MenuItem key={s.site_code} value={s.site_code}>{s.site_code}</MenuItem>))}
                </Select>
              </FormControl>
            </Box>
            <Grid container spacing={1}>
              <Grid item xs={4}><KPI title="Devices" value={rightSummary?.devices}/></Grid>
              <Grid item xs={4}><KPI title="Metrics" value={rightSummary?.metrics}/></Grid>
              <Grid item xs={4}><KPI title="Datapoints" value={rightSummary?.datapoints?.toLocaleString()}/></Grid>
              <Grid item xs={4}><KPI title="Faults" value={rightSummary?.faults}/></Grid>
              <Grid item xs={4}><KPI title="Success Rate" value={`${rightSummary?.success_rate ?? 0}%`}/></Grid>
              <Grid item xs={4}><KPI title="Health Score" value={<Chip label={rightSummary?.health_score ?? 0} color={(rightSummary?.health_score ?? 0)>80?'success':(rightSummary?.health_score ?? 0)>60?'warning':'default'}/>} /></Grid>
            </Grid>
          </CardContent></Card>
        </Grid>

        {/* Trending: Temperature */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Temp / Humidity (DC)</Typography>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leftTemp}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtX as any}/>
                  <YAxis />
                  <Tooltip labelFormatter={fmtTooltip as any}/>
                  <Line type="monotone" dataKey="avg_temperature" stroke="#1976d2" name="Temp Avg" dot={false}/>
                  <Line type="monotone" dataKey="max_temperature" stroke="#d32f2f" name="Temp Max" dot={false}/>
                  <Line type="monotone" dataKey="min_temperature" stroke="#388e3c" name="Temp Min" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Temp / Humidity (DR)</Typography>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rightTemp}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtX as any}/>
                  <YAxis />
                  <Tooltip labelFormatter={fmtTooltip as any}/>
                  <Line type="monotone" dataKey="avg_temperature" stroke="#1976d2" name="Temp Avg" dot={false}/>
                  <Line type="monotone" dataKey="max_temperature" stroke="#d32f2f" name="Temp Max" dot={false}/>
                  <Line type="monotone" dataKey="min_temperature" stroke="#388e3c" name="Temp Min" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Ingestion Rate */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Ingestion (DC)</Typography>
            <Box height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leftIngest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtX as any}/>
                  <YAxis />
                  <Tooltip labelFormatter={fmtTooltip as any}/>
                  <Line type="monotone" dataKey="value" stroke="#7b1fa2" name="records" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Ingestion (DR)</Typography>
            <Box height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rightIngest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={fmtX as any}/>
                  <YAxis />
                  <Tooltip labelFormatter={fmtTooltip as any}/>
                  <Line type="monotone" dataKey="value" stroke="#7b1fa2" name="records" dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Equipment Breakdown */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Equipment Breakdown (DC)</Typography>
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button size="small" startIcon={<Download />} onClick={()=>{
                exportCSV('dc_equipment_breakdown.csv', ['type','count'], leftBreakdown.map((r:any)=>[r.type,r.count]));
              }}>Export</Button>
            </Box>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="count" data={Array.isArray(leftBreakdown)?leftBreakdown:[]} nameKey="type" outerRadius={90} label>
                    {(Array.isArray(leftBreakdown)?leftBreakdown:[]).map((_, i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Equipment Breakdown (DR)</Typography>
            <Box display="flex" justifyContent="flex-end" mb={1}>
              <Button size="small" startIcon={<Download />} onClick={()=>{
                exportCSV('dr_equipment_breakdown.csv', ['type','count'], rightBreakdown.map((r:any)=>[r.type,r.count]));
              }}>Export</Button>
            </Box>
            <Box height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="count" data={Array.isArray(rightBreakdown)?rightBreakdown:[]} nameKey="type" outerRadius={90} label>
                    {(Array.isArray(rightBreakdown)?rightBreakdown:[]).map((_, i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Fault Timeline Table */}
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Fault Timeline (DC)</Typography>
              <Button size="small" startIcon={<Download />} onClick={()=>{
                exportCSV('dc_faults.csv', ['time','equipment','type','severity','value','unit'], (leftFaults||[]).map((f:any)=>[
                  f.timestamp ? new Date(f.timestamp).toLocaleString('th-TH') : '', f.equipment_name||f.equipment_id, f.fault_type, f.severity, f.value, f.unit
                ]));
              }}>Export</Button>
            </Box>
            <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
              {(leftFaults||[]).slice(0,50).map((f:any, i:number)=> (
                <Box key={i} display="grid" gridTemplateColumns="140px 1fr 1fr 90px 1fr" gap={1} py={0.5} borderBottom="1px solid rgba(0,0,0,0.06)">
                  <Box>{f.timestamp ? new Date(f.timestamp).toLocaleString('th-TH') : '-'}</Box>
                  <Box>{f.equipment_name || f.equipment_id}</Box>
                  <Box>{f.fault_type}</Box>
                  <Box><Chip label={f.severity} color={f.severity==='critical'?'error':f.severity==='warning'?'warning':'default'} size="small" /></Box>
                  <Box>{f.value} {f.unit}</Box>
                </Box>
              ))}
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">Fault Timeline (DR)</Typography>
              <Button size="small" startIcon={<Download />} onClick={()=>{
                exportCSV('dr_faults.csv', ['time','equipment','type','severity','value','unit'], (rightFaults||[]).map((f:any)=>[
                  f.timestamp ? new Date(f.timestamp).toLocaleString('th-TH') : '', f.equipment_name||f.equipment_id, f.fault_type, f.severity, f.value, f.unit
                ]));
              }}>Export</Button>
            </Box>
            <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
              {(rightFaults||[]).slice(0,50).map((f:any, i:number)=> (
                <Box key={i} display="grid" gridTemplateColumns="140px 1fr 1fr 90px 1fr" gap={1} py={0.5} borderBottom="1px solid rgba(0,0,0,0.06)">
                  <Box>{f.timestamp ? new Date(f.timestamp).toLocaleString('th-TH') : '-'}</Box>
                  <Box>{f.equipment_name || f.equipment_id}</Box>
                  <Box>{f.fault_type}</Box>
                  <Box><Chip label={f.severity} color={f.severity==='critical'?'error':f.severity==='warning'?'warning':'default'} size="small" /></Box>
                  <Box>{f.value} {f.unit}</Box>
                </Box>
              ))}
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SitesPage;
