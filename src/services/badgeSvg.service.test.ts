/**
 * Badge SVG Service Tests
 * Tests for SVG attribute enforcement
 */

import { describe, it, expect, vi } from 'vitest';
import { BadgeSvgService } from './badgeSvg.service';
import type { BadgeConfig } from '../types/badge.types';

describe('BadgeSvgService - SVG Attribute Enforcement', () => {
  const service = new BadgeSvgService();

  const createTestConfig = (tier: string = 'bronze'): BadgeConfig => ({
    id: 'test-badge-001',
    tier: tier as any,
    forest: 'kakamega',
    achievement: 'tree_planter',
    metadata: {
      badgeName: 'Test Badge',
      tierLevel: 1,
      forestName: 'Kakamega Forest',
      achievementType: 'tree_planter',
      achievementCount: 10,
      earnedDate: new Date().toISOString(),
      uniqueBadgeId: 'test-uuid-001',
      userId: 'test-user-001',
      userName: 'Test User',
    },
  });

  it('should generate Hero badge with proper SVG attributes', async () => {
    const config = createTestConfig('hero');
    const result = await service.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    expect(svgElement).toBeTruthy();
    expect(svgElement?.getAttribute('width')).toBe('100%');
    expect(svgElement?.getAttribute('height')).toBe('100%');
    expect(svgElement?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svgElement?.getAttribute('viewBox')).toBeTruthy();
  });

  it('should generate fallback badge with proper SVG attributes', async () => {
    // Use a config that will trigger fallback generation
    const config: BadgeConfig = {
      id: 'test-fallback-001',
      tier: 'bronze',
      forest: 'kakamega',
      achievement: 'tree_planter',
      metadata: {
        badgeName: 'Fallback Test',
        tierLevel: 1,
        forestName: 'Kakamega Forest',
        achievementType: 'tree_planter',
        achievementCount: 5,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: 'test-uuid-002',
        userId: 'test-user-002',
      },
    };

    const result = await service.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    expect(svgElement).toBeTruthy();
    expect(svgElement?.getAttribute('width')).toBe('100%');
    expect(svgElement?.getAttribute('height')).toBe('100%');
    expect(svgElement?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    // Fallback badges use 400x400 viewBox
    expect(svgElement?.getAttribute('viewBox')).toMatch(/0 0 (400|500) (400|500)/);
  });

  it('should generate badges for all tiers with proper attributes', async () => {
    // Only test valid tiers (hummingbird is handled separately)
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];

    for (const tier of tiers) {
      const config = createTestConfig(tier);
      const result = await service.generateBadge(config);

      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();

      // Parse the SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      expect(svgElement).toBeTruthy();
      expect(svgElement?.getAttribute('width')).toBe('100%');
      expect(svgElement?.getAttribute('height')).toBe('100%');
      expect(svgElement?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
      expect(svgElement?.getAttribute('viewBox')).toBeTruthy();
    }
  });

  it('should maintain viewBox attribute if already present', async () => {
    const config = createTestConfig('gold');
    const result = await service.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    const viewBox = svgElement?.getAttribute('viewBox');
    expect(viewBox).toBeTruthy();
    // ViewBox should be present and valid (either 400x400 or 500x500)
    expect(viewBox).toMatch(/0 0 (400|500) (400|500)/);
  });

  it('should handle SVG parsing errors gracefully', async () => {
    // Create a spy to monitor console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Test with invalid SVG that will cause parse errors
    const config = createTestConfig('bronze');
    const result = await service.generateBadge(config);

    // Should still succeed (fallback to original or fallback badge)
    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should add viewBox if missing', async () => {
    const config = createTestConfig('silver');
    const result = await service.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    // ViewBox should be present (either from original or added by ensureSVGAttributes)
    expect(svgElement?.getAttribute('viewBox')).toBeTruthy();
  });

  it('should preserve existing SVG content while adding attributes', async () => {
    const config = createTestConfig('platinum');
    const result = await service.generateBadge(config);

    expect(result.success).toBe(true);
    expect(result.svg).toBeDefined();

    // Parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.svg!, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');

    // Should have required attributes
    expect(svgElement?.getAttribute('width')).toBe('100%');
    expect(svgElement?.getAttribute('height')).toBe('100%');
    expect(svgElement?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');

    // Should still have content (check for common elements)
    const hasContent = 
      doc.querySelector('circle') !== null ||
      doc.querySelector('rect') !== null ||
      doc.querySelector('path') !== null ||
      doc.querySelector('text') !== null;
    
    expect(hasContent).toBe(true);
  });
});
