/**
 * Badge Migration Service - Usage Examples
 * Demonstrates how to use the badge migration service
 */

import { badgeMigrationService } from './badgeMigration.service';

/**
 * Example 1: Migrate all badges with default options
 */
export async function exampleMigrateAll() {
  console.log('Starting migration of all badges...');
  
  const result = await badgeMigrationService.migrateAllBadges({
    batchSize: 100,
    createBackup: true,
    skipErrors: false,
  });

  console.log('Migration completed:', {
    success: result.success,
    totalBadges: result.totalBadges,
    migratedBadges: result.migratedBadges,
    failedBadges: result.failedBadges,
    duration: `${result.duration}ms`,
    migrationId: result.migrationId,
  });

  if (result.errors.length > 0) {
    console.error('Migration errors:', result.errors);
  }

  return result;
}

/**
 * Example 2: Dry run migration (test without making changes)
 */
export async function exampleDryRun() {
  console.log('Running dry-run migration...');
  
  const result = await badgeMigrationService.migrateAllBadges({
    dryRun: true,
    createBackup: false, // No need for backups in dry run
  });

  console.log('Dry run completed:', {
    totalBadges: result.totalBadges,
    wouldMigrate: result.migratedBadges,
    wouldFail: result.failedBadges,
  });

  return result;
}

/**
 * Example 3: Migrate badges for specific user
 */
export async function exampleMigrateUser(userId: string) {
  console.log(`Migrating badges for user: ${userId}`);
  
  const result = await badgeMigrationService.migrateUserBadges(userId);

  console.log('User migration completed:', {
    success: result.success,
    totalBadges: result.totalBadges,
    migratedBadges: result.migratedBadges,
  });

  return result;
}

/**
 * Example 4: Monitor migration progress
 */
export async function exampleMonitorProgress() {
  console.log('Checking migration status...');
  
  const status = await badgeMigrationService.getMigrationStatus();

  if (status.inProgress) {
    console.log('Migration in progress:', {
      progress: `${status.progress}%`,
      currentBatch: status.currentBatch,
      totalBatches: status.totalBatches,
      estimatedCompletion: status.estimatedCompletion,
    });
  } else {
    console.log('No migration currently in progress');
  }

  return status;
}

/**
 * Example 5: Rollback migration
 */
export async function exampleRollback(migrationId: string) {
  console.log(`Rolling back migration: ${migrationId}`);
  
  const success = await badgeMigrationService.rollbackMigration(migrationId);

  if (success) {
    console.log('Rollback completed successfully');
  } else {
    console.error('Rollback failed');
  }

  return success;
}

/**
 * Example 6: Verify migration
 */
export async function exampleVerify() {
  console.log('Verifying migration...');
  
  const verification = await badgeMigrationService.verifyMigration();

  console.log('Verification results:', {
    verified: verification.verified,
    totalChecked: verification.totalChecked,
    passed: verification.passed,
    failed: verification.failed,
  });

  if (verification.issues.length > 0) {
    console.log('Issues found:');
    verification.issues.forEach(issue => {
      console.log(`  [${issue.severity}] Badge ${issue.badgeId}: ${issue.issue}`);
    });
  }

  return verification;
}

/**
 * Example 7: View migration history
 */
export async function exampleHistory() {
  console.log('Fetching migration history...');
  
  const history = await badgeMigrationService.getMigrationHistory(10);

  console.log(`Found ${history.length} past migrations:`);
  history.forEach(migration => {
    console.log(`  ${migration.migration_id}: ${migration.status} - ${migration.migrated_badges}/${migration.total_badges} badges`);
  });

  return history;
}

/**
 * Example 8: Get detailed migration report
 */
export async function exampleReport(migrationId: string) {
  console.log(`Fetching report for migration: ${migrationId}`);
  
  const report = await badgeMigrationService.getMigrationReport(migrationId);

  if (report) {
    console.log('Migration report:', {
      migrationId: report.migration_id,
      status: report.status,
      startedAt: report.started_at,
      completedAt: report.completed_at,
      totalBadges: report.total_badges,
      migratedBadges: report.migrated_badges,
      failedBadges: report.failed_badges,
      batchSize: report.batch_size,
    });

    if (report.errors && report.errors.length > 0) {
      console.log(`Errors: ${report.errors.length}`);
    }
  } else {
    console.log('Migration report not found');
  }

  return report;
}

/**
 * Example 9: Complete migration workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('=== Complete Migration Workflow ===\n');

  // Step 1: Dry run to test
  console.log('Step 1: Dry run...');
  const dryRunResult = await exampleDryRun();
  console.log(`Would migrate ${dryRunResult.totalBadges} badges\n`);

  // Step 2: Run actual migration
  console.log('Step 2: Running migration...');
  const migrationResult = await exampleMigrateAll();
  const migrationId = migrationResult.migrationId;
  console.log(`Migration ID: ${migrationId}\n`);

  // Step 3: Verify migration
  console.log('Step 3: Verifying migration...');
  const verification = await exampleVerify();
  console.log(`Verification: ${verification.verified ? 'PASSED' : 'FAILED'}\n`);

  // Step 4: Get detailed report
  console.log('Step 4: Getting report...');
  await exampleReport(migrationId);

  console.log('\n=== Workflow Complete ===');

  return {
    migrationResult,
    verification,
  };
}

/**
 * Example 10: Migration with custom options
 */
export async function exampleCustomOptions() {
  console.log('Running migration with custom options...');
  
  const result = await badgeMigrationService.migrateAllBadges({
    batchSize: 50,           // Smaller batches
    createBackup: true,      // Create backups
    skipErrors: true,        // Continue on errors
    delayBetweenBatches: 2000, // 2 second delay
  });

  console.log('Custom migration completed:', {
    success: result.success,
    totalBadges: result.totalBadges,
    migratedBadges: result.migratedBadges,
    failedBadges: result.failedBadges,
    errorCount: result.errors.length,
  });

  return result;
}

// Export all examples
export const migrationExamples = {
  migrateAll: exampleMigrateAll,
  dryRun: exampleDryRun,
  migrateUser: exampleMigrateUser,
  monitorProgress: exampleMonitorProgress,
  rollback: exampleRollback,
  verify: exampleVerify,
  history: exampleHistory,
  report: exampleReport,
  completeWorkflow: exampleCompleteWorkflow,
  customOptions: exampleCustomOptions,
};
