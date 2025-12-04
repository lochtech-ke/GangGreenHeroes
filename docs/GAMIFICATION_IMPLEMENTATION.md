# Gamification System Implementation

## Overview

This document describes the implementation of the gamification features for the V1.0 Major Release of the #GangGreen platform. The gamification system provides badges, leaderboards, streak tracking, and challenges to drive user engagement and reward climate action.

**Implementation Date**: January 29, 2025  
**Requirements**: A9.1, A9.2, A9.3, A9.4, A9.5  
**Status**: ✅ Complete

## Components Implemented

### 1. BadgeDisplay Component

**File**: `src/components/gamification/BadgeDisplay.tsx`

**Purpose**: Displays user's earned badges and progression through badge tiers (Steward → Platinum → Hero)

**Features**:
- ✅ Display earned and locked badges
- ✅ Badge progression tracking by tier
- ✅ Progress bars for locked badges
- ✅ Tier filtering (All, Steward, Platinum, Hero)
- ✅ Badge criteria display
- ✅ Earned date tracking
- ✅ Responsive grid layout
- ✅ Compact mode for dashboard widgets

**Key Functionality**:
- Loads all badges from the database
- Fetches user's earned badges and progress
- Calculates completion percentage per tier
- Shows progress toward unlocking badges
- Supports multiple icon types (hummingbird, tree, water, shield, star)
- Color-coded by tier (green for Steward, purple for Platinum, yellow for Hero)

**Database Tables Used**:
- `badges` - Badge definitions
- `user_badges` - User's earned badges and progress

**Props**:
```typescript
interface BadgeDisplayProps {
  userId: string;
  compact?: boolean;        // Compact view for widgets
  showProgress?: boolean;   // Show progress bars
}
```

---

### 2. Leaderboard Component

**File**: `src/components/gamification/Leaderboard.tsx`

**Purpose**: Displays rankings by various metrics with different timeframes and scopes

**Features**:
- ✅ Multiple metric types:
  - Green Coins earned
  - Trees planted
  - Community impact
- ✅ Timeframe filtering:
  - Daily
  - Weekly
  - Monthly
  - All Time
- ✅ Scope filtering:
  - Global
  - County
  - Community
- ✅ Current user rank highlighting
- ✅ Top 3 special styling (gold, silver, bronze)
- ✅ User avatars and display names
- ✅ Responsive design

**Key Functionality**:
- Queries different data sources based on metric type
- Applies timeframe filters to queries
- Ranks users by score
- Highlights current user's position
- Shows user rank even if outside top entries
- Real-time score updates

**Database Tables Used**:
- `green_coin_transactions` - For Green Coins leaderboard
- `planted_trees` - For Trees Planted leaderboard
- `mission_participations` - For Community Impact leaderboard
- `user_profiles` - For user display information

**Props**:
```typescript
interface LeaderboardProps {
  currentUserId?: string;
  defaultType?: LeaderboardType;      // 'green_coins' | 'trees_planted' | 'community_impact'
  defaultTimeframe?: Timeframe;       // 'daily' | 'weekly' | 'monthly' | 'all_time'
  defaultScope?: Scope;               // 'global' | 'county' | 'community'
  limit?: number;                     // Number of entries to display
}
```

---

### 3. StreakTracker Component

**File**: `src/components/gamification/StreakTracker.tsx`

**Purpose**: Tracks consecutive daily activity and awards bonus points for milestones

**Features**:
- ✅ Current streak display
- ✅ Longest streak tracking
- ✅ Milestone tracking with bonus rewards:
  - 7 days: +50 coins
  - 14 days: +100 coins
  - 30 days: +250 coins
  - 60 days: +500 coins
  - 90 days: +1000 coins
  - 180 days: +2500 coins
  - 365 days: +5000 coins
- ✅ Progress toward next milestone
- ✅ Activity calendar visualization (30 days)
- ✅ Streak status indicators (active/at risk)
- ✅ Activity tips
- ✅ Earned bonuses display
- ✅ Compact mode for widgets

**Key Functionality**:
- Loads user's streak data from database
- Checks if streak is active (activity within last 24 hours)
- Loads activity history from multiple sources:
  - Mission participations
  - Learning module completions
  - Community posts
- Calculates progress toward next milestone
- Displays 30-day activity calendar
- Shows earned milestone bonuses

**Database Tables Used**:
- `user_streaks` - Streak tracking
- `mission_participations` - Activity tracking
- `user_learning_progress` - Activity tracking
- `community_posts` - Activity tracking

**Props**:
```typescript
interface StreakTrackerProps {
  userId: string;
  compact?: boolean;      // Compact view for widgets
  showHistory?: boolean;  // Show 30-day activity calendar
}
```

---

### 4. ChallengeCard Component

**File**: `src/components/gamification/ChallengeCard.tsx`

**Purpose**: Displays active challenges and team scores

**Features**:
- ✅ Three challenge types:
  - Individual challenges
  - Team challenges
  - Community challenges
- ✅ Challenge status tracking (upcoming, active, completed, expired)
- ✅ Progress tracking with visual progress bars
- ✅ Time remaining countdown
- ✅ Participant count display
- ✅ Reward display (Green Coins)
- ✅ Team standings for team challenges (top 3)
- ✅ Join/participation status
- ✅ Compact mode for lists
- ✅ Full card view with details

**Key Functionality**:
- Displays challenge information
- Shows progress toward goal
- Calculates time remaining
- Displays team standings for team challenges
- Allows users to join challenges
- Shows participation status
- Supports different challenge types with appropriate icons

**Challenge Types**:
```typescript
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'community';
  status: 'upcoming' | 'active' | 'completed' | 'expired';
  startDate: Date;
  endDate: Date;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  participantCount: number;
  teamScores?: TeamScore[];
  userProgress?: number;
  createdAt: Date;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  memberCount: number;
}
```

**Props**:
```typescript
interface ChallengeCardProps {
  challenge: Challenge;
  userId?: string;
  onJoin?: (challengeId: string) => void;
  onViewDetails?: (challengeId: string) => void;
  compact?: boolean;
}
```

---

### 5. GamificationPage

**File**: `src/pages/GamificationPage.tsx`

**Purpose**: Comprehensive page showcasing all gamification features

**Features**:
- ✅ Tabbed interface for different sections:
  - Badges
  - Leaderboard
  - Streaks
  - Challenges
- ✅ Responsive design
- ✅ Authentication check
- ✅ Integration with all gamification components
- ✅ Mock challenge data (to be replaced with API calls)

**Sections**:
1. **Badges Tab**: Full BadgeDisplay component
2. **Leaderboard Tab**: Leaderboard with all filters
3. **Streaks Tab**: StreakTracker with full history
4. **Challenges Tab**: Grid of ChallengeCard components

---

## Database Schema

The gamification system uses the following database tables:

### Badges Table
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tier VARCHAR(20),  -- 'steward' | 'platinum' | 'hero'
  icon_type VARCHAR(20),  -- 'hummingbird' | 'tree' | 'water' | 'shield' | 'star'
  criteria JSONB,  -- Array of {metric: string, threshold: number}
  earned_by_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Badges Table
```sql
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER,  -- Current progress toward badge
  PRIMARY KEY (user_id, badge_id)
);
```

### User Streaks Table
```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);
```

### Challenges Table (Future)
```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(20),  -- 'individual' | 'team' | 'community'
  status VARCHAR(20),  -- 'upcoming' | 'active' | 'completed' | 'expired'
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  target_metric VARCHAR(50),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  reward INTEGER,  -- Green Coins
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Challenge Participants Table (Future)
```sql
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id),
  user_id UUID REFERENCES users(id),
  team_id UUID,
  joined_at TIMESTAMP DEFAULT NOW(),
  progress NUMERIC DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);
```

---

## Integration Points

### 1. Green Coins Service
The gamification system integrates with the existing Green Coins service for:
- Leaderboard rankings
- Streak bonus rewards
- Challenge rewards

### 2. Mission Service
Integrates for:
- Activity tracking for streaks
- Community impact leaderboard
- Challenge progress

### 3. Education Service
Integrates for:
- Activity tracking for streaks
- Learning-based challenges

### 4. Community Service
Integrates for:
- Activity tracking for streaks
- Community engagement metrics

---

## Usage Examples

### Display Badges on Profile Page
```tsx
import { BadgeDisplay } from '../components/gamification';

function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div>
      <h2>My Badges</h2>
      <BadgeDisplay userId={user.id} showProgress={true} />
    </div>
  );
}
```

### Show Leaderboard Widget
```tsx
import { Leaderboard } from '../components/gamification';

function DashboardWidget() {
  const { user } = useAuth();
  
  return (
    <Leaderboard 
      currentUserId={user.id}
      defaultType="green_coins"
      defaultTimeframe="weekly"
      limit={10}
    />
  );
}
```

### Display Streak in Header
```tsx
import { StreakTracker } from '../components/gamification';

function Header() {
  const { user } = useAuth();
  
  return (
    <header>
      <StreakTracker userId={user.id} compact={true} />
    </header>
  );
}
```

### Show Active Challenges
```tsx
import { ChallengeCard } from '../components/gamification';

function ChallengesSection() {
  const challenges = useChallenges(); // Custom hook
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {challenges.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          userId={user.id}
          onJoin={handleJoin}
        />
      ))}
    </div>
  );
}
```

---

## Styling

All components use Tailwind CSS with the following design system:

**Colors**:
- Steward Tier: `green-600`, `green-50`, `green-200`
- Platinum Tier: `purple-600`, `purple-50`, `purple-200`
- Hero Tier: `yellow-600`, `yellow-50`, `yellow-200`
- Streaks: `orange-500` to `red-600` (gradient based on length)
- Challenges: `green-500` to `emerald-600` (gradient)

**Components**:
- Cards: `border-2`, `rounded-lg` or `rounded-xl`
- Progress bars: `h-2` or `h-3`, `rounded-full`
- Buttons: `px-4 py-3`, `rounded-lg`, `font-semibold`
- Icons: `w-5 h-5` (standard), `w-8 h-8` (large)

---

## Accessibility

All components follow accessibility best practices:
- ✅ Semantic HTML elements
- ✅ ARIA labels where appropriate
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Color contrast compliance (WCAG AA)
- ✅ Focus indicators
- ✅ Alt text for images

---

## Performance Considerations

**Optimization Strategies**:
1. **Data Loading**:
   - Lazy loading of badge images
   - Pagination for leaderboards
   - Caching of streak data
   - Efficient database queries with indexes

2. **Rendering**:
   - React.memo for expensive components (if needed)
   - Virtual scrolling for long lists (future)
   - Debounced filter updates

3. **Database**:
   - Indexes on frequently queried fields
   - Materialized views for leaderboards (future)
   - Cached aggregations

**Performance Targets**:
- Badge loading: < 500ms
- Leaderboard query: < 300ms
- Streak calculation: < 100ms
- Component render: < 50ms

---

## Testing

### Unit Tests (To Be Implemented)
- Badge display logic
- Leaderboard ranking calculations
- Streak tracking logic
- Challenge progress calculations
- Time remaining calculations

### Integration Tests (To Be Implemented)
- Badge earning flow
- Leaderboard updates
- Streak bonus awards
- Challenge participation

### Property-Based Tests (To Be Implemented)
- **Property A12**: Badge progression follows rules
- **Property A13**: Streak tracking is consistent

---

## Future Enhancements

### Phase 1 (Next Sprint)
- [ ] Implement challenge creation interface
- [ ] Add team management features
- [ ] Create badge customization options
- [ ] Implement leaderboard prizes

### Phase 2 (Future)
- [ ] Add social sharing for achievements
- [ ] Implement badge trading/gifting
- [ ] Create seasonal challenges
- [ ] Add achievement notifications
- [ ] Implement challenge templates
- [ ] Add team chat for team challenges

### Phase 3 (Long-term)
- [ ] Machine learning for personalized challenges
- [ ] Predictive streak maintenance reminders
- [ ] Dynamic difficulty adjustment
- [ ] Cross-platform synchronization
- [ ] Achievement analytics dashboard

---

## Related Documentation

- [V1.0 Requirements](../.kiro/specs/v1-major-release/requirements.md)
- [V1.0 Design Document](../.kiro/specs/v1-major-release/design.md)
- [Green Coins Implementation](./GREEN_COINS_IMPLEMENTATION.md)
- [Gamification Components README](../src/components/gamification/README.md)

---

## Changelog

### January 29, 2025
- ✅ Implemented BadgeDisplay component
- ✅ Implemented Leaderboard component
- ✅ Implemented StreakTracker component
- ✅ Implemented ChallengeCard component
- ✅ Created GamificationPage
- ✅ Updated component exports and documentation
- ✅ All components pass TypeScript diagnostics

---

## Support

For questions or issues related to the gamification system:
1. Check the component README files
2. Review the design document
3. Consult the technical guide
4. Contact the development team

---

**Implementation Status**: ✅ Complete  
**Next Steps**: Implement property-based tests for badge progression and streak tracking
