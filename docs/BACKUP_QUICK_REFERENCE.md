# Database Backup - Quick Reference Card

## 🚀 Quick Start

```powershell
# Create staging backup with verification
.\supabase\backup-staging.ps1 -Verify
```

## 📋 Pre-Migration Checklist

- [ ] Run backup script
- [ ] Verify backup file created
- [ ] Run validation queries
- [ ] Store backup securely
- [ ] Test restore procedure
- [ ] Document backup details

## 🔧 Common Commands

### Create Backup

```powershell
# Automated (Windows)
.\supabase\backup-staging.ps1 -Verify

# Supabase CLI
npx supabase db dump -f supabase/backups/staging/backup.sql

# PostgreSQL
pg_dump -h db.wobpryllvdjaapzjbsxx.supabase.co -U postgres -d postgres -F c -f backup.dump
```

### Verify Backup

```bash
# List contents
pg_restore --list backup.dump | head -20

# Check file size
ls -lh backup.dump

# Verify tables
pg_restore --list backup.dump | grep -E "(green_coin|gg_coin)"
```

### Run Validation

```bash
psql -h db.wobpryllvdjaapzjbsxx.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/pre_backup_validation.sql \
     > validation_output.txt
```

### Test Restore

```bash
# Create test database
createdb test_restore

# Restore
pg_restore -d test_restore backup.dump

# Verify
psql -d test_restore -c "SELECT COUNT(*) FROM green_coin_wallets;"

# Cleanup
dropdb test_restore
```

## 📊 Key Metrics to Capture

```sql
-- Green Coin Wallets
SELECT COUNT(*), SUM(balance) FROM green_coin_wallets;

-- Green Coin Transactions
SELECT COUNT(*), SUM(amount) FROM green_coin_transactions;

-- GG Coins
SELECT COUNT(*), SUM(gg_coins) FROM user_gamification;

-- GG Coin Transactions
SELECT COUNT(*), SUM(amount) FROM gg_coin_transactions;
```

## 🔄 Restore Commands

```bash
# Full restore (custom format)
pg_restore -h HOST -U postgres -d postgres -c -v backup.dump

# Full restore (SQL format)
psql -h HOST -U postgres -d postgres -f backup.sql

# Selective restore
pg_restore -h HOST -U postgres -d postgres -t green_coin_wallets backup.dump
```

## 📁 File Locations

- **Backups**: `supabase/backups/staging/`
- **Scripts**: `supabase/backup-staging.ps1`
- **Validation**: `supabase/pre_backup_validation.sql`
- **Docs**: `supabase/BACKUP_GUIDE.md`

## ⚠️ Important Notes

- Always backup before migrations
- Verify backup before proceeding
- Test restore on development first
- Keep backup until migration verified
- Store backup in multiple locations
- Document backup timestamp and size

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| pg_dump not found | Install PostgreSQL client tools |
| Authentication failed | Set PGPASSWORD environment variable |
| Backup too large | Use compression: `-Z 9` |
| Backup takes too long | Use parallel backup: `-j 4` |

## 📞 Support

- **Database Team**: database-team@ganggreen.com
- **DevOps Team**: devops@ganggreen.com
- **Emergency**: emergency@ganggreen.com

## 📚 Full Documentation

- [Backup Guide](BACKUP_GUIDE.md)
- [Migration 032 Guide](migrations/MIGRATION_032_GUIDE.md)
- [Rollback Guide](migrations/ROLLBACK_032_GUIDE.md)

---

**Migration**: 032 - Coin System Consolidation  
**Last Updated**: 2025-01-30
