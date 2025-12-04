/**
 * User Profile Service
 * Handles user profile updates with age change detection
 * Requirements: B5.4
 */

import { supabase } from './supabase';
import { ageCohortAnalyzer } from './ageCohortAnalyzer.service';

export interface UpdateProfileData {
  full_name?: string;
  age?: number;
  date_of_birth?: string;
  phone?: string;
  organization?: string;
  location?: string;
  avatar_url?: string;
  curation_enabled?: boolean;
  curation_preferences?: {
    allow_age_based?: boolean;
    allow_engagement_tracking?: boolean;
  };
}

/**
 * Update user profile with age change detection
 * Triggers relevance score recalculation when age changes
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<{ success: boolean; error?: Error }> {
  try {
    // Get current profile to detect age changes
    const { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('age, age_cohort')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const oldAge = currentProfile?.age;
    const oldCohort = currentProfile?.age_cohort;

    // Calculate new age from date_of_birth if provided
    let newAge = updates.age;
    if (updates.date_of_birth && !newAge) {
      const birthDate = new Date(updates.date_of_birth);
      const today = new Date();
      newAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        newAge--;
      }
    }

    // Determine new cohort if age changed
    let newCohort = oldCohort;
    if (newAge !== undefined && newAge !== oldAge) {
      newCohort = ageCohortAnalyzer.determineCohort(newAge);
    }

    // Update profile
    const updateData: any = { ...updates };
    if (newAge !== undefined) {
      updateData.age = newAge;
      updateData.age_cohort = newCohort;
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // If age or cohort changed, trigger relevance score recalculation
    if (newAge !== oldAge || newCohort !== oldCohort) {
      await recalculateRelevanceScores(userId, newCohort);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Recalculate relevance scores for all content when user's age cohort changes
 * This ensures content curation reflects the user's new demographic
 */
async function recalculateRelevanceScores(userId: string, newCohort: string): Promise<void> {
  try {
    // Mark all existing scores as stale by setting a recalculation flag
    // In a production system, this would trigger a background job
    await supabase
      .from('relevance_scores')
      .update({ needs_recalculation: true })
      .eq('user_id', userId);

    // Log the cohort change for analytics
    await supabase.from('cohort_engagement_metrics').insert({
      cohort: newCohort,
      user_id: userId,
      event_type: 'cohort_change',
      timestamp: new Date().toISOString(),
    });

    console.log(`Triggered relevance score recalculation for user ${userId} (new cohort: ${newCohort})`);
  } catch (error) {
    console.error('Error recalculating relevance scores:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Get user profile with all fields
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { profile: null, error: error as Error };
  }
}

export const userProfileService = {
  updateUserProfile,
  getUserProfile,
};
