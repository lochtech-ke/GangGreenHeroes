# Badge Migration Service Guide

## Overview

The Badge Migration Service provides a comprehensive solution for migrating existing user badges from classic designs to the new geometric design system. This guide covers installation, usage, best practices, and troubleshooting.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [API Reference](#api-reference)
5. [Migration Options](#migration-options)
6. [Best Practices](#best-practices)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

## Features

- ✅ Batch processing with configurable batch sizes
- ✅ Automatic backup creation before migration
- ✅ Real-time progress tracking
- ✅ Dry-run mode for testing
- ✅ Error handling with detailed logging
- ✅ Rollback capability
- ✅ Post-migration verification
- ✅ Migration history and reporting
- ✅ User-specific migrations
- ✅ Metadata preservation

## Installation

The Badge Migration Service is included in the main application. No additional installation is required.

```typescript
import { badgeMigrationService } from '@/services';
```

## Quick Start

### 1. Test with Dry Run

Before running an actual migration, test with a dry run:

```typescript
const result = await badgeMigrationService.migrateAllBadges({
  dryRun: true,
});

console.log(`Would migrate ${result.totalBadges} badges`);
```

### 2. Run Migration

Execute the migration with default options:

```typescript
const result = await badgeMigrationService.migrateAllBadges({
  batchSize: 100,
  createBackup: true,
});

if (result.success) {
  console.log(`Successfully migrated ${result.migratedBadges} badges`);
} else {
  console.error('Migration failed:', result.errors);
}
```

### 3. Verify Migration

After migration, verify the results:

```typescript
const verification = await badgeMigrationService.verifyMigration();

if (verification.verified) {
  console.log('All badges verified successfully');
} else {
  console.log('Issues found:', verification.issues);
}
```

## API Reference

### migrateAllBadges(options?)

Migrates all user badges to geometric design.

**Parameters:**
- `options` (optional): Migration configuration options

**Returns:** `Promise<MigrationResult>`

**Example:**
```typescript
const result = await badgeMigrationService.migrateAllBadges({
  batchSize: 100,
  createBackup: true,
  skipErrors: false,
});
```

### migrateUserBadges(userId)

Migrates badges for a specific user.

**Parameters:**
- `userId` (string): User ID to migrate badges for

**Returns:** `Promise<MigrationResult>`

**Example:**
```typescript
const result = await badgeMigrationService.migrateUserBadges('user-123');
```

### getMigrationStatus()

Gets the current migration status.

**Returns:** `Promise<MigrationStatus>`

**Example:**
```typescript
const status = await badgeMigrationService.getMigrationStatus();
console.log(`Progress: ${status.progress}%`);
```

### rollbackMigration(migrationId)

Rolls back a migration using backups.

**Parameters:**
- `migrationId` (string): ID of migration to rollback

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const success = await badgeMigrationService.rollbackMigration('migration-123');
```

### verifyMigration()

Verifies all migrated badges.

**Returns:** `Promise<VerificationResult>`

**Example:**
```typescript
const verification = await badgeMigrationService.verifyMigration();
```

### getMigrationHistory(limit?)

Gets migration history.

**Parameters:**
- `limit` (optional): Number of records to return (default: 10)

**Returns:** `Promise<any[]>`

**Example:**
```typescript
const history = await badgeMigrationService.getMigrationHistory(20);
```

### getMigrationReport(migrationId)

Gets detailed report for a specific migration.

**Parameters:**
- `migrationId` (string): Migration ID

**Returns:** `Promise<any>`

**Example:**
```typescript
const report = await badgeMigrationService.getMigrationReport('migration-123');
```

## Migration Options

### MigrationOptions Interface

```typescript
interface MigrationOptions {
  batchSize?: number;           // Default: 100
  dryRun?: boolean;             // Default: false
  createBackup?: boolean;       // Default: true
  skipErrors?: boolean;         // Default: false
  delayBetweenBatches?: number; // Default: 1000 (ms)
  userId?: string;              // Optional: specific user
}
```

### Option Details

#### batchSize
- Controls how many badges are processed in each batch
- Smaller batches = slower but safer
- Larger batches = faster but more memory intensive
- Recommended: 50-200 depending on system resources

#### dryRun
- When `true`, simulates migration without making changes
- Useful for testing and estimating migration time
- No backups are created in dry-run mode

#### createBackup
- When `true`, creates backups before migration
- Enables rollback capability
- Recommended: always `true` for production

#### skipErrors
- When `true`, continues processing if errors occur
- When `false`, stops on first error
- Recommended: `false` for initial migrations, `true` for retries

#### delayBetweenBatches
- Milliseconds to wait between batches
- Prevents database overload
- Recommended: 1000-5000ms depending on load

#### userId
- When provided, only migrates badges for that user
- Useful for targeted migrations or testing

## Best Practices

### Pre-Migration

1. **Test in Staging**
   ```typescript
   // Run dry-run first
   const dryRun = await badgeMigrationService.migrateAllBadges({
     dryRun: true,
   });
   ```

2. **Check Database Health**
   - Ensure database has sufficient space
   - Verify backup systems are working
   - Check database connection stability

3. **Notify Users**
   - Inform users about upcoming migration
   - Set expectations for downtime (if any)

### During Migration

1. **Monitor Progress**
   ```typescript
   const interval = setInterval(async () => {
     const status = await badgeMigrationService.getMigrationStatus();
     console.log(`Progress: ${status.progress}%`);
     
     if (!status.inProgress) {
       clearInterval(interval);
     }
   }, 5000);
   ```

2. **Watch for Errors**
   - Monitor application logs
   - Check database performance
   - Watch for memory issues

3. **Be Ready to Rollback**
   - Keep rollback procedure ready
   - Monitor system health metrics

### Post-Migration

1. **Verify Results**
   ```typescript
   const verification = await badgeMigrationService.verifyMigration();
   ```

2. **Check Sample Badges**
   - Manually verify a sample of migrated badges
   - Test badge rendering in UI
   - Verify metadata preservation

3. **Generate Report**
   ```typescript
   const report = await badgeMigrationService.getMigrationReport(migrationId);
   ```

## Monitoring

### Real-Time Monitoring

```typescript
async function monitorMigration() {
  const status = await badgeMigrationService.getMigrationStatus();
  
  if (status.inProgress) {
    console.log({
      progress: `${status.progress}%`,
      batch: `${status.currentBatch}/${status.totalBatches}`,
      eta: status.estimatedCompletion,
    });
  }
}

// Check every 5 seconds
setInterval(monitorMigration, 5000);
```

### Database Monitoring

Monitor these tables during migration:
- `badge_migration_log` - Migration progress
- `badge_migration_backup` - Backup creation
- `nft_badges` - Badge updates

### Performance Metrics

Track these metrics:
- Migration speed (badges/second)
- Error rate
- Database query time
- Memory usage
- Cache hit rate

## Troubleshooting

### Migration Fails to Start

**Problem:** Migration returns error immediately

**Solutions:**
1. Check if another migration is in progress
2. Verify database connection
3. Check user permissions
4. Review application logs

### Migration Stalls

**Problem:** Progress stops updating

**Solutions:**
1. Check database connection
2. Review error logs
3. Check system resources
4. Consider reducing batch size

### High Error Rate

**Problem:** Many badges fail to migrate

**Solutions:**
1. Review error messages in migration log
2. Check badge data integrity
3. Verify geometric generator is working
4. Test with single badge first

### Memory Issues

**Problem:** Application runs out of memory

**Solutions:**
1. Reduce batch size
2. Increase delay between batches
3. Restart application and resume
4. Check for memory leaks

### Verification Failures

**Problem:** Verification finds issues

**Solutions:**
1. Review verification issues
2. Check if issues are critical
3. Re-run migration for failed badges
4. Consider rollback if issues are severe

## Rollback Procedures

### When to Rollback

Rollback if:
- High error rate (>5%)
- Critical data loss detected
- System instability
- User complaints about badges

### How to Rollback

```typescript
// 1. Get migration ID from logs or status
const status = await badgeMigrationService.getMigrationStatus();
const migrationId = status.migrationId;

// 2. Execute rollback
const success = await badgeMigrationService.rollbackMigration(migrationId);

if (success) {
  console.log('Rollback completed successfully');
  
  // 3. Verify rollback
  const verification = await badgeMigrationService.verifyMigration();
  console.log('Verification after rollback:', verification);
} else {
  console.error('Rollback failed - manual intervention required');
}
```

### Post-Rollback

After rollback:
1. Investigate root cause
2. Fix issues
3. Test in staging
4. Plan new migration

## Migration Workflow

### Complete Production Migration

```typescript
async function productionMigration() {
  console.log('=== Production Migration Workflow ===\n');

  // Step 1: Dry run
  console.log('Step 1: Dry run...');
  const dryRun = await badgeMigrationService.migrateAllBadges({
    dryRun: true,
  });
  console.log(`Will migrate ${dryRun.totalBadges} badges\n`);

  // Step 2: Confirm with user
  const confirmed = confirm('Proceed with migration?');
  if (!confirmed) {
    console.log('Migration cancelled');
    return;
  }

  // Step 3: Run migration
  console.log('Step 2: Running migration...');
  const result = await badgeMigrationService.migrateAllBadges({
    batchSize: 100,
    createBackup: true,
    skipErrors: false,
  });

  if (!result.success) {
    console.error('Migration failed:', result.errors);
    return;
  }

  console.log(`Migrated ${result.migratedBadges} badges in ${result.duration}ms\n`);

  // Step 4: Verify
  console.log('Step 3: Verifying...');
  const verification = await badgeMigrationService.verifyMigration();
  
  if (!verification.verified) {
    console.error('Verification failed:', verification.issues);
    
    // Consider rollback
    const shouldRollback = confirm('Rollback migration?');
    if (shouldRollback) {
      await badgeMigrationService.rollbackMigration(result.migrationId);
    }
    return;
  }

  console.log('Migration completed successfully!');
  
  // Step 5: Generate report
  const report = await badgeMigrationService.getMigrationReport(result.migrationId);
  console.log('Final report:', report);
}
```

## Support

For issues or questions:
1. Check application logs
2. Review migration logs in database
3. Consult this guide
4. Contact development team

## Related Documentation

- [Geometric Badge System Guide](./GEOMETRIC_BADGES_GUIDE.md)
- [Badge Renderer Service](../src/services/badgeRenderer.service.ts)
- [Database Migration](../supabase/migrations/028_add_geometric_badge_system.sql)
