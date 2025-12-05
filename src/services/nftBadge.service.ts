import { generateBadgeSVG, type BadgeConfig } from '../utils/badgeGenerator';
import { supabase } from './supabase';

export interface NFTBadgeMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

/**
 * Generate NFT metadata for a badge
 */
export function generateBadgeMetadata(config: BadgeConfig): NFTBadgeMetadata {
  const svg = generateBadgeSVG(config);
  const imageDataURL = `data:image/svg+xml;base64,${btoa(svg)}`;

  const descriptions: Record<BadgeConfig['type'], string> = {
    'tree-planter': 'Awarded for planting trees and contributing to reforestation efforts in African forests.',
    'forest-guardian': 'Recognizes dedication to protecting and preserving forest ecosystems.',
    'carbon-champion': 'Honors significant contributions to carbon sequestration and climate action.',
    'eco-warrior': 'Celebrates active participation in environmental conservation initiatives.',
    'green-pioneer': 'Acknowledges leadership and innovation in sustainable development.'
  };

  return {
    name: `${config.tier.charAt(0).toUpperCase() + config.tier.slice(1)} ${config.name}`,
    description: descriptions[config.type],
    image: imageDataURL,
    attributes: [
      { trait_type: 'Type', value: config.name },
      { trait_type: 'Tier', value: config.tier },
      { trait_type: 'Value', value: config.value || 0 },
      { trait_type: 'Platform', value: '#GangGreen' },
      { trait_type: 'Category', value: 'Environmental Impact' }
    ],
    external_url: 'https://ganggreen.africa'
  };
}

/**
 * Upload badge SVG to Supabase Storage
 */
export async function uploadBadgeImage(
  config: BadgeConfig,
  userId: string
): Promise<{ url: string; path: string } | null> {
  try {
    const svg = generateBadgeSVG(config);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const fileName = `badge-${config.type}-${config.tier}-${Date.now()}.svg`;
    const filePath = `nft-badges/${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('public')
      .upload(filePath, blob, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading badge image:', error);
    return null;
  }
}

/**
 * Create NFT badge record in database
 */
export async function createNFTBadge(
  userId: string,
  config: BadgeConfig,
  tokenId?: string
): Promise<any> {
  try {
    // Upload image
    const imageData = await uploadBadgeImage(config, userId);
    if (!imageData) throw new Error('Failed to upload badge image');

    // Generate metadata
    const metadata = generateBadgeMetadata(config);
    metadata.image = imageData.url; // Use uploaded URL instead of data URL

    // Create database record
    const { data, error } = await supabase
      .from('nft_badges')
      .insert({
        user_id: userId,
        badge_type: config.type,
        badge_tier: config.tier,
        badge_name: config.name,
        badge_value: config.value || 0,
        token_id: tokenId,
        metadata: metadata,
        image_url: imageData.url,
        image_path: imageData.path,
        minted: !!tokenId,
        minted_at: tokenId ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating NFT badge:', error);
    throw error;
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('nft_badges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
}

/**
 * Check if user qualifies for a badge
 */
export async function checkBadgeEligibility(
  userId: string,
  badgeType: BadgeConfig['type']
): Promise<{ eligible: boolean; tier?: BadgeConfig['tier']; value?: number }> {
  try {
    // Get user stats
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile || !gamification) {
      return { eligible: false };
    }

    // Define criteria for each badge type
    const criteria: Record<BadgeConfig['type'], (p: any, g: any) => { tier?: BadgeConfig['tier']; value: number }> = {
      'tree-planter': (p, g) => {
        const trees = g.trees_planted || 0;
        if (trees >= 1000) return { tier: 'diamond', value: trees };
        if (trees >= 500) return { tier: 'platinum', value: trees };
        if (trees >= 100) return { tier: 'gold', value: trees };
        if (trees >= 50) return { tier: 'silver', value: trees };
        if (trees >= 10) return { tier: 'bronze', value: trees };
        return { value: trees };
      },
      'forest-guardian': (p, g) => {
        const initiatives = g.initiatives_joined || 0;
        if (initiatives >= 20) return { tier: 'diamond', value: initiatives };
        if (initiatives >= 10) return { tier: 'platinum', value: initiatives };
        if (initiatives >= 5) return { tier: 'gold', value: initiatives };
        if (initiatives >= 3) return { tier: 'silver', value: initiatives };
        if (initiatives >= 1) return { tier: 'bronze', value: initiatives };
        return { value: initiatives };
      },
      'carbon-champion': (p, g) => {
        const carbon = g.carbon_offset_kg || 0;
        if (carbon >= 10000) return { tier: 'diamond', value: carbon };
        if (carbon >= 5000) return { tier: 'platinum', value: carbon };
        if (carbon >= 1000) return { tier: 'gold', value: carbon };
        if (carbon >= 500) return { tier: 'silver', value: carbon };
        if (carbon >= 100) return { tier: 'bronze', value: carbon };
        return { value: carbon };
      },
      'eco-warrior': (p, g) => {
        const points = g.total_points || 0;
        if (points >= 50000) return { tier: 'diamond', value: points };
        if (points >= 25000) return { tier: 'platinum', value: points };
        if (points >= 10000) return { tier: 'gold', value: points };
        if (points >= 5000) return { tier: 'silver', value: points };
        if (points >= 1000) return { tier: 'bronze', value: points };
        return { value: points };
      },
      'green-pioneer': (p, g) => {
        const level = g.level || 0;
        if (level >= 50) return { tier: 'diamond', value: level };
        if (level >= 30) return { tier: 'platinum', value: level };
        if (level >= 20) return { tier: 'gold', value: level };
        if (level >= 10) return { tier: 'silver', value: level };
        if (level >= 5) return { tier: 'bronze', value: level };
        return { value: level };
      }
    };

    const result = criteria[badgeType](profile, gamification);
    
    return {
      eligible: !!result.tier,
      tier: result.tier,
      value: result.value
    };
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
    return { eligible: false };
  }
}

/**
 * Award badge to user if eligible
 */
export async function awardBadgeIfEligible(
  userId: string,
  badgeType: BadgeConfig['type']
): Promise<any | null> {
  try {
    const eligibility = await checkBadgeEligibility(userId, badgeType);
    
    if (!eligibility.eligible || !eligibility.tier) {
      return null;
    }

    // Check if user already has this badge tier
    const existingBadges = await getUserBadges(userId);
    const hasBadge = existingBadges.some(
      b => b.badge_type === badgeType && b.badge_tier === eligibility.tier
    );

    if (hasBadge) {
      return null; // Already has this badge
    }

    // Create badge
    const config: BadgeConfig = {
      type: badgeType,
      tier: eligibility.tier,
      name: badgeType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: eligibility.value
    };

    return await createNFTBadge(userId, config);
  } catch (error) {
    console.error('Error awarding badge:', error);
    return null;
  }
}
