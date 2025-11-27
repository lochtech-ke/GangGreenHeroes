/**
 * Mobile Optimization Usage Examples
 * Demonstrates how to use mobile optimization utilities in real-world scenarios
 * 
 * Note: These examples use simplified badge configs for demonstration.
 * In production, use complete BadgeConfig objects with all required fields.
 */

import {
  preloadCriticalBadges,
  preloadBadgesWithPriority,
  tierPriority,
  isMobileDevice,
  getOptimalBadgeSize,
  warmupBadgeCache,
  batchPreloadBadges,
  prefetchBadges,
} from './mobileOptimization';
import { BadgeConfig } from '../types/badge.types';

// Helper to create simplified badge configs for examples
function createExampleBadge(
  id: string,
  achievement: BadgeConfig['achievement'],
  tier: BadgeConfig['tier'],
  earnedDate?: Date
): BadgeConfig {
  return {
    id,
    achievement,
    tier,
    forest: 'kakamega',
    metadata: {
      badgeName: `${achievement} ${tier}`,
      tierLevel: 1,
      forestName: 'Kakamega Forest',
      achievementType: achievement,
      achievementCount: 1,
      earnedDate: earnedDate?.toISOString() || new Date().toISOString(),
      uniqueBadgeId: id,
      userId: 'example-user',
    },
  };
}

/**
 * Example 1: Basic Badge Preloading
 * Preload user's most recent badges on profile page load
 */
export async function exampleBasicPreloading() {
  // Simulate fetching user badges
  const userBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'gold'),
    createExampleBadge('2', 'carbon_warrior', 'silver'),
    createExampleBadge('3', 'water_guardian', 'bronze'),
    createExampleBadge('4', 'climate_hero', 'platinum'),
    createExampleBadge('5', 'forest_protector', 'diamond'),
  ];

  // Preload first 3 badges for instant display
  await preloadCriticalBadges(userBadges, 3);

  console.log('First 3 badges preloaded and cached');
}

/**
 * Example 2: Priority-Based Preloading
 * Preload highest tier badges first for premium users
 */
export async function examplePriorityPreloading() {
  const userBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'bronze'),
    createExampleBadge('2', 'carbon_warrior', 'hero'),
    createExampleBadge('3', 'water_guardian', 'silver'),
    createExampleBadge('4', 'climate_hero', 'diamond'),
  ];

  // Preload highest tier badges first
  await preloadBadgesWithPriority(userBadges, tierPriority, 2);

  console.log('Highest tier badges (hero, diamond) preloaded first');
}

/**
 * Example 3: Custom Priority Function
 * Preload most recently earned badges first
 */
export async function exampleCustomPriority() {
  const userBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'bronze', new Date('2024-01-01')),
    createExampleBadge('2', 'carbon_warrior', 'silver', new Date('2024-03-15')),
    createExampleBadge('3', 'water_guardian', 'gold', new Date('2024-02-20')),
  ];

  // Custom priority: most recent first
  const recentFirstPriority = (badge: BadgeConfig) => {
    return new Date(badge.metadata.earnedDate).getTime();
  };

  await preloadBadgesWithPriority(userBadges, recentFirstPriority, 2);

  console.log('Most recently earned badges preloaded first');
}

/**
 * Example 4: Responsive Badge Sizing
 * Adjust badge size based on device type
 */
export function exampleResponsiveSizing() {
  const isMobile = isMobileDevice();
  const badgeSize = getOptimalBadgeSize(400);

  console.log(`Device: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`Optimal badge size: ${badgeSize}px`);

  // Use in rendering
  // const svg = await renderBadge(config, { size: badgeSize });
}

/**
 * Example 5: Cache Warmup on App Start
 * Preload common badges when app initializes
 */
export async function exampleCacheWarmup() {
  // Define commonly accessed badges
  const commonBadges: BadgeConfig[] = [
    createExampleBadge('welcome', 'welcome_badge', 'hummingbird'),
    createExampleBadge('tree1', 'tree_planter', 'bronze'),
    createExampleBadge('tree2', 'tree_planter', 'silver'),
    createExampleBadge('tree3', 'tree_planter', 'gold'),
  ];

  // Warm up cache in background
  await warmupBadgeCache(commonBadges);

  console.log('Common badges cached for faster access');
}

/**
 * Example 6: Batch Preloading for Large Collections
 * Preload many badges without overwhelming the system
 */
export async function exampleBatchPreloading() {
  // Simulate large badge collection
  const largeBadgeCollection: BadgeConfig[] = Array.from({ length: 20 }, (_, i) =>
    createExampleBadge(
      `badge-${i}`,
      'tree_planter',
      i % 2 === 0 ? 'bronze' : 'silver'
    )
  );

  // Preload in batches of 5 with 100ms delay between batches
  await batchPreloadBadges(largeBadgeCollection, 5, 100);

  console.log('20 badges preloaded in 4 batches');
}

/**
 * Example 7: Prefetch Before Navigation
 * Preload badges before user navigates to badge showcase
 */
export function examplePrefetchBeforeNavigation() {
  const showcaseBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'gold'),
    createExampleBadge('2', 'carbon_warrior', 'platinum'),
    createExampleBadge('3', 'water_guardian', 'diamond'),
  ];

  // User hovers over "View Badges" button
  // Start prefetching with 200ms delay
  prefetchBadges(showcaseBadges, 200);

  console.log('Badges will be prefetched in 200ms');
}

/**
 * Example 8: Complete Profile Page Load Strategy
 * Combines multiple optimization techniques
 */
export async function exampleCompleteLoadStrategy() {
  // 1. Detect device type
  const isMobile = isMobileDevice();
  const badgeSize = getOptimalBadgeSize();

  console.log(`Loading for ${isMobile ? 'mobile' : 'desktop'} device`);
  console.log(`Using ${badgeSize}px badge size`);

  // 2. Fetch user badges
  const userBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'hero'),
    createExampleBadge('2', 'carbon_warrior', 'diamond'),
    createExampleBadge('3', 'water_guardian', 'platinum'),
    createExampleBadge('4', 'climate_hero', 'gold'),
    createExampleBadge('5', 'forest_protector', 'silver'),
    createExampleBadge('6', 'green_ambassador', 'bronze'),
  ];

  // 3. Preload critical badges with priority
  await preloadBadgesWithPriority(userBadges, tierPriority, 3);

  console.log('Top 3 badges by tier preloaded');

  // 4. Batch preload remaining badges in background
  const remainingBadges = userBadges.slice(3);
  batchPreloadBadges(remainingBadges, 2, 150).catch((error) => {
    console.error('Background preload failed:', error);
  });

  console.log('Remaining badges preloading in background');

  // 5. Warm up cache with common badges
  const commonBadges: BadgeConfig[] = [
    createExampleBadge('welcome', 'welcome_badge', 'hummingbird'),
  ];
  warmupBadgeCache(commonBadges);

  console.log('Complete load strategy executed');
}

/**
 * Example 9: Mobile-Specific Optimization
 * Apply aggressive optimization for mobile devices
 */
export async function exampleMobileOptimization() {
  if (!isMobileDevice()) {
    console.log('Not a mobile device, using standard loading');
    return;
  }

  console.log('Mobile device detected, applying optimizations');

  const userBadges: BadgeConfig[] = [
    createExampleBadge('1', 'tree_planter', 'gold'),
    createExampleBadge('2', 'carbon_warrior', 'silver'),
    createExampleBadge('3', 'water_guardian', 'bronze'),
  ];

  // Use smaller preload count for mobile
  await preloadCriticalBadges(userBadges, 2);

  // Use mobile-optimized size
  const mobileSize = getOptimalBadgeSize(400); // Returns 260px

  console.log(`Mobile optimizations applied: ${mobileSize}px badges, 2 preloaded`);
}

/**
 * Example 10: React Component Integration
 * How to use these utilities in a React component
 */
export function exampleReactIntegration() {
  // This would be in a React component
  const componentExample = `
    import { useEffect } from 'react';
    import { useLazyBadges } from '@/hooks/useLazyBadges';
    import { preloadCriticalBadges } from '@/utils/mobileOptimization';
    
    function BadgeCollection({ badges }) {
      const { isVisible, registerBadge } = useLazyBadges(
        badges.map(b => b.id),
        { rootMargin: '50px', threshold: 0.1 }
      );
      
      useEffect(() => {
        // Preload first 3 badges on mount
        preloadCriticalBadges(badges, 3);
      }, [badges]);
      
      return (
        <div className="badge-grid">
          {badges.map(badge => (
            <div
              key={badge.id}
              ref={(el) => registerBadge(badge.id, el)}
              data-badge-id={badge.id}
            >
              {isVisible(badge.id) ? (
                <Badge config={badge} />
              ) : (
                <BadgePlaceholder />
              )}
            </div>
          ))}
        </div>
      );
    }
  `;

  console.log('React integration example:', componentExample);
}

// Export all examples for easy testing
export const examples = {
  basicPreloading: exampleBasicPreloading,
  priorityPreloading: examplePriorityPreloading,
  customPriority: exampleCustomPriority,
  responsiveSizing: exampleResponsiveSizing,
  cacheWarmup: exampleCacheWarmup,
  batchPreloading: exampleBatchPreloading,
  prefetchBeforeNavigation: examplePrefetchBeforeNavigation,
  completeLoadStrategy: exampleCompleteLoadStrategy,
  mobileOptimization: exampleMobileOptimization,
  reactIntegration: exampleReactIntegration,
};
