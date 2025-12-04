# Coin System Harmonization - Requirements

## Overview

The platform currently has two separate coin systems:
1. **GG Coins** - Decimal-based (DECIMAL 10,3) stored in `user_gamification.gg_coins` table
2. **Green Coins** - Integer-based stored in `green_coin_wallets` table

This creates confusion, duplicate functionality, and inconsistent user experience. We need to harmonize these systems into a single, unified coin economy.

## Problem Statement

### Current State Issues

**A1. Duplicate Systems**
- Two separate wallet tables (`user_gamification` and `green_coin_wallets`)
- Two separate transaction tables (`gg_coin_transactions` and `green_coin_transactions`)
- Inconsistent reward rules across systems
- Confusion about which coin to use for what purpose

**A2. Data Type Inconsistency**
- GG Coins: DECIMAL(10,3) - supports fractional amounts (e.g., 10.500)
- Green Coins: INTEGER - whole numbers only (e.g., 50)
- Different precision levels create conversion challenges

**A3. Service Layer Duplication**
- `greenCoin.service.ts` - manages Green Coins
- No equivalent service for GG Coins (uses database functions directly)
- Duplicate logic for transactions, rewards, and balance management

**A4. User Experience Confusion**
- Users see references to both "GG Coins" and "Green Coins"
- Unclear which coin is earned from which action
- Two separate balance displays needed

## Requirements

### B1. Unified Coin System

**B1.1** The platform SHALL use a single coin currency called "GG Coins"
- Rationale: GG Coins is the established brand name in documentation and wiki

**B1.2** GG Coins SHALL support decimal precision to 3 places (DECIMAL 10,3)
- Rationale: Allows for micro-rewards and flexible pricing (e.g., 0.001 GG Coins)

**B1.3** The system SHALL maintain backward compatibility with existing GG Coin balances
- Rationale: Preserve user balances and transaction history

### B2. Database Schema Consolidation

**B2.1** The system SHALL use `user_gamification.gg_coins` as the single source of truth for balances
- Rationale: Already supports decimal precision and has existing infrastructure

**B2.2** The system SHALL use `gg_coin_transactions` as the single transaction log
- Rationale: Already supports decimal amounts and has proper constraints

**B2.3** The system SHALL migrate existing Green Coin data to GG Coins
- Convert Green Coin balances to GG Coins (1 Green Coin = 1.000 GG Coins)
- Preserve transaction history with proper type mapping
- Mark old tables as deprecated

**B2.4** The system SHALL maintain referential integrity
- All transactions must reference valid users
- Balance updates must be atomic with transaction logging

### B3. Service Layer Unification

**B3.1** The system SHALL provide a single `ggCoin.service.ts` service
- Consolidate functionality from `greenCoin.service.ts`
- Use database functions (`credit_gg_coins`, `debit_gg_coins`) for transactions
- Provide high-level methods for common operations

**B3.2** The service SHALL support all transaction types
- `earn` - Rewards for actions
- `spend` - Purchases and redemptions
- `bonus` - Special rewards and promotions
- `referral` - Referral bonuses
- `transfer` - User-to-user transfers (future)

**B3.3** The service SHALL implement caching for balance queries
- Cache TTL: 30 seconds
- Invalidate on transaction
- Support real-time subscriptions

**B3.4** The service SHALL provide transaction history with pagination
- Default limit: 50 transactions
- Support filtering by type, date range, source
- Include total count and hasMore flag

### B4. Reward Rules Consolidation

**B4.1** The system SHALL use a unified reward rule system
- Single source of truth for action rewards
- Support base rewards and multipliers
- Allow dynamic reward calculation

**B4.2** The system SHALL support these reward categories:
- **Tree Planting**: 50 GG Coins base
- **Waste Cleanup**: 30 GG Coins base
- **Learning Module**: 20 GG Coins base
- **Mission Completion**: 100 GG Coins base
- **Community Post**: 5 GG Coins base
- **Petition Signature**: 10 GG Coins base
- **Referral**: 50 GG Coins base
- **Daily Login**: 5 GG Coins base

**B4.3** The system SHALL support reward multipliers
- Streak multipliers (e.g., 7-day streak = 1.5x)
- Event multipliers (e.g., Earth Day = 2x)
- Badge tier multipliers (e.g., Gold badge = 1.2x)
- Impact-based scaling (e.g., plant 10 trees = 10x base reward)

### B5. User Interface Consistency

**B5.1** The system SHALL display only "GG Coins" in all UI components
- Remove all references to "Green Coins"
- Update wallet components to show GG Coins
- Update transaction history to show GG Coins

**B5.2** The system SHALL display decimal amounts appropriately
- Show up to 3 decimal places when non-zero (e.g., 10.500)
- Hide decimals for whole numbers (e.g., 50 instead of 50.000)
- Use thousand separators for large amounts (e.g., 1,234.567)

**B5.3** The system SHALL provide clear earning and spending feedback
- Toast notifications for earned coins
- Confirmation dialogs for spending
- Transaction receipts with before/after balances

### B6. Migration Strategy

**B6.1** The system SHALL migrate data without downtime
- Use database transactions for atomicity
- Migrate in batches to avoid locks
- Provide rollback capability

**B6.2** The system SHALL preserve all historical data
- Keep Green Coin tables for reference (read-only)
- Add migration metadata to transactions
- Document conversion rates and timestamps

**B6.3** The system SHALL validate migration success
- Compare total balances before/after
- Verify transaction count matches
- Check for orphaned records

### B7. API Compatibility

**B7.1** The system SHALL maintain API backward compatibility
- Deprecate Green Coin endpoints (return 410 Gone)
- Redirect to GG Coin endpoints where possible
- Provide migration guide for API consumers

**B7.2** The system SHALL version the API appropriately
- Mark Green Coin methods as deprecated
- Add deprecation warnings to responses
- Set sunset date for old endpoints

## Acceptance Criteria

### C1. Database Migration
- [ ] All Green Coin balances migrated to GG Coins
- [ ] All Green Coin transactions migrated to GG Coin transactions
- [ ] Old tables marked as deprecated with comments
- [ ] No data loss during migration
- [ ] Migration completes in < 5 minutes for 10,000 users

### C2. Service Layer
- [ ] Single `ggCoin.service.ts` service implemented
- [ ] All transaction types supported
- [ ] Balance caching working correctly
- [ ] Real-time subscriptions functional
- [ ] Transaction history pagination working

### C3. Reward System
- [ ] Unified reward rules implemented
- [ ] All action types have defined rewards
- [ ] Multipliers apply correctly
- [ ] Rewards are atomic with balance updates

### C4. User Interface
- [ ] All "Green Coins" references removed
- [ ] GG Coins displayed consistently
- [ ] Decimal formatting correct
- [ ] Wallet component shows GG Coins
- [ ] Transaction history shows GG Coins

### C5. Testing
- [ ] Unit tests for service methods (>90% coverage)
- [ ] Integration tests for transactions
- [ ] Migration tests with sample data
- [ ] Performance tests for high-volume scenarios
- [ ] Rollback tests successful

### C6. Documentation
- [ ] Migration guide for developers
- [ ] API deprecation notices
- [ ] User-facing changelog
- [ ] Updated wiki documentation
- [ ] Code comments for complex logic

## Non-Functional Requirements

### D1. Performance
- Balance queries: < 50ms (cached)
- Transaction recording: < 200ms
- Migration: < 5 minutes for 10,000 users
- Real-time updates: < 2 seconds latency

### D2. Reliability
- Transaction atomicity: 100%
- No balance drift or inconsistencies
- Automatic retry for transient failures
- Circuit breaker for external dependencies

### D3. Security
- Row-level security on all tables
- Audit trail for all transactions
- Prevent negative balances
- Prevent race conditions with locking

### D4. Scalability
- Support 100,000+ users
- Handle 1,000+ transactions/minute
- Efficient indexing for queries
- Partition transaction table by date (future)

## Out of Scope

### E1. Not Included in This Spec
- User-to-user coin transfers
- Coin marketplace or exchange
- External coin purchases with fiat
- Coin expiration or decay
- Multi-currency support

### E2. Future Enhancements
- Coin staking for rewards
- Coin-based governance voting
- Coin gifting between users
- Coin leaderboards and competitions
- Integration with external reward systems

## Dependencies

### F1. Database
- PostgreSQL 14+ with DECIMAL support
- Existing `user_gamification` table
- Existing `gg_coin_transactions` table
- Database functions: `credit_gg_coins`, `debit_gg_coins`

### F2. Services
- Supabase client configured
- Authentication system functional
- User profile system operational

### F3. UI Components
- Wallet component exists
- Transaction history component exists
- Toast notification system available

## Risks and Mitigations

### G1. Data Migration Risk
**Risk**: Data loss or corruption during migration
**Mitigation**: 
- Test migration on staging environment
- Create full database backup before migration
- Use transactions for atomicity
- Implement rollback procedure

### G2. User Confusion Risk
**Risk**: Users confused by coin system change
**Mitigation**:
- Clear communication about consolidation
- Show migration notice in UI
- Provide FAQ about changes
- Support team trained on new system

### G3. Performance Risk
**Risk**: Migration causes downtime or slowness
**Mitigation**:
- Batch processing for large datasets
- Run during low-traffic period
- Monitor database performance
- Have rollback plan ready

### G4. Integration Risk
**Risk**: Breaking changes affect existing features
**Mitigation**:
- Comprehensive integration testing
- Gradual rollout with feature flags
- Monitor error rates post-deployment
- Quick rollback capability

## Success Metrics

### H1. Technical Metrics
- Zero data loss during migration
- < 0.1% transaction failure rate
- < 100ms average balance query time
- 100% test coverage for critical paths

### H2. User Metrics
- < 5% increase in support tickets
- > 95% user satisfaction with new system
- No increase in transaction errors
- Faster wallet load times

### H3. Business Metrics
- Simplified codebase (remove duplicate code)
- Reduced maintenance overhead
- Improved developer velocity
- Better user engagement with unified system

## Timeline Estimate

- **Requirements & Design**: 2 days
- **Database Migration Script**: 2 days
- **Service Layer Implementation**: 3 days
- **UI Updates**: 2 days
- **Testing**: 3 days
- **Documentation**: 1 day
- **Deployment & Monitoring**: 1 day

**Total**: ~14 days (2 weeks)

## References

- [Green Coin Service Implementation](../../../src/services/greenCoin.service.ts)
- [GG Coins Decimal Migration](../../../supabase/migrations/018_update_gg_coins_to_decimal_fixed.sql)
- [User Gamification Schema](../../../supabase/migrations/008_create_gamification.sql)
- [V1 Major Release Schema](../../../supabase/migrations/030_v1_major_release_schema.sql)
- [Wiki: GG Coin System](../../../wiki/02-quick-start-guide.md)
