# Badge Endpoints Testing Checklist

Use this checklist to verify all badge endpoints are working correctly.

## Prerequisites

- [ ] Supabase project is running
- [ ] Database migrations applied (028, 029)
- [ ] Edge functions deployed
- [ ] Environment variables configured
- [ ] Test user account created
- [ ] Admin user account created
- [ ] Test data available

## Test Environment Setup

```bash
# Set environment variables
export SUPABASE_URL="https://wobpryllvdjaapzjbsxx.supabase.co"
export USER_TOKEN="<regular_user_token>"
export ADMIN_TOKEN="<admin_user_token>"
export USER_ID="<test_user_id>"
export ADMIN_ID="<admin_user_id>"
```

---

## 1. Create Badge Endpoint Tests

### 1.1 Basic Badge Creation
- [ ] **Test:** Create badge with valid data
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/create-badge \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "tier": "bronze",
      "forest": "kakamega",
      "achievement": "tree_planter",
      "saveToDatabase": true
    }'
  ```
- [ ] **Expected:** 200 OK, badge created with geometric type
- [ ] **Verify:** Badge exists in nft_badges table
- [ ] **Verify:** badge_type = 'geometric'
- [ ] **Verify:** primary_colors and accent_colors populated

### 1.2 Badge Creation with Metadata
- [ ] **Test:** Create badge with custom metadata
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/create-badge \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "tier": "gold",
      "forest": "karura",
      "achievement": "carbon_warrior",
      "metadata": {
        "badgeName": "Custom Gold Badge",
        "achievementCount": 25
      },
      "saveToDatabase": true
    }'
  ```
- [ ] **Expected:** 200 OK, custom metadata saved
- [ ] **Verify:** metadata.badgeName = "Custom Gold Badge"
- [ ] **Verify:** metadata.achievementCount = 25

### 1.3 Validation Tests
- [ ] **Test:** Missing required field (userId)
  - **Expected:** 400 Bad Request
- [ ] **Test:** Invalid tier value
  - **Expected:** 400 Bad Request
- [ ] **Test:** Invalid forest value
  - **Expected:** 400 Bad Request
- [ ] **Test:** Invalid achievement value
  - **Expected:** 400 Bad Request
- [ ] **Test:** No authentication token
  - **Expected:** 401 Unauthorized
- [ ] **Test:** Create badge for another user (non-admin)
  - **Expected:** 403 Forbidden

### 1.4 Admin Tests
- [ ] **Test:** Admin creates badge for another user
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/create-badge \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "tier": "platinum",
      "forest": "mau",
      "achievement": "forest_protector",
      "saveToDatabase": true
    }'
  ```
- [ ] **Expected:** 200 OK, badge created for other user

### 1.5 Gamification Update
- [ ] **Test:** Create badge and verify gamification update
- [ ] **Verify:** user_gamification.badges_earned incremented
- [ ] **Verify:** updated_at timestamp updated

---

## 2. Get Badge Endpoint Tests

### 2.1 Basic Badge Retrieval
- [ ] **Test:** Get badge by ID (SVG format)
  ```bash
  curl $SUPABASE_URL/functions/v1/get-badge/<badge-id>?format=svg \
    -H "Authorization: Bearer $USER_TOKEN"
  ```
- [ ] **Expected:** 200 OK, SVG content returned
- [ ] **Verify:** Content-Type: image/svg+xml
- [ ] **Verify:** X-Cache header present

### 2.2 JSON Format
- [ ] **Test:** Get badge without format parameter
  ```bash
  curl $SUPABASE_URL/functions/v1/get-badge/<badge-id> \
    -H "Authorization: Bearer $USER_TOKEN"
  ```
- [ ] **Expected:** 200 OK, JSON response with badge data
- [ ] **Verify:** Response includes all badge fields

### 2.3 Caching Tests
- [ ] **Test:** First request (cache miss)
  - **Verify:** X-Cache: MISS
- [ ] **Test:** Second request (cache hit)
  - **Verify:** X-Cache: HIT
- [ ] **Test:** Request with cache=false
  - **Verify:** Cache bypassed
- [ ] **Verify:** badge_cache table has entry
- [ ] **Verify:** hit_count incremented on cache hit

### 2.4 Permission Tests
- [ ] **Test:** Get own badge
  - **Expected:** 200 OK
- [ ] **Test:** Get another user's badge (non-admin)
  - **Expected:** 403 Forbidden
- [ ] **Test:** Admin gets any user's badge
  - **Expected:** 200 OK

### 2.5 Error Cases
- [ ] **Test:** Invalid badge ID
  - **Expected:** 404 Not Found
- [ ] **Test:** No authentication
  - **Expected:** 401 Unauthorized
- [ ] **Test:** Invalid format parameter
  - **Expected:** 400 Bad Request

---

## 3. Migrate Badges Endpoint Tests

### 3.1 Dry Run Migration
- [ ] **Test:** Dry run migration
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/migrate-badges \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "batchSize": 50,
      "dryRun": true,
      "createBackup": true
    }'
  ```
- [ ] **Expected:** 200 OK, dry run completed
- [ ] **Verify:** No badges actually migrated
- [ ] **Verify:** Migration log created with status 'dry_run'

### 3.2 User-Specific Migration
- [ ] **Test:** Migrate specific user's badges
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/migrate-badges \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "userId": "'$USER_ID'",
      "batchSize": 10,
      "dryRun": false,
      "createBackup": true
    }'
  ```
- [ ] **Expected:** 202 Accepted, migration started
- [ ] **Verify:** Migration log created
- [ ] **Verify:** Only specified user's badges migrated

### 3.3 Full Migration
- [ ] **Test:** Migrate all badges
  ```bash
  curl -X POST $SUPABASE_URL/functions/v1/migrate-badges \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "batchSize": 100,
      "dryRun": false,
      "createBackup": true
    }'
  ```
- [ ] **Expected:** 202 Accepted
- [ ] **Verify:** Migration progresses in batches
- [ ] **Verify:** badge_migration_log updated

### 3.4 Backup Creation
- [ ] **Test:** Migration with backup
- [ ] **Verify:** badge_backups table has entries
- [ ] **Verify:** Original badge data preserved

### 3.5 Error Handling
- [ ] **Test:** Start migration while one is in progress
  - **Expected:** 409 Conflict
- [ ] **Test:** Non-admin tries to migrate
  - **Expected:** 403 Forbidden
- [ ] **Test:** No authentication
  - **Expected:** 401 Unauthorized

### 3.6 Batch Processing
- [ ] **Verify:** Badges processed in correct batch size
- [ ] **Verify:** Delay between batches (1 second)
- [ ] **Verify:** Progress tracking accurate

---

## 4. Migration Status Endpoint Tests

### 4.1 Basic Status Check
- [ ] **Test:** Get current migration status
  ```bash
  curl $SUPABASE_URL/functions/v1/migration-status \
    -H "Authorization: Bearer $USER_TOKEN"
  ```
- [ ] **Expected:** 200 OK, status returned
- [ ] **Verify:** inProgress field accurate
- [ ] **Verify:** progress percentage calculated correctly

### 4.2 Status During Migration
- [ ] **Test:** Check status while migration running
- [ ] **Verify:** inProgress = true
- [ ] **Verify:** currentBatch and totalBatches present
- [ ] **Verify:** estimatedCompletion calculated
- [ ] **Verify:** migratedBadges count accurate

### 4.3 Status After Migration
- [ ] **Test:** Check status after migration completes
- [ ] **Verify:** inProgress = false
- [ ] **Verify:** progress = 100
- [ ] **Verify:** Final counts accurate

### 4.4 Migration History
- [ ] **Test:** Get status with history
  ```bash
  curl "$SUPABASE_URL/functions/v1/migration-status?history=true" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```
- [ ] **Expected:** 200 OK, history included
- [ ] **Verify:** Last 10 migrations returned
- [ ] **Verify:** Duration calculated for completed migrations

### 4.5 Specific Migration Status
- [ ] **Test:** Get status for specific migration
  ```bash
  curl "$SUPABASE_URL/functions/v1/migration-status?migrationId=<id>" \
    -H "Authorization: Bearer $USER_TOKEN"
  ```
- [ ] **Expected:** 200 OK, specific migration status
- [ ] **Verify:** Correct migration data returned

### 4.6 Error Tracking
- [ ] **Test:** Check recentErrors field
- [ ] **Verify:** Last 10 errors shown
- [ ] **Verify:** Error details include badgeId, userId, error, timestamp

---

## 5. Integration Tests

### 5.1 End-to-End Badge Creation
- [ ] Create badge via API
- [ ] Retrieve badge via API
- [ ] Verify badge in database
- [ ] Verify cache entry created
- [ ] Verify gamification updated

### 5.2 Migration Workflow
- [ ] Create test badges (classic type)
- [ ] Start migration
- [ ] Monitor status endpoint
- [ ] Verify completion
- [ ] Check migrated badges
- [ ] Verify backups created

### 5.3 Cache Workflow
- [ ] Create badge
- [ ] Get badge (cache miss)
- [ ] Get badge again (cache hit)
- [ ] Verify hit count
- [ ] Wait for expiration
- [ ] Get badge (cache miss again)

---

## 6. Performance Tests

### 6.1 Response Times
- [ ] Create badge: < 500ms
- [ ] Get badge (cache hit): < 50ms
- [ ] Get badge (cache miss): < 200ms
- [ ] Migration status: < 100ms

### 6.2 Concurrent Requests
- [ ] 10 concurrent badge creations
- [ ] 50 concurrent badge retrievals
- [ ] Verify no errors
- [ ] Verify all requests complete

### 6.3 Large Migration
- [ ] Migrate 1000+ badges
- [ ] Verify batch processing
- [ ] Verify no timeouts
- [ ] Verify accurate progress tracking

---

## 7. Security Tests

### 7.1 Authentication
- [ ] All endpoints reject requests without token
- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected

### 7.2 Authorization
- [ ] Users can only access own badges
- [ ] Non-admins cannot migrate
- [ ] Admins can access all badges
- [ ] Admins can trigger migration

### 7.3 Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Invalid JSON rejected
- [ ] Oversized requests rejected

---

## 8. Database Verification

### 8.1 Badge Storage
```sql
-- Verify geometric badges
SELECT COUNT(*) FROM nft_badges WHERE badge_type = 'geometric';

-- Verify metadata fields
SELECT id, badge_type, primary_colors, accent_colors, complexity_level
FROM nft_badges
WHERE badge_type = 'geometric'
LIMIT 5;
```

### 8.2 Cache Table
```sql
-- Verify cache entries
SELECT COUNT(*) FROM badge_cache;

-- Check cache hits
SELECT cache_key, hit_count, last_accessed_at
FROM badge_cache
ORDER BY hit_count DESC
LIMIT 10;
```

### 8.3 Migration Log
```sql
-- Verify migration logs
SELECT migration_id, status, total_badges, migrated_badges, failed_badges
FROM badge_migration_log
ORDER BY started_at DESC
LIMIT 5;
```

---

## 9. Monitoring

### 9.1 Function Logs
- [ ] Check create-badge logs
  ```bash
  supabase functions logs create-badge --limit 50
  ```
- [ ] Check get-badge logs
- [ ] Check migrate-badges logs
- [ ] Check migration-status logs

### 9.2 Error Logs
- [ ] Review error messages
- [ ] Verify error context included
- [ ] Check error timestamps

---

## 10. Cleanup

After testing:
- [ ] Delete test badges
- [ ] Clear cache entries
- [ ] Remove test migration logs
- [ ] Reset test user data

```sql
-- Cleanup test data
DELETE FROM nft_badges WHERE user_id = '<test_user_id>';
DELETE FROM badge_cache WHERE badge_id IN (SELECT id FROM nft_badges WHERE user_id = '<test_user_id>');
DELETE FROM badge_migration_log WHERE created_by = '<admin_user_id>';
```

---

## Test Results Summary

| Test Category | Total Tests | Passed | Failed | Notes |
|--------------|-------------|--------|--------|-------|
| Create Badge | 15 | | | |
| Get Badge | 12 | | | |
| Migrate Badges | 12 | | | |
| Migration Status | 10 | | | |
| Integration | 9 | | | |
| Performance | 6 | | | |
| Security | 9 | | | |
| Database | 3 | | | |
| **TOTAL** | **76** | | | |

---

## Sign-Off

- [ ] All critical tests passed
- [ ] Performance meets requirements
- [ ] Security verified
- [ ] Documentation reviewed
- [ ] Ready for production

**Tested by:** _______________  
**Date:** _______________  
**Environment:** _______________  
**Notes:** _______________
