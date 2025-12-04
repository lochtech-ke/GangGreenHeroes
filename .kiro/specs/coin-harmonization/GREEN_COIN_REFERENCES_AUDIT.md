# Green Coin References Audit

**Date**: November 30, 2025  
**Task**: 3.4 - Update All UI References from Green Coins to GG Coins  
**Status**: Audit Complete

## Summary

This document catalogs all "Green Coin" references found in the codebase that need to be updated to "GG Coins" as part of the coin system harmonization (Migration 032).

## Files Requiring Updates

### 1. Source Code Files (UI/Components)

#### **src/pages/GreenCoinsPage.tsx**
- **Line 6**: Comment "Green Coins Page"
- **Line 7**: Comment "Displays user's Green Coin wallet"
- **Line 10**: Component name `GreenCoinsPage`
- **Line 14**: Page title "Green Coins"
- **Line 16**: Description text "Manage your Green Coins, view transaction history..."
- **Line 21**: Comment "Green Coin Wallet"
- **Line 23**: Component usage `<GreenCoinWallet />`
- **Action**: Rename file to `GGCoinsPage.tsx` and update all text references

#### **src/components/gamification/GreenCoinWallet.tsx**
- **Line 6**: Comment "GreenCoinWallet Component"
- **Line 10**: Comment "The name 'GreenCoinWallet' is kept for backward compatibility"
- **Line 14**: Component name `GreenCoinWallet`
- **Action**: Rename component to `GGCoinWallet` (already exists, deprecate this one)

#### **src/components/gamification/index.ts**
- **Line 3**: Export `GreenCoinWallet` (appears twice)
- **Action**: Remove export of deprecated `GreenCoinWallet`

#### **src/pages/LearningModulePage.tsx**
- **Line 86**: Alert message "earned ${result.greenCoinsAwarded} Green Coins!"
- **Line 216**: Reward display text "Green Coins"
- **Line 284**: Description text "earn your Green Coins"
- **Action**: Update all text to "GG Coins"

#### **src/pages/AmbassadorApplicationPage.tsx**
- **Line 72**: Description text "Earn extra Green Coins for referrals"
- **Action**: Update to "GG Coins"

#### **src/components/profile/AmbassadorApplicationForm.tsx**
- **Line 163**: Eligibility check `hasGreenCoins`
- **Line 167**: Requirement text "Green Coins"
- **Action**: Update text to "GG Coins"

#### **src/components/profile/AmbassadorDashboard.tsx**
- **Line 12**: Interface property `greenCoins`
- **Line 59**: Comment "Would be fetched from green coin service"
- **Action**: Update property name and comment

#### **src/components/gamification/Leaderboard.tsx**
- **Line 55**: Query type 'green_coins'
- **Line 55**: Function call `buildGreenCoinsQuery`
- **Line 64**: Function call `buildGreenCoinsQuery`
- **Line 109**: Function name `buildGreenCoinsQuery`
- **Action**: Rename to 'gg_coins' and `buildGGCoinsQuery`

### 2. Service Layer Files

#### **src/services/greenCoin.service.ts**
- **Entire file**: Deprecated service
- **Action**: Already marked as deprecated, add more prominent warnings

#### **src/services/ambassador.service.ts**
- **Line 30**: Property `minGreenCoins`
- **Line 33**: Property `hasGreenCoins`
- **Line 57**: Property `minGreenCoins: 100`
- **Line 60**: Property `hasGreenCoins: false`
- **Line 67**: Comment "Get user's Green Coins"
- **Line 74**: Variable `greenCoins`
- **Line 94**: Variable `hasGreenCoins`
- **Line 102**: Error message "You need at least ${MIN_GREEN_COINS} Green Coins"
- **Line 119**: Property `minGreenCoins`
- **Line 122**: Property `hasGreenCoins`
- **Action**: Update all references to use GG Coins terminology

#### **src/services/vaas.service.ts**
- **Line 293**: Comment "award Green Coins"
- **Action**: Update comment to "award GG Coins"

#### **src/services/referral.service.ts**
- **Line 9**: Comment "Updated: Now uses GG Coins (decimal-based) instead of Green Coins"
- **Action**: Keep as historical note, no change needed

#### **src/services/onboardingGuide.service.ts**
- **Line 85**: Description text "earn Green Coins"
- **Action**: Update to "earn GG Coins"

#### **src/services/education.service.ts**
- **Line 200**: Comment "Default to base learning_module reward"
- **Line 200**: Property `module.greenCoinReward`
- **Action**: Update property reference

#### **src/services/chatbot/responseGenerator.ts**
- **Line 204**: Action label 'Green Coins'
- **Line 205**: Query 'What are Green Coins?'
- **Action**: Update to 'GG Coins' and 'What are GG Coins?'

### 3. Type Definition Files

#### **src/types/platform.types.ts**
- **Line 25**: Property `greenCoins: number`
- **Line 125**: Property `greenCoinReward: number`
- **Line 175**: Property `greenCoinReward: number`
- **Line 227**: Comment "Green Coins Economy"
- **Line 232**: Interface `GreenCoinWallet`
- **Line 240**: Interface `GreenCoinTransaction`
- **Action**: Rename interfaces and properties to GGCoin equivalents

#### **src/types/index.ts**
- **Line 307**: Export `GreenCoinWallet`
- **Line 308**: Export `GreenCoinTransaction`
- **Action**: Remove exports of deprecated types

### 4. Utility Files

#### **src/utils/serviceErrorHandler.ts**
- **Line 473**: Comment "Green Coin Service Error Helpers"
- **Line 476**: Object `greenCoinErrors`
- **Line 478**: Error message "Insufficient Green Coins"
- **Line 496**: Error message "Green Coin transaction failed"
- **Action**: Rename to `ggCoinErrors` and update messages

#### **src/utils/errorMessages.ts**
- **Line 315**: Comment "Green Coin Errors"
- **Line 317**: Error title "Not Enough Green Coins"
- **Line 318**: Error message "You don't have enough Green Coins"
- **Line 320**: Guidance "Complete missions to earn more Green Coins"
- **Action**: Update all text to "GG Coins"

### 5. Test Files

#### **src/test/factories.ts**
- **Line 153**: Comment "Factory for generating Green Coin Transaction objects"
- **Line 156**: Factory name `greenCoinTransactionFactory`
- **Action**: Rename to `ggCoinTransactionFactory`

#### **src/test/database.config.ts**
- **Line 349**: Comment "Create test green coin transaction"
- **Line 352**: Method name `createTestGreenCoinTransaction`
- **Action**: Rename to `createTestGGCoinTransaction`

### 6. Migration and Documentation Files

**Note**: These files are historical/documentation and should be kept as-is for reference:
- `supabase/migrations/*.sql` - Migration scripts (historical)
- `supabase/migrations/*.md` - Migration documentation (historical)
- `.kiro/specs/coin-harmonization/*.md` - Spec documents (historical)

## Update Priority

### High Priority (User-Facing)
1. ✅ **src/pages/GreenCoinsPage.tsx** - Main page
2. ✅ **src/components/gamification/GreenCoinWallet.tsx** - Wallet component (deprecate)
3. ✅ **src/pages/LearningModulePage.tsx** - Reward messages
4. ✅ **src/pages/AmbassadorApplicationPage.tsx** - Application text
5. ✅ **src/components/profile/AmbassadorApplicationForm.tsx** - Form text
6. ✅ **src/utils/errorMessages.ts** - User-facing errors

### Medium Priority (Internal UI)
7. ✅ **src/components/gamification/Leaderboard.tsx** - Leaderboard queries
8. ✅ **src/components/profile/AmbassadorDashboard.tsx** - Dashboard data
9. ✅ **src/services/chatbot/responseGenerator.ts** - Chatbot responses
10. ✅ **src/services/onboardingGuide.service.ts** - Onboarding text

### Low Priority (Backend/Types)
11. ✅ **src/types/platform.types.ts** - Type definitions
12. ✅ **src/types/index.ts** - Type exports
13. ✅ **src/services/ambassador.service.ts** - Service logic
14. ✅ **src/services/vaas.service.ts** - Service comments
15. ✅ **src/services/education.service.ts** - Service logic
16. ✅ **src/utils/serviceErrorHandler.ts** - Error handlers
17. ✅ **src/test/factories.ts** - Test factories
18. ✅ **src/test/database.config.ts** - Test utilities

## Routing Updates Needed

### App.tsx
- No direct "Green Coins" route found
- GreenCoinsPage is not currently routed in App.tsx
- **Action**: Add route for GG Coins page or verify if page is deprecated

### Navigation
- No navigation config file found with "Green Coins" references
- **Action**: Check navigation components for menu items

## Database Schema

The database migration (032) has already been completed:
- ✅ `green_coin_wallets` → Deprecated
- ✅ `green_coin_transactions` → Deprecated
- ✅ All data migrated to `user_gamification.gg_coins` and `gg_coin_transactions`

## Verification Checklist

After updates, verify:
- [ ] No "Green Coin" text visible in UI
- [ ] All components use "GG Coins" terminology
- [ ] Error messages reference "GG Coins"
- [ ] Type definitions use GGCoin naming
- [ ] Service layer uses ggCoinService
- [ ] Tests use GG Coin factories
- [ ] Navigation labels updated
- [ ] Documentation updated

## Notes

1. **GreenCoinWallet Component**: Already have `GGCoinWallet` component. The old `GreenCoinWallet` should be deprecated and removed.

2. **Service Layer**: `greenCoin.service.ts` is already marked as deprecated. All new code should use `ggCoin.service.ts`.

3. **Type Definitions**: Need to create GGCoin equivalents and deprecate GreenCoin types.

4. **Database**: Migration 032 already completed. No database changes needed.

5. **Historical Files**: Migration scripts and documentation should be kept as-is for historical reference.

## Estimated Effort

- **High Priority Updates**: 2-3 hours
- **Medium Priority Updates**: 1-2 hours  
- **Low Priority Updates**: 1-2 hours
- **Testing & Verification**: 1 hour
- **Total**: 5-8 hours

## Next Steps

1. Update high-priority user-facing files
2. Update medium-priority internal UI files
3. Update low-priority backend/type files
4. Run full test suite
5. Manual UI verification
6. Update documentation
