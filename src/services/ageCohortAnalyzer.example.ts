/**
 * Age Cohort Analyzer Service - Usage Examples
 * 
 * This file demonstrates how to use the AgeCohortAnalyzerService
 * in various scenarios throughout the application.
 */

import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';
import { AgeCohort, ContentType } from '../types/contentCuration.types';

// ============================================================================
// Example 1: Determine User's Age Cohort
// ============================================================================

export async function determineUserCohort(age: number): Promise<AgeCohort> {
  try {
    // Simple cohort determination
    const cohort = ageCohortAnalyzer.determineCohort(age);
    console.log(`User age ${age} belongs to cohort: ${cohort}`);
    return cohort;
  } catch (error) {
    console.error('Error determining cohort:', error);
    throw error;
  }
}

// ============================================================================
// Example 2: Get Complete User Analysis
// ============================================================================

export async function analyzeNewUser(age: number) {
  try {
    // Get complete cohort analysis with preferences
    const analysis = await ageCohortAnalyzer.analyzeUser(age);
    
    console.log('User Analysis:', {
      cohort: analysis.cohort,
      age: analysis.age,
      topContentTypes: Object.entries(analysis.preferences.contentTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type, weight]) => ({ type, weight })),
      engagementPatterns: analysis.preferences.engagementPatterns
        .slice(0, 3)
        .map(p => p.pattern),
    });
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing user:', error);
    throw error;
  }
}

// ============================================================================
// Example 3: Get Cohort Preferences for Content Curation
// ============================================================================

export async function getCurationPreferences(cohort: AgeCohort) {
  try {
    // Fetch preferences for a specific cohort
    const preferences = await ageCohortAnalyzer.getCohortPreferences(cohort);
    
    console.log(`Preferences for ${cohort} cohort:`, {
      contentTypeWeights: preferences.contentTypes,
      filterRuleCount: preferences.filterRules.length,
      engagementPatternCount: preferences.engagementPatterns.length,
    });
    
    return preferences;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    throw error;
  }
}

// ============================================================================
// Example 4: Update Cohort Preferences Based on Engagement
// ============================================================================

export async function updatePreferencesFromEngagement(cohort: AgeCohort) {
  try {
    // Fetch recent engagement metrics
    const engagementData = await ageCohortAnalyzer.getCohortEngagementMetrics(cohort, 7);
    
    if (engagementData.length === 0) {
      console.log('No engagement data available for updates');
      return;
    }
    
    console.log(`Updating preferences for ${cohort} based on ${engagementData.length} content types`);
    
    // Update preferences based on engagement
    const updatedPreferences = await ageCohortAnalyzer.updateCohortPreferences(
      cohort,
      engagementData
    );
    
    console.log('Updated preferences:', {
      contentTypeWeights: updatedPreferences.contentTypes,
      lastCalculated: updatedPreferences.lastCalculated,
    });
    
    return updatedPreferences;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

// ============================================================================
// Example 5: Batch Process Multiple Users
// ============================================================================

export async function batchAnalyzeUsers(users: Array<{ id: string; age: number }>) {
  const results = [];
  
  for (const user of users) {
    try {
      const analysis = await ageCohortAnalyzer.analyzeUser(user.age);
      results.push({
        userId: user.id,
        cohort: analysis.cohort,
        preferences: analysis.preferences,
      });
    } catch (error) {
      console.error(`Error analyzing user ${user.id}:`, error);
      results.push({
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

// ============================================================================
// Example 6: Get Content Type Recommendations for a Cohort
// ============================================================================

export async function getRecommendedContentTypes(cohort: AgeCohort): Promise<ContentType[]> {
  try {
    const preferences = await ageCohortAnalyzer.getCohortPreferences(cohort);
    
    // Sort content types by weight and return top 5
    const recommended = Object.entries(preferences.contentTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type as ContentType);
    
    console.log(`Recommended content types for ${cohort}:`, recommended);
    
    return recommended;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

// ============================================================================
// Example 7: Check if Content is Appropriate for Age
// ============================================================================

export async function isContentAppropriateForAge(
  age: number,
  contentRequirements: {
    requiresAdultStatus?: boolean;
    requiresFinancialContribution?: boolean;
    minAge?: number;
    maxAge?: number;
  }
): Promise<boolean> {
  try {
    const cohort = ageCohortAnalyzer.determineCohort(age);
    const preferences = await ageCohortAnalyzer.getCohortPreferences(cohort);
    
    // Check age restrictions
    if (contentRequirements.minAge && age < contentRequirements.minAge) {
      return false;
    }
    if (contentRequirements.maxAge && age > contentRequirements.maxAge) {
      return false;
    }
    
    // Check filter rules
    for (const rule of preferences.filterRules) {
      if (rule.type === 'exclude') {
        if (
          rule.condition === 'requires_adult_status' &&
          contentRequirements.requiresAdultStatus &&
          age < 18
        ) {
          return false;
        }
        if (
          rule.condition === 'requires_financial_contribution' &&
          contentRequirements.requiresFinancialContribution &&
          cohort === '13-17'
        ) {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking content appropriateness:', error);
    return false;
  }
}

// ============================================================================
// Example 8: Scheduled Job to Update All Cohort Preferences
// ============================================================================

export async function scheduledCohortPreferenceUpdate() {
  const cohorts: AgeCohort[] = ['13-17', '18-24', '25-34', '35-49', '50+'];
  
  console.log('Starting scheduled cohort preference update...');
  
  for (const cohort of cohorts) {
    try {
      await updatePreferencesFromEngagement(cohort);
      console.log(`✓ Updated preferences for ${cohort}`);
    } catch (error) {
      console.error(`✗ Failed to update preferences for ${cohort}:`, error);
    }
  }
  
  console.log('Scheduled update complete');
}

// ============================================================================
// Example Usage in Application
// ============================================================================

/*
// In user registration flow:
const userAge = 25;
const cohortAnalysis = await analyzeNewUser(userAge);
await saveUserProfile({ ...userData, ageCohort: cohortAnalysis.cohort });

// In content curation service:
const userCohort = user.ageCohort || ageCohortAnalyzer.determineCohort(user.age);
const preferences = await getCurationPreferences(userCohort);
const contentScores = calculateRelevanceScores(content, preferences);

// In admin dashboard:
await scheduledCohortPreferenceUpdate(); // Run daily

// In content filtering:
const isAppropriate = await isContentAppropriateForAge(user.age, {
  requiresAdultStatus: true,
  requiresFinancialContribution: false,
});
*/
