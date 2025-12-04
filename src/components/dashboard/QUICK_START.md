# Dashboard Components - Quick Start Guide

## Overview

This directory contains the Impact Monitoring Dashboard components for the #GangGreen platform. These components provide comprehensive visualization and reporting of conservation efforts across Kenya's three pilot forests.

## Components

### 1. ImpactOverview
Displays key metrics in a card-based layout.

```tsx
import { ImpactOverview } from './components/dashboard';

<ImpactOverview 
  forest="all"           // 'kakamega' | 'karura' | 'mau' | 'all'
  periodStart="2024-01-01"  // Optional: ISO date string
  periodEnd="2024-12-31"    // Optional: ISO date string
  className="my-4"          // Optional: additional CSS classes
/>
```

**Features**:
- Trees planted with CO₂ sequestration
- Waste collected
- Communities activated
- Area restored
- Auto-refresh functionality
- Loading and error states

### 2. ImpactChart
Line chart showing trends over time.

```tsx
import { ImpactChart } from './components/dashboard';

<ImpactChart 
  forest="kakamega"  // 'kakamega' | 'karura' | 'mau' | 'all'
  days={30}          // Number of days to display (default: 30)
  className="my-4"   // Optional: additional CSS classes
/>
```

**Features**:
- Cumulative trends for trees, carbon, and participants
- Metric filtering (all, trees only, carbon only, participants only)
- Interactive tooltips
- Responsive design
- Summary statistics

### 3. RegionalMap
Interactive map showing geographic distribution.

```tsx
import { RegionalMap } from './components/dashboard';

<RegionalMap 
  className="my-4"  // Optional: additional CSS classes
/>
```

**Features**:
- Interactive Leaflet map
- Forest markers with custom icons
- Circle overlays scaled by impact
- Detailed popups with statistics
- Color-coded legend
- Click to highlight forests

### 4. ImpactReport
Report generator with multiple export formats.

```tsx
import { ImpactReport } from './components/dashboard';

<ImpactReport 
  className="my-4"  // Optional: additional CSS classes
/>
```

**Features**:
- PDF, CSV, and JSON export formats
- Custom date range selection
- Forest filtering
- Comprehensive report data
- Download functionality

## Complete Example

```tsx
import React, { useState } from 'react';
import { 
  ImpactOverview, 
  ImpactChart, 
  RegionalMap, 
  ImpactReport 
} from './components/dashboard';

export const DashboardPage: React.FC = () => {
  const [forest, setForest] = useState<'all' | 'kakamega' | 'karura' | 'mau'>('all');

  return (
    <div className="space-y-8">
      {/* Forest Filter */}
      <select 
        value={forest} 
        onChange={(e) => setForest(e.target.value as any)}
      >
        <option value="all">All Forests</option>
        <option value="kakamega">Kakamega</option>
        <option value="karura">Karura</option>
        <option value="mau">Mau</option>
      </select>

      {/* Overview */}
      <ImpactOverview forest={forest} />

      {/* Trends */}
      <ImpactChart forest={forest} days={30} />

      {/* Map */}
      <RegionalMap />

      {/* Reports */}
      <ImpactReport />
    </div>
  );
};
```

## Dashboard Service

All components use the centralized `dashboardService`:

```typescript
import { dashboardService } from '../../services/dashboard.service';

// Get metrics
const metrics = await dashboardService.getImpactMetrics('all');

// Get forest stats
const stats = await dashboardService.getForestStats();

// Get trend data
const trends = await dashboardService.getTrendData('kakamega', 30);

// Generate report
const reportData = await dashboardService.generateReportData('all');
```

## Styling

All components use Tailwind CSS and follow the platform's design system:

- **Primary Color**: Green (#10b981)
- **Secondary Colors**: Blue (#3b82f6), Purple (#8b5cf6), Amber (#f59e0b)
- **Gray Scale**: Tailwind's default gray palette
- **Shadows**: Tailwind's shadow utilities
- **Rounded Corners**: 8px (rounded-lg)

## Dependencies

Required packages:
- `react` and `react-dom`
- `recharts` (for charts)
- `leaflet` and `react-leaflet` (for maps)
- `leaflet/dist/leaflet.css` (must be imported)

## Error Handling

All components include:
- Loading states with skeleton UI
- Error states with retry buttons
- Graceful fallbacks for missing data
- Console logging for debugging

## Performance

Optimizations included:
- Efficient database queries
- Cumulative calculations
- Responsive chart rendering
- Lazy map tile loading
- Async report generation

## Testing

To test components:

```bash
# Run development server
npm run dev

# Navigate to dashboard
# http://localhost:5173/track3-dashboard

# Test each tab:
# - Overview: Check metrics display
# - Trends: Check chart rendering
# - Map: Check map interactions
# - Reports: Generate each format
```

## Common Issues

### Map Not Displaying
- Ensure Leaflet CSS is imported
- Check browser console for errors
- Verify coordinates are valid

### Charts Not Rendering
- Verify Recharts is installed
- Check data format matches expected structure
- Ensure container has height

### Reports Not Generating
- Check browser popup settings (for PDF)
- Verify data exists for selected period
- Try different format (CSV/JSON)

## Next Steps

1. Review [full documentation](../../../docs/IMPACT_MONITORING_DASHBOARD.md)
2. Check [component README](./README.md)
3. Explore [dashboard service](../../services/dashboard.service.ts)
4. See [Track3DashboardPage](../../pages/Track3DashboardPage.tsx) for integration example

---

**Quick Links**:
- [Task Completion Summary](../../../docs/TASK_18_COMPLETION_SUMMARY.md)
- [Technical Guide](../../../docs/TECHNICAL_GUIDE.md)
- [Component Index](./index.ts)
