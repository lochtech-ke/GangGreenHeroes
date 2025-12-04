export type UserRole = 'admin' | 'organization' | 'community' | 'individual';
export type ForestPreference = 'kakamega' | 'karura' | 'mau';

// Legacy types for backward compatibility
export interface UserProfile {
  full_name: string;
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

export interface User {
  id: string;
  email: string;
  role: UserRole;
  forest_preference?: ForestPreference;
  created_at: string;
  profile?: UserProfile;
  age_cohort?: '13-17' | '18-24' | '25-34' | '35-49' | '50+';
  user_metadata?: Record<string, any>;
  user_type?: 'individual' | 'corporate' | 'community' | 'partner';
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  role?: UserRole;
  forest_preference?: ForestPreference;
  phone?: string;
  organization?: string;
  location?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}
