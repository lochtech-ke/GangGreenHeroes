# Community Hub Components

This directory contains components for the Community Hub feature and Policy Engagement tools, enabling users to browse, join, and participate in local climate action communities and environmental policy petitions.

## Community Components

### CommunityBrowser
Browse and search communities with age-appropriate filtering and location-based search.

**Features:**
- Search by name or description
- Filter by county and activity level
- Age-appropriate content filtering
- Pagination support

**Requirements:** A3.1, A3.5

### CommunityProfile
Display detailed community information including members, posts, and activity feed.

**Features:**
- Community details and statistics
- Member list display
- Activity feed integration
- Join/leave functionality
- Tabbed interface (Feed, Members, About)

**Requirements:** A3.1

### CommunityFeed
Display community posts with age-targeted content support.

**Features:**
- Age-appropriate post filtering
- Like and comment actions
- Image and link support
- Infinite scroll/pagination
- Member-only access control

**Requirements:** A3.3, A3.4

### PostComposer
Create community posts with image upload and age targeting options.

**Features:**
- Rich text content input
- Image upload (up to 4 images)
- Link attachment
- Age cohort targeting
- Real-time preview

**Requirements:** A3.3

## Policy Engagement Components

### PetitionBrowser
Browse and search active environmental policy petitions with filtering options.

**Features:**
- Search by title or description
- Filter by target audience (county, national, international)
- Filter by status (active, successful, closed)
- Display signature progress and deadlines
- Responsive grid layout

**Requirements:** A12.1

### PetitionDetails
Display detailed petition information with signature progress and updates.

**Features:**
- Petition description and target organization
- Real-time signature progress tracking
- Days remaining countdown
- Tabbed interface (About, Updates, Signatures)
- Sign button for authenticated users
- Public signature display

**Requirements:** A12.1

### SignPetitionModal
Modal for signing petitions with optional comment and privacy controls.

**Features:**
- Two-step confirmation process
- Optional comment (500 characters)
- Public/private signature option
- Privacy notice and confirmation
- Email confirmation notification

**Requirements:** A12.2

### PetitionShareTools
Advocacy and mobilization tools for sharing petitions.

**Features:**
- Social media sharing (Twitter, Facebook, WhatsApp)
- Email sharing
- Copy link functionality
- Progress visualization
- Mobilization tips and guidance

**Requirements:** A12.4

## Usage

```tsx
import { 
  CommunityBrowser, 
  CommunityProfile, 
  CommunityFeed, 
  PostComposer 
} from '../components/community';

// Browse communities
<CommunityBrowser />

// View community profile
<CommunityProfile />

// Display community feed
<CommunityFeed communityId="123" isMember={true} />

// Create a post
<PostComposer 
  communityId="123" 
  onPostCreated={() => console.log('Post created')}
/>

// Browse petitions
<PetitionBrowser />

// View petition details
<PetitionDetails 
  petitionId="123" 
  userId="user-id"
  onSign={() => console.log('Sign petition')}
/>

// Sign petition modal
<SignPetitionModal
  petitionId="123"
  petitionTitle="Protect Kakamega Forest"
  userId="user-id"
  onClose={() => console.log('Close')}
  onSuccess={() => console.log('Signed')}
/>

// Share petition
<PetitionShareTools
  petitionId="123"
  petitionTitle="Protect Kakamega Forest"
  currentSignatures={1500}
  signatureGoal={5000}
/>
```

## Service Integration

### Community Service
All community components integrate with `src/services/community.service.ts` which provides:

- `searchCommunities()` - Search and filter communities
- `getCommunityById()` - Get community details
- `joinCommunity()` - Join a community
- `leaveCommunity()` - Leave a community
- `isCommunityMember()` - Check membership status
- `getCommunityFeed()` - Get age-filtered posts
- `createCommunityPost()` - Create a new post
- `uploadPostImages()` - Upload post images

### Petition Service
All petition components integrate with `src/services/petition.service.ts` which provides:

- `getPetitions()` - Search and filter petitions
- `getPetitionById()` - Get petition details with signatures and updates
- `createPetition()` - Create a new petition
- `signPetition()` - Sign a petition
- `unsignPetition()` - Remove signature
- `getPetitionSignatures()` - Get public signatures
- `createPetitionUpdate()` - Post campaign update
- `updatePetitionStatus()` - Update petition status
- `getPetitionStats()` - Get real-time statistics
- `closeExpiredPetitions()` - Close expired petitions

## Database Schema

### Community Tables
The community feature uses these tables:
- `communities` - Community information
- `community_members` - Membership records
- `community_posts` - Posts and updates
- `content_age_targeting` - Age targeting metadata

See `supabase/migrations/20250129_community_hub.sql` for full schema.

### Petition Tables
The petition feature uses these tables:
- `petitions` - Petition information and status
- `petition_signatures` - User signatures with comments
- `petition_updates` - Campaign progress updates

See `supabase/migrations/20250129_petitions.sql` for full schema.

## Age-Based Filtering

Communities and posts support age-based content curation:

1. Content creators can target specific age cohorts
2. Users see age-appropriate content based on their profile
3. Filtering happens at the service layer
4. No age targeting = visible to all users

## Petition Features

### Signature Tracking
- Automatic signature count updates via database trigger
- Real-time progress calculation
- Daily signature tracking
- Public and private signature options

### Deadline Management
- Automatic petition closure on deadline
- Days remaining calculation
- Expired petition handling

### Advocacy Tools
- Multi-platform sharing (social media, email, WhatsApp)
- Copy link functionality
- Mobilization tips and guidance
- Progress visualization

## Access Control

### Community Access
- Anyone can browse communities
- Authenticated users can join/leave communities
- Only members can view community posts
- Only members can create posts
- Authors can edit/delete their own posts

### Petition Access
- Anyone can view active and successful petitions
- Authenticated users can sign petitions
- Users can only sign each petition once
- Petition creators can post updates
- Petition creators can update status

## Styling

Components use Tailwind CSS with the platform's design system:
- Primary color: Green (#10B981)
- Hover states and transitions
- Responsive grid layouts
- Loading states and skeletons
