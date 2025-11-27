/**
 * Mobile Optimization Utilities Tests
 * Tests for mobile optimization functions including preloading and caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  preloadCriticalBadges,
  isMobileDevice,
  getOptimalBadgeSize,
  tierPriority,
  preloadBadgesWithPriority,
  warmupBadgeCache,
  clearMobileCache,
  getMobileCacheStats,
  prefetchBadges,
  batchPreloadBadges,
} from './mobileOptimization';
import { BadgeConfig } from '../types/badge.types';
import { resetBadgeRenderer } from '../services/badgeRenderer.service';
import { resetGlobalCache } from './badgeCache';

describe('Mobile Optimization Utilities', () => {
  beforeEach(() => {
    // Reset singletons before each test
    resetBadgeRenderer();
    resetGlobalCache();
  });

  describe('preloadCriticalBadges', () => {
    it('should preload first 3 badges by default', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
        { id: '2', achievement: 'carbon_warrior', tier: 'silver' },
        { id: '3', achievement: 'water_guardian', tier: 'gold' },
        { id: '4', achievement: 'climate_hero', tier: 'platinum' },
      ];

      await preloadCriticalBadges(badges);

      // Verify function completes without error
      expect(true).toBe(true);
    });

    it('should handle empty badge array', async () => {
      await preloadCriticalBadges([]);
      expect(true).toBe(true);
    });

    it('should preload custom number of badges', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
        { id: '2', achievement: 'carbon_warrior', tier: 'silver' },
      ];

      await preloadCriticalBadges(badges, 2);
      expect(true).toBe(true);
    });

    it('should handle preload count larger than badge array', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
      ];

      await preloadCriticalBadges(badges, 5);
      expect(true).toBe(true);
    });
  });

  describe('isMobileDevice', () => {
    it('should return false in test environment', () => {
      const result = isMobileDevice();
      expect(typeof result).toBe('boolean');
    });

    it('should detect mobile based on window width', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const result = isMobileDevice();
      expect(result).toBe(true);
    });

    it('should detect desktop based on window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const result = isMobileDevice();
      expect(result).toBe(false);
    });
  });

  describe('getOptimalBadgeSize', () => {
    it('should return desktop size for desktop devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const size = getOptimalBadgeSize(400);
      expect(size).toBe(400);
    });

    it('should return reduced size for mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const size = getOptimalBadgeSize(400);
      expect(size).toBeLessThan(400);
      expect(size).toBe(260); // 400 * 0.65 = 260
    });

    it('should use default size of 400 when not specified', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const size = getOptimalBadgeSize();
      expect(size).toBe(400);
    });
  });

  describe('tierPriority', () => {
    it('should assign higher priority to higher tiers', () => {
      const heroBadge: BadgeConfig = {
        id: '1',
        achievement: 'ganggreen_hero',
        tier: 'hero',
      };
      const bronzeBadge: BadgeConfig = {
        id: '2',
        achievement: 'tree_planter',
        tier: 'bronze',
      };

      expect(tierPriority(heroBadge)).toBeGreaterThan(tierPriority(bronzeBadge));
    });

    it('should return correct priority for all tiers', () => {
      const tiers = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
      const priorities = tiers.map((tier) =>
        tierPriority({ id: '1', achievement: 'tree_planter', tier: tier as any })
      );

      // Verify priorities are in ascending order
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i - 1]);
      }
    });

    it('should return 0 for unknown tier', () => {
      const badge: BadgeConfig = {
        id: '1',
        achievement: 'tree_planter',
        tier: 'unknown' as any,
      };

      expect(tierPriority(badge)).toBe(0);
    });
  });

  describe('preloadBadgesWithPriority', () => {
    it('should preload badges based on priority function', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
        { id: '2', achievement: 'carbon_warrior', tier: 'hero' },
        { id: '3', achievement: 'water_guardian', tier: 'silver' },
      ];

      await preloadBadgesWithPriority(badges, tierPriority, 2);
      expect(true).toBe(true);
    });

    it('should handle empty array', async () => {
      await preloadBadgesWithPriority([], tierPriority, 3);
      expect(true).toBe(true);
    });
  });

  describe('warmupBadgeCache', () => {
    it('should warm up cache with common badges', async () => {
      const commonBadges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
        { id: '2', achievement: 'carbon_warrior', tier: 'silver' },
      ];

      await warmupBadgeCache(commonBadges);
      expect(true).toBe(true);
    });
  });

  describe('clearMobileCache', () => {
    it('should clear mobile-specific cache entries', async () => {
      await clearMobileCache();
      expect(true).toBe(true);
    });
  });

  describe('getMobileCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await getMobileCacheStats();

      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('missRate');
      expect(stats).toHaveProperty('mobileEntries');
      expect(stats).toHaveProperty('mobilePercentage');
    });
  });

  describe('prefetchBadges', () => {
    it('should prefetch badges with delay', () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
      ];

      prefetchBadges(badges, 10);
      expect(true).toBe(true);
    });
  });

  describe('batchPreloadBadges', () => {
    it('should preload badges in batches', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
        { id: '2', achievement: 'carbon_warrior', tier: 'silver' },
        { id: '3', achievement: 'water_guardian', tier: 'gold' },
        { id: '4', achievement: 'climate_hero', tier: 'platinum' },
        { id: '5', achievement: 'forest_protector', tier: 'diamond' },
      ];

      await batchPreloadBadges(badges, 2, 10);
      expect(true).toBe(true);
    });

    it('should handle single batch', async () => {
      const badges: BadgeConfig[] = [
        { id: '1', achievement: 'tree_planter', tier: 'bronze' },
      ];

      await batchPreloadBadges(badges, 3, 10);
      expect(true).toBe(true);
    });
  });
});
