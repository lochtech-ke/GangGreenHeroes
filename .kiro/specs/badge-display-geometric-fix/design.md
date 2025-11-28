# Design Document

## Overview

This design addresses the issue where badge display components (`CurrentBadgeDisplay`, `NextBadgePreview`, `BadgeTimeline`) are not using the geometric badge rendering system. These components currently render badges manually using simple circles and icons, bypassing the comprehensive geometric badge system that has been implemented.

The solution involves refactoring these components to use the existing `BadgeCard`, `LazyBadge`, and `BadgeGrid` components, which properly integrate with the geometric badge rendering system.

## Architecture

### Current Architecture (Problem)

```
BadgeProgressionView
├── CurrentBadgeDisplay (manually renders circle + icon)
├── NextBadgePreview (manually renders circle + icon)
└── BadgeTimeline (manually renders circle + icon)
```

### Target Architecture (Solution)

```
BadgeProgressionView
├── CurrentBadgeDisplay
│   └── BadgeCard (geometric rendering)
│       └── LazyBadge (geometric SVG)
├── NextBadgePreview
│   └── BadgeCard (geometric rendering)
│       └── LazyBadge (geometric SVG)
└── BadgeTimeline
    └── BadgeGrid (geometric rendering)
        └── LazyBadge[] (geometric SVGs)
```

## Components and Interfaces

### 1. Badge Configuration Mapping

We need to map the `Badge` type from `badgeProgression.types.ts` to the `BadgeConfig` type expected by the geometric badge system.

```typescript
interface Badge {
  id: string;
  name: string;
  tier: BadgeTier; // enum: hummingbird, community_contributor, etc.
  tier_order: number;
  description: string;
  requirements: BadgeRequirement[];
  icon_url: string;
  created_at: string;
  updated_at: string;
}

interface BadgeConfig {
  id?: string;
  achievement: AchievementType; // tree_planter, carbon_warrior, etc.
  tier: BadgeTier; // hummingbird, bronze, silver, gold, etc.
  metadata: {
    earnedDate?: string;
    achievementCount?: number;
    userName?: string;
    userId?: string;
  };
}
```

**Mapping Strategy:**
- Create a utility function `mapBadgeToBadgeConfig(badge: Badge): BadgeConfig`
- Map `badge.tier` to the appropriate `BadgeConfig.tier`
- Determine `achievement` type based on badge name or tier
- Include relevant metadata from the badge

### 2. Updated CurrentBadgeDisplay Component

**Changes:**
- Remove manual SVG/HTML rendering
- Use `BadgeCard` component with mapped `BadgeConfig`
- Maintain animation and special indicators (Welcome!, sparkles)
- Keep hummingbird-specific messaging

**Component Structure:**
```typescript
<CurrentBadgeDisplay>
  <BadgeCard
    config={badgeConfig}
    size={256}
    showMetadata={true}
    lazyLoad={true}
  />
  {/* Special indicators and messages */}
</CurrentBadgeDisplay>
```

### 3. Updated NextBadgePreview Component

**Changes:**
- Remove manual circle + icon rendering
- Use `BadgeCard` component with locked/preview styling
- Add overlay for locked state
- Maintain progress bar

**Component Structure:**
```typescript
<NextBadgePreview>
  <div className="relative">
    <BadgeCard
      config={badgeConfig}
      size={160}
      showMetadata={false}
      lazyLoad={true}
    />
    {/* Lock overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <Lock />
    </div>
  </div>
  {/* Progress bar */}
</NextBadgePreview>
```

### 4. Updated BadgeTimeline Component

**Changes:**
- Remove manual circle + icon rendering for each badge
- Use `CompactBadgeCard` for timeline items
- Maintain timeline line and progress indicators
- Keep expandable requirements section

**Component Structure:**
```typescript
<BadgeTimeline>
  {sortedBadges.map(badge => (
    <TimelineItem>
      <CompactBadgeCard
        config={mapBadgeToBadgeConfig(badge)}
        size={48}
        showTierOnly={true}
        lazyLoad={false} // Small badges, no need for lazy loading
      />
      {/* Timeline line, lock icon, current indicator */}
      {/* Badge info and requirements */}
    </TimelineItem>
  ))}
</BadgeTimeline>
```

### 5. Badge Mapping Utility

Create a new utility file: `src/utils/badgeMapping.ts`

```typescript
/**
 * Maps Badge from progression system to BadgeConfig for geometric rendering
 */
export function mapBadgeToBadgeConfig(badge: Badge): BadgeConfig {
  return {
    id: badge.id,
    achievement: determineAchievementType(badge),
    tier: mapTierToBadgeTier(badge.tier),
    metadata: {
      earnedDate: badge.created_at,
      achievementCount: badge.requirements.length,
    },
  };
}

/**
 * Determines achievement type from badge
 */
function determineAchievementType(badge: Badge): AchievementType {
  // Map based on badge tier or name
  // For now, use welcome_badge for hummingbird, community_leader for others
  if (badge.tier === BadgeTier.HUMMINGBIRD) {
    return 'welcome_badge';
  }
  return 'community_leader'; // Default
}

/**
 * Maps BadgeTier enum to geometric badge tier
 */
function mapTierToBadgeTier(tier: BadgeTier): string {
  const tierMap: Record<BadgeTier, string> = {
    [BadgeTier.HUMMINGBIRD]: 'hummingbird',
    [BadgeTier.COMMUNITY_CONTRIBUTOR]: 'bronze',
    [BadgeTier.CLIMATE_ADVOCATE]: 'silver',
    [BadgeTier.ENVIRONMENTAL_CHAMPION]: 'gold',
    [BadgeTier.GREEN_HERO]: 'hero',
  };
  return tierMap[tier] || 'bronze';
}
```

## Data Models

No new data models are required. We're using existing types:
- `Badge` from `badgeProgression.types.ts`
- `BadgeConfig` from `badge.types.ts`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Geometric badge rendering
*For any* badge displayed in CurrentBadgeDisplay, NextBadgePreview, or BadgeTimeline, the rendered output should contain geometric badge SVG elements with tier-specific styling
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Badge configuration completeness
*For any* badge being rendered, the mapped BadgeConfig should include achievement type, tier, and metadata fields
**Validates: Requirements 2.2**

### Property 3: Parallel badge rendering
*For any* collection of badges being rendered, the rendering should execute in parallel using Promise.all or similar concurrent execution
**Validates: Requirements 4.4**

### Property 4: Cache utilization
*For any* badge being rendered, the badge renderer should check the cache before generating a new SVG
**Validates: Requirements 4.5**

## Error Handling

### Badge Mapping Errors
- If badge tier cannot be mapped, default to 'bronze'
- If achievement type cannot be determined, default to 'community_leader'
- Log warnings for unmapped badges

### Rendering Errors
- Use `LazyBadge` component's built-in error handling
- Display error state with helpful message
- Fallback to placeholder if rendering fails

### Missing Data
- If badge data is incomplete, use sensible defaults
- Show placeholder while loading
- Display error message if badge cannot be loaded

## Testing Strategy

### Unit Tests
- Test `mapBadgeToBadgeConfig` with various badge inputs
- Test `determineAchievementType` for all badge tiers
- Test `mapTierToBadgeTier` for all tier values
- Test component rendering with mocked badge data

### Property-Based Tests
- Property 1: Test that all badge displays use geometric rendering
- Property 2: Test that all badge configs are complete
- Property 3: Test that multiple badges render in parallel
- Property 4: Test that cache is checked before generation

### Integration Tests
- Test CurrentBadgeDisplay with real badge data
- Test NextBadgePreview with locked badge
- Test BadgeTimeline with multiple badges
- Test hummingbird badge special indicators

### Visual Regression Tests
- Capture screenshots of badge displays before and after changes
- Verify geometric badges render correctly
- Verify tier-specific styling is applied
- Verify special indicators (Welcome!, sparkles) still appear

## Performance Considerations

### Lazy Loading
- Use `LazyBadge` with `ObservedBadge` for badges in grids
- Use `lazyLoad={false}` for small timeline badges (< 64px)
- Preload current badge for immediate display

### Caching
- Leverage existing badge cache system
- Cache badge configs after mapping
- Use cached SVGs when available

### Rendering Optimization
- Render badges in parallel using `Promise.all`
- Use `CompactBadgeCard` for small displays
- Minimize re-renders with React.memo

## Migration Strategy

### Phase 1: Update CurrentBadgeDisplay
1. Create badge mapping utility
2. Update CurrentBadgeDisplay to use BadgeCard
3. Test with hummingbird badge
4. Verify special indicators still work

### Phase 2: Update NextBadgePreview
1. Update NextBadgePreview to use BadgeCard
2. Add locked state overlay
3. Test with various badge tiers
4. Verify progress bar still works

### Phase 3: Update BadgeTimeline
1. Update BadgeTimeline to use CompactBadgeCard
2. Test with multiple badges
3. Verify timeline line and indicators
4. Test expandable requirements

### Phase 4: Testing and Validation
1. Run all unit tests
2. Run property-based tests
3. Perform visual regression testing
4. Test on mobile devices
5. Verify performance metrics

## Rollback Plan

If issues are discovered after deployment:
1. Revert component changes
2. Restore original manual rendering
3. Investigate and fix issues
4. Re-deploy with fixes

The changes are isolated to three components, making rollback straightforward.
