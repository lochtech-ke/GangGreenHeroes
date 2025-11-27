# Badge API Quick Reference

Quick reference guide for the Badge Management API endpoints.

## Base URL

**Production:** `https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1`  
**Local:** `http://localhost:54321/functions/v1`

## Authentication

All endpoints require authentication. Include the user's JWT token in the Authorization header:

```
Authorization: Bearer <user_token>
```

## Endpoints

### 1. Create Badge

**POST** `/create-badge`

Creates a new badge with geometric design.

**Request:**
```json
{
  "userId": "user-uuid",
  "tier": "gold",
  "forest": "kakamega",
  "achievement": "tree_planter",
  "metadata": {
    "badgeName": "Custom Name",
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
  "metadata": {...}
}
```

**Valid Values:**
- **tier:** `hummingbird`, `bronze`, `silver`, `gold`, `platinum`, `diamond`, `hero`
- **forest:** `kakamega`, `karura`, `mau`
- **achievement:** `tree_planter`, `carbon_warrior`, `water_guardian`, `biodiversity_champion`, `community_leader`, `climate_hero`, `forest_protector`, `green_ambassador`, `welcome_badge`, `ganggreen_hero`

---

### 2. Get Badge

**GET** `/get-badge/{badgeId}?format=svg&cache=true`

Retrieves a badge by ID.

**Query Parameters:**
- `format` (optional): `svg` or `png` (default: `svg`)
- `cache` (optional): `true` or `false` (default: `true`)

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
When `format=svg`, returns SVG directly with `Content-Type: image/svg+xml`

---

### 3. Migrate Badges (Admin Only)

**POST** `/migrate-badges`

Triggers badge migration to geometric designs.

**Request:**
```json
{
  "userId": "user-uuid",
  "batchSize": 100,
  "dryRun": false,
  "createBackup": true
}
```

**Parameters:**
- `userId` (optional): Migrate specific user only
- `batchSize` (optional): Badges per batch (default: 100)
- `dryRun` (optional): Test without changes (default: false)
- `createBackup` (optional): Create backups (default: true)

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

---

### 4. Migration Status

**GET** `/migration-status?history=true&migrationId=xxx`

Returns migration status and progress.

**Query Parameters:**
- `history` (optional): Include migration history (default: false)
- `migrationId` (optional): Get specific migration status

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
        "error": "Error message",
        "timestamp": "2025-11-27T10:05:00.000Z"
      }
    ]
  },
  "history": [...]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed description"
}
```

**Common Status Codes:**
- `200 OK` - Success
- `202 Accepted` - Request accepted (async operation)
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `500 Internal Server Error` - Server error

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Create badge
async function createBadge(token: string, data: any) {
  const response = await fetch(
    'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/create-badge',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
  return await response.json();
}

// Get badge
async function getBadge(token: string, badgeId: string) {
  const response = await fetch(
    `https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/get-badge/${badgeId}?format=svg`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return await response.text(); // SVG content
}

// Get migration status
async function getMigrationStatus(token: string) {
  const response = await fetch(
    'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migration-status',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return await response.json();
}

// Start migration (admin only)
async function startMigration(token: string, options: any) {
  const response = await fetch(
    'https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migrate-badges',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    }
  );
  return await response.json();
}
```

### cURL

```bash
# Create badge
curl -X POST https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/create-badge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","tier":"gold","forest":"kakamega","achievement":"tree_planter"}'

# Get badge
curl https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/get-badge/badge-id?format=svg \
  -H "Authorization: Bearer $TOKEN"

# Migration status
curl https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migration-status \
  -H "Authorization: Bearer $TOKEN"

# Start migration (admin)
curl -X POST https://wobpryllvdjaapzjbsxx.supabase.co/functions/v1/migrate-badges \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchSize":100,"dryRun":true}'
```

---

## React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useBadgeApi() {
  const { user, token } = useAuth();
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const createBadge = async (data: any) => {
    const response = await fetch(`${baseUrl}/create-badge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  };

  const getBadge = async (badgeId: string, format = 'svg') => {
    const response = await fetch(
      `${baseUrl}/get-badge/${badgeId}?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return format === 'svg' ? await response.text() : await response.json();
  };

  const getMigrationStatus = async () => {
    const response = await fetch(`${baseUrl}/migration-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  };

  return {
    createBadge,
    getBadge,
    getMigrationStatus,
  };
}
```

---

## Rate Limits

- No explicit rate limits currently
- Recommended: Max 100 requests/minute per user
- Migration endpoint: Max 1 concurrent migration

## Caching

- Badge cache TTL: 24 hours
- Cache key format: `{badgeId}-{format}`
- Cache can be bypassed with `cache=false`
- Cache hit/miss indicated in `X-Cache` header

## Support

For issues or questions:
- Check function logs: `supabase functions logs <function-name>`
- Review [Badge Endpoints Documentation](../supabase/functions/badge-endpoints/README.md)
- Check [Deployment Guide](../supabase/functions/DEPLOY_BADGE_ENDPOINTS.md)
