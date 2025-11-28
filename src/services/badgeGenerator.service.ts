/**
 * Badge Generator Service
 * High-level service for badge generation with geometric defaults
 * Implements Requirements 6.1, 7.1
 */

import { supabase } from './supabase';
import { badgeSvgService } from './badgeSvg.service';
import { hummingbirdBadgeService } from './hummingbirdBadge.service';
import { generateGeometricBadgeWithTier } from '../utils/geometricBadgeGenerator';
import { badgeAnalyticsService } from './badgeAnalytics.service';
import type {
  BadgeConfig,
  BadgeGenerationResult,
  BadgeMetadata,
  BadgeValidationResult,
  AchievementType,
  BadgeTier,
  ForestType,
} from '../types/badge.types';

export interface PurchaseData {
  transactionId: string;
  purchaseDate: Date;
  amount: number;
  currency: string;
}

/**
 * Badge Generator Service Class
 * Provides high-level badge generation with geometric designs as default
 */
class BadgeGeneratorService {
  /**
   * Generate new badge (geometric by default)
   * Implements Requirements 6.1, 7.1
   * 
   * @param config - Badge configuration
   * @param saveToDatabase - Whether to save the badge to database (default: false)
   */
  async generateBadge(config: BadgeConfig, saveToDatabase: boolean = false): Promise<BadgeGenerationResult> {
    try {
      console.log('[BadgeGeneratorService] Generating badge:', {
        id: config.id,
        tier: config.tier,
        achievement: config.achievement,
        forest: config.forest,
      });

      // Validate configuration
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        console.error('[BadgeGeneratorService] Invalid configuration:', validation.errors);
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`,
        };
      }

      // Route to specialized generators based on achievement type
      if (config.achievement === 'welcome_badge') {
        return await this.generateWelcomeBadge(config.metadata.userId);
      }

      if (config.achievement === 'ganggreen_hero' || config.tier === 'hero') {
        return await this.generateHeroBadgeInternal(config);
      }

      // Generate geometric badge by default
      const svg = generateGeometricBadgeWithTier(
        config.achievement,
        config.tier,
        400, // Standard size
        config.metadata
      );

      console.log('[BadgeGeneratorService] Badge generated successfully:', {
        id: config.id,
        tier: config.tier,
        achievement: config.achievement,
        svgSize: new Blob([svg]).size,
      });

      // Track badge generation analytics
      if (config.metadata.userId) {
        await badgeAnalyticsService.trackBadgeGeneration(
          config.metadata.userId,
          config.achievement,
          config.tier,
          'geometric'
        );
      }

      // Save to database if requested
      if (saveToDatabase) {
        const saveResult = await this.saveBadgeToDatabase(config, svg);
        if (!saveResult.success) {
          console.warn('[BadgeGeneratorService] Failed to save badge to database:', saveResult.error);
        } else if (saveResult.badgeId) {
          // Track achievement unlock
          await badgeAnalyticsService.trackAchievementUnlock(
            config.metadata.userId,
            saveResult.badgeId,
            config.achievement,
            config.tier,
            'geometric'
          );
        }
      }

      return {
        success: true,
        svg,
        metadata: config.metadata,
      };
    } catch (error) {
      console.error('[BadgeGeneratorService] Error generating badge:', {
        id: config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate badge',
      };
    }
  }

  /**
   * Generate welcome badge for new user
   * Implements Requirement 6.1
   */
  async generateWelcomeBadge(userId: string): Promise<BadgeGenerationResult> {
    try {
      console.log('[BadgeGeneratorService] Generating welcome badge for user:', userId);

      // Fetch user profile for metadata
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, created_at')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('[BadgeGeneratorService] Could not fetch user profile:', profileError);
      }

      // Generate hummingbird welcome badge using specialized service
      const result = await hummingbirdBadgeService.generateHummingbirdBadge({
        id: `welcome-${userId}-${Date.now()}`,
        tier: 'hummingbird',
        forest: 'kakamega' as ForestType,
        achievement: 'welcome_badge',
        metadata: {
          badgeName: 'Hummingbird Welcome Badge',
          tierLevel: 1,
          forestName: 'Kakamega',
          achievementType: 'welcome_badge',
          achievementCount: 1,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: `welcome-${userId}`,
          userId,
          welcomeMessage: `Welcome to #GangGreen, ${profile?.full_name || 'Hero'}!`,
          registrationDate: profile?.created_at || new Date().toISOString(),
          platformVersion: '1.0.0',
        },
        wingStyle: 'hybrid',
        colorPalette: 'vibrant',
        animationLevel: 'subtle',
      });

      if (!result.success) {
        console.error('[BadgeGeneratorService] Welcome badge generation failed:', result.error);
        return result;
      }

      console.log('[BadgeGeneratorService] Welcome badge generated successfully for user:', userId);

      return result;
    } catch (error) {
      console.error('[BadgeGeneratorService] Error generating welcome badge:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate welcome badge',
      };
    }
  }

  /**
   * Generate hero badge
   * Implements Requirement 7.1
   */
  async generateHeroBadge(userId: string, purchaseData: PurchaseData): Promise<BadgeGenerationResult> {
    try {
      console.log('[BadgeGeneratorService] Generating hero badge for user:', userId);

      // Fetch user profile for metadata
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('[BadgeGeneratorService] Could not fetch user profile:', profileError);
      }

      // Create badge configuration
      const config: BadgeConfig = {
        id: `hero-${userId}-${Date.now()}`,
        tier: 'hero',
        forest: 'kakamega' as ForestType,
        achievement: 'ganggreen_hero',
        metadata: {
          badgeName: 'GangGreen Hero',
          tierLevel: 7,
          forestName: 'GangGreen',
          achievementType: 'ganggreen_hero',
          achievementCount: 1,
          earnedDate: purchaseData.purchaseDate.toISOString(),
          uniqueBadgeId: `hero-${userId}`,
          userId,
          userName: profile?.full_name || 'Hero',
          purchaseDate: purchaseData.purchaseDate.toISOString(),
          badgeType: 'ganggreen_hero',
          generatedAt: new Date().toISOString(),
        },
      };

      // Generate hero badge using internal method
      const result = await this.generateHeroBadgeInternal(config);

      if (!result.success) {
        console.error('[BadgeGeneratorService] Hero badge generation failed:', result.error);
        return result;
      }

      console.log('[BadgeGeneratorService] Hero badge generated successfully for user:', userId);

      return result;
    } catch (error) {
      console.error('[BadgeGeneratorService] Error generating hero badge:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hero badge',
      };
    }
  }

  /**
   * Internal method to generate hero badge
   */
  private async generateHeroBadgeInternal(config: BadgeConfig): Promise<BadgeGenerationResult> {
    try {
      // Use badgeSvgService to generate hero badge with special styling
      const result = await badgeSvgService.generateBadge(config);

      if (!result.success) {
        console.error('[BadgeGeneratorService] Hero badge SVG generation failed:', result.error);
        return result;
      }

      return result;
    } catch (error) {
      console.error('[BadgeGeneratorService] Error in hero badge internal generation:', {
        id: config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hero badge',
      };
    }
  }

  /**
   * Validate badge configuration
   * Implements Requirements 6.1, 7.1
   */
  validateConfig(config: BadgeConfig): BadgeValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!config.id) {
      errors.push('Badge ID is required');
    }

    if (!config.tier) {
      errors.push('Badge tier is required');
    }

    if (!config.forest) {
      errors.push('Forest type is required');
    }

    if (!config.achievement) {
      errors.push('Achievement type is required');
    }

    if (!config.metadata) {
      errors.push('Badge metadata is required');
    }

    // Validate tier
    const validTiers: BadgeTier[] = [
      'hummingbird',
      'bronze',
      'silver',
      'gold',
      'platinum',
      'diamond',
      'hero',
    ];
    if (config.tier && !validTiers.includes(config.tier)) {
      errors.push(`Invalid tier: ${config.tier}. Must be one of: ${validTiers.join(', ')}`);
    }

    // Validate forest
    const validForests: ForestType[] = ['kakamega', 'karura', 'mau'];
    if (config.forest && !validForests.includes(config.forest)) {
      errors.push(`Invalid forest: ${config.forest}. Must be one of: ${validForests.join(', ')}`);
    }

    // Validate achievement type
    const validAchievements: AchievementType[] = [
      'tree_planter',
      'carbon_warrior',
      'water_guardian',
      'biodiversity_champion',
      'community_leader',
      'climate_hero',
      'forest_protector',
      'green_ambassador',
      'welcome_badge',
      'ganggreen_hero',
    ];
    if (config.achievement && !validAchievements.includes(config.achievement)) {
      errors.push(
        `Invalid achievement: ${config.achievement}. Must be one of: ${validAchievements.join(', ')}`
      );
    }

    // Validate metadata
    if (config.metadata) {
      if (!config.metadata.userId) {
        errors.push('Metadata must include userId');
      }

      if (!config.metadata.earnedDate) {
        errors.push('Metadata must include earnedDate');
      }

      if (!config.metadata.uniqueBadgeId) {
        errors.push('Metadata must include uniqueBadgeId');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get badge preview
   * Implements Requirements 6.1, 7.1
   */
  async getPreview(achievementType: AchievementType, tier: BadgeTier): Promise<string> {
    try {
      console.log('[BadgeGeneratorService] Generating preview:', {
        achievementType,
        tier,
      });

      // Create preview metadata
      const previewMetadata: BadgeMetadata = {
        badgeName: `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${achievementType}`,
        tierLevel: this.getTierLevel(tier),
        forestName: 'Preview',
        achievementType,
        achievementCount: 1,
        earnedDate: new Date().toISOString(),
        uniqueBadgeId: `preview-${achievementType}-${tier}`,
        userId: 'preview-user',
      };

      // Generate geometric badge for preview
      const svg = generateGeometricBadgeWithTier(
        achievementType,
        tier,
        400,
        previewMetadata
      );

      console.log('[BadgeGeneratorService] Preview generated successfully:', {
        achievementType,
        tier,
        svgSize: new Blob([svg]).size,
      });

      return svg;
    } catch (error) {
      console.error('[BadgeGeneratorService] Error generating preview:', {
        achievementType,
        tier,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get tier level number
   */
  private getTierLevel(tier: BadgeTier): number {
    const tierLevels: Record<BadgeTier, number> = {
      hummingbird: 0,
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
      hero: 7,
    };

    return tierLevels[tier] || 1;
  }

  /**
   * Save generated badge to nft_badges table
   * Implements Requirements 8.1, 8.2
   */
  async saveBadgeToDatabase(
    config: BadgeConfig,
    svg: string
  ): Promise<{ success: boolean; badgeId?: string; error?: string }> {
    try {
      console.log('[BadgeGeneratorService] Saving badge to database:', {
        id: config.id,
        userId: config.metadata.userId,
        tier: config.tier,
        achievement: config.achievement,
      });

      // Extract colors from SVG for geometric badge metadata
      const primaryColors = this.extractPrimaryColors(svg);
      const accentColors = this.extractAccentColors(svg);

      // Prepare badge data
      const badgeData = {
        user_id: config.metadata.userId,
        badge_name: config.metadata.badgeName,
        tier: config.tier,
        forest: config.forest,
        achievement_type: config.achievement,
        achievement_count: config.metadata.achievementCount || 1,
        earned_date: config.metadata.earnedDate,
        unique_badge_id: config.metadata.uniqueBadgeId,
        svg_data: svg,
        badge_type: 'geometric', // Requirement 8.1
        primary_colors: primaryColors, // Requirement 8.2
        accent_colors: accentColors, // Requirement 8.2
        complexity_level: this.determineComplexityLevel(config.achievement), // Requirement 8.2
        style_variant: 'angular', // Requirement 8.2
        svg_cache: svg,
        cache_updated_at: new Date().toISOString(),
        metadata: config.metadata,
      };

      // Insert badge into database
      const { data, error } = await supabase
        .from('nft_badges')
        .insert(badgeData)
        .select('id')
        .single();

      if (error) {
        console.error('[BadgeGeneratorService] Database insert error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('[BadgeGeneratorService] Badge saved to database successfully:', {
        badgeId: data.id,
        userId: config.metadata.userId,
      });

      // Update user badge collection
      await this.updateUserBadgeCollection(config.metadata.userId, data.id);

      return {
        success: true,
        badgeId: data.id,
      };
    } catch (error) {
      console.error('[BadgeGeneratorService] Error saving badge to database:', {
        id: config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save badge to database',
      };
    }
  }

  /**
   * Update user badge collections
   * Implements Requirement 8.2
   */
  private async updateUserBadgeCollection(
    userId: string,
    badgeId: string
  ): Promise<void> {
    try {
      console.log('[BadgeGeneratorService] Updating user badge collection:', {
        userId,
        badgeId,
      });

      // Check if user_gamification record exists
      const { data: gamification, error: fetchError } = await supabase
        .from('user_gamification')
        .select('id, badges_earned')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('[BadgeGeneratorService] Error fetching gamification record:', fetchError);
        return;
      }

      if (!gamification) {
        // Create new gamification record
        const { error: insertError } = await supabase
          .from('user_gamification')
          .insert({
            user_id: userId,
            badges_earned: 1,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[BadgeGeneratorService] Error creating gamification record:', insertError);
        }
      } else {
        // Update existing gamification record
        const { error: updateError } = await supabase
          .from('user_gamification')
          .update({
            badges_earned: (gamification.badges_earned || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[BadgeGeneratorService] Error updating gamification record:', updateError);
        }
      }

      console.log('[BadgeGeneratorService] User badge collection updated successfully');
    } catch (error) {
      console.error('[BadgeGeneratorService] Error updating user badge collection:', {
        userId,
        badgeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extract primary colors from SVG
   */
  private extractPrimaryColors(svg: string): string[] {
    const colors: string[] = [];
    
    // Extract colors from gradients
    const gradientMatches = svg.matchAll(/stop-color[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of gradientMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Extract colors from fill attributes
    const fillMatches = svg.matchAll(/fill[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of fillMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Return up to 5 primary colors
    return colors.slice(0, 5);
  }

  /**
   * Extract accent colors from SVG
   */
  private extractAccentColors(svg: string): string[] {
    const colors: string[] = [];
    
    // Extract colors from stroke attributes
    const strokeMatches = svg.matchAll(/stroke[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of strokeMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Return up to 3 accent colors
    return colors.slice(0, 3);
  }

  /**
   * Determine complexity level based on achievement type
   */
  private determineComplexityLevel(achievement: AchievementType): 'simple' | 'medium' | 'complex' {
    const complexAchievements: AchievementType[] = [
      'biodiversity_champion',
      'forest_protector',
      'ganggreen_hero',
    ];

    const mediumAchievements: AchievementType[] = [
      'carbon_warrior',
      'water_guardian',
      'climate_hero',
      'green_ambassador',
    ];

    if (complexAchievements.includes(achievement)) {
      return 'complex';
    }

    if (mediumAchievements.includes(achievement)) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Get badge from database by ID
   */
  async getBadgeById(badgeId: string): Promise<{ success: boolean; badge?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('nft_badges')
        .select('*')
        .eq('id', badgeId)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        badge: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch badge',
      };
    }
  }

  /**
   * Get all badges for a user
   */
  async getUserBadges(userId: string): Promise<{ success: boolean; badges?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('nft_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_date', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        badges: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user badges',
      };
    }
  }
}

// Export singleton instance
export const badgeGeneratorService = new BadgeGeneratorService();

// Export class for testing
export { BadgeGeneratorService };
