# Badge API Endpoints

This directory contains Supabase Edge Functions for badge management with geometric design support.

## Endpoints

### 1. Create Badge - `POST /functions/v1/create-badge`

Creates a new badge using geometric generator by default.

**Authentication:** Required (user token)

**Request Body:**
```json
{
  "userId": "user-uuid",
  "tier": "gold",
  "forest": "kakamega",
  "achievement": "tree_planter",
  "metadata": {
    "badgeName": "Gold Tree Planter",
    "achievementCount": 10
  },
  "badgeType": "geometric",
  "saveToDatabase": true
}
```

**Response:**
```json
{
  "success": true,
  "badgeId": "badge-uuid",
  "svg": "<svg>...</svg>",
  "metadata": {
    "badgeName": "Gold Tree Planter",
    "tierLevel": 3,
    "forestName": "kakamega",
    "achievementType": "tree_planter",
    "achievementCount": 10,
    "earnedDate": "2025-11-27T10:00:00.000Z",
    "uniqueBadgeId": "tree_planter-user-uuid-1234567890",
    "userId": "user-uuid"
  }
}
```

**Validation:**
- Valid tiers: `hummingbird`, `bronze`, `silver`, `gold`, `platinum`, `diamond`, `hero`
- Valid forests: `kakamega`, `karura`, `mau`
- Valid achievements: `tree_planter`, `carbon_warrior`, `water_guardian`, `biodiversity_champion`, `community_leader`, `climate_hero`, `forest_protector`, `green_ambassador`, `welcome_badge`, `ganggreen_hero`
- Users can only create badges for themselves (unless admin)

**Implements Requirements:** 2.1, 8.1, 8.2

---

### 2. Get Badge - `GET /functions/v1/get-badge/{badgeId}`

Retrieves a badge by ID with caching support.

**Authentication:** Required (user token)

**Query Parameters:**
- `format` (optional): `svg` or `png` (default: `svg`)
- `cache` (optional): `true` or `false` (default: `true`)

**Example:**
```
GET /functions/v1/get-badge/badge-uuid?format=svg&cache=true
```

**Response (JSON):**
```json
{
  "success": true,
  "badge": {
    "id": "badge-uuid",
    "userId": "user-uuid",
    "badgeName": "Gold Tree Planter",
    "tier": "gold",
    "forest": "kakamega",
    "achievementType": "tree_planter",
    "earnedDate": "2025-11-27T10:00:00.000Z",
    "svg": "<svg>...</svg>",
    "badgeType": "geometric",
    "metadata": {}
  }
}
```

**Response (SVG):**
When format is `svg`, returns the SVG directly with `Content-Type: image/svg+xml`

**Caching:**
- Cached badges are stored in `badge_cache` table
- Cache TTL: 24 hours
- Cache hit/miss indicated in `X-Cache` header
- Cache can be bypassed with `cache=false`

**Implements Requirements:** 2.1, 4.5

---

### 3. Migrate Badges - `POST /functions/v1/migrate-badges`

Triggers badge migration to geometric designs.

**Authentication:** Required (admin only)

**Request Body:**
```json
{
  "userId": "user-uuid",
  "batchSize": 100,
  "dryRun": false,
  "createBackup": true
}
```

**Parameters:**
- `userId` (optional): Migrate specific user only. If omitted, migrates all users.
- `batchSize` (optional): Number of badges per batch (default: 100)
- `dryRun` (optional): If true, simulates migration without making changes (default: false)
- `createBackup` (optional): Create backups before migration (default: true)

**Response:**
```json
{
  "success": true,
  "migrationId": "migration-1234567890-abc123",
  "message": "Migration started successfully",
  "status": {
    "inProgress": true,
    "totalBadges": 500,
    "estimatedDuration": 10
  }
}
```

**Status Codes:**
- `202 Accepted`: Migration started successfully
- `409 Conflict`: Migration already in progress
- `403 Forbidden`: User is not admin

**Implements Requirements:** 1.1, 9.1

---

### 4. Migration Status - `GET /functions/v1/migration-status`

Returns current migration status and history.

**Authentication:** Required (user token)

**Query Parameters:**
- `history` (optional): Include migration history (default: false)
- `migrationId` (optional): Get status for specific migration

**Example:**
```
GET /functions/v1/migration-status?history=true
```

**Response:**
```json
{
  "success": true,
  "status": {
    "inProgress": true,
    "migrationId": "migration-1234567890-abc123",
    "progress": 45,
    "currentBatch": 5,
    "totalBatches": 10,
    "totalBadges": 500,
    "migratedBadges": 225,
    "failedBadges": 3,
    "startedAt": "2025-11-27T10:00:00.000Z",
    "estimatedCompletion": "2025-11-27T10:15:00.000Z",
    "recentErrors": [
      {
        "badgeId": "badge-uuid",
        "userId": "user-uuid",
        "error": "Invalid badge data",
        "timestamp": "2025-11-27T10:05:00.000Z"
      }
    ]
  },
  "history": [
    {
      "migrationId": "migration-1234567890-abc123",
      "status": "in_progress",
      "totalBadges": 500,
      "migratedBadges": 225,
      "failedBadges": 3,
      "startedAt": "2025-11-27T10:00:00.000Z"
    }
  ]
}
```

**Progress Calculation:**
- Progress percentage: `(migratedBadges / totalBadges) * 100`
- Estimated completion based on average time per badge

**Implements Requirements:** 9.4

---

## Deployment

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref wobpryllvdjaapzjbsxx
```

### Deploy Functions

Deploy all badge functions:
```bash
supabase functions deploy create-badge
supabase functions deploy get-badge
supabase functions deploy migrate-badges
supabase functions deploy migration-status
```

### Set Environment Variables

```bash
# Supabase URL (usually auto-set)
supabase secrets set SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co

# Supabase Service Role Key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Test Functions Locally

Start local development:
```bash
supabase functions serve
```

Test create-badge:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/create-badge' \
  --header 'Authorization: Bearer YOUR_USER_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "user-uuid",
    "tier": "gold",
    "forest": "kakamega",
    "achievement": "tree_planter",
    "saveToDatabase": true
  }'
```

Test get-badge:
```bash
curl -i --location --request GET 'http://localhost:54321/functions/v1/get-badge/badge-uuid?format=svg' \
  --header 'Authorization: Bearer YOUR_USER_TOKEN'
```

Test migrate-badges (admin only):
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/migrate-badges' \
  --header 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
    "batchSize": 100,
    "dryRun": true,
    "createBackup": true
  }'
```

Test migration-status:
```bash
curl -i --location --request GET 'http://localhost:54321/functions/v1/migration-status?history=true' \
  --header 'Authorization: Bearer YOUR_USER_TOKEN'
```

## Database Requirements

These functions require the following database tables:

1. **nft_badges** - Main badge storage
   - Includes geometric badge fields (badge_type, primary_colors, accent_colors, etc.)
   - See migration `028_add_geometric_badge_system.sql`

2. **badge_cache** - Badge caching for performance
   - Stores rendered SVG/PNG badges
   - Tracks cache hits and expiration

3. **badge_migration_log** - Migration tracking
   - Records migration progress and errors
   - Supports rollback and verification

4. **badge_backups** (optional) - Badge backups before migration
   - Stores original badge data
   - Enables rollback functionality

## Security

- All endpoints require authentication
- Migration endpoint requires admin role
- Users can only access their own badges (unless admin)
- Service role key is only used in Edge Functions, never exposed to client
- CORS enabled for frontend access

## Monitoring

View function logs:
```bash
supabase functions logs create-badge
supabase functions logs get-badge
supabase functions logs migrate-badges
supabase functions logs migration-status
```

View logs in real-time:
```bash
supabase functions logs create-badge --follow
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common error codes:
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., migration in progress)
- `500 Internal Server Error`: Server error

## Performance

- Badge caching reduces database load
- Batch processing prevents system overload during migration
- Lazy loading supported for badge grids
- SVG optimization for mobile devices

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Badge Migration Guide](../../../docs/BADGE_MIGRATION_GUIDE.md)
- [Geometric Badge Design](../../../src/assets/badges/GEOMETRIC_DESIGN.md)
