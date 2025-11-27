/**
 * Supabase Edge Function: Get Badge
 * 
 * Retrieves a badge by ID, returning geometric badges by default.
 * Supports format parameter (svg, png) and implements caching.
 * 
 * Implements Requirements: 2.1, 4.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface GetBadgeResponse {
  success: boolean;
  badge?: {
    id: string;
    userId: string;
    badgeName: string;
    tier: string;
    forest: string;
    achievementType: string;
    earnedDate: string;
    svg: string;
    badgeType: string;
    metadata?: Record<string, any>;
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== 'GET') {
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

    // Create Supabase client
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

    // Parse URL to get badge ID and query parameters
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const badgeId = pathParts[pathParts.length - 1];
    const format = url.searchParams.get('format') || 'svg'; // Default to SVG (Requirement 2.1)
    const useCache = url.searchParams.get('cache') !== 'false'; // Default to true (Requirement 4.5)

    if (!badgeId) {
      return new Response(
        JSON.stringify({ error: 'Badge ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate format
    if (!['svg', 'png'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Must be svg or png' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[get-badge] Fetching badge:', {
      badgeId,
      format,
      useCache,
      userId: user.id,
    });

    // Check cache first if enabled (Requirement 4.5)
    if (useCache) {
      const cachedBadge = await getCachedBadge(supabase, badgeId, format);
      if (cachedBadge) {
        console.log('[get-badge] Returning cached badge:', badgeId);
        
        // Update cache hit count
        await updateCacheHitCount(supabase, badgeId, format);

        // Return cached badge
        if (format === 'svg') {
          return new Response(cachedBadge.svg_content, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
              'X-Cache': 'HIT',
            },
          });
        } else {
          // For PNG, return as base64 or binary
          return new Response(cachedBadge.svg_content, {
            status: 200,
            headers: {
              'Content-Type': 'image/png',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
              'X-Cache': 'HIT',
            },
          });
        }
      }
    }

    // Fetch badge from database
    const { data: badge, error: fetchError } = await supabase
      .from('nft_badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (fetchError || !badge) {
      console.error('[get-badge] Badge not found:', badgeId, fetchError);
      return new Response(
        JSON.stringify({ error: 'Badge not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has permission to view this badge
    if (badge.user_id !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Cannot access other users badges' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('[get-badge] Badge found:', {
      badgeId,
      userId: badge.user_id,
      tier: badge.tier,
      achievement: badge.achievement_type,
      badgeType: badge.badge_type,
    });

    // Get SVG data (use cached SVG if available, otherwise use svg_data)
    let svg = badge.svg_cache || badge.svg_data;

    // If no SVG data, generate it (fallback)
    if (!svg) {
      console.warn('[get-badge] No SVG data found, generating placeholder');
      svg = generatePlaceholderSVG(badge.achievement_type, badge.tier);
    }

    // Cache the badge for future requests (Requirement 4.5)
    if (useCache) {
      await cacheBadge(supabase, badgeId, svg, format);
    }

    // Return badge based on format
    if (format === 'svg') {
      return new Response(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
        },
      });
    } else if (format === 'png') {
      // For PNG format, we would need to convert SVG to PNG
      // This is a placeholder - in production, use a proper SVG to PNG converter
      return new Response(
        JSON.stringify({
          error: 'PNG conversion not yet implemented',
          message: 'Please use format=svg for now',
        }),
        {
          status: 501,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return JSON response with badge data
    const response: GetBadgeResponse = {
      success: true,
      badge: {
        id: badge.id,
        userId: badge.user_id,
        badgeName: badge.badge_name,
        tier: badge.tier,
        forest: badge.forest,
        achievementType: badge.achievement_type,
        earnedDate: badge.earned_date,
        svg,
        badgeType: badge.badge_type || 'geometric', // Default to geometric (Requirement 2.1)
        metadata: badge.metadata,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[get-badge] Error:', error);
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
 * Get cached badge from badge_cache table
 */
async function getCachedBadge(
  supabase: any,
  badgeId: string,
  format: string
): Promise<any | null> {
  try {
    const cacheKey = `${badgeId}-${format}`;
    
    const { data, error } = await supabase
      .from('badge_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[get-badge] Error fetching from cache:', error);
    return null;
  }
}

/**
 * Cache badge in badge_cache table
 */
async function cacheBadge(
  supabase: any,
  badgeId: string,
  svg: string,
  format: string
): Promise<void> {
  try {
    const cacheKey = `${badgeId}-${format}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

    // Check if cache entry exists
    const { data: existing } = await supabase
      .from('badge_cache')
      .select('id')
      .eq('cache_key', cacheKey)
      .single();

    if (existing) {
      // Update existing cache entry
      await supabase
        .from('badge_cache')
        .update({
          svg_content: svg,
          last_accessed_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('cache_key', cacheKey);
    } else {
      // Insert new cache entry
      await supabase.from('badge_cache').insert({
        cache_key: cacheKey,
        badge_id: badgeId,
        svg_content: svg,
        size: new Blob([svg]).size,
        format,
        hit_count: 0,
        last_accessed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }
  } catch (error) {
    console.error('[get-badge] Error caching badge:', error);
  }
}

/**
 * Update cache hit count
 */
async function updateCacheHitCount(
  supabase: any,
  badgeId: string,
  format: string
): Promise<void> {
  try {
    const cacheKey = `${badgeId}-${format}`;
    
    await supabase.rpc('increment_cache_hit_count', {
      p_cache_key: cacheKey,
    });
  } catch (error) {
    console.error('[get-badge] Error updating cache hit count:', error);
  }
}

/**
 * Generate placeholder SVG for badge
 */
function generatePlaceholderSVG(achievement: string, tier: string): string {
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
