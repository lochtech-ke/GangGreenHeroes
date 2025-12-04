/**
 * Content Filtering Engine Service Tests
 * 
 * Tests for age-based content filtering logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContentFilteringEngine,
  FilterableContentItem,
} from './contentFilteringEngine.service';
import { AgeCohort, ContentType } from '../types/contentCuration.types';

describe('ContentFilteringEngine', () => {
  let engine: ContentFilteringEngine;

  beforeEach(() => {
    engine = new ContentFilteringEngine();
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const createMockContent = (
    overrides: Partial<FilterableContentItem> = {}
  ): FilterableContentItem => ({
    id: 'test-1',
    type: 'initiative' as ContentType,
    title: 'Test Initiative',
    description: 'Test description',
    relevanceScore: 0.8,
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  });

  // ============================================================================
  // Age Targeting Tests
  // ============================================================================

  describe('Age Targeting', () => {
    it('should include content with no age targeting for all cohorts', () => {
      const content = createMockContent();
      const cohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];

      cohorts.forEach(cohort => {
        const filtered = engine.filterByAgeCohort([content], cohort);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('test-1');
      });
    });

    it('should include content when age targeting matches cohort', () => {
      const content = createMockContent({
        ageTargeting: [{ minAge: 18, maxAge: 24 }],
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should exclude content when age targeting does not match cohort', () => {
      const content = createMockContent({
        ageTargeting: [{ minAge: 25, maxAge: 34 }],
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(0);
    });

    it('should include content when age targeting overlaps with cohort', () => {
      const content = createMockContent({
        ageTargeting: [{ minAge: 20, maxAge: 30 }],
      });

      // Should match 18-24 (overlap: 20-24)
      const filtered1 = engine.filterByAgeCohort([content], '18-24');
      expect(filtered1).toHaveLength(1);

      // Should match 25-34 (overlap: 25-30)
      const filtered2 = engine.filterByAgeCohort([content], '25-34');
      expect(filtered2).toHaveLength(1);

      // Should not match 13-17 (no overlap)
      const filtered3 = engine.filterByAgeCohort([content], '13-17');
      expect(filtered3).toHaveLength(0);
    });

    it('should include content with multiple age ranges when any range matches', () => {
      const content = createMockContent({
        ageTargeting: [
          { minAge: 13, maxAge: 17 },
          { minAge: 50, maxAge: 120 },
        ],
      });

      // Should match 13-17
      const filtered1 = engine.filterByAgeCohort([content], '13-17');
      expect(filtered1).toHaveLength(1);

      // Should match 50+
      const filtered2 = engine.filterByAgeCohort([content], '50+');
      expect(filtered2).toHaveLength(1);

      // Should not match 25-34
      const filtered3 = engine.filterByAgeCohort([content], '25-34');
      expect(filtered3).toHaveLength(0);
    });
  });

  // ============================================================================
  // Minor Filters (13-17) - Requirements B1.3, B1.5
  // ============================================================================

  describe('Minor Filters (13-17)', () => {
    it('should exclude content requiring adult status (B1.5)', () => {
      const content = createMockContent({
        metadata: {
          requiresAdultStatus: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '13-17');
      expect(filtered).toHaveLength(0);
    });

    it('should exclude content requiring legal age (B1.5)', () => {
      const content = createMockContent({
        metadata: {
          requiresLegalAge: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '13-17');
      expect(filtered).toHaveLength(0);
    });

    it('should exclude content requiring financial contribution (B1.3, B1.5)', () => {
      const content = createMockContent({
        metadata: {
          requiresFinancialContribution: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '13-17');
      expect(filtered).toHaveLength(0);
    });

    it('should exclude content with financial requirements (B1.3, B1.5)', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: 1000,
            currency: 'KES',
            type: 'donation',
          },
        },
      });

      const filtered = engine.filterByAgeCohort([content], '13-17');
      expect(filtered).toHaveLength(0);
    });

    it('should include content without financial or adult requirements', () => {
      const content = createMockContent({
        metadata: {
          participationType: 'digital',
        },
      });

      const filtered = engine.filterByAgeCohort([content], '13-17');
      expect(filtered).toHaveLength(1);
    });

    it('should provide detailed reasons for exclusion', () => {
      const content = createMockContent({
        metadata: {
          requiresAdultStatus: true,
        },
      });

      const result = engine.filterWithDetails([content], '13-17');
      expect(result.excluded).toHaveLength(1);
      expect(result.filterStats.filterBreakdown['requires_adult_status']).toBe(1);
    });
  });

  // ============================================================================
  // Youth Filters (18-24) - Requirement B1.3
  // ============================================================================

  describe('Youth Filters (18-24)', () => {
    it('should exclude content with high financial requirements (B1.3)', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: 10000, // Above youth capacity threshold
            currency: 'KES',
            type: 'donation',
          },
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(0);
    });

    it('should include content with low financial requirements (B1.3)', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: 1000, // Below youth capacity threshold
            currency: 'KES',
            type: 'donation',
          },
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should include content at the youth capacity threshold', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: 5000, // At threshold
            currency: 'KES',
            type: 'donation',
          },
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should include content without financial requirements', () => {
      const content = createMockContent({
        metadata: {
          participationType: 'digital',
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should allow adult content for youth (18-24)', () => {
      const content = createMockContent({
        metadata: {
          requiresAdultStatus: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });
  });

  // ============================================================================
  // Professional Filters (25-49) - Requirement B2.3
  // ============================================================================

  describe('Professional Filters (25-34, 35-49)', () => {
    it('should include content with carbon credit opportunities (B2.3)', () => {
      const content = createMockContent({
        metadata: {
          carbonCreditAvailable: true,
        },
      });

      const filtered1 = engine.filterByAgeCohort([content], '25-34');
      expect(filtered1).toHaveLength(1);

      const filtered2 = engine.filterByAgeCohort([content], '35-49');
      expect(filtered2).toHaveLength(1);
    });

    it('should include content with high financial requirements', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: 50000,
            currency: 'KES',
            type: 'investment',
          },
        },
      });

      const filtered1 = engine.filterByAgeCohort([content], '25-34');
      expect(filtered1).toHaveLength(1);

      const filtered2 = engine.filterByAgeCohort([content], '35-49');
      expect(filtered2).toHaveLength(1);
    });

    it('should include content requiring professional skills', () => {
      const content = createMockContent({
        metadata: {
          professionalSkillsRequired: ['project_management', 'data_analysis'],
        },
      });

      const filtered1 = engine.filterByAgeCohort([content], '25-34');
      expect(filtered1).toHaveLength(1);

      const filtered2 = engine.filterByAgeCohort([content], '35-49');
      expect(filtered2).toHaveLength(1);
    });

    it('should not exclude any content type for professionals', () => {
      const contents = [
        createMockContent({ id: '1', metadata: { requiresAdultStatus: true } }),
        createMockContent({ id: '2', metadata: { requiresFinancialContribution: true } }),
        createMockContent({ id: '3', metadata: { financialRequirement: { amount: 100000 } } }),
        createMockContent({ id: '4', metadata: { participationType: 'physical' } }),
      ];

      const filtered1 = engine.filterByAgeCohort(contents, '25-34');
      expect(filtered1).toHaveLength(4);

      const filtered2 = engine.filterByAgeCohort(contents, '35-49');
      expect(filtered2).toHaveLength(4);
    });
  });

  // ============================================================================
  // Senior Filters (50+) - Requirement B3.3
  // ============================================================================

  describe('Senior Filters (50+)', () => {
    it('should include educational content about long-term impact (B3.3)', () => {
      const content = createMockContent({
        type: 'educational',
        metadata: {
          category: 'long_term_impact',
        },
      });

      const filtered = engine.filterByAgeCohort([content], '50+');
      expect(filtered).toHaveLength(1);
    });

    it('should include legacy projects', () => {
      const content = createMockContent({
        metadata: {
          legacyProject: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '50+');
      expect(filtered).toHaveLength(1);
    });

    it('should include advisory roles', () => {
      const content = createMockContent({
        metadata: {
          advisoryRole: true,
        },
      });

      const filtered = engine.filterByAgeCohort([content], '50+');
      expect(filtered).toHaveLength(1);
    });

    it('should include low physical intensity activities', () => {
      const content = createMockContent({
        metadata: {
          physicalIntensity: 'low',
        },
      });

      const filtered = engine.filterByAgeCohort([content], '50+');
      expect(filtered).toHaveLength(1);
    });

    it('should include remote participation options', () => {
      const content = createMockContent({
        metadata: {
          participationType: 'remote',
        },
      });

      const filtered = engine.filterByAgeCohort([content], '50+');
      expect(filtered).toHaveLength(1);
    });

    it('should not exclude any content type for seniors', () => {
      const contents = [
        createMockContent({ id: '1', metadata: { requiresAdultStatus: true } }),
        createMockContent({ id: '2', metadata: { requiresFinancialContribution: true } }),
        createMockContent({ id: '3', metadata: { financialRequirement: { amount: 100000 } } }),
        createMockContent({ id: '4', metadata: { physicalIntensity: 'high' } }),
      ];

      const filtered = engine.filterByAgeCohort(contents, '50+');
      expect(filtered).toHaveLength(4);
    });
  });

  // ============================================================================
  // Batch Filtering Tests
  // ============================================================================

  describe('Batch Filtering', () => {
    it('should filter multiple items correctly', () => {
      const contents = [
        createMockContent({ id: '1', metadata: {} }), // Should pass for all
        createMockContent({ id: '2', metadata: { requiresAdultStatus: true } }), // Excluded for minors
        createMockContent({ id: '3', metadata: { financialRequirement: { amount: 10000 } } }), // Excluded for youth
        createMockContent({ id: '4', metadata: { participationType: 'digital' } }), // Should pass for all
      ];

      // Minors should get 2 items (1 and 4)
      const minorFiltered = engine.filterByAgeCohort(contents, '13-17');
      expect(minorFiltered).toHaveLength(2);
      expect(minorFiltered.map(c => c.id)).toEqual(['1', '4']);

      // Youth should get 3 items (1, 2, and 4)
      const youthFiltered = engine.filterByAgeCohort(contents, '18-24');
      expect(youthFiltered).toHaveLength(3);
      expect(youthFiltered.map(c => c.id)).toEqual(['1', '2', '4']);

      // Professionals should get all 4 items
      const professionalFiltered = engine.filterByAgeCohort(contents, '25-34');
      expect(professionalFiltered).toHaveLength(4);
    });

    it('should provide detailed statistics', () => {
      const contents = [
        createMockContent({ id: '1', metadata: {} }),
        createMockContent({ id: '2', metadata: { requiresAdultStatus: true } }),
        createMockContent({ id: '3', metadata: { requiresFinancialContribution: true } }),
      ];

      const result = engine.filterWithDetails(contents, '13-17');

      expect(result.totalProcessed).toBe(3);
      expect(result.filtered).toHaveLength(1);
      expect(result.excluded).toHaveLength(2);
      expect(result.filterStats.cohort).toBe('13-17');
      expect(result.filterStats.includedItems).toBe(1);
      expect(result.filterStats.excludedItems).toBe(2);
    });

    it('should track filter breakdown statistics', () => {
      const contents = [
        createMockContent({ id: '1', metadata: { requiresAdultStatus: true } }),
        createMockContent({ id: '2', metadata: { requiresAdultStatus: true } }),
        createMockContent({ id: '3', metadata: { requiresFinancialContribution: true } }),
      ];

      const result = engine.filterWithDetails(contents, '13-17');

      expect(result.filterStats.filterBreakdown['requires_adult_status']).toBe(2);
      expect(result.filterStats.filterBreakdown['requires_financial_contribution']).toBe(1);
    });
  });

  // ============================================================================
  // Utility Methods Tests
  // ============================================================================

  describe('Utility Methods', () => {
    it('should get filter statistics', () => {
      const contents = [
        createMockContent({ id: '1', metadata: {} }),
        createMockContent({ id: '2', metadata: { requiresAdultStatus: true } }),
      ];

      const stats = engine.getFilterStatistics(contents, '13-17');

      expect(stats.totalItems).toBe(2);
      expect(stats.filteredItems).toBe(1);
      expect(stats.excludedItems).toBe(1);
      expect(stats.exclusionReasons['requires_adult_status']).toBe(1);
    });

    it('should validate content metadata', () => {
      const validContent = createMockContent({
        metadata: {
          requiresAdultStatus: true,
        },
        ageTargeting: [{ minAge: 18, maxAge: 120 }],
      });

      const validation1 = engine.validateContentMetadata(validContent);
      expect(validation1.valid).toBe(true);
      expect(validation1.warnings).toHaveLength(0);
    });

    it('should detect conflicting metadata', () => {
      const invalidContent = createMockContent({
        metadata: {
          requiresAdultStatus: true,
        },
        ageTargeting: [{ minAge: 13, maxAge: 17 }],
      });

      const validation = engine.validateContentMetadata(invalidContent);
      expect(validation.valid).toBe(false);
      expect(validation.warnings).toContain('Content requires adult status but targets minors');
    });

    it('should detect missing financial details', () => {
      const incompleteContent = createMockContent({
        metadata: {
          requiresFinancialContribution: true,
        },
      });

      const validation = engine.validateContentMetadata(incompleteContent);
      expect(validation.valid).toBe(false);
      expect(validation.warnings).toContain('Content requires financial contribution but lacks details');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty content array', () => {
      const filtered = engine.filterByAgeCohort([], '18-24');
      expect(filtered).toHaveLength(0);
    });

    it('should handle content with undefined metadata', () => {
      const content = createMockContent({
        metadata: undefined as any,
      });

      // Should not throw and should include content
      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should handle content with null financial requirement amount', () => {
      const content = createMockContent({
        metadata: {
          financialRequirement: {
            amount: undefined,
            currency: 'KES',
            type: 'donation',
          },
        },
      });

      const filtered = engine.filterByAgeCohort([content], '18-24');
      expect(filtered).toHaveLength(1);
    });

    it('should handle boundary age values in targeting', () => {
      const content = createMockContent({
        ageTargeting: [{ minAge: 17, maxAge: 18 }],
      });

      // Should match 13-17 (includes 17)
      const filtered1 = engine.filterByAgeCohort([content], '13-17');
      expect(filtered1).toHaveLength(1);

      // Should match 18-24 (includes 18)
      const filtered2 = engine.filterByAgeCohort([content], '18-24');
      expect(filtered2).toHaveLength(1);
    });
  });
});
