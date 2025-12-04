# Rollback Test Package - Quick Start

## 📦 What's Included

This package provides everything needed to test the rollback procedure for Migration 032 on staging.

### Files Created

1. **test_rollback_032_staging.sql** - Automated SQL test script (20+ checks)
2. **test-rollback-staging.ps1** - PowerShell automation script
3. **ROLLBACK_TEST_GUIDE.md** - Detailed step-by-step guide
4. **ROLLBACK_TEST_CHECKLIST.md** - Printable checklist with sign-off
5. **ROLLBACK_TEST_SUMMARY.md** - Package overview and reference
6. **ROLLBACK_TEST_PACKAGE_README.md** - This file

## 🚀 Quick Start (5 minutes)

### Option 1: Automated (Recommended)

```powershell
# Run from project root
.\supabase\test-rollback-staging.ps1 -SaveOutput
```

This will:
1. Capture pre-rollback state
2. Execute rollback script
3. Run all verification checks
4. Test performance
5. Generate report
6. Save output files

### Option 2: Manual

```powershell
# 1. Execute rollback
npx supabase db execute -f supabase/migrations/rollback_032.sql

# 2. Run tests
npx supabase db execute -f supabase/migrations/test_rollback_032_staging.sql

# 3. Review output
```

## ✅ What Gets Tested

### Database (20+ checks)
- ✅ Table restoration
- ✅ Data integrity (counts, balances)
- ✅ Transaction cleanup
- ✅ Function cleanup
- ✅ Metadata restoration
- ✅ Performance (< 200ms)

### Application (5 tests)
- ✅ Balance display
- ✅ Earn coins
- ✅ Transaction history
- ✅ Service integration
- ✅ Real-time updates

## 📊 Expected Results

### Success
```
✓ ROLLBACK TEST PASSED
All critical checks passed successfully
```

### Failure
```
✗ ROLLBACK TEST FAILED
One or more critical checks failed - review above
```

## 🎯 Success Criteria

Test passes when:
- All database checks pass
- Application works correctly
- Performance acceptable
- No critical errors

## ⏱️ Time Required

- **Automated**: 10-15 minutes
- **Manual**: 40-60 minutes

## 📖 Documentation

| File | Use When |
|------|----------|
| **ROLLBACK_TEST_SUMMARY.md** | Quick reference |
| **ROLLBACK_TEST_GUIDE.md** | Detailed instructions |
| **ROLLBACK_TEST_CHECKLIST.md** | Documentation/sign-off |

## 🔧 Troubleshooting

### Issue: Script fails
**Solution**: Check error message, verify prerequisites

### Issue: Balance mismatch
**Solution**: Check for orphaned records, verify no concurrent transactions

### Issue: Application errors
**Solution**: Clear cache, restart server, check console

## 📞 Support

- **Documentation**: See ROLLBACK_TEST_GUIDE.md
- **Database Team**: database-team@ganggreen.com
- **Emergency**: emergency@ganggreen.com

## 🎓 Tips

1. Test during low traffic
2. Save all output (`-SaveOutput`)
3. Document everything
4. Get team sign-off
5. Have backup ready

## ✨ Next Steps

### After Successful Test
1. Document results
2. Get sign-off
3. Re-apply migration 032
4. Proceed to production

### After Failed Test
1. Investigate issues
2. Fix rollback script
3. Re-test
4. Update documentation

## 📝 Quick Commands

```powershell
# Run automated test
.\supabase\test-rollback-staging.ps1 -SaveOutput

# Check table status
npx supabase db execute -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%green_coin%';"

# Get wallet count
npx supabase db execute -c "SELECT COUNT(*) FROM green_coin_wallets;"

# Get balance total
npx supabase db execute -c "SELECT SUM(balance) FROM green_coin_wallets;"
```

## 🎉 You're Ready!

Everything is set up and ready to test the rollback procedure. Follow the Quick Start above to begin testing.

**Remember**: This test ensures we can safely rollback if needed in production!

---

**Version**: 1.0  
**Created**: 2025-01-30  
**Status**: Ready ✅
