/**
 * AI Climate Companion Types
 * Types for the Green Mentor AI system
 */

import { AgeCohort } from './contentCuration.types';

// ============================================================================
// Chat Message Types
// ============================================================================

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: ChatContext;
}

export interface ChatContext {
  userInterests: string[];
  ageCohort: AgeCohort;
  currentPage: string;
  recentActions: string[];
  journeyStage?: 'onboarding' | 'engagement' | 'contribution' | 'recognition' | 'hero';
  location?: {
    county: string;
    subCounty?: string;
  };
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface Recommendation {
  id: string;
  type: 'mission' | 'learning' | 'community' | 'petition' | 'action';
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  ageAppropriate: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationRequest {
  userId: string;
  userInterests: string[];
  ageCohort: AgeCohort;
  location?: {
    county: string;
    subCounty?: string;
  };
  recentActions?: string[];
  limit?: number;
}

// ============================================================================
// Onboarding Types
// ============================================================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
  actionRequired?: string;
  helpText?: string;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: OnboardingStep[];
  nextStep?: OnboardingStep;
  percentComplete: number;
}

export interface OnboardingGuideRequest {
  userId: string;
  currentStep?: number;
  userProfile?: {
    age?: number;
    interests?: string[];
    userType?: 'individual' | 'corporate' | 'community' | 'partner';
  };
}

// ============================================================================
// Educational Explainer Types
// ============================================================================

export interface ConceptExplanation {
  concept: string;
  simpleExplanation: string;
  ageAppropriateLevel: 'child' | 'teen' | 'adult' | 'senior';
  examples: string[];
  relatedConcepts: string[];
  actionableSteps?: string[];
}

export interface ExplanationRequest {
  concept: string;
  ageCohort: AgeCohort;
  userInterests?: string[];
  context?: string;
}

// ============================================================================
// AI Service Configuration
// ============================================================================

export interface AIServiceConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface AIServiceError {
  code: string;
  message: string;
  type: 'rate_limit' | 'api_error' | 'network_error' | 'validation_error';
  retryable: boolean;
  retryAfter?: number;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ChatAnalytics {
  userId: string;
  sessionId: string;
  messageCount: number;
  sessionDuration: number;
  topicsDiscussed: string[];
  recommendationsProvided: number;
  actionsCompleted: number;
  timestamp: Date;
}

export interface RecommendationAnalytics {
  recommendationId: string;
  userId: string;
  type: Recommendation['type'];
  clicked: boolean;
  completed: boolean;
  relevanceScore: number;
  userFeedback?: 'helpful' | 'not_helpful' | 'irrelevant';
  timestamp: Date;
}