-- Test database setup for V1.0 Major Release
-- This file contains the essential table structures needed for testing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (simplified for testing)
CREATE TABLE IF NOT EXISTS test_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS test_user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  age INTEGER CHECK (age >= 13 AND age <= 100),
  age_cohort VARCHAR(10) CHECK (age_cohort IN ('13-17', '18-24', '25-34', '35-49', '50+')),
  user_type VARCHAR(20) CHECK (user_type IN ('individual', 'corporate', 'community', 'partner')),
  green_coins INTEGER DEFAULT 0,
  trees_planted INTEGER DEFAULT 0,
  curation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communities table
CREATE TABLE IF NOT EXISTS test_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missions table
CREATE TABLE IF NOT EXISTS test_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  mission_type VARCHAR(50),
  organizer_id UUID,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  green_coin_reward INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content items for curation testing
CREATE TABLE IF NOT EXISTS test_content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  relevance_score DECIMAL DEFAULT 0,
  age_targeting TEXT[], -- Array of age cohorts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs for error handling testing
CREATE TABLE IF NOT EXISTS test_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_name VARCHAR(100),
  error_message TEXT,
  error_code VARCHAR(50),
  severity VARCHAR(20),
  user_id UUID,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Green coin transactions
CREATE TABLE IF NOT EXISTS test_green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20),
  amount INTEGER NOT NULL,
  source VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Planted trees
CREATE TABLE IF NOT EXISTS test_planted_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES test_users(id) ON DELETE CASCADE,
  species VARCHAR(100),
  planted_date DATE,
  location_name VARCHAR(200),
  location_coordinates POINT,
  health_status VARCHAR(20) DEFAULT 'healthy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better test performance
CREATE INDEX IF NOT EXISTS idx_test_user_profiles_user_id ON test_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_test_user_profiles_age_cohort ON test_user_profiles(age_cohort);
CREATE INDEX IF NOT EXISTS idx_test_missions_organizer_id ON test_missions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_test_missions_status ON test_missions(status);
CREATE INDEX IF NOT EXISTS idx_test_content_items_type ON test_content_items(type);
CREATE INDEX IF NOT EXISTS idx_test_error_logs_severity ON test_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_test_green_coin_transactions_user_id ON test_green_coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_planted_trees_user_id ON test_planted_trees(user_id);

-- Row Level Security (RLS) policies for testing
ALTER TABLE test_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_green_coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_planted_trees ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (simplified for testing)
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON test_user_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON test_user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON test_green_coin_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY IF NOT EXISTS "Users can view own trees" ON test_planted_trees
  FOR SELECT USING (auth.uid()::text = user_id::text);