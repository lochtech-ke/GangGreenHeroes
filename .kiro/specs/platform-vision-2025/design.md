# Design Document

## Overview

The Gang Green Platform Vision 2025 redesign transforms the platform from a tree-planting and carbon credit marketplace into a comprehensive community-powered climate action ecosystem. The design emphasizes community-first engagement, AI-powered personalization, transparent verification, and sustained participation through gamification and rewards.

The platform serves as the unifying fabric that connects, engages, and verifies environmental community work, aligning local actions with global climate goals. It addresses Kenya's climate action fragmentation by providing a single digital hub where communities, organizations, schools, and individuals can mobilize, learn, act, and be recognized for their environmental contributions.

## Architecture

### High-Level Architecture

The platform follows a modern web application architecture with the following layers:

1. **Presentation Layer**: React-based SPA with TypeScript, Tailwind CSS, and responsive design
2. **Application Layer**: Service-oriented architecture with domain-specific services
3. **Data Layer**: Supabase PostgreSQL with PostGIS for geospatial data
4. **Integration Layer**: External APIs (Antugrow AI, payment gateways, USSD providers)
5. **AI Layer**: OpenAI/Anthropic integration for Climate Companion chatbot
6. **Verification Layer**: Multi-source verification system (GPS, photos, expert review)

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TS)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Community │  │Missions  │  │Learning  │   │
│  │          │  │Hub       │  │          │  │Modules   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │User      │  │Community │  │Mission   │  │Education │   │
│  │Service   │  │Service   │  │Service   │  │Service   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Green Coin│  │Tree      │  │VaaS      │  │AI        │   │
│  │Service   │  │Wallet    │  │Service   │  │Companion │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer (Supabase)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Users     │  │Communities│ │Missions  │  │Learning  │   │
│  │Profiles  │  │Posts     │  │Actions   │  │Modules   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Green     │  │Trees     │  │Verifications│ │Badges   │   │
│  │Coins     │  │          │  │            │  │         │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Antugrow  │  │OpenAI/   │  │Payment   │  │USSD      │   │
│  │AI        │  │Anthropic │  │Gateway   │  │Provider  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### User Journey Flow

```
Registration → Onboarding → Profile Setup → Green Mentor Intro
     │              │             │                │
     ▼              ▼             ▼                ▼
Select User    Watch Welcome  Choose Climate   Meet AI
Type           Video          Interests        Companion
     │              │             │                │
     └──────────────┴─────────────┴────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Personal Dashboard│
              └─────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   Community Hub   Learning Modules  Climate Missions
        │               │               │
        ▼               ▼               ▼
   Join Groups    Complete Courses  Participate in Actions
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Earn Green Coins │
              │  & Badges        │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Progress Through │
              │ Badge Tiers      │
              └─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │ Become Ambassador│
              │ (Hummingbird Hero)│
              └─────────────────┘
```

## Components and Interfaces

### 1. User Management System

**Components:**
- `UserRegistration`: Multi-type registration (Individual, Corporate, Community, Partner)
- `UserProfile`: Profile management with climate interests and preferences
- `UserDashboard`: Personalized dashboard with activity feed and recommendations
- `UserJourneyTracker`: Tracks progression through stages (Onboarding → Hero)

**Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  phone?: string;
  userType: 'individual' | 'corporate' | 'community' | 'partner';
  climateInterests: ('trees' | 'water' | 'waste' | 'policy')[];
  journeyStage: 'onboarding' | 'engagement' | 'contribution' | 'recognition' | 'hero';
  badgeTier: 'steward' | 'platinum' | 'hero';
  greenCoins: number;
  treesPlanted: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  userId: string;
  displayName: string;
  avatar?: string;
  location: {
    county: string;
    subCounty?: string;
  };
  bio?: string;
  isAmbassador: boolean;
  referralCode: string;
  referredBy?: string;
}
```

### 2. AI Climate Companion (Green Mentor)

**Components:**
- `ChatInterface`: Chat UI for interacting with AI companion
- `RecommendationEngine`: Generates personalized action recommendations
- `OnboardingGuide`: AI-guided onboarding flow
- `EducationalExplainer`: Simplifies complex environmental concepts

**Interfaces:**
```typescript
interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    userInterests: string[];
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
  actionUrl: string;
}
```

### 3. Community Hub

**Components:**
- `CommunityBrowser`: Browse and search communities
- `CommunityFeed`: Display posts, events, and updates
- `CommunityProfile`: Community details and member list
- `PostComposer`: Create posts with text, images, and links
- `EventCalendar`: View and manage community events

**Interfaces:**
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  focusAreas: string[];
  location: {
    county: string;
    subCounty?: string;
  };
  memberCount: number;
  activityLevel: 'low' | 'medium' | 'high';
  avatar?: string;
  coverImage?: string;
  createdAt: Date;
}

interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  content: string;
  images?: string[];
  links?: string[];
  likes: number;
  comments: number;
  createdAt: Date;
}

interface CommunityEvent {
  id: string;
  communityId: string;
  title: string;
  description: string;
  eventType: 'tree_planting' | 'cleanup' | 'workshop' | 'meeting';
  location: {
    name: string;
    coordinates: [number, number];
  };
  startDate: Date;
  endDate: Date;
  participantCount: number;
  maxParticipants?: number;
}
```

### 4. Educational System

**Components:**
- `LearningDashboard`: Overview of available modules and progress
- `MicroLesson`: Short, focused lesson component
- `DailyNugget`: Daily environmental fact or tip
- `Quiz`: Interactive quiz with immediate feedback
- `Certificate`: Digital certificate for completed modules

**Interfaces:**
```typescript
interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'conservation' | 'waste' | 'water' | 'climate_justice' | 'policy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  lessons: Lesson[];
  quiz?: Quiz;
  greenCoinReward: number;
  badgeReward?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  mediaType: 'text' | 'video' | 'infographic' | 'interactive';
  mediaUrl?: string;
  order: number;
}

interface UserProgress {
  userId: string;
  moduleId: string;
  completedLessons: string[];
  quizScore?: number;
  completedAt?: Date;
  certificateIssued: boolean;
}
```

### 5. Climate Missions System

**Components:**
- `MissionBrowser`: Browse available missions
- `MissionDetails`: Detailed mission information
- `MissionParticipation`: Join and track mission participation
- `MissionVerification`: Submit verification evidence
- `MissionMap`: Geographic view of missions

**Interfaces:**
```typescript
interface Mission {
  id: string;
  title: string;
  description: string;
  missionType: 'tree_planting' | 'waste_cleanup' | 'water_conservation' | 'petition' | 'fundraising';
  organizerId: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  startDate: Date;
  endDate: Date;
  targetImpact: {
    metric: string;
    value: number;
  };
  currentImpact: {
    metric: string;
    value: number;
  };
  participantCount: number;
  greenCoinReward: number;
  verificationRequired: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

interface MissionParticipation {
  id: string;
  missionId: string;
  userId: string;
  joinedAt: Date;
  contribution?: {
    metric: string;
    value: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationEvidence?: VerificationEvidence;
}
```

### 6. Verification-as-a-Service (VaaS)

**Components:**
- `VerificationSubmission`: Submit evidence for verification
- `VerificationReview`: Expert review interface
- `VerificationReport`: Public verification report
- `VerificationDashboard`: Admin dashboard for managing verifications

**Interfaces:**
```typescript
interface VerificationEvidence {
  id: string;
  actionId: string;
  userId: string;
  evidenceType: 'photo' | 'video' | 'gps' | 'document';
  files: {
    url: string;
    metadata: {
      gpsCoordinates?: [number, number];
      timestamp: Date;
      deviceInfo?: string;
    };
  }[];
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

interface VerificationReport {
  id: string;
  actionId: string;
  verificationStatus: 'verified' | 'unverified' | 'disputed';
  evidenceCount: number;
  reviewCount: number;
  impactMetrics: {
    metric: string;
    value: number;
    unit: string;
  }[];
  publicUrl: string;
  generatedAt: Date;
}
```

### 7. Green Coins Economy

**Components:**
- `GreenCoinWallet`: Display user's coin balance and history
- `GreenCoinTransaction`: Record coin earnings and spending
- `RewardCalculator`: Calculate rewards based on action type
- `ReferralTracker`: Track referral bonuses

**Interfaces:**
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
  source: string; // mission_id, module_id, referral_id, etc.
  description: string;
  timestamp: Date;
}

interface RewardRule {
  actionType: string;
  baseReward: number;
  multipliers: {
    condition: string;
    factor: number;
  }[];
}
```

### 8. Digital Tree Wallet

**Components:**
- `TreeWallet`: Display user's planted trees
- `TreeCard`: Individual tree details and health
- `TreeMap`: Geographic view of user's trees
- `ImpactCalculator`: Calculate CO₂ sequestration

**Interfaces:**
```typescript
interface TreeWallet {
  userId: string;
  totalTrees: number;
  totalCO2Sequestered: number; // kg
  trees: PlantedTree[];
}

interface PlantedTree {
  id: string;
  userId: string;
  species: string;
  plantedDate: Date;
  location: {
    name: string;
    coordinates: [number, number];
  };
  healthStatus: 'healthy' | 'needs_attention' | 'deceased';
  growthData: {
    height: number; // cm
    diameter: number; // cm
    lastMeasured: Date;
  };
  photos: {
    url: string;
    capturedAt: Date;
  }[];
  estimatedCO2: number; // kg per year
}
```

### 9. Gamification System

**Components:**
- `BadgeDisplay`: Show earned badges
- `Leaderboard`: Display rankings
- `StreakTracker`: Track activity streaks
- `ChallengeCard`: Display active challenges
- `ProgressBar`: Visual progress indicators

**Interfaces:**
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'steward' | 'platinum' | 'hero';
  iconType: 'hummingbird' | 'tree' | 'water' | 'shield' | 'star';
  criteria: {
    metric: string;
    threshold: number;
  }[];
  earnedBy: number; // count of users
}

interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
  progress?: number; // for progressive badges
}

interface Leaderboard {
  id: string;
  type: 'green_coins' | 'trees_planted' | 'community_impact';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  scope: 'global' | 'county' | 'community';
  entries: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  score: number;
  badge?: string;
}

interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
}
```

### 10. Impact Dashboard

**Components:**
- `ImpactOverview`: High-level metrics
- `ImpactChart`: Visualize trends over time
- `RegionalMap`: Geographic distribution of impact
- `ImpactReport`: Generate detailed reports

**Interfaces:**
```typescript
interface PlatformImpact {
  totalTreesPlanted: number;
  totalWasteCollected: number; // kg
  totalCO2Sequestered: number; // kg
  communitiesActivated: number;
  activeUsers: number;
  verifiedActions: number;
  lastUpdated: Date;
}

interface RegionalImpact {
  county: string;
  subCounty?: string;
  treesPlanted: number;
  wasteCollected: number;
  activeUsers: number;
  activeCommunities: number;
  coordinates: [number, number];
}

interface ImpactTimeSeries {
  metric: string;
  dataPoints: {
    date: Date;
    value: number;
  }[];
}
```

### 11. Ambassador Program

**Components:**
- `AmbassadorApplication`: Apply for ambassador status
- `AmbassadorDashboard`: Manage events and track impact
- `AmbassadorProfile`: Public ambassador profile
- `ReferralManager`: Track referrals and rewards

**Interfaces:**
```typescript
interface Ambassador {
  userId: string;
  approvedAt: Date;
  region: {
    county: string;
    subCounty?: string;
  };
  specializations: string[];
  eventsOrganized: number;
  membersReferred: number;
  impactScore: number;
  status: 'active' | 'inactive' | 'suspended';
}

interface AmbassadorEvent {
  id: string;
  ambassadorId: string;
  title: string;
  description: string;
  eventType: string;
  location: {
    name: string;
    coordinates: [number, number];
  };
  date: Date;
  participantCount: number;
  impactMetrics: {
    metric: string;
    value: number;
  }[];
}
```

### 12. Policy Engagement

**Components:**
- `PetitionBrowser`: Browse active petitions
- `PetitionDetails`: Detailed petition information
- `PetitionSignature`: Sign petitions
- `AdvocacyCampaign`: Campaign management

**Interfaces:**
```typescript
interface Petition {
  id: string;
  title: string;
  description: string;
  targetAudience: 'county' | 'national' | 'international';
  targetOrganization: string;
  signatureGoal: number;
  currentSignatures: number;
  deadline: Date;
  status: 'active' | 'successful' | 'closed';
  createdBy: string;
  createdAt: Date;
}

interface PetitionSignature {
  id: string;
  petitionId: string;
  userId: string;
  signedAt: Date;
  publicDisplay: boolean;
}
```

## Data Models

### Database Schema

```sql
-- Users and Profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'corporate', 'community', 'partner')),
  journey_stage VARCHAR(20) DEFAULT 'onboarding',
  badge_tier VARCHAR(20) DEFAULT 'steward',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  display_name VARCHAR(100) NOT NULL,
  avatar TEXT,
  county VARCHAR(50),
  sub_county VARCHAR(50),
  bio TEXT,
  is_ambassador BOOLEAN DEFAULT FALSE,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_climate_interests (
  user_id UUID REFERENCES users(id),
  interest VARCHAR(20) CHECK (interest IN ('trees', 'water', 'waste', 'policy')),
  PRIMARY KEY (user_id, interest)
);

-- Communities
CREATE TABLE communities (
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

CREATE TABLE community_focus_areas (
  community_id UUID REFERENCES communities(id),
  focus_area VARCHAR(50),
  PRIMARY KEY (community_id, focus_area)
);

CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE community_posts (
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

-- Learning System
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  duration INTEGER, -- minutes
  green_coin_reward INTEGER,
  badge_reward VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES learning_modules(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  media_type VARCHAR(20),
  media_url TEXT,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_learning_progress (
  user_id UUID REFERENCES users(id),
  module_id UUID REFERENCES learning_modules(id),
  completed_lessons UUID[],
  quiz_score INTEGER,
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, module_id)
);

-- Missions
CREATE TABLE missions (
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

CREATE TABLE mission_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  contribution_metric VARCHAR(50),
  contribution_value NUMERIC,
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP
);

-- Verification System
CREATE TABLE verification_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID, -- references mission_participation or other action
  user_id UUID REFERENCES users(id),
  evidence_type VARCHAR(20),
  files JSONB, -- array of {url, metadata}
  description TEXT,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE verification_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evidence_id UUID REFERENCES verification_evidence(id),
  reviewer_id UUID REFERENCES users(id),
  reviewer_organization VARCHAR(50),
  status VARCHAR(20),
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Green Coins
CREATE TABLE green_coin_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER DEFAULT 0,
  lifetime_earnings INTEGER DEFAULT 0,
  lifetime_spending INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE green_coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(20),
  amount INTEGER,
  source VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tree Wallet
CREATE TABLE planted_trees (
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

CREATE TABLE tree_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID REFERENCES planted_trees(id),
  photo_url TEXT,
  captured_at TIMESTAMP
);

-- Gamification
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(20),
  icon_type VARCHAR(20),
  criteria JSONB,
  earned_by_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER,
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

-- Ambassadors
CREATE TABLE ambassadors (
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
CREATE TABLE petitions (
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

CREATE TABLE petition_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  petition_id UUID REFERENCES petitions(id),
  user_id UUID REFERENCES users(id),
  signed_at TIMESTAMP DEFAULT NOW(),
  public_display BOOLEAN DEFAULT TRUE,
  UNIQUE (petition_id, user_id)
);

-- AI Chat History
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20),
  content TEXT,
  context JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing all testable properties from the prework analysis, several opportunities for consolidation emerge:

- Properties 3.1, 3.3, 5.2, 6.4, 8.4, and 12.1 all test that specific data structures contain required fields - these can be consolidated into a single "data completeness" property
- Properties 4.2, 4.4, and 4.5 all test that learning module completion triggers specific rewards - these can be combined
- Properties 7.3 and 10.5 both test real-time balance/metric updates - these can be unified
- Properties 9.1 and 9.2 both test badge progression logic - these can be combined
- Properties 11.3, 11.4, and 11.5 all test ambassador-specific features - these can be consolidated

After consolidation, we have 45 unique properties that provide comprehensive validation coverage.

### Correctness Properties

Property 1: Registration requires verification
*For any* user registration, access to the platform should only be granted after email or phone verification is completed
**Validates: Requirements 1.2**

Property 2: First login initializes chatbot
*For any* user's first login, their profile should be initialized with a Green Mentor chatbot introduction
**Validates: Requirements 1.5**

Property 3: Recommendations match user interests
*For any* user with specified climate interests, AI recommendations should align with at least one of those interests
**Validates: Requirements 2.1**

Property 4: Guidance system provides suggestions
*For any* user state (onboarding, active, inactive), the platform should provide at least one appropriate suggestion for next steps
**Validates: Requirements 2.3**

Property 5: Recommendations use profile data
*For any* recommendation generated, the algorithm should access user profile, location, and past activity data
**Validates: Requirements 2.5**

Property 6: Data completeness for entities
*For any* displayed entity (community, mission, tree, petition, verified action), all required fields specified in the requirements should be present and non-null
**Validates: Requirements 3.1, 3.3, 5.2, 6.4, 8.4, 12.1**

Property 7: Community membership grants access
*For any* user joining a community, they should immediately gain access to community threads, events, and missions
**Validates: Requirements 3.2**

Property 8: Search filters match results
*For any* community search with filters applied, all returned results should match the specified filter criteria
**Validates: Requirements 3.5**

Property 9: Learning completion triggers rewards
*For any* completed learning module, quiz, or course, the platform should award Green Coins, update progress, and issue certificates as specified
**Validates: Requirements 4.2, 4.4, 4.5**

Property 10: Mission completion requires verification
*For any* mission completion, rewards should only be awarded after photo and GPS verification is submitted and approved
**Validates: Requirements 5.3**

Property 11: Participation tracking is accurate
*For any* user participation in fundraising or petition signing, the contribution should be recorded and progress metrics should be updated correctly
**Validates: Requirements 5.4, 5.5**

Property 12: Action submission requires evidence
*For any* climate action submission, the platform should reject submissions that lack geo-tagged photos or videos
**Validates: Requirements 6.1**

Property 13: Verification routing is appropriate
*For any* verification request, it should be routed to a reviewer from an appropriate partner organization based on action type
**Validates: Requirements 6.2**

Property 14: Verification generates reports
*For any* verified action, a public project report should be generated containing validation details, reviewer information, and timestamp
**Validates: Requirements 6.3, 6.5**

Property 15: Reward calculation follows rules
*For any* verified action, Green Coins awarded should match the calculation based on action type, impact, and applicable multipliers
**Validates: Requirements 7.1**

Property 16: Real-time balance updates
*For any* Green Coin earning or spending event, the user's wallet balance should update immediately and reflect the correct amount
**Validates: Requirements 7.3, 10.5**

Property 17: Milestone unlocks are triggered
*For any* user reaching a Green Coin milestone, appropriate badges and recognition tiers should be unlocked automatically
**Validates: Requirements 7.4**

Property 18: Referral rewards are awarded
*For any* successful referral (friend completes registration), the referring user should receive bonus Green Coins
**Validates: Requirements 7.5**

Property 19: Tree planting creates wallet entry
*For any* tree planted by a user, it should appear in their Digital Tree Wallet with location, date, and initial health status
**Validates: Requirements 8.1**

Property 20: Tree monitoring updates data
*For any* tree monitoring event, the tree's growth data and health metrics should be updated with the latest information
**Validates: Requirements 8.3**

Property 21: Impact sharing generates content
*For any* user sharing their impact, the platform should generate social media content containing accurate impact statistics
**Validates: Requirements 8.5**

Property 22: Badge progression follows tiers
*For any* user completing actions, badges should be awarded according to achievement type, and users should progress through tiers (Steward → Platinum → Hero) when criteria are met
**Validates: Requirements 9.1, 9.2**

Property 23: Streak tracking is consistent
*For any* user with consecutive daily activity, their streak count should increment correctly and bonus points should be awarded
**Validates: Requirements 9.4**

Property 24: Team scores aggregate correctly
*For any* team challenge, the team score should equal the sum of all individual member scores
**Validates: Requirements 9.5**

Property 25: CO₂ calculation uses tree data
*For any* tree in the system, CO₂ sequestration calculations should use the tree's species and age data
**Validates: Requirements 10.2**

Property 26: Reports contain evidence
*For any* generated report, it should include supporting evidence and data sources for all claims
**Validates: Requirements 10.4**

Property 27: Ambassador eligibility enables application
*For any* user meeting ambassador criteria, the application form should be accessible and functional
**Validates: Requirements 11.1**

Property 28: Ambassador approval grants permissions
*For any* approved ambassador, permissions to create and manage local events should be granted immediately
**Validates: Requirements 11.2**

Property 29: Ambassador features work correctly
*For any* ambassador-led event, participation should be tracked, referrals should be recorded with bonuses, and milestone achievements should trigger hall-of-fame inclusion
**Validates: Requirements 11.3, 11.4, 11.5**

Property 30: Petition signing is recorded
*For any* petition signature, it should be recorded in the database, the signature count should increment, and a confirmation should be sent
**Validates: Requirements 12.2**

Property 31: Petition milestones trigger notifications
*For any* petition reaching a milestone (e.g., 100, 500, 1000 signatures), notifications should be sent to all supporters
**Validates: Requirements 12.3**

Property 32: Partner permissions are granted
*For any* partner organization registration, verification and validation permissions should be granted automatically
**Validates: Requirements 13.4**

Property 33: Dashboards vary by user type
*For any* user type (individual, corporate, community, partner), the dashboard should display type-specific features and content
**Validates: Requirements 13.5**

Property 34: USSD actions are recorded
*For any* action performed via USSD, it should be stored in the database for later verification
**Validates: Requirements 14.2**

Property 35: Offline actions sync when online
*For any* USSD action performed offline, it should sync with the main platform when connectivity is restored
**Validates: Requirements 14.3**

Property 36: USSD actions send SMS confirmation
*For any* completed USSD action, an SMS confirmation should be sent containing action details
**Validates: Requirements 14.5**

Property 37: Campaign financial tracking
*For any* sponsored campaign, commission rates and payment schedules should be tracked in the database
**Validates: Requirements 15.1**

Property 38: Verification fee calculation
*For any* verification service request, fees should be calculated according to project scope and complexity rules
**Validates: Requirements 15.2**

Property 39: Transaction commission collection
*For any* marketplace transaction, commissions should be calculated correctly and recorded in financial reports
**Validates: Requirements 15.3**

Property 40: CSR fund tracking
*For any* CSR project, proceeds should be tracked and allocated according to the project's fund distribution rules
**Validates: Requirements 15.4**

Property 41: Financial report completeness
*For any* generated financial report, it should include revenue breakdowns for all streams: campaigns, VaaS, projects, and marketplace
**Validates: Requirements 15.5**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid user input, missing required fields, format violations
2. **Authentication Errors**: Invalid credentials, expired sessions, insufficient permissions
3. **Integration Errors**: External API failures (Antugrow, payment gateway, USSD provider)
4. **Data Errors**: Database connection failures, constraint violations, data corruption
5. **Verification Errors**: Missing evidence, invalid GPS coordinates, rejected submissions
6. **Business Logic Errors**: Insufficient Green Coins, mission capacity reached, duplicate actions

### Error Handling Strategy

**User-Facing Errors:**
- Display clear, actionable error messages in the UI
- Provide suggestions for resolution
- Log errors for debugging while protecting user privacy
- Implement retry mechanisms for transient failures

**System Errors:**
- Log detailed error information including stack traces
- Send alerts for critical failures
- Implement circuit breakers for external service calls
- Provide fallback mechanisms where possible

**Verification Errors:**
- Queue failed verifications for manual review
- Notify users of verification status changes
- Provide clear feedback on why verification failed
- Allow resubmission with corrected evidence

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  suggestions?: string[];
  retryable: boolean;
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

- **Service Layer**: Test each service method with mocked dependencies
- **Utility Functions**: Test calculation logic, data transformations, validation functions
- **React Components**: Test component rendering, user interactions, and state management
- **Data Models**: Test model validation, serialization, and business logic

**Key Unit Test Areas:**
- Green Coin reward calculations
- CO₂ sequestration calculations
- Badge progression logic
- Verification routing logic
- Search and filter algorithms
- User journey stage transitions

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property testing library):

- **Minimum 100 iterations** per property test to ensure thorough coverage
- Each property test must include a comment tag: `**Feature: platform-vision-2025, Property {number}: {property_text}**`
- Properties will be tested with randomly generated valid inputs
- Edge cases will be covered through generator configuration

**Property Test Implementation:**
- Property 1-41 will each have a dedicated property-based test
- Tests will use custom generators for complex data types (users, missions, trees, etc.)
- Generators will produce valid data that respects business constraints
- Shrinking will be enabled to find minimal failing examples

**Example Property Test Structure:**
```typescript
import fc from 'fast-check';

// **Feature: platform-vision-2025, Property 15: Reward calculation follows rules**
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

### Integration Testing

Integration tests will verify interactions between components:

- **API Integration**: Test Supabase queries, Antugrow API calls, payment gateway integration
- **Authentication Flow**: Test registration, login, verification, and session management
- **Mission Workflow**: Test mission creation, participation, verification, and reward distribution
- **Community Features**: Test joining communities, posting, and event management

### End-to-End Testing

E2E tests will verify complete user journeys using Playwright:

- User registration and onboarding flow
- Completing a learning module and earning Green Coins
- Joining and participating in a climate mission
- Becoming an ambassador and organizing an event
- Signing a petition and tracking progress

### Testing Tools

- **Unit Tests**: Vitest with Testing Library
- **Property Tests**: fast-check
- **Integration Tests**: Vitest with Supabase test client
- **E2E Tests**: Playwright
- **Coverage Target**: 80% code coverage

### Test Data Management

- Use factories to generate test data
- Implement database seeding for integration tests
- Use Supabase test projects for isolated testing
- Clean up test data after each test run

## Performance Considerations

### Optimization Strategies

1. **Database Optimization**
   - Index frequently queried fields (user_id, community_id, mission_id)
   - Use database views for complex aggregations
   - Implement pagination for large result sets
   - Cache frequently accessed data (user profiles, community lists)

2. **Frontend Optimization**
   - Lazy load components and routes
   - Implement virtual scrolling for long lists
   - Optimize images and use responsive formats
   - Use React.memo for expensive components
   - Implement debouncing for search inputs

3. **API Optimization**
   - Batch API requests where possible
   - Implement request caching with appropriate TTLs
   - Use Supabase real-time subscriptions for live updates
   - Implement rate limiting to prevent abuse

4. **AI Companion Optimization**
   - Cache common AI responses
   - Implement streaming for long responses
   - Use context window efficiently
   - Implement fallback responses for API failures

### Performance Targets

- Initial page load: < 3 seconds
- API response time: < 500ms (95th percentile)
- Real-time updates: < 2 seconds
- AI response time: < 5 seconds
- Database query time: < 100ms (95th percentile)

## Security Considerations

### Authentication & Authorization

- Implement Row Level Security (RLS) in Supabase
- Use JWT tokens for session management
- Implement role-based access control (RBAC)
- Require email/phone verification for all accounts
- Implement rate limiting on authentication endpoints

### Data Protection

- Encrypt sensitive data at rest and in transit
- Implement data retention policies
- Anonymize user data in analytics
- Comply with data protection regulations (GDPR, Kenya Data Protection Act)
- Implement audit logging for sensitive operations

### Verification Security

- Validate GPS coordinates against known locations
- Check photo EXIF data for tampering
- Implement fraud detection for suspicious patterns
- Require multiple verification sources for high-value actions
- Implement reviewer reputation system

### API Security

- Implement API key rotation
- Use environment variables for secrets
- Implement CORS policies
- Validate all user inputs
- Sanitize data before database insertion

## Deployment Strategy

### Phased Rollout

**Phase 1: Core Features (Weeks 1-4)**
- User registration and authentication
- Basic profile management
- Community browsing and joining
- Simple mission participation

**Phase 2: Engagement Features (Weeks 5-8)**
- AI Climate Companion
- Learning modules and quizzes
- Green Coin system
- Basic gamification (badges, leaderboards)

**Phase 3: Advanced Features (Weeks 9-12)**
- Verification-as-a-Service
- Digital Tree Wallet
- Ambassador program
- Policy engagement tools

**Phase 4: Monetization & Scale (Weeks 13-16)**
- Revenue tracking
- USSD integration
- Advanced analytics dashboard
- Performance optimization

### Infrastructure

- **Frontend**: Vercel for hosting and CDN
- **Backend**: Supabase Cloud for database, auth, and storage
- **AI**: OpenAI/Anthropic API for Climate Companion
- **Monitoring**: Sentry for error tracking, Vercel Analytics for performance
- **CI/CD**: GitHub Actions for automated testing and deployment

### Monitoring & Observability

- Track key metrics: user registrations, mission completions, Green Coins earned
- Monitor API performance and error rates
- Set up alerts for critical failures
- Implement user feedback collection
- Track conversion funnel metrics

## Future Enhancements

### Marketplace Integration

- Eco-products marketplace
- Native seedling sales
- Composting kits and training materials
- Carbon credit trading

### Advanced AI Features

- Predictive analytics for climate impact
- Personalized learning paths
- Automated verification using computer vision
- Natural language processing for community posts

### Mobile Applications

- Native iOS and Android apps
- Offline-first architecture
- Push notifications for missions and events
- Camera integration for verification

### International Expansion

- Multi-language support
- Currency localization
- Regional partner integration
- Cross-border verification standards

### Blockchain Integration

- NFT badges on Polygon
- Tokenized carbon credits
- Decentralized verification
- Smart contract automation
