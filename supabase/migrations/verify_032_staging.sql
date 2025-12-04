-- ============================================================================
-- Migration 032 Staging Verification Script
-- ============================================================================
-- Purpose: Comprehensive verification of coin system consolidation on staging
-- Requirements: B6.3 - Validate migration success
-- Date: 2025-01-30
-- ============================================================================

\set ON_ERROR_STOP on
\timing on

-- Set output format for better readability
\pset border 2
\pset format wrapped

\echo ''
\echo '========================================================================'
\echo 'MIGRATION 032 STAGING VERIFICATION'
\echo '========================================================================'
\echo ''

-- ============================================================================
-- SECTION 1: TABLE EXISTENCE VERIFICATION
-- ============================================================================

\echo '1. Verifying Table Structure...'
\echo ''

-- Check that deprecated tables exist
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Deprecated tables exist' as check_name,
  COUNT(*) as table_count,
  '2 expected' as expected
FROM information_schema.tables 
WHERE table_name IN ('_deprecated_green_coin_wallets', '_deprecated_green_coin_transactions');

-- Check that target tables exist
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Target tables exist' as check_name,
  COUNT(*) as table_count,
  '2 expected' as expected
FROM information_schema.tables 
WHERE table_name IN ('user_gamification', 'gg_coin_transactions');

-- Check that gg_coins column exists
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'gg_coins column exists' as check_name,
  data_type,
  numeric_precision || ',' || numeric_scale as precision
FROM information_schema.columns 
WHERE table_name = 'user_gamification' 
  AND column_name = 'gg_coins';

\echo ''

-- ============================================================================
-- SECTION 2: DATA MIGRATION VERIFICATION
-- ============================================================================

\echo '2. Verifying Data Migration...'
\echo ''

-- Get migration statistics
\echo 'Migration Statistics:'
SELECT 
  metric,
  value,
  CASE metric
    WHEN 'total_wallets_migrated' THEN 'Source wallet count'
    WHEN 'total_balance_migrated' THEN 'Total coins migrated'
    WHEN 'total_transactions_migrated' THEN 'Transactions migrated'
    WHEN 'current_gg_coin_total' THEN 'Current GG Coin total'
    WHEN 'total_gg_coin_transactions' THEN 'Total GG transactions'
  END as description
FROM get_coin_migration_stats()
ORDER BY 
  CASE metric
    WHEN 'total_wallets_migrated' THEN 1
    WHEN 'total_balance_migrated' THEN 2
    WHEN 'total_transactions_migrated' THEN 3
    WHEN 'current_gg_coin_total' THEN 4
    WHEN 'total_gg_coin_transactions' THEN 5
  END;

\echo ''

-- ============================================================================
-- SECTION 3: BALANCE VERIFICATION
-- ============================================================================

\echo '3. Verifying Balance Consistency...'
\echo ''

-- Compare total balances
WITH balance_comparison AS (
  SELECT 
    (SELECT COALESCE(SUM(balance), 0) FROM _deprecated_green_coin_wallets) as green_total,
    (SELECT COALESCE(SUM(gg_coins), 0) FROM user_gamification) as gg_total
)
SELECT 
  CASE 
    WHEN ABS(green_total - gg_total) < 0.01 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Balance totals match' as check_name,
  green_total as source_balance,
  gg_total as target_balance,
  ABS(green_total - gg_total) as difference,
  '< 0.01 tolerance' as threshold
FROM balance_comparison;

-- Check for negative balances
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'No negative balances' as check_name,
  COUNT(*) as negative_count,
  '0 expected' as expected
FROM user_gamification
WHERE gg_coins < 0;

-- Check for NULL balances
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '⚠ WARNING'
  END as status,
  'No NULL balances' as check_name,
  COUNT(*) as null_count,
  '0 expected' as expected
FROM user_gamification
WHERE gg_coins IS NULL;

-- Check balance precision
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Balance precision valid' as check_name,
  COUNT(*) as invalid_count,
  '0 expected' as expected
FROM user_gamification
WHERE gg_coins::TEXT ~ '\.\d{4,}'; -- More than 3 decimal places

\echo ''

-- ============================================================================
-- SECTION 4: TRANSACTION VERIFICATION
-- ============================================================================

\echo '4. Verifying Transaction Migration...'
\echo ''

-- Compare transaction counts
WITH tx_comparison AS (
  SELECT 
    (SELECT COUNT(*) FROM _deprecated_green_coin_transactions) as green_tx_count,
    (SELECT COUNT(*) FROM gg_coin_transactions WHERE metadata->>'migrated_from' = 'green_coins') as migrated_tx_count
)
SELECT 
  CASE 
    WHEN green_tx_count = migrated_tx_count THEN '✓ PASS'
    WHEN migrated_tx_count >= green_tx_count * 0.95 THEN '⚠ WARNING'
    ELSE '✗ FAIL'
  END as status,
  'Transaction counts match' as check_name,
  green_tx_count as source_count,
  migrated_tx_count as migrated_count,
  (green_tx_count - migrated_tx_count) as difference
FROM tx_comparison;

-- Verify transaction types are valid
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'All transaction types valid' as check_name,
  COUNT(*) as invalid_count,
  '0 expected' as expected
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
  AND transaction_type NOT IN ('earn', 'spend', 'bonus', 'referral', 'transfer');

-- Check for NULL amounts
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'No NULL transaction amounts' as check_name,
  COUNT(*) as null_count,
  '0 expected' as expected
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
  AND amount IS NULL;

-- Check for zero amounts
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '⚠ WARNING'
  END as status,
  'No zero transaction amounts' as check_name,
  COUNT(*) as zero_count,
  '0 expected (warning only)' as expected
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
  AND amount = 0;

-- Verify transaction metadata
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'All migrated transactions have metadata' as check_name,
  COUNT(*) as missing_metadata_count,
  '0 expected' as expected
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
  AND (
    metadata->>'original_id' IS NULL 
    OR metadata->>'migration_date' IS NULL
  );

\echo ''

-- ============================================================================
-- SECTION 5: REFERENTIAL INTEGRITY VERIFICATION
-- ============================================================================

\echo '5. Verifying Referential Integrity...'
\echo ''

-- Check for orphaned wallet records
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'No orphaned wallet records' as check_name,
  COUNT(*) as orphaned_count,
  '0 expected' as expected
FROM user_gamification ug
WHERE gg_coins > 0
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ug.id);

-- Check for orphaned transaction records
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'No orphaned transaction records' as check_name,
  COUNT(*) as orphaned_count,
  '0 expected' as expected
FROM gg_coin_transactions ggt
WHERE metadata->>'migrated_from' = 'green_coins'
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ggt.user_id);

-- Verify all migrated users have wallets
WITH migrated_users AS (
  SELECT DISTINCT user_id 
  FROM gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins'
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '⚠ WARNING'
  END as status,
  'All migrated users have wallets' as check_name,
  COUNT(*) as users_without_wallets,
  '0 expected' as expected
FROM migrated_users mu
WHERE NOT EXISTS (
  SELECT 1 FROM user_gamification ug WHERE ug.id = mu.user_id
);

\echo ''

-- ============================================================================
-- SECTION 6: INDEX AND PERFORMANCE VERIFICATION
-- ============================================================================

\echo '6. Verifying Indexes and Performance...'
\echo ''

-- Check that required indexes exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Required indexes exist' as check_name,
  COUNT(*) as index_count,
  '3+ expected' as expected
FROM pg_indexes
WHERE tablename = 'gg_coin_transactions'
  AND indexname LIKE 'idx_gg_coin_transactions%';

-- Show index details
\echo ''
\echo 'Index Details:'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'gg_coin_transactions'
ORDER BY indexname;

-- Test query performance (balance lookup)
\echo ''
\echo 'Testing Balance Query Performance...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT gg_coins 
FROM user_gamification 
WHERE id = (SELECT id FROM user_gamification LIMIT 1);

-- Test query performance (transaction history)
\echo ''
\echo 'Testing Transaction History Query Performance...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * 
FROM gg_coin_transactions 
WHERE user_id = (SELECT user_id FROM gg_coin_transactions LIMIT 1)
ORDER BY created_at DESC 
LIMIT 50;

\echo ''

-- ============================================================================
-- SECTION 7: DATA QUALITY CHECKS
-- ============================================================================

\echo '7. Verifying Data Quality...'
\echo ''

-- Check for duplicate transactions
WITH duplicate_check AS (
  SELECT 
    user_id,
    amount,
    transaction_type,
    created_at,
    COUNT(*) as dup_count
  FROM gg_coin_transactions
  WHERE metadata->>'migrated_from' = 'green_coins'
  GROUP BY user_id, amount, transaction_type, created_at
  HAVING COUNT(*) > 1
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS'
    ELSE '⚠ WARNING'
  END as status,
  'No duplicate transactions' as check_name,
  COUNT(*) as duplicate_groups,
  '0 expected' as expected
FROM duplicate_check;

-- Check transaction type distribution
\echo ''
\echo 'Transaction Type Distribution:'
SELECT 
  transaction_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
GROUP BY transaction_type
ORDER BY count DESC;

-- Check for unusual amounts
\echo ''
\echo 'Amount Range Analysis:'
SELECT 
  'Min Amount' as metric,
  MIN(amount) as value
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
UNION ALL
SELECT 
  'Max Amount',
  MAX(amount)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
UNION ALL
SELECT 
  'Avg Amount',
  ROUND(AVG(amount), 3)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
UNION ALL
SELECT 
  'Median Amount',
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount)
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins';

\echo ''

-- ============================================================================
-- SECTION 8: SAMPLE DATA VERIFICATION
-- ============================================================================

\echo '8. Sample Data Verification...'
\echo ''

-- Show sample migrated wallets
\echo 'Sample Migrated Wallets (Top 5 by balance):'
SELECT 
  ug.id as user_id,
  ug.gg_coins as current_balance,
  dgw.balance as original_balance,
  (ug.gg_coins - dgw.balance::DECIMAL) as difference
FROM user_gamification ug
JOIN _deprecated_green_coin_wallets dgw ON ug.id = dgw.user_id
WHERE ug.gg_coins > 0
ORDER BY ug.gg_coins DESC
LIMIT 5;

-- Show sample migrated transactions
\echo ''
\echo 'Sample Migrated Transactions (Most Recent 5):'
SELECT 
  user_id,
  transaction_type,
  amount,
  description,
  metadata->>'original_id' as original_id,
  created_at
FROM gg_coin_transactions
WHERE metadata->>'migrated_from' = 'green_coins'
ORDER BY created_at DESC
LIMIT 5;

\echo ''

-- ============================================================================
-- SECTION 9: HELPER FUNCTION VERIFICATION
-- ============================================================================

\echo '9. Verifying Helper Functions...'
\echo ''

-- Check that helper functions exist
SELECT 
  CASE 
    WHEN COUNT(*) = 2 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Helper functions exist' as check_name,
  COUNT(*) as function_count,
  '2 expected' as expected
FROM pg_proc
WHERE proname IN ('is_migrated_transaction', 'get_coin_migration_stats');

-- Test is_migrated_transaction function
\echo ''
\echo 'Testing is_migrated_transaction function:'
SELECT 
  is_migrated_transaction(metadata) as is_migrated,
  COUNT(*) as count
FROM gg_coin_transactions
GROUP BY is_migrated_transaction(metadata)
ORDER BY is_migrated DESC;

\echo ''

-- ============================================================================
-- SECTION 10: DEPRECATION VERIFICATION
-- ============================================================================

\echo '10. Verifying Deprecation Markers...'
\echo ''

-- Check table comments
SELECT 
  CASE 
    WHEN obj_description(oid) LIKE '%DEPRECATED%' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  relname as table_name,
  obj_description(oid) as comment
FROM pg_class
WHERE relname IN ('_deprecated_green_coin_wallets', '_deprecated_green_coin_transactions')
ORDER BY relname;

\echo ''

-- ============================================================================
-- SECTION 11: FINAL SUMMARY
-- ============================================================================

\echo '========================================================================'
\echo 'VERIFICATION SUMMARY'
\echo '========================================================================'
\echo ''

-- Generate overall summary
WITH verification_results AS (
  -- Count checks from each section
  SELECT 'Table Structure' as category, 3 as total_checks
  UNION ALL SELECT 'Data Migration', 1
  UNION ALL SELECT 'Balance Consistency', 4
  UNION ALL SELECT 'Transaction Migration', 5
  UNION ALL SELECT 'Referential Integrity', 3
  UNION ALL SELECT 'Indexes', 1
  UNION ALL SELECT 'Data Quality', 1
  UNION ALL SELECT 'Helper Functions', 1
  UNION ALL SELECT 'Deprecation', 2
)
SELECT 
  category,
  total_checks,
  'See above for details' as status
FROM verification_results
ORDER BY 
  CASE category
    WHEN 'Table Structure' THEN 1
    WHEN 'Data Migration' THEN 2
    WHEN 'Balance Consistency' THEN 3
    WHEN 'Transaction Migration' THEN 4
    WHEN 'Referential Integrity' THEN 5
    WHEN 'Indexes' THEN 6
    WHEN 'Data Quality' THEN 7
    WHEN 'Helper Functions' THEN 8
    WHEN 'Deprecation' THEN 9
  END;

\echo ''
\echo 'Legend:'
\echo '  ✓ PASS    - Check passed successfully'
\echo '  ⚠ WARNING - Check passed with warnings (review recommended)'
\echo '  ✗ FAIL    - Check failed (action required)'
\echo ''
\echo '========================================================================'
\echo 'VERIFICATION COMPLETE'
\echo '========================================================================'
\echo ''
\echo 'Next Steps:'
\echo '  1. Review any FAIL or WARNING results above'
\echo '  2. If all critical checks pass, proceed with application testing'
\echo '  3. If any checks fail, investigate and fix before production'
\echo '  4. Document any warnings for monitoring'
\echo ''
\echo 'For detailed migration guide, see:'
\echo '  supabase/migrations/MIGRATION_032_GUIDE.md'
\echo ''

\timing off
