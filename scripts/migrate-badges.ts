#!/usr/bin/env node
/**
 * Badge Migration CLI Tool
 * Command-line interface for migrating badges to geometric design
 * Implements Requirements 9.1, 9.2, 9.3
 */

import { createClient } from '@supabase/supabase-js';
import { badgeMigrationService } from '../src/services/badgeMigration.service';
import type { MigrationOptions, MigrationResult } from '../src/services/badgeMigration.service';

// Service Role Key provided by User
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wobpryllvdjaapzjbsxx.supabase.co';

if (SERVICE_ROLE_KEY) {
  console.log('Using Service Role Key for Admin Access');
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  // Inject admin client
  badgeMigrationService.setClient(adminClient);
} else {
  console.warn('WARNING: No Service Role Key found. Script may fail due to RLS.');
}

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
 * Print progress bar
 */
function printProgress(current: number, total: number, label: string = 'Progress'): void {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${current}/${total})`);
  
  if (current === total) {
    process.stdout.write('\n');
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  command: string;
  options: MigrationOptions;
  help: boolean;
} {
  const args = process.argv.slice(2);
  
  const options: MigrationOptions = {
    batchSize: 100,
    dryRun: false,
    createBackup: true,
    skipErrors: false,
    delayBetweenBatches: 1000,
  };

  let command = 'migrate';
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;

      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;

      case '--batch-size':
      case '-b':
        const batchSize = parseInt(args[++i], 10);
        if (isNaN(batchSize) || batchSize < 1) {
          printError('Invalid batch size. Must be a positive integer.');
          process.exit(1);
        }
        options.batchSize = batchSize;
        break;

      case '--no-backup':
        options.createBackup = false;
        break;

      case '--skip-errors':
      case '-s':
        options.skipErrors = true;
        break;

      case '--delay':
        const delay = parseInt(args[++i], 10);
        if (isNaN(delay) || delay < 0) {
          printError('Invalid delay. Must be a non-negative integer.');
          process.exit(1);
        }
        options.delayBetweenBatches = delay;
        break;

      case '--user':
      case '-u':
        options.userId = args[++i];
        break;

      case 'status':
        command = 'status';
        break;

      case 'migrate':
        command = 'migrate';
        break;

      default:
        if (!arg.startsWith('-')) {
          command = arg;
        } else {
          printError(`Unknown option: ${arg}`);
          help = true;
        }
    }
  }

  return { command, options, help };
}

/**
 * Print help message
 */
function printHelp(): void {
  printHeader('Badge Migration CLI Tool');
  
  print('\nUSAGE:', 'bright');
  print('  npm run migrate-badges [command] [options]');
  print('  node scripts/migrate-badges.ts [command] [options]');
  
  print('\nCOMMANDS:', 'bright');
  print('  migrate    Migrate badges to geometric design (default)');
  print('  status     Check current migration status');
  
  print('\nOPTIONS:', 'bright');
  print('  -h, --help              Show this help message');
  print('  -d, --dry-run           Run migration without making changes');
  print('  -b, --batch-size <n>    Number of badges per batch (default: 100)');
  print('  --no-backup             Skip creating backups before migration');
  print('  -s, --skip-errors       Continue processing if errors occur');
  print('  --delay <ms>            Delay between batches in milliseconds (default: 1000)');
  print('  -u, --user <userId>     Migrate badges for specific user only');
  
  print('\nEXAMPLES:', 'bright');
  print('  # Dry run to preview migration');
  print('  npm run migrate-badges -- --dry-run');
  print('');
  print('  # Migrate with custom batch size');
  print('  npm run migrate-badges -- --batch-size 50');
  print('');
  print('  # Migrate specific user');
  print('  npm run migrate-badges -- --user abc123');
  print('');
  print('  # Check migration status');
  print('  npm run migrate-badges status');
  print('');
  print('  # Migrate without backups (not recommended)');
  print('  npm run migrate-badges -- --no-backup --skip-errors');
  
  print('\nNOTES:', 'bright');
  print('  - Always run with --dry-run first to preview changes');
  print('  - Backups are strongly recommended (enabled by default)');
  print('  - Use --skip-errors cautiously as it may skip failed badges');
  print('  - Monitor progress in real-time during migration');
  print('');
}

/**
 * Print migration summary
 */
function printMigrationSummary(result: MigrationResult): void {
  printHeader('Migration Summary');
  
  print(`\nMigration ID: ${result.migrationId}`, 'cyan');
  print(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  print(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`, result.success ? 'green' : 'red');
  
  print('\nStatistics:', 'bright');
  print(`  Total Badges:    ${result.totalBadges}`);
  print(`  Migrated:        ${result.migratedBadges}`, 'green');
  print(`  Failed:          ${result.failedBadges}`, result.failedBadges > 0 ? 'red' : 'reset');
  
  if (result.skippedBadges !== undefined && result.skippedBadges > 0) {
    print(`  Skipped:         ${result.skippedBadges}`, 'yellow');
  }
  
  if (result.errors.length > 0) {
    print('\nErrors:', 'red');
    const maxErrors = 10;
    const errorsToShow = result.errors.slice(0, maxErrors);
    
    errorsToShow.forEach((error, index) => {
      print(`  ${index + 1}. Badge ${error.badgeId} (User: ${error.userId})`);
      print(`     ${error.error}`, 'dim');
    });
    
    if (result.errors.length > maxErrors) {
      print(`  ... and ${result.errors.length - maxErrors} more errors`, 'dim');
    }
  }
  
  print('');
}

/**
 * Run migration with progress tracking
 */
async function runMigration(options: MigrationOptions): Promise<void> {
  printHeader('Badge Migration');
  
  // Print configuration
  print('\nConfiguration:', 'bright');
  print(`  Batch Size:      ${options.batchSize}`);
  print(`  Dry Run:         ${options.dryRun ? 'YES' : 'NO'}`, options.dryRun ? 'yellow' : 'reset');
  print(`  Create Backup:   ${options.createBackup ? 'YES' : 'NO'}`, options.createBackup ? 'green' : 'red');
  print(`  Skip Errors:     ${options.skipErrors ? 'YES' : 'NO'}`, options.skipErrors ? 'yellow' : 'reset');
  print(`  Delay:           ${options.delayBetweenBatches}ms`);
  
  if (options.userId) {
    print(`  User ID:         ${options.userId}`, 'cyan');
  }
  
  if (options.dryRun) {
    printWarning('DRY RUN MODE - No changes will be made to the database');
  }
  
  if (!options.createBackup) {
    printWarning('Backups are disabled - Cannot rollback if issues occur!');
  }
  
  print('');
  
  // Confirm before proceeding (unless dry run)
  if (!options.dryRun) {
    printInfo('Starting migration in 3 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  printInfo('Starting migration...\n');
  
  // Start migration
  const startTime = Date.now();
  
  // Track progress
  const progressInterval = setInterval(async () => {
    try {
      const status = await badgeMigrationService.getMigrationStatus();
      
      if (status.inProgress) {
        printProgress(status.progress, 100, 'Migration Progress');
        
        if (status.currentBatch > 0 && status.totalBatches > 0) {
          print(`  Batch ${status.currentBatch}/${status.totalBatches}`, 'dim');
        }
      }
    } catch (error) {
      // Ignore errors during progress tracking
    }
  }, 2000);
  
  try {
    // Run migration
    const result = await badgeMigrationService.migrateAllBadges(options);
    
    // Stop progress tracking
    clearInterval(progressInterval);
    
    // Print final progress
    printProgress(100, 100, 'Migration Progress');
    
    // Print summary
    printMigrationSummary(result);
    
    // Exit with appropriate code
    if (result.success) {
      if (result.failedBadges > 0) {
        printWarning(`Migration completed with ${result.failedBadges} failures`);
        process.exit(1);
      } else {
        printSuccess('Migration completed successfully!');
        process.exit(0);
      }
    } else {
      printError('Migration failed!');
      process.exit(1);
    }
  } catch (error) {
    clearInterval(progressInterval);
    printError(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Check migration status
 */
async function checkStatus(): Promise<void> {
  printHeader('Migration Status');
  
  try {
    const status = await badgeMigrationService.getMigrationStatus();
    
    if (!status.inProgress) {
      printInfo('No migration currently in progress');
      
      // Try to get latest migration from history
      const history = await badgeMigrationService.getMigrationHistory(1);
      
      if (history.length > 0) {
        const latest = history[0];
        print('\nLatest Migration:', 'bright');
        print(`  Migration ID:    ${latest.migration_id}`);
        print(`  Status:          ${latest.status}`);
        print(`  Started:         ${new Date(latest.started_at).toLocaleString()}`);
        
        if (latest.completed_at) {
          print(`  Completed:       ${new Date(latest.completed_at).toLocaleString()}`);
        }
        
        print(`  Total Badges:    ${latest.total_badges}`);
        print(`  Migrated:        ${latest.migrated_badges}`, 'green');
        print(`  Failed:          ${latest.failed_badges}`, latest.failed_badges > 0 ? 'red' : 'reset');
      }
    } else {
      printInfo('Migration in progress');
      print('\nProgress:', 'bright');
      print(`  Migration ID:    ${status.migrationId}`);
      print(`  Progress:        ${status.progress}%`);
      print(`  Current Batch:   ${status.currentBatch}/${status.totalBatches}`);
      
      if (status.startedAt) {
        print(`  Started:         ${status.startedAt.toLocaleString()}`);
      }
      
      if (status.estimatedCompletion) {
        print(`  Est. Completion: ${status.estimatedCompletion.toLocaleString()}`);
      }
      
      printProgress(status.progress, 100, '\nProgress Bar');
    }
    
    print('');
  } catch (error) {
    printError(`Failed to get status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { command, options, help } = parseArgs();
  
  if (help) {
    printHelp();
    process.exit(0);
  }
  
  try {
    switch (command) {
      case 'migrate':
        await runMigration(options);
        break;
      
      case 'status':
        await checkStatus();
        break;
      
      default:
        printError(`Unknown command: ${command}`);
        printInfo('Run with --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    printError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export { main, runMigration, checkStatus };
