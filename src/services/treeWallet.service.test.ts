import { describe, it, expect, vi, beforeEach } from 'vitest';
import { treeWalletService } from './treeWallet.service';
import { treeService } from './tree.service';
import { ggCoinService } from './ggCoin.service';
import type { CreateTreeData } from '../types/tree.types';

// Mock tree service
vi.mock('./tree.service', () => ({
  treeService: {
    createTree: vi.fn(),
    getTrees: vi.fn(),
    getTree: vi.fn(),
    getTreeImages: vi.fn(),
  },
}));

// Mock ggCoin service
vi.mock('./ggCoin.service', () => ({
  ggCoinService: {
    awardCoins: vi.fn(),
  },
  REWARD_RULES: {
    tree_planting: {
      actionType: 'tree_planting',
      baseReward: 50,
    },
  },
}));

// Mock antugrow service
vi.mock('./antugrow.service', () => ({
  antugrowService: {
    isConfigured: vi.fn().mockReturnValue(false),
  },
}));

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('TreeWalletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('plantTree', () => {
    const validTreeData: CreateTreeData = {
      initiative_id: 'init-123',
      species: 'Acacia',
      planted_date: '2025-01-01',
      location: {
        type: 'Point',
        coordinates: [34.8522, 0.2827],
      },
      planted_by: 'user-123',
      current_height_cm: 50,
      current_diameter_cm: 5,
    };

    it('should plant tree and award GG Coins', async () => {
      const mockTree = {
        id: 'tree-123',
        initiative_id: 'init-123',
        species: 'Acacia',
        planted_date: '2025-01-01',
        location: {
          type: 'Point' as const,
          coordinates: [34.8522, 0.2827] as [number, number],
        },
        planted_by: 'user-123',
        current_height_cm: 50,
        current_diameter_cm: 5,
        health_status: 'healthy' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-123',
        type: 'earn' as const,
        amount: 60, // 50 base + 20% photo multiplier
        balanceBefore: 0,
        balanceAfter: 60,
        description: 'Earned 60.000 GG Coins for tree_planting',
        timestamp: new Date(),
      };

      vi.mocked(treeService.createTree).mockResolvedValue({
        tree: mockTree,
        error: null,
      });

      vi.mocked(ggCoinService.awardCoins).mockResolvedValue(mockTransaction);

      const result = await treeWalletService.plantTree(validTreeData);

      expect(result.error).toBeNull();
      expect(result.tree).toBeDefined();
      expect(result.tree?.id).toBe('tree-123');
      expect(result.coinsAwarded).toBe(60);

      // Verify tree service was called
      expect(treeService.createTree).toHaveBeenCalledWith(validTreeData);

      // Verify ggCoin service was called with correct parameters
      expect(ggCoinService.awardCoins).toHaveBeenCalledWith(
        'user-123',
        'tree_planting',
        1,
        expect.arrayContaining([
          expect.objectContaining({ condition: 'verified_with_photo', factor: 1.2 }),
        ])
      );
    });

    it('should apply native species multiplier', async () => {
      const nativeTreeData = {
        ...validTreeData,
        species: 'Indigenous Acacia',
      };

      const mockTree = {
        id: 'tree-124',
        initiative_id: 'init-123',
        species: 'Indigenous Acacia',
        planted_date: '2025-01-01',
        location: {
          type: 'Point' as const,
          coordinates: [34.8522, 0.2827] as [number, number],
        },
        planted_by: 'user-123',
        current_height_cm: 50,
        current_diameter_cm: 5,
        health_status: 'healthy' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTransaction = {
        id: 'tx-124',
        userId: 'user-123',
        type: 'earn' as const,
        amount: 90, // 50 base * 1.2 photo * 1.5 native
        balanceBefore: 0,
        balanceAfter: 90,
        description: 'Earned 90.000 GG Coins for tree_planting',
        timestamp: new Date(),
      };

      vi.mocked(treeService.createTree).mockResolvedValue({
        tree: mockTree,
        error: null,
      });

      vi.mocked(ggCoinService.awardCoins).mockResolvedValue(mockTransaction);

      const result = await treeWalletService.plantTree(nativeTreeData);

      expect(result.error).toBeNull();
      expect(result.coinsAwarded).toBe(90);

      // Verify both multipliers were applied
      expect(ggCoinService.awardCoins).toHaveBeenCalledWith(
        'user-123',
        'tree_planting',
        1,
        expect.arrayContaining([
          expect.objectContaining({ condition: 'verified_with_photo', factor: 1.2 }),
          expect.objectContaining({ condition: 'native_species', factor: 1.5 }),
        ])
      );
    });

    it('should handle tree creation failure', async () => {
      const error = new Error('Database error');

      vi.mocked(treeService.createTree).mockResolvedValue({
        tree: null,
        error,
      });

      const result = await treeWalletService.plantTree(validTreeData);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
      expect(result.tree).toBeNull();
      expect(result.coinsAwarded).toBe(0);

      // Verify ggCoin service was NOT called
      expect(ggCoinService.awardCoins).not.toHaveBeenCalled();
    });

    it('should handle coin award failure gracefully', async () => {
      const mockTree = {
        id: 'tree-125',
        initiative_id: 'init-123',
        species: 'Acacia',
        planted_date: '2025-01-01',
        location: {
          type: 'Point' as const,
          coordinates: [34.8522, 0.2827] as [number, number],
        },
        planted_by: 'user-123',
        current_height_cm: 50,
        current_diameter_cm: 5,
        health_status: 'healthy' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(treeService.createTree).mockResolvedValue({
        tree: mockTree,
        error: null,
      });

      // Coin award fails but tree is still created
      vi.mocked(ggCoinService.awardCoins).mockResolvedValue(null);

      const result = await treeWalletService.plantTree(validTreeData);

      expect(result.error).toBeNull();
      expect(result.tree).toBeDefined();
      expect(result.coinsAwarded).toBe(0); // No coins awarded due to failure
    });

    it('should not apply photo multiplier without measurements', async () => {
      const treeDataWithoutMeasurements = {
        ...validTreeData,
        species: 'Oak', // Non-native species
        current_height_cm: undefined,
        current_diameter_cm: undefined,
      };

      const mockTree = {
        id: 'tree-126',
        initiative_id: 'init-123',
        species: 'Oak',
        planted_date: '2025-01-01',
        location: {
          type: 'Point' as const,
          coordinates: [34.8522, 0.2827] as [number, number],
        },
        planted_by: 'user-123',
        health_status: 'healthy' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockTransaction = {
        id: 'tx-126',
        userId: 'user-123',
        type: 'earn' as const,
        amount: 50, // Base reward only
        balanceBefore: 0,
        balanceAfter: 50,
        description: 'Earned 50.000 GG Coins for tree_planting',
        timestamp: new Date(),
      };

      vi.mocked(treeService.createTree).mockResolvedValue({
        tree: mockTree,
        error: null,
      });

      vi.mocked(ggCoinService.awardCoins).mockResolvedValue(mockTransaction);

      const result = await treeWalletService.plantTree(treeDataWithoutMeasurements);

      expect(result.error).toBeNull();
      expect(result.coinsAwarded).toBe(50);

      // Verify no multipliers were applied (no photo, non-native species)
      expect(ggCoinService.awardCoins).toHaveBeenCalledWith(
        'user-123',
        'tree_planting',
        1,
        [] // No multipliers
      );
    });
  });
});
