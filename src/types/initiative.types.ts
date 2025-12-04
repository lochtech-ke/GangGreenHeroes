/**
 * Initiative Types
 * Type definitions for conservation initiatives
 */

import type { AgeCohort } from './platform.types';

export type ForestType = 'kakamega' | 'karura' | 'mau';
export type InitiativeStatus = 'active' | 'completed' | 'paused';

// GeoJSON Point type
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Initiative {
  id: string;
  title: string;
  description: string | null;
  forest: ForestType;
  target_trees: number;
  trees_planted: number;
  start_date: string;
  end_date: string | null;
  status: InitiativeStatus;
  location: GeoPoint;
  area_hectares: number | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  // Age targeting fields
  min_age?: number | null;
  max_age?: number | null;
  target_cohorts?: AgeCohort[] | null;
  // Computed fields
  participant_count?: number;
  progress_percentage?: number;
}

export interface InitiativeParticipant {
  id: string;
  initiative_id: string;
  user_id: string;
  trees_contributed: number;
  joined_at: string;
  // Joined data
  user_name?: string;
  user_avatar?: string;
}

export interface InitiativeProgress {
  progress_percentage: number;
  trees_remaining: number;
  days_remaining?: number;
  is_on_track: boolean;
}

export interface InitiativeFilters {
  forest?: ForestType;
  status?: InitiativeStatus;
  search?: string;
}

export interface InitiativeStats {
  totalInitiatives: number;
  activeInitiatives: number;
  totalTrees: number;
  totalParticipants: number;
}

export interface CreateInitiativeData {
  title: string;
  description: string;
  forest: ForestType;
  target_trees: number;
  start_date: string;
  end_date?: string;
  location: GeoPoint;
  area_hectares?: number;
  organization_id: string;
  // Age targeting fields
  min_age?: number;
  max_age?: number;
  target_cohorts?: AgeCohort[];
}

export interface AgeTargetingOption {
  label: string;
  value: 'all' | 'custom' | AgeCohort;
  description: string;
  cohorts?: AgeCohort[];
}
