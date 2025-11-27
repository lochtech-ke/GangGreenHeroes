# Badge Migration Scripts

This directory contains command-line tools for managing the badge migration from classic to geometric designs.

## Available Scripts

### 1. migrate-badges.ts

Migrates badges from classic to geometric design.

**Usage:**
```bash
npm run migrate-badges [command] [options]
```

**Commands:**
- `migrate` - Migrate badges to geometric design (default)
- `status` - Check current migration status

**Options:**
- `-h, --help` - Show help message
- `-d, --dry-run` - Run migration without making changes
- `-b, --batch-size <n>` - Number of badges per batch (default: 100)
- `--no-backup` - Skip creating backups before migration
- `-s, --skip-errors` - Continue processing if errors occur
- `--delay <ms>` - Delay between batches in milliseconds (default: 1000)
- `-u, --user <userId>` - Migrate badges for specific user only

**Examples:**
```bash
# Dry run to preview migration
npm run migrate-badges -- --dry-run

# Migrate with custom batch size
npm run migrate-badges -- --batch-size 50

# Migrate specific user
npm run migrate-badges -- --user abc123

# Check migration status
npm run migrate-badges status

# Migrate without backups (not recommended)
npm run migrate-badges -- --no-backup --skip-errors
```

**Features:**
- ✅ Batch processing with configurable batch size
- ✅ Real-time progress tracking
- ✅ Automatic backup creation
- ✅ Error handling and logging
- ✅ Dry-run mode for testing
- ✅ Delay between batches to prevent overload

### 2. verify-migration.ts

Verifies all badges migrated successfully and checks data integrity.

**Usage:**
```bash
npm run verify-migration [options]
```

**Options:**
- `-h, --help` - Show help message
- `-m, --migration-id <id>` - Verify specific migration by ID
- `-d, --detailed` - Show detailed verification results
- `-e, --export` - Export verification report to file

**Examples:**
```bash
# Verify all migrated badges
npm run verify-migration

# Verify specific migration
npm run verify-migration -- --migration-id migration-123456

# Detailed verification with export
npm run verify-migration -- --detailed --export
```

**Verification Checks:**
- ✓ Badge design type is "geometric"
- ✓ Primary colors are present
- ✓ Migration timestamp exists
- ✓ Migration version is set
- ✓ SVG cache is populated
- ✓ Complexity level is defined
- ✓ Original metadata is preserved

**Output:**
- Migration statistics (total, geometric, classic badges)
- Verification summary (passed/failed)
- Detailed issue list (errors and warnings)
- Optional JSON report export

### 3. rollback-migration.ts

Restores badges from backup and verifies restoration.

**Usage:**
```bash
npm run rollback-migration <migration-id> [options]
```

**Options:**
- `-h, --help` - Show help message
- `-m, --migration-id <id>` - Migration ID to rollback (required)
- `-f, --force` - Skip confirmation prompt
- `--no-verify` - Skip verification after rollback

**Examples:**
```bash
# List available migrations for rollback
npm run rollback-migration

# Rollback specific migration
npm run rollback-migration -- migration-123456

# Rollback with force (no confirmation)
npm run rollback-migration -- --migration-id migration-123456 --force

# Rollback without verification
npm run rollback-migration -- migration-123456 --no-verify
```

**Features:**
- ✅ Lists available migrations with backup status
- ✅ Shows migration details before rollback
- ✅ Requires confirmation (unless --force)
- ✅ Verifies restoration after rollback
- ✅ Logs rollback operations

**Warning:**
⚠️ Rollback will restore all badges to their pre-migration state. This operation cannot be undone! Always verify the migration ID before proceeding.

## Migration Workflow

### 1. Pre-Migration

Before running the migration:

1. **Backup Database:**
   ```bash
   # Create a database backup
   pg_dump -h your-host -U your-user -d your-db > backup.sql
   ```

2. **Run Dry-Run:**
   ```bash
   npm run migrate-badges -- --dry-run
   ```

3. **Verify Dry-Run Results:**
   - Check console output for any errors
   - Review badge counts and statistics
   - Ensure no unexpected issues

### 2. Migration

Run the migration:

```bash
# Run with default settings (recommended)
npm run migrate-badges

# Or with custom settings
npm run migrate-badges -- --batch-size 50 --delay 2000
```

**Monitor Progress:**
- Real-time progress bar shows completion percentage
- Batch progress shows current/total batches
- Errors are logged but don't stop migration (unless --skip-errors is false)

### 3. Post-Migration

After migration completes:

1. **Verify Migration:**
   ```bash
   npm run verify-migration -- --detailed --export
   ```

2. **Review Verification Report:**
   - Check for any errors or warnings
   - Review migration statistics
   - Ensure all badges migrated successfully

3. **Test Badge Rendering:**
   - Visit badge showcase page
   - Check user badge collections
   - Verify mobile performance

### 4. Rollback (if needed)

If issues are found:

1. **List Available Migrations:**
   ```bash
   npm run rollback-migration
   ```

2. **Rollback Specific Migration:**
   ```bash
   npm run rollback-migration -- migration-123456 --force
   ```

3. **Verify Rollback:**
   ```bash
   npm run verify-migration
   ```

## Best Practices

### Before Migration

- ✅ Always create a database backup
- ✅ Run dry-run first to preview changes
- ✅ Test on staging environment before production
- ✅ Ensure backups are enabled (default)
- ✅ Review migration statistics

### During Migration

- ✅ Monitor progress in real-time
- ✅ Watch for errors in console output
- ✅ Don't interrupt migration process
- ✅ Keep batch size reasonable (50-100)
- ✅ Use appropriate delay between batches

### After Migration

- ✅ Run verification immediately
- ✅ Review verification report
- ✅ Test badge rendering on multiple devices
- ✅ Monitor user feedback
- ✅ Keep backups for at least 30 days

### Rollback

- ⚠️ Only rollback if critical issues found
- ⚠️ Verify migration ID before rollback
- ⚠️ Understand that rollback cannot be undone
- ⚠️ Test thoroughly after rollback
- ⚠️ Document reason for rollback

## Troubleshooting

### Migration Fails to Start

**Issue:** Migration doesn't start or fails immediately

**Solutions:**
- Check database connection
- Verify Supabase credentials in .env
- Ensure badge_migration_log table exists
- Check for existing migration in progress

### Migration Stalls

**Issue:** Migration progress stops or hangs

**Solutions:**
- Check database connection
- Verify no database locks
- Increase delay between batches
- Reduce batch size

### High Error Rate

**Issue:** Many badges fail to migrate

**Solutions:**
- Review error messages in console
- Check badge data integrity
- Verify geometric badge generator works
- Run with --skip-errors to continue

### Verification Fails

**Issue:** Verification reports many issues

**Solutions:**
- Review specific issues in detailed report
- Check if issues are errors or warnings
- Verify database schema is correct
- Re-run migration if needed

### Rollback Fails

**Issue:** Rollback doesn't restore badges

**Solutions:**
- Verify backups exist for migration
- Check backup table integrity
- Ensure migration ID is correct
- Review rollback logs for errors

## Database Tables

### badge_migration_log

Tracks migration operations:
- `migration_id` - Unique migration identifier
- `status` - Migration status (in_progress, completed, failed, rolled_back)
- `started_at` - Migration start time
- `completed_at` - Migration completion time
- `total_badges` - Total badges to migrate
- `migrated_badges` - Successfully migrated badges
- `failed_badges` - Failed badge migrations
- `batch_size` - Batch size used
- `options` - Migration options (JSON)
- `errors` - Migration errors (JSON)

### badge_migration_backup

Stores badge backups:
- `badge_id` - Badge being backed up
- `migration_id` - Associated migration
- `original_data` - Original badge data (JSON)
- `backup_date` - Backup creation time
- `restored` - Whether backup was restored
- `restored_at` - Restoration time

## Performance Considerations

### Batch Size

- **Small (10-50):** Slower but safer, better for testing
- **Medium (50-100):** Balanced performance and safety (recommended)
- **Large (100-500):** Faster but higher risk of issues

### Delay Between Batches

- **Short (500-1000ms):** Faster migration, higher database load
- **Medium (1000-2000ms):** Balanced (recommended)
- **Long (2000-5000ms):** Slower but minimal database impact

### Database Load

Monitor these metrics during migration:
- Database CPU usage
- Connection pool utilization
- Query response times
- Lock wait times

## Security

### Access Control

- Migration scripts require admin authentication
- Rollback operations are logged
- Backup data is encrypted
- Sensitive data is anonymized in logs

### Data Privacy

- User data is handled according to GDPR
- Backups are stored securely
- Logs don't contain PII
- Verification reports can be exported safely

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review migration logs
3. Run verification with --detailed flag
4. Contact development team with:
   - Migration ID
   - Error messages
   - Verification report
   - Database logs

## Related Documentation

- [Badge Migration Guide](../docs/BADGE_MIGRATION_GUIDE.md)
- [Geometric Badges Guide](../docs/GEOMETRIC_BADGES_GUIDE.md)
- [Badge API Quick Reference](../docs/BADGE_API_QUICK_REFERENCE.md)
- [Technical Guide](../docs/TECHNICAL_GUIDE_NOVEMBER_27_2025.md)
