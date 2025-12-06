/**
 * Mission Service - Enhanced with Error Handling
 * 
 * This is an example showing how to integrate error handling into services.
 * Apply this pattern to all service methods.
 * 
 * Requirements: C1.1, C1.3, C7.1
 */

import { supabase } from './supabase';
import { withServiceErrorHandling, missionErrors, databaseErrors } from '../utils/serviceErrorHandler';
import { withErrorHandling } from '../utils/apiClient';
import type {
  Mission,
  MissionFilters,
  MissionParticipation,
  MissionWithOrganizer,
  MissionWithParticipation,
} from '../types/mission.types';

/**
 * Get all missions with optional filtering
 * 
 * Enhanced with:
 * - Service-level error handling
 * - API client error handling with retry and circuit breaker
 * - Domain-specific error throwing
 */
export async function getMissions(
  filters?: MissionFilters,
  limit: number = 50,
  offset: number = 0
): Promise<{ missions: MissionWithOrganizer[]; total: number }> {
  return withServiceErrorHandling(
    async () => {
      // Build query
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

      // Order by start date
      query = query.order('start_date', { ascending: true });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute with error handling
      const result = await withErrorHandling(
        async () => await query,
        'missions-list',
        { filters, limit, offset }
      ) as { data: any[] | null; count: number | null };

      // Transform the data
      const missions = (result.data || []).map((mission: any) => ({
        ...mission,
        organizer: mission.organizer ? {
          id: mission.organizer.id,
          display_name: mission.organizer.user_profiles?.display_name || 'Unknown',
          avatar: mission.organizer.user_profiles?.avatar,
        } : undefined,
      }));

      return {
        missions,
        total: result.count || 0,
      };
    },
    {
      service: 'MissionService',
      method: 'getMissions',
      params: { filters, limit, offset },
    }
  );
}

/**
 * Get a single mission by ID
 * 
 * Enhanced with domain-specific error throwing
 */
export async function getMissionById(
  missionId: string,
  userId?: string
): Promise<MissionWithParticipation | null> {
  return withServiceErrorHandling(
    async () => {
      // Fetch mission with error handling
      const result = await withErrorHandling(
        async () => await supabase
          .from('missions')
          .select(`
            *,
            organizer:users!missions_organizer_id_fkey(
              id,
              user_profiles(display_name, avatar)
            )
          `)
          .eq('id', missionId)
          .single(),
        'mission-detail',
        { missionId }
      ) as { data: any | null };

      // If no data, throw domain-specific error
      if (!result.data) {
        throw missionErrors.notFound(missionId);
      }

      // Get user participation if userId provided
      let userParticipation: MissionParticipation | undefined;
      if (userId) {
        try {
          const participationResult = await withErrorHandling(
            async () => await supabase
              .from('mission_participations')
              .select('*')
              .eq('mission_id', missionId)
              .eq('user_id', userId)
              .single(),
            'mission-participation',
            { missionId, userId }
          ) as { data: any | null };

          userParticipation = participationResult.data || undefined;
        } catch (error) {
          // Participation not found is not an error - user hasn't joined yet
          userParticipation = undefined;
        }
      }

      const mission = result.data;
      
      return {
        ...mission,
        organizer: mission.organizer ? {
          id: mission.organizer.id,
          display_name: mission.organizer.user_profiles?.display_name || 'Unknown',
          avatar: mission.organizer.user_profiles?.avatar,
        } : undefined,
        user_participation: userParticipation,
      };
    },
    {
      service: 'MissionService',
      method: 'getMissionById',
      userId,
      params: { missionId },
    }
  );
}

/**
 * Join a mission
 * 
 * Enhanced with validation and domain-specific errors
 */
export async function joinMission(
  missionId: string,
  userId: string
): Promise<MissionParticipation> {
  return withServiceErrorHandling(
    async () => {
      // Check if mission exists
      const mission = await getMissionById(missionId);
      if (!mission) {
        throw missionErrors.notFound(missionId);
      }

      // Check if user already joined
      if (mission.user_participation) {
        throw missionErrors.alreadyJoined(missionId, userId);
      }

      // Check capacity (if applicable)
      // This would require additional logic based on mission type

      // Join the mission
      const joinResult = await withErrorHandling(
        async () => await supabase
          .from('mission_participations')
          .insert({
            mission_id: missionId,
            user_id: userId,
            verification_status: 'pending',
          })
          .select()
          .single(),
        'mission-join',
        { missionId, userId }
      ) as { data: any | null };

      if (!joinResult.data) {
        throw databaseErrors.queryFailed('insert mission_participations');
      }

      // Update participant count
      await withErrorHandling(
        async () => await supabase.rpc('increment_mission_participants', {
          mission_id: missionId,
        }),
        'mission-increment-participants',
        { missionId }
      );

      return joinResult.data;
    },
    {
      service: 'MissionService',
      method: 'joinMission',
      userId,
      params: { missionId },
    }
  );
}

/**
 * Submit verification evidence for a mission
 * 
 * Enhanced with validation
 */
export async function submitVerificationEvidence(
  missionId: string,
  userId: string,
  evidence: {
    files: Array<{ url: string; metadata: any }>;
    description: string;
  }
): Promise<void> {
  return withServiceErrorHandling(
    async () => {
      // Validate evidence
      if (!evidence.files || evidence.files.length === 0) {
        throw missionErrors.verificationRequired(missionId, {
          reason: 'At least one file is required',
        });
      }

      // Check if user has joined the mission
      const participation = await withErrorHandling(
        async () => await supabase
          .from('mission_participations')
          .select('*')
          .eq('mission_id', missionId)
          .eq('user_id', userId)
          .single(),
        'mission-participation-check',
        { missionId, userId }
      ) as { data: any | null };

      if (!participation || !participation.data) {
        throw missionErrors.notFound(missionId, {
          reason: 'User has not joined this mission',
        });
      }

      // Submit evidence
      await withErrorHandling(
        async () => await supabase
          .from('verification_evidence')
          .insert({
            action_id: missionId,
            user_id: userId,
            evidence_type: 'photo',
            files: evidence.files,
            description: evidence.description,
          }),
        'mission-submit-evidence',
        { missionId, userId }
      );

      // Update participation status
      await withErrorHandling(
        async () => await supabase
          .from('mission_participations')
          .update({ verification_status: 'submitted' })
          .eq('mission_id', missionId)
          .eq('user_id', userId),
        'mission-update-verification-status',
        { missionId, userId }
      );
    },
    {
      service: 'MissionService',
      method: 'submitVerificationEvidence',
      userId,
      params: { missionId },
    }
  );
}

/**
 * Example of how to use the enhanced service in a component:
 * 
 * ```typescript
 * try {
 *   const { missions, total } = await getMissions(filters);
 *   // Handle success
 * } catch (error) {
 *   // Error is already logged and categorized
 *   // Display user-friendly message
 *   if (error instanceof AppError) {
 *     showNotification(error.message, error.severity);
 *   }
 * }
 * ```
 */
