/**
 * Content Curation Service
 * Main entry point for age-based content curation
 * Integrates all curation components: Age Cohort Analyzer, Scoring Engine,
 * Filtering Engine, Engagement Tracker, Curation Rules, and Fallback Handler
 * 
 * Requirements: B1.1, B1.2, B1.3, B1.4, B1.5, B2.1, B2.3, B2.5, B3.1, B3.3
 */

import { supabase } from './supabase';
import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';
import { scoringEngine } from './scoringEngine.service';
import { contentFilteringEngine } from './contentFilteringEngine.service';
import { engagementTracker } from './engagementTracker.service';
import { curationRulesService } from './curationRules.service';
import { CurationFallbackService } from './curationFallback.service';
import type {
  CurationRequest,
  CurationResponse,
  CuratedContentItem,
  ContentType,
  AgeCohort,
  ScoringContext,
  InteractionHistory,
  CurationRule
} from '../types/contentCuration.types';

// Initialize fallback service
const curationFallbackService = new CurationFallbackService();

/**
 * Cache configuration for relevance scores
 */
const CACHE_TTL_MINUTES = 15;
const CACHE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedScore {
  score: number;
  expiresAt: number;
}

/**
 * In-memory cache for relevance scores
 * In production, this should be replaced with Redis
 */
class RelevanceScoreCache {
  private cache: Map<string, CachedScore> = new Map();

  constructor() {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanup(), CACHE_CLEANUP_INTERVAL_MS);
  }

  private getCacheKey(userId: string, contentId: string, contentType: ContentType): string {
    return `${userId}:${contentId}:${contentType}`;
  }

  get(userId: string, contentId: string, contentType: ContentType): number | null {
    const key = this.getCacheKey(userId, contentId, contentType);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.score;
  }

  set(userId: string, contentId: string, contentType: ContentType, score: number): void {
    const key = this.getCacheKey(userId, contentId, contentType);
    const expiresAt = Date.now() + CACHE_TTL_MINUTES * 60 * 1000;

    this.cache.set(key, { score, expiresAt });
  }

  invalidate(userId: string): void {
    // Remove all cached scores for a user (e.g., when age changes)
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[ContentCuration] Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const relevanceScoreCache = new RelevanceScoreCache();

export const contentCurationService = {
  /**
   * Main entry point for content curation
   * Requirements: B1.1, B1.2, B1.3, B1.4, B1.5, B2.1, B2.3, B2.5, B3.1, B3.3
   */
  async getCuratedContent(request: CurationRequest): Promise<CurationResponse> {
    try {
      console.log('[ContentCuration] Starting curation request:', {
        userId: request.userId,
        contentTypes: request.contentTypes,
        limit: request.limit
      });

      // Step 1: Get user profile and age cohort
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('age, age_cohort, age_curation_enabled')
        .eq('user_id', request.userId)
        .single();

      if (userError || !userProfile) {
        console.warn('[ContentCuration] User profile not found, using fallback');
        const fallbackResult = await curationFallbackService.handleMissingAge(request);
        return this.convertFallbackToResponse(fallbackResult, request);
      }

      // Check if user has opted out of curation
      if (userProfile.age_curation_enabled === false) {
        console.log('[ContentCuration] User opted out of curation, using chronological feed');
        const items = await curationFallbackService.getChronologicalFeed(request.contentTypes, request.limit);
        return {
          items,
          hasMore: false,
          total: items.length
        };
      }

      // Validate age data
      if (!userProfile.age || userProfile.age < 0 || userProfile.age > 120) {
        console.warn('[ContentCuration] Invalid age data, using fallback');
        const fallbackResult = await curationFallbackService.handleInvalidAge(request, userProfile.age || 0);
        return this.convertFallbackToResponse(fallbackResult, request);
      }

      // Step 2: Determine age cohort
      const cohort = ageCohortAnalyzer.determineCohort(userProfile.age);
      const cohortPreferences = ageCohortAnalyzer.getCohortPreferences(cohort);

      console.log('[ContentCuration] User cohort:', cohort);

      // Step 3: Get user interaction history
      const interactionHistory = await this.getUserInteractionHistory(request.userId);

      // Step 4: Fetch content items based on requested types
      const contentItems = await this.fetchContentItems(request.contentTypes, request.limit * 3); // Fetch more for filtering

      if (contentItems.length === 0) {
        console.warn('[ContentCuration] No content available');
        return {
          items: [],
          hasMore: false,
          total: 0
        };
      }

      // Step 5: Apply content filtering
      const filteredItems = contentFilteringEngine.filterByAgeCohort(
        contentItems,
        cohort
      );

      console.log(`[ContentCuration] Filtered ${contentItems.length} items to ${filteredItems.length}`);

      if (filteredItems.length === 0) {
        console.warn('[ContentCuration] All content filtered out, using fallback');
        const fallbackResult = await curationFallbackService.handleInsufficientContent(request, cohort, []);
        return this.convertFallbackToResponse(fallbackResult, request);
      }

      // Step 6: Score and rank content
      const scoredItems = await this.scoreAndRankContent(
        filteredItems,
        request.userId,
        cohort,
        cohortPreferences,
        interactionHistory
      );

      // Step 7: Apply pagination
      const offset = request.offset || 0;
      const paginatedItems = scoredItems.slice(offset, offset + request.limit);
      const hasMore = offset + request.limit < scoredItems.length;

      console.log(`[ContentCuration] Returning ${paginatedItems.length} curated items`);

      return {
        items: paginatedItems,
        hasMore,
        total: scoredItems.length
      };

    } catch (error) {
      console.error('[ContentCuration] Error during curation:', error);
      // Fallback to engine failure handler
      const fallbackResult = await curationFallbackService.handleEngineFailure(request, error as Error);
      return this.convertFallbackToResponse(fallbackResult, request);
    }
  },

  /**
   * Convert FallbackResult to CurationResponse
   */
  convertFallbackToResponse(fallbackResult: any, request: CurationRequest): CurationResponse {
    return {
      items: fallbackResult.items || [],
      hasMore: false,
      total: fallbackResult.items?.length || 0
    };
  },

  /**
   * Get user interaction history for personalization
   */
  async getUserInteractionHistory(userId: string): Promise<InteractionHistory> {
    try {
      const metrics = await engagementTracker.getUserHistory(userId);

      // Calculate content type breakdown
      const contentTypeBreakdown: Record<ContentType, number> = {
        initiative: 0,
        social_post: 0,
        challenge: 0,
        educational: 0,
        mission: 0,
        community_post: 0,
        petition: 0
      };

      // metrics is an array of engagement metrics
      if (Array.isArray(metrics)) {
        metrics.forEach((metric: any) => {
          if (metric.content_type in contentTypeBreakdown) {
            contentTypeBreakdown[metric.content_type as ContentType] = metric.total_interactions || 0;
          }
        });
      }

      const totalInteractions = Object.values(contentTypeBreakdown).reduce((sum, count) => sum + count, 0);

      // Get recent interactions
      const { data: recentInteractions } = await supabase
        .from('content_interactions')
        .select('content_id, content_type, interaction_type, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(20);

      return {
        totalInteractions,
        contentTypeBreakdown,
        recentInteractions: (recentInteractions || []).map(interaction => ({
          contentId: interaction.content_id,
          contentType: interaction.content_type as ContentType,
          interactionType: interaction.interaction_type,
          timestamp: new Date(interaction.timestamp)
        })),
        engagementScore: totalInteractions > 0 ? Math.min(100, totalInteractions * 2) : 0,
        lastActivity: new Date()
      };

    } catch (error) {
      console.error('[ContentCuration] Error fetching interaction history:', error);
      return {
        totalInteractions: 0,
        contentTypeBreakdown: {
          initiative: 0,
          social_post: 0,
          challenge: 0,
          educational: 0,
          mission: 0,
          community_post: 0,
          petition: 0
        },
        recentInteractions: [],
        engagementScore: 0,
        lastActivity: new Date()
      };
    }
  },

  /**
   * Fetch content items from database
   */
  async fetchContentItems(contentTypes: ContentType[], limit: number): Promise<CuratedContentItem[]> {
    const items: CuratedContentItem[] = [];

    try {
      // Fetch initiatives
      if (contentTypes.includes('initiative')) {
        const { data: initiatives } = await supabase
          .from('initiatives')
          .select('id, title, description, forest, status, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit);

        initiatives?.forEach(init => {
          items.push({
            id: init.id,
            type: 'initiative',
            title: init.title,
            description: init.description || '',
            relevanceScore: 0, // Will be calculated
            createdAt: new Date(init.created_at),
            metadata: {
              forest: init.forest,
              status: init.status,
              created_at: init.created_at
            }
          });
        });
      }

      // Fetch missions
      if (contentTypes.includes('mission')) {
        const { data: missions } = await supabase
          .from('missions')
          .select('id, title, description, mission_type, status, created_at')
          .eq('status', 'upcoming')
          .order('created_at', { ascending: false })
          .limit(limit);

        missions?.forEach(mission => {
          items.push({
            id: mission.id,
            type: 'mission',
            title: mission.title,
            description: mission.description || '',
            relevanceScore: 0,
            createdAt: new Date(mission.created_at),
            metadata: {
              mission_type: mission.mission_type,
              status: mission.status,
              created_at: mission.created_at
            }
          });
        });
      }

      // Fetch educational content
      if (contentTypes.includes('educational')) {
        const { data: modules } = await supabase
          .from('learning_modules')
          .select('id, title, description, category, difficulty, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        modules?.forEach(module => {
          items.push({
            id: module.id,
            type: 'educational',
            title: module.title,
            description: module.description || '',
            relevanceScore: 0,
            createdAt: new Date(module.created_at),
            metadata: {
              category: module.category,
              difficulty: module.difficulty,
              created_at: module.created_at
            }
          });
        });
      }

      // Fetch community posts (social_post)
      if (contentTypes.includes('social_post')) {
        const { data: posts } = await supabase
          .from('community_posts')
          .select('id, content, community_id, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        posts?.forEach(post => {
          items.push({
            id: post.id,
            type: 'social_post',
            title: 'Community Post',
            description: post.content.substring(0, 200),
            relevanceScore: 0,
            createdAt: new Date(post.created_at),
            metadata: {
              community_id: post.community_id,
              created_at: post.created_at
            }
          });
        });
      }

      // Fetch challenges
      if (contentTypes.includes('challenge')) {
        // Challenges might be stored in a gamification table or as special missions
        // For now, we'll treat them as a subset of missions
        const { data: challenges } = await supabase
          .from('missions')
          .select('id, title, description, mission_type, status, created_at')
          .in('mission_type', ['challenge', 'team_challenge'])
          .eq('status', 'upcoming')
          .order('created_at', { ascending: false })
          .limit(limit);

        challenges?.forEach(challenge => {
          items.push({
            id: challenge.id,
            type: 'challenge',
            title: challenge.title,
            description: challenge.description || '',
            relevanceScore: 0,
            createdAt: new Date(challenge.created_at),
            metadata: {
              mission_type: challenge.mission_type,
              status: challenge.status,
              created_at: challenge.created_at
            }
          });
        });
      }

      console.log(`[ContentCuration] Fetched ${items.length} content items`);
      return items;

    } catch (error) {
      console.error('[ContentCuration] Error fetching content items:', error);
      return items;
    }
  },

  /**
   * Score and rank content items
   */
  async scoreAndRankContent(
    items: CuratedContentItem[],
    userId: string,
    cohort: AgeCohort,
    cohortPreferences: any,
    interactionHistory: InteractionHistory
  ): Promise<CuratedContentItem[]> {
    const scoredItems: CuratedContentItem[] = [];

    for (const item of items) {
      // Check cache first
      let score = relevanceScoreCache.get(userId, item.id, item.type);

      if (score === null) {
        // Calculate score
        const scoringContext: ScoringContext = {
          user: {
            userId,
            interests: [],
            userType: 'individual'
          },
          cohort,
          personalHistory: interactionHistory,
          cohortPreferences,
          timestamp: new Date()
        };

        const scoringResult = scoringEngine.calculateScore(item, scoringContext);
        score = scoringResult.finalScore;

        // Apply curation rules
        const rules = await curationRulesService.getRulesForCohort(cohort);
        for (const rule of rules) {
          if (rule.isActive && this.ruleApplies(rule, item)) {
            score = this.applyRuleAction(score, rule.action);
          }
        }

        // Cache the score
        relevanceScoreCache.set(userId, item.id, item.type, score);
      }

      scoredItems.push({
        ...item,
        relevanceScore: score
      });
    }

    // Sort by relevance score (descending)
    scoredItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scoredItems;
  },

  /**
   * Check if a curation rule applies to a content item
   */
  ruleApplies(rule: CurationRule, item: CuratedContentItem): boolean {
    const params = rule.parameters;

    // Check content type
    if (params.content_type && params.content_type !== item.type) {
      return false;
    }

    // Check metadata conditions
    if (params.metadata) {
      for (const [key, value] of Object.entries(params.metadata)) {
        if (item.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Apply rule action to score
   */
  applyRuleAction(score: number, action: any): number {
    if (action.type === 'multiply_score') {
      return score * (typeof action.value === 'number' ? action.value : 1);
    } else if (action.type === 'add_score') {
      return score + (typeof action.value === 'number' ? action.value : 0);
    } else if (action.type === 'set_score') {
      return typeof action.value === 'number' ? action.value : score;
    }

    return score;
  },

  /**
   * Invalidate cache for a user (e.g., when age changes)
   */
  invalidateUserCache(userId: string): void {
    relevanceScoreCache.invalidate(userId);
    console.log(`[ContentCuration] Invalidated cache for user ${userId}`);
  },

  /**
   * Clear all cached scores
   */
  clearCache(): void {
    relevanceScoreCache.clear();
    console.log('[ContentCuration] Cleared all cached scores');
  },

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; ttlMinutes: number } {
    return {
      size: relevanceScoreCache.size(),
      ttlMinutes: CACHE_TTL_MINUTES
    };
  }
};
