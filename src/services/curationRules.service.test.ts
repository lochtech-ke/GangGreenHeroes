/**
 * Curation Rules Service Tests
 * 
 * Tests for curation rules management including CRUD operations,
 * validation, and preview testing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurationRulesService, RuleValidator } from './curationRules.service';
import {
  CurationRule,
  AgeCohort,
  CuratedContentItem,
  ScoringContext,
} from '../types/contentCuration.types';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('RuleValidator', () => {
  let validator: RuleValidator;

  beforeEach(() => {
    validator = new RuleValidator();
  });

  describe('validate', () => {
    it('should validate a complete valid rule', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Boost missions for young adults',
        },
        priority: 100,
        isActive: true,
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject rule without cohort', () => {
      const rule: Partial<CurationRule> = {
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cohort is required');
    });

    it('should reject rule with invalid cohort', () => {
      const rule: Partial<CurationRule> = {
        cohort: 'invalid' as AgeCohort,
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid cohort'))).toBe(true);
    });

    it('should reject rule without action', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action is required');
    });

    it('should reject multiply_score with invalid value', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 15, // Too high
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('between 0 and 10'))).toBe(true);
    });

    it('should reject age_range with invalid parameters', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'filter',
        condition: 'age_range',
        parameters: { minAge: 25, maxAge: 20 }, // Invalid: min > max
        action: {
          type: 'exclude',
          value: true,
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('cannot be greater than'))).toBe(true);
    });

    it('should warn about conflicting rule types', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'exclude',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score', // Conflicting with exclude rule type
          value: 0.5,
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('exclude'))).toBe(true);
    });

    it('should warn about ineffective boost', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 0.5, // Less than 1, will reduce scores
          reason: 'Test',
        },
      };

      const result = validator.validate(rule);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('less than 1'))).toBe(true);
    });

    it('should validate priority range', () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Test',
        },
        priority: 1500, // Too high
      };

      const result = validator.validate(rule);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('between 0 and 1000'))).toBe(true);
    });
  });
});

describe('CurationRulesService', () => {
  let service: CurationRulesService;

  beforeEach(() => {
    service = new CurationRulesService();
    vi.clearAllMocks();
  });

  describe('createRule', () => {
    it('should create a valid rule', async () => {
      const { supabase } = await import('./supabase');
      const mockFrom = supabase.from as any;

      // Mock successful insert
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'rule-1',
            cohort: '18-24',
            rule_type: 'boost',
            condition: 'content_type',
            parameters: { contentType: 'mission' },
            action: {
              type: 'multiply_score',
              value: 1.5,
              reason: 'Boost missions',
            },
            priority: 100,
            is_active: true,
            created_by: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const rule: Omit<CurationRule, 'id' | 'createdAt' | 'updatedAt'> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Boost missions',
        },
        priority: 100,
        isActive: true,
        createdBy: 'admin',
      };

      const result = await service.createRule(rule);

      expect(result.id).toBe('rule-1');
      expect(result.cohort).toBe('18-24');
      expect(result.ruleType).toBe('boost');
    });

    it('should reject invalid rule', async () => {
      const rule: any = {
        cohort: 'invalid',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Test',
        },
      };

      await expect(service.createRule(rule)).rejects.toThrow('validation failed');
    });
  });

  describe('testRule', () => {
    it('should test rule against content items', async () => {
      const rule: Partial<CurationRule> = {
        cohort: '18-24',
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Boost missions',
        },
      };

      const testContent: CuratedContentItem[] = [
        {
          id: 'content-1',
          type: 'mission',
          title: 'Tree Planting',
          description: 'Plant trees',
          relevanceScore: 50,
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: 'content-2',
          type: 'challenge',
          title: 'Waste Challenge',
          description: 'Reduce waste',
          relevanceScore: 50,
          metadata: {},
          createdAt: new Date(),
        },
      ];

      const testContext: ScoringContext = {
        user: {
          userId: 'user-1',
          age: 20,
          ageCohort: '18-24',
          interests: ['trees'],
          userType: 'individual',
        },
        cohort: '18-24',
        personalHistory: {
          totalInteractions: 5,
          contentTypeBreakdown: { 
            mission: 3, 
            challenge: 2,
            petition: 0,
            initiative: 0,
            social_post: 0,
            educational: 0,
            community_post: 0
          },
          recentInteractions: [],
          engagementScore: 0.7,
          lastActivity: new Date(),
        },
        cohortPreferences: {
          contentTypes: {
            initiative: 0.7,
            social_post: 0.8,
            challenge: 0.9,
            educational: 0.8,
            mission: 0.8,
            community_post: 0.8,
            petition: 0.7,
          },
          engagementPatterns: [],
          filterRules: [],
          lastCalculated: new Date(),
        },
        timestamp: new Date(),
      };

      const result = await service.testRule(rule, testContent, testContext);

      expect(result.testCases).toHaveLength(2);
      expect(result.overallSuccess).toBe(true);
      
      // First item (mission) should match condition
      expect(result.testCases[0].input.conditionMatches).toBe(true);
      expect(result.testCases[0].expectedOutput.score).toBe(75); // 50 * 1.5
      
      // Second item (challenge) should not match condition
      expect(result.testCases[1].input.conditionMatches).toBe(false);
      expect(result.testCases[1].expectedOutput.score).toBe(50); // Unchanged
    });

    it('should reject testing invalid rule', async () => {
      const rule: Partial<CurationRule> = {
        cohort: 'invalid' as AgeCohort,
        ruleType: 'boost',
        condition: 'content_type',
        parameters: { contentType: 'mission' },
        action: {
          type: 'multiply_score',
          value: 1.5,
          reason: 'Test',
        },
      };

      await expect(
        service.testRule(rule, [], {} as ScoringContext)
      ).rejects.toThrow('invalid rule');
    });
  });

  describe('getRulesForCohort', () => {
    it('should fetch active rules for cohort', async () => {
      const { supabase } = await import('./supabase');
      const mockFrom = supabase.from as any;

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'rule-1',
              cohort: '18-24',
              rule_type: 'boost',
              condition: 'content_type',
              parameters: { contentType: 'mission' },
              action: {
                type: 'multiply_score',
                value: 1.5,
                reason: 'Boost missions',
              },
              priority: 100,
              is_active: true,
              created_by: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      });

      const rules = await service.getRulesForCohort('18-24');

      expect(rules).toHaveLength(1);
      expect(rules[0].cohort).toBe('18-24');
      expect(rules[0].isActive).toBe(true);
    });
  });
});
