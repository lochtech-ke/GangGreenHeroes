-- Test Script for Migration 032: Consolidate Green Coins into GG Coins
-- Description: Creates sample data and tests the migration process
-- Usage: Run this on a test database before deploying to production

-- ============================================================================
-- SECTION 1: SETUP TEST ENVIRONMENT
-- ============================================================================

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_migration_032;
SET search_path TO test_migration_032, public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'MIGRATION 032 TEST SCRIPT';
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 2: CREATE SAMPLE DATA
-- ============================================================================

-- Create test users table (minimal version)
CREATE TABLE IF NOT EXISTS test_migration_032.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create test user_gamification table
CREATE TABLE IF NOT EXISTS test_migration_032.user_gamification (
  id UUID PRIMARY KEY REFERENCES test_migration_032.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create test Green Coin tables
CREATE TABLE IF NOT EXISTS test_migration_032.green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES test_migration_032.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_migration_032.green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES test_migration_032.users(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral')),
  amount INTEGER NOT NULL,
  source TEXT,
  description TEXT,
  reference_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert test users
INSERT INTO test_migration_032.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user1@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'user2@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'user3@test.com'),
  ('44444444-4444-4444-4444-444444444444', 'user4@test.com'),
  ('55555555-5555-5555-5555-555555555555', 'user5@test.com');

-- Insert test gamification records (some users already have GG Coins)
INSERT INTO test_migration_032.user_gamification (id, total_points, level) VALUES
  ('11111111-1111-1111-1111-111111111111', 100, 2),
  ('22222222-2222-2222-2222-222222222222', 200, 3),
  ('33333333-3333-3333-3333-333333333333', 50, 1);

-- Insert test Green Coin wallets
INSERT INTO test_migration_032.green_coin_wallets (user_id, balance, lifetime_earnings, lifetime_spending) VALUES
  ('11111111-1111-1111-1111-111111111111', 100, 150, 50),
  ('22222222-2222-2222-2222-222222222222', 250, 300, 50),
  ('33333333-3333-3333-3333-333333333333', 75, 75, 0),
  ('44444444-4444-4444-4444-444444444444', 500, 600, 100),
  ('55555555-5555-5555-5555-555555555555', 0, 0, 0);

-- Insert test Green Coin transactions
INSERT INTO test_migration_032.green_coin_transactions (user_id, transaction_type, amount, source, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'earn', 50, 'tree_planting', 'Planted 1 tree'),
  ('11111111-1111-1111-1111-111111111111', 'earn', 100, 'mission_completion', 'Completed cleanup mission'),
  ('11111111-1111-1111-1111-111111111111', 'spend', 50, 'badge_purchase', 'Purchased badge'),
  ('22222222-2222-2222-2222-222222222222', 'earn', 200, 'learning_module', 'Completed course'),
  ('22222222-2222-2222-2222-222222222222', 'earn', 100, 'referral', 'Referred a friend'),
  ('22222222-2222-2222-2222-222222222222', 'spend', 50, 'marketplace', 'Bought item'),
  ('33333333-3333-3333-3333-333333333333', 'earn', 75, 'daily_login', 'Login streak'),
  ('44444444-4444-4444-4444-444444444444', 'earn', 500, 'tree_planting', 'Planted 10 trees'),
  ('44444444-4444-4444-4444-444444444444', 'earn', 100, 'bonus', 'Special event'),
  ('44444444-4444-4444-4444-444444444444', 'spend', 100, 'donation', 'Donated to cause');

RAISE NOTICE 'Created sample data:';
RAISE NOTICE '  - 5 test users';
RAISE NOTICE '  - 5 Green Coin wallets';
RAISE NOTICE '  - 10 Green Coin transactions';
RAISE NOTICE '  - 3 existing gamification records';

-- ============================================================================
-- SECTION 3: CAPTURE PRE-MIGRATION STATE
-- ============================================================================

CREATE TEMP TABLE pre_migration_state AS
SELECT 
  'green_coin_wallets' as table_name,
  COUNT(*) as record_count,
  COALESCE(SUM(balance), 0) as total_balance
FROM test_migration_032.green_coin_wallets
UNION ALL
SELECT 
  'green_coin_transactions',
  COUNT(*),
  COALESCE(SUM(amount), 0)
FROM test_migration_032.green_coin_transactions
UNION ALL
SELECT 
  'user_gamification',
  COUNT(*),
  0
FROM test_migration_032.user_gamification;

RAISE NOTICE E'\nPre-migration state:';
DO $
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM pre_migration_state LOOP
    RAISE NOTICE '  %: % records, total: %', rec.table_name, rec.record_count, rec.total_balance;
  END LOOP;
END $;

-- ============================================================================
-- SECTION 4: RUN MIGRATION (ADAPTED FOR TEST SCHEMA)
-- ============================================================================

RAISE NOTICE E'\n--- Starting Migration ---\n';

-- Add gg_coins column to user_gamification
ALTER TABLE test_migration_032.user_gamification 
ADD COLUMN IF NOT EXISTS gg_coins DECIMAL(10,3) DEFAULT 0 CHECK (gg_coins >= 0);

-- Create gg_coin_transactions table
CREATE TABLE IF NOT EXISTS test_migration_032.gg_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES test_migration_032.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral', 'transfer')),
  amount DECIMAL(10,3) NOT NULL CHECK (amount != 0),
  balance_before DECIMAL(10,3) NOT NULL CHECK (balance_before >= 0),
  balance_after DECIMAL(10,3) NOT NULL CHECK (balance_after >= 0),
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migrate wallet balances
INSERT INTO test_migration_032.user_gamification (id, gg_coins, updated_at)
SELECT 
  user_id,
  balance::DECIMAL(10,3),
  last_updated
FROM test_migration_032.green_coin_wallets
ON CONFLICT (id) DO UPDATE SET
  gg_coins = test_migration_032.user_gamification.gg_coins + EXCLUDED.gg_coins,
  updated_at = GREATEST(test_migration_032.user_gamification.updated_at, EXCLUDED.updated_at);

RAISE NOTICE 'Migrated wallet balances';

-- Migrate transactions
INSERT INTO test_migration_032.gg_coin_transactions (
  user_id,
  transaction_type,
  amount,
  balance_before,
  balance_after,
  reference_type,
  reference_id,
  description,
  metadata,
  created_at
)
SELECT
  user_id,
  transaction_type,
  amount::DECIMAL(10,3),
  0::DECIMAL(10,3),
  0::DECIMAL(10,3),
  source,
  reference_id,
  description,
  jsonb_build_object(
    'migrated_from', 'green_coins',
    'original_id', id,
    'migration_date', NOW(),
    'original_source', source
  ),
  timestamp
FROM test_migration_032.green_coin_transactions
ORDER BY timestamp ASC;

RAISE NOTICE 'Migrated transactions';

-- Rename old tables
ALTER TABLE test_migration_032.green_coin_wallets 
  RENAME TO _deprecated_green_coin_wallets;
ALTER TABLE test_migration_032.green_coin_transactions 
  RENAME TO _deprecated_green_coin_transactions;

RAISE NOTICE 'Renamed old tables';

-- ============================================================================
-- SECTION 5: VERIFY MIGRATION
-- ============================================================================

RAISE NOTICE E'\n--- Verifying Migration ---\n';

-- Test 1: Check wallet counts
DO $
DECLARE
  v_old_count INTEGER;
  v_new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_old_count FROM test_migration_032._deprecated_green_coin_wallets;
  SELECT COUNT(*) INTO v_new_count FROM test_migration_032.user_gamification WHERE gg_coins > 0;
  
  RAISE NOTICE 'Test 1 - Wallet Count:';
  RAISE NOTICE '  Old wallets: %', v_old_count;
  RAISE NOTICE '  New wallets with GG Coins: %', v_new_count;
  
  IF v_new_count >= v_old_count THEN
    RAISE NOTICE '  ✓ PASS: All wallets migrated';
  ELSE
    RAISE WARNING '  ✗ FAIL: Missing wallets';
  END IF;
END $;

-- Test 2: Check balance totals
DO $
DECLARE
  v_old_total DECIMAL(10,3);
  v_new_total DECIMAL(10,3);
  v_difference DECIMAL(10,3);
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO v_old_total 
  FROM test_migration_032._deprecated_green_coin_wallets;
  
  SELECT COALESCE(SUM(gg_coins), 0) INTO v_new_total 
  FROM test_migration_032.user_gamification;
  
  v_difference := ABS(v_new_total - v_old_total);
  
  RAISE NOTICE E'\nTest 2 - Balance Totals:';
  RAISE NOTICE '  Old total: %', v_old_total;
  RAISE NOTICE '  New total: %', v_new_total;
  RAISE NOTICE '  Difference: %', v_difference;
  
  IF v_difference < 0.001 THEN
    RAISE NOTICE '  ✓ PASS: Balances match';
  ELSE
    RAISE WARNING '  ✗ FAIL: Balance mismatch';
  END IF;
END $;

-- Test 3: Check transaction counts
DO $
DECLARE
  v_old_count INTEGER;
  v_migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_old_count 
  FROM test_migration_032._deprecated_green_coin_transactions;
  
  SELECT COUNT(*) INTO v_migrated_count 
  FROM test_migration_032.gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins';
  
  RAISE NOTICE E'\nTest 3 - Transaction Count:';
  RAISE NOTICE '  Old transactions: %', v_old_count;
  RAISE NOTICE '  Migrated transactions: %', v_migrated_count;
  
  IF v_old_count = v_migrated_count THEN
    RAISE NOTICE '  ✓ PASS: All transactions migrated';
  ELSE
    RAISE WARNING '  ✗ FAIL: Transaction count mismatch';
  END IF;
END $;

-- Test 4: Check specific user balances
DO $
DECLARE
  v_user1_old INTEGER;
  v_user1_new DECIMAL(10,3);
BEGIN
  SELECT balance INTO v_user1_old 
  FROM test_migration_032._deprecated_green_coin_wallets 
  WHERE user_id = '11111111-1111-1111-1111-111111111111';
  
  SELECT gg_coins INTO v_user1_new 
  FROM test_migration_032.user_gamification 
  WHERE id = '11111111-1111-1111-1111-111111111111';
  
  RAISE NOTICE E'\nTest 4 - User Balance Verification:';
  RAISE NOTICE '  User 1 old balance: %', v_user1_old;
  RAISE NOTICE '  User 1 new balance: %', v_user1_new;
  
  IF v_user1_new >= v_user1_old THEN
    RAISE NOTICE '  ✓ PASS: User balance preserved';
  ELSE
    RAISE WARNING '  ✗ FAIL: User balance incorrect';
  END IF;
END $;

-- Test 5: Check metadata on migrated transactions
DO $
DECLARE
  v_metadata_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_metadata_count 
  FROM test_migration_032.gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins'
    AND metadata->>'original_id' IS NOT NULL
    AND metadata->>'migration_date' IS NOT NULL;
  
  RAISE NOTICE E'\nTest 5 - Transaction Metadata:';
  RAISE NOTICE '  Transactions with complete metadata: %', v_metadata_count;
  
  IF v_metadata_count = (SELECT COUNT(*) FROM test_migration_032._deprecated_green_coin_transactions) THEN
    RAISE NOTICE '  ✓ PASS: All transactions have metadata';
  ELSE
    RAISE WARNING '  ✗ FAIL: Some transactions missing metadata';
  END IF;
END $;

-- Test 6: Check table renaming
DO $
DECLARE
  v_deprecated_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_deprecated_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'test_migration_032'
    AND table_name LIKE '_deprecated_green_coin%';
  
  RAISE NOTICE E'\nTest 6 - Table Deprecation:';
  RAISE NOTICE '  Deprecated tables found: %', v_deprecated_tables;
  
  IF v_deprecated_tables = 2 THEN
    RAISE NOTICE '  ✓ PASS: Tables properly deprecated';
  ELSE
    RAISE WARNING '  ✗ FAIL: Table deprecation incomplete';
  END IF;
END $;

-- ============================================================================
-- SECTION 6: PERFORMANCE TESTS
-- ============================================================================

RAISE NOTICE E'\n--- Performance Tests ---\n';

-- Test balance query performance
DO $
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration INTERVAL;
BEGIN
  v_start_time := clock_timestamp();
  
  PERFORM gg_coins FROM test_migration_032.user_gamification 
  WHERE id = '11111111-1111-1111-1111-111111111111';
  
  v_end_time := clock_timestamp();
  v_duration := v_end_time - v_start_time;
  
  RAISE NOTICE 'Balance query duration: %', v_duration;
  
  IF EXTRACT(MILLISECONDS FROM v_duration) < 50 THEN
    RAISE NOTICE '  ✓ PASS: Query within 50ms target';
  ELSE
    RAISE WARNING '  ✗ FAIL: Query exceeds 50ms target';
  END IF;
END $;

-- ============================================================================
-- SECTION 7: CLEANUP
-- ============================================================================

RAISE NOTICE E'\n--- Cleaning Up Test Environment ---\n';

-- Drop test schema
DROP SCHEMA test_migration_032 CASCADE;

RAISE NOTICE 'Test schema dropped';

-- ============================================================================
-- SECTION 8: SUMMARY
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'MIGRATION 032 TEST COMPLETED';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Review the test results above.';
  RAISE NOTICE 'All tests should show ✓ PASS.';
  RAISE NOTICE E'========================================\n';
END $;
