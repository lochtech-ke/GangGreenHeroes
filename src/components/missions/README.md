# Climate Missions Components

This directory contains components for the Climate Missions system, which allows users to browse, join, and participate in environmental action initiatives.

## Components

### MissionBrowser
The main browsing interface for missions with filtering, search, and view modes.

**Features:**
- Search missions by title/description
- Filter by mission type (tree planting, waste cleanup, water conservation, petition, fundraising)
- Filter by status (upcoming, active, completed, cancelled)
- Grid and map view modes
- Pagination support
- Age-based curation integration (when ageCohort prop provided)

**Usage:**
```tsx
import MissionBrowser from './components/missions/MissionBrowser';

<MissionBrowser ageCohort="18-24" />
```

### MissionCard
Displays a single mission in card format with key information.

**Features:**
- Mission type icon and status badge
- Progress bar for target metrics
- Participant count and Green Coin rewards
- Organizer information
- Responsive design

**Usage:**
```tsx
import MissionCard from './components/missions/MissionCard';

<MissionCard mission={missionData} />
```

### MissionMap
Interactive map view showing missions with geographic locations.

**Features:**
- Visual markers for each mission type
- Color-coded legend
- Mission selection
- List view below map
- Placeholder for Leaflet/Mapbox integration

**Usage:**
```tsx
import MissionMap from './components/missions/MissionMap';

<MissionMap 
  missions={missions} 
  selectedMissionId={selectedId}
  onMissionSelect={handleSelect}
/>
```

### MissionDetails
Detailed view of a single mission with participation options.

**Features:**
- Full mission information
- Location map
- Participant list
- Join/leave functionality
- Progress tracking
- Verification submission

**Usage:**
```tsx
import MissionDetails from './components/missions/MissionDetails';

<MissionDetails missionId="uuid" />
```

### VerificationSubmission
Interface for submitting verification evidence for mission completion.

**Features:**
- Photo/video upload
- GPS coordinate capture
- Description field
- File preview
- Progress indicator

**Usage:**
```tsx
import VerificationSubmission from './components/missions/VerificationSubmission';

<VerificationSubmission 
  missionId="uuid"
  participationId="uuid"
  onSubmit={handleSubmit}
/>
```

## Mission Types

- **tree_planting**: Tree planting initiatives
- **waste_cleanup**: Waste collection and cleanup events
- **water_conservation**: Water conservation projects
- **petition**: Environmental policy petitions
- **fundraising**: Fundraising campaigns for climate action

## Mission Status

- **upcoming**: Mission scheduled for future
- **active**: Mission currently in progress
- **completed**: Mission finished
- **cancelled**: Mission cancelled

## Integration with Content Curation

The MissionBrowser component supports age-based content curation through the `ageCohort` prop. When provided, missions are filtered and ranked based on age-appropriate content preferences.

## Database Schema

Missions are stored in the following tables:
- `missions`: Main mission data
- `mission_participations`: User participation records
- `verification_evidence`: Submitted evidence for verification
- `verification_reviews`: Expert reviews of evidence

## Future Enhancements

- Real Leaflet/Mapbox integration for interactive maps
- Real-time participant updates
- Mission recommendations based on user interests
- Social sharing features
- Team-based missions
- Mission templates for organizers
