/**
 * Mission Types
 * Type definitions for the Climate Missions system
 */

export type MissionType = 
  | 'tree_planting' 
  | 'waste_cleanup' 
  | 'water_conservation' 
  | 'petition' 
  | 'fundraising';

export type MissionStatus = 
  | 'upcoming' 
  | 'active' 
  | 'completed' 
  | 'cancelled';

export type VerificationStatus = 
  | 'pending' 
  | 'submitted' 
  | 'approved' 
  | 'rejected';

export interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: MissionType;
  organizer_id: string;
  location_name?: string;
  location_coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  start_date?: string;
  end_date?: string;
  target_metric?: string;
  target_value?: number;
  current_value: number;
  participant_count: number;
  green_coin_reward: number;
  verification_required: boolean;
  status: MissionStatus;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MissionParticipation {
  id: string;
  mission_id: string;
  user_id: string;
  joined_at: string;
  contribution_metric?: string;
  contribution_value?: number;
  verification_status: VerificationStatus;
  verified_at?: string;
}

export interface VerificationEvidence {
  id: string;
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
  gps_coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
  submitted_at: string;
}

export interface VerificationReview {
  id: string;
  evidence_id: string;
  reviewer_id?: string;
  reviewer_organization?: string;
  status: 'approved' | 'rejected' | 'needs_more_info';
  comments?: string;
  reviewed_at: string;
}

export interface MissionFilters {
  mission_type?: MissionType[];
  status?: MissionStatus[];
  location?: string;
  start_date_from?: string;
  start_date_to?: string;
  search?: string;
}

export interface MissionWithOrganizer extends Mission {
  organizer?: {
    id: string;
    display_name: string;
    avatar?: string;
  };
}

export interface MissionWithParticipation extends MissionWithOrganizer {
  user_participation?: MissionParticipation;
}
