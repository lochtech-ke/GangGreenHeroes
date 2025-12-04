# Database Backup Guide - Migration 032

## Overview

This guide covers creating and verifying database backups before executing Migration 032 (Coin System Consolidation). Proper backups are critical for safe migration and rollback capability.

## Quick Start

### Automated Backup (Recommended)

```powershell
# Run backup script
.\supabase\backup-staging.ps1

# With verification
.\supabase\backup-staging.ps1 -Verify

# View help
.\supabase\backup-staging.ps1 -Help
```

### Manual Backup

```bash
# Using pg_dump
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -f supabase/backups/staging_pre_032_$(date +%Y%m%d_%H%M%S).dump

# Using Supabase CLI
npx supabase db dump --project-ref wobpryllvdjaapzjbsxx \
                     -f supabase/backups/staging_pre_032_$(date +%Y%m%d_%H%M%S).sql
```

## Backup Methods

### Method 1: Supabase Dashboard (Easiest)

1. Navigate to [Supabase Dashboard](https://app.supabase.com/project/wobpryllvdjaapzjbsxx)
2. Go to **Settings** → **Database** → **Backups**
3. Click **"Create Backup"**
4. Add description: "Pre-Migration 032 - Coin Consolidation"
5. Wait for backup to complete
6. Download backup file for local storage

**Pros:**
- ✅ No command-line tools required
- ✅ Automatic verification
- ✅ Stored in Supabase infrastructure
- ✅ Easy to restore from dashboard

**Cons:**
- ❌ Requires manual steps
- ❌ May have size limitations
- ❌ Depends on Supabase availability

### Method 2: Supabase CLI (Recommended)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to project
npx supabase link --project-ref wobpryllvdjaapzjbsxx

# Create backup
npx supabase db dump -f supabase/backups/staging_backup.sql

# Verify backup
head -50 supabase/backups/staging_backup.sql
```

**Pros:**
- ✅ Automated and scriptable
- ✅ Version controlled
- ✅ Easy to integrate with CI/CD
- ✅ Includes schema and data

**Cons:**
- ❌ Requires Node.js and npm
- ❌ Requires authentication setup

### Method 3: PostgreSQL pg_dump (Advanced)

```bash
# Full database backup (custom format)
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -b \
        -v \
        -f supabase/backups/staging_full.dump

# Schema-only backup
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -s \
        -f supabase/backups/staging_schema.sql

# Data-only backup
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -a \
        -f supabase/backups/staging_data.sql

# Specific tables only
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -t green_coin_wallets \
        -t green_coin_transactions \
        -t user_gamification \
        -t gg_coin_transactions \
        -F c \
        -f supabase/backups/staging_coins_only.dump
```

**Pros:**
- ✅ Most flexible and powerful
- ✅ Industry standard tool
- ✅ Multiple format options
- ✅ Selective backup capability

**Cons:**
- ❌ Requires PostgreSQL client tools
- ❌ Requires database credentials
- ❌ More complex syntax

### Method 4: PowerShell Script (Windows)

```powershell
# Run the provided backup script
.\supabase\backup-staging.ps1 -Verify

# The script will:
# 1. Check prerequisites
# 2. Load environment variables
# 3. Create backup directory
# 4. Run pre-backup validation
# 5. Create backup using available tools
# 6. Generate metadata file
# 7. Verify backup integrity
```

**Pros:**
- ✅ Automated workflow
- ✅ Built-in validation
- ✅ Creates metadata
- ✅ Windows-friendly

**Cons:**
- ❌ Windows-only
- ❌ Requires PowerShell

## Backup Verification

### Verify Backup File Integrity

```bash
# Check file exists and has content
ls -lh supabase/backups/staging_*.dump
ls -lh supabase/backups/staging_*.sql

# For custom format (.dump)
pg_restore --list supabase/backups/staging_*.dump | head -20

# For SQL format (.sql)
head -50 supabase/backups/staging_*.sql
grep -c "INSERT INTO" supabase/backups/staging_*.sql
```

### Verify Backup Content

```bash
# Check for critical tables
pg_restore --list supabase/backups/staging_*.dump | grep -E "(green_coin|gg_coin|user_gamification)"

# Or for SQL format
grep -E "(CREATE TABLE|INSERT INTO).*(green_coin|gg_coin|user_gamification)" supabase/backups/staging_*.sql
```

### Verify Data Completeness

Run these queries on the source database and compare with backup:

```sql
-- Count records in critical tables
SELECT 
  'green_coin_wallets' as table_name,
  COUNT(*) as record_count,
  SUM(balance) as total_balance
FROM green_coin_wallets
UNION ALL
SELECT 
  'green_coin_transactions',
  COUNT(*),
  SUM(amount)
FROM green_coin_transactions
UNION ALL
SELECT 
  'user_gamification',
  COUNT(*),
  SUM(gg_coins)
FROM user_gamification
UNION ALL
SELECT 
  'gg_coin_transactions',
  COUNT(*),
  SUM(amount)
FROM gg_coin_transactions;
```

Save these results and compare after restore to verify completeness.

## Backup Storage

### Local Storage

```bash
# Create backup directory structure
mkdir -p supabase/backups/{staging,production}

# Store backups with timestamps
supabase/backups/
├── staging/
│   ├── staging_pre_032_20250130_143022.dump
│   ├── staging_pre_032_20250130_143022.metadata.json
│   └── pre_backup_validation_20250130_143022.sql
└── production/
    └── (production backups)
```

### Cloud Storage (Recommended)

Upload backups to cloud storage for redundancy:

```bash
# AWS S3
aws s3 cp supabase/backups/staging_*.dump s3://ganggreen-backups/staging/

# Azure Blob Storage
az storage blob upload --account-name ganggreen \
                       --container-name backups \
                       --name staging_backup.dump \
                       --file supabase/backups/staging_*.dump

# Google Cloud Storage
gsutil cp supabase/backups/staging_*.dump gs://ganggreen-backups/staging/
```

### Backup Retention Policy

- **Staging backups**: Keep for 30 days
- **Production backups**: Keep for 90 days
- **Pre-migration backups**: Keep until migration verified (minimum 7 days)
- **Critical backups**: Archive indefinitely

## Restore Procedures

### Restore from Supabase Dashboard

1. Go to **Settings** → **Database** → **Backups**
2. Find the backup to restore
3. Click **"Restore"**
4. Confirm restoration
5. Wait for completion
6. Verify data integrity

### Restore from Supabase CLI

```bash
# Reset database to backup state
npx supabase db reset

# Or restore specific backup
psql -h db.wobpryllvdjaapzjbsxx.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/backups/staging_backup.sql
```

### Restore from pg_dump Backup

```bash
# Restore custom format backup
pg_restore -h db.wobpryllvdjaapzjbsxx.supabase.co \
           -U postgres \
           -d postgres \
           -c \
           -v \
           supabase/backups/staging_full.dump

# Restore SQL format backup
psql -h db.wobpryllvdjaapzjbsxx.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/backups/staging_backup.sql
```

### Selective Restore

```bash
# Restore only specific tables
pg_restore -h db.wobpryllvdjaapzjbsxx.supabase.co \
           -U postgres \
           -d postgres \
           -t green_coin_wallets \
           -t green_coin_transactions \
           supabase/backups/staging_coins_only.dump
```

## Pre-Migration Checklist

Before running Migration 032, ensure:

- [ ] **Backup Created**
  - [ ] Backup file exists and has reasonable size
  - [ ] Backup includes all critical tables
  - [ ] Backup metadata file created

- [ ] **Backup Verified**
  - [ ] Can list backup contents
  - [ ] Critical tables present in backup
  - [ ] Record counts match source database

- [ ] **Backup Stored**
  - [ ] Local copy in `supabase/backups/`
  - [ ] Cloud copy uploaded (recommended)
  - [ ] Backup location documented

- [ ] **Validation Queries Run**
  - [ ] Green Coin wallet count recorded
  - [ ] Total Green Coin balance recorded
  - [ ] Transaction counts recorded
  - [ ] No NULL user_ids found

- [ ] **Restore Tested**
  - [ ] Test restore on development database
  - [ ] Verify data integrity after restore
  - [ ] Document restore time

- [ ] **Team Notified**
  - [ ] Development team informed
  - [ ] Support team briefed
  - [ ] Backup location shared

## Troubleshooting

### Issue: pg_dump not found

**Solution:**
```bash
# Install PostgreSQL client tools
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client
```

### Issue: Authentication failed

**Solution:**
```bash
# Get database password from Supabase dashboard
# Settings → Database → Connection string

# Set password environment variable
export PGPASSWORD='your-database-password'

# Or use .pgpass file
echo "db.wobpryllvdjaapzjbsxx.supabase.co:5432:postgres:postgres:your-password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

### Issue: Backup too large

**Solution:**
```bash
# Use compression
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -Z 9 \
        -f backup.dump.gz

# Or backup specific schemas only
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -n public \
        -F c \
        -f backup_public_only.dump
```

### Issue: Backup takes too long

**Solution:**
```bash
# Backup in parallel (faster)
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co \
        -U postgres \
        -d postgres \
        -F d \
        -j 4 \
        -f backup_directory/

# Or backup during low-traffic period
# Schedule backup for off-peak hours
```

### Issue: Cannot verify backup

**Solution:**
```bash
# Test restore to temporary database
createdb test_restore
pg_restore -d test_restore backup.dump

# Verify critical tables
psql -d test_restore -c "SELECT COUNT(*) FROM green_coin_wallets;"

# Drop test database
dropdb test_restore
```

## Best Practices

1. **Always backup before migrations**
   - Create backup immediately before migration
   - Verify backup before proceeding
   - Keep backup until migration verified

2. **Use multiple backup methods**
   - Primary: Supabase dashboard backup
   - Secondary: Local pg_dump backup
   - Tertiary: Cloud storage copy

3. **Document backup details**
   - Record backup timestamp
   - Note backup size and location
   - Document validation results

4. **Test restore procedures**
   - Practice restore on development database
   - Time the restore process
   - Verify data integrity after restore

5. **Automate when possible**
   - Use scripts for consistency
   - Schedule regular backups
   - Integrate with CI/CD pipeline

6. **Monitor backup health**
   - Check backup file sizes
   - Verify backup completeness
   - Test restore periodically

## Related Documentation

- [Migration 032 Guide](MIGRATION_032_GUIDE.md)
- [Rollback Guide](ROLLBACK_032_GUIDE.md)
- [Setup Guide](SETUP_GUIDE.md)
- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)

## Support

For backup-related issues:
- Check Supabase dashboard for backup status
- Review PostgreSQL logs for errors
- Contact database team: database-team@ganggreen.com
- Emergency: emergency@ganggreen.com

---

**Last Updated**: 2025-01-30  
**Migration**: 032 - Coin System Consolidation  
**Status**: Ready for Use
