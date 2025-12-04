import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ggCoinService } from './ggCoin.service';
import { supabase } from './supabase';

/**
 * GG Coin Service Integration Tests
 * Tests real-time subscription functionality with actual database
 * 
 * Note: These tests require a working Supabase connection
 * and may be skipped in CI environments without database access
 */

describe('GGCoinService Integration - Real-time Subscriptions', () => {
  const testUserId = 'test-subscription-user-' + Date.now();
  let cleanupFunctions: (() => void)[] = [];

  beforeAll(async () => {
    // Create a test user in user_gamification table
    const { error } = await supabase
      .from('user_gamification')
      .insert({
        id: testUserId,
        gg_coins: 100.000,
        total_points: 0,
        level: 1,
      });

    if (error) {
      console.warn('Could not create test user for integration tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up all subscriptions
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];

    // Delete test user
    await supabase
      .from('user_gamification')
      .delete()
      .eq('id', testUserId);
  });

  it('should receive balance updates in real-time', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timed out waiting for balance update'));
      }, 10000); // 10 second timeout

      let updateReceived = false;

      // Subscribe to balance updates
      const unsubscribe = ggCoinService.subscribeToBalance(testUserId, (newBalance) => {
        if (!updateReceived) {
          updateReceived = true;
          
          try {
            // Verify the new balance
            expect(newBalance).toBeGreaterThan(100);
            expect(newBalance).toBeLessThanOrEqual(200);
            
            clearTimeout(timeout);
            unsubscribe();
            resolve();
          } catch (error) {
            clearTimeout(timeout);
            unsubscribe();
            reject(error);
          }
        }
      });

      cleanupFunctions.push(unsubscribe);

      // Wait a bit for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger a balance update
      await ggCoinService.creditCoins(
        testUserId,
        50,
        'earn',
        'Integration test credit'
      );
    });
  }, 15000); // 15 second test timeout

  it('should update cache when receiving real-time updates', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timed out'));
      }, 10000);

      // Subscribe to balance updates
      const unsubscribe = ggCoinService.subscribeToBalance(testUserId, async (newBalance) => {
        try {
          // Wait a bit for cache to be updated
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify cache was updated by checking getBalance
          const cachedBalance = await ggCoinService.getBalance(testUserId);
          expect(cachedBalance).toBe(newBalance);

          clearTimeout(timeout);
          unsubscribe();
          resolve();
        } catch (error) {
          clearTimeout(timeout);
          unsubscribe();
          reject(error);
        }
      });

      cleanupFunctions.push(unsubscribe);

      // Wait for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger a balance update
      await ggCoinService.creditCoins(
        testUserId,
        25,
        'earn',
        'Cache update test'
      );
    });
  }, 15000);

  it('should handle multiple subscribers for the same user', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timed out'));
      }, 10000);

      let callback1Called = false;
      let callback2Called = false;

      const checkCompletion = () => {
        if (callback1Called && callback2Called) {
          clearTimeout(timeout);
          unsubscribe1();
          unsubscribe2();
          resolve();
        }
      };

      // Create two subscriptions
      const unsubscribe1 = ggCoinService.subscribeToBalance(testUserId, (balance) => {
        if (!callback1Called) {
          callback1Called = true;
          expect(balance).toBeGreaterThan(0);
          checkCompletion();
        }
      });

      const unsubscribe2 = ggCoinService.subscribeToBalance(testUserId, (balance) => {
        if (!callback2Called) {
          callback2Called = true;
          expect(balance).toBeGreaterThan(0);
          checkCompletion();
        }
      });

      cleanupFunctions.push(unsubscribe1, unsubscribe2);

      // Wait for subscriptions to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger a balance update
      await ggCoinService.creditCoins(
        testUserId,
        10,
        'earn',
        'Multiple subscribers test'
      );
    });
  }, 15000);

  it('should handle subscription cleanup properly', async () => {
    let callbackCalled = false;

    // Create subscription
    const unsubscribe = ggCoinService.subscribeToBalance(testUserId, (balance) => {
      callbackCalled = true;
    });

    // Wait for subscription to be established
    await new Promise(resolve => setTimeout(resolve, 500));

    // Unsubscribe immediately
    unsubscribe();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    // Trigger a balance update
    await ggCoinService.creditCoins(
      testUserId,
      5,
      'earn',
      'Cleanup test'
    );

    // Wait to see if callback is called (it shouldn't be)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Callback should not have been called after unsubscribe
    expect(callbackCalled).toBe(false);
  }, 10000);

  it('should handle errors in callback gracefully', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timed out'));
      }, 10000);

      let errorThrown = false;

      // Subscribe with a callback that throws an error
      const unsubscribe = ggCoinService.subscribeToBalance(testUserId, (balance) => {
        if (!errorThrown) {
          errorThrown = true;
          
          // This error should be caught and logged, not crash the app
          throw new Error('Test error in callback');
        }
      });

      cleanupFunctions.push(unsubscribe);

      // Wait for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger a balance update
      await ggCoinService.creditCoins(
        testUserId,
        3,
        'earn',
        'Error handling test'
      );

      // Wait a bit to ensure error was handled
      await new Promise(resolve => setTimeout(resolve, 2000));

      // If we get here, the error was handled gracefully
      clearTimeout(timeout);
      unsubscribe();
      resolve();
    });
  }, 15000);
});

/**
 * GG Coin Service Integration Tests - End-to-End Coin Earning Flow
 * Tests the complete flow of earning coins from action to balance update
 * 
 * This test validates:
 * - Initial balance retrieval
 * - Reward calculation with multipliers
 * - Coin crediting via awardCoins
 * - Balance update and cache invalidation
 * - Transaction history recording
 */
describe('GGCoinService Integration - End-to-End Coin Earning Flow', () => {
  const testUserId = 'test-e2e-earning-user-' + Date.now();

  beforeAll(async () => {
    // Create a test user in user_gamification table with initial balance
    const { error } = await supabase
      .from('user_gamification')
      .insert({
        id: testUserId,
        gg_coins: 0.000, // Start with zero balance
        total_points: 0,
        level: 1,
      });

    if (error) {
      console.warn('Could not create test user for e2e tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user and transactions
    await supabase
      .from('gg_coin_transactions')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_gamification')
      .delete()
      .eq('id', testUserId);
  });

  it('should complete full coin earning flow: check balance -> award coins -> verify balance -> check history', async () => {
    // Step 1: Get initial balance (should be 0)
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBe(0);

    // Step 2: Award coins for tree planting action
    // Base reward: 50 GG Coins
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      1, // Plant 1 tree
      [] // No additional multipliers
    );

    // Verify transaction was created
    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(50);
    expect(transaction?.type).toBe('earn');
    expect(transaction?.userId).toBe(testUserId);
    expect(transaction?.description).toContain('50.000');
    expect(transaction?.description).toContain('tree_planting');

    // Step 3: Verify balance was updated
    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(50);

    // Step 4: Verify transaction appears in history
    const history = await ggCoinService.getTransactionHistory(testUserId, 10, 0);
    expect(history.transactions.length).toBeGreaterThan(0);
    
    const latestTransaction = history.transactions[0];
    expect(latestTransaction.amount).toBe(50);
    expect(latestTransaction.type).toBe('earn');
    expect(latestTransaction.userId).toBe(testUserId);
    expect(latestTransaction.balanceAfter).toBe(50);
  });

  it('should handle multiple sequential earning actions correctly', async () => {
    // Clear any existing balance
    const currentBalance = await ggCoinService.getBalance(testUserId);
    
    // Award coins for different actions
    const tx1 = await ggCoinService.awardCoins(testUserId, 'community_post'); // 5 coins
    expect(tx1).not.toBeNull();
    expect(tx1?.amount).toBe(5);

    const balance1 = await ggCoinService.getBalance(testUserId);
    expect(balance1).toBe(currentBalance + 5);

    const tx2 = await ggCoinService.awardCoins(testUserId, 'daily_login'); // 5 coins
    expect(tx2).not.toBeNull();
    expect(tx2?.amount).toBe(5);

    const balance2 = await ggCoinService.getBalance(testUserId);
    expect(balance2).toBe(currentBalance + 10);

    const tx3 = await ggCoinService.awardCoins(testUserId, 'petition_signature'); // 10 coins
    expect(tx3).not.toBeNull();
    expect(tx3?.amount).toBe(10);

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance + 20);

    // Verify all transactions are in history
    const history = await ggCoinService.getTransactionHistory(testUserId, 50, 0);
    expect(history.transactions.length).toBeGreaterThanOrEqual(3);
  });

  it('should apply impact multipliers correctly in earning flow', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins for planting 3 trees
    // Base reward: 50, Impact: 3, Total: 150
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      3 // Plant 3 trees
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(150); // 50 * 3

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(initialBalance + 150);

    // Verify transaction metadata includes impact
    expect(transaction?.metadata).toBeDefined();
    expect(transaction?.metadata?.actionType).toBe('tree_planting');
    expect(transaction?.metadata?.impact).toBe(3);
  });

  it('should apply custom multipliers correctly in earning flow', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins with multipliers
    // Base reward: 50, Multipliers: 1.2 * 1.5 = 1.8, Total: 90
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      1,
      [
        { condition: 'verified_with_photo', factor: 1.2 },
        { condition: 'native_species', factor: 1.5 },
      ]
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(90); // 50 * 1.2 * 1.5

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(initialBalance + 90);

    // Verify transaction metadata includes multipliers
    expect(transaction?.metadata).toBeDefined();
    expect(transaction?.metadata?.multipliers).toBeDefined();
    expect(transaction?.metadata?.multipliers.length).toBe(2);
  });

  it('should apply both impact and custom multipliers in earning flow', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins with both impact and multipliers
    // Base: 50, Impact: 2, Multiplier: 2.0, Total: 200
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      2, // Plant 2 trees
      [{ condition: 'special_event', factor: 2.0 }]
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(200); // 50 * 2 * 2.0

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(initialBalance + 200);
  });

  it('should handle decimal rewards correctly in earning flow', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins with fractional impact
    // Base: 20, Impact: 1.5, Total: 30
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'learning_module',
      1.5
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(30); // 20 * 1.5

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(initialBalance + 30);

    // Verify decimal precision is maintained
    expect(transaction?.amount ? transaction.amount % 1 : 0).toBe(0); // This one is a whole number
  });

  it('should handle very small decimal rewards in earning flow', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins with very small impact
    // Base: 50, Impact: 0.001, Total: 0.05
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      0.001
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(0.05); // 50 * 0.001

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBeCloseTo(initialBalance + 0.05, 3);
  });

  it('should invalidate cache after earning coins', async () => {
    // Get balance to populate cache
    const balance1 = await ggCoinService.getBalance(testUserId);

    // Award coins (should invalidate cache)
    await ggCoinService.awardCoins(testUserId, 'community_post');

    // Get balance again - should fetch fresh from database
    const balance2 = await ggCoinService.getBalance(testUserId);

    // Balance should have increased
    expect(balance2).toBeGreaterThan(balance1);
    expect(balance2).toBe(balance1 + 5); // community_post base reward
  });

  it('should record transaction with correct before/after balances', async () => {
    const balanceBefore = await ggCoinService.getBalance(testUserId);

    // Award coins
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'petition_signature' // 10 coins
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.balanceBefore).toBe(balanceBefore);
    expect(transaction?.balanceAfter).toBe(balanceBefore + 10);
    expect(transaction?.amount).toBe(10);

    // Verify final balance matches transaction's balanceAfter
    const balanceAfter = await ggCoinService.getBalance(testUserId);
    expect(balanceAfter).toBe(transaction?.balanceAfter);
  });

  it('should handle earning breakdown correctly', async () => {
    // Award coins for different action types
    await ggCoinService.awardCoins(testUserId, 'tree_planting'); // 50
    await ggCoinService.awardCoins(testUserId, 'learning_module'); // 20
    await ggCoinService.awardCoins(testUserId, 'mission_completion'); // 100

    // Get earning breakdown
    const breakdown = await ggCoinService.getEarningBreakdown(testUserId);

    // Verify breakdown includes all action types
    expect(breakdown).toBeDefined();
    expect(typeof breakdown).toBe('object');
    
    // Should have entries for the actions we performed
    expect(breakdown['tree_planting']).toBeGreaterThan(0);
    expect(breakdown['learning_module']).toBeGreaterThan(0);
    expect(breakdown['mission_completion']).toBeGreaterThan(0);
  });

  it('should handle transaction history pagination correctly', async () => {
    // Award multiple coins to create history
    for (let i = 0; i < 5; i++) {
      await ggCoinService.awardCoins(testUserId, 'daily_login');
    }

    // Get first page
    const page1 = await ggCoinService.getTransactionHistory(testUserId, 3, 0);
    expect(page1.transactions.length).toBeLessThanOrEqual(3);
    expect(page1.total).toBeGreaterThanOrEqual(5);

    // Get second page
    const page2 = await ggCoinService.getTransactionHistory(testUserId, 3, 3);
    expect(page2.transactions.length).toBeGreaterThan(0);

    // Verify transactions are different
    if (page1.transactions.length > 0 && page2.transactions.length > 0) {
      expect(page1.transactions[0].id).not.toBe(page2.transactions[0].id);
    }
  });

  it('should filter transaction history by type correctly', async () => {
    // Award some coins (earn type)
    await ggCoinService.awardCoins(testUserId, 'tree_planting');

    // Get only earn transactions
    const earnHistory = await ggCoinService.getTransactionHistory(
      testUserId,
      50,
      0,
      { type: 'earn' }
    );

    // All transactions should be earn type
    earnHistory.transactions.forEach(tx => {
      expect(tx.type).toBe('earn');
    });
  });

  it('should handle concurrent earning operations correctly', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award coins concurrently
    const promises = [
      ggCoinService.awardCoins(testUserId, 'community_post'), // 5
      ggCoinService.awardCoins(testUserId, 'daily_login'), // 5
      ggCoinService.awardCoins(testUserId, 'petition_signature'), // 10
    ];

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach(result => {
      expect(result).not.toBeNull();
    });

    // Final balance should reflect all awards
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance + 20); // 5 + 5 + 10
  });

  it('should maintain balance consistency across multiple operations', async () => {
    // Get initial balance
    const startBalance = await ggCoinService.getBalance(testUserId);

    // Perform multiple operations
    const operations = [
      { action: 'tree_planting', impact: 1, expected: 50 },
      { action: 'learning_module', impact: 2, expected: 40 },
      { action: 'community_post', impact: 1, expected: 5 },
      { action: 'mission_completion', impact: 1, expected: 100 },
    ];

    let expectedTotal = startBalance;

    for (const op of operations) {
      const tx = await ggCoinService.awardCoins(
        testUserId,
        op.action as any,
        op.impact
      );

      expect(tx).not.toBeNull();
      expect(tx?.amount).toBe(op.expected);

      expectedTotal += op.expected;

      // Verify balance after each operation
      const currentBalance = await ggCoinService.getBalance(testUserId);
      expect(currentBalance).toBe(expectedTotal);
    }

    // Final verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(expectedTotal);
  });

  it('should handle zero reward actions gracefully', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Try to award coins with zero impact
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      0
    );

    // Should return null for zero reward
    expect(transaction).toBeNull();

    // Balance should not change
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance);
  });

  it('should handle invalid action types gracefully', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Try to award coins for unknown action
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'unknown_action_type' as any
    );

    // Should return null for unknown action
    expect(transaction).toBeNull();

    // Balance should not change
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance);
  });

  it('should round complex reward calculations to 3 decimal places', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Award with complex calculation that needs rounding
    // Base: 50, Impact: 1.333, Multiplier: 1.111
    // Result: 50 * 1.333 * 1.111 = 74.04815 -> 74.048
    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      1.333,
      [{ condition: 'test', factor: 1.111 }]
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBeCloseTo(74.048, 3);

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBeCloseTo(initialBalance + 74.048, 3);
  });

  it('should create transaction with proper metadata', async () => {
    const multipliers = [
      { condition: 'verified_with_photo', factor: 1.2 },
      { condition: 'native_species', factor: 1.5 },
    ];

    const transaction = await ggCoinService.awardCoins(
      testUserId,
      'tree_planting',
      2,
      multipliers
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.metadata).toBeDefined();
    expect(transaction?.metadata?.actionType).toBe('tree_planting');
    expect(transaction?.metadata?.impact).toBe(2);
    expect(transaction?.metadata?.multipliers).toEqual(multipliers);

    // Verify metadata is persisted in database
    const history = await ggCoinService.getTransactionHistory(testUserId, 1, 0);
    const latestTx = history.transactions[0];
    expect(latestTx.metadata?.actionType).toBe('tree_planting');
    expect(latestTx.metadata?.impact).toBe(2);
  });

  it('should handle all defined action types in earning flow', async () => {
    const actionTypes = [
      { type: 'tree_planting', reward: 50 },
      { type: 'waste_cleanup', reward: 30 },
      { type: 'learning_module', reward: 20 },
      { type: 'mission_completion', reward: 100 },
      { type: 'community_post', reward: 5 },
      { type: 'petition_signature', reward: 10 },
      { type: 'referral', reward: 50 },
      { type: 'daily_login', reward: 5 },
    ];

    for (const action of actionTypes) {
      const initialBalance = await ggCoinService.getBalance(testUserId);

      const transaction = await ggCoinService.awardCoins(
        testUserId,
        action.type as any
      );

      expect(transaction).not.toBeNull();
      expect(transaction?.amount).toBe(action.reward);
      expect(transaction?.type).toBe('earn');

      const newBalance = await ggCoinService.getBalance(testUserId);
      expect(newBalance).toBe(initialBalance + action.reward);
    }
  });
});

/**
 * GG Coin Service Integration Tests - End-to-End Coin Spending Flow
 * Tests the complete flow of spending coins from balance check to deduction
 * 
 * This test validates:
 * - Initial balance retrieval
 * - Coin spending via debitCoins
 * - Balance update and cache invalidation
 * - Transaction history recording
 * - Negative balance prevention
 * - Insufficient balance handling
 */
describe('GGCoinService Integration - End-to-End Coin Spending Flow', () => {
  const testUserId = 'test-e2e-spending-user-' + Date.now();

  beforeAll(async () => {
    // Create a test user with initial balance for spending
    const { error } = await supabase
      .from('user_gamification')
      .insert({
        id: testUserId,
        gg_coins: 500.000, // Start with 500 coins
        total_points: 0,
        level: 1,
      });

    if (error) {
      console.warn('Could not create test user for spending tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user and transactions
    await supabase
      .from('gg_coin_transactions')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_gamification')
      .delete()
      .eq('id', testUserId);
  });

  it('should complete full coin spending flow: check balance -> spend coins -> verify balance -> check history', async () => {
    // Step 1: Get initial balance (should be 500)
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBe(500);

    // Step 2: Spend coins for a purchase
    const spendAmount = 100;
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      spendAmount,
      'spend',
      'Purchased badge for 100 GG Coins',
      { itemType: 'badge', itemId: 'test-badge-1' }
    );

    // Verify transaction was created
    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(-100); // Negative for debit
    expect(transaction?.type).toBe('spend');
    expect(transaction?.userId).toBe(testUserId);
    expect(transaction?.description).toContain('100');
    expect(transaction?.balanceBefore).toBe(500);
    expect(transaction?.balanceAfter).toBe(400);

    // Step 3: Verify balance was updated
    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBe(400);

    // Step 4: Verify transaction appears in history
    const history = await ggCoinService.getTransactionHistory(testUserId, 10, 0);
    expect(history.transactions.length).toBeGreaterThan(0);
    
    const latestTransaction = history.transactions[0];
    expect(latestTransaction.amount).toBe(-100);
    expect(latestTransaction.type).toBe('spend');
    expect(latestTransaction.userId).toBe(testUserId);
    expect(latestTransaction.balanceBefore).toBe(500);
    expect(latestTransaction.balanceAfter).toBe(400);
  });

  it('should handle multiple sequential spending actions correctly', async () => {
    const currentBalance = await ggCoinService.getBalance(testUserId);
    
    // Spend coins for different items
    const tx1 = await ggCoinService.debitCoins(
      testUserId,
      50,
      'spend',
      'Purchase item 1'
    );
    expect(tx1).not.toBeNull();
    expect(tx1?.amount).toBe(-50);

    const balance1 = await ggCoinService.getBalance(testUserId);
    expect(balance1).toBe(currentBalance - 50);

    const tx2 = await ggCoinService.debitCoins(
      testUserId,
      30,
      'spend',
      'Purchase item 2'
    );
    expect(tx2).not.toBeNull();
    expect(tx2?.amount).toBe(-30);

    const balance2 = await ggCoinService.getBalance(testUserId);
    expect(balance2).toBe(currentBalance - 80);

    const tx3 = await ggCoinService.debitCoins(
      testUserId,
      20,
      'spend',
      'Purchase item 3'
    );
    expect(tx3).not.toBeNull();
    expect(tx3?.amount).toBe(-20);

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance - 100);

    // Verify all transactions are in history
    const history = await ggCoinService.getTransactionHistory(testUserId, 50, 0);
    const spendTransactions = history.transactions.filter(tx => tx.type === 'spend');
    expect(spendTransactions.length).toBeGreaterThanOrEqual(3);
  });

  it('should prevent spending more than available balance', async () => {
    const currentBalance = await ggCoinService.getBalance(testUserId);

    // Try to spend more than balance
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      currentBalance + 1000,
      'spend',
      'Attempt to overspend'
    );

    // Should return null for insufficient balance
    expect(transaction).toBeNull();

    // Balance should not change
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance);
  });

  it('should handle decimal spending amounts correctly', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Spend fractional amount
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      25.750,
      'spend',
      'Purchase with decimal amount'
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(-25.750);

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBeCloseTo(initialBalance - 25.750, 3);
  });

  it('should handle very small decimal spending amounts', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Spend very small amount
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      0.001,
      'spend',
      'Micro-transaction'
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBe(-0.001);

    const newBalance = await ggCoinService.getBalance(testUserId);
    expect(newBalance).toBeCloseTo(initialBalance - 0.001, 3);
  });

  it('should invalidate cache after spending coins', async () => {
    // Get balance to populate cache
    const balance1 = await ggCoinService.getBalance(testUserId);

    // Spend coins (should invalidate cache)
    await ggCoinService.debitCoins(testUserId, 10, 'spend', 'Cache test');

    // Get balance again - should fetch fresh from database
    const balance2 = await ggCoinService.getBalance(testUserId);

    // Balance should have decreased
    expect(balance2).toBeLessThan(balance1);
    expect(balance2).toBe(balance1 - 10);
  });

  it('should record spending transaction with correct before/after balances', async () => {
    const balanceBefore = await ggCoinService.getBalance(testUserId);

    // Spend coins
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      15,
      'spend',
      'Balance tracking test'
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.balanceBefore).toBe(balanceBefore);
    expect(transaction?.balanceAfter).toBe(balanceBefore - 15);
    expect(transaction?.amount).toBe(-15);

    // Verify final balance matches transaction's balanceAfter
    const balanceAfter = await ggCoinService.getBalance(testUserId);
    expect(balanceAfter).toBe(transaction?.balanceAfter);
  });

  it('should filter spending transactions in history', async () => {
    // Spend some coins
    await ggCoinService.debitCoins(testUserId, 5, 'spend', 'Filter test 1');
    await ggCoinService.debitCoins(testUserId, 10, 'spend', 'Filter test 2');

    // Get only spend transactions
    const spendHistory = await ggCoinService.getTransactionHistory(
      testUserId,
      50,
      0,
      { type: 'spend' }
    );

    // All transactions should be spend type
    spendHistory.transactions.forEach(tx => {
      expect(tx.type).toBe('spend');
      expect(tx.amount).toBeLessThan(0); // Negative amounts
    });
  });

  it('should handle zero spending amount gracefully', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Try to spend zero
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      0,
      'spend',
      'Zero spend test'
    );

    // Should return null for zero amount
    expect(transaction).toBeNull();

    // Balance should not change
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance);
  });

  it('should handle negative spending amount gracefully', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Try to spend negative amount
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      -50,
      'spend',
      'Negative spend test'
    );

    // Should return null for negative amount
    expect(transaction).toBeNull();

    // Balance should not change
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance);
  });

  it('should round complex spending amounts to 3 decimal places', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Spend amount that needs rounding
    // 12.3456789 should round to 12.346
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      12.3456789,
      'spend',
      'Rounding test'
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.amount).toBeCloseTo(-12.346, 3);

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBeCloseTo(initialBalance - 12.346, 3);
  });

  it('should create spending transaction with proper metadata', async () => {
    const metadata = {
      itemType: 'badge',
      itemId: 'test-badge-123',
      itemName: 'Tree Planter Badge',
      purchaseDate: new Date().toISOString(),
    };

    const transaction = await ggCoinService.debitCoins(
      testUserId,
      75,
      'spend',
      'Badge purchase with metadata',
      metadata
    );

    expect(transaction).not.toBeNull();
    expect(transaction?.metadata).toBeDefined();
    expect(transaction?.metadata?.itemType).toBe('badge');
    expect(transaction?.metadata?.itemId).toBe('test-badge-123');

    // Verify metadata is persisted in database
    const history = await ggCoinService.getTransactionHistory(testUserId, 1, 0);
    const latestTx = history.transactions[0];
    expect(latestTx.metadata?.itemType).toBe('badge');
    expect(latestTx.metadata?.itemId).toBe('test-badge-123');
  });

  it('should maintain balance consistency across mixed earn and spend operations', async () => {
    // Get initial balance
    const startBalance = await ggCoinService.getBalance(testUserId);

    // Perform mixed operations
    const operations = [
      { type: 'earn', amount: 50, action: 'tree_planting' },
      { type: 'spend', amount: 20, description: 'Purchase 1' },
      { type: 'earn', amount: 30, action: 'waste_cleanup' },
      { type: 'spend', amount: 15, description: 'Purchase 2' },
      { type: 'earn', amount: 100, action: 'mission_completion' },
      { type: 'spend', amount: 45, description: 'Purchase 3' },
    ];

    let expectedBalance = startBalance;

    for (const op of operations) {
      if (op.type === 'earn') {
        const tx = await ggCoinService.awardCoins(testUserId, op.action as any);
        expect(tx).not.toBeNull();
        expectedBalance += op.amount;
      } else {
        const tx = await ggCoinService.debitCoins(
          testUserId,
          op.amount,
          'spend',
          op.description || 'Test debit'
        );
        expect(tx).not.toBeNull();
        expectedBalance -= op.amount;
      }

      // Verify balance after each operation
      const currentBalance = await ggCoinService.getBalance(testUserId);
      expect(currentBalance).toBe(expectedBalance);
    }

    // Final verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(expectedBalance);
    expect(finalBalance).toBe(startBalance + 50 - 20 + 30 - 15 + 100 - 45);
  });

  it('should handle concurrent spending operations correctly', async () => {
    // First, ensure we have enough balance
    const currentBalance = await ggCoinService.getBalance(testUserId);
    if (currentBalance < 100) {
      await ggCoinService.creditCoins(testUserId, 100, 'earn', 'Top up for concurrent test');
    }

    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Spend coins concurrently
    const promises = [
      ggCoinService.debitCoins(testUserId, 10, 'spend', 'Concurrent purchase 1'),
      ggCoinService.debitCoins(testUserId, 15, 'spend', 'Concurrent purchase 2'),
      ggCoinService.debitCoins(testUserId, 20, 'spend', 'Concurrent purchase 3'),
    ];

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach(result => {
      expect(result).not.toBeNull();
    });

    // Final balance should reflect all spending
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance - 45); // 10 + 15 + 20
  });

  it('should prevent negative balance from concurrent operations', async () => {
    // Create a user with limited balance
    const limitedUserId = 'test-limited-balance-' + Date.now();
    await supabase
      .from('user_gamification')
      .insert({
        id: limitedUserId,
        gg_coins: 50.000, // Only 50 coins
        total_points: 0,
        level: 1,
      });

    try {
      // Try to spend more than available concurrently
      const promises = [
        ggCoinService.debitCoins(limitedUserId, 30, 'spend', 'Purchase 1'),
        ggCoinService.debitCoins(limitedUserId, 30, 'spend', 'Purchase 2'),
        ggCoinService.debitCoins(limitedUserId, 30, 'spend', 'Purchase 3'),
      ];

      const results = await Promise.all(promises);

      // At least one should fail (return null)
      const failedCount = results.filter(r => r === null).length;
      expect(failedCount).toBeGreaterThan(0);

      // Final balance should not be negative
      const finalBalance = await ggCoinService.getBalance(limitedUserId);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
    } finally {
      // Clean up
      await supabase
        .from('gg_coin_transactions')
        .delete()
        .eq('user_id', limitedUserId);
      await supabase
        .from('user_gamification')
        .delete()
        .eq('id', limitedUserId);
    }
  });

  it('should handle spending exact balance amount', async () => {
    // Create a user with specific balance
    const exactUserId = 'test-exact-balance-' + Date.now();
    await supabase
      .from('user_gamification')
      .insert({
        id: exactUserId,
        gg_coins: 100.000,
        total_points: 0,
        level: 1,
      });

    try {
      const balance = await ggCoinService.getBalance(exactUserId);
      expect(balance).toBe(100);

      // Spend exact balance
      const transaction = await ggCoinService.debitCoins(
        exactUserId,
        100,
        'spend',
        'Spend exact balance'
      );

      expect(transaction).not.toBeNull();
      expect(transaction?.amount).toBe(-100);

      // Balance should be zero
      const finalBalance = await ggCoinService.getBalance(exactUserId);
      expect(finalBalance).toBe(0);

      // Should not be able to spend more
      const failedTx = await ggCoinService.debitCoins(
        exactUserId,
        1,
        'spend',
        'Try to spend with zero balance'
      );
      expect(failedTx).toBeNull();
    } finally {
      // Clean up
      await supabase
        .from('gg_coin_transactions')
        .delete()
        .eq('user_id', exactUserId);
      await supabase
        .from('user_gamification')
        .delete()
        .eq('id', exactUserId);
    }
  });

  it('should record spending with different transaction types', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Ensure we have enough balance
    if (initialBalance < 200) {
      await ggCoinService.creditCoins(testUserId, 200, 'earn', 'Top up');
    }

    // Spend with different types
    const tx1 = await ggCoinService.debitCoins(
      testUserId,
      50,
      'spend',
      'Regular purchase'
    );
    expect(tx1).not.toBeNull();
    expect(tx1?.type).toBe('spend');

    // Note: debitCoins always creates 'spend' type transactions
    // The type parameter is stored in the database but mapped to 'spend' in the service
    const history = await ggCoinService.getTransactionHistory(testUserId, 10, 0);
    const spendTx = history.transactions.find(tx => tx.description === 'Regular purchase');
    expect(spendTx).toBeDefined();
    expect(spendTx?.type).toBe('spend');
  });

  it('should handle spending after earning in same session', async () => {
    const startBalance = await ggCoinService.getBalance(testUserId);

    // Earn coins
    const earnTx = await ggCoinService.awardCoins(testUserId, 'tree_planting');
    expect(earnTx).not.toBeNull();

    const balanceAfterEarn = await ggCoinService.getBalance(testUserId);
    expect(balanceAfterEarn).toBe(startBalance + 50);

    // Spend some of the earned coins
    const spendTx = await ggCoinService.debitCoins(
      testUserId,
      25,
      'spend',
      'Spend earned coins'
    );
    expect(spendTx).not.toBeNull();

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(startBalance + 25); // +50 -25
  });
});

/**
 * GG Coin Service Integration Tests - Negative Balance Prevention
 * Tests that the system prevents negative balances in all scenarios
 * 
 * This test validates:
 * - Basic insufficient balance rejection
 * - Edge case: spending exactly balance + 0.001
 * - Multiple attempts to overdraw
 * - Negative balance prevention with concurrent operations
 * - Balance remains non-negative after failed operations
 */
describe('GGCoinService Integration - Negative Balance Prevention', () => {
  const testUserId = 'test-negative-balance-' + Date.now();

  beforeAll(async () => {
    // Create a test user with limited balance
    const { error } = await supabase
      .from('user_gamification')
      .insert({
        id: testUserId,
        gg_coins: 100.000, // Start with 100 coins
        total_points: 0,
        level: 1,
      });

    if (error) {
      console.warn('Could not create test user for negative balance tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user and transactions
    await supabase
      .from('gg_coin_transactions')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_gamification')
      .delete()
      .eq('id', testUserId);
  });

  it('should prevent spending more than available balance', async () => {
    const currentBalance = await ggCoinService.getBalance(testUserId);
    expect(currentBalance).toBeGreaterThan(0);

    // Try to spend more than balance
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      currentBalance + 100,
      'spend',
      'Attempt to overspend by 100'
    );

    // Should return null for insufficient balance
    expect(transaction).toBeNull();

    // Balance should remain unchanged
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent spending balance + 0.001 (edge case)', async () => {
    const currentBalance = await ggCoinService.getBalance(testUserId);
    expect(currentBalance).toBeGreaterThan(0);

    // Try to spend just slightly more than balance
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      currentBalance + 0.001,
      'spend',
      'Attempt to overspend by 0.001'
    );

    // Should return null for insufficient balance
    expect(transaction).toBeNull();

    // Balance should remain unchanged
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent multiple sequential overdraft attempts', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBeGreaterThan(0);

    // Try multiple overdraft attempts
    const attempts = [
      initialBalance + 50,
      initialBalance + 100,
      initialBalance + 0.5,
      initialBalance * 2,
      initialBalance + 1000,
    ];

    for (const amount of attempts) {
      const transaction = await ggCoinService.debitCoins(
        testUserId,
        amount,
        'spend',
        `Overdraft attempt: ${amount}`
      );

      // All should fail
      expect(transaction).toBeNull();

      // Balance should remain unchanged
      const currentBalance = await ggCoinService.getBalance(testUserId);
      expect(currentBalance).toBe(initialBalance);
      expect(currentBalance).toBeGreaterThanOrEqual(0);
    }

    // Final verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent negative balance after successful spending', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBeGreaterThan(0);

    // Spend a valid amount
    const validSpend = Math.min(50, initialBalance - 10);
    const tx1 = await ggCoinService.debitCoins(
      testUserId,
      validSpend,
      'spend',
      'Valid purchase'
    );
    expect(tx1).not.toBeNull();

    const balanceAfterSpend = await ggCoinService.getBalance(testUserId);
    expect(balanceAfterSpend).toBe(initialBalance - validSpend);
    expect(balanceAfterSpend).toBeGreaterThanOrEqual(0);

    // Now try to spend more than remaining balance
    const tx2 = await ggCoinService.debitCoins(
      testUserId,
      balanceAfterSpend + 50,
      'spend',
      'Attempt to overdraft after valid spend'
    );
    expect(tx2).toBeNull();

    // Balance should remain unchanged
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(balanceAfterSpend);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent negative balance with zero balance edge case', async () => {
    // Create a user with zero balance
    const zeroBalanceUserId = 'test-zero-balance-' + Date.now();
    await supabase
      .from('user_gamification')
      .insert({
        id: zeroBalanceUserId,
        gg_coins: 0.000,
        total_points: 0,
        level: 1,
      });

    try {
      const balance = await ggCoinService.getBalance(zeroBalanceUserId);
      expect(balance).toBe(0);

      // Try to spend with zero balance
      const transaction = await ggCoinService.debitCoins(
        zeroBalanceUserId,
        1,
        'spend',
        'Attempt to spend with zero balance'
      );

      // Should fail
      expect(transaction).toBeNull();

      // Balance should remain zero
      const finalBalance = await ggCoinService.getBalance(zeroBalanceUserId);
      expect(finalBalance).toBe(0);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
    } finally {
      // Clean up
      await supabase
        .from('gg_coin_transactions')
        .delete()
        .eq('user_id', zeroBalanceUserId);
      await supabase
        .from('user_gamification')
        .delete()
        .eq('id', zeroBalanceUserId);
    }
  });

  it('should prevent negative balance with very small amounts', async () => {
    const currentBalance = await ggCoinService.getBalance(testUserId);
    expect(currentBalance).toBeGreaterThan(0);

    // Try to spend balance + very small amount
    const transaction = await ggCoinService.debitCoins(
      testUserId,
      currentBalance + 0.0001,
      'spend',
      'Attempt to overspend by 0.0001'
    );

    // Should fail even for tiny overdraft
    expect(transaction).toBeNull();

    // Balance should remain unchanged
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should maintain non-negative balance across mixed operations', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBeGreaterThan(0);

    // Perform a series of operations
    const operations = [
      { type: 'spend', amount: 10, shouldSucceed: true },
      { type: 'earn', amount: 20, shouldSucceed: true },
      { type: 'spend', amount: 15, shouldSucceed: true },
      { type: 'spend', amount: 1000, shouldSucceed: false }, // Should fail
      { type: 'earn', amount: 5, shouldSucceed: true },
      { type: 'spend', amount: 5, shouldSucceed: true },
    ];

    let expectedBalance = initialBalance;

    for (const op of operations) {
      const balanceBefore = await ggCoinService.getBalance(testUserId);

      if (op.type === 'earn') {
        const tx = await ggCoinService.creditCoins(
          testUserId,
          op.amount,
          'earn',
          `Earn ${op.amount} coins`
        );
        expect(tx).not.toBeNull();
        expectedBalance += op.amount;
      } else {
        const tx = await ggCoinService.debitCoins(
          testUserId,
          op.amount,
          'spend',
          `Spend ${op.amount} coins`
        );

        if (op.shouldSucceed) {
          expect(tx).not.toBeNull();
          expectedBalance -= op.amount;
        } else {
          expect(tx).toBeNull();
          // Balance should not change
        }
      }

      // Verify balance is never negative
      const balanceAfter = await ggCoinService.getBalance(testUserId);
      expect(balanceAfter).toBeGreaterThanOrEqual(0);
      expect(balanceAfter).toBe(expectedBalance);
    }

    // Final verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
    expect(finalBalance).toBe(expectedBalance);
  });

  it('should handle database-level negative balance prevention', async () => {
    // This test verifies that even if we try to bypass the service layer,
    // the database constraints prevent negative balances
    const currentBalance = await ggCoinService.getBalance(testUserId);
    expect(currentBalance).toBeGreaterThan(0);

    // Try to use the database function directly with an amount that would cause negative balance
    const { data, error } = await supabase.rpc('debit_gg_coins', {
      p_user_id: testUserId,
      p_amount: currentBalance + 100,
      p_transaction_type: 'spend',
      p_description: 'Direct database overdraft attempt',
      p_metadata: null,
    });

    // Should fail at database level
    expect(data?.success).toBe(false);
    expect(data?.error).toBeDefined();

    // Balance should remain unchanged
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(currentBalance);
    expect(finalBalance).toBeGreaterThanOrEqual(0);
  });

  it('should prevent negative balance in rapid sequential operations', async () => {
    // Create a user with limited balance for this test
    const rapidTestUserId = 'test-rapid-operations-' + Date.now();
    await supabase
      .from('user_gamification')
      .insert({
        id: rapidTestUserId,
        gg_coins: 50.000,
        total_points: 0,
        level: 1,
      });

    try {
      // Perform rapid sequential spending operations
      const results = [];
      for (let i = 0; i < 10; i++) {
        const tx = await ggCoinService.debitCoins(
          rapidTestUserId,
          10,
          'spend',
          `Rapid spend ${i + 1}`
        );
        results.push(tx);
      }

      // Only the first 5 should succeed (50 / 10 = 5)
      const successCount = results.filter(r => r !== null).length;
      expect(successCount).toBeLessThanOrEqual(5);

      // Balance should be zero or positive
      const finalBalance = await ggCoinService.getBalance(rapidTestUserId);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
      expect(finalBalance).toBeLessThanOrEqual(50);
    } finally {
      // Clean up
      await supabase
        .from('gg_coin_transactions')
        .delete()
        .eq('user_id', rapidTestUserId);
      await supabase
        .from('user_gamification')
        .delete()
        .eq('id', rapidTestUserId);
    }
  });

  it('should prevent negative balance with concurrent operations', async () => {
    // Create a user with limited balance for concurrent test
    const concurrentUserId = 'test-concurrent-negative-' + Date.now();
    await supabase
      .from('user_gamification')
      .insert({
        id: concurrentUserId,
        gg_coins: 60.000,
        total_points: 0,
        level: 1,
      });

    try {
      // Try to spend more than available concurrently
      const promises = [
        ggCoinService.debitCoins(concurrentUserId, 40, 'spend', 'Concurrent 1'),
        ggCoinService.debitCoins(concurrentUserId, 40, 'spend', 'Concurrent 2'),
        ggCoinService.debitCoins(concurrentUserId, 40, 'spend', 'Concurrent 3'),
      ];

      const results = await Promise.all(promises);

      // At least one should fail
      const failedCount = results.filter(r => r === null).length;
      expect(failedCount).toBeGreaterThan(0);

      // Balance should never be negative
      const finalBalance = await ggCoinService.getBalance(concurrentUserId);
      expect(finalBalance).toBeGreaterThanOrEqual(0);
      expect(finalBalance).toBeLessThanOrEqual(60);
    } finally {
      // Clean up
      await supabase
        .from('gg_coin_transactions')
        .delete()
        .eq('user_id', concurrentUserId);
      await supabase
        .from('user_gamification')
        .delete()
        .eq('id', concurrentUserId);
    }
  });
});

/**
 * GG Coin Service Integration Tests - Balance Consistency Across Transactions
 * Tests that balance remains consistent across various transaction scenarios
 * 
 * This test validates:
 * - Balance consistency after multiple sequential transactions
 * - Transaction history matches balance changes
 * - Balance before/after values in transactions are accurate
 * - Sum of all transactions equals current balance
 * - No balance drift or inconsistencies
 */
describe('GGCoinService Integration - Balance Consistency Across Transactions', () => {
  const testUserId = 'test-balance-consistency-' + Date.now();

  beforeAll(async () => {
    // Create a test user with initial balance
    const { error } = await supabase
      .from('user_gamification')
      .insert({
        id: testUserId,
        gg_coins: 1000.000, // Start with 1000 coins
        total_points: 0,
        level: 1,
      });

    if (error) {
      console.warn('Could not create test user for balance consistency tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up test user and transactions
    await supabase
      .from('gg_coin_transactions')
      .delete()
      .eq('user_id', testUserId);

    await supabase
      .from('user_gamification')
      .delete()
      .eq('id', testUserId);
  });

  it('should maintain balance consistency across multiple sequential transactions', async () => {
    // Get initial balance
    const initialBalance = await ggCoinService.getBalance(testUserId);
    expect(initialBalance).toBe(1000);

    // Perform a series of transactions
    const transactions = [
      { type: 'credit', amount: 50, description: 'Earned from tree planting' },
      { type: 'debit', amount: 25, description: 'Purchased badge' },
      { type: 'credit', amount: 100, description: 'Mission completion' },
      { type: 'debit', amount: 75, description: 'Purchased item' },
      { type: 'credit', amount: 30, description: 'Daily login bonus' },
      { type: 'debit', amount: 10, description: 'Small purchase' },
      { type: 'credit', amount: 200, description: 'Special event reward' },
      { type: 'debit', amount: 150, description: 'Large purchase' },
    ];

    let expectedBalance = initialBalance;
    const transactionResults = [];

    for (const tx of transactions) {
      const balanceBefore = await ggCoinService.getBalance(testUserId);
      expect(balanceBefore).toBe(expectedBalance);

      let result;
      if (tx.type === 'credit') {
        result = await ggCoinService.creditCoins(
          testUserId,
          tx.amount,
          'earn',
          tx.description
        );
        expectedBalance += tx.amount;
      } else {
        result = await ggCoinService.debitCoins(
          testUserId,
          tx.amount,
          'spend',
          tx.description
        );
        expectedBalance -= tx.amount;
      }

      expect(result).not.toBeNull();
      transactionResults.push(result);

      // Verify balance after each transaction
      const balanceAfter = await ggCoinService.getBalance(testUserId);
      expect(balanceAfter).toBe(expectedBalance);

      // Verify transaction recorded correct before/after balances
      expect(result?.balanceBefore).toBe(balanceBefore);
      expect(result?.balanceAfter).toBe(balanceAfter);
    }

    // Final balance verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(expectedBalance);
    expect(finalBalance).toBe(1000 + 50 - 25 + 100 - 75 + 30 - 10 + 200 - 150);
    expect(finalBalance).toBe(1120);
  });

  it('should maintain consistency between transaction history and current balance', async () => {
    // Get current balance
    const currentBalance = await ggCoinService.getBalance(testUserId);

    // Get all transactions for this user
    const history = await ggCoinService.getTransactionHistory(testUserId, 1000, 0);

    // Calculate balance from transaction history
    let calculatedBalance = 1000; // Initial balance
    for (const tx of history.transactions.reverse()) {
      // Transactions are ordered newest first, so reverse to get chronological order
      if (tx.amount > 0) {
        calculatedBalance += tx.amount;
      } else {
        calculatedBalance += tx.amount; // Already negative
      }
    }

    // Calculated balance should match current balance
    expect(calculatedBalance).toBeCloseTo(currentBalance, 3);
  });

  it('should maintain consistency in transaction before/after balances', async () => {
    // Get transaction history
    const history = await ggCoinService.getTransactionHistory(testUserId, 1000, 0);

    // Verify each transaction's before/after balances are consistent
    for (let i = 0; i < history.transactions.length - 1; i++) {
      const currentTx = history.transactions[i];
      const nextTx = history.transactions[i + 1];

      // Current transaction's balanceBefore should equal next transaction's balanceAfter
      // (since transactions are ordered newest first)
      expect(currentTx.balanceBefore).toBeCloseTo(nextTx.balanceAfter, 3);
    }
  });

  it('should maintain balance consistency with decimal amounts', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform transactions with decimal amounts
    const decimalTransactions = [
      { type: 'credit', amount: 12.345 },
      { type: 'debit', amount: 5.678 },
      { type: 'credit', amount: 0.123 },
      { type: 'debit', amount: 0.456 },
      { type: 'credit', amount: 99.999 },
      { type: 'debit', amount: 33.333 },
    ];

    let expectedBalance = initialBalance;

    for (const tx of decimalTransactions) {
      if (tx.type === 'credit') {
        await ggCoinService.creditCoins(
          testUserId,
          tx.amount,
          'earn',
          `Decimal credit ${tx.amount}`
        );
        expectedBalance += tx.amount;
      } else {
        await ggCoinService.debitCoins(
          testUserId,
          tx.amount,
          'spend',
          `Decimal debit ${tx.amount}`
        );
        expectedBalance -= tx.amount;
      }

      // Verify balance after each transaction
      const currentBalance = await ggCoinService.getBalance(testUserId);
      expect(currentBalance).toBeCloseTo(expectedBalance, 3);
    }

    // Final verification
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBeCloseTo(expectedBalance, 3);
  });

  it('should maintain balance consistency across cache invalidation', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform a transaction
    await ggCoinService.creditCoins(testUserId, 50, 'earn', 'Cache test 1');

    // Get balance (should be from fresh query, cache invalidated)
    const balance1 = await ggCoinService.getBalance(testUserId);
    expect(balance1).toBe(initialBalance + 50);

    // Get balance again (should be from cache)
    const balance2 = await ggCoinService.getBalance(testUserId);
    expect(balance2).toBe(balance1);

    // Perform another transaction (invalidates cache)
    await ggCoinService.debitCoins(testUserId, 25, 'spend', 'Cache test 2');

    // Get balance (should be from fresh query)
    const balance3 = await ggCoinService.getBalance(testUserId);
    expect(balance3).toBe(balance1 - 25);

    // All balances should be consistent
    expect(balance3).toBe(initialBalance + 50 - 25);
  });

  it('should maintain balance consistency with rapid sequential operations', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform rapid sequential operations
    const operations = [];
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        operations.push({ type: 'credit', amount: 10 });
      } else {
        operations.push({ type: 'debit', amount: 5 });
      }
    }

    let expectedBalance = initialBalance;

    for (const op of operations) {
      if (op.type === 'credit') {
        await ggCoinService.creditCoins(testUserId, op.amount, 'earn', 'Rapid credit');
        expectedBalance += op.amount;
      } else {
        await ggCoinService.debitCoins(testUserId, op.amount, 'spend', 'Rapid debit');
        expectedBalance -= op.amount;
      }
    }

    // Verify final balance
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(expectedBalance);
    expect(finalBalance).toBe(initialBalance + (10 * 10) - (5 * 10)); // 10 credits of 10, 10 debits of 5
  });

  it('should maintain balance consistency when querying from database directly', async () => {
    // Get balance from service
    const serviceBalance = await ggCoinService.getBalance(testUserId);

    // Get balance directly from database
    const { data, error } = await supabase
      .from('user_gamification')
      .select('gg_coins')
      .eq('id', testUserId)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    const dbBalance = parseFloat(data!.gg_coins);

    // Both should match
    expect(serviceBalance).toBe(dbBalance);
  });

  it('should maintain balance consistency across transaction types', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform transactions of different types
    await ggCoinService.creditCoins(testUserId, 50, 'earn', 'Earn type');
    await ggCoinService.creditCoins(testUserId, 30, 'bonus', 'Bonus type');
    await ggCoinService.creditCoins(testUserId, 20, 'referral', 'Referral type');
    await ggCoinService.debitCoins(testUserId, 40, 'spend', 'Spend type');

    const expectedBalance = initialBalance + 50 + 30 + 20 - 40;
    const finalBalance = await ggCoinService.getBalance(testUserId);

    expect(finalBalance).toBe(expectedBalance);
  });

  it('should maintain balance consistency with transaction metadata', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform transactions with metadata
    const tx1 = await ggCoinService.creditCoins(
      testUserId,
      75,
      'earn',
      'Transaction with metadata',
      { source: 'test', category: 'mission' }
    );

    expect(tx1).not.toBeNull();
    expect(tx1?.balanceBefore).toBe(initialBalance);
    expect(tx1?.balanceAfter).toBe(initialBalance + 75);

    const currentBalance = await ggCoinService.getBalance(testUserId);
    expect(currentBalance).toBe(initialBalance + 75);
    expect(currentBalance).toBe(tx1?.balanceAfter);
  });

  it('should maintain balance consistency after failed transactions', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Try to spend more than available (should fail)
    const failedTx = await ggCoinService.debitCoins(
      testUserId,
      initialBalance + 1000,
      'spend',
      'Failed transaction'
    );

    expect(failedTx).toBeNull();

    // Balance should remain unchanged
    const balanceAfterFailed = await ggCoinService.getBalance(testUserId);
    expect(balanceAfterFailed).toBe(initialBalance);

    // Perform a successful transaction
    const successTx = await ggCoinService.creditCoins(
      testUserId,
      50,
      'earn',
      'Successful transaction'
    );

    expect(successTx).not.toBeNull();

    // Balance should reflect only the successful transaction
    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance + 50);
  });

  it('should maintain balance consistency with very large transaction counts', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform many small transactions
    const transactionCount = 50;
    const amountPerTransaction = 1;

    for (let i = 0; i < transactionCount; i++) {
      if (i % 2 === 0) {
        await ggCoinService.creditCoins(
          testUserId,
          amountPerTransaction,
          'earn',
          `Small credit ${i}`
        );
      } else {
        await ggCoinService.debitCoins(
          testUserId,
          amountPerTransaction,
          'spend',
          `Small debit ${i}`
        );
      }
    }

    // Calculate expected balance
    const creditCount = Math.ceil(transactionCount / 2);
    const debitCount = Math.floor(transactionCount / 2);
    const expectedBalance = initialBalance + (creditCount * amountPerTransaction) - (debitCount * amountPerTransaction);

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(expectedBalance);
  });

  it('should maintain balance consistency across service restarts (cache cleared)', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform a transaction
    await ggCoinService.creditCoins(testUserId, 100, 'earn', 'Before cache clear');

    const balanceBeforeClear = await ggCoinService.getBalance(testUserId);
    expect(balanceBeforeClear).toBe(initialBalance + 100);

    // Clear cache (simulating service restart)
    ggCoinService.clearCache(testUserId);

    // Get balance again (should fetch from database)
    const balanceAfterClear = await ggCoinService.getBalance(testUserId);
    expect(balanceAfterClear).toBe(balanceBeforeClear);

    // Perform another transaction
    await ggCoinService.debitCoins(testUserId, 50, 'spend', 'After cache clear');

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBe(initialBalance + 100 - 50);
  });

  it('should maintain balance consistency with rounding edge cases', async () => {
    const initialBalance = await ggCoinService.getBalance(testUserId);

    // Perform transactions that require rounding
    const roundingTransactions = [
      { type: 'credit', amount: 10.3333333 }, // Should round to 10.333
      { type: 'debit', amount: 5.6666666 },   // Should round to 5.667
      { type: 'credit', amount: 0.1111111 },  // Should round to 0.111
      { type: 'debit', amount: 0.2222222 },   // Should round to 0.222
    ];

    let expectedBalance = initialBalance;

    for (const tx of roundingTransactions) {
      const roundedAmount = Math.round(tx.amount * 1000) / 1000;

      if (tx.type === 'credit') {
        await ggCoinService.creditCoins(
          testUserId,
          tx.amount,
          'earn',
          `Rounding credit ${tx.amount}`
        );
        expectedBalance += roundedAmount;
      } else {
        await ggCoinService.debitCoins(
          testUserId,
          tx.amount,
          'spend',
          `Rounding debit ${tx.amount}`
        );
        expectedBalance -= roundedAmount;
      }
    }

    const finalBalance = await ggCoinService.getBalance(testUserId);
    expect(finalBalance).toBeCloseTo(expectedBalance, 3);
  });
});
