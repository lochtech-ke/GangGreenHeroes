-- Rollback Script for Migration 032: Consolidate Green Coins into GG Coins
-- Description: Restores Green Coin tables and removes migrated data
-- WARNING: This is a destructive operation. Only use if migration failed immediately.
-- Requirements: B6.1 (Migration without downtime), B6.2 (Preserve historical data)
-- Date: 2025-01-30

-- ============================================================================
-- SECTION 1: PRE-ROLLBACK VALIDATION
-- ============================================================================

DO $
DECLARE
  v_migrated_tx_count INTEGER;
  v_gg_coin_balance DECIMAL(10,3);
  v_deprecated_wallet_count INTEGER;
  v_deprecated_tx_count INTEGER;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'ROLLBACK MIGRATION 032';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'WARNING: This will restore Green Coin tables';
  RAISE NOTICE 'and remove migrated GG Coin data.';
  RAISE NOTICE E'========================================\n';
  
  -- 1. Verify deprecated tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_deprecated_green_coin_wallets') THEN
    RAISE EXCEPTION 'Deprecated table _deprecated_green_coin_wallets does not exist. Migration may not have completed or already rolled back.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_deprecated_green_coin_transactions') THEN
    RAISE EXCEPTION 'Deprecated table _deprecated_green_coin_transactions does not exist. Migration may not have completed or already rolled back.';
  END IF;
  
  RAISE NOTICE '✓ Deprecated tables found';
  
  -- 2. Check if deprecated tables have data
  SELECT COUNT(*) INTO v_deprecated_wallet_count FROM _deprecated_green_coin_wallets;
  SELECT COUNT(*) INTO v_deprecated_tx_count FROM _deprecated_green_coin_transactions;
  
  IF v_deprecated_wallet_count = 0 THEN
    RAISE WARNING 'Deprecated wallet table is empty - no data to restore';
  END IF;
  
  IF v_deprecated_tx_count = 0 THEN
    RAISE WARNING 'Deprecated transaction table is empty - no data to restore';
  END IF;
  
  RAISE NOTICE '✓ Found % wallets and % transactions to restore', 
    v_deprecated_wallet_count, v_deprecated_tx_count;
  
  -- 3. Verify target tables exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
    RAISE EXCEPTION 'Target table user_gamification does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gg_coin_transactions') THEN
    RAISE WARNING 'Table gg_coin_transactions does not exist - nothing to clean up';
  END IF;
  
  RAISE NOTICE '✓ Target tables verified';
  
  -- 4. Check for migrated transactions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gg_coin_transactions') THEN
    SELECT COUNT(*) INTO v_migrated_tx_count
    FROM gg_coin_transactions
    WHERE metadata->>'migrated_from' = 'green_coins';
    
    RAISE NOTICE '✓ Found % migrated transactions to remove', v_migrated_tx_count;
  ELSE
    v_migrated_tx_count := 0;
  END IF;
  
  -- 5. Check current GG Coin balances
  SELECT COALESCE(SUM(gg_coins), 0) INTO v_gg_coin_balance
  FROM user_gamification
  WHERE gg_coins > 0;
  
  RAISE NOTICE '✓ Current GG Coin balance total: %', v_gg_coin_balance;
  
  -- 6. Warn about data loss
  IF v_gg_coin_balance > 0 THEN
    RAISE WARNING 'Current GG Coin balances will be preserved. Only migrated transactions will be removed.';
    RAISE WARNING 'If you want to completely reset GG Coins, you must do so manually after rollback.';
  END IF;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Pre-rollback validation passed';
  RAISE NOTICE 'Proceeding with rollback...';
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 2: ROLLBACK DATA MIGRATION
-- ============================================================================

BEGIN;

-- Step 1: Capture current state for verification
CREATE TEMP TABLE rollback_verification AS
SELECT 
  'pre_rollback' as stage,
  (SELECT COUNT(DISTINCT user_id) FROM _deprecated_green_coin_wallets) as deprecated_wallet_count,
  (SELECT COALESCE(SUM(balance), 0) FROM _deprecated_green_coin_wallets) as deprecated_balance_total,
  (SELECT COUNT(*) FROM _deprecated_green_coin_transactions) as deprecated_tx_count,
  (SELECT COUNT(*) FROM gg_coin_transactions WHERE metadata->>'migrated_from' = 'green_coins') as migrated_tx_count,
  (SELECT COALESCE(SUM(gg_coins), 0) FROM user_gamification) as current_gg_balance_total,
  NOW() as captured_at;

DO $
DECLARE
  v_verification RECORD;
BEGIN
  SELECT * INTO v_verification FROM rollback_verification WHERE stage = 'pre_rollback';
  
  RAISE NOTICE 'Captured pre-rollback state:';
  RAISE NOTICE '  - Deprecated wallets: %', v_verification.deprecated_wallet_count;
  RAISE NOTICE '  - Deprecated balance total: %', v_verification.deprecated_balance_total;
  RAISE NOTICE '  - Deprecated transactions: %', v_verification.deprecated_tx_count;
  RAISE NOTICE '  - Migrated transactions to remove: %', v_verification.migrated_tx_count;
  RAISE NOTICE '  - Current GG balance total: %', v_verification.current_gg_balance_total;
END $;

-- Step 2: Create backup of current GG Coin state (in case we need to re-migrate)
CREATE TEMP TABLE gg_coin_backup AS
SELECT 
  id,
  gg_coins,
  updated_at
FROM user_gamification
WHERE gg_coins > 0;

RAISE NOTICE 'Created backup of current GG Coin balances (% records)', 
  (SELECT COUNT(*) FROM gg_coin_backup);

-- Step 3: Remove migrated GG Coin transactions
-- Only remove transactions that were migrated from Green Coins
DO $
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM gg_coin_transactions
    WHERE metadata->>'migrated_from' = 'green_coins'
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  RAISE NOTICE 'Removed % migrated transactions from gg_coin_transactions', v_deleted_count;
  
  IF v_deleted_count = 0 THEN
    RAISE WARNING 'No migrated transactions found to remove';
  END IF;
END $;

-- Step 4: Restore Green Coin table names
ALTER TABLE _deprecated_green_coin_wallets RENAME TO green_coin_wallets;
ALTER TABLE _deprecated_green_coin_transactions RENAME TO green_coin_transactions;

RAISE NOTICE 'Restored Green Coin table names';

-- Step 5: Remove deprecation comments and restore original comments
COMMENT ON TABLE green_coin_wallets IS 
  'User virtual currency wallets for Green Coins. Stores balance and transaction history.';
  
COMMENT ON TABLE green_coin_transactions IS 
  'Transaction log for all Green Coin movements (earn, spend, bonus, referral).';

COMMENT ON COLUMN green_coin_wallets.balance IS
  'Current Green Coin balance (INTEGER). Maintained by triggers on green_coin_transactions.';

COMMENT ON COLUMN green_coin_transactions.amount IS
  'Transaction amount (INTEGER). Positive for credits, negative for debits.';

RAISE NOTICE 'Restored table and column comments';

-- Step 6: Recreate indexes if they were dropped during migration
CREATE INDEX IF NOT EXISTS idx_green_coin_wallets_user_id 
  ON green_coin_wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_user_id 
  ON green_coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_timestamp 
  ON green_coin_transactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_green_coin_transactions_type 
  ON green_coin_transactions(transaction_type);

RAISE NOTICE 'Recreated Green Coin table indexes';

-- Step 7: Optionally subtract migrated balances from GG Coins
-- This is commented out by default to preserve any non-migrated GG Coins
-- Uncomment if you want to completely reverse the balance migration
/*
DO $
DECLARE
  v_updated_count INTEGER;
BEGIN
  WITH migration_amounts AS (
    SELECT 
      user_id,
      balance::DECIMAL(10,3) as migrated_amount
    FROM green_coin_wallets
  )
  UPDATE user_gamification ug
  SET 
    gg_coins = GREATEST(0, ug.gg_coins - ma.migrated_amount),
    updated_at = NOW()
  FROM migration_amounts ma
  WHERE ug.id = ma.user_id
    AND ug.gg_coins >= ma.migrated_amount;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE 'Subtracted migrated balances from % user accounts', v_updated_count;
END $;
*/

RAISE NOTICE 'Skipped GG Coin balance adjustment (commented out by default)';
RAISE NOTICE 'To reverse balance migration, uncomment Step 7 in rollback script';

-- Step 8: Verify rollback integrity
DO $
DECLARE
  v_wallet_count INTEGER;
  v_tx_count INTEGER;
  v_remaining_migrated_tx INTEGER;
  v_balance_total DECIMAL(10,3);
  v_orphaned_wallets INTEGER;
  v_orphaned_transactions INTEGER;
BEGIN
  -- Count restored records
  SELECT COUNT(*) INTO v_wallet_count FROM green_coin_wallets;
  SELECT COUNT(*) INTO v_tx_count FROM green_coin_transactions;
  SELECT COALESCE(SUM(balance), 0) INTO v_balance_total FROM green_coin_wallets;
  
  -- Check for remaining migrated transactions (should be 0)
  SELECT COUNT(*) INTO v_remaining_migrated_tx
  FROM gg_coin_transactions
  WHERE metadata->>'migrated_from' = 'green_coins';
  
  -- Check for orphaned records
  SELECT COUNT(*) INTO v_orphaned_wallets
  FROM green_coin_wallets gcw
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gcw.user_id);
  
  SELECT COUNT(*) INTO v_orphaned_transactions
  FROM green_coin_transactions gct
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = gct.user_id);
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Rollback Verification:';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '  - Green Coin wallets restored: %', v_wallet_count;
  RAISE NOTICE '  - Green Coin transactions restored: %', v_tx_count;
  RAISE NOTICE '  - Total balance restored: %', v_balance_total;
  RAISE NOTICE '  - Remaining migrated transactions: %', v_remaining_migrated_tx;
  RAISE NOTICE '  - Orphaned wallets: %', v_orphaned_wallets;
  RAISE NOTICE '  - Orphaned transactions: %', v_orphaned_transactions;
  RAISE NOTICE E'========================================';
  
  IF v_wallet_count = 0 THEN
    RAISE WARNING 'No Green Coin wallets found after rollback - this may indicate an issue';
  END IF;
  
  IF v_remaining_migrated_tx > 0 THEN
    RAISE WARNING 'Found % remaining migrated transactions - cleanup may be incomplete', v_remaining_migrated_tx;
  END IF;
  
  IF v_orphaned_wallets > 0 THEN
    RAISE WARNING 'Found % orphaned wallet records (user does not exist)', v_orphaned_wallets;
  END IF;
  
  IF v_orphaned_transactions > 0 THEN
    RAISE WARNING 'Found % orphaned transaction records (user does not exist)', v_orphaned_transactions;
  END IF;
END $;

-- Step 9: Record rollback completion
INSERT INTO rollback_verification
SELECT 
  'post_rollback' as stage,
  (SELECT COUNT(DISTINCT user_id) FROM green_coin_wallets) as deprecated_wallet_count,
  (SELECT COALESCE(SUM(balance), 0) FROM green_coin_wallets) as deprecated_balance_total,
  (SELECT COUNT(*) FROM green_coin_transactions) as deprecated_tx_count,
  (SELECT COUNT(*) FROM gg_coin_transactions WHERE metadata->>'migrated_from' = 'green_coins') as migrated_tx_count,
  (SELECT COALESCE(SUM(gg_coins), 0) FROM user_gamification) as current_gg_balance_total,
  NOW() as captured_at;

COMMIT;

-- ============================================================================
-- SECTION 3: CLEANUP AND RESTORATION
-- ============================================================================

-- Drop migration helper functions
DROP FUNCTION IF EXISTS is_migrated_transaction(JSONB);
DROP FUNCTION IF EXISTS get_coin_migration_stats();

RAISE NOTICE 'Dropped migration helper functions';

-- Restore Row-Level Security policies for Green Coin tables if they existed
-- Note: These are examples - adjust based on your actual RLS policies
DO $
BEGIN
  -- Enable RLS on restored tables
  ALTER TABLE green_coin_wallets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE green_coin_transactions ENABLE ROW LEVEL SECURITY;
  
  -- Recreate policies (if they existed before migration)
  -- Users can view their own wallet
  DROP POLICY IF EXISTS "Users view own wallet" ON green_coin_wallets;
  CREATE POLICY "Users view own wallet"
    ON green_coin_wallets
    FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Users can view their own transactions
  DROP POLICY IF EXISTS "Users view own transactions" ON green_coin_transactions;
  CREATE POLICY "Users view own transactions"
    ON green_coin_transactions
    FOR SELECT
    USING (auth.uid() = user_id);
  
  -- Only system can modify wallets and transactions
  DROP POLICY IF EXISTS "System modifies wallets" ON green_coin_wallets;
  CREATE POLICY "System modifies wallets"
    ON green_coin_wallets
    FOR ALL
    USING (auth.role() = 'service_role');
  
  DROP POLICY IF EXISTS "System creates transactions" ON green_coin_transactions;
  CREATE POLICY "System creates transactions"
    ON green_coin_transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
  
  RAISE NOTICE 'Restored Row-Level Security policies';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not restore RLS policies: %', SQLERRM;
    RAISE NOTICE 'You may need to manually recreate RLS policies';
END $;

-- Recreate triggers if they existed
-- Note: Adjust based on your actual trigger definitions
DO $
BEGIN
  -- Example: Trigger to update wallet balance on transaction insert
  -- This is a placeholder - adjust based on your actual triggers
  /*
  CREATE OR REPLACE FUNCTION update_green_coin_balance()
  RETURNS TRIGGER AS $
  BEGIN
    UPDATE green_coin_wallets
    SET 
      balance = balance + NEW.amount,
      last_updated = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  END;
  $ LANGUAGE plpgsql;
  
  DROP TRIGGER IF EXISTS trg_update_green_coin_balance ON green_coin_transactions;
  CREATE TRIGGER trg_update_green_coin_balance
    AFTER INSERT ON green_coin_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_green_coin_balance();
  */
  
  RAISE NOTICE 'Trigger restoration skipped (uncomment if needed)';
END $;

-- Update table statistics for query optimization
ANALYZE green_coin_wallets;
ANALYZE green_coin_transactions;
ANALYZE user_gamification;
ANALYZE gg_coin_transactions;

RAISE NOTICE 'Updated table statistics';

-- ============================================================================
-- SECTION 4: ROLLBACK SUMMARY AND VERIFICATION REPORT
-- ============================================================================

DO $
DECLARE
  v_pre_rollback RECORD;
  v_post_rollback RECORD;
  v_wallet_diff INTEGER;
  v_balance_diff DECIMAL(10,3);
  v_tx_diff INTEGER;
BEGIN
  -- Get pre and post rollback stats
  SELECT * INTO v_pre_rollback FROM rollback_verification WHERE stage = 'pre_rollback';
  SELECT * INTO v_post_rollback FROM rollback_verification WHERE stage = 'post_rollback';
  
  -- Calculate differences
  v_wallet_diff := v_post_rollback.deprecated_wallet_count - v_pre_rollback.deprecated_wallet_count;
  v_balance_diff := v_post_rollback.deprecated_balance_total - v_pre_rollback.deprecated_balance_total;
  v_tx_diff := v_post_rollback.deprecated_tx_count - v_pre_rollback.deprecated_tx_count;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'ROLLBACK 032 COMPLETED SUCCESSFULLY';
  RAISE NOTICE E'========================================';
  RAISE NOTICE E'\nPre-Rollback State:';
  RAISE NOTICE '  - Deprecated wallets: %', v_pre_rollback.deprecated_wallet_count;
  RAISE NOTICE '  - Deprecated balance: %', v_pre_rollback.deprecated_balance_total;
  RAISE NOTICE '  - Deprecated transactions: %', v_pre_rollback.deprecated_tx_count;
  RAISE NOTICE '  - Migrated transactions: %', v_pre_rollback.migrated_tx_count;
  RAISE NOTICE '  - GG balance total: %', v_pre_rollback.current_gg_balance_total;
  
  RAISE NOTICE E'\nPost-Rollback State:';
  RAISE NOTICE '  - Restored wallets: %', v_post_rollback.deprecated_wallet_count;
  RAISE NOTICE '  - Restored balance: %', v_post_rollback.deprecated_balance_total;
  RAISE NOTICE '  - Restored transactions: %', v_post_rollback.deprecated_tx_count;
  RAISE NOTICE '  - Remaining migrated tx: %', v_post_rollback.migrated_tx_count;
  RAISE NOTICE '  - GG balance total: %', v_post_rollback.current_gg_balance_total;
  
  RAISE NOTICE E'\nChanges:';
  RAISE NOTICE '  - Wallet difference: %', v_wallet_diff;
  RAISE NOTICE '  - Balance difference: %', v_balance_diff;
  RAISE NOTICE '  - Transaction difference: %', v_tx_diff;
  RAISE NOTICE '  - Migrated tx removed: %', 
    v_pre_rollback.migrated_tx_count - v_post_rollback.migrated_tx_count;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Rollback Actions Completed:';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '  ✓ Green Coin tables restored';
  RAISE NOTICE '  ✓ Migrated transactions removed';
  RAISE NOTICE '  ✓ Helper functions dropped';
  RAISE NOTICE '  ✓ Table comments restored';
  RAISE NOTICE '  ✓ Indexes recreated';
  RAISE NOTICE '  ✓ RLS policies restored';
  RAISE NOTICE '  ✓ Statistics updated';
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Important Notes:';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '  ⚠ GG Coin balances were NOT modified';
  RAISE NOTICE '  ⚠ To reverse balance migration, uncomment Step 7';
  RAISE NOTICE '  ⚠ Backup of GG balances stored in temp table';
  RAISE NOTICE '  ⚠ Review triggers and recreate if needed';
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '  1. Verify Green Coin service is working';
  RAISE NOTICE '  2. Test wallet balance queries';
  RAISE NOTICE '  3. Test transaction recording';
  RAISE NOTICE '  4. Check application logs for errors';
  RAISE NOTICE '  5. Investigate migration failure cause';
  RAISE NOTICE '  6. Review and fix data integrity issues';
  RAISE NOTICE '  7. Update migration script if needed';
  RAISE NOTICE '  8. Re-test migration on staging environment';
  RAISE NOTICE '  9. Fix all issues before re-attempting migration';
  RAISE NOTICE '  10. Document lessons learned';
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'Rollback Verification Data:';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '  - Pre-rollback captured: %', v_pre_rollback.captured_at;
  RAISE NOTICE '  - Post-rollback captured: %', v_post_rollback.captured_at;
  RAISE NOTICE '  - Duration: % seconds', 
    EXTRACT(EPOCH FROM (v_post_rollback.captured_at - v_pre_rollback.captured_at));
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE E'========================================\n';
END $;
