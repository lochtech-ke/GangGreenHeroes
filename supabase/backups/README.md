# Database Backups Directory

This directory stores database backups for the GangGreen platform, particularly for Migration 032 (Coin System Consolidation).

## Directory Structure

```
backups/
├── README.md                           # This file
├── staging/                            # Staging environment backups
│   ├── staging_pre_032_YYYYMMDD_HHMMSS.dump
│   ├── staging_pre_032_YYYYMMDD_HHMMSS.sql
│   ├── staging_pre_032_YYYYMMDD_HHMMSS.metadata.json
│   └── pre_backup_validation_YYYYMMDD_HHMMSS.sql
└── production/                         # Production environment backups
    ├── production_pre_032_YYYYMMDD_HHMMSS.dump
    ├── production_pre_032_YYYYMMDD_HHMMSS.metadata.json
    └── pre_backup_validation_YYYYMMDD_HHMMSS.sql
```

## Backup Files

### Backup Formats

- **`.dump`** - PostgreSQL custom format (binary, compressed)
  - Created by: `pg_dump -F c`
  - Restored by: `pg_restore`
  - Pros: Compressed, selective restore, parallel restore
  - Cons: Binary format, not human-readable

- **`.sql`** - Plain SQL format (text)
  - Created by: `pg_dump` or `supabase db dump`
  - Restored by: `psql`
  - Pros: Human-readable, version control friendly
  - Cons: Larger file size, slower restore

### Metadata Files

Each backup includes a `.metadata.json` file with:
- Timestamp
- Environment (staging/production)
- Project reference
- Migration number
- Creator information
- Backup file location

Example:
```json
{
  "timestamp": "20250130_143022",
  "environment": "staging",
  "project_ref": "wobpryllvdjaapzjbsxx",
  "migration": "032_consolidate_coins",
  "purpose": "Pre-migration backup for coin system consolidation",
  "backup_file": "staging_pre_032_20250130_143022.sql",
  "created_by": "username",
  "machine": "DESKTOP-ABC123",
  "supabase_url": "https://wobpryllvdjaapzjbsxx.supabase.co"
}
```

### Validation Files

Pre-backup validation SQL scripts capture database state:
- Table counts
- Balance totals
- Transaction statistics
- Data integrity checks

## Creating Backups

### Automated (Recommended)

```powershell
# Run backup script
.\supabase\backup-staging.ps1 -Verify
```

### Manual

```bash
# Using Supabase CLI
npx supabase db dump -f supabase/backups/staging/backup.sql

# Using pg_dump
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -f supabase/backups/staging/backup.dump
```

## Restoring Backups

### From Custom Format (.dump)

```bash
pg_restore -h db.wobpryllvdjaapzjbsxx.supabase.co \
           -U postgres \
           -d postgres \
           -c \
           -v \
           supabase/backups/staging/backup.dump
```

### From SQL Format (.sql)

```bash
psql -h db.wobpryllvdjaapzjbsxx.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/backups/staging/backup.sql
```

## Backup Retention

- **Staging backups**: 30 days
- **Production backups**: 90 days
- **Pre-migration backups**: Until migration verified (minimum 7 days)
- **Critical backups**: Archive indefinitely

## Storage Locations

### Local Storage
- Primary: `supabase/backups/`
- Excluded from git (see `.gitignore`)

### Cloud Storage (Recommended)
- AWS S3: `s3://ganggreen-backups/`
- Azure Blob: `ganggreen/backups/`
- Google Cloud: `gs://ganggreen-backups/`

## Security

### Access Control
- Backup files contain sensitive data
- Store securely with encryption
- Limit access to authorized personnel
- Use secure transfer methods

### Encryption
```bash
# Encrypt backup
gpg --encrypt --recipient admin@ganggreen.com backup.dump

# Decrypt backup
gpg --decrypt backup.dump.gpg > backup.dump
```

## Verification

### Verify Backup Integrity

```bash
# List backup contents
pg_restore --list backup.dump | head -20

# Check file size
ls -lh backup.dump

# Verify checksums
sha256sum backup.dump > backup.dump.sha256
sha256sum -c backup.dump.sha256
```

### Test Restore

```bash
# Create test database
createdb test_restore

# Restore backup
pg_restore -d test_restore backup.dump

# Verify data
psql -d test_restore -c "SELECT COUNT(*) FROM green_coin_wallets;"

# Cleanup
dropdb test_restore
```

## Troubleshooting

### Backup Too Large

```bash
# Use compression
pg_dump -F c -Z 9 -f backup.dump.gz

# Or backup specific tables only
pg_dump -t green_coin_wallets -t green_coin_transactions -F c -f backup_coins.dump
```

### Restore Fails

```bash
# Check backup integrity
pg_restore --list backup.dump

# Restore without dropping existing objects
pg_restore --no-owner --no-acl -d postgres backup.dump

# Restore specific tables only
pg_restore -t green_coin_wallets -d postgres backup.dump
```

### Permission Denied

```bash
# Set password environment variable
export PGPASSWORD='your-password'

# Or use .pgpass file
echo "host:5432:database:user:password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

## Best Practices

1. **Always backup before migrations**
2. **Verify backups after creation**
3. **Test restore procedures regularly**
4. **Store backups in multiple locations**
5. **Document backup details**
6. **Automate backup processes**
7. **Monitor backup health**
8. **Encrypt sensitive backups**

## Related Documentation

- [Backup Guide](../BACKUP_GUIDE.md)
- [Migration 032 Guide](../MIGRATION_032_GUIDE.md)
- [Rollback Guide](../ROLLBACK_032_GUIDE.md)

## Support

For backup-related issues:
- Database Team: database-team@ganggreen.com
- DevOps Team: devops@ganggreen.com
- Emergency: emergency@ganggreen.com

---

**Last Updated**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation
