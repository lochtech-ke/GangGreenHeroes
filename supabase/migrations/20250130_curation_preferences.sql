-- Migration: Add curation preferences to user profiles
-- Requirements: B5.2, B5.3, B5.4

-- Add curation preference columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS curation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS curation_preferences JSONB DEFAULT '{"allow_age_based": true, "allow_engagement_tracking": true}'::jsonb;

-- Add needs_recalculation flag to relevance_scores for age updates
ALTER TABLE relevance_scores
ADD COLUMN IF NOT EXISTS needs_recalculation BOOLEAN DEFAULT false;

-- Create index for efficient recalculation queries
CREATE INDEX IF NOT EXISTS idx_relevance_scores_recalculation 
ON relevance_scores(user_id, needs_recalculation) 
WHERE needs_recalculation = true;

-- Add comment explaining the columns
COMMENT ON COLUMN user_profiles.curation_enabled IS 'Master toggle for content curation - when false, user sees chronological feed';
COMMENT ON COLUMN user_profiles.curation_preferences IS 'Fine-grained curation preferences: allow_age_based, allow_engagement_tracking';
COMMENT ON COLUMN relevance_scores.needs_recalculation IS 'Flag set when user age/cohort changes, triggering score recalculation';
