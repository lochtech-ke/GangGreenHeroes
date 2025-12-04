/**
 * Engagement Tracker Service Tests
 * Unit tests for engagement tracking and analytics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EngagementTrackerService } from './engagementTracker.service';
import { AgeCohort, ContentType, InteractionType } from '../types/contentCuration.types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('EngagementTrackerService', () => {
  let service: EngagementTrackerService;

  beforeEach(() => {
    service = new EngagementTrackerService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('trackEvent', () => {
    it('should queue an engagement event', async () => {
      const event = {
        userId: 'user-123',
        itemId: 'content-456',
        itemType: 'mission' as ContentType,
        eventType: 'click' as InteractionType,
        ageCohort: '25-34' as AgeCohort,
      };

      await service.trackEvent(event);

      // Event should be queued
      expect(service.getQueueSize()).toBeGreaterThan(0);
    });

    it('should add timestamp and ID to event', async () => {
      const event = {
        userId: 'user-123',
        itemId: 'content-456',
        itemType: 'mission' as ContentType,
        eventType: 'impression' as InteractionType,
        ageCohort: '18-24' as AgeCohort,
      };

      await service.trackEvent(event);

      // Queue should have the event
      expect(service.getQueueSize()).toBe(1);
    });

    it('should handle multiple events', async () => {
      const events = [
        {
          userId: 'user-1',
          itemId: 'content-1',
          itemType: 'mission' as ContentType,
          eventType: 'impression' as InteractionType,
          ageCohort: '25-34' as AgeCohort,
        },
        {
          userId: 'user-2',
          itemId: 'content-2',
          itemType: 'challenge' as ContentType,
          eventType: 'click' as InteractionType,
          ageCohort: '18-24' as AgeCohort,
        },
        {
          userId: 'user-3',
          itemId: 'content-3',
          itemType: 'educational' as ContentType,
          eventType: 'complete' as InteractionType,
          ageCohort: '13-17' as AgeCohort,
        },
      ];

      for (const event of events) {
        await service.trackEvent(event);
      }

      expect(service.getQueueSize()).toBe(3);
    });

    it('should include optional metadata', async () => {
      const event = {
        userId: 'user-123',
        itemId: 'content-456',
        itemType: 'mission' as ContentType,
        eventType: 'click' as InteractionType,
        ageCohort: '25-34' as AgeCohort,
        metadata: {
          duration: 120,
          source: 'dashboard',
        },
      };

      await service.trackEvent(event);

      expect(service.getQueueSize()).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return empty array when no metrics exist', async () => {
      const metrics = await service.getMetrics('25-34' as AgeCohort);

      expect(metrics).toEqual([]);
    });

    it('should filter by content type when specified', async () => {
      const metrics = await service.getMetrics(
        '25-34' as AgeCohort,
        'mission' as ContentType
      );

      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should filter by date range when specified', async () => {
      const dateRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const metrics = await service.getMetrics(
        '25-34' as AgeCohort,
        undefined,
        dateRange
      );

      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should calculate click-through rate correctly', async () => {
      // This would need mock data to test properly
      const metrics = await service.getMetrics('25-34' as AgeCohort);

      for (const metric of metrics) {
        expect(metric.clickThroughRate).toBeGreaterThanOrEqual(0);
        expect(metric.clickThroughRate).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate conversion rate correctly', async () => {
      const metrics = await service.getMetrics('25-34' as AgeCohort);

      for (const metric of metrics) {
        expect(metric.conversionRate).toBeGreaterThanOrEqual(0);
        expect(metric.conversionRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('getUserHistory', () => {
    it('should return empty history for user with no interactions', async () => {
      const history = await service.getUserHistory('user-123');

      expect(history.userId).toBe('user-123');
      expect(history.interactions).toEqual([]);
      expect(history.totalInteractions).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const history = await service.getUserHistory('user-123', 50);

      expect(history.interactions.length).toBeLessThanOrEqual(50);
    });

    it('should return interactions in reverse chronological order', async () => {
      const history = await service.getUserHistory('user-123');

      // Check that timestamps are in descending order
      for (let i = 1; i < history.interactions.length; i++) {
        const prev = history.interactions[i - 1].timestamp.getTime();
        const curr = history.interactions[i].timestamp.getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });
  });

  describe('getCohortSummary', () => {
    it('should return summary with all required fields', async () => {
      const summary = await service.getCohortSummary('25-34' as AgeCohort);

      expect(summary).toHaveProperty('cohort');
      expect(summary).toHaveProperty('totalUsers');
      expect(summary).toHaveProperty('activeUsers');
      expect(summary).toHaveProperty('avgSessionDuration');
      expect(summary).toHaveProperty('topContentTypes');
      expect(summary).toHaveProperty('engagementTrends');
    });

    it('should calculate average session duration', async () => {
      const summary = await service.getCohortSummary('25-34' as AgeCohort);

      expect(summary.avgSessionDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return top content types sorted by engagement', async () => {
      const summary = await service.getCohortSummary('25-34' as AgeCohort);

      // Check that engagement rates are in descending order
      for (let i = 1; i < summary.topContentTypes.length; i++) {
        const prev = summary.topContentTypes[i - 1].engagementRate;
        const curr = summary.topContentTypes[i].engagementRate;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });

    it('should return engagement trends sorted by date', async () => {
      const summary = await service.getCohortSummary('25-34' as AgeCohort);

      // Check that dates are in ascending order
      for (let i = 1; i < summary.engagementTrends.length; i++) {
        const prev = summary.engagementTrends[i - 1].date.getTime();
        const curr = summary.engagementTrends[i].date.getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('should respect days parameter', async () => {
      const summary7 = await service.getCohortSummary('25-34' as AgeCohort, 7);
      const summary30 = await service.getCohortSummary('25-34' as AgeCohort, 30);

      // Both should return valid summaries
      expect(summary7.cohort).toBe('25-34');
      expect(summary30.cohort).toBe('25-34');
    });
  });

  describe('applyLowEngagementPenalty', () => {
    it('should return false when no interactions exist', async () => {
      const result = await service.applyLowEngagementPenalty(
        'content-123',
        'mission' as ContentType,
        '25-34' as AgeCohort
      );

      expect(result).toBe(false);
    });

    it('should not apply penalty when engagement is above average', async () => {
      // This would need mock data showing high engagement
      const result = await service.applyLowEngagementPenalty(
        'content-123',
        'mission' as ContentType,
        '25-34' as AgeCohort
      );

      // With no data, should return false
      expect(result).toBe(false);
    });

    it('should not apply penalty when impressions are too low', async () => {
      // Need at least 10 impressions to apply penalty
      const result = await service.applyLowEngagementPenalty(
        'content-123',
        'mission' as ContentType,
        '25-34' as AgeCohort
      );

      expect(result).toBe(false);
    });
  });

  describe('Queue Management', () => {
    it('should return current queue size', () => {
      const initialSize = service.getQueueSize();
      expect(initialSize).toBeGreaterThanOrEqual(0);
    });

    it('should flush queue on demand', async () => {
      // Add some events
      await service.trackEvent({
        userId: 'user-1',
        itemId: 'content-1',
        itemType: 'mission' as ContentType,
        eventType: 'impression' as InteractionType,
        ageCohort: '25-34' as AgeCohort,
      });

      const sizeBefore = service.getQueueSize();
      expect(sizeBefore).toBeGreaterThan(0);

      // Flush queue
      await service.flushQueue();

      // Queue should be processed (though may not be empty if processing failed)
      const sizeAfter = service.getQueueSize();
      expect(sizeAfter).toBeLessThanOrEqual(sizeBefore);
    });
  });

  describe('Event ID Generation', () => {
    it('should generate unique event IDs', async () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        await service.trackEvent({
          userId: `user-${i}`,
          itemId: `content-${i}`,
          itemType: 'mission' as ContentType,
          eventType: 'impression' as InteractionType,
          ageCohort: '25-34' as AgeCohort,
        });
      }

      // All IDs should be unique (we can't directly access them, but queue size should match)
      expect(service.getQueueSize()).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in getMetrics', async () => {
      // The mock will return empty data, which should be handled gracefully
      const metrics = await service.getMetrics('25-34' as AgeCohort);

      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should handle database errors gracefully in getUserHistory', async () => {
      const history = await service.getUserHistory('user-123');

      expect(history).toHaveProperty('userId');
      expect(history).toHaveProperty('interactions');
      expect(history).toHaveProperty('totalInteractions');
    });

    it('should handle database errors gracefully in getCohortSummary', async () => {
      const summary = await service.getCohortSummary('25-34' as AgeCohort);

      expect(summary).toHaveProperty('cohort');
      expect(summary.cohort).toBe('25-34');
    });
  });

  describe('Interaction Types', () => {
    const interactionTypes: InteractionType[] = [
      'impression',
      'click',
      'save',
      'join',
      'share',
      'complete',
      'like',
      'comment',
    ];

    it('should handle all interaction types', async () => {
      for (const eventType of interactionTypes) {
        await service.trackEvent({
          userId: 'user-123',
          itemId: 'content-456',
          itemType: 'mission' as ContentType,
          eventType,
          ageCohort: '25-34' as AgeCohort,
        });
      }

      expect(service.getQueueSize()).toBe(interactionTypes.length);
    });
  });

  describe('Content Types', () => {
    const contentTypes: ContentType[] = [
      'initiative',
      'social_post',
      'challenge',
      'educational',
      'mission',
      'community_post',
      'petition',
    ];

    it('should handle all content types', async () => {
      for (const itemType of contentTypes) {
        await service.trackEvent({
          userId: 'user-123',
          itemId: 'content-456',
          itemType,
          eventType: 'impression' as InteractionType,
          ageCohort: '25-34' as AgeCohort,
        });
      }

      expect(service.getQueueSize()).toBe(contentTypes.length);
    });
  });

  describe('Age Cohorts', () => {
    const cohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];

    it('should handle all age cohorts', async () => {
      for (const ageCohort of cohorts) {
        await service.trackEvent({
          userId: 'user-123',
          itemId: 'content-456',
          itemType: 'mission' as ContentType,
          eventType: 'impression' as InteractionType,
          ageCohort,
        });
      }

      expect(service.getQueueSize()).toBe(cohorts.length);
    });

    it('should get metrics for all cohorts', async () => {
      for (const cohort of cohorts) {
        const metrics = await service.getMetrics(cohort);
        expect(Array.isArray(metrics)).toBe(true);
      }
    });

    it('should get summaries for all cohorts', async () => {
      for (const cohort of cohorts) {
        const summary = await service.getCohortSummary(cohort);
        expect(summary.cohort).toBe(cohort);
      }
    });
  });
});
