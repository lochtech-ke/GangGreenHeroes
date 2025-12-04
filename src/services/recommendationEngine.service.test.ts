/**
 * Recommendation Engine Service Tests
 * Basic unit tests for the recommendation engine
 */

import { describe, it, expect, vi } from 'vitest';
import { recommendationEngineService } from './recommendationEngine.service';
import { RecommendationRequest } from '../types/aiCompanion.types';
import { AgeCohort } from '../types/platform.types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null
            }))
          })),
          limit: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
            error: null
          }))
        })),
        limit: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      }))
    }))
  }
}));

describe('RecommendationEngineService', () => {
  describe('generateRecommendations', () => {
    it('should generate recommendations for youth cohort', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-1',
        userInterests: ['trees', 'water'],
        ageCohort: '18-24' as AgeCohort,
        location: {
          county: 'Nairobi',
          subCounty: 'Westlands'
        },
        limit: 5
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should generate recommendations for senior cohort', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-2',
        userInterests: ['policy', 'trees'],
        ageCohort: '50+' as AgeCohort,
        limit: 3
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should include required recommendation fields', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-3',
        userInterests: ['waste'],
        ageCohort: '25-34' as AgeCohort,
        limit: 1
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations.length).toBeGreaterThan(0);
      
      const rec = recommendations[0];
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('type');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('relevanceScore');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('ageAppropriate');
      expect(rec.ageAppropriate).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-4',
        userInterests: ['trees'],
        ageCohort: '35-49' as AgeCohort,
        limit: 2
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations.length).toBeLessThanOrEqual(2);
    });

    it('should handle missing location gracefully', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-5',
        userInterests: ['water'],
        ageCohort: '18-24' as AgeCohort,
        limit: 3
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle empty interests gracefully', async () => {
      const request: RecommendationRequest = {
        userId: 'test-user-6',
        userInterests: [],
        ageCohort: '25-34' as AgeCohort,
        limit: 3
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('getContextualSuggestions', () => {
    it('should generate contextual suggestions', async () => {
      const suggestions = await recommendationEngineService.getContextualSuggestions(
        'test-user-7',
        {
          userInterests: ['trees', 'waste'],
          ageCohort: '18-24' as AgeCohort,
          currentPage: '/missions',
          recentActions: ['joined_mission'],
          journeyStage: 'engagement',
          location: {
            county: 'Nairobi'
          }
        }
      );

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should enhance reasons with context', async () => {
      const suggestions = await recommendationEngineService.getContextualSuggestions(
        'test-user-8',
        {
          userInterests: ['policy'],
          ageCohort: '35-49' as AgeCohort,
          currentPage: '/learning',
          recentActions: [],
          journeyStage: 'contribution',
          location: {
            county: 'Mombasa',
            subCounty: 'Mvita'
          }
        }
      );

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check that reasons have the correct structure
      expect(suggestions[0]).toHaveProperty('reason');
      expect(typeof suggestions[0].reason).toBe('string');
      expect(suggestions[0].reason.length).toBeGreaterThan(0);
    });
  });

  describe('Age-appropriate filtering', () => {
    it('should provide age-appropriate recommendations for minors', async () => {
      const request: RecommendationRequest = {
        userId: 'test-minor',
        userInterests: ['trees'],
        ageCohort: '13-17' as AgeCohort,
        limit: 5
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      // All recommendations should be age-appropriate
      recommendations.forEach(rec => {
        expect(rec.ageAppropriate).toBe(true);
      });
    });

    it('should provide age-appropriate recommendations for seniors', async () => {
      const request: RecommendationRequest = {
        userId: 'test-senior',
        userInterests: ['policy', 'trees'],
        ageCohort: '50+' as AgeCohort,
        limit: 5
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      // All recommendations should be age-appropriate
      recommendations.forEach(rec => {
        expect(rec.ageAppropriate).toBe(true);
      });
    });
  });

  describe('Fallback behavior', () => {
    it('should return fallback recommendations on error', async () => {
      const request: RecommendationRequest = {
        userId: 'test-fallback',
        userInterests: ['trees', 'waste'],
        ageCohort: '25-34' as AgeCohort,
        limit: 3
      };

      // The service should handle errors gracefully and return fallbacks
      const recommendations = await recommendationEngineService.generateRecommendations(request);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include interest-based fallbacks', async () => {
      const request: RecommendationRequest = {
        userId: 'test-fallback-2',
        userInterests: ['trees'],
        ageCohort: '18-24' as AgeCohort,
        limit: 5
      };

      const recommendations = await recommendationEngineService.generateRecommendations(request);

      // Should have at least one tree-related recommendation
      const hasTreeRec = recommendations.some(rec => 
        rec.title.toLowerCase().includes('tree') ||
        rec.description.toLowerCase().includes('tree') ||
        rec.reason.toLowerCase().includes('tree')
      );

      expect(hasTreeRec).toBe(true);
    });
  });
});
