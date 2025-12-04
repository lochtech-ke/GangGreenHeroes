-- ============================================================================
-- ADMIN USER MANAGEMENT SCRIPT
-- ============================================================================
-- This script helps you manage admin users in the GangGreen platform
-- Execute these queries in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CHECK CURRENT ADMIN USERS
-- ============================================================================
-- View all users with admin role
SELECT 
  id,
  email,
  role,
  forest_preference,
  created_at,
  updated_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================================================
-- 2. CHECK ALL USERS (to find users to promote)
-- ============================================================================
-- View all users with their current roles
SELECT 
  u.id,
  u.email,
  u.role,
  u.forest_preference,
  up.full_name,
  up.organization,
  u.created_at
FROM users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC
LIMIT 50;

-- ============================================================================
-- 3. GRANT ADMIN RIGHTS TO SPECIFIC USER (BY EMAIL)
-- ============================================================================
-- Replace 'user@example.com' with the actual email address
UPDATE users 
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'user@example.com'
RETURNING id, email, role, updated_at;

-- ============================================================================
-- 4. GRANT ADMIN RIGHTS TO MULTIPLE USERS
-- ============================================================================
-- Replace the email addresses in the array with actual emails
UPDATE users 
SET role = 'admin',
    updated_at = NOW()
WHERE email IN (
  'admin1@example.com',
  'admin2@example.com',
  'admin3@example.com'
)
RETURNING id, email, role, updated_at;

-- ============================================================================
-- 5. GRANT ADMIN RIGHTS TO USER (BY USER ID)
-- ============================================================================
-- Replace 'user-uuid-here' with the actual user ID
UPDATE users 
SET role = 'admin',
    updated_at = NOW()
WHERE id = 'user-uuid-here'
RETURNING id, email, role, updated_at;

-- ============================================================================
-- 6. REVOKE ADMIN RIGHTS (Demote to Individual)
-- ============================================================================
-- Replace 'admin@example.com' with the email of user to demote
UPDATE users 
SET role = 'individual',
    updated_at = NOW()
WHERE email = 'admin@example.com'
RETURNING id, email, role, updated_at;

-- ============================================================================
-- 7. CHECK USER PERMISSIONS AND ACCESS
-- ============================================================================
-- Verify what a specific user can access
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(DISTINCT i.id) as initiatives_created,
  COUNT(DISTINCT t.id) as trees_planted,
  COUNT(DISTINCT cd.id) as donations_made,
  COUNT(DISTINCT nb.id) as nft_badges_owned
FROM users u
LEFT JOIN initiatives i ON u.id = i.organization_id
LEFT JOIN trees t ON u.id = t.planted_by
LEFT JOIN crypto_donations cd ON u.id = cd.donor_id
LEFT JOIN nft_badges nb ON u.id = nb.owner_id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.role;

-- ============================================================================
-- 8. CREATE INITIAL SUPER ADMIN
-- ============================================================================
-- Use this if you need to create the first admin user
-- This assumes the user already exists in auth.users
-- Replace with your actual admin email
UPDATE users 
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@ganggreen.org'
RETURNING id, email, role, updated_at;

-- If the user doesn't exist in the users table yet, you need to:
-- 1. First register through the application
-- 2. Then run the UPDATE query above

-- ============================================================================
-- 9. BULK ROLE ASSIGNMENT
-- ============================================================================
-- Assign different roles to multiple users at once
WITH role_assignments AS (
  SELECT * FROM (VALUES
    ('user1@example.com', 'admin'),
    ('user2@example.com', 'organization'),
    ('user3@example.com', 'community'),
    ('user4@example.com', 'individual')
  ) AS t(email, new_role)
)
UPDATE users u
SET role = ra.new_role::text,
    updated_at = NOW()
FROM role_assignments ra
WHERE u.email = ra.email
RETURNING u.id, u.email, u.role, u.updated_at;

-- ============================================================================
-- 10. AUDIT LOG - View Recent Role Changes
-- ============================================================================
-- Note: This requires audit logging to be enabled
-- For now, you can check updated_at timestamps
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at,
  CASE 
    WHEN updated_at > created_at + INTERVAL '1 minute' 
    THEN 'Role likely changed'
    ELSE 'Original role'
  END as status
FROM users
WHERE role = 'admin'
ORDER BY updated_at DESC;

-- ============================================================================
-- 11. VERIFY ADMIN CAPABILITIES
-- ============================================================================
-- Check what admin users can do based on RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%admin%' 
    OR with_check LIKE '%admin%'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- 12. FIND USERS BY ORGANIZATION (for promoting org admins)
-- ============================================================================
SELECT 
  u.id,
  u.email,
  u.role,
  up.full_name,
  up.organization,
  COUNT(DISTINCT i.id) as initiatives_count
FROM users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN initiatives i ON u.id = i.organization_id
WHERE up.organization IS NOT NULL
GROUP BY u.id, u.email, u.role, up.full_name, up.organization
HAVING COUNT(DISTINCT i.id) > 0
ORDER BY initiatives_count DESC;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
/*

STEP-BY-STEP GUIDE:

1. CHECK WHO IS CURRENTLY ADMIN:
   - Run query #1 to see all current admin users
   - If no results, you need to create your first admin

2. FIND USERS TO PROMOTE:
   - Run query #2 to see all users
   - Note the email address of the user you want to make admin

3. GRANT ADMIN RIGHTS:
   - Use query #3 for a single user (replace the email)
   - Use query #4 for multiple users (replace the email array)
   - Use query #5 if you have the user ID instead

4. VERIFY THE CHANGE:
   - Run query #1 again to confirm the user is now admin
   - Run query #7 to see their access level

5. REVOKE IF NEEDED:
   - Use query #6 to remove admin rights from a user

IMPORTANT NOTES:

- Users must first register through the application before you can grant them admin rights
- The user must exist in both auth.users (Supabase Auth) and the users table
- Admin users can:
  * Update any initiative
  * Update any tree record
  * Update any carbon credit
  * View all transactions
  * Manage badge criteria
  * Manage challenge quests
  * View and update support tickets
  * View chatbot analytics

- For security, always verify the email address before granting admin rights
- Keep a record of who has admin access
- Regularly audit admin users (use query #10)

TROUBLESHOOTING:

Q: User not found when trying to grant admin rights?
A: The user needs to register through the app first. Check auth.users table.

Q: Update returns 0 rows?
A: Double-check the email address for typos. Email is case-sensitive.

Q: How to check if a user can login with their access token?
A: Admin rights don't affect login. All users login the same way through Supabase Auth.
   The role only affects what they can do after logging in.

Q: How to find the Supabase super admin?
A: Supabase super admin is the project owner in Supabase Dashboard.
   Database-level admin users are managed through this script.

*/
