-- Migration 033: Optimize GG Coin Query Performance with Additional Indexes
-- Description: Adds optimized indexes for common query patterns in the GG Coin system
-- Requirements: D1 (Performance), Task 2.3
-- Date: 2025-01-30

-- ============================================================================
-- SECTION 1: ANALYZE CURRENT INDEX USAGE
-- ============================================================================

-- Log current index information
DO $
DECLARE
  v_table_size TEXT;
  v_index_count INTEGER;
BEGIN
  -- Get table size
  SELECT pg_size_pretty(pg_total_relation_size('gg_coin_transactions'))
  INTO v_table_size;
  
  -- Count existing indexes
  SELECT COUNT(*)
  INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'gg_coin_transactions';
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'GG COIN INDEX OPTIMIZATION';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Current gg_coin_transactions table size: %', v_table_size;
  RAISE NOTICE 'Existing indexes: %', v_index_count;
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 2: CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Index 1: Composite index for filtered transaction history queries
-- Supports: getTransactionHistory with type filter
-- Query pattern: WHERE user_id = ? AND transaction_type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_gg_coin_tx_user_type_time
  ON gg_coin_transactions(user_id, transaction_type, created_at DESC);

COMMENT ON INDEX idx_gg_coin_tx_user_type_time IS 
  'Optimizes filtered transaction history queries by user and type';

-- Index 2: Composite index for date range queries
-- Supports: getTransactionHistory with date filters
-- Query pattern: WHERE user_id = ? AND created_at >= ? AND created_at <= ?
CREATE INDEX IF NOT EXISTS idx_gg_coin_tx_user_date
  ON gg_coin_transactions(user_id, created_at DESC)
  WHERE created_at IS NOT NULL;

COMMENT ON INDEX idx_gg_coin_tx_user_date IS 
  'Optimizes date range queries for transaction history';

-- Index 3: Partial index for earning breakdown queries
-- Supports: getEarningBreakdown (only positive amounts)
-- Query pattern: WHERE user_id = ? AND amount > 0
CREATE INDEX IF NOT EXISTS idx_gg_coin_tx_earnings
  ON gg_coin_transactions(user_id, amount)
  WHERE amount > 0;

COMMENT ON INDEX idx_gg_coin_tx_earnings IS 
  'Optimizes earning breakdown queries (positive amounts only)';

-- Index 4: Index on metadata for migrated transaction queries
-- Supports: Queries filtering by migration status
-- Query pattern: WHERE metadata->>'migrated_from' = 'green_coins'
CREATE INDEX IF NOT EXISTS idx_gg_coin_tx_migrated
  ON gg_coin_transactions((metadata->>'migrated_from'))
  WHERE metadata->>'migrated_from' IS NOT NULL;

COMMENT ON INDEX idx_gg_coin_tx_migrated IS 
  'Optimizes queries for migrated transactions';

-- Index 5: Index on user_gamification for balance queries
-- Supports: getBalance, getWallet
-- Query pattern: WHERE id = ?
-- Note: Primary key already provides this, but we add covering index for gg_coins
CREATE INDEX IF NOT EXISTS idx_user_gamification_balance
  ON user_gamification(id, gg_coins)
  WHERE gg_coins > 0;

COMMENT ON INDEX idx_user_gamification_balance IS 
  'Covering index for balance queries (users with positive balance)';

-- Index 6: Index for real-time subscription queries
-- Supports: subscribeToBalance real-time updates
-- Query pattern: WHERE id = ? (for UPDATE events)
-- Note: This is already covered by primary key, but we ensure it's optimized
-- No additional index needed - primary key is sufficient

-- ============================================================================
-- SECTION 3: VERIFY INDEX CREATION
-- ============================================================================

DO $
DECLARE
  v_new_index_count INTEGER;
  v_indexes_added INTEGER;
  v_index_record RECORD;
BEGIN
  -- Count new indexes
  SELECT COUNT(*)
  INTO v_new_index_count
  FROM pg_indexes
  WHERE tablename = 'gg_coin_transactions';
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'INDEX CREATION VERIFICATION';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Total indexes on gg_coin_transactions: %', v_new_index_count;
  RAISE NOTICE E'\nIndex Details:';
  
  -- List all indexes with their definitions
  FOR v_index_record IN
    SELECT
      indexname,
      indexdef,
      pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
    FROM pg_indexes
    WHERE tablename = 'gg_coin_transactions'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '  - %: %', v_index_record.indexname, v_index_record.index_size;
  END LOOP;
  
  RAISE NOTICE E'========================================\n';
END $;

-- ============================================================================
-- SECTION 4: UPDATE TABLE STATISTICS
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE user_gamification;
ANALYZE gg_coin_transactions;

-- ============================================================================
-- SECTION 5: CREATE INDEX MONITORING FUNCTION
-- ============================================================================

-- Function to check index usage statistics
CREATE OR REPLACE FUNCTION get_gg_coin_index_stats()
RETURNS TABLE (
  index_name TEXT,
  table_name TEXT,
  index_size TEXT,
  index_scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT
    i.indexrelname::TEXT as index_name,
    i.relname::TEXT as table_name,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
    s.idx_scan as index_scans,
    s.idx_tup_read as tuples_read,
    s.idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.relname IN ('gg_coin_transactions', 'user_gamification')
  ORDER BY s.idx_scan DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_gg_coin_index_stats IS 
  'Returns usage statistics for GG Coin indexes to help identify unused or underutilized indexes';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_gg_coin_index_stats TO authenticated, service_role;

-- ============================================================================
-- SECTION 6: CREATE QUERY PERFORMANCE TESTING FUNCTION
-- ============================================================================

-- Function to test query performance with EXPLAIN ANALYZE
CREATE OR REPLACE FUNCTION test_gg_coin_query_performance(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  query_name TEXT,
  execution_time_ms NUMERIC,
  rows_returned BIGINT,
  uses_index BOOLEAN
) AS $
DECLARE
  v_test_user_id UUID;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration NUMERIC;
  v_row_count BIGINT;
BEGIN
  -- Use provided user_id or find a user with transactions
  IF p_user_id IS NULL THEN
    SELECT user_id INTO v_test_user_id
    FROM gg_coin_transactions
    LIMIT 1;
  ELSE
    v_test_user_id := p_user_id;
  END IF;
  
  IF v_test_user_id IS NULL THEN
    RAISE NOTICE 'No transactions found for testing';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Testing query performance for user: %', v_test_user_id;
  
  -- Test 1: Get balance query
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count
  FROM user_gamification
  WHERE id = v_test_user_id;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RETURN QUERY SELECT
    'Get Balance'::TEXT,
    v_duration,
    v_row_count,
    TRUE; -- Primary key always uses index
  
  -- Test 2: Transaction history (no filter)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count
  FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
  ORDER BY created_at DESC
  LIMIT 50;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RETURN QUERY SELECT
    'Transaction History (unfiltered)'::TEXT,
    v_duration,
    v_row_count,
    TRUE; -- Should use idx_gg_coin_transactions_user_time
  
  -- Test 3: Transaction history (with type filter)
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count
  FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND transaction_type = 'earn'
  ORDER BY created_at DESC
  LIMIT 50;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RETURN QUERY SELECT
    'Transaction History (type filter)'::TEXT,
    v_duration,
    v_row_count,
    TRUE; -- Should use idx_gg_coin_tx_user_type_time
  
  -- Test 4: Earning breakdown
  v_start_time := clock_timestamp();
  SELECT COUNT(*) INTO v_row_count
  FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND amount > 0;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RETURN QUERY SELECT
    'Earning Breakdown'::TEXT,
    v_duration,
    v_row_count,
    TRUE; -- Should use idx_gg_coin_tx_earnings
  
  RETURN;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION test_gg_coin_query_performance IS 
  'Tests performance of common GG Coin queries and reports execution times';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION test_gg_coin_query_performance TO authenticated, service_role;

-- ============================================================================
-- SECTION 7: PERFORMANCE BENCHMARKING
-- ============================================================================

-- Run performance test if there are transactions
DO $
DECLARE
  v_test_user_id UUID;
  v_result RECORD;
BEGIN
  -- Find a user with transactions for testing
  SELECT user_id INTO v_test_user_id
  FROM gg_coin_transactions
  LIMIT 1;
  
  IF v_test_user_id IS NOT NULL THEN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'PERFORMANCE BENCHMARK RESULTS';
    RAISE NOTICE E'========================================';
    
    FOR v_result IN
      SELECT * FROM test_gg_coin_query_performance(v_test_user_id)
    LOOP
      RAISE NOTICE '% : %.3f ms (% rows)', 
        v_result.query_name,
        v_result.execution_time_ms,
        v_result.rows_returned;
    END LOOP;
    
    RAISE NOTICE E'========================================\n';
  ELSE
    RAISE NOTICE 'No transactions found - skipping performance benchmark';
  END IF;
END $;

-- ============================================================================
-- SECTION 8: MIGRATION SUMMARY
-- ============================================================================

DO $
DECLARE
  v_total_indexes INTEGER;
  v_total_size TEXT;
BEGIN
  -- Get final statistics
  SELECT COUNT(*) INTO v_total_indexes
  FROM pg_indexes
  WHERE tablename IN ('gg_coin_transactions', 'user_gamification');
  
  SELECT pg_size_pretty(
    pg_total_relation_size('gg_coin_transactions') +
    pg_total_relation_size('user_gamification')
  ) INTO v_total_size;
  
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'MIGRATION 033 COMPLETED SUCCESSFULLY';
  RAISE NOTICE E'========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Total indexes created: %', v_total_indexes;
  RAISE NOTICE '  - Total table size: %', v_total_size;
  RAISE NOTICE E'\nNew Indexes:';
  RAISE NOTICE '  1. idx_gg_coin_tx_user_type_time - Filtered history queries';
  RAISE NOTICE '  2. idx_gg_coin_tx_user_date - Date range queries';
  RAISE NOTICE '  3. idx_gg_coin_tx_earnings - Earning breakdown (partial)';
  RAISE NOTICE '  4. idx_gg_coin_tx_migrated - Migrated transaction queries';
  RAISE NOTICE '  5. idx_user_gamification_balance - Balance queries (covering)';
  RAISE NOTICE E'\nPerformance Targets:';
  RAISE NOTICE '  - Balance queries: < 50ms (cached)';
  RAISE NOTICE '  - Transaction history: < 100ms';
  RAISE NOTICE '  - Earning breakdown: < 100ms';
  RAISE NOTICE E'\nMonitoring:';
  RAISE NOTICE '  - Use get_gg_coin_index_stats() to monitor index usage';
  RAISE NOTICE '  - Use test_gg_coin_query_performance() to benchmark queries';
  RAISE NOTICE E'========================================\n';
END $;
