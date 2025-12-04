# Ambassador Program Components

This directory contains components for the Gang Green Ambassador Program, which allows active users to become community leaders and organize local climate action events.

## Components

### AmbassadorApplicationForm
Application form for users to apply for ambassador status.

**Features:**
- Eligibility checking (100 Green Coins, 10 trees planted, 5 missions completed)
- County and sub-county selection
- Specialization selection (multiple areas of expertise)
- Motivation and experience text fields
- Real-time validation

**Props:**
- `onSuccess?: () => void` - Callback when application is submitted successfully
- `onCancel?: () => void` - Callback when user cancels the application

**Usage:**
```tsx
import { AmbassadorApplicationForm } from '../components/profile';

<AmbassadorApplicationForm
  onSuccess={() => navigate('/ambassador/dashboard')}
  onCancel={() => navigate('/profile')}
/>
```

### AmbassadorDashboard
Dashboard for ambassadors to track their impact and manage their activities.

**Features:**
- Impact score display
- Events organized counter
- Members referred counter
- Specializations display
- Quick actions (create event, view profile, share referral link, access resources)
- Impact score breakdown
- Application status display

**Usage:**
```tsx
import { AmbassadorDashboard } from '../components/profile';

<AmbassadorDashboard />
```

### AmbassadorProfile
Public profile page for individual ambassadors.

**Features:**
- Profile header with avatar and location
- Stats display (impact score, events, referrals, days as ambassador)
- Specializations display
- Achievements display (Event Master, Community Builder, High Impact Leader)

**Usage:**
```tsx
import { AmbassadorProfile } from '../components/profile';

// In a route with :userId parameter
<AmbassadorProfile />
```

### AmbassadorHallOfFame
Hall of fame showcasing top ambassadors by impact score.

**Features:**
- Top 3 ambassadors with medal badges (🥇🥈🥉)
- County filter
- Full list of all ambassadors with rankings
- Click to view individual ambassador profiles

**Usage:**
```tsx
import { AmbassadorHallOfFame } from '../components/profile';

<AmbassadorHallOfFame />
```

## Service

### ambassadorService
Service for managing ambassador data and operations.

**Methods:**
- `checkEligibility(userId: string)` - Check if user meets ambassador requirements
- `submitApplication(application: AmbassadorApplication)` - Submit ambassador application
- `getAmbassadorStatus(userId: string)` - Get ambassador status for a user
- `getActiveAmbassadors()` - Get all active ambassadors
- `getAmbassadorsByCounty(county: string)` - Get ambassadors by county
- `updateAmbassadorStats(userId: string, updates)` - Update ambassador statistics
- `incrementEventsOrganized(userId: string)` - Increment events organized count
- `incrementMembersReferred(userId: string)` - Increment members referred count
- `calculateImpactScore(userId: string)` - Calculate and update impact score

**Impact Score Formula:**
```
Impact Score = (Events Organized × 10) + (Members Referred × 5) + Trees Planted + (Missions Completed × 3)
```

## Routes

The following routes are available for the ambassador program:

- `/ambassador/apply` - Ambassador application form (protected)
- `/ambassador/dashboard` - Ambassador dashboard (protected)
- `/ambassador/:userId` - Public ambassador profile
- `/ambassador/hall-of-fame` - Ambassador hall of fame

## Database Schema

### ambassadors table
```sql
CREATE TABLE ambassadors (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  application_date TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  county VARCHAR(50),
  sub_county VARCHAR(50),
  specializations TEXT[],
  events_organized INTEGER DEFAULT 0,
  members_referred INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'suspended'))
);
```

## Requirements Validated

This implementation validates the following requirements from the V1.0 Major Release spec:

- **A11.1**: Users can apply for ambassador status when they meet criteria
- **A11.2**: Ambassadors can create and manage local events
- **A11.3**: System tracks participation and awards ambassador-specific badges
- **A11.4**: Referral tracking and bonus rewards for ambassadors
- **A11.5**: Ambassadors are featured in the community hall-of-fame

## Future Enhancements

- Event creation interface for ambassadors
- Ambassador-specific badges and rewards
- Training resources and materials
- Ambassador analytics and reporting
- Ambassador messaging and collaboration tools
- Regional ambassador coordination
