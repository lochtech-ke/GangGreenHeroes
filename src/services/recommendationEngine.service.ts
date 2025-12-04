/**
 * Recommendation Engine Service
 * Age-aware, context-aware recommendation system for climate actions
 * 
 * Requirements: A2.1, A2.5
 */

import { supabase } from './supabase';
import {
  Recommendation,
  RecommendationRequest,
  ChatContext
} from '../types/aiCompanion.types';
import { AgeCohort } from '../types/platform.types';
import {
  ContentType,
  InteractionHistory
} from '../types/contentCuration.types';

interface RecommendationScore {
  id: string;
  type: ContentType;
  baseScore: number;
  ageScore: number;
  contextScore: number;
  finalScore: number;
}

interface CohortPreferences {
  contentTypeWeights: Record<ContentType, number>;
  activityTypes: string[];
  engagementStyle: 'digital' | 'physical' | 'hybrid';
  financialCapacity: 'low' | 'medium' | 'high';
}

class RecommendationEngineService {
  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Generate age-aware, context-aware recommendations
   */
  async generateRecommendations(
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    try {
      // Get user's interaction history
      const interactionHistory = await this.getUserInteractionHistory(request.userId);

      // Get cohort preferences
      const cohortPrefs = this.getCohortPreferences(request.ageCohort);

      // Fetch candidate content from database
      const candidates = await this.fetchCandidateContent(request);

      // Score each candidate
      const scoredCandidates = candidates.map(candidate =>
        this.scoreCandidate(candidate, request, cohortPrefs, interactionHistory)
      );

      // Sort by score and take top N
      const topCandidates = scoredCandidates
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, request.limit || 5);

      // Convert to recommendations
      const recommendations = await this.convertToRecommendations(
        topCandidates,
        request
      );

      // Track analytics
      await this.trackRecommendationGeneration(request.userId, recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return fallback recommendations
      return this.getFallbackRecommendations(request);
    }
  }

  /**
   * Get context-aware suggestions based on current user state
   */
  async getContextualSuggestions(
    userId: string,
    context: ChatContext
  ): Promise<Recommendation[]> {
    const request: RecommendationRequest = {
      userId,
      userInterests: context.userInterests,
      ageCohort: context.ageCohort,
      location: context.location,
      recentActions: context.recentActions,
      limit: 3
    };

    // Add context-specific filtering
    const recommendations = await this.generateRecommendations(request);

    // Enhance with context-specific reasons
    return recommendations.map(rec => ({
      ...rec,
      reason: this.enhanceReasonWithContext(rec.reason, context)
    }));
  }

  // ============================================================================
  // Age-Aware Logic
  // ============================================================================

  /**
   * Get content type preferences for each age cohort
   */
  private getCohortPreferences(cohort: AgeCohort): CohortPreferences {
    const preferences: Record<AgeCohort, CohortPreferences> = {
      '13-17': {
        contentTypeWeights: {
          challenge: 1.0,
          social_post: 0.9,
          mission: 0.8,
          educational: 0.7,
          community_post: 0.8,
          initiative: 0.6,
          petition: 0.5
        },
        activityTypes: ['social_media', 'peer_challenges', 'gamified', 'school_projects'],
        engagementStyle: 'digital',
        financialCapacity: 'low'
      },
      '18-24': {
        contentTypeWeights: {
          challenge: 0.9,
          mission: 0.9,
          social_post: 0.8,
          community_post: 0.8,
          educational: 0.7,
          initiative: 0.7,
          petition: 0.7
        },
        activityTypes: ['social_campaigns', 'volunteering', 'activism', 'learning'],
        engagementStyle: 'hybrid',
        financialCapacity: 'low'
      },
      '25-34': {
        contentTypeWeights: {
          initiative: 0.9,
          mission: 0.8,
          educational: 0.8,
          petition: 0.8,
          community_post: 0.7,
          challenge: 0.6,
          social_post: 0.5
        },
        activityTypes: ['donations', 'skilled_volunteering', 'corporate_partnerships'],
        engagementStyle: 'hybrid',
        financialCapacity: 'medium'
      },
      '35-49': {
        contentTypeWeights: {
          initiative: 1.0,
          petition: 0.9,
          educational: 0.8,
          mission: 0.7,
          community_post: 0.7,
          challenge: 0.5,
          social_post: 0.4
        },
        activityTypes: ['donations', 'leadership', 'mentorship', 'advocacy'],
        engagementStyle: 'physical',
        financialCapacity: 'high'
      },
      '50+': {
        contentTypeWeights: {
          initiative: 1.0,
          educational: 0.9,
          petition: 0.8,
          community_post: 0.7,
          mission: 0.6,
          challenge: 0.4,
          social_post: 0.3
        },
        activityTypes: ['legacy_projects', 'advisory', 'major_donations', 'mentorship'],
        engagementStyle: 'physical',
        financialCapacity: 'high'
      }
    };

    return preferences[cohort];
  }

  /**
   * Check if content is age-appropriate
   */
  private isAgeAppropriate(
    _contentType: ContentType,
    cohort: AgeCohort,
    metadata: any
  ): boolean {
    // Minors (13-17) restrictions
    if (cohort === '13-17') {
      // Exclude content requiring financial transactions
      if (metadata.requiresPayment || metadata.donationRequired) {
        return false;
      }
      // Exclude content requiring legal adult status
      if (metadata.requiresAdultStatus) {
        return false;
      }
    }

    // Youth (13-24) restrictions
    if (cohort === '13-17' || cohort === '18-24') {
      // Filter out high-cost initiatives
      if (metadata.minimumDonation && metadata.minimumDonation > 1000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate age-based relevance score
   */
  private calculateAgeScore(
    contentType: ContentType,
    _cohort: AgeCohort,
    cohortPrefs: CohortPreferences
  ): number {
    return cohortPrefs.contentTypeWeights[contentType] || 0.5;
  }

  // ============================================================================
  // Context-Aware Logic
  // ============================================================================

  /**
   * Calculate context-based relevance score
   */
  private calculateContextScore(
    candidate: any,
    request: RecommendationRequest,
    interactionHistory: InteractionHistory
  ): number {
    let score = 0.5; // Base score

    // Interest matching (0-0.3 points)
    const interestMatch = this.calculateInterestMatch(
      candidate,
      request.userInterests
    );
    score += interestMatch * 0.3;

    // Location relevance (0-0.2 points)
    if (request.location && candidate.location) {
      const locationMatch = this.calculateLocationMatch(
        candidate.location,
        request.location
      );
      score += locationMatch * 0.2;
    }

    // Recency bonus (0-0.1 points)
    const recencyScore = this.calculateRecencyScore(candidate.created_at);
    score += recencyScore * 0.1;

    // Diversity penalty (avoid repetition)
    const diversityPenalty = this.calculateDiversityPenalty(
      candidate,
      interactionHistory
    );
    score -= diversityPenalty * 0.2;

    // Popularity boost (0-0.1 points)
    const popularityScore = this.calculatePopularityScore(candidate);
    score += popularityScore * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate interest matching score
   */
  private calculateInterestMatch(
    candidate: any,
    userInterests: string[]
  ): number {
    if (!userInterests || userInterests.length === 0) return 0.5;

    const candidateTags = candidate.tags || candidate.categories || [];
    const matches = userInterests.filter(interest =>
      candidateTags.some((tag: string) =>
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );

    return matches.length / userInterests.length;
  }

  /**
   * Calculate location matching score
   */
  private calculateLocationMatch(
    candidateLocation: any,
    userLocation: any
  ): number {
    if (!candidateLocation || !userLocation) return 0.5;

    // Exact county match
    if (candidateLocation.county === userLocation.county) {
      // Sub-county match
      if (
        candidateLocation.subCounty &&
        userLocation.subCounty &&
        candidateLocation.subCounty === userLocation.subCounty
      ) {
        return 1.0;
      }
      return 0.8;
    }

    // Different county
    return 0.3;
  }

  /**
   * Calculate recency score (newer content gets higher score)
   */
  private calculateRecencyScore(createdAt: Date | string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreation < 7) return 1.0;
    if (daysSinceCreation < 30) return 0.7;
    if (daysSinceCreation < 90) return 0.5;
    return 0.3;
  }

  /**
   * Calculate diversity penalty (penalize similar content to recent interactions)
   */
  private calculateDiversityPenalty(
    candidate: any,
    history: InteractionHistory
  ): number {
    if (!history.recentInteractions || history.recentInteractions.length === 0) {
      return 0;
    }

    // Check if user recently interacted with similar content
    const recentSimilar = history.recentInteractions.filter(
      interaction =>
        interaction.contentType === candidate.type &&
        interaction.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return Math.min(recentSimilar.length / 5, 0.5);
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(candidate: any): number {
    const participants = candidate.participant_count || candidate.members || 0;
    const likes = candidate.likes || 0;
    const shares = candidate.shares || 0;

    const popularityMetric = participants + likes * 0.5 + shares * 2;

    if (popularityMetric > 1000) return 1.0;
    if (popularityMetric > 500) return 0.8;
    if (popularityMetric > 100) return 0.6;
    if (popularityMetric > 10) return 0.4;
    return 0.2;
  }

  /**
   * Enhance recommendation reason with context
   */
  private enhanceReasonWithContext(
    baseReason: string,
    context: ChatContext
  ): string {
    const enhancements: string[] = [baseReason];

    // Add journey stage context
    if (context.journeyStage === 'onboarding') {
      enhancements.push('Great for getting started');
    } else if (context.journeyStage === 'hero') {
      enhancements.push('Perfect for experienced climate heroes');
    }

    // Add location context
    if (context.location) {
      enhancements.push(`Available in ${context.location.county}`);
    }

    // Add current page context
    if (context.currentPage.includes('mission')) {
      enhancements.push('Related to your current mission interests');
    } else if (context.currentPage.includes('learning')) {
      enhancements.push('Complements your learning journey');
    }

    return enhancements.join('. ');
  }

  // ============================================================================
  // Scoring and Ranking
  // ============================================================================

  /**
   * Score a candidate content item
   */
  private scoreCandidate(
    candidate: any,
    request: RecommendationRequest,
    cohortPrefs: CohortPreferences,
    history: InteractionHistory
  ): RecommendationScore {
    // Base score from content quality/completeness
    const baseScore = 0.7;

    // Age-based score
    const ageScore = this.calculateAgeScore(
      candidate.type,
      request.ageCohort,
      cohortPrefs
    );

    // Context-based score
    const contextScore = this.calculateContextScore(candidate, request, history);

    // Adaptive weighting based on interaction count
    const weights = this.getAdaptiveWeights(history.totalInteractions);

    // Final score calculation
    const finalScore =
      baseScore * 0.2 +
      ageScore * weights.cohortWeight +
      contextScore * weights.personalWeight;

    return {
      id: candidate.id,
      type: candidate.type,
      baseScore,
      ageScore,
      contextScore,
      finalScore
    };
  }

  /**
   * Get adaptive weights based on user interaction history
   * Implements Property B13: Adaptive weighting by interaction count
   */
  private getAdaptiveWeights(totalInteractions: number): {
    cohortWeight: number;
    personalWeight: number;
  } {
    if (totalInteractions < 10) {
      return { cohortWeight: 0.8, personalWeight: 0.2 };
    } else if (totalInteractions <= 50) {
      return { cohortWeight: 0.5, personalWeight: 0.5 };
    } else {
      return { cohortWeight: 0.3, personalWeight: 0.7 };
    }
  }

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetch candidate content from database
   */
  private async fetchCandidateContent(
    request: RecommendationRequest
  ): Promise<any[]> {
    const candidates: any[] = [];

    try {
      // Fetch missions
      const { data: missions } = await supabase
        .from('missions')
        .select('*')
        .eq('status', 'upcoming')
        .limit(20);

      if (missions) {
        candidates.push(
          ...missions.map(m => ({ ...m, type: 'mission' as ContentType }))
        );
      }

      // Fetch learning modules
      const { data: modules } = await supabase
        .from('learning_modules')
        .select('*')
        .limit(20);

      if (modules) {
        candidates.push(
          ...modules.map(m => ({ ...m, type: 'educational' as ContentType }))
        );
      }

      // Fetch communities
      const { data: communities } = await supabase
        .from('communities')
        .select('*')
        .limit(20);

      if (communities) {
        candidates.push(
          ...communities.map(c => ({ ...c, type: 'community_post' as ContentType }))
        );
      }

      // Fetch petitions
      const { data: petitions } = await supabase
        .from('petitions')
        .select('*')
        .eq('status', 'active')
        .limit(20);

      if (petitions) {
        candidates.push(
          ...petitions.map(p => ({ ...p, type: 'petition' as ContentType }))
        );
      }

      // Filter by age appropriateness
      return candidates.filter(c =>
        this.isAgeAppropriate(c.type, request.ageCohort, c)
      );
    } catch (error) {
      console.error('Error fetching candidate content:', error);
      return [];
    }
  }

  /**
   * Get user's interaction history
   */
  private async getUserInteractionHistory(
    userId: string
  ): Promise<InteractionHistory> {
    try {
      const { data: interactions } = await supabase
        .from('content_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!interactions || interactions.length === 0) {
        return {
          totalInteractions: 0,
          contentTypeBreakdown: {} as Record<ContentType, number>,
          recentInteractions: [],
          engagementScore: 0,
          lastActivity: new Date()
        };
      }

      // Calculate content type breakdown
      const breakdown: Record<string, number> = {};
      interactions.forEach(i => {
        breakdown[i.content_type] = (breakdown[i.content_type] || 0) + 1;
      });

      return {
        totalInteractions: interactions.length,
        contentTypeBreakdown: breakdown as Record<ContentType, number>,
        recentInteractions: interactions.slice(0, 10).map(i => ({
          contentId: i.content_id,
          contentType: i.content_type,
          interactionType: i.interaction_type,
          timestamp: new Date(i.timestamp),
          metadata: i.metadata
        })),
        engagementScore: this.calculateEngagementScore(interactions),
        lastActivity: new Date(interactions[0].timestamp)
      };
    } catch (error) {
      console.error('Error fetching interaction history:', error);
      return {
        totalInteractions: 0,
        contentTypeBreakdown: {} as Record<ContentType, number>,
        recentInteractions: [],
        engagementScore: 0,
        lastActivity: new Date()
      };
    }
  }

  /**
   * Calculate overall engagement score
   */
  private calculateEngagementScore(interactions: any[]): number {
    if (interactions.length === 0) return 0;

    const weights: Record<string, number> = {
      impression: 0.1,
      click: 0.3,
      save: 0.5,
      join: 0.8,
      share: 0.7,
      complete: 1.0
    };

    const totalScore = interactions.reduce((sum, i) => {
      return sum + (weights[i.interaction_type] || 0.2);
    }, 0);

    return Math.min(totalScore / interactions.length, 1.0);
  }

  // ============================================================================
  // Conversion and Formatting
  // ============================================================================

  /**
   * Convert scored candidates to recommendations
   */
  private async convertToRecommendations(
    scoredCandidates: RecommendationScore[],
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const scored of scoredCandidates) {
      try {
        const content = await this.fetchContentDetails(scored.id, scored.type);
        if (!content) continue;

        recommendations.push({
          id: scored.id,
          type: this.mapContentTypeToRecommendationType(scored.type),
          title: content.title || content.name || 'Recommended Action',
          description: content.description || '',
          relevanceScore: scored.finalScore,
          reason: this.generateReason(scored, request),
          ageAppropriate: true,
          actionUrl: this.generateActionUrl(scored.type, scored.id),
          metadata: {
            contentType: scored.type,
            baseScore: scored.baseScore,
            ageScore: scored.ageScore,
            contextScore: scored.contextScore,
            generatedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error(`Error converting candidate ${scored.id}:`, error);
      }
    }

    return recommendations;
  }

  /**
   * Map content type to recommendation type
   */
  private mapContentTypeToRecommendationType(
    contentType: ContentType
  ): Recommendation['type'] {
    const mapping: Record<ContentType, Recommendation['type']> = {
      mission: 'mission',
      educational: 'learning',
      community_post: 'community',
      petition: 'petition',
      initiative: 'action',
      challenge: 'action',
      social_post: 'action'
    };

    return mapping[contentType] || 'action';
  }

  /**
   * Fetch full content details
   */
  private async fetchContentDetails(id: string, type: ContentType): Promise<any> {
    const tableMap: Record<ContentType, string> = {
      mission: 'missions',
      educational: 'learning_modules',
      community_post: 'communities',
      petition: 'petitions',
      initiative: 'initiatives',
      challenge: 'challenges',
      social_post: 'community_posts'
    };

    const table = tableMap[type];
    if (!table) return null;

    try {
      const { data } = await supabase.from(table).select('*').eq('id', id).single();
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      return null;
    }
  }

  /**
   * Generate reason for recommendation
   */
  private generateReason(
    scored: RecommendationScore,
    request: RecommendationRequest
  ): string {
    const reasons: string[] = [];

    // Age-based reason
    if (scored.ageScore > 0.7) {
      reasons.push('Popular with your age group');
    }

    // Interest-based reason
    if (request.userInterests.length > 0) {
      reasons.push(`Matches your interest in ${request.userInterests[0]}`);
    }

    // Location-based reason
    if (request.location) {
      reasons.push(`Available in ${request.location.county}`);
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return reasons.join('. ');
  }

  /**
   * Generate action URL for content
   */
  private generateActionUrl(type: ContentType, id: string): string {
    const urlMap: Record<ContentType, string> = {
      mission: `/missions/${id}`,
      educational: `/learning/${id}`,
      community_post: `/communities/${id}`,
      petition: `/petitions/${id}`,
      initiative: `/initiatives/${id}`,
      challenge: `/challenges/${id}`,
      social_post: `/social/${id}`
    };

    return urlMap[type] || `/content/${id}`;
  }

  // ============================================================================
  // Fallback and Error Handling
  // ============================================================================

  /**
   * Get fallback recommendations when main engine fails
   */
  private getFallbackRecommendations(
    request: RecommendationRequest
  ): Recommendation[] {
    const fallbacks: Recommendation[] = [];

    // Interest-based fallbacks
    if (request.userInterests.includes('trees')) {
      fallbacks.push({
        id: 'fallback-trees',
        type: 'mission',
        title: 'Join a Tree Planting Mission',
        description: 'Participate in local tree planting initiatives',
        relevanceScore: 0.7,
        reason: 'Based on your interest in trees',
        ageAppropriate: true
      });
    }

    if (request.userInterests.includes('waste')) {
      fallbacks.push({
        id: 'fallback-waste',
        type: 'mission',
        title: 'Community Cleanup Drive',
        description: 'Join a waste collection initiative',
        relevanceScore: 0.7,
        reason: 'Based on your interest in waste management',
        ageAppropriate: true
      });
    }

    // Age-appropriate fallbacks
    if (request.ageCohort === '13-17' || request.ageCohort === '18-24') {
      fallbacks.push({
        id: 'fallback-youth',
        type: 'learning',
        title: 'Climate Action for Youth',
        description: 'Learn about climate change and how you can make a difference',
        relevanceScore: 0.6,
        reason: 'Recommended for young climate activists',
        ageAppropriate: true
      });
    }

    // General fallback
    fallbacks.push({
      id: 'fallback-general',
      type: 'learning',
      title: 'Getting Started with Climate Action',
      description: 'Learn the basics of environmental conservation',
      relevanceScore: 0.5,
      reason: 'Recommended for all users',
      ageAppropriate: true
    });

    return fallbacks.slice(0, request.limit || 5);
  }

  /**
   * Track recommendation generation for analytics
   */
  private async trackRecommendationGeneration(
    userId: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    try {
      // This would be stored in a recommendation_analytics table
      console.log('Recommendation analytics:', {
        userId,
        count: recommendations.length,
        types: recommendations.map(r => r.type),
        avgScore: recommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / recommendations.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking recommendation analytics:', error);
    }
  }
}

export const recommendationEngineService = new RecommendationEngineService();
