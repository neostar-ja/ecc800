# ECC800 Electricity Cost Components - Integration Guide

## Quick Reference

This guide shows how to integrate the three electricity cost components into existing pages.

---

## Component 1: ElectricityRateManagement

**Type**: Admin Settings Component  
**Location**: `/frontend/src/components/ElectricityRateManagement.tsx`  
**Integration Target**: AdminPage

### How to Integrate

1. **Import the component** in AdminPage:
```typescript
import ElectricityRateManagement from '../components/ElectricityRateManagement';
```

2. **Add to JSX** (within admin sections):
```typescript
<Card>
  <CardHeader title="⚡ ตั้งค่าค่าไฟฟ้า (Electricity Rates)" />
  <CardContent>
    <ElectricityRateManagement />
  </CardContent>
</Card>
```

3. **Styling** (optional):
```typescript
<Box sx={{ 
  display: 'grid', 
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: 2,
  mb: 3 
}}>
  <ElectricityRateManagement />
</Box>
```

### Component Props
None required - all state management is internal

### Expected API Endpoints
- GET `/api/v1/sites` - Load data centers
- GET `/api/v1/electricity-cost/rates/datacenter/{dcId}` - Load rates
- POST/PUT/DELETE `/api/v1/electricity-cost/rates/*` - CRUD operations

### Tested Features
✅ Add rate  
✅ Edit rate  
✅ Delete rate  
✅ Effective date management  
✅ Active/Inactive toggle  
✅ Error handling  

---

## Component 2: ElectricityCostReport

**Type**: Reports Tab Component  
**Location**: `/frontend/src/pages/reports/ElectricityCostReport.tsx`  
**Integration Target**: ReportsPage (as a new tab or standalone page)

### How to Integrate

**Option A: Add as new tab in ReportsPage**

1. **Import the component**:
```typescript
import ElectricityCostReport from './ElectricityCostReport';
```

2. **Add Tab**:
```typescript
<Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
  <Tab label="Power Metrics" />
  <Tab label="Fault Analysis" />
  <Tab label="⚡ ค่าไฟฟ้า (Electricity)" />  {/* ADD THIS */}
</Tabs>
```

3. **Add Tab Content**:
```typescript
{tabValue === 2 && <ElectricityCostReport />}  {/* Adjust index as needed */}
```

**Option B: Standalone Reports Page**

1. **Create new file**: `/frontend/src/pages/reports/ElectricityPage.tsx`
```typescript
import ElectricityCostReport from './ElectricityCostReport';

export default function ElectricityPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={2}>⚡ ค่าไฟฟ้า</Typography>
      <ElectricityCostReport />
    </Box>
  );
}
```

### Component Props
None required - all state management is internal

### Expected API Endpoints
- GET `/api/v1/sites` - Load data centers
- GET `/api/v1/electricity-cost/costs/datacenter/{dcId}?year={year}` - Load costs

### Features Included
✅ Data Center selection  
✅ Year selection  
✅ Data table with monthly breakdown  
✅ Energy consumption chart (Bar)  
✅ Cost trend chart (Line)  
✅ Summary statistics (Total cost, energy, avg rate)  
✅ Thai locale formatting  
✅ Responsive layout  

### Data Table Columns
- เดือน (Month)
- พลังงาน (kWh)
- ค่าเฉลี่ย (Rate - Baht/kWh)
- ค่าไฟรวม (Total Cost - Baht)
- จำนวนวัน (Days)
- เฉลี่ยต่อวัน (Daily avg)
- สถานะ (Status)

---

## Component 3: ElectricityCostCard

**Type**: Dashboard Card Component  
**Location**: `/frontend/src/components/ElectricityCostCard.tsx`  
**Integration Target**: DashboardPage (above PUE Card)

### How to Integrate

1. **Import the component**:
```typescript
import ElectricityCostCard from '../components/ElectricityCostCard';
```

2. **Find the dashboard grid** (in DashboardPage):
```typescript
<Grid container spacing={2}>
  {/* ADD ELECTRICITY CARD HERE (BEFORE PUE) */}
  {dataCenters.map(dc => (
    <Grid item xs={12} sm={6} md={4} key={dc.id}>
      <ElectricityCostCard 
        dataCenterId={dc.id}
        dataCenterName={dc.name}
        siteCode={dc.site_code}
      />
    </Grid>
  ))}
  
  {/* EXISTING PUE CARD */}
  {dataCenters.map(dc => (
    <Grid item xs={12} sm={6} md={4} key={`pue-${dc.id}`}>
      <PUECard dataCenterId={dc.id} />
    </Grid>
  ))}
</Grid>
```

### Component Props
```typescript
interface ElectricityCostCardProps {
  dataCenterId: number;      // Required
  dataCenterName: string;    // Required (for display)
  siteCode: string;          // Required (DC or DR)
}
```

### Example Usage
```typescript
<ElectricityCostCard 
  dataCenterId={1}
  dataCenterName="Central Data Center"
  siteCode="DC"
/>
```

### Expected API Endpoints
- GET `/api/v1/electricity-cost/costs/summary/{dataCenterId}` - Get summary data

### Features Included
✅ Current month cost display (฿)  
✅ Current month energy (kWh)  
✅ Previous month comparison  
✅ Percentage change indicator  
✅ Trending icon (up/down)  
✅ Refresh button  
✅ Detail dialog  
✅ Loading skeleton  
✅ Error handling  

### Design Details
- **Background**: Gradient purple (#667eea to #764ba2)
- **Icon Color**: Red for increases, Green for decreases
- **Format**: Thai locale number formatting
- **Typography**: MUI theme variants (h5, body2, caption)

---

## Integration Checklist

### Before Integration
- [ ] All three components created ✅
- [ ] TypeScript compilation successful ✅
- [ ] Docker build complete
- [ ] Backend running with migrations applied
- [ ] Database populated with rates ✅

### During Integration
- [ ] Import statements added
- [ ] Components placed in correct JSX location
- [ ] Props passed correctly
- [ ] Grid/Layout adjusted as needed
- [ ] Styling matches existing theme

### After Integration
- [ ] No console errors
- [ ] Components render without crashes
- [ ] Data loads from API
- [ ] User interactions work (click, select, etc.)
- [ ] Responsive layout works on mobile
- [ ] Thai locale displays correctly
- [ ] Charts render (if applicable)

---

## File Locations Reference

| Component | File Path | Target Page |
|-----------|-----------|-------------|
| ElectricityRateManagement | `/frontend/src/components/ElectricityRateManagement.tsx` | AdminPage |
| ElectricityCostReport | `/frontend/src/pages/reports/ElectricityCostReport.tsx` | ReportsPage |
| ElectricityCostCard | `/frontend/src/components/ElectricityCostCard.tsx` | DashboardPage |

---

## Testing Checklist

### Component 1: ElectricityRateManagement
- [ ] Opens without errors
- [ ] Data Center dropdown loads
- [ ] Can add new rate
- [ ] Can edit existing rate
- [ ] Can delete rate
- [ ] Date picker works
- [ ] Toggle switch works
- [ ] Validation errors display

### Component 2: ElectricityCostReport
- [ ] Opens without errors
- [ ] Data Center dropdown loads
- [ ] Year dropdown works
- [ ] Data table displays
- [ ] Energy chart renders
- [ ] Cost chart renders
- [ ] Summary statistics calculate
- [ ] Thai month names display

### Component 3: ElectricityCostCard
- [ ] Opens without errors
- [ ] Loads cost data
- [ ] Displays current month cost
- [ ] Calculates percentage change
- [ ] Trending icon correct
- [ ] Refresh button works
- [ ] Detail dialog opens
- [ ] Responsive on mobile

---

## Common Integration Issues & Solutions

### Issue 1: Component not found
```
❌ Error: Cannot find module '../components/ElectricityRateManagement'
✅ Solution: Check file path, verify component file exists
```

### Issue 2: API returns 404
```
❌ Error: GET /api/v1/electricity-cost/rates 404
✅ Solution: Check backend router registered in main.py
```

### Issue 3: Chart not rendering
```
❌ Error: Recharts not found
✅ Solution: Ensure recharts package installed: npm install recharts
```

### Issue 4: Types mismatching
```
❌ Error: Type 'string' not assignable to type 'number'
✅ Solution: Verify prop types match interface definitions
```

### Issue 5: Styling looks wrong
```
❌ Component looks ugly or misaligned
✅ Solution: Verify MUI theme provider is wrapping app
```

---

## Deployment Verification

After integrating all components, verify:

1. **Admin Settings Works**:
   ```
   GET https://10.251.150.222:3344/ecc800/admin
   → Should see "⚡ ตั้งค่าค่าไฟฟ้า" section
   → Can add/edit/delete rates
   ```

2. **Reports Works**:
   ```
   GET https://10.251.150.222:3344/ecc800/reports
   → Should see electricity tab
   → Can select DC and year
   → Charts render
   ```

3. **Dashboard Works**:
   ```
   GET https://10.251.150.222:3344/ecc800/dashboard
   → Should see electricity card above PUE
   → Shows current cost and energy
   → Displays comparison to last month
   ```

---

## Support Commands

### Check API Endpoints
```bash
# Check if routes are registered
curl http://localhost:8010/api/v1/docs

# Check specific endpoint
curl http://localhost:8010/api/v1/electricity-cost/rates/datacenter/1
```

### Check Database
```bash
# Connect to database
psql -h 10.251.150.222 -p 5210 -U apirak -d ecc800

# Check tables exist
\dt electricity*

# Check data
SELECT * FROM electricity_rates;
SELECT * FROM electricity_costs;
```

### Check Logs
```bash
# Backend logs
docker logs ecc800-backend

# Frontend build
cd frontend && npm run build
```

---

## Questions?

Refer to:
1. `ELECTRICITY_COST_IMPLEMENTATION.md` - Detailed implementation guide
2. `docs/ELECTRICITY_COST_FEATURE.md` - Feature documentation
3. API Swagger docs: `/api/v1/docs` - Interactive API testing
