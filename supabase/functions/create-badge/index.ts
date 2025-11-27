/**
 * Supabase Edge Function: Create Badge
 * 
 * Creates a new badge using geometric generator by default.
 * Supports backward compatibility with badgeType parameter.
 * 
 * Implements Requirements: 2.1, 8.1, 8.2
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface CreateBadgeRequest {
  userId: string;
  tier: string;
  forest: string;
  achievement: string;
  metadata?: Record<string, any>;
  badgeType?: 'geometric' | 'classic'; // For backward compatibility
  saveToDatabase?: boolean;
}

interface BadgeResponse {
  success: boolean;
  badgeId?: string;
  svg?: string;
  metadata?: Record<string, any>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: CreateBadgeRequest = await req.json();
    const {
      userId,
      tier,
      forest,
      achievement,
      metadata = {},
      badgeType = 'geometric', // Default to geometric (Requirement 2.1)
      saveToDatabase = true,
    } = body;

    // Validate required fields
    if (!userId || !tier || !forest || !achievement) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: userId, tier, forest, achievement',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate user can only create badges for themselves (unless admin)
    if (userId !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Cannot create badges for other users' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Validate tier
    const validTiers = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
    if (!validTiers.includes(tier)) {
      return new Response(
        JSON.stringify({
          error: `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate forest
    const validForests = ['kakamega', 'karura', 'mau'];
    if (!validForests.includes(forest)) {
      return new Response(
        JSON.stringify({
          error: `Invalid forest. Must be one of: ${validForests.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate achievement
    const validAchievements = [
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
    if (!validAchievements.includes(achievement)) {
      return new Response(
        JSON.stringify({
          error: `Invalid achievement. Must be one of: ${validAchievements.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[create-badge] Creating badge:', {
      userId,
      tier,
      forest,
      achievement,
      badgeType,
    });

    // Generate badge ID
    const badgeId = `${achievement}-${userId}-${Date.now()}`;

    // Prepare badge metadata
    const badgeMetadata = {
      badgeName: metadata.badgeName || `${tier} ${achievement}`,
      tierLevel: getTierLevel(tier),
      forestName: metadata.forestName || forest,
      achievementType: achievement,
      achievementCount: metadata.achievementCount || 1,
      earnedDate: metadata.earnedDate || new Date().toISOString(),
      uniqueBadgeId: badgeId,
      userId,
      ...metadata,
    };

    // Generate SVG using geometric generator (default)
    // Note: In production, this would call the badge generator service
    // For now, we'll create a placeholder that indicates geometric generation
    const svg = generatePlaceholderSVG(achievement, tier, badgeMetadata);

    // Save to database if requested (Requirement 8.1, 8.2)
    let savedBadgeId: string | undefined;
    if (saveToDatabase) {
      const { data: badgeData, error: insertError } = await supabase
        .from('nft_badges')
        .insert({
          user_id: userId,
          badge_name: badgeMetadata.badgeName,
          tier,
          forest,
          achievement_type: achievement,
          achievement_count: badgeMetadata.achievementCount,
          earned_date: badgeMetadata.earnedDate,
          unique_badge_id: badgeId,
          svg_data: svg,
          badge_type: badgeType, // Requirement 8.1
          primary_colors: extractPrimaryColors(svg), // Requirement 8.2
          accent_colors: extractAccentColors(svg), // Requirement 8.2
          complexity_level: determineComplexityLevel(achievement), // Requirement 8.2
          style_variant: 'angular', // Requirement 8.2
          svg_cache: svg,
          cache_updated_at: new Date().toISOString(),
          metadata: badgeMetadata,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[create-badge] Database insert error:', insertError);
        return new Response(
          JSON.stringify({
            error: 'Failed to save badge to database',
            details: insertError.message,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      savedBadgeId = badgeData.id;

      // Update user gamification stats
      await updateUserBadgeCount(supabase, userId);
    }

    console.log('[create-badge] Badge created successfully:', {
      badgeId: savedBadgeId || badgeId,
      userId,
      tier,
      achievement,
    });

    // Return success response
    const response: BadgeResponse = {
      success: true,
      badgeId: savedBadgeId || badgeId,
      svg,
      metadata: badgeMetadata,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[create-badge] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Helper function to get tier level
 */
function getTierLevel(tier: string): number {
  const tierLevels: Record<string, number> = {
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
 * Helper function to determine complexity level
 */
function determineComplexityLevel(achievement: string): string {
  const complexAchievements = ['biodiversity_champion', 'forest_protector', 'ganggreen_hero'];
  const mediumAchievements = ['carbon_warrior', 'water_guardian', 'climate_hero', 'green_ambassador'];

  if (complexAchievements.includes(achievement)) {
    return 'complex';
  }
  if (mediumAchievements.includes(achievement)) {
    return 'medium';
  }
  return 'simple';
}

/**
 * Helper function to extract primary colors from SVG
 */
function extractPrimaryColors(svg: string): string[] {
  const colors: string[] = [];
  const colorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g;
  const matches = svg.match(colorRegex);
  
  if (matches) {
    // Get unique colors
    const uniqueColors = [...new Set(matches)];
    colors.push(...uniqueColors.slice(0, 5));
  }
  
  return colors;
}

/**
 * Helper function to extract accent colors from SVG
 */
function extractAccentColors(svg: string): string[] {
  const colors: string[] = [];
  const strokeRegex = /stroke[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g;
  const matches = svg.matchAll(strokeRegex);
  
  for (const match of matches) {
    if (match[1] && !colors.includes(match[1])) {
      colors.push(match[1]);
    }
  }
  
  return colors.slice(0, 3);
}

/**
 * Helper function to update user badge count
 */
async function updateUserBadgeCount(supabase: any, userId: string): Promise<void> {
  try {
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('id, badges_earned')
      .eq('user_id', userId)
      .single();

    if (!gamification) {
      await supabase.from('user_gamification').insert({
        user_id: userId,
        badges_earned: 1,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from('user_gamification')
        .update({
          badges_earned: (gamification.badges_earned || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('[create-badge] Error updating user badge count:', error);
  }
}

/**
 * Generate placeholder SVG for badge
 * Note: In production, this would call the actual geometric badge generator
 */
function generatePlaceholderSVG(
  achievement: string,
  tier: string,
  metadata: Record<string, any>
): string {
  // This is a placeholder. In production, this would import and call
  // the actual geometricBadgeGenerator from the client-side code
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="bg-${tier}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2E8B57;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#228B22;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg-${tier})" rx="20"/>
  <text x="200" y="200" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
    ${tier.toUpperCase()} ${achievement.replace(/_/g, ' ').toUpperCase()}
  </text>
  <text x="200" y="230" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
    Geometric Badge
  </text>
</svg>`;
}
