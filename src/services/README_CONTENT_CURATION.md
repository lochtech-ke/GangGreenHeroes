# Content Curation Service

## Overview

The Content Curation Service is the main entry point for age-based content personalization in the Gang Green platform. It integrates all curation components to provide users with relevant, age-appropriate content tailored to their demographic profile and engagement history.

## Requirements

**Validates Requirements:**
- B1.1: Youth content prioritization (13-24)
- B1.2: Age-based dashboard display
- B1.3: Youth financial filtering
- B1.4: Interactive format prioritization
- B1.5: Minor content exclusion
- B2.1: Professional content prioritization (25-49)
- B2.3: Professional content inclusion
- B2.5: Limited engagement suggestions
- B3.1: Senior content prioritization (50+)
- B3.3: Senior content inclusion

## Architecture

The Content Curation Service orchestrates the following components:

1. **Age Cohort Analyzer** - Determines user's age cohort and preferences
2. **Scoring Engine** - Calculates relevance scores for content items
3. **Content Filtering Engine** - Filters content based on age restrictions
4. **Engagement Tracker** - Tracks user interactions for personalization
5. **Curation Rules Service** - Applies administrator-defined curation rules
6. **Fallback Handler** - Provides graceful degradation for edge cases

## Key Features

### 1. Main Curation Pipeline

```typescript
const response = await contentCurationService.getCuratedContent({
  userId: 'user-123',
  contentTypes: ['initiative', 'mission', 'educational'],
  limit: 10,
  offset: 0
});
```

**Pipeline Steps:**
1. Fetch user profile and validate age data
2. Determine age cohort and preferences
3. Get user interaction history
4. Fetch content items from database
5. Apply age-based filtering
6. Calculate relevance scores
7. Apply curation rules
8. Sort by relevance and paginate

### 2. Relevance Score Caching

The service implements an in-memory cache for relevance scores with:
- **TTL**: 15 minutes
- **Automatic cleanup**: Every 5 minutes
- **User-level invalidation**: When age changes

```typescript
// Get cache statistics
const stats = contentCurationService.getCacheStats();
console.log(`Cache size: ${stats.size}, TTL: ${stats.ttlMinutes} minutes`);

// Invalidate cache for a user (e.g., after age update)
contentCurationService.invalidateUserCache(userId);

// Clear all cached scores
contentCurationService.clearCache();
```

### 3. Fallback Mechanisms

The service gracefully handles edge cases:

- **Missing Age**: Returns general feed with profile completion prompt
- **Invalid Age**: Requests verification and uses general feed
- **Engine Failure**: Falls back to chronological ordering
- **Insufficient Content**: Supplements with adjacent cohort content
- **Opt-Out**: Respects user preference to disable curation

### 4. Content Type Support

Supports curation for:
- `initiative` - Conservation initiatives
- `mission` - Climate missions and actions
- `educational` - Learning modules and courses
- `social_post` - Community posts
- `challenge` - Gamification challenges
- `community_post` - Community-specific posts
- `petition` - Policy engagement petitions

## Integration with Dashboard Service

The Dashboard Service has been extended with curated dashboard methods:

```typescript
// Get curated dashboard with metrics and content
const dashboard = await dashboardService.getCuratedDashboard(
  userId,
  'all', // forest filter
  10     // content limit
);

// Get curated dashboard with forest statistics
const dashboardWithStats = await dashboardService.getCuratedDashboardWithStats(
  userId,
  'kakamega',
  15
);
```

## Performance Considerations

### Caching Strategy

- **Relevance scores**: Cached for 15 minutes per user/content pair
- **Cohort preferences**: Fetched once per request
- **Interaction history**: Fetched once per request

### Database Optimization

- Fetches 3x requested limit to account for filtering
- Uses database indexes on `status`, `created_at`, and `content_type`
- Parallel fetching of different content types

### Production Recommendations

For production deployment, replace the in-memory cache with Redis:

```typescript
// Example Redis integration
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache relevance score
await redis.setex(
  `relevance:${userId}:${contentId}:${contentType}`,
  900, // 15 minutes
  score.toString()
);

// Get cached score
const cached = await redis.get(`relevance:${userId}:${contentId}:${contentType}`);
```

## Error Handling

The service implements comprehensive error handling:

1. **User Profile Errors**: Falls back to general feed
2. **Database Errors**: Logs and returns empty results
3. **Scoring Errors**: Uses fallback scoring
4. **Rule Application Errors**: Skips invalid rules

All errors are logged with context for debugging.

## Testing

Unit tests cover:
- Main curation pipeline
- Cache management
- Interaction history fetching
- Content item fetching
- Fallback scenarios

Run tests:
```bash
npm run test -- src/services/contentCuration.service.test.ts
```

## Usage Examples

### Basic Curation Request

```typescript
import { contentCurationService } from './services/contentCuration.service';

const response = await contentCurationService.getCuratedContent({
  userId: 'user-123',
  contentTypes: ['initiative', 'mission', 'educational'],
  limit: 10
});

console.log(`Found ${response.items.length} curated items`);
response.items.forEach(item => {
  console.log(`${item.title} (score: ${item.relevanceScore})`);
});
```

### Paginated Curation

```typescript
// First page
const page1 = await contentCurationService.getCuratedContent({
  userId: 'user-123',
  contentTypes: ['initiative'],
  limit: 10,
  offset: 0
});

// Second page
if (page1.hasMore) {
  const page2 = await contentCurationService.getCuratedContent({
    userId: 'user-123',
    contentTypes: ['initiative'],
    limit: 10,
    offset: 10
  });
}
```

### Cache Management

```typescript
// After user updates their age
await updateUserAge(userId, newAge);
contentCurationService.invalidateUserCache(userId);

// Periodic cache monitoring
setInterval(() => {
  const stats = contentCurationService.getCacheStats();
  console.log(`Cache stats: ${JSON.stringify(stats)}`);
}, 60000); // Every minute
```

## Future Enhancements

1. **Machine Learning Integration**: Use ML models for scoring
2. **Real-time Personalization**: Update scores based on live interactions
3. **A/B Testing**: Test different curation strategies
4. **Multi-dimensional Profiling**: Consider location, interests, skills
5. **Collaborative Filtering**: Use community engagement patterns
6. **Temporal Patterns**: Learn time-of-day and seasonal preferences

## Related Documentation

- [Age Cohort Analyzer](./README_AGE_COHORT_ANALYZER.md)
- [Scoring Engine](./scoringEngine.service.ts)
- [Content Filtering Engine](./README_CONTENT_FILTERING_ENGINE.md)
- [Engagement Tracker](./README_ENGAGEMENT_TRACKER.md)
- [Curation Rules](./README_CURATION_RULES.md)
- [Curation Fallback](./curationFallback.service.ts)

## Support

For issues or questions about the Content Curation Service:
1. Check the [Design Document](.kiro/specs/v1-major-release/design.md)
2. Review the [Requirements](.kiro/specs/v1-major-release/requirements.md)
3. Consult the implementation code with inline documentation
