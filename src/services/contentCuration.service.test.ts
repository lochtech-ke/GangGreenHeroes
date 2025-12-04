/**
 * Content Curation Service Tests
 * Basic unit tests for the main content curation service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { contentCurationService } from './contentCuration.service';
import type { CurationRequest } from '../types/contentCuration.types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              age: 25,
              age_cohort: '25-34',
              age_curation_enabled: true
            },
            error: null
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

// Mock other services
vi.mock('./ageCohortAnalyzer.service', () => ({
  ageCohortAnalyzer: {
    determineCohort: vi.fn(() => '25-34'),
    getCohortPreferences: vi.fn(() => ({
      contentTypes: {
        initiative: 0.8,
        mission: 0.7,
        educational: 0.6,
        social_post: 0.5,
        challenge: 0.7,
        community_post: 0.5,
        petition: 0.6
      },
      engagementPatterns: [],
      filterRules: [],
      lastCalculated: new Date()
    }))
  }
}));

vi.mock('./scoringEngine.service', () => ({
  scoringEngine: {
    calculateScore: vi.fn(() => ({
      contentId: 'test',
      baseScore: 50,
      cohortScore: 30,
      personalScore: 20,
      finalScore: 75,
      factors: [],
      calculatedAt: new Date()
    }))
  }
}));

vi.mock('./contentFilteringEngine.service', () => ({
  contentFilteringEngine: {
    filterByAgeCohort: vi.fn((items) => items)
  }
}));

vi.mock('./engagementTracker.service', () => ({
  engagementTracker: {
    getUserHistory: vi.fn(() => Promise.resolve([]))
  }
}));

vi.mock('./curationRules.service', () => ({
  curationRulesService: {
    getRulesForCohort: vi.fn(() => Promise.resolve([]))
  }
}));

vi.mock('./curationFallback.service', () => ({
  CurationFallbackService: vi.fn().mockImplementation(() => ({
    handleMissingAge: vi.fn(() => Promise.resolve({
      items: [],
      fallbackReason: 'missing_age',
      fallbackStrategy: 'chronological',
      usedCache: false,
      timestamp: new Date()
    })),
    handleInvalidAge: vi.fn(() => Promise.resolve({
      items: [],
      fallbackReason: 'invalid_age',
      fallbackStrategy: 'chronological',
      usedCache: false,
      timestamp: new Date()
    })),
    handleEngineFailure: vi.fn(() => Promise.resolve({
      items: [],
      fallbackReason: 'engine_failure',
      fallbackStrategy: 'chronological',
      usedCache: false,
      timestamp: new Date()
    })),
    handleInsufficientContent: vi.fn(() => Promise.resolve({
      items: [],
      fallbackReason: 'insufficient_content',
      fallbackStrategy: 'adjacent_cohort',
      usedCache: false,
      timestamp: new Date()
    })),
    getChronologicalFeed: vi.fn(() => Promise.resolve([]))
  }))
}));

describe('ContentCurationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contentCurationService.clearCache();
  });

  describe('getCuratedContent', () => {
    it('should return curated content for valid user', async () => {
      const request: CurationRequest = {
        userId: 'test-user-id',
        contentTypes: ['initiative', 'mission'],
        limit: 10
      };

      const response = await contentCurationService.getCuratedContent(request);

      expect(response).toBeDefined();
      expect(response.items).toBeDefined();
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.hasMore).toBeDefined();
      expect(response.total).toBeDefined();
    });

    it('should handle pagination with offset', async () => {
      const request: CurationRequest = {
        userId: 'test-user-id',
        contentTypes: ['initiative'],
        limit: 5,
        offset: 10
      };

      const response = await contentCurationService.getCuratedContent(request);

      expect(response).toBeDefined();
      expect(response.items).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = contentCurationService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBeDefined();
      expect(stats.ttlMinutes).toBe(15);
    });

    it('should clear cache', () => {
      contentCurationService.clearCache();
      const stats = contentCurationService.getCacheStats();

      expect(stats.size).toBe(0);
    });

    it('should invalidate user cache', () => {
      contentCurationService.invalidateUserCache('test-user-id');
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('getUserInteractionHistory', () => {
    it('should return interaction history with all content types', async () => {
      const history = await contentCurationService.getUserInteractionHistory('test-user-id');

      expect(history).toBeDefined();
      expect(history.totalInteractions).toBeDefined();
      expect(history.contentTypeBreakdown).toBeDefined();
      expect(history.contentTypeBreakdown.initiative).toBeDefined();
      expect(history.contentTypeBreakdown.mission).toBeDefined();
      expect(history.contentTypeBreakdown.educational).toBeDefined();
      expect(history.contentTypeBreakdown.social_post).toBeDefined();
      expect(history.contentTypeBreakdown.challenge).toBeDefined();
      expect(history.contentTypeBreakdown.community_post).toBeDefined();
      expect(history.contentTypeBreakdown.petition).toBeDefined();
      expect(history.recentInteractions).toBeDefined();
      expect(Array.isArray(history.recentInteractions)).toBe(true);
    });
  });

  describe('fetchContentItems', () => {
    it('should fetch content items for requested types', async () => {
      const items = await contentCurationService.fetchContentItems(
        ['initiative', 'mission'],
        10
      );

      expect(Array.isArray(items)).toBe(true);
    });

    it('should handle empty content types', async () => {
      const items = await contentCurationService.fetchContentItems([], 10);

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });
  });
});
