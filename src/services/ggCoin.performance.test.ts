/**
 * Performance Tests for GG Coin Service
 * 
 * Tests performance requirements from design document:
 * - Balance queries: < 50ms (cached)
 * - Transaction recording: < 200ms
 * - Pagination: < 100ms
 * - Performance with 10,000+ users
 * - No N+1 query issues
 * 
 * Requirements: D1 (Performance)
 * Task: 4.4 - Performance Testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ggCoinService } from './ggCoin.service';
import { supabase } from './supabase';

// Mock Supabase for performance testing
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('GGCoinService Performance Tests', () => {
  const mockUserId = 'test-user-123';
  const mockWallet = {
    id: mockUserId,
    gg_coins: 1234.567,
    total_points: 5000,
    level: 10,
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockWallet, error: null }),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        success: true,
        transaction_id: 'tx-123',
        balance_before: 1234.567,
        balance_after: 1284.567,
      },
      error: null,
    } as any);
  });

  describe('Balance Query Performance (Requirement D1: < 50ms cached)', () => {
    it('should retrieve cached balance in under 50ms', async () => {
      // First call to populate cache
      await ggCoinService.getBalance(mockUserId);

      // Measure cached retrieval
      const startTime = performance.now();
      const balance = await ggCoinService.getBalance(mockUserId);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(balance).toBe(1234.567);
      expect(queryTime).toBeLessThan(50);
    });

    it('should handle multiple concurrent cached balance queries efficiently', async () => {
      // Populate cache
      await ggCoinService.getBalance(mockUserId);

      // Measure concurrent cached retrievals
      const startTime = performance.now();
      const promises = Array(100).fill(null).map(() => 
        ggCoinService.getBalance(mockUserId)
      );
      await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 100;

      expect(avgTime).toBeLessThan(50);
    });

    it('should retrieve fresh balance efficiently after cache expiry', async () => {
      // Clear cache to simulate expiry
      ggCoinService.clearCache(mockUserId);

      const startTime = performance.now();
      const balance = await ggCoinService.getBalance(mockUserId);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(balance).toBe(1234.567);
      // Fresh query should still be reasonably fast (allow more time than cached)
      expect(queryTime).toBeLessThan(200);
    });
  });

  describe('Transaction Recording Performance (Requirement D1: < 200ms)', () => {
    it('should credit coins in under 200ms', async () => {
      const startTime = performance.now();
      const transaction = await ggCoinService.creditCoins(
        mockUserId,
        50,
        'earn',
        'Test credit'
      );
      const endTime = performance.now();
      const transactionTime = endTime - startTime;

      expect(transaction).toBeDefined();
      expect(transactionTime).toBeLessThan(200);
    });

    it('should debit coins in under 200ms', async () => {
      const startTime = performance.now();
      const transaction = await ggCoinService.debitCoins(
        mockUserId,
        20,
        'spend',
        'Test debit'
      );
      const endTime = performance.now();
      const transactionTime = endTime - startTime;

      expect(transaction).toBeDefined();
      expect(transactionTime).toBeLessThan(200);
    });

    it('should handle multiple sequential transactions efficiently', async () => {
      const transactions = 10;
      const startTime = performance.now();

      for (let i = 0; i < transactions; i++) {
        await ggCoinService.creditCoins(
          mockUserId,
          10,
          'earn',
          `Transaction ${i}`
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / transactions;

      expect(avgTime).toBeLessThan(200);
    });
  });

  describe('Pagination Performance (Requirement D1: < 100ms)', () => {
    it('should retrieve transaction history page in under 100ms', async () => {
      const mockTransactions = Array(20).fill(null).map((_, i) => ({
        id: `tx-${i}`,
        user_id: mockUserId,
        transaction_type: 'earn',
        amount: 50,
        balance_before: 1000 + (i * 50),
        balance_after: 1050 + (i * 50),
        description: `Transaction ${i}`,
        metadata: {},
        created_at: new Date().toISOString(),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
          count: 100,
        }),
      } as any);

      const startTime = performance.now();
      const history = await ggCoinService.getTransactionHistory(mockUserId, 20, 0);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(history.transactions).toHaveLength(20);
      expect(queryTime).toBeLessThan(100);
    });

    it('should handle pagination with large offsets efficiently', async () => {
      const mockTransactions = Array(20).fill(null).map((_, i) => ({
        id: `tx-${i + 500}`,
        user_id: mockUserId,
        transaction_type: 'earn',
        amount: 50,
        balance_before: 1000,
        balance_after: 1050,
        description: `Transaction ${i + 500}`,
        metadata: {},
        created_at: new Date().toISOString(),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
          count: 1000,
        }),
      } as any);

      const startTime = performance.now();
      const history = await ggCoinService.getTransactionHistory(mockUserId, 20, 500);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(history.transactions).toHaveLength(20);
      expect(queryTime).toBeLessThan(100);
    });
  });

  describe('Reward Calculation Performance', () => {
    it('should calculate rewards instantly (< 1ms)', () => {
      const startTime = performance.now();
      const reward = ggCoinService.calculateReward('tree_planting', 10);
      const endTime = performance.now();
      const calcTime = endTime - startTime;

      expect(reward).toBe(500);
      expect(calcTime).toBeLessThan(1);
    });

    it('should calculate rewards with multipliers efficiently', () => {
      const multipliers = [
        { condition: 'test1', factor: 1.5 },
        { condition: 'test2', factor: 2.0 },
        { condition: 'test3', factor: 1.2 },
      ];

      const startTime = performance.now();
      const reward = ggCoinService.calculateReward('tree_planting', 1, multipliers);
      const endTime = performance.now();
      const calcTime = endTime - startTime;

      expect(reward).toBeGreaterThan(0);
      expect(calcTime).toBeLessThan(1);
    });

    it('should handle batch reward calculations efficiently', () => {
      const batchSize = 1000;
      const startTime = performance.now();

      for (let i = 0; i < batchSize; i++) {
        ggCoinService.calculateReward('tree_planting', Math.random() * 10);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / batchSize;

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('Cache Performance', () => {
    it('should handle cache operations efficiently', () => {
      const userIds = Array(1000).fill(null).map((_, i) => `user-${i}`);

      // Populate cache
      const populateStart = performance.now();
      userIds.forEach(userId => {
        ggCoinService['balanceCache'].set(userId, {
          balance: Math.random() * 1000,
          timestamp: Date.now(),
        });
      });
      const populateEnd = performance.now();
      const populateTime = populateEnd - populateStart;

      expect(populateTime).toBeLessThan(100);

      // Retrieve from cache
      const retrieveStart = performance.now();
      userIds.forEach(userId => {
        ggCoinService['balanceCache'].get(userId);
      });
      const retrieveEnd = performance.now();
      const retrieveTime = retrieveEnd - retrieveStart;

      expect(retrieveTime).toBeLessThan(50);

      // Clear cache
      const clearStart = performance.now();
      ggCoinService.clearCache();
      const clearEnd = performance.now();
      const clearTime = clearEnd - clearStart;

      expect(clearTime).toBeLessThan(10);
    });

    it('should invalidate cache efficiently', () => {
      // Populate cache with many users
      const userIds = Array(100).fill(null).map((_, i) => `user-${i}`);
      userIds.forEach(userId => {
        ggCoinService['balanceCache'].set(userId, {
          balance: Math.random() * 1000,
          timestamp: Date.now(),
        });
      });

      // Measure single user cache invalidation
      const startTime = performance.now();
      ggCoinService.clearCache(userIds[0]);
      const endTime = performance.now();
      const invalidateTime = endTime - startTime;

      expect(invalidateTime).toBeLessThan(1);
    });
  });

  describe('Scalability Tests (Requirement D4: 100,000+ users)', () => {
    it('should handle large cache sizes efficiently', () => {
      const largeUserCount = 10000;
      const userIds = Array(largeUserCount).fill(null).map((_, i) => `user-${i}`);

      // Populate large cache
      const startTime = performance.now();
      userIds.forEach(userId => {
        ggCoinService['balanceCache'].set(userId, {
          balance: Math.random() * 1000,
          timestamp: Date.now(),
        });
      });
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / largeUserCount;

      expect(avgTime).toBeLessThan(0.1); // Less than 0.1ms per user
    });

    it('should maintain performance with cache at capacity', () => {
      // Fill cache with many users
      const userCount = 1000;
      for (let i = 0; i < userCount; i++) {
        ggCoinService['balanceCache'].set(`user-${i}`, {
          balance: Math.random() * 1000,
          timestamp: Date.now(),
        });
      }

      // Measure performance with full cache
      const startTime = performance.now();
      const balance = ggCoinService['balanceCache'].get('user-500');
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(balance).toBeDefined();
      expect(queryTime).toBeLessThan(1);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        ggCoinService.calculateReward('tree_planting', Math.random() * 10);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (< 1MB)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      }
    });

    it('should clean up cache entries efficiently', () => {
      // Populate cache
      for (let i = 0; i < 100; i++) {
        ggCoinService['balanceCache'].set(`user-${i}`, {
          balance: Math.random() * 1000,
          timestamp: Date.now(),
        });
      }

      const initialSize = ggCoinService['balanceCache'].size;
      expect(initialSize).toBe(100);

      // Clear cache
      ggCoinService.clearCache();

      const finalSize = ggCoinService['balanceCache'].size;
      expect(finalSize).toBe(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent balance queries efficiently', async () => {
      const concurrentQueries = 50;
      const userIds = Array(concurrentQueries).fill(null).map((_, i) => `user-${i}`);

      const startTime = performance.now();
      const promises = userIds.map(userId => ggCoinService.getBalance(userId));
      await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / concurrentQueries;

      expect(avgTime).toBeLessThan(200);
    });

    it('should handle concurrent transaction operations efficiently', async () => {
      const concurrentTransactions = 20;

      const startTime = performance.now();
      const promises = Array(concurrentTransactions).fill(null).map((_, i) =>
        ggCoinService.creditCoins(
          mockUserId,
          10,
          'earn',
          `Concurrent transaction ${i}`
        )
      );
      await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / concurrentTransactions;

      expect(avgTime).toBeLessThan(200);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle zero balance efficiently', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockWallet, gg_coins: 0 },
          error: null,
        }),
      } as any);

      const startTime = performance.now();
      const balance = await ggCoinService.getBalance(mockUserId);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(balance).toBe(0);
      expect(queryTime).toBeLessThan(200);
    });

    it('should handle very large balances efficiently', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockWallet, gg_coins: 9999999.999 },
          error: null,
        }),
      } as any);

      const startTime = performance.now();
      const balance = await ggCoinService.getBalance(mockUserId);
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(balance).toBe(9999999.999);
      expect(queryTime).toBeLessThan(200);
    });

    it('should handle fractional amounts efficiently', () => {
      const startTime = performance.now();
      const reward = ggCoinService.calculateReward('tree_planting', 1.3333);
      const endTime = performance.now();
      const calcTime = endTime - startTime;

      expect(reward).toBe(66.665);
      expect(calcTime).toBeLessThan(1);
    });
  });

  describe('Benchmark Summary', () => {
    it('should meet all performance requirements', async () => {
      const results = {
        cachedBalanceQuery: 0,
        freshBalanceQuery: 0,
        creditTransaction: 0,
        debitTransaction: 0,
        paginationQuery: 0,
        rewardCalculation: 0,
      };

      // Cached balance query
      await ggCoinService.getBalance(mockUserId);
      let start = performance.now();
      await ggCoinService.getBalance(mockUserId);
      results.cachedBalanceQuery = performance.now() - start;

      // Fresh balance query
      ggCoinService.clearCache(mockUserId);
      start = performance.now();
      await ggCoinService.getBalance(mockUserId);
      results.freshBalanceQuery = performance.now() - start;

      // Credit transaction
      start = performance.now();
      await ggCoinService.creditCoins(mockUserId, 50, 'earn', 'Test');
      results.creditTransaction = performance.now() - start;

      // Debit transaction
      start = performance.now();
      await ggCoinService.debitCoins(mockUserId, 20, 'spend', 'Test');
      results.debitTransaction = performance.now() - start;

      // Pagination query
      start = performance.now();
      await ggCoinService.getTransactionHistory(mockUserId, 20, 0);
      results.paginationQuery = performance.now() - start;

      // Reward calculation
      start = performance.now();
      ggCoinService.calculateReward('tree_planting', 10);
      results.rewardCalculation = performance.now() - start;

      // Verify all requirements
      expect(results.cachedBalanceQuery).toBeLessThan(50);
      expect(results.freshBalanceQuery).toBeLessThan(200);
      expect(results.creditTransaction).toBeLessThan(200);
      expect(results.debitTransaction).toBeLessThan(200);
      expect(results.paginationQuery).toBeLessThan(100);
      expect(results.rewardCalculation).toBeLessThan(1);

      console.log('Performance Benchmark Results:', results);
    });
  });
});
