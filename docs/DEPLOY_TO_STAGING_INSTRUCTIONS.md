# Quick Instructions: Deploy Migration 032 to Staging

## 🚀 Fastest Method (Recommended)

### Using Supabase Dashboard (No CLI Required)

**Time: 5-10 minutes**

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select project: `wobpryllvdjaapzjbsxx`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Execute Migration**
   - Open file: `supabase/migrations/032_consolidate_coins.sql`
   - Copy entire content (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait 2-5 minutes for completion

4. **Verify Success**
   - Look for "MIGRATION 032 COMPLETED SUCCESSFULLY" message
   - Check for any errors in output
   - If successful, proceed to verification

5. **Run Verification Queries**
   - Create new query in SQL Editor
   - Copy and paste this query:
   ```sql
   SELECT * FROM get_coin_migration_stats();
   ```
   - Click "Run"
   - Verify results match expectations

✅ **Done!** Migration deployed to staging.

---

## 🔧 Alternative Method: Using PowerShell Script

### Prerequisites
- Supabase CLI installed
- Authenticated with Supabase

### Steps

```powershell
# 1. Navigate to project root
cd path\to\ganggreen-platform

# 2. Run deployment script
.\supabase\deploy-migration-032-staging.ps1

# 3. Follow prompts
# - Type 'DEPLOY' when prompted to confirm
# - Wait for completion
# - Review output for any errors

# 4. Verify deployment
.\supabase\deploy-migration-032-staging.ps1 -Verify
```

---

## 📋 Verification Checklist

After deployment, verify these items:

### Quick Verification
```sql
-- Run this in SQL Editor
SELECT * FROM get_coin_migration_stats();
```

Expected output should show:
- `total_wallets_migrated`: [number]
- `total_balance_migrated`: [amount]
- `total_transactions_migrated`: [number]
- `current_gg_coin_total`: [should match balance_migrated]

### Detailed Verification
```sql
-- Check deprecated tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%';

-- Should return:
-- _deprecated_green_coin_transactions
-- _deprecated_green_coin_wallets
```

### Balance Verification
```sql
-- Verify no data loss
SELECT 
  (SELECT SUM(balance) FROM _deprecated_green_coin_wallets) as old_total,
  (SELECT SUM(gg_coins) FROM user_gamification) as new_total;

-- old_total and new_total should match (or be very close)
```

---

## ✅ Success Criteria

Migration is successful when:
- ✅ No errors in migration output
- ✅ "MIGRATION 032 COMPLETED SUCCESSFULLY" message appears
- ✅ Deprecated tables exist (`_deprecated_green_coin_*`)
- ✅ Balance totals match
- ✅ Transaction counts match
- ✅ Verification queries return expected results

---

## 🔄 If Something Goes Wrong

### Rollback Procedure

If migration fails or causes issues:

1. **Open SQL Editor**
2. **Execute Rollback Script**
   - Open file: `supabase/migrations/rollback_032.sql`
   - Copy entire content
   - Paste into SQL Editor
   - Click "Run"
   - Wait for completion

3. **Verify Rollback**
   ```sql
   -- Check that original tables are restored
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('green_coin_wallets', 'green_coin_transactions');
   
   -- Should return both tables
   ```

---

## 📝 After Successful Deployment

1. **Document Results**
   - Note deployment timestamp
   - Record any warnings or issues
   - Save verification query results

2. **Test Application**
   - Test balance queries
   - Test transaction recording
   - Verify UI displays correctly

3. **Test Rollback** (Important!)
   - Execute rollback script
   - Verify data restored
   - Re-deploy migration
   - This ensures rollback works for production

4. **Update Task Status**
   - Mark subtask "Deploy migration to staging" as complete
   - Proceed to next subtask: "Verify migration success on staging"

---

## 📚 Additional Resources

- **Detailed Guide**: `supabase/migrations/STAGING_DEPLOYMENT_GUIDE.md`
- **Migration Guide**: `supabase/migrations/MIGRATION_032_GUIDE.md`
- **Rollback Guide**: `supabase/migrations/ROLLBACK_032_GUIDE.md`
- **Design Document**: `.kiro/specs/coin-harmonization/design.md`

---

## 🆘 Need Help?

### Common Issues

**Issue**: "Extension postgis does not exist"  
**Solution**: PostGIS should be enabled. Contact Supabase support if needed.

**Issue**: "Permission denied"  
**Solution**: Ensure you have admin access to the project.

**Issue**: Migration timeout  
**Solution**: Try running during low-traffic period or contact Supabase support.

### Get Support
- Check troubleshooting section in `STAGING_DEPLOYMENT_GUIDE.md`
- Review Supabase dashboard logs
- Contact database team

---

**Ready to deploy?** Use the Supabase Dashboard method above - it's the fastest and most reliable!
