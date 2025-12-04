-- Migration: Add onboarding progress tracking
-- Description: Tracks user progress through onboarding steps with AI guidance
-- Requirements: A2.3 - WHEN a user needs guidance THEN the Platform SHALL suggest appropriate onboarding steps

-- Create onboarding progress table
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  journey_stage VARCHAR(20) DEFAULT 'onboarding',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON user_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_stage ON user_onboarding_progress(journey_stage);

-- Add RLS policies
ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding progress
CREATE POLICY "Users can view own onboarding progress"
  ON user_onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own onboarding progress
CREATE POLICY "Users can update own onboarding progress"
  ON user_onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own onboarding progress
CREATE POLICY "Users can insert own onboarding progress"
  ON user_onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_progress_timestamp
  BEFORE UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress_updated_at();

-- Add comment
COMMENT ON TABLE user_onboarding_progress IS 'Tracks user progress through AI-guided onboarding steps';
