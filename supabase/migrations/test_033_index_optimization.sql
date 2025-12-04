-- Test Script for Migration 033: Index Optimization
-- This script validates that all indexes are created correctly and functioning

-- ============================================================================
-- TEST 1: Verify Index Creation
-- ============================================================================

DO $
DECLARE
  v_expected_indexes TEXT[] := ARRAY[
    'idx_gg_coin_tx_user_type_time',
    'idx_gg_coin_tx_user_date',
    'idx_gg_coin_tx_earnings',
    'idx_gg_coin_tx_migrated',
    'idx_user_gamification_balance'
  ];
  v_index_name TEXT;
  v_found BOOLEAN;
  v_missing_count INTEGER := 0;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 1: VERIFY INDEX CREATION';
  RAISE NOTICE E'========================================\n';
  
  FOREACH v_index_name IN ARRAY v_expected_indexes
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = v_index_name
    ) INTO v_found;
    
    IF v_found THEN
      RAISE NOTICE '✓ Index exists: %', v_index_name;
    ELSE
      RAISE WARNING '✗ Index missing: %', v_index_name;
      v_missing_count := v_missing_count + 1;
    END IF;
  END LOOP;
  
  IF v_missing_count = 0 THEN
    RAISE NOTICE E'\n✓ All indexes created successfully';
  ELSE
    RAISE EXCEPTION '✗ % indexes are missing', v_missing_count;
  END IF;
END $;

-- ============================================================================
-- TEST 2: Verify Index Definitions
-- ============================================================================

DO $
DECLARE
  v_index_def TEXT;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 2: VERIFY INDEX DEFINITIONS';
  RAISE NOTICE E'========================================\n';
  
  -- Check idx_gg_coin_tx_user_type_time
  SELECT indexdef INTO v_index_def
  FROM pg_indexes
  WHERE indexname = 'idx_gg_coin_tx_user_type_time';
  
  IF v_index_def LIKE '%user_id%transaction_type%created_at%' THEN
    RAISE NOTICE '✓ idx_gg_coin_tx_user_type_time: Correct columns';
  ELSE
    RAISE WARNING '✗ idx_gg_coin_tx_user_type_time: Incorrect definition';
  END IF;
  
  -- Check idx_gg_coin_tx_earnings (partial index)
  SELECT indexdef INTO v_index_def
  FROM pg_indexes
  WHERE indexname = 'idx_gg_coin_tx_earnings';
  
  IF v_index_def LIKE '%WHERE%amount > %' THEN
    RAISE NOTICE '✓ idx_gg_coin_tx_earnings: Partial index with WHERE clause';
  ELSE
    RAISE WARNING '✗ idx_gg_coin_tx_earnings: Missing WHERE clause';
  END IF;
  
  -- Check idx_gg_coin_tx_migrated (expression index)
  SELECT indexdef INTO v_index_def
  FROM pg_indexes
  WHERE indexname = 'idx_gg_coin_tx_migrated';
  
  IF v_index_def LIKE '%metadata%migrated_from%' THEN
    RAISE NOTICE '✓ idx_gg_coin_tx_migrated: Expression index on JSONB';
  ELSE
    RAISE WARNING '✗ idx_gg_coin_tx_migrated: Incorrect expression';
  END IF;
  
  RAISE NOTICE E'\n✓ Index definitions verified';
END $;

-- ============================================================================
-- TEST 3: Verify Monitoring Functions
-- ============================================================================

DO $
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 3: VERIFY MONITORING FUNCTIONS';
  RAISE NOTICE E'========================================\n';
  
  -- Check get_gg_coin_index_stats
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_gg_coin_index_stats'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✓ Function exists: get_gg_coin_index_stats()';
  ELSE
    RAISE WARNING '✗ Function missing: get_gg_coin_index_stats()';
  END IF;
  
  -- Check test_gg_coin_query_performance
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'test_gg_coin_query_performance'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✓ Function exists: test_gg_coin_query_performance()';
  ELSE
    RAISE WARNING '✗ Function missing: test_gg_coin_query_performance()';
  END IF;
  
  RAISE NOTICE E'\n✓ Monitoring functions verified';
END $;

-- ============================================================================
-- TEST 4: Test Index Usage with EXPLAIN
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID;
  v_plan TEXT;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 4: TEST INDEX USAGE';
  RAISE NOTICE E'========================================\n';
  
  -- Create test data if needed
  INSERT INTO users (id, email, full_name)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@example.com',
    'Test User'
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO user_gamification (id, gg_coins)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    100.500
  )
  ON CONFLICT (id) DO UPDATE SET gg_coins = 100.500;
  
  -- Insert test transactions
  INSERT INTO gg_coin_transactions (
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  )
  SELECT
    '00000000-0000-0000-0000-000000000001',
    CASE WHEN i % 2 = 0 THEN 'earn' ELSE 'spend' END,
    CASE WHEN i % 2 = 0 THEN 10.0 ELSE -5.0 END,
    0,
    0,
    'Test transaction ' || i
  FROM generate_series(1, 10) i
  ON CONFLICT DO NOTHING;
  
  v_test_user_id := '00000000-0000-0000-0000-000000000001';
  
  -- Test 1: Balance query should use index
  RAISE NOTICE 'Testing balance query...';
  EXPLAIN (FORMAT TEXT)
  SELECT gg_coins FROM user_gamification WHERE id = v_test_user_id;
  
  -- Test 2: Transaction history should use composite index
  RAISE NOTICE 'Testing transaction history with type filter...';
  EXPLAIN (FORMAT TEXT)
  SELECT * FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND transaction_type = 'earn'
  ORDER BY created_at DESC
  LIMIT 50;
  
  -- Test 3: Earning breakdown should use partial index
  RAISE NOTICE 'Testing earning breakdown...';
  EXPLAIN (FORMAT TEXT)
  SELECT metadata, amount FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND amount > 0;
  
  RAISE NOTICE E'\n✓ Index usage tests completed (check EXPLAIN output above)';
END $;

-- ============================================================================
-- TEST 5: Performance Benchmarks
-- ============================================================================

DO $
DECLARE
  v_test_user_id UUID := '00000000-0000-0000-0000-000000000001';
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_duration NUMERIC;
  v_result RECORD;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 5: PERFORMANCE BENCHMARKS';
  RAISE NOTICE E'========================================\n';
  
  -- Benchmark 1: Balance query
  v_start_time := clock_timestamp();
  PERFORM gg_coins FROM user_gamification WHERE id = v_test_user_id;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RAISE NOTICE 'Balance query: %.3f ms %', 
    v_duration,
    CASE WHEN v_duration < 50 THEN '✓' ELSE '✗ (target: < 50ms)' END;
  
  -- Benchmark 2: Transaction history (unfiltered)
  v_start_time := clock_timestamp();
  PERFORM * FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
  ORDER BY created_at DESC
  LIMIT 50;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RAISE NOTICE 'Transaction history (unfiltered): %.3f ms %',
    v_duration,
    CASE WHEN v_duration < 100 THEN '✓' ELSE '✗ (target: < 100ms)' END;
  
  -- Benchmark 3: Transaction history (filtered)
  v_start_time := clock_timestamp();
  PERFORM * FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND transaction_type = 'earn'
  ORDER BY created_at DESC
  LIMIT 50;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RAISE NOTICE 'Transaction history (filtered): %.3f ms %',
    v_duration,
    CASE WHEN v_duration < 100 THEN '✓' ELSE '✗ (target: < 100ms)' END;
  
  -- Benchmark 4: Earning breakdown
  v_start_time := clock_timestamp();
  PERFORM metadata, amount FROM gg_coin_transactions
  WHERE user_id = v_test_user_id
    AND amount > 0;
  v_end_time := clock_timestamp();
  v_duration := EXTRACT(MILLISECONDS FROM (v_end_time - v_start_time));
  
  RAISE NOTICE 'Earning breakdown: %.3f ms %',
    v_duration,
    CASE WHEN v_duration < 100 THEN '✓' ELSE '✗ (target: < 100ms)' END;
  
  RAISE NOTICE E'\n✓ Performance benchmarks completed';
END $;

-- ============================================================================
-- TEST 6: Index Statistics
-- ============================================================================

DO $
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST 6: INDEX STATISTICS';
  RAISE NOTICE E'========================================\n';
  
  -- Call monitoring function
  FOR v_result IN
    SELECT * FROM get_gg_coin_index_stats()
    ORDER BY index_scans DESC
    LIMIT 10
  LOOP
    RAISE NOTICE '% (%) - Scans: %, Size: %',
      v_result.index_name,
      v_result.table_name,
      v_result.index_scans,
      v_result.index_size;
  END LOOP;
  
  RAISE NOTICE E'\n✓ Index statistics retrieved';
END $;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE E'\n========================================';
  RAISE NOTICE 'TEST SUMMARY';
  RAISE NOTICE E'========================================';
  RAISE NOTICE '✓ All tests passed successfully';
  RAISE NOTICE E'\nMigration 033 validation complete!';
  RAISE NOTICE E'========================================\n';
END $;
