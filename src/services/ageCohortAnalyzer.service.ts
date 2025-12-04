/**
 * Age Cohort Analyzer Service
 * 
 * Analyzes user age data to determine cohort membership and retrieve
 * cohort-specific preferences for content curation.
 * 
 * Requirements: B1.1, B2.1, B3.1, B7.2, B7.3
 */

import { supabase } from './supabase';
import {
  AgeCohort,
  ContentType,
  CohortPreferences,
  UserAgeCohort,
  FilterRule,
} from '../types/contentCuration.types';

// ============================================================================
// Default Cohort Preferences
// ============================================================================

/**
 * Default content type weights for each age cohort
 * Based on requirements B1.1, B2.1, B3.1
 */
const DEFAULT_COHORT_PREFERENCES: Record<AgeCohort, CohortPreferences> = {
  '13-17': {
    contentTypes: {
      initiative: 0.6,
      social_post: 0.9,
      challenge: 0.95,
      educational: 0.8,
      mission: 0.7,
      community_post: 0.85,
      petition: 0.5,
    },
    engagementPatterns: [
      { pattern: 'social_media_campaigns', weight: 0.95, confidence: 0.9 },
      { pattern: 'peer_challenges', weight: 0.9, confidence: 0.85 },
      { pattern: 'gamified_activities', weight: 0.95, confidence: 0.9 },
      { pattern: 'interactive_formats', weight: 0.9, confidence: 0.85 },
      { pattern: 'short_form_media', weight: 0.85, confidence: 0.8 },
    ],
    filterRules: [
      {
        type: 'exclude',
        condition: 'requires_financial_contribution',
        value: true,
        weight: 1.0,
      },
      {
        type: 'exclude',
        condition: 'requires_adult_status',
        value: true,
        weight: 1.0,
      },
      {
        type: 'boost',
        condition: 'digital_participation',
        value: true,
        weight: 0.3,
      },
      {
        type: 'boost',
        condition: 'social_sharing_enabled',
        value: true,
        weight: 0.25,
      },
    ],
    lastCalculated: new Date(),
  },
  '18-24': {
    contentTypes: {
      initiative: 0.75,
      social_post: 0.85,
      challenge: 0.9,
      educational: 0.8,
      mission: 0.8,
      community_post: 0.8,
      petition: 0.7,
    },
    engagementPatterns: [
      { pattern: 'social_media_campaigns', weight: 0.9, confidence: 0.85 },
      { pattern: 'peer_challenges', weight: 0.85, confidence: 0.8 },
      { pattern: 'gamified_activities', weight: 0.85, confidence: 0.8 },
      { pattern: 'digital_participation', weight: 0.8, confidence: 0.75 },
      { pattern: 'community_engagement', weight: 0.75, confidence: 0.7 },
    ],
    filterRules: [
      {
        type: 'penalize',
        condition: 'high_financial_requirement',
        value: true,
        weight: 0.4,
      },
      {
        type: 'boost',
        condition: 'digital_participation',
        value: true,
        weight: 0.25,
      },
      {
        type: 'boost',
        condition: 'social_sharing_enabled',
        value: true,
        weight: 0.2,
      },
    ],
    lastCalculated: new Date(),
  },
  '25-34': {
    contentTypes: {
      initiative: 0.9,
      social_post: 0.7,
      challenge: 0.75,
      educational: 0.8,
      mission: 0.85,
      community_post: 0.75,
      petition: 0.8,
    },
    engagementPatterns: [
      { pattern: 'donation_opportunities', weight: 0.9, confidence: 0.85 },
      { pattern: 'corporate_partnerships', weight: 0.85, confidence: 0.8 },
      { pattern: 'skilled_volunteering', weight: 0.85, confidence: 0.8 },
      { pattern: 'carbon_credit_investment', weight: 0.8, confidence: 0.75 },
      { pattern: 'team_based_activities', weight: 0.75, confidence: 0.7 },
    ],
    filterRules: [
      {
        type: 'boost',
        condition: 'donation_enabled',
        value: true,
        weight: 0.3,
      },
      {
        type: 'boost',
        condition: 'professional_skills_match',
        value: true,
        weight: 0.35,
      },
      {
        type: 'boost',
        condition: 'carbon_credit_available',
        value: true,
        weight: 0.25,
      },
    ],
    lastCalculated: new Date(),
  },
  '35-49': {
    contentTypes: {
      initiative: 0.95,
      social_post: 0.65,
      challenge: 0.7,
      educational: 0.75,
      mission: 0.85,
      community_post: 0.7,
      petition: 0.85,
    },
    engagementPatterns: [
      { pattern: 'donation_opportunities', weight: 0.95, confidence: 0.9 },
      { pattern: 'corporate_partnerships', weight: 0.9, confidence: 0.85 },
      { pattern: 'skilled_volunteering', weight: 0.9, confidence: 0.85 },
      { pattern: 'leadership_roles', weight: 0.85, confidence: 0.8 },
      { pattern: 'mentorship_opportunities', weight: 0.8, confidence: 0.75 },
    ],
    filterRules: [
      {
        type: 'boost',
        condition: 'donation_enabled',
        value: true,
        weight: 0.35,
      },
      {
        type: 'boost',
        condition: 'professional_skills_match',
        value: true,
        weight: 0.4,
      },
      {
        type: 'boost',
        condition: 'leadership_opportunity',
        value: true,
        weight: 0.3,
      },
    ],
    lastCalculated: new Date(),
  },
  '50+': {
    contentTypes: {
      initiative: 0.95,
      social_post: 0.6,
      challenge: 0.65,
      educational: 0.85,
      mission: 0.75,
      community_post: 0.65,
      petition: 0.9,
    },
    engagementPatterns: [
      { pattern: 'legacy_projects', weight: 0.95, confidence: 0.9 },
      { pattern: 'advisory_roles', weight: 0.9, confidence: 0.85 },
      { pattern: 'major_donations', weight: 0.9, confidence: 0.85 },
      { pattern: 'knowledge_sharing', weight: 0.85, confidence: 0.8 },
      { pattern: 'mentorship_opportunities', weight: 0.85, confidence: 0.8 },
      { pattern: 'low_physical_intensity', weight: 0.8, confidence: 0.75 },
      { pattern: 'remote_participation', weight: 0.8, confidence: 0.75 },
    ],
    filterRules: [
      {
        type: 'boost',
        condition: 'legacy_project',
        value: true,
        weight: 0.4,
      },
      {
        type: 'boost',
        condition: 'advisory_role',
        value: true,
        weight: 0.35,
      },
      {
        type: 'boost',
        condition: 'low_physical_intensity',
        value: true,
        weight: 0.3,
      },
      {
        type: 'boost',
        condition: 'remote_participation',
        value: true,
        weight: 0.25,
      },
      {
        type: 'boost',
        condition: 'long_term_impact',
        value: true,
        weight: 0.3,
      },
    ],
    lastCalculated: new Date(),
  },
};

// ============================================================================
// Age Cohort Analyzer Service
// ============================================================================

export class AgeCohortAnalyzerService {
  /**
   * Determines the age cohort for a given age
   * 
   * @param age - User's age in years
   * @returns AgeCohort classification
   * @throws Error if age is invalid (< 13 or > 120)
   */
  determineCohort(age: number): AgeCohort {
    // Validate age
    if (age < 13) {
      throw new Error('Users must be at least 13 years old to use the platform');
    }
    if (age > 120 || age <= 0) {
      throw new Error('Invalid age value');
    }

    // Determine cohort based on age ranges
    if (age >= 13 && age <= 17) return '13-17';
    if (age >= 18 && age <= 24) return '18-24';
    if (age >= 25 && age <= 34) return '25-34';
    if (age >= 35 && age <= 49) return '35-49';
    return '50+';
  }

  /**
   * Gets cohort preferences for a specific age cohort
   * Retrieves from database if available, otherwise returns defaults
   * 
   * @param cohort - Age cohort
   * @returns CohortPreferences for the cohort
   */
  async getCohortPreferences(cohort: AgeCohort): Promise<CohortPreferences> {
    try {
      // Try to fetch custom preferences from database
      const { data, error } = await supabase
        .from('curation_rules')
        .select('*')
        .eq('cohort', cohort)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.warn(`Failed to fetch cohort preferences for ${cohort}:`, error);
        return this.getDefaultPreferences(cohort);
      }

      // If custom rules exist, merge with defaults
      if (data && data.length > 0) {
        return this.mergePreferencesWithRules(cohort, data);
      }

      // Return default preferences
      return this.getDefaultPreferences(cohort);
    } catch (error) {
      console.error('Error fetching cohort preferences:', error);
      return this.getDefaultPreferences(cohort);
    }
  }

  /**
   * Gets default preferences for a cohort
   * 
   * @param cohort - Age cohort
   * @returns Default CohortPreferences
   */
  getDefaultPreferences(cohort: AgeCohort): CohortPreferences {
    return {
      ...DEFAULT_COHORT_PREFERENCES[cohort],
      lastCalculated: new Date(),
    };
  }

  /**
   * Analyzes a user's age and returns complete cohort information
   * 
   * @param age - User's age
   * @returns UserAgeCohort with cohort and preferences
   */
  async analyzeUser(age: number): Promise<UserAgeCohort> {
    const cohort = this.determineCohort(age);
    const preferences = await this.getCohortPreferences(cohort);

    return {
      cohort,
      age,
      preferences,
      lastUpdated: new Date(),
    };
  }

  /**
   * Updates cohort preferences based on engagement data
   * Implements adaptive learning from user behavior (Requirements B7.2, B7.3)
   * 
   * @param cohort - Age cohort to update
   * @param engagementData - Recent engagement metrics
   * @returns Updated CohortPreferences
   */
  async updateCohortPreferences(
    cohort: AgeCohort,
    engagementData: {
      contentType: ContentType;
      engagementRate: number;
      impressions: number;
      clicks: number;
    }[]
  ): Promise<CohortPreferences> {
    try {
      // Get current preferences
      const currentPreferences = await this.getCohortPreferences(cohort);

      // Calculate new weights based on engagement data
      const updatedContentTypes = { ...currentPreferences.contentTypes };

      for (const data of engagementData) {
        const currentWeight = updatedContentTypes[data.contentType] || 0.5;
        const engagementScore = data.engagementRate;

        // Adaptive adjustment: increase weight if engagement is high, decrease if low
        // Use a learning rate of 0.1 to make gradual adjustments
        const learningRate = 0.1;
        const adjustment = (engagementScore - 0.5) * learningRate;
        
        // Update weight, keeping it between 0.1 and 1.0
        updatedContentTypes[data.contentType] = Math.max(
          0.1,
          Math.min(1.0, currentWeight + adjustment)
        );
      }

      // Create updated preferences
      const updatedPreferences: CohortPreferences = {
        ...currentPreferences,
        contentTypes: updatedContentTypes,
        lastCalculated: new Date(),
      };

      // Store updated preferences in database
      await this.storeUpdatedPreferences(cohort, updatedPreferences);

      return updatedPreferences;
    } catch (error) {
      console.error('Error updating cohort preferences:', error);
      throw error;
    }
  }

  /**
   * Stores updated preferences in the database
   * 
   * @param cohort - Age cohort
   * @param preferences - Updated preferences
   */
  private async storeUpdatedPreferences(
    cohort: AgeCohort,
    preferences: CohortPreferences
  ): Promise<void> {
    try {
      // Store as a curation rule
      const { error } = await supabase
        .from('curation_rules')
        .upsert({
          cohort,
          rule_type: 'boost',
          condition: { type: 'content_type_weights' },
          action: { 
            type: 'multiply_score',
            value: preferences.contentTypes,
            reason: 'Adaptive learning from engagement data'
          },
          priority: 100,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to store updated preferences:', error);
      }
    } catch (error) {
      console.error('Error storing updated preferences:', error);
    }
  }

  /**
   * Merges default preferences with custom rules from database
   * 
   * @param cohort - Age cohort
   * @param rules - Custom rules from database
   * @returns Merged CohortPreferences
   */
  private mergePreferencesWithRules(
    cohort: AgeCohort,
    rules: any[]
  ): CohortPreferences {
    const defaultPrefs = this.getDefaultPreferences(cohort);
    
    // Apply custom rules to modify default preferences
    const customContentWeights = { ...defaultPrefs.contentTypes };
    const customFilterRules: FilterRule[] = [...defaultPrefs.filterRules];

    for (const rule of rules) {
      if (rule.action?.type === 'multiply_score' && rule.action?.value) {
        // Merge content type weights
        Object.assign(customContentWeights, rule.action.value);
      }

      if (rule.rule_type && rule.condition) {
        // Add custom filter rules
        customFilterRules.push({
          type: rule.rule_type,
          condition: JSON.stringify(rule.condition),
          value: rule.action?.value || true,
          weight: rule.priority / 100,
        });
      }
    }

    return {
      contentTypes: customContentWeights,
      engagementPatterns: defaultPrefs.engagementPatterns,
      filterRules: customFilterRules,
      lastCalculated: new Date(),
    };
  }

  /**
   * Gets engagement metrics for a cohort from the database
   * 
   * @param cohort - Age cohort
   * @param days - Number of days to look back (default: 7)
   * @returns Engagement data for the cohort
   */
  async getCohortEngagementMetrics(
    cohort: AgeCohort,
    days: number = 7
  ): Promise<{
    contentType: ContentType;
    engagementRate: number;
    impressions: number;
    clicks: number;
  }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('cohort_engagement_metrics')
        .select('*')
        .eq('cohort', cohort)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Failed to fetch engagement metrics:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Aggregate metrics by content type
      const aggregated = new Map<ContentType, {
        impressions: number;
        clicks: number;
      }>();

      for (const metric of data) {
        const contentType = metric.content_type as ContentType;
        const existing = aggregated.get(contentType) || { impressions: 0, clicks: 0 };
        
        aggregated.set(contentType, {
          impressions: existing.impressions + (metric.impressions || 0),
          clicks: existing.clicks + (metric.clicks || 0),
        });
      }

      // Calculate engagement rates
      return Array.from(aggregated.entries()).map(([contentType, metrics]) => ({
        contentType,
        engagementRate: metrics.impressions > 0 
          ? metrics.clicks / metrics.impressions 
          : 0,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
      }));
    } catch (error) {
      console.error('Error fetching cohort engagement metrics:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ageCohortAnalyzer = new AgeCohortAnalyzerService();
