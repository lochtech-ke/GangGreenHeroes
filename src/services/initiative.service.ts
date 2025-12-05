/**
 * Initiative Service
 * Handles all initiative-related operations
 */

import { supabase } from './supabase';
import { governanceTokenEarningService } from './governanceTokenEarning.service';
import type {
  Initiative,
  InitiativeFilters,
  InitiativeStats,
  CreateInitiativeData,
} from '../types/initiative.types';

/**
 * Fetch all initiatives with optional filtering
 */
export async function getInitiatives(
  filters?: InitiativeFilters
): Promise<Initiative[]> {
  let query = supabase
    .from('initiatives')
    .select(`
      *,
      participant_count:initiative_participants(count)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.forest) {
    query = query.eq('forest', filters.forest);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching initiatives:', error);
    throw new Error(`Failed to fetch initiatives: ${error.message}`);
  }

  // Calculate progress percentage for each initiative
  return (data || []).map((initiative) => ({
    ...initiative,
    participant_count: initiative.participant_count?.[0]?.count || 0,
    progress_percentage:
      initiative.target_trees > 0
        ? Math.min((initiative.trees_planted / initiative.target_trees) * 100, 100)
        : 0,
  }));
}

/**
 * Fetch a single initiative by ID
 */
export async function getInitiativeById(id: string) {
  const { data, error } = await supabase
    .from('initiatives')
    .select(`
      *,
      participant_count:initiative_participants(count)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return { initiative: null, error };
  }

  const initiative = {
    ...data,
    participant_count: data.participant_count?.[0]?.count || 0,
    progress_percentage:
      data.target_trees > 0
        ? Math.min((data.trees_planted / data.target_trees) * 100, 100)
        : 0,
  };

  return { initiative, error: null };
}

/**
 * Create a new initiative
 */
export async function createInitiative(initiativeData: CreateInitiativeData) {
  const { data, error } = await supabase
    .from('initiatives')
    .insert({
      ...initiativeData,
      location: `POINT(${initiativeData.location.coordinates[0]} ${initiativeData.location.coordinates[1]})`,
      min_age: initiativeData.min_age || null,
      max_age: initiativeData.max_age || null,
      target_cohorts: initiativeData.target_cohorts || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { initiative: null, error };
  }

  const initiative = {
    ...data,
    participant_count: 0,
    progress_percentage: 0,
  };

  // Award governance tokens for initiative creation (Requirement 1.2)
  // Get current user from auth
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    await governanceTokenEarningService.awardForInitiativeCreation(
      userData.user.id,
      data.id,
      {
        initiative_title: initiativeData.title,
        forest: initiativeData.forest,
      }
    );
  }

  return { initiative, error: null };
}

/**
 * Join an initiative as a participant
 */
export async function joinInitiative(initiativeId: string, userId: string) {
  const { data, error } = await supabase
    .from('initiative_participants')
    .insert({
      initiative_id: initiativeId,
      user_id: userId,
      trees_contributed: 0,
    })
    .select()
    .single();

  // Award governance tokens for initiative participation (Requirement 1.3)
  if (data && !error) {
    await governanceTokenEarningService.awardForInitiativeParticipation(
      userId,
      initiativeId,
      {
        joined_at: new Date().toISOString(),
      }
    );
  }

  return { participant: data, error };
}

/**
 * Leave an initiative
 */
export async function leaveInitiative(initiativeId: string, userId: string) {
  const { error } = await supabase
    .from('initiative_participants')
    .delete()
    .eq('initiative_id', initiativeId)
    .eq('user_id', userId);

  return { error };
}

/**
 * Check if current user is participating in an initiative
 */
export async function isParticipating(initiativeId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from('initiative_participants')
    .select('id')
    .eq('initiative_id', initiativeId)
    .eq('user_id', userData.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking participation:', error);
  }

  return !!data;
}

/**
 * Get participants for an initiative
 */
export async function getInitiativeParticipants(initiativeId: string) {
  const { data, error } = await supabase
    .from('initiative_participants')
    .select(`
      *,
      user:users!user_id(
        id,
        user_profiles(full_name, avatar_url)
      )
    `)
    .eq('initiative_id', initiativeId)
    .order('trees_contributed', { ascending: false });

  const participants = (data || []).map((participant: any) => ({
    ...participant,
    user_name: participant.user?.user_profiles?.[0]?.full_name || 'Anonymous',
    user_avatar: participant.user?.user_profiles?.[0]?.avatar_url,
  }));

  return { participants, error };
}

/**
 * Get initiative statistics
 */
export async function getInitiativeStats(): Promise<InitiativeStats> {
  // Get total initiatives
  const { count: totalInitiatives } = await supabase
    .from('initiatives')
    .select('*', { count: 'exact', head: true });

  // Get active initiatives
  const { count: activeInitiatives } = await supabase
    .from('initiatives')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get total trees planted
  const { data: treesData } = await supabase
    .from('initiatives')
    .select('trees_planted');

  const totalTrees = (treesData || []).reduce(
    (sum, init) => sum + (init.trees_planted || 0),
    0
  );

  // Get total participants (unique users)
  const { count: totalParticipants } = await supabase
    .from('initiative_participants')
    .select('user_id', { count: 'exact', head: true });

  return {
    totalInitiatives: totalInitiatives || 0,
    activeInitiatives: activeInitiatives || 0,
    totalTrees,
    totalParticipants: totalParticipants || 0,
  };
}

// Alias methods to match component expectations
export const getInitiative = getInitiativeById;
export const getParticipants = getInitiativeParticipants;

// Calculate progress for an initiative
export async function calculateProgress(initiativeId: string) {
  const { initiative, error } = await getInitiativeById(initiativeId);
  if (error || !initiative) return null;

  const progressPercentage = initiative.target_trees > 0
    ? Math.min((initiative.trees_planted / initiative.target_trees) * 100, 100)
    : 0;

  const treesRemaining = Math.max(initiative.target_trees - initiative.trees_planted, 0);

  let daysRemaining: number | undefined;
  let isOnTrack = true;

  if (initiative.end_date) {
    const endDate = new Date(initiative.end_date);
    const today = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0 && treesRemaining > 0) {
      const requiredRate = treesRemaining / daysRemaining;
      const startDate = new Date(initiative.start_date);
      const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const actualRate = daysSinceStart > 0 ? initiative.trees_planted / daysSinceStart : 0;
      isOnTrack = actualRate >= requiredRate;
    }
  }

  return {
    progress_percentage: Math.round(progressPercentage),
    trees_remaining: treesRemaining,
    days_remaining: daysRemaining,
    is_on_track: isOnTrack,
  };
}

// Update participant contribution
export async function updateParticipantContribution(
  initiativeId: string,
  userId: string,
  treesContributed: number
) {
  const { data, error } = await supabase
    .from('initiative_participants')
    .update({ trees_contributed: treesContributed })
    .eq('initiative_id', initiativeId)
    .eq('user_id', userId)
    .select()
    .single();

  return { participant: data, error };
}

// Export as service object
export const initiativeService = {
  getInitiatives,
  getInitiativeById,
  getInitiative,
  createInitiative,
  joinInitiative,
  leaveInitiative,
  isParticipating,
  getInitiativeParticipants,
  getParticipants,
  getInitiativeStats,
  calculateProgress,
  updateParticipantContribution,
};
