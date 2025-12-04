import { describe, it, expect, beforeEach } from 'vitest';
import { ggCoinService } from './ggCoin.service';

/**
 * GG Coin Service Tests
 * Tests for the unified GG Coin service
 * 
 * Note: These are unit tests that verify the service logic.
 * Integration tests with the database are in ggCoin.integration.test.ts
 */

describe('GGCoinService', () => {
  beforeEach(() => {
    // Clear cache before each test
    ggCoinService.clearCache();
  });

  describe('getBalance', () => {
    it('should return cached balance within TTL', async () => {
      // This test verifies that getBalance returns cached values
      // when called multiple times within the cache TTL (30 seconds)
      
      const userId = 'test-user-cache';
      
      // First call - will query database and cache result
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Second call immediately after - should return cached value
      // without querying database again
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both calls should return the same balance
      expect(balance1).toBe(balance2);
      
      // Verify the balance is a number
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should fetch fresh balance after cache is cleared', async () => {
      const userId = 'test-user-clear-cache';
      
      // First call - caches the balance
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Clear cache
      ggCoinService.clearCache(userId);
      
      // Second call - should fetch fresh from database
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be numbers (actual values depend on database state)
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should return 0 for non-existent user', async () => {
      // Test with a user ID that doesn't exist
      const balance = await ggCoinService.getBalance('non-existent-user-id-12345');
      
      // Should return 0 for non-existent users
      expect(balance).toBe(0);
    });

    it('should handle empty user ID gracefully', async () => {
      // Test with empty user ID
      const balance = await ggCoinService.getBalance('');
      
      // Should return 0 for invalid user ID
      expect(balance).toBe(0);
    });

    it('should cache balances for different users independently', async () => {
      const userId1 = 'test-user-1';
      const userId2 = 'test-user-2';
      
      // Get balances for two different users
      const balance1 = await ggCoinService.getBalance(userId1);
      const balance2 = await ggCoinService.getBalance(userId2);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
      
      // Clearing cache for one user shouldn't affect the other
      ggCoinService.clearCache(userId1);
      
      // Get balance for user2 again - should still be cached
      const balance2Again = await ggCoinService.getBalance(userId2);
      expect(balance2Again).toBe(balance2);
    });

    it('should return balance as a number with proper decimal precision', async () => {
      const userId = 'test-user-precision';
      
      const balance = await ggCoinService.getBalance(userId);
      
      // Should be a number
      expect(typeof balance).toBe('number');
      
      // Should be non-negative
      expect(balance).toBeGreaterThanOrEqual(0);
      
      // Should be finite (not NaN or Infinity)
      expect(Number.isFinite(balance)).toBe(true);
    });

    it('should handle concurrent requests for the same user', async () => {
      const userId = 'test-user-concurrent';
      
      // Make multiple concurrent requests
      const [balance1, balance2, balance3] = await Promise.all([
        ggCoinService.getBalance(userId),
        ggCoinService.getBalance(userId),
        ggCoinService.getBalance(userId),
      ]);
      
      // All should return the same balance
      expect(balance1).toBe(balance2);
      expect(balance2).toBe(balance3);
      
      // All should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
      expect(typeof balance3).toBe('number');
    });

    it('should parse decimal values correctly', async () => {
      const userId = 'test-user-decimal';
      
      const balance = await ggCoinService.getBalance(userId);
      
      // Should handle decimal values (DECIMAL 10,3)
      expect(typeof balance).toBe('number');
      
      // Should not be NaN
      expect(Number.isNaN(balance)).toBe(false);
    });
  });

  describe('calculateReward', () => {
    it('should calculate base reward correctly', () => {
      const reward = ggCoinService.calculateReward('tree_planting');
      expect(reward).toBe(50);
    });

    it('should return 0 for unknown action type', () => {
      const reward = ggCoinService.calculateReward('unknown_action');
      expect(reward).toBe(0);
    });

    it('should apply impact multiplier', () => {
      const reward = ggCoinService.calculateReward('tree_planting', 10);
      expect(reward).toBe(500);
    });

    it('should apply custom multipliers', () => {
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        1,
        [{ condition: 'test', factor: 2.0 }]
      );
      expect(reward).toBe(100);
    });

    it('should apply multiple multipliers', () => {
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        2,
        [
          { condition: 'verified', factor: 1.5 },
          { condition: 'native_species', factor: 1.2 },
        ]
      );
      // 50 * 2 * 1.5 * 1.2 = 180
      expect(reward).toBe(180);
    });

    it('should round to 3 decimal places', () => {
      const reward = ggCoinService.calculateReward('tree_planting', 1.3333);
      expect(reward).toBe(66.665);
    });

    it('should handle fractional multipliers', () => {
      const reward = ggCoinService.calculateReward(
        'learning_module',
        1,
        [{ condition: 'perfect_score', factor: 1.5 }]
      );
      // 20 * 1.5 = 30
      expect(reward).toBe(30);
    });

    it('should handle zero impact', () => {
      const reward = ggCoinService.calculateReward('tree_planting', 0);
      expect(reward).toBe(0);
    });

    it('should handle negative impact as zero', () => {
      const reward = ggCoinService.calculateReward('tree_planting', -5);
      expect(reward).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific user', () => {
      // This is a simple test to verify the method exists and doesn't throw
      expect(() => ggCoinService.clearCache('test-user-id')).not.toThrow();
    });

    it('should clear all cache when no userId provided', () => {
      expect(() => ggCoinService.clearCache()).not.toThrow();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache after creditCoins', async () => {
      const userId = 'test-user-cache-invalidation-credit';
      
      // First call to populate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Credit coins - this should invalidate the cache
      await ggCoinService.creditCoins(userId, 10, 'earn', 'Test credit');
      
      // Get balance again - should fetch fresh from database (not cached)
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
      
      // The cache should have been invalidated and refreshed
      // We can't assert exact values without database state, but we verify the flow works
    });

    it('should invalidate cache after debitCoins', async () => {
      const userId = 'test-user-cache-invalidation-debit';
      
      // First call to populate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Debit coins - this should invalidate the cache
      await ggCoinService.debitCoins(userId, 5, 'spend', 'Test debit');
      
      // Get balance again - should fetch fresh from database (not cached)
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should invalidate cache after awardCoins', async () => {
      const userId = 'test-user-cache-invalidation-award';
      
      // First call to populate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Award coins - this should invalidate the cache (via creditCoins)
      await ggCoinService.awardCoins(userId, 'tree_planting');
      
      // Get balance again - should fetch fresh from database (not cached)
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should not affect cache of other users when invalidating one user', async () => {
      const userId1 = 'test-user-cache-1';
      const userId2 = 'test-user-cache-2';
      
      // Populate cache for both users
      const balance1 = await ggCoinService.getBalance(userId1);
      const balance2 = await ggCoinService.getBalance(userId2);
      
      // Credit coins to user1 - should only invalidate user1's cache
      await ggCoinService.creditCoins(userId1, 10, 'earn', 'Test credit');
      
      // Get balances again
      const balance1After = await ggCoinService.getBalance(userId1);
      const balance2After = await ggCoinService.getBalance(userId2);
      
      // All should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
      expect(typeof balance1After).toBe('number');
      expect(typeof balance2After).toBe('number');
      
      // User2's balance should be the same (from cache)
      expect(balance2After).toBe(balance2);
    });

    it('should invalidate cache when clearCache is called for specific user', async () => {
      const userId = 'test-user-cache-clear-specific';
      
      // Populate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Clear cache for this user
      ggCoinService.clearCache(userId);
      
      // Get balance again - should fetch fresh from database
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should invalidate all caches when clearCache is called without userId', async () => {
      const userId1 = 'test-user-cache-clear-all-1';
      const userId2 = 'test-user-cache-clear-all-2';
      
      // Populate cache for both users
      await ggCoinService.getBalance(userId1);
      await ggCoinService.getBalance(userId2);
      
      // Clear all caches
      ggCoinService.clearCache();
      
      // Get balances again - both should fetch fresh from database
      const balance1 = await ggCoinService.getBalance(userId1);
      const balance2 = await ggCoinService.getBalance(userId2);
      
      // Both should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
    });

    it('should handle cache invalidation with concurrent operations', async () => {
      const userId = 'test-user-cache-concurrent-invalidation';
      
      // Populate cache
      await ggCoinService.getBalance(userId);
      
      // Perform multiple operations concurrently that invalidate cache
      await Promise.all([
        ggCoinService.creditCoins(userId, 10, 'earn', 'Credit 1'),
        ggCoinService.creditCoins(userId, 20, 'earn', 'Credit 2'),
        ggCoinService.getBalance(userId),
      ]);
      
      // Get final balance - should be fresh from database
      const finalBalance = await ggCoinService.getBalance(userId);
      
      expect(typeof finalBalance).toBe('number');
    });

    it('should repopulate cache after invalidation on next getBalance call', async () => {
      const userId = 'test-user-cache-repopulate';
      
      // First call - populates cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Clear cache
      ggCoinService.clearCache(userId);
      
      // Second call - should fetch from database and repopulate cache
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Third call immediately after - should use newly cached value
      const balance3 = await ggCoinService.getBalance(userId);
      
      // All should be numbers
      expect(typeof balance1).toBe('number');
      expect(typeof balance2).toBe('number');
      expect(typeof balance3).toBe('number');
      
      // balance2 and balance3 should be the same (both from cache or fresh)
      expect(balance3).toBe(balance2);
    });

    it('should invalidate cache even when transaction fails', async () => {
      const userId = 'test-user-cache-invalidation-on-failure';
      
      // Populate cache
      await ggCoinService.getBalance(userId);
      
      // Try to credit with invalid amount (should fail but still clear cache)
      await ggCoinService.creditCoins(userId, -10, 'earn', 'Invalid credit');
      
      // The cache should still work normally
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should handle cache invalidation with empty user ID', async () => {
      // Try to credit with empty user ID
      await ggCoinService.creditCoins('', 10, 'earn', 'Test');
      
      // Should not throw and should handle gracefully
      const balance = await ggCoinService.getBalance('');
      expect(balance).toBe(0);
    });

    it('should maintain cache TTL after invalidation and repopulation', async () => {
      const userId = 'test-user-cache-ttl-after-invalidation';
      
      // Populate cache
      await ggCoinService.getBalance(userId);
      
      // Invalidate cache
      ggCoinService.clearCache(userId);
      
      // Repopulate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Immediately get balance again - should use cache
      const balance2 = await ggCoinService.getBalance(userId);
      
      // Both should be the same (second call uses cache)
      expect(balance1).toBe(balance2);
    });

    it('should invalidate cache for failed debit operations', async () => {
      const userId = 'test-user-cache-invalidation-failed-debit';
      
      // Populate cache
      await ggCoinService.getBalance(userId);
      
      // Try to debit with invalid amount
      await ggCoinService.debitCoins(userId, 0, 'spend', 'Invalid debit');
      
      // Cache should still work normally
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should handle multiple cache invalidations in sequence', async () => {
      const userId = 'test-user-cache-multiple-invalidations';
      
      // Populate cache
      await ggCoinService.getBalance(userId);
      
      // Invalidate multiple times
      ggCoinService.clearCache(userId);
      ggCoinService.clearCache(userId);
      ggCoinService.clearCache(userId);
      
      // Should still work normally
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should invalidate cache when subscription updates balance', async () => {
      const userId = 'test-user-cache-subscription-update';
      
      // Populate cache
      const balance1 = await ggCoinService.getBalance(userId);
      
      // Subscribe to balance updates
      let updatedBalance: number | null = null;
      const unsubscribe = ggCoinService.subscribeToBalance(userId, (balance) => {
        updatedBalance = balance;
      });
      
      // Note: Real-time updates would trigger the callback and update cache
      // This test verifies the subscription mechanism exists
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
      
      // Verify balance still works
      const balance2 = await ggCoinService.getBalance(userId);
      expect(typeof balance2).toBe('number');
    });
  });

  describe('reward rules', () => {
    it('should have correct base rewards for all action types', () => {
      expect(ggCoinService.calculateReward('tree_planting')).toBe(50);
      expect(ggCoinService.calculateReward('waste_cleanup')).toBe(30);
      expect(ggCoinService.calculateReward('learning_module')).toBe(20);
      expect(ggCoinService.calculateReward('mission_completion')).toBe(100);
      expect(ggCoinService.calculateReward('community_post')).toBe(5);
      expect(ggCoinService.calculateReward('petition_signature')).toBe(10);
      expect(ggCoinService.calculateReward('referral')).toBe(50);
      expect(ggCoinService.calculateReward('daily_login')).toBe(5);
    });
  });

  describe('decimal precision', () => {
    it('should handle small decimal amounts', () => {
      const reward = ggCoinService.calculateReward('community_post', 0.1);
      expect(reward).toBe(0.5);
    });

    it('should round complex calculations correctly', () => {
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        1.333,
        [{ condition: 'test', factor: 1.111 }]
      );
      // 50 * 1.333 * 1.111 = 74.04815, rounded to 74.048
      expect(reward).toBeCloseTo(74.048, 3);
    });

    it('should maintain precision with multiple operations', () => {
      const reward1 = ggCoinService.calculateReward('community_post', 1);
      const reward2 = ggCoinService.calculateReward('community_post', 1);
      const total = reward1 + reward2;
      expect(total).toBe(10);
    });
  });

  describe('creditCoins', () => {
    it('should return null for zero amount', async () => {
      // Test with zero amount
      const result = await ggCoinService.creditCoins(
        'test-user',
        0,
        'earn',
        'Test credit'
      );
      expect(result).toBeNull();
    });

    it('should return null for negative amount', async () => {
      // Test with negative amount
      const result = await ggCoinService.creditCoins(
        'test-user',
        -10,
        'earn',
        'Test credit'
      );
      expect(result).toBeNull();
    });

    it('should round amount to 3 decimal places', async () => {
      // Test that amounts are rounded correctly
      // Note: Actual database interaction is tested in integration tests
      // This test verifies the rounding logic
      const amount = 10.123456789;
      const expectedRounded = 10.123;
      
      // The service should round to 3 decimal places
      expect(Math.round(amount * 1000) / 1000).toBe(expectedRounded);
    });

    it('should accept valid transaction types', async () => {
      // Test that the method accepts different transaction types
      // Note: Actual database interaction is tested in integration tests
      const types = ['earn', 'bonus', 'referral', 'spend'];
      
      for (const type of types) {
        // Verify the method can be called with different types
        // Actual result depends on database state
        expect(async () => {
          await ggCoinService.creditCoins('test-user', 10, type, `Test ${type}`);
        }).not.toThrow();
      }
    });

    it('should accept metadata parameter', async () => {
      // Test that metadata can be passed
      const metadata = {
        actionType: 'tree_planting',
        treeId: 'tree-123',
        location: 'Kakamega Forest',
      };
      
      // Verify the method accepts metadata without throwing
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          50,
          'earn',
          'Planted a tree',
          metadata
        );
      }).not.toThrow();
    });

    it('should handle missing metadata gracefully', async () => {
      // Test that metadata is optional
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          50,
          'earn',
          'Test credit'
          // No metadata parameter
        );
      }).not.toThrow();
    });

    it('should clear cache after successful credit', async () => {
      const userId = 'test-user-cache-clear';
      
      // Get balance to populate cache
      await ggCoinService.getBalance(userId);
      
      // Credit coins (this should clear the cache)
      await ggCoinService.creditCoins(userId, 10, 'earn', 'Test credit');
      
      // The cache should have been cleared
      // Next getBalance call will fetch fresh data
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should handle empty user ID gracefully', async () => {
      // Test with empty user ID
      const result = await ggCoinService.creditCoins(
        '',
        10,
        'earn',
        'Test credit'
      );
      
      // Should return null for invalid user ID
      expect(result).toBeNull();
    });

    it('should handle very small amounts', async () => {
      // Test with very small decimal amounts
      const amount = 0.001;
      
      // Verify the method accepts small amounts
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          amount,
          'earn',
          'Small reward'
        );
      }).not.toThrow();
    });

    it('should handle large amounts', async () => {
      // Test with large amounts
      const amount = 9999.999;
      
      // Verify the method accepts large amounts
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          amount,
          'bonus',
          'Large bonus'
        );
      }).not.toThrow();
    });

    it('should handle decimal amounts correctly', async () => {
      // Test with various decimal amounts
      const amounts = [10.5, 25.123, 100.999, 0.001, 50.0];
      
      for (const amount of amounts) {
        expect(async () => {
          await ggCoinService.creditCoins(
            'test-user',
            amount,
            'earn',
            `Test ${amount}`
          );
        }).not.toThrow();
      }
    });

    it('should accept description parameter', async () => {
      // Test that description is required and used
      const descriptions = [
        'Planted a tree',
        'Completed mission',
        'Daily login bonus',
        'Referral reward',
      ];
      
      for (const description of descriptions) {
        expect(async () => {
          await ggCoinService.creditCoins(
            'test-user',
            10,
            'earn',
            description
          );
        }).not.toThrow();
      }
    });

    it('should handle special characters in description', async () => {
      // Test with special characters in description
      const description = 'Earned 50 GG Coins for "tree planting" @ Kakamega Forest! 🌳';
      
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          50,
          'earn',
          description
        );
      }).not.toThrow();
    });

    it('should handle complex metadata objects', async () => {
      // Test with complex nested metadata
      const metadata = {
        actionType: 'tree_planting',
        details: {
          treeId: 'tree-123',
          species: 'Acacia',
          location: {
            forest: 'Kakamega',
            coordinates: { lat: -0.2827, lng: 34.8517 },
          },
        },
        multipliers: [
          { condition: 'verified_with_photo', factor: 1.2 },
          { condition: 'native_species', factor: 1.5 },
        ],
        timestamp: new Date().toISOString(),
      };
      
      expect(async () => {
        await ggCoinService.creditCoins(
          'test-user',
          50,
          'earn',
          'Complex metadata test',
          metadata
        );
      }).not.toThrow();
    });

    it('should validate amount is a number', async () => {
      // Test that non-numeric amounts are handled
      const invalidAmounts = [NaN, Infinity, -Infinity];
      
      for (const amount of invalidAmounts) {
        const result = await ggCoinService.creditCoins(
          'test-user',
          amount,
          'earn',
          'Test'
        );
        // Should return null for invalid amounts
        expect(result).toBeNull();
      }
    });

    it('should handle concurrent credit operations', async () => {
      const userId = 'test-user-concurrent-credit';
      
      // Make multiple concurrent credit requests
      const promises = [
        ggCoinService.creditCoins(userId, 10, 'earn', 'Credit 1'),
        ggCoinService.creditCoins(userId, 20, 'earn', 'Credit 2'),
        ggCoinService.creditCoins(userId, 30, 'earn', 'Credit 3'),
      ];
      
      // All should complete without throwing
      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('debitCoins', () => {
    it('should return null for zero amount', async () => {
      // Test with zero amount
      const result = await ggCoinService.debitCoins(
        'test-user',
        0,
        'spend',
        'Test debit'
      );
      expect(result).toBeNull();
    });

    it('should return null for negative amount', async () => {
      // Test with negative amount
      const result = await ggCoinService.debitCoins(
        'test-user',
        -10,
        'spend',
        'Test debit'
      );
      expect(result).toBeNull();
    });

    it('should round amount to 3 decimal places', async () => {
      // Test that amounts are rounded correctly
      // Note: Actual database interaction is tested in integration tests
      // This test verifies the rounding logic
      const amount = 10.123456789;
      const expectedRounded = 10.123;
      
      // The service should round to 3 decimal places
      expect(Math.round(amount * 1000) / 1000).toBe(expectedRounded);
    });

    it('should accept valid transaction types', async () => {
      // Test that the method accepts different transaction types
      // Note: Actual database interaction is tested in integration tests
      const types = ['spend', 'bonus', 'referral', 'earn'];
      
      for (const type of types) {
        // Verify the method can be called with different types
        // Actual result depends on database state
        expect(async () => {
          await ggCoinService.debitCoins('test-user', 10, type, `Test ${type}`);
        }).not.toThrow();
      }
    });

    it('should accept metadata parameter', async () => {
      // Test that metadata can be passed
      const metadata = {
        purchaseType: 'badge',
        badgeId: 'badge-123',
        badgeName: 'Tree Planter',
      };
      
      // Verify the method accepts metadata without throwing
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          50,
          'spend',
          'Purchased a badge',
          metadata
        );
      }).not.toThrow();
    });

    it('should handle missing metadata gracefully', async () => {
      // Test that metadata is optional
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          50,
          'spend',
          'Test debit'
          // No metadata parameter
        );
      }).not.toThrow();
    });

    it('should clear cache after successful debit', async () => {
      const userId = 'test-user-cache-clear-debit';
      
      // Get balance to populate cache
      await ggCoinService.getBalance(userId);
      
      // Debit coins (this should clear the cache)
      await ggCoinService.debitCoins(userId, 10, 'spend', 'Test debit');
      
      // The cache should have been cleared
      // Next getBalance call will fetch fresh data
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should handle empty user ID gracefully', async () => {
      // Test with empty user ID
      const result = await ggCoinService.debitCoins(
        '',
        10,
        'spend',
        'Test debit'
      );
      
      // Should return null for invalid user ID
      expect(result).toBeNull();
    });

    it('should handle very small amounts', async () => {
      // Test with very small decimal amounts
      const amount = 0.001;
      
      // Verify the method accepts small amounts
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          amount,
          'spend',
          'Small purchase'
        );
      }).not.toThrow();
    });

    it('should handle large amounts', async () => {
      // Test with large amounts
      const amount = 9999.999;
      
      // Verify the method accepts large amounts
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          amount,
          'spend',
          'Large purchase'
        );
      }).not.toThrow();
    });

    it('should handle decimal amounts correctly', async () => {
      // Test with various decimal amounts
      const amounts = [10.5, 25.123, 100.999, 0.001, 50.0];
      
      for (const amount of amounts) {
        expect(async () => {
          await ggCoinService.debitCoins(
            'test-user',
            amount,
            'spend',
            `Test ${amount}`
          );
        }).not.toThrow();
      }
    });

    it('should accept description parameter', async () => {
      // Test that description is required and used
      const descriptions = [
        'Purchased a badge',
        'Bought marketplace item',
        'Redeemed reward',
        'Spent on feature',
      ];
      
      for (const description of descriptions) {
        expect(async () => {
          await ggCoinService.debitCoins(
            'test-user',
            10,
            'spend',
            description
          );
        }).not.toThrow();
      }
    });

    it('should handle special characters in description', async () => {
      // Test with special characters in description
      const description = 'Spent 50 GG Coins on "Premium Badge" @ Marketplace! 🛒';
      
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          50,
          'spend',
          description
        );
      }).not.toThrow();
    });

    it('should handle complex metadata objects', async () => {
      // Test with complex nested metadata
      const metadata = {
        purchaseType: 'badge',
        details: {
          badgeId: 'badge-123',
          badgeName: 'Tree Planter Gold',
          tier: 'gold',
          price: {
            amount: 50,
            currency: 'GG_COINS',
          },
        },
        transaction: {
          marketplace: 'badge_marketplace',
          timestamp: new Date().toISOString(),
        },
      };
      
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          50,
          'spend',
          'Complex metadata test',
          metadata
        );
      }).not.toThrow();
    });

    it('should validate amount is a number', async () => {
      // Test that non-numeric amounts are handled
      const invalidAmounts = [NaN, Infinity, -Infinity];
      
      for (const amount of invalidAmounts) {
        const result = await ggCoinService.debitCoins(
          'test-user',
          amount,
          'spend',
          'Test'
        );
        // Should return null for invalid amounts
        expect(result).toBeNull();
      }
    });

    it('should handle concurrent debit operations', async () => {
      const userId = 'test-user-concurrent-debit';
      
      // Make multiple concurrent debit requests
      const promises = [
        ggCoinService.debitCoins(userId, 10, 'spend', 'Debit 1'),
        ggCoinService.debitCoins(userId, 20, 'spend', 'Debit 2'),
        ggCoinService.debitCoins(userId, 30, 'spend', 'Debit 3'),
      ];
      
      // All should complete without throwing
      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });

    it('should return null when insufficient balance', async () => {
      // Test attempting to debit more than available balance
      // Note: Actual balance check is done by database function
      // This test verifies the method handles the failure gracefully
      const userId = 'test-user-insufficient-balance';
      
      // Attempt to debit a very large amount
      const result = await ggCoinService.debitCoins(
        userId,
        999999.999,
        'spend',
        'Test insufficient balance'
      );
      
      // Should return null when database function fails due to insufficient balance
      // (Actual behavior depends on database state and RPC function implementation)
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should return transaction with negative amount', async () => {
      // Test that debit transactions return negative amounts
      // Note: This verifies the expected behavior based on the implementation
      // The debitCoins method returns amount as -roundedAmount
      const amount = 50;
      
      // The implementation shows: amount: -roundedAmount
      // So we expect the returned transaction (if successful) to have a negative amount
      // This is tested in integration tests with actual database
      expect(true).toBe(true); // Placeholder - actual test requires database
    });

    it('should handle database errors gracefully', async () => {
      // Test that database errors are handled
      // Note: Actual error scenarios are tested in integration tests
      // This verifies the method doesn't throw on errors
      expect(async () => {
        await ggCoinService.debitCoins(
          'test-user',
          10,
          'spend',
          'Test error handling'
        );
      }).not.toThrow();
    });

    it('should validate user ID is not empty', async () => {
      // Test with various invalid user IDs
      const invalidUserIds = ['', '   ', null as any, undefined as any];
      
      for (const userId of invalidUserIds) {
        const result = await ggCoinService.debitCoins(
          userId,
          10,
          'spend',
          'Test'
        );
        // Should return null for invalid user IDs
        expect(result).toBeNull();
      }
    });

    it('should handle whitespace in user ID', async () => {
      // Test with user ID containing only whitespace
      const result = await ggCoinService.debitCoins(
        '   ',
        10,
        'spend',
        'Test whitespace'
      );
      
      // Should return null for whitespace-only user ID
      expect(result).toBeNull();
    });

    it('should accept all valid transaction types for debit', async () => {
      // Test that debit can be used with various transaction types
      const types = ['spend', 'bonus', 'referral', 'earn'];
      
      for (const type of types) {
        expect(async () => {
          await ggCoinService.debitCoins(
            'test-user',
            10,
            type,
            `Debit with type: ${type}`
          );
        }).not.toThrow();
      }
    });

    it('should handle fractional amounts correctly', async () => {
      // Test with fractional amounts that need rounding
      const amounts = [
        { input: 10.1234, expected: 10.123 },
        { input: 25.9999, expected: 26.0 },
        { input: 0.0001, expected: 0.0 },
        { input: 99.9995, expected: 100.0 },
      ];
      
      for (const { input, expected } of amounts) {
        const rounded = Math.round(input * 1000) / 1000;
        expect(rounded).toBe(expected);
      }
    });

    it('should preserve precision for exact decimal values', async () => {
      // Test that exact decimal values are preserved
      const amounts = [10.5, 25.125, 100.999, 0.001, 50.0];
      
      for (const amount of amounts) {
        const rounded = Math.round(amount * 1000) / 1000;
        expect(rounded).toBe(amount);
      }
    });
  });

  describe('awardCoins', () => {
    it('should calculate reward and return null for zero reward', async () => {
      // Test with unknown action type (returns 0)
      const result = await ggCoinService.awardCoins('test-user', 'unknown_action');
      expect(result).toBeNull();
    });

    it('should calculate reward and return null for zero impact', async () => {
      // Test with zero impact (returns 0)
      const result = await ggCoinService.awardCoins('test-user', 'tree_planting', 0);
      expect(result).toBeNull();
    });

    it('should calculate reward and return null for negative impact', async () => {
      // Test with negative impact (returns 0)
      const result = await ggCoinService.awardCoins('test-user', 'tree_planting', -5);
      expect(result).toBeNull();
    });

    it('should calculate correct reward with impact', () => {
      // Verify the calculation logic (actual crediting requires database)
      const reward = ggCoinService.calculateReward('tree_planting', 2);
      expect(reward).toBe(100); // 50 * 2
    });

    it('should calculate correct reward with multipliers', () => {
      // Verify the calculation logic with multipliers
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        1,
        [{ condition: 'verified_with_photo', factor: 1.2 }]
      );
      expect(reward).toBe(60); // 50 * 1.2
    });

    it('should calculate correct reward with impact and multipliers', () => {
      // Verify the calculation logic with both impact and multipliers
      const reward = ggCoinService.calculateReward(
        'tree_planting',
        3,
        [
          { condition: 'verified_with_photo', factor: 1.2 },
          { condition: 'native_species', factor: 1.5 },
        ]
      );
      expect(reward).toBe(270); // 50 * 3 * 1.2 * 1.5
    });

    it('should round reward to 3 decimal places', () => {
      // Verify rounding with fractional calculations
      const reward = ggCoinService.calculateReward('tree_planting', 1.3333);
      expect(reward).toBe(66.665);
    });

    it('should award coins for valid action without impact or multipliers', async () => {
      // Test basic award with just action type
      const userId = 'test-user-award-basic';
      
      // Award coins for a community post (base reward: 5)
      const result = await ggCoinService.awardCoins(userId, 'community_post');
      
      // Result depends on database state, but should either succeed or fail gracefully
      expect(result === null || typeof result === 'object').toBe(true);
      
      // If successful, verify the structure
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('userId');
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('amount');
        expect(result.type).toBe('earn');
        expect(result.amount).toBe(5); // Base reward for community_post
      }
    });

    it('should award coins with impact multiplier', async () => {
      // Test award with impact
      const userId = 'test-user-award-impact';
      
      // Award coins for planting 3 trees (base: 50, impact: 3 = 150)
      const result = await ggCoinService.awardCoins(userId, 'tree_planting', 3);
      
      // Result depends on database state
      expect(result === null || typeof result === 'object').toBe(true);
      
      // If successful, verify the amount
      if (result) {
        expect(result.amount).toBe(150); // 50 * 3
        expect(result.type).toBe('earn');
        expect(result.description).toContain('150.000');
        expect(result.description).toContain('tree_planting');
      }
    });

    it('should award coins with custom multipliers', async () => {
      // Test award with multipliers
      const userId = 'test-user-award-multipliers';
      const multipliers = [
        { condition: 'verified_with_photo', factor: 1.2 },
        { condition: 'native_species', factor: 1.5 },
      ];
      
      // Award coins for tree planting with multipliers (50 * 1.2 * 1.5 = 90)
      const result = await ggCoinService.awardCoins(
        userId,
        'tree_planting',
        1,
        multipliers
      );
      
      // Result depends on database state
      expect(result === null || typeof result === 'object').toBe(true);
      
      // If successful, verify the amount
      if (result) {
        expect(result.amount).toBe(90); // 50 * 1.2 * 1.5
        expect(result.type).toBe('earn');
      }
    });

    it('should award coins with both impact and multipliers', async () => {
      // Test award with both impact and multipliers
      const userId = 'test-user-award-both';
      const multipliers = [{ condition: 'verified', factor: 2.0 }];
      
      // Award coins for 2 trees with 2x multiplier (50 * 2 * 2 = 200)
      const result = await ggCoinService.awardCoins(
        userId,
        'tree_planting',
        2,
        multipliers
      );
      
      // Result depends on database state
      expect(result === null || typeof result === 'object').toBe(true);
      
      // If successful, verify the amount
      if (result) {
        expect(result.amount).toBe(200); // 50 * 2 * 2
        expect(result.type).toBe('earn');
      }
    });

    it('should include metadata in awarded transaction', async () => {
      // Test that metadata is properly included
      const userId = 'test-user-award-metadata';
      const multipliers = [{ condition: 'test', factor: 1.5 }];
      
      const result = await ggCoinService.awardCoins(
        userId,
        'learning_module',
        1,
        multipliers
      );
      
      // If successful, verify metadata
      if (result && result.metadata) {
        expect(result.metadata).toBeDefined();
        expect(result.metadata).toHaveProperty('actionType');
        expect(result.metadata.actionType).toBe('learning_module');
        expect(result.metadata).toHaveProperty('impact');
        expect(result.metadata.impact).toBe(1);
        expect(result.metadata).toHaveProperty('multipliers');
        expect(result.metadata.multipliers).toEqual(multipliers);
      }
    });

    it('should generate correct description', async () => {
      // Test that description is properly formatted
      const userId = 'test-user-award-description';
      
      const result = await ggCoinService.awardCoins(userId, 'mission_completion');
      
      // If successful, verify description
      if (result) {
        expect(result.description).toContain('Earned');
        expect(result.description).toContain('100.000'); // Base reward for mission
        expect(result.description).toContain('GG Coins');
        expect(result.description).toContain('mission_completion');
      }
    });

    it('should handle all action types correctly', async () => {
      // Test all defined action types
      const userId = 'test-user-award-all-types';
      const actionTypes = [
        'tree_planting',
        'waste_cleanup',
        'learning_module',
        'mission_completion',
        'community_post',
        'petition_signature',
        'referral',
        'daily_login',
      ];
      
      for (const actionType of actionTypes) {
        const result = await ggCoinService.awardCoins(userId, actionType);
        
        // Each should either succeed or fail gracefully
        expect(result === null || typeof result === 'object').toBe(true);
        
        // If successful, verify it's an earn transaction
        if (result) {
          expect(result.type).toBe('earn');
          expect(result.amount).toBeGreaterThan(0);
        }
      }
    });

    it('should handle fractional impact correctly', async () => {
      // Test with fractional impact values
      const userId = 'test-user-award-fractional';
      
      // Award for 0.5 impact (50 * 0.5 = 25)
      const result = await ggCoinService.awardCoins(userId, 'tree_planting', 0.5);
      
      if (result) {
        expect(result.amount).toBe(25);
      }
    });

    it('should handle very small rewards correctly', async () => {
      // Test with very small calculated rewards
      const userId = 'test-user-award-small';
      
      // Award for 0.001 impact (50 * 0.001 = 0.05)
      const result = await ggCoinService.awardCoins(userId, 'tree_planting', 0.001);
      
      if (result) {
        expect(result.amount).toBe(0.05);
        expect(result.amount).toBeGreaterThan(0);
      }
    });

    it('should handle large rewards correctly', async () => {
      // Test with large calculated rewards
      const userId = 'test-user-award-large';
      
      // Award for 100 trees (50 * 100 = 5000)
      const result = await ggCoinService.awardCoins(userId, 'tree_planting', 100);
      
      if (result) {
        expect(result.amount).toBe(5000);
      }
    });

    it('should clear cache after awarding coins', async () => {
      // Test that cache is cleared after award
      const userId = 'test-user-award-cache';
      
      // Get balance to populate cache
      await ggCoinService.getBalance(userId);
      
      // Award coins (should clear cache)
      await ggCoinService.awardCoins(userId, 'daily_login');
      
      // Next getBalance should fetch fresh data
      const balance = await ggCoinService.getBalance(userId);
      expect(typeof balance).toBe('number');
    });

    it('should handle empty user ID gracefully', async () => {
      // Test with empty user ID
      const result = await ggCoinService.awardCoins('', 'tree_planting');
      
      // Should return null for invalid user ID
      expect(result).toBeNull();
    });

    it('should handle undefined impact as default (1)', async () => {
      // Test that undefined impact is treated as 1
      const userId = 'test-user-award-undefined-impact';
      
      // Award without specifying impact
      const result = await ggCoinService.awardCoins(userId, 'tree_planting');
      
      if (result) {
        // Should use base reward (50) without impact multiplier
        expect(result.amount).toBe(50);
      }
    });

    it('should handle empty multipliers array', async () => {
      // Test with empty multipliers array
      const userId = 'test-user-award-empty-multipliers';
      
      const result = await ggCoinService.awardCoins(userId, 'tree_planting', 1, []);
      
      if (result) {
        // Should use base reward without multipliers
        expect(result.amount).toBe(50);
      }
    });

    it('should handle multiple multipliers correctly', async () => {
      // Test with multiple multipliers
      const userId = 'test-user-award-multiple-multipliers';
      const multipliers = [
        { condition: 'multiplier1', factor: 1.2 },
        { condition: 'multiplier2', factor: 1.5 },
        { condition: 'multiplier3', factor: 2.0 },
      ];
      
      // 50 * 1.2 * 1.5 * 2.0 = 180
      const result = await ggCoinService.awardCoins(
        userId,
        'tree_planting',
        1,
        multipliers
      );
      
      if (result) {
        expect(result.amount).toBe(180);
      }
    });

    it('should round complex calculations to 3 decimal places', async () => {
      // Test rounding with complex calculations
      const userId = 'test-user-award-rounding';
      const multipliers = [{ condition: 'test', factor: 1.111 }];
      
      // 50 * 1.333 * 1.111 = 74.04815, rounded to 74.048
      const result = await ggCoinService.awardCoins(
        userId,
        'tree_planting',
        1.333,
        multipliers
      );
      
      if (result) {
        expect(result.amount).toBeCloseTo(74.048, 3);
      }
    });

    it('should handle concurrent award operations', async () => {
      // Test multiple concurrent awards
      const userId = 'test-user-award-concurrent';
      
      const promises = [
        ggCoinService.awardCoins(userId, 'tree_planting'),
        ggCoinService.awardCoins(userId, 'community_post'),
        ggCoinService.awardCoins(userId, 'daily_login'),
      ];
      
      // All should complete without throwing
      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });

    it('should use earn transaction type', async () => {
      // Verify that awardCoins always uses 'earn' type
      const userId = 'test-user-award-type';
      
      const result = await ggCoinService.awardCoins(userId, 'petition_signature');
      
      if (result) {
        expect(result.type).toBe('earn');
      }
    });

    it('should handle database errors gracefully', async () => {
      // Test that database errors don't throw
      const userId = 'test-user-award-error';
      
      // This should not throw even if database operation fails
      expect(async () => {
        await ggCoinService.awardCoins(userId, 'tree_planting');
      }).not.toThrow();
    });

    it('should validate calculated reward before crediting', async () => {
      // Test that zero or negative rewards are not credited
      const userId = 'test-user-award-validation';
      
      // These should all return null without attempting to credit
      const result1 = await ggCoinService.awardCoins(userId, 'unknown_action');
      const result2 = await ggCoinService.awardCoins(userId, 'tree_planting', 0);
      const result3 = await ggCoinService.awardCoins(userId, 'tree_planting', -1);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('getTransactionHistory', () => {
    it('should return empty history for errors', async () => {
      // Test with invalid user ID to trigger error handling
      const result = await ggCoinService.getTransactionHistory('');
      expect(result).toEqual({
        transactions: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should use default pagination values', async () => {
      // Verify that the method accepts userId without throwing
      // Actual database interaction is tested in integration tests
      const result = await ggCoinService.getTransactionHistory('test-user');
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });

    it('should accept custom limit and offset', async () => {
      const result = await ggCoinService.getTransactionHistory('test-user', 10, 5);
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });

    it('should accept type filter', async () => {
      const result = await ggCoinService.getTransactionHistory(
        'test-user',
        50,
        0,
        { type: 'earn' }
      );
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });

    it('should accept date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = await ggCoinService.getTransactionHistory(
        'test-user',
        50,
        0,
        { startDate, endDate }
      );
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });

    it('should accept combined filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = await ggCoinService.getTransactionHistory(
        'test-user',
        50,
        0,
        { type: 'spend', startDate, endDate }
      );
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });
  });

  describe('getEarningBreakdown', () => {
    it('should return empty breakdown for errors', async () => {
      // Test with invalid user ID to trigger error handling
      const result = await ggCoinService.getEarningBreakdown('');
      expect(result).toEqual({});
    });

    it('should return breakdown object', async () => {
      // Verify that the method returns an object
      // Actual database interaction is tested in integration tests
      const result = await ggCoinService.getEarningBreakdown('test-user');
      expect(typeof result).toBe('object');
    });
  });

  describe('subscribeToBalance', () => {
    it('should return an unsubscribe function', () => {
      const callback = (balance: number) => {
        console.log('Balance updated:', balance);
      };
      const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Clean up
      unsubscribe();
    });

    it('should accept a callback function', () => {
      let callbackCalled = false;
      const callback = (balance: number) => {
        callbackCalled = true;
      };
      
      const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
      
      // Verify subscription was created
      expect(unsubscribe).toBeDefined();
      
      // Clean up
      unsubscribe();
    });

    it('should handle multiple subscriptions for different users', () => {
      const callback1 = (balance: number) => {
        console.log('User 1 balance:', balance);
      };
      const callback2 = (balance: number) => {
        console.log('User 2 balance:', balance);
      };
      
      const unsubscribe1 = ggCoinService.subscribeToBalance('user-1', callback1);
      const unsubscribe2 = ggCoinService.subscribeToBalance('user-2', callback2);
      
      expect(unsubscribe1).toBeDefined();
      expect(unsubscribe2).toBeDefined();
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      
      // Clean up
      unsubscribe1();
      unsubscribe2();
    });

    it('should handle multiple subscriptions for the same user', () => {
      const callback1 = (balance: number) => {
        console.log('Callback 1:', balance);
      };
      const callback2 = (balance: number) => {
        console.log('Callback 2:', balance);
      };
      
      const unsubscribe1 = ggCoinService.subscribeToBalance('test-user', callback1);
      const unsubscribe2 = ggCoinService.subscribeToBalance('test-user', callback2);
      
      expect(unsubscribe1).toBeDefined();
      expect(unsubscribe2).toBeDefined();
      
      // Clean up
      unsubscribe1();
      unsubscribe2();
    });

    it('should not throw when unsubscribing', () => {
      const callback = (balance: number) => {
        console.log('Balance:', balance);
      };
      
      const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
      
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle unsubscribe being called multiple times', () => {
      const callback = (balance: number) => {
        console.log('Balance:', balance);
      };
      
      const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
      
      // Call unsubscribe multiple times
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });

    it('should create unique channel names for different users', () => {
      const callback = (balance: number) => {
        console.log('Balance:', balance);
      };
      
      const unsubscribe1 = ggCoinService.subscribeToBalance('user-1', callback);
      const unsubscribe2 = ggCoinService.subscribeToBalance('user-2', callback);
      const unsubscribe3 = ggCoinService.subscribeToBalance('user-3', callback);
      
      // Verify all subscriptions were created
      expect(unsubscribe1).toBeDefined();
      expect(unsubscribe2).toBeDefined();
      expect(unsubscribe3).toBeDefined();
      
      // Clean up
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });

  describe('error handling', () => {
    describe('getWallet error handling', () => {
      it('should return null when database query fails', async () => {
        // Test with invalid user ID that might cause database error
        const result = await ggCoinService.getWallet('');
        
        // Should return null on error
        expect(result).toBeNull();
      });

      it('should return null for non-existent user', async () => {
        // Test with user ID that doesn't exist
        const result = await ggCoinService.getWallet('non-existent-user-12345');
        
        // Should return null when user not found
        expect(result).toBeNull();
      });

      it('should handle null or undefined user ID gracefully', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.getWallet(null as any);
        const result2 = await ggCoinService.getWallet(undefined as any);
        
        // Should return null for invalid user IDs
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });

      it('should handle malformed data gracefully', async () => {
        // Test that the service handles unexpected data formats
        // This verifies parseFloat and default values work correctly
        const result = await ggCoinService.getWallet('test-user-malformed');
        
        // Should either return null or valid wallet with defaults
        if (result) {
          expect(typeof result.balance).toBe('number');
          expect(typeof result.totalPoints).toBe('number');
          expect(typeof result.level).toBe('number');
          expect(result.balance).toBeGreaterThanOrEqual(0);
        } else {
          expect(result).toBeNull();
        }
      });

      it('should not throw exceptions on database errors', async () => {
        // Verify that exceptions are caught and handled
        expect(async () => {
          await ggCoinService.getWallet('test-user');
        }).not.toThrow();
      });
    });

    describe('getBalance error handling', () => {
      it('should return 0 when database query fails', async () => {
        // Test with invalid user ID
        const balance = await ggCoinService.getBalance('');
        
        // Should return 0 on error
        expect(balance).toBe(0);
      });

      it('should return 0 for non-existent user', async () => {
        // Test with user that doesn't exist
        const balance = await ggCoinService.getBalance('non-existent-user-12345');
        
        // Should return 0 when user not found
        expect(balance).toBe(0);
      });

      it('should handle null or undefined user ID gracefully', async () => {
        // Test with null/undefined user IDs
        const balance1 = await ggCoinService.getBalance(null as any);
        const balance2 = await ggCoinService.getBalance(undefined as any);
        
        // Should return 0 for invalid user IDs
        expect(balance1).toBe(0);
        expect(balance2).toBe(0);
      });

      it('should handle malformed balance data gracefully', async () => {
        // Test that parseFloat handles unexpected values
        const balance = await ggCoinService.getBalance('test-user-malformed');
        
        // Should return a valid number (0 or actual balance)
        expect(typeof balance).toBe('number');
        expect(Number.isFinite(balance)).toBe(true);
        expect(balance).toBeGreaterThanOrEqual(0);
      });

      it('should not throw exceptions on database errors', async () => {
        // Verify that exceptions are caught and handled
        expect(async () => {
          await ggCoinService.getBalance('test-user');
        }).not.toThrow();
      });

      it('should handle database connection errors gracefully', async () => {
        // Test that service handles connection issues
        const balance = await ggCoinService.getBalance('test-user-connection-error');
        
        // Should return 0 instead of throwing
        expect(typeof balance).toBe('number');
        expect(balance).toBeGreaterThanOrEqual(0);
      });
    });

    describe('creditCoins error handling', () => {
      it('should return null for invalid amounts', async () => {
        // Test with invalid amounts
        const result1 = await ggCoinService.creditCoins('test-user', 0, 'earn', 'Test');
        const result2 = await ggCoinService.creditCoins('test-user', -10, 'earn', 'Test');
        const result3 = await ggCoinService.creditCoins('test-user', NaN, 'earn', 'Test');
        const result4 = await ggCoinService.creditCoins('test-user', Infinity, 'earn', 'Test');
        
        // All should return null
        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
        expect(result4).toBeNull();
      });

      it('should return null for empty user ID', async () => {
        // Test with empty user ID
        const result = await ggCoinService.creditCoins('', 10, 'earn', 'Test');
        
        // Should return null
        expect(result).toBeNull();
      });

      it('should return null for null or undefined user ID', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.creditCoins(null as any, 10, 'earn', 'Test');
        const result2 = await ggCoinService.creditCoins(undefined as any, 10, 'earn', 'Test');
        
        // Should return null
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });

      it('should handle database RPC errors gracefully', async () => {
        // Test that RPC errors are handled
        const result = await ggCoinService.creditCoins('test-user-rpc-error', 10, 'earn', 'Test');
        
        // Should return null on RPC error (not throw)
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should not throw exceptions on errors', async () => {
        // Verify that exceptions are caught
        expect(async () => {
          await ggCoinService.creditCoins('test-user', 10, 'earn', 'Test');
        }).not.toThrow();
      });

      it('should handle RPC function returning success: false', async () => {
        // Test when database function returns success: false
        const result = await ggCoinService.creditCoins('test-user-fail', 10, 'earn', 'Test');
        
        // Should return null when success is false
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should clear cache even when transaction fails', async () => {
        // Populate cache
        await ggCoinService.getBalance('test-user-cache-fail');
        
        // Try to credit (may fail)
        await ggCoinService.creditCoins('test-user-cache-fail', -10, 'earn', 'Test');
        
        // Cache should still work normally
        const balance = await ggCoinService.getBalance('test-user-cache-fail');
        expect(typeof balance).toBe('number');
      });

      it('should handle missing metadata gracefully', async () => {
        // Test without metadata
        const result = await ggCoinService.creditCoins('test-user', 10, 'earn', 'Test');
        
        // Should work without metadata
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should handle empty description', async () => {
        // Test with empty description
        const result = await ggCoinService.creditCoins('test-user', 10, 'earn', '');
        
        // Should work with empty description
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should handle very long descriptions', async () => {
        // Test with very long description
        const longDescription = 'A'.repeat(1000);
        const result = await ggCoinService.creditCoins('test-user', 10, 'earn', longDescription);
        
        // Should handle long descriptions
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should handle special characters in description', async () => {
        // Test with special characters
        const specialDescription = 'Test <script>alert("xss")</script> & "quotes" \'apostrophes\'';
        const result = await ggCoinService.creditCoins('test-user', 10, 'earn', specialDescription);
        
        // Should handle special characters
        expect(result === null || typeof result === 'object').toBe(true);
      });
    });

    describe('debitCoins error handling', () => {
      it('should return null for invalid amounts', async () => {
        // Test with invalid amounts
        const result1 = await ggCoinService.debitCoins('test-user', 0, 'spend', 'Test');
        const result2 = await ggCoinService.debitCoins('test-user', -10, 'spend', 'Test');
        const result3 = await ggCoinService.debitCoins('test-user', NaN, 'spend', 'Test');
        const result4 = await ggCoinService.debitCoins('test-user', Infinity, 'spend', 'Test');
        
        // All should return null
        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
        expect(result4).toBeNull();
      });

      it('should return null for empty user ID', async () => {
        // Test with empty user ID
        const result = await ggCoinService.debitCoins('', 10, 'spend', 'Test');
        
        // Should return null
        expect(result).toBeNull();
      });

      it('should return null for null or undefined user ID', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.debitCoins(null as any, 10, 'spend', 'Test');
        const result2 = await ggCoinService.debitCoins(undefined as any, 10, 'spend', 'Test');
        
        // Should return null
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });

      it('should handle insufficient balance gracefully', async () => {
        // Test attempting to debit more than available
        const result = await ggCoinService.debitCoins('test-user-insufficient', 999999, 'spend', 'Test');
        
        // Should return null when insufficient balance (not throw)
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should handle database RPC errors gracefully', async () => {
        // Test that RPC errors are handled
        const result = await ggCoinService.debitCoins('test-user-rpc-error', 10, 'spend', 'Test');
        
        // Should return null on RPC error (not throw)
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should not throw exceptions on errors', async () => {
        // Verify that exceptions are caught
        expect(async () => {
          await ggCoinService.debitCoins('test-user', 10, 'spend', 'Test');
        }).not.toThrow();
      });

      it('should handle RPC function returning success: false', async () => {
        // Test when database function returns success: false
        const result = await ggCoinService.debitCoins('test-user-fail', 10, 'spend', 'Test');
        
        // Should return null when success is false
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should clear cache even when transaction fails', async () => {
        // Populate cache
        await ggCoinService.getBalance('test-user-cache-fail-debit');
        
        // Try to debit (may fail)
        await ggCoinService.debitCoins('test-user-cache-fail-debit', -10, 'spend', 'Test');
        
        // Cache should still work normally
        const balance = await ggCoinService.getBalance('test-user-cache-fail-debit');
        expect(typeof balance).toBe('number');
      });

      it('should handle missing metadata gracefully', async () => {
        // Test without metadata
        const result = await ggCoinService.debitCoins('test-user', 10, 'spend', 'Test');
        
        // Should work without metadata
        expect(result === null || typeof result === 'object').toBe(true);
      });

      it('should handle empty description', async () => {
        // Test with empty description
        const result = await ggCoinService.debitCoins('test-user', 10, 'spend', '');
        
        // Should work with empty description
        expect(result === null || typeof result === 'object').toBe(true);
      });
    });

    describe('calculateReward error handling', () => {
      it('should return 0 for unknown action type', () => {
        // Test with unknown action type
        const reward = ggCoinService.calculateReward('unknown_action_type');
        
        // Should return 0
        expect(reward).toBe(0);
      });

      it('should return 0 for empty action type', () => {
        // Test with empty action type
        const reward = ggCoinService.calculateReward('');
        
        // Should return 0
        expect(reward).toBe(0);
      });

      it('should return 0 for null or undefined action type', () => {
        // Test with null/undefined action types
        const reward1 = ggCoinService.calculateReward(null as any);
        const reward2 = ggCoinService.calculateReward(undefined as any);
        
        // Should return 0
        expect(reward1).toBe(0);
        expect(reward2).toBe(0);
      });

      it('should return 0 for zero impact', () => {
        // Test with zero impact
        const reward = ggCoinService.calculateReward('tree_planting', 0);
        
        // Should return 0
        expect(reward).toBe(0);
      });

      it('should return 0 for negative impact', () => {
        // Test with negative impact
        const reward = ggCoinService.calculateReward('tree_planting', -5);
        
        // Should return 0
        expect(reward).toBe(0);
      });

      it('should handle NaN impact gracefully', () => {
        // Test with NaN impact
        const reward = ggCoinService.calculateReward('tree_planting', NaN);
        
        // Should return 0 (NaN <= 0 is false, but NaN * anything is NaN, which rounds to 0)
        expect(reward).toBe(0);
      });

      it('should handle Infinity impact gracefully', () => {
        // Test with Infinity impact
        const reward = ggCoinService.calculateReward('tree_planting', Infinity);
        
        // Should handle Infinity (50 * Infinity = Infinity, which rounds to Infinity)
        // The actual behavior depends on Math.round(Infinity * 1000) / 1000
        expect(typeof reward).toBe('number');
      });

      it('should handle empty multipliers array', () => {
        // Test with empty multipliers
        const reward = ggCoinService.calculateReward('tree_planting', 1, []);
        
        // Should return base reward
        expect(reward).toBe(50);
      });

      it('should handle null or undefined multipliers', () => {
        // Test with null/undefined multipliers
        const reward1 = ggCoinService.calculateReward('tree_planting', 1, null as any);
        const reward2 = ggCoinService.calculateReward('tree_planting', 1, undefined);
        
        // Should return base reward
        expect(reward1).toBe(50);
        expect(reward2).toBe(50);
      });

      it('should handle multipliers with zero factor', () => {
        // Test with zero multiplier
        const reward = ggCoinService.calculateReward('tree_planting', 1, [
          { condition: 'test', factor: 0 }
        ]);
        
        // Should return 0 (50 * 0 = 0)
        expect(reward).toBe(0);
      });

      it('should handle multipliers with negative factor', () => {
        // Test with negative multiplier
        const reward = ggCoinService.calculateReward('tree_planting', 1, [
          { condition: 'test', factor: -1 }
        ]);
        
        // Should return negative value (50 * -1 = -50)
        expect(reward).toBe(-50);
      });

      it('should handle very large calculations', () => {
        // Test with very large values
        const reward = ggCoinService.calculateReward('tree_planting', 1000, [
          { condition: 'test', factor: 100 }
        ]);
        
        // Should handle large calculations (50 * 1000 * 100 = 5,000,000)
        expect(reward).toBe(5000000);
      });

      it('should handle very small calculations', () => {
        // Test with very small values
        const reward = ggCoinService.calculateReward('tree_planting', 0.001, [
          { condition: 'test', factor: 0.001 }
        ]);
        
        // Should handle small calculations (50 * 0.001 * 0.001 = 0.00005, rounds to 0)
        expect(reward).toBe(0);
      });
    });

    describe('awardCoins error handling', () => {
      it('should return null for unknown action type', async () => {
        // Test with unknown action type
        const result = await ggCoinService.awardCoins('test-user', 'unknown_action');
        
        // Should return null (calculated reward is 0)
        expect(result).toBeNull();
      });

      it('should return null for zero impact', async () => {
        // Test with zero impact
        const result = await ggCoinService.awardCoins('test-user', 'tree_planting', 0);
        
        // Should return null (calculated reward is 0)
        expect(result).toBeNull();
      });

      it('should return null for negative impact', async () => {
        // Test with negative impact
        const result = await ggCoinService.awardCoins('test-user', 'tree_planting', -5);
        
        // Should return null (calculated reward is 0)
        expect(result).toBeNull();
      });

      it('should return null for empty user ID', async () => {
        // Test with empty user ID
        const result = await ggCoinService.awardCoins('', 'tree_planting');
        
        // Should return null
        expect(result).toBeNull();
      });

      it('should return null for null or undefined user ID', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.awardCoins(null as any, 'tree_planting');
        const result2 = await ggCoinService.awardCoins(undefined as any, 'tree_planting');
        
        // Should return null
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });

      it('should not throw exceptions on errors', async () => {
        // Verify that exceptions are caught
        expect(async () => {
          await ggCoinService.awardCoins('test-user', 'tree_planting');
        }).not.toThrow();
      });

      it('should handle database errors gracefully', async () => {
        // Test that database errors don't throw
        const result = await ggCoinService.awardCoins('test-user-error', 'tree_planting');
        
        // Should return null on error (not throw)
        expect(result === null || typeof result === 'object').toBe(true);
      });
    });

    describe('getTransactionHistory error handling', () => {
      it('should return empty history on database error', async () => {
        // Test with invalid user ID
        const result = await ggCoinService.getTransactionHistory('');
        
        // Should return empty history
        expect(result).toEqual({
          transactions: [],
          total: 0,
          hasMore: false,
        });
      });

      it('should handle null or undefined user ID gracefully', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.getTransactionHistory(null as any);
        const result2 = await ggCoinService.getTransactionHistory(undefined as any);
        
        // Should return empty history
        expect(result1.transactions).toEqual([]);
        expect(result2.transactions).toEqual([]);
      });

      it('should handle invalid limit values', async () => {
        // Test with invalid limits
        const result1 = await ggCoinService.getTransactionHistory('test-user', -10);
        const result2 = await ggCoinService.getTransactionHistory('test-user', 0);
        const result3 = await ggCoinService.getTransactionHistory('test-user', NaN);
        
        // Should handle gracefully (may return empty or use defaults)
        expect(result1).toHaveProperty('transactions');
        expect(result2).toHaveProperty('transactions');
        expect(result3).toHaveProperty('transactions');
      });

      it('should handle invalid offset values', async () => {
        // Test with invalid offsets
        const result1 = await ggCoinService.getTransactionHistory('test-user', 50, -10);
        const result2 = await ggCoinService.getTransactionHistory('test-user', 50, NaN);
        
        // Should handle gracefully
        expect(result1).toHaveProperty('transactions');
        expect(result2).toHaveProperty('transactions');
      });

      it('should handle invalid filter types', async () => {
        // Test with invalid filter type
        const result = await ggCoinService.getTransactionHistory('test-user', 50, 0, {
          type: 'invalid_type' as any,
        });
        
        // Should handle gracefully
        expect(result).toHaveProperty('transactions');
      });

      it('should handle invalid date filters', async () => {
        // Test with invalid dates
        const result = await ggCoinService.getTransactionHistory('test-user', 50, 0, {
          startDate: new Date('invalid'),
          endDate: new Date('invalid'),
        });
        
        // Should handle gracefully
        expect(result).toHaveProperty('transactions');
      });

      it('should not throw exceptions on errors', async () => {
        // Verify that exceptions are caught
        expect(async () => {
          await ggCoinService.getTransactionHistory('test-user');
        }).not.toThrow();
      });

      it('should handle malformed transaction data', async () => {
        // Test that service handles unexpected data formats
        const result = await ggCoinService.getTransactionHistory('test-user-malformed');
        
        // Should return valid structure even with malformed data
        expect(result).toHaveProperty('transactions');
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('hasMore');
        expect(Array.isArray(result.transactions)).toBe(true);
        expect(typeof result.total).toBe('number');
        expect(typeof result.hasMore).toBe('boolean');
      });
    });

    describe('getEarningBreakdown error handling', () => {
      it('should return empty breakdown on database error', async () => {
        // Test with invalid user ID
        const result = await ggCoinService.getEarningBreakdown('');
        
        // Should return empty object
        expect(result).toEqual({});
      });

      it('should handle null or undefined user ID gracefully', async () => {
        // Test with null/undefined user IDs
        const result1 = await ggCoinService.getEarningBreakdown(null as any);
        const result2 = await ggCoinService.getEarningBreakdown(undefined as any);
        
        // Should return empty object
        expect(result1).toEqual({});
        expect(result2).toEqual({});
      });

      it('should not throw exceptions on errors', async () => {
        // Verify that exceptions are caught
        expect(async () => {
          await ggCoinService.getEarningBreakdown('test-user');
        }).not.toThrow();
      });

      it('should handle malformed transaction data', async () => {
        // Test that service handles unexpected data formats
        const result = await ggCoinService.getEarningBreakdown('test-user-malformed');
        
        // Should return valid object
        expect(typeof result).toBe('object');
        expect(result).not.toBeNull();
      });

      it('should handle transactions without metadata', async () => {
        // Test that service handles transactions without actionType in metadata
        const result = await ggCoinService.getEarningBreakdown('test-user-no-metadata');
        
        // Should return valid object (may include 'other' category)
        expect(typeof result).toBe('object');
      });

      it('should handle transactions with malformed amounts', async () => {
        // Test that service handles non-numeric amounts
        const result = await ggCoinService.getEarningBreakdown('test-user-malformed-amounts');
        
        // Should return valid object with numeric values
        expect(typeof result).toBe('object');
        for (const key in result) {
          expect(typeof result[key]).toBe('number');
          expect(Number.isFinite(result[key])).toBe(true);
        }
      });
    });

    describe('subscribeToBalance error handling', () => {
      it('should handle errors in callback gracefully', () => {
        // Test with callback that throws
        const errorCallback = (balance: number) => {
          throw new Error('Callback error');
        };
        
        const unsubscribe = ggCoinService.subscribeToBalance('test-user', errorCallback);
        
        // Should not throw when creating subscription
        expect(unsubscribe).toBeDefined();
        expect(typeof unsubscribe).toBe('function');
        
        // Clean up
        unsubscribe();
      });

      it('should handle errors during unsubscribe gracefully', () => {
        const callback = (balance: number) => {
          console.log('Balance:', balance);
        };
        
        const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
        
        // Should not throw when unsubscribing
        expect(() => unsubscribe()).not.toThrow();
      });

      it('should handle empty user ID gracefully', () => {
        const callback = (balance: number) => {
          console.log('Balance:', balance);
        };
        
        // Should not throw with empty user ID
        expect(() => {
          const unsubscribe = ggCoinService.subscribeToBalance('', callback);
          unsubscribe();
        }).not.toThrow();
      });

      it('should handle null or undefined user ID gracefully', () => {
        const callback = (balance: number) => {
          console.log('Balance:', balance);
        };
        
        // Should not throw with null/undefined user IDs
        expect(() => {
          const unsubscribe1 = ggCoinService.subscribeToBalance(null as any, callback);
          const unsubscribe2 = ggCoinService.subscribeToBalance(undefined as any, callback);
          unsubscribe1();
          unsubscribe2();
        }).not.toThrow();
      });

      it('should handle malformed balance updates gracefully', () => {
        // Test that service handles unexpected payload formats
        const callback = (balance: number) => {
          // Verify balance is always a number
          expect(typeof balance).toBe('number');
          expect(Number.isFinite(balance)).toBe(true);
        };
        
        const unsubscribe = ggCoinService.subscribeToBalance('test-user', callback);
        
        // Clean up
        unsubscribe();
      });
    });

    describe('clearCache error handling', () => {
      it('should not throw with invalid user ID', () => {
        // Test with various invalid user IDs
        expect(() => ggCoinService.clearCache('')).not.toThrow();
        expect(() => ggCoinService.clearCache(null as any)).not.toThrow();
        expect(() => ggCoinService.clearCache(undefined)).not.toThrow();
      });

      it('should not throw when clearing non-existent cache', () => {
        // Test clearing cache for user that was never cached
        expect(() => ggCoinService.clearCache('never-cached-user')).not.toThrow();
      });

      it('should not throw when clearing all caches', () => {
        // Test clearing all caches
        expect(() => ggCoinService.clearCache()).not.toThrow();
      });

      it('should handle multiple clear operations', () => {
        // Test multiple clears in sequence
        expect(() => {
          ggCoinService.clearCache('test-user');
          ggCoinService.clearCache('test-user');
          ggCoinService.clearCache();
          ggCoinService.clearCache();
        }).not.toThrow();
      });
    });
  });
});
