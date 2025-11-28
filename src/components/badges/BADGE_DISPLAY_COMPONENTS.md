# Badge Display Components Documentation

This document provides comprehensive documentation for the badge display components that have been updated to use the geometric badge rendering system.

## Overview

The badge display components (`CurrentBadgeDisplay`, `NextBadgePreview`, and `BadgeTimeline`) have been refactored to use the centralized geometric badge rendering system. These components now leverage `BadgeCard`, `LazyBadge`, and the badge mapping utilities to provide consistent, modern badge displays across the platform.

## Components

### CurrentBadgeDisplay

Displays the user's current badge with animations and special indicators.

#### Props

```typescript
interface CurrentBadgeDisplayProps {
  badge: Badge;           // The current badge to display
  className?: string;     // Optional CSS classes
}
```

#### Features

- **Geometric Badge Rendering**: Uses `BadgeCard` component with 256px size for prominent display
- **Lazy Loading**: Enables lazy loading for performance optimization
- **Preloading**: Preloads the current badge for immediate display
- **Error Handling**: Displays helpful error messages if badge fails to load
- **Loading States**: Shows `BadgePlaceholder` while badge is loading
- **Animations**: 
  - Gentle rotation and scale animation (slower for hummingbird badges)
  - Sparkle effect with different colors for hummingbird badges
- **Special Indicators**:
  - "Welcome!" badge for hummingbird tier
  - "Your journey begins here!" message for hummingbird badges
  - Enhanced sparkle animations for welcome badges

#### Usage Example

```tsx
import { CurrentBadgeDisplay } from '@/components/badges/CurrentBadgeDisplay';
import type { Badge } from '@/types/badgeProgression.types';

function MyBadgesPage() {
  const currentBadge: Badge = {
    id: '123',
    name: 'Hummingbird',
    tier: 'hummingbird',
    tier_order: 1,
    description: 'Welcome to your journey!',
    requirements: [],
    icon_url: '',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  };

  return (
    <div className="container mx-auto p-6">
      <CurrentBadgeDisplay 
        badge={currentBadge}
        className="mb-8"
      />
    </div>
  );
}
```

#### Performance Considerations

- Badge is preloaded on component mount for immediate display
- Uses `useMemo` to cache the mapped badge configuration
- Leverages badge cache system to avoid redundant rendering
- Logs preload timing for performance monitoring

#### Error States

If the badge fails to load, the component displays:
- Red-bordered error container
- Alert icon
- Error message: "Failed to Load Badge"
- Helpful instruction to refresh the page
- Badge name and description still visible

---

### NextBadgePreview

Displays a preview of the next badge to earn with a locked overlay and progress indicator.

#### Props

```typescript
interface NextBadgePreviewProps {
  badge: Badge;              // The next badge to preview
  progressPercentage: number; // Progress towards earning (0-100)
  className?: string;        // Optional CSS classes
}
```

#### Features

- **Geometric Badge Rendering**: Uses `BadgeCard` component with 160px size for preview display
- **Locked State**: Semi-transparent overlay with lock icon
- **Progress Bar**: Animated progress bar showing completion percentage
- **Lazy Loading**: Enables lazy loading for performance
- **Preloading**: Preloads the next badge for smooth display
- **Error Handling**: Displays error state if badge fails to load
- **Loading States**: Shows `BadgePlaceholder` while loading
- **Glass Morphism**: Uses glass effect for modern UI

#### Usage Example

```tsx
import { NextBadgePreview } from '@/components/badges/NextBadgePreview';
import type { Badge } from '@/types/badgeProgression.types';

function BadgeProgressionView() {
  const nextBadge: Badge = {
    id: '456',
    name: 'Community Contributor',
    tier: 'community_contributor',
    tier_order: 2,
    description: 'Contribute to your community',
    requirements: [
      {
        type: 'trees_planted',
        count: 10,
        description: 'Plant 10 trees',
      },
    ],
    icon_url: '',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  };

  return (
    <div className="container mx-auto p-6">
      <NextBadgePreview 
        badge={nextBadge}
        progressPercentage={65}
        className="mb-6"
      />
    </div>
  );
}
```

#### Visual Elements

1. **Header**: "Next Badge" with arrow icon
2. **Badge Display**: 
   - Geometric badge with locked overlay
   - Lock icon centered on badge
   - Semi-transparent dark background with backdrop blur
3. **Badge Info**:
   - Badge name (bold)
   - Badge description
   - Progress bar with percentage
4. **Progress Bar**:
   - Animated fill from 0 to current percentage
   - Green gradient (from-green-500 to-green-600)
   - Percentage text displayed next to bar

#### Performance Considerations

- Badge is preloaded on component mount
- Uses `useMemo` to cache mapped badge configuration
- Logs preload timing for monitoring
- Leverages badge cache system

---

### BadgeTimeline

Displays a vertical timeline of all badge tiers showing progression path.

#### Props

```typescript
interface BadgeTimelineProps {
  allBadges: Badge[];    // All available badges in the progression
  currentBadge: Badge;   // The user's current badge
  className?: string;    // Optional CSS classes
}
```

#### Features

- **Geometric Badge Rendering**: Uses `CompactBadgeCard` with 48px size for timeline items
- **Parallel Rendering**: Preloads all badges in parallel using `Promise.all`
- **Timeline Visualization**:
  - Vertical line connecting all badges
  - Colored progress line showing earned badges
  - Lock icons on unearned badges
  - Pulsing border on current badge
- **Interactive Elements**:
  - Click to expand/collapse badge details
  - Hover effects on badges and info sections
  - Smooth animations for expand/collapse
- **Requirements Display**:
  - Summary chips always visible
  - Expandable detailed requirements
  - Tier order information
- **Error Handling**: Individual error states for each badge
- **Loading States**: Shows placeholders for loading badges

#### Usage Example

```tsx
import { BadgeTimeline } from '@/components/badges/BadgeTimeline';
import type { Badge } from '@/types/badgeProgression.types';

function BadgeProgressionView() {
  const allBadges: Badge[] = [
    {
      id: '1',
      name: 'Hummingbird',
      tier: 'hummingbird',
      tier_order: 1,
      description: 'Welcome badge',
      requirements: [],
      icon_url: '',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: '2',
      name: 'Community Contributor',
      tier: 'community_contributor',
      tier_order: 2,
      description: 'Contribute to your community',
      requirements: [
        {
          type: 'trees_planted',
          count: 10,
          description: 'Plant 10 trees in your community',
        },
        {
          type: 'initiatives_joined',
          count: 2,
          description: 'Join 2 conservation initiatives',
        },
      ],
      icon_url: '',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    // ... more badges
  ];

  const currentBadge = allBadges[0];

  return (
    <div className="container mx-auto p-6">
      <BadgeTimeline 
        allBadges={allBadges}
        currentBadge={currentBadge}
        className="max-w-2xl"
      />
    </div>
  );
}
```

#### Visual Elements

1. **Timeline Structure**:
   - Gray vertical line (full height)
   - Green progress line (up to current badge)
   - Badges positioned along the line

2. **Badge Items**:
   - 48px geometric badge icon
   - Lock icon overlay for unearned badges
   - Pulsing border for current badge
   - Badge name with status chips
   - Badge description
   - Requirements summary chips

3. **Status Indicators**:
   - "Current" chip (green) for current badge
   - "Locked" chip (gray) for unearned badges
   - Opacity reduction for locked badges

4. **Expandable Details**:
   - Chevron icon (rotates when expanded)
   - Detailed requirements list
   - Tier order information
   - Smooth height animation

#### Performance Considerations

- **Parallel Preloading**: All badges are preloaded in parallel for optimal performance
- **Performance Logging**: Logs total preload time and per-badge average
- **No Lazy Loading**: Small badges (48px) don't use lazy loading
- **Efficient State Management**: Uses Sets for tracking loading and error states
- **Memoization**: Badge configs are mapped once and cached

#### Interaction Patterns

1. **Click Badge Icon**: Expands/collapses detailed requirements
2. **Click Info Section**: Expands/collapses detailed requirements
3. **Hover Badge**: Slight scale animation (1.1x)
4. **Hover Info Section**: Light gray background

---

## Common Patterns

### Badge Mapping

All components use the `mapBadgeToBadgeConfig` utility to convert `Badge` objects to `BadgeConfig` objects:

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';

const badgeConfig = mapBadgeToBadgeConfig(badge);
```

This mapping:
- Converts badge tier to geometric tier string
- Determines achievement type based on badge
- Includes relevant metadata
- Handles missing or invalid data gracefully

### Error Handling

All components implement consistent error handling:

1. **Error State**: Track errors with `useState`
2. **Error Callback**: Pass `onError` handler to `BadgeCard`
3. **Error Display**: Show helpful error messages with icons
4. **Fallback**: Display badge info even when rendering fails

### Loading States

All components implement loading states:

1. **Loading State**: Track loading with `useState`
2. **Placeholder**: Show `BadgePlaceholder` while loading
3. **Load Callback**: Pass `onLoad` handler to `BadgeCard`
4. **Smooth Transition**: Fade in badge when loaded

### Preloading

All components preload badges for better performance:

1. **useEffect Hook**: Preload on component mount
2. **Badge Renderer**: Use `getBadgeRenderer()` service
3. **Performance Logging**: Log preload timing
4. **Error Handling**: Catch and log preload errors

---

## Migration Notes

### Before (Manual Rendering)

```tsx
// Old approach - manual SVG rendering
<div className="w-64 h-64 rounded-full bg-gradient-to-br from-teal-400 to-green-500">
  <TreePine className="w-32 h-32 text-white" />
</div>
```

### After (Geometric Rendering)

```tsx
// New approach - geometric badge system
<BadgeCard
  config={mapBadgeToBadgeConfig(badge)}
  size={256}
  showMetadata={false}
  lazyLoad={true}
/>
```

### Benefits

1. **Consistency**: All badges use the same rendering system
2. **Maintainability**: Changes to badge design happen in one place
3. **Performance**: Caching, lazy loading, and parallel rendering
4. **Quality**: Professional geometric designs with tier-specific styling
5. **Flexibility**: Easy to add new badge types and tiers

---

## Troubleshooting

### Badge Not Displaying

1. **Check Badge Data**: Ensure badge object has all required fields
2. **Check Console**: Look for error messages in browser console
3. **Check Network**: Verify badge renderer service is accessible
4. **Check Cache**: Clear badge cache if stale data is suspected

### Performance Issues

1. **Check Preloading**: Verify badges are being preloaded
2. **Check Cache**: Ensure badge cache is working
3. **Check Parallel Rendering**: Verify Promise.all is being used
4. **Check Network**: Slow network can delay badge loading

### Styling Issues

1. **Check Tier Mapping**: Verify badge tier is mapped correctly
2. **Check Achievement Type**: Ensure achievement type is determined correctly
3. **Check CSS Classes**: Verify Tailwind classes are applied
4. **Check Size**: Ensure badge size is appropriate for container

---

## Related Documentation

- [Badge Mapping Utility](../../utils/BADGE_MAPPING.md)
- [Geometric Badge System](../../../docs/GEOMETRIC_BADGES_GUIDE.md)
- [Badge Renderer Service](../../services/BADGE_RENDERER.md)
- [Badge Types](../../types/badge.types.ts)
