#!/usr/bin/env node
/**
 * Badge Migration Verification Script
 * Verifies all badges migrated successfully and checks data integrity
 * Implements Requirement 9.5
 */

import { badgeMigrationService } from '../src/services/badgeMigration.service';
import { supabase } from '../src/services/supabase';
import type { VerificationResult, VerificationIssue } from '../src/services/badgeMigration.service';

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
  detailed: boolean;
  exportReport: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  
  let migrationId: string | undefined;
  let detailed = false;
  let exportReport = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        help = true;
        break;

      case '--detailed':
      case '-d':
        detailed = true;
        break;

      case '--export':
      case '-e':
        exportReport = true;
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

  return { migrationId, detailed, exportReport, help };
}

/**
 * Print help message
 */
function printHelp(): void {
  printHeader('Badge Migration Verification Script');
  
  print('\nUSAGE:', 'bright');
  print('  npm run verify-migration [options]');
  print('  node scripts/verify-migration.ts [options]');
  
  print('\nOPTIONS:', 'bright');
  print('  -h, --help                Show this help message');
  print('  -m, --migration-id <id>   Verify specific migration by ID');
  print('  -d, --detailed            Show detailed verification results');
  print('  -e, --export              Export verification report to file');
  
  print('\nEXAMPLES:', 'bright');
  print('  # Verify all migrated badges');
  print('  npm run verify-migration');
  print('');
  print('  # Verify specific migration');
  print('  npm run verify-migration -- --migration-id migration-123456');
  print('');
  print('  # Detailed verification with export');
  print('  npm run verify-migration -- --detailed --export');
  
  print('\nVERIFICATION CHECKS:', 'bright');
  print('  ✓ Badge design type is "geometric"');
  print('  ✓ Primary colors are present');
  print('  ✓ Migration timestamp exists');
  print('  ✓ Migration version is set');
  print('  ✓ SVG cache is populated');
  print('  ✓ Complexity level is defined');
  print('  ✓ Original metadata is preserved');
  print('');
}

/**
 * Print verification summary
 */
function printVerificationSummary(result: VerificationResult): void {
  printHeader('Verification Summary');
  
  print(`\nStatus: ${result.verified ? 'PASSED' : 'FAILED'}`, result.verified ? 'green' : 'red');
  
  print('\nStatistics:', 'bright');
  print(`  Total Checked:   ${result.totalChecked}`);
  print(`  Passed:          ${result.passed}`, 'green');
  print(`  Failed:          ${result.failed}`, result.failed > 0 ? 'red' : 'reset');
  
  if (result.failed > 0) {
    const errorCount = result.issues.filter(i => i.severity === 'error').length;
    const warningCount = result.issues.filter(i => i.severity === 'warning').length;
    
    print(`  Errors:          ${errorCount}`, 'red');
    print(`  Warnings:        ${warningCount}`, 'yellow');
  }
  
  print('');
}

/**
 * Print verification issues
 */
function printVerificationIssues(issues: VerificationIssue[], detailed: boolean): void {
  if (issues.length === 0) {
    printSuccess('No issues found!');
    return;
  }
  
  printHeader('Verification Issues');
  
  // Group issues by severity
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    print('\nERRORS:', 'red');
    const maxErrors = detailed ? errors.length : 20;
    
    errors.slice(0, maxErrors).forEach((issue, index) => {
      print(`  ${index + 1}. Badge ${issue.badgeId}`, 'red');
      print(`     ${issue.issue}`, 'dim');
    });
    
    if (errors.length > maxErrors) {
      print(`  ... and ${errors.length - maxErrors} more errors`, 'dim');
    }
  }
  
  if (warnings.length > 0) {
    print('\nWARNINGS:', 'yellow');
    const maxWarnings = detailed ? warnings.length : 20;
    
    warnings.slice(0, maxWarnings).forEach((issue, index) => {
      print(`  ${index + 1}. Badge ${issue.badgeId}`, 'yellow');
      print(`     ${issue.issue}`, 'dim');
    });
    
    if (warnings.length > maxWarnings) {
      print(`  ... and ${warnings.length - maxWarnings} more warnings`, 'dim');
    }
  }
  
  print('');
}

/**
 * Get migration statistics
 */
async function getMigrationStatistics(): Promise<{
  totalBadges: number;
  migratedBadges: number;
  classicBadges: number;
  geometricBadges: number;
}> {
  try {
    // Get total badges
    const { count: totalBadges } = await supabase
      .from('nft_badges')
      .select('*', { count: 'exact', head: true });
    
    // Get migrated badges
    const { count: migratedBadges } = await supabase
      .from('nft_badges')
      .select('*', { count: 'exact', head: true })
      .not('migrated_at', 'is', null);
    
    // Get classic badges
    const { count: classicBadges } = await supabase
      .from('nft_badges')
      .select('*', { count: 'exact', head: true })
      .or('badge_design_type.is.null,badge_design_type.eq.classic');
    
    // Get geometric badges
    const { count: geometricBadges } = await supabase
      .from('nft_badges')
      .select('*', { count: 'exact', head: true })
      .eq('badge_design_type', 'geometric');
    
    return {
      totalBadges: totalBadges || 0,
      migratedBadges: migratedBadges || 0,
      classicBadges: classicBadges || 0,
      geometricBadges: geometricBadges || 0,
    };
  } catch (error) {
    console.error('Error getting migration statistics:', error);
    return {
      totalBadges: 0,
      migratedBadges: 0,
      classicBadges: 0,
      geometricBadges: 0,
    };
  }
}

/**
 * Print migration statistics
 */
function printMigrationStatistics(stats: {
  totalBadges: number;
  migratedBadges: number;
  classicBadges: number;
  geometricBadges: number;
}): void {
  printHeader('Migration Statistics');
  
  print('\nBadge Counts:', 'bright');
  print(`  Total Badges:      ${stats.totalBadges}`);
  print(`  Geometric Badges:  ${stats.geometricBadges}`, 'green');
  print(`  Classic Badges:    ${stats.classicBadges}`, stats.classicBadges > 0 ? 'yellow' : 'reset');
  print(`  Migrated Badges:   ${stats.migratedBadges}`, 'cyan');
  
  if (stats.totalBadges > 0) {
    const geometricPercentage = ((stats.geometricBadges / stats.totalBadges) * 100).toFixed(1);
    const migratedPercentage = ((stats.migratedBadges / stats.totalBadges) * 100).toFixed(1);
    
    print('\nPercentages:', 'bright');
    print(`  Geometric:         ${geometricPercentage}%`);
    print(`  Migrated:          ${migratedPercentage}%`);
  }
  
  print('');
}

/**
 * Export verification report to file
 */
async function exportVerificationReport(
  result: VerificationResult,
  stats: any,
  migrationId?: string
): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `verification-report-${timestamp}.json`;
    
    const report = {
      timestamp: new Date().toISOString(),
      migrationId: migrationId || 'all',
      verification: result,
      statistics: stats,
    };
    
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    
    printSuccess(`Report exported to: ${filename}`);
  } catch (error) {
    printError(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify specific migration
 */
async function verifySpecificMigration(migrationId: string): Promise<void> {
  printHeader(`Verifying Migration: ${migrationId}`);
  
  try {
    // Get migration report
    const report = await badgeMigrationService.getMigrationReport(migrationId);
    
    if (!report) {
      printError(`Migration not found: ${migrationId}`);
      process.exit(1);
    }
    
    print('\nMigration Details:', 'bright');
    print(`  Migration ID:    ${report.migration_id}`);
    print(`  Status:          ${report.status}`);
    print(`  Started:         ${new Date(report.started_at).toLocaleString()}`);
    
    if (report.completed_at) {
      print(`  Completed:       ${new Date(report.completed_at).toLocaleString()}`);
    }
    
    print(`  Total Badges:    ${report.total_badges}`);
    print(`  Migrated:        ${report.migrated_badges}`, 'green');
    print(`  Failed:          ${report.failed_badges}`, report.failed_badges > 0 ? 'red' : 'reset');
    
    if (report.errors && report.errors.length > 0) {
      print('\nMigration Errors:', 'red');
      report.errors.slice(0, 10).forEach((error: any, index: number) => {
        print(`  ${index + 1}. Badge ${error.badgeId}`);
        print(`     ${error.error}`, 'dim');
      });
      
      if (report.errors.length > 10) {
        print(`  ... and ${report.errors.length - 10} more errors`, 'dim');
      }
    }
    
    print('');
  } catch (error) {
    printError(`Failed to verify migration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { migrationId, detailed, exportReport, help } = parseArgs();
  
  if (help) {
    printHelp();
    process.exit(0);
  }
  
  try {
    // If specific migration ID provided, show migration details
    if (migrationId) {
      await verifySpecificMigration(migrationId);
    }
    
    // Get migration statistics
    printInfo('Gathering migration statistics...');
    const stats = await getMigrationStatistics();
    printMigrationStatistics(stats);
    
    // Run verification
    printInfo('Running verification checks...');
    const result = await badgeMigrationService.verifyMigration();
    
    // Print summary
    printVerificationSummary(result);
    
    // Print issues
    if (result.issues.length > 0) {
      printVerificationIssues(result.issues, detailed);
    } else {
      printSuccess('All badges verified successfully!');
    }
    
    // Export report if requested
    if (exportReport) {
      await exportVerificationReport(result, stats, migrationId);
    }
    
    // Exit with appropriate code
    if (result.verified) {
      printSuccess('Verification completed successfully!');
      process.exit(0);
    } else {
      printError('Verification failed - issues found!');
      process.exit(1);
    }
  } catch (error) {
    printError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

export { main, verifySpecificMigration, getMigrationStatistics };
