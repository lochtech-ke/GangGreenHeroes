#!/usr/bin/env node
/**
 * Badge Migration Rollback Script
 * Restores badges from backup and verifies restoration
 * Implements Requirement 9.3
 */

import { badgeMigrationService } from '../src/services/badgeMigration.service';
import { supabase } from '../src/services/supabase';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Print colored message to console
 */
function print(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print error message
 */
function printError(message: string): void {
  print(`❌ ERROR: ${message}`, 'red');
}

/**
 * Print success message
 */
function printSuccess(message: string): void {
  print(`✅ ${message}`, 'green');
}

/**
 * Print warning message
 */
function printWarning(message: string): void {
  print(`⚠️  WARNING: ${message}`, 'yellow');
}

/**
 * Print info message
 */
function printInfo(message: string): void {
  print(`ℹ️  ${message}`, 'cyan');
}

/**
 * Print section header
 */
function printHeader(message: string): void {
  print(`\n${'='.repeat(60)}`, 'bright');
  print(message, 'bright');
  print('='.repeat(60), 'bright');
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  migrationId?: string;
  force: boolean;
  verify: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  
  let migrationId: string | undefined;
  let force = false;
  let verify = true;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;

      case '--force':
      case '-f':
        force = true;
        break;

      case '--no-verify':
        verify = false;
        break;

      case '--migration-id':
      case '-m':
        migrationId = args[++i];
        break;

      default:
        if (!arg.startsWith('-')) {
          migrationId = arg;
        } else {
          printError(`Unknown option: ${arg}`);
          help = true;
        }
    }
  }

  return { migrationId, force, verify, help };
}

/**
 * Print help message
 */
function printHelp(): void {
  printHeader('Badge Migration Rollback Script');
  
  print('\nUSAGE:', 'bright');
  print('  npm run rollback-migration <migration-id> [options]');
  print('  node scripts/rollback-migration.ts <migration-id> [options]');
  
  print('\nOPTIONS:', 'bright');
  print('  -h, --help                Show this help message');
  print('  -m, --migration-id <id>   Migration ID to rollback (required)');
  print('  -f, --force               Skip confirmation prompt');
  print('  --no-verify               Skip verification after rollback');
  
  print('\nEXAMPLES:', 'bright');
  print('  # Rollback specific migration');
  print('  npm run rollback-migration -- migration-123456');
  print('');
  print('  # Rollback with force (no confirmation)');
  print('  npm run rollback-migration -- --migration-id migration-123456 --force');
  print('');
  print('  # Rollback without verification');
  print('  npm run rollback-migration -- migration-123456 --no-verify');
  
  print('\nWARNING:', 'red');
  print('  Rollback will restore all badges to their pre-migration state.');
  print('  This operation cannot be undone!');
  print('  Always verify the migration ID before proceeding.');
  print('');
}

/**
 * Get migration details
 */
async function getMigrationDetails(migrationId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('badge_migration_log')
      .select('*')
      .eq('migration_id', migrationId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting migration details:', error);
    return null;
  }
}

/**
 * Get backup count for migration
 */
async function getBackupCount(migrationId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('badge_migration_backup')
      .select('*', { count: 'exact', head: true })
      .eq('migration_id', migrationId)
      .eq('restored', false);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting backup count:', error);
    return 0;
  }
}

/**
 * Print migration details
 */
function printMigrationDetails(migration: any, backupCount: number): void {
  printHeader('Migration Details');
  
  print('\nMigration Information:', 'bright');
  print(`  Migration ID:    ${migration.migration_id}`);
  print(`  Status:          ${migration.status}`);
  print(`  Started:         ${new Date(migration.started_at).toLocaleString()}`);
  
  if (migration.completed_at) {
    print(`  Completed:       ${new Date(migration.completed_at).toLocaleString()}`);
  }
  
  print(`  Total Badges:    ${migration.total_badges}`);
  print(`  Migrated:        ${migration.migrated_badges}`, 'green');
  print(`  Failed:          ${migration.failed_badges}`, migration.failed_badges > 0 ? 'red' : 'reset');
  
  print('\nBackup Information:', 'bright');
  print(`  Available Backups: ${backupCount}`, backupCount > 0 ? 'green' : 'red');
  
  if (backupCount === 0) {
    printWarning('No backups available for this migration!');
    printWarning('Rollback may not be possible.');
  }
  
  print('');
}

/**
 * Confirm rollback with user
 */
async function confirmRollback(migrationId: string, force: boolean): Promise<boolean> {
  if (force) {
    return true;
  }
  
  printWarning('This will restore all badges to their pre-migration state.');
  printWarning('This operation cannot be undone!');
  print('');
  
  // In a real CLI, we would use readline to get user input
  // For now, we'll just print a message
  printInfo('To proceed, run with --force flag');
  return false;
}

/**
 * Verify rollback
 */
async function verifyRollback(migrationId: string): Promise<{
  success: boolean;
  restoredCount: number;
  failedCount: number;
}> {
  try {
    printInfo('Verifying rollback...');
    
    // Check how many badges were restored
    const { count: restoredCount } = await supabase
      .from('badge_migration_backup')
      .select('*', { count: 'exact', head: true })
      .eq('migration_id', migrationId)
      .eq('restored', true);
    
    // Check how many backups are still pending
    const { count: pendingCount } = await supabase
      .from('badge_migration_backup')
      .select('*', { count: 'exact', head: true })
      .eq('migration_id', migrationId)
      .eq('restored', false);
    
    const success = (pendingCount || 0) === 0;
    
    return {
      success,
      restoredCount: restoredCount || 0,
      failedCount: pendingCount || 0,
    };
  } catch (error) {
    console.error('Error verifying rollback:', error);
    return {
      success: false,
      restoredCount: 0,
      failedCount: 0,
    };
  }
}

/**
 * Print rollback summary
 */
function printRollbackSummary(
  success: boolean,
  restoredCount: number,
  failedCount: number
): void {
  printHeader('Rollback Summary');
  
  print(`\nStatus: ${success ? 'SUCCESS' : 'FAILED'}`, success ? 'green' : 'red');
  
  print('\nStatistics:', 'bright');
  print(`  Restored:        ${restoredCount}`, 'green');
  print(`  Failed:          ${failedCount}`, failedCount > 0 ? 'red' : 'reset');
  
  print('');
}

/**
 * List available migrations for rollback
 */
async function listAvailableMigrations(): Promise<void> {
  printHeader('Available Migrations for Rollback');
  
  try {
    // Get recent migrations
    const { data: migrations, error } = await supabase
      .from('badge_migration_log')
      .select('*')
      .in('status', ['completed', 'failed'])
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    if (!migrations || migrations.length === 0) {
      printInfo('No migrations found');
      return;
    }

    print('\nRecent Migrations:', 'bright');
    
    for (const migration of migrations) {
      // Get backup count
      const { count: backupCount } = await supabase
        .from('badge_migration_backup')
        .select('*', { count: 'exact', head: true })
        .eq('migration_id', migration.migration_id)
        .eq('restored', false);
      
      const hasBackups = (backupCount || 0) > 0;
      const statusColor = hasBackups ? 'green' : 'red';
      
      print(`\n  Migration ID: ${migration.migration_id}`, 'cyan');
      print(`  Status:       ${migration.status}`);
      print(`  Started:      ${new Date(migration.started_at).toLocaleString()}`);
      print(`  Badges:       ${migration.migrated_badges}/${migration.total_badges}`);
      print(`  Backups:      ${backupCount || 0}`, statusColor);
      
      if (hasBackups) {
        print(`  Can Rollback: YES`, 'green');
      } else {
        print(`  Can Rollback: NO`, 'red');
      }
    }
    
    print('');
  } catch (error) {
    printError(`Failed to list migrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Log rollback operation
 */
async function logRollbackOperation(
  migrationId: string,
  success: boolean,
  restoredCount: number,
  failedCount: number
): Promise<void> {
  try {
    const logEntry = {
      migration_id: migrationId,
      operation: 'rollback',
      timestamp: new Date().toISOString(),
      success,
      restored_count: restoredCount,
      failed_count: failedCount,
    };
    
    // In a real implementation, we would store this in a rollback_log table
    console.log('Rollback operation logged:', logEntry);
  } catch (error) {
    console.error('Error logging rollback operation:', error);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { migrationId, force, verify, help } = parseArgs();
  
  if (help) {
    printHelp();
    process.exit(0);
  }
  
  // If no migration ID provided, list available migrations
  if (!migrationId) {
    await listAvailableMigrations();
    print('\nTo rollback a migration, provide the migration ID:', 'bright');
    print('  npm run rollback-migration -- <migration-id>');
    print('');
    process.exit(0);
  }
  
  try {
    // Get migration details
    printInfo(`Fetching migration details for: ${migrationId}`);
    const migration = await getMigrationDetails(migrationId);
    
    if (!migration) {
      printError(`Migration not found: ${migrationId}`);
      process.exit(1);
    }
    
    // Check if already rolled back
    if (migration.status === 'rolled_back') {
      printWarning('This migration has already been rolled back!');
      process.exit(1);
    }
    
    // Get backup count
    const backupCount = await getBackupCount(migrationId);
    
    // Print migration details
    printMigrationDetails(migration, backupCount);
    
    // Check if backups are available
    if (backupCount === 0) {
      printError('No backups available for this migration!');
      printError('Cannot proceed with rollback.');
      process.exit(1);
    }
    
    // Confirm rollback
    const confirmed = await confirmRollback(migrationId, force);
    
    if (!confirmed) {
      printInfo('Rollback cancelled');
      process.exit(0);
    }
    
    // Perform rollback
    printInfo('Starting rollback...');
    const startTime = Date.now();
    
    const success = await badgeMigrationService.rollbackMigration(migrationId);
    
    const duration = Date.now() - startTime;
    
    if (!success) {
      printError('Rollback failed!');
      process.exit(1);
    }
    
    printSuccess(`Rollback completed in ${(duration / 1000).toFixed(2)}s`);
    
    // Verify rollback if requested
    let verificationResult = {
      success: true,
      restoredCount: backupCount,
      failedCount: 0,
    };
    
    if (verify) {
      verificationResult = await verifyRollback(migrationId);
    }
    
    // Print summary
    printRollbackSummary(
      verificationResult.success,
      verificationResult.restoredCount,
      verificationResult.failedCount
    );
    
    // Log rollback operation
    await logRollbackOperation(
      migrationId,
      verificationResult.success,
      verificationResult.restoredCount,
      verificationResult.failedCount
    );
    
    // Exit with appropriate code
    if (verificationResult.success) {
      printSuccess('Rollback completed successfully!');
      process.exit(0);
    } else {
      printError('Rollback completed with errors!');
      process.exit(1);
    }
  } catch (error) {
    printError(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    printError(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    process.exit(1);
  });
}

export { main, listAvailableMigrations, verifyRollback };
