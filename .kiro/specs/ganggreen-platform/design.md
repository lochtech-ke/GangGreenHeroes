# Design Document

## Overview

The **#GangGreen** platform is a full-stack web application built to catalyze carbon-negative conservation efforts across Africa, starting with three pilot forests in Kenya. The platform leverages modern web technologies, Supabase for backend services, and integrates with Antugrow's API for AI-powered tree monitoring and verification.

### Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS for styling
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage, Real-time subscriptions)
- **Blockchain**: Ethereum/Polygon for Web3 integration, ethers.js for wallet connectivity
- **Smart Contracts**: Solidity for NFT badge minting and cryptocurrency donations
- **Web3 Wallet**: MetaMask, WalletConnect for multi-wallet support
- **NFT Standard**: ERC-721 for unique achievement badges
- **External APIs**: Antugrow API for tree monitoring and AI image analysis
- **Mapping**: Leaflet.js or Mapbox for geospatial visualization
- **State Management**: React Context API or Zustand
- **Build Tool**: Vite
- **Deployment**: Vercel (frontend), Supabase (backend), Polygon Mumbai/Mainnet (smart contracts)

### Supabase Configuration

- **Project ID**: wobpryllvdjaapzjbsxx
- **Publishable Key**: sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile Web  │  │   Admin      │     │
│  │   (React)    │  │  (Responsive)│  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Supabase Client SDK                         │  │
│  │  (Auth, Database, Storage, Real-time)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│   Supabase Backend       │    │   Antugrow API           │    │   Blockchain Layer       │
│  ┌────────────────────┐  │    │  ┌────────────────────┐ │    │  ┌────────────────────┐ │
│  │  PostgreSQL DB     │  │    │  │  Tree Monitoring   │ │    │  │  Smart Contracts   │ │
│  │  - Users           │  │    │  │  - Growth Tracking │ │    │  │  - NFT Badges      │ │
│  │  - Wallet Addresses│  │    │  │  - AI Analysis     │ │    │  │  - Donations       │ │
│  │  - Initiatives     │  │    │  │  - AI Analysis     │ │
│  │  - Trees           │  │    │  │  - Health Status   │ │
│  │  - Transactions    │  │    │  └────────────────────┘ │
│  └────────────────────┘  │    └──────────────────────────┘
│  ┌────────────────────┐  │
│  │  Auth Service      │  │
│  │  - JWT Tokens      │  │
│  │  - Row Level Sec   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  Storage Buckets   │  │
│  │  - Tree Images     │  │
│  │  - Documents       │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Component Architecture

The frontend follows a modular component-based architecture:

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── ImpactMetrics.tsx
│   │   ├── ForestSelector.tsx
│   │   └── ActivityFeed.tsx
│   ├── initiatives/
│   │   ├── InitiativeCard.tsx
│   │   ├── InitiativeForm.tsx
│   │   └── InitiativeMap.tsx
│   ├── trees/
│   │   ├── TreeRegistry.tsx
│   │   ├── TreeUpload.tsx
│   │   └── TreeHealthStatus.tsx
│   ├── marketplace/
│   │   ├── CarbonCreditList.tsx
│   │   ├── PurchaseFlow.tsx
│   │   └── TransactionHistory.tsx
│   ├── web3/
│   │   ├── WalletConnect.tsx
│   │   ├── CryptoDonation.tsx
│   │   ├── DonationHistory.tsx
│   │   └── NetworkSelector.tsx
│   ├── nft/
│   │   ├── BadgeGallery.tsx
│   │   ├── BadgeCard.tsx
│   │   ├── MintBadge.tsx
│   │   └── BadgeDetails.tsx
│   ├── gamification/
│   │   ├── PointsDisplay.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── AchievementList.tsx
│   │   ├── ChallengeQuests.tsx
│   │   └── ReferralSystem.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── LoadingSpinner.tsx
├── services/
│   ├── supabase.ts
│   ├── antugrow.ts
│   ├── auth.service.ts
│   ├── initiative.service.ts
│   ├── tree.service.ts
│   ├── web3.service.ts
│   ├── nft.service.ts
│   └── gamification.service.ts
├── contracts/
│   ├── GangGreenBadge.sol
│   ├── DonationManager.sol
│   └── scripts/
│       ├── deploy.ts
│       └── verify.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useInitiatives.ts
│   ├── useTrees.ts
│   ├── useWeb3.ts
│   ├── useNFT.ts
│   └── useGamification.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── ForestContext.tsx
│   └── Web3Context.tsx
├── types/
│   ├── user.types.ts
│   ├── initiative.types.ts
│   ├── tree.types.ts
│   ├── web3.types.ts
│   └── nft.types.ts
└── utils/
    ├── constants.ts
    └── helpers.ts
```

## Components and Interfaces

### Core Components

#### 1. Authentication System

**Components:**
- `LoginForm`: Email/password login with Supabase Auth
- `RegisterForm`: User registration with role selection
- `ProtectedRoute`: Route guard for authenticated pages

**Interfaces:**
```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'organization' | 'community' | 'individual';
  forest_preference?: 'kakamega' | 'karura' | 'mau';
  created_at: string;
  profile: UserProfile;
}

interface UserProfile {
  full_name: string;
  phone?: string;
  organization?: string;
  location?: string;
  avatar_url?: string;
}
```

#### 2. Initiative Management

**Components:**
- `InitiativeCard`: Display initiative summary
- `InitiativeForm`: Create/edit initiatives
- `InitiativeMap`: Geospatial visualization
- `InitiativeDetails`: Full initiative information

**Interfaces:**
```typescript
interface Initiative {
  id: string;
  title: string;
  description: string;
  forest: 'kakamega' | 'karura' | 'mau';
  target_trees: number;
  trees_planted: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  location: GeoJSON.Point;
  area_hectares: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface InitiativeParticipant {
  id: string;
  initiative_id: string;
  user_id: string;
  trees_contributed: number;
  joined_at: string;
}
```

#### 3. Tree Registry and Monitoring

**Components:**
- `TreeRegistry`: List and search trees
- `TreeUpload`: Upload tree images for AI analysis
- `TreeHealthStatus`: Display Antugrow analysis results
- `TreeGrowthChart`: Visualize growth over time

**Interfaces:**
```typescript
interface Tree {
  id: string;
  initiative_id: string;
  species: string;
  planted_date: string;
  location: GeoJSON.Point;
  planted_by: string;
  antugrow_id?: string;
  current_height_cm?: number;
  current_diameter_cm?: number;
  health_status?: 'healthy' | 'stressed' | 'diseased' | 'dead';
  last_monitored?: string;
  images: TreeImage[];
  created_at: string;
  updated_at: string;
}

interface TreeImage {
  id: string;
  tree_id: string;
  image_url: string;
  captured_at: string;
  antugrow_analysis?: AntugrowAnalysis;
}

interface AntugrowAnalysis {
  health_score: number;
  growth_rate: number;
  disease_detected: boolean;
  recommendations: string[];
  analyzed_at: string;
}
```

#### 4. Carbon Credit Marketplace

**Components:**
- `CarbonCreditList`: Browse available credits
- `CreditCard`: Display credit details
- `PurchaseFlow`: Multi-step purchase process
- `TransactionHistory`: User transaction records

**Interfaces:**
```typescript
interface CarbonCredit {
  id: string;
  initiative_id: string;
  quantity_tons: number;
  price_per_ton: number;
  currency: 'USD' | 'KES';
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_certificate_url?: string;
  available_quantity: number;
  created_at: string;
}

interface Transaction {
  id: string;
  buyer_id: string;
  credit_id: string;
  quantity_tons: number;
  total_amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_date: string;
  receipt_url?: string;
}
```

#### 5. Impact Dashboard

**Components:**
- `ImpactMetrics`: Aggregate statistics
- `ForestComparison`: Compare pilot forests
- `TrendChart`: Historical data visualization
- `ReportGenerator`: Export impact reports

**Interfaces:**
```typescript
interface ImpactMetrics {
  forest: 'kakamega' | 'karura' | 'mau' | 'all';
  total_trees_planted: number;
  total_carbon_sequestered_tons: number;
  total_area_hectares: number;
  active_initiatives: number;
  total_participants: number;
  period_start: string;
  period_end: string;
}

interface ForestStats {
  forest_name: string;
  location: GeoJSON.Polygon;
  total_area_hectares: number;
  protected_area_hectares: number;
  trees_planted: number;
  carbon_sequestered_tons: number;
  active_initiatives: number;
  community_members: number;
}
```

#### 6. Web3 Cryptocurrency Donations

**Components:**
- `WalletConnect`: Connect Web3 wallet (MetaMask, WalletConnect)
- `CryptoDonation`: Donation flow with crypto selection
- `DonationHistory`: Blockchain transaction history
- `NetworkSelector`: Switch between Ethereum/Polygon networks

**Interfaces:**
```typescript
interface Web3Wallet {
  address: string;
  chain_id: number;
  network: 'ethereum' | 'polygon' | 'mumbai';
  connected: boolean;
  balance: {
    eth?: string;
    matic?: string;
    usdc?: string;
  };
}

interface CryptoDonation {
  id: string;
  user_id: string;
  wallet_address: string;
  initiative_id: string;
  amount: string;
  currency: 'ETH' | 'MATIC' | 'USDC';
  amount_usd: number;
  transaction_hash: string;
  block_number: number;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  created_at: string;
  confirmed_at?: string;
}

interface DonationReceipt {
  donation_id: string;
  transaction_hash: string;
  blockchain_explorer_url: string;
  certificate_url: string;
  tax_deductible: boolean;
}
```

#### 7. NFT Badge Reward System

**Components:**
- `BadgeGallery`: Display all earned badges
- `BadgeCard`: Individual badge display with metadata
- `MintBadge`: Badge minting interface
- `BadgeDetails`: Detailed badge information and rarity

**Interfaces:**
```typescript
interface NFTBadge {
  id: string;
  token_id: number;
  contract_address: string;
  owner_address: string;
  badge_type: 'tree_planter' | 'donor' | 'monitor' | 'ambassador' | 'legend';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  description: string;
  image_url: string;
  metadata_uri: string;
  rarity_score: number;
  minted_at: string;
  transaction_hash: string;
  attributes: BadgeAttribute[];
}

interface BadgeAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number';
}

interface BadgeCriteria {
  badge_type: string;
  tier: string;
  required_points: number;
  required_actions: {
    trees_planted?: number;
    donations_made?: number;
    trees_monitored?: number;
    referrals?: number;
  };
  max_supply?: number;
  current_supply: number;
}
```

#### 8. Gamification System

**Components:**
- `PointsDisplay`: User points and level
- `Leaderboard`: Rankings by forest and global
- `AchievementList`: Unlocked achievements
- `ChallengeQuests`: Active and completed challenges
- `ReferralSystem`: Referral tracking and rewards

**Interfaces:**
```typescript
interface UserGamification {
  user_id: string;
  total_points: number;
  level: number;
  experience_to_next_level: number;
  rank_global: number;
  rank_forest: number;
  badges_earned: number;
  achievements_unlocked: number;
  referrals_count: number;
  streak_days: number;
}

interface GamifiedAction {
  id: string;
  action_type: 'tree_plant' | 'donation' | 'monitor' | 'referral' | 'share' | 'verify';
  points_awarded: number;
  multiplier: number;
  description: string;
  user_id: string;
  related_entity_id?: string;
  created_at: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  points_reward: number;
  criteria: {
    action_type: string;
    count: number;
    timeframe?: string;
  };
  unlocked_by: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ChallengeQuest {
  id: string;
  title: string;
  description: string;
  forest?: 'kakamega' | 'karura' | 'mau';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'expired';
  objectives: QuestObjective[];
  rewards: {
    points: number;
    nft_badge?: string;
    special_recognition?: string;
  };
  participants_count: number;
}

interface QuestObjective {
  description: string;
  target: number;
  current_progress: number;
  completed: boolean;
}

interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  forest?: 'kakamega' | 'karura' | 'mau' | 'all';
  entries: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  points: number;
  badges_count: number;
  trees_planted: number;
  forest: string;
}
```

## Data Models

### Database Schema (Supabase PostgreSQL)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'organization', 'community', 'individual')),
  forest_preference TEXT CHECK (forest_preference IN ('kakamega', 'karura', 'mau')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  location TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Initiatives Table
```sql
CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  forest TEXT NOT NULL CHECK (forest IN ('kakamega', 'karura', 'mau')),
  target_trees INTEGER NOT NULL,
  trees_planted INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  area_hectares DECIMAL(10, 2),
  organization_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE initiative_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trees_contributed INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(initiative_id, user_id)
);
```

#### Trees Table
```sql
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  planted_date DATE NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  planted_by UUID REFERENCES users(id),
  antugrow_id TEXT UNIQUE,
  current_height_cm DECIMAL(10, 2),
  current_diameter_cm DECIMAL(10, 2),
  health_status TEXT CHECK (health_status IN ('healthy', 'stressed', 'diseased', 'dead')),
  last_monitored TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tree_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID REFERENCES trees(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  antugrow_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Carbon Credits Table
```sql
CREATE TABLE carbon_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  quantity_tons DECIMAL(10, 2) NOT NULL,
  price_per_ton DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_certificate_url TEXT,
  available_quantity DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id),
  credit_id UUID REFERENCES carbon_credits(id),
  quantity_tons DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receipt_url TEXT
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('initiative', 'milestone', 'transaction', 'system')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Web3 Wallets Table
```sql
CREATE TABLE web3_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  chain_id INTEGER NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('ethereum', 'polygon', 'mumbai')),
  is_primary BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, wallet_address)
);

CREATE INDEX idx_web3_wallets_address ON web3_wallets(wallet_address);
CREATE INDEX idx_web3_wallets_user ON web3_wallets(user_id);
```

#### Crypto Donations Table
```sql
CREATE TABLE crypto_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  initiative_id UUID REFERENCES initiatives(id) ON DELETE SET NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('ETH', 'MATIC', 'USDC')),
  amount_usd DECIMAL(10, 2),
  transaction_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  chain_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  confirmations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_crypto_donations_tx_hash ON crypto_donations(transaction_hash);
CREATE INDEX idx_crypto_donations_user ON crypto_donations(user_id);
CREATE INDEX idx_crypto_donations_initiative ON crypto_donations(initiative_id);
```

#### NFT Badges Table
```sql
CREATE TABLE nft_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id BIGINT NOT NULL,
  contract_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  badge_type TEXT NOT NULL CHECK (badge_type IN ('tree_planter', 'donor', 'monitor', 'ambassador', 'legend')),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  rarity_score INTEGER DEFAULT 0,
  transaction_hash TEXT NOT NULL,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attributes JSONB,
  UNIQUE(contract_address, token_id)
);

CREATE INDEX idx_nft_badges_owner ON nft_badges(owner_address);
CREATE INDEX idx_nft_badges_user ON nft_badges(user_id);
CREATE INDEX idx_nft_badges_type ON nft_badges(badge_type, tier);
```

#### Badge Criteria Table
```sql
CREATE TABLE badge_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_type TEXT NOT NULL,
  tier TEXT NOT NULL,
  required_points INTEGER NOT NULL,
  required_trees_planted INTEGER DEFAULT 0,
  required_donations_made INTEGER DEFAULT 0,
  required_trees_monitored INTEGER DEFAULT 0,
  required_referrals INTEGER DEFAULT 0,
  max_supply INTEGER,
  current_supply INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(badge_type, tier)
);
```

#### User Gamification Table
```sql
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_to_next_level INTEGER DEFAULT 100,
  rank_global INTEGER,
  rank_forest INTEGER,
  badges_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  referrals_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_gamification_points ON user_gamification(total_points DESC);
CREATE INDEX idx_user_gamification_level ON user_gamification(level DESC);
```

#### Gamified Actions Table
```sql
CREATE TABLE gamified_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('tree_plant', 'donation', 'monitor', 'referral', 'share', 'verify')),
  points_awarded INTEGER NOT NULL,
  multiplier DECIMAL(3, 2) DEFAULT 1.0,
  description TEXT,
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gamified_actions_user ON gamified_actions(user_id);
CREATE INDEX idx_gamified_actions_type ON gamified_actions(action_type);
CREATE INDEX idx_gamified_actions_date ON gamified_actions(created_at DESC);
```

#### Achievements Table
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT,
  points_reward INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  required_count INTEGER NOT NULL,
  timeframe TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
```

#### Challenge Quests Table
```sql
CREATE TABLE challenge_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  forest TEXT CHECK (forest IN ('kakamega', 'karura', 'mau')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  objectives JSONB NOT NULL,
  rewards JSONB NOT NULL,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quest_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES challenge_quests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress JSONB,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

CREATE INDEX idx_quest_participants_user ON quest_participants(user_id);
CREATE INDEX idx_quest_participants_quest ON quest_participants(quest_id);
```

#### Referrals Table
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### Row Level Security (RLS) Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can view active initiatives
CREATE POLICY "Anyone can view active initiatives"
  ON initiatives FOR SELECT
  USING (status = 'active' OR auth.uid() = organization_id);

-- Only organizations can create initiatives
CREATE POLICY "Organizations can create initiatives"
  ON initiatives FOR INSERT
  WITH CHECK (auth.uid() = organization_id AND 
              (SELECT role FROM users WHERE id = auth.uid()) = 'organization');

-- Anyone can view trees
CREATE POLICY "Anyone can view trees"
  ON trees FOR SELECT
  USING (true);

-- Authenticated users can add trees
CREATE POLICY "Authenticated users can add trees"
  ON trees FOR INSERT
  WITH CHECK (auth.uid() = planted_by);
```

## Error Handling

### Error Types

```typescript
enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
}
```

### Error Handling Strategy

1. **Client-Side Validation**: Validate all user inputs before submission
2. **API Error Responses**: Standardized error format from Supabase
3. **Retry Logic**: Implement exponential backoff for transient failures
4. **User Feedback**: Display user-friendly error messages
5. **Error Logging**: Log errors to Supabase for monitoring
6. **Fallback UI**: Show graceful degradation when services are unavailable

### Antugrow API Error Handling

```typescript
async function callAntugrowAPI(endpoint: string, data: any, retries = 3): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${ANTUGROW_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANTUGROW_API_KEY}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Antugrow API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## Testing Strategy

### Unit Testing
- **Framework**: Vitest
- **Coverage Target**: 80% code coverage
- **Focus Areas**:
  - Service functions (auth, initiatives, trees)
  - Utility functions
  - Custom hooks
  - Data transformations

### Integration Testing
- **Framework**: Vitest + Testing Library
- **Focus Areas**:
  - Supabase client interactions
  - Antugrow API integration
  - Component integration with services
  - Form submissions and validations

### End-to-End Testing
- **Framework**: Playwright
- **Critical Flows**:
  - User registration and login
  - Creating an initiative
  - Uploading tree images
  - Purchasing carbon credits
  - Generating impact reports

### Testing Antugrow Integration

```typescript
// Mock Antugrow API for testing
const mockAntugrowResponse = {
  tree_id: 'mock-tree-123',
  health_score: 85,
  growth_rate: 12.5,
  disease_detected: false,
  recommendations: ['Continue regular watering', 'Monitor for pests']
};

describe('Antugrow Integration', () => {
  it('should analyze tree image and return health data', async () => {
    const result = await analyzeTreeImage('tree-image.jpg');
    expect(result).toHaveProperty('health_score');
    expect(result.health_score).toBeGreaterThan(0);
  });
  
  it('should handle API failures gracefully', async () => {
    // Test retry logic and error handling
  });
});
```

## Security Considerations

### Authentication & Authorization
- JWT-based authentication via Supabase Auth
- Role-based access control (RBAC)
- Row Level Security (RLS) policies in PostgreSQL
- Secure password hashing (handled by Supabase)

### Data Protection
- TLS 1.3 for all communications
- AES-256 encryption at rest (Supabase default)
- Sensitive data masking in logs
- GDPR compliance for user data

### API Security
- API key rotation for Antugrow integration
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for allowed origins

### File Upload Security
- File type validation (images only)
- File size limits (max 10MB per image)
- Virus scanning for uploaded files
- Signed URLs for secure file access

## Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization and lazy loading
- Caching strategies (React Query)
- Debouncing search and filter inputs
- Virtual scrolling for large lists

### Backend Optimization
- Database indexing on frequently queried fields
- Connection pooling (Supabase default)
- Caching frequently accessed data
- Pagination for large datasets
- Real-time subscriptions for live updates

### Monitoring
- Performance metrics tracking
- Error rate monitoring
- API response time tracking
- User session analytics
- Supabase dashboard monitoring

## Deployment Strategy

### Development Environment
- Local development with Supabase CLI
- Environment variables for configuration
- Hot module replacement (HMR) with Vite

### Staging Environment
- Deployed to Vercel preview branches
- Separate Supabase project for staging
- Automated testing on pull requests

### Production Environment
- Deployed to Vercel production
- Production Supabase project
- CDN for static assets
- Automated deployments on main branch merge
- Rollback capability

### Environment Variables
```
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
VITE_ANTUGROW_API_URL=https://api.antugrow.com
VITE_ANTUGROW_API_KEY=<secret>
VITE_MAPBOX_TOKEN=<secret>
```

## Accessibility

### WCAG 2.1 Level AA Compliance
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios (4.5:1 minimum)
- Focus indicators
- Alternative text for images
- Responsive text sizing

### Mobile Accessibility
- Touch target sizes (minimum 44x44px)
- Swipe gestures for navigation
- Responsive layouts
- Offline capability for cached data

## Internationalization (Future Enhancement)

While the initial version will be in English, the architecture supports future internationalization:
- i18n library integration (react-i18next)
- Language selection in user profile
- Localized date and number formatting
- RTL language support
- Translation management system
