# Dashboard Components

This directory contains components for the Impact Monitoring Dashboard, which displays real-time metrics on conservation efforts across Kenya's forests.

## Components

### ImpactOverview
Displays key metrics including:
- Trees planted with CO₂ sequestration
- Waste collected from cleanup initiatives
- Communities activated and total participants
- Area restored across forests

**Requirements:** A10.1

**Usage:**
```tsx
import { ImpactOverview } from '@/components/dashboard';

<ImpactOverview 
  forest="all" 
  periodStart="2024-01-01"
  periodEnd="2024-12-31"
/>
```

### ImpactChart
Visualizes trends over time using line charts:
- Trees planted over time
- Carbon sequestered trends
- Participant growth
- Supports filtering by metric type

**Requirements:** A10.3

**Usage:**
```tsx
import { ImpactChart } from '@/components/dashboard';

<ImpactChart 
  forest="kakamega" 
  days={30}
/>
```

### RegionalMap
Shows geographic distribution of impact:
- Interactive map with forest markers
- Circle overlays showing impact area
- Detailed popups with forest statistics
- Color-coded legend

**Requirements:** A10.3

**Usage:**
```tsx
import { RegionalMap } from '@/components/dashboard';

<RegionalMap />
```

### ImpactReport
Generates detailed reports for stakeholders:
- PDF format (printable HTML)
- CSV format (data export)
- JSON format (API integration)
- Includes metrics, trends, and evidence

**Requirements:** A10.4

**Usage:**
```tsx
import { ImpactReport } from '@/components/dashboard';

<ImpactReport />
```

## Data Flow

All components use the `dashboardService` to fetch data:

```
Component → dashboardService → Supabase → Database
```

The service provides:
- `getImpactMetrics()` - Aggregated metrics
- `getForestStats()` - Forest-specific data
- `getTrendData()` - Time-series data
- `getActivityFeed()` - Recent activities
- `generateReportData()` - Complete report data

## Features

### Real-time Updates
- Components automatically refresh data
- Manual refresh buttons available
- Loading states with skeletons
- Error handling with retry

### Responsive Design
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly interactions
- Print-optimized reports

### Accessibility
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Color contrast compliance

## Dependencies

- **recharts**: Chart visualization
- **react-leaflet**: Map components
- **leaflet**: Mapping library
- **tailwindcss**: Styling

## Testing

Components should be tested for:
- Data loading and error states
- User interactions (filters, buttons)
- Report generation in all formats
- Responsive behavior
- Accessibility compliance

## Future Enhancements

- Real-time data streaming
- Advanced filtering options
- Custom date range presets
- Export to more formats (Excel, PowerPoint)
- Email report delivery
- Scheduled report generation
- Comparison views (year-over-year)
- Predictive analytics
