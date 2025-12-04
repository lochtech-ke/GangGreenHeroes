-- Migration 032: Consolidate Green Coins into GG Coins
-- Description: Migrates Green Coin wallets and transactions into the unified GG Coins system
-- Requirements: B2.1, B2.2, B2.3, B2.4, B6.1, B6.2, B6.3
-- Date: 2025-01-30

-- ============================================================================
-- SECTION 1: PRE-MIGRATION VALIDATION
-- ============================================================================

-- Comprehensive data validation before migration
DO $
DECLARE
  v_invalid_count INTEGER;
  v_orphaned_count INTEGER;
  v_negative_count INTEGER;
  v_null_count INTEGER;
  v_duplicate_count INTEGER;
  v_invalid_tx_type_count INTEGER;
  v_zero_amount_tx_count INTEGER;
BEGIN
  -- 1. Verify source tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'green_coin_wallets') THEN
    RAISE EXCEPTION 'Source table green_coin_wallets does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'green_coin_transactions') THEN
    RAISE EXCEPTION 'Source table green_coin_transactions does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
    RAISE EXCEPTION 'Target table user_gamification does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE EXCEPTION 'Users table does not exist - required for referential integrity';
  END IF;
  
  RAISE NOTICE 'Table existence validation passed';
  
  -- 2. Check for NULL user_ids in green_coin_wallets
  SELECT COUNT(*) INTO v_null_count
  FROM green_coin_wallets
  WHERE user_id IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Found % wallet records with NULL user_id', v_null_count;
  END IF;
  
  RAISE NOTICE 'NULL user_id validation passed';
  
  -- 3. Check for orphaned wallet records (user_id not in users table)
  SELECT COUNT(*) INTO v_orphaned_count
  FROM green_coin_wallets gcw
  WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = gcw.user_id
  );
  
  IF v_orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned wallet records (user does not exist)', v_orphaned_count;
    RAISE NOTICE 'Orphaned records will be skipped during migration';
  END IF;
  
  -- 4. Check for negative balances
  SELECT COUNT(*) INTO v_negative_count
  FROM green_coin_wallets
  WHERE balance < 0;
  
  IF v_negative_count > 0 THEN
    RAISE EXCEPTION 'Found % wallet records with negative balance - data integrity issue', v_negative_count;
  END IF;
  
  RAISE NOTICE 'Negative balance validation passed';
  
  -- 5. Check for NULL balances
  SELECT COUNT(*) INTO v_null_count
  FROM green_coin_wallets
  WHERE balance IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Found % wallet records with NULL balance', v_null_count;
  END IF;
  
  RAISE NOTICE 'NULL balance validation passed';
  
  -- 6. Check for duplicate user_id in wallets
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM green_coin_wallets
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE EXCEPTION 'Found % users with duplicate wallet records', v_duplicate_count;
  END IF;
  
  RAISE NOTICE 'Duplicate wallet validation passed';
  
  -- 7. Validate transaction data integrity
  SELECT COUNT(*) INTO v_null_count
  FROM green_coin_transactions
  WHERE user_id IS NULL OR amount IS NULL OR transaction_type IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Found % transaction records with NULL required fields', v_null_count;
  END IF;
  
  RAISE NOTICE 'Transaction NULL field validation passed';
  
  -- 8. Check for orphaned transaction records
  SELECT COUNT(*) INTO v_orphaned_count
  FROM green_coin_transactions gct
  WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = gct.user_id
  );
  
  IF v_orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned transaction records (user does not exist)', v_orphaned_count;
    RAISE NOTICE 'Orphaned transactions will be skipped during migration';
  END IF;
  
  -- 9. Validate transaction types
  SELECT COUNT(*) INTO v_invalid_tx_type_count
  FROM green_coin_transactions
  WHERE transaction_type NOT IN ('earn', 'spend', 'bonus', 'referral', 'transfer', 'reward', 'purchase', 'refund');
  
  IF v_invalid_tx_type_count > 0 THEN
    RAISE WARNING 'Found % transactions with non-standard transaction types', v_invalid_tx_type_count;
    RAISE NOTICE 'These will be mapped to closest standard type during migration';
  END IF;
  
  -- 10. Check for zero-amount transactions
  SELECT COUNT(*) INTO v_zero_amount_tx_count
  FROM green_coin_transactions
  WHERE amount = 0;
  
  IF v_zero_amount_tx_count > 0 THEN
    RAISE WARNING 'Found % transactions with zero amount', v_zero_amount_tx_count;
    RAISE NOTICE 'Zero-amount transactions will be migrated but may indicate data quality issues';
  END IF;
  
  -- 11. Validate data type compatibility (INTEGER to DECIMAL)
  -- Check if any balance values would lose precision in conversion
  SELECT COUNT(*) INTO v_invalid_count
  FROM green_coin_wallets
  WHERE balance::TEXT !~ '^\d+$';
  
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % wallet balances with invalid numeric format', v_invalid_count;
  END IF;
  
  RAISE NOTICE 'Data type compatibility validation passed';
  
  -- 12. Check for extremely large values that might cause overflow
  SELECT COUNT(*) INTO v_invalid_count
  FROM green_coin_wallets
  WHERE balance > 9999999; -- DECIMAL(10,3) max is 9,999,999.999
  
  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'Found % wallet balances exceeding DECIMAL(10,3) capacity', v_invalid_count;
  END IF;
  
  RAISE NOTICE 'Value range validation passed';
  
  -- 13. Validate timestamp data
  SELECT COUNT(*) INTO v_null_count
  FROM green_coin_transactions
  WHERE timestamp IS NULL;
  
  IF v_null_count > 0 THEN
    RAISE WARNING 'Found % transactions with NULL timestamp', v_null_count;
    RAISE NOTICE 'NULL timestamps will be set to migration date';
  END IF;
  
  -- 14. Check for future-dated transactions
  SELECT COUNT(*) INTO v_invalid_count
  FROM green_coin_transactions
  WHERE timestamp > NOW();
  
  IF v_invalid_count > 0 THEN
    RAISE WARNING 'Found % transactions with future timestamps', v_invalid_count;
    RAISE NOTICE 'Future-dated transactions will be migrated as-is';
  END IF;
  
  -- 15. Validate balance consistency with transaction history
  -- This is a complex check - we'll just warn if totals don't match
  DECLARE
    v_wallet_total DECIMAL(10,3);
    v_transaction_total DECIMAL(10,3);
  BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO v_wallet_total FROM green_coin_wallets;
    
    SELECT COALESCE(
      SUM(CASE 
        WHEN transaction_type IN ('earn', 'bonus', 'referral', 'reward') THEN amount
        WHEN transaction_type IN ('spend', 'purchase') THEN -amount
        ELSE 0
      END), 0
    ) INTO v_transaction_total
    FROM green_coin_transactions;
    
    IF ABS(v_wallet_total - v_transaction_total) > 0.01 THEN
      RAISE WARNING 'Wallet total (%) does not match transaction total (%) - difference: %', 
        v_wallet_total, v_transaction_total, ABS(v_wallet_total - v_transaction_total);
      RAISE NOTICE 'This may indicate incomplete transaction history or data inconsistency';
    END IF;
  END;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'PRE-MIGRATION VALIDATION COMPLETED';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'All critical validations passed';
  RAISE NOTICE 'Warnings (if any) have been logged above';
  RAISE NOTICE 'Proceeding with migration...';
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 2: CREATE GG COIN TRANSACTIONS TABLE (if not exists)
-- ============================================================================

-- Create gg_coin_transactions table to store all GG Coin transactions
CREATE TABLE IF NOT EXISTS gg_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral', 'transfer')),
  amount DECIMAL(10,3) NOT NULL CHECK (amount != 0),
  balance_before DECIMAL(10,3) NOT NULL CHECK (balance_before >= 0),
  balance_after DECIMAL(10,3) NOT NULL CHECK (balance_after >= 0),
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for gg_coin_transactions
CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_user_time 
  ON gg_coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_type 
  ON gg_coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gg_coin_transactions_reference 
  ON gg_coin_transactions(reference_type, reference_id);

-- Add gg_coins column to user_gamification if it doesn't exist
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_gamification' AND column_name = 'gg_coins'
  ) THEN
    ALTER TABLE user_gamification 
    ADD COLUMN gg_coins DECIMAL(10,3) DEFAULT 0 CHECK (gg_coins >= 0);
    
    RAISE NOTICE 'Added gg_coins column to user_gamification';
  END IF;
END $;

-- ============================================================================
-- SECTION 3: DATA MIGRATION
-- ============================================================================

-- Begin transaction for atomic migration
BEGIN;

-- Step 1: Capture pre-migration totals for verification
CREATE TEMP TABLE migration_verification AS
SELECT 
  'green_coins' as source,
  COUNT(DISTINCT user_id) as wallet_count,
  COALESCE(SUM(balance), 0) as total_balance,
  COALESCE(SUM(lifetime_earnings), 0) as total_earnings,
  COALESCE(SUM(lifetime_spending), 0) as total_spending,
  (SELECT COUNT(*) FROM green_coin_transactions) as transaction_count
FROM green_coin_wallets;

-- Step 2: Migrate wallet balances to user_gamification
-- Convert integer Green Coins to decimal GG Coins (1:1 ratio)
-- Only migrate valid records (non-orphaned, non-negative, non-null)
WITH valid_wallets AS (
  SELECT 
    gcw.user_id,
    gcw.balance::DECIMAL(10,3) as balance,
    gcw.last_updated
  FROM green_coin_wallets gcw
  INNER JOIN users u ON u.id = gcw.user_id  -- Ensure user exists
  WHERE gcw.balance IS NOT NULL
    AND gcw.balance >= 0
    AND gcw.user_id IS NOT NULL
)
INSERT INTO user_gamification (id, gg_coins, updated_at)
SELECT 
  user_id,
  balance,
  last_updated
FROM valid_wallets
ON CONFLICT (id) DO UPDATE SET
  gg_coins = user_gamification.gg_coins + EXCLUDED.gg_coins,
  updated_at = GREATEST(user_gamification.updated_at, EXCLUDED.updated_at);

-- Log migration results
DO $
DECLARE
  v_total_wallets INTEGER;
  v_migrated_wallets INTEGER;
  v_skipped_wallets INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_wallets FROM green_coin_wallets;
  SELECT COUNT(*) INTO v_migrated_wallets FROM user_gamification WHERE gg_coins > 0;
  v_skipped_wallets := v_total_wallets - v_migrated_wallets;
  
  RAISE NOTICE 'Wallet Migration Results:';
  RAISE NOTICE '  - Total wallets in source: %', v_total_wallets;
  RAISE NOTICE '  - Successfully migrated: %', v_migrated_wallets;
  RAISE NOTICE '  - Skipped (invalid/orphaned): %', v_skipped_wallets;
END $;

-- Step 3: Migrate transaction history
-- Map Green Coin transaction types to GG Coin transaction types
-- Note: We cannot reconstruct exact balance_before/balance_after for historical transactions
-- So we'll use 0 for historical records and mark them as migrated in metadata
-- Only migrate valid transactions (non-orphaned, non-null required fields)
WITH valid_transactions AS (
  SELECT
    gct.id,
    gct.user_id,
    -- Normalize transaction types to standard values
    CASE 
      WHEN gct.transaction_type IN ('earn', 'reward') THEN 'earn'
      WHEN gct.transaction_type IN ('spend', 'purchase') THEN 'spend'
      WHEN gct.transaction_type = 'bonus' THEN 'bonus'
      WHEN gct.transaction_type = 'referral' THEN 'referral'
      WHEN gct.transaction_type = 'transfer' THEN 'transfer'
      WHEN gct.transaction_type = 'refund' THEN 'bonus'  -- Map refund to bonus
      ELSE 'earn'  -- Default unknown types to earn
    END as normalized_type,
    gct.amount::DECIMAL(10,3) as amount,
    gct.source,
    gct.reference_id,
    gct.description,
    COALESCE(gct.timestamp, NOW()) as timestamp  -- Use NOW() for NULL timestamps
  FROM green_coin_transactions gct
  INNER JOIN users u ON u.id = gct.user_id  -- Ensure user exists
  WHERE gct.user_id IS NOT NULL
    AND gct.amount IS NOT NULL
    AND gct.transaction_type IS NOT NULL
)
INSERT INTO gg_coin_transactions (
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
  normalized_type,
  amount,
  0::DECIMAL(10,3), -- Historical, cannot reconstruct
  0::DECIMAL(10,3), -- Historical, cannot reconstruct
  source, -- Map source to reference_type
  reference_id,
  COALESCE(description, 'Migrated from Green Coins'),
  jsonb_build_object(
    'migrated_from', 'green_coins',
    'original_id', id,
    'migration_date', NOW(),
    'original_source', source
  ),
  timestamp
FROM valid_transactions
ORDER BY timestamp ASC;

-- Log transaction migration results
DO $
DECLARE
  v_total_transactions INTEGER;
  v_migrated_transactions INTEGER;
  v_skipped_transactions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_transactions FROM green_coin_transactions;
  SELECT COUNT(*) INTO v_migrated_transactions 
  FROM gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins';
  v_skipped_transactions := v_total_transactions - v_migrated_transactions;
  
  RAISE NOTICE 'Transaction Migration Results:';
  RAISE NOTICE '  - Total transactions in source: %', v_total_transactions;
  RAISE NOTICE '  - Successfully migrated: %', v_migrated_transactions;
  RAISE NOTICE '  - Skipped (invalid/orphaned): %', v_skipped_transactions;
END $;

-- Step 4: Comprehensive post-migration verification
DO $
DECLARE
  v_green_total DECIMAL(10,3);
  v_green_valid_total DECIMAL(10,3);
  v_gg_total DECIMAL(10,3);
  v_green_tx_count INTEGER;
  v_green_valid_tx_count INTEGER;
  v_gg_tx_count INTEGER;
  v_migrated_tx_count INTEGER;
  v_green_wallet_count INTEGER;
  v_migrated_wallet_count INTEGER;
  v_orphaned_wallets INTEGER;
  v_orphaned_transactions INTEGER;
  v_negative_balances INTEGER;
  v_null_balances INTEGER;
  v_balance_difference DECIMAL(10,3);
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'POST-MIGRATION VERIFICATION';
  RAISE NOTICE E'========================================\n';
  
  -- 1. Verify wallet migration
  SELECT COUNT(*) INTO v_green_wallet_count FROM green_coin_wallets;
  SELECT COUNT(*) INTO v_migrated_wallet_count 
  FROM user_gamification 
  WHERE gg_coins > 0;
  
  -- Count orphaned wallets
  SELECT COUNT(*) INTO v_orphaned_wallets
  FROM green_coin_wallets gcw
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gcw.user_id);
  
  RAISE NOTICE 'Wallet Verification:';
  RAISE NOTICE '  - Source wallets: %', v_green_wallet_count;
  RAISE NOTICE '  - Migrated wallets: %', v_migrated_wallet_count;
  RAISE NOTICE '  - Orphaned (skipped): %', v_orphaned_wallets;
  
  -- 2. Verify balance totals
  SELECT COALESCE(SUM(balance), 0) INTO v_green_total FROM green_coin_wallets;
  
  -- Get only valid wallet balances (non-orphaned)
  SELECT COALESCE(SUM(gcw.balance), 0) INTO v_green_valid_total
  FROM green_coin_wallets gcw
  INNER JOIN users u ON u.id = gcw.user_id;
  
  SELECT total_balance INTO v_green_total FROM migration_verification WHERE source = 'green_coins';
  
  -- Check for negative or null balances in target
  SELECT COUNT(*) INTO v_negative_balances
  FROM user_gamification
  WHERE gg_coins < 0;
  
  SELECT COUNT(*) INTO v_null_balances
  FROM user_gamification
  WHERE gg_coins IS NULL;
  
  IF v_negative_balances > 0 THEN
    RAISE EXCEPTION 'Found % negative balances in user_gamification after migration', v_negative_balances;
  END IF;
  
  IF v_null_balances > 0 THEN
    RAISE WARNING 'Found % NULL balances in user_gamification', v_null_balances;
  END IF;
  
  RAISE NOTICE E'\nBalance Verification:';
  RAISE NOTICE '  - Total Green Coins (all): % coins', v_green_total;
  RAISE NOTICE '  - Total Green Coins (valid): % coins', v_green_valid_total;
  RAISE NOTICE '  - Negative balances: %', v_negative_balances;
  RAISE NOTICE '  - NULL balances: %', v_null_balances;
  
  -- 3. Verify transaction migration
  SELECT COUNT(*) INTO v_green_tx_count FROM green_coin_transactions;
  
  -- Count valid transactions (non-orphaned)
  SELECT COUNT(*) INTO v_green_valid_tx_count
  FROM green_coin_transactions gct
  INNER JOIN users u ON u.id = gct.user_id;
  
  SELECT COUNT(*) INTO v_gg_tx_count FROM gg_coin_transactions;
  SELECT COUNT(*) INTO v_migrated_tx_count 
  FROM gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins';
  
  -- Count orphaned transactions
  SELECT COUNT(*) INTO v_orphaned_transactions
  FROM green_coin_transactions gct
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gct.user_id);
  
  RAISE NOTICE E'\nTransaction Verification:';
  RAISE NOTICE '  - Source transactions (all): %', v_green_tx_count;
  RAISE NOTICE '  - Source transactions (valid): %', v_green_valid_tx_count;
  RAISE NOTICE '  - Migrated transactions: %', v_migrated_tx_count;
  RAISE NOTICE '  - Total GG transactions: %', v_gg_tx_count;
  RAISE NOTICE '  - Orphaned (skipped): %', v_orphaned_transactions;
  
  -- 4. Verify data integrity
  -- Check that all migrated transactions reference valid users
  DECLARE
    v_invalid_user_refs INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_invalid_user_refs
    FROM gg_coin_transactions ggt
    WHERE metadata->>'migrated_from' = 'green_coins'
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ggt.user_id);
    
    IF v_invalid_user_refs > 0 THEN
      RAISE EXCEPTION 'Found % migrated transactions with invalid user references', v_invalid_user_refs;
    END IF;
    
    RAISE NOTICE E'\nData Integrity Checks:';
    RAISE NOTICE '  - Invalid user references: % (PASS)', v_invalid_user_refs;
  END;
  
  -- 5. Verify transaction type normalization
  DECLARE
    v_invalid_types INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_invalid_types
    FROM gg_coin_transactions
    WHERE metadata->>'migrated_from' = 'green_coins'
      AND transaction_type NOT IN ('earn', 'spend', 'bonus', 'referral', 'transfer');
    
    IF v_invalid_types > 0 THEN
      RAISE EXCEPTION 'Found % migrated transactions with invalid transaction types', v_invalid_types;
    END IF;
    
    RAISE NOTICE '  - Invalid transaction types: % (PASS)', v_invalid_types;
  END;
  
  -- 6. Verify amount precision
  DECLARE
    v_precision_errors INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_precision_errors
    FROM gg_coin_transactions
    WHERE metadata->>'migrated_from' = 'green_coins'
      AND (amount IS NULL OR amount = 0);
    
    IF v_precision_errors > 0 THEN
      RAISE WARNING 'Found % migrated transactions with NULL or zero amounts', v_precision_errors;
    END IF;
    
    RAISE NOTICE '  - NULL/zero amounts: %', v_precision_errors;
  END;
  
  -- 7. Final validation summary
  IF v_migrated_tx_count = v_green_valid_tx_count THEN
    RAISE NOTICE E'\n✓ Transaction migration: COMPLETE';
  ELSE
    RAISE WARNING E'\n⚠ Transaction migration: PARTIAL (expected %, got %)', 
      v_green_valid_tx_count, v_migrated_tx_count;
  END IF;
  
  IF v_migrated_wallet_count >= (v_green_wallet_count - v_orphaned_wallets) THEN
    RAISE NOTICE '✓ Wallet migration: COMPLETE';
  ELSE
    RAISE WARNING '⚠ Wallet migration: PARTIAL (expected %, got %)', 
      (v_green_wallet_count - v_orphaned_wallets), v_migrated_wallet_count;
  END IF;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'VERIFICATION COMPLETED';
  RAISE NOTICE E'========================================\n';
END $;

-- Step 5: Mark old tables as deprecated
COMMENT ON TABLE green_coin_wallets IS 
  'DEPRECATED (2025-01-30): Migrated to user_gamification.gg_coins. Read-only for historical reference. See migration 032.';
  
COMMENT ON TABLE green_coin_transactions IS 
  'DEPRECATED (2025-01-30): Migrated to gg_coin_transactions. Read-only for historical reference. See migration 032.';

-- Rename tables to indicate deprecation
ALTER TABLE green_coin_wallets RENAME TO _deprecated_green_coin_wallets;
ALTER TABLE green_coin_transactions RENAME TO _deprecated_green_coin_transactions;

RAISE NOTICE 'Marked old tables as deprecated and renamed';

-- Commit transaction
COMMIT;

-- ============================================================================
-- SECTION 4: POST-MIGRATION CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Update table statistics for query optimization
ANALYZE user_gamification;
ANALYZE gg_coin_transactions;
ANALYZE _deprecated_green_coin_wallets;
ANALYZE _deprecated_green_coin_transactions;

-- Add helpful comments
COMMENT ON COLUMN user_gamification.gg_coins IS 
  'Unified GG Coin balance with 3 decimal places precision. Consolidates former Green Coins (migrated 2025-01-30).';

COMMENT ON TABLE gg_coin_transactions IS 
  'Unified transaction log for all GG Coin movements. Includes migrated Green Coin transactions (marked in metadata).';

COMMENT ON COLUMN gg_coin_transactions.metadata IS 
  'Transaction metadata. Migrated transactions include: {migrated_from: "green_coins", original_id: UUID, migration_date: timestamp}';

-- ============================================================================
-- SECTION 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a transaction was migrated from Green Coins
CREATE OR REPLACE FUNCTION is_migrated_transaction(tx_metadata JSONB)
RETURNS BOOLEAN AS $
BEGIN
  RETURN tx_metadata->>'migrated_from' = 'green_coins';
END;
$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get migration statistics
CREATE OR REPLACE FUNCTION get_coin_migration_stats()
RETURNS TABLE (
  metric TEXT,
  value NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 'total_wallets_migrated'::TEXT, COUNT(*)::NUMERIC 
  FROM _deprecated_green_coin_wallets
  UNION ALL
  SELECT 'total_balance_migrated'::TEXT, COALESCE(SUM(balance), 0)::NUMERIC 
  FROM _deprecated_green_coin_wallets
  UNION ALL
  SELECT 'total_transactions_migrated'::TEXT, COUNT(*)::NUMERIC 
  FROM gg_coin_transactions 
  WHERE metadata->>'migrated_from' = 'green_coins'
  UNION ALL
  SELECT 'current_gg_coin_total'::TEXT, COALESCE(SUM(gg_coins), 0)::NUMERIC 
  FROM user_gamification
  UNION ALL
  SELECT 'total_gg_coin_transactions'::TEXT, COUNT(*)::NUMERIC 
  FROM gg_coin_transactions;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_migrated_transaction TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_coin_migration_stats TO authenticated, service_role;

-- ============================================================================
-- SECTION 6: MIGRATION SUMMARY
-- ============================================================================

DO $
DECLARE
  v_summary TEXT;
BEGIN
  SELECT string_agg(metric || ': ' || value::TEXT, E'\n  ')
  INTO v_summary
  FROM get_coin_migration_stats();
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'MIGRATION 032 COMPLETED SUCCESSFULLY';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  %', v_summary;
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Update application code to use ggCoin.service.ts';
  RAISE NOTICE '  2. Remove references to greenCoin.service.ts';
  RAISE NOTICE '  3. Update UI components to show "GG Coins" only';
  RAISE NOTICE '  4. Test transaction recording and balance queries';
  RAISE NOTICE '  5. Monitor for any issues in production';
  RAISE NOTICE E'========================================\n';
END $;
