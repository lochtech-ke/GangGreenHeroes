# Engagement Tracker Quick Start Guide

## Installation

The EngagementTracker service is already installed. Just import it:

```typescript
import { engagementTracker } from './services/engagementTracker.service';
```

## 5-Minute Quick Start

### 1. Track an Event (Most Common Use Case)

```typescript
// When user clicks on content
await engagementTracker.trackEvent({
  userId: currentUser.id,
  itemId: content.id,
  itemType: content.type, // 'mission', 'challenge', etc.
  eventType: 'click',
  ageCohort: currentUser.ageCohort, // '25-34', etc.
});
```

### 2. Track Impressions (When Content is Displayed)

```typescript
// When content appears on screen
await engagementTracker.trackEvent({
  userId: currentUser.id,
  itemId: content.id,
  itemType: content.type,
  eventType: 'impression',
  ageCohort: currentUser.ageCohort,
});
```

### 3. Get Engagement Metrics

```typescript
// Get metrics for a cohort
const metrics = await engagementTracker.getMetrics('25-34');

// Show click-through rate
console.log(`CTR: ${(metrics[0].clickThroughRate * 100).toFixed(2)}%`);
```

### 4. Get User History

```typescript
// Get user's recent interactions
const history = await engagementTracker.getUserHistory(userId);

console.log(`User has ${history.totalInteractions} interactions`);
```

## Common Patterns

### Pattern 1: Track Content Display

```typescript
function ContentCard({ content, user }) {
  useEffect(() => {
    // Track impression when component mounts
    engagementTracker.trackEvent({
      userId: user.id,
      itemId: content.id,
      itemType: content.type,
      eventType: 'impression',
      ageCohort: user.ageCohort,
    });
  }, []);

  const handleClick = async () => {
    // Track click
    await engagementTracker.trackEvent({
      userId: user.id,
      itemId: content.id,
      itemType: content.type,
      eventType: 'click',
      ageCohort: user.ageCohort,
    });
    
    // Navigate to content
    navigate(`/content/${content.id}`);
  };

  return <div onClick={handleClick}>{content.title}</div>;
}
```

### Pattern 2: Track Completion with Duration

```typescript
async function completeLesson(lessonId: string, user: User) {
  const startTime = Date.now();
  
  // ... user completes lesson ...
  
  const duration = Math.floor((Date.now() - startTime) / 1000);
  
  await engagementTracker.trackEvent({
    userId: user.id,
    itemId: lessonId,
    itemType: 'educational',
    eventType: 'complete',
    ageCohort: user.ageCohort,
    metadata: { duration },
  });
}
```

### Pattern 3: Track Multiple Impressions

```typescript
async function displayDashboard(user: User, items: ContentItem[]) {
  // Track all impressions at once
  for (const item of items) {
    await engagementTracker.trackEvent({
      userId: user.id,
      itemId: item.id,
      itemType: item.type,
      eventType: 'impression',
      ageCohort: user.ageCohort,
      metadata: {
        position: item.position,
        section: 'dashboard',
      },
    });
  }
}
```

### Pattern 4: Get Cohort Analytics

```typescript
async function showCohortAnalytics(cohort: AgeCohort) {
  const summary = await engagementTracker.getCohortSummary(cohort, 7);
  
  return {
    activeUsers: summary.activeUsers,
    totalUsers: summary.totalUsers,
    engagementRate: (summary.activeUsers / summary.totalUsers * 100).toFixed(1),
    topContent: summary.topContentTypes[0]?.type,
  };
}
```

## Event Types Reference

| Event Type | When to Use |
|------------|-------------|
| `impression` | Content is displayed to user |
| `click` | User clicks on content |
| `save` | User saves/bookmarks content |
| `join` | User joins mission/challenge |
| `share` | User shares content |
| `complete` | User completes action |
| `like` | User likes content |
| `comment` | User comments on content |

## Content Types Reference

| Content Type | Description |
|--------------|-------------|
| `initiative` | Conservation initiatives |
| `social_post` | Community posts |
| `challenge` | Gamification challenges |
| `educational` | Learning modules |
| `mission` | Climate missions |
| `community_post` | Community discussions |
| `petition` | Policy petitions |

## Age Cohorts Reference

| Cohort | Age Range |
|--------|-----------|
| `13-17` | 13-17 years |
| `18-24` | 18-24 years |
| `25-34` | 25-34 years |
| `35-49` | 35-49 years |
| `50+` | 50+ years |

## Troubleshooting

### Events Not Appearing in Metrics

**Problem**: Tracked events don't show up in metrics immediately.

**Solution**: Events are processed every 5 seconds. For immediate processing:
```typescript
await engagementTracker.flushQueue();
```

### Queue Growing Too Large

**Problem**: Queue size keeps increasing.

**Solution**: Check database connectivity and force flush:
```typescript
const queueSize = engagementTracker.getQueueSize();
if (queueSize > 100) {
  await engagementTracker.flushQueue();
}
```

### Missing Age Cohort

**Problem**: Events tracked without age cohort.

**Solution**: Always include age cohort for better analytics:
```typescript
// ❌ Bad
await engagementTracker.trackEvent({
  userId: user.id,
  itemId: content.id,
  itemType: 'mission',
  eventType: 'click',
  // Missing ageCohort
});

// ✅ Good
await engagementTracker.trackEvent({
  userId: user.id,
  itemId: content.id,
  itemType: 'mission',
  eventType: 'click',
  ageCohort: user.ageCohort, // ✓ Included
});
```

## Best Practices

### ✅ DO

- Always include age cohort when available
- Track impressions when content is displayed
- Track clicks when user interacts
- Include duration in metadata for completions
- Use appropriate event types
- Batch related events together

### ❌ DON'T

- Don't track events without user consent
- Don't track sensitive user data in metadata
- Don't block user interactions waiting for tracking
- Don't track the same event multiple times
- Don't forget to handle errors

## Performance Tips

1. **Events are async**: Tracking returns immediately, processing happens in background
2. **Automatic batching**: Multiple events are batched automatically
3. **Queue management**: Queue is processed every 5 seconds
4. **Indexed queries**: Metrics queries are optimized with database indexes

## Need More Help?

- Full Documentation: `src/services/README_ENGAGEMENT_TRACKER.md`
- Implementation Details: `docs/ENGAGEMENT_TRACKER_IMPLEMENTATION.md`
- Test Examples: `src/services/engagementTracker.service.test.ts`
- Design Document: `.kiro/specs/v1-major-release/design.md`

## Quick Reference Card

```typescript
// Track event
await engagementTracker.trackEvent({
  userId: string,
  itemId: string,
  itemType: ContentType,
  eventType: InteractionType,
  ageCohort?: AgeCohort,
  metadata?: object,
});

// Get metrics
const metrics = await engagementTracker.getMetrics(
  cohort: AgeCohort,
  contentType?: ContentType,
  dateRange?: { start: Date; end: Date }
);

// Get user history
const history = await engagementTracker.getUserHistory(
  userId: string,
  limit?: number
);

// Get cohort summary
const summary = await engagementTracker.getCohortSummary(
  cohort: AgeCohort,
  days?: number
);

// Queue management
const size = engagementTracker.getQueueSize();
await engagementTracker.flushQueue();
```

---

**Ready to start tracking engagement!** 🚀
