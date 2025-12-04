# Digital Tree Wallet Components

This directory contains components for the Digital Tree Wallet feature, which allows users to track their planted trees and environmental impact.

## Requirements

Implements requirements from V1.0 Major Release:
- **A8.1**: Tree planting creates wallet entry
- **A8.2**: Display total trees planted, estimated CO₂ sequestered, and tree health status
- **A8.3**: Update growth data and health metrics from AI monitoring (Antugrow integration)
- **A8.4**: Show photos, location on map, and growth timeline
- **A8.5**: Generate shareable social media content with impact statistics

## Components

### TreeWallet
Main dashboard component displaying user's tree wallet with impact metrics.

**Features:**
- Total trees planted counter
- CO₂ sequestration metrics
- Health status overview
- Species diversity tracking
- Grid and map view toggle
- Social sharing

**Usage:**
```tsx
import { TreeWallet } from '@/components/trees';

<TreeWallet />
```

### TreeCard
Individual tree card displaying tree details, growth data, and health status.

**Props:**
- `tree: PlantedTree` - Tree data
- `photos?: TreePhoto[]` - Tree photos
- `onViewDetails?: (treeId: string) => void` - Details click handler

**Features:**
- Tree species and location
- Health status badge
- Growth metrics (height, diameter)
- CO₂ sequestration
- Photo gallery indicator
- View details button

**Usage:**
```tsx
import { TreeCard } from '@/components/trees';

<TreeCard
  tree={tree}
  photos={photos}
  onViewDetails={(id) => navigate(`/trees/${id}`)}
/>
```

### TreeMap
Geographic visualization of planted trees using Leaflet.

**Props:**
- `trees: PlantedTree[]` - Array of trees to display
- `selectedTreeId?: string` - Currently selected tree
- `onTreeSelect?: (treeId: string) => void` - Tree selection handler
- `height?: string` - Map height (default: '500px')

**Features:**
- Interactive map with tree markers
- Color-coded health status
- Tree info popups
- Auto-fit bounds
- Health legend

**Usage:**
```tsx
import { TreeMap } from '@/components/trees';

<TreeMap
  trees={trees}
  onTreeSelect={(id) => setSelectedTree(id)}
  height="600px"
/>
```

### CO2Calculator
Interactive calculator for estimating tree CO₂ sequestration.

**Features:**
- Species selection
- Planted date input
- Optional height/diameter measurements
- Real-time calculation
- Educational information
- Context about impact

**Usage:**
```tsx
import { CO2Calculator } from '@/components/trees';

<CO2Calculator />
```

**Calculation Methodology:**
- Base rates by species category (fast/medium/slow growing)
- Age multipliers (peak at 10-20 years)
- Size factors from height and diameter
- Annual CO₂ sequestration in kg/year

### SocialShareButton
Social media sharing button for tree impact.

**Props:**
- `userName: string` - User's name
- `totalTrees: number` - Total trees planted
- `totalCO2: number` - Total CO₂ sequestered
- `treeId?: string` - Specific tree ID (optional)
- `variant?: 'button' | 'icon'` - Display variant

**Features:**
- Share on Twitter, Facebook, LinkedIn
- Native share API support
- Copy link functionality
- Pre-formatted share text with hashtags
- Impact preview

**Usage:**
```tsx
import { SocialShareButton } from '@/components/trees';

<SocialShareButton
  userName="John Doe"
  totalTrees={25}
  totalCO2={375}
  variant="button"
/>
```

## Services

### treeWalletService
Service for managing tree wallet operations.

**Methods:**
- `getUserTreeWallet(userId)` - Get user's tree wallet
- `getTreeDetails(treeId)` - Get detailed tree info with photos
- `calculateCO2Sequestration(species, plantedDate, height, diameter)` - Calculate CO₂
- `getWalletStatistics(userId)` - Get wallet statistics
- `generateShareableContent(userName, totalTrees, totalCO2)` - Generate share content
- `syncTreeWithAntugrow(treeId)` - Sync growth data from Antugrow
- `syncAllTreesWithAntugrow(userId)` - Sync all user's trees
- `analyzeTreeImage(treeId, imageUrl)` - Analyze tree image with AI

## Database Schema

### planted_trees (from platform.types.ts)
```typescript
interface PlantedTree {
  id: string;
  userId: string;
  species: string;
  plantedDate: Date;
  location: { name: string; coordinates: [number, number] };
  healthStatus: 'healthy' | 'needs_attention' | 'deceased';
  growthData: {
    height: number;
    diameter: number;
    lastMeasured: Date;
  };
  estimatedCO2: number; // kg per year
  createdAt: Date;
}
```

### tree_photos
```typescript
interface TreePhoto {
  id: string;
  treeId: string;
  photoUrl: string;
  capturedAt: Date;
}
```

## Integration

### Antugrow API
The tree wallet integrates with Antugrow's AI-powered tree monitoring:

- **Tree Registration**: Automatically registers trees with Antugrow on creation
- **Growth Tracking**: Syncs height, diameter, and health data
- **Image Analysis**: AI analysis of tree photos for health assessment
- **Recommendations**: Receives care recommendations based on AI analysis

### Existing Tree Service
Extends the existing `tree.service.ts` with wallet-specific functionality:
- Converts `Tree` type to `PlantedTree` format
- Adds CO₂ calculation logic
- Provides wallet-specific queries and statistics

## Styling

Components use Tailwind CSS with the following color scheme:
- **Primary**: Green (600-700) for healthy trees and actions
- **Warning**: Yellow (500-600) for trees needing attention
- **Neutral**: Gray (500-600) for deceased trees
- **Accent**: Emerald (500-600) for highlights

## Dependencies

- **react**: UI framework
- **react-leaflet**: Map visualization
- **leaflet**: Mapping library
- **lucide-react**: Icons
- **tailwindcss**: Styling

## Future Enhancements

- Real-time growth tracking with Antugrow webhooks
- Tree health alerts and notifications
- Gamification badges for tree milestones
- Tree adoption and gifting features
- Carbon credit marketplace integration
- Advanced analytics and insights
- Mobile app with offline support
- AR tree visualization
