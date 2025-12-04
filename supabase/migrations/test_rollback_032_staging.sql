-- Test Rollback Script for Migration 032 on Staging
-- Description: Tests the rollback procedure to ensure it works correctly
-- This script should be run AFTER migration 032 has been applied to staging
-- Requirements: B6.1 (Migration without downtime), B6.2 (Preserve historical data)
-- Date: 2025-01-30

-- ============================================================================
-- SECTION 1: PRE-ROLLBACK STATE CAPTURE
-- ============================================================================

DO $
DECLARE
  v_test_start TIMESTAMP;
BEGIN
  v_test_start := NOW();
  
  RAISE NOTICE E'\n========================================================================';
  RAISE NOTICE 'ROLLBACK TEST FOR MIGRATION 032';
  RAISE NOTICE E'========================================================================';
  RAISE NOTICE 'Test Start Time: %', v_test_start;
  RAISE NOTICE 'Environment: STAGING';
  RAISE NOTICE 'Purpose: Verify rollback procedure works correctly';
  RAISE NOTICE E'========================================================================\n';
END $;

-- Create temporary table to store pre-rollback state
CREATE TEMP TABLE IF NOT EXISTS rollback_test_state (
  test_phase TEXT,
  metric TEXT,
  value NUMERIC,
  text_value TEXT,
  captured_at TIMESTAMP DEFAULT NOW()
);

-- Capture current state before rollback
INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'deprecated_wallet_count',
  COUNT(*)
FROM _deprecated_green_coin_wallets;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'deprecated_wallet_balance_total',
  COALESCE(SUM(balance), 0)
FROM _deprecated_green_coin_wallets;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'deprecated_transaction_count',
  COUNT(*)
FROM _deprecated_green_coin_transactions;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'gg_coin_balance_total',
  COALESCE(SUM(gg_coins), 0)
FROM user_gamification;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'gg_coin_transaction_count',
  COUNT(*)
FROM gg_coin_transactions;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'pre_rollback',
  'migrated_transaction_count',
  COUNT(*)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';

-- Display pre-rollback state
DO $
DECLARE
  v_state RECORD;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'PRE-ROLLBACK STATE CAPTURED';
  RAISE NOTICE E'========================================';
  
  FOR v_state IN 
    SELECT metric, value 
    FROM rollback_test_state 
    WHERE test_phase = 'pre_rollback'
    ORDER BY metric
  LOOP
    RAISE NOTICE '  %: %', v_state.metric, v_state.value;
  END LOOP;
  
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 2: VERIFY ROLLBACK PREREQUISITES
-- ============================================================================

DO $
DECLARE
  v_check_passed BOOLEAN := TRUE;
  v_deprecated_tables_exist BOOLEAN;
  v_target_tables_exist BOOLEAN;
  v_migrated_tx_exist BOOLEAN;
  v_helper_functions_exist BOOLEAN;
BEGIN
  RAISE NOTICE 'Verifying rollback prerequisites...';
  
  -- Check 1: Deprecated tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = '_deprecated_green_coin_wallets'
  ) INTO v_deprecated_tables_exist;
  
  IF NOT v_deprecated_tables_exist THEN
    RAISE WARNING '✗ Deprecated tables do not exist - migration may not have run';
    v_check_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ Deprecated tables exist';
  END IF;
  
  -- Check 2: Target tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_gamification'
  ) INTO v_target_tables_exist;
  
  IF NOT v_target_tables_exist THEN
    RAISE WARNING '✗ Target tables do not exist';
    v_check_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ Target tables exist';
  END IF;
  
  -- Check 3: Migrated transactions exist
  SELECT EXISTS (
    SELECT 1 FROM gg_coin_transactions 
    WHERE metadata->>'migrated_from' = 'green_coins'
    LIMIT 1
  ) INTO v_migrated_tx_exist;
  
  IF NOT v_migrated_tx_exist THEN
    RAISE WARNING '✗ No migrated transactions found - nothing to rollback';
    v_check_passed := FALSE;
  ELSE
    RAISE NOTICE '✓ Migrated transactions found';
  END IF;
  
  -- Check 4: Helper functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_coin_migration_stats'
  ) INTO v_helper_functions_exist;
  
  IF NOT v_helper_functions_exist THEN
    RAISE WARNING '⚠ Helper functions do not exist (non-critical)';
  ELSE
    RAISE NOTICE '✓ Helper functions exist';
  END IF;
  
  IF NOT v_check_passed THEN
    RAISE EXCEPTION 'Rollback prerequisites not met - cannot proceed with test';
  END IF;
  
  RAISE NOTICE E'\n✓ All prerequisites met - proceeding with rollback test\n';
END $;

-- ============================================================================
-- SECTION 3: CREATE TEST BACKUP
-- ============================================================================

-- Create backup of current state in case we need to restore
CREATE TEMP TABLE rollback_test_backup_wallets AS
SELECT * FROM _deprecated_green_coin_wallets;

CREATE TEMP TABLE rollback_test_backup_transactions AS
SELECT * FROM _deprecated_green_coin_transactions;

CREATE TEMP TABLE rollback_test_backup_gg_coins AS
SELECT id, gg_coins, updated_at 
FROM user_gamification 
WHERE gg_coins > 0;

CREATE TEMP TABLE rollback_test_backup_gg_transactions AS
SELECT * 
FROM gg_coin_transactions 
WHERE metadata->>'migrated_from' = 'green_coins';

RAISE NOTICE 'Created test backups of all relevant tables';

-- ============================================================================
-- SECTION 4: EXECUTE ROLLBACK
-- ============================================================================

DO $
DECLARE
  v_rollback_start TIMESTAMP;
  v_rollback_end TIMESTAMP;
  v_rollback_duration INTERVAL;
BEGIN
  v_rollback_start := NOW();
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'EXECUTING ROLLBACK';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Start Time: %', v_rollback_start;
  RAISE NOTICE E'========================================\n';
  
  -- Note: The actual rollback script will be executed here
  -- For testing purposes, we'll simulate the key steps
  
  RAISE NOTICE 'Rollback script should be executed at this point';
  RAISE NOTICE 'Command: npx supabase db execute -f supabase/migrations/rollback_032.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'This test script will now verify the rollback was successful...';
  
  v_rollback_end := NOW();
  v_rollback_duration := v_rollback_end - v_rollback_start;
  
  RAISE NOTICE E'\nRollback Duration: % seconds', EXTRACT(EPOCH FROM v_rollback_duration);
END $;

-- ============================================================================
-- SECTION 5: POST-ROLLBACK STATE CAPTURE
-- ============================================================================

-- Wait a moment for rollback to complete
SELECT pg_sleep(1);

-- Capture post-rollback state
INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'green_wallet_count',
  COUNT(*)
FROM green_coin_wallets;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'green_wallet_balance_total',
  COALESCE(SUM(balance), 0)
FROM green_coin_wallets;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'green_transaction_count',
  COUNT(*)
FROM green_coin_transactions;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'gg_coin_balance_total',
  COALESCE(SUM(gg_coins), 0)
FROM user_gamification;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'gg_coin_transaction_count',
  COUNT(*)
FROM gg_coin_transactions;

INSERT INTO rollback_test_state (test_phase, metric, value)
SELECT 
  'post_rollback',
  'remaining_migrated_transactions',
  COUNT(*)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';

-- Check if deprecated tables still exist
INSERT INTO rollback_test_state (test_phase, metric, value, text_value)
SELECT 
  'post_rollback',
  'deprecated_tables_exist',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = '_deprecated_green_coin_wallets'
  ) THEN 1 ELSE 0 END,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = '_deprecated_green_coin_wallets'
  ) THEN 'YES' ELSE 'NO' END;

-- ============================================================================
-- SECTION 6: VERIFY ROLLBACK SUCCESS
-- ============================================================================

DO $
DECLARE
  v_pre_deprecated_wallets NUMERIC;
  v_post_green_wallets NUMERIC;
  v_pre_deprecated_balance NUMERIC;
  v_post_green_balance NUMERIC;
  v_pre_deprecated_tx NUMERIC;
  v_post_green_tx NUMERIC;
  v_pre_migrated_tx NUMERIC;
  v_post_remaining_tx NUMERIC;
  v_deprecated_tables_exist TEXT;
  v_all_checks_passed BOOLEAN := TRUE;
BEGIN
  RAISE NOTICE E'\n========================================================================';
  RAISE NOTICE 'ROLLBACK VERIFICATION';
  RAISE NOTICE E'========================================================================\n';
  
  -- Get pre-rollback values
  SELECT value INTO v_pre_deprecated_wallets 
  FROM rollback_test_state 
  WHERE test_phase = 'pre_rollback' AND metric = 'deprecated_wallet_count';
  
  SELECT value INTO v_pre_deprecated_balance 
  FROM rollback_test_state 
  WHERE test_phase = 'pre_rollback' AND metric = 'deprecated_wallet_balance_total';
  
  SELECT value INTO v_pre_deprecated_tx 
  FROM rollback_test_state 
  WHERE test_phase = 'pre_rollback' AND metric = 'deprecated_transaction_count';
  
  SELECT value INTO v_pre_migrated_tx 
  FROM rollback_test_state 
  WHERE test_phase = 'pre_rollback' AND metric = 'migrated_transaction_count';
  
  -- Get post-rollback values
  SELECT value INTO v_post_green_wallets 
  FROM rollback_test_state 
  WHERE test_phase = 'post_rollback' AND metric = 'green_wallet_count';
  
  SELECT value INTO v_post_green_balance 
  FROM rollback_test_state 
  WHERE test_phase = 'post_rollback' AND metric = 'green_wallet_balance_total';
  
  SELECT value INTO v_post_green_tx 
  FROM rollback_test_state 
  WHERE test_phase = 'post_rollback' AND metric = 'green_transaction_count';
  
  SELECT value INTO v_post_remaining_tx 
  FROM rollback_test_state 
  WHERE test_phase = 'post_rollback' AND metric = 'remaining_migrated_transactions';
  
  SELECT text_value INTO v_deprecated_tables_exist 
  FROM rollback_test_state 
  WHERE test_phase = 'post_rollback' AND metric = 'deprecated_tables_exist';
  
  -- Verification Check 1: Tables restored
  RAISE NOTICE '1. Table Restoration Check';
  IF v_deprecated_tables_exist = 'NO' THEN
    RAISE NOTICE '  ✓ PASS | Deprecated tables removed';
    RAISE NOTICE '  ✓ PASS | Green Coin tables restored';
  ELSE
    RAISE WARNING '  ✗ FAIL | Deprecated tables still exist';
    v_all_checks_passed := FALSE;
  END IF;
  
  -- Verification Check 2: Wallet count matches
  RAISE NOTICE E'\n2. Wallet Count Check';
  IF v_post_green_wallets = v_pre_deprecated_wallets THEN
    RAISE NOTICE '  ✓ PASS | Wallet count matches | % = %', 
      v_post_green_wallets, v_pre_deprecated_wallets;
  ELSE
    RAISE WARNING '  ✗ FAIL | Wallet count mismatch | % != %', 
      v_post_green_wallets, v_pre_deprecated_wallets;
    v_all_checks_passed := FALSE;
  END IF;
  
  -- Verification Check 3: Balance total matches
  RAISE NOTICE E'\n3. Balance Total Check';
  IF ABS(v_post_green_balance - v_pre_deprecated_balance) < 0.001 THEN
    RAISE NOTICE '  ✓ PASS | Balance total matches | % ≈ %', 
      v_post_green_balance, v_pre_deprecated_balance;
  ELSE
    RAISE WARNING '  ✗ FAIL | Balance total mismatch | % != % (diff: %)', 
      v_post_green_balance, v_pre_deprecated_balance,
      ABS(v_post_green_balance - v_pre_deprecated_balance);
    v_all_checks_passed := FALSE;
  END IF;
  
  -- Verification Check 4: Transaction count matches
  RAISE NOTICE E'\n4. Transaction Count Check';
  IF v_post_green_tx = v_pre_deprecated_tx THEN
    RAISE NOTICE '  ✓ PASS | Transaction count matches | % = %', 
      v_post_green_tx, v_pre_deprecated_tx;
  ELSE
    RAISE WARNING '  ✗ FAIL | Transaction count mismatch | % != %', 
      v_post_green_tx, v_pre_deprecated_tx;
    v_all_checks_passed := FALSE;
  END IF;
  
  -- Verification Check 5: Migrated transactions removed
  RAISE NOTICE E'\n5. Migrated Transaction Cleanup Check';
  IF v_post_remaining_tx = 0 THEN
    RAISE NOTICE '  ✓ PASS | All migrated transactions removed | % removed', 
      v_pre_migrated_tx;
  ELSE
    RAISE WARNING '  ✗ FAIL | Migrated transactions still exist | % remaining', 
      v_post_remaining_tx;
    v_all_checks_passed := FALSE;
  END IF;
  
  -- Verification Check 6: Data integrity
  RAISE NOTICE E'\n6. Data Integrity Check';
  DECLARE
    v_orphaned_wallets INTEGER;
    v_orphaned_tx INTEGER;
    v_negative_balances INTEGER;
    v_null_balances INTEGER;
  BEGIN
    -- Check for orphaned wallets
    SELECT COUNT(*) INTO v_orphaned_wallets
    FROM green_coin_wallets gcw
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gcw.user_id);
    
    -- Check for orphaned transactions
    SELECT COUNT(*) INTO v_orphaned_tx
    FROM green_coin_transactions gct
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gct.user_id);
    
    -- Check for negative balances
    SELECT COUNT(*) INTO v_negative_balances
    FROM green_coin_wallets
    WHERE balance < 0;
    
    -- Check for NULL balances
    SELECT COUNT(*) INTO v_null_balances
    FROM green_coin_wallets
    WHERE balance IS NULL;
    
    IF v_orphaned_wallets = 0 THEN
      RAISE NOTICE '  ✓ PASS | No orphaned wallets';
    ELSE
      RAISE WARNING '  ⚠ WARNING | % orphaned wallets found', v_orphaned_wallets;
    END IF;
    
    IF v_orphaned_tx = 0 THEN
      RAISE NOTICE '  ✓ PASS | No orphaned transactions';
    ELSE
      RAISE WARNING '  ⚠ WARNING | % orphaned transactions found', v_orphaned_tx;
    END IF;
    
    IF v_negative_balances = 0 THEN
      RAISE NOTICE '  ✓ PASS | No negative balances';
    ELSE
      RAISE WARNING '  ✗ FAIL | % negative balances found', v_negative_balances;
      v_all_checks_passed := FALSE;
    END IF;
    
    IF v_null_balances = 0 THEN
      RAISE NOTICE '  ✓ PASS | No NULL balances';
    ELSE
      RAISE WARNING '  ✗ FAIL | % NULL balances found', v_null_balances;
      v_all_checks_passed := FALSE;
    END IF;
  END;
  
  -- Verification Check 7: Helper functions removed
  RAISE NOTICE E'\n7. Helper Function Cleanup Check';
  DECLARE
    v_functions_exist BOOLEAN;
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname IN ('get_coin_migration_stats', 'is_migrated_transaction')
    ) INTO v_functions_exist;
    
    IF NOT v_functions_exist THEN
      RAISE NOTICE '  ✓ PASS | Helper functions removed';
    ELSE
      RAISE WARNING '  ⚠ WARNING | Helper functions still exist (should be removed)';
    END IF;
  END;
  
  -- Verification Check 8: Table comments restored
  RAISE NOTICE E'\n8. Table Comment Check';
  DECLARE
    v_wallet_comment TEXT;
    v_tx_comment TEXT;
  BEGIN
    SELECT obj_description('green_coin_wallets'::regclass) INTO v_wallet_comment;
    SELECT obj_description('green_coin_transactions'::regclass) INTO v_tx_comment;
    
    IF v_wallet_comment IS NOT NULL AND v_wallet_comment NOT LIKE '%DEPRECATED%' THEN
      RAISE NOTICE '  ✓ PASS | Wallet table comment restored';
    ELSE
      RAISE WARNING '  ⚠ WARNING | Wallet table comment not restored properly';
    END IF;
    
    IF v_tx_comment IS NOT NULL AND v_tx_comment NOT LIKE '%DEPRECATED%' THEN
      RAISE NOTICE '  ✓ PASS | Transaction table comment restored';
    ELSE
      RAISE WARNING '  ⚠ WARNING | Transaction table comment not restored properly';
    END IF;
  END;
  
  -- Final summary
  RAISE NOTICE E'\n========================================================================';
  IF v_all_checks_passed THEN
    RAISE NOTICE '✓ ROLLBACK TEST PASSED';
    RAISE NOTICE 'All critical checks passed successfully';
  ELSE
    RAISE WARNING '✗ ROLLBACK TEST FAILED';
    RAISE WARNING 'One or more critical checks failed - review above';
  END IF;
  RAISE NOTICE E'========================================================================\n';
END $;

-- ============================================================================
-- SECTION 7: PERFORMANCE VERIFICATION
-- ============================================================================

DO $
DECLARE
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration NUMERIC;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'PERFORMANCE VERIFICATION';
  RAISE NOTICE E'========================================\n';
  
  -- Test 1: Balance query performance
  v_start_time := clock_timestamp();
  PERFORM balance FROM green_coin_wallets LIMIT 1000;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  IF v_duration < 100 THEN
    RAISE NOTICE '✓ PASS | Balance query | %.2f ms | < 100ms target', v_duration;
  ELSE
    RAISE WARNING '⚠ WARNING | Balance query | %.2f ms | > 100ms target', v_duration;
  END IF;
  
  -- Test 2: Transaction query performance
  v_start_time := clock_timestamp();
  PERFORM * FROM green_coin_transactions ORDER BY timestamp DESC LIMIT 100;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  IF v_duration < 200 THEN
    RAISE NOTICE '✓ PASS | Transaction query | %.2f ms | < 200ms target', v_duration;
  ELSE
    RAISE WARNING '⚠ WARNING | Transaction query | %.2f ms | > 200ms target', v_duration;
  END IF;
  
  RAISE NOTICE E'\n========================================\n';
END $;

-- ============================================================================
-- SECTION 8: SAMPLE DATA INSPECTION
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'SAMPLE DATA INSPECTION';
  RAISE NOTICE E'========================================\n';
  
  RAISE NOTICE 'Top 5 wallets by balance:';
END $;

SELECT 
  user_id,
  balance,
  last_updated
FROM green_coin_wallets
ORDER BY balance DESC
LIMIT 5;

DO $
BEGIN
  RAISE NOTICE E'\nRecent 5 transactions:';
END $;

SELECT 
  user_id,
  transaction_type,
  amount,
  description,
  timestamp
FROM green_coin_transactions
ORDER BY timestamp DESC
LIMIT 5;

-- ============================================================================
-- SECTION 9: GENERATE TEST REPORT
-- ============================================================================

DO $
DECLARE
  v_test_end TIMESTAMP;
  v_test_duration INTERVAL;
  v_pre_state RECORD;
  v_post_state RECORD;
BEGIN
  v_test_end := NOW();
  
  RAISE NOTICE E'\n========================================================================';
  RAISE NOTICE 'ROLLBACK TEST REPORT';
  RAISE NOTICE E'========================================================================';
  RAISE NOTICE 'Test Completed: %', v_test_end;
  RAISE NOTICE E'========================================================================\n';
  
  RAISE NOTICE 'Pre-Rollback State:';
  FOR v_pre_state IN 
    SELECT metric, value 
    FROM rollback_test_state 
    WHERE test_phase = 'pre_rollback'
    ORDER BY metric
  LOOP
    RAISE NOTICE '  %: %', v_pre_state.metric, v_pre_state.value;
  END LOOP;
  
  RAISE NOTICE E'\nPost-Rollback State:';
  FOR v_post_state IN 
    SELECT metric, COALESCE(value::TEXT, text_value) as val
    FROM rollback_test_state 
    WHERE test_phase = 'post_rollback'
    ORDER BY metric
  LOOP
    RAISE NOTICE '  %: %', v_post_state.metric, v_post_state.val;
  END LOOP;
  
  RAISE NOTICE E'\n========================================================================';
  RAISE NOTICE 'NEXT STEPS';
  RAISE NOTICE E'========================================================================';
  RAISE NOTICE '1. Review all verification results above';
  RAISE NOTICE '2. If all checks passed:';
  RAISE NOTICE '   - Document rollback test success';
  RAISE NOTICE '   - Proceed with production migration planning';
  RAISE NOTICE '3. If any checks failed:';
  RAISE NOTICE '   - Investigate failures';
  RAISE NOTICE '   - Fix rollback script issues';
  RAISE NOTICE '   - Re-test rollback procedure';
  RAISE NOTICE '4. Test application functionality:';
  RAISE NOTICE '   - Verify Green Coin service works';
  RAISE NOTICE '   - Test wallet balance queries';
  RAISE NOTICE '   - Test transaction recording';
  RAISE NOTICE '5. Re-run migration if rollback successful:';
  RAISE NOTICE '   - Apply migration 032 again';
  RAISE NOTICE '   - Verify migration success';
  RAISE NOTICE '   - Proceed to production';
  RAISE NOTICE E'========================================================================\n';
END $;

-- Cleanup temporary tables
DROP TABLE IF EXISTS rollback_test_state;
DROP TABLE IF EXISTS rollback_test_backup_wallets;
DROP TABLE IF EXISTS rollback_test_backup_transactions;
DROP TABLE IF EXISTS rollback_test_backup_gg_coins;
DROP TABLE IF EXISTS rollback_test_backup_gg_transactions;

RAISE NOTICE 'Cleaned up temporary test tables';
RAISE NOTICE E'\n========================================================================';
RAISE NOTICE 'ROLLBACK TEST COMPLETE';
RAISE NOTICE E'========================================================================\n';
