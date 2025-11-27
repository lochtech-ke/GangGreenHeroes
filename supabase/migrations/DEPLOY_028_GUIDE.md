# Migration 028: Geometric Badge System Deployment Guide

## Overview

This migration adds the geometric badge system to the GangGreen platform, enabling:
- Enhanced nft_badges table with geometric design fields
- Badge migration tracking and logging
- Badge caching for performance
- Backup and rollback capabilities
- Geometric badge configurations

## Pre-Deployment Checklist

- [ ] Review migration file: `028_add_geometric_badge_system.sql`
- [ ] Backup production database
- [ ] Verify Supabase connection
- [ ] Ensure admin access to Supabase dashboard
- [ ] Review existing nft_badges table structure
- [ ] Confirm no active badge operations during deployment

## Migration Components

### 1. Enhanced nft_badges Table
**New Columns:**
- `badge_design_type` - Design type (geometric/classic)
- `primary_colors` - Array of primary colors
- `accent_colors` - Array of accent colors
- `complexity_level` - Complexity (simple/medium/complex)
- `style_variant` - Style (angular/organic/mixed)
- `svg_cache` - Cached SVG content
- `cache_updated_at` - Cache timestamp
- `migrated_at` - Migration timestamp
- `migration_version` - Migration version number

**Updated Constraints:**
- Extended badge_type check to include new achievement types
- Extended tier check to include new tiers (hummingbird, hero)

**New Indexes:**
- `idx_nft_badges_design_type`
- `idx_nft_badges_migrated_at`
- `idx_nft_badges_migration_version`
- `idx_nft_badges_cache_updated`

### 2. New Tables

#### badge_migration_log
Tracks all badge migration operations
- Migration ID, status, progress
- Batch size, options, errors
- Timestamps and admin tracking

#### badge_cache
Caches rendered badge SVGs
- Cache key, SVG content
- Hit count, access tracking
- Expiration management

#### badge_migration_backup
Stores badge backups before migration
- Original badge data (JSONB)
- Migration ID reference
- Restore tracking

#### geometric_badge_config
Stores geometric badge configurations
- Achievement type configurations
- Color palettes
- Complexity and style settings
- Icon type mappings

### 3. Functions

- `create_badge_backup()` - Create backup before migration
- `restore_badge_from_backup()` - Restore from backup
- `increment_cache_hit()` - Update cache statistics
- `clean_expired_cache()` - Remove expired cache entries

### 4. Seed Data

Geometric badge configurations for 10 achievement types:
- tree_planter
- carbon_warrior
- water_guardian
- biodiversity_champion
- community_leader
- climate_hero
- forest_protector
- green_ambassador
- welcome_badge
- ganggreen_hero

## Deployment Steps

### Step 1: Pre-Deployment Verification

```sql
-- Check current badge count
SELECT COUNT(*) FROM nft_badges;

-- Check existing badge types
SELECT DISTINCT badge_type, tier FROM nft_badges;

-- Verify no pending migrations
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '028' 
ORDER BY version DESC LIMIT 1;
```

### Step 2: Deploy Migration

**Option A: Using Supabase CLI**
```bash
# Navigate to project root
cd /path/to/ganggreen-platform

# Push migration to Supabase
supabase db push

# Or push specific migration
supabase migration up 028_add_geometric_badge_system
```

**Option B: Using Supabase Dashboard**
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `028_add_geometric_badge_system.sql`
4. Execute the migration
5. Verify success messages

**Option C: Using PowerShell Script**
```powershell
# Run the deployment script
.\supabase\push-migrations.ps1
```

### Step 3: Post-Deployment Verification

```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nft_badges' 
AND column_name IN (
  'badge_design_type', 'primary_colors', 'accent_colors',
  'complexity_level', 'style_variant', 'svg_cache',
  'cache_updated_at', 'migrated_at', 'migration_version'
);

-- Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'badge_migration_log', 'badge_cache', 
  'badge_migration_backup', 'geometric_badge_config'
);

-- Verify geometric configurations loaded
SELECT COUNT(*) FROM geometric_badge_config;
-- Expected: 10 configurations

-- Check badge statistics
SELECT 
  COUNT(*) as total_badges,
  COUNT(*) FILTER (WHERE badge_design_type = 'geometric') as geometric_badges,
  COUNT(*) FILTER (WHERE badge_design_type = 'classic' OR badge_design_type IS NULL) as classic_badges
FROM nft_badges;

-- Verify indexes created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'nft_badges' 
AND indexname LIKE '%design_type%' 
OR indexname LIKE '%migrated_at%';

-- Test functions
SELECT create_badge_backup(
  (SELECT id FROM nft_badges LIMIT 1),
  'test-migration-001'
);

-- Verify RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'badge_migration_log', 'badge_cache', 
  'badge_migration_backup', 'geometric_badge_config'
);
```

### Step 4: Test Badge Operations

```sql
-- Test geometric badge config retrieval
SELECT * FROM geometric_badge_config 
WHERE achievement_type = 'tree_planter';

-- Test cache operations
INSERT INTO badge_cache (
  cache_key, 
  svg_content, 
  size, 
  format
) VALUES (
  'test-badge-001',
  '<svg>test</svg>',
  400,
  'svg'
);

-- Verify cache entry
SELECT * FROM badge_cache WHERE cache_key = 'test-badge-001';

-- Clean up test data
DELETE FROM badge_cache WHERE cache_key = 'test-badge-001';
```

## Rollback Procedure

If issues occur, follow these steps to rollback:

### Step 1: Stop Badge Operations
Disable badge-related features in the application

### Step 2: Restore from Backup
```sql
-- If you have a database backup, restore it
-- Otherwise, manually revert changes:

-- Drop new tables
DROP TABLE IF EXISTS badge_migration_backup CASCADE;
DROP TABLE IF EXISTS badge_cache CASCADE;
DROP TABLE IF EXISTS badge_migration_log CASCADE;
DROP TABLE IF EXISTS geometric_badge_config CASCADE;

-- Remove new columns from nft_badges
ALTER TABLE nft_badges 
DROP COLUMN IF EXISTS badge_design_type,
DROP COLUMN IF EXISTS primary_colors,
DROP COLUMN IF EXISTS accent_colors,
DROP COLUMN IF EXISTS complexity_level,
DROP COLUMN IF EXISTS style_variant,
DROP COLUMN IF EXISTS svg_cache,
DROP COLUMN IF EXISTS cache_updated_at,
DROP COLUMN IF EXISTS migrated_at,
DROP COLUMN IF EXISTS migration_version;

-- Restore original constraints
ALTER TABLE nft_badges DROP CONSTRAINT IF EXISTS nft_badges_badge_type_check;
ALTER TABLE nft_badges ADD CONSTRAINT nft_badges_badge_type_check 
  CHECK (badge_type IN ('tree_planter', 'donor', 'monitor', 'ambassador', 'legend'));

ALTER TABLE nft_badges DROP CONSTRAINT IF EXISTS nft_badges_tier_check;
ALTER TABLE nft_badges ADD CONSTRAINT nft_badges_tier_check 
  CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond'));

-- Drop functions
DROP FUNCTION IF EXISTS create_badge_backup(UUID, VARCHAR);
DROP FUNCTION IF EXISTS restore_badge_from_backup(UUID, VARCHAR);
DROP FUNCTION IF EXISTS increment_cache_hit(VARCHAR);
DROP FUNCTION IF EXISTS clean_expired_cache();
```

### Step 3: Verify Rollback
```sql
-- Verify columns removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'nft_badges' 
AND column_name IN ('badge_design_type', 'primary_colors');
-- Expected: 0 rows

-- Verify tables removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('badge_migration_log', 'badge_cache');
-- Expected: 0 rows
```

## Common Issues and Solutions

### Issue 1: Migration Fails Due to Existing Columns
**Solution:** Check if columns already exist from a previous attempt
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'nft_badges' 
AND column_name = 'badge_design_type';
```
If exists, manually drop and retry migration.

### Issue 2: Constraint Violation on badge_type
**Solution:** Update existing badges to use valid badge types
```sql
-- Check invalid badge types
SELECT DISTINCT badge_type FROM nft_badges 
WHERE badge_type NOT IN (
  'tree_planter', 'carbon_warrior', 'water_guardian', 
  'biodiversity_champion', 'community_leader', 'climate_hero',
  'forest_protector', 'green_ambassador', 'welcome_badge', 
  'ganggreen_hero', 'donor', 'monitor', 'ambassador', 'legend'
);

-- Update if needed
UPDATE nft_badges 
SET badge_type = 'tree_planter' 
WHERE badge_type = 'invalid_type';
```

### Issue 3: RLS Policies Conflict
**Solution:** Drop existing policies before migration
```sql
-- List existing policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'nft_badges';

-- Drop conflicting policies if needed
DROP POLICY IF EXISTS "policy_name" ON nft_badges;
```

### Issue 4: Function Already Exists
**Solution:** Use CREATE OR REPLACE (already in migration)
```sql
-- Verify function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_badge_backup';
```

## Performance Considerations

### Expected Impact
- **Migration Time:** < 5 seconds for empty tables, ~1 second per 1000 badges
- **Storage Increase:** ~500 bytes per badge for new columns
- **Index Creation:** ~2 seconds per index
- **Query Performance:** Improved with new indexes

### Monitoring
```sql
-- Monitor table size
SELECT 
  pg_size_pretty(pg_total_relation_size('nft_badges')) as total_size,
  pg_size_pretty(pg_relation_size('nft_badges')) as table_size,
  pg_size_pretty(pg_indexes_size('nft_badges')) as indexes_size;

-- Monitor cache performance
SELECT 
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  pg_size_pretty(SUM(length(svg_content))) as total_cache_size
FROM badge_cache;
```

## Next Steps

After successful deployment:

1. **Update Application Code**
   - Deploy badge renderer service updates
   - Enable geometric badge generation
   - Update badge display components

2. **Run Migration**
   - Execute badge migration script
   - Monitor migration progress
   - Verify all badges migrated

3. **Enable Features**
   - Enable geometric badges feature flag
   - Update documentation
   - Notify users of new designs

4. **Monitor Performance**
   - Track badge generation time
   - Monitor cache hit rates
   - Check database performance

## Support

For issues or questions:
- Check migration logs in `badge_migration_log` table
- Review Supabase logs in dashboard
- Contact development team
- Refer to main migration spec: `.kiro/specs/geometric-badge-migration/`

## Migration Completion Checklist

- [ ] Migration deployed successfully
- [ ] All verification queries passed
- [ ] New tables created and accessible
- [ ] Geometric configurations loaded
- [ ] Functions working correctly
- [ ] RLS policies active
- [ ] Indexes created
- [ ] No errors in Supabase logs
- [ ] Application code updated
- [ ] Documentation updated
- [ ] Team notified

---

**Migration Version:** 028  
**Date:** November 27, 2025  
**Status:** Ready for Deployment  
**Estimated Duration:** 5-10 minutes
