# V1.0 Major Release Database Migration

## Overview

This directory contains the complete database schema migration for the V1.0 Major Release of the #GangGreen platform. The migration implements three major feature sets:

1. **Platform Vision 2025** - Community engagement, AI companion, missions, verification, gamification
2. **Age-Based Content Curation** - Intelligent personalization engine with demographic targeting
3. **Error Handling & Debugging** - Enterprise-grade error management and monitoring

## Migration Files

### Core Migration Files
- `030_v1_major_release_schema.sql` - Main schema migration (tables, indexes, functions, triggers)
- `031_v1_rls_policies.sql` - Row Level Security policies for all tables

### Supporting Files
- `DEPLOY_030_031_GUIDE.md` - Comprehensive deployment guide with pre/post steps
- `verify_030_031_migration.sql` - Complete verification script for post-deployment testing
- `test_migration_syntax.sql` - Syntax validation script for pre-deployment testing
- `V1_MIGRATION_README.md` - This documentation file

## Database Schema Summary

### New Tables Created (31 total)

#### Platform Vision Tables (21 tables)
- `user_climate_interests` - User climate action preferences
- `communities` - Local and thematic communities
- `community_members` - Community membership with roles
- `community_posts` - User-generated community content
- `learning_modules` - Educational content with rewards
- `lessons` - Individual lessons within modules
- `user_learning_progress` - User progress tracking
- `missions` - Climate action missions and challenges
- `mission_participations` - User mission participation
- `verification_evidence` - Evidence for action verification
- `verification_reviews` - Expert reviews of evidence
- `green_coin_wallets` - Virtual currency wallets
- `green_coin_transactions` - All coin transactions
- `planted_trees` - Digital tree wallet entries
- `tree_photos` - Tree photos over time
- `badges` - Achievement badges with criteria
- `user_badges` - User badge achievements
- `user_streaks` - Activity streak tracking
- `ambassadors` - Community leaders and ambassadors
- `petitions` - Policy engagement petitions
- `petition_signatures` - User petition signatures
- `chat_messages` - AI Climate Companion chat history

#### Content Curation Tables (5 tables)
- `content_age_targeting` - Age targeting metadata for content
- `curation_rules` - Rules for age-based content curation
- `content_interactions` - User content interactions for analytics
- `relevance_scores` - Cached relevance scores for personalization
- `cohort_engagement_metrics` - Engagement metrics by age cohort

#### Error Handling Tables (3 tables)
- `error_logs` - Application error logs with context
- `error_analytics` - Aggregated error analytics and trends
- `circuit_breaker_state` - Circuit breaker state for error recovery

#### Enhanced Existing Tables
- `users` - Added user_type, journey_stage, badge_tier, verification fields
- `user_profiles` - Added age, age_cohort, ambassador, referral, location fields

### Key Features

#### Age-Based Content Curation
- Automatic age cohort calculation (13-17, 18-24, 25-34, 35-49, 50+)
- Content targeting and filtering by age groups
- Personalized relevance scoring
- Engagement tracking and analytics

#### Comprehensive Gamification
- Multi-tier badge system (Steward → Platinum → Hero)
- Green Coins virtual currency with transaction tracking
- Activity streaks and leaderboards
- Mission-based challenges with verification

#### Enterprise Error Handling
- Structured error logging with sanitization
- Circuit breaker pattern for resilience
- Error analytics and monitoring
- Centralized error management

#### Community Engagement
- Community creation and management
- Role-based permissions (member, moderator, admin)
- Community posts and discussions
- Ambassador program

#### Verification-as-a-Service (VaaS)
- Evidence submission with GPS and photos
- Expert review workflow
- Public verification reports
- Multi-organization reviewer support

### Database Indexes (50+ indexes)

#### Performance Indexes
- User and profile lookups by age cohort, location, referral codes
- Community browsing by location and activity level
- Mission filtering by type, status, location (geospatial)
- Content curation by user, cohort, and relevance scores
- Error tracking by code, type, severity, and timestamp
- Transaction history by user and type

#### Specialized Indexes
- GIN indexes for array columns (focus_areas, target_cohorts)
- GIST indexes for geography columns (mission and tree locations)
- Composite indexes for common query patterns
- Partial indexes for active/published content

### Functions and Triggers (9 functions, 3 triggers)

#### Utility Functions
- `calculate_age_cohort(age)` - Determines age cohort from age
- `cleanup_expired_relevance_scores()` - Cache maintenance
- `get_user_curation_preferences(user_id)` - User preference aggregation

#### Security Functions
- `is_admin(user_id)` - Admin role checking
- `is_community_moderator(user_id, community_id)` - Moderation permissions
- `can_review_evidence(user_id)` - Verification permissions

#### Trigger Functions
- `update_age_cohort()` - Auto-update age cohort when age changes
- `update_community_member_count()` - Maintain community member counts
- `update_petition_signature_count()` - Maintain petition signature counts

### Row Level Security (RLS)

#### Security Model
- All tables have RLS enabled
- 100+ policies covering all access patterns
- User data isolation (users see only their own data)
- Role-based access for admins and moderators
- Community-based access for community content

#### Key Security Features
- Age data encryption and restricted access
- Sensitive data sanitization in error logs
- Community moderation permissions
- Verification reviewer authorization
- Admin-only access to analytics and error data

## Deployment Instructions

### Prerequisites
- PostgreSQL 17+ with PostGIS extension
- Supabase project with admin access
- Database backup completed
- Estimated deployment time: 10-15 minutes

### Quick Deployment
```bash
# Navigate to project root
cd /path/to/ganggreen-platform

# Deploy schema migration
npx supabase db push

# Or deploy manually
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/030_v1_major_release_schema.sql
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/031_v1_rls_policies.sql
```

### Verification
```bash
# Run verification script
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/verify_030_031_migration.sql
```

### Post-Deployment
1. Initialize Green Coin wallets for existing users
2. Create default badges
3. Update table statistics
4. Configure monitoring

## Testing Strategy

### Pre-Deployment Testing
- Syntax validation with `test_migration_syntax.sql`
- Schema validation in staging environment
- Performance testing with sample data
- RLS policy testing with different user roles

### Post-Deployment Testing
- Functional testing of all new features
- Performance benchmarking
- Security testing of RLS policies
- Integration testing with application code

## Performance Considerations

### Optimization Features
- Strategic indexing for common query patterns
- Materialized views for complex aggregations
- Caching layer for relevance scores
- Efficient pagination support

### Expected Performance
- User profile queries: < 50ms
- Content curation requests: < 200ms
- Mission browsing: < 100ms
- Error logging: < 10ms (async)
- Community feeds: < 150ms

### Monitoring Metrics
- Query response times
- Index usage statistics
- Table growth rates
- Error log volume
- Cache hit rates

## Security Features

### Data Protection
- Age data encryption at rest
- PII sanitization in error logs
- Secure token handling
- Input validation and sanitization

### Access Control
- Comprehensive RLS policies
- Role-based permissions
- Community-based access control
- Admin audit trails

### Privacy Compliance
- Age data handling with user consent
- Right to deletion support
- Data retention policies
- Anonymization capabilities

## Maintenance and Operations

### Regular Maintenance
- Clean up expired relevance scores (daily)
- Archive old error logs (weekly)
- Update table statistics (weekly)
- Monitor index usage (monthly)

### Backup Strategy
- Full database backup before deployment
- Incremental backups every 6 hours
- Point-in-time recovery capability
- Cross-region backup replication

### Monitoring and Alerts
- Error rate monitoring
- Performance threshold alerts
- Storage usage monitoring
- Connection pool monitoring

## Rollback Plan

### Emergency Rollback
If issues are detected within 1 hour of deployment:
1. Stop application traffic
2. Execute rollback script (provided in deployment guide)
3. Restore from pre-deployment backup
4. Verify data integrity
5. Resume application traffic

### Partial Rollback
For specific feature issues:
1. Disable problematic features via feature flags
2. Update RLS policies to restrict access
3. Fix issues in development
4. Deploy targeted fixes

## Support and Troubleshooting

### Common Issues
- Migration timeout: Increase connection timeout, run during low traffic
- RLS policy conflicts: Check existing policies, verify auth functions
- Index creation slow: Normal for large datasets, monitor progress
- Constraint violations: Check data integrity, fix data issues

### Performance Issues
- Slow queries: Check index usage, update statistics
- High memory usage: Monitor connection pools, optimize queries
- Storage growth: Implement data retention policies

### Contact Information
- Database Team: database-team@ganggreen.com
- DevOps Team: devops@ganggreen.com
- Emergency: emergency@ganggreen.com

## Success Criteria

Migration is successful when:
- ✅ All 31 tables created without errors
- ✅ All 50+ indexes created and optimized
- ✅ All 100+ RLS policies active and tested
- ✅ All 9 functions executable and tested
- ✅ Performance within acceptable limits (< 200ms for curation)
- ✅ No data loss or corruption
- ✅ Application functionality verified
- ✅ Monitoring and alerts configured

## Future Enhancements

### Planned Improvements
- Machine learning integration for content curation
- Advanced analytics dashboards
- Real-time collaboration features
- Mobile app optimization
- International expansion support

### Scalability Considerations
- Horizontal scaling for high-traffic tables
- Read replicas for analytics queries
- Partitioning for time-series data
- Caching layer optimization

---

**Version**: 1.0.0  
**Last Updated**: November 28, 2024  
**Migration Files**: 030, 031  
**Database Version**: PostgreSQL 17+ with PostGIS