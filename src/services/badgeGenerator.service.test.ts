/**
 * Badge Generator Service Tests
 * Tests for the BadgeGeneratorService class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BadgeGeneratorService } from './badgeGenerator.service';
import type { BadgeConfig } from '../types/badge.types';

describe('BadgeGeneratorService', () => {
  let service: BadgeGeneratorService;

  beforeEach(() => {
    service = new BadgeGeneratorService();
  });

  describe('validateConfig', () => {
    it('should validate a complete badge configuration', () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: 'test-user-1',
        },
      };

      const result = service.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without required fields', () => {
      const config = {
        id: 'test-badge-1',
      } as BadgeConfig;

      const result = service.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid tier', () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'invalid-tier' as any,
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: 'test-user-1',
        },
      };

      const result = service.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid tier'))).toBe(true);
    });

    it('should reject invalid forest', () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'bronze',
        forest: 'invalid-forest' as any,
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: 'test-user-1',
        },
      };

      const result = service.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid forest'))).toBe(true);
    });

    it('should reject invalid achievement type', () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'invalid-achievement' as any,
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: 'test-user-1',
        },
      };

      const result = service.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid achievement'))).toBe(true);
    });

    it('should require metadata fields', () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: '', // Empty userId
        },
      };

      const result = service.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('userId'))).toBe(true);
    });
  });

  describe('generateBadge', () => {
    it('should generate a badge with valid configuration', async () => {
      const config: BadgeConfig = {
        id: 'test-badge-1',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-1',
          userId: 'test-user-1',
        },
      };

      const result = await service.generateBadge(config);
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      expect(result.svg).toContain('<svg');
      expect(result.metadata).toEqual(config.metadata);
    });

    it('should reject invalid configuration', async () => {
      const config = {
        id: 'test-badge-1',
      } as BadgeConfig;

      const result = await service.generateBadge(config);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getPreview', () => {
    it('should generate preview for tree_planter bronze badge', async () => {
      const svg = await service.getPreview('tree_planter', 'bronze');
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });

    it('should generate preview for carbon_warrior gold badge', async () => {
      const svg = await service.getPreview('carbon_warrior', 'gold');
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });

    it('should generate preview for hero badge', async () => {
      const svg = await service.getPreview('ganggreen_hero', 'hero');
      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
    });
  });
});
