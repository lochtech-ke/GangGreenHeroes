# Design Document: V1.0 Major Release

## Overview

The V1.0 Major Release design consolidates three critical feature sets into a unified, production-ready platform that transforms #GangGreen into a comprehensive, AI-powered, community-driven climate action ecosystem with enterprise-grade reliability.

This release integrates:

1. **Platform Vision 2025**: A complete redesign emphasizing community-first engagement, AI-powered personalization (Green Mentor chatbot), transparent verification (VaaS), gamification (Green Coins, badges, leaderboards), and sustained participation through a robust reward economy.

2. **Age-Based Content Curation**: An intelligent personalization engine that tailors dashboard content to user demographics (13-17, 18-24, 25-34, 35-49, 50+), ensuring age-appropriate engagement patterns, content types, and participation opportunities.

3. **Error Handling & Debugging**: Enterprise-grade error management with centralized error handling, automatic recovery mechanisms (retry, circuit breaker), structured error types, React Error Boundaries, Sentry integration, and comprehensive debugging tools.

The platform serves as the unifying fabric connecting communities, organizations, schools, and individuals in Kenya's climate action movement, providing personalized experiences while maintaining production-level reliability and developer productivity.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Dashboard   │  │  Community   │  │   Missions   │             │
│  │  (Curated)   │  │     Hub      │  │   & Actions  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Learning   │  │  Tree Wallet │  │ Gamification │             │
│  │   Modules    │  │  & Impact    │  │  & Badges    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Error Handling Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Error     │  │   Central    │  │    Error     │             │
│  │  Boundaries  │◄─┤    Error     │──►  Recovery   │             │
│  │              │  │   Handler    │  │   Manager    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Services Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Content    │  │     User     │  │  Community   │             │
│  │  Curation    │  │   Service    │  │   Service    │             │
│  │   Engine     │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Mission    │  │  Education   │  │  Green Coin  │             │
│  │   Service    │  │   Service    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Tree Wallet │  │     VaaS     │  │      AI      │             │
│  │   Service    │  │   Service    │  │  Companion   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Layer (Supabase)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Users     │  │ Communities  │  │   Missions   │             │
│  │   Profiles   │  │    Posts     │  │   Actions    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Green Coins │  │    Trees     │  │Verification  │             │
│  │ Transactions │  │              │  │   Evidence   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Badges    │  │  Ambassadors │  │  Petitions   │             │
│  │              │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │Content Age   │  │  Curation    │  │   Error      │             │
│  │  Targeting   │  │    Rules     │  │    Logs      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     External Integrations                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Antugrow   │  │  OpenAI/     │  │   Payment    │             │
│  │      AI      │  │  Anthropic   │  │   Gateway    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     USSD     │  │    Sentry    │  │    Slack     │             │
│  │   Provider   │  │  (Errors)    │  │   (Alerts)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Integration Architecture

The three major feature sets integrate as follows:

1. **Content Curation ↔ Platform Vision**: The curation engine personalizes all platform content (missions, learning modules, community posts, challenges) based on user age cohorts and engagement history.

2. **Error Handling ↔ All Systems**: The error handling layer wraps all services, API calls, and UI components, providing consistent error management, recovery, and monitoring.

3. **Platform Vision ↔ Error Handling**: All platform features (AI companion, VaaS, Green Coins, etc.) leverage error handling for reliability, with domain-specific error types and recovery strategies.


## Components and Interfaces

### Section A: Platform Vision Components

#### A1. User Management System

**Components:**
- `UserRegistration`: Multi-type registration with age collection
- `UserProfile`: Profile management with climate interests and age cohort
- `UserDashboard`: Personalized, curated dashboard
- `UserJourneyTracker`: Progression tracking through stages

**Key Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  userType: 'individual' | 'corporate' | 'community' | 'partner';
  climateInterests: ('trees' | 'water' | 'waste' | 'policy')[];
  age?: number;
  ageCohort: AgeCohort;
  journeyStage: 'onboarding' | 'engagement' | 'contribution' | 'recognition' | 'hero';
  badgeTier: 'steward' | 'platinum' | 'hero';
  greenCoins: number;
  treesPlanted: number;
  curationEnabled: boolean;
  createdAt: Date;
}

interface UserProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  location: { county: string; subCounty?: string };
  bio?: string;
  isAmbassador: boolean;
  referralCode: string;
}
```

#### A2. AI Climate Companion (Green Mentor)

**Components:**
- `ChatInterface`: Chat UI with message history
- `RecommendationEngine`: Age-aware personalized recommendations
- `OnboardingGuide`: AI-guided onboarding
- `EducationalExplainer`: Concept simplification

**Key Interfaces:**
```typescript
interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    userInterests: string[];
    ageCohort: AgeCohort;
    currentPage: string;
    recentActions: string[];
  };
}

interface Recommendation {
  id: string;
  type: 'mission' | 'learning' | 'community' | 'petition';
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  ageAppropriate: boolean;
}
```

#### A3. Community Hub

**Components:**
- `CommunityBrowser`: Browse with age-appropriate filtering
- `CommunityFeed`: Curated posts and events
- `CommunityProfile`: Community details
- `PostComposer`: Create posts with age targeting
- `EventCalendar`: Community events

**Key Interfaces:**
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  location: { county: string; subCounty?: string };
  memberCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  ageTargeting?: AgeTargeting;
}

interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  images?: string[];
  likes: number;
  ageTargeting?: AgeTargeting;
  createdAt: Date;
}
```

#### A4. Educational System

**Components:**
- `LearningDashboard`: Age-curated modules
- `MicroLesson`: Short, format-appropriate lessons
- `DailyNugget`: Daily environmental facts
- `Quiz`: Interactive quizzes
- `Certificate`: Digital certificates

**Key Interfaces:**
```typescript
interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'conservation' | 'waste' | 'water' | 'climate_justice' | 'policy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: Lesson[];
  greenCoinReward: number;
  ageTargeting?: AgeTargeting;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  mediaType: 'text' | 'video' | 'infographic' | 'interactive';
  mediaUrl?: string;
}
```

#### A5. Climate Missions System

**Components:**
- `MissionBrowser`: Age-curated missions
- `MissionDetails`: Detailed mission info
- `MissionParticipation`: Join and track
- `MissionVerification`: Submit evidence
- `MissionMap`: Geographic view

**Key Interfaces:**
```typescript
interface Mission {
  id: string;
  title: string;
  description: string;
  missionType: 'tree_planting' | 'waste_cleanup' | 'water_conservation' | 'petition' | 'fundraising';
  organizerId: string;
  location: { name: string; coordinates: [number, number] };
  startDate: Date;
  endDate: Date;
  targetImpact: { metric: string; value: number };
  participantCount: number;
  greenCoinReward: number;
  verificationRequired: boolean;
  ageTargeting?: AgeTargeting;
}
```

#### A6. Verification-as-a-Service (VaaS)

**Components:**
- `VerificationSubmission`: Submit evidence
- `VerificationReview`: Expert review interface
- `VerificationReport`: Public reports
- `VerificationDashboard`: Admin dashboard

**Key Interfaces:**
```typescript
interface VerificationEvidence {
  id: string;
  actionId: string;
  userId: string;
  evidenceType: 'photo' | 'video' | 'gps' | 'document';
  files: { url: string; metadata: { gpsCoordinates?: [number, number]; timestamp: Date } }[];
  description: string;
  submittedAt: Date;
}

interface VerificationReview {
  id: string;
  evidenceId: string;
  reviewerId: string;
  reviewerOrganization: 'GBM' | 'WMF' | 'KFS' | 'community_leader';
  status: 'approved' | 'rejected' | 'needs_more_info';
  comments: string;
  reviewedAt: Date;
}
```

#### A7. Green Coins Economy

**Components:**
- `GreenCoinWallet`: Display balance and history
- `GreenCoinTransaction`: Record transactions
- `RewardCalculator`: Calculate rewards
- `ReferralTracker`: Track referrals

**Key Interfaces:**
```typescript
interface GreenCoinWallet {
  userId: string;
  balance: number;
  lifetimeEarnings: number;
  lifetimeSpending: number;
  lastUpdated: Date;
}

interface GreenCoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'referral';
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
}
```

#### A8. Digital Tree Wallet

**Components:**
- `TreeWallet`: Display planted trees
- `TreeCard`: Individual tree details
- `TreeMap`: Geographic visualization
- `ImpactCalculator`: CO₂ calculations

**Key Interfaces:**
```typescript
interface PlantedTree {
  id: string;
  userId: string;
  species: string;
  plantedDate: Date;
  location: { name: string; coordinates: [number, number] };
  healthStatus: 'healthy' | 'needs_attention' | 'deceased';
  growthData: { height: number; diameter: number; lastMeasured: Date };
  estimatedCO2: number;
}
```

#### A9. Gamification System

**Components:**
- `BadgeDisplay`: Show earned badges
- `Leaderboard`: Display rankings
- `StreakTracker`: Track activity streaks
- `ChallengeCard`: Display challenges
- `ProgressBar`: Visual progress

**Key Interfaces:**
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'steward' | 'platinum' | 'hero';
  iconType: 'hummingbird' | 'tree' | 'water' | 'shield' | 'star';
  criteria: { metric: string; threshold: number }[];
}

interface Leaderboard {
  id: string;
  type: 'green_coins' | 'trees_planted' | 'community_impact';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  scope: 'global' | 'county' | 'community';
  entries: LeaderboardEntry[];
}
```

### Section B: Content Curation Components

#### B1. Content Curation Service

**Location**: `src/services/contentCuration.service.ts`

**Key Interfaces:**
```typescript
interface CurationRequest {
  userId: string;
  contentTypes: ContentType[];
  limit: number;
  offset?: number;
}

interface CurationResponse {
  items: CuratedContentItem[];
  hasMore: boolean;
  total: number;
}

interface CuratedContentItem {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  relevanceScore: number;
  ageTargeting?: AgeRange[];
  metadata: Record<string, any>;
}

type ContentType = 'initiative' | 'social_post' | 'challenge' | 'educational' | 'mission';
type AgeCohort = '13-17' | '18-24' | '25-34' | '35-49' | '50+';
```

#### B2. Age Cohort Analyzer

**Location**: `src/services/ageCohortAnalyzer.service.ts`

**Key Interfaces:**
```typescript
interface UserAgeCohort {
  cohort: AgeCohort;
  age: number;
  preferences: CohortPreferences;
}

interface CohortPreferences {
  contentTypes: Record<ContentType, number>; // Weight 0-1
  engagementPatterns: EngagementPattern[];
  filterRules: FilterRule[];
}
```

#### B3. Scoring Engine

**Location**: `src/services/scoringEngine.service.ts`

**Key Interfaces:**
```typescript
interface ScoringContext {
  user: UserProfile;
  cohort: AgeCohort;
  personalHistory: InteractionHistory;
  cohortPreferences: CohortPreferences;
}

interface InteractionHistory {
  totalInteractions: number;
  contentTypeBreakdown: Record<ContentType, number>;
  recentInteractions: Interaction[];
}
```

#### B4. Engagement Tracker

**Location**: `src/services/engagementTracker.service.ts`

**Key Interfaces:**
```typescript
interface EngagementEvent {
  userId: string;
  itemId: string;
  itemType: ContentType;
  eventType: 'impression' | 'click' | 'save' | 'join' | 'share' | 'complete';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface EngagementMetrics {
  cohort: AgeCohort;
  contentType: ContentType;
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  avgEngagementTime: number;
}
```

### Section C: Error Handling Components

#### C1. Central Error Handler

**Location**: `src/utils/errorHandler.ts`

**Key Interfaces:**
```typescript
interface ErrorHandler {
  handleError(error: Error, context?: ErrorContext): void;
  registerHandler(errorType: string, handler: CustomErrorHandler): void;
  setSeverityThreshold(severity: ErrorSeverity): void;
  setTrackingEnabled(enabled: boolean): void;
}

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  route?: string;
  ageCohort?: AgeCohort;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

#### C2. Structured Error Types

**Location**: `src/types/errors.ts`

**Key Classes:**
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity,
    public context?: ErrorContext,
    public recoverable: boolean = false
  ) { super(message); }
}

class NetworkError extends AppError { }
class AuthError extends AppError { }
class ValidationError extends AppError { }
class DatabaseError extends AppError { }
class Web3Error extends AppError { }
class BadgeError extends AppError { }
class CurationError extends AppError { }
```

#### C3. Error Recovery Manager

**Location**: `src/utils/errorRecovery.ts`

**Key Interfaces:**
```typescript
interface ErrorRecoveryManager {
  attemptRecovery(error: AppError, operation: () => Promise<any>): Promise<RecoveryResult>;
  registerStrategy(errorCode: string, strategy: RecoveryStrategy): void;
  isCircuitOpen(operationKey: string): boolean;
  resetCircuit(operationKey: string): void;
}

interface RecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  shouldRetry: (error: Error, attempt: number) => boolean;
  onRetry?: (attempt: number) => void;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}
```

#### C4. Debug Logger

**Location**: `src/utils/debugLogger.ts`

**Key Interfaces:**
```typescript
interface DebugLogger {
  debug(namespace: string, message: string, data?: any): void;
  info(namespace: string, message: string, data?: any): void;
  warn(namespace: string, message: string, data?: any): void;
  error(namespace: string, message: string, error?: Error, data?: any): void;
  time(namespace: string, label: string): void;
  timeEnd(namespace: string, label: string): void;
  enable(namespace: string): void;
  disable(namespace: string): void;
  setLevel(level: LogLevel): void;
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}
```

#### C5. Error Boundary Component

**Location**: `src/components/common/ErrorBoundary.tsx`

**Key Interfaces:**
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  level?: 'critical' | 'section' | 'component';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'critical' | 'section' | 'component';
}
```

#### C6. Sentry Integration

**Location**: `src/utils/sentryIntegration.ts`

**Key Interfaces:**
```typescript
interface SentryIntegration {
  initialize(config: SentryConfig): void;
  captureError(error: Error, context?: ErrorContext): string;
  captureMessage(message: string, level: SentryLevel): string;
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  setUser(user: UserContext | null): void;
}

interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  tracesSampleRate: number;
  beforeSend?: (event: any) => any;
}
```


## Data Models

### Database Schema

The V1.0 release extends the existing database schema with new tables for content curation, error handling, and enhanced platform features.

#### Core Platform Tables

```sql
-- Enhanced users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'individual';
ALTER TABLE users ADD COLUMN IF NOT EXISTS journey_stage VARCHAR(20) DEFAULT 'onboarding';
ALTER TABLE users ADD COLUMN IF NOT EXISTS badge_tier VARCHAR(20) DEFAULT 'steward';

-- Enhanced user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_cohort VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age_curation_enabled BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

-- User climate interests
CREATE TABLE IF NOT EXISTS user_climate_interests (
  user_id UUID REFERENCES users(id),
  interest VARCHAR(20) CHECK (interest IN ('trees', 'water', 'waste', 'policy')),
  PRIMARY KEY (user_id, interest)
);

-- Communities
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  county VARCHAR(50),
  sub_county VARCHAR(50),
  member_count INTEGER DEFAULT 0,
  activity_level VARCHAR(20) DEFAULT 'low',
  avatar TEXT,
  cover_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  images TEXT[],
  links TEXT[],
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learning modules
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  duration INTEGER,
  green_coin_reward INTEGER,
  badge_reward VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES learning_modules(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  media_type VARCHAR(20),
  media_url TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User learning progress
CREATE TABLE IF NOT EXISTS user_learning_progress (
  user_id UUID REFERENCES users(id),
  module_id UUID REFERENCES learning_modules(id),
  completed_lessons UUID[],
  quiz_score INTEGER,
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, module_id)
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  mission_type VARCHAR(50),
  organizer_id UUID REFERENCES users(id),
  location_name VARCHAR(200),
  location_coordinates GEOGRAPHY(POINT, 4326),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_metric VARCHAR(50),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  green_coin_reward INTEGER,
  verification_required BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mission participations
CREATE TABLE IF NOT EXISTS mission_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  contribution_metric VARCHAR(50),
  contribution_value NUMERIC,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP
);

-- Verification evidence
CREATE TABLE IF NOT EXISTS verification_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID,
  user_id UUID REFERENCES users(id),
  evidence_type VARCHAR(20),
  files JSONB,
  description TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Verification reviews
CREATE TABLE IF NOT EXISTS verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id UUID REFERENCES verification_evidence(id),
  reviewer_id UUID REFERENCES users(id),
  reviewer_organization VARCHAR(50),
  status VARCHAR(20),
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Green Coin wallets
CREATE TABLE IF NOT EXISTS green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Green Coin transactions
CREATE TABLE IF NOT EXISTS green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(20),
  amount INTEGER,
  source VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Planted trees
CREATE TABLE IF NOT EXISTS planted_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  species VARCHAR(100),
  planted_date DATE,
  location_name VARCHAR(200),
  location_coordinates GEOGRAPHY(POINT, 4326),
  health_status VARCHAR(20) DEFAULT 'healthy',
  height_cm NUMERIC,
  diameter_cm NUMERIC,
  last_measured TIMESTAMP,
  estimated_co2_kg_per_year NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tree photos
CREATE TABLE IF NOT EXISTS tree_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID REFERENCES planted_trees(id),
  photo_url TEXT,
  captured_at TIMESTAMP
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(20),
  icon_type VARCHAR(20),
  criteria JSONB,
  earned_by_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER,
  PRIMARY KEY (user_id, badge_id)
);

-- User streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

-- Ambassadors
CREATE TABLE IF NOT EXISTS ambassadors (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  approved_at TIMESTAMP,
  county VARCHAR(50),
  sub_county VARCHAR(50),
  specializations TEXT[],
  events_organized INTEGER DEFAULT 0,
  members_referred INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active'
);

-- Petitions
CREATE TABLE IF NOT EXISTS petitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_audience VARCHAR(20),
  target_organization VARCHAR(200),
  signature_goal INTEGER,
  current_signatures INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Petition signatures
CREATE TABLE IF NOT EXISTS petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID REFERENCES petitions(id),
  user_id UUID REFERENCES users(id),
  signed_at TIMESTAMP DEFAULT NOW(),
  public_display BOOLEAN DEFAULT TRUE,
  UNIQUE (petition_id, user_id)
);

-- AI Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20),
  content TEXT,
  context JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

#### Content Curation Tables

```sql
-- Content age targeting
CREATE TABLE IF NOT EXISTS content_age_targeting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  min_age INTEGER,
  max_age INTEGER,
  target_cohorts TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Curation rules
CREATE TABLE IF NOT EXISTS curation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content interactions
CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  interaction_type VARCHAR(20) NOT NULL,
  age_cohort VARCHAR(10),
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Relevance scores cache
CREATE TABLE IF NOT EXISTS relevance_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(user_id, content_id, content_type)
);

-- Cohort engagement metrics
CREATE TABLE IF NOT EXISTS cohort_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort VARCHAR(10) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  joins INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  avg_engagement_seconds INTEGER DEFAULT 0,
  UNIQUE(cohort, content_type, date)
);
```

#### Error Handling Tables

```sql
-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  error_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id),
  component VARCHAR(100),
  action VARCHAR(100),
  route VARCHAR(255),
  metadata JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Error analytics
CREATE TABLE IF NOT EXISTS error_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_code VARCHAR(100) NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_users INTEGER DEFAULT 1,
  first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
  average_resolution_time INTEGER,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Circuit breaker state
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_key VARCHAR(255) UNIQUE NOT NULL,
  state VARCHAR(20) NOT NULL,
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMP,
  opened_at TIMESTAMP,
  reset_at TIMESTAMP,
  config JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Database Indexes

```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_age_cohort ON user_profiles(age_cohort, age);
CREATE INDEX IF NOT EXISTS idx_content_targeting ON content_age_targeting(content_type, target_cohorts);
CREATE INDEX IF NOT EXISTS idx_interactions_cohort_time ON content_interactions(age_cohort, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON content_interactions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_relevance_user_score ON relevance_scores(user_id, score DESC, expires_at);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics ON cohort_engagement_metrics(cohort, date DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_analytics_code ON error_analytics(error_code);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_key ON circuit_breaker_state(operation_key);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After completing the prework analysis, I've reviewed all testable properties to eliminate redundancy:

**Redundancies Identified:**
- Properties about weighting strategies (B8.1, B8.2, B8.3) can be combined into a single parameterized property
- Properties about content type prioritization (B1.1, B2.3, B3.3) follow similar patterns and can use unified testing
- Properties about sanitization (C1.4, C8.3) can be combined as they test the same behavior in different contexts
- Properties about real-time updates (A7.3, A10.5) can be unified as they test the same update mechanism

After consolidation, we have 45 unique properties providing comprehensive validation coverage across all three feature sets.

### Section A: Platform Vision Properties

Property A1: Registration requires verification
*For any* user registration, access to the platform should only be granted after email or phone verification is completed
**Validates: Requirements A1.2**

Property A2: First login initializes chatbot
*For any* user's first login, their profile should be initialized with a Green Mentor chatbot introduction
**Validates: Requirements A1.6**

Property A3: Recommendations match user profile
*For any* user with specified climate interests and age cohort, AI recommendations should align with at least one interest and be age-appropriate
**Validates: Requirements A2.1**

Property A4: Community membership grants access
*For any* user joining a community, they should immediately gain access to community threads, events, and missions
**Validates: Requirements A3.2**

Property A5: Learning completion triggers rewards
*For any* completed learning module, the platform should award Green Coins and update progress tracking
**Validates: Requirements A4.2**

Property A6: Mission completion requires verification
*For any* mission completion, rewards should only be awarded after photo and GPS verification is submitted and approved
**Validates: Requirements A5.3**

Property A7: Action submission requires evidence
*For any* climate action submission, the platform should reject submissions that lack geo-tagged photos or videos
**Validates: Requirements A6.1**

Property A8: Verification generates reports
*For any* verified action, a public project report should be generated containing validation details, reviewer information, and timestamp
**Validates: Requirements A6.3**

Property A9: Reward calculation follows rules
*For any* verified action, Green Coins awarded should match the calculation based on action type, impact, and applicable multipliers
**Validates: Requirements A7.1**

Property A10: Real-time updates
*For any* Green Coin earning event or metric update, the user's balance and dashboard metrics should update immediately and reflect the correct values
**Validates: Requirements A7.3, A10.5**

Property A11: Tree planting creates wallet entry
*For any* tree planted by a user, it should appear in their Digital Tree Wallet with location, date, and initial health status
**Validates: Requirements A8.1**

Property A12: Badge progression follows rules
*For any* user completing actions, badges should be awarded according to achievement type and frequency, and users should progress through tiers when criteria are met
**Validates: Requirements A9.1**

Property A13: Streak tracking is consistent
*For any* user with consecutive daily activity, their streak count should increment correctly and bonus points should be awarded
**Validates: Requirements A9.4**

Property A14: Petition signing is recorded
*For any* petition signature, it should be recorded in the database, the signature count should increment, and a confirmation should be sent
**Validates: Requirements A12.2**

### Section B: Content Curation Properties

Property B1: Youth content prioritization
*For any* user aged 13-24, the curated dashboard content should prioritize social media campaigns, peer challenges, and gamified activities over other content types
**Validates: Requirements B1.1**

Property B2: Youth financial filtering
*For any* user aged 13-24 and any content item requiring financial contributions above youth capacity, that content should not appear in curated results
**Validates: Requirements B1.3**

Property B3: Minor content exclusion
*For any* user aged 13-17 and any content requiring legal adult status or financial transactions, that content should not appear in curated results
**Validates: Requirements B1.5**

Property B4: Professional content inclusion
*For any* user aged 25-49, the curated content should include carbon credit investment opportunities and donation-based initiatives
**Validates: Requirements B2.3**

Property B5: Senior content inclusion
*For any* user aged 50+, the curated content should include educational content about long-term environmental impact and legacy projects
**Validates: Requirements B3.3**

Property B6: Rule validation on update
*For any* curation rule modification by an administrator, the system should validate the rule structure and reject invalid rules before applying them
**Validates: Requirements B4.2**

Property B7: Curation opt-out behavior
*For any* user who disables age-based curation, the content feed should switch to a general algorithm that does not consider age cohort in scoring
**Validates: Requirements B5.3**

Property B8: Age update triggers recalculation
*For any* user who updates their age information, the relevance scores for all content items should be recalculated, and the new scores should differ from the previous scores if the age cohort changed
**Validates: Requirements B5.4**

Property B9: Reach estimation accuracy
*For any* content item with age targeting specified, the estimated reach calculation should accurately reflect the number of users in the targeted cohorts
**Validates: Requirements B6.2**

Property B10: Age targeting enforcement
*For any* content item with specific age cohort targeting, that content should only appear in curated results for users within the targeted cohorts
**Validates: Requirements B6.3**

Property B11: Interaction logging with cohort metadata
*For any* user interaction with content, the logged interaction record should include the user's age cohort at the time of interaction
**Validates: Requirements B7.1**

Property B12: Low engagement reduces relevance
*For any* content item that receives engagement rates below the cohort average for 7 consecutive days, its relevance score for that cohort should decrease
**Validates: Requirements B7.4**

Property B13: Adaptive weighting by interaction count
*For any* user, the weighting between cohort-based scoring and personal history should follow this pattern: <10 interactions = 80% cohort/20% personal, 10-50 interactions = 50%/50%, >50 interactions = 30% cohort/70% personal
**Validates: Requirements B8.1, B8.2, B8.3**

Property B14: Missing age fallback
*For any* user without age information, the curation system should return a general content feed and include prompts to complete their profile
**Validates: Requirements B9.1**

Property B15: Invalid age handling
*For any* age value that is negative, zero, or exceeds 120, the system should reject it as invalid and request verification while using general curation
**Validates: Requirements B9.2**

Property B16: Engine failure fallback
*For any* curation request, if the scoring engine throws an error, the system should fall back to chronological content ordering without failing the entire request
**Validates: Requirements B9.3**

### Section C: Error Handling Properties

Property C1: Centralized error processing
*For any* error that occurs in the application, the Error Handler should catch and process it through the centralized error handling pipeline
**Validates: Requirements C1.1**

Property C2: Error categorization
*For any* error that is processed, the Error Handler should correctly categorize it by type (network, validation, authentication, database, runtime, web3, badge, curation)
**Validates: Requirements C1.2**

Property C3: Sensitive data sanitization
*For any* error that is logged or reported (including Sentry), all sensitive data (tokens, passwords, API keys, PII) should be redacted before storage or transmission
**Validates: Requirements C1.4, C8.3**

Property C4: Debug namespace filtering
*For any* debug log with a specific namespace, when that namespace is disabled, the log should not be output to the console
**Validates: Requirements C2.2**

Property C5: Recoverable error actions
*For any* recoverable error, the Error Notification should provide clear action buttons (Retry, Go Back, Contact Support)
**Validates: Requirements C3.2**

Property C6: Retry mechanism behavior
*For any* network request failure, the retry mechanism should attempt up to 3 retries with exponential backoff between attempts
**Validates: Requirements C4.1**

Property C7: Circuit breaker state transitions
*For any* operation protected by a circuit breaker, when failure count exceeds threshold, the circuit should open and prevent further attempts until reset timeout
**Validates: Requirements C4.3**

Property C8: Error analytics tracking
*For any* error that occurs in production, the error analytics system should track error frequency, affected users, and error types
**Validates: Requirements C5.1**

Property C9: Error boundary isolation
*For any* component error caught by an Error Boundary, the error should not propagate to parent components and should display a fallback UI
**Validates: Requirements C6.1**

Property C10: Error codes are assigned
*For any* error thrown in the system, it should include an error code that maps to a specific error condition
**Validates: Requirements C7.2**

Property C11: Sentry error capture
*For any* error in production environment, the error should be captured by Sentry with full error details including breadcrumbs and user context
**Validates: Requirements C8.2**

Property C12: Error rate limiting
*For any* error that occurs repeatedly with the same error code, after exceeding the rate limit threshold, subsequent identical errors should be suppressed and counted
**Validates: Requirements C14.1**

Property C13: Error context preservation
*For any* error that occurs, the error context should include the current route, navigation history, and last 10 user actions (breadcrumbs)
**Validates: Requirements C15.1**


## Error Handling

### Error Categories

1. **Platform Errors**: User management, community, missions, learning modules
2. **Curation Errors**: Scoring failures, rule validation, cohort analysis
3. **Validation Errors**: Invalid user input, missing required fields, format violations
4. **Authentication Errors**: Invalid credentials, expired sessions, insufficient permissions
5. **Integration Errors**: External API failures (Antugrow, OpenAI, payment gateway, USSD)
6. **Data Errors**: Database connection failures, constraint violations, data corruption
7. **Verification Errors**: Missing evidence, invalid GPS coordinates, rejected submissions
8. **Web3 Errors**: Wallet connection, transaction failures, network issues
9. **Business Logic Errors**: Insufficient Green Coins, mission capacity reached, duplicate actions

### Error Handling Strategy

**User-Facing Errors:**
- Display clear, actionable error messages without technical jargon
- Provide age-appropriate error explanations for different cohorts
- Implement retry mechanisms for transient failures
- Log errors for debugging while protecting user privacy

**System Errors:**
- Log detailed error information including stack traces
- Send alerts for critical failures
- Implement circuit breakers for external service calls
- Provide fallback mechanisms (e.g., chronological feed when curation fails)

**Recovery Strategies:**
- Network errors: Retry with exponential backoff (3 attempts)
- Auth token expiration: Automatic token refresh and retry
- Database timeouts: Circuit breaker pattern
- Cache failures: Fall back to direct data fetching
- Curation engine failures: Fall back to chronological or general feed

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  userMessage?: string; // Age-appropriate message
  details?: Record<string, any>;
  suggestions?: string[];
  retryable: boolean;
  severity: ErrorSeverity;
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation using **Vitest** with **Testing Library**:

**Key Unit Test Areas:**
- Service layer methods with mocked dependencies
- Utility functions (calculations, transformations, validations)
- React components (rendering, interactions, state management)
- Data models (validation, serialization, business logic)
- Error handling (categorization, sanitization, recovery)
- Curation algorithms (scoring, filtering, ranking)

**Coverage Target**: 80% code coverage

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property testing library):

**Configuration:**
- Minimum 100 iterations per property test
- Each property test must include a comment tag: `**Feature: v1-major-release, Property {ID}: {property_text}**`
- Custom generators for complex data types (users, missions, trees, content items, errors)
- Shrinking enabled to find minimal failing examples

**Property Test Structure:**
```typescript
import fc from 'fast-check';

// **Feature: v1-major-release, Property A9: Reward calculation follows rules**
test('Green Coin rewards match calculation rules', () => {
  fc.assert(
    fc.property(
      fc.record({
        actionType: fc.constantFrom('tree_planting', 'waste_cleanup', 'learning'),
        impact: fc.integer({ min: 1, max: 100 }),
        multipliers: fc.array(fc.record({
          condition: fc.string(),
          factor: fc.float({ min: 1, max: 3 })
        }))
      }),
      (action) => {
        const reward = calculateGreenCoinReward(action);
        const expectedReward = calculateExpectedReward(action);
        expect(reward).toBe(expectedReward);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generator Strategies:**
- **User Generator**: Ages 13-100, varying interaction counts, different cohorts
- **Content Generator**: Random types, age restrictions, metadata
- **Error Generator**: Various error types with sensitive data
- **Interaction Generator**: Realistic interaction histories with temporal patterns

### Integration Testing

Integration tests will verify interactions between components:

- API Integration: Supabase queries, external API calls
- Authentication Flow: Registration, login, verification, session management
- Mission Workflow: Creation, participation, verification, reward distribution
- Curation Pipeline: End-to-end content curation from request to response
- Error Recovery: Retry mechanisms with real APIs, circuit breaker with database

### End-to-End Testing

E2E tests will verify complete user journeys using **Playwright**:

- User registration and onboarding with age collection
- Completing a learning module and earning Green Coins
- Joining and participating in a climate mission
- Viewing age-curated dashboard content
- Error recovery scenarios (network failures, auth expiration)

### Testing Tools

- **Unit Tests**: Vitest with Testing Library
- **Property Tests**: fast-check
- **Integration Tests**: Vitest with Supabase test client
- **E2E Tests**: Playwright
- **Coverage**: Vitest coverage reports

## Performance Considerations

### Optimization Strategies

1. **Database Optimization**
   - Index frequently queried fields (user_id, age_cohort, content_type)
   - Use materialized views for complex aggregations
   - Implement pagination for large result sets
   - Cache frequently accessed data (user profiles, cohort preferences)

2. **Frontend Optimization**
   - Lazy load components and routes
   - Implement virtual scrolling for long lists
   - Optimize images with responsive formats
   - Use React.memo for expensive components
   - Debounce search inputs and curation requests

3. **Curation Optimization**
   - Cache relevance scores for 15 minutes
   - Cache cohort preferences for 1 hour
   - Batch score calculations for multiple items
   - Use Redis for distributed caching in production

4. **Error Handling Optimization**
   - Error categorization: < 1ms
   - Sanitization: < 5ms
   - Logging: < 10ms (async)
   - Sentry capture: < 50ms (async, non-blocking)

### Performance Targets

- Initial page load: < 3 seconds
- API response time: < 500ms (95th percentile)
- Curation request: < 500ms for 50 items
- Real-time updates: < 2 seconds
- AI response time: < 5 seconds
- Database query time: < 100ms (95th percentile)
- Error handling latency: < 10ms

## Security Considerations

### Authentication & Authorization

- Implement Row Level Security (RLS) in Supabase
- Use JWT tokens for session management
- Implement role-based access control (RBAC)
- Require email/phone verification for all accounts
- Implement rate limiting on authentication endpoints

### Data Protection

- Encrypt sensitive data at rest and in transit
- Encrypt age and date of birth using AES-256
- Implement data retention policies (90 days for error logs)
- Anonymize user data in analytics
- Comply with data protection regulations (GDPR, Kenya Data Protection Act)

### Privacy Controls

- Request explicit consent for age-based personalization
- Provide easy opt-out mechanism for curation
- Allow users to view collected data
- Implement right to deletion for age data
- Sanitize all PII before logging or reporting

### API Security

- Implement API key rotation
- Use environment variables for secrets
- Implement CORS policies
- Validate all user inputs
- Sanitize data before database insertion
- Rate limit error reporting endpoints

## Deployment Strategy

### Phased Rollout

**Phase 1: Core Platform Features (Weeks 1-4)**
- User registration with age collection
- Basic profile management
- Community browsing and joining
- Simple mission participation
- Error handling infrastructure

**Phase 2: AI & Engagement Features (Weeks 5-8)**
- AI Climate Companion (Green Mentor)
- Learning modules and quizzes
- Green Coin system
- Basic gamification (badges, leaderboards)
- Content curation engine (basic)

**Phase 3: Advanced Curation & Verification (Weeks 9-12)**
- Full age-based content curation
- Verification-as-a-Service
- Digital Tree Wallet
- Ambassador program
- Policy engagement tools
- Advanced error recovery

**Phase 4: Optimization & Scale (Weeks 13-16)**
- Revenue tracking
- USSD integration
- Advanced analytics dashboard
- Performance optimization
- Production error monitoring

### Infrastructure

- **Frontend**: Vercel for hosting and CDN
- **Backend**: Supabase Cloud for database, auth, and storage
- **AI**: OpenAI/Anthropic API for Climate Companion
- **Caching**: Redis for relevance scores and cohort preferences
- **Monitoring**: Sentry for error tracking, Vercel Analytics for performance
- **CI/CD**: GitHub Actions for automated testing and deployment

### Monitoring & Observability

**Key Metrics:**
- User registrations and onboarding completion rate
- Mission completions and verification rate
- Green Coins earned and spent
- Content curation request latency
- Cache hit rate for curation
- Error rate by type and severity
- Recovery success rate
- Circuit breaker open count

**Alerting:**
- Error rate > 10 errors/minute: Warning
- Error rate > 50 errors/minute: Critical
- Curation latency > 1s: Warning
- Circuit breaker opened: Warning
- Recovery failure rate > 50%: Warning

## Future Enhancements

### Platform Vision Enhancements

- **Marketplace Integration**: Eco-products, native seedlings, composting kits
- **Advanced AI Features**: Predictive analytics, personalized learning paths, automated verification using computer vision
- **Mobile Applications**: Native iOS and Android apps with offline-first architecture
- **International Expansion**: Multi-language support, currency localization, regional partners
- **Blockchain Integration**: NFT badges on Polygon, tokenized carbon credits

### Content Curation Enhancements

- **Machine Learning Integration**: Collaborative filtering, content embeddings, reinforcement learning
- **Multi-Dimensional Profiling**: Consider location, interests, and skills in addition to age
- **Temporal Patterns**: Learn time-of-day preferences, day-of-week patterns, seasonal engagement
- **Social Signals**: Incorporate friend activity, social proof, collaborative filtering
- **Cross-Platform Integration**: Mobile optimization, email digests, push notifications

### Error Handling Enhancements

- **Advanced Analytics**: Predictive error detection, anomaly detection, root cause analysis
- **Automated Resolution**: Self-healing systems, automated rollback, intelligent retry strategies
- **Enhanced Debugging**: Time-travel debugging, replay capabilities, distributed tracing
- **User Experience**: Proactive error prevention, contextual help, guided recovery

## Success Criteria

### Technical Success
- ✅ All 45 correctness properties verified through property-based testing
- ✅ 80% code coverage achieved
- ✅ All performance targets met (< 500ms API response, < 3s page load)
- ✅ Zero sensitive data leaks in logs or error reports
- ✅ Error recovery success rate > 70%
- ✅ Curation accuracy > 70% in predicting user engagement

### User Success
- ✅ Onboarding completion rate > 80%
- ✅ Age-appropriate content engagement rate > 60%
- ✅ Clear error messages reduce support tickets by 40%
- ✅ Mission participation rate increases by 50%
- ✅ User retention rate > 70% after 30 days

### Business Success
- ✅ Platform supports 10,000+ active users
- ✅ 100,000+ trees tracked in Digital Tree Wallets
- ✅ 1,000+ verified climate actions per month
- ✅ Revenue streams operational (campaigns, VaaS, marketplace)
- ✅ Platform uptime > 99.5%

