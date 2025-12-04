# Verification-as-a-Service (VaaS) Components

This directory contains components for the Verification-as-a-Service system, which handles evidence submission, expert review, and report generation for climate actions.

## Components

### EvidenceSubmission
**File**: `EvidenceSubmission.tsx`
**Purpose**: Allows users to submit verification evidence with GPS and photos
**Requirements**: A6.1

**Features**:
- File upload (photos, videos, documents)
- Camera capture for real-time photos
- GPS coordinate capture using browser geolocation
- Evidence type selection
- Optional description field
- File preview before submission

**Props**:
- `actionId`: ID of the action being verified
- `actionType`: Type of action (mission, learning, etc.)
- `onSubmitSuccess`: Callback after successful submission
- `onCancel`: Callback for cancel action

**Usage**:
```tsx
import { EvidenceSubmissionComponent } from './components/vaas/EvidenceSubmission';

<EvidenceSubmissionComponent
  actionId="mission-123"
  actionType="mission"
  onSubmitSuccess={() => console.log('Evidence submitted')}
  onCancel={() => navigate('/missions')}
/>
```

### VerificationReviewDashboard
**File**: `VerificationReviewDashboard.tsx`
**Purpose**: Expert review interface for verification evidence
**Requirements**: A6.2

**Features**:
- View pending evidence submissions
- Filter by evidence type (photo, video, document)
- Review evidence details and files
- Submit review decisions (approve, reject, needs more info)
- Add reviewer comments
- Organization-specific access

**Props**:
- `reviewerOrganization`: Organization of the reviewer (GBM, WMF, KFS, community_leader)

**Usage**:
```tsx
import { VerificationReviewDashboard } from './components/vaas/VerificationReviewDashboard';

<VerificationReviewDashboard
  reviewerOrganization="GBM"
/>
```

### VerificationReport
**File**: `VerificationReport.tsx`
**Purpose**: Displays public verification reports with validation details
**Requirements**: A6.3, A6.4, A6.5

**Features**:
- Display action details
- Show user information
- Present validation details (GPS, photo count, submission date)
- Display evidence files with preview
- Show review status and comments
- Download report as text file

**Props**:
- `evidenceId`: ID of the evidence to generate report for
- `showDownload`: Whether to show download button (default: true)

**Usage**:
```tsx
import { VerificationReportComponent } from './components/vaas/VerificationReport';

<VerificationReportComponent
  evidenceId="evidence-123"
  showDownload={true}
/>
```

## Service

### VaaSService
**File**: `src/services/vaas.service.ts`

**Key Methods**:

#### Evidence Submission
- `submitEvidence(submission, userId)`: Submit verification evidence
- `getEvidence(evidenceId)`: Get evidence by ID
- `getEvidenceForAction(actionId, actionType)`: Get evidence for specific action
- `getUserEvidence(userId)`: Get all evidence submitted by user

#### Review Management
- `getPendingEvidence(limit)`: Get pending evidence for review
- `submitReview(review, reviewerId)`: Submit verification review
- `getReview(evidenceId)`: Get review for evidence

#### Report Generation
- `generateVerificationReport(evidenceId)`: Generate verification report
- `getUserVerificationReports(userId)`: Get all reports for user

## Database Tables

### verification_evidence
Stores submitted verification evidence:
- `id`: UUID primary key
- `action_id`: Reference to action being verified
- `action_type`: Type of action (mission, learning, etc.)
- `user_id`: User who submitted evidence
- `evidence_type`: Type of evidence (photo, video, gps, document)
- `files`: JSONB array of file URLs and metadata
- `description`: Optional description
- `gps_coordinates`: PostGIS geography point
- `submitted_at`: Timestamp

### verification_reviews
Stores expert reviews:
- `id`: UUID primary key
- `evidence_id`: Reference to evidence
- `reviewer_id`: User who reviewed
- `reviewer_organization`: Organization (GBM, WMF, KFS, community_leader)
- `status`: Review status (approved, rejected, needs_more_info)
- `comments`: Optional reviewer comments
- `reviewed_at`: Timestamp

## Storage

Evidence files are stored in Supabase Storage bucket: `verification-evidence`

File path format: `{userId}/{timestamp}_{filename}`

## Integration

### With Missions
When evidence is submitted for a mission:
1. Evidence record is created
2. Mission participation status is updated to 'submitted'
3. When approved, status changes to 'approved' and Green Coins are awarded

### With Green Coins
Approved verifications trigger Green Coin rewards based on action type and impact.

## Security

### Row Level Security (RLS)
- Users can only view their own evidence
- Reviewers can view all pending evidence
- Public reports are accessible to all authenticated users

### File Upload
- Files are uploaded to Supabase Storage with user-specific paths
- Public URLs are generated for approved evidence
- File size and type validation on client side

## Future Enhancements

1. **Automated Verification**: Use computer vision to validate photos
2. **GPS Validation**: Verify GPS coordinates against expected locations
3. **Blockchain Integration**: Store verification hashes on blockchain
4. **Mobile App**: Native mobile app with better camera integration
5. **Batch Review**: Allow reviewers to approve multiple submissions at once
6. **Analytics Dashboard**: Track verification metrics and reviewer performance
