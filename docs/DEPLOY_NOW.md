# Deploy Migration 032 to Staging - Quick Guide

## ⚡ Fastest Method (5 Minutes)

Since you're ready to deploy, here's the quickest way using the Supabase Dashboard:

### Step 1: Open Supabase Dashboard
1. Go to: **https://app.supabase.com**
2. Select your project: **wobpryllvdjaapzjbsxx**

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### Step 3: Copy Migration Script
1. Open the file: `supabase/migrations/032_consolidate_coins.sql`
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)

### Step 4: Execute Migration
1. Paste into SQL Editor (Ctrl+V)
2. Click **"Run"** button (or press Ctrl+Enter)
3. Wait 2-5 minutes for completion
4. Watch for "MIGRATION 032 COMPLETED SUCCESSFULLY" message

### Step 5: Verify Success
Create a new query and run:
```sql
SELECT * FROM get_coin_migration_stats();
```

Expected output:
- `total_wallets_migrated`: [number]
- `total_balance_migrated`: [amount]  
- `total_transactions_migrated`: [number]
- `current_gg_coin_total`: [should match balance_migrated]

### Step 6: Check Deprecated Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%';
```

Should return:
- `_deprecated_green_coin_transactions`
- `_deprecated_green_coin_wallets`

## ✅ Success Checklist

- [ ] Migration executed without errors
- [ ] "MIGRATION 032 COMPLETED SUCCESSFULLY" message appeared
- [ ] Deprecated tables exist
- [ ] Balance totals match
- [ ] Verification queries return expected results

## 🔄 If You Need to Rollback

If something goes wrong:

1. Create new query in SQL Editor
2. Open file: `supabase/migrations/rollback_032.sql`
3. Copy all content
4. Paste and run in SQL Editor

## 📝 After Successful Deployment

1. Mark the subtask as complete
2. Proceed to next subtask: "Verify migration success on staging"
3. Document any issues or observations

---

**That's it!** The dashboard method is the most reliable and doesn't require CLI setup.
