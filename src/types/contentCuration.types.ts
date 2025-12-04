/**
 * Content Curation Types
 * Type definitions for age-based content curation system
 */

import { AgeCohort } from './platform.types';
import { DateRange } from './socialFeed.types';

// Re-export AgeCohort for convenience
export type { AgeCohort };

// ============================================================================
// Core Curation Types
// ============================================================================

export type ContentType = 'initiative' | 'social_post' | 'challenge' | 'educational' | 'mission' | 'community_post' | 'petition';

export interface CurationRequest {
  userId: string;
  contentTypes: ContentType[];
  limit: number;
  offset?: number;
  filters?: ContentFilters;
}

export interface CurationResponse {
  items: CuratedContentItem[];
  hasMore: boolean;
  total: number;
  cacheHit?: boolean;
  processingTime?: number;
}

export interface CuratedContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  relevanceScore: number;
  ageTargeting?: AgeRange[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ContentFilters {
  categories?: string[];
  locations?: string[];
  dateRange?: DateRange;
  minRelevanceScore?: number;
}

export interface AgeRange {
  minAge: number;
  maxAge: number;
}

// ============================================================================
// Age Cohort Analysis
// ============================================================================

export interface UserAgeCohort {
  cohort: AgeCohort;
  age: number;
  preferences: CohortPreferences;
  lastUpdated: Date;
}

export interface CohortPreferences {
  contentTypes: Record<ContentType, number>; // Weight 0-1
  engagementPatterns: EngagementPattern[];
  filterRules: FilterRule[];
  lastCalculated: Date;
}

export interface EngagementPattern {
  pattern: string;
  weight: number;
  confidence: number;
}

export interface FilterRule {
  type: 'include' | 'exclude' | 'boost' | 'penalize';
  condition: string;
  value: any;
  weight: number;
}

// ============================================================================
// Scoring Engine
// ============================================================================

export interface ScoringContext {
  user: UserScoringProfile;
  cohort: AgeCohort;
  personalHistory: InteractionHistory;
  cohortPreferences: CohortPreferences;
  timestamp: Date;
}

export interface UserScoringProfile {
  userId: string;
  age?: number;
  ageCohort?: AgeCohort;
  interests: string[];
  location?: {
    county: string;
    subCounty?: string;
  };
  userType: string;
}

export interface InteractionHistory {
  totalInteractions: number;
  contentTypeBreakdown: Record<ContentType, number>;
  recentInteractions: Interaction[];
  engagementScore: number;
  lastActivity: Date;
}

export interface Interaction {
  contentId: string;
  contentType: ContentType;
  interactionType: InteractionType;
  timestamp: Date;
  duration?: number; // seconds
  metadata?: Record<string, any>;
}

export type InteractionType = 'impression' | 'click' | 'save' | 'join' | 'share' | 'complete' | 'like' | 'comment';

export interface ScoringResult {
  contentId: string;
  baseScore: number;
  cohortScore: number;
  personalScore: number;
  finalScore: number;
  factors: ScoringFactor[];
  calculatedAt: Date;
}

export interface ScoringFactor {
  name: string;
  weight: number;
  contribution: number;
  reason: string;
}

// ============================================================================
// Engagement Tracking
// ============================================================================

export interface EngagementEvent {
  id: string;
  userId: string;
  itemId: string;
  itemType: ContentType;
  eventType: InteractionType;
  ageCohort?: AgeCohort;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface EngagementMetrics {
  cohort: AgeCohort;
  contentType: ContentType;
  date: Date;
  impressions: number;
  clicks: number;
  saves: number;
  joins: number;
  shares: number;
  clickThroughRate: number;
  avgEngagementTime: number;
  conversionRate: number;
}

export interface CohortEngagementSummary {
  cohort: AgeCohort;
  totalUsers: number;
  activeUsers: number;
  avgSessionDuration: number;
  topContentTypes: Array<{
    type: ContentType;
    engagementRate: number;
  }>;
  engagementTrends: Array<{
    date: Date;
    engagementScore: number;
  }>;
}

// ============================================================================
// Curation Rules Management
// ============================================================================

export type RuleType = 'filter' | 'boost' | 'penalize' | 'exclude';
export type RuleCondition = 'age_range' | 'content_type' | 'location' | 'interest' | 'engagement_history';

export interface CurationRule {
  id: string;
  cohort: AgeCohort;
  ruleType: RuleType;
  condition: RuleCondition;
  parameters: Record<string, any>;
  action: RuleAction;
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleAction {
  type: 'multiply_score' | 'add_score' | 'set_score' | 'exclude' | 'require';
  value: number | boolean | string;
  reason: string;
}

export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RuleTestResult {
  ruleId: string;
  testCases: Array<{
    input: any;
    expectedOutput: any;
    actualOutput: any;
    passed: boolean;
  }>;
  overallSuccess: boolean;
}

// ============================================================================
// Fallback Handling
// ============================================================================

export type FallbackReason = 'missing_age' | 'invalid_age' | 'engine_failure' | 'insufficient_content' | 'timeout';

export interface FallbackContext {
  reason: FallbackReason;
  originalRequest: CurationRequest;
  error?: Error;
  timestamp: Date;
}

export interface FallbackResult {
  items: CuratedContentItem[];
  fallbackUsed: boolean;
  fallbackReason?: FallbackReason;
  fallbackStrategy: string;
  processingTime: number;
}

// ============================================================================
// Caching and Performance
// ============================================================================

export interface RelevanceScoreCache {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentType;
  score: number;
  calculatedAt: Date;
  expiresAt: Date;
}

export interface CurationPerformanceMetrics {
  requestId: string;
  userId: string;
  processingTime: number;
  cacheHitRate: number;
  itemsProcessed: number;
  itemsReturned: number;
  fallbackUsed: boolean;
  timestamp: Date;
}

// ============================================================================
// Analytics and Reporting
// ============================================================================

export interface CurationAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalRequests: number;
  avgProcessingTime: number;
  cacheHitRate: number;
  fallbackRate: number;
  cohortBreakdown: Record<AgeCohort, {
    requests: number;
    avgEngagement: number;
    topContentTypes: ContentType[];
  }>;
  performanceMetrics: {
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
  };
}

export interface ContentPerformanceReport {
  contentId: string;
  contentType: ContentType;
  title: string;
  cohortPerformance: Record<AgeCohort, {
    impressions: number;
    clicks: number;
    engagementRate: number;
    avgRelevanceScore: number;
  }>;
  overallMetrics: {
    totalImpressions: number;
    totalClicks: number;
    avgEngagementRate: number;
    bestPerformingCohort: AgeCohort;
    worstPerformingCohort: AgeCohort;
  };
  recommendations: string[];
}

// ============================================================================
// Configuration and Settings
// ============================================================================

export interface CurationConfig {
  scoringWeights: {
    cohortWeight: number;
    personalWeight: number;
    recencyWeight: number;
    popularityWeight: number;
  };
  cacheSettings: {
    relevanceScoreTTL: number; // minutes
    cohortPreferencesTTL: number; // minutes
    maxCacheSize: number;
  };
  fallbackSettings: {
    timeoutThreshold: number; // milliseconds
    maxRetries: number;
    fallbackContentLimit: number;
  };
  performanceThresholds: {
    maxProcessingTime: number; // milliseconds
    minCacheHitRate: number; // percentage
    maxFallbackRate: number; // percentage
  };
}

export interface UserCurationPreferences {
  userId: string;
  curationEnabled: boolean;
  explicitInterests: string[];
  blockedContentTypes: ContentType[];
  preferredContentTypes: ContentType[];
  privacySettings: {
    shareEngagementData: boolean;
    allowPersonalization: boolean;
    dataRetentionDays: number;
  };
  updatedAt: Date;
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface CurationServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTime: number;
    cacheHit: boolean;
    fallbackUsed: boolean;
    itemsProcessed: number;
  };
}

export type GetCuratedContentResponse = CurationServiceResponse<CurationResponse>;
export type UpdateCohortPreferencesResponse = CurationServiceResponse<CohortPreferences>;
export type CreateCurationRuleResponse = CurationServiceResponse<CurationRule>;
export type GetEngagementMetricsResponse = CurationServiceResponse<EngagementMetrics[]>;
export type GetCurationAnalyticsResponse = CurationServiceResponse<CurationAnalytics>;