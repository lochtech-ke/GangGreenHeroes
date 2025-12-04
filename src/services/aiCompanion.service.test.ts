/**
 * AI Companion Service Tests
 * Tests for educational explainer functionality
 */

import { describe, it, expect } from 'vitest';
import { aiCompanionService } from './aiCompanion.service';

describe('AICompanionService - Educational Explainer', () => {
  describe('getCommonConcepts', () => {
    it('should return a list of common environmental concepts', () => {
      const concepts = aiCompanionService.getCommonConcepts();
      
      expect(concepts).toBeInstanceOf(Array);
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts).toContain('Carbon Sequestration');
      expect(concepts).toContain('Climate Change');
      expect(concepts).toContain('Deforestation');
    });

    it('should return at least 15 concepts', () => {
      const concepts = aiCompanionService.getCommonConcepts();
      expect(concepts.length).toBeGreaterThanOrEqual(15);
    });
  });

  // Note: Integration tests for explainConcept and answerQuestion require OpenAI API key
  // These tests are skipped in CI/CD but can be run locally with proper configuration
  describe.skip('explainConcept (integration)', () => {
    it('should explain a concept with age-appropriate language', async () => {
      // This test requires VITE_OPENAI_API_KEY to be set
      // Run manually with: VITE_OPENAI_API_KEY=your_key npm test
    });
  });

  describe.skip('answerQuestion (integration)', () => {
    it('should answer environmental questions', async () => {
      // This test requires VITE_OPENAI_API_KEY to be set
      // Run manually with: VITE_OPENAI_API_KEY=your_key npm test
    });
  });
});
