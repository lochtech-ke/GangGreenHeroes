/**
 * Platform Types
 * Type definitions for V1.0 Major Release platform entities
 */

// ============================================================================
// Core Platform Types
// ============================================================================

export type UserType = 'individual' | 'corporate' | 'community' | 'partner';
export type PlatformJourneyStage = 'onboarding' | 'engagement' | 'contribution' | 'recognition' | 'hero';
export type PlatformBadgeTier = 'steward' | 'platinum' | 'hero';
export type ClimateInterest = 'trees' | 'water' | 'waste' | 'policy';

export interface PlatformUser {
  id: string;
  email: string;
  phone?: string;
  userType: UserType;
  climateInterests: ClimateInterest[];
  age?: number;
  ageCohort?: AgeCohort;
  journeyStage: PlatformJourneyStage;
  badgeTier: PlatformBadgeTier;
  ggCoins: number;
  treesPlanted: number;
  curationEnabled: boolean;
  createdAt: Date;
}

export interface PlatformUserProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  location: { county: string; subCounty?: string };
  bio?: string;
  dateOfBirth?: Date;
  isAmbassador: boolean;
  referralCode: string;
  referredBy?: string;
}

// ============================================================================
// AI Climate Companion (Green Mentor)
// ============================================================================

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    userInterests: string[];
    ageCohort?: AgeCohort;
    currentPage: string;
    recentActions: string[];
  };
}

export interface AIRecommendation {
  id: string;
  type: 'mission' | 'learning' | 'community' | 'petition';
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  ageAppropriate: boolean;
}

// ============================================================================
// Community Hub
// ============================================================================

export interface Community {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  location: { county: string; subCounty?: string };
  memberCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  avatar?: string;
  coverImage?: string;
  ageTargeting?: AgeTargeting;
  createdAt: Date;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  images?: string[];
  links?: string[];
  likes: number;
  comments: number;
  ageTargeting?: AgeTargeting;
  createdAt: Date;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
}

// ============================================================================
// Educational System
// ============================================================================

export type LessonMediaType = 'text' | 'video' | 'infographic' | 'interactive';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Category = 'conservation' | 'waste' | 'water' | 'climate_justice' | 'policy';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  duration: number; // in minutes
  lessons: Lesson[];
  ggCoinReward: number;
  green_coin_reward?: number; // Database column name (deprecated, use ggCoinReward)
  badgeReward?: string;
  ageTargeting?: AgeTargeting;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  mediaType: LessonMediaType;
  mediaUrl?: string;
  orderIndex: number;
  createdAt: Date;
}

export interface UserLearningProgress {
  userId: string;
  moduleId: string;
  completedLessons: string[];
  quizScore?: number;
  completedAt?: Date;
  certificateIssued: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  moduleId: string;
  userName: string;
  moduleTitle: string;
  completedAt: string;
  issuer: string;
}

export interface DailyNugget {
  id: string;
  content: string;
  source?: string;
  date: string;
}

// ============================================================================
// Climate Missions System
// ============================================================================

export type MissionType = 'tree_planting' | 'waste_cleanup' | 'water_conservation' | 'petition' | 'fundraising';
export type MissionStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_more_info';

export interface Mission {
  id: string;
  title: string;
  description: string;
  missionType: MissionType;
  organizerId: string;
  location: { 
    name: string; 
    coordinates: [number, number]; 
  };
  startDate: Date;
  endDate: Date;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  participantCount: number;
  ggCoinReward: number;
  verificationRequired: boolean;
  status: MissionStatus;
  ageTargeting?: AgeTargeting;
  createdAt: Date;
}

export interface MissionParticipation {
  id: string;
  missionId: string;
  userId: string;
  joinedAt: Date;
  contributionMetric?: string;
  contributionValue?: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
}

// ============================================================================
// Verification-as-a-Service (VaaS)
// ============================================================================

export type EvidenceType = 'photo' | 'video' | 'gps' | 'document';
export type ReviewerOrganization = 'GBM' | 'WMF' | 'KFS' | 'community_leader';

export interface VerificationEvidence {
  id: string;
  actionId: string;
  userId: string;
  evidenceType: EvidenceType;
  files: Array<{
    url: string;
    metadata: {
      gpsCoordinates?: [number, number];
      timestamp: Date;
    };
  }>;
  description: string;
  submittedAt: Date;
}

export interface VerificationReview {
  id: string;
  evidenceId: string;
  reviewerId: string;
  reviewerOrganization: ReviewerOrganization;
  status: VerificationStatus;
  comments: string;
  reviewedAt: Date;
}

// ============================================================================
// GG Coins Economy
// ============================================================================

export type TransactionType = 'earn' | 'spend' | 'bonus' | 'referral';

export interface GGCoinWallet {
  userId: string;
  balance: number;
  lifetimeEarnings: number;
  lifetimeSpending: number;
  lastUpdated: Date;
}

export interface GGCoinTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
}

// Deprecated: Use GGCoinWallet instead
export type GreenCoinWallet = GGCoinWallet;

// Deprecated: Use GGCoinTransaction instead
export type GreenCoinTransaction = GGCoinTransaction;

// ============================================================================
// Digital Tree Wallet
// ============================================================================

export type HealthStatus = 'healthy' | 'needs_attention' | 'deceased';

export interface PlantedTree {
  id: string;
  userId: string;
  species: string;
  plantedDate: Date;
  location: { 
    name: string; 
    coordinates: [number, number]; 
  };
  healthStatus: HealthStatus;
  growthData: {
    height: number;
    diameter: number;
    lastMeasured: Date;
  };
  estimatedCO2: number; // kg per year
  createdAt: Date;
}

export interface TreePhoto {
  id: string;
  treeId: string;
  photoUrl: string;
  capturedAt: Date;
}

// ============================================================================
// Gamification System
// ============================================================================

export type IconType = 'hummingbird' | 'tree' | 'water' | 'shield' | 'star';
export type LeaderboardType = 'gg_coins' | 'trees_planted' | 'community_impact';
export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';
export type Scope = 'global' | 'county' | 'community';

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: PlatformBadgeTier;
  iconType: IconType;
  criteria: Array<{
    metric: string;
    threshold: number;
  }>;
  earnedByCount: number;
  createdAt: Date;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress: number;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}

export interface Leaderboard {
  id: string;
  type: LeaderboardType;
  timeframe: Timeframe;
  scope: Scope;
  entries: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  rank: number;
}

// ============================================================================
// Ambassador Program
// ============================================================================

export type AmbassadorStatus = 'active' | 'inactive' | 'suspended';

export interface Ambassador {
  userId: string;
  approvedAt: Date;
  county: string;
  subCounty?: string;
  specializations: string[];
  eventsOrganized: number;
  membersReferred: number;
  impactScore: number;
  status: AmbassadorStatus;
}

// ============================================================================
// Policy Engagement
// ============================================================================

export type PlatformPetitionStatus = 'active' | 'completed' | 'expired' | 'cancelled';
export type TargetAudience = 'county' | 'national' | 'international';

export interface PlatformPetition {
  id: string;
  title: string;
  description: string;
  targetAudience: TargetAudience;
  targetOrganization: string;
  signatureGoal: number;
  currentSignatures: number;
  deadline: Date;
  status: PlatformPetitionStatus;
  createdBy: string;
  createdAt: Date;
}

export interface PlatformPetitionSignature {
  id: string;
  petitionId: string;
  userId: string;
  signedAt: Date;
  publicDisplay: boolean;
}

// ============================================================================
// Age-Based Content Curation Types
// ============================================================================

export type AgeCohort = '13-17' | '18-24' | '25-34' | '35-49' | '50+';

export interface AgeTargeting {
  minAge?: number;
  maxAge?: number;
  targetCohorts?: AgeCohort[];
}

// ============================================================================
// External Integrations
// ============================================================================

export interface AntuGrowTreeData {
  treeId: string;
  species: string;
  healthScore: number;
  growthRate: number;
  lastMonitored: Date;
  aiAnalysis: {
    healthStatus: HealthStatus;
    recommendations: string[];
    riskFactors: string[];
  };
}

// ============================================================================
// Revenue and Monetization
// ============================================================================

export type RevenueStream = 'campaigns' | 'vaas' | 'projects' | 'marketplace';

export interface RevenueTracking {
  id: string;
  stream: RevenueStream;
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
}

// ============================================================================
// USSD Support
// ============================================================================

export interface USSDSession {
  sessionId: string;
  userId?: string;
  phoneNumber: string;
  currentMenu: string;
  sessionData: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export interface USSDAction {
  id: string;
  sessionId: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: Date;
  synced: boolean;
}