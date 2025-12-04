/**
 * Curation Fallback Service
 * 
 * Provides graceful degradation and fallback mechanisms for the content
 * curation system when edge cases occur (missing age, invalid age, engine
 * failures, insufficient content).
 * 
 * Requirements: B9.1, B9.2, B9.3, B9.5
 */

import { supabase } from './supabase';
import {
  AgeCohort,
  ContentType,
  CuratedContentItem,
  CurationRequest,
} from '../types/contentCuration.types';

// ============================================================================
// Fallback Configuration
// ============================================================================

/**
 * Configuration for fallback behavior
 */
interface FallbackConfig {
  chronologicalFeedLimit: number;
  cacheTimeout: number;
  adjacentCohortFallback: boolean;
  promptProfileCompletion: boolean;
}

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  chronologicalFeedLimit: 50,
  cacheTimeout: 300000, // 5 minutes
  adjacentCohortFallback: true,
  promptProfileCompletion: true,
};

/**
 * Fallback reason codes
 */
export enum FallbackReason {
  MISSING_AGE = 'missing_age',
  INVALID_AGE = 'invalid_age',
  ENGINE_FAILURE = 'engine_failure',
  INSUFFICIENT_CONTENT = 'insufficient_content',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
}

/**
 * Fallback result with metadata
 */
export interface FallbackResult {
  items: CuratedContentItem[];
  fallbackReason: FallbackReason;
  fallbackStrategy: string;
  message?: string;
  promptAction?: {
    type: 'complete_profile' | 'verify_age' | 'retry' | 'contact_support';
    message: string;
    actionUrl?: string;
  };
  usedCache: boolean;
  timestamp: Date;
}

// ============================================================================
// Curation Fallback Service
// ============================================================================

export class CurationFallbackService {
  private config: FallbackConfig;
  private fallbackCache: Map<string, { data: CuratedContentItem[]; timestamp: number }>;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = { ...DEFAULT_FALLBACK_CONFIG, ...config };
    this.fallbackCache = new Map();
  }

  /**
   * Handles missing age data
   * 
   * Requirement B9.1: When a user has not provided age information,
   * display a general content feed with prompts to complete profile
   * 
   * @param request - Curation request
   * @returns Fallback result with general feed and profile completion prompt
   */
  async handleMissingAge(request: CurationRequest): Promise<FallbackResult> {
    console.warn(`User ${request.userId} has no age information, using general feed`);

    // Get general chronological feed
    const items = await this.getChronologicalFeed(
      request.contentTypes,
      request.limit
    );

    return {
      items,
      fallbackReason: FallbackReason.MISSING_AGE,
      fallbackStrategy: 'chronological_feed_with_prompt',
      message: 'Showing general content. Complete your profile for personalized recommendations.',
      promptAction: this.config.promptProfileCompletion
        ? {
            type: 'complete_profile',
            message: 'Add your age to get personalized climate action recommendations',
            actionUrl: '/settings/profile',
          }
        : undefined,
      usedCache: false,
      timestamp: new Date(),
    };
  }

  /**
   * Handles invalid age data
   * 
   * Requirement B9.2: When age data is invalid or outside expected ranges,
   * request verification and use general curation meanwhile
   * 
   * @param request - Curation request
   * @param invalidAge - The invalid age value
   * @returns Fallback result with general feed and verification prompt
   */
  async handleInvalidAge(
    request: CurationRequest,
    invalidAge: number
  ): Promise<FallbackResult> {
    console.warn(
      `User ${request.userId} has invalid age (${invalidAge}), using general feed`
    );

    // Get general chronological feed
    const items = await this.getChronologicalFeed(
      request.contentTypes,
      request.limit
    );

    return {
      items,
      fallbackReason: FallbackReason.INVALID_AGE,
      fallbackStrategy: 'chronological_feed_with_verification',
      message: 'Your age information needs verification. Showing general content meanwhile.',
      promptAction: {
        type: 'verify_age',
        message: 'Please verify your age to receive personalized recommendations',
        actionUrl: '/settings/profile',
      },
      usedCache: false,
      timestamp: new Date(),
    };
  }

  /**
   * Handles curation engine failures
   * 
   * Requirement B9.3: When the curation engine fails, fall back to
   * chronological content display within 3 seconds
   * 
   * @param request - Curation request
   * @param error - The error that occurred
   * @returns Fallback result with chronological feed
   */
  async handleEngineFailure(
    request: CurationRequest,
    error: Error
  ): Promise<FallbackResult> {
    console.error(
      `Curation engine failed for user ${request.userId}:`,
      error.message
    );

    // Try to use cached data first
    const cacheKey = this.getCacheKey(request);
    const cached = this.fallbackCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      console.log('Using cached fallback data');
      return {
        items: cached.data,
        fallbackReason: FallbackReason.ENGINE_FAILURE,
        fallbackStrategy: 'cached_chronological_feed',
        message: 'Showing recent content (curation temporarily unavailable)',
        promptAction: {
          type: 'retry',
          message: 'Refresh to try personalized recommendations again',
        },
        usedCache: true,
        timestamp: new Date(),
      };
    }

    // Get fresh chronological feed
    const items = await this.getChronologicalFeed(
      request.contentTypes,
      request.limit
    );

    // Cache the result
    this.fallbackCache.set(cacheKey, {
      data: items,
      timestamp: Date.now(),
    });

    return {
      items,
      fallbackReason: FallbackReason.ENGINE_FAILURE,
      fallbackStrategy: 'chronological_feed',
      message: 'Showing recent content (curation temporarily unavailable)',
      promptAction: {
        type: 'retry',
        message: 'Refresh to try personalized recommendations again',
      },
      usedCache: false,
      timestamp: new Date(),
    };
  }

  /**
   * Handles insufficient content for a cohort
   * 
   * Requirement B9.5: When content inventory is insufficient for an age cohort,
   * supplement with adjacent cohort content marked as "also recommended"
   * 
   * @param request - Curation request
   * @param currentCohort - The user's age cohort
   * @param availableItems - Items available for the cohort
   * @returns Fallback result with supplemented content
   */
  async handleInsufficientContent(
    request: CurationRequest,
    currentCohort: AgeCohort,
    availableItems: CuratedContentItem[]
  ): Promise<FallbackResult> {
    console.warn(
      `Insufficient content for cohort ${currentCohort}, supplementing with adjacent cohorts`
    );

    const items = [...availableItems];
    const needed = request.limit - items.length;

    if (needed > 0 && this.config.adjacentCohortFallback) {
      // Get adjacent cohorts
      const adjacentCohorts = this.getAdjacentCohorts(currentCohort);

      // Fetch content from adjacent cohorts
      for (const adjacentCohort of adjacentCohorts) {
        if (items.length >= request.limit) break;

        const supplementalItems = await this.getContentForCohort(
          adjacentCohort,
          request.contentTypes,
          needed
        );

        // Mark as "also recommended"
        const markedItems = supplementalItems.map((item) => ({
          ...item,
          metadata: {
            ...item.metadata,
            supplemental: true,
            originalCohort: adjacentCohort,
            reason: 'also_recommended',
          },
        }));

        items.push(...markedItems);
      }
    }

    // If still insufficient, add general content
    if (items.length < request.limit) {
      const generalItems = await this.getChronologicalFeed(
        request.contentTypes,
        request.limit - items.length
      );
      items.push(...generalItems);
    }

    return {
      items: items.slice(0, request.limit),
      fallbackReason: FallbackReason.INSUFFICIENT_CONTENT,
      fallbackStrategy: 'adjacent_cohort_supplement',
      message: `Showing ${availableItems.length} personalized items and ${
        items.length - availableItems.length
      } also recommended`,
      usedCache: false,
      timestamp: new Date(),
    };
  }

  /**
   * Gets chronological content feed
   * 
   * Requirement B9.3, B9.5: Provide chronological content as fallback
   * 
   * @param contentTypes - Types of content to fetch
   * @param limit - Maximum number of items
   * @returns Array of content items in chronological order
   */
  async getChronologicalFeed(
    contentTypes: ContentType[],
    limit: number
  ): Promise<CuratedContentItem[]> {
    const items: CuratedContentItem[] = [];

    try {
      // Fetch from different content sources based on types
      for (const contentType of contentTypes) {
        const typeItems = await this.fetchContentByType(contentType, limit);
        items.push(...typeItems);
      }

      // Sort by creation date (most recent first)
      items.sort((a, b) => {
        const dateA = new Date(a.metadata?.createdAt || 0).getTime();
        const dateB = new Date(b.metadata?.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Return limited results
      return items.slice(0, limit);
    } catch (error) {
      console.error('Error fetching chronological feed:', error);
      return [];
    }
  }

  /**
   * Fetches content by type from database
   * 
   * @param contentType - Type of content to fetch
   * @param limit - Maximum number of items
   * @returns Array of content items
   */
  private async fetchContentByType(
    contentType: ContentType,
    limit: number
  ): Promise<CuratedContentItem[]> {
    try {
      let tableName: string;
      let titleField: string;
      let descField: string;

      switch (contentType) {
        case 'initiative':
          tableName = 'initiatives';
          titleField = 'title';
          descField = 'description';
          break;
        case 'mission':
          tableName = 'missions';
          titleField = 'title';
          descField = 'description';
          break;
        case 'educational':
          tableName = 'learning_modules';
          titleField = 'title';
          descField = 'description';
          break;
        case 'social_post':
          tableName = 'community_posts';
          titleField = 'content';
          descField = 'content';
          break;
        case 'challenge':
          tableName = 'challenge_quests';
          titleField = 'title';
          descField = 'description';
          break;
        default:
          return [];
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(`Error fetching ${contentType}:`, error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        type: contentType,
        title: item[titleField] || '',
        description: item[descField] || '',
        relevanceScore: 50, // Neutral score for chronological feed
        createdAt: new Date(item.created_at || Date.now()),
        metadata: {
          ...item,
        },
      }));
    } catch (error) {
      console.error(`Error in fetchContentByType for ${contentType}:`, error);
      return [];
    }
  }

  /**
   * Gets content for a specific cohort
   * 
   * @param cohort - Age cohort
   * @param contentTypes - Types of content to fetch
   * @param limit - Maximum number of items
   * @returns Array of content items
   */
  private async getContentForCohort(
    cohort: AgeCohort,
    contentTypes: ContentType[],
    limit: number
  ): Promise<CuratedContentItem[]> {
    const items: CuratedContentItem[] = [];

    try {
      for (const contentType of contentTypes) {
        // Fetch content with age targeting for this cohort
        const { data, error } = await supabase
          .from('content_age_targeting')
          .select(
            `
            content_id,
            content_type
          `
          )
          .eq('content_type', contentType)
          .contains('target_cohorts', [cohort])
          .limit(limit);

        if (error) {
          console.error(`Error fetching content for cohort ${cohort}:`, error);
          continue;
        }

        // Fetch actual content items
        if (data && data.length > 0) {
          const contentItems = await this.fetchContentByType(contentType, data.length);
          items.push(...contentItems);
        }
      }

      return items.slice(0, limit);
    } catch (error) {
      console.error(`Error in getContentForCohort for ${cohort}:`, error);
      return [];
    }
  }

  /**
   * Gets adjacent age cohorts for supplemental content
   * 
   * @param cohort - Current age cohort
   * @returns Array of adjacent cohorts
   */
  private getAdjacentCohorts(cohort: AgeCohort): AgeCohort[] {
    const cohortOrder: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];
    const currentIndex = cohortOrder.indexOf(cohort);

    if (currentIndex === -1) return [];

    const adjacent: AgeCohort[] = [];

    // Add cohort before
    if (currentIndex > 0) {
      adjacent.push(cohortOrder[currentIndex - 1]);
    }

    // Add cohort after
    if (currentIndex < cohortOrder.length - 1) {
      adjacent.push(cohortOrder[currentIndex + 1]);
    }

    return adjacent;
  }

  /**
   * Generates cache key for fallback data
   * 
   * @param request - Curation request
   * @returns Cache key string
   */
  private getCacheKey(request: CurationRequest): string {
    return `${request.userId}_${request.contentTypes.join(',')}_${request.limit}`;
  }

  /**
   * Clears expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.fallbackCache.entries()) {
      if (now - value.timestamp > this.config.cacheTimeout) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Validates age value
   * 
   * @param age - Age to validate
   * @returns True if age is valid
   */
  static isValidAge(age: number | null | undefined): boolean {
    if (age === null || age === undefined) return false;
    return age > 0 && age <= 120;
  }

  /**
   * Determines if age is missing
   * 
   * @param age - Age to check
   * @returns True if age is missing
   */
  static isMissingAge(age: number | null | undefined): boolean {
    return age === null || age === undefined;
  }
}
 