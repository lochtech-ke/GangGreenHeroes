# Geometric Badges Developer Guide

## Quick Start

The GangGreen platform now features a beautiful low-poly geometric badge system inspired by nature. This guide will help you integrate and use these badges in your components.

## Installation

All geometric badge assets are already included in the project:
- Icons: `src/assets/badges/icons/*-geometric.svg`
- Generator: `src/utils/geometricBadgeGenerator.ts`
- Renderer: `src/utils/badgeIconRenderer.ts`

## Basic Usage

### 1. Display a Geometric Badge Icon

```tsx
import React from 'react';

const MyComponent = () => {
  return (
    <img 
      src="/src/assets/badges/icons/tree-planter-geometric.svg"
      alt="Tree Planter Badge"
      className="w-32 h-32"
    />
  );
};
```

### 2. Use the Badge Renderer

```tsx
import { renderIcon } from '../utils/badgeIconRenderer';
import { AchievementType } from '../types/badge.types';

const MyBadgeComponent = async () => {
  const achievementType: AchievementType = 'tree_planter';
  const iconSVG = await renderIcon(achievementType, 200, 200, {
    size: 120,
    color: '#FFFFFF',
  }, true); // true = use geometric icons
  
  return <div dangerouslySetInnerHTML={{ __html: iconSVG }} />;
};
```

### 3. Generate Programmatic Badges

```tsx
import { generateGeometricIcon, generateGeometricBadge } from '../utils/geometricBadgeGenerator';

// Generate just the icon
const iconSVG = generateGeometricIcon('tree_planter', 120);

// Generate complete badge with background
const badgeSVG = generateGeometricBadge('tree_planter', 'gold', 400);
```

## Available Achievement Types

```typescript
type AchievementType =
  | 'tree_planter'           // Geometric tree
  | 'carbon_warrior'         // Shield
  | 'water_guardian'         // Water droplet
  | 'biodiversity_champion'  // Butterfly
  | 'community_leader'       // People figures
  | 'climate_hero'           // Star
  | 'forest_protector'       // Forest of trees
  | 'green_ambassador'       // Leaf with sparkles
  | 'welcome_badge'          // Hummingbird
  | 'ganggreen_hero';        // Star (hero variant)
```

## Badge Tiers

```typescript
type BadgeTier = 
  | 'hummingbird'  // Entry level - Teal
  | 'bronze'       // Bronze metallic
  | 'silver'       // Silver metallic
  | 'gold'         // Gold metallic
  | 'platinum'     // Platinum metallic
  | 'diamond'      // Diamond sparkle
  | 'hero';        // Ultimate tier - Gold glow
```

## Styling Examples

### With Tier Background

```tsx
const getTierColors = (tier: BadgeTier) => {
  const colors = {
    gold: { bg: '#FFFBF0', border: '#FFD700', glow: 'rgba(255, 215, 0, 0.4)' },
    // ... other tiers
  };
  return colors[tier];
};

const BadgeCard = ({ achievement, tier }) => {
  const colors = getTierColors(tier);
  
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: colors.bg,
        border: `4px solid ${colors.border}`,
        boxShadow: `0 10px 40px ${colors.glow}`,
      }}
    >
      <img 
        src={`/src/assets/badges/icons/${achievement}-geometric.svg`}
        alt={`${achievement} badge`}
        className="w-48 h-48"
      />
    </div>
  );
};
```

### Animated Hover Effect

```tsx
const AnimatedBadge = ({ achievement }) => {
  return (
    <div className="group cursor-pointer">
      <img 
        src={`/src/assets/badges/icons/${achievement}-geometric.svg`}
        alt={`${achievement} badge`}
        className="w-32 h-32 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
      />
    </div>
  );
};
```

### Grid Layout

```tsx
const BadgeGrid = ({ badges }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {badges.map((badge) => (
        <div key={badge.id} className="bg-white rounded-lg shadow-md p-4">
          <img 
            src={`/src/assets/badges/icons/${badge.achievement}-geometric.svg`}
            alt={badge.name}
            className="w-full h-32 mb-2"
          />
          <p className="text-sm font-medium text-center">{badge.name}</p>
        </div>
      ))}
    </div>
  );
};
```

## Color Customization

### Programmatic Color Changes

```typescript
import { GEOMETRIC_CONFIGS } from '../utils/geometricBadgeGenerator';

// Get color palette for an achievement
const config = GEOMETRIC_CONFIGS['tree_planter'];
console.log(config.primaryColors); // ['#2E8B57', '#3CB371', '#90EE90', '#228B22']
console.log(config.accentColors);  // ['#8B4513', '#A0522D', '#CD853F']

// Use in your components
const TreeBadge = () => {
  const colors = GEOMETRIC_CONFIGS['tree_planter'].primaryColors;
  
  return (
    <div style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>
      {/* Your content */}
    </div>
  );
};
```

## Responsive Sizing

```tsx
const ResponsiveBadge = ({ achievement }) => {
  return (
    <img 
      src={`/src/assets/badges/icons/${achievement}-geometric.svg`}
      alt={`${achievement} badge`}
      className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-48 lg:h-48"
    />
  );
};
```

## Social Media Sharing

```tsx
const ShareableBadge = ({ achievement, tier }) => {
  const shareToTwitter = () => {
    const text = `I just earned the ${achievement} ${tier} badge on #GangGreen! 🌳`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  
  return (
    <div>
      <img 
        src={`/src/assets/badges/icons/${achievement}-geometric.svg`}
        alt={`${achievement} badge`}
        className="w-64 h-64"
      />
      <button onClick={shareToTwitter} className="mt-4 btn-primary">
        Share on Twitter
      </button>
    </div>
  );
};
```

## Accessibility

Always include proper alt text and ARIA labels:

```tsx
const AccessibleBadge = ({ achievement, tier, count }) => {
  return (
    <div role="img" aria-label={`${achievement} ${tier} tier badge, earned ${count} times`}>
      <img 
        src={`/src/assets/badges/icons/${achievement}-geometric.svg`}
        alt=""
        aria-hidden="true"
        className="w-32 h-32"
      />
      <span className="sr-only">
        {achievement} badge, {tier} tier, earned {count} times
      </span>
    </div>
  );
};
```

## Performance Tips

1. **Lazy Loading**: Use lazy loading for badge grids
```tsx
<img 
  src={iconPath}
  loading="lazy"
  alt={altText}
/>
```

2. **Preload Critical Badges**: Preload badges that appear above the fold
```tsx
<link rel="preload" as="image" href="/src/assets/badges/icons/tree-planter-geometric.svg" />
```

3. **SVG Sprites**: For multiple instances, consider using SVG sprites
```tsx
<svg className="hidden">
  <defs>
    <symbol id="tree-planter" viewBox="0 0 120 120">
      {/* SVG content */}
    </symbol>
  </defs>
</svg>

<svg className="w-32 h-32">
  <use href="#tree-planter" />
</svg>
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { BadgeComponent } from './BadgeComponent';

test('renders geometric badge with correct alt text', () => {
  render(<BadgeComponent achievement="tree_planter" tier="gold" />);
  const badge = screen.getByAltText(/tree planter/i);
  expect(badge).toBeInTheDocument();
});
```

## Preview Component

Use the built-in preview component to test badges:

```tsx
import { GeometricBadgePreview } from '../components/badges/GeometricBadgePreview';

const TestPage = () => {
  return <GeometricBadgePreview />;
};
```

## Resources

- Design Documentation: `src/assets/badges/GEOMETRIC_DESIGN.md`
- Icon Files: `src/assets/badges/icons/*-geometric.svg`
- Generator Utility: `src/utils/geometricBadgeGenerator.ts`
- Type Definitions: `src/types/badge.types.ts`

## Support

For questions or issues with the geometric badge system:
1. Check the design documentation
2. Review the preview component
3. Consult the type definitions
4. Open an issue on the project repository

---

**Happy Coding! 🌳**


## Badge Display Components (Task 9 - Completed)

### BadgeCard Component

Display individual badges with tier-specific styling and lazy loading:

```tsx
import { BadgeCard } from '../components/badges/BadgeCard';
import { BadgeConfig } from '../types/badge.types';

const MyComponent = () => {
  const badgeConfig: BadgeConfig = {
    id: 'badge-1',
    tier: 'gold',
    forest: 'kakamega',
    achievement: 'tree_planter',
    metadata: {
      badgeName: 'Tree Planter Gold',
      tierLevel: 4,
      forestName: 'Kakamega Forest',
      achievementType: 'tree_planter',
      achievementCount: 50,
      earnedDate: '2025-01-01T00:00:00Z',
      uniqueBadgeId: 'badge-123',
      userId: 'user-456',
    },
  };

  return (
    <BadgeCard
      config={badgeConfig}
      size={256}
      showMetadata={true}
      lazyLoad={true}
      onClick={() => console.log('Badge clicked!')}
    />
  );
};
```

**Compact Variant:**

```tsx
import { CompactBadgeCard } from '../components/badges/BadgeCard';

<CompactBadgeCard
  config={badgeConfig}
  size={120}
  showTierOnly={false}
/>
```

### BadgeGrid Component

Display multiple badges in a responsive grid with lazy loading:

```tsx
import { BadgeGrid } from '../components/badges/BadgeGrid';

const MyBadgeCollection = () => {
  const badges: BadgeConfig[] = [
    // ... your badge configs
  ];

  return (
    <BadgeGrid
      badges={badges}
      columns={{
        mobile: 1,
        tablet: 2,
        desktop: 3,
      }}
      badgeSize={200}
      showMetadata={true}
      onBadgeClick={(badge) => console.log('Clicked:', badge)}
      emptyMessage="No badges earned yet"
    />
  );
};
```

**Infinite Scroll Variant:**

```tsx
import { InfiniteScrollBadgeGrid } from '../components/badges/BadgeGrid';

<InfiniteScrollBadgeGrid
  badges={badges}
  hasMore={hasMoreBadges}
  onLoadMore={loadMoreBadges}
  loadingMore={isLoading}
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
/>
```

**Filterable Variant:**

```tsx
import { FilterableBadgeGrid } from '../components/badges/BadgeGrid';

<FilterableBadgeGrid
  badges={allBadges}
  filters={{
    tiers: ['gold', 'platinum'],
    achievements: ['tree_planter', 'carbon_warrior'],
  }}
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
/>
```

### GeometricBadgePreview Component

Interactive preview with export functionality:

```tsx
import { GeometricBadgePreview } from '../components/badges/GeometricBadgePreview';

const PreviewPage = () => {
  return <GeometricBadgePreview />;
};
```

**Features:**
- All 10 achievement types
- All 7 tier variations
- Export as SVG or PNG
- Copy badge information
- Badge details display
- Interactive achievement grid
- Tier comparison

### BadgeShowcase Page

Complete showcase with filters and multiple views:

```tsx
import { BadgeShowcase } from '../pages/BadgeShowcase';

// Use in your router
<Route path="/badges/showcase" element={<BadgeShowcase />} />
```

**Features:**
- Interactive Preview mode
- All Badges Grid mode
- Achievement type filters
- Tier filters
- Results count
- Responsive layout

## Lazy Loading

All badge components support lazy loading for optimal performance:

```tsx
import { ObservedBadge } from '../components/badges/LazyBadge';

<ObservedBadge
  config={badgeConfig}
  size={256}
  optimizeForMobile={true}
  rootMargin="100px"
  threshold={0.1}
/>
```

## Tier-Specific Styling

Each tier has unique styling:

- **Hummingbird**: Mint/teal gradient, teal border
- **Bronze**: Orange/amber gradient, orange border
- **Silver**: Gray/slate gradient, gray border
- **Gold**: Yellow/amber gradient, yellow border
- **Platinum**: Slate/zinc gradient, slate border
- **Diamond**: Cyan/blue gradient, cyan border
- **Hero**: Amber/yellow gradient, enhanced glow

## Performance Best Practices

1. **Use Lazy Loading**: Enable `lazyLoad={true}` for badge cards
2. **Optimize Grid Size**: Use appropriate `badgeSize` for your layout
3. **Use Compact Variant**: For dense grids, use `CompactBadgeCard`
4. **Configure Root Margin**: Adjust `rootMargin` for preloading
5. **Batch Operations**: Use `BadgeGrid` instead of individual cards

## Export Functionality

Export badges as SVG or PNG:

```tsx
// In GeometricBadgePreview component
// User can select format and click export button
// Files are downloaded with proper naming:
// - SVG: achievement-tier-badge.svg
// - PNG: achievement-tier-badge.png (1024x1024)
```

## Component Exports

All components are exported from the badges index:

```tsx
import {
  BadgeCard,
  CompactBadgeCard,
  BadgeGrid,
  InfiniteScrollBadgeGrid,
  FilterableBadgeGrid,
  GeometricBadgePreview,
  LazyBadge,
  ObservedBadge,
  BadgePlaceholder,
  BadgeGridPlaceholder,
} from '../components/badges';
```

## Migration from Classic Badges

All new components use geometric badges by default. No migration needed for new implementations.

For existing code:
1. Replace custom badge rendering with `BadgeCard`
2. Replace custom grids with `BadgeGrid`
3. Enable lazy loading for performance
4. Use tier-specific styling automatically

## Testing

Basic test example:

```tsx
import { describe, it, expect } from 'vitest';
import { BadgeConfig } from '../types/badge.types';

describe('Badge Components', () => {
  const mockConfig: BadgeConfig = {
    id: 'test-1',
    tier: 'gold',
    forest: 'kakamega',
    achievement: 'tree_planter',
    metadata: {
      badgeName: 'Test Badge',
      tierLevel: 4,
      forestName: 'Kakamega Forest',
      achievementType: 'tree_planter',
      achievementCount: 10,
      earnedDate: new Date().toISOString(),
      uniqueBadgeId: 'badge-123',
      userId: 'user-456',
    },
  };

  it('should create valid badge config', () => {
    expect(mockConfig).toBeDefined();
    expect(mockConfig.tier).toBe('gold');
  });
});
```

## Troubleshooting

### Badges Not Loading
- Check that badge IDs are unique
- Verify BadgeConfig has all required fields
- Ensure lazy loading observer is initialized

### Performance Issues
- Reduce `badgeSize` for mobile
- Increase `rootMargin` for earlier loading
- Use `CompactBadgeCard` for large grids
- Enable `optimizeForMobile={true}`

### Export Not Working
- Verify browser supports Canvas API
- Check CORS settings for badge images
- Ensure sufficient memory for PNG export

## Badge Services API Reference

### BadgeRendererService

Central service for rendering badges with geometric designs as default.

**Location**: `src/services/badgeRenderer.service.ts`

#### Methods

##### renderBadge(config, options?)

Render a badge with geometric design (default).

```typescript
import { badgeRendererService } from '@/services';
import { BadgeConfig } from '@/types/badge.types';

const config: BadgeConfig = {
  id: 'badge-1',
  tier: 'gold',
  forest: 'kakamega',
  achievement: 'tree_planter',
  metadata: {
    badgeName: 'Tree Planter Gold',
    tierLevel: 4,
    forestName: 'Kakamega Forest',
    achievementType: 'tree_planter',
    achievementCount: 50,
    earnedDate: new Date().toISOString(),
    uniqueBadgeId: 'badge-123',
    userId: 'user-456',
  },
};

const svg = await badgeRendererService.renderBadge(config, {
  useGeometric: true,  // Default: true
  size: 400,
  format: 'svg',
  includeMetadata: true,
  optimizeForMobile: false,
});
```

##### renderIcon(achievementType, size, useGeometric?)

Render badge icon only.

```typescript
const iconSVG = await badgeRendererService.renderIcon(
  'tree_planter',
  256,
  true  // Use geometric (default: true)
);
```

##### renderBadges(configs)

Batch render multiple badges.

```typescript
const badges = await badgeRendererService.renderBadges([
  config1,
  config2,
  config3,
]);

// Returns Map<string, string>
badges.forEach((svg, badgeId) => {
  console.log(`Badge ${badgeId}: ${svg.length} bytes`);
});
```

##### getCachedBadge(badgeId)

Get cached badge if available.

```typescript
const cachedSVG = await badgeRendererService.getCachedBadge('badge-123');

if (cachedSVG) {
  console.log('Using cached badge');
} else {
  console.log('Badge not in cache');
}
```

##### clearCache(badgeId?)

Clear badge cache.

```typescript
// Clear specific badge
await badgeRendererService.clearCache('badge-123');

// Clear all badges
await badgeRendererService.clearCache();
```

### BadgeGeneratorService

High-level service for badge generation with geometric defaults.

**Location**: `src/services/badgeGenerator.service.ts`

#### Methods

##### generateBadge(config)

Generate new badge (geometric by default).

```typescript
import { badgeGeneratorService } from '@/services';

const result = await badgeGeneratorService.generateBadge({
  achievement: 'tree_planter',
  tier: 'gold',
  userId: 'user-123',
  metadata: {
    earnedDate: new Date().toISOString(),
    achievementCount: 50,
  },
});

console.log('Badge ID:', result.badgeId);
console.log('SVG:', result.svg);
```

##### generateWelcomeBadge(userId)

Generate welcome badge for new user.

```typescript
const welcomeBadge = await badgeGeneratorService.generateWelcomeBadge('user-123');

console.log('Welcome badge created:', welcomeBadge.badgeId);
```

##### generateHeroBadge(userId, purchaseData)

Generate hero badge.

```typescript
const heroBadge = await badgeGeneratorService.generateHeroBadge('user-123', {
  transactionId: 'tx-456',
  purchaseDate: new Date(),
  amount: 50,
  currency: 'USD',
});
```

##### validateConfig(config)

Validate badge configuration.

```typescript
const validation = badgeGeneratorService.validateConfig(config);

if (!validation.valid) {
  console.error('Invalid config:', validation.errors);
}
```

##### getPreview(achievementType, tier)

Get badge preview.

```typescript
const previewSVG = await badgeGeneratorService.getPreview(
  'tree_planter',
  'gold'
);
```

### BadgeMigrationService

Migrate existing user badges to geometric designs.

**Location**: `src/services/badgeMigration.service.ts`

See [Badge Migration Guide](./BADGE_MIGRATION_GUIDE.md) for complete documentation.

#### Quick Reference

```typescript
import { badgeMigrationService } from '@/services';

// Migrate all badges
const result = await badgeMigrationService.migrateAllBadges({
  batchSize: 100,
  createBackup: true,
});

// Migrate user badges
await badgeMigrationService.migrateUserBadges('user-123');

// Get status
const status = await badgeMigrationService.getMigrationStatus();

// Rollback
await badgeMigrationService.rollbackMigration('migration-id');

// Verify
const verification = await badgeMigrationService.verifyMigration();
```

### BadgeCacheManager

Manage badge caching for performance.

**Location**: `src/utils/badgeCache.ts`

#### Methods

```typescript
import { badgeCacheManager } from '@/utils/badgeCache';

// Get cached badge
const svg = await badgeCacheManager.get('badge-key');

// Set badge in cache
await badgeCacheManager.set('badge-key', svgString, 3600); // TTL in seconds

// Check if cached
const isCached = await badgeCacheManager.has('badge-key');

// Clear cache
await badgeCacheManager.clear('badge-key'); // Specific
await badgeCacheManager.clear(); // All

// Get statistics
const stats = await badgeCacheManager.getStats();
console.log('Hit rate:', stats.hitRate);
```

### Mobile Optimization Utilities

**Location**: `src/utils/mobileOptimization.ts`

#### optimizeSVGForMobile(svg)

Optimize SVG for mobile devices.

```typescript
import { optimizeSVGForMobile } from '@/utils/mobileOptimization';

const optimized = optimizeSVGForMobile(largeSVG);
console.log('Size reduced:', largeSVG.length - optimized.length);
```

#### preloadCriticalBadges(badgeIds)

Preload first badges in collections.

```typescript
import { preloadCriticalBadges } from '@/utils/mobileOptimization';

await preloadCriticalBadges(['badge-1', 'badge-2', 'badge-3']);
```

### useLazyBadges Hook

React hook for lazy loading badges.

**Location**: `src/hooks/useLazyBadges.ts`

```typescript
import { useLazyBadges } from '@/hooks/useLazyBadges';

const MyComponent = ({ badgeIds }) => {
  const { visibleBadges, observerRef } = useLazyBadges(badgeIds);

  return (
    <div>
      {badgeIds.map(id => (
        <div
          key={id}
          ref={observerRef}
          data-badge-id={id}
        >
          {visibleBadges.has(id) ? (
            <Badge id={id} />
          ) : (
            <BadgePlaceholder />
          )}
        </div>
      ))}
    </div>
  );
};
```

## Enhanced Geometric Badge Generator API

**Location**: `src/utils/geometricBadgeGenerator.ts`

### New Functions

#### generateGeometricBadgeWithTier(achievementType, tier, size?, metadata?)

Generate badge with tier styling.

```typescript
import { generateGeometricBadgeWithTier } from '@/utils/geometricBadgeGenerator';

const badge = generateGeometricBadgeWithTier(
  'tree_planter',
  'gold',
  400,
  {
    badgeName: 'Tree Planter Gold',
    earnedDate: '2025-01-01',
    userId: 'user-123',
  }
);
```

#### generateMobileBadge(achievementType, tier, size?)

Generate optimized badge for mobile.

```typescript
import { generateMobileBadge } from '@/utils/geometricBadgeGenerator';

const mobileBadge = generateMobileBadge('tree_planter', 'gold', 256);
// Optimized: reduced polygons, smaller file size
```

#### generateCustomBadge(achievementType, tier, customColors, size?)

Generate badge with custom colors.

```typescript
import { generateCustomBadge } from '@/utils/geometricBadgeGenerator';

const customBadge = generateCustomBadge(
  'tree_planter',
  'gold',
  ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
  400
);
```

#### exportBadgeToPNG(svgString, size)

Export badge to PNG.

```typescript
import { exportBadgeToPNG } from '@/utils/geometricBadgeGenerator';

const pngBlob = await exportBadgeToPNG(svgString, 1024);

// Download
const url = URL.createObjectURL(pngBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'badge.png';
a.click();
```

## Database Schema

### nft_badges Table (Enhanced)

New geometric badge fields:

```sql
-- Badge type
badge_type VARCHAR(20) DEFAULT 'geometric'

-- Color configuration
primary_colors TEXT[]
accent_colors TEXT[]

-- Style configuration
complexity_level VARCHAR(20)
style_variant VARCHAR(20)

-- Cache
svg_cache TEXT
cache_updated_at TIMESTAMP

-- Migration tracking
migrated_at TIMESTAMP
migration_version INTEGER DEFAULT 1
```

### badge_migration_log Table

Track migration progress:

```sql
CREATE TABLE badge_migration_log (
  id UUID PRIMARY KEY,
  migration_id VARCHAR(50) UNIQUE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(20),
  total_badges INTEGER,
  migrated_badges INTEGER,
  failed_badges INTEGER,
  batch_size INTEGER,
  options JSONB,
  errors JSONB,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### badge_cache Table

Performance optimization:

```sql
CREATE TABLE badge_cache (
  id UUID PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE,
  badge_id UUID REFERENCES nft_badges(id),
  svg_content TEXT,
  size INTEGER,
  format VARCHAR(10),
  hit_count INTEGER,
  last_accessed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Migration Scripts

### CLI Tool

**Location**: `scripts/migrate-badges.ts`

```bash
# Dry run
npm run migrate-badges -- --dry-run

# Run migration
npm run migrate-badges -- --batch-size 100

# Migrate specific user
npm run migrate-badges -- --user-id user-123

# With options
npm run migrate-badges -- --batch-size 50 --delay 2000
```

### Verification Script

**Location**: `scripts/verify-migration.ts`

```bash
# Verify all badges
npm run verify-migration

# Verify specific migration
npm run verify-migration -- --migration-id migration-123

# Generate report
npm run verify-migration -- --report
```

### Rollback Script

**Location**: `scripts/rollback-migration.ts`

```bash
# Rollback migration
npm run rollback-migration -- --migration-id migration-123

# Verify rollback
npm run rollback-migration -- --migration-id migration-123 --verify
```

## API Endpoints

### POST /api/badges

Create new badge (geometric by default).

```typescript
// Request
POST /api/badges
Content-Type: application/json

{
  "achievement": "tree_planter",
  "tier": "gold",
  "userId": "user-123",
  "metadata": {
    "earnedDate": "2025-01-01T00:00:00Z",
    "achievementCount": 50
  }
}

// Response
{
  "success": true,
  "badgeId": "badge-456",
  "svg": "<svg>...</svg>",
  "badgeType": "geometric"
}
```

### GET /api/badges/:id

Get badge by ID.

```typescript
// Request
GET /api/badges/badge-456?format=svg

// Response
{
  "success": true,
  "badge": {
    "id": "badge-456",
    "achievement": "tree_planter",
    "tier": "gold",
    "svg": "<svg>...</svg>",
    "badgeType": "geometric"
  }
}
```

### POST /api/badges/migrate

Trigger badge migration (admin only).

```typescript
// Request
POST /api/badges/migrate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user-123",  // Optional
  "batchSize": 100,
  "createBackup": true
}

// Response
{
  "success": true,
  "migrationId": "migration-789",
  "status": "in_progress"
}
```

### GET /api/badges/migration/status

Get migration status.

```typescript
// Request
GET /api/badges/migration/status

// Response
{
  "inProgress": true,
  "progress": 45,
  "currentBatch": 5,
  "totalBatches": 10,
  "startedAt": "2025-01-01T00:00:00Z",
  "estimatedCompletion": "2025-01-01T00:05:00Z"
}
```

## Performance Optimization

### Caching Strategy

```typescript
// 1. Check cache first
const cached = await badgeCacheManager.get(cacheKey);
if (cached) return cached;

// 2. Generate badge
const svg = await generateBadge(config);

// 3. Cache result
await badgeCacheManager.set(cacheKey, svg, 3600);

return svg;
```

### Lazy Loading

```typescript
import { useLazyBadges } from '@/hooks/useLazyBadges';

const { visibleBadges, observerRef } = useLazyBadges(badgeIds);

// Only render visible badges
{visibleBadges.has(id) && <Badge id={id} />}
```

### Batch Operations

```typescript
// Instead of individual renders
for (const badge of badges) {
  await renderBadge(badge); // Slow
}

// Use batch rendering
const rendered = await badgeRendererService.renderBadges(badges); // Fast
```

## Error Handling

### BadgeError Class

```typescript
import { BadgeError, BadgeErrorCode } from '@/services/badgeRenderer.service';

try {
  const badge = await generateBadge(config);
} catch (error) {
  if (error instanceof BadgeError) {
    switch (error.code) {
      case BadgeErrorCode.INVALID_CONFIG:
        console.error('Invalid configuration:', error.context);
        break;
      case BadgeErrorCode.RENDER_FAILED:
        console.error('Rendering failed:', error.message);
        break;
      case BadgeErrorCode.CACHE_ERROR:
        // Retry without cache
        break;
    }
  }
}
```

### Error Codes

- `MIGRATION_FAILED`: Migration operation failed
- `RENDER_FAILED`: Badge rendering failed
- `VALIDATION_FAILED`: Configuration validation failed
- `CACHE_ERROR`: Cache operation failed
- `DATABASE_ERROR`: Database operation failed
- `INVALID_CONFIG`: Invalid badge configuration

## Monitoring

### Performance Metrics

```typescript
import { badgePerformanceMonitor } from '@/services/badgePerformanceMonitor.service';

// Track generation time
const metrics = await badgePerformanceMonitor.getMetrics();
console.log('Average generation time:', metrics.avgGenerationTime);
console.log('Cache hit rate:', metrics.cacheHitRate);
```

### Analytics

```typescript
import { badgeAnalyticsService } from '@/services/badgeAnalytics.service';

// Track badge views
await badgeAnalyticsService.trackBadgeView('badge-123');

// Track social shares
await badgeAnalyticsService.trackBadgeShare('badge-123', 'twitter');

// Get analytics
const analytics = await badgeAnalyticsService.getBadgeAnalytics('badge-123');
```

## Additional Resources

- [Badge Types](../src/types/badge.types.ts)
- [Geometric Design Spec](../src/assets/badges/GEOMETRIC_DESIGN.md)
- [Badge Migration Guide](./BADGE_MIGRATION_GUIDE.md)
- [Migration Scripts Quick Reference](./MIGRATION_SCRIPTS_QUICK_REFERENCE.md)
- [Badge API Quick Reference](./BADGE_API_QUICK_REFERENCE.md)
