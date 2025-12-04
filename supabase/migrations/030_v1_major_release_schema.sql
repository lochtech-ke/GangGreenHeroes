-- Migration: V1.0 Major Release Database Schema
-- Description: Creates comprehensive schema for Platform Vision 2025, Age-Based Content Curation, and Error Handling
-- Requirements: A1.1, A1.2, B5.5, C1.1

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- SECTION 1: ENHANCE EXISTING TABLES FOR V1.0
-- ============================================================================

-- Enhance users table with V1.0 fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'individual' 
  CHECK (user_type IN ('individual', 'corporate', 'community', 'partner'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS journey_stage VARCHAR(20) DEFAULT 'onboarding'
  CHECK (journey_stage IN ('onboarding', 'engagement', 'contribution', 'recognition', 'hero'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_tier VARCHAR(20) DEFAULT 'steward'
  CHECK (badge_tier IN ('steward', 'platinum', 'hero'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending'
  CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Enhance user_profiles table with V1.0 fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age > 0 AND age <= 120);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_cohort VARCHAR(10) 
  CHECK (age_cohort IN ('13-17', '18-24', '25-34', '35-49', '50+'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_curation_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS county VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS sub_county VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ============================================================================
-- SECTION 2: PLATFORM VISION TABLES
-- ============================================================================

-- User climate interests
CREATE TABLE IF NOT EXISTS user_climate_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interest VARCHAR(20) CHECK (interest IN ('trees', 'water', 'waste', 'policy')),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, interest)
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  county VARCHAR(50),
  sub_county VARCHAR(50),
  focus_areas TEXT[],
  member_count INTEGER DEFAULT 0,
  activity_level VARCHAR(20) DEFAULT 'low' CHECK (activity_level IN ('low', 'medium', 'high')),
  avatar_url TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  links TEXT[],
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning modules
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('conservation', 'waste', 'water', 'climate_justice', 'policy')),
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER, -- in minutes
  green_coin_reward INTEGER DEFAULT 0,
  badge_reward VARCHAR(50),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  media_type VARCHAR(20) CHECK (media_type IN ('text', 'video', 'infographic', 'interactive')),
  media_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User learning progress
CREATE TABLE IF NOT EXISTS user_learning_progress (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  completed_lessons UUID[],
  quiz_score INTEGER,
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  PRIMARY KEY (user_id, module_id)
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  mission_type VARCHAR(50) CHECK (mission_type IN ('tree_planting', 'waste_cleanup', 'water_conservation', 'petition', 'fundraising')),
  organizer_id UUID REFERENCES users(id),
  location_name VARCHAR(200),
  location_coordinates GEOGRAPHY(POINT, 4326),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_metric VARCHAR(50),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  max_participants INTEGER,
  green_coin_reward INTEGER DEFAULT 0,
  verification_required BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mission participations
CREATE TABLE IF NOT EXISTS mission_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  contribution_metric VARCHAR(50),
  contribution_value NUMERIC,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMP,
  UNIQUE(mission_id, user_id)
);

-- Verification evidence
CREATE TABLE IF NOT EXISTS verification_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID, -- Can reference missions, learning modules, etc.
  action_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  evidence_type VARCHAR(20) CHECK (evidence_type IN ('photo', 'video', 'gps', 'document')),
  files JSONB NOT NULL, -- Array of {url, metadata: {gpsCoordinates, timestamp}}
  description TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Verification reviews
CREATE TABLE IF NOT EXISTS verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id UUID REFERENCES verification_evidence(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  reviewer_organization VARCHAR(50) CHECK (reviewer_organization IN ('GBM', 'WMF', 'KFS', 'community_leader')),
  status VARCHAR(20) CHECK (status IN ('approved', 'rejected', 'needs_more_info')),
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Green Coin wallets
CREATE TABLE IF NOT EXISTS green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Green Coin transactions
CREATE TABLE IF NOT EXISTS green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral')),
  amount INTEGER NOT NULL,
  source VARCHAR(100),
  description TEXT,
  reference_id UUID, -- Can reference missions, learning modules, etc.
  reference_type VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Planted trees
CREATE TABLE IF NOT EXISTS planted_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  species VARCHAR(100) NOT NULL,
  planted_date DATE NOT NULL,
  location_name VARCHAR(200),
  location_coordinates GEOGRAPHY(POINT, 4326),
  health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'needs_attention', 'deceased')),
  height_cm NUMERIC,
  diameter_cm NUMERIC,
  last_measured TIMESTAMP,
  estimated_co2_kg_per_year NUMERIC,
  antugrow_tree_id VARCHAR(100), -- External reference
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tree photos
CREATE TABLE IF NOT EXISTS tree_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID REFERENCES planted_trees(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  captured_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- GPS, camera info, etc.
);

-- Enhanced badges table (extending existing)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(20) CHECK (tier IN ('steward', 'platinum', 'hero')),
  icon_type VARCHAR(20) CHECK (icon_type IN ('hummingbird', 'tree', 'water', 'shield', 'star')),
  criteria JSONB NOT NULL, -- {metric: string, threshold: number}[]
  earned_by_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, badge_id)
);

-- User streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_type VARCHAR(20) DEFAULT 'daily' CHECK (streak_type IN ('daily', 'weekly', 'monthly'))
);

-- Ambassadors
CREATE TABLE IF NOT EXISTS ambassadors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  application_date TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  county VARCHAR(50),
  sub_county VARCHAR(50),
  specializations TEXT[],
  events_organized INTEGER DEFAULT 0,
  members_referred INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended'))
);

-- Petitions
CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_audience VARCHAR(20) CHECK (target_audience IN ('county', 'national', 'international')),
  target_organization VARCHAR(200),
  signature_goal INTEGER,
  current_signatures INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Petition signatures
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signed_at TIMESTAMP DEFAULT NOW(),
  public_display BOOLEAN DEFAULT TRUE,
  UNIQUE (petition_id, user_id)
);

-- AI Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context JSONB, -- User interests, age cohort, current page, recent actions
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: CONTENT CURATION TABLES
-- ============================================================================

-- Content age targeting
CREATE TABLE IF NOT EXISTS content_age_targeting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('initiative', 'social_post', 'challenge', 'educational', 'mission', 'community_post', 'petition')),
  min_age INTEGER CHECK (min_age > 0 AND min_age <= 120),
  max_age INTEGER CHECK (max_age > 0 AND max_age <= 120),
  target_cohorts TEXT[] CHECK (target_cohorts <@ ARRAY['13-17', '18-24', '25-34', '35-49', '50+']),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_age_range CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
);

-- Curation rules
CREATE TABLE IF NOT EXISTS curation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL CHECK (cohort IN ('13-17', '18-24', '25-34', '35-49', '50+')),
  rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('filter', 'boost', 'suppress', 'require')),
  condition JSONB NOT NULL, -- {field: string, operator: string, value: any}
  action JSONB NOT NULL, -- {type: string, value: number, reason: string}
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content interactions
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('initiative', 'social_post', 'challenge', 'educational', 'mission', 'community_post', 'petition')),
  interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('impression', 'click', 'save', 'join', 'share', 'complete')),
  age_cohort VARCHAR(10) CHECK (age_cohort IN ('13-17', '18-24', '25-34', '35-49', '50+')),
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Additional context like duration, source, etc.
);

-- Relevance scores cache
CREATE TABLE IF NOT EXISTS relevance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('initiative', 'social_post', 'challenge', 'educational', 'mission', 'community_post', 'petition')),
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, content_id, content_type)
);

-- Cohort engagement metrics
CREATE TABLE IF NOT EXISTS cohort_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL CHECK (cohort IN ('13-17', '18-24', '25-34', '35-49', '50+')),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('initiative', 'social_post', 'challenge', 'educational', 'mission', 'community_post', 'petition')),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  joins INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  avg_engagement_seconds INTEGER DEFAULT 0,
  UNIQUE(cohort, content_type, date)
);

-- ============================================================================
-- SECTION 4: ERROR HANDLING TABLES
-- ============================================================================

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  error_type VARCHAR(50) NOT NULL CHECK (error_type IN ('network', 'validation', 'authentication', 'database', 'runtime', 'web3', 'badge', 'curation')),
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  stack_trace TEXT,
  user_id UUID REFERENCES users(id),
  component VARCHAR(100),
  action VARCHAR(100),
  route VARCHAR(255),
  metadata JSONB, -- Additional context like user agent, IP, etc.
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Error analytics
CREATE TABLE IF NOT EXISTS error_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_users INTEGER DEFAULT 1,
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  average_resolution_time INTEGER, -- in minutes
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Circuit breaker state
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_key VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('closed', 'open', 'half_open')),
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP,
  opened_at TIMESTAMP,
  reset_at TIMESTAMP,
  config JSONB NOT NULL, -- {failureThreshold, resetTimeout, monitoringPeriod}
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================================================

-- User and profile indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_journey_stage ON users(journey_stage);
CREATE INDEX IF NOT EXISTS idx_users_badge_tier ON users(badge_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age_cohort ON user_profiles(age_cohort);
CREATE INDEX IF NOT EXISTS idx_user_profiles_age ON user_profiles(age);
CREATE INDEX IF NOT EXISTS idx_user_profiles_county ON user_profiles(county);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);

-- Platform feature indexes
CREATE INDEX IF NOT EXISTS idx_communities_county ON communities(county);
CREATE INDEX IF NOT EXISTS idx_communities_activity_level ON communities(activity_level);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_modules_category ON learning_modules(category);
CREATE INDEX IF NOT EXISTS idx_learning_modules_difficulty ON learning_modules(difficulty);
CREATE INDEX IF NOT EXISTS idx_learning_modules_published ON learning_modules(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_organizer ON missions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_missions_location ON missions USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_missions_dates ON missions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_verification_evidence_user ON verification_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_evidence_action ON verification_evidence(action_id, action_type);
CREATE INDEX IF NOT EXISTS idx_verification_reviews_evidence ON verification_reviews(evidence_id);

CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_user ON green_coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_type ON green_coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_timestamp ON green_coin_transactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_planted_trees_user ON planted_trees(user_id);
CREATE INDEX IF NOT EXISTS idx_planted_trees_location ON planted_trees USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_planted_trees_health ON planted_trees(health_status);
CREATE INDEX IF NOT EXISTS idx_planted_trees_planted_date ON planted_trees(planted_date);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_petitions_deadline ON petitions(deadline);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_petition ON petition_signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_user ON petition_signatures(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);

-- Content curation indexes
CREATE INDEX IF NOT EXISTS idx_content_age_targeting_content ON content_age_targeting(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_age_targeting_cohorts ON content_age_targeting USING GIN(target_cohorts);
CREATE INDEX IF NOT EXISTS idx_curation_rules_cohort ON curation_rules(cohort);
CREATE INDEX IF NOT EXISTS idx_curation_rules_active ON curation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content ON content_interactions(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_cohort_time ON content_interactions(age_cohort, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_user ON relevance_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_content ON relevance_scores(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_score ON relevance_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_relevance_scores_expires ON relevance_scores(expires_at);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_cohort_date ON cohort_engagement_metrics(cohort, date DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_content_type ON cohort_engagement_metrics(content_type);

-- Error handling indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_analytics_code ON error_analytics(error_code);
CREATE INDEX IF NOT EXISTS idx_error_analytics_updated ON error_analytics(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_key ON circuit_breaker_state(operation_key);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_state ON circuit_breaker_state(state);

-- ============================================================================
-- SECTION 6: UTILITY FUNCTIONS
-- ============================================================================

-- Function to calculate age cohort from age
CREATE OR REPLACE FUNCTION calculate_age_cohort(user_age INTEGER)
RETURNS VARCHAR(10) AS $$
BEGIN
  IF user_age BETWEEN 13 AND 17 THEN
    RETURN '13-17';
  ELSIF user_age BETWEEN 18 AND 24 THEN
    RETURN '18-24';
  ELSIF user_age BETWEEN 25 AND 34 THEN
    RETURN '25-34';
  ELSIF user_age BETWEEN 35 AND 49 THEN
    RETURN '35-49';
  ELSIF user_age >= 50 THEN
    RETURN '50+';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update age cohort when age changes
CREATE OR REPLACE FUNCTION update_age_cohort()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.age IS NOT NULL AND (OLD.age IS NULL OR NEW.age <> OLD.age) THEN
    NEW.age_cohort := calculate_age_cohort(NEW.age);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update age cohort
DROP TRIGGER IF EXISTS trigger_update_age_cohort ON user_profiles;
CREATE TRIGGER trigger_update_age_cohort
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_age_cohort();

-- Function to update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities 
    SET member_count = member_count - 1 
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for community member count
DROP TRIGGER IF EXISTS trigger_community_member_count ON community_members;
CREATE TRIGGER trigger_community_member_count
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION update_community_member_count();

-- Function to update petition signature count
CREATE OR REPLACE FUNCTION update_petition_signature_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE petitions 
    SET current_signatures = current_signatures + 1 
    WHERE id = NEW.petition_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE petitions 
    SET current_signatures = current_signatures - 1 
    WHERE id = OLD.petition_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for petition signature count
DROP TRIGGER IF EXISTS trigger_petition_signature_count ON petition_signatures;
CREATE TRIGGER trigger_petition_signature_count
  AFTER INSERT OR DELETE ON petition_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_petition_signature_count();

-- Function to clean up expired relevance scores
CREATE OR REPLACE FUNCTION cleanup_expired_relevance_scores()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM relevance_scores
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's content curation preferences
CREATE OR REPLACE FUNCTION get_user_curation_preferences(user_uuid UUID)
RETURNS TABLE (
  age_cohort VARCHAR(10),
  curation_enabled BOOLEAN,
  climate_interests TEXT[],
  interaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.age_cohort,
    up.age_curation_enabled,
    ARRAY_REMOVE(ARRAY_AGG(uci.interest), NULL) as climate_interests,
    COALESCE(ci.interaction_count, 0) as interaction_count
  FROM user_profiles up
  LEFT JOIN user_climate_interests uci ON up.id = uci.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as interaction_count
    FROM content_interactions
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) ci ON up.id = ci.user_id
  WHERE up.id = user_uuid
  GROUP BY up.age_cohort, up.age_curation_enabled, ci.interaction_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE user_climate_interests IS 'Stores user climate action interests for personalization';
COMMENT ON TABLE communities IS 'Local and thematic communities for user engagement';
COMMENT ON TABLE community_members IS 'Community membership with roles';
COMMENT ON TABLE community_posts IS 'User-generated content within communities';
COMMENT ON TABLE learning_modules IS 'Educational content modules with rewards';
COMMENT ON TABLE lessons IS 'Individual lessons within learning modules';
COMMENT ON TABLE user_learning_progress IS 'Tracks user progress through learning modules';
COMMENT ON TABLE missions IS 'Climate action missions and challenges';
COMMENT ON TABLE mission_participations IS 'User participation in missions';
COMMENT ON TABLE verification_evidence IS 'Evidence submitted for action verification';
COMMENT ON TABLE verification_reviews IS 'Expert reviews of submitted evidence';
COMMENT ON TABLE green_coin_wallets IS 'User virtual currency wallets';
COMMENT ON TABLE green_coin_transactions IS 'All Green Coin transactions';
COMMENT ON TABLE planted_trees IS 'Digital tree wallet entries';
COMMENT ON TABLE tree_photos IS 'Photos of planted trees over time';
COMMENT ON TABLE badges IS 'Achievement badges with criteria';
COMMENT ON TABLE user_badges IS 'User badge achievements';
COMMENT ON TABLE user_streaks IS 'User activity streaks';
COMMENT ON TABLE ambassadors IS 'Community ambassadors and leaders';
COMMENT ON TABLE petitions IS 'Policy engagement petitions';
COMMENT ON TABLE petition_signatures IS 'User petition signatures';
COMMENT ON TABLE chat_messages IS 'AI Climate Companion chat history';
COMMENT ON TABLE content_age_targeting IS 'Age targeting metadata for content';
COMMENT ON TABLE curation_rules IS 'Rules for age-based content curation';
COMMENT ON TABLE content_interactions IS 'User interactions with content for analytics';
COMMENT ON TABLE relevance_scores IS 'Cached relevance scores for content curation';
COMMENT ON TABLE cohort_engagement_metrics IS 'Engagement metrics by age cohort';
COMMENT ON TABLE error_logs IS 'Application error logs with context';
COMMENT ON TABLE error_analytics IS 'Aggregated error analytics';
COMMENT ON TABLE circuit_breaker_state IS 'Circuit breaker state for error recovery';

-- Function comments
COMMENT ON FUNCTION calculate_age_cohort IS 'Calculates age cohort from user age';
COMMENT ON FUNCTION update_age_cohort IS 'Trigger function to update age cohort when age changes';
COMMENT ON FUNCTION update_community_member_count IS 'Maintains community member count';
COMMENT ON FUNCTION update_petition_signature_count IS 'Maintains petition signature count';
COMMENT ON FUNCTION cleanup_expired_relevance_scores IS 'Removes expired relevance score cache entries';
COMMENT ON FUNCTION get_user_curation_preferences IS 'Gets user preferences for content curation';
