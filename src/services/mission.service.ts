/**
 * Mission Service
 * Handles all mission-related operations including browsing, participation, and verification
 */

import { supabase } from './supabase';
import { ggCoinService, type RewardMultiplier } from './ggCoin.service';
import type {
  Mission,
  MissionFilters,
  MissionParticipation,
  MissionWithOrganizer,
  MissionWithParticipation,
  VerificationEvidence,
} from '../types/mission.types';

/**
 * Get all missions with optional filtering
 */
export async function getMissions(
  filters?: MissionFilters,
  limit: number = 50,
  offset: number = 0
): Promise<{ missions: MissionWithOrganizer[]; total: number }> {
  let query = supabase
    .from('missions')
    .select(`
      *,
      organizer:users!missions_organizer_id_fkey(
        id,
        user_profiles(display_name, avatar)
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.mission_type && filters.mission_type.length > 0) {
    query = query.in('mission_type', filters.mission_type);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.location) {
    query = query.ilike('location_name', `%${filters.location}%`);
  }

  if (filters?.start_date_from) {
    query = query.gte('start_date', filters.start_date_from);
  }

  if (filters?.start_date_to) {
    query = query.lte('start_date', filters.start_date_to);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Order by start date (upcoming first, then by date)
  query = query.order('start_date', { ascending: true });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch missions: ${error.message}`);
  }

  // Transform the data to flatten organizer info
  const missions = (data || []).map((mission: any) => ({
    ...mission,
    organizer: mission.organizer ? {
      id: mission.organizer.id,
      display_name: mission.organizer.user_profiles?.display_name || 'Unknown',
      avatar: mission.organizer.user_profiles?.avatar,
    } : undefined,
  }));

  return {
    missions,
    total: count || 0,
  };
}

/**
 * Get a single mission by ID with organizer info
 */
export async function getMissionById(
  missionId: string,
  userId?: string
): Promise<MissionWithParticipation | null> {
  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      organizer:users!missions_organizer_id_fkey(
        id,
        user_profiles(display_name, avatar)
      )
    `)
    .eq('id', missionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Mission not found
    }
    throw new Error(`Failed to fetch mission: ${error.message}`);
  }

  // Get user participation if userId provided
  let userParticipation: MissionParticipation | undefined;
  if (userId) {
    const { data: participationData } = await supabase
      .from('mission_participations')
      .select('*')
      .eq('mission_id', missionId)
      .eq('user_id', userId)
      .single();

    userParticipation = participationData || undefined;
  }

  return {
    ...data,
    organizer: data.organizer ? {
      id: data.organizer.id,
      display_name: data.organizer.user_profiles?.display_name || 'Unknown',
      avatar: data.organizer.user_profiles?.avatar,
    } : undefined,
    user_participation: userParticipation,
  };
}

/**
 * Join a mission
 */
export async function joinMission(
  missionId: string,
  userId: string
): Promise<MissionParticipation> {
  const { data, error } = await supabase
    .from('mission_participations')
    .insert({
      mission_id: missionId,
      user_id: userId,
      verification_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already joined this mission');
    }
    throw new Error(`Failed to join mission: ${error.message}`);
  }

  return data;
}

/**
 * Leave a mission
 */
export async function leaveMission(
  missionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('mission_participations')
    .delete()
    .eq('mission_id', missionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to leave mission: ${error.message}`);
  }
}

/**
 * Update mission participation contribution
 */
export async function updateParticipationContribution(
  participationId: string,
  contribution: {
    contribution_metric?: string;
    contribution_value?: number;
  }
): Promise<MissionParticipation> {
  const { data, error } = await supabase
    .from('mission_participations')
    .update(contribution)
    .eq('id', participationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contribution: ${error.message}`);
  }

  return data;
}

/**
 * Submit verification evidence for a mission
 */
export async function submitVerificationEvidence(
  evidence: {
    action_id: string;
    action_type: string;
    user_id: string;
    evidence_type: 'photo' | 'video' | 'gps' | 'document';
    files: {
      url: string;
      metadata?: {
        gps_coordinates?: [number, number];
        timestamp?: string;
        filename?: string;
      };
    }[];
    description?: string;
    gps_coordinates?: [number, number];
  }
): Promise<VerificationEvidence> {
  // Convert gps_coordinates to PostGIS format if provided
  const gpsData = evidence.gps_coordinates
    ? `POINT(${evidence.gps_coordinates[0]} ${evidence.gps_coordinates[1]})`
    : null;

  const { data, error } = await supabase
    .from('verification_evidence')
    .insert({
      action_id: evidence.action_id,
      action_type: evidence.action_type,
      user_id: evidence.user_id,
      evidence_type: evidence.evidence_type,
      files: evidence.files,
      description: evidence.description,
      gps_coordinates: gpsData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit evidence: ${error.message}`);
  }

  // Update participation status to 'submitted'
  await supabase
    .from('mission_participations')
    .update({ verification_status: 'submitted' })
    .eq('mission_id', evidence.action_id)
    .eq('user_id', evidence.user_id);

  return data;
}

/**
 * Get verification evidence for a mission participation
 */
export async function getVerificationEvidence(
  actionId: string,
  userId: string
): Promise<VerificationEvidence[]> {
  const { data, error } = await supabase
    .from('verification_evidence')
    .select('*')
    .eq('action_id', actionId)
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch evidence: ${error.message}`);
  }

  return data || [];
}

/**
 * Get missions the user has joined
 */
export async function getUserMissions(
  userId: string
): Promise<MissionWithParticipation[]> {
  const { data, error } = await supabase
    .from('mission_participations')
    .select(`
      *,
      mission:missions(
        *,
        organizer:users!missions_organizer_id_fkey(
          id,
          user_profiles(display_name, avatar)
        )
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user missions: ${error.message}`);
  }

  return (data || []).map((participation: any) => ({
    ...participation.mission,
    organizer: participation.mission.organizer ? {
      id: participation.mission.organizer.id,
      display_name: participation.mission.organizer.user_profiles?.display_name || 'Unknown',
      avatar: participation.mission.organizer.user_profiles?.avatar,
    } : undefined,
    user_participation: {
      id: participation.id,
      mission_id: participation.mission_id,
      user_id: participation.user_id,
      joined_at: participation.joined_at,
      contribution_metric: participation.contribution_metric,
      contribution_value: participation.contribution_value,
      verification_status: participation.verification_status,
      verified_at: participation.verified_at,
    },
  }));
}

/**
 * Upload file to Supabase storage
 */
export async function uploadVerificationFile(
  file: File,
  userId: string,
  missionId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${missionId}/${Date.now()}.${fileExt}`;
  const filePath = `verification/${fileName}`;

  const { error } = await supabase.storage
    .from('mission-evidence')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('mission-evidence')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Create a new mission
 */
export async function createMission(
  mission: Omit<Mission, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'participant_count'>
): Promise<Mission> {
  const { data, error } = await supabase
    .from('missions')
    .insert(mission)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create mission: ${error.message}`);
  }

  return data;
}

/**
 * Update a mission
 */
export async function updateMission(
  missionId: string,
  updates: Partial<Mission>
): Promise<Mission> {
  const { data, error } = await supabase
    .from('missions')
    .update(updates)
    .eq('id', missionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update mission: ${error.message}`);
  }

  return data;
}

/**
 * Delete a mission
 */
export async function deleteMission(missionId: string): Promise<void> {
  const { error } = await supabase
    .from('missions')
    .delete()
    .eq('id', missionId);

  if (error) {
    throw new Error(`Failed to delete mission: ${error.message}`);
  }
}

/**
 * Complete a mission and award GG Coins
 * Called when a mission participation is verified and approved
 * Requirements: B3.1, B4.1
 */
export async function completeMission(
  userId: string,
  missionId: string,
  options?: {
    teamParticipation?: boolean;
    earlyCompletion?: boolean;
  }
): Promise<{
  success: boolean;
  coinsAwarded: number;
  error: Error | null;
}> {
  try {
    // Get mission details
    const mission = await getMissionById(missionId);
    if (!mission) {
      return {
        success: false,
        coinsAwarded: 0,
        error: new Error('Mission not found'),
      };
    }

    // Determine multipliers based on mission completion
    const multipliers: RewardMultiplier[] = [];

    if (options?.teamParticipation) {
      multipliers.push({ condition: 'team_participation', factor: 1.3 });
    }

    if (options?.earlyCompletion) {
      multipliers.push({ condition: 'early_completion', factor: 1.2 });
    }

    // Award GG Coins for mission completion
    // Use the mission's green_coin_reward if available, otherwise use base reward
    const baseReward = mission.green_coin_reward || 100;
    
    // Calculate the reward using the base reward from the mission
    const calculatedReward = ggCoinService.calculateReward(
      'mission_completion',
      1,
      multipliers
    );
    
    // If mission has a custom reward, use that as the base instead
    const finalReward = mission.green_coin_reward 
      ? baseReward * (multipliers.reduce((acc, m) => acc * m.factor, 1))
      : calculatedReward;

    // Credit the coins directly
    const transaction = await ggCoinService.creditCoins(
      userId,
      finalReward,
      'earn',
      `Completed mission: ${mission.title}`,
      {
        missionId,
        missionTitle: mission.title,
        missionType: mission.mission_type,
        teamParticipation: options?.teamParticipation,
        earlyCompletion: options?.earlyCompletion,
      }
    );

    const coinsAwarded = transaction?.amount || 0;

    return {
      success: true,
      coinsAwarded,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      coinsAwarded: 0,
      error: error instanceof Error ? error : new Error('Failed to complete mission'),
    };
  }
}
