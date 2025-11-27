-- Migration: 028_add_geometric_badge_system.sql
-- Description: Add geometric badge system with migration support, caching, and enhanced metadata
-- Date: 2025-11-27
-- Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5

-- ============================================================================
-- ENHANCE NFT_BADGES TABLE WITH GEOMETRIC FIELDS
-- ============================================================================

-- Add geometric badge fields to existing nft_badges table
ALTER TABLE nft_badges 
ADD COLUMN IF NOT EXISTS badge_design_type VARCHAR(20) DEFAULT 'geometric' CHECK (badge_design_type IN ('geometric', 'classic')),
ADD COLUMN IF NOT EXISTS primary_colors TEXT[],
ADD COLUMN IF NOT EXISTS accent_colors TEXT[],
ADD COLUMN IF NOT EXISTS complexity_level VARCHAR(20) CHECK (complexity_level IN ('simple', 'medium', 'complex')),
ADD COLUMN IF NOT EXISTS style_variant VARCHAR(20) CHECK (style_variant IN ('angular', 'organic', 'mixed')),
ADD COLUMN IF NOT EXISTS svg_cache TEXT,
ADD COLUMN IF NOT EXISTS cache_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migration_version INTEGER DEFAULT 1;

-- Update existing badge_type check constraint to include new achievement types
ALTER TABLE nft_badges DROP CONSTRAINT IF EXISTS nft_badges_badge_type_check;
ALTER TABLE nft_badges ADD CONSTRAINT nft_badges_badge_type_check 
  CHECK (badge_type IN (
    'tree_planter', 'carbon_warrior', 'water_guardian', 'biodiversity_champion',
    'community_leader', 'climate_hero', 'forest_protector', 'green_ambassador',
    'welcome_badge', 'ganggreen_hero', 'donor', 'monitor', 'ambassador', 'legend'
  ));

-- Update tier check constraint to include new tiers
ALTER TABLE nft_badges DROP CONSTRAINT IF EXISTS nft_badges_tier_check;
ALTER TABLE nft_badges ADD CONSTRAINT nft_badges_tier_check 
  CHECK (tier IN ('hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'));

-- Create indexes for geometric badge fields
CREATE INDEX IF NOT EXISTS idx_nft_badges_design_type ON nft_badges(badge_design_type);
CREATE INDEX IF NOT EXISTS idx_nft_badges_migrated_at ON nft_badges(migrated_at);
CREATE INDEX IF NOT EXISTS idx_nft_badges_migration_version ON nft_badges(migration_version);
CREATE INDEX IF NOT EXISTS idx_nft_badges_cache_updated ON nft_badges(cache_updated_at) WHERE svg_cache IS NOT NULL;

-- ============================================================================
-- BADGE MIGRATION LOG TABLE
-- ============================================================================

-- Table to track badge migration operations
CREATE TABLE IF NOT EXISTS badge_migration_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_id VARCHAR(50) UNIQUE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  total_badges INTEGER NOT NULL DEFAULT 0,
  migrated_badges INTEGER DEFAULT 0,
  failed_badges INTEGER DEFAULT 0,
  batch_size INTEGER NOT NULL DEFAULT 100,
  options JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for migration log
CREATE INDEX IF NOT EXISTS idx_badge_migration_log_status ON badge_migration_log(status);
CREATE INDEX IF NOT EXISTS idx_badge_migration_log_started_at ON badge_migration_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_badge_migration_log_migration_id ON badge_migration_log(migration_id);

-- ============================================================================
-- BADGE CACHE TABLE
-- ============================================================================

-- Table to cache rendered badge SVGs for performance
CREATE TABLE IF NOT EXISTS badge_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  badge_id UUID REFERENCES nft_badges(id) ON DELETE CASCADE,
  svg_content TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 400,
  format VARCHAR(10) NOT NULL DEFAULT 'svg' CHECK (format IN ('svg', 'png')),
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for badge cache
CREATE INDEX IF NOT EXISTS idx_badge_cache_key ON badge_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_badge_cache_badge_id ON badge_cache(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_cache_expires_at ON badge_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_badge_cache_last_accessed ON badge_cache(last_accessed_at DESC);

-- ============================================================================
-- BADGE BACKUP TABLE
-- ============================================================================

-- Table to store badge backups before migration
CREATE TABLE IF NOT EXISTS badge_migration_backup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID NOT NULL,
  migration_id VARCHAR(50) NOT NULL REFERENCES badge_migration_log(migration_id) ON DELETE CASCADE,
  original_data JSONB NOT NULL,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  restored BOOLEAN DEFAULT FALSE,
  restored_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(badge_id, migration_id)
);

-- Create indexes for backup table
CREATE INDEX IF NOT EXISTS idx_badge_backup_badge_id ON badge_migration_backup(badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_backup_migration_id ON badge_migration_backup(migration_id);
CREATE INDEX IF NOT EXISTS idx_badge_backup_date ON badge_migration_backup(backup_date DESC);

-- ============================================================================
-- GEOMETRIC BADGE CONFIGURATION TABLE
-- ============================================================================

-- Table to store geometric badge configurations
CREATE TABLE IF NOT EXISTS geometric_badge_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_type VARCHAR(50) NOT NULL UNIQUE,
  primary_colors TEXT[] NOT NULL,
  accent_colors TEXT[] NOT NULL,
  complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('simple', 'medium', 'complex')),
  style VARCHAR(20) NOT NULL CHECK (style IN ('angular', 'organic', 'mixed')),
  icon_type VARCHAR(50) NOT NULL CHECK (icon_type IN ('hummingbird', 'tree', 'water', 'shield', 'star')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active configs
CREATE INDEX IF NOT EXISTS idx_geometric_config_active ON geometric_badge_config(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_geometric_config_achievement ON geometric_badge_config(achievement_type);

-- ============================================================================
-- SEED GEOMETRIC BADGE CONFIGURATIONS
-- ============================================================================

-- Insert geometric badge configurations for all achievement types
INSERT INTO geometric_badge_config (achievement_type, primary_colors, accent_colors, complexity, style, icon_type, description) VALUES
('tree_planter', 
  ARRAY['#2E8B57', '#3CB371', '#90EE90', '#228B22'], 
  ARRAY['#8B4513', '#A0522D', '#CD853F'],
  'medium', 'organic', 'tree',
  'Geometric tree with layered canopy structure'),
  
('carbon_warrior', 
  ARRAY['#4169E1', '#1E90FF', '#87CEEB', '#00BFFF'], 
  ARRAY['#191970', '#000080', '#4682B4'],
  'complex', 'angular', 'shield',
  'Shield with angular facets representing protection'),
  
('water_guardian', 
  ARRAY['#00CED1', '#48D1CC', '#40E0D0', '#7FFFD4'], 
  ARRAY['#008B8B', '#20B2AA', '#5F9EA0'],
  'medium', 'organic', 'water',
  'Geometric water droplet with highlight effects'),
  
('biodiversity_champion', 
  ARRAY['#FF6347', '#FF7F50', '#FFA07A', '#FFD700'], 
  ARRAY['#9370DB', '#8A2BE2', '#9932CC', '#BA55D3'],
  'complex', 'mixed', 'hummingbird',
  'Low-poly butterfly with colorful wings'),
  
('community_leader', 
  ARRAY['#FF8C00', '#FFA500', '#FFB347', '#FFDAB9'], 
  ARRAY['#CD5C5C', '#DC143C', '#B22222'],
  'medium', 'angular', 'shield',
  'Geometric figures representing people and unity'),
  
('climate_hero', 
  ARRAY['#FFD700', '#FFA500', '#FF8C00', '#FF6347'], 
  ARRAY['#DC143C', '#B22222', '#8B0000'],
  'complex', 'mixed', 'star',
  'Angular star with radiating points'),
  
('forest_protector', 
  ARRAY['#228B22', '#32CD32', '#00FF00', '#7FFF00'], 
  ARRAY['#8B4513', '#A0522D', '#D2691E'],
  'complex', 'organic', 'tree',
  'Multiple geometric trees forming a forest'),
  
('green_ambassador', 
  ARRAY['#00FA9A', '#00FF7F', '#3CB371', '#2E8B57'], 
  ARRAY['#FFD700', '#FFA500', '#FF8C00'],
  'medium', 'mixed', 'hummingbird',
  'Geometric leaf with gold accent sparkles'),
  
('welcome_badge', 
  ARRAY['#20B2AA', '#48D1CC', '#40E0D0', '#7FFFD4'], 
  ARRAY['#FF6347', '#FF7F50', '#FFA07A'],
  'simple', 'organic', 'hummingbird',
  'Multi-colored geometric hummingbird for new users'),
  
('ganggreen_hero', 
  ARRAY['#FFD700', '#FFA500', '#FF8C00', '#32CD32'], 
  ARRAY['#4169E1', '#8A2BE2', '#DC143C'],
  'complex', 'mixed', 'star',
  'Premium multi-color star for hero badge holders')
ON CONFLICT (achievement_type) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR BADGE MIGRATION
-- ============================================================================

-- Function to create migration backup
CREATE OR REPLACE FUNCTION create_badge_backup(
  p_badge_id UUID,
  p_migration_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge_data JSONB;
BEGIN
  -- Get current badge data
  SELECT row_to_json(nft_badges.*)::jsonb INTO v_badge_data
  FROM nft_badges
  WHERE id = p_badge_id;
  
  IF v_badge_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert backup
  INSERT INTO badge_migration_backup (badge_id, migration_id, original_data)
  VALUES (p_badge_id, p_migration_id, v_badge_data)
  ON CONFLICT (badge_id, migration_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to restore badge from backup
CREATE OR REPLACE FUNCTION restore_badge_from_backup(
  p_badge_id UUID,
  p_migration_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_backup_data JSONB;
BEGIN
  -- Get backup data
  SELECT original_data INTO v_backup_data
  FROM badge_migration_backup
  WHERE badge_id = p_badge_id AND migration_id = p_migration_id;
  
  IF v_backup_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore badge data (excluding id and timestamps)
  UPDATE nft_badges SET
    badge_design_type = COALESCE((v_backup_data->>'badge_design_type')::VARCHAR, 'classic'),
    primary_colors = NULL,
    accent_colors = NULL,
    complexity_level = NULL,
    style_variant = NULL,
    svg_cache = NULL,
    cache_updated_at = NULL,
    migrated_at = NULL,
    migration_version = NULL
  WHERE id = p_badge_id;
  
  -- Mark backup as restored
  UPDATE badge_migration_backup
  SET restored = TRUE, restored_at = NOW()
  WHERE badge_id = p_badge_id AND migration_id = p_migration_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit(p_cache_key VARCHAR(255))
RETURNS VOID AS $$
BEGIN
  UPDATE badge_cache
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = NOW()
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM badge_cache
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on badge_migration_log
DROP TRIGGER IF EXISTS update_badge_migration_log_updated_at ON badge_migration_log;
CREATE TRIGGER update_badge_migration_log_updated_at
  BEFORE UPDATE ON badge_migration_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on geometric_badge_config
DROP TRIGGER IF EXISTS update_geometric_badge_config_updated_at ON geometric_badge_config;
CREATE TRIGGER update_geometric_badge_config_updated_at
  BEFORE UPDATE ON geometric_badge_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE badge_migration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_migration_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE geometric_badge_config ENABLE ROW LEVEL SECURITY;

-- Badge migration log policies (admins only)
CREATE POLICY "Admins can view migration logs" ON badge_migration_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage migration logs" ON badge_migration_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Badge cache policies (public read, system write)
CREATE POLICY "Badge cache is viewable by everyone" ON badge_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage badge cache" ON badge_cache
  FOR ALL USING (true);

-- Badge backup policies (admins only)
CREATE POLICY "Admins can view badge backups" ON badge_migration_backup
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "System can manage badge backups" ON badge_migration_backup
  FOR ALL USING (true);

-- Geometric badge config policies (public read, admins write)
CREATE POLICY "Geometric badge config is viewable by everyone" ON geometric_badge_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage geometric badge config" ON geometric_badge_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE nft_badges IS 'NFT badges with geometric design support. Enhanced with geometric metadata fields.';
COMMENT ON TABLE badge_migration_log IS 'Tracks badge migration operations from classic to geometric designs';
COMMENT ON TABLE badge_cache IS 'Caches rendered badge SVGs for performance optimization';
COMMENT ON TABLE badge_migration_backup IS 'Stores badge backups before migration for rollback capability';
COMMENT ON TABLE geometric_badge_config IS 'Configuration for geometric badge designs by achievement type';

COMMENT ON COLUMN nft_badges.badge_design_type IS 'Design type: geometric (new) or classic (legacy)';
COMMENT ON COLUMN nft_badges.primary_colors IS 'Array of primary colors for geometric badges';
COMMENT ON COLUMN nft_badges.accent_colors IS 'Array of accent colors for geometric badges';
COMMENT ON COLUMN nft_badges.complexity_level IS 'Geometric complexity: simple, medium, or complex';
COMMENT ON COLUMN nft_badges.style_variant IS 'Geometric style: angular, organic, or mixed';
COMMENT ON COLUMN nft_badges.svg_cache IS 'Cached SVG content for quick rendering';
COMMENT ON COLUMN nft_badges.cache_updated_at IS 'Timestamp when SVG cache was last updated';
COMMENT ON COLUMN nft_badges.migrated_at IS 'Timestamp when badge was migrated to geometric design';
COMMENT ON COLUMN nft_badges.migration_version IS 'Version number of migration applied';

COMMENT ON COLUMN badge_migration_log.migration_id IS 'Unique identifier for this migration run';
COMMENT ON COLUMN badge_migration_log.status IS 'Migration status: in_progress, completed, failed, or rolled_back';
COMMENT ON COLUMN badge_migration_log.batch_size IS 'Number of badges processed per batch';
COMMENT ON COLUMN badge_migration_log.options IS 'JSON configuration options for migration';
COMMENT ON COLUMN badge_migration_log.errors IS 'JSON array of errors encountered during migration';

COMMENT ON COLUMN badge_cache.cache_key IS 'Unique cache key based on badge parameters';
COMMENT ON COLUMN badge_cache.hit_count IS 'Number of times this cache entry has been accessed';
COMMENT ON COLUMN badge_cache.expires_at IS 'Expiration timestamp for cache entry';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify geometric badge configurations
SELECT 
  achievement_type,
  array_length(primary_colors, 1) as primary_color_count,
  array_length(accent_colors, 1) as accent_color_count,
  complexity,
  style,
  icon_type
FROM geometric_badge_config
ORDER BY achievement_type;

-- Check existing badges that need migration
SELECT 
  COUNT(*) as total_badges,
  COUNT(*) FILTER (WHERE badge_design_type = 'geometric') as geometric_badges,
  COUNT(*) FILTER (WHERE badge_design_type = 'classic' OR badge_design_type IS NULL) as classic_badges,
  COUNT(*) FILTER (WHERE migrated_at IS NOT NULL) as migrated_badges
FROM nft_badges;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 028 completed successfully';
  RAISE NOTICE 'Geometric badge system is now active';
  RAISE NOTICE 'Ready for badge migration';
  RAISE NOTICE '========================================';
END $$;
