# Staging Database Backup Script for Migration 032
# Creates a comprehensive backup before coin system consolidation

param(
    [string]$Environment = "staging",
    [switch]$Verify,
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host @"
Staging Database Backup Script for Migration 032

USAGE:
    .\backup-staging.ps1 [-Environment <env>] [-Verify] [-Help]

OPTIONS:
    -Environment    Target environment (default: staging)
    -Verify         Verify backup after creation
    -Help           Display this help message

EXAMPLES:
    .\backup-staging.ps1
    .\backup-staging.ps1 -Environment staging -Verify
    .\backup-staging.ps1 -Verify

REQUIREMENTS:
    - PostgreSQL client tools (pg_dump, pg_restore)
    - Supabase CLI (optional, for remote backups)
    - Environment variables configured in .env

"@
    exit 0
}

# Configuration
$ErrorActionPreference = "Stop"
$BackupDir = "supabase/backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir/staging_pre_032_$Timestamp"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host @"
========================================
  STAGING DATABASE BACKUP - MIGRATION 032
========================================
Environment: $Environment
Timestamp: $Timestamp
========================================
"@ -ForegroundColor Cyan

# Check prerequisites
Write-Info "`n[1/7] Checking prerequisites..."

# Check if pg_dump is available
try {
    $pgDumpVersion = pg_dump --version 2>&1
    Write-Success "✓ PostgreSQL client tools found: $pgDumpVersion"
} catch {
    Write-Error "✗ pg_dump not found. Please install PostgreSQL client tools."
    Write-Info "Download from: https://www.postgresql.org/download/"
    exit 1
}

# Check if Supabase CLI is available (optional)
try {
    $supabaseVersion = npx supabase --version 2>&1
    Write-Success "✓ Supabase CLI found: $supabaseVersion"
    $UseSupabaseCLI = $true
} catch {
    Write-Warning "⚠ Supabase CLI not found. Will use pg_dump directly."
    $UseSupabaseCLI = $false
}

# Load environment variables
Write-Info "`n[2/7] Loading environment configuration..."

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

# Extract database connection details from Supabase URL
$SupabaseUrl = $env:VITE_SUPABASE_URL
if (-not $SupabaseUrl) {
    Write-Error "✗ VITE_SUPABASE_URL not found in environment variables"
    exit 1
}

# Parse Supabase URL to get project reference
if ($SupabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $ProjectRef = $matches[1]
    Write-Success "✓ Project reference: $ProjectRef"
} else {
    Write-Error "✗ Could not parse Supabase URL"
    exit 1
}

# Create backup directory
Write-Info "`n[3/7] Preparing backup directory..."

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Success "✓ Created backup directory: $BackupDir"
} else {
    Write-Success "✓ Backup directory exists: $BackupDir"
}

# Pre-backup validation
Write-Info "`n[4/7] Running pre-backup validation..."

Write-Info "Checking source data..."
$ValidationSQL = @"
-- Check Green Coin wallet count
SELECT COUNT(*) as wallet_count FROM green_coin_wallets;

-- Check total Green Coin balance
SELECT SUM(balance) as total_balance FROM green_coin_wallets;

-- Check Green Coin transaction count
SELECT COUNT(*) as transaction_count FROM green_coin_transactions;

-- Check for any NULL user_ids (data integrity)
SELECT COUNT(*) as null_wallet_users FROM green_coin_wallets WHERE user_id IS NULL;
SELECT COUNT(*) as null_transaction_users FROM green_coin_transactions WHERE user_id IS NULL;
"@

# Save validation SQL to temp file
$ValidationFile = "$BackupDir/pre_backup_validation_$Timestamp.sql"
$ValidationSQL | Out-File -FilePath $ValidationFile -Encoding UTF8

Write-Success "✓ Validation queries prepared"
Write-Info "  Run these queries manually to verify data:"
Write-Info "  File: $ValidationFile"

# Create backup
Write-Info "`n[5/7] Creating database backup..."

if ($UseSupabaseCLI) {
    Write-Info "Using Supabase CLI for backup..."
    
    try {
        # Backup using Supabase CLI
        $BackupFileDump = "$BackupFile.sql"
        npx supabase db dump --project-ref $ProjectRef -f $BackupFileDump 2>&1 | Out-Null
        
        if (Test-Path $BackupFileDump) {
            $BackupSize = (Get-Item $BackupFileDump).Length / 1MB
            Write-Success "✓ Backup created successfully"
            Write-Info "  File: $BackupFileDump"
            Write-Info "  Size: $([math]::Round($BackupSize, 2)) MB"
        } else {
            throw "Backup file not created"
        }
    } catch {
        Write-Error "✗ Supabase CLI backup failed: $_"
        Write-Info "Falling back to pg_dump..."
        $UseSupabaseCLI = $false
    }
}

if (-not $UseSupabaseCLI) {
    Write-Info "Using pg_dump for backup..."
    Write-Warning "⚠ Manual backup requires database credentials"
    Write-Info @"
    
To create a backup manually, run:

pg_dump -h db.$ProjectRef.supabase.co \
        -U postgres \
        -d postgres \
        -F c \
        -f $BackupFile.dump

Or use the Supabase dashboard:
1. Go to https://app.supabase.com/project/$ProjectRef/settings/database
2. Click "Backup" tab
3. Create a manual backup

"@
}

# Create metadata file
Write-Info "`n[6/7] Creating backup metadata..."

$Metadata = @{
    timestamp = $Timestamp
    environment = $Environment
    project_ref = $ProjectRef
    migration = "032_consolidate_coins"
    purpose = "Pre-migration backup for coin system consolidation"
    backup_file = if ($UseSupabaseCLI) { "$BackupFile.sql" } else { "$BackupFile.dump" }
    created_by = $env:USERNAME
    machine = $env:COMPUTERNAME
    supabase_url = $SupabaseUrl
}

$MetadataFile = "$BackupFile.metadata.json"
$Metadata | ConvertTo-Json -Depth 10 | Out-File -FilePath $MetadataFile -Encoding UTF8

Write-Success "✓ Metadata file created: $MetadataFile"

# Verify backup (if requested)
if ($Verify -and $UseSupabaseCLI) {
    Write-Info "`n[7/7] Verifying backup..."
    
    $BackupFileDump = "$BackupFile.sql"
    if (Test-Path $BackupFileDump) {
        # Check if file is readable and contains expected content
        $Content = Get-Content $BackupFileDump -TotalCount 50
        
        if ($Content -match "PostgreSQL database dump") {
            Write-Success "✓ Backup file is valid PostgreSQL dump"
        } else {
            Write-Warning "⚠ Backup file format could not be verified"
        }
        
        # Check for key tables
        $TablesFound = @()
        if ($Content -match "green_coin_wallets") { $TablesFound += "green_coin_wallets" }
        if ($Content -match "green_coin_transactions") { $TablesFound += "green_coin_transactions" }
        if ($Content -match "user_gamification") { $TablesFound += "user_gamification" }
        
        if ($TablesFound.Count -gt 0) {
            Write-Success "✓ Found expected tables: $($TablesFound -join ', ')"
        } else {
            Write-Warning "⚠ Could not verify table presence in backup"
        }
    } else {
        Write-Error "✗ Backup file not found for verification"
    }
} elseif ($Verify) {
    Write-Info "`n[7/7] Skipping verification (manual backup)"
    Write-Info "To verify backup manually, run:"
    Write-Info "  pg_restore --list $BackupFile.dump | head -20"
}

# Summary
Write-Host @"

========================================
  BACKUP SUMMARY
========================================
"@ -ForegroundColor Green

Write-Success "✓ Backup process completed"
Write-Info "Environment: $Environment"
Write-Info "Timestamp: $Timestamp"
Write-Info "Backup directory: $BackupDir"

if ($UseSupabaseCLI) {
    Write-Info "Backup file: $BackupFile.sql"
} else {
    Write-Info "Backup file: $BackupFile.dump (manual creation required)"
}

Write-Info "Metadata file: $MetadataFile"
Write-Info "Validation file: $ValidationFile"

Write-Host @"

========================================
  NEXT STEPS
========================================
"@ -ForegroundColor Cyan

Write-Info "1. Verify backup integrity:"
if ($UseSupabaseCLI) {
    Write-Info "   - Check backup file size and content"
    Write-Info "   - Run validation queries from: $ValidationFile"
} else {
    Write-Info "   - Create backup using pg_dump or Supabase dashboard"
    Write-Info "   - Verify with: pg_restore --list <backup-file>"
}

Write-Info "`n2. Test migration on staging:"
Write-Info "   - Deploy migration: npx supabase db push"
Write-Info "   - Verify results: Run validation queries"
Write-Info "   - Test application functionality"

Write-Info "`n3. Test rollback on staging:"
Write-Info "   - Execute: psql -f supabase/migrations/rollback_032.sql"
Write-Info "   - Verify data restored correctly"

Write-Info "`n4. Document results:"
Write-Info "   - Record any issues encountered"
Write-Info "   - Update deployment plan if needed"
Write-Info "   - Prepare for production deployment"

Write-Host @"

========================================
  IMPORTANT REMINDERS
========================================
"@ -ForegroundColor Yellow

Write-Warning "⚠ This is a STAGING backup"
Write-Warning "⚠ Production backup will be separate"
Write-Warning "⚠ Keep this backup until migration is verified"
Write-Warning "⚠ Test rollback procedure before production"

Write-Host "`n========================================`n" -ForegroundColor Cyan

# Exit with success
exit 0
