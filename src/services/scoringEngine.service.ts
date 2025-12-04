/**
 * Scoring Engine Service
 * 
 * Calculates relevance scores for content items based on user age cohort,
 * personal interaction history, and content characteristics.
 * 
 * Implements hybrid personalization strategy with adaptive weighting:
 * - <10 interactions: 80% cohort / 20% personal
 * - 10-50 interactions: 50% cohort / 50% personal
 * - >50 interactions: 30% cohort / 70% personal
 * 
 * Requirements: B8.1, B8.2, B8.3, B8.5
 */

import {
  ScoringContext,
  ScoringResult,
  ScoringFactor,
  CuratedContentItem,
  InteractionHistory,
  CohortPreferences,
} from '../types/contentCuration.types';

// ============================================================================
// Weighting Strategy Configuration
// ============================================================================

interface WeightingStrategy {
  cohortWeight: number;
  personalWeight: number;
  description: string;
}

/**
 * Weighting strategies based on interaction count
 * Requirements: B8.1, B8.2, B8.3
 */
const WEIGHTING_STRATEGIES: Record<string, WeightingStrategy> = {
  new_user: {
    cohortWeight: 0.8,
    personalWeight: 0.2,
    description: 'New user with limited history (<10 interactions)',
  },
  developing_user: {
    cohortWeight: 0.5,
    personalWeight: 0.5,
    description: 'Developing user with moderate history (10-50 interactions)',
  },
  established_user: {
    cohortWeight: 0.3,
    personalWeight: 0.7,
    description: 'Established user with extensive history (>50 interactions)',
  },
};

// ============================================================================
// Boost Configuration
// ============================================================================

interface BoostRule {
  condition: (item: CuratedContentItem, context: ScoringContext) => boolean;
  multiplier: number;
  reason: string;
}

/**
 * Content-specific boost rules
 * Requirement: B8.5
 */
const BOOST_RULES: BoostRule[] = [
  {
    condition: (item, ctx) => {
      // Boost content matching user interests
      const userInterests = ctx.user.interests || [];
      const itemCategories = item.metadata?.categories || [];
      return userInterests.some(interest => 
        itemCategories.includes(interest)
      );
    },
    multiplier: 1.3,
    reason: 'Matches user interests',
  },
  {
    condition: (item, ctx) => {
      // Boost content from user's location
      const userCounty = ctx.user.location?.county;
      const itemCounty = item.metadata?.location?.county;
      return userCounty && itemCounty && userCounty === itemCounty;
    },
    multiplier: 1.25,
    reason: 'Local content from user county',
  },
  {
    condition: (item, _ctx) => {
      // Boost recently created content (within 7 days)
      const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    },
    multiplier: 1.15,
    reason: 'Recent content (within 7 days)',
  },
  {
    condition: (item, ctx) => {
      // Boost content types user has engaged with recently
      const recentTypes = ctx.personalHistory.recentInteractions
        .slice(0, 5)
        .map(i => i.contentType);
      return recentTypes.includes(item.type);
    },
    multiplier: 1.2,
    reason: 'Recently engaged content type',
  },
  {
    condition: (item, _ctx) => {
      // Boost high-engagement content (if metadata available)
      const engagementRate = item.metadata?.engagementRate;
      return engagementRate && engagementRate > 0.5;
    },
    multiplier: 1.1,
    reason: 'High engagement rate',
  },
  {
    condition: (item, ctx) => {
    // Penalize content user has already interacted with
      const interactedIds = ctx.personalHistory.recentInteractions
        .map(i => i.contentId);
      return interactedIds.includes(item.id);
    },
    multiplier: 0.5,
    reason: 'Already interacted with',
  },
];

// ============================================================================
// Scoring Engine Service
// ============================================================================

export class ScoringEngineService {
  /**
   * Determines the weighting strategy based on user interaction count
   * 
   * Requirements: B8.1, B8.2, B8.3
   * - <10 interactions: 80% cohort / 20% personal
   * - 10-50 interactions: 50% cohort / 50% personal
   * - >50 interactions: 30% cohort / 70% personal
   * 
   * @param interactionCount - Total number of user interactions
   * @returns WeightingStrategy with cohort and personal weights
   */
  getWeightingStrategy(interactionCount: number): WeightingStrategy {
    if (interactionCount < 10) {
      return WEIGHTING_STRATEGIES.new_user;
    } else if (interactionCount >= 10 && interactionCount <= 50) {
      return WEIGHTING_STRATEGIES.developing_user;
    } else {
      return WEIGHTING_STRATEGIES.established_user;
    }
  }

  /**
   * Calculates cohort-based score for a content item
   * 
   * Uses cohort preferences to determine how well content matches
   * the typical preferences of the user's age group
   * 
   * @param item - Content item to score
   * @param cohortPreferences - Preferences for user's cohort
   * @returns Score between 0 and 100
   */
  private calculateCohortScore(
    item: CuratedContentItem,
    cohortPreferences: CohortPreferences
  ): number {
    // Get base weight for this content type from cohort preferences
    const contentTypeWeight = cohortPreferences.contentTypes[item.type] || 0.5;
    
    // Start with content type weight (0-1) scaled to 0-100
    let score = contentTypeWeight * 100;

    // Apply filter rules from cohort preferences
    for (const rule of cohortPreferences.filterRules) {
      const conditionMet = this.evaluateFilterCondition(item, rule.condition, rule.value);
      
      if (conditionMet) {
        switch (rule.type) {
          case 'boost':
            score *= (1 + rule.weight);
            break;
          case 'penalize':
            score *= (1 - rule.weight);
            break;
          case 'exclude':
            return 0; // Exclude this content entirely
          case 'include':
            score *= (1 + rule.weight * 0.5);
            break;
        }
      }
    }

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates personal score based on user's interaction history
   * 
   * Analyzes user's past behavior to determine relevance
   * 
   * @param item - Content item to score
   * @param history - User's interaction history
   * @returns Score between 0 and 100
   */
  private calculatePersonalScore(
    item: CuratedContentItem,
    history: InteractionHistory
  ): number {
    // If no history, return neutral score
    if (history.totalInteractions === 0) {
      return 50;
    }

    // Calculate content type affinity
    const contentTypeInteractions = history.contentTypeBreakdown[item.type] || 0;
    const contentTypeAffinity = contentTypeInteractions / history.totalInteractions;

    // Start with content type affinity (0-1) scaled to 0-100
    let score = contentTypeAffinity * 100;

    // Boost if similar to recent interactions
    const recentSimilarity = this.calculateRecentSimilarity(item, history);
    score += recentSimilarity * 20; // Up to +20 points

    // Factor in overall engagement score
    score *= (0.7 + history.engagementScore * 0.3); // Multiply by 0.7-1.0

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates similarity to recent interactions
   * 
   * @param item - Content item
   * @param history - Interaction history
   * @returns Similarity score between 0 and 1
   */
  private calculateRecentSimilarity(
    item: CuratedContentItem,
    history: InteractionHistory
  ): number {
    const recentInteractions = history.recentInteractions.slice(0, 10);
    
    if (recentInteractions.length === 0) {
      return 0;
    }

    // Count matches with recent interactions
    let matches = 0;
    
    for (const interaction of recentInteractions) {
      // Same content type
      if (interaction.contentType === item.type) {
        matches += 0.5;
      }
      
      // Same category (if available)
      if (interaction.metadata?.category && item.metadata?.category) {
        if (interaction.metadata.category === item.metadata.category) {
          matches += 0.3;
        }
      }
      
      // Same location (if available)
      if (interaction.metadata?.location && item.metadata?.location) {
        if (interaction.metadata.location === item.metadata.location) {
          matches += 0.2;
        }
      }
    }

    // Normalize by number of recent interactions
    return Math.min(1, matches / recentInteractions.length);
  }

  /**
   * Evaluates a filter condition against a content item
   * 
   * @param item - Content item
   * @param condition - Condition string
   * @param value - Expected value
   * @returns True if condition is met
   */
  private evaluateFilterCondition(
    item: CuratedContentItem,
    condition: string,
    value: any
  ): boolean {
    // Parse condition and check against item metadata
    switch (condition) {
      case 'requires_financial_contribution':
        return item.metadata?.requiresFinancialContribution === value;
      
      case 'requires_adult_status':
        return item.metadata?.requiresAdultStatus === value;
      
      case 'digital_participation':
        return item.metadata?.digitalParticipation === value;
      
      case 'social_sharing_enabled':
        return item.metadata?.socialSharingEnabled === value;
      
      case 'donation_enabled':
        return item.metadata?.donationEnabled === value;
      
      case 'professional_skills_match':
        return item.metadata?.requiresProfessionalSkills === value;
      
      case 'carbon_credit_available':
        return item.metadata?.carbonCreditAvailable === value;
      
      case 'leadership_opportunity':
        return item.metadata?.leadershipOpportunity === value;
      
      case 'legacy_project':
        return item.metadata?.legacyProject === value;
      
      case 'advisory_role':
        return item.metadata?.advisoryRole === value;
      
      case 'low_physical_intensity':
        return item.metadata?.physicalIntensity === 'low' || item.metadata?.lowPhysicalIntensity === value;
      
      case 'remote_participation':
        return item.metadata?.remoteParticipation === value;
      
      case 'long_term_impact':
        return item.metadata?.longTermImpact === value;
      
      case 'high_financial_requirement':
        return item.metadata?.highFinancialRequirement === value;
      
      default:
        // For unknown conditions, check if the condition exists in metadata
        return item.metadata?.[condition] === value;
    }
  }

  /**
   * Applies content-specific boosts to the score
   * 
   * Requirement: B8.5
   * 
   * @param item - Content item
   * @param baseScore - Base score before boosts
   * @param context - Scoring context
   * @returns Boosted score and applied factors
   */
  applyBoosts(
    item: CuratedContentItem,
    baseScore: number,
    context: ScoringContext
  ): { score: number; factors: ScoringFactor[] } {
    let boostedScore = baseScore;
    const factors: ScoringFactor[] = [];

    // Apply each boost rule
    for (const rule of BOOST_RULES) {
      if (rule.condition(item, context)) {
        const previousScore = boostedScore;
        boostedScore *= rule.multiplier;
        
        factors.push({
          name: rule.reason,
          weight: rule.multiplier,
          contribution: boostedScore - previousScore,
          reason: rule.reason,
        });
      }
    }

    // Ensure score stays within 0-100 range
    boostedScore = Math.max(0, Math.min(100, boostedScore));

    return { score: boostedScore, factors };
  }

  /**
   * Calculates the final relevance score for a content item
   * 
   * Combines cohort-based and personal scoring with adaptive weighting
   * based on user interaction history
   * 
   * Requirements: B8.1, B8.2, B8.3, B8.5
   * 
   * @param item - Content item to score
   * @param context - Scoring context with user info and history
   * @returns ScoringResult with detailed breakdown
   */
  calculateScore(
    item: CuratedContentItem,
    context: ScoringContext
  ): ScoringResult {
    // Step 1: Determine weighting strategy based on interaction count
    const strategy = this.getWeightingStrategy(
      context.personalHistory.totalInteractions
    );

    // Step 2: Calculate cohort-based score
    const cohortScore = this.calculateCohortScore(
      item,
      context.cohortPreferences
    );

    // Step 3: Calculate personal score
    const personalScore = this.calculatePersonalScore(
      item,
      context.personalHistory
    );

    // Step 4: Combine scores using adaptive weighting
    const baseScore = 
      (cohortScore * strategy.cohortWeight) +
      (personalScore * strategy.personalWeight);

    // Step 5: Apply content-specific boosts
    const { score: finalScore, factors: boostFactors } = this.applyBoosts(
      item,
      baseScore,
      context
    );

    // Build scoring factors for transparency
    const factors: ScoringFactor[] = [
      {
        name: 'Cohort Score',
        weight: strategy.cohortWeight,
        contribution: cohortScore * strategy.cohortWeight,
        reason: `Age cohort ${context.cohort} preferences`,
      },
      {
        name: 'Personal Score',
        weight: strategy.personalWeight,
        contribution: personalScore * strategy.personalWeight,
        reason: `Based on ${context.personalHistory.totalInteractions} interactions`,
      },
      ...boostFactors,
    ];

    return {
      contentId: item.id,
      baseScore,
      cohortScore,
      personalScore,
      finalScore,
      factors,
      calculatedAt: new Date(),
    };
  }

  /**
   * Batch calculates scores for multiple content items
   * 
   * More efficient than calling calculateScore multiple times
   * 
   * @param items - Array of content items
   * @param context - Scoring context
   * @returns Array of scoring results
   */
  calculateScores(
    items: CuratedContentItem[],
    context: ScoringContext
  ): ScoringResult[] {
    return items.map(item => this.calculateScore(item, context));
  }

  /**
   * Sorts content items by relevance score
   * 
   * @param items - Content items with scores
   * @param context - Scoring context
   * @returns Sorted array of items with scores
   */
  sortByRelevance(
    items: CuratedContentItem[],
    context: ScoringContext
  ): Array<{ item: CuratedContentItem; score: ScoringResult }> {
    const scored = items.map(item => ({
      item,
      score: this.calculateScore(item, context),
    }));

    return scored.sort((a, b) => b.score.finalScore - a.score.finalScore);
  }

  /**
   * Gets the top N most relevant items
   * 
   * @param items - Content items to score
   * @param context - Scoring context
   * @param limit - Number of items to return
   * @returns Top N items sorted by relevance
   */
  getTopItems(
    items: CuratedContentItem[],
    context: ScoringContext,
    limit: number
  ): Array<{ item: CuratedContentItem; score: ScoringResult }> {
    const sorted = this.sortByRelevance(items, context);
    return sorted.slice(0, limit);
  }
}

// Export singleton instance
export const scoringEngine = new ScoringEngineService();
