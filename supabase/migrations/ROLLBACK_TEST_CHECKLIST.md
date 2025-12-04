# Rollback Test Checklist - Migration 032

**Date**: ________________  
**Tester**: ________________  
**Environment**: STAGING  
**Start Time**: ________________  
**End Time**: ________________  

## Pre-Test Preparation

- [ ] Migration 032 applied to staging
- [ ] Staging verification completed
- [ ] Database backup created
- [ ] Supabase CLI installed
- [ ] Database credentials available
- [ ] Team notified of test

## Step 1: Pre-Rollback State Capture

- [ ] Captured deprecated wallet count: ________________
- [ ] Captured deprecated balance total: ________________
- [ ] Captured deprecated transaction count: ________________
- [ ] Captured migrated transaction count: ________________
- [ ] Captured GG Coin balance total: ________________
- [ ] Saved pre-rollback state to file

**Notes**: ________________________________________________________________

## Step 2: Execute Rollback

- [ ] Rollback script executed
- [ ] No ERROR messages
- [ ] Completion message received
- [ ] Duration: ________________ seconds
- [ ] Output saved to file

**Issues Encountered**: ____________________________________________________

## Step 3: Table Restoration Verification

- [ ] `green_coin_wallets` table exists
- [ ] `green_coin_transactions` table exists
- [ ] `_deprecated_green_coin_wallets` removed
- [ ] `_deprecated_green_coin_transactions` removed
- [ ] Table structure correct
- [ ] Columns match original schema

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 4: Data Integrity Verification

### Wallet Data
- [ ] Wallet count matches: ________________ (expected: ________________)
- [ ] Balance total matches: ________________ (expected: ________________)
- [ ] No negative balances: ________________ found
- [ ] No NULL balances: ________________ found
- [ ] Orphaned wallets: ________________ (acceptable: ________________)

### Transaction Data
- [ ] Transaction count matches: ________________ (expected: ________________)
- [ ] No NULL required fields
- [ ] Transaction types valid
- [ ] Timestamps valid
- [ ] Orphaned transactions: ________________ (acceptable: ________________)

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 5: Transaction Cleanup Verification

- [ ] Remaining migrated transactions: ________________ (expected: 0)
- [ ] GG Coin transaction count reduced appropriately
- [ ] GG Coin balances handled correctly
- [ ] No orphaned GG Coin transactions

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 6: Function Cleanup Verification

- [ ] `get_coin_migration_stats` removed
- [ ] `is_migrated_transaction` removed
- [ ] No other migration helper functions remain

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 7: Metadata Verification

- [ ] Wallet table comment restored
- [ ] Transaction table comment restored
- [ ] Comments do NOT contain "DEPRECATED"
- [ ] Comments appropriate for active tables

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 8: Performance Testing

### Balance Query
- [ ] Query time: ________________ ms (target: < 50ms)
- [ ] Status: ✅ PASS / ⚠️ WARNING / ❌ FAIL

### Transaction Query
- [ ] Query time: ________________ ms (target: < 200ms)
- [ ] Status: ✅ PASS / ⚠️ WARNING / ❌ FAIL

### Indexes
- [ ] `idx_green_coin_wallets_user_id` exists
- [ ] `idx_green_coin_transactions_user_id` exists
- [ ] `idx_green_coin_transactions_timestamp` exists
- [ ] `idx_green_coin_transactions_type` exists

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Step 9: Application Testing

### Balance Display
- [ ] User profile page loads
- [ ] Green Coin balance displays
- [ ] Balance is correct
- [ ] Formatting is correct

### Earn Coins
- [ ] Action completed (specify): ________________________________
- [ ] Coins credited correctly
- [ ] Toast notification appeared
- [ ] Balance updated

### Transaction History
- [ ] History page loads
- [ ] Transactions display correctly
- [ ] Pagination works
- [ ] Amounts are correct
- [ ] Timestamps formatted correctly

### Service Integration
- [ ] `greenCoin.service.ts` methods work
- [ ] `getBalance()` works
- [ ] `creditCoins()` works
- [ ] `debitCoins()` works
- [ ] Error handling works

### Real-time Updates
- [ ] Opened two tabs
- [ ] Earned coins in one tab
- [ ] Balance updated in other tab
- [ ] Update latency: ________________ seconds

**Status**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Issues Log

| # | Issue Description | Severity | Status | Resolution |
|---|-------------------|----------|--------|------------|
| 1 | | ⚠️ / ❌ | Open / Resolved | |
| 2 | | ⚠️ / ❌ | Open / Resolved | |
| 3 | | ⚠️ / ❌ | Open / Resolved | |
| 4 | | ⚠️ / ❌ | Open / Resolved | |
| 5 | | ⚠️ / ❌ | Open / Resolved | |

## Overall Test Result

**Database Verification**: ✅ PASS / ⚠️ WARNING / ❌ FAIL  
**Application Testing**: ✅ PASS / ⚠️ WARNING / ❌ FAIL  
**Overall Result**: ✅ PASS / ⚠️ WARNING / ❌ FAIL

## Decision

Based on the test results:

- [ ] ✅ **PROCEED** - Rollback verified, can proceed with production migration
- [ ] ⚠️ **PROCEED WITH CAUTION** - Minor issues found, proceed with monitoring
- [ ] ❌ **DO NOT PROCEED** - Critical issues found, must fix before production

**Rationale**: ____________________________________________________________

________________________________________________________________________

________________________________________________________________________

## Next Steps

### Immediate Actions
- [ ] Document test results
- [ ] Save output files
- [ ] Notify team
- [ ] Get sign-off

### Short-term Actions
- [ ] Re-apply migration 032 (if needed)
- [ ] Verify migration success
- [ ] Update documentation
- [ ] Plan production deployment

### Long-term Actions
- [ ] Archive test results
- [ ] Update runbooks
- [ ] Train team
- [ ] Document lessons learned

## Sign-off

### Tester
**Name**: ________________  
**Signature**: ________________  
**Date**: ________________

### Database Team Lead
**Name**: ________________  
**Signature**: ________________  
**Date**: ________________

### DevOps Lead
**Name**: ________________  
**Signature**: ________________  
**Date**: ________________

### Product Owner
**Name**: ________________  
**Signature**: ________________  
**Date**: ________________

## Attachments

- [ ] Pre-rollback state capture
- [ ] Rollback script output
- [ ] Test script output
- [ ] Performance test results
- [ ] Application test screenshots
- [ ] Error logs (if any)
- [ ] Summary report

**Files Saved To**: ________________________________________________________

## Notes and Comments

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

---

**Checklist Version**: 1.0  
**Created**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation  
**Status**: Ready for Use ✅
