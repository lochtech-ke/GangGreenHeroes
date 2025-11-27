/**
 * Badge Migration Service Tests
 * Tests for badge migration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeMigrationService } from './badgeMigration.service';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock geometric badge generator
vi.mock('../utils/geometricBadgeGenerator', () => ({
  generateGeometricBadgeWithTier: vi.fn(() => `
    <svg viewBox="0 0 400 400">
      <polygon fill="#2E8B57" points="200,100 250,200 200,300 150,200"/>
      <circle fill="#FFD700" cx="200" cy="200" r="50"/>
    </svg>
  `),
}));

describe('BadgeMigrationService', () => {
  let service: BadgeMigrationService;

  beforeEach(() => {
    service = new BadgeMigrationService();
    vi.clearAllMocks();
  });

  describe('migrateAllBadges', () => {
    it('should successfully migrate badges in batches', async () => {
      // Mock database responses
      const mockBadges = [
        {
          id: 'badge-1',
          user_id: 'user-1',
          badge_type: 'tree_planter',
          tier: 'bronze',
          badge_name: 'Tree Planter',
          earned_date: '2024-01-01',
          unique_badge_id: 'unique-1',
          achievement_count: 1,
        },
        {
          id: 'badge-2',
          user_id: 'user-2',
          badge_type: 'carbon_warrior',
          tier: 'silver',
          badge_name: 'Carbon Warrior',
          earned_date: '2024-01-02',
          unique_badge_id: 'unique-2',
          achievement_count: 2,
        },
      ];

      // Mock Supabase calls
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              data: mockBadges,
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          data: { id: 'log-1' },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: {},
            error: null,
          }),
        }),
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: true,
        error: null,
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any) = mockRpc;

      // Run migration
      const result = await service.migrateAllBadges({
        batchSize: 2,
        dryRun: false,
        createBackup: true,
      });

      // Verify results
      expect(result.success).toBe(true);
      expect(result.totalBadges).toBe(2);
      expect(result.migratedBadges).toBe(2);
      expect(result.failedBadges).toBe(0);
    });

    it('should handle dry run mode', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          user_id: 'user-1',
          badge_type: 'tree_planter',
          tier: 'bronze',
          badge_name: 'Tree Planter',
          earned_date: '2024-01-01',
          unique_badge_id: 'unique-1',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              data: mockBadges,
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          data: { id: 'log-1' },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: {},
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const result = await service.migrateAllBadges({
        dryRun: true,
        createBackup: false,
      });

      expect(result.success).toBe(true);
      expect(result.totalBadges).toBe(1);
    });
  });


  describe('migrateUserBadges', () => {
    it('should migrate badges for specific user', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          user_id: 'user-123',
          badge_type: 'tree_planter',
          tier: 'gold',
          badge_name: 'Tree Planter',
          earned_date: '2024-01-01',
          unique_badge_id: 'unique-1',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: mockBadges,
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          data: { id: 'log-1' },
          error: null,
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: {},
            error: null,
          }),
        }),
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: true,
        error: null,
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any) = mockRpc;

      const result = await service.migrateUserBadges('user-123');

      expect(result.success).toBe(true);
      expect(result.totalBadges).toBe(1);
    });
  });

  describe('getMigrationStatus', () => {
    it('should return status when no migration in progress', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const status = await service.getMigrationStatus();

      expect(status.inProgress).toBe(false);
      expect(status.progress).toBe(0);
    });

    it('should return status from database when migration in progress', async () => {
      const mockMigration = {
        migration_id: 'migration-123',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_badges: 100,
        migrated_badges: 50,
        batch_size: 10,
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: mockMigration,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const status = await service.getMigrationStatus();

      expect(status.inProgress).toBe(true);
      expect(status.progress).toBe(50);
      expect(status.migrationId).toBe('migration-123');
    });
  });

  describe('rollbackMigration', () => {
    it('should successfully rollback migration', async () => {
      const mockMigration = {
        migration_id: 'migration-123',
        status: 'completed',
      };

      const mockBackups = [
        { badge_id: 'badge-1', migration_id: 'migration-123', original_data: {} },
        { badge_id: 'badge-2', migration_id: 'migration-123', original_data: {} },
      ];

      const mockFrom = vi.fn((table: string) => {
        if (table === 'badge_migration_log') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: mockMigration,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: {},
                error: null,
              }),
            }),
          };
        }
        if (table === 'badge_migration_backup') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: mockBackups,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const mockRpc = vi.fn().mockResolvedValue({
        data: true,
        error: null,
      });

      (supabase.from as any) = mockFrom;
      (supabase.rpc as any) = mockRpc;

      const result = await service.rollbackMigration('migration-123');

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledTimes(2); // Once for each backup
    });

    it('should return false when migration not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const result = await service.rollbackMigration('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('verifyMigration', () => {
    it('should verify all migrated badges', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          badge_design_type: 'geometric',
          primary_colors: ['#2E8B57', '#3CB371'],
          migrated_at: new Date().toISOString(),
          migration_version: 1,
          svg_cache: '<svg></svg>',
          complexity_level: 'medium',
          badge_name: 'Test Badge',
          tier: 'gold',
          earned_date: '2024-01-01',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            data: mockBadges,
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const result = await service.verifyMigration();

      expect(result.verified).toBe(true);
      expect(result.totalChecked).toBe(1);
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect verification issues', async () => {
      const mockBadges = [
        {
          id: 'badge-1',
          badge_design_type: 'classic', // Wrong type
          primary_colors: null, // Missing colors
          migrated_at: new Date().toISOString(),
          badge_name: 'Test Badge',
          tier: 'gold',
          earned_date: '2024-01-01',
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            data: mockBadges,
            error: null,
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const result = await service.verifyMigration();

      expect(result.verified).toBe(false);
      expect(result.failed).toBe(1);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('getMigrationHistory', () => {
    it('should return migration history', async () => {
      const mockHistory = [
        {
          migration_id: 'migration-1',
          started_at: '2024-01-01',
          status: 'completed',
          total_badges: 100,
          migrated_badges: 100,
        },
        {
          migration_id: 'migration-2',
          started_at: '2024-01-02',
          status: 'completed',
          total_badges: 50,
          migrated_badges: 50,
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const history = await service.getMigrationHistory(10);

      expect(history).toHaveLength(2);
      expect(history[0].migration_id).toBe('migration-1');
    });
  });

  describe('getMigrationReport', () => {
    it('should return migration report', async () => {
      const mockReport = {
        migration_id: 'migration-123',
        started_at: '2024-01-01',
        completed_at: '2024-01-01',
        status: 'completed',
        total_badges: 100,
        migrated_badges: 98,
        failed_badges: 2,
        errors: [],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockReport,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any) = mockFrom;

      const report = await service.getMigrationReport('migration-123');

      expect(report).toBeDefined();
      expect(report.migration_id).toBe('migration-123');
      expect(report.total_badges).toBe(100);
    });
  });
});
