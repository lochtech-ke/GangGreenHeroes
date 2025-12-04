# Quick Deploy Guide

## ⚡ Fastest Way to Deploy Database

Since `npx supabase db push` requires authentication, here are your options:

### Option 1: Supabase Dashboard (Recommended - No CLI needed)

**Takes 5 minutes:**

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select project: `wobpryllvdjaapzjbsxx`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Execute Main Migration**
   - Copy entire content of `supabase/migrations/000_all_migrations.sql`
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait ~30 seconds for completion

4. **Execute RLS Policies**
   - Create new query
   - Copy content of `supabase/migrations/010_rls_policies.sql`
   - Paste and Run

5. **Set Up Storage Buckets**
   - Go to "Storage" in left sidebar
   - Create 4 buckets:
     - `tree-images` (Public, 10MB limit)
     - `documents` (Private, 20MB limit)
     - `avatars` (Public, 2MB limit)
     - `nft-badges` (Public, 5MB limit)
   - Go back to SQL Editor
   - Copy content of `supabase/storage/buckets.sql`
   - Paste and Run

6. **Verify Setup**
   ```sql
   -- Run this query to verify
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   - Should see 20 tables

✅ **Done!** Your database is ready.

---

### Option 2: Using Supabase CLI (Requires Authentication)

**If you want to use CLI:**

#### Windows (PowerShell)
```powershell
# Run the migration script
.\supabase\push-migrations.ps1
```

#### Mac/Linux (Bash)
```bash
# Make script executable
chmod +x supabase/push-migrations.sh

# Run the migration script
./supabase/push-migrations.sh
```

#### Manual CLI Steps
```bash
# 1. Login to Supabase
npx supabase login

# 2. Link to your project
npx supabase link --project-ref wobpryllvdjaapzjbsxx

# 3. Push migrations
npx supabase db push
```

**Note:** You'll need to authenticate via browser when running `supabase login`.

---

### Option 3: Direct psql Connection

If you have PostgreSQL client installed:

```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.wobpryllvdjaapzjbsxx.supabase.co:5432/postgres" \
  -f supabase/migrations/000_all_migrations.sql
```

---

## 🔍 Verification

After deployment, verify everything is set up:

### Check Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 20
```

### Check Indexes
```sql
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Expected: 80+
```

### Check RLS
```sql
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 20
```

### Check Extensions
```sql
SELECT extname FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis');
-- Expected: 2 rows
```

---

## 🚨 Troubleshooting

### "Extension postgis does not exist"
PostGIS might not be enabled. Contact Supabase support or check your plan.

### "Permission denied"
Make sure you're using the correct credentials and have admin access.

### "Relation already exists"
Tables already exist. Either:
- Drop existing tables: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Or skip to RLS policies if tables are correct

### CLI Authentication Issues
Use Option 1 (Dashboard) instead - it's simpler and doesn't require CLI setup.

---

## ✅ Success Checklist

- [ ] 20 tables created
- [ ] 80+ indexes created
- [ ] RLS enabled on all tables
- [ ] RLS policies applied
- [ ] 4 storage buckets created
- [ ] Storage policies applied
- [ ] Extensions enabled (uuid-ossp, postgis)

---

## 📞 Need Help?

- Check `SETUP_GUIDE.md` for detailed instructions
- Review `migrations/README.md` for migration details
- Check Supabase Dashboard logs for errors

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Test database connection from your app
2. ✅ Verify environment variables are set
3. ✅ Proceed to Task 3: Authentication System

---

**Recommended:** Use Option 1 (Dashboard) - it's the fastest and most reliable method!
