/**
 * Badge Migration Service
 * Migrates existing user badges to geometric designs
 * Implements Requirements 1.1, 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { supabase } from './supabase';
import { generateGeometricBadgeWithTier } from '../utils/geometricBadgeGenerator';
import type { AchievementType, BadgeTier, BadgeMetadata } from '../types/badge.types';
import { badgeMigrationMonitor } from './badgeMigrationMonitor.service';

/**
 * Migration options for configuring the migration process
 */
export interface MigrationOptions {
  batchSize?: number; // Default: 100
  dryRun?: boolean; // Default: false
  createBackup?: boolean; // Default: true
  skipErrors?: boolean; // Default: false
  delayBetweenBatches?: number; // Milliseconds, default: 1000
  userId?: string; // Optional: migrate specific user only
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  success: boolean;
  totalBadges: number;
  migratedBadges: number;
  failedBadges: number;
  errors: MigrationError[];
  duration: number; // milliseconds
  migrationId: string;
  skippedBadges?: number;
}

/**
 * Migration error details
 */
export interface MigrationError {
  badgeId: string;
  userId: string;
  error: string;
  timestamp: Date;
  badgeData?: any;
}

/**
 * Current migration status
 */
export interface MigrationStatus {
  inProgress: boolean;
  progress: number; // 0-100
  currentBatch: number;
  totalBatches: number;
  startedAt?: Date;
  estimatedCompletion?: Date;
  migrationId?: string;
}

/**
 * Verification result for migration
 */
export interface VerificationResult {
  verified: boolean;
  totalChecked: number;
  passed: number;
  failed: number;
  issues: VerificationIssue[];
}

/**
 * Verification issue details
 */
export interface VerificationIssue {
  badgeId: string;
  issue: string;
  severity: 'error' | 'warning';
}

/**
 * Badge Migration Service Class
 * Handles migration of badges from classic to geometric designs
 */
class BadgeMigrationService {
  private currentMigrationId: string | null = null;
  private migrationInProgress: boolean = false;
  private currentProgress: number = 0;
  private currentBatch: number = 0;
  private totalBatches: number = 0;
  private startTime: Date | null = null;

  /**
   * Default migration options
   */
  private readonly DEFAULT_OPTIONS: Required<MigrationOptions> = {
    batchSize: 100,
    dryRun: false,
    createBackup: true,
    skipErrors: false,
    delayBetweenBatches: 1000,
    userId: '',
  };

  /**
   * Migrate all user badges to geometric design
   * Implements Requirements 1.1, 9.1, 9.2, 9.3, 9.4, 9.5
   */
  async migrateAllBadges(options: MigrationOptions = {}): Promise<MigrationResult> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const migrationId = this.generateMigrationId();
    
    console.log('[BadgeMigrationService] Starting migration:', {
      migrationId,
      options: finalOptions,
    });

    // Check if migration is already in progress
    if (this.migrationInProgress) {
      console.error('[BadgeMigrationService] Migration already in progress');
      return {
        success: false,
        totalBadges: 0,
        migratedBadges: 0,
        failedBadges: 0,
        errors: [{
          badgeId: '',
          userId: '',
          error: 'Migration already in progress',
          timestamp: new Date(),
        }],
        duration: 0,
        migrationId,
      };
    }

    // Initialize migration state
    this.currentMigrationId = migrationId;
    this.migrationInProgress = true;
    this.currentProgress = 0;
    this.currentBatch = 0;
    this.startTime = new Date();

    const errors: MigrationError[] = [];
    let totalBadges = 0;
    let migratedBadges = 0;
    let failedBadges = 0;
    let skippedBadges = 0;

    try {
      // Create migration log entry
      await this.createMigrationLog(migrationId, finalOptions);

      // Get badges to migrate
      const badges = await this.getBadgesToMigrate(finalOptions.userId);
      totalBadges = badges.length;

      // Track migration start
      await badgeMigrationMonitor.trackMigrationStart(
        migrationId,
        totalBadges,
        finalOptions.batchSize,
        { dryRun: finalOptions.dryRun, userId: finalOptions.userId }
      );

      if (totalBadges === 0) {
        console.log('[BadgeMigrationService] No badges to migrate');
        await this.completeMigrationLog(migrationId, 'completed', totalBadges, 0, 0, []);
        this.resetMigrationState();
        
        return {
          success: true,
          totalBadges: 0,
          migratedBadges: 0,
          failedBadges: 0,
          errors: [],
          duration: Date.now() - this.startTime.getTime(),
          migrationId,
        };
      }

      console.log(`[BadgeMigrationService] Found ${totalBadges} badges to migrate`);

      // Calculate total batches
      this.totalBatches = Math.ceil(totalBadges / finalOptions.batchSize);

      // Process badges in batches
      for (let i = 0; i < badges.length; i += finalOptions.batchSize) {
        this.currentBatch++;
        const batch = badges.slice(i, i + finalOptions.batchSize);
        
        console.log(`[BadgeMigrationService] Processing batch ${this.currentBatch}/${this.totalBatches} (${batch.length} badges)`);

        // Process batch
        const batchStartTime = Date.now();
        const batchResult = await this.processBatch(
          batch,
          migrationId,
          finalOptions
        );
        const batchDuration = Date.now() - batchStartTime;

        migratedBadges += batchResult.migrated;
        failedBadges += batchResult.failed;
        skippedBadges += batchResult.skipped;
        errors.push(...batchResult.errors);

        // Track batch completion
        await badgeMigrationMonitor.trackBatchComplete(
          migrationId,
          this.currentBatch,
          batchResult.migrated + batchResult.skipped,
          batchResult.failed,
          batchDuration,
          {
            batchSize: batch.length,
            skipped: batchResult.skipped,
          }
        );

        // Update progress
        this.currentProgress = Math.round((i + batch.length) / totalBadges * 100);

        // Update migration log
        await this.updateMigrationProgress(
          migrationId,
          migratedBadges,
          failedBadges,
          errors
        );

        // Delay between batches to prevent overload
        if (i + finalOptions.batchSize < badges.length) {
          await this.delay(finalOptions.delayBetweenBatches);
        }
      }

      // Complete migration
      const status = failedBadges > 0 ? 'completed' : 'completed';
      await this.completeMigrationLog(
        migrationId,
        status,
        totalBadges,
        migratedBadges,
        failedBadges,
        errors
      );

      const duration = Date.now() - this.startTime.getTime();

      // Track migration completion
      await badgeMigrationMonitor.trackMigrationComplete(
        migrationId,
        migratedBadges + skippedBadges,
        failedBadges,
        duration,
        {
          skippedBadges,
          dryRun: finalOptions.dryRun,
        }
      );

      console.log('[BadgeMigrationService] Migration completed:', {
        migrationId,
        totalBadges,
        migratedBadges,
        failedBadges,
        skippedBadges,
        duration: `${duration}ms`,
      });

      this.resetMigrationState();

      return {
        success: true,
        totalBadges,
        migratedBadges,
        failedBadges,
        errors,
        duration,
        migrationId,
        skippedBadges,
      };
    } catch (error) {
      console.error('[BadgeMigrationService] Migration failed:', error);

      // Track migration failure
      await badgeMigrationMonitor.trackMigrationFailed(
        migrationId,
        error instanceof Error ? error.message : String(error),
        { totalBadges, migratedBadges, failedBadges }
      );

      // Mark migration as failed
      await this.completeMigrationLog(
        migrationId,
        'failed',
        totalBadges,
        migratedBadges,
        failedBadges,
        errors
      );

      this.resetMigrationState();

      return {
        success: false,
        totalBadges,
        migratedBadges,
        failedBadges,
        errors: [
          ...errors,
          {
            badgeId: '',
            userId: '',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
        ],
        duration: this.startTime ? Date.now() - this.startTime.getTime() : 0,
        migrationId,
      };
    }
  }

  /**
   * Migrate badges for specific user
   * Implements Requirements 1.1, 9.1, 9.2, 9.3
   */
  async migrateUserBadges(userId: string): Promise<MigrationResult> {
    console.log('[BadgeMigrationService] Migrating badges for user:', userId);

    return await this.migrateAllBadges({
      userId,
      batchSize: 50, // Smaller batch size for single user
    });
  }

  /**
   * Get migration status
   * Implements Requirement 9.4
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    if (!this.migrationInProgress || !this.currentMigrationId) {
      // Check database for latest migration
      const { data, error } = await supabase
        .from('badge_migration_log')
        .select('*')
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return {
          inProgress: false,
          progress: 0,
          currentBatch: 0,
          totalBatches: 0,
        };
      }

      // Calculate progress from database
      const progress = data.total_badges > 0
        ? Math.round((data.migrated_badges / data.total_badges) * 100)
        : 0;

      return {
        inProgress: true,
        progress,
        currentBatch: Math.ceil(data.migrated_badges / (data.batch_size || 100)),
        totalBatches: Math.ceil(data.total_badges / (data.batch_size || 100)),
        startedAt: new Date(data.started_at),
        migrationId: data.migration_id,
      };
    }

    // Calculate estimated completion
    let estimatedCompletion: Date | undefined;
    if (this.startTime && this.currentProgress > 0) {
      const elapsed = Date.now() - this.startTime.getTime();
      const estimatedTotal = (elapsed / this.currentProgress) * 100;
      const remaining = estimatedTotal - elapsed;
      estimatedCompletion = new Date(Date.now() + remaining);
    }

    return {
      inProgress: this.migrationInProgress,
      progress: this.currentProgress,
      currentBatch: this.currentBatch,
      totalBatches: this.totalBatches,
      startedAt: this.startTime || undefined,
      estimatedCompletion,
      migrationId: this.currentMigrationId,
    };
  }

  /**
   * Rollback migration (restore from backup)
   * Implements Requirement 9.3
   */
  async rollbackMigration(migrationId: string): Promise<boolean> {
    console.log('[BadgeMigrationService] Rolling back migration:', migrationId);

    try {
      // Get migration log
      const { data: migrationLog, error: logError } = await supabase
        .from('badge_migration_log')
        .select('*')
        .eq('migration_id', migrationId)
        .single();

      if (logError || !migrationLog) {
        console.error('[BadgeMigrationService] Migration log not found:', migrationId);
        return false;
      }

      // Get all backups for this migration
      const { data: backups, error: backupError } = await supabase
        .from('badge_migration_backup')
        .select('*')
        .eq('migration_id', migrationId)
        .eq('restored', false);

      if (backupError) {
        console.error('[BadgeMigrationService] Error fetching backups:', backupError);
        return false;
      }

      if (!backups || backups.length === 0) {
        console.warn('[BadgeMigrationService] No backups found for migration:', migrationId);
        return false;
      }

      console.log(`[BadgeMigrationService] Found ${backups.length} backups to restore`);

      // Restore each badge from backup
      let restoredCount = 0;
      let failedCount = 0;

      for (const backup of backups) {
        try {
          // Call database function to restore badge
          const { error: restoreError } = await supabase.rpc('restore_badge_from_backup', {
            p_badge_id: backup.badge_id,
            p_migration_id: migrationId,
          });

          if (restoreError) {
            console.error('[BadgeMigrationService] Error restoring badge:', {
              badgeId: backup.badge_id,
              error: restoreError,
            });
            failedCount++;
          } else {
            restoredCount++;
          }
        } catch (error) {
          console.error('[BadgeMigrationService] Exception restoring badge:', {
            badgeId: backup.badge_id,
            error,
          });
          failedCount++;
        }
      }

      // Update migration log status
      await supabase
        .from('badge_migration_log')
        .update({
          status: 'rolled_back',
          updated_at: new Date().toISOString(),
        })
        .eq('migration_id', migrationId);

      console.log('[BadgeMigrationService] Rollback completed:', {
        migrationId,
        restoredCount,
        failedCount,
      });

      return failedCount === 0;
    } catch (error) {
      console.error('[BadgeMigrationService] Rollback failed:', error);
      return false;
    }
  }

  /**
   * Verify migrated badges
   * Implements Requirement 9.5
   */
  async verifyMigration(): Promise<VerificationResult> {
    console.log('[BadgeMigrationService] Verifying migration');

    const issues: VerificationIssue[] = [];
    let totalChecked = 0;
    let passed = 0;
    let failed = 0;

    try {
      // Get all migrated badges
      const { data: badges, error } = await supabase
        .from('nft_badges')
        .select('*')
        .not('migrated_at', 'is', null);

      if (error) {
        console.error('[BadgeMigrationService] Error fetching migrated badges:', error);
        return {
          verified: false,
          totalChecked: 0,
          passed: 0,
          failed: 0,
          issues: [{
            badgeId: '',
            issue: `Database error: ${error.message}`,
            severity: 'error',
          }],
        };
      }

      totalChecked = badges?.length || 0;

      if (totalChecked === 0) {
        console.log('[BadgeMigrationService] No migrated badges to verify');
        return {
          verified: true,
          totalChecked: 0,
          passed: 0,
          failed: 0,
          issues: [],
        };
      }

      console.log(`[BadgeMigrationService] Verifying ${totalChecked} badges`);

      // Verify each badge
      for (const badge of badges || []) {
        const badgeIssues = this.verifyBadge(badge);
        
        if (badgeIssues.length > 0) {
          failed++;
          issues.push(...badgeIssues);
        } else {
          passed++;
        }
      }

      const verified = failed === 0;

      console.log('[BadgeMigrationService] Verification completed:', {
        totalChecked,
        passed,
        failed,
        verified,
      });

      return {
        verified,
        totalChecked,
        passed,
        failed,
        issues,
      };
    } catch (error) {
      console.error('[BadgeMigrationService] Verification failed:', error);
      return {
        verified: false,
        totalChecked,
        passed,
        failed,
        issues: [
          ...issues,
          {
            badgeId: '',
            issue: error instanceof Error ? error.message : 'Unknown error',
            severity: 'error',
          },
        ],
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get badges that need migration
   * Implements Requirement 9.1
   */
  private async getBadgesToMigrate(userId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('nft_badges')
        .select('*')
        .or('badge_design_type.is.null,badge_design_type.eq.classic')
        .is('migrated_at', null);

      // Filter by user if specified
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BadgeMigrationService] Error fetching badges:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[BadgeMigrationService] Error in getBadgesToMigrate:', error);
      throw error;
    }
  }

  /**
   * Process a batch of badges
   * Implements Requirements 9.1, 9.2
   */
  private async processBatch(
    badges: any[],
    migrationId: string,
    options: Required<MigrationOptions>
  ): Promise<{
    migrated: number;
    failed: number;
    skipped: number;
    errors: MigrationError[];
  }> {
    let migrated = 0;
    let failed = 0;
    const skipped = 0;
    const errors: MigrationError[] = [];

    for (const badge of badges) {
      try {
        // Create backup if enabled
        if (options.createBackup && !options.dryRun) {
          const backupSuccess = await this.createBackup(badge.id, migrationId);
          if (!backupSuccess) {
            console.warn('[BadgeMigrationService] Failed to create backup for badge:', badge.id);
            if (!options.skipErrors) {
              throw new Error('Backup creation failed');
            }
          }
        }

        // Migrate badge
        const migrationSuccess = await this.migrateBadge(badge, options.dryRun);

        if (migrationSuccess) {
          migrated++;
        } else {
          failed++;
          errors.push({
            badgeId: badge.id,
            userId: badge.user_id,
            error: 'Migration failed',
            timestamp: new Date(),
            badgeData: badge,
          });
        }
      } catch (error) {
        console.error('[BadgeMigrationService] Error migrating badge:', {
          badgeId: badge.id,
          error,
        });

        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          badgeId: badge.id,
          userId: badge.user_id,
          error: errorMessage,
          timestamp: new Date(),
          badgeData: badge,
        });

        // Track individual badge error
        await badgeMigrationMonitor.trackMigrationError(
          migrationId,
          badge.id,
          errorMessage,
          {
            userId: badge.user_id,
            badgeType: badge.badge_type,
            tier: badge.tier,
          }
        );

        // Stop processing if skipErrors is false
        if (!options.skipErrors) {
          throw error;
        }
      }
    }

    return { migrated, failed, skipped, errors };
  }

  /**
   * Migrate a single badge to geometric design
   * Implements Requirements 1.1, 1.3, 1.5
   */
  private async migrateBadge(badge: any, dryRun: boolean): Promise<boolean> {
    try {
      // Extract badge information
      const achievementType = badge.badge_type || badge.achievement_type;
      const tier = badge.tier;
      const userId = badge.user_id;

      if (!achievementType || !tier) {
        console.error('[BadgeMigrationService] Missing required badge fields:', {
          badgeId: badge.id,
          achievementType,
          tier,
        });
        return false;
      }

      // Generate geometric badge
      const metadata: BadgeMetadata = {
        badgeName: badge.badge_name,
        tierLevel: this.getTierLevel(tier),
        forestName: badge.forest || 'Unknown',
        achievementType: achievementType as AchievementType,
        achievementCount: badge.achievement_count || 1,
        earnedDate: badge.earned_date,
        uniqueBadgeId: badge.unique_badge_id,
        userId,
      };

      const svg = generateGeometricBadgeWithTier(
        achievementType as AchievementType,
        tier as BadgeTier,
        400,
        metadata
      );

      if (!svg) {
        console.error('[BadgeMigrationService] Failed to generate geometric badge:', badge.id);
        return false;
      }

      // Extract colors and metadata
      const primaryColors = this.extractPrimaryColors(svg);
      const accentColors = this.extractAccentColors(svg);
      const complexityLevel = this.determineComplexityLevel(achievementType);

      // Update badge in database (if not dry run)
      if (!dryRun) {
        const { error } = await supabase
          .from('nft_badges')
          .update({
            badge_design_type: 'geometric',
            primary_colors: primaryColors,
            accent_colors: accentColors,
            complexity_level: complexityLevel,
            style_variant: 'angular',
            svg_cache: svg,
            cache_updated_at: new Date().toISOString(),
            migrated_at: new Date().toISOString(),
            migration_version: 1,
            svg_data: svg, // Update the main SVG data as well
          })
          .eq('id', badge.id);

        if (error) {
          console.error('[BadgeMigrationService] Database update error:', {
            badgeId: badge.id,
            error,
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[BadgeMigrationService] Error in migrateBadge:', {
        badgeId: badge.id,
        error,
      });
      return false;
    }
  }

  /**
   * Create backup for badge before migration
   * Implements Requirement 9.3
   */
  private async createBackup(badgeId: string, migrationId: string): Promise<boolean> {
    try {
      // Call database function to create backup
      const { error } = await supabase.rpc('create_badge_backup', {
        p_badge_id: badgeId,
        p_migration_id: migrationId,
      });

      if (error) {
        console.error('[BadgeMigrationService] Backup creation error:', {
          badgeId,
          error,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[BadgeMigrationService] Error in createBackup:', {
        badgeId,
        error,
      });
      return false;
    }
  }

  /**
   * Create migration log entry
   * Implements Requirement 9.4
   */
  private async createMigrationLog(
    migrationId: string,
    options: Required<MigrationOptions>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_migration_log')
        .insert({
          migration_id: migrationId,
          started_at: new Date().toISOString(),
          status: 'in_progress',
          total_badges: 0, // Will be updated
          migrated_badges: 0,
          failed_badges: 0,
          batch_size: options.batchSize,
          options: {
            dryRun: options.dryRun,
            createBackup: options.createBackup,
            skipErrors: options.skipErrors,
            userId: options.userId || null,
          },
          errors: [],
        });

      if (error) {
        console.error('[BadgeMigrationService] Error creating migration log:', error);
        throw error;
      }
    } catch (error) {
      console.error('[BadgeMigrationService] Error in createMigrationLog:', error);
      throw error;
    }
  }

  /**
   * Update migration progress
   * Implements Requirement 9.4
   */
  private async updateMigrationProgress(
    migrationId: string,
    migratedBadges: number,
    failedBadges: number,
    errors: MigrationError[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_migration_log')
        .update({
          migrated_badges: migratedBadges,
          failed_badges: failedBadges,
          errors: errors.map(e => ({
            badgeId: e.badgeId,
            userId: e.userId,
            error: e.error,
            timestamp: e.timestamp.toISOString(),
          })),
          updated_at: new Date().toISOString(),
        })
        .eq('migration_id', migrationId);

      if (error) {
        console.error('[BadgeMigrationService] Error updating migration progress:', error);
      }
    } catch (error) {
      console.error('[BadgeMigrationService] Error in updateMigrationProgress:', error);
    }
  }

  /**
   * Complete migration log
   * Implements Requirements 9.4, 9.5
   */
  private async completeMigrationLog(
    migrationId: string,
    status: 'completed' | 'failed' | 'rolled_back',
    totalBadges: number,
    migratedBadges: number,
    failedBadges: number,
    errors: MigrationError[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_migration_log')
        .update({
          status,
          completed_at: new Date().toISOString(),
          total_badges: totalBadges,
          migrated_badges: migratedBadges,
          failed_badges: failedBadges,
          errors: errors.map(e => ({
            badgeId: e.badgeId,
            userId: e.userId,
            error: e.error,
            timestamp: e.timestamp.toISOString(),
          })),
          updated_at: new Date().toISOString(),
        })
        .eq('migration_id', migrationId);

      if (error) {
        console.error('[BadgeMigrationService] Error completing migration log:', error);
      }
    } catch (error) {
      console.error('[BadgeMigrationService] Error in completeMigrationLog:', error);
    }
  }

  /**
   * Verify a single badge
   * Implements Requirement 9.5
   */
  private verifyBadge(badge: any): VerificationIssue[] {
    const issues: VerificationIssue[] = [];

    // Check badge_design_type
    if (badge.badge_design_type !== 'geometric') {
      issues.push({
        badgeId: badge.id,
        issue: `Badge design type is '${badge.badge_design_type}', expected 'geometric'`,
        severity: 'error',
      });
    }

    // Check primary_colors
    if (!badge.primary_colors || badge.primary_colors.length === 0) {
      issues.push({
        badgeId: badge.id,
        issue: 'Missing primary_colors',
        severity: 'error',
      });
    }

    // Check migrated_at
    if (!badge.migrated_at) {
      issues.push({
        badgeId: badge.id,
        issue: 'Missing migrated_at timestamp',
        severity: 'warning',
      });
    }

    // Check migration_version
    if (!badge.migration_version) {
      issues.push({
        badgeId: badge.id,
        issue: 'Missing migration_version',
        severity: 'warning',
      });
    }

    // Check svg_cache
    if (!badge.svg_cache) {
      issues.push({
        badgeId: badge.id,
        issue: 'Missing svg_cache',
        severity: 'warning',
      });
    }

    // Check complexity_level
    if (!badge.complexity_level) {
      issues.push({
        badgeId: badge.id,
        issue: 'Missing complexity_level',
        severity: 'warning',
      });
    }

    // Verify original metadata is preserved
    if (!badge.badge_name || !badge.tier || !badge.earned_date) {
      issues.push({
        badgeId: badge.id,
        issue: 'Original badge metadata is incomplete',
        severity: 'error',
      });
    }

    return issues;
  }

  /**
   * Generate unique migration ID
   */
  private generateMigrationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `migration-${timestamp}-${random}`;
  }

  /**
   * Reset migration state
   */
  private resetMigrationState(): void {
    this.currentMigrationId = null;
    this.migrationInProgress = false;
    this.currentProgress = 0;
    this.currentBatch = 0;
    this.totalBatches = 0;
    this.startTime = null;
  }

  /**
   * Delay helper for batch processing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get tier level number
   */
  private getTierLevel(tier: string): number {
    const tierLevels: Record<string, number> = {
      hummingbird: 0,
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
      hero: 7,
    };

    return tierLevels[tier] || 1;
  }

  /**
   * Extract primary colors from SVG
   */
  private extractPrimaryColors(svg: string): string[] {
    const colors: string[] = [];
    
    // Extract colors from gradients
    const gradientMatches = svg.matchAll(/stop-color[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of gradientMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Extract colors from fill attributes
    const fillMatches = svg.matchAll(/fill[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of fillMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Return up to 5 primary colors
    return colors.slice(0, 5);
  }

  /**
   * Extract accent colors from SVG
   */
  private extractAccentColors(svg: string): string[] {
    const colors: string[] = [];
    
    // Extract colors from stroke attributes
    const strokeMatches = svg.matchAll(/stroke[=:]["']?(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})/g);
    for (const match of strokeMatches) {
      if (match[1] && !colors.includes(match[1])) {
        colors.push(match[1]);
      }
    }

    // Return up to 3 accent colors
    return colors.slice(0, 3);
  }

  /**
   * Determine complexity level based on achievement type
   */
  private determineComplexityLevel(achievement: string): 'simple' | 'medium' | 'complex' {
    const complexAchievements = [
      'biodiversity_champion',
      'forest_protector',
      'ganggreen_hero',
    ];

    const mediumAchievements = [
      'carbon_warrior',
      'water_guardian',
      'climate_hero',
      'green_ambassador',
    ];

    if (complexAchievements.includes(achievement)) {
      return 'complex';
    }

    if (mediumAchievements.includes(achievement)) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('badge_migration_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[BadgeMigrationService] Error fetching migration history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[BadgeMigrationService] Error in getMigrationHistory:', error);
      return [];
    }
  }

  /**
   * Get migration report
   * Implements Requirement 9.5
   */
  async getMigrationReport(migrationId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('badge_migration_log')
        .select('*')
        .eq('migration_id', migrationId)
        .single();

      if (error) {
        console.error('[BadgeMigrationService] Error fetching migration report:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[BadgeMigrationService] Error in getMigrationReport:', error);
      return null;
    }
  }
}

// Export singleton instance
export const badgeMigrationService = new BadgeMigrationService();

// Export class for testing
export { BadgeMigrationService };
