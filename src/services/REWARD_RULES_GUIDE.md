# GG Coin Reward Rules Configuration

## Overview

The `REWARD_RULES` constant in `ggCoin.service.ts` defines the centralized reward configuration for all action types in the platform. This configuration determines how many GG Coins users earn for different activities.

## Structure

Each reward rule consists of:
- **actionType**: Unique identifier for the action
- **baseReward**: Base amount of GG Coins awarded
- **multipliers**: Optional array of conditions that can increase the reward

## Action Types

### Environmental Actions

#### Tree Planting (`tree_planting`)
- **Base Reward**: 50 GG Coins
- **Multipliers**:
  - `verified_with_photo` (1.2x): When tree planting is verified with a photo
  - `native_species` (1.5x): When planting native species

#### Waste Cleanup (`waste_cleanup`)
- **Base Reward**: 30 GG Coins
- **Multipliers**:
  - `kg_collected` (1.0x per kg): Scales linearly with weight collected

### Educational Actions

#### Learning Module (`learning_module`)
- **Base Reward**: 20 GG Coins
- **Multipliers**:
  - `quiz_perfect_score` (1.5x): When achieving 100% on quiz
  - `advanced_difficulty` (2.0x): For advanced-level modules

### Community Actions

#### Mission Completion (`mission_completion`)
- **Base Reward**: 100 GG Coins
- **Multipliers**:
  - `team_participation` (1.3x): When completing as part of a team
  - `early_completion` (1.2x): When completing before deadline

#### Community Post (`community_post`)
- **Base Reward**: 5 GG Coins
- **Multipliers**:
  - `with_media` (1.5x): When post includes images/videos
  - `high_engagement` (2.0x): When post receives significant engagement

### Engagement Actions

#### Petition Signature (`petition_signature`)
- **Base Reward**: 10 GG Coins
- **No multipliers**

#### Referral (`referral`)
- **Base Reward**: 50 GG Coins
- **Multipliers**:
  - `referred_user_active` (2.0x): When referred user becomes active

#### Daily Login (`daily_login`)
- **Base Reward**: 5 GG Coins
- **Multipliers**:
  - `streak_7_days` (1.5x): For 7-day login streak
  - `streak_30_days` (2.0x): For 30-day login streak

## Usage Examples

### Basic Reward Calculation
```typescript
import { ggCoinService } from './ggCoin.service';

// Calculate base reward for tree planting
const reward = ggCoinService.calculateReward('tree_planting');
// Returns: 50
```

### With Impact Multiplier
```typescript
// Calculate reward for planting 10 trees
const reward = ggCoinService.calculateReward('tree_planting', 10);
// Returns: 500 (50 * 10)
```

### With Custom Multipliers
```typescript
// Calculate reward with verification and native species bonus
const reward = ggCoinService.calculateReward(
  'tree_planting',
  1,
  [
    { condition: 'verified_with_photo', factor: 1.2 },
    { condition: 'native_species', factor: 1.5 }
  ]
);
// Returns: 90 (50 * 1.2 * 1.5)
```

### Award Coins to User
```typescript
// Award coins for verified tree planting
const transaction = await ggCoinService.awardCoins(
  userId,
  'tree_planting',
  1,
  [
    { condition: 'verified_with_photo', factor: 1.2 },
    { condition: 'native_species', factor: 1.5 }
  ]
);
```

## Adding New Action Types

To add a new action type:

1. Add the new rule to `REWARD_RULES` in `ggCoin.service.ts`:
```typescript
export const REWARD_RULES: Record<string, RewardRule> = {
  // ... existing rules
  new_action: {
    actionType: 'new_action',
    baseReward: 25,
    multipliers: [
      { condition: 'bonus_condition', factor: 1.5 },
    ],
  },
};
```

2. Update the integration points in relevant services to award coins for the new action.

3. Add tests for the new action type in `ggCoin.service.test.ts`.

## Modifying Existing Rules

To modify reward amounts or multipliers:

1. Update the values in `REWARD_RULES`
2. Run tests to ensure calculations are correct
3. Document the change in the changelog
4. Consider the impact on existing users and economy balance

## Best Practices

- **Balance**: Ensure rewards are balanced across different action types
- **Consistency**: Use consistent multiplier factors across similar conditions
- **Documentation**: Document any changes to reward rules
- **Testing**: Always test reward calculations after modifications
- **Economy**: Consider the overall platform economy when adjusting rewards

## Related Files

- `src/services/ggCoin.service.ts` - Main service implementation
- `src/services/ggCoin.service.test.ts` - Unit tests
- `.kiro/specs/coin-harmonization/design.md` - Design specification
- `.kiro/specs/coin-harmonization/requirements.md` - Requirements document
