# Badge Endpoints Deployment Guide

This guide walks through deploying the new badge management endpoints to Supabase.

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Authenticated with Supabase**
   ```bash
   supabase login
   ```

3. **Project linked**
   ```bash
   supabase link --project-ref wobpryllvdjaapzjbsxx
   ```

4. **Database migrations applied**
   - Migration 028: Geometric badge system tables
   - Migration 029: Cache hit count function

## Step 1: Apply Database Migrations

First, ensure all required database migrations are applied:

```bash
# Navigate to project root
cd /path/to/ganggreen-platform

# Apply migrations
supabase db push

# Or apply specific migrations
psql $DATABASE_URL -f supabase/migrations/028_add_geometric_badge_system.sql
psql $DATABASE_URL -f supabase/migrations/029_add_cache_hit_count_function.sql
```

Verify migrations:
```bash
supabase db diff
```

## Step 2: Set Environment Variables

Set required environment variables for the functions:

```bash
# Supabase URL (usually auto-configured)
supabase secrets set SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co

# Service Role Key (get from Supabase Dashboard > Settings > API)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Verify secrets:
```bash
supabase secrets list
```

## Step 3: Deploy Functions

Deploy each badge function:

```bash
# Deploy create-badge function
supabase functions deploy create-badge

# Deploy get-badge function
supabase functions deploy get-badge

# Deploy migrate-badges function
supabase functions deploy migrate-badges

# Deploy migration-status function
supabase functions deploy migration-status
```

Or deploy all at once:
```bash
supabase functions deploy create-badge get-badge migrate-badges migration-status
```

## Step 4: Verify Deployment

Check that functions are deployed:

```bash
supabase functions list
```

Expected output:
```
NAME                STATUS    VERSION    CREATED
create-badge        ACTIVE    1          2025-11-27
get-badge          ACTIVE    1          2025-11-27
migrate-badges     ACTIVE    1          2025-11-27
migration-status   ACTIVE    1          2025-11-27
```

## Step 5: Test Endpoints

### Test Create Badge

```bash
# Get a user token from your frontend or Supabase Dashboard
export USER_TOKEN="your_user_token_here"

# Create a test badge
curl -i --location --request POST \
  'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/create-badge' \
  --header "Authorization: Bearer $USER_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "your-user-id",
    "tier": "bronze",
    "forest": "kakamega",
    "achievement": "tree_planter",
    "saveToDatabase": true
  }'
```

Expected response:
```json
{
  "success": true,
  "badgeId": "badge-uuid",
  "svg": "<svg>...</svg>",
  "metadata": {...}
}
```

### Test Get Badge

```bash
# Replace BADGE_ID with actual badge ID from create response
curl -i --location --request GET \
  'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/get-badge/BADGE_ID?format=svg' \
  --header "Authorization: Bearer $USER_TOKEN"
```

Expected response: SVG content with `Content-Type: image/svg+xml`

### Test Migration Status

```bash
curl -i --location --request GET \
  'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migration-status' \
  --header "Authorization: Bearer $USER_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "status": {
    "inProgress": false,
    "progress": 0,
    "totalBadges": 0,
    "migratedBadges": 0,
    "failedBadges": 0,
    "recentErrors": []
  }
}
```

### Test Migrate Badges (Admin Only)

```bash
# Get an admin token
export ADMIN_TOKEN="your_admin_token_here"

# Start a dry-run migration
curl -i --location --request POST \
  'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migrate-badges' \
  --header "Authorization: Bearer $ADMIN_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{
    "batchSize": 50,
    "dryRun": true,
    "createBackup": true
  }'
```

Expected response:
```json
{
  "success": true,
  "migrationId": "migration-...",
  "message": "Dry run completed - no changes made",
  "status": {
    "inProgress": false,
    "totalBadges": 100,
    "estimatedDuration": 4
  }
}
```

## Step 6: Monitor Functions

View function logs:

```bash
# View recent logs
supabase functions logs create-badge --limit 50

# Follow logs in real-time
supabase functions logs get-badge --follow

# View logs for specific time range
supabase functions logs migrate-badges --since 1h
```

## Step 7: Update Frontend

Update your frontend code to use the new endpoints:

```typescript
// src/services/badgeApi.service.ts

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export async function createBadge(
  token: string,
  badgeData: {
    userId: string;
    tier: string;
    forest: string;
    achievement: string;
  }
) {
  const response = await fetch(`${FUNCTIONS_URL}/create-badge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(badgeData),
  });

  return await response.json();
}

export async function getBadge(
  token: string,
  badgeId: string,
  format: 'svg' | 'png' = 'svg'
) {
  const response = await fetch(
    `${FUNCTIONS_URL}/get-badge/${badgeId}?format=${format}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (format === 'svg') {
    return await response.text();
  }
  return await response.json();
}

export async function getMigrationStatus(token: string) {
  const response = await fetch(
    `${FUNCTIONS_URL}/migration-status?history=true`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return await response.json();
}

export async function startMigration(
  token: string,
  options: {
    userId?: string;
    batchSize?: number;
    dryRun?: boolean;
  }
) {
  const response = await fetch(`${FUNCTIONS_URL}/migrate-badges`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  return await response.json();
}
```

## Troubleshooting

### Function not responding

1. Check function status:
   ```bash
   supabase functions list
   ```

2. View function logs:
   ```bash
   supabase functions logs <function-name>
   ```

3. Verify environment variables:
   ```bash
   supabase secrets list
   ```

### Authentication errors

1. Verify token is valid:
   ```bash
   # Test with Supabase client
   const { data: { user } } = await supabase.auth.getUser()
   ```

2. Check user role for admin endpoints:
   ```sql
   SELECT role FROM user_profiles WHERE id = 'user-id';
   ```

### Database errors

1. Verify migrations are applied:
   ```bash
   supabase db diff
   ```

2. Check table exists:
   ```sql
   SELECT * FROM badge_cache LIMIT 1;
   SELECT * FROM badge_migration_log LIMIT 1;
   ```

3. Verify RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nft_badges';
   ```

### Cache not working

1. Check badge_cache table:
   ```sql
   SELECT COUNT(*) FROM badge_cache;
   ```

2. Verify cache function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'increment_cache_hit_count';
   ```

3. Check cache expiration:
   ```sql
   SELECT cache_key, expires_at, hit_count 
   FROM badge_cache 
   WHERE expires_at > NOW();
   ```

## Rollback

If you need to rollback the deployment:

1. **Remove functions:**
   ```bash
   supabase functions delete create-badge
   supabase functions delete get-badge
   supabase functions delete migrate-badges
   supabase functions delete migration-status
   ```

2. **Rollback database migrations:**
   ```sql
   -- Drop cache function
   DROP FUNCTION IF EXISTS increment_cache_hit_count;
   
   -- Drop tables (if needed)
   DROP TABLE IF EXISTS badge_cache CASCADE;
   DROP TABLE IF EXISTS badge_migration_log CASCADE;
   ```

3. **Remove environment variables:**
   ```bash
   supabase secrets unset SUPABASE_SERVICE_ROLE_KEY
   ```

## Production Checklist

Before deploying to production:

- [ ] All database migrations applied
- [ ] Environment variables configured
- [ ] Functions deployed and tested
- [ ] Admin users identified and roles assigned
- [ ] Monitoring and alerting configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Frontend updated to use new endpoints
- [ ] Load testing completed
- [ ] Security review completed

## Next Steps

1. **Run migration:** Use the migrate-badges endpoint to migrate existing badges
2. **Monitor performance:** Track cache hit rates and migration progress
3. **Update documentation:** Document any custom configurations or issues
4. **Train team:** Ensure team knows how to use new endpoints

## Support

For issues or questions:
- Check function logs: `supabase functions logs <function-name>`
- Review [Badge Endpoints Documentation](./badge-endpoints/README.md)
- Check [Badge Migration Guide](../../docs/BADGE_MIGRATION_GUIDE.md)
