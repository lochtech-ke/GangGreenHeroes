# Badge Mapping Utility Documentation

This document provides comprehensive documentation for the badge mapping utility that converts `Badge` objects from the progression system to `BadgeConfig` objects for the geometric badge rendering system.

## Overview

The badge mapping utility (`badgeMapping.ts`) serves as a bridge between two badge systems:

1. **Progression System**: Tracks user badge progression with `Badge` objects
2. **Geometric Rendering System**: Renders badges with `BadgeConfig` objects

This utility ensures that badges from the progression system can be displayed using the modern geometric badge designs.

## Core Functions

### mapBadgeToBadgeConfig

Converts a `Badge` object to a `BadgeConfig` object for geometric rendering.

#### Signature

```typescript
function mapBadgeToBadgeConfig(
  badge: Badge,
  userId?: string,
  userName?: string
): BadgeConfig
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `badge` | `Badge` | Yes | The badge from the progression system |
| `userId` | `string` | No | Optional user ID for metadata |
| `userName` | `string` | No | Optional user name for metadata |

#### Returns

`BadgeConfig` - A configuration object ready for geometric badge rendering

#### Example Usage

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';
import type { Badge } from '@/types/badgeProgression.types';

// Basic usage
const badge: Badge = {
  id: '123',
  name: 'Community Contributor',
  tier: BadgeTier.COMMUNITY_CONTRIBUTOR,
  tier_order: 2,
  description: 'Active community member',
  requirements: [
    {
      type: 'trees_planted',
      count: 10,
      description: 'Plant 10 trees',
    },
  ],
  icon_url: '',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const config = mapBadgeToBadgeConfig(badge);

// With user information
const configWithUser = mapBadgeToBadgeConfig(
  badge,
  'user-456',
  'Jane Doe'
);

// Use with BadgeCard component
<BadgeCard config={config} size={256} />
```

#### Output Structure

```typescript
{
  id: '123',
  tier: 'bronze',
  forest: 'kakamega',
  achievement: 'community_leader',
  metadata: {
    badgeName: 'Community Contributor',
    tierLevel: 2,
    forestName: 'Kakamega Forest',
    achievementType: 'community_leader',
    achievementCount: 1,
    earnedDate: '2025-01-01T00:00:00Z',
    uniqueBadgeId: '123',
    userId: 'user-456',
    userName: 'Jane Doe'
  }
}
```

#### Special Handling

**Hummingbird Badges**: When mapping a hummingbird (welcome) badge, additional metadata is included:

```typescript
{
  // ... standard fields
  metadata: {
    // ... standard metadata
    welcomeMessage: 'Welcome to #GangGreen!',
    registrationDate: '2025-01-01T00:00:00Z',
    platformVersion: '1.0.0'
  }
}
```

#### Error Handling

The function handles various error conditions gracefully:

1. **Null/Undefined Badge**: Throws an error
2. **Missing ID**: Generates fallback ID using timestamp
3. **Missing Name**: Uses 'Unknown Badge' as fallback
4. **Missing Tier**: Defaults to 'bronze' tier
5. **Invalid Requirements**: Defaults to empty array
6. **Missing Dates**: Uses current date as fallback

All error conditions are logged to the console with descriptive warnings.

---

### determineAchievementType

Determines the achievement type based on the badge tier.

#### Signature

```typescript
function determineAchievementType(badge: Badge): AchievementType
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `badge` | `Badge` | Yes | The badge from the progression system |

#### Returns

`AchievementType` - The achievement type for geometric rendering

#### Tier to Achievement Mapping

| Progression Tier | Achievement Type | Description |
|-----------------|------------------|-------------|
| `HUMMINGBIRD` | `welcome_badge` | Welcome/onboarding badge |
| `COMMUNITY_CONTRIBUTOR` | `community_leader` | Bronze tier badge |
| `CLIMATE_ADVOCATE` | `climate_hero` | Silver tier badge |
| `ENVIRONMENTAL_CHAMPION` | `forest_protector` | Gold tier badge |
| `GREEN_HERO` | `ganggreen_hero` | Hero tier badge |
| Unknown/Invalid | `community_leader` | Default fallback |

#### Example Usage

```typescript
import { determineAchievementType } from '@/utils/badgeMapping';
import { BadgeTier } from '@/types/badgeProgression.types';

const badge: Badge = {
  id: '123',
  tier: BadgeTier.HUMMINGBIRD,
  name: 'Welcome Badge',
  // ... other properties
};

const achievement = determineAchievementType(badge);
console.log(achievement); // Output: 'welcome_badge'
```

#### Error Handling

- **Null/Undefined Badge**: Returns `'community_leader'` with warning
- **Missing Tier**: Returns `'community_leader'` with warning
- **Unknown Tier**: Returns `'community_leader'` with warning

All error conditions are logged to the console.

---

### mapTierToBadgeTier

Maps badge tier enum to geometric badge tier string.

#### Signature

```typescript
function mapTierToBadgeTier(tier: ProgressionBadgeTier): GeometricBadgeTier
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tier` | `ProgressionBadgeTier` | Yes | The badge tier from progression system |

#### Returns

`GeometricBadgeTier` - The tier string for geometric rendering

#### Tier Mapping

| Progression Tier | Geometric Tier | Visual Style |
|-----------------|----------------|--------------|
| `HUMMINGBIRD` | `'hummingbird'` | Teal/green gradient |
| `COMMUNITY_CONTRIBUTOR` | `'bronze'` | Bronze/brown tones |
| `CLIMATE_ADVOCATE` | `'silver'` | Silver/gray tones |
| `ENVIRONMENTAL_CHAMPION` | `'gold'` | Gold/yellow tones |
| `GREEN_HERO` | `'hero'` | Premium multi-color |
| Unknown/Invalid | `'bronze'` | Default bronze style |

#### Example Usage

```typescript
import { mapTierToBadgeTier } from '@/utils/badgeMapping';
import { BadgeTier } from '@/types/badgeProgression.types';

const tier = BadgeTier.CLIMATE_ADVOCATE;
const geometricTier = mapTierToBadgeTier(tier);
console.log(geometricTier); // Output: 'silver'
```

#### Error Handling

- **Null/Undefined Tier**: Returns `'bronze'` with warning
- **Unknown Tier**: Returns `'bronze'` with warning

All error conditions are logged to the console.

---

## Type Definitions

### Input Type: Badge

```typescript
interface Badge {
  id: string;
  name: string;
  tier: BadgeTier;
  tier_order: number;
  description: string;
  requirements: BadgeRequirement[];
  icon_url: string;
  created_at: string;
  updated_at: string;
}

enum BadgeTier {
  HUMMINGBIRD = 'hummingbird',
  COMMUNITY_CONTRIBUTOR = 'community_contributor',
  CLIMATE_ADVOCATE = 'climate_advocate',
  ENVIRONMENTAL_CHAMPION = 'environmental_champion',
  GREEN_HERO = 'green_hero',
}

interface BadgeRequirement {
  type: string;
  count: number;
  description: string;
}
```

### Output Type: BadgeConfig

```typescript
interface BadgeConfig {
  id?: string;
  tier: BadgeTier;
  forest: ForestType;
  achievement: AchievementType;
  metadata: {
    badgeName?: string;
    tierLevel?: number;
    forestName?: string;
    achievementType?: AchievementType;
    achievementCount?: number;
    earnedDate?: string;
    uniqueBadgeId?: string;
    userId?: string;
    userName?: string;
    welcomeMessage?: string;
    registrationDate?: string;
    platformVersion?: string;
  };
}

type BadgeTier = 'hummingbird' | 'bronze' | 'silver' | 'gold' | 'hero';

type AchievementType = 
  | 'welcome_badge'
  | 'community_leader'
  | 'climate_hero'
  | 'forest_protector'
  | 'ganggreen_hero'
  | 'tree_planter'
  | 'carbon_warrior';
```

---

## Usage Patterns

### Pattern 1: Component Integration

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';
import { BadgeCard } from '@/components/badges/BadgeCard';
import { useMemo } from 'react';

function MyBadgeComponent({ badge }: { badge: Badge }) {
  // Cache the mapped config to prevent unnecessary recalculations
  const badgeConfig = useMemo(
    () => mapBadgeToBadgeConfig(badge),
    [badge]
  );

  return (
    <BadgeCard
      config={badgeConfig}
      size={256}
      showMetadata={true}
      lazyLoad={true}
    />
  );
}
```

### Pattern 2: Batch Mapping

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';

function mapBadgeArray(badges: Badge[], userId?: string, userName?: string) {
  return badges.map(badge => 
    mapBadgeToBadgeConfig(badge, userId, userName)
  );
}

// Usage
const badges: Badge[] = [...];
const configs = mapBadgeArray(badges, 'user-123', 'John Doe');
```

### Pattern 3: Error Handling

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';

function safeBadgeMapping(badge: Badge | null | undefined) {
  if (!badge) {
    console.error('Cannot map null badge');
    return null;
  }

  try {
    return mapBadgeToBadgeConfig(badge);
  } catch (error) {
    console.error('Badge mapping failed:', error);
    return null;
  }
}
```

### Pattern 4: Conditional Metadata

```typescript
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';

function mapBadgeWithContext(
  badge: Badge,
  user: { id: string; name: string } | null
) {
  if (user) {
    return mapBadgeToBadgeConfig(badge, user.id, user.name);
  }
  return mapBadgeToBadgeConfig(badge);
}
```

---

## Best Practices

### 1. Use Memoization

Always memoize the mapped badge config in React components to prevent unnecessary recalculations:

```typescript
const badgeConfig = useMemo(
  () => mapBadgeToBadgeConfig(badge),
  [badge]
);
```

### 2. Provide User Context

When available, always provide user ID and name for better metadata:

```typescript
const config = mapBadgeToBadgeConfig(badge, userId, userName);
```

### 3. Handle Errors Gracefully

Wrap mapping calls in try-catch blocks when dealing with untrusted data:

```typescript
try {
  const config = mapBadgeToBadgeConfig(badge);
  // Use config
} catch (error) {
  // Handle error
}
```

### 4. Validate Input Data

Validate badge data before mapping to catch issues early:

```typescript
function isValidBadge(badge: any): badge is Badge {
  return (
    badge &&
    typeof badge.id === 'string' &&
    typeof badge.name === 'string' &&
    typeof badge.tier === 'string'
  );
}

if (isValidBadge(badge)) {
  const config = mapBadgeToBadgeConfig(badge);
}
```

### 5. Monitor Console Warnings

The utility logs warnings for data issues. Monitor these in development:

```typescript
// Enable verbose logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Mapping badge:', badge);
  const config = mapBadgeToBadgeConfig(badge);
  console.log('Mapped config:', config);
}
```

---

## Troubleshooting

### Issue: Badge Not Rendering

**Symptoms**: Badge component shows error or placeholder

**Possible Causes**:
1. Invalid badge data passed to mapping function
2. Missing required badge properties
3. Incorrect tier value

**Solutions**:
1. Check console for mapping warnings
2. Validate badge object structure
3. Ensure badge tier is a valid enum value

### Issue: Wrong Badge Style

**Symptoms**: Badge displays with incorrect colors or design

**Possible Causes**:
1. Tier mapping is incorrect
2. Achievement type determination is wrong
3. Badge tier enum value doesn't match expected values

**Solutions**:
1. Verify badge tier value in database
2. Check tier mapping in `mapTierToBadgeTier`
3. Ensure progression tier enum matches expected values

### Issue: Missing Metadata

**Symptoms**: Badge displays but missing user name or other metadata

**Possible Causes**:
1. User ID/name not passed to mapping function
2. Badge requirements array is invalid
3. Badge dates are missing

**Solutions**:
1. Pass userId and userName parameters
2. Validate badge requirements structure
3. Ensure badge has created_at date

### Issue: Performance Problems

**Symptoms**: Slow badge rendering or excessive re-renders

**Possible Causes**:
1. Badge config not memoized
2. Mapping function called on every render
3. Large number of badges mapped at once

**Solutions**:
1. Use `useMemo` to cache mapped config
2. Move mapping outside render function
3. Implement pagination or virtualization

---

## Migration Guide

### Migrating from Manual Badge Rendering

**Before**:
```typescript
// Manual badge rendering
<div className="badge-container">
  <div className={`badge-tier-${badge.tier}`}>
    <Icon name={badge.icon_url} />
  </div>
</div>
```

**After**:
```typescript
// Geometric badge rendering
import { mapBadgeToBadgeConfig } from '@/utils/badgeMapping';
import { BadgeCard } from '@/components/badges/BadgeCard';

const badgeConfig = mapBadgeToBadgeConfig(badge);

<BadgeCard
  config={badgeConfig}
  size={256}
  showMetadata={true}
/>
```

### Migrating from Old Badge Config

**Before**:
```typescript
// Old badge config structure
const oldConfig = {
  type: badge.tier,
  icon: badge.icon_url,
  name: badge.name,
};
```

**After**:
```typescript
// New badge config structure
const newConfig = mapBadgeToBadgeConfig(badge);
// Automatically includes tier, achievement, metadata
```

---

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { 
  mapBadgeToBadgeConfig,
  determineAchievementType,
  mapTierToBadgeTier 
} from './badgeMapping';
import { BadgeTier } from '../types/badgeProgression.types';

describe('badgeMapping', () => {
  describe('mapBadgeToBadgeConfig', () => {
    it('should map badge to config correctly', () => {
      const badge: Badge = {
        id: '123',
        name: 'Test Badge',
        tier: BadgeTier.COMMUNITY_CONTRIBUTOR,
        tier_order: 2,
        description: 'Test description',
        requirements: [],
        icon_url: '',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      const config = mapBadgeToBadgeConfig(badge);

      expect(config.id).toBe('123');
      expect(config.tier).toBe('bronze');
      expect(config.achievement).toBe('community_leader');
      expect(config.metadata.badgeName).toBe('Test Badge');
    });

    it('should handle hummingbird badges', () => {
      const badge: Badge = {
        id: '456',
        name: 'Welcome',
        tier: BadgeTier.HUMMINGBIRD,
        tier_order: 1,
        description: 'Welcome badge',
        requirements: [],
        icon_url: '',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      };

      const config = mapBadgeToBadgeConfig(badge);

      expect(config.tier).toBe('hummingbird');
      expect(config.achievement).toBe('welcome_badge');
      expect(config.metadata.welcomeMessage).toBe('Welcome to #GangGreen!');
    });
  });

  describe('determineAchievementType', () => {
    it('should map tiers to achievement types', () => {
      const tests = [
        { tier: BadgeTier.HUMMINGBIRD, expected: 'welcome_badge' },
        { tier: BadgeTier.COMMUNITY_CONTRIBUTOR, expected: 'community_leader' },
        { tier: BadgeTier.CLIMATE_ADVOCATE, expected: 'climate_hero' },
      ];

      tests.forEach(({ tier, expected }) => {
        const badge = { tier } as Badge;
        expect(determineAchievementType(badge)).toBe(expected);
      });
    });
  });

  describe('mapTierToBadgeTier', () => {
    it('should map progression tiers to geometric tiers', () => {
      expect(mapTierToBadgeTier(BadgeTier.HUMMINGBIRD)).toBe('hummingbird');
      expect(mapTierToBadgeTier(BadgeTier.COMMUNITY_CONTRIBUTOR)).toBe('bronze');
      expect(mapTierToBadgeTier(BadgeTier.GREEN_HERO)).toBe('hero');
    });
  });
});
```

---

## Related Documentation

- [Badge Display Components](../components/badges/BADGE_DISPLAY_COMPONENTS.md)
- [Geometric Badge System](../../docs/GEOMETRIC_BADGES_GUIDE.md)
- [Badge Types](../types/badge.types.ts)
- [Badge Progression Types](../types/badgeProgression.types.ts)
