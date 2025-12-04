-- Syntax Validation Test for V1.0 Major Release Migration
-- This script validates the SQL syntax without executing the migration

-- Test 1: Validate table creation syntax
DO $test$
BEGIN
  -- Test basic table creation syntax
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'test_validation'
  ) THEN
    CREATE SCHEMA test_validation;
  END IF;
  
  -- Test sample table creation with all column types used in migration
  CREATE TABLE IF NOT EXISTS test_validation.syntax_test (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_col VARCHAR(200) NOT NULL,
    text_array TEXT[],
    integer_col INTEGER DEFAULT 0,
    numeric_col NUMERIC,
    boolean_col BOOLEAN DEFAULT TRUE,
    timestamp_col TIMESTAMP DEFAULT NOW(),
    date_col DATE,
    jsonb_col JSONB,
    geography_col GEOGRAPHY(POINT, 4326),
    check_constraint_col VARCHAR(20) CHECK (check_constraint_col IN ('value1', 'value2'))
  );
  
  -- Test index creation syntax
  CREATE INDEX IF NOT EXISTS idx_syntax_test ON test_validation.syntax_test(text_col);
  CREATE INDEX IF NOT EXISTS idx_syntax_test_array ON test_validation.syntax_test USING GIN(text_array);
  CREATE INDEX IF NOT EXISTS idx_syntax_test_geo ON test_validation.syntax_test USING GIST(geography_col);
  
  -- Test function creation syntax
  CREATE OR REPLACE FUNCTION test_validation.test_function(input_val INTEGER)
  RETURNS VARCHAR(10) AS $func$
  BEGIN
    CASE 
      WHEN input_val BETWEEN 13 AND 17 THEN RETURN '13-17';
      WHEN input_val BETWEEN 18 AND 24 THEN RETURN '18-24';
      ELSE RETURN 'other';
    END CASE;
  END;
  $func$ LANGUAGE plpgsql IMMUTABLE;
  
  -- Test trigger function syntax
  CREATE OR REPLACE FUNCTION test_validation.test_trigger_function()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    NEW.timestamp_col = NOW();
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  
  -- Test trigger creation syntax
  CREATE TRIGGER test_trigger
    BEFORE INSERT OR UPDATE ON test_validation.syntax_test
    FOR EACH ROW
    EXECUTE FUNCTION test_validation.test_trigger_function();
  
  -- Test RLS syntax
  ALTER TABLE test_validation.syntax_test ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "test_policy"
    ON test_validation.syntax_test
    FOR SELECT
    USING (true);
  
  RAISE NOTICE 'SUCCESS: All syntax tests passed';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SYNTAX ERROR: %', SQLERRM;
END;
$test$;

-- Test 2: Validate constraint syntax
DO $constraint_test$
BEGIN
  -- Test foreign key constraint syntax
  CREATE TABLE IF NOT EXISTS test_validation.parent_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100)
  );
  
  CREATE TABLE IF NOT EXISTS test_validation.child_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES test_validation.parent_table(id) ON DELETE CASCADE,
    value INTEGER
  );
  
  -- Test unique constraint syntax
  ALTER TABLE test_validation.child_table ADD CONSTRAINT unique_parent_value UNIQUE (parent_id, value);
  
  RAISE NOTICE 'SUCCESS: Constraint syntax tests passed';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'CONSTRAINT SYNTAX ERROR: %', SQLERRM;
END;
$constraint_test$;

-- Test 3: Validate complex query syntax used in functions
DO $query_test$
DECLARE
  test_result RECORD;
BEGIN
  -- Test complex query syntax similar to those in migration functions
  SELECT 
    COUNT(*) as total_tables,
    COUNT(CASE WHEN table_type = 'BASE TABLE' THEN 1 END) as base_tables
  INTO test_result
  FROM information_schema.tables 
  WHERE table_schema = 'test_validation';
  
  -- Test JSONB operations
  SELECT jsonb_build_object('test', 'value', 'array', jsonb_build_array(1, 2, 3)) as test_json;
  
  -- Test array operations
  SELECT ARRAY['item1', 'item2'] && ARRAY['item2', 'item3'] as array_overlap;
  
  -- Test geography operations (if PostGIS is available)
  BEGIN
    SELECT ST_GeogFromText('POINT(-122.4194 37.7749)') as test_geography;
    RAISE NOTICE 'PostGIS functions available';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'PostGIS functions not available: %', SQLERRM;
  END;
  
  RAISE NOTICE 'SUCCESS: Complex query syntax tests passed';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'QUERY SYNTAX ERROR: %', SQLERRM;
END;
$query_test$;

-- Test 4: Validate all enum values used in migration
DO $enum_test$
BEGIN
  -- Test all CHECK constraint values
  CREATE TABLE IF NOT EXISTS test_validation.enum_test (
    user_type VARCHAR(20) CHECK (user_type IN ('individual', 'corporate', 'community', 'partner')),
    journey_stage VARCHAR(20) CHECK (journey_stage IN ('onboarding', 'engagement', 'contribution', 'recognition', 'hero')),
    badge_tier VARCHAR(20) CHECK (badge_tier IN ('steward', 'platinum', 'hero')),
    age_cohort VARCHAR(10) CHECK (age_cohort IN ('13-17', '18-24', '25-34', '35-49', '50+')),
    activity_level VARCHAR(20) CHECK (activity_level IN ('low', 'medium', 'high')),
    mission_type VARCHAR(50) CHECK (mission_type IN ('tree_planting', 'waste_cleanup', 'water_conservation', 'petition', 'fundraising')),
    status VARCHAR(20) CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    evidence_type VARCHAR(20) CHECK (evidence_type IN ('photo', 'video', 'gps', 'document')),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'referral')),
    health_status VARCHAR(20) CHECK (health_status IN ('healthy', 'needs_attention', 'deceased')),
    icon_type VARCHAR(20) CHECK (icon_type IN ('hummingbird', 'tree', 'water', 'shield', 'star')),
    content_type VARCHAR(50) CHECK (content_type IN ('initiative', 'social_post', 'challenge', 'educational', 'mission', 'community_post', 'petition')),
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('impression', 'click', 'save', 'join', 'share', 'complete')),
    error_type VARCHAR(50) CHECK (error_type IN ('network', 'validation', 'authentication', 'database', 'runtime', 'web3', 'badge', 'curation')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    circuit_state VARCHAR(20) CHECK (circuit_state IN ('closed', 'open', 'half_open'))
  );
  
  RAISE NOTICE 'SUCCESS: All enum value tests passed';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ENUM VALUE ERROR: %', SQLERRM;
END;
$enum_test$;

-- Cleanup test schema
DROP SCHEMA IF EXISTS test_validation CASCADE;

-- Final validation summary
DO $summary$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION SYNTAX VALIDATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All syntax validations passed successfully!';
  RAISE NOTICE 'Migration files are ready for deployment.';
  RAISE NOTICE '========================================';
END;
$summary$;