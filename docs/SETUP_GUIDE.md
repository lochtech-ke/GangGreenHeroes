# Supabase Database Setup Guide

Complete guide to setting up the GangGreen platform database schema in Supabase.

## Prerequisites

- Supabase account at https://app.supabase.com
- Project created with ID: `wobpryllvdjaapzjbsxx`
- Access to Supabase SQL Editor

## Quick Setup (Recommended)

### Step 1: Execute Complete Migration

1. Log in to Supabase Dashboard: https://app.supabase.com
2. Select your project: `wobpryllvdjaapzjbsxx`
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the entire content of `migrations/000_all_migrations.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for execution to complete (should take 10-30 seconds)

### Step 2: Configure Row Level Security

1. In SQL Editor, create a new query
2. Copy the content of `migrations/010_rls_policies.sql`
3. Paste and execute
4. Verify policies are created

### Step 3: Set Up Storage Buckets

1. Navigate to **Storage** in the left sidebar
2. Create four buckets manually:
   - `tree-images` (Public, 10MB limit)
   - `documents` (Private, 20MB limit)
   - `avatars` (Public, 2MB limit)
   - `nft-badges` (Public, 5MB limit)

3. Go back to SQL Editor
4. Copy content of `storage/buckets.sql`
5. Execute to apply storage policies

### Step 4: Verify Setup

Run this verification query:
```sql
-- Check all tables are created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables (20 total):
-- achievements, badge_criteria, carbon_credits, challenge_quests,
-- crypto_donations, gamified_actions, initiative_participants, initiatives,
-- nft_badges, notifications, quest_participants, referrals, transactions,
-- tree_images, trees, user_achievements, user_gamification, user_profiles,
-- users, web3_wallets
```

## Detailed Setup (Step-by-Step)

If you prefer to execute migrations individually:

### 1. Core Tables
```bash
# Execute in order:
migrations/001_create_users_and_profiles.sql
migrations/002_create_initiatives.sql
migrations/003_create_trees.sql
migrations/004_create_carbon_credits.sql
migrations/005_create_notifications.sql
```

### 2. Web3 and NFT Tables
```bash
migrations/006_create_web3_tables.sql
migrations/007_create_nft_badges.sql
```

### 3. Gamification Tables
```bash
migrations/008_create_gamification.sql
migrations/009_create_quests_and_referrals.sql
```

### 4. Security Policies
```bash
migrations/010_rls_policies.sql
```

### 5. Storage Configuration
```bash
storage/buckets.sql
```

## Using Supabase CLI

### Install CLI
```bash
npm install -g supabase
```

### Login and Link Project
```bash
supabase login
supabase link --project-ref wobpryllvdjaapzjbsxx
```

### Push Migrations
```bash
supabase db push
```

## Post-Setup Configuration

### 1. Create Admin User

After setting up authentication in your app, create an admin user:

```sql
-- Update user role to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@ganggreen.org';
```

**For detailed admin management, see:**
- `supabase/ADMIN_MANAGEMENT_GUIDE.md` - Complete admin management guide
- `supabase/admin-management.sql` - All SQL queries for admin management
- `scripts/grant-admin.ps1` - PowerShell helper script

### 2. Seed Initial Data (Optional)

#### Forest Data
```sql
-- This will be done through the application
-- See task 11.3 in the implementation plan
```

#### Badge Criteria
```sql
INSERT INTO badge_criteria (badge_type, tier, required_points, required_trees_planted, max_supply) VALUES
('tree_planter', 'bronze', 100, 10, NULL),
('tree_planter', 'silver', 500, 50, NULL),
('tree_planter', 'gold', 1000, 100, 1000),
('tree_planter', 'platinum', 5000, 500, 100),
('tree_planter', 'diamond', 10000, 1000, 10);

INSERT INTO badge_criteria (badge_type, tier, required_points, required_donations_made, max_supply) VALUES
('donor', 'bronze', 100, 1, NULL),
('donor', 'silver', 500, 5, NULL),
('donor', 'gold', 1000, 10, 500),
('donor', 'platinum', 5000, 50, 50),
('donor', 'diamond', 10000, 100, 5);
```

#### Sample Achievements
```sql
INSERT INTO achievements (name, description, points_reward, action_type, required_count, rarity) VALUES
('First Tree', 'Plant your first tree', 50, 'tree_plant', 1, 'common'),
('Tree Hugger', 'Plant 10 trees', 200, 'tree_plant', 10, 'common'),
('Forest Guardian', 'Plant 100 trees', 1000, 'tree_plant', 100, 'rare'),
('First Donation', 'Make your first donation', 50, 'donation', 1, 'common'),
('Generous Donor', 'Make 10 donations', 500, 'donation', 10, 'rare'),
('Tree Monitor', 'Monitor 10 trees', 300, 'monitor', 10, 'common'),
('Referral Master', 'Refer 5 friends', 500, 'referral', 5, 'epic');
```

### 3. Configure Authentication

In Supabase Dashboard:
1. Go to **Authentication > Settings**
2. Configure email templates
3. Set up OAuth providers (optional)
4. Configure password requirements
5. Enable email confirmations

### 4. Set Up Realtime

Enable realtime for specific tables:
```sql
-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for initiatives
ALTER PUBLICATION supabase_realtime ADD TABLE initiatives;

-- Enable realtime for user_gamification (for leaderboards)
ALTER PUBLICATION supabase_realtime ADD TABLE user_gamification;
```

## Environment Variables

Update your `.env` file:
```env
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
```

## Verification Checklist

- [ ] All 20 tables created
- [ ] All indexes created (check with `\di` in psql)
- [ ] RLS enabled on all tables
- [ ] RLS policies created and working
- [ ] Storage buckets created
- [ ] Storage policies configured
- [ ] Extensions enabled (uuid-ossp, postgis)
- [ ] Triggers created (updated_at)
- [ ] Sample data inserted (optional)
- [ ] Realtime enabled for required tables

## Testing Database Setup

### Test User Creation
```sql
-- Insert test user
INSERT INTO users (email, role, forest_preference) 
VALUES ('test@example.com', 'individual', 'kakamega')
RETURNING *;

-- Insert user profile
INSERT INTO user_profiles (id, full_name) 
VALUES ((SELECT id FROM users WHERE email = 'test@example.com'), 'Test User')
RETURNING *;
```

### Test Initiative Creation
```sql
-- Insert test initiative
INSERT INTO initiatives (
  title, 
  description, 
  forest, 
  target_trees, 
  start_date, 
  location, 
  organization_id
) VALUES (
  'Test Initiative',
  'Testing database setup',
  'kakamega',
  100,
  CURRENT_DATE,
  ST_SetSRID(ST_MakePoint(34.7519, 0.2827), 4326)::geography,
  (SELECT id FROM users WHERE email = 'test@example.com')
)
RETURNING *;
```

### Test Geospatial Query
```sql
-- Find initiatives near Kakamega Forest
SELECT 
  title,
  forest,
  ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(34.7519, 0.2827), 4326)::geography
  ) / 1000 as distance_km
FROM initiatives
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(34.7519, 0.2827), 4326)::geography,
  50000 -- 50km radius
)
ORDER BY distance_km;
```

## Troubleshooting

### Error: "extension uuid-ossp does not exist"
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "extension postgis does not exist"
Contact Supabase support to enable PostGIS for your project, or check if it's available in your plan.

### Error: "permission denied"
Ensure you're using the service role key for migrations, not the anon key.

### Error: "relation already exists"
Tables already exist. Either:
1. Drop and recreate: `DROP TABLE table_name CASCADE;`
2. Skip table creation and just apply policies

### RLS Policies Not Working
1. Verify RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Check policy definitions: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Test with different user contexts

## Backup and Restore

### Create Backup
```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or use pg_dump
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore from Backup
```bash
# Using Supabase CLI
supabase db reset

# Or use psql
psql -h db.wobpryllvdjaapzjbsxx.supabase.co -U postgres -d postgres < backup.sql
```

## Next Steps

After completing database setup:

1. ✅ Proceed to Task 3: Authentication System
2. ✅ Test database connections in your application
3. ✅ Set up development environment variables
4. ✅ Begin implementing service layer

## Support

- Supabase Documentation: https://supabase.com/docs
- PostGIS Documentation: https://postgis.net/docs/
- Project Issues: Create an issue in the repository

## Database Schema Diagram

```
users ──┬── user_profiles
        ├── initiatives ──┬── initiative_participants
        │                 ├── trees ──── tree_images
        │                 └── carbon_credits ──── transactions
        ├── notifications
        ├── web3_wallets
        ├── crypto_donations
        ├── nft_badges
        ├── user_gamification
        ├── gamified_actions
        ├── user_achievements ──── achievements
        ├── quest_participants ──── challenge_quests
        └── referrals
```

## Performance Monitoring

Monitor database performance in Supabase Dashboard:
- **Database > Query Performance**: View slow queries
- **Database > Roles**: Check connection usage
- **Database > Extensions**: Verify enabled extensions
- **Reports**: View usage statistics

## Maintenance Schedule

- **Daily**: Monitor slow queries
- **Weekly**: Check index usage statistics
- **Monthly**: Review and optimize queries
- **Quarterly**: Analyze storage usage and cleanup orphaned files
