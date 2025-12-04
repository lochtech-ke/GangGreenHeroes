# Climate Missions System Implementation

## Overview

The Climate Missions system has been successfully implemented as part of Task 13 of the V1.0 Major Release. This system allows users to browse, join, and participate in environmental action initiatives with verification and reward mechanisms.

## Implementation Date

November 29, 2025

## Components Implemented

### 1. Database Schema

**File**: `supabase/migrations/20250129_climate_missions.sql`

Created the following tables:
- `missions`: Main mission data with location, dates, targets, and rewards
- `mission_participations`: User participation records with verification status
- `verification_evidence`: Submitted evidence (photos, videos, GPS)
- `verification_reviews`: Expert reviews of submitted evidence

**Key Features**:
- PostGIS geography support for location coordinates
- Row Level Security (RLS) policies for data protection
- Automatic participant count updates via triggers
- Indexes for performance optimization

### 2. Type Definitions

**File**: `src/types/mission.types.ts`

Defined TypeScript interfaces for:
- `Mission`: Core mission data structure
- `MissionParticipation`: User participation records
- `VerificationEvidence`: Evidence submission structure
- `VerificationReview`: Review data structure
- `MissionFilters`: Filtering options for browsing
- Extended types with organizer and participation data

### 3. Service Layer

**File**: `src/services/mission.service.ts`

Implemented comprehensive mission operations:
- `getMissions()`: Browse missions with filtering and pagination
- `getMissionById()`: Get detailed mission information
- `joinMission()`: Join a mission
- `leaveMission()`: Leave a mission
- `updateParticipationContribution()`: Track user contributions
- `submitVerificationEvidence()`: Submit verification evidence
- `getVerificationEvidence()`: Retrieve submitted evidence
- `getUserMissions()`: Get user's joined missions
- `uploadVerificationFile()`: Upload evidence files to storage
- `createMission()`: Create new missions
- `updateMission()`: Update mission details
- `deleteMission()`: Delete missions

### 4. React Components

#### MissionBrowser
**File**: `src/components/missions/MissionBrowser.tsx`

Main browsing interface with:
- Search functionality
- Multi-filter support (type, status, location, dates)
- Grid and map view modes
- Pagination
- Age-based curation support

#### MissionCard
**File**: `src/components/missions/MissionCard.tsx`

Card display component featuring:
- Mission type icons and status badges
- Progress bars for target metrics
- Participant count and rewards
- Organizer information
- Responsive design

#### MissionMap
**File**: `src/components/missions/MissionMap.tsx`

Map visualization component with:
- Geographic mission display
- Color-coded mission types
- Interactive legend
- Mission list below map
- Placeholder for Leaflet/Mapbox integration

#### MissionDetails
**File**: `src/components/missions/MissionDetails.tsx`

Detailed mission view with:
- Hero section with mission image
- Full mission description
- Progress tracking
- Location map
- Join/leave functionality
- Verification submission link
- Organizer information
- Mission statistics

#### ParticipationTracker
**File**: `src/components/missions/ParticipationTracker.tsx`

Contribution tracking component:
- Display current contribution
- Update contribution values
- Verification status display
- Participation timeline

#### UserMissions
**File**: `src/components/missions/UserMissions.tsx`

User's mission dashboard:
- Filter by status (all, active, completed)
- Group by verification status
- Pending verification highlights
- Mission cards with status indicators

#### VerificationSubmission
**File**: `src/components/missions/VerificationSubmission.tsx`

Evidence submission interface:
- Photo/video upload with preview
- GPS coordinate capture
- Description field
- Upload progress indicator
- Validation and error handling

### 5. Pages

#### MissionsPage
**File**: `src/pages/MissionsPage.tsx`

Main missions browsing page integrating MissionBrowser component.

#### MissionDetailsPage
**File**: `src/pages/MissionDetailsPage.tsx`

Individual mission details page with navigation and error handling.

#### MissionVerificationPage
**File**: `src/pages/MissionVerificationPage.tsx`

Verification submission page with authentication checks and mission validation.

### 6. Routing

Updated `src/App.tsx` with mission routes:
- `/missions` - Browse all missions
- `/missions/:id` - View mission details
- `/missions/:id/verify` - Submit verification (protected)

### 7. Navigation

Updated `src/components/navigation/navigationConfig.ts`:
- Added "Climate Missions" to Initiatives navigation group
- Icon: target
- Description: "Join climate action missions and earn rewards"

## Features

### Mission Types
- 🌳 Tree Planting
- ♻️ Waste Cleanup
- 💧 Water Conservation
- 📝 Petition
- 💰 Fundraising

### Mission Status
- **Upcoming**: Scheduled for future
- **Active**: Currently in progress
- **Completed**: Finished
- **Cancelled**: Cancelled

### Verification Status
- **Pending**: Awaiting evidence submission
- **Submitted**: Evidence submitted, awaiting review
- **Approved**: Evidence approved, rewards granted
- **Rejected**: Evidence rejected

### Key Capabilities

1. **Mission Discovery**
   - Search by title/description
   - Filter by type, status, location, dates
   - Grid and map views
   - Pagination support

2. **Mission Participation**
   - Join/leave missions
   - Track contributions
   - View participation history
   - Verification status tracking

3. **Verification System**
   - Photo/video upload
   - GPS coordinate capture
   - Description submission
   - Progress tracking
   - File storage in Supabase

4. **Rewards**
   - Green Coin rewards for verified actions
   - Participant count tracking
   - Progress toward mission goals

5. **Security**
   - Row Level Security (RLS) policies
   - User authentication checks
   - Organizer permissions
   - Data sanitization

## Database Schema Details

### missions Table
```sql
- id: UUID (primary key)
- title: VARCHAR(200)
- description: TEXT
- mission_type: VARCHAR(50) (enum)
- organizer_id: UUID (foreign key to users)
- location_name: VARCHAR(200)
- location_coordinates: GEOGRAPHY(POINT)
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- target_metric: VARCHAR(50)
- target_value: NUMERIC
- current_value: NUMERIC
- participant_count: INTEGER
- green_coin_reward: INTEGER
- verification_required: BOOLEAN
- status: VARCHAR(20) (enum)
- image_url: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### mission_participations Table
```sql
- id: UUID (primary key)
- mission_id: UUID (foreign key)
- user_id: UUID (foreign key)
- joined_at: TIMESTAMP
- contribution_metric: VARCHAR(50)
- contribution_value: NUMERIC
- verification_status: VARCHAR(20) (enum)
- verified_at: TIMESTAMP
```

### verification_evidence Table
```sql
- id: UUID (primary key)
- action_id: UUID
- action_type: VARCHAR(50)
- user_id: UUID (foreign key)
- evidence_type: VARCHAR(20) (enum)
- files: JSONB
- description: TEXT
- gps_coordinates: GEOGRAPHY(POINT)
- submitted_at: TIMESTAMP
```

### verification_reviews Table
```sql
- id: UUID (primary key)
- evidence_id: UUID (foreign key)
- reviewer_id: UUID (foreign key)
- reviewer_organization: VARCHAR(50)
- status: VARCHAR(20) (enum)
- comments: TEXT
- reviewed_at: TIMESTAMP
```

## RLS Policies

### Missions
- Everyone can view missions
- Users can create missions (as organizer)
- Organizers can update/delete their missions

### Mission Participations
- Users can view their own participations
- Organizers can view participations in their missions
- Users can join missions
- Users can update their own participations

### Verification Evidence
- Users can view their own evidence
- Users can submit evidence

### Verification Reviews
- Users can view reviews of their evidence

## Storage

Evidence files are stored in Supabase Storage:
- Bucket: `mission-evidence`
- Path structure: `verification/{userId}/{missionId}/{timestamp}.{ext}`
- Public URLs generated for access

## Integration Points

### Content Curation
The MissionBrowser component accepts an `ageCohort` prop for age-based content curation integration.

### Green Coins
Missions include `green_coin_reward` field for reward distribution upon verification approval.

### User Profiles
Missions link to user profiles for organizer information and participant tracking.

## Future Enhancements

1. **Map Integration**
   - Integrate Leaflet or Mapbox for interactive maps
   - Real-time mission location visualization
   - Clustering for dense mission areas

2. **Real-time Updates**
   - Live participant count updates
   - Real-time verification status changes
   - Push notifications for mission updates

3. **Advanced Features**
   - Team-based missions
   - Mission templates for organizers
   - Recurring missions
   - Mission recommendations based on interests
   - Social sharing features

4. **Verification Enhancements**
   - Computer vision for automatic verification
   - Blockchain-based verification records
   - Expert reviewer dashboard
   - Verification reports generation

5. **Analytics**
   - Mission performance metrics
   - User engagement analytics
   - Impact measurement dashboard
   - Geographic impact visualization

## Testing

### Manual Testing Checklist
- [ ] Browse missions with various filters
- [ ] View mission details
- [ ] Join a mission
- [ ] Leave a mission
- [ ] Submit verification evidence
- [ ] Upload photos/videos
- [ ] Capture GPS coordinates
- [ ] View user missions dashboard
- [ ] Test pagination
- [ ] Test search functionality
- [ ] Test map view
- [ ] Test responsive design

### Integration Testing
- [ ] Database operations
- [ ] File upload to Supabase Storage
- [ ] RLS policy enforcement
- [ ] Trigger functionality (participant count)
- [ ] GPS coordinate storage

### Property-Based Testing
Property tests should be added for:
- Mission filtering logic
- Verification status transitions
- Reward calculation
- GPS coordinate validation

## Requirements Validation

This implementation satisfies the following requirements from the V1.0 spec:

### Requirement A5: Climate Missions and Real-World Actions
✅ A5.1 - Mission browsing with filtering
✅ A5.2 - Mission details with location and requirements
✅ A5.3 - Verification with photo and GPS
✅ A5.4 - Participation tracking
✅ A5.5 - Petition signing (mission type supported)

### Task 13 Subtasks
✅ 13.1 - Create mission browser
✅ 13.2 - Build mission details page
✅ 13.3 - Implement mission participation
✅ 13.4 - Create verification submission

## Deployment Notes

### Database Migration
Run the migration file:
```bash
supabase db push
```

### Storage Bucket
Create the storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-evidence', 'mission-evidence', true);
```

### Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

## Documentation

- Component README: `src/components/missions/README.md`
- This implementation guide: `docs/CLIMATE_MISSIONS_IMPLEMENTATION.md`

## Support

For issues or questions about the Climate Missions system:
1. Check the component README files
2. Review the service layer documentation
3. Consult the database schema
4. Review RLS policies for permission issues

## Conclusion

The Climate Missions system is now fully implemented and integrated into the #GangGreen platform. Users can browse missions, join initiatives, track their contributions, and submit verification evidence to earn rewards. The system is ready for testing and deployment.
