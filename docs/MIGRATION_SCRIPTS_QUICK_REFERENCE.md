# Badge Migration Scripts - Quick Reference

## Quick Start

### 1. Run Migration (Recommended)

```bash
# Step 1: Test with dry-run
npm run migrate-badges -- --dry-run

# Step 2: Run actual migration
npm run migrate-badges

# Step 3: Verify results
npm run verify-migration -- --detailed
```

### 2. Check Status

```bash
# Check current migration status
npm run migrate-badges status
```

### 3. Rollback (if needed)

```bash
# List available migrations
npm run rollback-migration

# Rollback specific migration
npm run rollback-migration -- migration-123456 --force
```

## Command Reference

### migrate-badges

| Command | Description |
|---------|-------------|
| `npm run migrate-badges` | Run migration with defaults |
| `npm run migrate-badges -- --dry-run` | Preview without changes |
| `npm run migrate-badges -- --batch-size 50` | Custom batch size |
| `npm run migrate-badges -- --user <id>` | Migrate specific user |
| `npm run migrate-badges status` | Check migration status |

### verify-migration

| Command | Description |
|---------|-------------|
| `npm run verify-migration` | Verify all badges |
| `npm run verify-migration -- --detailed` | Show all issues |
| `npm run verify-migration -- --export` | Export JSON report |
| `npm run verify-migration -- -m <id>` | Verify specific migration |

### rollback-migration

| Command | Description |
|---------|-------------|
| `npm run rollback-migration` | List available migrations |
| `npm run rollback-migration -- <id>` | Rollback migration |
| `npm run rollback-migration -- <id> --force` | Skip confirmation |
| `npm run rollback-migration -- <id> --no-verify` | Skip verification |

## Common Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help | - |
| `--dry-run` | `-d` | Preview only | false |
| `--batch-size <n>` | `-b` | Badges per batch | 100 |
| `--no-backup` | - | Skip backups | false |
| `--skip-errors` | `-s` | Continue on error | false |
| `--delay <ms>` | - | Batch delay | 1000 |
| `--user <id>` | `-u` | Specific user | all |
| `--detailed` | `-d` | Show details | false |
| `--export` | `-e` | Export report | false |
| `--force` | `-f` | Skip confirm | false |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error or failure |

## Output Colors

| Color | Meaning |
|-------|---------|
| 🟢 Green | Success |
| 🔴 Red | Error |
| 🟡 Yellow | Warning |
| 🔵 Cyan | Info |

## Typical Workflows

### Production Migration

```bash
# 1. Backup database first
pg_dump -h host -U user -d db > backup.sql

# 2. Dry run
npm run migrate-badges -- --dry-run

# 3. Migrate
npm run migrate-badges

# 4. Verify
npm run verify-migration -- --detailed --export

# 5. Monitor
npm run migrate-badges status
```

### Staging Test

```bash
# Small batch test
npm run migrate-badges -- --batch-size 10

# Verify
npm run verify-migration

# Rollback
npm run rollback-migration -- <id> --force

# Verify rollback
npm run verify-migration
```

### User-Specific Migration

```bash
# Migrate one user
npm run migrate-badges -- --user abc123

# Verify user
npm run verify-migration -- --detailed

# Check status
npm run migrate-badges status
```

## Troubleshooting

### Migration Won't Start

```bash
# Check status
npm run migrate-badges status

# Check database connection
npm run verify-migration
```

### High Error Rate

```bash
# Continue with errors
npm run migrate-badges -- --skip-errors

# Verify what failed
npm run verify-migration -- --detailed --export
```

### Need to Rollback

```bash
# List migrations
npm run rollback-migration

# Rollback
npm run rollback-migration -- <id> --force

# Verify
npm run verify-migration
```

## Performance Tips

### Fast Migration
- Larger batch size (100-200)
- Shorter delay (500ms)
- Skip errors enabled

```bash
npm run migrate-badges -- --batch-size 200 --delay 500 --skip-errors
```

### Safe Migration
- Smaller batch size (25-50)
- Longer delay (2000ms)
- Backups enabled (default)

```bash
npm run migrate-badges -- --batch-size 25 --delay 2000
```

### Balanced (Recommended)
- Medium batch size (100)
- Standard delay (1000ms)
- Backups enabled

```bash
npm run migrate-badges
```

## Safety Checklist

Before migration:
- [ ] Database backup created
- [ ] Dry-run completed successfully
- [ ] Tested on staging environment
- [ ] Backups enabled (default)
- [ ] Monitoring ready

During migration:
- [ ] Progress monitored
- [ ] Errors reviewed
- [ ] No interruptions
- [ ] Status checked regularly

After migration:
- [ ] Verification run
- [ ] Report reviewed
- [ ] Badges tested
- [ ] Users notified
- [ ] Backups retained

## Support

For issues:
1. Check [scripts/README.md](../scripts/README.md)
2. Review [BADGE_MIGRATION_GUIDE.md](./BADGE_MIGRATION_GUIDE.md)
3. Run verification with `--detailed --export`
4. Contact dev team with migration ID and report

## Related Docs

- [Full Scripts Documentation](../scripts/README.md)
- [Badge Migration Guide](./BADGE_MIGRATION_GUIDE.md)
- [Geometric Badges Guide](./GEOMETRIC_BADGES_GUIDE.md)
- [Technical Guide](./TECHNICAL_GUIDE_NOVEMBER_27_2025.md)
