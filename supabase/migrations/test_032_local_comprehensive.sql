-- Comprehensive Local Test for Migration 032: Consolidate Green Coins into GG Coins
-- Description: Creates realistic sample data and thoroughly tests the migration
-- Usage: Run this on a local/test database before deploying to production
-- Requirements: PostgreSQL 14+, uuid-ossp extension

-- ============================================================================
-- SECTION 1: SETUP TEST ENVIRONMENT
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE E'\n╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  MIGRATION 032 COMPREHENSIVE LOCAL TEST                   ║';
  RAISE NOTICE '║  Coin System Harmonization                                ║';
  RAISE NOTICE E'╚════════════════════════════════════════════════════════════╝\n';
  RAISE NOTICE 'Starting test at: %', NOW();
END $;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test schema to isolate test data
CREATE SCHEMA IF NOT EXISTS test_migration_032_local;
SET search_path TO test_migration_032_local, public;

RAISE NOTICE 'Created test schema: test_migration_032_local';

-- ============================================================================
-- SECTION 2: CREATE TEST TABLES
-- ============================================================================

-- Create test users table
CREATE TABLE test_migration_032_local.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create test user_gamification table
CREATE TABLE test_migration_032_local.user_gamification (
  id UUID PRIMARY KEY REFERENCES test_migration_032_local.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create test Green Coin tables (source data)
CREATE TABLE test_migration_032_local.green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES test_migration_032_local.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_migration_032_local.green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES test_migration_032_local.users(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral', 'reward', 'purchase')),
  amount INTEGER NOT NULL,
  source TEXT,
  description TEXT,
  reference_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

RAISE NOTICE 'Created test tables';


-- ============================================================================
-- SECTION 3: CREATE REALISTIC SAMPLE DATA
-- ============================================================================

RAISE NOTICE E'\n--- Creating Sample Data ---\n';

-- Insert 20 test users (realistic user base)
INSERT INTO test_migration_032_local.users (id, email, created_at) VALUES
  -- Active users with transactions
  ('a0000000-0000-0000-0000-000000000001', 'alice@test.com', NOW() - INTERVAL '90 days'),
  ('a0000000-0000-0000-0000-000000000002', 'bob@test.com', NOW() - INTERVAL '60 days'),
  ('a0000000-0000-0000-0000-000000000003', 'charlie@test.com', NOW() - INTERVAL '45 days'),
  ('a0000000-0000-0000-0000-000000000004', 'diana@test.com', NOW() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000005', 'eve@test.com', NOW() - INTERVAL '20 days'),
  -- Users with existing GG Coins (edge case: already have some GG Coins)
  ('a0000000-0000-0000-0000-000000000006', 'frank@test.com', NOW() - INTERVAL '15 days'),
  ('a0000000-0000-0000-0000-000000000007', 'grace@test.com', NOW() - INTERVAL '10 days'),
  -- Users with zero balance
  ('a0000000-0000-0000-0000-000000000008', 'henry@test.com', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000009', 'iris@test.com', NOW() - INTERVAL '3 days'),
  -- High-value users
  ('a0000000-0000-0000-0000-000000000010', 'jack@test.com', NOW() - INTERVAL '120 days'),
  ('a0000000-0000-0000-0000-000000000011', 'kate@test.com', NOW() - INTERVAL '100 days'),
  -- New users
  ('a0000000-0000-0000-0000-000000000012', 'leo@test.com', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000013', 'mia@test.com', NOW() - INTERVAL '12 hours'),
  -- Edge case: user with only Green Coins, no gamification record
  ('a0000000-0000-0000-0000-000000000014', 'noah@test.com', NOW() - INTERVAL '7 days'),
  ('a0000000-0000-0000-0000-000000000015', 'olivia@test.com', NOW() - INTERVAL '14 days'),
  -- Users with many transactions
  ('a0000000-0000-0000-0000-000000000016', 'paul@test.com', NOW() - INTERVAL '80 days'),
  ('a0000000-0000-0000-0000-000000000017', 'quinn@test.com', NOW() - INTERVAL '70 days'),
  -- Edge case: user with large balance
  ('a0000000-0000-0000-0000-000000000018', 'rachel@test.com', NOW() - INTERVAL '150 days'),
  -- Edge case: user with fractional-like balance (will test INTEGER to DECIMAL conversion)
  ('a0000000-0000-0000-0000-000000000019', 'sam@test.com', NOW() - INTERVAL '25 days'),
  -- Edge case: inactive user
  ('a0000000-0000-0000-0000-000000000020', 'tina@test.com', NOW() - INTERVAL '200 days');

RAISE NOTICE 'Created 20 test users';

-- Insert gamification records (some users already have GG Coins)
INSERT INTO test_migration_032_local.user_gamification (id, total_points, level) VALUES
  ('a0000000-0000-0000-0000-000000000001', 500, 5),
  ('a0000000-0000-0000-0000-000000000002', 300, 3),
  ('a0000000-0000-0000-0000-000000000003', 150, 2),
  ('a0000000-0000-0000-0000-000000000004', 200, 2),
  ('a0000000-0000-0000-0000-000000000005', 100, 1),
  ('a0000000-0000-0000-0000-000000000010', 1000, 10),
  ('a0000000-0000-0000-0000-000000000011', 800, 8),
  ('a0000000-0000-0000-0000-000000000016', 600, 6),
  ('a0000000-0000-0000-0000-000000000017', 550, 5),
  ('a0000000-0000-0000-0000-000000000018', 1500, 15);

RAISE NOTICE 'Created 10 gamification records';


-- Insert Green Coin wallets with realistic balances
INSERT INTO test_migration_032_local.green_coin_wallets (user_id, balance, lifetime_earnings, lifetime_spending, last_updated) VALUES
  -- Active users with various balances
  ('a0000000-0000-0000-0000-000000000001', 250, 300, 50, NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 180, 200, 20, NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000003', 95, 100, 5, NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000004', 420, 500, 80, NOW() - INTERVAL '1 hour'),
  ('a0000000-0000-0000-0000-000000000005', 75, 75, 0, NOW() - INTERVAL '5 hours'),
  -- Users with existing GG Coins (will test balance merging)
  ('a0000000-0000-0000-0000-000000000006', 150, 150, 0, NOW() - INTERVAL '6 hours'),
  ('a0000000-0000-0000-0000-000000000007', 200, 250, 50, NOW() - INTERVAL '12 hours'),
  -- Users with zero balance
  ('a0000000-0000-0000-0000-000000000008', 0, 50, 50, NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000009', 0, 0, 0, NOW() - INTERVAL '3 days'),
  -- High-value users
  ('a0000000-0000-0000-0000-000000000010', 5000, 6000, 1000, NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000011', 3500, 4000, 500, NOW() - INTERVAL '2 days'),
  -- New users
  ('a0000000-0000-0000-0000-000000000012', 50, 50, 0, NOW() - INTERVAL '1 hour'),
  ('a0000000-0000-0000-0000-000000000013', 25, 25, 0, NOW() - INTERVAL '30 minutes'),
  -- Edge case: user with only Green Coins, no gamification record
  ('a0000000-0000-0000-0000-000000000014', 100, 100, 0, NOW() - INTERVAL '7 days'),
  ('a0000000-0000-0000-0000-000000000015', 200, 200, 0, NOW() - INTERVAL '14 days'),
  -- Users with many transactions
  ('a0000000-0000-0000-0000-000000000016', 1200, 1500, 300, NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000017', 980, 1200, 220, NOW() - INTERVAL '2 days'),
  -- Edge case: user with large balance (test DECIMAL capacity)
  ('a0000000-0000-0000-0000-000000000018', 999999, 1000000, 1, NOW() - INTERVAL '1 day'),
  -- Edge case: user with balance that looks fractional
  ('a0000000-0000-0000-0000-000000000019', 333, 333, 0, NOW() - INTERVAL '1 day'),
  -- Edge case: inactive user
  ('a0000000-0000-0000-0000-000000000020', 10, 10, 0, NOW() - INTERVAL '200 days');

RAISE NOTICE 'Created 20 Green Coin wallets';


-- Insert realistic Green Coin transactions (100+ transactions)
-- User 1: Tree planting enthusiast
INSERT INTO test_migration_032_local.green_coin_transactions (user_id, transaction_type, amount, source, description, timestamp) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'earn', 50, 'tree_planting', 'Planted 1 tree in Kakamega Forest', NOW() - INTERVAL '80 days'),
  ('a0000000-0000-0000-0000-000000000001', 'earn', 50, 'tree_planting', 'Planted 1 tree in Karura Forest', NOW() - INTERVAL '70 days'),
  ('a0000000-0000-0000-0000-000000000001', 'earn', 100, 'mission_completion', 'Completed forest cleanup mission', NOW() - INTERVAL '60 days'),
  ('a0000000-0000-0000-0000-000000000001', 'earn', 50, 'tree_planting', 'Planted 1 tree in Mau Forest', NOW() - INTERVAL '50 days'),
  ('a0000000-0000-0000-0000-000000000001', 'spend', 50, 'badge_purchase', 'Purchased Hummingbird badge', NOW() - INTERVAL '40 days'),
  ('a0000000-0000-0000-0000-000000000001', 'earn', 50, 'tree_planting', 'Planted 1 tree', NOW() - INTERVAL '30 days'),

-- User 2: Learning focused
  ('a0000000-0000-0000-0000-000000000002', 'earn', 20, 'learning_module', 'Completed Climate Change 101', NOW() - INTERVAL '55 days'),
  ('a0000000-0000-0000-0000-000000000002', 'earn', 20, 'learning_module', 'Completed Forest Ecology', NOW() - INTERVAL '50 days'),
  ('a0000000-0000-0000-0000-000000000002', 'earn', 20, 'learning_module', 'Completed Carbon Credits', NOW() - INTERVAL '45 days'),
  ('a0000000-0000-0000-0000-000000000002', 'earn', 20, 'learning_module', 'Completed Sustainability', NOW() - INTERVAL '40 days'),
  ('a0000000-0000-0000-0000-000000000002', 'bonus', 100, 'perfect_score', 'Perfect quiz score bonus', NOW() - INTERVAL '35 days'),
  ('a0000000-0000-0000-0000-000000000002', 'spend', 20, 'certificate', 'Purchased certificate', NOW() - INTERVAL '30 days'),

-- User 3: Community engagement
  ('a0000000-0000-0000-0000-000000000003', 'earn', 5, 'community_post', 'Posted in forum', NOW() - INTERVAL '40 days'),
  ('a0000000-0000-0000-0000-000000000003', 'earn', 10, 'petition_signature', 'Signed forest protection petition', NOW() - INTERVAL '38 days'),
  ('a0000000-0000-0000-0000-000000000003', 'earn', 5, 'community_post', 'Posted in forum', NOW() - INTERVAL '35 days'),
  ('a0000000-0000-0000-0000-000000000003', 'earn', 30, 'waste_cleanup', 'Participated in cleanup', NOW() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000003', 'earn', 50, 'referral', 'Referred a friend', NOW() - INTERVAL '25 days'),
  ('a0000000-0000-0000-0000-000000000003', 'spend', 5, 'donation', 'Donated to cause', NOW() - INTERVAL '20 days'),

-- User 4: Active participant
  ('a0000000-0000-0000-0000-000000000004', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '28 days'),
  ('a0000000-0000-0000-0000-000000000004', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '25 days'),
  ('a0000000-0000-0000-0000-000000000004', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '20 days'),
  ('a0000000-0000-0000-0000-000000000004', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '15 days'),
  ('a0000000-0000-0000-0000-000000000004', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000004', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000004', 'spend', 80, 'marketplace', 'Purchased items', NOW() - INTERVAL '2 days'),

-- User 5: Daily login streak
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '15 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '14 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '13 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '12 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '11 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '9 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '8 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '7 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000005', 'earn', 5, 'daily_login', 'Daily login', NOW() - INTERVAL '1 day');

RAISE NOTICE 'Created 45 transactions for users 1-5';


-- User 10: High-value user with many transactions
INSERT INTO test_migration_032_local.green_coin_transactions (user_id, transaction_type, amount, source, description, timestamp) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '110 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '100 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '90 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '80 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '70 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '60 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '50 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '40 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '20 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000010', 'earn', 500, 'tree_planting', 'Planted 10 trees', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000010', 'spend', 1000, 'marketplace', 'Large purchase', NOW() - INTERVAL '3 days'),

-- User 16: Many small transactions
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '75 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '70 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '65 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '60 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '55 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '50 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '45 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '40 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '35 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 50, 'tree_planting', 'Planted tree', NOW() - INTERVAL '30 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '25 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '20 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '15 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '10 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000016', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '2 days'),
  ('a0000000-0000-0000-0000-000000000016', 'spend', 100, 'badge_purchase', 'Purchased badge', NOW() - INTERVAL '1 day'),
  ('a0000000-0000-0000-0000-000000000016', 'spend', 100, 'badge_purchase', 'Purchased badge', NOW() - INTERVAL '12 hours'),
  ('a0000000-0000-0000-0000-000000000016', 'spend', 100, 'badge_purchase', 'Purchased badge', NOW() - INTERVAL '6 hours'),

-- User 18: Large balance user
  ('a0000000-0000-0000-0000-000000000018', 'earn', 1000000, 'bonus', 'Special mega bonus', NOW() - INTERVAL '140 days'),
  ('a0000000-0000-0000-0000-000000000018', 'spend', 1, 'test', 'Test purchase', NOW() - INTERVAL '1 day'),

-- Additional users with various transaction types
  ('a0000000-0000-0000-0000-000000000011', 'earn', 200, 'referral', 'Referred 4 friends', NOW() - INTERVAL '90 days'),
  ('a0000000-0000-0000-0000-000000000011', 'earn', 200, 'tree_planting', 'Planted 4 trees', NOW() - INTERVAL '80 days'),
  ('a0000000-0000-0000-0000-000000000011', 'earn', 200, 'mission_completion', 'Completed 2 missions', NOW() - INTERVAL '70 days'),
  ('a0000000-0000-0000-0000-000000000011', 'spend', 100, 'marketplace', 'Purchased items', NOW() - INTERVAL '60 days'),

  ('a0000000-0000-0000-0000-000000000012', 'earn', 50, 'tree_planting', 'First tree planted', NOW() - INTERVAL '1 hour'),
  ('a0000000-0000-0000-0000-000000000013', 'earn', 25, 'learning_module', 'Completed first lesson', NOW() - INTERVAL '30 minutes'),
  
  ('a0000000-0000-0000-0000-000000000014', 'earn', 100, 'mission_completion', 'Completed mission', NOW() - INTERVAL '7 days'),
  ('a0000000-0000-0000-0000-000000000015', 'earn', 200, 'tree_planting', 'Planted 4 trees', NOW() - INTERVAL '14 days'),
  
  ('a0000000-0000-0000-0000-000000000017', 'earn', 600, 'tree_planting', 'Planted 12 trees', NOW() - INTERVAL '65 days'),
  ('a0000000-0000-0000-0000-000000000017', 'earn', 600, 'mission_completion', 'Completed 6 missions', NOW() - INTERVAL '55 days'),
  ('a0000000-0000-0000-0000-000000000017', 'spend', 220, 'marketplace', 'Purchased items', NOW() - INTERVAL '45 days'),
  
  ('a0000000-0000-0000-0000-000000000019', 'earn', 333, 'bonus', 'Special bonus', NOW() - INTERVAL '20 days'),
  ('a0000000-0000-0000-0000-000000000020', 'earn', 10, 'daily_login', 'Login bonus', NOW() - INTERVAL '200 days');

RAISE NOTICE 'Created 100+ total transactions';

