# Coin System Harmonization - Tasks

## Task Breakdown

### Phase 1: Database Migration (Days 1-2)

#### Task 1.1: Create Migration Script
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: None

**Subtasks:**
- [x] Write SQL migration script to consolidate Green Coins into GG Coins




- [x] Add data validation checks




- [x] Create rollback script




- [x] Test on local database with sample data




- [x] Document migration process


**Acceptance Criteria:**
- Migration script runs without errors
- All Green Coin balances transferred to GG Coins
- All Green Coin transactions migrated to GG Coin transactions
- Totals match before and after migration
- Rollback script successfully reverses migration

**Files to Create/Modify:**
- `supabase/migrations/032_consolidate_coins.sql`
- `supabase/migrations/rollback_032.sql`
- `supabase/migrations/MIGRATION_032_GUIDE.md`

---

#### Task 1.2: Test Migration on Staging
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: Task 1.1

**Subtasks:**
- [x] Create staging database backup




- [x] Deploy migration to staging





- [x] Verify migration success on staging





- [x] Test rollback on staging





- [x] Document any issues found





**Acceptance Criteria:**
- Migration runs successfully on staging
- All validation checks pass
- Rollback works correctly
- Performance is acceptable
- No data loss or corruption

**Files to Test:**
- `supabase/migrations/032_consolidate_coins.sql`
- `supabase/migrations/rollback_032.sql`

---

### Phase 2: Service Layer Implementation (Days 3-5)

#### Task 2.1: Create Unified GG Coin Service
**Estimated Time**: 6 hours
**Priority**: Critical
**Dependencies**: Task 1.2

**Subtasks:**
- [x] Create `src/services/ggCoin.service.ts` with core interfaces



- [x] Implement wallet operations (getWallet, getBalance)

- [x] Implement transaction operations (creditCoins, debitCoins)

- [x] Implement caching with 30-second TTL

- [x] Implement cache invalidation on transactions

- [x] Add error handling and logging



**Acceptance Criteria:**
- Service implements all methods from design
- Balance queries use caching
- Transactions are atomic
- Error handling is comprehensive
- TypeScript types are properly defined

**Files to Create:**
- `src/services/ggCoin.service.ts`
- `src/types/ggCoin.types.ts`

**Requirements**: B3.1, B3.3

---

#### Task 2.2: Implement Reward System
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Define reward rules configuration





- [x] Implement calculateReward method








- [x] Implement awardCoins method



- [x] Add support for multipliers

- [x] Add support for impact scaling

- [x] Round rewards to 3 decimal places



**Acceptance Criteria:**
- All reward types defined (tree planting, missions, etc.)
- Multipliers apply correctly
- Impact scaling works
- Rewards rounded to 3 decimals
- Integration with transaction system

**Files to Modify:**
- `src/services/ggCoin.service.ts`

**Requirements**: B4.1, B4.2, B4.3

---

#### Task 2.3: Implement Transaction History
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Implement getTransactionHistory with pagination





- [x] Implement getEarningBreakdown




- [x] Add filtering by type and date range




- [x] Add total count and hasMore flag





- [x] Optimize queries with proper indexes






**Acceptance Criteria:**
- Pagination works correctly
- Filtering by type and date works
- Performance is acceptable (< 200ms)
- Returns total count and hasMore
- Handles edge cases (no transactions, etc.)

**Files to Modify:**
- `src/services/ggCoin.service.ts`

**Requirements**: B3.4

---

#### Task 2.4: Implement Real-time Subscriptions
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Implement subscribeToBalance method





- [x] Set up Supabase real-time subscription

- [x] Handle subscription cleanup

- [x] Test real-time updates

- [x] Add error handling for connection issues


**Acceptance Criteria:**
- Real-time updates work correctly
- Subscriptions clean up properly
- Handles connection errors gracefully
- Updates within 2 seconds
- Multiple subscribers supported

**Files to Modify:**
- `src/services/ggCoin.service.ts`

**Requirements**: B3.3

---

#### Task 2.5: Update Existing Services to Use GG Coins
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Update treeWallet.service.ts to award GG Coins
  - Import ggCoinService
  - Replace greenCoin calls with ggCoin calls
  - Apply appropriate multipliers
  - Test integration

- [x] Update mission.service.ts to award GG Coins
  - Import ggCoinService
  - Replace greenCoin calls with ggCoin calls
  - Apply appropriate multipliers
  - Test integration

- [x] Update education.service.ts to award GG Coins
  - Import ggCoinService
  - Replace greenCoin calls with ggCoin calls
  - Apply appropriate multipliers
  - Test integration

- [x] Update petition.service.ts to award GG Coins
  - Import ggCoinService
  - Replace greenCoin calls with ggCoin calls
  - Apply appropriate multipliers
  - Test integration

- [x] Update referral.service.ts to award GG Coins
  - Import ggCoinService
  - Replace greenCoin calls with ggCoin calls
  - Apply appropriate multipliers
  - Test integration

- [x] Remove Green Coin service calls
  - Search for all greenCoin.service imports
  - Replace with ggCoin.service
  - Verify no broken references
  - Test all affected features

**Acceptance Criteria:**
- All services use ggCoin.service
- No references to greenCoin.service
- Rewards are awarded correctly
- Multipliers are applied where appropriate
- All integrations tested

**Files to Modify:**
- `src/services/treeWallet.service.ts`
- `src/services/mission.service.ts`
- `src/services/education.service.ts`
- `src/services/petition.service.ts`
- `src/services/referral.service.ts`

**Requirements**: B3.1, B4.1

---

### Phase 3: UI Updates (Days 6-7)

#### Task 3.1: Create GG Coin Wallet Component
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Create GGCoinWallet component



- [x] Implement balance display with proper formatting




- [x] Add loading states





- [x] Integrate real-time updates




- [x] Add error handling




- [x] Style component





**Acceptance Criteria:**
- Component displays balance correctly
- Decimals shown only when non-zero
- Thousand separators for large amounts
- Real-time updates work
- Loading and error states handled
- Responsive design

**Files to Create:**
- `src/components/gamification/GGCoinWallet.tsx`

**Requirements**: B5.1, B5.2

---

#### Task 3.2: Create Transaction History Component
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 2.3

**Subtasks:**
- [x] Create TransactionHistory component



- [x] Implement transaction list display
- [x] Add pagination controls
- [x] Format amounts with +/- prefix
- [x] Add filtering UI (optional)
- [x] Style component

**Acceptance Criteria:**
- Displays transactions correctly
- Pagination works
- Amounts formatted with +/- prefix
- Timestamps shown relative (e.g., "2 hours ago")
- Responsive design
- Loading states handled

**Files to Create:**
- `src/components/gamification/TransactionHistory.tsx`

**Requirements**: B5.1, B5.2

---

#### Task 3.3: Create Coin Earned Toast Notification
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Create CoinEarnedToast component



- [x] Add animation for toast appearance
- [x] Auto-dismiss after 5 seconds
- [x] Show amount and reason
- [x] Style component
- [x] Integrate with services

**Acceptance Criteria:**
- Toast appears when coins earned
- Shows amount and reason
- Auto-dismisses after 5 seconds
- Can be manually dismissed
- Animations smooth
- Accessible (ARIA labels)

**Files to Create:**
- `src/components/common/CoinEarnedToast.tsx`

**Requirements**: B5.3

---

#### Task 3.4: Update All UI References from Green Coins to GG Coins
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Task 3.1

**Subtasks:**
- [x] Search codebase for "Green Coin" references
  - Use grep to find all occurrences
  - Document locations
  - Create replacement plan

- [x] Update all text to "GG Coins"
  - Replace in component text
  - Replace in labels
  - Replace in tooltips
  - Replace in error messages

- [x] Update GreenCoinWallet to use GGCoinWallet
  - Replace imports
  - Update component usage
  - Test rendering
  - Verify functionality

- [x] Update GreenCoinsPage to use new components
  - Import GGCoinWallet
  - Import TransactionHistory
  - Update page title
  - Test page functionality

- [x] Update navigation labels
  - Update menu items
  - Update breadcrumbs
  - Update page titles
  - Test navigation

- [x] Update documentation
  - Update README
  - Update wiki
  - Update API docs
  - Update comments

**Acceptance Criteria:**
- No "Green Coin" references in UI
- All components use "GG Coins"
- Navigation updated
- Pages updated
- Documentation updated
- No broken links or imports

**Files to Modify:**
- `src/pages/GreenCoinsPage.tsx` → Rename or update
- `src/components/gamification/GreenCoinWallet.tsx` → Deprecate
- `src/components/navigation/navigationConfig.ts`
- Various UI components

**Requirements**: B5.1

---

### Phase 4: Testing (Days 8-10)

#### Task 4.1: Write Unit Tests for GG Coin Service
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Test getBalance with caching




- [x] Test creditCoins



- [x] Test debitCoins




- [x] Test calculateReward




- [x] Test awardCoins





- [x] Test cache invalidation






- [x] Test error handling




**Acceptance Criteria:**
- > 90% code coverage for ggCoin.service
- All methods tested
- Edge cases covered
- Error scenarios tested
- Mocking done correctly

**Files to Create:**
- `src/services/ggCoin.service.test.ts`

**Requirements**: C5

---

#### Task 4.2: Write Integration Tests
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: Task 2.5

**Subtasks:**
- [x] Test end-to-end coin earning flow
  - Test initial balance retrieval
  - Test reward calculation
  - Test coin crediting
  - Test balance updates
  - Test transaction history

- [x] Test end-to-end coin spending flow
  - Test balance checking
  - Test coin debiting
  - Test balance updates
  - Test transaction history

- [x] Test balance consistency across transactions
  - Test sequential operations
  - Test balance tracking
  - Test transaction ordering

- [x] Test negative balance prevention
  - Test insufficient balance
  - Test overdraft prevention
  - Test error handling

- [x] Test concurrent transactions
  - Test parallel operations
  - Test race conditions
  - Test atomicity

**Acceptance Criteria:**
- Integration tests pass
- Real database interactions tested
- Transaction atomicity verified
- Race conditions handled
- Performance acceptable

**Files to Create:**
- `src/services/ggCoin.integration.test.ts`

**Requirements**: C5

---

#### Task 4.3: Write UI Component Tests
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 3.1, Task 3.2

**Subtasks:**
- [x] Test GGCoinWallet component
- [x] Test TransactionHistory component
- [x] Test CoinEarnedToast component
- [x] Test balance formatting
- [x] Test real-time updates

**Acceptance Criteria:**
- All components have tests
- Rendering tested
- User interactions tested
- Edge cases covered
- Accessibility tested

**Files to Create:**
- `src/components/gamification/GGCoinWallet.test.tsx`
- `src/components/gamification/TransactionHistory.test.tsx`
- `src/components/common/CoinEarnedToast.test.tsx`

**Requirements**: C5

---

#### Task 4.4: Performance Testing
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: Task 2.1

**Subtasks:**
- [x] Test balance query performance
- [x] Test transaction recording performance
- [x] Test pagination performance
- [x] Test with large datasets
- [x] Optimize slow queries

**Acceptance Criteria:**
- Balance queries < 50ms (cached)
- Transaction recording < 200ms
- Pagination < 100ms
- Performance acceptable with 10,000+ users
- No N+1 query issues

**Requirements**: D1

---

### Phase 5: Deployment (Days 11-12)

#### Task 5.1: Deploy to Production
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: All previous tasks

**Subtasks:**
- [x] Create production database backup
- [x] Deploy migration to production
- [x] Verify migration success
- [x] Deploy application code
- [x] Monitor for errors
- [x] Verify functionality

**Acceptance Criteria:**
- Migration completes successfully
- No data loss
- Application works correctly
- No increase in error rates
- Performance acceptable
- Rollback plan ready

**Requirements**: B6.1, B6.3

---

#### Task 5.2: Monitor and Validate
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: Task 5.1

**Subtasks:**
- [x] Monitor error logs
- [x] Monitor performance metrics
- [x] Verify user transactions
- [x] Check balance consistency
- [x] Respond to any issues
- [x] Document lessons learned

**Acceptance Criteria:**
- No critical errors
- Performance within SLA
- Users can earn and spend coins
- Balances are accurate
- Support tickets minimal
- Issues documented

**Requirements**: H1, H2

---

### Phase 6: Cleanup (Day 13-14)

#### Task 6.1: Deprecate Green Coin Service
**Estimated Time**: 2 hours
**Priority**: Low
**Dependencies**: Task 5.2

**Subtasks:**
- [x] Add deprecation warnings to greenCoin.service.ts
- [x] Update documentation
- [x] Plan removal timeline
- [x] Notify team

**Acceptance Criteria:**
- Service marked as deprecated
- Documentation updated
- Timeline communicated
- No new code uses Green Coin service

**Files to Modify:**
- `src/services/greenCoin.service.ts`

**Requirements**: B7.1, B7.2

---

#### Task 6.2: Update Documentation
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Task 5.2

**Subtasks:**
- [x] Update wiki documentation
- [x] Update API documentation
- [x] Create migration guide for developers
- [x] Update README
- [x] Create user-facing changelog

**Acceptance Criteria:**
- All documentation updated
- No references to Green Coins
- Migration guide complete
- API docs accurate
- User changelog published

**Files to Create/Modify:**
- `wiki/gg-coins.md`
- `docs/API.md`
- `docs/MIGRATION_GUIDE.md`
- `README.md`
- `CHANGELOG.md`

**Requirements**: C6

---

## Summary

**Total Estimated Time**: ~14 days (2 weeks)

**Critical Path**:
1. Database Migration (Tasks 1.1, 1.2)
2. Service Implementation (Tasks 2.1-2.5)
3. UI Updates (Tasks 3.1-3.4)
4. Testing (Tasks 4.1-4.3)
5. Deployment (Tasks 5.1-5.2)

**Success Criteria**:
- ✅ All Green Coin data migrated to GG Coins
- ✅ Single unified service for coin operations
- ✅ UI shows only "GG Coins"
- ✅ All tests passing (>90% coverage)
- ✅ No data loss or corruption
- ✅ Performance within SLA
- ✅ Zero downtime deployment