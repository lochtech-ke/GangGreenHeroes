-- Verification Script for V1.0 Major Release Database Migration
-- Run this script after deploying migrations 030 and 031

-- ============================================================================
-- SECTION 1: TABLE VERIFICATION
-- ============================================================================

-- Check all expected tables exist
DO $
DECLARE
  expected_tables TEXT[] := ARRAY[
    'user_climate_interests', 'communities', 'community_members', 'community_posts',
    'learning_modules', 'lessons', 'user_learning_progress', 'missions', 'mission_participations',
    'verification_evidence', 'verification_reviews', 'green_coin_wallets', 'green_coin_transactions',
    'planted_trees', 'tree_photos', 'badges', 'user_badges', 'user_streaks', 'ambassadors',
    'petitions', 'petition_signatures', 'chat_messages', 'content_age_targeting', 'curation_rules',
    'content_interactions', 'relevance_scores', 'cohort_engagement_metrics', 'error_logs',
    'error_analytics', 'circuit_breaker_state'
  ];
  table_name TEXT;
  missing_tables TEXT[] := '{}';
BEGIN
  FOREACH table_name IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) THEN
      missing_tables := array_append(missing_tables, table_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All % expected tables exist', array_length(expected_tables, 1);
  END IF;
END;
$;

-- ============================================================================
-- SECTION 2: COLUMN VERIFICATION
-- ============================================================================

-- Check enhanced users table columns
DO $
DECLARE
  expected_columns TEXT[] := ARRAY['user_type', 'journey_stage', 'badge_tier', 'verification_status', 'verified_at'];
  column_name TEXT;
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY expected_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in users table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All expected columns exist in users table';
  END IF;
END;
$;

-- Check enhanced user_profiles table columns
DO $
DECLARE
  expected_columns TEXT[] := ARRAY['age', 'date_of_birth', 'age_cohort', 'age_curation_enabled', 'is_ambassador', 'referral_code', 'referred_by', 'county', 'sub_county', 'bio'];
  column_name TEXT;
  missing_columns TEXT[] := '{}';
BEGIN
  FOREACH column_name IN ARRAY expected_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = column_name
    ) THEN
      missing_columns := array_append(missing_columns, column_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in user_profiles table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All expected columns exist in user_profiles table';
  END IF;
END;
$;

-- ============================================================================
-- SECTION 3: INDEX VERIFICATION
-- ============================================================================

-- Check critical indexes exist
DO $
DECLARE
  expected_indexes TEXT[] := ARRAY[
    'idx_user_profiles_age_cohort', 'idx_communities_county', 'idx_missions_type',
    'idx_content_interactions_cohort_time', 'idx_relevance_scores_user',
    'idx_error_logs_code', 'idx_green_coin_transactions_user'
  ];
  index_name TEXT;
  missing_indexes TEXT[] := '{}';
BEGIN
  FOREACH index_name IN ARRAY expected_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = index_name
    ) THEN
      missing_indexes := array_append(missing_indexes, index_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE EXCEPTION 'Missing indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All critical indexes exist';
  END IF;
END;
$;

-- ============================================================================
-- SECTION 4: FUNCTION VERIFICATION
-- ============================================================================

-- Check all expected functions exist
DO $
DECLARE
  expected_functions TEXT[] := ARRAY[
    'calculate_age_cohort', 'update_age_cohort', 'update_community_member_count',
    'update_petition_signature_count', 'cleanup_expired_relevance_scores',
    'get_user_curation_preferences', 'is_admin', 'is_community_moderator',
    'can_review_evidence'
  ];
  function_name TEXT;
  missing_functions TEXT[] := '{}';
BEGIN
  FOREACH function_name IN ARRAY expected_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = function_name
    ) THEN
      missing_functions := array_append(missing_functions, function_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) > 0 THEN
    RAISE EXCEPTION 'Missing functions: %', array_to_string(missing_functions, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All expected functions exist';
  END IF;
END;
$;

-- ============================================================================
-- SECTION 5: RLS VERIFICATION
-- ============================================================================

-- Check RLS is enabled on all new tables
DO $
DECLARE
  tables_without_rls TEXT[] := '{}';
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'user_climate_interests', 'communities', 'community_members', 'community_posts',
      'learning_modules', 'lessons', 'user_learning_progress', 'missions', 'mission_participations',
      'verification_evidence', 'verification_reviews', 'green_coin_wallets', 'green_coin_transactions',
      'planted_trees', 'tree_photos', 'badges', 'user_badges', 'user_streaks', 'ambassadors',
      'petitions', 'petition_signatures', 'chat_messages', 'content_age_targeting', 'curation_rules',
      'content_interactions', 'relevance_scores', 'cohort_engagement_metrics', 'error_logs',
      'error_analytics', 'circuit_breaker_state'
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = table_record.table_name 
      AND rowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_record.table_name);
    END IF;
  END LOOP;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE EXCEPTION 'Tables without RLS enabled: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: RLS enabled on all new tables';
  END IF;
END;
$;

-- Check minimum number of policies exist
DO $
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  IF policy_count < 50 THEN
    RAISE EXCEPTION 'Insufficient RLS policies: % (expected at least 50)', policy_count;
  ELSE
    RAISE NOTICE 'SUCCESS: % RLS policies created', policy_count;
  END IF;
END;
$;

-- ============================================================================
-- SECTION 6: CONSTRAINT VERIFICATION
-- ============================================================================

-- Check foreign key constraints
DO $
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY'
  AND table_name IN (
    'user_climate_interests', 'community_members', 'community_posts', 'lessons',
    'user_learning_progress', 'mission_participations', 'verification_evidence',
    'verification_reviews', 'green_coin_transactions', 'tree_photos', 'user_badges',
    'petition_signatures', 'chat_messages', 'content_age_targeting'
  );
  
  IF constraint_count < 20 THEN
    RAISE EXCEPTION 'Insufficient foreign key constraints: % (expected at least 20)', constraint_count;
  ELSE
    RAISE NOTICE 'SUCCESS: % foreign key constraints created', constraint_count;
  END IF;
END;
$;

-- Check check constraints
DO $
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public' 
  AND constraint_type = 'CHECK';
  
  IF constraint_count < 15 THEN
    RAISE EXCEPTION 'Insufficient check constraints: % (expected at least 15)', constraint_count;
  ELSE
    RAISE NOTICE 'SUCCESS: % check constraints created', constraint_count;
  END IF;
END;
$;

-- ============================================================================
-- SECTION 7: TRIGGER VERIFICATION
-- ============================================================================

-- Check triggers exist
DO $
DECLARE
  expected_triggers TEXT[] := ARRAY[
    'trigger_update_age_cohort', 'trigger_community_member_count', 'trigger_petition_signature_count'
  ];
  trigger_name TEXT;
  missing_triggers TEXT[] := '{}';
BEGIN
  FOREACH trigger_name IN ARRAY expected_triggers
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' AND trigger_name = trigger_name
    ) THEN
      missing_triggers := array_append(missing_triggers, trigger_name);
    END IF;
  END LOOP;
  
  IF array_length(missing_triggers, 1) > 0 THEN
    RAISE EXCEPTION 'Missing triggers: %', array_to_string(missing_triggers, ', ');
  ELSE
    RAISE NOTICE 'SUCCESS: All expected triggers exist';
  END IF;
END;
$;

-- ============================================================================
-- SECTION 8: FUNCTIONAL TESTS
-- ============================================================================

-- Test age cohort calculation function
DO $
DECLARE
  result VARCHAR(10);
BEGIN
  SELECT calculate_age_cohort(16) INTO result;
  IF result != '13-17' THEN
    RAISE EXCEPTION 'Age cohort calculation failed for age 16: got %, expected 13-17', result;
  END IF;
  
  SELECT calculate_age_cohort(25) INTO result;
  IF result != '25-34' THEN
    RAISE EXCEPTION 'Age cohort calculation failed for age 25: got %, expected 25-34', result;
  END IF;
  
  SELECT calculate_age_cohort(55) INTO result;
  IF result != '50+' THEN
    RAISE EXCEPTION 'Age cohort calculation failed for age 55: got %, expected 50+', result;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Age cohort calculation function works correctly';
END;
$;

-- Test admin check function
DO $
BEGIN
  -- This should not raise an error (function exists and is callable)
  PERFORM is_admin(NULL);
  RAISE NOTICE 'SUCCESS: is_admin function is callable';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'is_admin function test failed: %', SQLERRM;
END;
$;

-- ============================================================================
-- SECTION 9: DATA TYPE VERIFICATION
-- ============================================================================

-- Check PostGIS geography columns
DO $
DECLARE
  geography_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO geography_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND data_type = 'USER-DEFINED'
  AND udt_name = 'geography'
  AND table_name IN ('missions', 'planted_trees');
  
  IF geography_count < 2 THEN
    RAISE EXCEPTION 'Missing geography columns: % (expected at least 2)', geography_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Geography columns created correctly';
  END IF;
END;
$;

-- Check JSONB columns
DO $
DECLARE
  jsonb_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO jsonb_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND data_type = 'jsonb';
  
  IF jsonb_count < 10 THEN
    RAISE EXCEPTION 'Missing JSONB columns: % (expected at least 10)', jsonb_count;
  ELSE
    RAISE NOTICE 'SUCCESS: JSONB columns created correctly';
  END IF;
END;
$;

-- ============================================================================
-- SECTION 10: SUMMARY REPORT
-- ============================================================================

-- Generate summary report
SELECT 
  'VERIFICATION COMPLETE' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_functions,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public') as total_constraints;

-- Final success message
DO $
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'V1.0 MIGRATION VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All checks passed successfully!';
  RAISE NOTICE 'Database is ready for V1.0 application deployment.';
  RAISE NOTICE '========================================';
END;
$;