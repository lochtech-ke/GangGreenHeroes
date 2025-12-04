# Admin Management - Quick Start

## TL;DR

**To grant admin rights to a user:**

1. Open Supabase SQL Editor: https://app.supabase.com/project/wobpryllvdjaapzjbsxx/editor/sql
2. Run this query (replace the email):
   ```sql
   UPDATE users 
   SET role = 'admin', updated_at = NOW()
   WHERE email = 'user@example.com'
   RETURNING id, email, role;
   ```
3. User logs out and back in
4. Done! ✅

## Check Current Admins

```sql
SELECT id, email, role, created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

## Understanding Admin Access

### Supabase Project Owner (Super Admin)
- **You**: The person who created the Supabase project
- **Access**: Full control via Supabase Dashboard
- **Manages**: Database, storage, auth settings, team members
- **Location**: https://app.supabase.com/project/wobpryllvdjaapzjbsxx/settings/team

### Database Admin Users
- **Who**: Users with `role = 'admin'` in the users table
- **Access**: Application-level admin features
- **Manages**: Initiatives, carbon credits, content moderation
- **Location**: Managed via SQL queries in the users table

## Common Scenarios

### Scenario 1: First Time Setup (No Admins Yet)

1. Register a user through the application
2. Note their email address
3. Run this query:
   ```sql
   UPDATE users 
   SET role = 'admin'
   WHERE email = 'your-email@example.com'
   RETURNING id, email, role;
   ```

### Scenario 2: Add Another Admin

1. User must register first through the app
2. Get their email address
3. Run the grant admin query (see TL;DR above)

### Scenario 3: Remove Admin Rights

```sql
UPDATE users 
SET role = 'individual', updated_at = NOW()
WHERE email = 'former-admin@example.com'
RETURNING id, email, role;
```

### Scenario 4: Grant Admin to Multiple Users

```sql
UPDATE users 
SET role = 'admin', updated_at = NOW()
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
)
RETURNING id, email, role;
```

## What Can Admins Do?

✅ Manage all initiatives (view, edit, delete)
✅ Verify carbon credits
✅ View all transactions
✅ Manage NFT badge criteria
✅ Moderate social feed content
✅ View support tickets
✅ Access analytics dashboards
✅ Manage challenge quests

## Important Notes

⚠️ **User must register first** - You can't grant admin rights to someone who hasn't signed up
⚠️ **Email is case-sensitive** - Make sure you type it exactly right
⚠️ **User needs to re-login** - After granting admin rights, user should log out and back in
⚠️ **Admin role ≠ login access** - Admin role only affects permissions, not login ability

## Troubleshooting

**Q: Query returns 0 rows?**
- User hasn't registered yet, or email is wrong

**Q: User still can't access admin features?**
- User needs to log out and back in
- Check browser console for errors
- Verify role in database

**Q: How do I find all users?**
```sql
SELECT u.email, u.role, up.full_name
FROM users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;
```

## Helper Tools

### PowerShell Script (Windows)
```powershell
# List current admins
.\scripts\grant-admin.ps1 -List

# Generate SQL to grant admin rights
.\scripts\grant-admin.ps1 -Email user@example.com

# Show help
.\scripts\grant-admin.ps1 -Help
```

### Direct SQL File
Open `supabase/admin-management.sql` for all queries with detailed comments

## Full Documentation

For complete details, see:
- **supabase/ADMIN_MANAGEMENT_GUIDE.md** - Comprehensive guide
- **supabase/admin-management.sql** - All SQL queries
- **supabase/SETUP_GUIDE.md** - Database setup

## Quick Links

- Supabase Dashboard: https://app.supabase.com/project/wobpryllvdjaapzjbsxx
- SQL Editor: https://app.supabase.com/project/wobpryllvdjaapzjbsxx/editor/sql
- Team Settings: https://app.supabase.com/project/wobpryllvdjaapzjbsxx/settings/team

## Need Help?

1. Check the full guide: `supabase/ADMIN_MANAGEMENT_GUIDE.md`
2. Review SQL queries: `supabase/admin-management.sql`
3. Check Supabase logs in Dashboard
4. Contact project maintainer
