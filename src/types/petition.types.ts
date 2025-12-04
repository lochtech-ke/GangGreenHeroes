/**
 * Petition and Policy Engagement Types
 * Task 20: Policy Engagement Tools
 */

export type PetitionTargetAudience = 'county' | 'national' | 'international';
export type PetitionStatus = 'active' | 'closed' | 'successful' | 'archived';

export interface Petition {
  id: string;
  title: string;
  description: string;
  target_audience: PetitionTargetAudience;
  target_organization: string;
  signature_goal: number;
  current_signatures: number;
  deadline: string;
  status: PetitionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PetitionSignature {
  id: string;
  petition_id: string;
  user_id: string;
  signed_at: string;
  public_display: boolean;
  comment?: string;
}

export interface PetitionUpdate {
  id: string;
  petition_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
}

export interface PetitionWithCreator extends Petition {
  creator?: {
    id: string;
    display_name: string;
    avatar?: string;
  };
}

export interface PetitionWithDetails extends PetitionWithCreator {
  signatures?: PetitionSignature[];
  updates?: PetitionUpdate[];
  user_signed?: boolean;
}

export interface PetitionFilters {
  status?: PetitionStatus;
  target_audience?: PetitionTargetAudience;
  search?: string;
  created_by?: string;
}

export interface CreatePetitionData {
  title: string;
  description: string;
  target_audience: PetitionTargetAudience;
  target_organization: string;
  signature_goal: number;
  deadline: string;
}

export interface SignPetitionData {
  petition_id: string;
  public_display?: boolean;
  comment?: string;
}

export interface CreatePetitionUpdateData {
  petition_id: string;
  title: string;
  content: string;
}
