-- Migration: Add cache hit count increment function
-- Description: Creates a function to atomically increment cache hit counts
-- Date: 2025-11-27

-- Create function to increment cache hit count
CREATE OR REPLACE FUNCTION increment_cache_hit_count(p_cache_key VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE badge_cache
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = NOW()
  WHERE cache_key = p_cache_key;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION increment_cache_hit_count IS 'Atomically increments the hit count for a cached badge';
