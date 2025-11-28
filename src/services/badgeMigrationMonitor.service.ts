/**
 * Badge Migration Monitor Service
 * Tracks migration progress, monitors error rates, and alerts on failures
 * Requirements: 9.4, 9.5
 */

import { supabase } from './supabase';

/**
 * Migration event types
 */
export type MigrationEventType =
  | 'started'
  | 'batch_complete'
  | 'error'
  | 'completed'
  | 'failed'
  | 'rolled_back';

/**
 * Migration monitoring event
 */
export interface MigrationMonitoringEvent {
  id?: string;
  migration_id: string;
  event_type: MigrationEventType;
  batch_number?: number;
  badges_processed?: number;
  badges_failed?: number;
  error_count?: number;
  error_rate?: number;
  duration_ms?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Migration progress data
 */
export interface MigrationProgress {
  migrationId: string;
  status: 'in_progress' | 'completed' | 'failed';
  totalBadges: number;
  processedBadges: number;
  failedBadges: number;
  currentBatch: number;
  totalBatches: number;
  errorRate: number;
  avgBatchDuration: number;
  estimatedTimeRemaining: number;
  startedAt: Date;
  lastUpdated: Date;
}

/**
 * Migration error summary
 */
export interface MigrationErrorSummary {
  migrationId: string;
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  recentErrors: Array<{
    badgeId: string;
    error: string;
    timestamp: Date;
  }>;
}

/**
 * Migration alert
 */
export interface MigrationAlert {
  type: 'high_error_rate' | 'slow_progress' | 'batch_failure' | 'migration_stalled';
  migrationId: string;
  message: string;
  severity: 'warning' | 'critical';
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Badge Migration Monitor Service Class
 */
class BadgeMigrationMonitorService {
  private readonly ERROR_RATE_WARNING_THRESHOLD = 5; // 5%
  private readonly ERROR_RATE_CRITICAL_THRESHOLD = 10; // 10%
  private readonly SLOW_BATCH_THRESHOLD = 60000; // 60 seconds

  /**
   * Track migration start
   */
  async trackMigrationStart(
    migrationId: string,
    totalBadges: number,
    batchSize: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const event: MigrationMonitoringEvent = {
        migration_id: migrationId,
        event_type: 'started',
        badges_processed: 0,
        badges_failed: 0,
        error_count: 0,
        error_rate: 0,
        metadata: {
          ...metadata,
          totalBadges,
          batchSize,
          totalBatches: Math.ceil(totalBadges / batchSize),
        },
      };

      await this.recordEvent(event);

      console.log(`[MigrationMonitor] Migration ${migrationId} started - ${totalBadges} badges`);
    } catch (error) {
      console.error('[MigrationMonitor] Error tracking migration start:', error);
    }
  }

  /**
   * Track batch completion
   */
  async trackBatchComplete(
    migrationId: string,
    batchNumber: number,
    badgesProcessed: number,
    badgesFailed: number,
    durationMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const errorRate = badgesProcessed > 0
        ? (badgesFailed / badgesProcessed) * 100
        : 0;

      const event: MigrationMonitoringEvent = {
        migration_id: migrationId,
        event_type: 'batch_complete',
        batch_number: batchNumber,
        badges_processed: badgesProcessed,
        badges_failed: badgesFailed,
        error_count: badgesFailed,
        error_rate: errorRate,
        duration_ms: durationMs,
        metadata,
      };

      await this.recordEvent(event);

      // Check for alerts
      if (errorRate >= this.ERROR_RATE_CRITICAL_THRESHOLD) {
        await this.triggerAlert({
          type: 'high_error_rate',
          migrationId,
          message: `Batch ${batchNumber} has ${errorRate.toFixed(2)}% error rate (critical threshold: ${this.ERROR_RATE_CRITICAL_THRESHOLD}%)`,
          severity: 'critical',
          metadata: { batchNumber, errorRate, badgesFailed },
          timestamp: new Date(),
        });
      } else if (errorRate >= this.ERROR_RATE_WARNING_THRESHOLD) {
        await this.triggerAlert({
          type: 'high_error_rate',
          migrationId,
          message: `Batch ${batchNumber} has ${errorRate.toFixed(2)}% error rate (warning threshold: ${this.ERROR_RATE_WARNING_THRESHOLD}%)`,
          severity: 'warning',
          metadata: { batchNumber, errorRate, badgesFailed },
          timestamp: new Date(),
        });
      }

      if (durationMs > this.SLOW_BATCH_THRESHOLD) {
        await this.triggerAlert({
          type: 'slow_progress',
          migrationId,
          message: `Batch ${batchNumber} took ${(durationMs / 1000).toFixed(2)}s (threshold: ${this.SLOW_BATCH_THRESHOLD / 1000}s)`,
          severity: 'warning',
          metadata: { batchNumber, durationMs },
          timestamp: new Date(),
        });
      }

      console.log(`[MigrationMonitor] Batch ${batchNumber} complete - ${badgesProcessed} processed, ${badgesFailed} failed`);
    } catch (error) {
      console.error('[MigrationMonitor] Error tracking batch completion:', error);
    }
  }

  /**
   * Track migration error
   */
  async trackMigrationError(
    migrationId: string,
    badgeId: string,
    error: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const event: MigrationMonitoringEvent = {
        migration_id: migrationId,
        event_type: 'error',
        error_count: 1,
        metadata: {
          ...metadata,
          badgeId,
          error,
        },
      };

      await this.recordEvent(event);

      console.error(`[MigrationMonitor] Migration error for badge ${badgeId}:`, error);
    } catch (error) {
      console.error('[MigrationMonitor] Error tracking migration error:', error);
    }
  }

  /**
   * Track migration completion
   */
  async trackMigrationComplete(
    migrationId: string,
    totalProcessed: number,
    totalFailed: number,
    durationMs: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const errorRate = totalProcessed > 0
        ? (totalFailed / totalProcessed) * 100
        : 0;

      const event: MigrationMonitoringEvent = {
        migration_id: migrationId,
        event_type: 'completed',
        badges_processed: totalProcessed,
        badges_failed: totalFailed,
        error_count: totalFailed,
        error_rate: errorRate,
        duration_ms: durationMs,
        metadata,
      };

      await this.recordEvent(event);

      console.log(`[MigrationMonitor] Migration ${migrationId} completed - ${totalProcessed} processed, ${totalFailed} failed in ${(durationMs / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error('[MigrationMonitor] Error tracking migration completion:', error);
    }
  }

  /**
   * Track migration failure
   */
  async trackMigrationFailed(
    migrationId: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const event: MigrationMonitoringEvent = {
        migration_id: migrationId,
        event_type: 'failed',
        metadata: {
          ...metadata,
          reason,
        },
      };

      await this.recordEvent(event);

      await this.triggerAlert({
        type: 'batch_failure',
        migrationId,
        message: `Migration ${migrationId} failed: ${reason}`,
        severity: 'critical',
        metadata: { reason },
        timestamp: new Date(),
      });

      console.error(`[MigrationMonitor] Migration ${migrationId} failed:`, reason);
    } catch (error) {
      console.error('[MigrationMonitor] Error tracking migration failure:', error);
    }
  }

  /**
   * Get migration progress
   */
  async getMigrationProgress(migrationId: string): Promise<MigrationProgress | null> {
    try {
      const { data, error } = await supabase
        .from('badge_migration_monitoring')
        .select('*')
        .eq('migration_id', migrationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[MigrationMonitor] Error fetching progress:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Find start event
      const startEvent = data.find(e => e.event_type === 'started');
      if (!startEvent) {
        return null;
      }

      // Calculate totals from batch events
      const batchEvents = data.filter(e => e.event_type === 'batch_complete');
      const totalProcessed = batchEvents.reduce((sum, e) => sum + (e.badges_processed || 0), 0);
      const totalFailed = batchEvents.reduce((sum, e) => sum + (e.badges_failed || 0), 0);

      const totalBadges = startEvent.metadata?.totalBadges || 0;
      const totalBatches = startEvent.metadata?.totalBatches || 0;
      const currentBatch = batchEvents.length;

      const errorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;

      // Calculate average batch duration
      const batchDurations = batchEvents
        .map(e => e.duration_ms)
        .filter(d => d !== null && d !== undefined);
      const avgBatchDuration = batchDurations.length > 0
        ? batchDurations.reduce((sum, d) => sum + d, 0) / batchDurations.length
        : 0;

      // Estimate time remaining
      const remainingBatches = totalBatches - currentBatch;
      const estimatedTimeRemaining = remainingBatches * avgBatchDuration;

      // Determine status
      const completedEvent = data.find(e => e.event_type === 'completed');
      const failedEvent = data.find(e => e.event_type === 'failed');
      const status = completedEvent ? 'completed' : failedEvent ? 'failed' : 'in_progress';

      const lastEvent = data[data.length - 1];

      return {
        migrationId,
        status,
        totalBadges,
        processedBadges: totalProcessed,
        failedBadges: totalFailed,
        currentBatch,
        totalBatches,
        errorRate: Math.round(errorRate * 100) / 100,
        avgBatchDuration: Math.round(avgBatchDuration),
        estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
        startedAt: new Date(startEvent.created_at),
        lastUpdated: new Date(lastEvent.created_at),
      };
    } catch (error) {
      console.error('[MigrationMonitor] Error getting migration progress:', error);
      return null;
    }
  }

  /**
   * Get migration error summary
   */
  async getMigrationErrorSummary(migrationId: string): Promise<MigrationErrorSummary | null> {
    try {
      // Get all error events
      const { data: errorEvents, error: errorEventsError } = await supabase
        .from('badge_migration_monitoring')
        .select('*')
        .eq('migration_id', migrationId)
        .eq('event_type', 'error')
        .order('created_at', { ascending: false });

      if (errorEventsError) {
        console.error('[MigrationMonitor] Error fetching error events:', errorEventsError);
        return null;
      }

      // Get migration log errors
      const { data: logErrors, error: logErrorsError } = await supabase
        .from('badge_migration_log')
        .select('errors')
        .eq('migration_id', migrationId)
        .single();

      if (logErrorsError && logErrorsError.code !== 'PGRST116') {
        console.error('[MigrationMonitor] Error fetching log errors:', logErrorsError);
      }

      const totalErrors = errorEvents?.length || 0;
      const errors = logErrors?.errors || [];

      // Calculate error rate
      const progress = await this.getMigrationProgress(migrationId);
      const errorRate = progress
        ? (progress.failedBadges / progress.processedBadges) * 100
        : 0;

      // Group errors by type
      const errorsByType: Record<string, number> = {};
      errors.forEach((err: any) => {
        const errorType = err.error?.split(':')[0] || 'Unknown';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      });

      // Get recent errors
      const recentErrors = errors.slice(0, 10).map((err: any) => ({
        badgeId: err.badgeId,
        error: err.error,
        timestamp: new Date(err.timestamp),
      }));

      return {
        migrationId,
        totalErrors,
        errorRate: Math.round(errorRate * 100) / 100,
        errorsByType,
        recentErrors,
      };
    } catch (error) {
      console.error('[MigrationMonitor] Error getting error summary:', error);
      return null;
    }
  }

  /**
   * Get all active migrations
   */
  async getActiveMigrations(): Promise<MigrationProgress[]> {
    try {
      // Get all migration IDs with started events but no completed/failed events
      const { data, error } = await supabase
        .from('badge_migration_monitoring')
        .select('migration_id')
        .eq('event_type', 'started');

      if (error) {
        console.error('[MigrationMonitor] Error fetching active migrations:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get progress for each migration
      const progressPromises = data.map(({ migration_id }) =>
        this.getMigrationProgress(migration_id)
      );

      const allProgress = await Promise.all(progressPromises);

      // Filter to only in-progress migrations
      return allProgress.filter(
        (p): p is MigrationProgress => p !== null && p.status === 'in_progress'
      );
    } catch (error) {
      console.error('[MigrationMonitor] Error getting active migrations:', error);
      return [];
    }
  }

  /**
   * Get migration dashboard data
   */
  async getMigrationDashboard(migrationId?: string) {
    try {
      if (migrationId) {
        // Get specific migration data
        const [progress, errorSummary] = await Promise.all([
          this.getMigrationProgress(migrationId),
          this.getMigrationErrorSummary(migrationId),
        ]);

        return {
          migration: progress,
          errors: errorSummary,
          timestamp: new Date().toISOString(),
        };
      } else {
        // Get all active migrations
        const activeMigrations = await this.getActiveMigrations();

        return {
          activeMigrations,
          totalActive: activeMigrations.length,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('[MigrationMonitor] Error getting dashboard:', error);
      throw error;
    }
  }

  /**
   * Record a monitoring event
   */
  private async recordEvent(event: MigrationMonitoringEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('badge_migration_monitoring')
        .insert(event);

      if (error) {
        console.error('[MigrationMonitor] Error recording event:', error);
      }
    } catch (error) {
      console.error('[MigrationMonitor] Error recording event:', error);
    }
  }

  /**
   * Trigger a migration alert
   */
  private async triggerAlert(alert: MigrationAlert): Promise<void> {
    try {
      console.warn('[MigrationMonitor] Migration Alert:', alert);

      // Store alert in performance alerts table
      const { error } = await supabase
        .from('badge_performance_alerts')
        .insert({
          alert_type: alert.type,
          threshold: 0,
          current_value: 0,
          message: alert.message,
          severity: alert.severity,
          created_at: alert.timestamp.toISOString(),
        });

      if (error) {
        console.error('[MigrationMonitor] Error storing alert:', error);
      }
    } catch (error) {
      console.error('[MigrationMonitor] Error triggering alert:', error);
    }
  }

  /**
   * Check for stalled migrations
   */
  async checkForStalledMigrations(stalledThresholdMinutes: number = 30): Promise<void> {
    try {
      const activeMigrations = await this.getActiveMigrations();

      const now = new Date();
      const stalledThreshold = stalledThresholdMinutes * 60 * 1000;

      for (const migration of activeMigrations) {
        const timeSinceUpdate = now.getTime() - migration.lastUpdated.getTime();

        if (timeSinceUpdate > stalledThreshold) {
          await this.triggerAlert({
            type: 'migration_stalled',
            migrationId: migration.migrationId,
            message: `Migration ${migration.migrationId} has not updated in ${Math.round(timeSinceUpdate / 60000)} minutes`,
            severity: 'critical',
            metadata: {
              lastUpdated: migration.lastUpdated,
              timeSinceUpdate,
            },
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('[MigrationMonitor] Error checking for stalled migrations:', error);
    }
  }
}

// Export singleton instance
export const badgeMigrationMonitor = new BadgeMigrationMonitorService();
