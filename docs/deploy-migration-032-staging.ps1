# Deploy Migration 032 to Staging
# Consolidates Green Coins into GG Coins system

param(
    [switch]$DryRun,
    [switch]$Verify,
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host @"
Deploy Migration 032 to Staging

USAGE:
    .\deploy-migration-032-staging.ps1 [-DryRun] [-Verify] [-Help]

OPTIONS:
    -DryRun     Show what would be executed without making changes
    -Verify     Verify migration after deployment
    -Help       Display this help message

EXAMPLES:
    .\deploy-migration-032-staging.ps1 -DryRun
    .\deploy-migration-032-staging.ps1
    .\deploy-migration-032-staging.ps1 -Verify

REQUIREMENTS:
    - Supabase CLI installed (npx supabase)
    - Authenticated with Supabase (npx supabase login)
    - Project linked (npx supabase link)
    - Backup created (run backup-staging.ps1 first)

"@
    exit 0
}

# Configuration
$ErrorActionPreference = "Stop"
$MigrationFile = "supabase/migrations/032_consolidate_coins.sql"
$RollbackFile = "supabase/migrations/rollback_032.sql"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host @"
========================================
  DEPLOY MIGRATION 032 TO STAGING
  Coin System Consolidation
========================================
Timestamp: $Timestamp
Mode: $(if ($DryRun) { "DRY RUN" } else { "LIVE DEPLOYMENT" })
========================================
"@ -ForegroundColor Cyan

# Check prerequisites
Write-Info "`n[1/8] Checking prerequisites..."

# Check if migration file exists
if (-not (Test-Path $MigrationFile)) {
    Write-Error "✗ Migration file not found: $MigrationFile"
    exit 1
}
Write-Success "✓ Migration file found: $MigrationFile"

# Check if rollback file exists
if (-not (Test-Path $RollbackFile)) {
    Write-Warning "⚠ Rollback file not found: $RollbackFile"
    Write-Info "  Continuing without rollback capability"
} else {
    Write-Success "✓ Rollback file found: $RollbackFile"
}

# Check if Supabase CLI is available
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Success "✓ Supabase CLI found: $supabaseVersion"
} catch {
    Write-Error "✗ Supabase CLI not found. Please install it first."
    Write-Info "Run: npm install -g supabase"
    exit 1
}

# Check if authenticated
Write-Info "`n[2/8] Checking Supabase authentication..."
try {
    $authStatus = npx supabase projects list 2>&1
    if ($authStatus -match "error" -or $authStatus -match "not logged in") {
        Write-Error "✗ Not authenticated with Supabase"
        Write-Info "Run: npx supabase login"
        exit 1
    }
    Write-Success "✓ Authenticated with Supabase"
} catch {
    Write-Warning "⚠ Could not verify authentication status"
    Write-Info "  Continuing anyway..."
}

# Load environment variables
Write-Info "`n[3/8] Loading environment configuration..."

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Success "✓ Environment variables loaded from .env"
} else {
    Write-Warning "⚠ .env file not found. Using system environment variables."
}

# Extract project reference
$SupabaseUrl = $env:VITE_SUPABASE_URL
if (-not $SupabaseUrl) {
    Write-Error "✗ VITE_SUPABASE_URL not found in environment variables"
    exit 1
}

if ($SupabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $ProjectRef = $matches[1]
    Write-Success "✓ Project reference: $ProjectRef"
} else {
    Write-Error "✗ Could not parse Supabase URL"
    exit 1
}

# Check for recent backup
Write-Info "`n[4/8] Checking for recent backup..."

$BackupDir = "supabase/backups"
if (Test-Path $BackupDir) {
    $RecentBackups = Get-ChildItem -Path $BackupDir -Filter "staging_pre_032_*.metadata.json" | 
                     Sort-Object LastWriteTime -Descending | 
                     Select-Object -First 1
    
    if ($RecentBackups) {
        $BackupAge = (Get-Date) - $RecentBackups.LastWriteTime
        if ($BackupAge.TotalHours -lt 24) {
            Write-Success "✓ Recent backup found: $($RecentBackups.Name)"
            Write-Info "  Created: $($RecentBackups.LastWriteTime)"
            Write-Info "  Age: $([math]::Round($BackupAge.TotalHours, 1)) hours"
        } else {
            Write-Warning "⚠ Backup is older than 24 hours"
            Write-Info "  Consider creating a fresh backup: .\backup-staging.ps1"
        }
    } else {
        Write-Warning "⚠ No recent backup found"
        Write-Info "  Strongly recommended to create backup first: .\backup-staging.ps1"
        
        if (-not $DryRun) {
            $response = Read-Host "Continue without recent backup? (yes/no)"
            if ($response -ne "yes") {
                Write-Info "Deployment cancelled. Create backup first."
                exit 0
            }
        }
    }
} else {
    Write-Warning "⚠ Backup directory not found: $BackupDir"
}

# Dry run mode
if ($DryRun) {
    Write-Info "`n[DRY RUN] Would execute the following steps:"
    Write-Info "  1. Link to project: $ProjectRef"
    Write-Info "  2. Deploy migration: $MigrationFile"
    Write-Info "  3. Verify migration success"
    Write-Info "  4. Run validation queries"
    Write-Host "`nDry run complete. No changes made." -ForegroundColor Yellow
    exit 0
}

# Confirm deployment
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  READY TO DEPLOY TO STAGING" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Warning "This will modify the staging database!"
Write-Info "Project: $ProjectRef"
Write-Info "Migration: 032_consolidate_coins"
Write-Host ""

$confirmation = Read-Host "Type 'DEPLOY' to continue"
if ($confirmation -ne "DEPLOY") {
    Write-Info "Deployment cancelled."
    exit 0
}

# Link to project
Write-Info "`n[5/8] Linking to Supabase project..."

try {
    npx supabase link --project-ref $ProjectRef 2>&1 | Out-Null
    Write-Success "✓ Linked to project: $ProjectRef"
} catch {
    Write-Warning "⚠ Could not link to project (may already be linked)"
}

# Deploy migration
Write-Info "`n[6/8] Deploying migration to staging..."
Write-Info "This may take several minutes depending on data volume..."

try {
    $deployOutput = npx supabase db push 2>&1
    
    if ($deployOutput -match "error" -or $deployOutput -match "failed") {
        Write-Error "✗ Migration deployment failed"
        Write-Host $deployOutput
        Write-Info "`nTo rollback, run:"
        Write-Info "  npx supabase db execute -f $RollbackFile"
        exit 1
    }
    
    Write-Success "✓ Migration deployed successfully"
    Write-Host $deployOutput
} catch {
    Write-Error "✗ Migration deployment failed: $_"
    Write-Info "`nTo rollback, run:"
    Write-Info "  npx supabase db execute -f $RollbackFile"
    exit 1
}

# Verify deployment
Write-Info "`n[7/8] Verifying migration..."

$VerificationQueries = @"
-- Check migration statistics
SELECT * FROM get_coin_migration_stats();

-- Check deprecated tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '_deprecated_green_coin%';

-- Verify no data loss
SELECT 
  (SELECT COUNT(*) FROM _deprecated_green_coin_wallets) as old_wallets,
  (SELECT COUNT(DISTINCT user_id) FROM gg_coin_transactions WHERE metadata->>'migrated_from' = 'green_coins') as migrated_users;

-- Check balance totals
SELECT 
  (SELECT SUM(balance) FROM _deprecated_green_coin_wallets) as old_total,
  (SELECT SUM(gg_coins) FROM user_gamification) as new_total;
"@

$VerificationFile = "supabase/backups/verify_032_$Timestamp.sql"
$VerificationQueries | Out-File -FilePath $VerificationFile -Encoding UTF8

Write-Success "✓ Verification queries saved: $VerificationFile"
Write-Info "Run these queries in Supabase SQL Editor to verify migration"

# Run verification if requested
if ($Verify) {
    Write-Info "`n[8/8] Running verification queries..."
    
    try {
        $verifyOutput = npx supabase db execute -f $VerificationFile 2>&1
        Write-Host $verifyOutput
        
        if ($verifyOutput -match "error") {
            Write-Warning "⚠ Some verification queries failed"
            Write-Info "Check the output above for details"
        } else {
            Write-Success "✓ Verification queries completed"
        }
    } catch {
        Write-Warning "⚠ Could not run verification queries automatically"
        Write-Info "Run them manually in Supabase SQL Editor: $VerificationFile"
    }
} else {
    Write-Info "`n[8/8] Skipping automatic verification"
    Write-Info "To verify manually, run:"
    Write-Info "  npx supabase db execute -f $VerificationFile"
}

# Summary
Write-Host @"

========================================
  DEPLOYMENT SUMMARY
========================================
"@ -ForegroundColor Green

Write-Success "✓ Migration 032 deployed to staging"
Write-Info "Project: $ProjectRef"
Write-Info "Timestamp: $Timestamp"
Write-Info "Migration file: $MigrationFile"
Write-Info "Verification file: $VerificationFile"

Write-Host @"

========================================
  NEXT STEPS
========================================
"@ -ForegroundColor Cyan

Write-Info "1. Verify migration success:"
Write-Info "   - Open Supabase Dashboard SQL Editor"
Write-Info "   - Run queries from: $VerificationFile"
Write-Info "   - Check that totals match"

Write-Info "`n2. Test application functionality:"
Write-Info "   - Test balance queries"
Write-Info "   - Test transaction recording"
Write-Info "   - Test transaction history"
Write-Info "   - Verify UI displays correctly"

Write-Info "`n3. Test rollback procedure:"
Write-Info "   - Run: npx supabase db execute -f $RollbackFile"
Write-Info "   - Verify data restored"
Write-Info "   - Re-deploy migration if rollback works"

Write-Info "`n4. Document results:"
Write-Info "   - Record any issues encountered"
Write-Info "   - Update deployment plan"
Write-Info "   - Prepare for production deployment"

Write-Host @"

========================================
  ROLLBACK INSTRUCTIONS
========================================
"@ -ForegroundColor Yellow

Write-Warning "If migration fails or causes issues:"
Write-Info "1. Run rollback script:"
Write-Info "   npx supabase db execute -f $RollbackFile"
Write-Info "`n2. Verify rollback:"
Write-Info "   - Check that green_coin_* tables are restored"
Write-Info "   - Verify balances match backup"
Write-Info "`n3. Investigate and fix issues before re-deploying"

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exit with success
exit 0
