-- Educational System Migration
-- Creates tables for learning modules, lessons, progress tracking, and certificates

-- Learning modules table
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('conservation', 'waste', 'water', 'climate_justice', 'policy')),
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER, -- in minutes
  green_coin_reward INTEGER DEFAULT 0,
  badge_reward VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  media_type VARCHAR(20) CHECK (media_type IN ('text', 'video', 'infographic', 'interactive')),
  media_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User learning progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed_lessons UUID[] DEFAULT '{}',
  quiz_score INTEGER,
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, module_id)
);

-- Daily nuggets table
CREATE TABLE IF NOT EXISTS daily_nuggets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  source VARCHAR(200),
  category VARCHAR(50),
  date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_modules_category ON learning_modules(category);
CREATE INDEX IF NOT EXISTS idx_learning_modules_difficulty ON learning_modules(difficulty);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module ON user_learning_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_daily_nuggets_date ON daily_nuggets(date);

-- Create function to increment Green Coins
CREATE OR REPLACE FUNCTION increment_green_coins(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update or insert wallet balance
  INSERT INTO green_coin_wallets (user_id, balance, lifetime_earnings, last_updated)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = green_coin_wallets.balance + p_amount,
    lifetime_earnings = green_coin_wallets.lifetime_earnings + p_amount,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update module progress timestamp
CREATE OR REPLACE FUNCTION update_learning_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for progress updates
CREATE TRIGGER update_learning_progress_timestamp_trigger
BEFORE UPDATE ON user_learning_progress
FOR EACH ROW
EXECUTE FUNCTION update_learning_progress_timestamp();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nuggets ENABLE ROW LEVEL SECURITY;

-- Learning modules: Public read access
CREATE POLICY "Learning modules are viewable by everyone"
  ON learning_modules FOR SELECT
  USING (true);

-- Lessons: Public read access
CREATE POLICY "Lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (true);

-- User progress: Users can view and update their own progress
CREATE POLICY "Users can view their own progress"
  ON user_learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Daily nuggets: Public read access
CREATE POLICY "Daily nuggets are viewable by everyone"
  ON daily_nuggets FOR SELECT
  USING (true);

-- Insert sample learning modules
INSERT INTO learning_modules (title, description, category, difficulty, duration, green_coin_reward) VALUES
  (
    'Introduction to Climate Action',
    'Learn the basics of climate change and how you can make a difference in your community.',
    'conservation',
    'beginner',
    15,
    50
  ),
  (
    'Waste Management Fundamentals',
    'Discover effective waste management strategies and the importance of recycling and composting.',
    'waste',
    'beginner',
    20,
    75
  ),
  (
    'Water Conservation Techniques',
    'Explore practical methods for conserving water in your daily life and community.',
    'water',
    'intermediate',
    25,
    100
  ),
  (
    'Climate Justice and Equity',
    'Understand the social dimensions of climate change and how it affects different communities.',
    'climate_justice',
    'intermediate',
    30,
    125
  ),
  (
    'Environmental Policy and Advocacy',
    'Learn how to engage with policy makers and advocate for environmental protection.',
    'policy',
    'advanced',
    35,
    150
  );

-- Insert sample lessons for the first module
INSERT INTO lessons (module_id, title, content, media_type, order_index)
SELECT 
  id,
  'What is Climate Change?',
  '<p>Climate change refers to long-term shifts in global temperatures and weather patterns. While climate change is a natural phenomenon, scientific evidence shows that human activities have been the main driver of climate change since the 1800s.</p><p>The primary cause is the burning of fossil fuels like coal, oil, and gas, which produces heat-trapping gases.</p>',
  'text',
  1
FROM learning_modules WHERE title = 'Introduction to Climate Action'
UNION ALL
SELECT 
  id,
  'The Impact of Climate Change',
  '<p>Climate change affects every aspect of our lives, from the food we eat to the air we breathe. Rising temperatures lead to more extreme weather events, including droughts, floods, and hurricanes.</p><p>In Kenya, climate change threatens agriculture, water resources, and biodiversity.</p>',
  'text',
  2
FROM learning_modules WHERE title = 'Introduction to Climate Action'
UNION ALL
SELECT 
  id,
  'What Can You Do?',
  '<p>Individual actions matter! You can help combat climate change by:</p><ul><li>Planting trees and protecting forests</li><li>Reducing waste and recycling</li><li>Conserving water and energy</li><li>Supporting sustainable businesses</li><li>Advocating for climate policies</li></ul>',
  'text',
  3
FROM learning_modules WHERE title = 'Introduction to Climate Action';

-- Insert sample daily nuggets
INSERT INTO daily_nuggets (content, source, category, date) VALUES
  (
    'A single tree can absorb up to 48 pounds of carbon dioxide per year and can sequester 1 ton of CO2 by the time it reaches 40 years old.',
    'USDA Forest Service',
    'conservation',
    CURRENT_DATE
  ),
  (
    'Recycling one aluminum can saves enough energy to power a laptop for 3 hours.',
    'EPA',
    'waste',
    CURRENT_DATE - INTERVAL '1 day'
  ),
  (
    'A dripping faucet can waste up to 3,000 gallons of water per year.',
    'EPA WaterSense',
    'water',
    CURRENT_DATE - INTERVAL '2 days'
  );

-- Grant necessary permissions
GRANT SELECT ON learning_modules TO anon, authenticated;
GRANT SELECT ON lessons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON user_learning_progress TO authenticated;
GRANT SELECT ON daily_nuggets TO anon, authenticated;

-- Comment on tables
COMMENT ON TABLE learning_modules IS 'Educational modules covering various climate topics';
COMMENT ON TABLE lessons IS 'Individual lessons within learning modules';
COMMENT ON TABLE user_learning_progress IS 'Tracks user progress through learning modules';
COMMENT ON TABLE daily_nuggets IS 'Daily environmental facts and tips';
