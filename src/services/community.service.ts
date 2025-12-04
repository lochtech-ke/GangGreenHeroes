/**
 * Community Service
 * Handles community management, membership, posts, and events
 * Requirements: A3.1, A3.2, A3.3, A3.4, A3.5
 */

import { supabase } from './supabase';
import {
  Community,
  CommunityPost,
  AgeCohort,
  AgeTargeting,
} from '../types/platform.types';

// ============================================================================
// Community Browser & Search
// ============================================================================

export interface CommunitySearchFilters {
  searchQuery?: string;
  county?: string;
  subCounty?: string;
  focusAreas?: string[];
  activityLevel?: 'low' | 'medium' | 'high';
  ageCohort?: AgeCohort;
  limit?: number;
  offset?: number;
}

export interface CommunitySearchResult {
  communities: Community[];
  total: number;
  hasMore: boolean;
}

/**
 * Search and filter communities with age-appropriate filtering
 * Requirements: A3.1, A3.5
 */
export async function searchCommunities(
  filters: CommunitySearchFilters
): Promise<CommunitySearchResult> {
  try {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = supabase
      .from('communities')
      .select('*', { count: 'exact' });

    // Apply search query
    if (filters.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply location filters
    if (filters.county) {
      query = query.eq('county', filters.county);
    }
    if (filters.subCounty) {
      query = query.eq('sub_county', filters.subCounty);
    }

    // Apply activity level filter
    if (filters.activityLevel) {
      query = query.eq('activity_level', filters.activityLevel);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    let communities = (data || []) as Community[];

    // Apply age-appropriate filtering if cohort is provided
    if (filters.ageCohort) {
      communities = await filterCommunitiesByAge(communities, filters.ageCohort);
    }

    return {
      communities,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Error searching communities:', error);
    throw error;
  }
}

/**
 * Filter communities based on age targeting
 */
async function filterCommunitiesByAge(
  communities: Community[],
  ageCohort: AgeCohort
): Promise<Community[]> {
  // Get age targeting for all communities
  const communityIds = communities.map((c) => c.id);

  const { data: targetingData } = await supabase
    .from('content_age_targeting')
    .select('*')
    .eq('content_type', 'community')
    .in('content_id', communityIds);

  const targetingMap = new Map(
    (targetingData || []).map((t) => [t.content_id, t])
  );

  // Filter communities based on age appropriateness
  return communities.filter((community) => {
    const targeting = targetingMap.get(community.id);
    if (!targeting) return true; // No targeting = available to all

    const userAge = getAgeFromCohort(ageCohort);
    
    if (targeting.min_age && userAge < targeting.min_age) return false;
    if (targeting.max_age && userAge > targeting.max_age) return false;
    
    if (targeting.target_cohorts && targeting.target_cohorts.length > 0) {
      return targeting.target_cohorts.includes(ageCohort);
    }

    return true;
  });
}

/**
 * Get representative age from cohort
 */
function getAgeFromCohort(cohort: AgeCohort): number {
  const cohortAges: Record<AgeCohort, number> = {
    '13-17': 15,
    '18-24': 21,
    '25-34': 29,
    '35-49': 42,
    '50+': 55,
  };
  return cohortAges[cohort];
}

/**
 * Get community by ID
 * Requirements: A3.1
 */
export async function getCommunityById(communityId: string): Promise<Community | null> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) throw error;
    return data as Community;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}

// ============================================================================
// Community Membership
// ============================================================================

/**
 * Join a community
 * Requirements: A3.2
 */
export async function joinCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single();

    if (existing) {
      return { success: false, error: 'Already a member of this community' };
    }

    // Add member
    const { error: insertError } = await supabase
      .from('community_members')
      .insert({
        user_id: userId,
        community_id: communityId,
        role: 'member',
        joined_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    // Increment member count
    const { error: updateError } = await supabase.rpc('increment_community_members', {
      community_id: communityId,
    });

    if (updateError) {
      console.warn('Failed to increment member count:', updateError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error joining community:', error);
    return { success: false, error: 'Failed to join community' };
  }
}

/**
 * Leave a community
 * Requirements: A3.2
 */
export async function leaveCommunity(
  userId: string,
  communityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', userId)
      .eq('community_id', communityId);

    if (deleteError) throw deleteError;

    // Decrement member count
    const { error: updateError } = await supabase.rpc('decrement_community_members', {
      community_id: communityId,
    });

    if (updateError) {
      console.warn('Failed to decrement member count:', updateError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error leaving community:', error);
    return { success: false, error: 'Failed to leave community' };
  }
}

/**
 * Check if user is a member of a community
 * Requirements: A3.2
 */
export async function isCommunityMember(
  userId: string,
  communityId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('user_id', userId)
      .eq('community_id', communityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

/**
 * Get user's communities
 */
export async function getUserCommunities(userId: string): Promise<Community[]> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('community_id, communities(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || [])
      .map((item: any) => item.communities)
      .filter(Boolean) as Community[];
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return [];
  }
}

/**
 * Get community members
 * Requirements: A3.1
 */
export async function getCommunityMembers(
  communityId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ members: any[]; total: number }> {
  try {
    const { data, error, count } = await supabase
      .from('community_members')
      .select('*, user_profiles(*)', { count: 'exact' })
      .eq('community_id', communityId)
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      members: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching community members:', error);
    return { members: [], total: 0 };
  }
}

// ============================================================================
// Community Posts & Feed
// ============================================================================

export interface PostFilters {
  communityId?: string;
  authorId?: string;
  ageCohort?: AgeCohort;
  limit?: number;
  offset?: number;
}

/**
 * Get community feed with age-targeted content
 * Requirements: A3.3, A3.4
 */
export async function getCommunityFeed(
  filters: PostFilters
): Promise<{ posts: CommunityPost[]; total: number; hasMore: boolean }> {
  try {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.communityId) {
      query = query.eq('community_id', filters.communityId);
    }

    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    let posts = (data || []) as CommunityPost[];

    // Apply age-appropriate filtering if cohort is provided
    if (filters.ageCohort) {
      posts = await filterPostsByAge(posts, filters.ageCohort);
    }

    return {
      posts,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  } catch (error) {
    console.error('Error fetching community feed:', error);
    return { posts: [], total: 0, hasMore: false };
  }
}

/**
 * Filter posts based on age targeting
 */
async function filterPostsByAge(
  posts: CommunityPost[],
  ageCohort: AgeCohort
): Promise<CommunityPost[]> {
  const postIds = posts.map((p) => p.id);

  const { data: targetingData } = await supabase
    .from('content_age_targeting')
    .select('*')
    .eq('content_type', 'community_post')
    .in('content_id', postIds);

  const targetingMap = new Map(
    (targetingData || []).map((t) => [t.content_id, t])
  );

  return posts.filter((post) => {
    const targeting = targetingMap.get(post.id);
    if (!targeting) return true;

    const userAge = getAgeFromCohort(ageCohort);
    
    if (targeting.min_age && userAge < targeting.min_age) return false;
    if (targeting.max_age && userAge > targeting.max_age) return false;
    
    if (targeting.target_cohorts && targeting.target_cohorts.length > 0) {
      return targeting.target_cohorts.includes(ageCohort);
    }

    return true;
  });
}

/**
 * Create a community post
 * Requirements: A3.3
 */
export async function createCommunityPost(
  post: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'createdAt'>
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: post.communityId,
        author_id: post.authorId,
        content: post.content,
        images: post.images || [],
        links: post.links || [],
        likes: 0,
        comments: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // If age targeting is specified, save it
    if (post.ageTargeting && data) {
      await saveAgeTargeting(data.id, 'community_post', post.ageTargeting);
    }

    return { success: true, postId: data?.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

/**
 * Save age targeting for content
 */
async function saveAgeTargeting(
  contentId: string,
  contentType: string,
  targeting: AgeTargeting
): Promise<void> {
  try {
    await supabase.from('content_age_targeting').insert({
      content_id: contentId,
      content_type: contentType,
      min_age: targeting.minAge,
      max_age: targeting.maxAge,
      target_cohorts: targeting.targetCohorts || [],
    });
  } catch (error) {
    console.error('Error saving age targeting:', error);
  }
}

/**
 * Get post by ID
 */
export async function getPostById(postId: string): Promise<CommunityPost | null> {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data as CommunityPost;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Like a post
 */
export async function likePost(postId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.rpc('increment_post_likes', {
      post_id: postId,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false };
  }
}

/**
 * Upload images for a post
 */
export async function uploadPostImages(
  files: File[],
  userId: string
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('community-posts')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('community-posts')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  return uploadedUrls;
}

// ============================================================================
// Community Statistics
// ============================================================================

/**
 * Get community statistics
 */
export async function getCommunityStats(communityId: string): Promise<{
  memberCount: number;
  postCount: number;
  activityLevel: 'low' | 'medium' | 'high';
}> {
  try {
    const [memberResult, postResult] = await Promise.all([
      supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),
      supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),
    ]);

    const memberCount = memberResult.count || 0;
    const postCount = postResult.count || 0;

    // Calculate activity level based on posts in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentPosts } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    let activityLevel: 'low' | 'medium' | 'high' = 'low';
    if (recentPosts && recentPosts > 20) activityLevel = 'high';
    else if (recentPosts && recentPosts > 5) activityLevel = 'medium';

    return { memberCount, postCount, activityLevel };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return { memberCount: 0, postCount: 0, activityLevel: 'low' };
  }
}
