/**
 * Badge Mapping Utility
 * 
 * Maps Badge objects from the progression system to BadgeConfig objects
 * for the geometric badge rendering system.
 */

import { Badge, BadgeTier as ProgressionBadgeTier } from '../types/badgeProgression.types';
import { BadgeConfig, AchievementType, BadgeTier as GeometricBadgeTier } from '../types/badge.types';

/**
 * Maps a Badge from the progression system to a BadgeConfig for geometric rendering
 * 
 * Handles missing or invalid badge data gracefully by providing sensible defaults
 * and logging warnings for debugging purposes.
 * 
 * @param badge - The badge from the progression system
 * @param userId - Optional user ID for metadata
 * @param userName - Optional user name for metadata
 * @returns BadgeConfig object ready for geometric badge rendering
 * 
 * @example
 * ```typescript
 * const badge: Badge = {
 *   id: '123',
 *   name: 'Community Contributor',
 *   tier: BadgeTier.COMMUNITY_CONTRIBUTOR,
 *   tier_order: 2,
 *   description: 'Active community member',
 *   requirements: [],
 *   icon_url: '',
 *   created_at: '2025-01-01',
 *   updated_at: '2025-01-01'
 * };
 * 
 * const config = mapBadgeToBadgeConfig(badge, 'user-123', 'John Doe');
 * ```
 */
export function mapBadgeToBadgeConfig(
  badge: Badge,
  userId?: string,
  userName?: string
): BadgeConfig {
  // Validate badge object
  if (!badge) {
    console.error('Badge mapping error: Badge object is null or undefined');
    throw new Error('Cannot map null or undefined badge');
  }

  // Validate required badge properties
  if (!badge.id) {
    console.warn('Badge mapping warning: Badge ID is missing, using fallback ID');
  }

  if (!badge.name) {
    console.warn(`Badge mapping warning: Badge name is missing for badge ID: ${badge.id || 'unknown'}`);
  }

  if (badge.tier === undefined || badge.tier === null) {
    console.warn(`Badge mapping warning: Badge tier is missing for badge ${badge.id || 'unknown'}, defaulting to bronze`);
  }

  // Map tier with error handling
  const geometricTier = mapTierToBadgeTier(badge.tier);
  
  // Determine achievement type with error handling
  const achievement = determineAchievementType(badge);
  
  // Safely access requirements array
  const requirementsCount = Array.isArray(badge.requirements) ? badge.requirements.length : 0;
  if (!Array.isArray(badge.requirements)) {
    console.warn(`Badge mapping warning: Requirements is not an array for badge ${badge.id || 'unknown'}`);
  }

  // Safely access dates
  const earnedDate = badge.created_at || new Date().toISOString();
  if (!badge.created_at) {
    console.warn(`Badge mapping warning: Created date is missing for badge ${badge.id || 'unknown'}, using current date`);
  }

  return {
    id: badge.id || `badge-${Date.now()}`,
    tier: geometricTier,
    forest: 'kakamega', // Default forest, can be customized based on user location
    achievement,
    metadata: {
      badgeName: badge.name || 'Unknown Badge',
      tierLevel: badge.tier_order ?? 1,
      forestName: 'Kakamega Forest',
      achievementType: achievement,
      achievementCount: requirementsCount,
      earnedDate: earnedDate,
      uniqueBadgeId: badge.id || `badge-${Date.now()}`,
      userId: userId || '',
      userName: userName,
      // Add welcome message for hummingbird badges
      ...(badge.tier === ProgressionBadgeTier.HUMMINGBIRD && {
        welcomeMessage: 'Welcome to #GangGreen!',
        registrationDate: earnedDate,
        platformVersion: '1.0.0'
      })
    }
  };
}

/**
 * Determines the achievement type based on the badge tier and name
 * 
 * Maps progression badge tiers to appropriate achievement types for
 * the geometric badge system. Handles invalid or missing tier data
 * by defaulting to 'community_leader'.
 * 
 * @param badge - The badge from the progression system
 * @returns The achievement type for geometric rendering
 * 
 * @example
 * ```typescript
 * const badge: Badge = {
 *   tier: BadgeTier.HUMMINGBIRD,
 *   name: 'Welcome Badge',
 *   // ... other properties
 * };
 * 
 * const achievement = determineAchievementType(badge);
 * // Returns: 'welcome_badge'
 * ```
 */
export function determineAchievementType(badge: Badge): AchievementType {
  // Handle missing or invalid badge
  if (!badge) {
    console.warn('Achievement type determination warning: Badge is null or undefined, defaulting to community_leader');
    return 'community_leader';
  }

  // Handle missing tier
  if (badge.tier === undefined || badge.tier === null) {
    console.warn(`Achievement type determination warning: Badge tier is missing for badge ${badge.id || 'unknown'}, defaulting to community_leader`);
    return 'community_leader';
  }

  // Map based on badge tier
  switch (badge.tier) {
    case ProgressionBadgeTier.HUMMINGBIRD:
      return 'welcome_badge';
    
    case ProgressionBadgeTier.COMMUNITY_CONTRIBUTOR:
      return 'community_leader';
    
    case ProgressionBadgeTier.CLIMATE_ADVOCATE:
      return 'climate_hero';
    
    case ProgressionBadgeTier.ENVIRONMENTAL_CHAMPION:
      return 'forest_protector';
    
    case ProgressionBadgeTier.GREEN_HERO:
      return 'ganggreen_hero';
    
    default:
      // Fallback to community_leader for unknown tiers
      console.warn(`Achievement type determination warning: Unknown badge tier "${badge.tier}" for badge ${badge.id || 'unknown'}, defaulting to community_leader`);
      return 'community_leader';
  }
}

/**
 * Maps BadgeTier enum from progression system to geometric badge tier string
 * 
 * Converts the progression system's badge tier enum values to the
 * tier strings expected by the geometric badge rendering system.
 * Handles invalid or missing tier data by defaulting to 'bronze'.
 * 
 * @param tier - The badge tier from the progression system
 * @returns The geometric badge tier string
 * 
 * @example
 * ```typescript
 * const tier = BadgeTier.COMMUNITY_CONTRIBUTOR;
 * const geometricTier = mapTierToBadgeTier(tier);
 * // Returns: 'bronze'
 * ```
 */
export function mapTierToBadgeTier(tier: ProgressionBadgeTier): GeometricBadgeTier {
  // Handle missing or invalid tier
  if (tier === undefined || tier === null) {
    console.warn('Tier mapping warning: Tier is null or undefined, defaulting to bronze');
    return 'bronze';
  }

  const tierMap: Record<ProgressionBadgeTier, GeometricBadgeTier> = {
    [ProgressionBadgeTier.HUMMINGBIRD]: 'hummingbird',
    [ProgressionBadgeTier.COMMUNITY_CONTRIBUTOR]: 'bronze',
    [ProgressionBadgeTier.CLIMATE_ADVOCATE]: 'silver',
    [ProgressionBadgeTier.ENVIRONMENTAL_CHAMPION]: 'gold',
    [ProgressionBadgeTier.GREEN_HERO]: 'hero',
  };
  
  const mappedTier = tierMap[tier];
  
  if (!mappedTier) {
    console.warn(`Tier mapping warning: Unknown badge tier "${tier}", defaulting to bronze`);
    return 'bronze';
  }
  
  return mappedTier;
}
