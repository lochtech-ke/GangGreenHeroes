/**
 * Test for SVG Defs Malformation Fix
 * Verifies that badge SVG generation creates well-formed XML with proper defs structure
 */

import { describe, it, expect } from 'vitest';
import { badgeSvgService } from './badgeSvg.service';
import { BadgeConfig } from '../types/badge.types';

describe('Badge SVG Defs Fix', () => {
  it('should generate well-formed SVG without nested defs tags', async () => {
    const config: BadgeConfig = {
      id: 'test-badge-1',
      tier: 'bronze',
      forest: 'kakamega',
      achievement: 'tree_planter',
      metadata: {
        badgeName: 'Test Badge',
        tierLevel: 1,
        forestName: 'Kakamega Forest',
        achievementType: 'tree_planter',
        achievementCount: 10,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: 'test-badge-1',
        userId: 'test-user-1',
        userName: 'Test User',
      },
    };

    const result = await badgeSvgService.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    if (result.svg) {
      // Check for nested defs tags (should not exist)
      const nestedDefsPattern = /<defs[^>]*>[\s\S]*<defs/;
      expect(result.svg).not.toMatch(nestedDefsPattern);

      // Check that defs section is well-formed
      const defsMatch = result.svg.match(/<defs>([\s\S]*?)<\/defs>/);
      expect(defsMatch).toBeTruthy();

      // Verify SVG can be parsed without errors
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.svg, 'image/svg+xml');
      const parseError = doc.querySelector('parsererror');
      expect(parseError).toBeNull();

      // Verify there's exactly one defs element
      const defsElements = doc.querySelectorAll('defs');
      expect(defsElements.length).toBe(1);
    }
  });

  it('should generate valid SVG for all badge tiers', async () => {
    const tiers = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

    for (const tier of tiers) {
      const config: BadgeConfig = {
        id: `test-${tier}`,
        tier,
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: `${tier} Badge`,
          tierLevel: 1,
          forestName: 'Kakamega Forest',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: `test-${tier}`,
          userId: 'test-user-1',
        },
      };

      const result = await badgeSvgService.generateBadge(config);

      expect(result.success).toBe(true);
      
      if (result.svg) {
        // Verify no nested defs
        const nestedDefsPattern = /<defs[^>]*>[\s\S]*<defs/;
        expect(result.svg).not.toMatch(nestedDefsPattern);

        // Verify parseable
        const parser = new DOMParser();
        const doc = parser.parseFromString(result.svg, 'image/svg+xml');
        const parseError = doc.querySelector('parsererror');
        expect(parseError).toBeNull();
      }
    }
  });

  it('should generate valid hero badge SVG', async () => {
    const config: BadgeConfig = {
      id: 'test-hero',
      tier: 'hero',
      forest: 'kakamega',
      achievement: 'ganggreen_hero',
      metadata: {
        badgeName: 'GangGreen Hero',
        tierLevel: 7,
        forestName: 'Kakamega Forest',
        achievementType: 'ganggreen_hero',
        achievementCount: 1,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: 'test-hero',
        userId: 'test-user-hero',
        userName: 'Hero User',
      },
    };

    const result = await badgeSvgService.generateBadge(config);

    expect(result.success).toBe(true);
    
    if (result.svg) {
      // Verify no nested defs
      const nestedDefsPattern = /<defs[^>]*>[\s\S]*<defs/;
      expect(result.svg).not.toMatch(nestedDefsPattern);

      // Verify parseable
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.svg, 'image/svg+xml');
      const parseError = doc.querySelector('parsererror');
      expect(parseError).toBeNull();

      // Verify exactly one defs element
      const defsElements = doc.querySelectorAll('defs');
      expect(defsElements.length).toBe(1);
    }
  });

  it('should have matching opening and closing defs tags', async () => {
    const config: BadgeConfig = {
      id: 'test-tags',
      tier: 'silver',
      forest: 'karura',
      achievement: 'forest_protector',
      metadata: {
        badgeName: 'Test Badge',
        tierLevel: 2,
        forestName: 'Karura Forest',
        achievementType: 'forest_protector',
        achievementCount: 5,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: 'test-tags',
        userId: 'test-user-2',
      },
    };

    const result = await badgeSvgService.generateBadge(config);

    expect(result.success).toBe(true);
    
    if (result.svg) {
      // Count opening and closing defs tags
      const openingTags = (result.svg.match(/<defs[^>]*>/g) || []).length;
      const closingTags = (result.svg.match(/<\/defs>/g) || []).length;

      expect(openingTags).toBe(1);
      expect(closingTags).toBe(1);
      expect(openingTags).toBe(closingTags);
    }
  });

  it('should include gradients and filters in defs', async () => {
    const config: BadgeConfig = {
      id: 'test-content',
      tier: 'gold',
      forest: 'mau',
      achievement: 'climate_hero',
      metadata: {
        badgeName: 'Test Badge',
        tierLevel: 3,
        forestName: 'Mau Forest',
        achievementType: 'climate_hero',
        achievementCount: 15,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: 'test-content',
        userId: 'test-user-3',
      },
    };

    const result = await badgeSvgService.generateBadge(config);

    expect(result.success).toBe(true);
    
    if (result.svg) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.svg, 'image/svg+xml');
      
      // Verify defs contains gradients
      const gradients = doc.querySelectorAll('defs linearGradient, defs radialGradient');
      expect(gradients.length).toBeGreaterThan(0);

      // Verify defs contains filters
      const filters = doc.querySelectorAll('defs filter');
      expect(filters.length).toBeGreaterThan(0);
    }
  });
});
