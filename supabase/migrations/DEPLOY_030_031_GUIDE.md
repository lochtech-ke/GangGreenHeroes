# V1.0 Major Release Database Migration Guide

## Overview

This guide covers the deployment of migrations 030 and 031, which implement the complete database schema for the V1.0 Major Release, including:

- **Platform Vision 2025**: Community engagement, AI companion, missions, verification, gamification
- **Age-Based Content Curation**: Personalization engine with cohort-based content delivery
- **Error Handling & Debugging**: Enterprise-grade error management and monitoring

## Migration Files

- `030_v1_major_release_schema.sql` - Core database schema with tables, indexes, and functions
- `031_v1_rls_policies.sql` - Comprehensive Row Level Security policies

## Pre-Deployment Checklist

### 1. Environment Verification
- [ ] Confirm target environment (staging/production)
- [ ] Verify Supabase project connection
- [ ] Check current migration status: `supabase db remote commit`
- [ ] Ensure database backup is recent (< 24 hours)

### 2. Dependencies Check
- [ ] PostgreSQL extensions enabled: `uuid-ossp`, `postgis`
- [ ] Existing tables: `users`, `user_profiles` (from migration 001)
- [ ] Auth system functional
- [ ] No conflicting table names

### 3. Resource Requirements
- [ ] Database storage: ~500MB additional space estimated
- [ ] Connection limits: Ensure sufficient connections for migration
- [ ] Timeout settings: Set to at least 10 minutes for large migrations

## Deployment Steps

### Step 1: Deploy Schema Migration (030)

```bash
# Navigate to project root
cd /path/to/ganggreen-platform

# Deploy schema migration
supabase db push --include-all

# Or deploy specific migration
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/030_v1_major_release_schema.sql
```

**Expected Duration**: 3-5 minutes
**Expected Output**: 
- 25+ new tables created
- 50+ indexes created
- 10+ functions created
- Triggers and constraints applied

### Step 2: Deploy RLS Policies (031)

```bash
# Deploy RLS policies
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/031_v1_rls_policies.sql
```

**Expected Duration**: 2-3 minutes
**Expected Output**:
- RLS enabled on all new tables
- 100+ policies created
- Security functions created

### Step 3: Verification

```sql
-- Verify table creation
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'communities', 'learning_modules', 'missions', 'verification_evidence',
  'green_coin_wallets', 'planted_trees', 'ambassadors', 'petitions',
  'chat_messages', 'content_age_targeting', 'curation_rules',
  'content_interactions', 'relevance_scores', 'cohort_engagement_metrics',
  'error_logs', 'error_analytics', 'circuit_breaker_state'
);

-- Verify indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename;

-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'calculate_age_cohort', 'update_age_cohort', 'update_community_member_count',
  'update_petition_signature_count', 'cleanup_expired_relevance_scores',
  'get_user_curation_preferences', 'is_admin', 'is_community_moderator',
  'can_review_evidence'
);
```

## Post-Deployment Tasks

### 1. Data Initialization

```sql
-- Initialize Green Coin wallets for existing users
INSERT INTO green_coin_wallets (user_id, balance, lifetime_earnings, lifetime_spending)
SELECT id, 0, 0, 0 
FROM users 
WHERE id NOT IN (SELECT user_id FROM green_coin_wallets);

-- Initialize user streaks for existing users
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
SELECT id, 0, 0, CURRENT_DATE 
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_streaks);

-- Create default badges
INSERT INTO badges (name, description, tier, icon_type, criteria) VALUES
('Tree Planter', 'Plant your first tree', 'steward', 'tree', '[{"metric": "trees_planted", "threshold": 1}]'),
('Community Member', 'Join your first community', 'steward', 'star', '[{"metric": "communities_joined", "threshold": 1}]'),
('Learner', 'Complete your first learning module', 'steward', 'star', '[{"metric": "modules_completed", "threshold": 1}]'),
('Mission Participant', 'Join your first mission', 'steward', 'shield', '[{"metric": "missions_joined", "threshold": 1}]'),
('Green Advocate', 'Sign your first petition', 'steward', 'star', '[{"metric": "petitions_signed", "threshold": 1}]');
```

### 2. Performance Optimization

```sql
-- Update table statistics
ANALYZE;

-- Vacuum tables for optimal performance
VACUUM ANALYZE;
```

### 3. Monitoring Setup

```sql
-- Create monitoring views for admins
CREATE OR REPLACE VIEW v1_health_check AS
SELECT 
  'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'communities', COUNT(*) FROM communities
UNION ALL
SELECT 'missions', COUNT(*) FROM missions
UNION ALL
SELECT 'learning_modules', COUNT(*) FROM learning_modules
UNION ALL
SELECT 'green_coin_wallets', COUNT(*) FROM green_coin_wallets
UNION ALL
SELECT 'planted_trees', COUNT(*) FROM planted_trees
UNION ALL
SELECT 'error_logs', COUNT(*) FROM error_logs;

-- Grant access to admins
GRANT SELECT ON v1_health_check TO authenticated;
```

## Rollback Plan

### Emergency Rollback (if needed within 1 hour)

```sql
-- Drop new tables in reverse dependency order
DROP TABLE IF EXISTS circuit_breaker_state CASCADE;
DROP TABLE IF EXISTS error_analytics CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS cohort_engagement_metrics CASCADE;
DROP TABLE IF EXISTS relevance_scores CASCADE;
DROP TABLE IF EXISTS content_interactions CASCADE;
DROP TABLE IF EXISTS curation_rules CASCADE;
DROP TABLE IF EXISTS content_age_targeting CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS petition_signatures CASCADE;
DROP TABLE IF EXISTS petitions CASCADE;
DROP TABLE IF EXISTS ambassadors CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS tree_photos CASCADE;
DROP TABLE IF EXISTS planted_trees CASCADE;
DROP TABLE IF EXISTS green_coin_transactions CASCADE;
DROP TABLE IF EXISTS green_coin_wallets CASCADE;
DROP TABLE IF EXISTS verification_reviews CASCADE;
DROP TABLE IF EXISTS verification_evidence CASCADE;
DROP TABLE IF EXISTS mission_participations CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS user_learning_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS learning_modules CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS user_climate_interests CASCADE;

-- Remove added columns from existing tables
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS age,
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS age_cohort,
DROP COLUMN IF EXISTS age_curation_enabled,
DROP COLUMN IF EXISTS is_ambassador,
DROP COLUMN IF EXISTS referral_code,
DROP COLUMN IF EXISTS referred_by,
DROP COLUMN IF EXISTS county,
DROP COLUMN IF EXISTS sub_county,
DROP COLUMN IF EXISTS bio;

ALTER TABLE users 
DROP COLUMN IF EXISTS user_type,
DROP COLUMN IF EXISTS journey_stage,
DROP COLUMN IF EXISTS badge_tier,
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS verified_at;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_age_cohort CASCADE;
DROP FUNCTION IF EXISTS update_age_cohort CASCADE;
DROP FUNCTION IF EXISTS update_community_member_count CASCADE;
DROP FUNCTION IF EXISTS update_petition_signature_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_relevance_scores CASCADE;
DROP FUNCTION IF EXISTS get_user_curation_preferences CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_community_moderator CASCADE;
DROP FUNCTION IF EXISTS can_review_evidence CASCADE;
```

## Testing Checklist

### Functional Tests

- [ ] User registration with age collection works
- [ ] Community creation and joining works
- [ ] Mission creation and participation works
- [ ] Learning module completion works
- [ ] Green Coin transactions work
- [ ] Tree planting records work
- [ ] Badge awarding works
- [ ] Petition creation and signing works
- [ ] Chat message storage works
- [ ] Content age targeting works
- [ ] Error logging works

### Security Tests

- [ ] RLS policies prevent unauthorized access
- [ ] Users can only see their own data
- [ ] Admins can access admin-only data
- [ ] Community moderators have appropriate permissions
- [ ] Age cohort data is properly protected

### Performance Tests

- [ ] Query performance on large datasets
- [ ] Index usage verification
- [ ] Connection pool stability
- [ ] Memory usage within limits

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Table Growth Rates**
   - `error_logs` - Should not grow too rapidly
   - `content_interactions` - Expected high growth
   - `green_coin_transactions` - Moderate growth

2. **Performance Metrics**
   - Query response times < 100ms for indexed queries
   - Connection count < 80% of limit
   - Database size growth rate

3. **Error Rates**
   - RLS policy violations
   - Constraint violations
   - Function execution errors

### Alert Thresholds

- Error log entries > 100/hour: Warning
- Error log entries > 500/hour: Critical
- Database connections > 80%: Warning
- Query response time > 1s: Warning
- Failed RLS policy checks > 10/hour: Warning

## Support Information

### Common Issues

1. **Migration Timeout**
   - Increase connection timeout
   - Run migrations during low-traffic periods
   - Consider running in smaller batches

2. **RLS Policy Conflicts**
   - Check existing policies on users/user_profiles tables
   - Verify auth.uid() function availability
   - Test with different user roles

3. **Index Creation Slow**
   - Normal for large existing datasets
   - Monitor progress with `pg_stat_progress_create_index`
   - Consider creating indexes CONCURRENTLY in production

### Contact Information

- **Database Team**: [database-team@ganggreen.com]
- **DevOps Team**: [devops@ganggreen.com]
- **Emergency Contact**: [emergency@ganggreen.com]

## Success Criteria

Migration is considered successful when:

- [ ] All tables created without errors
- [ ] All indexes created and being used
- [ ] All RLS policies active and working
- [ ] All functions executable
- [ ] Performance within acceptable limits
- [ ] No data loss or corruption
- [ ] Application functionality verified
- [ ] Monitoring and alerts configured

## Documentation Updates

After successful deployment:

- [ ] Update API documentation with new endpoints
- [ ] Update database schema documentation
- [ ] Update security documentation with new RLS policies
- [ ] Update monitoring runbooks
- [ ] Update backup and recovery procedures