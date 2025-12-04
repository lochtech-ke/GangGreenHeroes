# Petition System Quick Start Guide

## Overview

The petition system enables users to create, sign, and share environmental policy petitions targeting county, national, and international decision-makers.

## Quick Links

- **Browse Petitions**: `/petitions`
- **View Petition**: `/petitions/:id`
- **Service**: `src/services/petition.service.ts`
- **Types**: `src/types/petition.types.ts`
- **Migration**: `supabase/migrations/20250129_petitions.sql`

## Basic Usage

### 1. Browse Petitions

```tsx
import { PetitionBrowser } from '../components/community/PetitionBrowser';

function MyPage() {
  return (
    <PetitionBrowser 
      onSelectPetition={(id) => navigate(`/petitions/${id}`)}
    />
  );
}
```

### 2. View Petition Details

```tsx
import { PetitionDetails } from '../components/community/PetitionDetails';

function PetitionPage({ petitionId, userId }) {
  return (
    <PetitionDetails
      petitionId={petitionId}
      userId={userId}
      onSign={(title) => handleSign(title)}
    />
  );
}
```

### 3. Sign a Petition

```tsx
import { SignPetitionModal } from '../components/community/SignPetitionModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <SignPetitionModal
      petitionId="petition-id"
      petitionTitle="Protect Kakamega Forest"
      userId="user-id"
      onClose={() => setShowModal(false)}
      onSuccess={() => {
        setShowModal(false);
        // Refresh petition data
      }}
    />
  );
}
```

### 4. Share a Petition

```tsx
import { PetitionShareTools } from '../components/community/PetitionShareTools';

function ShareSection({ petition }) {
  return (
    <PetitionShareTools
      petitionId={petition.id}
      petitionTitle={petition.title}
      currentSignatures={petition.current_signatures}
      signatureGoal={petition.signature_goal}
    />
  );
}
```

## Service Functions

### Get Petitions

```typescript
import { getPetitions } from '../../services/petition.service';

const { petitions, total } = await getPetitions(
  {
    status: 'active',
    target_audience: 'national',
    search: 'forest'
  },
  20, // limit
  0   // offset
);
```

### Get Petition Details

```typescript
import { getPetitionById } from '../../services/petition.service';

const petition = await getPetitionById(petitionId, userId);
// Returns petition with creator, signatures, updates, and user_signed flag
```

### Sign Petition

```typescript
import { signPetition } from '../../services/petition.service';

const signature = await signPetition(
  {
    petition_id: petitionId,
    public_display: true,
    comment: 'This is important!'
  },
  userId
);
```

### Create Petition

```typescript
import { createPetition } from '../../services/petition.service';

const petition = await createPetition(
  {
    title: 'Protect Kakamega Forest',
    description: 'We need to protect this vital ecosystem...',
    target_audience: 'national',
    target_organization: 'Ministry of Environment',
    signature_goal: 5000,
    deadline: '2025-12-31T23:59:59Z'
  },
  userId
);
```

### Get Statistics

```typescript
import { getPetitionStats } from '../../services/petition.service';

const stats = await getPetitionStats(petitionId);
// Returns: total_signatures, progress_percentage, days_remaining, signatures_today
```

## Database Schema

### Petitions Table

```sql
CREATE TABLE petitions (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  target_audience VARCHAR(50), -- 'county', 'national', 'international'
  target_organization VARCHAR(200),
  signature_goal INTEGER,
  current_signatures INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Petition Signatures Table

```sql
CREATE TABLE petition_signatures (
  id UUID PRIMARY KEY,
  petition_id UUID REFERENCES petitions(id),
  user_id UUID REFERENCES users(id),
  signed_at TIMESTAMP,
  public_display BOOLEAN DEFAULT TRUE,
  comment TEXT,
  UNIQUE (petition_id, user_id)
);
```

### Petition Updates Table

```sql
CREATE TABLE petition_updates (
  id UUID PRIMARY KEY,
  petition_id UUID REFERENCES petitions(id),
  title VARCHAR(200),
  content TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

## Access Control

### Public Access
- View active and successful petitions
- View public signatures
- View petition updates

### Authenticated Users
- Sign petitions (once per petition)
- Add optional comments
- Choose public/private display
- Create new petitions

### Petition Creators
- Post campaign updates
- Update petition status
- View all signatures

## Features

### Automatic Signature Tracking
Signature counts are automatically updated via database trigger when users sign or unsign petitions.

### Deadline Management
- Petitions automatically close when deadline passes
- Days remaining calculated in real-time
- Visual countdown in UI

### Sharing & Advocacy
- Twitter, Facebook, WhatsApp sharing
- Email sharing with pre-filled content
- Copy link functionality
- Mobilization tips

### Privacy Controls
- Public/private signature option
- Optional comments
- Creator information display

## Common Patterns

### Check if User Signed

```typescript
const petition = await getPetitionById(petitionId, userId);
if (petition.user_signed) {
  // User has already signed
}
```

### Filter Active Petitions

```typescript
const { petitions } = await getPetitions({ status: 'active' });
```

### Calculate Progress

```typescript
const progress = Math.min(
  100,
  Math.round((petition.current_signatures / petition.signature_goal) * 100)
);
```

### Format Deadline

```typescript
const daysRemaining = Math.max(
  0,
  Math.ceil((new Date(petition.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
);
```

## Error Handling

### Duplicate Signature

```typescript
try {
  await signPetition(data, userId);
} catch (error) {
  if (error.message.includes('already signed')) {
    // Handle duplicate signature
  }
}
```

### Permission Errors

```typescript
try {
  await createPetitionUpdate(data, userId);
} catch (error) {
  if (error.message.includes('Only petition creator')) {
    // Handle permission error
  }
}
```

## Testing

### Unit Test Example

```typescript
import { getPetitions } from './petition.service';

test('filters petitions by status', async () => {
  const { petitions } = await getPetitions({ status: 'active' });
  expect(petitions.every(p => p.status === 'active')).toBe(true);
});
```

### Integration Test Example

```typescript
test('signing petition increases count', async () => {
  const before = await getPetitionById(petitionId);
  await signPetition({ petition_id: petitionId }, userId);
  const after = await getPetitionById(petitionId);
  
  expect(after.current_signatures).toBe(before.current_signatures + 1);
});
```

## Deployment

### Run Migration

```bash
# Push to Supabase
supabase db push

# Or apply directly
psql -h <host> -U <user> -d <db> -f supabase/migrations/20250129_petitions.sql
```

### Verify Tables

```sql
SELECT * FROM petitions LIMIT 1;
SELECT * FROM petition_signatures LIMIT 1;
SELECT * FROM petition_updates LIMIT 1;
```

## Troubleshooting

### Signatures Not Updating
Check that the trigger is installed:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_petition_signature_count';
```

### RLS Blocking Access
Verify RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'petitions';
```

### Duplicate Signature Error
This is expected behavior - users can only sign once per petition.

## Support

For issues or questions:
- Check `docs/POLICY_ENGAGEMENT_IMPLEMENTATION.md`
- Review `src/components/community/README.md`
- Examine service code in `src/services/petition.service.ts`
