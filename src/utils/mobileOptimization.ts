/**
 * Mobile Optimization Utilities
 * Provides utilities for optimizing badge rendering and loading on mobile devices
 * Includes preloading, lazy loading helpers, and performance optimization
 */

import { BadgeConfig } from '../types/badge.types';
import { getBadgeRenderer } from '../services/badgeRenderer.service';
import { getGlobalCache } from './badgeCache';

/**
 * Preload critical badges for optimal initial page load
 * Preloads the first N badges in a collection and caches them
 * 
 * @param badgeConfigs - Array of badge configurations to preload
 * @param preloadCount - Number of badges to preload (default: 3)
 * @returns Promise that resolves when preloading is complete
 * 
 * @example
 * ```typescript
 * const badges = await getUserBadges(userId);
 * await preloadCriticalBadges(badges, 3);
 * ```
 */
export async function preloadCriticalBadges(
  badgeConfigs: BadgeConfig[],
  preloadCount: number = 3
): Promise<void> {
  if (!badgeConfigs || badgeConfigs.length === 0) {
    return;
  }

  const renderer = getBadgeRenderer();
  const cache = getGlobalCache();

  // Get the first N badges to preload
  const criticalBadges = badgeConfigs.slice(0, preloadCount);

  // Preload badges in parallel
  const preloadPromises = criticalBadges.map(async (config) => {
    try {
      // Render badge with mobile optimization
      const svg = await renderer.renderBadge(config, {
        optimizeForMobile: true,
        size: 256, // Smaller size for mobile
      });

      // Verify it's cached
      const cacheKey = `${config.achievement}:${config.tier}:256:mobile`;
      const cached = await cache.has(cacheKey);

      if (!cached) {
        console.warn(`Badge ${config.achievement} was not cached after preload`);
      }

      return svg;
    } catch (error) {
      console.error(`Failed to preload badge ${config.achievement}:`, error);
      return null;
    }
  });

  // Wait for all preloads to complete
  await Promise.all(preloadPromises);
}

/**
 * Preload critical badges for a specific user
 * Fetches user's badges and preloads the most recent ones
 * 
 * @param userId - User ID to preload badges for
 * @param preloadCount - Number of badges to preload (default: 3)
 * @returns Promise that resolves when preloading is complete
 */
export async function preloadUserBadges(
  userId: string,
  preloadCount: number = 3
): Promise<void> {
  try {
    // This would typically fetch from the database
    // For now, we'll just provide the interface
    console.log(`Preloading ${preloadCount} badges for user ${userId}`);
    
    // In a real implementation:
    // const badges = await fetchUserBadges(userId);
    // await preloadCriticalBadges(badges, preloadCount);
  } catch (error) {
    console.error('Failed to preload user badges:', error);
  }
}

/**
 * Check if device is mobile based on screen width
 * Uses standard mobile breakpoint of 768px
 * 
 * @returns true if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 768;
}

/**
 * Get optimal badge size for current device
 * Returns smaller sizes for mobile devices
 * 
 * @param desktopSize - Desired size for desktop (default: 400)
 * @returns Optimal size for current device
 */
export function getOptimalBadgeSize(desktopSize: number = 400): number {
  if (isMobileDevice()) {
    // Use smaller size for mobile (typically 60-70% of desktop)
    return Math.floor(desktopSize * 0.65);
  }

  return desktopSize;
}

/**
 * Preload badges with priority
 * Preloads badges based on priority order (e.g., most recent, highest tier)
 * 
 * @param badgeConfigs - Array of badge configurations
 * @param priorityFn - Function to determine badge priority (higher = more important)
 * @param preloadCount - Number of badges to preload (default: 3)
 */
export async function preloadBadgesWithPriority(
  badgeConfigs: BadgeConfig[],
  priorityFn: (config: BadgeConfig) => number,
  preloadCount: number = 3
): Promise<void> {
  if (!badgeConfigs || badgeConfigs.length === 0) {
    return;
  }

  // Sort badges by priority
  const sortedBadges = [...badgeConfigs].sort((a, b) => {
    return priorityFn(b) - priorityFn(a);
  });

  // Preload top priority badges
  await preloadCriticalBadges(sortedBadges, preloadCount);
}

/**
 * Default priority function based on tier
 * Higher tiers get higher priority
 */
export function tierPriority(config: BadgeConfig): number {
  const tierOrder: Record<string, number> = {
    hero: 7,
    diamond: 6,
    platinum: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    hummingbird: 1,
  };

  return tierOrder[config.tier] || 0;
}

/**
 * Warm up badge cache with common badges
 * Preloads frequently accessed badges to improve performance
 * 
 * @param commonBadges - Array of commonly accessed badge configurations
 */
export async function warmupBadgeCache(
  commonBadges: BadgeConfig[]
): Promise<void> {
  const renderer = getBadgeRenderer();

  // Preload common badges in background
  const warmupPromises = commonBadges.map(async (config) => {
    try {
      await renderer.renderBadge(config, {
        optimizeForMobile: isMobileDevice(),
        size: getOptimalBadgeSize(),
      });
    } catch (error) {
      console.error(`Failed to warm up cache for ${config.achievement}:`, error);
    }
  });

  // Don't wait for warmup to complete
  Promise.all(warmupPromises).catch((error) => {
    console.error('Badge cache warmup failed:', error);
  });
}

/**
 * Clear mobile-specific cache entries
 * Useful when switching between mobile and desktop views
 */
export async function clearMobileCache(): Promise<void> {
  const cache = getGlobalCache();
  const keys = cache.getKeys();

  // Clear only mobile-optimized entries
  const mobileKeys = keys.filter((key) => key.includes(':mobile'));

  for (const key of mobileKeys) {
    await cache.clear(key);
  }
}

/**
 * Get cache statistics for mobile badges
 * Returns statistics specific to mobile-optimized badges
 */
export async function getMobileCacheStats() {
  const cache = getGlobalCache();
  const stats = await cache.getStats();
  const keys = cache.getKeys();

  const mobileKeys = keys.filter((key) => key.includes(':mobile'));
  const mobileEntries = mobileKeys.length;

  return {
    ...stats,
    mobileEntries,
    mobilePercentage: stats.totalEntries > 0 
      ? (mobileEntries / stats.totalEntries) * 100 
      : 0,
  };
}

/**
 * Prefetch badges for upcoming view
 * Useful for prefetching badges before navigating to a new page
 * 
 * @param badgeConfigs - Badges to prefetch
 * @param delay - Delay before starting prefetch (ms, default: 100)
 */
export function prefetchBadges(
  badgeConfigs: BadgeConfig[],
  delay: number = 100
): void {
  setTimeout(() => {
    preloadCriticalBadges(badgeConfigs).catch((error) => {
      console.error('Badge prefetch failed:', error);
    });
  }, delay);
}

/**
 * Batch preload badges with rate limiting
 * Prevents overwhelming the system with too many simultaneous requests
 * 
 * @param badgeConfigs - Badges to preload
 * @param batchSize - Number of badges to load at once (default: 3)
 * @param delayBetweenBatches - Delay between batches in ms (default: 100)
 */
export async function batchPreloadBadges(
  badgeConfigs: BadgeConfig[],
  batchSize: number = 3,
  delayBetweenBatches: number = 100
): Promise<void> {
  const batches: BadgeConfig[][] = [];

  // Split into batches
  for (let i = 0; i < badgeConfigs.length; i += batchSize) {
    batches.push(badgeConfigs.slice(i, i + batchSize));
  }

  // Process batches sequentially with delay
  for (const batch of batches) {
    await preloadCriticalBadges(batch, batch.length);

    // Wait before next batch (except for last batch)
    if (batch !== batches[batches.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }
}
