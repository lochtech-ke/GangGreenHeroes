/**
 * Reach Estimation Service
 * Calculates estimated reach for age-targeted content
 * Requirements: B6.2
 */

import { supabase } from './supabase';
import type { AgeCohort } from '../types/platform.types';

export interface ReachEstimateParams {
  min_age?: number;
  max_age?: number;
  target_cohorts?: AgeCohort[];
}

export interface ReachEstimateResult {
  estimatedReach: number;
  breakdown: {
    cohort: AgeCohort;
    userCount: number;
  }[];
  totalPlatformUsers: number;
  percentageOfPlatform: number;
}

/**
 * Calculate estimated reach for age-targeted content
 * Returns the number of users who would see the content based on age targeting
 */
export async function calculateReach(params: ReachEstimateParams): Promise<ReachEstimateResult> {
  try {
    // If no targeting specified, return all users
    if (!params.min_age && !params.max_age && (!params.target_cohorts || params.target_cohorts.length === 0)) {
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      return {
        estimatedReach: totalUsers || 0,
        breakdown: [],
        totalPlatformUsers: totalUsers || 0,
        percentageOfPlatform: 100,
      };
    }

    // Get total platform users for percentage calculation
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const totalPlatformUsers = totalUsers || 0;

    // Calculate reach based on targeting type
    let estimatedReach = 0;
    const breakdown: { cohort: AgeCohort; userCount: number }[] = [];

    if (params.target_cohorts && params.target_cohorts.length > 0) {
      // Cohort-based targeting
      for (const cohort of params.target_cohorts) {
        const { count } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('age_cohort', cohort);

        const userCount = count || 0;
        estimatedReach += userCount;
        breakdown.push({ cohort, userCount });
      }
    } else if (params.min_age !== undefined || params.max_age !== undefined) {
      // Custom age range targeting
      let query = supabase
        .from('user_profiles')
        .select('age, age_cohort', { count: 'exact' });

      if (params.min_age !== undefined) {
        query = query.gte('age', params.min_age);
      }
      if (params.max_age !== undefined) {
        query = query.lte('age', params.max_age);
      }

      const { data, count } = await query;
      estimatedReach = count || 0;

      // Group by cohort for breakdown
      if (data) {
        const cohortCounts = new Map<AgeCohort, number>();
        data.forEach((user: any) => {
          if (user.age_cohort) {
            cohortCounts.set(
              user.age_cohort,
              (cohortCounts.get(user.age_cohort) || 0) + 1
            );
          }
        });

        cohortCounts.forEach((userCount, cohort) => {
          breakdown.push({ cohort, userCount });
        });
      }
    }

    const percentageOfPlatform = totalPlatformUsers > 0
      ? (estimatedReach / totalPlatformUsers) * 100
      : 0;

    return {
      estimatedReach,
      breakdown,
      totalPlatformUsers,
      percentageOfPlatform: Math.round(percentageOfPlatform * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Error calculating reach:', error);
    // Return conservative estimate on error
    return {
      estimatedReach: 0,
      breakdown: [],
      totalPlatformUsers: 0,
      percentageOfPlatform: 0,
    };
  }
}

/**
 * Get cohort distribution for the platform
 * Useful for understanding platform demographics
 */
export async function getCohortDistribution(): Promise<Map<AgeCohort, number>> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('age_cohort');

    if (error || !data) {
      return new Map();
    }

    const distribution = new Map<AgeCohort, number>();
    data.forEach((user: any) => {
      if (user.age_cohort) {
        distribution.set(
          user.age_cohort,
          (distribution.get(user.age_cohort) || 0) + 1
        );
      }
    });

    return distribution;
  } catch (error) {
    console.error('Error getting cohort distribution:', error);
    return new Map();
  }
}

/**
 * Estimate reach for multiple targeting options
 * Useful for comparing different targeting strategies
 */
export async function compareReachEstimates(
  options: ReachEstimateParams[]
): Promise<ReachEstimateResult[]> {
  const results = await Promise.all(
    options.map(option => calculateReach(option))
  );
  return results;
}

export const reachEstimationService = {
  calculateReach,
  getCohortDistribution,
  compareReachEstimates,
};
