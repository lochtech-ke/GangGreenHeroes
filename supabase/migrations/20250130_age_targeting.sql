-- Migration: Age Targeting for Content Creators
-- Description: Add age targeting capabilities to content creation
-- Requirements: B6.1, B6.3

-- Content age targeting table
CREATE TABLE IF NOT EXISTS content_age_targeting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120),
  max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120),
  target_cohorts TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_age_range CHECK (max_age >= min_age)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_content_targeting ON content_age_targeting(content_type, target_cohorts);
CREATE INDEX IF NOT EXISTS idx_content_targeting_content_id ON content_age_targeting(content_id, content_type);

-- Add age targeting columns to initiatives table
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120);
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120);
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];

-- Add age targeting columns to missions table
ALTER TABLE missions ADD COLUMN IF NOT EXISTS min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];

-- Add age targeting columns to learning_modules table
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120);
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120);
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];

-- Add age targeting columns to community_posts table
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120);
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];

-- Add age targeting columns to petitions table
ALTER TABLE petitions ADD COLUMN IF NOT EXISTS min_age INTEGER CHECK (min_age >= 13 AND min_age <= 120);
ALTER TABLE petitions ADD COLUMN IF NOT EXISTS max_age INTEGER CHECK (max_age >= 13 AND max_age <= 120);
ALTER TABLE petitions ADD COLUMN IF NOT EXISTS target_cohorts TEXT[];

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_age_targeting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_content_age_targeting_updated_at
  BEFORE UPDATE ON content_age_targeting
  FOR EACH ROW
  EXECUTE FUNCTION update_age_targeting_updated_at();

-- Enable RLS on content_age_targeting
ALTER TABLE content_age_targeting ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read age targeting
CREATE POLICY "Anyone can read age targeting"
  ON content_age_targeting
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert age targeting for their content
CREATE POLICY "Users can insert age targeting for their content"
  ON content_age_targeting
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update age targeting for their content
CREATE POLICY "Users can update age targeting for their content"
  ON content_age_targeting
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can delete age targeting for their content
CREATE POLICY "Users can delete age targeting for their content"
  ON content_age_targeting
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Comments for documentation
COMMENT ON TABLE content_age_targeting IS 'Stores age targeting information for content items';
COMMENT ON COLUMN content_age_targeting.content_id IS 'ID of the content item being targeted';
COMMENT ON COLUMN content_age_targeting.content_type IS 'Type of content (initiative, mission, learning_module, etc.)';
COMMENT ON COLUMN content_age_targeting.min_age IS 'Minimum age for target audience (13-120)';
COMMENT ON COLUMN content_age_targeting.max_age IS 'Maximum age for target audience (13-120)';
COMMENT ON COLUMN content_age_targeting.target_cohorts IS 'Array of target age cohorts (13-17, 18-24, 25-34, 35-49, 50+)';
