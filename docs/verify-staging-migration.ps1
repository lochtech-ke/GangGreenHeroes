# ============================================================================
# Migration 032 Staging Verification Script (PowerShell)
# ============================================================================
# Purpose: Run comprehensive verification of coin system consolidation
# Requirements: B6.3 - Validate migration success
# Date: 2025-01-30
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "staging",
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [switch]$SaveOutput
)

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

# Main script
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "MIGRATION 032 STAGING VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Info "Checking prerequisites..."
$supabaseInstalled = Get-Command npx -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Error-Custom "ERROR: npx not found. Please install Node.js and npm."
    exit 1
}

Write-Success "✓ Prerequisites check passed"
Write-Host ""

# Get Supabase project info
Write-Info "Getting Supabase project information..."
try {
    $projectInfo = npx supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "⚠ Could not get project list. Make sure you're logged in:"
        Write-Host "  npx supabase login"
        Write-Host ""
    }
} catch {
    Write-Warning-Custom "⚠ Could not get project information"
}

# Determine connection method
Write-Host ""
Write-Info "Select verification method:"
Write-Host "  1. Use Supabase CLI (recommended)"
Write-Host "  2. Use direct psql connection"
Write-Host "  3. Exit"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Info "Running verification using Supabase CLI..."
        Write-Host ""
        
        # Check if linked to a project
        $linkedProject = npx supabase status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning-Custom "⚠ Not linked to a Supabase project"
            Write-Host ""
            Write-Host "To link to your staging project:"
            Write-Host "  npx supabase link --project-ref <your-project-ref>"
            Write-Host ""
            exit 1
        }
        
        # Run verification script
        Write-Info "Executing verification script..."
        Write-Host ""
        
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $outputFile = "verification_results_$timestamp.txt"
        
        if ($SaveOutput) {
            Write-Info "Saving output to: $outputFile"
            npx supabase db execute -f supabase/migrations/verify_032_staging.sql | Tee-Object -FilePath $outputFile
        } else {
            npx supabase db execute -f supabase/migrations/verify_032_staging.sql
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Success "✓ Verification script executed successfully"
            if ($SaveOutput) {
                Write-Info "Results saved to: $outputFile"
            }
        } else {
            Write-Host ""
            Write-Error-Custom "✗ Verification script failed"
            exit 1
        }
    }
    
    "2" {
        Write-Info "Running verification using direct psql connection..."
        Write-Host ""
        
        # Check if psql is installed
        $psqlInstalled = Get-Command psql -ErrorAction SilentlyContinue
        if (-not $psqlInstalled) {
            Write-Error-Custom "ERROR: psql not found. Please install PostgreSQL client."
            exit 1
        }
        
        # Get connection details
        Write-Host "Enter Supabase connection details:"
        $host = Read-Host "Host (e.g., db.xxx.supabase.co)"
        $port = Read-Host "Port (default: 5432)"
        if ([string]::IsNullOrWhiteSpace($port)) { $port = "5432" }
        $database = Read-Host "Database (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($database)) { $database = "postgres" }
        $username = Read-Host "Username (default: postgres)"
        if ([string]::IsNullOrWhiteSpace($username)) { $username = "postgres" }
        
        Write-Host ""
        Write-Info "Connecting to: $host:$port/$database"
        Write-Host ""
        
        # Set environment variable for password prompt
        $env:PGPASSWORD = Read-Host "Password" -AsSecureString | ConvertFrom-SecureString
        
        # Run verification script
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $outputFile = "verification_results_$timestamp.txt"
        
        if ($SaveOutput) {
            Write-Info "Saving output to: $outputFile"
            psql -h $host -p $port -U $username -d $database -f supabase/migrations/verify_032_staging.sql | Tee-Object -FilePath $outputFile
        } else {
            psql -h $host -p $port -U $username -d $database -f supabase/migrations/verify_032_staging.sql
        }
        
        # Clear password from environment
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Success "✓ Verification script executed successfully"
            if ($SaveOutput) {
                Write-Info "Results saved to: $outputFile"
            }
        } else {
            Write-Host ""
            Write-Error-Custom "✗ Verification script failed"
            exit 1
        }
    }
    
    "3" {
        Write-Info "Exiting..."
        exit 0
    }
    
    default {
        Write-Error-Custom "Invalid choice. Exiting..."
        exit 1
    }
}

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# Provide next steps
Write-Info "Next Steps:"
Write-Host "  1. Review the verification results above"
Write-Host "  2. Check for any FAIL or WARNING status"
Write-Host "  3. If all critical checks pass:"
Write-Host "     - Test application functionality"
Write-Host "     - Verify balance queries work"
Write-Host "     - Test transaction recording"
Write-Host "  4. If any checks fail:"
Write-Host "     - Review the migration logs"
Write-Host "     - Check the troubleshooting guide"
Write-Host "     - Consider rollback if necessary"
Write-Host ""
Write-Info "Documentation:"
Write-Host "  - Migration Guide: supabase/migrations/MIGRATION_032_GUIDE.md"
Write-Host "  - Requirements: .kiro/specs/coin-harmonization/requirements.md"
Write-Host "  - Design: .kiro/specs/coin-harmonization/design.md"
Write-Host ""

# Ask if user wants to run application tests
Write-Host ""
$runAppTests = Read-Host "Would you like guidance on testing the application? (y/n)"
if ($runAppTests -eq "y" -or $runAppTests -eq "Y") {
    Write-Host ""
    Write-Info "Application Testing Checklist:"
    Write-Host ""
    Write-Host "1. Test Balance Queries:"
    Write-Host "   - Open the application"
    Write-Host "   - Navigate to user profile/wallet"
    Write-Host "   - Verify GG Coin balance displays correctly"
    Write-Host "   - Check that decimals show when non-zero"
    Write-Host ""
    Write-Host "2. Test Transaction Recording:"
    Write-Host "   - Perform an action that earns coins (e.g., plant a tree)"
    Write-Host "   - Verify coins are credited"
    Write-Host "   - Check transaction appears in history"
    Write-Host ""
    Write-Host "3. Test Transaction History:"
    Write-Host "   - View transaction history"
    Write-Host "   - Verify migrated transactions appear"
    Write-Host "   - Check pagination works"
    Write-Host "   - Verify amounts display correctly"
    Write-Host ""
    Write-Host "4. Test Real-time Updates:"
    Write-Host "   - Open wallet in one tab"
    Write-Host "   - Earn coins in another tab"
    Write-Host "   - Verify balance updates in first tab"
    Write-Host ""
    Write-Host "5. Check for Errors:"
    Write-Host "   - Monitor browser console for errors"
    Write-Host "   - Check application logs"
    Write-Host "   - Verify no 'Green Coin' references in UI"
    Write-Host ""
}

Write-Host ""
Write-Success "Verification script completed!"
Write-Host ""
