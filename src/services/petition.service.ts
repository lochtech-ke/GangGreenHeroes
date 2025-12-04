/**
 * Petition Service
 * Task 20: Policy Engagement Tools
 * 
 * Handles petition creation, browsing, signing, and updates
 */

import { supabase } from './supabase';
import { ggCoinService } from './ggCoin.service';
import type {
  Petition,
  PetitionWithCreator,
  PetitionWithDetails,
  PetitionFilters,
  CreatePetitionData,
  SignPetitionData,
  CreatePetitionUpdateData,
  PetitionSignature,
  PetitionUpdate,
} from '../types/petition.types';

/**
 * Get all petitions with optional filtering
 */
export async function getPetitions(
  filters?: PetitionFilters,
  limit: number = 20,
  offset: number = 0
): Promise<{ petitions: PetitionWithCreator[]; total: number }> {
  try {
    let query = supabase
      .from('petitions')
      .select(`
        *,
        creator:created_by (
          id,
          user_profiles (
            display_name,
            avatar
          )
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      // Default to active petitions
      query = query.in('status', ['active', 'successful']);
    }

    if (filters?.target_audience) {
      query = query.eq('target_audience', filters.target_audience);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Order by deadline (soonest first) for active petitions
    query = query.order('deadline', { ascending: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform the data to match our interface
    const petitions: PetitionWithCreator[] = (data || []).map((petition: any) => ({
      ...petition,
      creator: petition.creator ? {
        id: petition.creator.id,
        display_name: petition.creator.user_profiles?.display_name || 'Anonymous',
        avatar: petition.creator.user_profiles?.avatar,
      } : undefined,
    }));

    return {
      petitions,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching petitions:', error);
    throw error;
  }
}

/**
 * Get a single petition by ID with full details
 */
export async function getPetitionById(
  petitionId: string,
  userId?: string
): Promise<PetitionWithDetails | null> {
  try {
    // Fetch petition with creator info
    const { data: petition, error: petitionError } = await supabase
      .from('petitions')
      .select(`
        *,
        creator:created_by (
          id,
          user_profiles (
            display_name,
            avatar
          )
        )
      `)
      .eq('id', petitionId)
      .single();

    if (petitionError) throw petitionError;
    if (!petition) return null;

    // Fetch recent signatures (public only)
    const { data: signatures, error: signaturesError } = await supabase
      .from('petition_signatures')
      .select('*')
      .eq('petition_id', petitionId)
      .eq('public_display', true)
      .order('signed_at', { ascending: false })
      .limit(10);

    if (signaturesError) throw signaturesError;

    // Fetch updates
    const { data: updates, error: updatesError } = await supabase
      .from('petition_updates')
      .select('*')
      .eq('petition_id', petitionId)
      .order('created_at', { ascending: false });

    if (updatesError) throw updatesError;

    // Check if current user has signed
    let userSigned = false;
    if (userId) {
      const { data: userSignature } = await supabase
        .from('petition_signatures')
        .select('id')
        .eq('petition_id', petitionId)
        .eq('user_id', userId)
        .single();

      userSigned = !!userSignature;
    }

    return {
      ...petition,
      creator: petition.creator ? {
        id: petition.creator.id,
        display_name: petition.creator.user_profiles?.display_name || 'Anonymous',
        avatar: petition.creator.user_profiles?.avatar,
      } : undefined,
      signatures: signatures || [],
      updates: updates || [],
      user_signed: userSigned,
    };
  } catch (error) {
    console.error('Error fetching petition details:', error);
    throw error;
  }
}

/**
 * Create a new petition
 */
export async function createPetition(
  data: CreatePetitionData,
  userId: string
): Promise<Petition> {
  try {
    const { data: petition, error } = await supabase
      .from('petitions')
      .insert({
        ...data,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return petition;
  } catch (error) {
    console.error('Error creating petition:', error);
    throw error;
  }
}

/**
 * Sign a petition
 */
export async function signPetition(
  data: SignPetitionData,
  userId: string
): Promise<PetitionSignature> {
  try {
    const { data: signature, error } = await supabase
      .from('petition_signatures')
      .insert({
        petition_id: data.petition_id,
        user_id: userId,
        public_display: data.public_display ?? true,
        comment: data.comment,
      })
      .select()
      .single();

    if (error) {
      // Check if user already signed
      if (error.code === '23505') {
        throw new Error('You have already signed this petition');
      }
      throw error;
    }

    // Award GG Coins for signing the petition
    try {
      // Get petition details for metadata
      const { data: petition } = await supabase
        .from('petitions')
        .select('title, target_audience')
        .eq('id', data.petition_id)
        .single();

      // Calculate reward amount (10 GG Coins base for petition signature)
      const rewardAmount = ggCoinService.calculateReward('petition_signature', 1);

      // Credit coins with detailed metadata
      await ggCoinService.creditCoins(
        userId,
        rewardAmount,
        'earn',
        `Signed petition: ${petition?.title || 'Unknown Petition'}`,
        {
          actionType: 'petition_signature',
          petitionId: data.petition_id,
          petitionTitle: petition?.title || 'Unknown Petition',
          targetAudience: petition?.target_audience,
        }
      );

      console.log(`Awarded ${rewardAmount} GG Coins for signing petition: ${data.petition_id}`);
    } catch (coinError) {
      // Log error but don't fail the signature
      console.error('Failed to award GG Coins for petition signature:', coinError);
    }

    return signature;
  } catch (error) {
    console.error('Error signing petition:', error);
    throw error;
  }
}

/**
 * Remove signature from a petition
 */
export async function unsignPetition(
  petitionId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('petition_signatures')
      .delete()
      .eq('petition_id', petitionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing signature:', error);
    throw error;
  }
}

/**
 * Get petition signatures with user details
 */
export async function getPetitionSignatures(
  petitionId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ signatures: any[]; total: number }> {
  try {
    const { data, error, count } = await supabase
      .from('petition_signatures')
      .select(`
        *,
        user:user_id (
          id,
          user_profiles (
            display_name,
            avatar
          )
        )
      `, { count: 'exact' })
      .eq('petition_id', petitionId)
      .eq('public_display', true)
      .order('signed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      signatures: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching signatures:', error);
    throw error;
  }
}

/**
 * Create a petition update
 */
export async function createPetitionUpdate(
  data: CreatePetitionUpdateData,
  userId: string
): Promise<PetitionUpdate> {
  try {
    // Verify user is the petition creator
    const { data: petition, error: petitionError } = await supabase
      .from('petitions')
      .select('created_by')
      .eq('id', data.petition_id)
      .single();

    if (petitionError) throw petitionError;
    if (!petition) throw new Error('Petition not found');
    if (petition.created_by !== userId) {
      throw new Error('Only petition creator can post updates');
    }

    const { data: update, error } = await supabase
      .from('petition_updates')
      .insert({
        petition_id: data.petition_id,
        title: data.title,
        content: data.content,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return update;
  } catch (error) {
    console.error('Error creating petition update:', error);
    throw error;
  }
}

/**
 * Update petition status
 */
export async function updatePetitionStatus(
  petitionId: string,
  status: 'active' | 'closed' | 'successful' | 'archived',
  userId: string
): Promise<Petition> {
  try {
    // Verify user is the petition creator
    const { data: petition, error: petitionError } = await supabase
      .from('petitions')
      .select('created_by')
      .eq('id', petitionId)
      .single();

    if (petitionError) throw petitionError;
    if (!petition) throw new Error('Petition not found');
    if (petition.created_by !== userId) {
      throw new Error('Only petition creator can update status');
    }

    const { data: updatedPetition, error } = await supabase
      .from('petitions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', petitionId)
      .select()
      .single();

    if (error) throw error;

    return updatedPetition;
  } catch (error) {
    console.error('Error updating petition status:', error);
    throw error;
  }
}

/**
 * Get petition statistics
 */
export async function getPetitionStats(petitionId: string): Promise<{
  total_signatures: number;
  progress_percentage: number;
  days_remaining: number;
  signatures_today: number;
}> {
  try {
    const { data: petition, error } = await supabase
      .from('petitions')
      .select('signature_goal, current_signatures, deadline')
      .eq('id', petitionId)
      .single();

    if (error) throw error;
    if (!petition) throw new Error('Petition not found');

    const progressPercentage = Math.min(
      100,
      Math.round((petition.current_signatures / petition.signature_goal) * 100)
    );

    const deadline = new Date(petition.deadline);
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Get signatures from today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: signaturesToday } = await supabase
      .from('petition_signatures')
      .select('id', { count: 'exact', head: true })
      .eq('petition_id', petitionId)
      .gte('signed_at', todayStart.toISOString());

    return {
      total_signatures: petition.current_signatures,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      signatures_today: signaturesToday || 0,
    };
  } catch (error) {
    console.error('Error fetching petition stats:', error);
    throw error;
  }
}

/**
 * Close expired petitions (should be called periodically)
 */
export async function closeExpiredPetitions(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('close_expired_petitions');

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error('Error closing expired petitions:', error);
    throw error;
  }
}
