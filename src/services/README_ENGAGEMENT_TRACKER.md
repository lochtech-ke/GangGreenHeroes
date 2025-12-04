# Engagement Tracker Service

## Overview

The Engagement Tracker Service is responsible for tracking user interactions with content and providing analytics for cohort-based engagement patterns. It implements async event processing, cohort analytics, and adaptive learning capabilities.

**Requirements**: B7.1, B7.2, B7.4

## Features

### 1. Event Tracking (Requirement B7.1)
- Async event processing with queue management
- Batch processing for performance
- Automatic retry on failures
- Support for all interaction types (impression, click, save, join, share, complete, like, comment)

### 2. Cohort Analytics (Requirement B7.2)
- Engagement metrics by cohort and content type
- User interaction history tracking
- Cohort engagement summaries
- Trend analysis over time

### 3. Low Engagement Penalty (Requirement B7.4)
- Automatic detection of low-performing content
- Relevance score reduction for underperforming content
- Cohort-specific engagement thresholds

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EngagementTrackerService                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Event      │      │    Queue     │                    │
│  │   Queue      │─────▶│  Processor   │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         │                      ▼                            │
│         │              ┌──────────────┐                    │
│         │              │   Database   │                    │
│         │              │   Persister  │                    │
│         │              └──────────────┘                    │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────┐                     │
│  │     content_interactions          │                     │
│  │  cohort_engagement_metrics        │                     │
│  └──────────────────────────────────┘                     │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  Analytics   │      │   Penalty    │                    │
│  │   Engine     │      │   Applier    │                    │
│  └──────────────┘      └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Event Tracking

```typescript
import { engagementTracker } from './services/engagementTracker.service';

// Track a user clicking on a mission
await engagementTracker.trackEvent({
  userId: 'user-123',
  itemId: 'mission-456',
  itemType: 'mission',
  eventType: 'click',
  ageCohort: '25-34',
  metadata: {
    duration: 120, // seconds
    source: 'dashboard',
  },
});

// Track an impression
await engagementTracker.trackEvent({
  userId: 'user-123',
  itemId: 'challenge-789',
  itemType: 'challenge',
  eventType: 'impression',
  ageCohort: '18-24',
});
```

### Getting Cohort Metrics

```typescript
// Get all metrics for a cohort
const metrics = await engagementTracker.getMetrics('25-34');

// Get metrics for specific content type
const missionMetrics = await engagementTracker.getMetrics('25-34', 'mission');

// Get metrics for date range
const metrics = await engagementTracker.getMetrics(
  '25-34',
  'mission',
  {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  }
);

// Analyze metrics
for (const metric of metrics) {
  console.log(`Date: ${metric.date}`);
  console.log(`Impressions: ${metric.impressions}`);
  console.log(`Clicks: ${metric.clicks}`);
  console.log(`CTR: ${(metric.clickThroughRate * 100).toFixed(2)}%`);
  console.log(`Avg Engagement: ${metric.avgEngagementTime}s`);
}
```

### Getting User History

```typescript
// Get user's interaction history
const history = await engagementTracker.getUserHistory('user-123');

console.log(`Total interactions: ${history.totalInteractions}`);
console.log(`Last activity: ${history.lastActivity}`);

// Analyze recent interactions
for (const interaction of history.interactions.slice(0, 10)) {
  console.log(`${interaction.interactionType} on ${interaction.contentType}`);
  console.log(`  at ${interaction.timestamp}`);
}

// Get limited history
const recentHistory = await engagementTracker.getUserHistory('user-123', 50);
```

### Getting Cohort Summary

```typescript
// Get comprehensive cohort summary
const summary = await engagementTracker.getCohortSummary('25-34');

console.log(`Cohort: ${summary.cohort}`);
console.log(`Total users: ${summary.totalUsers}`);
console.log(`Active users: ${summary.activeUsers}`);
console.log(`Avg session: ${summary.avgSessionDuration}s`);

// Top content types
console.log('Top content types:');
for (const content of summary.topContentTypes) {
  console.log(`  ${content.type}: ${(content.engagementRate * 100).toFixed(2)}%`);
}

// Engagement trends
console.log('Engagement trends:');
for (const trend of summary.engagementTrends) {
  console.log(`  ${trend.date}: ${trend.engagementScore.toFixed(2)}`);
}

// Get summary for different time periods
const weekSummary = await engagementTracker.getCohortSummary('25-34', 7);
const monthSummary = await engagementTracker.getCohortSummary('25-34', 30);
```

### Applying Low Engagement Penalty

```typescript
// Check and apply penalty for low-performing content
const penaltyApplied = await engagementTracker.applyLowEngagementPenalty(
  'mission-456',
  'mission',
  '25-34'
);

if (penaltyApplied) {
  console.log('Relevance score reduced due to low engagement');
}
```

### Queue Management

```typescript
// Check queue size
const queueSize = engagementTracker.getQueueSize();
console.log(`Events in queue: ${queueSize}`);

// Force immediate processing (useful for testing)
await engagementTracker.flushQueue();
```

## Integration with Other Services

### Content Curation Service

```typescript
import { engagementTracker } from './engagementTracker.service';
import { contentCurationService } from './contentCuration.service';

// Track when curated content is displayed
async function displayCuratedContent(userId: string, cohort: AgeCohort) {
  const content = await contentCurationService.getCuratedContent({
    userId,
    contentTypes: ['mission', 'challenge'],
    limit: 10,
  });

  // Track impressions
  for (const item of content.items) {
    await engagementTracker.trackEvent({
      userId,
      itemId: item.id,
      itemType: item.type,
      eventType: 'impression',
      ageCohort: cohort,
    });
  }

  return content;
}
```

### Age Cohort Analyzer

```typescript
import { engagementTracker } from './engagementTracker.service';
import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';

// Update cohort preferences based on engagement
async function updateCohortPreferences(cohort: AgeCohort) {
  // Get recent engagement metrics
  const metrics = await engagementTracker.getMetrics(cohort);

  // Transform to format expected by analyzer
  const engagementData = metrics.map(m => ({
    contentType: m.contentType,
    engagementRate: m.clickThroughRate,
    impressions: m.impressions,
    clicks: m.clicks,
  }));

  // Update preferences
  await ageCohortAnalyzer.updateCohortPreferences(cohort, engagementData);
}
```

### Dashboard Service

```typescript
import { engagementTracker } from './engagementTracker.service';

// Track dashboard interactions
async function trackDashboardView(userId: string, cohort: AgeCohort) {
  const dashboardItems = await getDashboardContent(userId);

  // Track impressions for all visible items
  for (const item of dashboardItems) {
    await engagementTracker.trackEvent({
      userId,
      itemId: item.id,
      itemType: item.type,
      eventType: 'impression',
      ageCohort: cohort,
      metadata: {
        position: item.position,
        section: item.section,
      },
    });
  }
}

// Track item click
async function trackItemClick(
  userId: string,
  itemId: string,
  itemType: ContentType,
  cohort: AgeCohort,
  duration: number
) {
  await engagementTracker.trackEvent({
    userId,
    itemId,
    itemType,
    eventType: 'click',
    ageCohort: cohort,
    metadata: {
      duration,
      source: 'dashboard',
    },
  });
}
```

## Database Schema

### content_interactions

Stores individual user interactions:

```sql
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  interaction_type VARCHAR(20) NOT NULL,
  age_cohort VARCHAR(10),
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_interactions_cohort_time 
  ON content_interactions(age_cohort, timestamp DESC);
CREATE INDEX idx_interactions_user 
  ON content_interactions(user_id, timestamp DESC);
```

### cohort_engagement_metrics

Stores aggregated daily metrics by cohort:

```sql
CREATE TABLE cohort_engagement_metrics (
  id UUID PRIMARY KEY,
  cohort VARCHAR(10) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  joins INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  avg_engagement_seconds INTEGER DEFAULT 0,
  UNIQUE(cohort, content_type, date)
);

CREATE INDEX idx_cohort_metrics 
  ON cohort_engagement_metrics(cohort, date DESC);
```

## Performance Considerations

### Async Event Processing

Events are queued and processed asynchronously to avoid blocking user interactions:

- **Queue Size**: Events are batched in groups of 50
- **Processing Interval**: Queue is processed every 5 seconds
- **Retry Logic**: Failed events are retried up to 3 times
- **Non-blocking**: Event tracking returns immediately after queuing

### Batch Processing

```typescript
// Events are automatically batched
for (let i = 0; i < 100; i++) {
  await engagementTracker.trackEvent({
    userId: `user-${i}`,
    itemId: `content-${i}`,
    itemType: 'mission',
    eventType: 'impression',
    ageCohort: '25-34',
  });
}
// All 100 events are queued instantly
// Processing happens in background in batches of 50
```

### Database Optimization

- Indexes on frequently queried fields (cohort, timestamp, user_id)
- Aggregated metrics reduce query complexity
- Date-based partitioning for large datasets

## Error Handling

The service handles errors gracefully:

```typescript
try {
  await engagementTracker.trackEvent(event);
} catch (error) {
  // Event is queued even if initial processing fails
  // Will be retried automatically
  console.error('Event tracking error:', error);
}

try {
  const metrics = await engagementTracker.getMetrics('25-34');
} catch (error) {
  // Returns empty array on error
  console.error('Metrics fetch error:', error);
}
```

## Testing

### Unit Tests

```bash
npm run test src/services/engagementTracker.service.test.ts
```

### Integration Tests

```typescript
import { engagementTracker } from './engagementTracker.service';

// Test full flow
describe('Engagement Tracking Integration', () => {
  it('should track and retrieve metrics', async () => {
    // Track events
    await engagementTracker.trackEvent({
      userId: 'test-user',
      itemId: 'test-content',
      itemType: 'mission',
      eventType: 'impression',
      ageCohort: '25-34',
    });

    // Flush queue
    await engagementTracker.flushQueue();

    // Retrieve metrics
    const metrics = await engagementTracker.getMetrics('25-34', 'mission');
    
    expect(metrics.length).toBeGreaterThan(0);
  });
});
```

## Monitoring

### Queue Health

```typescript
// Monitor queue size
setInterval(() => {
  const queueSize = engagementTracker.getQueueSize();
  if (queueSize > 1000) {
    console.warn(`Large queue size: ${queueSize}`);
  }
}, 60000); // Check every minute
```

### Engagement Metrics

```typescript
// Monitor cohort engagement
async function monitorEngagement() {
  const cohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];
  
  for (const cohort of cohorts) {
    const summary = await engagementTracker.getCohortSummary(cohort, 7);
    
    console.log(`${cohort}: ${summary.activeUsers}/${summary.totalUsers} active`);
    
    if (summary.activeUsers / summary.totalUsers < 0.1) {
      console.warn(`Low engagement for cohort ${cohort}`);
    }
  }
}
```

## Best Practices

### 1. Always Include Age Cohort

```typescript
// Good
await engagementTracker.trackEvent({
  userId: 'user-123',
  itemId: 'content-456',
  itemType: 'mission',
  eventType: 'click',
  ageCohort: '25-34', // ✓ Included
});

// Acceptable (but less useful for analytics)
await engagementTracker.trackEvent({
  userId: 'user-123',
  itemId: 'content-456',
  itemType: 'mission',
  eventType: 'click',
  // ageCohort is optional
});
```

### 2. Track Engagement Duration

```typescript
// Track how long user engaged with content
const startTime = Date.now();

// ... user interacts with content ...

const duration = Math.floor((Date.now() - startTime) / 1000);

await engagementTracker.trackEvent({
  userId: 'user-123',
  itemId: 'content-456',
  itemType: 'educational',
  eventType: 'complete',
  ageCohort: '18-24',
  metadata: {
    duration, // ✓ Include duration
  },
});
```

### 3. Use Appropriate Event Types

```typescript
// Track impression when content is displayed
await engagementTracker.trackEvent({
  eventType: 'impression', // ✓ User saw it
});

// Track click when user interacts
await engagementTracker.trackEvent({
  eventType: 'click', // ✓ User clicked
});

// Track completion when action is finished
await engagementTracker.trackEvent({
  eventType: 'complete', // ✓ User completed
});
```

### 4. Batch Related Events

```typescript
// When displaying multiple items, track all impressions
async function displayContentList(items: ContentItem[], userId: string, cohort: AgeCohort) {
  // Track all impressions
  for (const item of items) {
    await engagementTracker.trackEvent({
      userId,
      itemId: item.id,
      itemType: item.type,
      eventType: 'impression',
      ageCohort: cohort,
    });
  }
  // Events are automatically batched for efficient processing
}
```

## Troubleshooting

### Queue Growing Too Large

If the queue size keeps growing:

1. Check database connectivity
2. Verify Supabase credentials
3. Check for rate limiting
4. Force flush: `await engagementTracker.flushQueue()`

### Missing Metrics

If metrics are not appearing:

1. Ensure events include `ageCohort`
2. Wait for queue processing (5 seconds)
3. Check date range in queries
4. Verify database permissions

### Low Engagement Not Detected

If penalties aren't being applied:

1. Ensure at least 10 impressions exist
2. Check 7-day window has data
3. Verify cohort average is calculated correctly
4. Check relevance_scores table exists

## Future Enhancements

- Real-time engagement streaming
- Machine learning for engagement prediction
- A/B testing support
- Engagement anomaly detection
- Cross-cohort engagement comparison
- Engagement heatmaps
- Predictive engagement scoring

## Related Services

- **AgeCohortAnalyzer**: Uses engagement data for adaptive learning
- **ContentCurationService**: Uses metrics for relevance scoring
- **ScoringEngine**: Incorporates engagement patterns
- **DashboardService**: Tracks dashboard interactions

## Support

For issues or questions:
- Check the test file: `src/services/engagementTracker.service.test.ts`
- Review the design document: `.kiro/specs/v1-major-release/design.md`
- See requirements: `.kiro/specs/v1-major-release/requirements.md` (B7.1, B7.2, B7.4)
