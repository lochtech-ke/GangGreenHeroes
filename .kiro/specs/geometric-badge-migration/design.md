# Design Document

## Overview

This design document outlines the technical approach for migrating all existing badges on the #GangGreen platform to the new geometric, low-poly art style. The migration will update the badge rendering system to use geometric designs by default, migrate existing user badges, and optimize performance for mobile devices while maintaining backward compatibility with classic badge designs.

The system leverages the existing `geometricBadgeGenerator.ts` utility and extends the `badgeIconRenderer.ts` to make geometric designs the primary rendering mode. A comprehensive migration service will handle the conversion of existing user badges, and database schema updates will support geometric badge metadata.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Badge System Layer                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Badge      │  │   Badge      │  │   Badge      │      │
│  │  Renderer    │  │  Generator   │  │  Migration   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
├────────────────────────────┼─────────────────────────────────┤
│                     Core Utilities                           │
├────────────────────────────┼─────────────────────────────────┤
│                            │                                 │
│  ┌──────────────┐  ┌──────▼───────┐  ┌──────────────┐      │
│  │  Geometric   │  │    Badge     │  │   Classic    │      │
│  │    Badge     │◄─┤     Icon     │──►    Badge    │      │
│  │  Generator   │  │   Renderer   │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Supabase   │  │    Badge     │  │    Cache     │      │
│  │   Database   │  │   Metadata   │  │    Layer     │      │
│  │              │  │    Store     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request
     │
     ▼
┌─────────────────┐
│  Badge Display  │
│   Component     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Badge Renderer │◄──── Check Cache
│    Service      │
└────────┬────────┘
         │
         ├─── New Badge? ──►┌──────────────────┐
         │                  │ Badge Generator  │
         │                  │    Service       │
         │                  └────────┬─────────┘
         │                           │
         │                           ▼
         │                  ┌──────────────────┐
         │                  │   Geometric      │
         │                  │Badge Generator   │
         │                  └────────┬─────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│  Badge Icon     │         │  Save to Cache   │
│   Renderer      │         │   & Database     │
└────────┬────────┘         └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Return SVG to  │
│   Component     │
└─────────────────┘
```

## Components and Interfaces

### 1. Badge Renderer Service

**Purpose**: Central service for rendering badges with geometric designs as default

**Location**: `src/services/badgeRenderer.service.ts`

**Interface**:
```typescript
export interface BadgeRendererService {
  /**
   * Render a badge with geometric design (default)
   */
  renderBadge(config: BadgeConfig, options?: RenderOptions): Promise<string>;
  
  /**
   * Render badge icon only
   */
  renderIcon(achievementType: AchievementType, size: number, useGeometric?: boolean): Promise<string>;
  
  /**
   * Batch render multiple badges
   */
  renderBadges(configs: BadgeConfig[]): Promise<Map<string, string>>;
  
  /**
   * Get cached badge if available
   */
  getCachedBadge(badgeId: string): Promise<string | null>;
  
  /**
   * Clear badge cache
   */
  clearCache(badgeId?: string): Promise<void>;
}

export interface RenderOptions {
  useGeometric?: boolean; // Default: true
  size?: number;
  format?: 'svg' | 'png';
  includeMetadata?: boolean;
  optimizeForMobile?: boolean;
}
```

### 2. Badge Migration Service

**Purpose**: Migrate existing user badges to geometric designs

**Location**: `src/services/badgeMigration.service.ts`

**Interface**:
```typescript
export interface BadgeMigrationService {
  /**
   * Migrate all user badges to geometric design
   */
  migrateAllBadges(options?: MigrationOptions): Promise<MigrationResult>;
  
  /**
   * Migrate badges for specific user
   */
  migrateUserBadges(userId: string): Promise<MigrationResult>;
  
  /**
   * Get migration status
   */
  getMigrationStatus(): Promise<MigrationStatus>;
  
  /**
   * Rollback migration (restore from backup)
   */
  rollbackMigration(migrationId: string): Promise<boolean>;
  
  /**
   * Verify migrated badges
   */
  verifyMigration(): Promise<VerificationResult>;
}

export interface MigrationOptions {
  batchSize?: number; // Default: 100
  dryRun?: boolean;
  createBackup?: boolean; // Default: true
  skipErrors?: boolean; // Default: false
}

export interface MigrationResult {
  success: boolean;
  totalBadges: number;
  migratedBadges: number;
  failedBadges: number;
  errors: MigrationError[];
  duration: number; // milliseconds
  migrationId: string;
}

export interface MigrationStatus {
  inProgress: boolean;
  progress: number; // 0-100
  currentBatch: number;
  totalBatches: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
}

export interface MigrationError {
  badgeId: string;
  userId: string;
  error: string;
  timestamp: Date;
}

export interface VerificationResult {
  verified: boolean;
  totalChecked: number;
  passed: number;
  failed: number;
  issues: VerificationIssue[];
}

export interface VerificationIssue {
  badgeId: string;
  issue: string;
  severity: 'error' | 'warning';
}
```

### 3. Badge Generator Service

**Purpose**: High-level service for badge generation with geometric defaults

**Location**: `src/services/badgeGenerator.service.ts`

**Interface**:
```typescript
export interface BadgeGeneratorService {
  /**
   * Generate new badge (geometric by default)
   */
  generateBadge(config: BadgeConfig): Promise<BadgeGenerationResult>;
  
  /**
   * Generate welcome badge for new user
   */
  generateWelcomeBadge(userId: string): Promise<BadgeGenerationResult>;
  
  /**
   * Generate hero badge
   */
  generateHeroBadge(userId: string, purchaseData: PurchaseData): Promise<BadgeGenerationResult>;
  
  /**
   * Validate badge configuration
   */
  validateConfig(config: BadgeConfig): BadgeValidationResult;
  
  /**
   * Get badge preview
   */
  getPreview(achievementType: AchievementType, tier: BadgeTier): Promise<string>;
}

export interface PurchaseData {
  transactionId: string;
  purchaseDate: Date;
  amount: number;
  currency: string;
}
```

### 4. Enhanced Geometric Badge Generator

**Purpose**: Extended geometric badge generation with new features

**Location**: `src/utils/geometricBadgeGenerator.ts` (enhanced)

**New Functions**:
```typescript
/**
 * Generate badge with tier styling
 */
export function generateGeometricBadgeWithTier(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 400,
  metadata?: BadgeMetadata
): string;

/**
 * Generate optimized badge for mobile
 */
export function generateMobileBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 256
): string;

/**
 * Generate badge with custom colors
 */
export function generateCustomBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  customColors: string[],
  size: number = 400
): string;

/**
 * Export badge to PNG
 */
export async function exportBadgeToPNG(
  svgString: string,
  size: number
): Promise<Blob>;
```

### 5. Badge Cache Manager

**Purpose**: Manage badge caching for performance

**Location**: `src/utils/badgeCache.ts`

**Interface**:
```typescript
export interface BadgeCacheManager {
  /**
   * Get cached badge
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Set badge in cache
   */
  set(key: string, svg: string, ttl?: number): Promise<void>;
  
  /**
   * Check if badge is cached
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Clear specific badge or all badges
   */
  clear(key?: string): Promise<void>;
  
  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  averageSize: number;
  totalSize: number;
}
```

## Data Models

### Database Schema Updates

#### 1. Enhanced `nft_badges` Table

```sql
-- Add geometric badge fields
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS badge_type VARCHAR(20) DEFAULT 'geometric';
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS primary_colors TEXT[];
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS accent_colors TEXT[];
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS complexity_level VARCHAR(20);
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS style_variant VARCHAR(20);
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS svg_cache TEXT;
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMP;
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP;
ALTER TABLE nft_badges ADD COLUMN IF NOT EXISTS migration_version INTEGER DEFAULT 1;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_nft_badges_badge_type ON nft_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_nft_badges_migrated_at ON nft_badges(migrated_at);
```

#### 2. New `badge_migration_log` Table

```sql
CREATE TABLE IF NOT EXISTS badge_migration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_id VARCHAR(50) UNIQUE NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'failed', 'rolled_back'
  total_badges INTEGER NOT NULL,
  migrated_badges INTEGER DEFAULT 0,
  failed_badges INTEGER DEFAULT 0,
  batch_size INTEGER NOT NULL,
  options JSONB,
  errors JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badge_migration_log_status ON badge_migration_log(status);
CREATE INDEX idx_badge_migration_log_started_at ON badge_migration_log(started_at);
```

#### 3. New `badge_cache` Table

```sql
CREATE TABLE IF NOT EXISTS badge_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  badge_id UUID REFERENCES nft_badges(id) ON DELETE CASCADE,
  svg_content TEXT NOT NULL,
  size INTEGER NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'svg',
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_badge_cache_key ON badge_cache(cache_key);
CREATE INDEX idx_badge_cache_badge_id ON badge_cache(badge_id);
CREATE INDEX idx_badge_cache_expires_at ON badge_cache(expires_at);
```

### TypeScript Data Models

#### Enhanced Badge Configuration

```typescript
export interface EnhancedBadgeConfig extends BadgeConfig {
  badgeType: 'geometric' | 'classic';
  primaryColors?: string[];
  accentColors?: string[];
  complexityLevel?: 'simple' | 'medium' | 'complex';
  styleVariant?: 'angular' | 'organic' | 'mixed';
  cacheKey?: string;
  migratedAt?: Date;
  migrationVersion?: number;
}
```

#### Badge Migration Models

```typescript
export interface BadgeMigrationRecord {
  id: string;
  migrationId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  totalBadges: number;
  migratedBadges: number;
  failedBadges: number;
  batchSize: number;
  options: MigrationOptions;
  errors: MigrationError[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeBackup {
  badgeId: string;
  userId: string;
  originalData: any;
  backupDate: Date;
  migrationId: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable criteria, I've identified the following redundancies and consolidations:

**Redundant Properties:**
- Requirements 1.5 is redundant with 1.3 (both test metadata preservation)
- Requirements 2.1, 2.2, 2.3, 2.4 all test "geometric as default" - can be consolidated
- Requirements 3.2 and 3.4 overlap with 3.1 (backward compatibility)

**Consolidated Properties:**
- All "geometric as default" requirements (2.1-2.4) → Single comprehensive property
- All backward compatibility requirements (3.1-3.5) → Single comprehensive property
- Achievement-specific rendering (5.1-5.8) → Single property with parameterized achievement types

### Core Correctness Properties

Property 1: Badge Migration Preserves Metadata
*For any* existing badge, when migrated to geometric design, all original metadata fields (tier, achievement type, earned date, user ID) should remain unchanged
**Validates: Requirements 1.3, 1.5**

Property 2: Migration Completeness
*For any* set of user badges, when the migration service runs, all badges should be processed and either successfully migrated or logged as errors
**Validates: Requirements 1.1, 1.4**

Property 3: Geometric Design as Default
*For any* badge generation or rendering request without explicit style specification, the system should use geometric design
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 4: Backward Compatibility
*For any* classic badge data or parameters, the system should successfully process and render them as geometric equivalents without errors
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 5: Badge Size Constraint
*For any* generated geometric badge SVG, the file size should be under 5KB
**Validates: Requirements 4.3**

Property 6: Cache Consistency
*For any* badge, after first render, subsequent requests with the same parameters should return cached results
**Validates: Requirements 4.5**

Property 7: Achievement Type Rendering
*For any* achievement type, the rendered badge should contain geometric elements specific to that achievement's configuration
**Validates: Requirements 5.1-5.8**

Property 8: Database Storage Integrity
*For any* saved geometric badge, the database record should include badge_type="geometric" and all geometric-specific metadata fields
**Validates: Requirements 8.1, 8.2**

Property 9: Migration Data Preservation
*For any* badge record update during migration, all existing fields should be preserved while new geometric fields are added
**Validates: Requirements 8.3**

Property 10: Migration Backup Creation
*For any* migration execution, backup records should be created for all badges before any conversion occurs
**Validates: Requirements 9.3**

Property 11: Batch Processing
*For any* migration with N badges and batch size B, the badges should be processed in ceil(N/B) batches
**Validates: Requirements 9.1**

Property 12: Error Resilience
*For any* migration batch, if errors occur, they should be logged and processing should continue with remaining badges
**Validates: Requirements 9.2**

Property 13: Migration Reporting
*For any* completed migration, a report should be generated containing total badges, migrated count, failed count, and error details
**Validates: Requirements 9.5**

Property 14: Responsive Scaling
*For any* screen width W where 320 ≤ W ≤ 2560, badges should scale proportionally without distortion
**Validates: Requirements 10.1**

Property 15: Analytics Tracking
*For any* badge operation (generation, migration, rendering), analytics data should be recorded for geometric vs classic usage
**Validates: Requirements 8.5**

## Error Handling

### Error Categories

1. **Migration Errors**
   - Badge data corruption
   - Missing required fields
   - Database connection failures
   - Batch processing timeouts

2. **Rendering Errors**
   - Invalid achievement type
   - Missing configuration
   - SVG generation failures
   - Cache write failures

3. **Validation Errors**
   - Invalid badge configuration
   - Missing metadata
   - Unsupported tier or achievement type
   - Invalid color values

### Error Handling Strategy

```typescript
export class BadgeError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'BadgeError';
  }
}

export enum BadgeErrorCode {
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  RENDER_FAILED = 'RENDER_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
}

// Error handling in services
try {
  const result = await migrateBadge(badgeId);
  return result;
} catch (error) {
  if (error instanceof BadgeError) {
    logger.error('Badge operation failed', {
      code: error.code,
      message: error.message,
      context: error.context,
    });
    
    // Attempt recovery based on error type
    if (error.code === BadgeErrorCode.CACHE_ERROR) {
      // Clear cache and retry
      await clearCache(badgeId);
      return await migrateBadge(badgeId);
    }
  }
  
  throw error;
}
```

### Graceful Degradation

1. **Cache Failures**: Fall back to real-time generation
2. **Migration Errors**: Log error, continue with next badge
3. **Rendering Errors**: Return fallback SVG with error indicator
4. **Database Errors**: Retry with exponential backoff

## Testing Strategy

### Unit Testing

**Test Coverage Areas:**
- Geometric badge generator functions
- Badge renderer service methods
- Migration service batch processing
- Cache manager operations
- Data model validation
- Error handling and recovery

**Example Unit Tests:**
```typescript
describe('GeometricBadgeGenerator', () => {
  test('generates tree icon with correct polygons', () => {
    const svg = generateTreeIcon(GEOMETRIC_CONFIGS.tree_planter, 120);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('fill="#2E8B57"');
  });
  
  test('scales badge correctly', () => {
    const small = generateGeometricIcon('tree_planter', 120);
    const large = generateGeometricIcon('tree_planter', 240);
    expect(large.length).toBeGreaterThan(small.length);
  });
  
  test('generates badge under 5KB', () => {
    const svg = generateGeometricBadge('tree_planter', 'gold', 400);
    const size = new Blob([svg]).size;
    expect(size).toBeLessThan(5 * 1024);
  });
});

describe('BadgeMigrationService', () => {
  test('processes badges in batches', async () => {
    const badges = createMockBadges(250);
    const result = await migrationService.migrateAllBadges({
      batchSize: 100,
    });
    
    expect(result.totalBadges).toBe(250);
    expect(result.migratedBadges).toBe(250);
  });
  
  test('creates backups before migration', async () => {
    const badge = createMockBadge();
    await migrationService.migrateUserBadges(badge.userId);
    
    const backup = await getBackup(badge.id);
    expect(backup).toBeDefined();
    expect(backup.originalData).toEqual(badge);
  });
});
```

### Property-Based Testing

**Property Test Framework**: fast-check (JavaScript/TypeScript)

**Property Tests:**

```typescript
import fc from 'fast-check';

describe('Badge Migration Properties', () => {
  test('Property 1: Migration preserves metadata', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          tier: fc.constantFrom('bronze', 'silver', 'gold', 'platinum', 'diamond'),
          achievement: fc.constantFrom('tree_planter', 'carbon_warrior', 'water_guardian'),
          earnedDate: fc.date(),
          userId: fc.uuid(),
        }),
        async (badge) => {
          const migrated = await migrateBadge(badge);
          
          expect(migrated.tier).toBe(badge.tier);
          expect(migrated.achievement).toBe(badge.achievement);
          expect(migrated.earnedDate).toEqual(badge.earnedDate);
          expect(migrated.userId).toBe(badge.userId);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 3: Geometric as default', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('tree_planter', 'carbon_warrior', 'water_guardian'),
        fc.constantFrom('bronze', 'silver', 'gold'),
        async (achievement, tier) => {
          const badge = await generateBadge({ achievement, tier });
          
          expect(badge.badgeType).toBe('geometric');
          expect(badge.svg).toContain('<polygon');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 5: Badge size constraint', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('tree_planter', 'carbon_warrior', 'water_guardian'),
        fc.constantFrom('bronze', 'silver', 'gold'),
        fc.integer({ min: 120, max: 400 }),
        (achievement, tier, size) => {
          const svg = generateGeometricBadge(achievement, tier, size);
          const fileSize = new Blob([svg]).size;
          
          expect(fileSize).toBeLessThan(5 * 1024);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 9: Migration data preservation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          tier: fc.constantFrom('bronze', 'silver', 'gold'),
          achievement: fc.constantFrom('tree_planter', 'carbon_warrior'),
          metadata: fc.object(),
        }),
        async (badge) => {
          const original = { ...badge };
          const migrated = await migrateBadge(badge);
          
          // All original fields should be preserved
          Object.keys(original).forEach(key => {
            expect(migrated[key]).toEqual(original[key]);
          });
          
          // New geometric fields should be added
          expect(migrated.badgeType).toBe('geometric');
          expect(migrated.primaryColors).toBeDefined();
          expect(migrated.migratedAt).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  test('Property 11: Batch processing', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 10, max: 100 }),
        async (totalBadges, batchSize) => {
          const badges = Array.from({ length: totalBadges }, (_, i) => ({
            id: `badge-${i}`,
            userId: `user-${i}`,
          }));
          
          const result = await migrationService.migrateAllBadges({
            batchSize,
          });
          
          const expectedBatches = Math.ceil(totalBadges / batchSize);
          expect(result.totalBatches).toBe(expectedBatches);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Integration Testing

**Test Scenarios:**
1. End-to-end badge generation flow
2. Migration service with real database
3. Cache integration with rendering
4. API endpoints with geometric defaults
5. Mobile performance testing

**Example Integration Test:**
```typescript
describe('Badge System Integration', () => {
  test('new user receives geometric welcome badge', async () => {
    const user = await createTestUser();
    
    // Trigger registration flow
    await completeRegistration(user.id);
    
    // Verify badge was created
    const badges = await getBadgesForUser(user.id);
    expect(badges).toHaveLength(1);
    expect(badges[0].achievement).toBe('welcome_badge');
    expect(badges[0].badgeType).toBe('geometric');
    
    // Verify badge renders correctly
    const svg = await renderBadge(badges[0].id);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('hummingbird');
  });
  
  test('migration preserves user badge collection', async () => {
    const user = await createTestUser();
    const classicBadges = await createClassicBadges(user.id, 5);
    
    // Run migration
    const result = await migrationService.migrateUserBadges(user.id);
    expect(result.success).toBe(true);
    expect(result.migratedBadges).toBe(5);
    
    // Verify all badges are now geometric
    const badges = await getBadgesForUser(user.id);
    expect(badges).toHaveLength(5);
    badges.forEach(badge => {
      expect(badge.badgeType).toBe('geometric');
      expect(badge.primaryColors).toBeDefined();
    });
  });
});
```

### Performance Testing

**Mobile Performance Benchmarks:**
- Badge rendering: < 100ms (target: 50ms)
- Cache retrieval: < 10ms
- Batch migration: < 5 seconds per 100 badges
- SVG generation: < 20ms per badge

**Load Testing:**
- Concurrent badge renders: 100 requests/second
- Migration throughput: 1000 badges/minute
- Cache hit rate: > 80%

## Mobile Optimization

### Performance Strategies

1. **Lazy Loading**
```typescript
export function useLazyBadges(badgeIds: string[]) {
  const [visibleBadges, setVisibleBadges] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver>();
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const badgeId = entry.target.getAttribute('data-badge-id');
            if (badgeId) {
              setVisibleBadges(prev => new Set([...prev, badgeId]));
            }
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    return () => observerRef.current?.disconnect();
  }, []);
  
  return { visibleBadges, observerRef };
}
```

2. **SVG Optimization**
```typescript
export function optimizeSVGForMobile(svg: string): string {
  return svg
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/<!--.*?-->/g, '') // Remove comments
    .replace(/(\d+\.\d{3})\d+/g, '$1') // Round coordinates to 3 decimals
    .trim();
}
```

3. **Progressive Loading**
```typescript
export async function loadBadgeProgressive(
  badgeId: string
): Promise<{ placeholder: string; full: string }> {
  // Load low-quality placeholder first
  const placeholder = await generateSimplifiedBadge(badgeId);
  
  // Load full quality in background
  const full = await generateFullBadge(badgeId);
  
  return { placeholder, full };
}
```

4. **Image Preloading**
```typescript
export function preloadCriticalBadges(badgeIds: string[]) {
  badgeIds.slice(0, 3).forEach(async (id) => {
    const svg = await renderBadge(id);
    await cacheManager.set(`badge:${id}`, svg);
  });
}
```

### Mobile-Specific Rendering

```typescript
export function generateMobileBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  size: number = 256
): string {
  const config = GEOMETRIC_CONFIGS[achievementType];
  
  // Reduce polygon count for mobile
  const simplifiedConfig = {
    ...config,
    complexity: config.complexity === 'complex' ? 'medium' : 'simple',
  };
  
  // Generate with optimizations
  const svg = generateGeometricBadge(achievementType, tier, size);
  
  // Apply mobile optimizations
  return optimizeSVGForMobile(svg);
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Enhance geometric badge generator
- Update badge renderer service
- Implement cache manager
- Database schema updates

### Phase 2: Migration Service (Week 2)
- Build migration service
- Implement batch processing
- Create backup system
- Add error handling and logging

### Phase 3: Integration (Week 3)
- Update all badge generation endpoints
- Integrate with existing components
- Update badge display components
- Implement lazy loading

### Phase 4: Testing & Optimization (Week 4)
- Unit and property tests
- Integration testing
- Performance optimization
- Mobile testing

### Phase 5: Migration Execution (Week 5)
- Dry run migration
- Production migration
- Verification and monitoring
- Rollback plan execution if needed

## Deployment Strategy

### Pre-Deployment Checklist
- [ ] All tests passing (unit, property, integration)
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Backup system verified
- [ ] Rollback procedure documented
- [ ] Monitoring dashboards configured

### Deployment Steps
1. Deploy database schema updates
2. Deploy new code with feature flag disabled
3. Run migration in dry-run mode
4. Verify dry-run results
5. Enable feature flag for 10% of users
6. Monitor performance and errors
7. Gradually increase to 100%
8. Run full migration
9. Verify all badges migrated
10. Remove classic badge code (after 30 days)

### Rollback Plan
1. Disable geometric rendering feature flag
2. Restore from backup if needed
3. Revert database schema changes
4. Deploy previous code version
5. Verify system stability

## Monitoring and Metrics

### Key Metrics
- Badge generation time (p50, p95, p99)
- Cache hit rate
- Migration progress and errors
- Mobile performance metrics
- User engagement with badges
- File size distribution

### Alerts
- Badge generation time > 100ms
- Cache hit rate < 70%
- Migration errors > 1%
- Mobile render time > 150ms
- Database query time > 500ms

### Dashboards
1. **Badge Performance Dashboard**
   - Generation time trends
   - Cache performance
   - Error rates
   - Mobile vs desktop metrics

2. **Migration Dashboard**
   - Migration progress
   - Success/failure rates
   - Batch processing times
   - Error logs

3. **User Engagement Dashboard**
   - Badge views
   - Social shares
   - Achievement unlocks
   - Geometric vs classic preference

## Security Considerations

### Input Validation
- Validate all badge configuration parameters
- Sanitize user-provided metadata
- Prevent SVG injection attacks
- Validate file sizes and dimensions

### Access Control
- Restrict migration service to admin users
- Implement rate limiting on badge generation
- Secure cache access
- Audit log for sensitive operations

### Data Privacy
- Anonymize user data in logs
- Encrypt sensitive badge metadata
- Comply with GDPR for user data
- Secure backup storage

## Documentation Updates

### Developer Documentation
- API reference for new services
- Migration guide for developers
- Performance optimization guide
- Troubleshooting guide

### User Documentation
- Badge system overview
- Achievement guide
- Social sharing guide
- FAQ for badge changes

## Success Criteria

### Technical Success
- ✅ All badges migrated successfully (> 99%)
- ✅ Performance targets met (< 100ms render time)
- ✅ File size under 5KB for all badges
- ✅ Cache hit rate > 80%
- ✅ Zero data loss during migration

### User Success
- ✅ Positive user feedback on new designs
- ✅ Increased badge sharing on social media
- ✅ No increase in support tickets
- ✅ Improved mobile user experience
- ✅ Higher badge engagement metrics

## Future Enhancements

### Planned Features
1. **Animated Badges**: Add subtle animations to geometric badges
2. **Custom Colors**: Allow users to customize badge colors
3. **Badge Variants**: Seasonal and event-specific badge designs
4. **3D Badges**: Experimental 3D geometric badge designs
5. **Badge Collections**: Group badges into themed collections
6. **Badge Trading**: NFT marketplace for badge trading
7. **Achievement Combos**: Special badges for achievement combinations

### Technical Improvements
1. **WebGL Rendering**: Hardware-accelerated badge rendering
2. **Service Worker Caching**: Offline badge support
3. **CDN Integration**: Serve badges from CDN
4. **Real-time Updates**: Live badge updates via WebSocket
5. **A/B Testing**: Test different geometric designs
