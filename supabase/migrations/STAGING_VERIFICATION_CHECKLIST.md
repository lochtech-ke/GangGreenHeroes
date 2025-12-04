# Migration 032 Staging Verification Checklist

## Pre-Verification Setup

- [ ] Staging database backup created
- [ ] Migration 032 deployed to staging
- [ ] Verification scripts downloaded/available
- [ ] Database credentials ready
- [ ] Team notified of verification

## Database Verification

### Run Verification Script
- [ ] Execute `verify_032_staging.sql`
- [ ] Save output for review
- [ ] Document timestamp of verification

### Critical Checks (Must Pass)

#### Table Structure
- [ ] ✓ Deprecated tables exist
- [ ] ✓ Target tables exist  
- [ ] ✓ gg_coins column exists with DECIMAL(10,3)

#### Balance Consistency
- [ ] ✓ Balance totals match (< 0.01 difference)
- [ ] ✓ No negative balances
- [ ] ✓ No NULL balances
- [ ] ✓ Balance precision valid (3 decimals)

#### Transaction Migration
- [ ] ✓ Transaction counts match
- [ ] ✓ All transaction types valid
- [ ] ✓ No NULL amounts
- [ ] ✓ All transactions have metadata

#### Referential Integrity
- [ ] ✓ No orphaned wallet records
- [ ] ✓ No orphaned transaction records
- [ ] ✓ All migrated users have wallets

#### Indexes and Performance
- [ ] ✓ Required indexes exist
- [ ] ✓ Balance query < 100ms
- [ ] ✓ Transaction history query < 200ms

#### Helper Functions
- [ ] ✓ is_migrated_transaction exists
- [ ] ✓ get_coin_migration_stats exists

#### Deprecation
- [ ] ✓ Deprecated tables have comments
- [ ] ✓ Tables renamed with _deprecated_ prefix

### Non-Critical Checks (Review Warnings)

- [ ] Zero-amount transactions (if any)
- [ ] Duplicate transactions (if any)
- [ ] Users without wallets (if any)
- [ ] Performance warnings (if any)

### Verification Results

**Date**: _______________  
**Time**: _______________  
**Executed By**: _______________

**Total Checks**: 21  
**Passed**: _____  
**Warnings**: _____  
**Failed**: _____

**Critical Failures** (if any):
```
[List any critical failures here]
```

**Warnings** (if any):
```
[List any warnings here]
```

## Sample Data Review

- [ ] Reviewed top 5 wallets by balance
- [ ] Verified balances match original data
- [ ] Reviewed recent 5 transactions
- [ ] Verified transaction metadata correct

**Sample Data Notes**:
```
[Add any observations about sample data]
```

## Application Testing

### Balance Display
- [ ] User profile shows GG Coins
- [ ] Balance displays correctly
- [ ] Decimals formatted properly (.000 hidden, .500 shown)
- [ ] Thousand separators work
- [ ] Loading states work

### Transaction Recording
- [ ] Can earn coins (test action)
- [ ] Coins credited immediately
- [ ] Balance updates in real-time
- [ ] Toast notification appears
- [ ] Transaction in history

### Transaction History
- [ ] History page loads
- [ ] Migrated transactions visible
- [ ] Pagination works
- [ ] Amounts show +/- prefix
- [ ] Timestamps relative (e.g., "2 hours ago")
- [ ] Filtering works (if implemented)

### Real-time Updates
- [ ] Balance updates across tabs
- [ ] Update latency < 2 seconds
- [ ] Subscription cleanup works

### Error Handling
- [ ] No console errors
- [ ] No application errors in logs
- [ ] Error messages user-friendly
- [ ] Network disconnection handled

### UI Consistency
- [ ] No "Green Coin" references in UI
- [ ] All text says "GG Coins"
- [ ] Navigation labels updated
- [ ] Help text updated
- [ ] Tooltips updated

**Application Testing Notes**:
```
[Add any observations about application behavior]
```

## Performance Testing

### Database Performance
- [ ] Balance query: _____ ms (target: < 50ms)
- [ ] Transaction insert: _____ ms (target: < 200ms)
- [ ] Transaction history: _____ ms (target: < 100ms)

### Application Performance
- [ ] Page load time: _____ ms
- [ ] Balance fetch time: _____ ms
- [ ] Transaction recording time: _____ ms

**Performance Notes**:
```
[Add any performance observations]
```

## Issues Found

### Critical Issues (Require Fix)
```
Issue #1:
  Description: 
  Impact: 
  Action: 

Issue #2:
  Description: 
  Impact: 
  Action: 
```

### Non-Critical Issues (Can Defer)
```
Issue #1:
  Description: 
  Impact: 
  Action: 

Issue #2:
  Description: 
  Impact: 
  Action: 
```

## Decision

### Verification Status
- [ ] ✅ PASSED - All critical checks passed, proceed to production
- [ ] ⚠️ PASSED WITH WARNINGS - Proceed with monitoring
- [ ] ❌ FAILED - Rollback required

### Rollback Decision
- [ ] No rollback needed
- [ ] Rollback recommended
- [ ] Rollback required immediately

**Rollback Reason** (if applicable):
```
[Explain why rollback is needed]
```

## Sign-off

### Database Team
**Name**: _______________  
**Date**: _______________  
**Signature**: _______________

**Comments**:
```
[Database team comments]
```

### Development Team
**Name**: _______________  
**Date**: _______________  
**Signature**: _______________

**Comments**:
```
[Development team comments]
```

### DevOps Team
**Name**: _______________  
**Date**: _______________  
**Signature**: _______________

**Comments**:
```
[DevOps team comments]
```

## Next Steps

### If Verification Passed
- [ ] Document verification results
- [ ] Schedule production deployment
- [ ] Prepare production rollback plan
- [ ] Notify stakeholders of success
- [ ] Update deployment timeline

### If Verification Failed
- [ ] Execute rollback script
- [ ] Document failure reasons
- [ ] Investigate root causes
- [ ] Fix issues in development
- [ ] Retest on staging
- [ ] Reschedule deployment

### Post-Verification Actions
- [ ] Archive verification output
- [ ] Update migration documentation
- [ ] Share results with team
- [ ] Update project status
- [ ] Plan monitoring strategy

## Monitoring Plan

### Metrics to Monitor (First 24 Hours)
- [ ] Transaction success rate
- [ ] Balance query performance
- [ ] Error rate in logs
- [ ] User support tickets
- [ ] Real-time update latency

### Alert Thresholds
- Transaction failure rate > 1%
- Balance query time > 200ms
- Error rate increase > 10%
- Support tickets > 5 related to coins

**Monitoring Notes**:
```
[Add monitoring setup details]
```

## Documentation

### Files Updated
- [ ] Verification results saved
- [ ] Performance metrics documented
- [ ] Issues logged in tracking system
- [ ] Team notified via email/slack
- [ ] Wiki updated (if needed)

### Artifacts
- [ ] Verification output file: _______________
- [ ] Performance test results: _______________
- [ ] Screenshot of successful tests: _______________
- [ ] Database backup location: _______________

## References

- [Verification Guide](./VERIFY_STAGING_GUIDE.md)
- [Migration Guide](./MIGRATION_032_GUIDE.md)
- [Requirements](../../.kiro/specs/coin-harmonization/requirements.md)
- [Design](../../.kiro/specs/coin-harmonization/design.md)
- [Tasks](../../.kiro/specs/coin-harmonization/tasks.md)

---

**Checklist Version**: 1.0  
**Last Updated**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation
