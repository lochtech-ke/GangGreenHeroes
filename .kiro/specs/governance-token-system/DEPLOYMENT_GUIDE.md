# Governance Token System - Deployment Guide

## 🚀 Quick Start Deployment

This guide will help you deploy the governance token system to your staging and production environments.

---

## Prerequisites

- [ ] Supabase project with PostgreSQL database
- [ ] Access to database migrations
- [ ] Admin access to create senior users
- [ ] Ability to set up scheduled tasks (cron or Edge Functions)

---

## Step 1: Database Migration

### Staging Deployment

```bash
# Connect to staging database
psql -h your-staging-db.supabase.co -U postgres -d postgres

# Run the migration
\i supabase/migrations/016_add_governance_token_system.sql

# Verify tables were created
\dt governance_*
\dt proposals
\dt votes
\dt petitions
\dt senior_users
```

### Verify Migration Success

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'governance_tokens',
  'token_transactions',
  'token_earning_rules',
  'proposals',
  'proposal_categories',
  'votes',
  'voting_snapshots',
  'senior_users',
  'petitions',
  'petition_signatures',
  'petition_config'
);

-- Verify seed data
SELECT * FROM proposal_categories;
SELECT * FROM token_earning_rules;
SELECT * FROM petition_config;
```

---

## Step 2: Create Initial Senior Users

You need at least one senior user for tie-breaking functionality.

```sql
-- Insert a senior user (replace with actual user ID)
INSERT INTO senior_users (user_id, seniority_level, role, can_break_ties)
VALUES (
  'your-admin-user-id-here',
  100,
  'Platform Administrator',
  true
);

-- Verify senior user was created
SELECT * FROM senior_users;
```

---

## Step 3: Set Up Voting Scheduler

The voting scheduler needs to run periodically to:
- Start voting periods for draft proposals
- End voting periods and finalize proposals
- Send voting reminders

### Option A: Supabase Edge Function (Recommended)

Create a new Edge Function:

```typescript
// supabase/functions/governance-scheduler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Import and run scheduler
    const { votingSchedulerService } = await import('./votingScheduler.service.ts');
    await votingSchedulerService.runScheduledTasks();

    return new Response(
      JSON.stringify({ success: true, message: 'Scheduler tasks completed' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy the function:
```bash
supabase functions deploy governance-scheduler
```

Set up a cron trigger in Supabase Dashboard:
- Go to Database → Cron Jobs
- Create new job: `governance_scheduler`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Command: Call the Edge Function

### Option B: External Cron Job

If using an external server:

```bash
# Add to crontab
*/5 * * * * curl -X POST https://your-api.com/api/governance/scheduler
```

Create API endpoint:
```typescript
// pages/api/governance/scheduler.ts
import { votingSchedulerService } from '../../../services/votingScheduler.service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await votingSchedulerService.runScheduledTasks();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## Step 4: Configure Row Level Security (RLS)

Add RLS policies for governance tables:

```sql
-- Enable RLS on all governance tables
ALTER TABLE governance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE senior_users ENABLE ROW LEVEL SECURITY;

-- Governance tokens: Users can read their own, admins can read all
CREATE POLICY "Users can view own governance tokens"
  ON governance_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own governance tokens"
  ON governance_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Proposals: Anyone can read, authenticated users can create
CREATE POLICY "Anyone can view proposals"
  ON proposals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Votes: Anyone can read, authenticated users can vote
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can cast votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Senior users: Anyone can read (for tie-breaker identification)
CREATE POLICY "Anyone can view senior users"
  ON senior_users FOR SELECT
  USING (true);
```

---

## Step 5: Test Core Functionality

### Test 1: Token Earning
```typescript
// Award tokens to a test user
import { governanceTokenService } from './services/governanceToken.service';

const result = await governanceTokenService.awardTokens(
  'test-user-id',
  50,
  'tree_planting',
  { test: true }
);

console.log('Token award result:', result);
```

### Test 2: Create Proposal
```typescript
// Create a test proposal
import { proposalService } from './services/proposal.service';

const result = await proposalService.createProposal('test-user-id', {
  title: 'Test Proposal',
  description: 'This is a test proposal to verify the system works.',
  category: 'other',
  implementation_timeline: '1 week',
});

console.log('Proposal creation result:', result);
```

### Test 3: Cast Vote
```typescript
// Cast a vote on the test proposal
import { votingService } from './services/voting.service';

const result = await votingService.castVote(
  'proposal-id',
  'test-user-id',
  'for'
);

console.log('Vote result:', result);
```

### Test 4: Real-time Updates
1. Open the governance dashboard in two browser windows
2. Cast a vote in one window
3. Verify the vote tally updates in the other window in real-time

### Test 5: Notifications
1. Create a new proposal
2. Check that eligible voters receive notifications
3. Verify notification appears in the notifications table

---

## Step 6: Frontend Integration

### Add Routes

```typescript
// App.tsx or routes configuration
import GovernancePage from './pages/GovernancePage';
import CreateProposalForm from './components/governance/CreateProposalForm';
import ProposalDetail from './components/governance/ProposalDetail';
import TieBreakerDashboard from './components/governance/TieBreakerDashboard';

// Add routes
<Route path="/governance" element={<GovernancePage />} />
<Route path="/governance/proposals/create" element={<CreateProposalForm />} />
<Route path="/governance/proposals/:id" element={<ProposalDetail />} />
<Route path="/governance/tie-breaker" element={<TieBreakerDashboard />} />
```

### Add Navigation Links

```typescript
// Navigation component
<nav>
  <Link to="/governance">Governance</Link>
  {/* Other links */}
</nav>
```

---

## Step 7: Monitor and Verify

### Check Scheduler Logs
```sql
-- View recent proposal status changes
SELECT id, title, status, updated_at
FROM proposals
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- View recent notifications
SELECT type, title, created_at
FROM notifications
WHERE type LIKE 'governance_%'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Monitor Performance
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM proposals
WHERE status = 'active'
ORDER BY created_at DESC;

-- Verify indexes are being used
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename LIKE 'governance_%'
OR tablename IN ('proposals', 'votes', 'petitions');
```

---

## Step 8: Production Deployment

Once staging is verified:

1. **Backup Production Database**
   ```bash
   pg_dump -h prod-db.supabase.co -U postgres -d postgres > backup.sql
   ```

2. **Run Migration on Production**
   ```bash
   psql -h prod-db.supabase.co -U postgres -d postgres < supabase/migrations/016_add_governance_token_system.sql
   ```

3. **Create Production Senior Users**
   ```sql
   INSERT INTO senior_users (user_id, seniority_level, role, can_break_ties)
   VALUES ('prod-admin-user-id', 100, 'Platform Administrator', true);
   ```

4. **Deploy Scheduler to Production**
   ```bash
   supabase functions deploy governance-scheduler --project-ref prod-project-ref
   ```

5. **Enable RLS Policies**
   Run the RLS policy SQL from Step 4

6. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy to Vercel/Netlify/etc.
   ```

---

## Rollback Plan

If issues occur:

```sql
-- Disable scheduler first
-- Then drop all governance tables
DROP TABLE IF EXISTS petition_signatures CASCADE;
DROP TABLE IF EXISTS petitions CASCADE;
DROP TABLE IF EXISTS petition_config CASCADE;
DROP TABLE IF EXISTS voting_snapshots CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS proposal_categories CASCADE;
DROP TABLE IF EXISTS senior_users CASCADE;
DROP TABLE IF EXISTS token_transactions CASCADE;
DROP TABLE IF EXISTS token_earning_rules CASCADE;
DROP TABLE IF EXISTS governance_tokens CASCADE;

-- Restore from backup if needed
psql -h your-db.supabase.co -U postgres -d postgres < backup.sql
```

---

## Post-Deployment Checklist

- [ ] Database migration successful
- [ ] All tables created with correct schema
- [ ] Seed data inserted
- [ ] Senior users created
- [ ] Voting scheduler running every 5 minutes
- [ ] RLS policies enabled
- [ ] Frontend routes added
- [ ] Navigation links updated
- [ ] Test proposal created successfully
- [ ] Test vote cast successfully
- [ ] Real-time updates working
- [ ] Notifications being sent
- [ ] Tie-breaker dashboard accessible to senior users
- [ ] Token earning working for tree planting
- [ ] Token earning working for initiative creation
- [ ] Performance monitoring in place

---

## Troubleshooting

### Scheduler Not Running
- Check Edge Function logs in Supabase Dashboard
- Verify cron job is configured correctly
- Test scheduler manually: `curl -X POST https://your-function-url`

### Notifications Not Sending
- Check notifications table for entries
- Verify notification service is being called
- Check Supabase real-time subscriptions

### Real-time Updates Not Working
- Verify Supabase real-time is enabled
- Check browser console for subscription errors
- Ensure RLS policies allow reading

### Votes Not Counting
- Check voting_snapshots table
- Verify voting power calculation
- Check proposal status is 'active'

---

## Support

For issues or questions:
1. Check the COMPLETION_SUMMARY.md for feature details
2. Review service code for implementation details
3. Check Supabase logs for errors
4. Test in staging before production

---

**Deployment Status**: Ready for Staging ✅

**Last Updated**: December 5, 2025
