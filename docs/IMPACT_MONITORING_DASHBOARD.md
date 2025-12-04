# Impact Monitoring Dashboard - User Guide

## Overview

The Impact Monitoring Dashboard provides comprehensive, real-time visibility into conservation efforts across Kenya's three pilot forests: Kakamega, Karura, and Mau. This dashboard is designed for stakeholders to track key metrics, visualize trends, and generate detailed reports.

## Accessing the Dashboard

Navigate to `/track3-dashboard` to access the Impact Monitoring Dashboard.

## Features

### 1. Impact Overview

**Purpose**: Display key metrics at a glance

**Metrics Displayed**:
- **Trees Planted**: Total number of trees planted with CO₂ sequestration estimate
- **Waste Collected**: Total waste collected in kilograms
- **Communities Activated**: Number of active communities participating
- **Area Restored**: Total area restored in hectares

**Filtering Options**:
- Filter by forest (All, Kakamega, Karura, Mau)
- Filter by date range (custom period selection)

**Usage**:
```tsx
import { ImpactOverview } from '../components/dashboard';

<ImpactOverview 
  forest="all" 
  periodStart="2024-01-01"
  periodEnd="2024-12-31"
/>
```

### 2. Impact Trends Chart

**Purpose**: Visualize trends over time

**Metrics Tracked**:
- Trees planted (cumulative)
- Carbon sequestered (cumulative, in tons)
- Participants (cumulative)

**Features**:
- Configurable time periods (30, 90 days)
- Metric selection (view all or individual metrics)
- Interactive tooltips with detailed data
- Responsive chart design

**Usage**:
```tsx
import { ImpactChart } from '../components/dashboard';

<ImpactChart 
  forest="kakamega" 
  days={30}
/>
```

### 3. Regional Map

**Purpose**: Show geographic distribution of impact

**Features**:
- Interactive map with forest locations
- Circle overlays showing impact area (scaled by trees planted)
- Detailed popup information for each forest
- Color-coded markers and legend
- Click to select/highlight specific forests

**Forest Locations**:
- **Kakamega Forest**: 0.2827°N, 34.8756°E (Green)
- **Karura Forest**: -1.2508°S, 36.8333°E (Blue)
- **Mau Forest**: -0.4500°S, 35.6833°E (Purple)

**Usage**:
```tsx
import { RegionalMap } from '../components/dashboard';

<RegionalMap />
```

### 4. Impact Report Generator

**Purpose**: Generate detailed reports for stakeholders

**Report Formats**:
1. **PDF**: Printable format for presentations and meetings
2. **CSV**: Data format for analysis in Excel or other tools
3. **JSON**: Machine-readable format for API integration

**Report Contents**:
- Key impact metrics summary
- Forest-by-forest breakdown
- Trend data over time
- Recent activities with evidence
- Verification details

**Usage**:
```tsx
import { ImpactReport } from '../components/dashboard';

<ImpactReport />
```

## Dashboard Service API

### Methods

#### `getImpactMetrics(forest, periodStart, periodEnd)`
Fetches aggregated impact metrics for a specific forest and time period.

**Parameters**:
- `forest`: 'kakamega' | 'karura' | 'mau' | 'all'
- `periodStart`: ISO date string (optional)
- `periodEnd`: ISO date string (optional)

**Returns**: `ImpactMetrics` object

#### `getForestStats()`
Fetches statistics for all three forests.

**Returns**: Array of `ForestStats` objects

#### `getTrendData(forest, days)`
Fetches time-series data for visualization.

**Parameters**:
- `forest`: 'kakamega' | 'karura' | 'mau' | 'all'
- `days`: number of days to fetch (default: 30)

**Returns**: Array of `TrendData` objects

#### `getActivityFeed(limit)`
Fetches recent activities.

**Parameters**:
- `limit`: number of activities to fetch (default: 10)

**Returns**: Array of `ActivityFeedItem` objects

#### `generateReportData(forest, periodStart, periodEnd)`
Generates comprehensive report data.

**Parameters**:
- `forest`: 'kakamega' | 'karura' | 'mau' | 'all'
- `periodStart`: ISO date string (optional)
- `periodEnd`: ISO date string (optional)

**Returns**: Object with metrics, forestStats, trends, and activities

## Data Calculations

### Carbon Sequestration
- **Formula**: Trees Planted × 20kg CO₂/year ÷ 1000
- **Result**: Tons of CO₂ sequestered per year
- **Note**: Based on average tree sequestration rate

### Waste Collection
- **Current**: Calculated as 150kg per active initiative (placeholder)
- **Future**: Will integrate with actual mission completion data

### Communities Activated
- **Current**: Calculated as 1 community per 50 participants (placeholder)
- **Future**: Will integrate with actual community membership data

### Area Restored
- **Source**: Sum of area_hectares from all initiatives
- **Unit**: Hectares (ha)

## Best Practices

### For Stakeholders

1. **Regular Monitoring**: Check the dashboard weekly to track progress
2. **Report Generation**: Generate monthly reports for documentation
3. **Trend Analysis**: Use the trends chart to identify patterns
4. **Geographic Analysis**: Use the map to understand regional distribution

### For Developers

1. **Error Handling**: All components include error states with retry functionality
2. **Loading States**: Components show skeleton UI while loading
3. **Type Safety**: All data is properly typed with TypeScript interfaces
4. **Performance**: Components are optimized for responsive rendering

### For Administrators

1. **Data Verification**: Ensure all initiatives have accurate data
2. **Regular Updates**: Keep forest coordinates and metadata current
3. **Report Validation**: Review generated reports for accuracy
4. **User Feedback**: Collect feedback on dashboard usability

## Troubleshooting

### Issue: Metrics Not Loading

**Possible Causes**:
- Database connection issues
- Missing data in initiatives table
- Invalid date range

**Solutions**:
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure initiatives have required fields (trees_planted, area_hectares)
4. Try refreshing the page

### Issue: Map Not Displaying

**Possible Causes**:
- Leaflet CSS not loaded
- Invalid coordinates
- Browser compatibility

**Solutions**:
1. Verify Leaflet CSS is imported in index.html
2. Check forest coordinates in RegionalMap.tsx
3. Test in a different browser

### Issue: Report Generation Fails

**Possible Causes**:
- Missing data
- Invalid date range
- Browser popup blocker (for PDF)

**Solutions**:
1. Verify date range is valid
2. Check that data exists for selected period
3. Allow popups for PDF generation
4. Try a different report format (CSV or JSON)

## Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live metrics
2. **Advanced Filtering**: Filter by initiative type, organization, status
3. **Comparison Views**: Compare forests side-by-side
4. **Export Scheduling**: Schedule automated report generation
5. **Email Reports**: Send reports directly to stakeholders
6. **Mobile Optimization**: Enhanced mobile experience
7. **Custom Dashboards**: User-configurable dashboard layouts
8. **Predictive Analytics**: ML-based trend predictions

### Integration Roadmap

1. **Phase 1** (Current): Basic metrics and visualization
2. **Phase 2**: Integration with Missions system for accurate waste data
3. **Phase 3**: Integration with Community Hub for community tracking
4. **Phase 4**: Advanced analytics and predictions
5. **Phase 5**: Mobile app with offline support

## Support

For questions or issues with the Impact Monitoring Dashboard:

1. Check this documentation
2. Review the troubleshooting section
3. Check the browser console for errors
4. Contact the development team

## Related Documentation

- [Dashboard Service API](../src/services/dashboard.service.ts)
- [Component Documentation](../src/components/dashboard/README.md)
- [Track 3 Submission](../submission/TRACK_3_ALIGNMENT.md)
- [Technical Guide](./TECHNICAL_GUIDE.md)

---

**Last Updated**: November 29, 2025  
**Version**: 1.0  
**Status**: Production Ready
