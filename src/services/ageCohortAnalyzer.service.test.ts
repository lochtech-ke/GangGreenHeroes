/**
 * Age Cohort Analyzer Service Tests
 * Unit tests for age cohort analysis and preference management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgeCohortAnalyzerService } from './ageCohortAnalyzer.service';
import { AgeCohort } from '../types/contentCuration.types';

describe('AgeCohortAnalyzerService', () => {
  let service: AgeCohortAnalyzerService;

  beforeEach(() => {
    service = new AgeCohortAnalyzerService();
  });

  describe('determineCohort', () => {
    it('should classify age 15 as 13-17 cohort', () => {
      const cohort = service.determineCohort(15);
      expect(cohort).toBe('13-17');
    });

    it('should classify age 20 as 18-24 cohort', () => {
      const cohort = service.determineCohort(20);
      expect(cohort).toBe('18-24');
    });

    it('should classify age 30 as 25-34 cohort', () => {
      const cohort = service.determineCohort(30);
      expect(cohort).toBe('25-34');
    });

    it('should classify age 40 as 35-49 cohort', () => {
      const cohort = service.determineCohort(40);
      expect(cohort).toBe('35-49');
    });

    it('should classify age 60 as 50+ cohort', () => {
      const cohort = service.determineCohort(60);
      expect(cohort).toBe('50+');
    });

    it('should classify age 100 as 50+ cohort', () => {
      const cohort = service.determineCohort(100);
      expect(cohort).toBe('50+');
    });

    it('should throw error for age below 13', () => {
      expect(() => service.determineCohort(12)).toThrow('Users must be at least 13 years old');
    });

    it('should throw error for age above 120', () => {
      expect(() => service.determineCohort(121)).toThrow('Invalid age value');
    });

    it('should throw error for negative age', () => {
      expect(() => service.determineCohort(-5)).toThrow('Invalid age value');
    });

    it('should throw error for zero age', () => {
      expect(() => service.determineCohort(0)).toThrow('Invalid age value');
    });
  });

  describe('getDefaultPreferences', () => {
    it('should return preferences for 13-17 cohort', () => {
      const prefs = service.getDefaultPreferences('13-17');
      
      expect(prefs.contentTypes).toBeDefined();
      expect(prefs.contentTypes.challenge).toBeGreaterThan(0.9); // High weight for challenges
      expect(prefs.contentTypes.social_post).toBeGreaterThan(0.8); // High weight for social
      expect(prefs.engagementPatterns).toBeDefined();
      expect(prefs.filterRules).toBeDefined();
      expect(prefs.lastCalculated).toBeInstanceOf(Date);
    });

    it('should return preferences for 25-34 cohort', () => {
      const prefs = service.getDefaultPreferences('25-34');
      
      expect(prefs.contentTypes).toBeDefined();
      expect(prefs.contentTypes.initiative).toBeGreaterThan(0.8); // High weight for initiatives
      expect(prefs.engagementPatterns).toBeDefined();
      expect(prefs.filterRules).toBeDefined();
    });

    it('should return preferences for 50+ cohort', () => {
      const prefs = service.getDefaultPreferences('50+');
      
      expect(prefs.contentTypes).toBeDefined();
      expect(prefs.contentTypes.petition).toBeGreaterThan(0.8); // High weight for petitions
      expect(prefs.contentTypes.educational).toBeGreaterThan(0.8); // High weight for education
      expect(prefs.engagementPatterns).toBeDefined();
      expect(prefs.filterRules).toBeDefined();
    });

    it('should have filter rules that exclude adult content for minors', () => {
      const prefs = service.getDefaultPreferences('13-17');
      
      const excludeAdultRule = prefs.filterRules.find(
        rule => rule.type === 'exclude' && rule.condition === 'requires_adult_status'
      );
      
      expect(excludeAdultRule).toBeDefined();
      expect(excludeAdultRule?.weight).toBe(1.0);
    });

    it('should have filter rules that exclude financial requirements for minors', () => {
      const prefs = service.getDefaultPreferences('13-17');
      
      const excludeFinancialRule = prefs.filterRules.find(
        rule => rule.type === 'exclude' && rule.condition === 'requires_financial_contribution'
      );
      
      expect(excludeFinancialRule).toBeDefined();
      expect(excludeFinancialRule?.weight).toBe(1.0);
    });

    it('should boost donation opportunities for 25-34 cohort', () => {
      const prefs = service.getDefaultPreferences('25-34');
      
      const donationBoost = prefs.filterRules.find(
        rule => rule.type === 'boost' && rule.condition === 'donation_enabled'
      );
      
      expect(donationBoost).toBeDefined();
      expect(donationBoost?.weight).toBeGreaterThan(0);
    });

    it('should boost legacy projects for 50+ cohort', () => {
      const prefs = service.getDefaultPreferences('50+');
      
      const legacyBoost = prefs.filterRules.find(
        rule => rule.type === 'boost' && rule.condition === 'legacy_project'
      );
      
      expect(legacyBoost).toBeDefined();
      expect(legacyBoost?.weight).toBeGreaterThan(0);
    });
  });

  describe('analyzeUser', () => {
    it('should return complete user cohort analysis', async () => {
      const result = await service.analyzeUser(25);
      
      expect(result.cohort).toBe('25-34');
      expect(result.age).toBe(25);
      expect(result.preferences).toBeDefined();
      expect(result.preferences.contentTypes).toBeDefined();
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle edge case at cohort boundary (age 17)', async () => {
      const result = await service.analyzeUser(17);
      
      expect(result.cohort).toBe('13-17');
      expect(result.age).toBe(17);
    });

    it('should handle edge case at cohort boundary (age 18)', async () => {
      const result = await service.analyzeUser(18);
      
      expect(result.cohort).toBe('18-24');
      expect(result.age).toBe(18);
    });
  });

  describe('updateCohortPreferences', () => {
    it('should increase weight for high-engagement content types', async () => {
      const cohort: AgeCohort = '25-34';
      const engagementData = [
        {
          contentType: 'initiative' as const,
          engagementRate: 0.8, // High engagement
          impressions: 1000,
          clicks: 800,
        },
      ];

      const initialPrefs = service.getDefaultPreferences(cohort);
      const initialWeight = initialPrefs.contentTypes.initiative;

      const updatedPrefs = await service.updateCohortPreferences(cohort, engagementData);

      // Weight should increase for high engagement
      expect(updatedPrefs.contentTypes.initiative).toBeGreaterThan(initialWeight);
    });

    it('should decrease weight for low-engagement content types', async () => {
      const cohort: AgeCohort = '25-34';
      const engagementData = [
        {
          contentType: 'social_post' as const,
          engagementRate: 0.2, // Low engagement
          impressions: 1000,
          clicks: 200,
        },
      ];

      const initialPrefs = service.getDefaultPreferences(cohort);
      const initialWeight = initialPrefs.contentTypes.social_post;

      const updatedPrefs = await service.updateCohortPreferences(cohort, engagementData);

      // Weight should decrease for low engagement
      expect(updatedPrefs.contentTypes.social_post).toBeLessThan(initialWeight);
    });

    it('should keep weights within valid range (0.1 to 1.0)', async () => {
      const cohort: AgeCohort = '18-24';
      const engagementData = [
        {
          contentType: 'challenge' as const,
          engagementRate: 1.0, // Maximum engagement
          impressions: 1000,
          clicks: 1000,
        },
      ];

      const updatedPrefs = await service.updateCohortPreferences(cohort, engagementData);

      // Weight should not exceed 1.0
      expect(updatedPrefs.contentTypes.challenge).toBeLessThanOrEqual(1.0);
      expect(updatedPrefs.contentTypes.challenge).toBeGreaterThanOrEqual(0.1);
    });

    it('should update lastCalculated timestamp', async () => {
      const cohort: AgeCohort = '35-49';
      const engagementData = [
        {
          contentType: 'mission' as const,
          engagementRate: 0.6,
          impressions: 500,
          clicks: 300,
        },
      ];

      const beforeTime = new Date();
      const updatedPrefs = await service.updateCohortPreferences(cohort, engagementData);
      const afterTime = new Date();

      expect(updatedPrefs.lastCalculated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedPrefs.lastCalculated.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
